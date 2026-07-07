"""Weekly opportunity watch: surface buildathons, hackathons, and
challenges the community may be eligible for, propose-only.

Sources are the fetchable public surfaces (each verified live before it
entered feeds.yaml; probed-and-rejected candidates are documented there).
Candidates unseen by the state ledger are sent once to the
llm.tasks.opportunity_watch model, which filters for relevance to an
Antigua-based medical university (artificial intelligence in medicine,
health, education, or high-value general AI skill-building) and for
plausible eligibility (open globally or to international participants;
no pay-to-participate). Keeps become a GitHub issue with paste-ready
YAML skeletons for data/opportunities.yaml; nothing is ever published
without the owner verifying the official page first (the vetting bar is
documented in that file's header). The word-of-mouth stream is handled
by people: the Opportunities page invites forwarded emails.

State: data/opportunity_watch_state.json (pipeline-owned, never
hand-edit) records offered candidate URLs so each is judged exactly
once, mirroring media curation. Candidates are marked seen only after a
successful model decision, so a failed run retries next week.

Usage:
    python scripts/opportunity_watch.py                    # report to stdout
    python scripts/opportunity_watch.py --report out.md
    python scripts/opportunity_watch.py --no-state         # never write state
"""

import argparse
import json
import re
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import requests
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from aggregate import resolve_task_llm  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
STATE_PATH = REPO / "data" / "opportunity_watch_state.json"
BROWSER_UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
    )
}
STATE_RETENTION_DAYS = 180

WATCH_SYSTEM = """You screen candidate opportunities (hackathons,
buildathons, challenges, competitions) for the AI hub of a medical
university based in Antigua whose faculty and students are international.
Keep a candidate only when BOTH hold:

1. Relevance: the topic concerns artificial intelligence in medicine,
   health, or education, or is a substantial general AI building or
   skills opportunity a medical student or faculty member could
   meaningfully join (a major model-provider hackathon qualifies; a
   crypto trading contest does not).
2. Eligibility: participation is plausibly open to internationally
   based participants (online or global events qualify; events stated
   as restricted to residents or institutions of one country do not,
   unless that could include Antigua).

Drop pay-to-participate events, pure marketing contests, and anything
whose description is too vague to judge. Most candidates should be
dropped; an empty list is a normal answer. Output only a JSON object,
no prose:

{"keeps": [{"url": "URL exactly as provided in the candidate list",
  "type": "buildathon" or "hackathon" or "challenge" or "datathon" or
          "competition" or "fellowship" or "program",
  "why": "one sentence for the site owner, plain language, no em dashes"}]}"""


def fetch_devpost(url: str) -> list[dict]:
    resp = requests.get(url, headers=BROWSER_UA, timeout=25)
    resp.raise_for_status()
    candidates = []
    for h in resp.json().get("hackathons", []):
        if h.get("invite_only"):
            continue
        prize = re.sub(r"<[^>]+>", "", str(h.get("prize_amount", "")))
        loc = (h.get("displayed_location") or {}).get("location", "")
        themes = ", ".join(t.get("name", "") for t in h.get("themes", []))
        candidates.append({
            "title": h.get("title", "?"),
            "url": h.get("url", ""),
            "detail": (f"themes: {themes}; when: "
                       f"{h.get('submission_period_dates', '?')}; "
                       f"location: {loc}; prizes: {prize}; "
                       f"host: {h.get('organization_name', '?')}"),
        })
    return candidates


def fetch_grand_challenge(url: str) -> list[dict]:
    today_iso = date.today().isoformat()
    candidates = []
    offset, page_size = 0, 100
    while offset < 400:
        resp = requests.get(f"{url}?limit={page_size}&offset={offset}",
                            headers={**BROWSER_UA,
                                     "Accept": "application/json"},
                            timeout=25)
        resp.raise_for_status()
        results = resp.json().get("results", [])
        if not results:
            break
        for c in results:
            end = str(c.get("end_date") or "")[:10]
            if not end or end < today_iso:
                continue  # active or upcoming challenges only
            desc = re.sub(r"<[^>]+>", " ", str(c.get("description", "")))
            desc = re.sub(r"\s+", " ", desc).strip()[:200]
            candidates.append({
                "title": c.get("title") or c.get("slug", "?"),
                "url": c.get("url", ""),
                "detail": (f"medical AI challenge on grand-challenge.org; "
                           f"runs {str(c.get('start_date') or '?')[:10]} "
                           f"to {end}; {desc}"),
            })
        offset += page_size
    return candidates


FETCHERS = {
    "devpost": fetch_devpost,
    "grand_challenge": fetch_grand_challenge,
}


def load_state() -> dict:
    if STATE_PATH.exists():
        state = json.loads(STATE_PATH.read_text(encoding="utf-8"))
    else:
        state = {}
    state.setdefault("seen", {})
    return state


