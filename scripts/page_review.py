"""Prose page review: census-derived freshness budgets for evergreen pages.

Owner approved 2026-07-08. The site's data files are re-verified weekly by
the watch workflows, but hand-authored prose (guides, playbooks, pathway
modules) had no staleness detection. This module gives every enrolled page
a review budget computed from its own volatile-claim census, so review
frequency follows measured decay instead of preset tiers:

    budget_days = 30 * target_expected_drift / sum(N_class * lambda_class)

clamped to [floor_days, cap_days]. The cold-start lambdas in feeds.yaml
come from one month of observed drift (content-watch proposal rates, the
research-page Scopus rewrite); every review appends to the drift ledger in
data/page_review_state.json so the rates can be re-estimated from
observation as history accumulates.

Enrollment is explicit: a page carrying a `last_reviewed` front-matter key
is in the system, everything else is ignored. Generated pages and the
governance section are never enrolled (the policy is verbatim
institutional text and stays human-only). An optional `review_by` key
forces a review on a known date regardless of budget, for claims with
scheduled expirations.

A clean machine review bumps the page's `last_reviewed` line, the ONLY
edit this module ever makes to a page (the same single-field exception
content-watch has for tools.yaml). Drifted findings never edit prose:
they must persist across two consecutive reviews (the conference-watch
stability gate) and then escalate to a human as an issue item quoting the
exact sentences.

Run through scripts/content_watch.py; not a standalone entry point.
"""

import json
import re
from datetime import date, timedelta
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
DOCS = REPO / "docs"
STATE_PATH = REPO / "data" / "page_review_state.json"

# Directories whose pages are pipeline-generated or human-only; never
# enrolled even if a last_reviewed key appears by accident.
EXCLUDED_DIRS = ("news", "governance", "announcements")

# Volatile-claim classes. Named models, parameter/context figures, and
# prices decay fastest; phrasings anchored to the time of writing decay
# by definition; directory tool names are matched separately against the
# live rosters so the census follows the directory as it grows.
MODEL_PRICE_PAT = re.compile(
    r"\b(GPT[- ]?[0-9o][\w.\-]*|Claude(?: [A-Z][a-z]+)? ?\d[\w.]*"
    r"|Gemini ?\d[\w.]*|Llama ?\d[\w.]*|Qwen[\w.\-]*\d[\w.]*"
    r"|DeepSeek[\w.\-]*|Grok ?\d[\w.]*|Sonnet ?\d[\w.]*|Opus ?\d[\w.]*"
    r"|Haiku ?\d[\w.]*|\$\d[\d,.]*|\d+ ?GB/s|\d{2,}B\b"
    r"|\d+k (?:tokens?|context))")
DATED_PAT = re.compile(
    r"([Aa]s of [A-Z][a-z]+ 20\d\d|[Cc]urrently|[Aa]t the time of writing"
    r"|in (?:early|mid|late) 20\d\d|20\d\d pricing)")

PAGE_REVIEW_SYSTEM = """You review one page of an artificial intelligence
reference site for a medical school for factual staleness. You receive
the page's text, today's date, and text fetched today from the official
pages of tools the page mentions. Identify the page's externally
checkable factual claims (tool capabilities, licensing, prices, model or
version names, dates, availability) and judge each. Only the PAGE
section contains claims to review; the TOOL sections are evidence for
judging them, never sources of claims, and every quote must be copied
from the PAGE section. Judge claims about a
tool only against that tool's fetched page text; judge other claims
against your general knowledge, answering "drifted" only when you are
confident the world has changed, and "unverifiable" whenever unsure.
Editorial judgments, pedagogy, worked examples, and instructions are not
claims; skip them. Most reviews find nothing drifted: that is the
expected answer, not a failure. Output only a JSON object, no prose, no
em dashes in any string:

{"claims": [{"quote": "short exact excerpt from the page",
  "verdict": "current" or "drifted" or "unverifiable",
  "evidence": "one short sentence; required when drifted"}]}"""


def parse_front_matter(text: str) -> tuple[dict, str]:
    """Return (meta, body). Meta is {} when there is no front matter."""
    m = re.match(r"\A---\n(.*?)\n---\n", text, flags=re.S)
    if not m:
        return {}, text
    meta = yaml.safe_load(m.group(1)) or {}
    return (meta if isinstance(meta, dict) else {}), text[m.end():]


