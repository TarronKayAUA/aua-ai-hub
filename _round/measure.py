"""Measure how a built AUA AI Hub site uses the width of the screen.

  python _round/measure.py <site dir> <out dir> [--pages six|reading|all|a/,b/] [--no-shots] [--focus]

Serves <site dir> to Chromium from disk at http://hub.test/ (no server, no
port; Google Fonts are fetched when the network allows, so Inter renders as
on the live site). Written for the width round (2026-09-26): the owner wants
reading pages to stop leaving "huge blank grey spaces" on wide screens, and
to use the width for more columns of text or other elements, with running
text kept at a readable line length.

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

Writes out/metrics.json, out/summary.txt and, unless --no-shots, out/shots/
(1920 dark top and mid screen, 1440 light top and mid screen, 390 light top,
and a whole-page 1920 overview scaled to 640px wide).

Page sets: six = the round's six showcase pages plus two landing pages for
reference; reading = every task, lesson and reference page (from the
data-page-type the build stamps on <body>); all = every page in the sitemap
except weekly digest pages; or a comma-separated list of paths.
"""
import json
import mimetypes
import re
import statistics
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding="utf-8")

SIX = ["pathway/prompting/", "playbooks/lecture-prep/", "tools/gemini-notebook/",
       "basics/glossary/", "governance/policy/", "governance/committee/"]
REFERENCE_DOORS = ["students/", "governance/"]
LIVE = "https://tarronkayaua.github.io/aua-ai-hub/"
BASE = "http://hub.test/"
FONT_HOSTS = {"fonts.googleapis.com", "fonts.gstatic.com"}
VIEWS = [(1920, 1080, "dark"), (1440, 900, "light")]


def args():
    a = [x for x in sys.argv[1:] if not x.startswith("--")]
    if len(a) < 2:
        sys.exit(__doc__)
    opts = {"pages": "six", "shots": True, "focus": False}
    for i, x in enumerate(sys.argv):
        if x == "--pages":
            opts["pages"] = sys.argv[i + 1]
        if x == "--no-shots":
            opts["shots"] = False
        if x == "--focus":
            opts["focus"] = True
    a = [x for x in a if x != opts["pages"]]
    return Path(a[0]).resolve(), Path(a[1]).resolve(), opts


SITE, OUT, OPTS = args()
OUT.mkdir(parents=True, exist_ok=True)
SHOTS = OUT / "shots"
if OPTS["shots"]:
    SHOTS.mkdir(exist_ok=True)


def serve(route):
    u = urlparse(route.request.url)
    if u.netloc in FONT_HOSTS:
        return route.continue_()
    if u.netloc != "hub.test":
        return route.abort()
    rel = unquote(u.path).lstrip("/")
    f = SITE / rel
    if f.is_dir() or rel == "" or rel.endswith("/"):
        f = f / "index.html"
    if not f.exists():
        return route.fulfill(status=404, body="not found")
    ctype = mimetypes.guess_type(str(f))[0] or "application/octet-stream"
    route.fulfill(status=200, body=f.read_bytes(), headers={"content-type": ctype})


def page_type(path):
    f = SITE / path / "index.html" if path else SITE / "index.html"
    if not f.exists():
        return None
    m = re.search(r'<body[^>]*data-page-type="([a-z]+)"', f.read_text(encoding="utf-8", errors="replace"))
    return m.group(1) if m else None


def page_list():
    sel = OPTS["pages"]
    if sel == "six":
        return SIX + REFERENCE_DOORS
    if "," in sel or sel.endswith("/"):
        return [p.strip() for p in sel.split(",") if p.strip()]
    locs = re.findall(r"<loc>(.*?)</loc>", (SITE / "sitemap.xml").read_text(encoding="utf-8"))
    out = []
    for loc in locs:
        p = loc.replace(LIVE, "")
        if re.match(r"news/archive/\d{4}-w\d+/", p):
            continue
        if sel == "reading" and page_type(p) not in ("task", "lesson", "reference"):
            continue
        out.append(p)
    return sorted(set(out), key=lambda s: (s.count("/"), s))


# --- in-page measurement -----------------------------------------------------
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


def slug(p):
    return (p.strip("/").replace("/", "_") or "home")


def quantiles(xs):
    if not xs:
        return None
    xs = sorted(xs)
    pick = lambda q: xs[min(len(xs) - 1, int(q * (len(xs) - 1) + 0.5))]
    return {"n": len(xs), "median": statistics.median(xs), "p10": pick(0.1), "p90": pick(0.9), "max": xs[-1]}