def main() -> int:
    argp = argparse.ArgumentParser(description=__doc__)
    argp.add_argument("--report", default=None)
    argp.add_argument("--no-state", action="store_true",
                      help="never write the state file")
    args = argp.parse_args()

    config = yaml.safe_load((REPO / "feeds.yaml").read_text(encoding="utf-8"))
    watch_cfg = config.get("opportunity_watch", {})
    max_candidates = int(watch_cfg.get("max_candidates", 60))
    sources = watch_cfg.get("sources", [])

    state = load_state()
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat(timespec="seconds")
    cutoff = (now - timedelta(days=STATE_RETENTION_DAYS)).isoformat()
    state["seen"] = {u: t for u, t in state["seen"].items() if t >= cutoff}

    candidates, failures = [], []
    fetched_total = sources_ok = 0
    for source in sources:
        fetcher = FETCHERS.get(source.get("kind"))
        if fetcher is None:
            failures.append(f"{source.get('name', '?')}: unknown kind "
                            f"{source.get('kind')!r}")
            continue
        try:
            found = fetcher(source["url"])
        except (requests.RequestException, ValueError, KeyError,
                json.JSONDecodeError) as exc:
            failures.append(f"{source.get('name', '?')}: "
                            f"{type(exc).__name__}: {exc}")
            continue
        sources_ok += 1
        fetched_total += len(found)
        candidates.extend(c for c in found
                          if c["url"] and c["url"] not in state["seen"])

    candidates = candidates[:max_candidates]
    by_url = {c["url"]: c for c in candidates}

    keeps, dropped_ungrounded = [], 0
    decided = False
    if candidates:
        lines = [f"- {c['title']} :: {c['detail']} :: {c['url']}"
                 for c in candidates]
        provider, call, cfg = resolve_task_llm(config, "opportunity_watch")
        if call is None:
            failures.append("screen: no LLM credentials")
        else:
            try:
                raw = call(WATCH_SYSTEM, "\n".join(lines), cfg, 120).strip()
                raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
                data = json.loads(raw)
                for keep in (data.get("keeps") or [])[:15]:
                    if keep.get("url") not in by_url:
                        dropped_ungrounded += 1
                        continue
                    keeps.append(keep)
                decided = True
            except (requests.RequestException, ValueError, KeyError,
                    json.JSONDecodeError) as exc:
                failures.append(f"screen: {type(exc).__name__}: {exc}")

    if decided and not args.no_state:
        for c in candidates:
            state["seen"][c["url"]] = now_iso
        STATE_PATH.write_text(
            json.dumps(state, indent=1, ensure_ascii=False),
            encoding="utf-8", newline="\n")

    report_lines = [
        "Weekly automated opportunity watch. Everything below is a "
        "proposal: verify each on its official page (organizer "
        "identifiable, free to enter, deadline confirmed) before adding "
        "it to `data/opportunities.yaml`; the vetting bar and field "
        "definitions are in that file's header. Support figures are "
        "always framed as organizer-stated.",
        "",
    ]
    if keeps:
        report_lines.extend(["## Proposed opportunities", ""])
        for keep in keeps:
            c = by_url[keep["url"]]
            report_lines.extend([
                f"### {c['title']}",
                "",
                f"- why: {keep.get('why', '')}",
                f"- source detail: {c['detail']}",
                "",
                "```yaml",
                f"- name: {c['title']}",
                f"  url: {c['url']}",
                "  organizer: VERIFY on the official page",
                f"  type: {keep.get('type', 'hackathon')}",
                "  format: virtual  # verify",
                "  eligibility: VERIFY",
                "  deadline: VERIFY (date, or Rolling)",
                "  start_date: VERIFY or remove",
                "  end_date: VERIFY or remove",
                '  support: "Organizer-stated: VERIFY"',
                f"  relevance: {keep.get('why', 'VERIFY')}",
                f"  verified: {date.today().isoformat()}  # set when checked",
                "```",
                "",
            ])
    if failures:
        report_lines.extend(["## Check failures", ""]
                            + [f"- {f}" for f in failures])
    report = "\n".join(report_lines)

    if args.report:
        Path(args.report).write_text(report, encoding="utf-8", newline="\n")
    else:
        print(report)

    print("\n=== verification ===")
    print(f"sources          : {len(sources)} configured, "
          f"{sources_ok} fetched ok")
    print(f"candidates       : {fetched_total} fetched, "
          f"{len(candidates)} new (unseen), sent to model: "
          f"{len(candidates) if decided else 0}")
    print(f"keeps proposed   : {len(keeps)}")
    print(f"dropped ungrounded: {dropped_ungrounded}")
    print(f"state written    : {'no (--no-state or undecided)' if (args.no_state or not decided) else f'{len(candidates)} urls marked seen'}")
    print(f"failures         : {len(failures)}")
    print(f"actionable={len(keeps) + len(failures)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
