"""Authoring-time link checker for the AUA AI Hub.

Checks every URL-valued field named in URL_FIELDS, across the owner-owned data
files listed in collect(), plus any markdown files passed as arguments. Run
before committing changes to those files so no dead link is ever committed
(SPEC section 11, Phase 1 acceptance criteria).

The file list and the field list both live in collect() rather than here,
because an enumeration in a docstring goes stale silently: this one named
three data files while collect() read nine, and claimed every URL in
data/prompt_resources.yaml was covered while five of its twenty were not
(corrected 2026-09-05).

Not run in CI on purpose: a link that dies after commit should surface through
review, not block site deploys.

Usage:
    python scripts/verify_links.py [docs/learning/index.md ...]
    python scripts/verify_links.py --all-docs   # every hand-authored page

--all-docs scans every markdown page under docs/ except the generated
docs/news/ tree, plus both data files. The monthly link-health workflow
runs this mode and opens an issue when links fail.

Exit code is nonzero if any link fails.
"""

import re
import ssl
import sys
import time
import urllib.parse
from pathlib import Path

import requests
import yaml

REPO = Path(__file__).resolve().parent.parent
HEADERS = {
    # Some sites refuse requests without a browser-like user agent.
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    )
}
TIMEOUT = 15

# Domains that block scripted requests (HTTP 400, 403, 429, or a TLS
# handshake that strict clients reject) but were confirmed live by hand.
# Re-verify in a browser when touching an entry that uses one.
MANUALLY_VERIFIED = {
    "gamma.app": "2026-06-09",
    # Began 403ing scripted clients in July 2026 (conference watch and
    # link check, 2026-07-17 to 07-21); owner confirmed live in a
    # browser 2026-07-21, page still showing SAIL 2026, May 5-8,
    # Rio Grande, matching the calendar entry.
    "sail.health": "2026-07-21",
    # 403s scripted clients; project confirmed alive via its GitHub
    # repository (tool survey 2026-07-15); owner-approved allowlist
    # 2026-07-21.
    "openwebui.com": "2026-07-21",
    # 403s all scripted clients; confirmed live in a browser.
    "nabututor.com": "2026-07-14",
    # 403s all scripted clients; confirmed live in a browser.
    "osmosis.org": "2026-07-15",
    "llama.com": "2026-06-10",
    # Cloudflare-blocks scripted clients; confirmed live in a browser.
    "midjourney.com": "2026-06-12",
    # claude.com/design redirects logged-out visitors to a login URL that
    # returns 403 to scripts; product confirmed live 2026-06-12.
    "claude.com": "2026-06-12",
    # Began rejecting the checker's plain user agent between June and July
    # 2026; serves 200 with full content to browser headers (verified
    # 2026-07-01).
    "openevidence.com": "2026-07-01",
    # 403s from GitHub Actions runner IPs only (issue #9, 2026-07-05);
    # serves 200 with full content to any user agent from residential
    # IPs (verified 2026-07-09), so the block is datacenter-IP based
    # and will recur on the runner. Key fixed 2026-08-05 (issue #36):
    # the matcher strips the www prefix, so the original
    # "www.deeplearning.ai" key never matched and the entry silently
    # did nothing.
    "deeplearning.ai": "2026-07-09",
    # 403s all scripted clients everywhere, browser user agent included
    # (probed 2026-08-05); owner confirmed live in a browser 2026-08-01.
    # verify: skip in tools.yaml for the same reason.
    "studyfetch.com": "2026-08-05",
    # Began 403ing all scripted clients in late July 2026 (conference
    # watch issues #29 and #30, link check issue #36); conference dates
    # owner-verified from the page in July, and the calendar entry
    # carries watch_skip.
    "events.educause.edu": "2026-08-05",
    # Failed from the Actions runner 2026-08-05 (issue #36) but serves
    # 200 to the checker's own user agent from residential IPs (probed
    # the same day), the deeplearning.ai pattern.
    "icmje.org": "2026-08-05",
    # ahli.cc was allowlisted 2026-07-06 when its /ml4h/ subpath began
    # 403ing scripted clients; removed 2026-07-09 when the listing moved
    # to the dedicated ml4h.ahli.cc site, which serves scripts normally
    # (matching is exact-host, so this entry never covered subdomains).
}
# The host matcher strips a leading www, so allowlist keys must be
# stored without it; a www-prefixed key can never match (the
# deeplearning.ai bug, issue #36).
assert not any(k.startswith("www.") for k in MANUALLY_VERIFIED), \
    "MANUALLY_VERIFIED keys must not start with 'www.'"