def census_page(body: str, roster_names: list[str]) -> dict:
    """Count volatile claims by class. Tool mentions are word-boundary,
    case-sensitive matches of live directory names, so a page's budget
    tightens automatically when it starts naming more directory tools."""
    mentioned = [n for n in roster_names
                 if re.search(rf"(?<![\w-]){re.escape(n)}(?![\w-])", body)]
    return {
        "model_price": len(MODEL_PRICE_PAT.findall(body)),
        "dated_phrase": len(DATED_PAT.findall(body)),
        "tool_mention": len(mentioned),
        "tools": mentioned,
    }


def budget_days(census: dict, cfg: dict) -> int:
    lambdas = cfg.get("lambda_per_month", {})
    monthly_drift = sum(census.get(cls, 0) * float(rate)
                       for cls, rate in lambdas.items())
    floor = int(cfg.get("floor_days", 45))
    cap = int(cfg.get("cap_days", 365))
    if monthly_drift <= 0:
        return cap
    days = 30.0 * float(cfg.get("target_expected_drift", 0.5)) / monthly_drift
    return max(floor, min(cap, round(days)))


def enrolled_pages() -> list[dict]:
    """Every docs page opted in via a last_reviewed front-matter key."""
    pages = []
    for path in sorted(DOCS.rglob("*.md")):
        rel = path.relative_to(DOCS)
        if rel.parts and rel.parts[0] in EXCLUDED_DIRS:
            continue
        meta, body = parse_front_matter(path.read_text(encoding="utf-8"))
        if "last_reviewed" not in meta:
            continue
        pages.append({"path": path, "rel": str(rel).replace("\\", "/"),
                      "meta": meta, "body": body})
    return pages


def due_date(page: dict, cfg: dict, roster_names: list[str]) -> date:
    census = census_page(page["body"], roster_names)
    page["census"] = census
    budget = budget_days(census, cfg)
    page["budget_days"] = budget
    last = date.fromisoformat(str(page["meta"]["last_reviewed"]))
    due = last + timedelta(days=budget)
    review_by = page["meta"].get("review_by")
    if review_by:
        due = min(due, date.fromisoformat(str(review_by)))
    return due


def bump_page_reviewed(path: Path, today_iso: str) -> None:
    """Surgical single-line edit of the front-matter last_reviewed date,
    the only page write this module performs. Raises unless the key is
    found exactly once in the front-matter block and the result re-parses
    with the new date."""
    text = path.read_text(encoding="utf-8")
    m = re.match(r"\A---\n(.*?)\n---\n", text, flags=re.S)
    if not m:
        raise ValueError(f"{path.name}: no front matter")
    block = m.group(1)
    hits = re.findall(r"^last_reviewed:.*$", block, flags=re.M)
    if len(hits) != 1:
        raise ValueError(f"{path.name}: last_reviewed found {len(hits)} times")
    new_block = re.sub(r"^last_reviewed:.*$",
                       f"last_reviewed: {today_iso}", block, flags=re.M)
    new_text = f"---\n{new_block}\n---\n" + text[m.end():]
    meta, _ = parse_front_matter(new_text)
    if str(meta.get("last_reviewed")) != today_iso:
        raise ValueError(f"{path.name}: post-edit verification failed")
    path.write_text(new_text, encoding="utf-8", newline="\n")


def load_state() -> dict:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    return {"pages": {}, "ledger": {"reviews": 0, "claims_checked": 0,
                                    "drifted": 0, "unverifiable": 0}}


def save_state(state: dict) -> None:
    STATE_PATH.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n",
                          encoding="utf-8", newline="\n")


def build_mention_map(roster_names: list[str]) -> dict[str, list[str]]:
    """Directory entry name -> enrolled prose pages naming it. Lets the
    roster watches flag, in the same issue item, which prose pages need a
    recheck when an entry's facts move (drift caught the week it happens,
    instead of waiting out the page's budget)."""
    mention_map: dict[str, list[str]] = {}
    for page in enrolled_pages():
        for name in census_page(page["body"], roster_names)["tools"]:
            mention_map.setdefault(name, []).append(page["rel"])
    return mention_map


