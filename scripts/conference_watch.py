"""Monthly conference watch: propose calendar updates, never apply them.

For every entry in data/conferences.yaml and data/conference_watchlist.yaml,
fetches the official page, asks the LLM to extract explicitly stated dates
for the next edition, compares against the calendar, and writes a markdown
report of proposed changes with evidence. A human reviews the report (the
workflow posts it as a GitHub issue) and applies changes by editing
data/conferences.yaml; this script never modifies data files. That keeps the
SPEC date-integrity rule intact: published dates come from a person who
checked the source, the machine only does the looking.

Usage:
    python scripts/conference_watch.py            # print report to stdout
    python scripts/conference_watch.py --report conference-watch.md

Requires GITHUB_TOKEN (GitHub Models) or ANTHROPIC_API_KEY for extraction.
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import date
from pathlib import Path

import requests
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from aggregate import call_anthropic, call_github_models  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
BROWSER_UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    )
}
PAGE_CHARS = 6000

EXTRACT_SYSTEM = """You extract event dates from web page text.
Report only information explicitly stated in the text about the NEXT or
currently advertised edition of the named event. Never infer, estimate, or
extrapolate dates. Output only a JSON object, no prose, in this exact shape
(use null for anything not explicitly stated):

{"start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "location": "",
 "abstract_deadline": "YYYY-MM-DD", "evidence": ""}

evidence is the short literal date phrase from the page (a few words) that
supports the dates you report."""


def page_text(url: str) -> str:
    resp = requests.get(url, headers=BROWSER_UA, timeout=25)
    resp.raise_for_status()
    text = re.sub(r"<script.*?</script>|<style.*?</style>", " ", resp.text,
                  flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text[:PAGE_CHARS]


def extract(name: str, text: str) -> dict:
    user = (f"Today is {date.today().isoformat()}. Event: {name}.\n"
            f"Page text:\n{text}")
    if os.environ.get("ANTHROPIC_API_KEY"):
        call, cfg = call_anthropic, _llm_cfg("anthropic")
    elif os.environ.get("GITHUB_TOKEN"):
        call, cfg = call_github_models, _llm_cfg("github_models")
    else:
        raise RuntimeError("no LLM credentials (GITHUB_TOKEN or "
                           "ANTHROPIC_API_KEY)")
    raw = call(EXTRACT_SYSTEM, user, cfg, 90).strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
    return json.loads(raw)


def _llm_cfg(provider: str) -> dict:
    config = yaml.safe_load((REPO / "feeds.yaml").read_text(encoding="utf-8"))
    return config["llm"][provider]


def yaml_value(value) -> str:
    if value is None:
        return ""
    return str(value)


def main() -> int:
    argp = argparse.ArgumentParser(description=__doc__)
    argp.add_argument("--report", default=None,
                      help="write the markdown report to this path")
    args = argp.parse_args()

    conferences = yaml.safe_load(
        (REPO / "data" / "conferences.yaml").read_text(encoding="utf-8"))
    watchlist_path = REPO / "data" / "conference_watchlist.yaml"
    watchlist = []
    if watchlist_path.exists():
        watchlist = yaml.safe_load(
            watchlist_path.read_text(encoding="utf-8")) or []

    proposals = []
    findings = []
    failures = []
    unchanged = []

    for conf in conferences:
        name = conf["name"]
        try:
            data = extract(name, page_text(conf["url"]))
        except Exception as exc:
            failures.append(f"{name}: {type(exc).__name__}: {exc}")
            continue
        # Noise filters: only propose changes a human would act on.
        # 1. A found start date in the past means the page still shows a
        #    previous edition; nothing to propose.
        # 2. A past deadline is equivalent to the calendar's "passed".
        # 3. Location rewording alone is not actionable unless the calendar
        #    has no location yet or dates changed too.
        today_iso = date.today().isoformat()
        found_start = str(data.get("start_date") or "")
        if found_start and found_start < today_iso:
            unchanged.append(f"{name} (page still shows a past edition)")
            time.sleep(2)
            continue
        diffs = []
        date_changed = False
        for field in ("start_date", "end_date", "abstract_deadline"):
            found = str(data.get(field) or "")
            current = yaml_value(conf.get(field))
            if not found or found == current:
                continue
            if field == "abstract_deadline" and current == "passed" \
                    and found < today_iso:
                continue
            diffs.append(f"  - {field}: `{current or 'TBD'}` -> "
                         f"`{found}` (proposed)")
            date_changed = True
        found_location = str(data.get("location") or "")
        current_location = yaml_value(conf.get("location"))
        if found_location and found_location != current_location and (
                date_changed or current_location in ("", "TBD")):
            diffs.append(f"  - location: `{current_location or 'TBD'}` -> "
                         f"`{found_location}` (proposed)")
        if diffs:
            proposals.append(
                f"### {name}\n"
                + "\n".join(diffs)
                + f"\n  - evidence: \"{data.get('evidence', '')}\""
                + f"\n  - source: {conf['url']}"
            )
        else:
            unchanged.append(name)
        time.sleep(2)

    for item in watchlist:
        name = item["name"]
        try:
            data = extract(name, page_text(item["url"]))
        except Exception as exc:
            failures.append(f"{name} (watchlist): {type(exc).__name__}: {exc}")
            continue
        if data.get("start_date"):
            past_note = ""
            if str(data["start_date"]) < date.today().isoformat():
                past_note = " (this edition already happened; watch for the next)"
            findings.append(
                f"### {name} (watchlist, not yet in the calendar){past_note}\n"
                f"  - dates: `{data.get('start_date')}` to "
                f"`{data.get('end_date') or '?'}`, location: "
                f"`{data.get('location') or '?'}`, abstract deadline: "
                f"`{data.get('abstract_deadline') or '?'}`\n"
                f"  - evidence: \"{data.get('evidence', '')}\"\n"
                f"  - source: {item['url']}"
            )
        else:
            unchanged.append(f"{name} (watchlist)")
        time.sleep(2)

    lines = [
        "Monthly automated check of official conference pages. Nothing has "
        "been changed; review each proposal against the linked source and "
        "apply by editing `data/conferences.yaml`.",
        "",
    ]
    if proposals:
        lines.extend(["## Proposed updates", ""] + proposals + [""])
    if findings:
        lines.extend(["## Watchlist findings", ""] + findings + [""])
    if failures:
        lines.extend(["## Check failures", ""]
                      + [f"- {f}" for f in failures] + [""])
    lines.append(f"Checked and unchanged: {', '.join(unchanged) or 'none'}.")
    report = "\n".join(lines)

    if args.report:
        Path(args.report).write_text(report, encoding="utf-8", newline="\n")
    else:
        print(report)

    print("\n=== verification ===")
    print(f"events checked : {len(conferences) + len(watchlist)}")
    print(f"proposals      : {len(proposals)}")
    print(f"watch findings : {len(findings)}")
    print(f"failures       : {len(failures)}")
    print(f"actionable={len(proposals) + len(findings) + len(failures)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