BOT_BLOCK_STATUSES = {400, 403, 429}

MD_LINK_OPEN = re.compile(r"\[[^\]]*\]\(\s*(https?://\S*)")
# Counts the same link openings a different way, so a destination the walker
# below cannot parse becomes a loud error rather than a link that quietly
# stops being checked.
MD_LINK_COUNT = re.compile(r"\]\(\s*https?://")


def link_destinations(text: str) -> list[str]:
    """Every markdown link destination in `text`, parenthesis-aware.

    Python-Markdown allows balanced parentheses inside a link destination, so
    ending one at the first ")" checks a URL the page never links. That is how
    issue #46 came to report HTTP 403 for ".../S0960-9822(26", a string that
    appears nowhere in the built site, while the real citation beside it went
    unfetched. Walking with a depth counter tracks what the renderer does.

    Do not replace this with a regex that balances one level of parentheses.
    That looks equivalent and is worse: on a nested destination it matches
    nothing at all, trading a wrongly-checked link for a silently skipped one.
    """
    out = []
    for match in MD_LINK_OPEN.finditer(text):
        raw, depth, end = match.group(1), 0, 0
        for i, char in enumerate(raw):
            if char == "(":
                depth += 1
            elif char == ")":
                if depth == 0:
                    break  # this ")" closes the markdown link, not the URL
                depth -= 1
            end = i + 1
        out.append(raw[:end])
    return out


# Controls for the walker, checked at import the way compile_block_terms
# checks BLOCK_CONTROLS in aggregate.py. Each expectation is what
# python-markdown actually renders, not what looks right. A mis-extracted
# destination is worse than no check at all: the checker then reports a
# verdict about a URL the site does not link, and the standard remedy for
# that verdict (a MANUALLY_VERIFIED entry) would green-light the phantom
# permanently while the real link stayed untested.
LINK_CONTROLS = [
    ("[a](https://ex.com/p)", ["https://ex.com/p"]),
    # The citation behind issue #46, and the shape it belongs to: Elsevier
    # PII, Wiley SICI DOIs and Wikipedia disambiguation titles all carry
    # parentheses, so a site that cites journals meets this constantly.
    (("[Kanis et al., 2026](https://www.cell.com/current-biology/fulltext/"
      "S0960-9822(26)00890-0)"),
     ["https://www.cell.com/current-biology/fulltext/S0960-9822(26)00890-0"]),
    ("[t](https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture))",
     ["https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)"]),
    ("[a](https://ex.com/a(b(c)d)e)", ["https://ex.com/a(b(c)d)e"]),
    ("(see [a](https://ex.com/p))", ["https://ex.com/p"]),
    ("![alt](https://ex.com/i(1).png)", ["https://ex.com/i(1).png"]),
    ("[a](https://ex.com/p%28x%29)", ["https://ex.com/p%28x%29"]),
    ("[a](https://ex.com/x) and [b](https://ex.com/y)",
     ["https://ex.com/x", "https://ex.com/y"]),
    ("[**bold**](https://ex.com/p)", ["https://ex.com/p"]),
    ('[t](https://ex.com/p "A title")', ["https://ex.com/p"]),
]
for _md, _want in LINK_CONTROLS:
    _got = link_destinations(_md)
    assert _got == _want, (
        f"link extractor returned {_got} for {_md!r}, expected {_want}. A "
        f"mis-extracted destination makes this checker report on a URL the "
        f"site does not link (issue #46), so fix the walker before trusting "
        f"any run.")


# Entry fields whose values are URLs that reach a reader. "url" is the entry's
# own link. "thumbnail" is an og:image that render_data._video_card hotlinks
# into a card, so a rotted one is a broken image on the Courses and Resources
# and Learning to Prompt pages; twelve of them went unchecked until 2026-09-05
# because this loop only ever read "url".
#
# tools.yaml's verify_url is deliberately NOT here. content_watch.py and
# page_review.py already fetch it weekly, so adding it would duplicate their
# traffic against the same hosts without covering anything new.
#
# The value is the Content-Type prefix the field's URL must answer with, or
# None when anything is acceptable. A thumbnail is hotlinked into an <img>, so
# a 200 carrying HTML is a host serving an error or consent page in the
# image's place: the page shows a broken image while a status-only check
# reports the link alive. All 12 thumbnails answered image/* when this was
# added, so the assertion starts with no false positives.
URL_FIELDS = {"url": None, "thumbnail": "image/"}


