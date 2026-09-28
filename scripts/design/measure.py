"""Measure how the built site uses the screen, and compare with the baseline
(DESIGN.md sections 1 and 15). Ported from the width and space rounds'
_round/measure.py.

Per page, at 1920x1080 (dark scheme) and 1440x900 (light), with reduced
motion so nothing is mid-animation:

What it measures, per page, at 1920x1080 and 1440x900:

  blank      the share of each screen (below the header) that sits in a BIG
             empty region: a connected area of empty page at least 160px in
             both directions and 57,600 px^2 in area. Text lines, images,
             drawings, form controls and boxes with their own fill, border
             or shadow count as used; every used rectangle is grown by 12px
             so ordinary gaps between lines and paragraphs never count as
             blank. The page is read screen by screen from top to bottom
             (steps of 90% of a screen); mean and worst screen are reported.
  line       characters per rendered line of running text (every line but
             the last of body-size paragraphs of 160+ characters, counted
             from the characters actually set on the line): median, 10th and
             90th percentile, max. The target band is 55 to 90, most lines 65
             to 85. Smaller print (notes, captions, card text) is reported as
             cpl_small.
  order      reading-order inversions: an h2 or h3 that comes later in the
             document but sits clearly ABOVE an earlier one (by 40px or more)
             on screen, so a reader scanning down meets them out of order.
  overflow   sideways scrolling at 390, 1280, 1440 and 1920px.
  sidebars   Material's left sidebar or right "On this page" column showing.
  covered    text of the page covered by the floating navigation controls at
             rest (px^2, top of page and mid page). Informational: the owner
             allows the controls to float over content.
  focus      with --focus: Tab through the page (up to 400 stops) at 1920
             and 1440 and count stops that are ENTIRELY hidden behind a
             fixed or sticky element (WCAG 2.2 "Focus Not Obscured").

Pages: the ones chosen with --page, or every page in the sitemap except the
weekly digests (which repeat one layout; the news check covers them).

Compared with scripts/design/baselines.json. A page FAILS when, at either
width:
  - its blank share rises more than BLANK_TOLERANCE (5 points) above its
    baseline;
  - a reading page (task, lesson, reference) sets a line of running text
    over CPL_MAX (95) characters;
  - it has more heading inversions (a heading sitting above an earlier
    one) than its baseline (0 everywhere but the home page, whose two-column
    top reads as inversions by design), Material's sidebars show, or the
    page scrolls sideways.
A page missing from the baseline is reported, not failed. After an approved
change, refresh the baseline with `python scripts/design_check.py --only
measure --update-baselines` and commit baselines.json with the change.
"""
from __future__ import annotations

import json
import statistics
from datetime import date
from pathlib import Path

from .common import BASE

BASELINES = Path(__file__).with_name("baselines.json")
VIEWS = [(1920, 1080, "dark"), (1440, 900, "light")]
BLANK_TOLERANCE = 0.05
CPL_MAX = 95
READING = ("task", "lesson", "reference")

