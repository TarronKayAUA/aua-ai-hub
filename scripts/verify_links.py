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
# Server-side failures worth a retry, because they say the host is having a
# bad moment rather than that the link is wrong. 501 and 505 are deliberately
# absent: those are settled answers, not hiccups, and retrying them only
# slows the sweep down. 429 is absent too, since it is already handled as a
# bot block below and a three second wait does not clear a rate limit.
RETRY_STATUSES = {500, 502, 503, 504}

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


# Hosts that answer HTTP 200 for a path that cannot exist ("soft 404"), so
# `status < 400` is not evidence a link is alive. On these shapes a dead link
# is unreportable and the monthly run stays green forever.
#
# This is a REGISTRY, not a detector: a dated list of specific (host, path
# prefix) shapes someone surveyed by hand, in the same spirit as
# MANUALLY_VERIFIED above and the doi.org and github.com/signup cases in
# check() below. Nothing here generalises, and that is the point. A general
# soft-404 heuristic (body length, title wording, redirected-away) was
# measured against every host this repository links on 2026-09-05 and would
# have reported live links as dead every month: see the "surveyed and
# deliberately excluded" note under the table.
#
# Each entry carries a discriminator drawn from the response check() has
# ALREADY fetched, so an entry costs no extra request during the sweep and
# turns a false green into a true red only when the link is genuinely gone.
# An entry with no such discriminator does not belong here at all; there is
# nothing to report but "cannot tell", and a verdict that repeats monthly on
# links that are almost certainly fine is how issues #31 and #45 taught
# everyone to ignore a report.
#
#   host    exact host, www stripped, matched the way MANUALLY_VERIFIED is
#   prefix  path prefix the shape starts with; the shape dependency is real,
#           forms.office.com/<junk> hard-404s while forms.office.com/r/<junk>
#           soft-404s, so a host-wide entry would be wrong
#   dead    (final url after redirects, page title) -> True when the host is
#           telling us, at 200, that the page is not there
#   canary  a URL of this shape that must NEVER exist, fetched once per sweep
#           to prove `dead` still fires (see _canary_failures)
#   verdict short reason printed in the detail column
SOFT_404_SHAPES = [
    {
        # The site's feedback form is linked from 13 hand-authored pages
        # (about, accessibility, faculty, students, opportunities, the
        # rollout announcement, both governance pages, learning, pathway,
        # both playbooks pages, worked-examples). Retire or re-issue that
        # form and all 13 break with the checker still reporting HTTP 200.
        # Surveyed 2026-09-05: a fabricated same-length code, and a
        # one-character change of the real code, both returned 200 with a
        # byte-identical 1418-byte body after redirecting to the fixed
        # sentinel /PageNotFound.aspx. A live form leaves the host entirely
        # for forms.cloud.microsoft/pages/responsepage.aspx.
        #
        # TWO KNOWN LIMITS, both unprobed as of 2026-09-05, stated here
        # rather than left for someone to discover from a green report.
        # (a) This covers the form being DELETED or re-issued under a new
        #     code. A form CLOSED to responses, which is Microsoft's
        #     one-click retire and the likelier path for a form the owner no
        #     longer wants, probably still resolves to responsepage.aspx and
        #     would read alive. Settle it by closing a throwaway form and
        #     fetching its link once, then add a second clause here.
        # (b) The long-form URL the same Copy link menu offers,
        #     forms.office.com/Pages/ResponsePage.aspx?id=..., is neither
        #     surveyed nor matched. It does not appear in this repository.
        "host": "forms.office.com",
        "prefix": "/r/",
        "dead": lambda final, title: urllib.parse.urlparse(
            final).path.lower().endswith("/pagenotfound.aspx"),
        # TRAP, and the reason this canary REPLACES the code rather than
        # extending it: forms.office.com/r/5a8RCi2YKP-zq7v3x-does-not-exist
        # still resolves to the REAL form and returns the live page, so a
        # canary built by appending a suffix would silently always pass.
        # SOFT_404_CONTROLS below pins that case so nobody re-derives it.
        "canary": "https://forms.office.com/r/Zq7V3xKp2M",
        "verdict": "soft 404, form gone",
    },
    {
        # Three leaderboard URLs on docs/benchmarks/image.md and
        # docs/benchmarks/video.md. Leaderboards get renamed, and the host
        # states the failure in words while answering 200: a fabricated slug
        # returned the title "Leaderboard Not Found" in place, no redirect
        # (surveyed 2026-09-05). Body size halves too, but size is not used:
        # a 9 percent difference is inside normal page-to-page variation on
        # other hosts in the same survey, so only the wording is trusted.
        "host": "arena.ai",
        "prefix": "/leaderboard/",
        "dead": lambda final, title: title.strip().lower(
        ) == "leaderboard not found",
        "canary": "https://arena.ai/leaderboard/zq7v3x-does-not-exist",
        "verdict": "soft 404, no board",
    },
]
# SURVEYED AND DELIBERATELY EXCLUDED (2026-09-05). Recorded here because the
# expensive part of this work was learning which hosts must be left alone,
# and an empty absence looks like an oversight to the next reader.
#
# aamc.org, students-residents.aamc.org (10 URLs). Fabricated paths return
#   200, but the body is a 3038-byte Akamai "Client Challenge", not a
#   not-found page, and the identical body came back for 2 of 7 fetches of
#   LIVE AAMC pages in the same survey. Any detector keyed on that title,
#   size or hash would have reported roughly a quarter of live AAMC links as
#   dead every month. That is issues #31 and #45 rebuilt exactly, on links
#   belonging to an institution the owner works with. Do nothing here.
# hbsp.harvard.edu (1 URL). The host serves one byte-identical JavaScript
#   shell for every path, live or dead. No HTTP client can tell them apart.
# claude.com (3 one-segment URLs). A fabricated one-segment path leaves the
#   host for claude.ai, which would discriminate, but this vendor
#   restructures often: the MANUALLY_VERIFIED note above records
#   claude.com/design behaving differently in June 2026 than it did in this
#   survey. A redirect off the host is as likely to mean "moved" as "gone".
# one.google.com, sites.usc.edu, udio.com (1 URL each). The dead signal is a
#   redirect to a sign-in page, and an auth wall sits in front of live URLs
#   just as readily as missing ones.
# grow.google, idc.com (1 URL each). Redirect-to-index or redirect-to-root.
#   Real, but one URL each; not worth an entry that must be re-surveyed.
# pmc.ncbi.nlm.nih.gov (5 URLs). Looked soft, was not: a plausibly-shaped
#   nonexistent id returns a clean 404. Its intermittent reCAPTCHA
#   interstitial at 200 is a separate false-green worth knowing about, but it
#   is a bot challenge and has the same live-URL problem as AAMC.
# 23 further soft-404 URLs sit on bare domain roots (chatgpt.com,
#   lmstudio.ai, suno.com and the like) where there is no id that can rot, so
#   the soft 404 changes nothing.

TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)


def _soft_404_entry(url: str) -> dict | None:
    """The SOFT_404_SHAPES entry covering `url`, if any."""
    parts = urllib.parse.urlparse(url)
    host = re.sub(r"^www\.", "", parts.netloc).lower()
    # Path is case-folded because Microsoft's "Copy link" hands out /r/ and
    # the shortlink works in either case; a case-sensitive match protected
    # exactly one spelling of the one URL this entry exists for.
    path = parts.path.lower()
    for entry in SOFT_404_SHAPES:
        if host == entry["host"] and path.startswith(entry["prefix"]):
            return entry
    return None


def _page_title(resp) -> str:
    """The <title> of a response, or "" when it has none.

    Bounded to the first 100 KB because these are 500 KB to 1 MB app shells
    and the title is in the head; an unbounded search buys nothing.
    """
    try:
        match = TITLE_RE.search(resp.text[:100_000])
    except (UnicodeDecodeError, ValueError):
        return ""
    return re.sub(r"\s+", " ", match.group(1)) if match else ""


# Controls for the registry, asserted at import the way LINK_CONTROLS above
# is. Every fixture is a real response recorded during the 2026-09-05 survey,
# so an edit to a `dead` predicate that stops separating a live page from a
# dead one fails the import instead of quietly restoring the false green.
# (url, final url after redirects, page title, is this dead?)
SOFT_404_CONTROLS = [
    ("https://forms.office.com/r/Zq7V3xKp2M",
     "https://forms.office.com/PageNotFound.aspx", "Page not found", True),
    # Microsoft's "Copy link" hands out /r/, but the shortlink resolves in
    # either case, so the matcher is case-folded and this pins that.
    ("https://forms.office.com/R/Zq7V3xKp2M",
     "https://forms.office.com/PageNotFound.aspx", "Page not found", True),
    ("https://forms.office.com/r/5a8RCi2YKP",
     ("https://forms.cloud.microsoft/pages/responsepage.aspx"
      "?id=xxx&route=shorturl"), "Microsoft Forms", False),
    # The trap: a suffix on the real code still resolves to the real form.
    ("https://forms.office.com/r/5a8RCi2YKP-zq7v3x-does-not-exist",
     ("https://forms.cloud.microsoft/pages/responsepage.aspx"
      "?id=xxx&route=shorturl"), "Microsoft Forms", False),
    ("https://arena.ai/leaderboard/text-to-image-zq7v3x-does-not-exist",
     "https://arena.ai/leaderboard/text-to-image-zq7v3x-does-not-exist",
     "Leaderboard Not Found", True),
    ("https://arena.ai/leaderboard/text-to-image",
     "https://arena.ai/leaderboard/text-to-image",
     "Text-to-Image Leaderboard - Best AI Image Generators", False),
]
for _url, _final, _title, _want_dead in SOFT_404_CONTROLS:
    _entry = _soft_404_entry(_url)
    assert _entry is not None, f"no soft-404 entry matches {_url}"
    assert _entry["dead"](_final, _title) is _want_dead, (
        f"soft-404 entry {_entry['host']}{_entry['prefix']} returned "
        f"{not _want_dead} for {_url}. Fix the predicate before trusting a "
        f"run: reading dead as alive restores a false green, and reading "
        f"alive as dead reports a working link every month.")
