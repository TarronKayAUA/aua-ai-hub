"""Feed verifier for the AUA AI Hub pipeline.

Fetches each feed URL and parses it with feedparser, the same library the
aggregation pipeline uses, so a pass here means the pipeline can read it.
Run before committing any change to feeds.yaml (SPEC section 7 verification
rule).

Usage:
    python scripts/verify_feeds.py                # checks every feed in feeds.yaml
    python scripts/verify_feeds.py URL [URL ...]  # checks candidate URLs

Exit code is nonzero if any feed fails.
"""

import sys
from pathlib import Path

import feedparser
import requests
import yaml

REPO = Path(__file__).resolve().parent.parent
HEADERS = {
    # Some feed hosts (Reddit among them) refuse default client user agents.
    "User-Agent": "AUA-AI-Hub feed checker (github.com/TarronKayAUA/aua-ai-hub)"
}
TIMEOUT = 20


def collect() -> list[tuple[str, str]]:
    if len(sys.argv) > 1:
        return [("cli", url, False) for url in sys.argv[1:]]
    config = yaml.safe_load((REPO / "feeds.yaml").read_text(encoding="utf-8"))
    pairs = []
    for category, spec in config["categories"].items():
        for feed in spec.get("feeds", []):
            if feed["url"] == "TODO-OWNER":
                print(f"skip {feed['name']} (URL pending owner action)")
                continue
            pairs.append((f"{category}:{feed['name']}", feed["url"],
                          feed.get("browser_ua", False)))
    for channel in config.get("video_feeds", {}).get("channels", []):
        url = ("https://www.youtube.com/feeds/videos.xml?channel_id="
               + channel["channel_id"])
        pairs.append((f"videos:{channel['name']}", url, False))
    for show in config.get("podcast_feeds", {}).get("shows", []):
        pairs.append((f"podcasts:{show['name']}", show["url"], False))
    return pairs


def check(url: str, browser_ua: bool = False) -> tuple[bool, str]:
    # browser_ua mirrors the pipeline's per-feed override (2026-08-05):
    # hosts like Mayo Clinic Platform reject plain client user agents.
    headers = dict(HEADERS)
    if browser_ua:
        headers["User-Agent"] = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                 "AppleWebKit/537.36 (KHTML, like Gecko) "
                                 "Chrome/126.0.0.0 Safari/537.36 "
                                 "(AUA-AI-Hub feed checker)")
    try:
        resp = requests.get(url, headers=headers, timeout=TIMEOUT)
        if resp.status_code >= 400:
            return False, f"HTTP {resp.status_code}"
    except requests.RequestException as exc:
        return False, type(exc).__name__
    parsed = feedparser.parse(resp.content)
    entries = len(parsed.entries)
    if entries == 0:
        detail = "parsed but 0 entries"
        if parsed.bozo:
            detail += f" (bozo: {parsed.bozo_exception})"
        return False, detail
    title = (parsed.feed.get("title") or "?").strip()[:40]
    newest = parsed.entries[0].get("published", parsed.entries[0].get("updated", "?"))
    return True, f"{entries} entries | {title!r} | newest: {newest}"


def main() -> int:
    pairs = collect()
    failures = []
    for source, url, browser_ua in pairs:
        ok, detail = check(url, browser_ua)
        marker = "ok  " if ok else "FAIL"
        print(f"{marker} {detail}\n     {url}  ({source})")
        if not ok:
            failures.append((source, url, detail))

    print("\n=== verification ===")
    print(f"feeds checked : {len(pairs)}")
    print(f"passed        : {len(pairs) - len(failures)}")
    print(f"failed        : {len(failures)}")
    for source, url, detail in failures:
        print(f"  FAIL {url} ({source}): {detail}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
