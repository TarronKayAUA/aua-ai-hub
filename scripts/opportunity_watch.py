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
from aggregate import remove_dashes, resolve_task_llm  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
STATE_PATH = REPO / "data" / "opportunity_watch_state.json"
OPPORTUNITIES_PATH = REPO / "data" / "opportunities.yaml"

# Tiered autonomy (owner approved 2026-07-08): keeps hosted on managed
# platforms, where the platform itself vets organizers, may be applied
# automatically when every mechanical gate passes; keeps on unknown
# domains are always proposals. feeds.yaml `opportunity_watch.mode:
# propose` is the kill switch that returns everything to proposals.
MANAGED_HOST_SUFFIXES = ("devpost.com", "grand-challenge.org")
ALLOWED_TYPES = {"buildathon", "hackathon", "challenge", "datathon",
                 "competition", "fellowship", "program"}
ALLOWED_FORMATS = {"virtual", "hybrid", "in_person"}
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

GATE_SYSTEM = """You verify one candidate opportunity against text
fetched today from its own page, for automated listing on a university
site. Judge only from the page text; answer "unknown" whenever the text
is insufficient. Output only a JSON object, no prose, no em dashes in
any string:

{"page_matches": true or false (the page is about this opportunity and
  it is currently open or upcoming, not a concluded edition),
 "organizer": "who runs it, as named on the page" or "unknown",
 "free_entry": true or false or "unknown",
 "deadline": "YYYY-MM-DD" or "rolling" or "unknown",
 "start_date": "YYYY-MM-DD" or null,
 "end_date": "YYYY-MM-DD" or null,
 "eligibility": "one line: who may take part" or "unknown",
 "format": "virtual" or "hybrid" or "in_person" or "unknown",
 "support": "one line of organizer-stated prizes or support" or null}"""


def strip_page(url: str, page_chars: int = 9000) -> str:
    resp = requests.get(url, headers=BROWSER_UA, timeout=25)
    resp.raise_for_status()
    text = re.sub(r"<script.*?</script>|<style.*?</style>", " ", resp.text,
                  flags=re.S | re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text)[:page_chars]


def is_managed_host(url: str) -> bool:
    host = re.sub(r"^https?://", "", url).split("/")[0].lower()
    return any(host == s or host.endswith("." + s)
               for s in MANAGED_HOST_SUFFIXES)


def check_gates(keep: dict, verdict: dict, existing_names: set,
                title: str) -> list[str]:
    """Return the list of failed gates; empty means auto-apply."""
    failed = []
    if verdict.get("page_matches") is not True:
        failed.append("page does not confirm a current opportunity")
    organizer = verdict.get("organizer")
    if not organizer or organizer == "unknown":
        failed.append("organizer not named on the page")
    if verdict.get("free_entry") is not True:
        failed.append("free entry not confirmed")
    deadline = str(verdict.get("deadline") or "unknown").strip().lower()
    if deadline == "rolling":
        pass
    elif re.fullmatch(r"\d{4}-\d{2}-\d{2}", deadline):
        if deadline < date.today().isoformat():
            failed.append("deadline already passed")
    else:
        failed.append("deadline not confirmed on the page")
    if keep.get("type") not in ALLOWED_TYPES:
        failed.append(f"unknown type {keep.get('type')!r}")
    fmt = verdict.get("format")
    if fmt not in ALLOWED_FORMATS:
        failed.append("format not confirmed")
    for field in ("start_date", "end_date"):
        v = verdict.get(field)
        if v is not None and not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(v)):
            failed.append(f"{field} not a plain date")
    if title.lower() in existing_names:
        failed.append("already listed")
    return failed


def build_entry_yaml(title: str, url: str, keep: dict, verdict: dict,
                     today_iso: str) -> str:
    """Render one opportunities.yaml entry with an auto-verified comment.
    Every string is dash-scrubbed to hold the site style in generated
    copy."""
    def clean(text: str) -> str:
        return remove_dashes(" ".join(str(text).split()))

    deadline = str(verdict["deadline"]).strip()
    deadline_out = ("Rolling" if deadline.lower() == "rolling"
                    else deadline)
    support = verdict.get("support")
    lines = [
        f"# Auto-verified {today_iso} from the official page (managed "
        "platform; gates: current, organizer named, free entry, "
        "deadline confirmed).",
        f"- name: {clean(title)}",
        f"  url: {url}",
        f"  organizer: {clean(verdict['organizer'])}",
        f"  type: {keep['type']}",
        f"  format: {verdict['format']}",
        f"  eligibility: {clean(verdict['eligibility'])}",
        f"  deadline: {deadline_out}",
    ]
    if verdict.get("start_date"):
        lines.append(f"  start_date: {verdict['start_date']}")
    if verdict.get("end_date"):
        lines.append(f"  end_date: {verdict['end_date']}")
    if support:
        support_clean = clean(support)
        if not support_clean.lower().startswith("organizer-stated"):
            support_clean = f"Organizer-stated: {support_clean}"
        lines.append(f'  support: "{support_clean}"')
    lines.append(f"  relevance: {clean(keep.get('why', ''))}")
    lines.append(f"  verified: {today_iso}")
    return "\n".join(lines)


