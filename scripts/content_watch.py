"""Weekly content watch: keep the curated rosters current, propose-first.

Two inputs, one report, one narrow auto-apply (owner approved 2026-07-01):

1. News-driven synthesis (free input, one paid call): the week's kept news
   items from data/seen_items.json are read against the current tools and
   open-models rosters by the llm.tasks content_watch model, which lists
   changes the news implies (a tool discontinued, launched, renamed,
   acquired, repriced). Every recommendation must cite one of the week's
   item URLs as evidence; ungrounded recommendations are dropped.
2. Rotating verification: the rotation_size entries with the oldest
   last_reviewed dates get their own pages fetched; the llm.tasks
   content_verify model checks each against its blurb and cost tier.
   An entry verified alive-and-accurate gets its last_reviewed date
   bumped in place (the only field this script ever writes; the bump IS
   the rotation state). Anything negative or unclear becomes a
   recommendation for a human.

All substantive changes (add, remove, reword, recost) are propose-only:
the report carries paste-ready YAML so the owner, or any future model
session, can apply approved items in seconds. The workflow posts the
report as a GitHub issue when there is anything to review.

Usage:
    python scripts/content_watch.py                 # report to stdout
    python scripts/content_watch.py --report content-watch.md
    python scripts/content_watch.py --no-bump       # never write data files
"""

import argparse
import json
import re
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import requests
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from aggregate import resolve_task_llm  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
TOOLS_PATH = REPO / "data" / "tools.yaml"
MODELS_PATH = REPO / "data" / "open_models.yaml"
LEDGER_PATH = REPO / "data" / "seen_items.json"
BROWSER_UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    )
}

SYNTHESIS_SYSTEM = """You maintain the curated tool listings of an
artificial intelligence reference site for a medical school. You receive
this week's curated news items and the site's current rosters. Your job is
narrow: identify changes the NEWS ITEMS imply for the rosters, such as a
listed product being discontinued, renamed, acquired, or repriced, or a
significant new product of the kinds listed launching. Do not review the
rosters against your own knowledge; only the provided news counts as
evidence. Most weeks imply no changes, and an empty list is the expected
answer. Output only a JSON object, no prose:

{"recommendations": [{"target": "tools.yaml" or "open_models.yaml",
  "entry": "existing entry name or proposed name",
  "change": "add" or "remove" or "update",
  "reason": "one sentence",
  "evidence_url": "URL of the news item, from the provided list only"}]}"""

VERIFY_SYSTEM = """You verify entries of a curated tool directory against
each tool's own web page text. For each entry you receive the directory's
description and cost tier plus text fetched from the tool's page today.
Judge only from the page text. Output only a JSON object, no prose:

{"verdicts": [{"name": "", "alive": true/false/"unknown",
  "blurb_accurate": true/false/"unknown",
  "cost_tier_ok": true/false/"unknown",
  "note": "one short sentence, only when something is off"}]}

alive means the page still presents an operating product (not a shutdown
notice, domain-parking page, or redirect to something unrelated). Mark
"unknown" whenever the text is insufficient to judge."""


def strip_page(url: str, page_chars: int) -> str:
    resp = requests.get(url, headers=BROWSER_UA, timeout=20)
    resp.raise_for_status()
    text = re.sub(r"<script.*?</script>|<style.*?</style>", " ", resp.text,
                  flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text)[:page_chars]


def call_task(config: dict, task: str, system: str, user: str) -> dict:
    provider, call, cfg = resolve_task_llm(config, task)
    if call is None:
        raise RuntimeError("no LLM credentials")
    raw = call(system, user, cfg, 120).strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
    return json.loads(raw)


def week_items(days: int) -> list[dict]:
    ledger = json.loads(LEDGER_PATH.read_text(encoding="utf-8"))
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    return [
        {"title": i["title"], "summary": i.get("summary", "")[:200],
         "url": i["url"]}
        for i in ledger["items"]
        if i.get("kept") and i.get("first_seen", "") >= cutoff
        and "title" in i
    ]


def bump_last_reviewed(text: str, name: str, today_iso: str) -> str:
    """Surgical single-line edit: update one entry's last_reviewed date.
    The only write this script performs. Raises unless the entry and field
    are located exactly once and the result re-parses correctly."""
    lines = text.split("\n")
    starts = [i for i, ln in enumerate(lines)
              if ln.rstrip() == f"- name: {name}"]
    if len(starts) != 1:
        raise ValueError(f"entry {name!r} found {len(starts)} times")
    begin = starts[0]
    end = next((i for i in range(begin + 1, len(lines))
                if lines[i].startswith("- name: ")), len(lines))
    hits = [i for i in range(begin, end)
            if lines[i].startswith("  last_reviewed:")]
    if len(hits) != 1:
        raise ValueError(f"last_reviewed found {len(hits)} times "
                         f"in {name!r}")
    lines[hits[0]] = f"  last_reviewed: {today_iso}"
    new_text = "\n".join(lines)
    parsed = yaml.safe_load(new_text)
    check = next(e for e in parsed if e["name"] == name)
    if str(check.get("last_reviewed")) != today_iso:
        raise ValueError(f"post-edit verification failed for {name!r}")
    return new_text