# The shape dependency, pinned: only /r/ soft-404s on forms.office.com, and
# the excluded hosts above must stay unmatched however the table is edited.
for _url in ("https://forms.office.com/zq7v3x-does-not-exist",
             "https://www.aamc.org/learn-network/learn-serve-lead",
             "https://claude.com/design",
             "https://arena.ai/blog/factuality-in-arena"):
    assert _soft_404_entry(_url) is None, \
        f"{_url} must not match a soft-404 entry; see the exclusions above"


def check(url: str, retries: int = 2,
          expect_type: str | None = None) -> tuple[bool, str]:
    # Kept because `url` is rewritten below: the soft-404 registry must be
    # matched against the URL the page actually links, not against an
    # endpoint this function substituted for it.
    requested = url
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
    retried_5xx = False
    for attempt in range(retries + 1):
        try:
            resp = requests.get(
                url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True
            )
            # A 5xx is the server failing, not the link being wrong, and it is
            # usually a hiccup: openwebui.com answered 502 once during the
            # 2026-09-05 sweep and 200 on four straight fetches a minute
            # later. Left unretried that files a monthly issue about a site
            # that is fine, which is the false alarm issues #31 and #45 were
            # closed to remove. Retry on the same schedule as a connection
            # error, and if it survives that, report it as the real failure
            # it then is.
            if resp.status_code in RETRY_STATUSES and attempt < retries:
                retried_5xx = True
                time.sleep(3)
                continue
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
    if ok:
        # On a registered soft-404 shape a 200 proves nothing on its own, so
        # ask the entry's discriminator what this particular response means
        # (2026-09-05 survey; see SOFT_404_SHAPES). No extra request: the
        # answer is in the response already in hand.
        entry = _soft_404_entry(requested)
        if entry is not None and entry["dead"](resp.url, _page_title(resp)):
            return False, entry["verdict"]
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
    if retried_5xx and not ok:
        # Say it survived the retries, so the monthly issue distinguishes a
        # host that is genuinely down from one that blinked.
        return ok, f"HTTP {resp.status_code} after {retries} retries"
    return ok, f"HTTP {resp.status_code}"


