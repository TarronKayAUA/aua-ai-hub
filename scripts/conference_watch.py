"""Conference watch: grounded calendar updates from official pages.

For every entry in data/conferences.yaml and data/conference_watchlist.yaml,
fetches the official page, asks the LLM to extract explicitly stated dates
for the next edition, and compares against the calendar. What happens next
depends on the `conference_watch.mode` setting in feeds.yaml:

  auto (owner approved 2026-07-01): a changed field is applied directly to
  data/conferences.yaml only when it passes every gate:
    1. grounding: the model's evidence phrase appears in the fetched page,
    2. coherence: dates parse, end >= start, deadline before start, and
       nothing is in the past,
    3. stability: the same value was extracted on two consecutive runs
       (tracked in data/conference_watch_state.json, pipeline-owned).
  Applied lines carry an inline `# auto-verified YYYY-MM-DD` provenance
  comment. Anything failing a gate becomes a proposal in the report (the
  workflow posts it as a GitHub issue), exactly as propose mode.

  propose: nothing is written; every change is a proposal for a human.

Either way the date-integrity rule holds: published dates come from the
official page fetched at runtime, never from model memory, and never
estimated. New conferences (watchlist findings) are always propose-only;
only a human adds an event to the calendar.

Usage:
    python scripts/conference_watch.py              # mode from feeds.yaml
    python scripts/conference_watch.py --propose-only
    python scripts/conference_watch.py --report conference-watch.md

Requires ANTHROPIC_API_KEY (preferred, per feeds.yaml llm.tasks) or
GITHUB_TOKEN for extraction.
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
CONFERENCES_PATH = REPO / "data" / "conferences.yaml"
STATE_PATH = REPO / "data" / "conference_watch_state.json"
BROWSER_UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    )
}
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
PENDING_MAX_AGE_DAYS = 14  # unconfirmed sightings expire

EXTRACT_SYSTEM = """You extract event dates from web page text.
Report only information explicitly stated in the text about the NEXT or
currently advertised edition of the named event. Never infer, estimate, or
extrapolate dates. Output only a JSON object, no prose, in this exact shape
(use null for anything not explicitly stated):

{"start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD", "location": "",
 "abstract_deadline": "YYYY-MM-DD", "evidence": ""}

evidence is the short literal date phrase from the page (a few words) that
supports the dates you report."""


def page_text(url: str, page_chars: int) -> str:
    resp = requests.get(url, headers=BROWSER_UA, timeout=25)
    resp.raise_for_status()
    text = re.sub(r"<script.*?</script>|<style.*?</style>", " ", resp.text,
                  flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text[:page_chars]


def extract(name: str, text: str, config: dict) -> dict:
    provider, call, cfg = resolve_task_llm(config, "conference_watch")
    if call is None:
        raise RuntimeError("no LLM credentials (ANTHROPIC_API_KEY or "
                           "GITHUB_TOKEN)")
    user = (f"Today is {date.today().isoformat()}. Event: {name}.\n"
            f"Page text:\n{text}")
    raw = call(EXTRACT_SYSTEM, user, cfg, 90).strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
    return json.loads(raw)


def yaml_value(value) -> str:
    if value is None:
        return ""
    return str(value)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip().lower()


def grounded(evidence: str, page: str) -> bool:
    """Gate 1: the model's quoted evidence must exist in the fetched page."""
    ev = _normalize(evidence or "")
    return len(ev) >= 6 and ev in _normalize(page)


def coherent(conf: dict, changes: dict, today_iso: str) -> str:
    """Gate 2: the calendar entry stays internally consistent after the
    change set. Returns '' when fine, else the reason."""
    merged = {
        f: changes.get(f, yaml_value(conf.get(f)))
        for f in ("start_date", "end_date", "abstract_deadline")
    }
    for field, value in changes.items():
        if field == "location":
            continue
        if not ISO_DATE.match(value):
            return f"{field} {value!r} is not an ISO date"
    start, end = merged["start_date"], merged["end_date"]
    deadline = merged["abstract_deadline"]
    if ISO_DATE.match(start) and ISO_DATE.match(end) and end < start:
        return f"end {end} before start {start}"
    if ISO_DATE.match(start) and start < today_iso:
        return f"start {start} is in the past"
    if (ISO_DATE.match(deadline) and ISO_DATE.match(start)
            and deadline >= start):
        return f"deadline {deadline} not before start {start}"
    return ""


def load_state() -> dict:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    return {"pending": {}}