def collect() -> list[tuple[str, str, str | None]]:
    """Return (source, url, expected Content-Type prefix or None) triples."""
    pairs = []
    for yaml_rel in (
        "data/tools.yaml",
        "data/conferences.yaml",
        "data/prompt_resources.yaml",
        "data/open_models.yaml",
        "data/guide_videos.yaml",
        "data/learning_resources.yaml",
        "data/committee_work.yaml",
        "data/opportunities.yaml",
        "data/skills.yaml",
    ):
        path = REPO / yaml_rel
        if not path.exists():
            continue
        entries = yaml.safe_load(path.read_text(encoding="utf-8")) or []
        for entry in entries:
            label = entry.get("name") or entry.get("title", "?")
            for field, expect in URL_FIELDS.items():
                url = entry.get(field, "")
                if url and url != "TBD":
                    suffix = "" if field == "url" else f" [{field}]"
                    pairs.append((f"{yaml_rel}:{label}{suffix}", url, expect))
    md_paths = []
    if "--all-docs" in sys.argv[1:]:
        # Skip generated trees and the Exchange mirror: news rotates nightly
        # and the Exchange body is community content whose links the owner
        # does not maintain.
        md_paths = [
            p for p in (REPO / "docs").rglob("*.md")
            if "news" not in p.relative_to(REPO / "docs").parts
            and p.name != "exchange.md"
        ]
    else:
        md_paths = [REPO / md_rel for md_rel in sys.argv[1:]]
    for path in md_paths:
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(REPO).as_posix()
        urls = link_destinations(text)
        opens = len(MD_LINK_COUNT.findall(text))
        assert len(urls) == opens, (
            f"{rel}: {opens} markdown link openings but {len(urls)} "
            f"destinations extracted. A destination the walker cannot parse "
            f"would otherwise stop being checked with nothing saying so.")
        for url in urls:
            # A markdown link can point at anything, so no content-type
            # expectation: only the data files declare what a field must be.
            pairs.append((rel, url, None))
    # de-duplicate identical (source, url) pairs from repeated links
    return list(dict.fromkeys(pairs))


# OpenSSL verification codes. 20 is "unable to get local issuer certificate":
# the server did not send an intermediate, so a strict client cannot build the
# chain while a browser, which caches and fetches intermediates, usually can.
# That gap is what the allowlist's TLS branch was built for (added 2026-06-11
# for stepgenie.app; SPEC, media-rich resource cards section).
#
# Every other verification code is browser-fatal. An expired, self-signed,
# untrusted-root or wrong-host certificate stops a human visitor with a
# full-page warning, so answering ok would hide from this checker the one TLS
# failure a reader cannot click past. Narrowed to code 20 on 2026-09-05, owner
# approved, after all four fatal modes were confirmed to report ok: a bot block
# is invisible to browsers and a bad certificate is browser-fatal, so they
# should not share a verdict.
TLS_BROWSER_TOLERANT = {20}


def _cert_error(exc, depth: int = 0) -> ssl.SSLCertVerificationError | None:
    """The ssl.SSLCertVerificationError inside a requests SSLError, if any.

    requests buries it three deep: SSLError -> MaxRetryError.reason ->
    urllib3.SSLError -> ssl.SSLCertVerificationError. Returns None for a TLS
    failure that is not a certificate verification failure at all, such as a
    protocol or handshake mismatch, which keeps its old allowlist behaviour.
    """
    if exc is None or depth > 6:
        return None
    if isinstance(exc, ssl.SSLCertVerificationError):
        return exc
    for nxt in (getattr(exc, "reason", None),
                exc.args[0] if getattr(exc, "args", None) else None):
        found = _cert_error(nxt, depth + 1)
        if found is not None:
            return found
    return None


