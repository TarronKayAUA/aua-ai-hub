/* Island Night: the gutter scenery beside the page column on wide screens (the gutter is at least
 * 80 px). Loaded by docs/javascripts/layout-art.js only when a window is that wide, so phones never
 * fetch it. Decorative only (aria-hidden), and still: nothing here moves.
 *
 * One panorama. The page column covers the middle of the view from Curtain Bluff; the gutters show
 * what lies to either side at the same scale and on the same horizon: to the left, the open sea to
 * the south (with Guadeloupe low on the horizon on the widest screens); to the right, Antigua's own
 * hills. On the home page the view is the hero's own, so at the top of the page the horizon runs
 * straight through; other pages use the view the home page has at the same width. No island, sunset
 * or Moon is repeated: those lie behind the column.
 */
(function () {
  'use strict';
  const A = window.IslandArt;
  if (!A || !A.lib || A.sides) return;
  const { view, islands, land, stars, ripples, defs, own, F, LAND, rel, milkyWay } = A.lib;
  const PAINT = 440;           // the widest strip painted; beyond it a gutter stays page-coloured
  const MIN = 80;              // narrower gutters stay empty

  /* The panorama in window coordinates. With a hero: the hero's view, measured at the top of the
     page. Without: the home page's view at this width, from its layout in rem (the horizon behind
     the search field, 1 rem below the header plus 12.36 rem; 0.4417 rem per degree; the coast's
     anchor 35.04 rem plus 10 px into the column). */
  function mapping(grid) {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 20;
    const G = Math.floor(grid.getBoundingClientRect().left);
    const hv = A.heroView;
    if (hv && hv.host.isConnected) {
      const hb = hv.host.getBoundingClientRect();
      return { G, x0: hb.left + hv.x0, y0: Math.round(hb.top + scrollY + hv.y0), ppd: hv.ppd, home: true };
    }
    const header = document.querySelector('.md-header');
    const hh = header ? header.getBoundingClientRect().height : 5 * rem;
    return { G, x0: G + 35.04 * rem + 10, y0: Math.round(hh + 13.36 * rem), ppd: 0.4417 * rem, home: false };
  }

  function strip(which, M, W, H) {
    let P = Math.min(M.G, PAINT);
    // The right strip ends where the land data ends (71 degrees), so its outer fade always covers it.
    if (which === 'r') P = Math.max(0, Math.min(P, Math.floor(M.x0 + rel(LAND[LAND.length - 1][0]) * M.ppd - (W - M.G))));
    if (P < 40) return '';
    const sx = which === 'l' ? M.G - P : W - M.G;
    const v = view(M.x0 - sx, M.y0, M.ppd, P, H);
    const sea = H - v.y0;
    const svg = `<svg class="isl-o isl-art" width="${P}" height="${H}" viewBox="0 0 ${P} ${H}">${defs(P, v.y0, H)}`
      + `<rect width="${P}" height="${v.y0 + 1}" fill="url(#islskyg)"/>`
      + milkyWay(v, 'n', 'isl-n')
      + stars(v, 'n', [], 'isl-n')
      + `<rect y="${F(v.y0 - 2.4 * v.ppd)}" width="${P}" height="${F(2.4 * v.ppd)}" fill="url(#islhazeg)"/>`
      + islands(v, 'f-isl')
      + `<rect y="${v.y0}" width="${P}" height="${F(sea + 1)}" fill="url(#islseag)"/>`
      + `<path class="s-hz" d="M0 ${v.y0 + 0.5}H${P}" stroke-width="1"/>`
      + ripples(v, 0, P, Math.min(H, v.y0 + 150), [], which === 'l' ? 21 : 31, 0.8)
      + land(v, 0, P, which === 'l' ? 41 : 43)
      + '</svg>';
    const side = which === 'l' ? `left:${M.G - P}px` : 'left:0';
    return `<div class="isl-strip${P < M.G ? ' isl-cut' : ''}" style="${side};width:${P}px">${own(svg, 's' + which)}</div>`;
  }

  A.sides = function (wrap) {
    const grid = document.querySelector('.md-main .md-grid');
    if (!grid || wrap._isl) return;
    wrap._isl = true;
    let last = '';
    const paint = () => {
      const W = document.documentElement.clientWidth, H = innerHeight, M = mapping(grid);
      const key = M.G < MIN ? 'off' : [W, H, M.G, M.x0, M.y0, M.ppd].map((n) => Math.round(n * 10)).join(',');
      if (key === last) return;
      last = key;
      if (M.G < MIN) { wrap.classList.remove('isl-on'); wrap.innerHTML = ''; return; }
      wrap.classList.add('isl-on');
      wrap.classList.toggle('isl-inner', !M.home);
      wrap.style.setProperty('--isl-g', `${M.G}px`);
      wrap.style.setProperty('--isl-y0', `${M.y0}px`);
      wrap.innerHTML = `<div class="isl isl-side l">${strip('l', M, W, H)}</div><div class="isl isl-side r">${strip('r', M, W, H)}</div>`;
    };
    paint();
    A.onHero = paint;
    (A.redraw = A.redraw || []).push(() => { last = ''; paint(); });
    let t;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(paint, 200); });
  };
})();
