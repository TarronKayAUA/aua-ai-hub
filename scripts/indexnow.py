"""IndexNow: tell search engines which pages a deploy changed (2026-10-02).

    python scripts/indexnow.py site/sitemap.xml            the notice, as one GITHUB_OUTPUT line
    python scripts/indexnow.py site/sitemap.xml --dry-run  the same, and the URLs it would name
    python scripts/indexnow.py site/sitemap.xml --all      every page (a first notice, by hand)

IndexNow (https://www.indexnow.org/documentation) lets a site notify participating
search engines (Bing, Yandex, Seznam, Naver, Yep; a notice to api.indexnow.org is
shared with all of them) when pages are added, changed or removed, instead of waiting
for a crawl. Owner request, discoverability.

The build job runs this after `mkdocs build`, before the deploy replaces the live site:
it compares the new sitemap's <lastmod> dates (scripts/page_dates.py) with the live
sitemap's, and names every page that is new, redated or gone. It prints
`payload=<json>` for $GITHUB_OUTPUT (or `payload=` when nothing changed, or when the
live sitemap cannot be read, since a notice naming every page on every failure would be
noise); the deploy job POSTs that payload once the deploy has succeeded, so the engines
fetch the new pages. Counts go to stderr.

The key is the file docs/<key>.txt, whose name and content are the key (public by
design: it proves the notice comes from the site). It sits inside the project site, not
at the host root, so each notice names it as keyLocation, which lets it vouch for every
URL under /aua-ai-hub/ and nothing else. Never delete it.
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

import yaml

ROOT = Path(__file__).resolve().parent.parent
_ENTRY = re.compile(r"<loc>([^<]+)</loc>\s*(?:<lastmod>([^<]*)</lastmod>)?")


def _key() -> str:
    found = [p for p in (ROOT / "docs").glob("*.txt")
             if re.fullmatch(r"[0-9a-f]{32}", p.stem) and p.read_text(encoding="utf-8").strip() == p.stem]
    if len(found) != 1:
        raise SystemExit(f"indexnow: expected exactly one key file docs/<key>.txt, found {len(found)}")
    return found[0].stem


def _site_url() -> str:
    # mkdocs.yml has !!python/name tags, so read only the one line needed
    text = (ROOT / "mkdocs.yml").read_text(encoding="utf-8")
    m = re.search(r"^site_url:\s*(\S+)", text, re.M)
    if not m:
        raise SystemExit("indexnow: no site_url in mkdocs.yml")
    url = yaml.safe_load(m.group(1))
    return url if url.endswith("/") else url + "/"


def _entries(xml: str) -> dict[str, str]:
    return {loc.strip(): (mod or "").strip() for loc, mod in _ENTRY.findall(xml)}


def main() -> int:
    args = sys.argv[1:]
    if not args or args[0].startswith("-"):
        raise SystemExit(__doc__)
    new = _entries(Path(args[0]).read_text(encoding="utf-8"))
    site, key = _site_url(), _key()
    log = lambda s: print(s, file=sys.stderr)
    log(f"indexnow: new sitemap {len(new)} pages")
    if "--all" in args:
        urls = sorted(new)
        log(f"  --all: naming every page ({len(urls)})")
    else:
        try:
            with urllib.request.urlopen(site + "sitemap.xml", timeout=30) as r:
                live = _entries(r.read().decode("utf-8"))
        except Exception as e:  # noqa: BLE001 (any failure means: send nothing)
            log(f"  live sitemap unreadable ({e}); no notice")
            print("payload=")
            return 0
        added = [u for u in new if u not in live]
        redated = [u for u in new if u in live and new[u] != live[u]]
        removed = [u for u in live if u not in new]
        same = len(new) - len(added) - len(redated)
        log(f"  live sitemap {len(live)} pages: {len(added)} new, {len(redated)} redated, "
            f"{same} unchanged, {len(removed)} gone")
        if len(added) + len(redated) + same != len(new):
            raise SystemExit("indexnow: counts do not add up")
        urls = sorted(added + redated + removed)
    if any(not u.startswith(site) for u in urls):
        raise SystemExit("indexnow: a URL outside the site, which the key cannot vouch for")
    if not urls:
        print("payload=")
        return 0
    payload = {"host": urlsplit(site).hostname, "key": key,
               "keyLocation": f"{site}{key}.txt", "urlList": urls}
    if "--dry-run" in args:
        for u in urls:
            log(f"    {u}")
    print("payload=" + json.dumps(payload, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
