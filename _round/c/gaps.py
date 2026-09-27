"""Space round: every blank component of every page, largest first.

  python _round/c/gaps.py <site dir> <out.json> [--pages a/,b/] [--widths 1920,1440]

Uses _round/measure.py's definition of blank (a connected empty region at
least 160px in both directions and 57,600 px^2, every used rectangle grown by
12px), but over the whole page in document coordinates rather than screen by
screen, so each gap is reported once with where it is: the nearest heading
above it, the reading-layout cell it sits in (layout_width's data-w-shape),
and its box. Fixed chrome (the header, the Navigate control) is
left out. Google Fonts load through the proxy CA (see STATUS), so the text
sets in Inter as on the live site.

Pages: every page in the sitemap except the weekly digest archive pages, or
a comma-separated list.
"""
import json
import mimetypes
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

from playwright.sync_api import sync_playwright

SITE = Path(sys.argv[1])
OUT = Path(sys.argv[2])
OPTS = dict(zip(sys.argv[3::2], sys.argv[4::2]))
WIDTHS = [int(w) for w in OPTS.get("--widths", "1920,1440").split(",")]
FONT_HOSTS = {"fonts.googleapis.com", "fonts.gstatic.com"}
LIVE = "https://tarronkayaua.github.io/aua-ai-hub/"


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
    route.fulfill(status=200, body=f.read_bytes(),
                  headers={"content-type": mimetypes.guess_type(str(f))[0] or "application/octet-stream"})


def pages():
    if "--pages" in OPTS:
        return [p for p in OPTS["--pages"].split(",") if p or p == ""]
    xml = (SITE / "sitemap.xml").read_text(encoding="utf-8")
    out = []
    for loc in re.findall(r"<loc>([^<]+)</loc>", xml):
        p = loc.replace(LIVE, "")
        if re.match(r"news/archive/\d{4}-w\d+/", p):
            continue
        out.append(p)
    return sorted(set(out), key=lambda s: (s.count("/"), s))