def save_state(state: dict) -> None:
    STATE_PATH.write_text(
        json.dumps(state, indent=1, ensure_ascii=False) + "\n",
        encoding="utf-8", newline="\n")


def stability(state: dict, name: str, field: str, value: str,
              now_iso: str, runs_needed: int) -> bool:
    """Gate 3: True once the same value has been seen on `runs_needed`
    consecutive runs (this run included). Sightings expire unconfirmed
    after PENDING_MAX_AGE_DAYS."""
    if runs_needed <= 1:
        return True
    pending = state.setdefault("pending", {})
    key = f"{name}\x1f{field}"
    entry = pending.get(key)
    cutoff = (datetime.now(timezone.utc)
              - timedelta(days=PENDING_MAX_AGE_DAYS)).isoformat()
    if entry and entry["value"] == value and entry["first_seen"] >= cutoff:
        entry["count"] += 1
        if entry["count"] >= runs_needed:
            del pending[key]
            return True
        return False
    pending[key] = {"value": value, "first_seen": now_iso, "count": 1}
    return False


def apply_field(text: str, name: str, field: str, value: str,
                today_iso: str) -> str:
    """Surgical single-line edit inside the named entry's block, with an
    inline provenance comment. Raises when the entry or field line cannot
    be located exactly once."""
    lines = text.split("\n")
    starts = [i for i, ln in enumerate(lines)
              if ln.rstrip() == f"- name: {name}"]
    if len(starts) != 1:
        raise ValueError(f"entry {name!r} found {len(starts)} times")
    begin = starts[0]
    end = next((i for i in range(begin + 1, len(lines))
                if lines[i].startswith("- name: ")), len(lines))
    hits = [i for i in range(begin, end)
            if lines[i].startswith(f"  {field}:")]
    if len(hits) != 1:
        raise ValueError(f"field {field!r} found {len(hits)} times "
                         f"in {name!r}")
    rendered = f'"{value}"' if re.search(r"[:#]", value) else value
    lines[hits[0]] = (f"  {field}: {rendered} "
                      f"# auto-verified {today_iso} from the official page")
    new_text = "\n".join(lines)
    parsed = yaml.safe_load(new_text)
    check = next(c for c in parsed if c["name"] == name)
    if yaml_value(check.get(field)) != value:
        raise ValueError(f"post-edit verification failed for "
                         f"{name!r}.{field}")
    return new_text


