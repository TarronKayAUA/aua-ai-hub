"""Backtest the news curator on a fixed set of past candidates.

Replays real September 2026 candidates (scripts/backtest/curation_2026-09.json) through several versions of
the curator, each a model, a prompt and an input shape, and records every decision with its token usage. A
prompt or model change is then judged on measured behavior and cost rather than on a spot check. Added
2026-09-29 after the curator, whose knowledge predates the September releases, dropped real launches as
"speculation about unreleased model" (see the knowledge-cutoff rule in prompts/curator.md).

Versions ("arms"), all on the same candidates in the same batches:
  incumbent-old   the curation model in feeds.yaml, with the curator prompt as it stood before 2026-09-29
                  (rebuilt by removing the knowledge-cutoff rule, and checked against that prompt's hash)
  incumbent-new   the curation model, with prompts/curator.md as it stands
  incumbent-long  as incumbent-new, with 400 characters of each video description instead of the 150 the
                  pipeline's video normalizer keeps
  sonnet55-low    claude-sonnet-5-5 at low effort, with prompts/curator.md

Fidelity: candidates are packed by the pipeline's own _pack_candidates with the feeds.yaml limits, news calls
carry the topic vocabularies as in curate_llm, answers go through the production parse_curator_json with the
same corrective retry, and a keep that the news call assigns to a media category counts as the drop the
pipeline makes of it. Batches hold at most 12 news items, 12 videos or 8 podcasts: September's runs offered
about 16 candidates each, so this matches production and no keep cap can force a drop.

Read-only: it never writes the ledger, a page or a data file. Every call is paid; the output records each
call's usage, and the summary prices it at the published per-token rates in PRICES.

Usage (needs ANTHROPIC_API_KEY; run it through model-compare.yml, task curation):

    python scripts/compare_curation_models.py --repeat 3 --out curation-backtest.json
"""
import argparse
import concurrent.futures as cf
import hashlib
import json
import os
import random
import sys
import threading
import time
from collections import defaultdict
from pathlib import Path
from types import SimpleNamespace

import requests
import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))

import aggregate  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
FIXTURE = REPO / "scripts" / "backtest" / "curation_2026-09.json"
# prompts/curator.md at 8514458^, the version the September drops were made under (LF line endings).
OLD_PROMPT_SHA256 = "e5665f0d52d9e36bbb5dabd5e749d76addf506dce19371744768c76e2e4e55b3"
NEW_RULE_PREFIX = "- Your knowledge of models and products has a cutoff"
# US dollars per million input and output tokens, from
# https://platform.claude.com/docs/en/about-claude/pricing (verified 2026-09-29). Thinking bills as output.
PRICES = {"claude-haiku-4-5": (1.0, 5.0), "claude-sonnet-5-5": (2.0, 10.0)}
BATCH = {"news": 12, "videos": 12, "podcasts": 8}
RETRYABLE = {429, 500, 502, 503, 504, 529}
ABORT = threading.Event()


def load_prompts() -> dict:
    new = aggregate.CURATOR_PROMPT_PATH.read_text(encoding="utf-8")
    kept = [line for line in new.split("\n") if not line.startswith(NEW_RULE_PREFIX)]
    if len(kept) != len(new.split("\n")) - 1:
        raise SystemExit("prompts/curator.md does not carry exactly one knowledge-cutoff rule line")
    old = "\n".join(kept)
    if hashlib.sha256(old.encode("utf-8")).hexdigest() != OLD_PROMPT_SHA256:
        raise SystemExit("the rebuilt pre-2026-09-29 prompt does not match its recorded hash; "
                         "prompts/curator.md has changed in some other way since, so rebuild the baseline")
    return {"old": old, "new": new}


def arms_from(config: dict) -> dict:
    incumbent = config["llm"]["tasks"]["curation"]["model"]
    return {
        "incumbent-old": dict(model=incumbent, prompt="old", video_chars=150),
        "incumbent-new": dict(model=incumbent, prompt="new", video_chars=150),
        "incumbent-long": dict(model=incumbent, prompt="new", video_chars=400),
        "sonnet55-low": dict(model="claude-sonnet-5-5", prompt="new", video_chars=150, effort="low",
                             max_tokens=16000),
    }


def batches_of(items: list, seed: int) -> list:
    """Same batches for every arm: per media type, a seeded shuffle, then fixed-size chunks."""
    out = []
    for media, size in BATCH.items():
        pool = sorted((i for i in items if i["media"] == media), key=lambda i: i["id"])
        random.Random(f"{seed}-{media}").shuffle(pool)
        out += [(media, pool[k:k + size]) for k in range(0, len(pool), size)]
    return out


