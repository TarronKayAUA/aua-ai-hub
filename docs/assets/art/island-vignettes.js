/* Island Night vignettes: small scenes under the same evening sky, one subject each (art round,
 * 2026-09-27). Loaded by docs/javascripts/layout-art.js only where a vignette is shown (from
 * 68.75em), after island-core.js. Decorative only (aria-hidden). The places are data/art_slots.yaml,
 * placed by scripts/layout_art.py; the owner approves each one.
 *
 * THE SKY IS ISLAND NIGHT'S: 18 May 2026, dusk in the light scheme and night in the dark, with
 * island-core's own stars, Moon, Venus, afterglow and sea, in its own palette (the --isl-* tokens).
 * Antigua is small enough (about 20 km across) that the sky is the same over the whole island, so a
 * scene set elsewhere on it keeps the true sky; it only turns to face its own bearing. A scene on
 * the Curtain Bluff coast also shows the far islands and Antigua's land at true bearings; a scene
 * elsewhere draws its own ground and hills and leaves those out, because they would be untrue there.
 *
 * THE SUBJECTS ARE PAINTED FROM PHOTOGRAPHS, like the frigatebird: true in their shapes and
 * proportions, not surveyed, not to scale with the sky. They stand as lit silhouettes in the
 * palette, with the page's kind hue (--k, set by [data-kind]) as one small accent. No words.
 *
 * MOTION: one pass. The card fades in and the lights come on in turn, then everything is still.
 * With motion reduced, the still frame at once. A repaint (a resize) never replays the pass.
 */