def main() -> int:
    argp = argparse.ArgumentParser(description=__doc__)
    argp.add_argument("--report", default=None)
    argp.add_argument("--no-bump", action="store_true",
                      help="never write data files")
    args = argp.parse_args()

    config = yaml.safe_load((REPO / "feeds.yaml").read_text(encoding="utf-8"))
    watch_cfg = config.get("content_watch", {})
    rotation_size = int(watch_cfg.get("rotation_size", 12))
    news_days = int(watch_cfg.get("news_days", 7))
    page_chars = int(watch_cfg.get("page_chars", 5000))
    today_iso = date.today().isoformat()

    tools_text = TOOLS_PATH.read_text(encoding="utf-8")
    tools = yaml.safe_load(tools_text)
    models = yaml.safe_load(MODELS_PATH.read_text(encoding="utf-8"))

    recommendations, failures, bumped = [], [], []

    # --- Input 1: news-driven synthesis -----------------------------------
    items = week_items(news_days)
    allowed_urls = {i["url"] for i in items}
    dropped_ungrounded = 0
    if items:
        roster_lines = [
            f"- {t['name']} ({t['vendor']}; {t['cost']}): {t['blurb'][:120]}"
            for t in tools
        ] + [
            f"- {m['name']} ({m['vendor']}, open-weights model family): "
            f"{m['blurb'][:120]}"
            for m in models
        ]
        news_lines = [
            f"- {i['title']} :: {i['summary']} :: {i['url']}" for i in items
        ]
        user = ("CURRENT ROSTERS\n" + "\n".join(roster_lines)
                + "\n\nTHIS WEEK'S NEWS ITEMS\n" + "\n".join(news_lines))
        try:
            data = call_task(config, "content_watch", SYNTHESIS_SYSTEM, user)
            for rec in (data.get("recommendations") or [])[:20]:
                if rec.get("evidence_url") not in allowed_urls:
                    dropped_ungrounded += 1
                    continue
                recommendations.append(
                    f"### {rec.get('entry', '?')} "
                    f"({rec.get('target', '?')}, {rec.get('change', '?')})\n"
                    f"  - reason: {rec.get('reason', '')}\n"
                    f"  - evidence: {rec.get('evidence_url')}")
        except (requests.RequestException, ValueError, KeyError,
                json.JSONDecodeError, RuntimeError) as exc:
            failures.append(f"news synthesis: {type(exc).__name__}: {exc}")

    # --- Input 2: rotating verification -----------------------------------
    def review_age(entry: dict) -> str:
        return str(entry.get("last_reviewed") or "")

    # Entries marked `verify: skip` (login walls, client-side rendering,
    # bot blockers) yield no fetchable text and would flag "unknown" every
    # cycle; they are excluded from rotation and stay owner-reviewed.
    verifiable = [t for t in tools if t.get("verify") != "skip"]
    rotation = sorted(verifiable, key=review_age)[:rotation_size]
    blocks = []
    for entry in rotation:
        try:
            page = strip_page(entry.get("verify_url") or entry["url"],
                              page_chars)
        except requests.RequestException as exc:
            failures.append(f"{entry['name']}: fetch {type(exc).__name__}")
            continue
        blocks.append(
            f"NAME: {entry['name']}\nDESCRIPTION: {entry['blurb']}\n"
            f"COST TIER: {entry['cost']}\nPAGE TEXT: {page}")
        time.sleep(1)

    verdicts = {}
    if blocks:
        try:
            data = call_task(config, "content_verify", VERIFY_SYSTEM,
                             "\n\n====\n\n".join(blocks))
            verdicts = {v.get("name"): v
                        for v in (data.get("verdicts") or [])}
        except (requests.RequestException, ValueError, KeyError,
                json.JSONDecodeError, RuntimeError) as exc:
            failures.append(f"verification: {type(exc).__name__}: {exc}")

    for entry in rotation:
        v = verdicts.get(entry["name"])
        if not v:
            continue
        if (v.get("alive") is True and v.get("blurb_accurate") is True
                and v.get("cost_tier_ok") is True):
            if not args.no_bump:
                try:
                    tools_text = bump_last_reviewed(
                        tools_text, entry["name"], today_iso)
                    bumped.append(entry["name"])
                except ValueError as exc:
                    failures.append(f"{entry['name']}: bump {exc}")
        else:
            flags = ", ".join(
                f"{k}={v.get(k)}" for k in
                ("alive", "blurb_accurate", "cost_tier_ok")
                if v.get(k) is not True)
            recommendations.append(
                f"### {entry['name']} (tools.yaml, verify)\n"
                f"  - flags: {flags}\n"
                f"  - note: {v.get('note', '')}\n"
                f"  - source: {entry['url']}")

    if bumped and not args.no_bump:
        TOOLS_PATH.write_text(tools_text, encoding="utf-8", newline="\n")

    lines = [
        "Weekly automated content watch. Verified-unchanged entries had "
        "their `last_reviewed` dates bumped in `data/tools.yaml`; "
        "everything under Recommendations needs a human decision. Apply "
        "an item by editing the named data file (each entry's format is "
        "documented in the file header), or hand this issue to a model "
        "session with the items you approve.",
        "",
    ]
    if recommendations:
        lines.extend(["## Recommendations", ""] + recommendations + [""])
    if bumped:
        lines.append(f"Verified unchanged (last_reviewed bumped to "
                     f"{today_iso}): {', '.join(bumped)}.")
    if failures:
        lines.extend(["", "## Check failures", ""]
                     + [f"- {f}" for f in failures])
    report = "\n".join(lines)

    if args.report:
        Path(args.report).write_text(report, encoding="utf-8", newline="\n")
    else:
        print(report)

    print("\n=== verification ===")
    print(f"news items in    : {len(items)}")
    print(f"rotation checked : {len(rotation)}")
    print(f"bumped           : {len(bumped)}")
    print(f"recommendations  : {len(recommendations)}")
    print(f"dropped ungrounded: {dropped_ungrounded}")
    print(f"failures         : {len(failures)}")
    print(f"actionable={len(recommendations) + len(failures)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