def measure_view(pg, path, w, h, scheme, shots):
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
    pg.wait_for_timeout(150)
    covered_top = pg.evaluate(COVER_JS)
    pg.evaluate(f"window.scrollTo(0, {int(total * 0.4)})")
    pg.wait_for_timeout(200)
    covered_mid = pg.evaluate(COVER_JS)
    overflow = pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
    if shots:
        s = slug(path)
        pg.evaluate("window.scrollTo(0, 0)")
        pg.wait_for_timeout(200)
        pg.screenshot(path=str(SHOTS / f"{s}_{w}_top.png"))
        pg.evaluate(f"window.scrollTo(0, {int(total * 0.4)})")
        pg.wait_for_timeout(250)
        pg.screenshot(path=str(SHOTS / f"{s}_{w}_mid.png"))
    blanks = [s["blank"] for s in screens]
    return {
        "screens": len(screens),
        "blank_mean": round(sum(blanks) / len(blanks), 3),
        "blank_worst": round(max(blanks), 3),
        "largest_hole": round(max(s["largest"] for s in screens), 3),
        "cpl": quantiles(info["cpl"]), "cpl_small": quantiles(info["cplSmall"]),
        "inversions": info["inversionCount"], "inversion_examples": info["inversions"],
        "sidebar_left": info["left"], "sidebar_right": info["right"],
        "covered_top": covered_top, "covered_mid": covered_mid,
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


def full_overview(pg, path):
    from PIL import Image
    pg.set_viewport_size({"width": 1920, "height": 1080})
    pg.emulate_media(color_scheme="light", reduced_motion="reduce")
    pg.goto(BASE + path, wait_until="load")
    pg.wait_for_timeout(600)
    f = SHOTS / f"{slug(path)}_1920_full.png"
    pg.screenshot(path=str(f), full_page=True)
    im = Image.open(f)
    if im.height > 16000:
        im = im.crop((0, 0, im.width, 16000))
    im = im.resize((640, max(1, int(im.height * 640 / im.width))))
    im.save(f)


def main():
    pages = page_list()
    shots = OPTS["shots"] and len(pages) <= 40
    results = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={"width": 1920, "height": 1080})
        ctx.route("**/*", serve)
        pg = ctx.new_page()
        for path in pages:
            r = {"type": page_type(path)}
            try:
                for w, h, scheme in VIEWS:
                    r[str(w)] = measure_view(pg, path, w, h, scheme, shots)
                for w, h in ((1280, 800), (390, 844)):
                    pg.set_viewport_size({"width": w, "height": h})
                    pg.emulate_media(color_scheme="light", reduced_motion="reduce")
                    pg.goto(BASE + path, wait_until="load")
                    pg.wait_for_timeout(400)
                    r[f"overflow_{w}"] = pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 1")
                    if shots and w == 390:
                        pg.screenshot(path=str(SHOTS / f"{slug(path)}_390_top.png"))
                if OPTS["focus"]:
                    r["focus_1920"] = focus_check(pg, path, 1920, 1080)
                    r["focus_1440"] = focus_check(pg, path, 1440, 900)
                if shots:
                    full_overview(pg, path)
            except Exception as e:  # a page that fails to measure is reported, never skipped silently
                r["error"] = f"{type(e).__name__}: {e}"[:300]
            results[path] = r
            print("measured", path, "error" if "error" in r else "")
        b.close()
    (OUT / "metrics.json").write_text(json.dumps(results, indent=1), encoding="utf-8")
    write_summary(results)


def write_summary(results):
    lines = []
    head = f"{'page':42s} {'type':9s} {'blank1920':>9s} {'worst':>6s} {'blank1440':>9s} {'cpl med':>7s} {'p90':>4s} {'max':>4s} {'inv':>4s} {'side':>5s} {'ovf':>4s} {'cov':>7s} {'focus':>6s}"
    lines.append(head)
    agg = {"pages": 0, "errors": 0, "blank1920": [], "blank1440": [], "cpl_over_95": 0, "inversions": 0,
           "sidebars": 0, "overflow": 0, "focus_hidden": 0}
    for path, r in results.items():
        agg["pages"] += 1
        if "error" in r:
            agg["errors"] += 1
            lines.append(f"{path:42s} ERROR {r['error']}")
            continue
        a, b = r["1920"], r["1440"]
        cp = a["cpl"] or {}
        ovf = sum(1 for k in ("overflow_390", "overflow_1280") if r.get(k)) + int(a["overflow"]) + int(b["overflow"])
        side = int(bool(a["sidebar_left"] or a["sidebar_right"] or b["sidebar_left"] or b["sidebar_right"]))
        foc = ""
        if "focus_1920" in r:
            fh = r["focus_1920"]["hidden"] + r["focus_1440"]["hidden"]
            agg["focus_hidden"] += fh
            foc = str(fh)
        agg["blank1920"].append(a["blank_mean"]); agg["blank1440"].append(b["blank_mean"])
        agg["cpl_over_95"] += sum(1 for v in ((a["cpl"] or {}).get("max", 0), (b["cpl"] or {}).get("max", 0)) if v > 95)
        agg["inversions"] += a["inversions"] + b["inversions"]
        agg["sidebars"] += side
        agg["overflow"] += ovf
        lines.append(f"{path:42s} {str(r.get('type')):9s} {a['blank_mean']:9.0%} {a['blank_worst']:6.0%} {b['blank_mean']:9.0%} "
                     f"{cp.get('median', '-')!s:>7s} {cp.get('p90', '-')!s:>4s} {cp.get('max', '-')!s:>4s} "
                     f"{a['inversions'] + b['inversions']:4d} {side:5d} {ovf:4d} {a['covered_top'] + a['covered_mid']:7d} {foc:>6s}")
    mean = lambda xs: (sum(xs) / len(xs)) if xs else 0
    lines.append("")
    lines.append(f"pages {agg['pages']} (errors {agg['errors']}); mean blank per screen 1920 {mean(agg['blank1920']):.0%}, "
                 f"1440 {mean(agg['blank1440']):.0%}; pages with a paragraph over 95 chars/line: {agg['cpl_over_95']}; "
                 f"heading inversions {agg['inversions']}; pages with sidebars {agg['sidebars']}; sideways-scroll views {agg['overflow']}; "
                 f"focus stops fully hidden {agg['focus_hidden']}")
    text = "\n".join(lines)
    (OUT / "summary.txt").write_text(text + "\n", encoding="utf-8")
    print(text)


if __name__ == "__main__":
    main()