def check(url: str, retries: int = 2,
          expect_type: str | None = None) -> tuple[bool, str]:
    # YouTube rate-limits watch pages (HTTP 429) when several are fetched in
    # a row. The oEmbed endpoint answers cheaply: 200 for a live public
    # video, 400/404 for a dead one. Check videos through it instead.
    if re.match(r"https?://(?:www\.)?youtube\.com/watch\?v=[\w-]+", url):
        url = (
            "https://www.youtube.com/oembed?url="
            + urllib.parse.quote(url, safe="")
            + "&format=json"
        )
    # Transient ConnectionError/ReadTimeout under rapid sequential requests
    # is common; retry before reporting a link dead so the monthly
    # link-health issue only carries real failures.
    last_exc = "RequestException"
    for attempt in range(retries + 1):
        try:
            resp = requests.get(
                url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True
            )
            break
        except requests.exceptions.SSLError as exc:
            host = re.sub(r"^https?://(www\.)?", "", url).split("/")[0]
            cert_exc = _cert_error(exc)
            if (cert_exc is not None
                    and cert_exc.verify_code not in TLS_BROWSER_TOLERANT):
                # A browser rejects this certificate too, so the allowlist
                # must not cover it and a retry cannot help. Report and stop.
                return False, f"TLS {cert_exc.verify_message}"
            if host in MANUALLY_VERIFIED:
                return True, f"manual ({MANUALLY_VERIFIED[host]}, TLS strict-fail)"
            last_exc = "SSLError"
            if attempt < retries:
                time.sleep(3)
        except requests.RequestException as exc:
            last_exc = type(exc).__name__
            if attempt < retries:
                time.sleep(3)
    else:
        return False, last_exc
    if resp.status_code in BOT_BLOCK_STATUSES:
        host = re.sub(r"^https?://(www\.)?", "", url).split("/")[0]
        if host in MANUALLY_VERIFIED:
            return True, f"manual ({MANUALLY_VERIFIED[host]})"
        # A 403 or 429 reached through a doi.org link, where redirects
        # landed on a publisher host, means the DOI resolved (doi.org
        # returns 404 for unknown DOIs) and only the publisher blocks
        # scripted clients, so the link works in a browser. The final
        # host is checked so a rate limit from doi.org itself is not
        # mistaken for a resolution (429 case added 2026-08-05, issue
        # #36: BMJ answers scripts with a persistent 429).
        if host == "doi.org" and resp.status_code in (403, 429):
            final_host = urllib.parse.urlparse(resp.url).netloc
            if final_host and final_host != "doi.org":
                return True, f"doi resolved ({final_host} blocks scripts)"
        # github.com/signup bot-challenges every non-browser client
        # (403 to scripted fetches with any user agent, probed
        # 2026-08-05, issue #36); the page is GitHub's own signup and
        # is not going anywhere. Scoped to the signup path so real
        # github.com links stay checked.
        if (host == "github.com" and resp.status_code == 403
                and "/signup" in url):
            return True, "github signup bot-challenges scripts"
    ok = resp.status_code < 400
    if ok and expect_type:
        # A field that declares its content type gets that checked too. An
        # image URL answering 200 with text/html is a host serving an error
        # or consent page where the picture used to be, which renders as a
        # broken image while status alone still reads as alive (2026-09-05).
        # This cannot catch a host that serves a placeholder IMAGE for a
        # missing one; media.springernature.com does exactly that.
        ctype = (resp.headers.get("Content-Type") or "").split(";")[0].strip()
        if not ctype.startswith(expect_type):
            return False, f"HTTP {resp.status_code}, {ctype or 'no type'} not {expect_type}"
    return ok, f"HTTP {resp.status_code}"


def main() -> int:
    pairs = collect()
    failures = []
    for source, url, expect_type in pairs:
        time.sleep(0.5)  # pacing; rapid-fire requests trip connection drops
        ok, detail = check(url, expect_type=expect_type)
        marker = "ok  " if ok else "FAIL"
        print(f"{marker} {detail:<22} {url}  ({source})")
        if not ok:
            failures.append((source, url, detail))

    print("\n=== verification ===")
    print(f"links checked : {len(pairs)}")
    print(f"passed        : {len(pairs) - len(failures)}")
    print(f"failed        : {len(failures)}")
    for source, url, detail in failures:
        print(f"  FAIL {url} ({source}): {detail}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
