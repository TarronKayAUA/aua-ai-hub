"""Every blank region of every page, largest first, with where it is: a
report, not a pass/fail check (DESIGN.md sections 11 and 14). Ported from
the space round's _round/c/gaps.py.

Uses the measure check's definition of blank (at least 160px each way and
57,600 px^2, ink grown by 12px), but over the whole page inside the content
frame, taking the largest empty rectangle again and again, so each gap is
reported once with its page, size, the heading above it and the layout cell
it sits in. Unlike the measure check, an outline alone does not fill a
panel, so the empty half of an outlined panel counts. Fixed chrome (the
header, the corner control) is left out.

Pages: the ones chosen with --page, or every page in the sitemap except the
weekly digests. Widths 1920 and 1440. Compare the list with DESIGN.md
section 14 (gaps left on purpose) before calling a new one a regression.
"""
import re

from .common import BASE

WIDTHS = [1920, 1440]
SHOW = 40

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


def run(env, report):
    todo = env.pages if env.pages is not None else sorted(
        (p for p in env.sitemap() if not re.match(r"news/archive/\d{4}-w\d+/", p)),
        key=lambda s: (s.count("/"), s))
    rows = []
    for w in WIDTHS:
        ctx = env.context(w, 1000 if w > 1500 else 900)
        pg = ctx.new_page()
        for path in todo:
            try:
                pg.goto(BASE + path, wait_until="load")
                pg.evaluate("document.fonts.ready")
                # Figures fade in as they scroll into view: walk the page first.
                pg.evaluate("""async () => { const H = document.documentElement.scrollHeight;
                  for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
                  window.scrollTo(0, 0); }""")
                pg.wait_for_timeout(400)
                for g in pg.evaluate(GAPS_JS)["gaps"]:
                    rows.append((g["area"], path, w, g))
            except Exception as e:  # noqa: BLE001  (report, keep going)
                report.note(f"{path} {w}: could not be read ({str(e)[:120]})")
        ctx.close()
    rows.sort(key=lambda x: -x[0])
    report.note(f"{len(todo)} pages x {len(WIDTHS)} widths, {len(rows)} blank regions; the largest {min(SHOW, len(rows))}:")
    for area, path, w, g in rows[:SHOW]:
        report.note(f"  {area / 1000:7.0f}k px2  {w}  {path or '(home)'}  {g['w']}x{g['h']} at y={g['y']}  "
                    f"{g.get('side', '')} side, under {g['under']!r}, in {g['cell']}")