SCREEN_JS = r"""
() => {
  const vw = document.documentElement.clientWidth, vh = window.innerHeight;
  const vis = el => el && el.checkVisibility && el.checkVisibility({checkOpacity: true, checkVisibilityCSS: true});
  // Header band: the fixed header and the section tabs, whichever reach lower.
  let top = 0;
  for (const sel of ['.md-header', '.md-tabs']) {
    const el = document.querySelector(sel);
    if (el && vis(el)) { const r = el.getBoundingClientRect(); if (r.top <= 1 && r.bottom < vh / 3) top = Math.max(top, r.bottom); }
  }
  const areaH = vh - top;
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  const ink = [];
  const add = r => { if (r.width > 0 && r.height > 0 && r.bottom > top && r.top < vh && r.right > 0 && r.left < vw) ink.push([r.left, r.top, r.right, r.bottom]); };
  // text lines
  const range = document.createRange();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT,
    { acceptNode: n => n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  while (walker.nextNode()) {
    const n = walker.currentNode, p = n.parentElement;
    if (!p || p.closest('.md-header, .md-tabs, script, style, noscript')) continue;
    const pr = p.getBoundingClientRect();
    if (pr.bottom < top - 200 || pr.top > vh + 200) continue;
    if (!vis(p)) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) add(r);
  }
  // boxes and replaced elements
  const REPLACED = new Set(['IMG', 'SVG', 'VIDEO', 'CANVAS', 'IFRAME', 'INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'AUDIO', 'PICTURE']);
  const big = vw * areaH * 0.6;
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('.md-header, .md-tabs')) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom < top || r.top > vh || r.width < 2 || r.height < 2) continue;
    const tag = el.tagName.toUpperCase();
    if (tag === 'svg'.toUpperCase() && el.parentElement && el.parentElement.closest('svg')) continue;
    if (!vis(el)) continue;
    if (REPLACED.has(tag)) { add(r); continue; }
    const s = getComputedStyle(el);
    const bg = s.backgroundColor;
    const hasBg = (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== bodyBg) || s.backgroundImage !== 'none';
    const sides = ['Top', 'Right', 'Bottom', 'Left'].filter(k => parseFloat(s['border' + k + 'Width']) >= 1 &&
      s['border' + k + 'Style'] !== 'none' && s['border' + k + 'Color'] !== 'rgba(0, 0, 0, 0)').length;
    const boxed = hasBg || sides >= 3 || s.boxShadow !== 'none';
    if (boxed && r.width * r.height < big) add(r);
  }
  // grid: 16px cells, used if within 12px of ink
  const C = 16, G = 12, cols = Math.ceil(vw / C), rows = Math.ceil(areaH / C);
  const used = new Uint8Array(cols * rows);
  for (const [l, t, rr, b] of ink) {
    const c0 = Math.max(0, Math.floor((l - G) / C)), c1 = Math.min(cols - 1, Math.floor((rr + G) / C));
    const r0 = Math.max(0, Math.floor((t - G - top) / C)), r1 = Math.min(rows - 1, Math.floor((b + G - top) / C));
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) used[y * cols + x] = 1;
  }
  // connected empty regions
  const seen = new Uint8Array(cols * rows);
  let bigCells = 0, largest = 0;
  const q = new Int32Array(cols * rows);
  for (let i = 0; i < cols * rows; i++) {
    if (used[i] || seen[i]) continue;
    let head = 0, tail = 0, n = 0, minx = 1e9, maxx = -1, miny = 1e9, maxy = -1;
    q[tail++] = i; seen[i] = 1;
    while (head < tail) {
      const k = q[head++]; n++;
      const x = k % cols, y = (k - x) / cols;
      if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y;
      const nb = [x > 0 ? k - 1 : -1, x < cols - 1 ? k + 1 : -1, y > 0 ? k - cols : -1, y < rows - 1 ? k + cols : -1];
      for (const j of nb) if (j >= 0 && !used[j] && !seen[j]) { seen[j] = 1; q[tail++] = j; }
    }
    const w = (maxx - minx + 1) * C, h = (maxy - miny + 1) * C, a = n * C * C;
    if (w >= 160 && h >= 160 && a >= 57600) { bigCells += n; if (a > largest) largest = a; }
  }
  const area = cols * rows * C * C;
  return { blank: bigCells * C * C / area, largest: largest / area };
}
"""

