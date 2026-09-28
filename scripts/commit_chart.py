"""Redraw "Every commit to this site, by day" in docs/worked-examples/this-site.md (authoring only).

The chart was first drawn on 2026-09-03 by a one-off script that was never kept; this is that
script's geometry, recovered and checked byte for byte against the published chart, so the chart
can be brought up to date without rediscovering it (2026-09-28).

Counting rules, which reproduce the article's first numbers exactly (658 commits, 419 automated,
239 by the owner, 180 crediting an AI co-author, 396 news refreshes, June 9 to September 3):
  commits        every commit reachable from main (git rev-list --count; merges included)
  automated      the author name contains "github-actions"; every other commit is the owner's
  AI co-author   the message contains "Co-Authored-By: Claude" (case-sensitive)
  news refresh   the message contains "chore(news): refresh" (any author)
  day            the author date in the commit's own recorded offset (git --date=short)
Every calendar day from the first commit to the last gets a bar slot, zero days included.

usage:  python scripts/commit_chart.py            print the numbers the table and captions quote
        python scripts/commit_chart.py --write    also replace the chart's SVG and month axis
The table, the chart's hidden description, its legend and the caption are prose: update them by
hand from the printed numbers. The commit that updates the chart is not itself counted.
"""
import datetime as dt
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ARTICLE = ROOT / "docs" / "worked-examples" / "this-site.md"
X0, X1, BASE, TOP = 44.0, 646.0, 172.0, 34.0   # the 2026-09-03 geometry (viewBox 40 28 610 148)


def commits():
    sep, end = "\x1f", "\x1e"
    out = subprocess.run(["git", "log", "main", "--date=short", f"--format=%H{sep}%ad{sep}%an{sep}%B{end}"],
                         cwd=ROOT, capture_output=True, text=True, encoding="utf-8", check=True).stdout
    rows = []
    for rec in out.split(end):
        rec = rec.strip("\n")
        if not rec:
            continue
        sha, day, author, body = rec.split(sep, 3)
        rows.append(dict(sha=sha, day=day, bot="github-actions" in author,
                         coauth="Co-Authored-By: Claude" in body, news="chore(news): refresh" in body))
    return rows


def daily(rows):
    first = dt.date.fromisoformat(min(r["day"] for r in rows))
    last = dt.date.fromisoformat(max(r["day"] for r in rows))
    days = {(first + dt.timedelta(i)).isoformat(): [0, 0] for i in range((last - first).days + 1)}
    for r in rows:
        days[r["day"]][0 if r["bot"] else 1] += 1
    return [dict(date=d, automated=v[0], human=v[1]) for d, v in days.items()]


def draw(series):
    n = len(series)
    step = (X1 - X0) / n
    bw = max(2.6, step * 0.74)
    peak = max(s["automated"] + s["human"] for s in series)
    scale = (BASE - TOP) / peak
    bars = []
    for i, s in enumerate(series):
        bot, hum = s["automated"], s["human"]
        x = X0 + i * step + (step - bw) / 2
        if bot:
            h = bot * scale
            bars.append(f'<rect x="{x:.1f}" y="{BASE - h:.1f}" width="{bw:.1f}" height="{h:.1f}" fill="var(--md-default-fg-color--light)" opacity="0.5"/>')
        if hum:
            h = hum * scale
            bars.append(f'<rect x="{x:.1f}" y="{BASE - bot * scale - h:.1f}" width="{bw:.1f}" height="{h:.1f}" fill="var(--md-primary-fg-color)"/>')
    line = '<line x1="{:g}" y1="{:g}" x2="{:g}" y2="{:g}" stroke="var(--md-default-fg-color--light)" stroke-width="1" vector-effect="non-scaling-stroke"/>'
    lines, ticks = [line.format(X0, BASE, X1, BASE)], []
    for i, s in enumerate(series):
        if i == 0 or s["date"].endswith("-01"):
            x = float(f"{X0 + i * step + step / 2:.1f}")
            lines.append(line.format(x, BASE, x, BASE + 4))
            ticks.append((x, dt.date.fromisoformat(s["date"]).strftime("%b")))
    svg = ('<svg viewBox="40 28 610 148" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" '
           'aria-hidden="true" focusable="false">' + "".join(bars) + "".join(lines) + "</svg>")
    axis = ('<p class="hf-chart-axis" aria-hidden="true">'
            + "".join(f'<span style="left: {(x - 40) / 610 * 100:.2f}%">{m}</span>' for x, m in ticks) + "</p>")
    return svg, axis


def main():
    rows = commits()
    series = daily(rows)
    human = [r for r in rows if not r["bot"]]
    peak = max(series, key=lambda s: s["automated"] + s["human"])
    total = len(rows)
    news = sum(r["news"] for r in rows)
    print(f"cutoff          {rows[0]['sha'][:7]} ({rows[0]['day']})")
    print(f"commits         {total}")
    print(f"automated       {total - len(human)}")
    print(f"owner           {len(human)}")
    print(f"AI co-author    {sum(r['coauth'] for r in human)}")
    print(f"news refreshes  {news} ({news / total:.1%} of all history)")
    print(f"days            {len(series)} ({series[0]['date']} to {series[-1]['date']})")
    print(f"days with owner {sum(1 for s in series if s['human'])}")
    print(f"days with bot   {sum(1 for s in series if s['automated'])}")
    print(f"peak            {peak['date']}: {peak['automated'] + peak['human']} ({peak['human']} by the owner)")
    if "--write" in sys.argv:
        svg, axis = draw(series)
        text = ARTICLE.read_bytes().decode("utf-8")
        new, n1 = re.subn(r'<svg viewBox="40 28 610 148".*?</svg>', lambda m: svg, text, count=1, flags=re.S)
        new, n2 = re.subn(r'<p class="hf-chart-axis".*?</p>', lambda m: axis, new, count=1)
        if (n1, n2) != (1, 1):
            sys.exit("commit_chart: the chart or its axis was not found in this-site.md")
        ARTICLE.write_bytes(new.encode("utf-8"))
        print(f"written         {ARTICLE.relative_to(ROOT)}: {svg.count('<rect')} bars, "
              f"{axis.count('<span')} month labels")


if __name__ == "__main__":
    main()