def build_payload(batch: list, media: str, video_chars: int, config: dict):
    acfg = config["llm"]["anthropic"]
    objs = []
    for it in batch:
        summary = it["summary"]
        if media == "videos" and video_chars != 150:
            summary = aggregate.clean_text(it.get("raw") or "", limit=video_chars) or summary
        objs.append(SimpleNamespace(category=it["feed_category"], source=it["source"], title=it["title"],
                                    summary=summary))
    by_pos, payload = aggregate._pack_candidates(
        objs, acfg["max_payload_chars"], False, title_chars=int(acfg["candidate_title_chars"]),
        summary_chars=int(acfg["candidate_summary_chars"]))
    if len(by_pos) != len(batch):
        raise SystemExit("payload budget cut a backtest batch; the batch sizes are wrong for this budget")
    if media == "news" and config.get("topics"):
        obj = json.loads(payload)
        obj["topic_vocabularies"] = config["topics"]
        payload = json.dumps(obj, ensure_ascii=False)
    pos_to_id = {str(k): it["id"] for k, it in enumerate(batch)}
    return payload, pos_to_id


def call(arm: dict, system: str, user: str, config: dict) -> dict:
    acfg = config["llm"]["anthropic"]
    headers = {"x-api-key": os.environ["ANTHROPIC_API_KEY"], "anthropic-version": acfg["api_version"],
               "content-type": "application/json"}
    body = {"model": arm["model"], "max_tokens": int(arm.get("max_tokens", acfg.get("max_tokens", 4000))),
            "system": system, "messages": [{"role": "user", "content": user}]}
    if arm.get("effort"):
        body["output_config"] = {"effort": arm["effort"]}
    timeout = max(int(config["llm"]["request_timeout_seconds"]), 180)
    last = ""
    for attempt in range(6):
        if ABORT.is_set():
            return {"error": "aborted"}
        try:
            r = requests.post(acfg["endpoint"], headers=headers, json=body, timeout=timeout)
        except requests.RequestException as exc:
            last = f"{type(exc).__name__}: {exc}"
            time.sleep(min(60, 5 * 2 ** attempt))
            continue
        if r.status_code in RETRYABLE:
            last = f"HTTP {r.status_code}: {r.text[:200]}"
            time.sleep(min(60, 5 * 2 ** attempt))
            continue
        if r.status_code >= 400:
            return {"error": f"HTTP {r.status_code}: {r.text[:300]}", "fatal": True}
        data = r.json()
        return {"text": "".join(b.get("text", "") for b in data.get("content", []) if b.get("type") == "text"),
                "usage": data.get("usage") or {}, "stop_reason": data.get("stop_reason"),
                "stop_details": data.get("stop_details")}
    return {"error": f"gave up after 6 attempts: {last}"}


def run_job(job: dict, prompts: dict, config: dict, categories: dict) -> dict:
    arm = job["arm_cfg"]
    payload, pos_to_id = build_payload(job["batch"], job["media"], arm["video_chars"], config)
    system = prompts[arm["prompt"]]
    rec = {"arm": job["arm"], "rep": job["rep"], "batch": job["bidx"], "media": job["media"], "model": arm["model"],
           "n": len(pos_to_id), "attempts": [], "decisions": []}
    parsed = None
    for attempt, user in enumerate([payload, payload + "\n\nYour previous response was not valid JSON matching "
                                    "the contract. Respond again with only the JSON object."]):
        res = call(arm, system, user, config)
        rec["attempts"].append({k: res.get(k) for k in ("usage", "stop_reason", "stop_details", "error")})
        if res.get("error"):
            rec["error"] = res["error"]
            if res.get("fatal"):
                rec["fatal"] = True
            break
        try:
            parsed = aggregate.parse_curator_json(res["text"], set(pos_to_id), categories,
                                                  strict_coverage=(attempt == 0))
            break
        except (ValueError, KeyError, json.JSONDecodeError) as exc:
            rec["parse_error"] = f"{type(exc).__name__}: {exc}"[:300]
    if parsed is None:
        return rec
    keeps, drops = parsed
    for d in keeps:
        in_news_as_media = job["media"] == "news" and d["category"] in ("videos", "podcasts")
        rec["decisions"].append({"id": pos_to_id[d["id"]], "keep": not in_news_as_media,
                                 "reason": "(kept as media in the news call, discarded)" if in_news_as_media else "",
                                 "category": d["category"], "importance": d["importance"], "summary": d["summary"],
                                 "display_title": d["display_title"]})
    for d in drops:
        rec["decisions"].append({"id": pos_to_id[d["id"]], "keep": False, "reason": d["reason"]})
    rec.pop("parse_error", None)
    return rec