PAGE_JS = r"""
() => {
  const vis = el => el && el.checkVisibility && el.checkVisibility({checkOpacity: true, checkVisibilityCSS: true});
  const root = document.querySelector('.md-content') || document.body;
  // line length of running text
  // Body-size paragraphs only; smaller print (notes, captions, card text) is
  // reported separately, because a smaller font fits more characters in the
  // same width and today's pages already run it past 95.
  const cpl = [], cplSmall = [];
  const range = document.createRange();
  const base = parseFloat(getComputedStyle(document.querySelector('.md-typeset') || document.body).fontSize);
  for (const p of root.querySelectorAll('p')) {
    if (!vis(p) || p.closest('table, nav, .secnav, .md-footer')) continue;
    const t = p.textContent.replace(/\s+/g, ' ').trim();
    if (t.length < 160) continue;
    const small = parseFloat(getComputedStyle(p).fontSize) < base * 0.95;
    // Count the characters actually set on each rendered line (the last
    // line of a paragraph is usually short, so it is left out); dividing
    // length by line count overstated short paragraphs by up to a third.
    const lines = [];
    const tw = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
    while (tw.nextNode()) {
      const n = tw.currentNode, v = n.nodeValue;
      for (let i = 0; i < v.length; i++) {
        if (/\s/.test(v[i])) continue;
        range.setStart(n, i); range.setEnd(n, i + 1);
        const r = range.getClientRects()[0];
        if (!r) continue;
        let line = lines.find(l => Math.abs(l.top - r.top) < 4);
        if (!line) { line = { top: r.top, n: 0 }; lines.push(line); }
        line.n++;
      }
    }
    lines.sort((a, b) => a.top - b.top);
    const full = lines.slice(0, -1);
    // spaces are not counted above; add them back at the paragraph's own rate
    const spaceRate = t.length / Math.max(1, t.replace(/ /g, '').length);
    for (const l of full) (small ? cplSmall : cpl).push(Math.round(l.n * spaceRate));
  }
  // reading order of section headings
  const hs = [...root.querySelectorAll('h2, h3')].filter(vis).map(h => {
    const r = h.getBoundingClientRect(); return { t: r.top + scrollY, l: r.left, text: h.textContent.trim().slice(0, 60) }; });
  const inversions = [];
  for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++)
    if (hs[j].t < hs[i].t - 40) inversions.push([hs[i].text, hs[j].text]);
  // sidebars
  const sb = sel => { const el = document.querySelector(sel); if (!el || !vis(el)) return 0;
    const r = el.getBoundingClientRect(); const links = [...el.querySelectorAll('a[href]')].filter(vis).length;
    return (r.width > 20 && links) ? Math.round(r.width) : 0; };
  return { cpl, cplSmall, inversions: inversions.slice(0, 12), inversionCount: inversions.length,
           left: sb('.md-sidebar--primary'), right: sb('.md-sidebar--secondary'),
           height: document.documentElement.scrollHeight, type: document.body.getAttribute('data-page-type') };
}
"""

COVER_JS = r"""
() => {
  const nav = [...document.querySelectorAll('.secnav, [data-secnav], .secnav-dock')].filter(e => e.checkVisibility && e.checkVisibility());
  if (!nav.length) return 0;
  const boxes = nav.map(n => n.getBoundingClientRect());
  const range = document.createRange();
  let covered = 0;
  const root = document.querySelector('.md-content') || document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeValue.trim() ? 1 : 2 });
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (nav.some(v => v.contains(n))) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) for (const b of boxes) {
      const w = Math.min(r.right, b.right) - Math.max(r.left, b.left), h = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
      if (w > 0 && h > 0) covered += w * h;
    }
  }
  return Math.round(covered);
}
"""

FOCUS_JS = r"""
() => {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return { hidden: false, zero: true };
  const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 2, r.top + 2], [r.right - 2, r.top + 2],
               [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2]];
  let blocked = 0, onscreen = 0;
  for (const [x, y] of pts) {
    if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
    onscreen++;
    const hit = document.elementFromPoint(x, y);
    if (!hit || el.contains(hit) || hit.contains(el)) continue;
    let e = hit, fixed = false;
    while (e && e !== document.body) { const p = getComputedStyle(e).position; if (p === 'fixed' || p === 'sticky') { fixed = true; break; } e = e.parentElement; }
    if (fixed) blocked++;
  }
  return { hidden: onscreen > 0 && blocked === onscreen, label: (el.textContent || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 50) };
}
"""


