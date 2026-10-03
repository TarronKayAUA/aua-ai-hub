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

A failure that can pass on its own (a server error, a rate limit, a timeout
or a dropped connection) is tried twice more, 5 and then 15 seconds later,
before it counts. The output says how many attempts a feed took, so a flaky
feed stays visible even when it passes.

An empty feed passes when the feed itself says it does not publish on the day
it was built (the RSS skipDays element, days in GMT, against the feed's own
lastBuildDate or pubDate). arXiv's listings are empty on Saturday and Sunday
and declare it; the monthly check fell on a Saturday on 2026-10-03 and
reported arXiv cs.CL as a new failure (issue #54). An empty feed on any other
day still fails.
"""

import os
import re
import sys
import time
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
# Retry what can pass on its own (2026-09-29): hnrss.org answered 502 for
# seconds at a time, from everywhere, and a single 502 made the Ubuntu canary
# report the Hacker News feed as a new failure for a human to act on. A 403
# or 404 is not retried: a block or a missing feed does not change in
# seconds, and the tolerated Substack blocks would only slow the run.
RETRY_WAITS = (5, 15)   # seconds before the second and the third attempt
RETRY_STATUS = {429} | set(range(500, 600))
# The RSS skipDays element: the days a feed says it does not publish.
SKIP_DAYS = re.compile(rb"<skipDays>(.*?)</skipDays>", re.DOTALL | re.IGNORECASE)
SKIP_DAY = re.compile(rb"<day>\s*([A-Za-z]+)\s*</day>", re.IGNORECASE)
WEEKDAYS = ("Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")


def declared_rest_day(content: bytes, feed) -> str | None:
    """The weekday (GMT) the feed was built on, if the feed lists that day in
    its own skipDays; otherwise None. The build date is the feed's
    lastBuildDate or pubDate, so a check made after midnight but before the
    feed's next build still judges the feed by the day it describes."""
    block = SKIP_DAYS.search(content)
    if not block:
        return None
    days = {d.decode().capitalize() for d in SKIP_DAY.findall(block.group(1))}
    stamp = feed.get("updated_parsed") or feed.get("published_parsed") or time.gmtime()
    day = WEEKDAYS[stamp.tm_wday]
    return day if day in days else None


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
    errors: list[str] = []
    while True:
        try:
            resp = requests.get(url, headers=headers, timeout=TIMEOUT)
            error = f"HTTP {resp.status_code}" if resp.status_code >= 400 else None
            transient = resp.status_code in RETRY_STATUS
        except (requests.Timeout, requests.ConnectionError) as exc:
            error, transient = type(exc).__name__, True
        except requests.RequestException as exc:
            error, transient = type(exc).__name__, False
        if error is None:
            # Say what the earlier attempts got, so a flaky feed stays visible.
            tried = f" ({len(errors) + 1} attempts, after {', '.join(errors)})" if errors else ""
            break
        errors.append(error)
        if not transient or len(errors) > len(RETRY_WAITS):
            if len(errors) == 1:
                return False, error
            if len(set(errors)) == 1:
                return False, f"{error} ({len(errors)} attempts)"
            return False, f"{error} ({len(errors)} attempts: {', '.join(errors)})"
        time.sleep(RETRY_WAITS[len(errors) - 1])
    parsed = feedparser.parse(resp.content)
    entries = len(parsed.entries)
    if entries == 0:
        rest = None if parsed.bozo else declared_rest_day(resp.content, parsed.feed)
        if rest:
            return True, (f"0 entries, built on {rest}, a day the feed says it does "
                          f"not publish (skipDays){tried}")
        detail = "parsed but 0 entries"
        if parsed.bozo:
            detail += f" (bozo: {parsed.bozo_exception})"
        return False, detail + tried
    title = (parsed.feed.get("title") or "?").strip()[:40]
    newest = parsed.entries[0].get("published", parsed.entries[0].get("updated", "?"))
    return True, f"{entries} entries | {title!r} | newest: {newest}{tried}"


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
