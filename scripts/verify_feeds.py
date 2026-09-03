"""Feed verifier for the AUA AI Hub pipeline.

Fetches each feed URL and parses it with feedparser, the same library the
aggregation pipeline uses, so a pass here means the pipeline can read it.
Run before committing any change to feeds.yaml (SPEC section 7 verification
rule).

Usage:
    python scripts/verify_feeds.py                # checks every feed in feeds.yaml
    python scripts/verify_feeds.py URL [URL ...]  # checks candidate URLs

Exit code is nonzero when a human needs to act, which is not the same thing
as "a feed failed".

A feed may carry `expect_fail_in_ci` in feeds.yaml. That marks it as known to
be blocked from GitHub Actions datacenter IPs and kept in the roster
deliberately, failing soft, with an approved replacement already carrying the
coverage. Those failures are reported and tolerated rather than raised.

The alert is inverted for them. The actionable event is not that a blocked
feed is still blocked, it is that a blocked feed has started WORKING again,
because that means the block lifted and its replacement can be retired.
Reporting a known block every month only teaches everyone to ignore the
report (issues #31 and #45).

Recovery counts as actionable only inside GitHub Actions. From an ordinary
network these feeds pass, which is normal and says nothing about the block.
"""

import os
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


def collect() -> list[tuple[str, str, bool, str | None]]:
    """(source, url, browser_ua, expect_fail_in_ci) for every feed."""
    if len(sys.argv) > 1:
        return [("cli", url, False, None) for url in sys.argv[1:]]
    config = yaml.safe_load((REPO / "feeds.yaml").read_text(encoding="utf-8"))
    pairs = []
    for category, spec in config["categories"].items():
        for feed in spec.get("feeds", []):
            if feed["url"] == "TODO-OWNER":
                print(f"skip {feed['name']} (URL pending owner action)")
                continue
            pairs.append((f"{category}:{feed['name']}", feed["url"],
                          feed.get("browser_ua", False),
                          feed.get("expect_fail_in_ci")))
    for channel in config.get("video_feeds", {}).get("channels", []):
        url = ("https://www.youtube.com/feeds/videos.xml?channel_id="
               + channel["channel_id"])
        pairs.append((f"videos:{channel['name']}", url, False,
                      channel.get("expect_fail_in_ci")))
    for show in config.get("podcast_feeds", {}).get("shows", []):
        pairs.append((f"podcasts:{show['name']}", show["url"], False,
                      show.get("expect_fail_in_ci")))
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
    in_ci = bool(os.environ.get("GITHUB_ACTIONS"))
    pairs = collect()
    failures, tolerated, recovered = [], [], []

    for source, url, browser_ua, expected in pairs:
        ok, detail = check(url, browser_ua)
        if ok and expected and in_ci:
            marker = "BACK"
            recovered.append((source, url, expected))
        elif ok:
            marker = "ok  "
        elif expected:
            marker = "held"
            tolerated.append((source, url, expected))
        else:
            marker = "FAIL"
            failures.append((source, url, detail))
        print(f"{marker} {detail}")
        print(f"     {url}  ({source})")

    expected_total = sum(1 for *_rest, e in pairs if e)
    print()
    print("=== verification ===")
    print(f"feeds checked : {len(pairs)}")
    print(f"passed        : {len(pairs) - len(failures) - len(tolerated)}")
    print(f"failed        : {len(failures)}")
    print(f"tolerated     : {len(tolerated)} (known blocked, replacement in the roster)")
    if not in_ci and expected_total:
        print(f"note          : {expected_total} feeds are expected to fail only in CI;")
        print("                passing here is normal on an ordinary network")

    for source, url, detail in failures:
        print(f"  ACTION new failure: {url} ({source}): {detail}")
    for source, url, reason in recovered:
        print(f"  ACTION recovered, its replacement can be retired: {url} ({source})")
        print(f"         it was tolerated because: {reason}")
    for source, url, reason in tolerated:
        print(f"  held, no action: {url} ({source}): {reason}")

    return 1 if (failures or recovered) else 0


if __name__ == "__main__":
    sys.exit(main())