def quantiles(xs):
    if not xs:
        return None
    xs = sorted(xs)
    pick = lambda q: xs[min(len(xs) - 1, int(q * (len(xs) - 1) + 0.5))]
    return {"n": len(xs), "median": statistics.median(xs), "p10": pick(0.1), "p90": pick(0.9), "max": xs[-1]}


def measure_view(pg, path, w, h, scheme):
    pg.set_viewport_size({"width": w, "height": h})
    pg.emulate_media(color_scheme=scheme, reduced_motion="reduce")
    pg.goto(BASE + path, wait_until="load")
    pg.wait_for_timeout(700)
    info = pg.evaluate(PAGE_JS)
    total = pg.evaluate("document.documentElement.scrollHeight")
    screens, y = [], 0
    while True:
        pg.evaluate(f"window.scrollTo(0, {y})")
        pg.wait_for_timeout(120)
        screens.append(pg.evaluate(SCREEN_JS))
        if y + h >= total:
            break
        y += int(h * 0.9)
    pg.evaluate("window.scrollTo(0, 0)")
    overflow = pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
    blanks = [s["blank"] for s in screens]
    return {
        "screens": len(screens),
        "blank_mean": round(sum(blanks) / len(blanks), 3),
        "blank_worst": round(max(blanks), 3),
        "cpl": quantiles(info["cpl"]), "cpl_small": quantiles(info["cplSmall"]),
        "inversions": info["inversionCount"], "inversion_examples": info["inversions"],
        "sidebar_left": info["left"], "sidebar_right": info["right"],
        "overflow": overflow, "height": total, "type": info["type"],
    }


def focus_check(pg, path, w, h):
    pg.set_viewport_size({"width": w, "height": h})
    pg.goto(BASE + path, wait_until="load")
    pg.wait_for_timeout(500)
    hidden, stops, seen = [], 0, set()
    for _ in range(400):
        pg.keyboard.press("Tab")
        r = pg.evaluate(FOCUS_JS)
        if r is None:
            continue
        key = pg.evaluate("(() => { const e = document.activeElement; return e ? e.outerHTML.slice(0, 120) + e.getBoundingClientRect().top : '' })()")
        if key in seen:
            break
        seen.add(key)
        stops += 1
        if r.get("hidden"):
            hidden.append(r.get("label"))
    return {"stops": stops, "hidden": len(hidden), "hidden_examples": hidden[:8]}


def pages(env):
    if env.pages is not None:
        return env.pages
    import re
    return sorted((p for p in env.sitemap() if not re.match(r"news/archive/\d{4}-w\d+/", p)),
                  key=lambda s: (s.count("/"), s))


def measure_all(env, todo, focus=False):
    results = {}
    ctx = env.context(1920, 1080)
    pg = ctx.new_page()
    for path in todo:
        r = {"type": env.page_type(path)}
        try:
            for w, h, scheme in VIEWS:
                r[str(w)] = measure_view(pg, path, w, h, scheme)
            if focus:
                r["focus_1920"] = focus_check(pg, path, 1920, 1080)
                r["focus_1440"] = focus_check(pg, path, 1440, 900)
        except Exception as e:  # a page that fails to measure is reported, never skipped silently
            r["error"] = f"{type(e).__name__}: {e}"[:300]
        results[path] = r
        print(f"  measured {path or '(home)'}" + (" ERROR" if "error" in r else ""), flush=True)
    ctx.close()
    return results


def slim(r):
    """What the baseline keeps of one page's measurement."""
    out = {"type": r.get("type")}
    for w in ("1920", "1440"):
        v = r[w]
        out[w] = {"blank": v["blank_mean"], "worst": v["blank_worst"], "height": v["height"],
                  "inversions": v["inversions"],
                  "cpl_median": (v["cpl"] or {}).get("median"), "cpl_max": (v["cpl"] or {}).get("max")}
    return out


