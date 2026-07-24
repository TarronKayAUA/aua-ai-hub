"""Side-by-side model comparison for the news section briefs.

Runs the real brief prompt over the real current item sets against two or
more models and prints the results blind, so a choice is made on the prose
rather than on the label. Read-only: it never touches data/seen_items.json,
never writes a docs page, and has no effect on the site.

Usage (needs GITHUB_TOKEN for github models, ANTHROPIC_API_KEY for claude):

    python scripts/compare_brief_models.py
    python scripts/compare_brief_models.py --models anthropic:claude-opus-5 \
        github:openai/gpt-4.1 --category general_ai

Each candidate is scored against the same contract the pipeline enforces
(word bounds, reference count and validity, two-paragraph structure), so a
model that writes beautifully but breaks the contract is visible as such.
"""
import argparse
import os
import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))

import aggregate  # noqa: E402

DEFAULT_MODELS = [
    "github:openai/gpt-4.1",
    "anthropic:claude-haiku-4-5",
    "anthropic:claude-opus-5",
]


def build_payload(config, ledger, cat_key, label):
    """Reproduce exactly what update_section_briefs sends, so the comparison
    is of models rather than of prompts."""
    cfg = config["llm"]["briefs"]
    exclude = cfg.get("exclude_domains", [])
    records = aggregate.kept_records(ledger, cat_key)[:aggregate.PAGE_ITEMS]
    eligible = [r for r in records
                if not any(d in r.get("url", "") for d in exclude)]
    if len(eligible) < 3:
        return None, eligible
    items_block = "\n".join(
        f"{i}. {r['title']} ({r.get('source', '?')}): {r.get('summary', '')}"
        for i, r in enumerate(eligible, 1)
    )
    tallies = {}
    for r in eligible:
        t = r.get("topic") or "Other"
        tallies[t] = tallies.get(t, 0) + 1
    topic_counts = ", ".join(f"{t}: {n}" for t, n in
                             sorted(tallies.items(), key=lambda kv: -kv[1]))
    template = aggregate.SECTION_BRIEF_PROMPT_PATH.read_text(encoding="utf-8")
    return template.format(label=label, items=items_block,
                           topic_counts=topic_counts), eligible


def validate(text, eligible):
    """The pipeline's own acceptance checks, reported rather than raised."""
    refs = [int(n) for n in re.findall(r"\[(\d+)\]", text)]
    words = len(re.sub(r"\[\d+\]", "", text).split())
    problems = []
    if not 2 <= len(refs) <= 6:
        problems.append(f"reference count {len(refs)} outside 2 to 6")
    if any(not 1 <= n <= len(eligible) for n in refs):
        problems.append("references a nonexistent item")
    if not 60 <= words <= 200:
        problems.append(f"word count {words} outside 60 to 200")
    if "\n\n" not in text:
        problems.append("not two paragraphs")
    if "Also this week:" not in text:
        problems.append("missing the 'Also this week:' opener")
    return words, len(set(refs)), problems


def run_model(spec, config, prompt, timeout):
    provider, _, model = spec.partition(":")
    if provider == "anthropic":
        if not os.environ.get("ANTHROPIC_API_KEY"):
            return None, "no ANTHROPIC_API_KEY in the environment"
        cfg = dict(config["llm"]["anthropic"])
        cfg["model"] = model
        cfg.pop("fallback_model", None)
        cfg["max_tokens"] = 4000
        call = aggregate.call_anthropic
    elif provider == "github":
        if not os.environ.get("GITHUB_TOKEN"):
            return None, "no GITHUB_TOKEN in the environment"
        cfg = dict(config["llm"]["github_models"])
        cfg["model"] = model
        call = aggregate.call_github_models
    else:
        return None, f"unknown provider {provider!r}"
    try:
        raw = call("Follow the instructions in the message exactly.",
                   prompt, cfg, timeout)
        return aggregate._brief_sanitize(raw), None
    except Exception as exc:                       # noqa: BLE001
        return None, f"{type(exc).__name__}: {exc}"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--models", nargs="+", default=DEFAULT_MODELS,
                    help="provider:model pairs")
    ap.add_argument("--category", help="limit to one news category key")
    args = ap.parse_args()

    config = yaml.safe_load(
        aggregate.FEEDS_PATH.read_text(encoding="utf-8"))
    ledger = aggregate.load_ledger()
    categories = config["categories"]
    timeout = config["llm"].get("request_timeout_seconds", 90)

    print(f"comparing {len(args.models)} models on the live brief payload")
    print("candidates are labelled blind; the key is at the end\n")

    key_lines = []
    for idx, (cat_key, cat) in enumerate(categories.items()):
        if args.category and cat_key != args.category:
            continue
        # feeds.yaml maps each category to {label, feeds}, not to a string.
        label = cat["label"] if isinstance(cat, dict) else cat
        prompt, eligible = build_payload(config, ledger, cat_key, label)
        print("=" * 72)
        print(f"{label}  ({len(eligible)} eligible items)")
        print("=" * 72)
        if prompt is None:
            print("  skipped: fewer than 3 eligible items\n")
            continue
        # Rotate the blind labels per category so position never encodes
        # the model across the whole report.
        order = args.models[idx % len(args.models):] + \
            args.models[:idx % len(args.models)]
        for slot, spec in enumerate(order):
            tag = chr(ord("A") + slot)
            text, err = run_model(spec, config, prompt, timeout)
            key_lines.append(f"  {label} / {tag} = {spec}")
            print(f"\n--- candidate {tag} ---")
            if err:
                print(f"  FAILED: {err}")
                continue
            words, links, problems = validate(text, eligible)
            verdict = "contract ok" if not problems else \
                "CONTRACT FAILURES: " + "; ".join(problems)
            print(f"  [{words} words, {links} linked references, {verdict}]\n")
            print(text)
        print()

    print("=" * 72)
    print("KEY")
    print("=" * 72)
    for line in key_lines:
        print(line)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