def main() -> int:
    argp = argparse.ArgumentParser(description=__doc__)
    argp.add_argument("--report", default=None,
                      help="write the markdown report to this path")
    argp.add_argument("--propose-only", action="store_true",
                      help="override feeds.yaml mode; never write data")
    args = argp.parse_args()

    config = yaml.safe_load((REPO / "feeds.yaml").read_text(encoding="utf-8"))
    watch_cfg = config.get("conference_watch", {})
    mode = "propose" if args.propose_only else watch_cfg.get("mode", "propose")
    runs_needed = int(watch_cfg.get("stability_runs", 2))
    page_chars = int(watch_cfg.get("page_chars", 6000))

    conferences_text = CONFERENCES_PATH.read_text(encoding="utf-8")
    conferences = yaml.safe_load(conferences_text)
    watchlist_path = REPO / "data" / "conference_watchlist.yaml"
    watchlist = []
    if watchlist_path.exists():
        watchlist = yaml.safe_load(
            watchlist_path.read_text(encoding="utf-8")) or []

    state = load_state()
    now_iso = datetime.now(timezone.utc).isoformat()
    today_iso = date.today().isoformat()

    applied, pending_report = [], []
    proposals, findings, failures, unchanged = [], [], [], []

    for conf in conferences:
        name = conf["name"]
        try:
            page = page_text(conf["url"], page_chars)
            data = extract(name, page, config)
        except Exception as exc:
            failures.append(f"{name}: {type(exc).__name__}: {exc}")
            continue
        # Noise filters, unchanged from the propose-only era: a past start
        # means the page still shows a previous edition; a past deadline
        # matches the calendar's "passed"; location rewording alone is not
        # actionable unless dates changed or none is recorded.
        found_start = str(data.get("start_date") or "")
        if found_start and found_start < today_iso:
            unchanged.append(f"{name} (page still shows a past edition)")
            time.sleep(2)
            continue
        changes = {}
        for field in ("start_date", "end_date", "abstract_deadline"):
            found = str(data.get(field) or "")
            current = yaml_value(conf.get(field))
            if not found or found == current:
                continue
            if field == "abstract_deadline" and current == "passed" \
                    and found < today_iso:
                continue
            changes[field] = found
        found_location = str(data.get("location") or "")
        current_location = yaml_value(conf.get("location"))
        if found_location and found_location != current_location and (
                changes or current_location in ("", "TBD")):
            changes["location"] = found_location
        if not changes:
            unchanged.append(name)
            time.sleep(2)
            continue

        evidence = str(data.get("evidence") or "")
        detail = "\n".join(
            f"  - {f}: `{yaml_value(conf.get(f)) or 'TBD'}` -> `{v}`"
            for f, v in changes.items()
        ) + f"\n  - evidence: \"{evidence}\"\n  - source: {conf['url']}"

        gate = ""
        if mode != "auto":
            gate = "propose mode"
        elif not grounded(evidence, page):
            gate = "evidence not found in the fetched page"
        else:
            gate = coherent(conf, changes, today_iso)
        if gate:
            proposals.append(f"### {name} ({gate})\n{detail}")
            time.sleep(2)
            continue

        ready = {f: v for f, v in changes.items()
                 if stability(state, name, f, v, now_iso, runs_needed)}
        waiting = {f: v for f, v in changes.items() if f not in ready}
        if waiting:
            pending_report.append(
                f"### {name} (awaiting confirmation on the next run)\n"
                + "\n".join(f"  - {f}: `{v}`" for f, v in waiting.items()))
        for field, value in ready.items():
            try:
                conferences_text = apply_field(
                    conferences_text, name, field, value, today_iso)
                applied.append(
                    f"### {name}\n  - {field}: "
                    f"`{yaml_value(conf.get(field)) or 'TBD'}` -> `{value}` "
                    f"(applied)\n  - evidence: \"{evidence}\"\n"
                    f"  - source: {conf['url']}")
            except ValueError as exc:
                proposals.append(f"### {name} (apply failed: {exc})\n{detail}")
        time.sleep(2)

    for item in watchlist:
        name = item["name"]
        try:
            data = extract(name, page_text(item["url"], page_chars), config)
        except Exception as exc:
            failures.append(f"{name} (watchlist): {type(exc).__name__}: {exc}")
            continue
        if data.get("start_date"):
            if str(data["start_date"]) < today_iso:
                # A past edition on a watchlist page is not actionable;
                # reporting it as a finding opened noise issues (issue #5).
                unchanged.append(
                    f"{name} (watchlist; page still shows a past edition)")
                time.sleep(2)
                continue
            findings.append(
                f"### {name} (watchlist, not yet in the calendar)\n"
                f"  - dates: `{data.get('start_date')}` to "
                f"`{data.get('end_date') or '?'}`, location: "
                f"`{data.get('location') or '?'}`, abstract deadline: "
                f"`{data.get('abstract_deadline') or '?'}`\n"
                f"  - evidence: \"{data.get('evidence', '')}\"\n"
                f"  - source: {item['url']}")
        else:
            unchanged.append(f"{name} (watchlist)")
        time.sleep(2)

    if applied:
        CONFERENCES_PATH.write_text(conferences_text, encoding="utf-8",
                                    newline="\n")
    save_state(state)

    intro = (
        "Automated check of official conference pages. Changes that passed "
        "every gate (grounded in the page, dates coherent, stable across "
        "two runs) were applied to `data/conferences.yaml`; everything "
        "below under Proposed updates needs a human review against the "
        "linked source."
        if mode == "auto" else
        "Automated check of official conference pages. Nothing has been "
        "changed; review each proposal against the linked source and apply "
        "by editing `data/conferences.yaml`."
    )
    lines = [intro, ""]
    if applied:
        lines.extend(["## Applied automatically", ""] + applied + [""])
    if proposals:
        lines.extend(["## Proposed updates (need review)", ""]
                     + proposals + [""])
    if findings:
        lines.extend(["## Watchlist findings", ""] + findings + [""])
    if pending_report:
        lines.extend(["## Awaiting confirmation", ""] + pending_report + [""])
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
    print(f"mode           : {mode}")
    print(f"events checked : {len(conferences) + len(watchlist)}")
    print(f"applied        : {len(applied)}")
    print(f"pending        : {len(pending_report)}")
    print(f"proposals      : {len(proposals)}")
    print(f"watch findings : {len(findings)}")
    print(f"failures       : {len(failures)}")
    print(f"actionable={len(proposals) + len(findings) + len(failures)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