def run_page_review(config: dict, tools: list[dict], models: list[dict],
                    call_task, strip_page, no_bump: bool,
                    force_page: str | None, today: date) -> dict:
    """One weekly pass: review due pages (or one forced page), bump clean
    ones, hold first-time drift for confirmation, escalate second-time
    drift. Returns report fragments and verification counts."""
    cfg = (config.get("content_watch", {}) or {}).get("page_review", {})
    out_off = {"bumped": [], "held": [], "escalations": [], "failures": [],
               "enrolled": 0, "due": 0, "reviewed": 0, "notes": []}
    # Kill switch, consistent with the other autonomy features. A forced
    # review still runs (it is an explicit human request).
    if str(cfg.get("mode", "auto")).lower() == "off" and not force_page:
        return out_off
    roster_names = ([t["name"] for t in tools] + [m["name"] for m in models])
    by_url = {t["name"]: (t.get("verify_url") or t.get("url"))
              for t in tools if t.get("verify") != "skip"}
    today_iso = today.isoformat()
    state = load_state()
    out = {"bumped": [], "held": [], "escalations": [], "failures": [],
           "enrolled": 0, "due": 0, "reviewed": 0, "notes": []}

    pages = enrolled_pages()
    out["enrolled"] = len(pages)
    due = []
    for page in pages:
        when = due_date(page, cfg, roster_names)
        if force_page:
            if page["rel"] == force_page.replace("\\", "/"):
                due = [(when, page)]
                break
        elif when <= today:
            due.append((when, page))
    due.sort(key=lambda pair: pair[0])
    out["due"] = len(due)
    batch = due[:int(cfg.get("max_pages_per_run", 3))]

    for _, page in batch:
        rel = page["rel"]
        # Ground tool claims in pages fetched today, capped to keep the
        # payload bounded; the model judges the rest from knowledge.
        fetched = []
        for name in page["census"]["tools"][:int(cfg.get("max_tool_pages", 4))]:
            url = by_url.get(name)
            if not url:
                continue
            try:
                text = strip_page(url, int(cfg.get("tool_page_chars", 3000)))
                fetched.append(f"TOOL: {name}\nPAGE TEXT TODAY: {text}")
            except Exception as exc:  # noqa: BLE001 - fetch is best-effort
                out["failures"].append(
                    f"{rel}: fetch {name}: {type(exc).__name__}")
        user = (f"TODAY: {today_iso}\n\nPAGE ({rel}):\n"
                + page["body"][:int(cfg.get("page_chars", 12000))]
                + ("\n\n" + "\n\n".join(fetched) if fetched else ""))
        try:
            data = call_task(config, "page_review", PAGE_REVIEW_SYSTEM, user)
            claims = data.get("claims") or []
        except Exception as exc:  # noqa: BLE001 - reported, never fatal
            out["failures"].append(f"{rel}: review {type(exc).__name__}: {exc}")
            continue
        out["reviewed"] += 1
        if force_page:
            for c in claims:
                out["notes"].append(
                    f"{c.get('verdict', '?'):12} {c.get('quote', '')[:90]}"
                    + (f" | {c.get('evidence', '')}"
                       if c.get("verdict") == "drifted" else ""))

        drifted = [c for c in claims if c.get("verdict") == "drifted"]
        ledger = state["ledger"]
        ledger["reviews"] += 1
        ledger["claims_checked"] += len(claims)
        ledger["drifted"] += len(drifted)
        ledger["unverifiable"] += sum(
            1 for c in claims if c.get("verdict") == "unverifiable")
        page_state = state["pages"].setdefault(rel, {})
        page_state.update({"last_run": today_iso,
                           "claims_checked": len(claims),
                           "budget_days": page["budget_days"]})

        if not drifted:
            page_state.pop("pending_since", None)
            page_state["last_result"] = "clean"
            if not no_bump:
                try:
                    bump_page_reviewed(page["path"], today_iso)
                    out["bumped"].append(
                        f"{rel} (next due in {page['budget_days']} days)")
                except (ValueError, OSError) as exc:
                    out["failures"].append(f"{rel}: bump {exc}")
        elif page_state.get("pending_since"):
            page_state.pop("pending_since", None)
            page_state["last_result"] = "escalated"
            findings = "\n".join(
                f"  - \"{c.get('quote', '')[:200]}\": {c.get('evidence', '')}"
                for c in drifted[:8])
            out["escalations"].append(
                f"### {rel} (page review: {len(drifted)} claim(s) drifted, "
                f"confirmed on two consecutive reviews)\n{findings}\n"
                f"  - after correcting the page, set its last_reviewed "
                f"front matter to the day you verified it")
        else:
            page_state["pending_since"] = today_iso
            page_state["last_result"] = "held"
            out["held"].append(f"{rel} ({len(drifted)} claim(s), "
                               "held for confirmation next run)")

    if not no_bump:
        save_state(state)
    return out
