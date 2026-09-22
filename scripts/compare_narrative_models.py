"""Side-by-side model comparison for the weekly digest narrative.

The narrative is the one pipeline task where a cheaper model is a real
candidate (Opus 5.5 is 40% of Fable 5.1's per-token price) but the original
choice was editorial: dense short-form prose under a 320-word ceiling. This
harness settles that on the prose rather than the label. It rebuilds the
exact highlight set of a published digest from its archived HTML, runs the
real narrative code path over it once per model, and prints the drafts
blind, with the key at the end.

Read-only: it never writes the ledger, a docs page, or the digest feed, and
has no effect on the site. Each draft is a real paid call (roughly 5 to 15
cents on Opus 5.5 or Fable 5.1), so keep --repeat small.

Usage (needs ANTHROPIC_API_KEY; run it through model-compare.yml in CI):

    python scripts/compare_narrative_models.py \\
        --models anthropic:claude-fable-5-1 anthropic:claude-opus-5-5

Fairness: every model gets the same items in the same order and the same
fetched article text (fetches are cached for the run, so a page changing
mid-run cannot favor either draft). The server-side fallback is removed so
a refusal shows as a refusal instead of silently becoming another model's
prose. The production validator, including the name guard, still applies.
"""
import argparse
import copy
import functools
import html
import re
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))

import aggregate

DEFAULT_MODELS = [
    "anthropic:claude-fable-5-1",
    "anthropic:claude-opus-5-5",
]


def highlights_from_digest(ledger: dict, week: str | None):
    """The highlighted records of a published digest, news first, then
    videos, then podcasts, matching the order the pipeline passes them."""
    digests = ledger.get("digests", [])
    if not digests:
        raise SystemExit("no published digests in the ledger")
    entry = (next((d for d in digests if week and week.lower()
                   in d["guid"].lower()), None) if week else digests[-1])
    if entry is None:
        raise SystemExit(f"no digest matches {week!r}")
    by_url = {r["url"]: r for r in ledger["items"] if r.get("kept")}
    news, media = [], {"Videos": [], "Podcasts": []}
    for section in re.split(r"<h3>", entry["description"])[1:]:
        name = section.split("</h3>", 1)[0]
        if name == "The week in brief":
            continue
        urls = [html.unescape(u) for u in
                re.findall(r'<li><a href="([^"]+)"', section)]
        records = [by_url[u] for u in urls if u in by_url]
        missing = len(urls) - len(records)
        if missing:
            print(f"warning: {missing} {name} item(s) not in the ledger")
        media.get(name, news).extend(records)
    return entry, news + media["Videos"] + media["Podcasts"]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawTextHelpFormatter)
    ap.add_argument("--models", nargs="+", default=DEFAULT_MODELS,
                    help="provider:model pairs (anthropic only)")
    ap.add_argument("--week", help="digest guid fragment, e.g. 2026-W38 "
                    "(default: the latest published digest)")
    ap.add_argument("--repeat", type=int, default=1,
                    help="samples per model (default 1)")
    args = ap.parse_args()

    config = yaml.safe_load(aggregate.FEEDS_PATH.read_text(encoding="utf-8"))
    ledger = aggregate.load_ledger()
    entry, highlights = highlights_from_digest(ledger, args.week)
    # Same text for every draft; see the module docstring.
    aggregate.fetch_article_extract = functools.lru_cache(maxsize=None)(
        aggregate.fetch_article_extract)

    print(f"digest: {entry['title']} ({entry['guid']})")
    print(f"{len(highlights)} highlights, {len(args.models)} models, "
          f"{args.repeat} sample(s) each; drafts are labelled blind and "
          "the key is at the end\n")
    for i, r in enumerate(highlights, 1):
        print(f"  [{i}] {r['title'][:100]} ({r.get('source', '?')})")
    window = entry["title"].split(":", 1)[-1].strip()

    key, step = [], 0
    for rep in range(args.repeat):
        # Rotate positions each sample, so a label never encodes a model.
        order = args.models[step:] + args.models[:step]
        step = (step + 1) % len(args.models)
        for spec in order:
            provider, model = spec.split(":", 1)
            if provider != "anthropic":
                print(f"\nskipping {spec}: the narrative runs on anthropic only")
                continue
            label = chr(ord("A") + len(key))
            variant = copy.deepcopy(config)
            task = variant["llm"]["tasks"]["digest_narrative"]
            task["model"] = model
            for k in ("fallback_model", "usd_per_m_input", "usd_per_m_output"):
                task.pop(k, None)
            paragraphs, status = aggregate.generate_digest_narrative(
                highlights, window, variant, dry_run=False, verbose=True)
            print("\n" + "=" * 72)
            print(f"DRAFT {label}  ({status.replace(model, 'model hidden')})")
            print("=" * 72)
            if paragraphs:
                for p in paragraphs:
                    print(html.unescape(re.sub(r"<[^>]+>", "", p)) + "\n")
            else:
                print("(no draft)")
            key.append((label, spec, status))

    print("\n" + "=" * 72 + "\nKEY\n" + "=" * 72)
    for label, spec, status in key:
        print(f"  {label}: {spec}  |  {status}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