def append_opportunity(entry_yaml: str, entry_name: str) -> None:
    """Append the entry, then prove the file still parses and the entry
    landed exactly once; restore on any failure."""
    original = OPPORTUNITIES_PATH.read_text(encoding="utf-8")
    updated = original.rstrip("\n") + "\n\n" + entry_yaml + "\n"
    parsed = yaml.safe_load(updated)
    names = [e["name"] for e in parsed]
    if names.count(entry_name) != 1:
        raise ValueError(f"entry {entry_name!r} would appear "
                         f"{names.count(entry_name)} times")
    required = ("name", "url", "organizer", "type", "format",
                "eligibility", "deadline", "relevance", "verified")
    new_entry = next(e for e in parsed if e["name"] == entry_name)
    for field in required:
        if not new_entry.get(field):
            raise ValueError(f"auto entry missing {field!r}")
    OPPORTUNITIES_PATH.write_text(updated, encoding="utf-8", newline="\n")


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
    # Grand Challenge keeps concluded editions open for leaderboard
    # submissions for years (SynthRAD2025's leaderboard runs to 2030),
    # so a future end_date does not mean a current opportunity. Require
    # a start date within the last ~13 months or in the future, which
    # keeps current and upcoming editions and drops leaderboard-only
    # zombies (first-run lesson, 2026-07-07).
    start_cutoff = (date.today() - timedelta(days=400)).isoformat()
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
            start = str(c.get("start_date") or "")[:10]
            if not start or start < start_cutoff:
                continue  # concluded edition, leaderboard-only
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

    # Tiered autonomy: gate-verify keeps from managed platforms and apply
    # the passers; everything else stays a proposal.
    mode = str(watch_cfg.get("mode", "propose")).lower()
    today_iso = date.today().isoformat()
    applied, proposals = [], []
    gate_call = gate_cfg = None
    if keeps and mode == "auto" and not args.no_state:
        _, gate_call, gate_cfg = resolve_task_llm(config, "gate_verify")
    existing_names = set()
    if OPPORTUNITIES_PATH.exists():
        existing_names = {
            str(e["name"]).lower()
            for e in yaml.safe_load(
                OPPORTUNITIES_PATH.read_text(encoding="utf-8"))
        }
    for keep in keeps:
        c = by_url[keep["url"]]
        if gate_call is None or not is_managed_host(keep["url"]):
            proposals.append((keep, None))
            continue
        try:
            page = strip_page(keep["url"])
            raw = gate_call(
                GATE_SYSTEM,
                (f"OPPORTUNITY: {c['title']}\nURL: {keep['url']}\n"
                 f"SOURCE DETAIL: {c['detail']}\nPAGE TEXT: {page}"),
                gate_cfg, 120).strip()
            raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
            verdict = json.loads(raw)
        except (requests.RequestException, ValueError, KeyError,
                json.JSONDecodeError) as exc:
            proposals.append(
                (keep, f"gate check errored ({type(exc).__name__}), "
                       "left as a proposal"))
            continue
        failed = check_gates(keep, verdict, existing_names, c["title"])
        if failed:
            proposals.append((keep, "gates failed: " + "; ".join(failed)))
            continue
        try:
            entry_yaml = build_entry_yaml(c["title"], keep["url"], keep,
                                          verdict, today_iso)
            clean_name = remove_dashes(" ".join(str(c["title"]).split()))
            append_opportunity(entry_yaml, clean_name)
            existing_names.add(clean_name.lower())
            applied.append((clean_name, keep["url"]))
        except (ValueError, OSError) as exc:
            failures.append(f"apply {c['title'][:50]}: {exc}")

    report_lines = [
        "Weekly automated opportunity watch. Gate-passing finds from "
        "managed platforms were applied to `data/opportunities.yaml` "
        "with auto-verified comments (they reach the live page on the "
        "next site build); everything under Proposals needs a human "
        "check against the official page before listing. The vetting "
        "bar and field definitions are in the data file's header.",
        "",
    ]
    if applied:
        report_lines.extend(["## Auto-applied", ""])
        for name, url in applied:
            report_lines.append(f"- [{name}]({url})")
        report_lines.append("")
    if proposals:
        report_lines.extend(["## Proposed opportunities", ""])
        for keep, note in proposals:
            c = by_url[keep["url"]]
            report_lines.extend([
                f"### {c['title']}",
                "",
            ])
            if note:
                report_lines.extend([f"_{note}_", ""])
            report_lines.extend([
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
    print(f"mode             : {mode}")
    print(f"keeps            : {len(keeps)} "
          f"({len(applied)} auto-applied, {len(proposals)} proposed)")
    print(f"dropped ungrounded: {dropped_ungrounded}")
    print(f"state written    : {'no (--no-state or undecided)' if (args.no_state or not decided) else f'{len(candidates)} urls marked seen'}")
    print(f"failures         : {len(failures)}")
    print(f"actionable={len(proposals) + len(failures)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