def cost_of(model: str, usage: dict) -> float:
    pin, pout = PRICES[model]
    tokens_in = (usage.get("input_tokens") or 0) + (usage.get("cache_creation_input_tokens") or 0) * 1.25 \
        + (usage.get("cache_read_input_tokens") or 0) * 0.1
    return (tokens_in * pin + (usage.get("output_tokens") or 0) * pout) / 1e6


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    ap.add_argument("--arms", nargs="*", help="arm names (default: all)")
    ap.add_argument("--repeat", type=int, default=1)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--limit", type=int, default=0, help="only the first N batches (smoke test)")
    ap.add_argument("--out", default="curation-backtest.json")
    args = ap.parse_args()

    config = yaml.safe_load((REPO / "feeds.yaml").read_text(encoding="utf-8"))
    categories = {k: v["label"] for k, v in config["categories"].items()}
    fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
    items = fixture["items"]
    prompts = load_prompts()
    arms = arms_from(config)
    chosen = args.arms or list(arms)
    unknown = [a for a in chosen if a not in arms]
    if unknown:
        raise SystemExit(f"unknown arms: {unknown}; known: {list(arms)}")
    for a in chosen:
        if arms[a]["model"] not in PRICES:
            raise SystemExit(f"no verified price for {arms[a]['model']}; add it to PRICES from the pricing page")
    batches = batches_of(items, fixture["seed"])
    if args.limit:
        batches = batches[:args.limit]
    jobs = [dict(arm=a, arm_cfg=arms[a], rep=r, bidx=b, media=m, batch=batch)
            for r in range(args.repeat) for b, (m, batch) in enumerate(batches) for a in chosen]
    n_items = sum(len(b) for _, b in batches)
    print(f"fixture: {len(items)} items ({fixture['description']})")
    arm_list = ", ".join(a + "=" + arms[a]["model"] for a in chosen)
    print(f"arms: {arm_list}; {len(batches)} batches of {n_items} items; repeat {args.repeat}; {len(jobs)} calls")

    results, fatal = [], 0
    with cf.ThreadPoolExecutor(max_workers=args.workers) as ex:
        futs = {ex.submit(run_job, j, prompts, config, categories): j for j in jobs}
        for n, f in enumerate(cf.as_completed(futs), 1):
            rec = f.result()
            results.append(rec)
            if rec.get("fatal"):
                fatal += 1
                if fatal >= 3 and not ABORT.is_set():
                    print(f"  stopping: {fatal} calls failed with a non-retryable error "
                          f"(last: {rec.get('error')}); the spend limit may be reached")
                    ABORT.set()
            if n % 25 == 0 or n == len(jobs):
                print(f"  {n}/{len(jobs)} calls done")

    # ---- summary
    by_set = {i["id"]: i["set"] for i in items}
    print("\n=== verification ===")
    total_cost = 0.0
    for a in chosen:
        recs = [r for r in results if r["arm"] == a]
        ok = [r for r in recs if r["decisions"]]
        usage = defaultdict(int)
        refusals = truncations = 0
        for r in recs:
            for at in r["attempts"]:
                for k, v in (at.get("usage") or {}).items():
                    if isinstance(v, int):
                        usage[k] += v
                refusals += at.get("stop_reason") == "refusal"
                truncations += at.get("stop_reason") == "max_tokens"
        cost = sum(cost_of(arms[a]["model"], at.get("usage") or {}) for r in recs for at in r["attempts"])
        total_cost += cost
        decided = [d for r in ok for d in r["decisions"]]
        expected = sum(r["n"] for r in recs)
        keeps = defaultdict(lambda: [0, 0])
        for d in decided:
            keeps[by_set[d["id"]]][0] += d["keep"]
            keeps[by_set[d["id"]]][1] += 1
        print(f"{a:<15} {arms[a]['model']:<18} calls {len(ok)}/{len(recs)} ok, decisions {len(decided)}/{expected}, "
              f"refusals {refusals}, truncated {truncations}, tokens in {usage['input_tokens']:,} "
              f"out {usage['output_tokens']:,}, cost ${cost:.4f}")
        print("                keeps by set: " + ", ".join(f"{s} {k}/{n}" for s, (k, n) in sorted(keeps.items())))
    print(f"total cost ${total_cost:.4f}")

    out = {"generated_by": "scripts/compare_curation_models.py", "fixture": fixture["description"],
           "arms": {a: arms[a] for a in chosen}, "prices_per_mtok": PRICES, "repeat": args.repeat,
           "batches": [[m, [i["id"] for i in b]] for m, b in batches], "calls": results}
    Path(args.out).write_text(json.dumps(out, indent=1, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {args.out}")
    return 1 if ABORT.is_set() else 0


if __name__ == "__main__":
    sys.exit(main())
