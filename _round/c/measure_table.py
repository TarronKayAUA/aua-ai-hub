"""Space round: before/after table from two _round/measure.py runs.

  python _round/c/measure_table.py <before metrics.json> <after metrics.json>

Per page type (the data-page-type the build stamps on <body>): pages, mean
blank share per screen at 1920 and 1440, and characters per line of running
text (median of the pages' medians, highest p90, highest max, at 1920).
Prints Markdown. Pages whose type changed between the runs are counted
under their type in each run.
"""
import json
import statistics
import sys


def table(path):
    m = json.load(open(path, encoding="utf-8"))
    by = {}
    for page, r in m.items():
        if "error" in r:
            continue
        t = r.get("type") or "other"
        d = by.setdefault(t, {"n": 0, "b19": [], "b14": [], "med": [], "p90": [], "max": []})
        d["n"] += 1
        d["b19"].append(r["1920"]["blank_mean"])
        d["b14"].append(r["1440"]["blank_mean"])
        c = r["1920"]["cpl"] or {}
        if c:
            d["med"].append(c["median"])
            d["p90"].append(c["p90"])
            d["max"].append(max(c["max"], (r["1440"]["cpl"] or {}).get("max", 0)))
    return by


def fmt(d):
    mean = lambda xs: f"{sum(xs) / len(xs):.0%}" if xs else "-"
    med = f"{statistics.median(d['med']):.0f}" if d["med"] else "-"
    return (f"{d['n']} | {mean(d['b19'])} | {mean(d['b14'])} | {med} | "
            f"{max(d['p90']) if d['p90'] else '-'} | {max(d['max']) if d['max'] else '-'}")


def main(before, after):
    b, a = table(before), table(after)
    print("| Page type | Before: pages, blank 1920, blank 1440, cpl median, p90 max, max | "
          "After: pages, blank 1920, blank 1440, cpl median, p90 max, max |")
    print("|---|---|---|")
    for t in sorted(set(b) | set(a)):
        print(f"| {t} | {fmt(b[t]) if t in b else '-'} | {fmt(a[t]) if t in a else '-'} |")
    allb = {"n": 0, "b19": [], "b14": [], "med": [], "p90": [], "max": []}
    alla = {k: (0 if k == "n" else []) for k in allb}
    for src, dst in ((b, allb), (a, alla)):
        for d in src.values():
            dst["n"] += d["n"]
            for k in ("b19", "b14", "med", "p90", "max"):
                dst[k] += d[k]
    print(f"| all | {fmt(allb)} | {fmt(alla)} |")


if __name__ == "__main__":
    main(*sys.argv[1:3])
