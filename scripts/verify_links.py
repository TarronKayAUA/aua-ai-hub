"""Authoring-time link checker for the AUA AI Hub.

Checks every URL in data/tools.yaml, data/conferences.yaml,
data/prompt_resources.yaml, and any markdown files passed as arguments. Run before committing changes to those files so no
dead link is ever committed (SPEC section 11, Phase 1 acceptance criteria).

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
import sys
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

# Domains that block scripted requests (HTTP 403) but were confirmed live by
# hand. Re-verify in a browser when touching an entry that uses one.
MANUALLY_VERIFIED = {
    "gamma.app": "2026-06-09",
}

MD_LINK = re.compile(r"\[[^\]]*\]\((https?://[^)\s]+)\)")


def collect() -> list[tuple[str, str]]:
    """Return (source, url) pairs from the data files and any CLI-passed markdown."""
    pairs = []
    for yaml_rel in (
        "data/tools.yaml",
        "data/conferences.yaml",
        "data/prompt_resources.yaml",
    ):
        path = REPO / yaml_rel
        if not path.exists():
            continue
        entries = yaml.safe_load(path.read_text(encoding="utf-8")) or []
        for entry in entries:
            url = entry.get("url", "")
            if url and url != "TBD":
                label = entry.get("name") or entry.get("title", "?")
                pairs.append((f"{yaml_rel}:{label}", url))
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
        for url in MD_LINK.findall(text):
            pairs.append((path.relative_to(REPO).as_posix(), url))
    # de-duplicate identical (source, url) pairs from repeated links
    return list(dict.fromkeys(pairs))


def check(url: str) -> tuple[bool, str]:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        if resp.status_code == 403:
            host = re.sub(r"^https?://(www\.)?", "", url).split("/")[0]
            if host in MANUALLY_VERIFIED:
                return True, f"manual ({MANUALLY_VERIFIED[host]})"
            # A 403 reached through a doi.org link means the DOI resolved
            # (doi.org returns 404 for unknown DOIs) and only the publisher
            # site blocks scripted clients, so the link works in a browser.
            if host == "doi.org":
                return True, "doi resolved (publisher 403s scripts)"
        ok = resp.status_code < 400
        return ok, f"HTTP {resp.status_code}"
    except requests.RequestException as exc:
        return False, type(exc).__name__


def main() -> int:
    pairs = collect()
    failures = []
    for source, url in pairs:
        ok, detail = check(url)
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