def _canary_failures(pairs) -> tuple[list[tuple[str, str, str]], int]:
    """Prove every engaged registry entry can still tell dead from alive.

    A registry is only as good as the day it was written: if Microsoft
    renames /PageNotFound.aspx, the entry above stops firing and this file
    goes back to reporting HTTP 200 for a retired form with nothing saying
    so. That is the one real weakness of a hand-built table, so each entry
    names a URL of its shape that must never exist, and one sweep fetches it
    once. If the canary reads ALIVE, the discriminator is stale and a human
    must re-survey the host: that is a genuine failure, and unlike a
    heuristic it can only fire when the host itself changes.

    Only entries some collected link actually matched are probed, so a run
    over one page never sends a request to a host that page does not link.
    A canary that fails to load is NOT reported: an unreachable host makes
    every real link on it fail anyway, so the sweep is already loud.
    """
    engaged = [entry for entry in SOFT_404_SHAPES
               if any(_soft_404_entry(url) is entry for _, url, _ in pairs)]
    out = []
    for entry in engaged:
        time.sleep(0.5)  # same pacing as the sweep
        alive, detail = check(entry["canary"])
        if alive:
            out.append((
                "soft-404 registry",
                entry["canary"],
                (f"canary reads alive ({detail}): the {entry['host']}"
                 f"{entry['prefix']} soft-404 check no longer works, so"
                 f" dead links on that shape are reporting HTTP 200 again."
                 f" Re-survey the host, then fix or remove the entry.")))
    return out, len(engaged)


def main() -> int:
    pairs = collect()
    failures, canaries = _canary_failures(pairs)
    for source, url, expect_type in pairs:
        time.sleep(0.5)  # pacing; rapid-fire requests trip connection drops
        ok, detail = check(url, expect_type=expect_type)
        marker = "ok  " if ok else "FAIL"
        print(f"{marker} {detail:<22} {url}  ({source})")
        if not ok:
            failures.append((source, url, detail))

    # Canaries are counted apart from the links so "checked" and "passed"
    # keep meaning the site's own links, but they are added into "failed",
    # which is the line the monthly workflow reads and which means "a human
    # must act" (CLAUDE.md). A stale soft-404 entry needs a human.
    stale = sum(1 for source, _, _ in failures
                if source == "soft-404 registry")
    # Canaries are counted into the total as well as into "failed", so the
    # block sums: passed + failed == checks run. Counting them only on the
    # failure side printed "checked 296, passed 296, failed 1" whenever an
    # entry went stale, which breaks CLAUDE.md working rule 2 on the first
    # line the owner reads.
    #
    # "failed" stays the only line starting with that word: link-health.yml
    # greps '^failed' for the issue title's count, and a second such line
    # would make the shell variable multiline and break the title.
    checks = len(pairs) + canaries
    judged = sum(1 for _, url, _ in pairs if _soft_404_entry(url) is not None)
    print("\n=== verification ===")
    print(f"checks run    : {checks} ({len(pairs)} links, "
          f"{canaries} soft-404 canaries)")
    print(f"passed        : {checks - len(failures)}")
    print(f"failed        : {len(failures)}")
    if canaries:
        print(f"soft 404      : {canaries} shape"
              f"{'' if canaries == 1 else 's'} engaged, "
              f"{canaries - stale} still detecting, "
              f"{judged} link{'' if judged == 1 else 's'} judged through one")
    for source, url, detail in failures:
        print(f"  FAIL {url} ({source}): {detail}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
