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
  function campus(W, H, v, g, opt = {}) {
    const fw = W * (opt.fw || 1.1), cx = W * 0.5, base = g.at(cx) + 1, u = fw / 100;
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
    // (In the homepage hero there is no room for the drive: the lamps stand along the lawn's edge.)
    const lawn = !!opt.lawn;
    const ey = lawn ? base + 1.2 * u : base + (H - base) * 0.5, erx = fw * 0.43, ery = lawn ? 0 : (H - base) * 0.24;
    if (!lawn) {
      s += `<ellipse class="isl-vdrive" cx="${F(cx)}" cy="${F(ey)}" rx="${F(erx)}" ry="${F(ery)}" fill="none" stroke-width="${F(Math.max(2, (H - base) * 0.03))}" stroke-opacity=".75"/>`;
      // the planted bed in the middle of the lawn
      s += `<path class="f-near" d="M${F(cx - 9 * u)} ${F(ey)}Q${F(cx)} ${F(ey - ery * 0.55)} ${F(cx + 9 * u)} ${F(ey)}Z"/>`;
    }
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

  /* SHIRLEY HEIGHTS (the For Students landing's head): the view west from the lookout over English
     Harbour and Falmouth Harbour, one of the most photographed views in the Caribbean, so it is drawn
     to be known at a glance. Its landforms are traced from the owner's photographs (the art's source
     folder, references/shirley-heights-*): the open sea on the left out to the horizon; the big
     headland in the middle, its cliff point dropping to the sea on the left and Fort Berkeley's narrow
     spur reaching into the bay at the centre; English Harbour's round bay across the foreground, full
     of white-hulled yachts and Galleon Beach's pale curve on its right shore; Nelson's Dockyard where
     the bay turns right, and the inner harbour running on behind a green spit; Falmouth Harbour's
     strip of water beyond, crowded with the masts of big yachts; the range of hills behind it, a small
     distant point at its left end; the town's slope on the right; the lookout's slope in front. Under
     the true sky facing west-north-west: in May the Sun sets behind the range, as in the owner's own
     dusk photograph. The lights come on dockyard first. */
  function heights(W, H, v) {
    const y0f = v.y0 / H, k = (1 - y0f) / (1 - 0.23), r = rng(73);
    const X = (f) => f * W, Y = (f) => f * H;
    // Land above the horizon at 1.7 times its height in the photograph (a wide card flattens the hills;
    // the same licence as the islands in Island Night).
    const Yp = (f) => H * (y0f + (f - 0.23) * k * (f < 0.23 ? 1.7 : 1));
    const P = (pts) => pts.map(([x, y]) => [X(x), Yp(y)]);
    const poly = (pts) => 'M' + pts.map(([x, y]) => `${F(x)} ${F(y)}`).join('L') + 'Z';
    const line = (pts) => 'M' + pts.map(([x, y]) => `${F(x)} ${F(y)}`).join('L');
    const scrub = (pts, n, s0, s1) => {
      let d = '';
      for (let i = 0; i < pts.length - 1; i++) {
        const [xa, ya] = pts[i], [xb, yb] = pts[i + 1];
        for (let j = 0; j < n; j++) {
          const t2 = r(), x = xa + (xb - xa) * t2, y = ya + (yb - ya) * t2, rr = s0 + r() * (s1 - s0);
          d += `M${F(x - rr)} ${F(y + rr * 0.45)}a${F(rr)} ${F(rr * 0.82)} 0 0 1 ${F(2 * rr)} 0Z`;
        }
      }
      return d;
    };
    const lights = [];          // [x, y, group]: 0 the dockyard, 1 the boats, 2 Falmouth, 3 the slopes
    let s = '';
    // The bay catches the last of the sky: its own water, a shade lighter and, at dusk, faintly teal.
    const bay = P([[0.19, 0.37], [0.3, 0.4], [0.45, 0.41], [0.6, 0.42], [0.72, 0.4], [0.8, 0.52], [0.78, 0.7],
      [0.66, 0.8], [0.3, 0.8], [0.2, 0.62]]);
    s += `<defs><filter id="islvbayf" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${F(W * 0.012)}"/></filter></defs>`
      + `<path d="${poly(bay)}" fill="url(#islvbay)" filter="url(#islvbayf)"/>`;
    // 1. The far hills: the small distant point on the left, then the main range behind Falmouth.
    const point = P([[0.295, 0.233], [0.31, 0.222], [0.33, 0.214], [0.355, 0.219], [0.375, 0.228], [0.4, 0.224],
      [0.43, 0.207], [0.47, 0.192], [0.51, 0.2], [0.55, 0.205], [0.56, 0.233]]);
    s += `<path class="f-isl" d="${poly(point)}"/>`;
    const range = P([[0.45, 0.25], [0.46, 0.236], [0.475, 0.226], [0.49, 0.214], [0.51, 0.2], [0.53, 0.186], [0.56, 0.168], [0.585, 0.154], [0.61, 0.164],
      [0.645, 0.149], [0.67, 0.16], [0.7, 0.176], [0.73, 0.19], [0.76, 0.198], [0.8, 0.204], [0.85, 0.199],
      [0.9, 0.21], [0.95, 0.214], [1.02, 0.22], [1.02, 0.285]]);
    s += `<path class="f-far" d="${poly(range)}${scrub(range.slice(1, -1), 4, 0.7, 1.8)}"/>`;
    for (let i = 0; i < 30; i++) {             // villages on the range's lower slopes
      const x = 0.55 + r() * 0.47;
      lights.push([X(x), Yp(0.25 + r() * 0.03), 3]);
    }
    // 2. Falmouth Harbour (the sea's own water, left clear) and its big yachts' masts and lights.
    let masts = '';
    for (let i = 0; i < 11; i++) {
      const x = X(0.72 + r() * 0.26), foot = Yp(0.3 + r() * 0.012), top = foot - Y(0.035 + r() * 0.035);
      masts += `M${F(x)} ${F(foot)}V${F(top)}`;
      lights.push([x, top, 2]);
    }
    for (let i = 0; i < 22; i++) lights.push([X(0.58 + r() * 0.42), Yp(0.29 + r() * 0.025), 2]);
    // the low land between the two harbours, and the town's slope on the right
    const between = P([[0.6, 0.326], [0.7, 0.32], [0.8, 0.325], [0.9, 0.318], [1.02, 0.318], [1.02, 0.358], [0.62, 0.358]]);
    s += `<path class="f-far" d="${poly(between)}"/>`;
    const town = P([[0.705, 0.45], [0.72, 0.432], [0.75, 0.418], [0.8, 0.412], [0.86, 0.418], [0.92, 0.41],
      [1.02, 0.402], [1.02, 1.02], [0.7, 1.02], [0.74, 0.74], [0.785, 0.66], [0.795, 0.6], [0.78, 0.56],
      [0.745, 0.54], [0.72, 0.52], [0.71, 0.48]]);
    s += `<path class="f-near" d="${poly(town)}${scrub(town.slice(0, 7), 5, 0.9, 2.2)}"/>`;
    for (let i = 0; i < 34; i++) lights.push([X(0.74 + r() * 0.27), Yp(0.43 + r() * 0.2), 3]);
    // Galleon Beach: the pale curve of sand on the bay's right shore
    s += `<path class="isl-vsand" d="${line(P([[0.748, 0.545], [0.772, 0.558], [0.79, 0.585], [0.792, 0.615], [0.784, 0.655]]))}" stroke-width="${F(Math.max(1.5, Y(0.01)))}"/>`;
    // The inner harbour, running right from the dockyard behind a green spit, with its masts
    for (let i = 0; i < 12; i++) {
      const x = X(0.73 + r() * 0.24), foot = Yp(0.395 + r() * 0.01), top = foot - Y(0.03 + r() * 0.03);
      masts += `M${F(x)} ${F(foot)}V${F(top)}`;
      lights.push([x, top, 0]);
    }
    // 3. The headland: its cliff point on the left, its crest, and Fort Berkeley's spur into the bay.
    const head = P([[0.19, 0.378], [0.192, 0.366], [0.199, 0.352], [0.21, 0.341], [0.226, 0.331], [0.25, 0.318],
      [0.28, 0.303], [0.31, 0.29], [0.34, 0.279], [0.37, 0.27], [0.4, 0.266], [0.43, 0.268], [0.46, 0.276], [0.5, 0.284], [0.54, 0.289],
      [0.58, 0.295], [0.62, 0.31], [0.66, 0.33], [0.7, 0.37], [0.715, 0.41], [0.7, 0.425], [0.66, 0.432],
      [0.62, 0.436], [0.58, 0.44], [0.535, 0.442],
      // Fort Berkeley: a narrow rocky finger pointing into the bay
      [0.522, 0.458], [0.513, 0.482], [0.5, 0.5], [0.486, 0.508], [0.474, 0.5], [0.478, 0.482], [0.49, 0.462],
      [0.494, 0.445], [0.47, 0.434], [0.44, 0.422], [0.4, 0.415], [0.35, 0.41], [0.3, 0.404], [0.25, 0.392],
      [0.215, 0.386]]);
    s += `<path class="f-near" d="${poly(head)}${scrub(head.slice(2, 17), 6, 0.9, 2.3)}"/>`;
    const shore = head.slice(18);
    s += `<path class="isl-vshore" d="${line(shore)}" stroke-width="1"/>`;
    s += `<path class="isl-vsurf" d="${line(P([[0.186, 0.366], [0.19, 0.38], [0.2, 0.388], [0.215, 0.39], [0.235, 0.396]]))}" stroke-width="${F(Math.max(1.2, Y(0.006)))}"/>`;
    // 4. Nelson's Dockyard, where the bay turns right: a quay of masts and the brightest lights.
    for (let i = 0; i < 11; i++) {
      const x = X(0.625 + i * 0.008 + r() * 0.004), foot = Yp(0.445 + r() * 0.01), top = foot - Y(0.05 + r() * 0.035);
      masts += `M${F(x)} ${F(foot)}V${F(top)}`;
      lights.push([x, top, 0]);
    }
    for (let i = 0; i < 18; i++) lights.push([X(0.62 + r() * 0.1), Yp(0.425 + r() * 0.03), 0]);
    // 5. Yachts at anchor across the bay: white hulls, masts, masthead lights and their reflections.
    let hulls = '', refl = '';
    const boats = [[0.385, 0.62], [0.42, 0.6], [0.455, 0.605], [0.49, 0.61], [0.5, 0.57], [0.535, 0.56], [0.555, 0.64],
      [0.58, 0.6], [0.605, 0.55], [0.62, 0.53], [0.635, 0.585], [0.655, 0.59], [0.67, 0.56], [0.685, 0.55],
      [0.62, 0.68], [0.55, 0.52], [0.45, 0.68], [0.52, 0.66], [0.7, 0.6], [0.4, 0.55]];
    boats.forEach(([fx, fy], i) => {
      const x = X(fx), y = Yp(fy), hw = X(0.008), mh = Y(0.05 + (i % 4) * 0.008);
      hulls += `M${F(x - hw)} ${F(y)}L${F(x + hw)} ${F(y)}L${F(x + hw * 0.7)} ${F(y + Y(0.009))}L${F(x - hw * 0.7)} ${F(y + Y(0.009))}Z`;
      masts += `M${F(x)} ${F(y)}V${F(y - mh)}`;
      lights.push([x, y - mh, 1]);
      refl += `<rect x="${F(x - 0.6)}" y="${F(y + Y(0.011))}" width="1.2" height="${F(Y(0.05))}" fill="url(#islvrefl)"/>`;
    });
    s += `<path class="isl-vmast" d="${masts}" stroke-width="0.7"/>`;
    s += `<path class="isl-vhull" d="${hulls}"/>`;
    s += `<g class="isl-vlamps">${refl}</g>`;
    // 6. The lookout: the slope on the left, the rocks and scrub in front, organ-pipe cactus, a lantern.
    const slope = P([[-0.02, 0.535], [0.05, 0.545], [0.1, 0.56], [0.15, 0.575], [0.19, 0.592], [0.22, 0.612],
      [0.245, 0.66], [0.26, 0.74], [0.3, 0.76], [0.36, 0.73], [0.42, 0.77], [0.5, 0.79], [0.58, 0.8], [0.64, 0.74],
      [0.68, 0.67], [0.73, 0.66], [0.8, 0.7], [0.88, 0.72], [1.02, 0.74], [1.02, 1.05], [-0.02, 1.05]]);
    s += `<path class="f-near" d="${poly(slope)}${scrub(slope.slice(0, 19), 6, 1.2, 3.4)}"/>`;
    const lx = X(0.43), ly = Yp(0.772);
    s += `<path class="f-near" d="M${F(lx - 1)} ${F(ly + Y(0.02))}V${F(ly - Y(0.05))}H${F(lx + 1)}V${F(ly + Y(0.02))}Z"/>`;
    s += `<circle cx="${F(lx)}" cy="${F(ly - Y(0.06))}" r="${F(Y(0.055))}" fill="url(#islvlamp)"/>`;
    s += `<circle class="isl-vlamp" cx="${F(lx)}" cy="${F(ly - Y(0.06))}" r="${F(Math.max(1.5, Y(0.008)))}"/>`;
    // The lights, grouped so they come on in turn: the dockyard, the boats, Falmouth, then the slopes.
    const groups = [[], [], [], []];
    for (const [x, y, g] of lights) groups[g].push(`M${F(x)} ${F(y)}h0`);
    const widths = [2.2, 1.6, 1.5, 1.25];
    groups.forEach((d, g) => {
      if (d.length) s += `<path class="s-vlight isl-vwin${g === 3 ? ' isl-vlast' : ''}" style="--i:${g * 2}" d="${d.join('')}" stroke-width="${widths[g]}"/>`;
    });
    s += `<ellipse class="isl-vglow" cx="${F(X(0.67))}" cy="${F(Yp(0.43))}" rx="${F(X(0.07))}" ry="${F(Y(0.06))}" fill="url(#islvwarm)"/>`;
    return s;
  }

  /* THE PILLARS OF HERCULES (the guides index's head): the limestone cliff at the east side of English
     Harbour's mouth, below Shirley Heights, for centuries a landmark sailors steered by. Seen from the
     water facing north, traced from the sea-level reference in the art's source folder
     (references/web-pillars-of-hercules-sea): the cliff is its own mass, a scrub-capped dome sloping
     down on the left and ending steeply on the right in fallen blocks; its face is finely layered in
     thin, wavering strata; and along its foot the sea has worn tall hollows, narrow and rounded at the
     top and flaring below, that leave the pillars standing between them like organ pipes. The rock
     shelf, loose blocks and surf at the waterline; the harbour's far shore low on the left; the open
     sea on the right; a pennant in the page's hue on the flagpole above the cliff. */
  function pillars(W, H, v) {
    const y0 = v.y0, X = (f) => f * W, Y = (f) => f * H, r = rng(91);
    const P = (pts) => pts.map(([x, y]) => [X(x), Y(y)]);
    const poly = (pts) => 'M' + pts.map(([x, y]) => `${F(x)} ${F(y)}`).join('L') + 'Z';
    const scrub = (pts, n, s0, s1) => {
      let d = '';
      for (let i = 0; i < pts.length - 1; i++) {
        const [xa, ya] = pts[i], [xb, yb] = pts[i + 1];
        for (let j = 0; j < n; j++) {
          const t2 = r(), x = xa + (xb - xa) * t2, y = ya + (yb - ya) * t2, rr = s0 + r() * (s1 - s0);
          d += `M${F(x - rr)} ${F(y + rr * 0.4)}a${F(rr)} ${F(rr * 0.85)} 0 0 1 ${F(2 * rr)} 0Z`;
        }
      }
      return d;
    };
    const lights = [];
    let s = `<rect y="${F(y0)}" width="${F(W)}" height="${F(H - y0)}" fill="url(#islvbay)"/>`;
    // The harbour's far shore, low on the left, with a few lit houses.
    const far = P([[-0.02, 0.69], [0.02, 0.665], [0.06, 0.66], [0.1, 0.675], [0.12, 0.7], [-0.02, 0.7]]);
    s += `<path class="f-far" d="${poly(far)}${scrub(far.slice(0, 4), 4, 0.7, 1.6)}"/>`;
    for (let i = 0; i < 5; i++) lights.push([X(0.005 + r() * 0.1), Y(0.668 + r() * 0.02), 1]);
    // 1. The cliff's outline: the scrub cap's dome, then the face down to the waterline.
    const crest = [[0.04, 0.66], [0.08, 0.56], [0.13, 0.48], [0.19, 0.42], [0.26, 0.37], [0.33, 0.335], [0.4, 0.31],
      [0.47, 0.295], [0.54, 0.29], [0.61, 0.3], [0.68, 0.32], [0.75, 0.35], [0.81, 0.39], [0.86, 0.43], [0.9, 0.48],
      [0.93, 0.54], [0.955, 0.6], [0.965, 0.66]];
    // the line where the scrub gives way to the bare face
    const lip = [[0.1, 0.58], [0.16, 0.5], [0.22, 0.455], [0.3, 0.42], [0.38, 0.4], [0.46, 0.39], [0.54, 0.385],
      [0.62, 0.39], [0.7, 0.405], [0.77, 0.43], [0.83, 0.465], [0.88, 0.51], [0.92, 0.57]];
    const base = 0.72;
    const face = P([...lip, [0.95, 0.63], [0.955, base], [0.08, base], [0.07, 0.66]]);
    const cap = P([...crest, [0.955, 0.63], ...lip.slice().reverse(), [0.06, 0.67]]);
    s += `<defs><clipPath id="islvface"><path d="${poly(face)}"/></clipPath></defs>`;
    s += `<path class="isl-vstone" d="${poly(face)}"/>`;
    // 2. The strata: many thin wavering bands across the face.
    let strata = '';
    for (let k = 0; k < 14; k++) {
      const y = 0.4 + k * 0.023;
      let d = '';
      for (let x = 0.06; x <= 0.97; x += 0.015) d += `${d ? 'L' : 'M'}${F(X(x))} ${F(Y(y + Math.sin(x * 19 + k * 0.7) * 0.005 + (x - 0.5) * 0.02 * Math.sin(k)))}`;
      strata += d;
    }
    s += `<g clip-path="url(#islvface)"><path class="isl-vstrata" d="${strata}" stroke-width="${F(Math.max(0.8, Y(0.0035)))}"/></g>`;
    // 3. The pillars: hollows narrow and rounded at the top, flaring toward the foot, of uneven size.
    let hollows = '';
    const cols = [[0.15, 0.03, 0.62], [0.2, 0.024, 0.6], [0.255, 0.036, 0.57], [0.315, 0.03, 0.555], [0.37, 0.042, 0.535],
      [0.43, 0.034, 0.55], [0.49, 0.046, 0.53], [0.555, 0.036, 0.545], [0.615, 0.044, 0.53], [0.68, 0.034, 0.55],
      [0.74, 0.04, 0.545], [0.8, 0.03, 0.57], [0.85, 0.026, 0.6]];
    // Each hollow is a pointed arch as wide at its foot as the spacing, so neighbours meet at the
    // waterline and the stone between them stands as a column, broad where it joins the face above.
    for (let i = 0; i < cols.length; i++) {
      const [cx, , cf] = cols[i];
      const gap = i + 1 < cols.length ? cols[i + 1][0] - cx : cx - cols[i - 1][0];
      const x = X(cx + (r() - 0.5) * 0.004), wb = X(gap * 0.98), crown = Y(cf + (r() - 0.5) * 0.02), foot = Y(base);
      const shoulder = crown + (foot - crown) * 0.42;
      hollows += `M${F(x - wb / 2)} ${F(foot)}C${F(x - wb * 0.46)} ${F(shoulder)} ${F(x - wb * 0.2)} ${F(crown + (foot - crown) * 0.12)} ${F(x)} ${F(crown)}`
        + `C${F(x + wb * 0.2)} ${F(crown + (foot - crown) * 0.12)} ${F(x + wb * 0.46)} ${F(shoulder)} ${F(x + wb / 2)} ${F(foot)}Z`;
    }
    s += `<path class="isl-vhollow" d="${hollows}" fill="url(#islvhol)"/>`;
    // 4. The scrub cap over the face.
    s += `<path class="f-near" d="${poly(cap)}${scrub(P(crest.slice(1, 16)), 7, 1.3, 3.2)}"/>`;
    // 5. The flagpole on the dome, its pennant in the page's hue.
    const fx = X(0.43), fy = Y(0.305);
    s += `<path class="isl-vmast" d="M${F(fx)} ${F(fy)}V${F(fy - Y(0.16))}" stroke-width="1.3"/>`;
    s += `<path class="isl-vpennant" d="M${F(fx)} ${F(fy - Y(0.16))}L${F(fx + X(0.028))} ${F(fy - Y(0.145))}L${F(fx)} ${F(fy - Y(0.13))}Z"/>`;
    // 6. The foot: the rock shelf, fallen blocks at the right end, and the surf.
    let blocks = '';
    for (let i = 0; i < 14; i++) {
      const x = X(0.07 + r() * 0.9), y = Y(base + 0.005 + r() * 0.02), rr = X(0.004 + r() * 0.009);
      blocks += `M${F(x - rr)} ${F(y)}a${F(rr)} ${F(rr * 0.75)} 0 0 1 ${F(2 * rr)} 0Z`;
    }
    for (let i = 0; i < 8; i++) {
      const x = X(0.93 + r() * 0.06), y = Y(0.66 + r() * 0.07), rr = X(0.007 + r() * 0.01);
      blocks += `M${F(x - rr)} ${F(y)}a${F(rr)} ${F(rr * 0.8)} 0 0 1 ${F(2 * rr)} 0Z`;
    }
    const shelf = P([[0.05, base + 0.012], [0.1, base], [0.95, base], [0.98, base + 0.02], [0.9, base + 0.035], [0.1, base + 0.035]]);
    s += `<path class="f-near" d="${poly(shelf)}"/><path class="isl-vstone" d="${blocks}"/>`;
    let surf = '';
    for (let i = 0; i < 18; i++) {
      const x = 0.06 + r() * 0.9, len = 0.02 + r() * 0.05;
      surf += `M${F(X(x))} ${F(Y(base + 0.04 + r() * 0.012))}h${F(X(len))}`;
    }
    s += `<path class="isl-vsurf" d="${surf}" stroke-width="${F(Math.max(1.2, Y(0.006)))}"/>`;
    // The far shore's lights, in the one pass.
    const d = lights.map(([x, y]) => `M${F(x)} ${F(y)}h0`).join('');
    s += `<path class="s-vlight isl-vwin isl-vlast" style="--i:2" d="${d}" stroke-width="1.5"/>`;
    return s;
  }

  /* CURTAIN BLUFF (the For Faculty & Staff landing's head): the homepage's view until the campus took
     its place (owner, 2026-09-27), moved here as he asked. The view west from the tip of Curtain Bluff
     at the same moment, drawn by the coast world (Montserrat, Redonda, Nevis and Guadeloupe on the
     horizon and Antigua's own hills, at true bearings), with the sunset a third of the way in; this
     adds the magnificent frigatebird, soaring in the east wind in the open sky right of the afterglow. */
  function curtainBluff(W, H, v) {
    const B = L.BIRD;
    if (!B) return '';
    const [bx0, by0, bx1, by1] = B.box, span = clamp(W * 0.1, 56, 100), k = span / (bx1 - bx0);
    const x = W * 0.64, y = v.y0 * 0.34;
    return `<g transform="translate(${F(x - bx0 * k)} ${F(y - by0 * k)}) scale(${F(k * 1000) / 1000})"><path class="f-bird" d="${B.d}"/></g>`;
  }

  /* ST JOHN'S HARBOUR (the News & Events landing's head), where the island's news comes in by sea:
     seen from Fort James's rampart at the harbour mouth, looking in across the water at night, from the
     references in the art's source folder (references/web-st-johns-harbour-cruise-ships,
     owner-st-johns-cruise-ship, web-fort-james-*): a cannon on the rampart in front, as it still
     stands; two cruise ships lit up at the quay, broadside, their decks in rows of lit cabins; the
     town behind them, red roofs and warm lights climbing the hill; and on the skyline the cathedral's
     twin towers with their cupolas, floodlit, the mark of St John's; the hills beyond. The fort's lamp
     takes the page's hue. Lights come on quay first, then the ships, then the town. */
  function harbour(W, H, v) {
    const y0 = v.y0, X = (f) => f * W, Y = (f) => f * H, r = rng(57);
    const P = (pts) => pts.map(([x, y]) => [X(x), Y(y)]);
    const poly = (pts) => 'M' + pts.map(([x, y]) => `${F(x)} ${F(y)}`).join('L') + 'Z';
    const scrub = (pts, n, s0, s1) => {
      let d = '';
      for (let i = 0; i < pts.length - 1; i++) {
        const [xa, ya] = pts[i], [xb, yb] = pts[i + 1];
        for (let j = 0; j < n; j++) {
          const t2 = r(), x = xa + (xb - xa) * t2, y = ya + (yb - ya) * t2, rr = s0 + r() * (s1 - s0);
          d += `M${F(x - rr)} ${F(y + rr * 0.45)}a${F(rr)} ${F(rr * 0.82)} 0 0 1 ${F(2 * rr)} 0Z`;
        }
      }
      return d;
    };
    const lights = [[], [], [], []];   // 0 quay, 1 ships, 2 town, 3 far hills
    let s = `<rect y="${F(y0)}" width="${F(W)}" height="${F(H - y0)}" fill="url(#islvbay)"/>`;
    // 1. The hills beyond the town, with a few far lights.
    const hills = P([[-0.02, 0.5], [0.08, 0.44], [0.18, 0.4], [0.3, 0.37], [0.42, 0.36], [0.52, 0.33], [0.6, 0.29],
      [0.68, 0.3], [0.76, 0.34], [0.86, 0.37], [0.95, 0.35], [1.02, 0.36], [1.02, 0.52], [-0.02, 0.52]]);
    s += `<path class="f-isl" d="${poly(hills)}${scrub(hills.slice(0, 12), 4, 0.8, 1.8)}"/>`;
    for (let i = 0; i < 18; i++) lights[3].push([X(r()), Y(0.4 + r() * 0.1)]);
    // 2. The cathedral on its hill, floodlit: two towers with cupolas and small lanterns, the nave
    //    between them under a gable.
    const cx = X(0.71), tw = X(0.017), gap = X(0.03), foot = Y(0.37), tt = Y(0.215), lit = [];
    let cath = `M${F(cx - gap / 2 - tw)} ${F(foot)}V${F(Y(0.31))}H${F(cx + gap / 2 + tw)}V${F(foot)}Z`;
    cath += `M${F(cx - gap / 2)} ${F(Y(0.31))}L${F(cx)} ${F(Y(0.28))}L${F(cx + gap / 2)} ${F(Y(0.31))}Z`;
    let domes = '';
    for (const sx of [-1, 1]) {
      const x = cx + sx * (gap / 2 + tw / 2);
      cath += `M${F(x - tw / 2)} ${F(Y(0.31))}V${F(tt)}H${F(x + tw / 2)}V${F(Y(0.31))}Z`;
      cath += `M${F(x - tw * 0.62)} ${F(tt + 1)}H${F(x + tw * 0.62)}V${F(tt - Y(0.008))}H${F(x - tw * 0.62)}Z`;
      domes += `M${F(x - tw * 0.48)} ${F(tt - Y(0.008))}A${F(tw * 0.48)} ${F(tw * 0.62)} 0 0 1 ${F(x + tw * 0.48)} ${F(tt - Y(0.008))}Z`;
      domes += `M${F(x - tw * 0.1)} ${F(tt - Y(0.008) - tw * 0.6)}V${F(tt - Y(0.008) - tw * 1.05)}H${F(x + tw * 0.1)}V${F(tt - Y(0.008) - tw * 0.6)}Z`;
      lit.push(`M${F(x - tw * 0.18)} ${F(Y(0.25))}h${F(tw * 0.36)}v${F(Y(0.028))}h${F(-tw * 0.36)}Z`);
    }
    s += `<ellipse cx="${F(cx)}" cy="${F(Y(0.29))}" rx="${F(X(0.06))}" ry="${F(Y(0.1))}" fill="url(#islvwarm)"/>`;
    s += `<path class="isl-vcath" d="${cath}"/><path class="isl-vroof2" d="${domes}"/>`;
    s += `<path class="isl-vcathwin" d="${lit.join('')}"/>`;
    // 3. The town: rows of houses climbing the hill from the quay, red roofs, warm windows.
    let roofs = '', walls = '';
    const house = (x, rowY, w, h) => {
      walls += `M${F(x)} ${F(rowY)}v${F(-h)}h${F(w)}v${F(h)}Z`;
      roofs += `M${F(x - 1)} ${F(rowY - h)}L${F(x + w * 0.5)} ${F(rowY - h - Math.min(Y(0.016), w * 0.4))}L${F(x + w + 1)} ${F(rowY - h)}Z`;
    };
    const slope = P([[-0.02, 0.43], [0.1, 0.41], [0.25, 0.395], [0.4, 0.39], [0.55, 0.38], [0.66, 0.37], [0.76, 0.375],
      [0.88, 0.395], [1.02, 0.4], [1.02, 0.6], [-0.02, 0.6]]);
    s += `<path class="f-far" d="${poly(slope)}"/>`;
    for (let row = 0; row < 6; row++) {
      const rowY = Y(0.58 - row * 0.034), n = 40 - row * 4;
      for (let i = 0; i < n; i++) {
        const x = X(-0.01 + (i + r() * 0.6) * (1.02 / n)), w = X(0.013 + r() * 0.014), h = Y(0.014 + r() * 0.01);
        if (row > 1 && Math.abs(x - cx) < X(0.05)) continue;          // the cathedral's close
        house(x, rowY + Y((r() - 0.5) * 0.01), w, h);
        if (r() < 0.7) lights[2].push([x + w * (0.25 + r() * 0.5), rowY - h * 0.45]);
      }
    }
    for (let i = 0; i < 26; i++) lights[2].push([X(r()), Y(0.33 + r() * 0.06)]);
    s += `<path class="isl-vtown" d="${walls}"/><path class="isl-vroof" d="${roofs}"/>`;
    // the quay's edge, with its lamps
    s += `<path class="f-near" d="${poly(P([[-0.02, 0.585], [1.02, 0.585], [1.02, 0.6], [-0.02, 0.6]]))}"/>`;
    for (let i = 0; i < 14; i++) lights[0].push([X(0.04 + i * 0.07 + r() * 0.02), Y(0.583)]);
    // 4. Two cruise ships at the quay, broadside: a rounded stern on the left, the bow raked forward on
    //    the right, the hull's sheer rising to the bow, a dark band at the waterline, decks stepping
    //    back from the bow in rows of lit cabins, the funnel aft.
    const ship = (x0, x1, wl, k) => {
      const L = x1 - x0, hh = Y(0.06) * k, dh = Y(0.028) * k, decks = 5, deckTop = wl - hh - decks * dh;
      let hull = `M${F(x0 + L * 0.03)} ${F(wl)}H${F(x1 - L * 0.07)}`
        + `L${F(x1)} ${F(wl - hh * 1.18)}L${F(x0 + L * 0.02)} ${F(wl - hh * 0.98)}`
        + `Q${F(x0 - L * 0.012)} ${F(wl - hh * 0.9)} ${F(x0 + L * 0.03)} ${F(wl)}Z`;
      const band = `M${F(x0 + L * 0.03)} ${F(wl)}H${F(x1 - L * 0.07)}L${F(x1 - L * 0.062)} ${F(wl - hh * 0.2)}H${F(x0 + L * 0.018)}Z`;
      let sup = '', lines = '';
      for (let i = 0; i < decks; i++) {
        const yb = wl - hh * 1.02 - i * dh, yt = yb - dh;
        const a = x0 + L * (0.04 + i * 0.012), bb = x1 - L * (0.16 + i * 0.045);
        sup += `M${F(a)} ${F(yb + 1)}V${F(yt)}H${F(bb)}L${F(bb + dh * 1.4)} ${F(yb + 1)}Z`;
        lines += `M${F(a)} ${F(yt)}H${F(bb)}`;
        for (let x = a + L * 0.012; x < bb; x += L * 0.0105) if (r() < 0.86) lights[1].push([x, yb - dh * 0.5]);
      }
      const fx = x0 + L * 0.2;
      sup += `M${F(fx)} ${F(deckTop + 1)}L${F(fx + L * 0.01)} ${F(deckTop - dh * 1.3)}H${F(fx + L * 0.075)}L${F(fx + L * 0.08)} ${F(deckTop + 1)}Z`;
      for (let x = x0 + L * 0.05; x < x1 - L * 0.1; x += L * 0.022) lights[1].push([x, wl - hh * 0.5]);
      return { hull, band, sup, lines };
    };
    const far = ship(X(0.6), X(0.95), Y(0.635), 0.72), near = ship(X(0.24), X(0.7), Y(0.71), 1);
    for (const [sh, cls] of [[far, 'isl-vship2'], [near, 'isl-vship']]) {
      s += `<path class="${cls}" d="${sh.hull}${sh.sup}"/>`;
      s += `<path class="isl-vhullband" d="${sh.band}"/>`;
      s += `<path class="isl-vdeck" d="${sh.lines}" stroke-width="0.8"/>`;
    }
    // reflections of the ships' lights in the harbour
    let refl = '';
    for (let i = 0; i < 30; i++) {
      const x = X(0.26 + r() * 0.68);
      refl += `<rect x="${F(x - 0.7)}" y="${F(Y(0.715 + r() * 0.02))}" width="1.4" height="${F(Y(0.05 + r() * 0.06))}" fill="url(#islvrefl)"/>`;
    }
    s += `<g class="isl-vlamps">${refl}</g>`;
    // 5. Fort James's rampart in front, and its cannon on its carriage pointing into the harbour.
    const ramp = P([[-0.02, 0.8], [0.08, 0.795], [0.18, 0.81], [0.28, 0.84], [0.36, 0.88], [0.42, 0.94], [0.45, 1.03], [-0.02, 1.03]]);
    s += `<path class="f-near" d="${poly(ramp)}${scrub(P([[-0.02, 0.8], [0.08, 0.795], [0.18, 0.81]]), 4, 1.2, 2.8)}"/>`;
    const gx = X(0.105), gy = Y(0.755), bl = X(0.13), br = Y(0.026);
    // barrel: tapering from breech to muzzle, raised a few degrees
    s += `<g transform="rotate(-7 ${F(gx)} ${F(gy)})"><path class="isl-vcannon" d="M${F(gx - bl * 0.32)} ${F(gy - br * 1.05)}`
      + `L${F(gx + bl * 0.68)} ${F(gy - br * 0.72)}V${F(gy - br * 0.18)}L${F(gx - bl * 0.32)} ${F(gy + br * 0.05)}Z`
      + `M${F(gx - bl * 0.32)} ${F(gy - br * 0.5)}m${F(-br * 0.55)} 0a${F(br * 0.55)} ${F(br * 0.55)} 0 1 0 ${F(br * 1.1)} 0a${F(br * 0.55)} ${F(br * 0.55)} 0 1 0 ${F(-br * 1.1)} 0Z"/></g>`;
    // carriage and wheels
    s += `<path class="isl-vcannon" d="M${F(gx - bl * 0.3)} ${F(gy + br * 1.2)}L${F(gx - bl * 0.18)} ${F(gy - br * 0.2)}H${F(gx + bl * 0.16)}L${F(gx + bl * 0.26)} ${F(gy + br * 1.2)}Z"/>`;
    for (const wx of [-0.2, 0.17]) s += `<circle class="isl-vcannon" cx="${F(gx + bl * wx)}" cy="${F(gy + br * 1.25)}" r="${F(br * 0.95)}"/>`;
    // the fort's lamp, in the page's hue
    const lx = X(0.028), ly = Y(0.73);
    s += `<path class="f-near" d="M${F(lx - 1)} ${F(Y(0.8))}V${F(ly)}H${F(lx + 1)}V${F(Y(0.8))}Z"/>`;
    s += `<circle cx="${F(lx)}" cy="${F(ly)}" r="${F(Y(0.06))}" fill="url(#islvlamp)"/>`;
    s += `<circle class="isl-vlamp" cx="${F(lx)}" cy="${F(ly)}" r="${F(Math.max(1.5, Y(0.008)))}"/>`;
    // The lights, grouped so they come on in turn.
    const widths = [2.0, 1.25, 1.35, 1.1];
    lights.forEach((pts, g) => {
      if (pts.length) s += `<path class="s-vlight isl-vwin${g === 3 ? ' isl-vlast' : ''}" style="--i:${g * 2}" d="${pts.map(([x, y]) => `M${F(x)} ${F(y)}h0`).join('')}" stroke-width="${widths[g]}"/>`;
    });
    return s;
  }

  /* THE HOMEPAGE HERO'S SCENE (owner, 2026-09-27): in the bold hero (desktop, from 68.75em) the campus
     stands on its lawn at the card's foot, in the sky's space right of the words, from x0 to x1, under
     the hero's own sky, which island-core.js draws as before; the far islands and Antigua's coast are
     left out there, being untrue from Coolidge. Returns the drawing (ids unprefixed: the hero gives
     every id its own prefix) and the box the frigatebird must keep clear of. Null when the space is too
     narrow for the campus to read. */
  A.heroScene = function (v, x0, x1, H) {
    const Wr = x1 - x0;
    if (Wr < 240) return null;
    const base = H - Math.max(6, H * 0.02);
    const g = { at: () => base - 1 };
    const lawnG = rise(Wr, H, -Wr * 0.02, Wr * 0.1, H + 4, base, 29);
    const inner = `<path class="f-near" d="${lawnG.d}"/>` + campus(Wr, H, v, g, { fw: 1.02, lawn: true });
    const u = Wr * 1.02 / 100, top = base - 42 * u;
    return {
      svg: extraDefs() + `<g transform="translate(${F(x0)} 0)">${inner}</g>`,
      box: [x0 + Wr * 0.02, top - 8, x1, H],
    };
  };

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
    'curtain-bluff': {
      draw: curtainBluff,
      world: 'coast',
      horizon: 0.7,
      // the Moon, about 24 degrees up, and Venus in the sky above the horizon
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 29),
      under: false,
      ground: null,
    },
    'st-johns-harbour': {
      draw: harbour,
      world: 'inland',
      horizon: 0.5,
      // From Fort James, south-east into the harbour at the town.
      face: 128,
      ground: null,
    },
    'pillars-of-hercules': {
      draw: pillars,
      world: 'inland',
      horizon: 0.7,
      // From a boat in the harbour mouth, facing north at the cliff: the northern sky above, the last
      // western light on its face.
      face: 12,
      ground: null,
    },
    'shirley-heights': {
      draw: heights,
      world: 'inland',
      horizon: 0.3,
      // From the lookout west-north-west across English Harbour to Falmouth: in May the Sun sets behind
      // the range (the owner's dusk photograph), so the afterglow sits just left of its peaks.
      face: 294,
      ground: null,
    },
  };

  function extraDefs() {
    return '<defs>'
      + '<radialGradient id="islvwarm"><stop offset="0" class="st-g1" stop-opacity=".26"/><stop offset=".6" class="st-g1" stop-opacity=".08"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvspill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-g1" stop-opacity=".2"/><stop offset="1" class="st-g1" stop-opacity="0"/></linearGradient>'
      + '<radialGradient id="islvlamp"><stop offset="0" class="st-k" stop-opacity=".6"/><stop offset=".5" class="st-k" stop-opacity=".18"/><stop offset="1" class="st-k" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvrefl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-g1" stop-opacity=".55"/><stop offset="1" class="st-g1" stop-opacity="0"/></linearGradient>'
      + '<linearGradient id="islvhol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-vhol" stop-opacity=".78"/><stop offset=".6" class="st-vhol" stop-opacity=".5"/><stop offset="1" class="st-vhol" stop-opacity=".32"/></linearGradient>'
      + '<linearGradient id="islvbay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-vbay" stop-opacity=".55"/><stop offset="1" class="st-vbay" stop-opacity=".35"/></linearGradient>'
      + '<linearGradient id="islvharb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-sea0" stop-opacity="0"/><stop offset=".45" class="st-sea0" stop-opacity=".5"/><stop offset="1" class="st-sea0" stop-opacity=".3"/></linearGradient>'
      + '<radialGradient id="islvbulb"><stop offset="0" class="st-g1" stop-opacity=".5"/><stop offset=".5" class="st-g1" stop-opacity=".14"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '</defs>';
  }

  function build(W, H, piece) {
    const P = PIECES[piece];
    if (!P || W < 200 || H < 200) return '';
    // A piece may set its own scale (pixels per degree); the Curtain Bluff view needs a wider field
    // for the Moon and Venus to sit in the sky, as in the homepage hero.
    const y0g = Math.round(H * (P.horizon || 0.58));
    const ppd = P.ppd ? P.ppd(W, H, y0g) : W / 62;
    const y0 = y0g;
    // The anchor: a coast scene puts the sunset a third of the way in; an inland one faces P.face.
    const anchor = P.world === 'coast' ? rel(SKY.d.sun[0]) - (W * 0.3 - W / 2) / ppd : rel(P.face);
    const v = view(W / 2 - anchor * ppd, y0, ppd, W, H);
    const sea = H - y0;
    const k = P.ground ? P.ground(W, H, y0, sea) : null;
    const g = k ? rise(W, H, k.xr0, k.xr1, k.yL, k.yP, 23) : { d: '', at: () => H };
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
      + (P.world === 'coast' ? land(v, 0, W, 13, [['d', 'isl-d', 1], ['n', 'isl-n', 0.6]], P.under !== false) : '')
      + (P.hills ? hills(W, g.at(W / 2), P.hills(W, y0), 31) : '')
      + (g.d ? `<path class="f-near" d="${g.d}"/>` : '')
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
      // A slot with an aspect (a wide head slot) takes its own shape.
      const aspect = parseFloat(fig.dataset.aspect);
      const H = aspect ? Math.floor(clamp(W * aspect, 180, 700))
        : Math.floor(clamp(Math.min(W * 1.02, innerHeight - 5.5 * rem - 24), 320, 820));
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