(function () {
  'use strict';
  const A = window.IslandArt;
  if (!A || !A.lib || A.vignette) return;
  const L = A.lib;
  const { SKY, view, islands, land, stars, ripples, defs, own, rng, F, clamp, rel } = L;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* The near ground: a bank across the whole foreground, at yL on the left rising to a level
     terrace at yP from xr1 rightward, darkest of all (f-near), with a scrub edge. Level everywhere
     when xr0 = xr1 and yL = yP. Returns the path and a function giving its top at x. */
  function rise(W, H, xr0, xr1, yL, yP, seed) {
    const r = rng(seed), pts = [];
    const at = (x) => {
      const t = clamp((x - xr0) / Math.max(1, xr1 - xr0), 0, 1);
      return yL + (yP - yL) * t * t * (3 - 2 * t);
    };
    for (let x = -4; x <= W + 4; x += 6) pts.push([x, at(x) + (r() - 0.5) * (x < xr1 ? 2.2 : 0.6)]);
    let d = `M-4 ${F(H + 2)}`;
    for (const [x, y] of pts) d += `L${F(x)} ${F(y)}`;
    d += `L${F(W + 4)} ${F(H + 2)}Z`;
    for (let i = 1; i < pts.length; i += 1) {
      if (r() < 0.32) continue;
      const [x, y] = pts[i], rr = 1.5 + r() * 2.4;
      d += `M${F(x - rr)} ${F(y + rr * 0.4)}a${F(rr)} ${F(rr * 0.8)} 0 0 1 ${F(2 * rr)} 0Z`;
    }
    return { d, at };
  }

  /* A palm: a leaning trunk and a crown of drooping fronds, as one silhouette. */
  function palm(x, y, h, lean, seed) {
    const r = rng(seed);
    const tx = x + lean * h, ty = y - h;
    const w0 = h * 0.035, w1 = h * 0.022;
    let d = `M${F(x - w0)} ${F(y)}Q${F(x + lean * h * 0.35 - w0)} ${F(y - h * 0.55)} ${F(tx - w1)} ${F(ty)}`
      + `L${F(tx + w1)} ${F(ty)}Q${F(x + lean * h * 0.35 + w0)} ${F(y - h * 0.55)} ${F(x + w0)} ${F(y)}Z`;
    const n = 9;
    for (let i = 0; i < n; i++) {
      const a = (-170 + (i / (n - 1)) * 160 + (r() - 0.5) * 14) * Math.PI / 180;
      const len = h * (0.34 + r() * 0.12), droop = h * (0.1 + r() * 0.08);
      const ex = tx + Math.cos(a) * len, ey = ty + Math.sin(a) * len * 0.55 + droop;
      const mx = tx + Math.cos(a) * len * 0.55, my = ty + Math.sin(a) * len * 0.55 - h * 0.03;
      const nx = -Math.sin(a) * h * 0.028, ny = Math.cos(a) * h * 0.028;
      d += `M${F(tx)} ${F(ty)}Q${F(mx + nx)} ${F(my + ny)} ${F(ex)} ${F(ey)}Q${F(mx - nx)} ${F(my - ny)} ${F(tx)} ${F(ty)}Z`;
    }
    return d;
  }

  /* Low green hills behind a scene set inland: a soft crest with a scrub canopy (f-far). */
  function hills(W, y0, peaks, seed) {
    const r = rng(seed);
    let d = `M-4 ${F(y0 + 1)}`, crest = [];
    for (let x = -4; x <= W + 4; x += 4) {
      let h = 0;
      for (const [px, ph, pw] of peaks) h = Math.max(h, ph * Math.exp(-(((x - px) / pw) ** 2)));
      crest.push([x, y0 - h]);
    }
    for (const [x, y] of crest) d += `L${F(x)} ${F(y)}`;
    d += `L${F(W + 4)} ${F(y0 + 1)}Z`;
    for (const [x, y] of crest) {
      if (y > y0 - 2 || r() < 0.35) continue;
      const rr = 1.3 + r() * 2.2;
      d += `M${F(x - rr)} ${F(y + rr * 0.45)}a${F(rr)} ${F(rr * 0.82)} 0 0 1 ${F(2 * rr)} 0Z`;
    }
    return `<path class="f-far" d="${d}"/>`;
  }

  const arch = (x, yTop, w, yBot) => `M${F(x - w / 2)} ${F(yBot)}V${F(yTop + w / 2)}A${F(w / 2)} ${F(w / 2)} 0 0 1 ${F(x + w / 2)} ${F(yTop + w / 2)}V${F(yBot)}Z`;
  const rect = (x, y, w, h) => `M${F(x)} ${F(y)}h${F(w)}v${F(h)}h${F(-w)}Z`;

  /* THE CAMPUS (Lecture Outline, beside "What to Check"), from the owner's photographs of the
     American University of Antigua at Coolidge, seen from the front across the circular drive:
     - the clock tower in the middle, square and white, an open lookout at the top (lit from within
       at night) under a red pyramid roof, a plain disc for the clock;
     - the entrance portico at its foot, an arch under a small red gable, two tall palms either side;
     - three-storey blocks either side with red hipped roofs and a terracotta ground floor;
     - long two-storey outer wings, red hipped roofs, arched ground floor, a veranda above;
     - the drive's lawn in front, with lamp posts, one of them in the page's hue;
     - the sea behind (the north coast) and green hills to the east.
     Lights come on from the tower outward, wing by wing, in the one pass. */
  function campus(W, H, v, g) {
    const fw = W * 1.1, cx = W * 0.5, base = g.at(cx) + 1, u = fw / 100;
    const r = rng(41);
    let walls = '', shade = '', band = '', roofs = '', roofShade = '', dark = '', lit = '', rails = '';
    const litGroups = [];                     // [group, path] so the lights can come on in turn
    const win = (group, d, on) => { if (on) litGroups.push([group, d]); else dark += d; };

    // A hipped block from x0 to x1: walls to wallTop, roof rising roofH, hips inset by hip.
    const block = (x0, x1, wallTop, roofH, hip, over) => {
      walls += rect(x0, wallTop, x1 - x0, base - wallTop);
      roofs += `M${F(x0 - over)} ${F(wallTop + 0.5)}L${F(x0 + hip)} ${F(wallTop - roofH)}H${F(x1 - hip)}L${F(x1 + over)} ${F(wallTop + 0.5)}Z`;
      // the slope facing the viewer's right catches less light
      roofShade += `M${F((x0 + x1) / 2)} ${F(wallTop + 0.5)}L${F((x0 + x1) / 2)} ${F(wallTop - roofH)}H${F(x1 - hip)}L${F(x1 + over)} ${F(wallTop + 0.5)}Z`;
    };

    // Outer wings: two storeys, long hipped roofs; arcade below, veranda above.
    const oTop = base - 8.4 * u;
    for (const s of [-1, 1]) {
      const a = cx + s * 22 * u, b = cx + s * 49 * u, x0 = Math.min(a, b), x1 = Math.max(a, b);
      block(x0, x1, oTop, 4.6 * u, 3.2 * u, 0.9 * u);
      shade += rect(s < 0 ? x0 : x1 - 1.6 * u, oTop, 1.6 * u, base - oTop);   // the end wall
      rails += `M${F(x0 + 1 * u)} ${F(oTop + 3.9 * u)}H${F(x1 - 1 * u)}`;
      const n = Math.floor((x1 - x0) / (2.35 * u));
      for (let i = 0; i < n; i++) {
        const x = x0 + (i + 0.5) * (x1 - x0) / n, grp = 5 + Math.round(Math.abs(x - cx) / (9 * u));
        win(grp, rect(x - 0.55 * u, oTop + 1.2 * u, 1.1 * u, 1.9 * u), r() < 0.62);
        win(grp, arch(x, oTop + 4.9 * u, 1.3 * u, base - 0.3 * u), r() < 0.28);
      }
    }
    // Inner blocks: three storeys, hipped roofs; terracotta ground floor with arched openings.
    const iTop = base - 13.6 * u;
    for (const s of [-1, 1]) {
      const a = cx + s * 6.8 * u, b = cx + s * 24.5 * u, x0 = Math.min(a, b), x1 = Math.max(a, b);
      block(x0, x1, iTop, 5.6 * u, 4.4 * u, 1 * u);
      band += rect(x0, base - 4.3 * u, x1 - x0, 4.3 * u);
      rails += `M${F(x0 + 0.8 * u)} ${F(iTop + 3.5 * u)}H${F(x1 - 0.8 * u)}M${F(x0 + 0.8 * u)} ${F(iTop + 7.6 * u)}H${F(x1 - 0.8 * u)}`;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const x = x0 + (i + 0.5) * (x1 - x0) / n, grp = 1 + Math.round(Math.abs(x - cx) / (6 * u));
        win(grp, rect(x - 0.6 * u, iTop + 1.1 * u, 1.2 * u, 1.8 * u), r() < 0.72);
        win(grp, rect(x - 0.6 * u, iTop + 5.2 * u, 1.2 * u, 1.8 * u), r() < 0.72);
        win(grp, arch(x, base - 3.5 * u, 1.3 * u, base - 0.3 * u), r() < 0.45);
      }
    }
    // The tower: shaft, the open lookout, cornice, pyramid roof; the clock as a plain disc.
    const tw = 9 * u, tx0 = cx - tw / 2, shaftTop = base - 30 * u, lookH = 4.4 * u;
    walls += rect(tx0, shaftTop, tw, base - shaftTop);
    shade += rect(tx0 + tw - 1.2 * u, shaftTop, 1.2 * u, base - shaftTop);
    walls += rect(tx0 - 0.6 * u, shaftTop - lookH - 0.9 * u, tw + 1.2 * u, 0.9 * u);      // cornice
    roofs += `M${F(tx0 - 1.4 * u)} ${F(shaftTop - lookH - 0.8 * u)}L${F(cx)} ${F(shaftTop - lookH - 5.6 * u)}L${F(tx0 + tw + 1.4 * u)} ${F(shaftTop - lookH - 0.8 * u)}Z`;
    roofShade += `M${F(cx)} ${F(shaftTop - lookH - 0.8 * u)}L${F(cx)} ${F(shaftTop - lookH - 5.6 * u)}L${F(tx0 + tw + 1.4 * u)} ${F(shaftTop - lookH - 0.8 * u)}Z`;
    let posts = '';
    for (let i = 0; i <= 6; i++) posts += rect(tx0 + (i / 6) * (tw - 0.7 * u), shaftTop - lookH, 0.7 * u, lookH);
    const lookout = rect(tx0, shaftTop - lookH, tw, lookH);
    const clock = `<circle class="isl-vclock" cx="${F(cx)}" cy="${F(shaftTop + 6.4 * u)}" r="${F(1.9 * u)}"/>`;
    win(0, rect(cx - 1 * u, shaftTop + 11 * u, 2 * u, 3 * u), true);
    // The portico: an arch under a small red gable.
    const pw = 11 * u, pTop = base - 8.6 * u;
    walls += rect(cx - pw / 2, pTop, pw, base - pTop);
    roofs += `M${F(cx - pw / 2 - 0.8 * u)} ${F(pTop + 0.4 * u)}L${F(cx)} ${F(pTop - 2.6 * u)}L${F(cx + pw / 2 + 0.8 * u)} ${F(pTop + 0.4 * u)}Z`;
    const door = arch(cx, pTop + 1.6 * u, 6.4 * u, base);

    let s = '';
    s += `<path class="isl-vwall" d="${walls}"/>`;
    s += `<path class="isl-vshade" d="${shade}"/>`;
    s += `<path class="isl-vband" d="${band}"/>`;
    s += `<path class="isl-vroof" d="${roofs}"/>`;
    s += `<path class="isl-vroof2" d="${roofShade}"/>`;
    s += `<path class="isl-vrail" d="${rails}" stroke-width="${F(Math.max(1, 0.28 * u))}"/>`;
    s += `<path class="isl-vdark" d="${dark}"/>`;
    // the lookout glows; its posts stand in front of the glow
    s += `<path class="f-pulse isl-vwin" style="--i:0" d="${lookout}"/>`;
    s += `<path class="isl-vwall" d="${posts}"/>`;
    s += clock;
    const byGroup = {};
    for (const [grp, d] of litGroups) byGroup[grp] = (byGroup[grp] || '') + d;
    const groups = Object.keys(byGroup).map(Number).sort((a, b) => a - b);
    const lastG = groups[groups.length - 1];
    for (const grp of groups) {
      s += `<path class="f-pulse isl-vwin${grp === lastG ? ' isl-vlast' : ''}" style="--i:${Math.min(grp + 1, 9)}" d="${byGroup[grp]}"/>`;
    }
    s += `<path class="f-pulse isl-vwin" style="--i:1" d="${door}"/>`;
    // the lit rooms' glow on the facade
    s += `<rect class="isl-vglow" x="${F(cx - 26 * u)}" y="${F(iTop - 2 * u)}" width="${F(52 * u)}" height="${F(base - iTop + 2 * u)}" fill="url(#islvwarm)"/>`;

    // The drive: the lawn's ring road in front, lamp posts along it, one in the page's hue.
    const ey = base + (H - base) * 0.5, erx = W * 0.47, ery = (H - base) * 0.24;
    s += `<ellipse class="isl-vdrive" cx="${F(cx)}" cy="${F(ey)}" rx="${F(erx)}" ry="${F(ery)}" fill="none" stroke-width="${F(Math.max(2, (H - base) * 0.03))}" stroke-opacity=".75"/>`;
    // the planted bed in the middle of the lawn
    s += `<path class="f-near" d="M${F(cx - 9 * u)} ${F(ey)}Q${F(cx)} ${F(ey - ery * 0.55)} ${F(cx + 9 * u)} ${F(ey)}Z"/>`;
    s += `<path class="isl-vspill" d="M${F(cx - 3.2 * u)} ${F(base)}H${F(cx + 3.2 * u)}L${F(cx + 9 * u)} ${F(Math.min(H, ey))}H${F(cx - 9 * u)}Z" fill="url(#islvspill)"/>`;
    const lampH = 6.2 * u;
    let postsD = '', glows = '';
    const lamps = [-0.93, -0.62, 0.62, 0.93];
    lamps.forEach((f, i) => {
      const lx = cx + f * erx, ly = ey - ery * Math.sqrt(Math.max(0, 1 - f * f)) - 1.2 * u;
      postsD += rect(lx - 0.22 * u, ly - lampH, 0.44 * u, lampH);
      if (i === 1) {
        glows += `<circle cx="${F(lx)}" cy="${F(ly - lampH)}" r="${F(3.4 * u)}" fill="url(#islvlamp)"/>`
          + `<circle class="isl-vlamp" cx="${F(lx)}" cy="${F(ly - lampH)}" r="${F(0.75 * u)}"/>`;
      } else {
        glows += `<circle cx="${F(lx)}" cy="${F(ly - lampH)}" r="${F(3 * u)}" fill="url(#islvbulb)"/>`
          + `<circle class="f-pulse" cx="${F(lx)}" cy="${F(ly - lampH)}" r="${F(0.6 * u)}"/>`;
      }
    });
    s += `<path class="isl-vdark" d="${postsD}"/>` + `<g class="isl-vlamps">${glows}</g>`;

    // Palms: two tall ones flanking the portico, smaller ones along the front.
    let palms = '';
    palms += palm(cx - 8.4 * u, base + 1, 25 * u, -0.05, 17) + palm(cx + 8.4 * u, base + 1, 24 * u, 0.06, 29);
    [[-19, 12, -0.08], [19, 11, 0.07], [-36, 10, -0.05], [37, 11, 0.06], [-47, 8, 0.04]].forEach(([dx, h, lean], i) => {
      palms += palm(cx + dx * u, base + 1, h * u, lean, 50 + i * 7);
    });
    s += `<path class="f-near" d="${palms}"/>`;
    return s;
  }

  /* Each piece: its drawing; its world ('coast', the Curtain Bluff view with the far islands and
     Antigua's land, or 'inland', its own hills); the bearing it faces; and its ground. */
  const PIECES = {
    campus: {
      draw: campus,
      world: 'inland',
      horizon: 0.6,
      // Facing north-west across the lawn, so the afterglow lies behind the western wing.
      face: 318,
      ground: (W, H, y0, sea) => ({ xr0: 0, xr1: 0, yL: y0 + sea * 0.42, yP: y0 + sea * 0.42 }),
      hills: (W, y0) => [[W * 0.92, W * 0.13, W * 0.16], [W * 1.1, W * 0.09, W * 0.22], [W * 0.66, W * 0.035, W * 0.1]],
    },
  };

  function extraDefs() {
    return '<defs>'
      + '<radialGradient id="islvwarm"><stop offset="0" class="st-g1" stop-opacity=".26"/><stop offset=".6" class="st-g1" stop-opacity=".08"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvspill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-g1" stop-opacity=".2"/><stop offset="1" class="st-g1" stop-opacity="0"/></linearGradient>'
      + '<radialGradient id="islvlamp"><stop offset="0" class="st-k" stop-opacity=".6"/><stop offset=".5" class="st-k" stop-opacity=".18"/><stop offset="1" class="st-k" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="islvbulb"><stop offset="0" class="st-g1" stop-opacity=".5"/><stop offset=".5" class="st-g1" stop-opacity=".14"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '</defs>';
  }

  function build(W, H, piece) {
    const P = PIECES[piece];
    if (!P || W < 200 || H < 200) return '';
    const ppd = W / 62;
    const y0 = Math.round(H * (P.horizon || 0.58));
    // The anchor: a coast scene puts the sunset a third of the way in; an inland one faces P.face.
    const anchor = P.world === 'coast' ? rel(SKY.d.sun[0]) - (W * 0.3 - W / 2) / ppd : rel(P.face);
    const v = view(W / 2 - anchor * ppd, y0, ppd, W, H);
    const sea = H - y0;
    const k = P.ground(W, H, y0, sea);
    const g = rise(W, H, k.xr0, k.xr1, k.yL, k.yP, 23);
    const reflH = Math.min(sea - 1, 5.5 * ppd);
    const svg = `<svg class="isl-o isl-art" width="${F(W)}" height="${F(H)}" viewBox="0 0 ${F(W)} ${F(H)}">${defs(W, y0, H)}${extraDefs()}`
      + `<rect width="${F(W)}" height="${y0 + 1}" fill="url(#islskyg)"/>`
      + L.milkyWay(v, 'n', 'isl-n')
      + `<rect y="${F(y0 - 2.4 * ppd)}" width="${F(W)}" height="${F(2.4 * ppd)}" fill="url(#islhazeg)"/>`
      + L.glowSky(v, 'd', 'isl-d') + L.glowSky(v, 'n', 'isl-n')
      + stars(v, 'd', [], 'isl-d') + stars(v, 'n', [], 'isl-n')
      + L.planets(v, 'd', [], 'isl-d') + L.planets(v, 'n', [], 'isl-n')
      + L.moon(v, 'd', [], 'isl-d') + L.moon(v, 'n', [], 'isl-n')
      + (P.world === 'coast' ? islands(v, 'f-isl') : '')
      + `<rect y="${y0}" width="${F(W)}" height="${F(sea + 1)}" fill="url(#islseag)"/>`
      + L.glowSea(v, 'd', 'isl-d', reflH) + L.glowSea(v, 'n', 'isl-n', reflH)
      + `<path class="s-hz" d="M0 ${y0 + 0.5}H${F(W)}" stroke-width="1"/>`
      + ripples(v, 0, W, H, [], 9, 0.8)
      + (P.world === 'coast' ? land(v, 0, W, 13, [['d', 'isl-d', 1], ['n', 'isl-n', 0.6]]) : '')
      + (P.hills ? hills(W, g.at(W / 2), P.hills(W, y0), 31) : '')
      + `<path class="f-near" d="${g.d}"/>`
      + P.draw(W, H, v, g)
      + '</svg>';
    return own(svg, 'v');
  }

  A.vignette = function (fig) {
    if (fig._isl) return;
    const card = document.createElement('div');
    card.className = 'isl isl-vig';
    fig.appendChild(card);
    fig._isl = card;
    let last = '', started = false;
    const paint = () => {
      // As tall as the window allows below the sticky offset of the leaf's side (5.5rem,
      // layout-width.css), and never much taller than it is wide.
      const W = Math.floor(fig.clientWidth);
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 20;
      const H = Math.floor(clamp(Math.min(W * 1.02, innerHeight - 5.5 * rem - 24), 320, 820));
      const key = W + 'x' + H;
      if (key === last) return;
      last = key;
      card.style.height = `${H}px`;
      card.innerHTML = build(W, H, fig.dataset.vignette);
      if (!started) {
        started = true;
        if (!reduce.matches) {
          card.classList.add('isl-vrun');
          card.addEventListener('animationend', (e) => {
            if (e.target.classList.contains('isl-vlast')) card.classList.replace('isl-vrun', 'isl-vstill');
          });
        }
      } else {
        card.classList.remove('isl-vrun');
        card.classList.add('isl-vstill');
      }
    };
    paint();
    (A.redraw = A.redraw || []).push(() => { last = ''; paint(); });
    let t;
    if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(t); t = setTimeout(paint, 150); }).observe(fig);
  };
})();