def by_type(pages_):
    rows = {}
    for p, r in pages_.items():
        rows.setdefault(r["type"], []).append(r)
    rows["all"] = list(pages_.values())
    table = {}
    for t, rs in rows.items():
        mean = lambda k, w: round(sum(x[w][k] for x in rs) / len(rs), 3)
        meds = [x["1920"]["cpl_median"] for x in rs if x["1920"]["cpl_median"]]
        maxes = [x["1920"]["cpl_max"] for x in rs if x["1920"]["cpl_max"]]
        table[t] = {"pages": len(rs), "blank_1920": mean("blank", "1920"), "blank_1440": mean("blank", "1440"),
                    "cpl_median": statistics.median(meds) if meds else None, "cpl_max": max(maxes) if maxes else None}
    return table


def run(env, report, update=False, focus=False):
    todo = pages(env)
    results = measure_all(env, todo, focus)
    base = json.loads(BASELINES.read_text(encoding="utf-8")) if BASELINES.exists() else {"pages": {}}
    for path, r in results.items():
        name = path or "(home)"
        if "error" in r:
            report.check(False, f"{name}: could not be measured ({r['error']})")
            continue
        b = base["pages"].get(path)
        for w in ("1920", "1440"):
            v = r[w]
            cpl = (v["cpl"] or {}).get("max") or 0
            if b is not None:
                was = b[w]["blank"]
                report.check(v["blank_mean"] <= was + BLANK_TOLERANCE,
                             f"{name} {w}: blank {v['blank_mean']:.0%} (baseline {was:.0%})")
            if r["type"] in READING:
                report.check(cpl <= CPL_MAX, f"{name} {w}: longest line {cpl} characters (limit {CPL_MAX})")
            # A page whose layout reads out of order by the script's rule on
            # purpose (the home page's two-column top) keeps its baseline
            # count; any other page must have none, and none may gain one.
            allowed = b[w].get("inversions", 0) if b is not None else 0
            report.check(v["inversions"] <= allowed,
                         f"{name} {w}: {v['inversions']} heading inversions (baseline {allowed})")
            report.check(not (v["sidebar_left"] or v["sidebar_right"]), f"{name} {w}: no Material sidebars")
            report.check(not v["overflow"], f"{name} {w}: no sideways scroll")
        if focus:
            hidden = r["focus_1920"]["hidden"] + r["focus_1440"]["hidden"]
            report.check(not hidden, f"{name}: {hidden} focus stops fully hidden")
        if b is None:
            report.note(f"{name}: not in the baseline yet (refresh it with --update-baselines)")
    measured = {p: slim(r) for p, r in results.items() if "error" not in r}
    table = by_type(measured) if measured else {}
    print("  by page type (mean blank per screen 1920 / 1440, median and max characters per line at 1920):")
    for t, row in sorted(table.items(), key=lambda kv: (kv[0] == "all", kv[0])):
        print(f"    {t:10s} {row['pages']:3d} pages  {row['blank_1920']:.0%} / {row['blank_1440']:.0%}  "
              f"cpl {row['cpl_median']} / {row['cpl_max']}")
    if update:
        merged = dict(base.get("pages", {}))
        merged.update(measured)
        BASELINES.write_text(json.dumps({
            "about": "Design check baseline (DESIGN.md section 15). Refresh after an approved layout change: "
                     "python scripts/design_check.py --only measure --update-baselines",
            "updated": date.today().isoformat(),
            "by_type": by_type(merged),
            "pages": dict(sorted(merged.items())),
        }, indent=1) + "\n", encoding="utf-8")
        report.note(f"baseline written: {len(measured)} pages updated, {len(merged)} in {BASELINES.name}")
    return results
