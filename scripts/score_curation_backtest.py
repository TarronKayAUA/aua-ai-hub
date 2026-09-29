"""Score curation backtest runs against the labelled fixture, and price each version.

Reads one or more artifacts from model-compare.yml (task curation; each a curation-backtest.json made by
scripts/compare_curation_models.py), the fixture scripts/backtest/curation_2026-09.json, and its labels
scripts/backtest/curation_2026-09_labels.json. Only items replayed by every run given are scored, so runs made
on different fixture versions stay comparable.

Measures, per version, over all samples:
  set A (drops blamed on speculation) and set B (drops blamed on marketing):
    repeats the false premise   of the items whose recorded reason was factually wrong, the share it drops with
                                the same kind of reason
    keeps the should-keeps      the share of items labelled keep that it keeps
    drops the should-drops      the share of items labelled drop that it drops
    keeps borderline            reported, not scored: editors split on these
  set C (controls): agreement with the decision production made
  name rewrites the pipeline's own guard (aggregate.ungrounded_names) would reject in a kept summary or title
  cost: measured tokens at the run's recorded prices, and a monthly projection from the ledger's last 28 days

Usage (no API key needed; nothing is called):
    python scripts/score_curation_backtest.py curation-backtest.json [another-run.json ...]
"""
import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import aggregate  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
FIXTURE = REPO / "scripts" / "backtest" / "curation_2026-09.json"
LABELS = REPO / "scripts" / "backtest" / "curation_2026-09_labels.json"
SPEC = re.compile(r"non-?existent|unreleased|fictional|fabricat|does not exist|hypothetical|unconfirmed|speculat"
                  r"|rumou?r|not a real|fake|leak|unverified|not yet released|no confirmed", re.I)
MKT = re.compile(r"vendor|marketing|promotional|product's own|company's own|own channel", re.I)
PODCAST_HOSTS = ("spotify.com", "transistor.fm", "pdst.fm", "aipodcast.education", "megaphone", "simplecast",
                 "libsyn", "cognitiverevolution.ai", "ai-podcast.nejm", "latent.space")


def fit(xs, ys):
    """Least-squares a + b*x, so per-call cost splits into a fixed part and a per-candidate part."""
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx if sxx else 0.0
    return my - b * mx, b


def production_volume(days: int = 28):
    ledger = json.loads((REPO / "data" / "seen_items.json").read_text(encoding="utf-8"))
    end = max(r["first_seen"] for r in ledger["items"])
    start = (datetime.fromisoformat(end) - timedelta(days=days)).astimezone(timezone.utc).isoformat()
    recent = [r for r in ledger["items"] if start <= r["first_seen"] < end]
    runs = defaultdict(set)
    for r in recent:
        u = r["url"]
        runs[r["first_seen"]].add("videos" if "youtube.com" in u else
                                  "podcasts" if any(h in u for h in PODCAST_HOSTS) else "news")
    return sum(len(v) for v in runs.values()) / days, len(recent) / days


def pct(k, n):
    return f"{k}/{n} ({100 * k / n:.0f}%)" if n else "-"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    ap.add_argument("runs", nargs="+", help="curation-backtest.json artifacts")
    args = ap.parse_args()
    fixture = {i["id"]: i for i in json.loads(FIXTURE.read_text(encoding="utf-8"))["items"]}
    labels = json.loads(LABELS.read_text(encoding="utf-8"))["labels"]
    runs = [json.loads(Path(p).read_text(encoding="utf-8")) for p in args.runs]
    common = set(fixture)
    for r in runs:
        common &= {i for _, ids in r["batches"] for i in ids}
    arms, prices, calls = {}, {}, []
    for r in runs:
        arms.update(r["arms"])
        prices.update(r["prices_per_mtok"])
        calls += r["calls"]
    dec = defaultdict(list)          # (arm, id) -> decisions over samples
    for c in calls:
        for d in c["decisions"]:
            if d["id"] in common:
                dec[(c["arm"], d["id"])].append(d)
    calls_day, cands_day = production_volume()
    print(f"scored items: {len(common)} (replayed by every run given); versions: {len(arms)}")
    print(f"production volume, last 28 days of the ledger: {calls_day:.1f} curator calls/day, "
          f"{cands_day:.1f} candidates/day\n")
    for a, cfg in arms.items():
        print(f"=== {a} ({cfg['model']}{', effort ' + cfg['effort'] if cfg.get('effort') else ''}) ===")
        for s, bad in (("A", SPEC), ("B", MKT)):
            lab = {i: v for i, v in labels.items() if v["set"] == s and i in common}
            rep_fp = n_fp = kk = nk = dd = nd = kb = nb = 0
            for i, v in lab.items():
                ds = dec[(a, i)]
                if v["false_premise"]:
                    n_fp += len(ds)
                    rep_fp += sum(1 for d in ds if not d["keep"] and bad.search(d["reason"]))
                if v["should_keep"] == "keep":
                    nk += len(ds)
                    kk += sum(d["keep"] for d in ds)
                elif v["should_keep"] == "drop":
                    nd += len(ds)
                    dd += sum(not d["keep"] for d in ds)
                else:
                    nb += len(ds)
                    kb += sum(d["keep"] for d in ds)
            print(f"  set {s}: repeats the false premise {pct(rep_fp, n_fp)}; keeps the should-keeps {pct(kk, nk)}; "
                  f"drops the should-drops {pct(dd, nd)}; keeps borderline {pct(kb, nb)}")
        agree = n = 0
        for i in common:
            if fixture[i]["set"] == "C":
                for d in dec[(a, i)]:
                    n += 1
                    agree += d["keep"] == bool(fixture[i]["orig_kept"])
        print(f"  set C: agrees with the production decision {pct(agree, n)}")
        flagged = []
        for i in common:
            src = f"{fixture[i]['title']} {fixture[i]['summary']} {fixture[i].get('raw', '')}"
            for d in dec[(a, i)]:
                if d["keep"]:
                    for field in ("summary", "display_title"):
                        if aggregate.ungrounded_names(d.get(field, ""), src):
                            flagged.append((i, field, d.get(field, "")[:80]))
        print(f"  name rewrites the pipeline's guard would reject: {len(flagged)}")
        for f in flagged[:5]:
            print(f"      {f}")
        mine = [c for c in calls if c["arm"] == a]
        pin, pout = prices[cfg["model"]]
        xs, yin, yout = [], [], []
        stops = Counter()
        for c in mine:
            xs.append(c["n"])
            yin.append(sum((t.get("usage") or {}).get("input_tokens", 0) for t in c["attempts"]))
            yout.append(sum((t.get("usage") or {}).get("output_tokens", 0) for t in c["attempts"]))
            stops.update(t.get("stop_reason") or ("error" if t.get("error") else "none") for t in c["attempts"])
        cost = (sum(yin) * pin + sum(yout) * pout) / 1e6
        a_in, b_in = fit(xs, yin)
        a_out, b_out = fit(xs, yout)
        month = 30 * (calls_day * (a_in * pin + a_out * pout) + cands_day * (b_in * pin + b_out * pout)) / 1e6
        print(f"  calls {len(mine)}, failed {sum(1 for c in mine if not c['decisions'])}, stop reasons {dict(stops)}")
        print(f"  tokens in {sum(yin):,} out {sum(yout):,}; this backtest ${cost:.3f}; projected production "
              f"${month:.2f}/month\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