GAPS_JS = r"""
() => {
  const vw = document.documentElement.clientWidth;
  const H = document.documentElement.scrollHeight;
  const sy = window.scrollY;
  const vis = el => el && el.checkVisibility && el.checkVisibility({checkOpacity: true, checkVisibilityCSS: true});
  const chrome = el => { for (let e = el; e && e !== document.body; e = e.parentElement) {
      if (getComputedStyle(e).position === 'fixed') return true; } return false; };
  // Page top: below the header and tabs.
  let top = 0;
  for (const sel of ['.md-header', '.md-tabs']) {
    const el = document.querySelector(sel);
    if (el && vis(el)) { const r = el.getBoundingClientRect(); top = Math.max(top, r.bottom + sy); }
  }
  // Page bottom: the top of the site footer.
  const foot = document.querySelector('.md-footer');
  const bottom = foot ? foot.getBoundingClientRect().top + sy : H;
  const ink = [];
  const add = r => { if (r.width > 0 && r.height > 0) ink.push([r.left, r.top + sy, r.right, r.bottom + sy]); };
  const range = document.createRange();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT,
    { acceptNode: n => n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  while (walker.nextNode()) {
    const n = walker.currentNode, p = n.parentElement;
    if (!p || p.closest('.md-header, .md-tabs, script, style, noscript') || !vis(p) || chrome(p)) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) add(r);
  }
  const REPLACED = new Set(['IMG', 'SVG', 'VIDEO', 'CANVAS', 'IFRAME', 'INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'AUDIO', 'PICTURE']);
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('.md-header, .md-tabs')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const tag = el.tagName.toUpperCase();
    if (tag === 'SVG' && el.parentElement && el.parentElement.closest('svg')) continue;
    if (!vis(el) || chrome(el)) continue;
    if (REPLACED.has(tag)) { add(r); continue; }
    const s = getComputedStyle(el);
    const bg = s.backgroundColor;
    const hasBg = (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent' && bg !== bodyBg) || s.backgroundImage !== 'none';
    const sides = ['Top', 'Right', 'Bottom', 'Left'].filter(k => parseFloat(s['border' + k + 'Width']) >= 1 &&
      s['border' + k + 'Style'] !== 'none' && s['border' + k + 'Color'] !== 'rgba(0, 0, 0, 0)').length;
    // A box counts as used only when it is filled; an outline alone (the
    // reading layout's panels) does not fill the space inside it.
    if (hasBg || s.boxShadow !== 'none' || (sides >= 3 && r.width * r.height < 40000)) {
      if (r.width * r.height < vw * 900 * 0.6) add(r);
    }
  }
  // Only the content frame: the page's side gutters are the frame's margin,
  // and would otherwise join every gap on the page into one.
  const frame = (document.querySelector('.md-content__inner') || document.body).getBoundingClientRect();
  const X0 = Math.max(0, Math.floor(frame.left)), X1 = Math.min(vw, Math.ceil(frame.right));
  const C = 16, G = 12, cols = Math.ceil((X1 - X0) / C), rows = Math.ceil((bottom - top) / C);
  const used = new Uint8Array(cols * rows);
  for (const [l, t, rr, b] of ink) {
    const c0 = Math.max(0, Math.floor((l - G - X0) / C)), c1 = Math.min(cols - 1, Math.floor((rr + G - X0) / C));
    if (c1 < 0 || c0 > cols - 1) continue;
    const r0 = Math.max(0, Math.floor((t - G - top) / C)), r1 = Math.min(rows - 1, Math.floor((b + G - top) / C));
    for (let y = r0; y <= r1; y++) for (let x = c0; x <= c1; x++) used[y * cols + x] = 1;
  }
  const heads = [...document.querySelectorAll('.md-content h1, .md-content h2, .md-content h3')]
    .filter(vis).map(h => ({ y: h.getBoundingClientRect().top + sy, x: h.getBoundingClientRect().left,
                            t: h.textContent.replace('¶', '').trim().slice(0, 60) }));
  // Blank components: repeatedly the largest empty rectangle (at least
  // 160px each way and 57,600 px^2), which is then marked used. Connected
  // regions would snake through panel padding and join the whole page.
  const gaps = [];
  const minC = Math.ceil(160 / C);
  const hgt = new Int32Array(cols);
  for (let round = 0; round < 40; round++) {
    let best = null;
    hgt.fill(0);
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) hgt[x] = used[y * cols + x] ? 0 : hgt[x] + 1;
      // largest rectangle in the histogram of this row
      const st = [];
      for (let x = 0; x <= cols; x++) {
        const hx = x < cols ? hgt[x] : 0;
        let start = x;
        while (st.length && st[st.length - 1][1] >= hx) {
          const [sx, sh] = st.pop();
          const wc = x - sx;
          if (sh >= minC && wc >= minC && sh * wc * C * C >= 57600 && (!best || sh * wc > best.hc * best.wc))
            best = { x0: sx, y0: y - sh + 1, wc, hc: sh };
          start = sx;
        }
        st.push([start, hx]);
      }
    }
    if (!best) break;
    for (let y = best.y0; y < best.y0 + best.hc; y++) for (let x = best.x0; x < best.x0 + best.wc; x++) used[y * cols + x] = 1;
    const box = { x: X0 + best.x0 * C, y: Math.round(top + best.y0 * C), w: best.wc * C, h: best.hc * C };
    box.area = box.w * box.h;
    const cy = box.y + box.h / 2, cx = box.x + box.w / 2;
    let under = null;
    for (const hd of heads) if (hd.y <= box.y + 8) under = hd.t;
    window.scrollTo(0, Math.max(0, cy - 400));
    const el = document.elementFromPoint(cx, cy - window.scrollY);
    const cell = el && el.closest ? el.closest('[data-w-shape], .w-head, .grid, .md-typeset > *') : null;
    box.under = under;
    box.cell = cell ? (cell.getAttribute('data-w-shape') || (typeof cell.className === 'string' ? cell.className.split(' ')[0] : cell.tagName)) : '';
    box.side = cx < X0 + (X1 - X0) / 2 ? 'left' : 'right';
    gaps.push(box);
  }
  window.scrollTo(0, 0);
  return { gaps, height: Math.round(bottom - top), width: vw };
}
"""


def main():
    todo = pages()
    results = {}
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for w in WIDTHS:
            ctx = browser.new_context(viewport={"width": w, "height": 1000 if w > 1500 else 900})
            ctx.route("**/*", serve)
            pg = ctx.new_page()
            for path in todo:
                try:
                    pg.goto("http://hub.test/" + path, wait_until="load")
                    pg.evaluate("document.fonts.ready")
                    # Figures fade in as they scroll into view; walk the page
                    # first so every one has been revealed.
                    pg.evaluate("""async () => { const H = document.documentElement.scrollHeight;
                      for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
                      window.scrollTo(0, 0); }""")
                    pg.wait_for_timeout(400)
                    r = pg.evaluate(GAPS_JS)
                    results.setdefault(path, {})[str(w)] = r
                except Exception as e:  # noqa: BLE001  (report, keep going)
                    results.setdefault(path, {})[str(w)] = {"error": str(e)[:200]}
            ctx.close()
        browser.close()
    OUT.write_text(json.dumps(results, indent=1), encoding="utf-8")
    rows = []
    for path, by_w in results.items():
        for w, r in by_w.items():
            for g in r.get("gaps", []):
                rows.append((g["area"], path, w, g))
    rows.sort(key=lambda x: -x[0])
    print(f"gaps: {len(todo)} pages x {len(WIDTHS)} widths, {len(rows)} blank components")
    for area, path, w, g in rows[:80]:
        print(f"  {area / 1000:7.0f}k px2  {w}  {path or '(home)'}  {g['w']}x{g['h']} at y={g['y']}  "
              f"{g.get('side', '')} side, under {g['under']!r}, in {g['cell']}")


if __name__ == "__main__":
    main()
