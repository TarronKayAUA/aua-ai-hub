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

  /* THE FINISH (owner, 2026-09-28: the art should reach the quality of his media tracker's scenes).
     The techniques that give those scenes their depth, here in Island Night's palette and both
     schemes: ripples dense at the horizon and long near the viewer; a broken column of light on the
     water under every light, its dashes widening and scattering with distance; a faint mirrored
     reflection of the land; soft halos around lamps and pools of light on the ground; mist lying at the
     foot of the land; and a print grain over the whole card (A.vignette adds it). Colours come from
     classes, so dusk and night each get their own. */
  const gauss = (r) => (r() + r() + r() - 1.5) / 1.5;
  function hatchList(W, y0, H, r) {
    const out = [];
    for (let y = y0 + 3; y < H; y += 2.4 + (y - y0) * 0.05) {
      const n = 1 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) out.push([r() * (W + 40) - 20, y, 4 + r() * (7 + (y - y0) * 0.16), r() < 0.6 ? 0 : r() < 0.7 ? 1 : 2]);
    }
    return out;
  }
  function streakList(cx, y0, H, r, spread, lenK) {
    const out = [];
    for (let y = y0 + 2; y < H; y += 2.6 + (y - y0) * 0.02) {
      if (r() > 0.8) continue;
      const tt = (y - y0) / (H - y0), w = 2 + (y - y0) * lenK * (0.5 + r());
      out.push([cx + gauss(r) * (3 + (y - y0) * spread) - w / 2, y, w, tt < 0.35 ? 2 : tt < 0.7 ? 1 : 0]);
    }
    return out;
  }
  function dashes(list, cls, width, alphas) {
    const bk = alphas.map(() => '');
    for (const [x, y, len, i] of list) bk[i] += `M${F(x)} ${F(y)}h${F(len)}`;
    return bk.map((d, i) => (d ? `<path class="${cls}" d="${d}" stroke-opacity="${alphas[i]}" stroke-width="${width}"/>` : '')).join('');
  }
  // The land's reflection: the drawing mirrored about the waterline, faint, kept to the water.
  const mirrored = (y0, inner, op = 0.2) => `<g clip-path="url(#islsea)" opacity="${op}"><g transform="translate(0 ${F(2 * y0)}) scale(1 -1)">${inner}</g></g>`;
  // Mist lying along a line at the foot of the land.
  const mist = (x, y, w, h, op = 0.5) => `<ellipse cx="${F(x + w / 2)}" cy="${F(y)}" rx="${F(w / 2)}" ry="${F(h / 2)}" fill="url(#islvmist)" opacity="${op}"/>`;
  // A lamp's halo, and the light it lays on the ground below it.
  const halo = (x, y, rr, grad = 'islvbulb') => `<circle cx="${F(x)}" cy="${F(y)}" r="${F(rr)}" fill="url(#${grad})"/>`;
  const pool = (x, y, rx, ry, op = 0.5) => `<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(rx)}" ry="${F(ry)}" fill="url(#islvpool)" opacity="${op}"/>`;
  // Planes of a landform: its silhouette, the faces turned to the light, the faces in shadow, and a
  // rim of light along the crest where the afterglow catches it.
  const facets = (poly, lit, dark) => `<path class="isl-vlit" d="${lit.map(poly).join('')}"/><path class="isl-vshadow" d="${dark.map(poly).join('')}"/>`;

  /* SAILING WEEK (the News & Events landing's head; the owner chose it, 2026-09-28): Antigua Sailing
     Week, the island's signature event, from the sea off English Harbour looking west at dusk.
     Racing yachts heel under white mainsails and jibs, some under spinnakers (one in the page's
     hue), their sails shaded from the lit edge, bow waves at their stems, their reflections broken on
     the water; Antigua's south coast rises on the right in lit and shaded planes, its crest rimmed by
     the afterglow, lights along its shore laying columns down the sea, mist at its foot; Montserrat
     on the horizon to the left; the afterglow's glitter on the water. The yachts' navigation lights
     come on in the one pass. */
  function regatta(W, H, v) {
    const y0 = v.y0, X = (f) => f * W, Y = (f) => f * H, r = rng(47);
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
    const lights = [[], []];      // 0 the yachts' lights, 1 the coast's
    let land = '', s = '';
    // The water: finer ripples, and the afterglow's glitter under the sunset.
    const sunX = v.x(SKY.d.sun[0]);
    s += dashes(hatchList(W, y0, H, r), 's-vrip', 1, [0.1, 0.18, 0.28]);
    if (sunX > -W * 0.2 && sunX < W * 1.2) s += dashes(streakList(Math.min(W - 10, sunX), y0, H, r, 0.14, 0.1), 's-vglow', 1.3, [0.12, 0.24, 0.42]);
    // 1. Montserrat on the horizon, the Soufriere Hills its peak, its western flank rimmed.
    const mont = P([[0.02, 0.6], [0.05, 0.58], [0.075, 0.558], [0.1, 0.535], [0.12, 0.522], [0.14, 0.53], [0.165, 0.552], [0.2, 0.578], [0.23, 0.6]]);
    land += `<path class="f-isl" d="${poly(mont)}"/>`;
    land += `<path class="s-rim" d="M${mont.slice(4, 8).map(([x, y]) => `${F(x)} ${F(y + 0.5)}`).join('L')}" stroke-width="1" stroke-opacity=".35"/>`;
    // 2. Antigua's south coast: a far range, then the near hills in planes, the crest rimmed.
    const range = P([[0.5, 0.6], [0.56, 0.57], [0.62, 0.535], [0.68, 0.49], [0.74, 0.455], [0.8, 0.43], [0.86, 0.41], [0.92, 0.395], [1.02, 0.38], [1.02, 0.6]]);
    land += `<path class="f-isl" d="${poly(range)}${scrub(range.slice(1, 9), 3, 0.6, 1.4)}"/>`;
    const hills = P([[0.58, 0.603], [0.62, 0.58], [0.66, 0.555], [0.7, 0.52], [0.74, 0.49], [0.78, 0.475], [0.82, 0.48], [0.86, 0.455], [0.9, 0.44], [0.95, 0.445], [1.02, 0.43], [1.02, 0.605], [0.58, 0.605]]);
    land += `<path class="f-far" d="${poly(hills)}${scrub(hills.slice(0, 11), 6, 0.8, 2)}"/>`;
    land += `<path class="s-rim" d="M${hills.slice(0, 11).map(([x, y]) => `${F(x)} ${F(y + 0.5)}`).join('L')}" stroke-width="1.2" stroke-opacity=".5"/>`;
    for (let i = 0; i < 18; i++) lights[1].push([X(0.62 + r() * 0.38), Y(0.54 + r() * 0.055)]);
    s += land + mirrored(y0, land, 0.18);
    s += mist(X(0.5), Y(0.6), X(0.55), Y(0.05), 0.55) + mist(X(0.0), Y(0.603), X(0.3), Y(0.03), 0.35);
    for (const [x] of lights[1]) if (r() < 0.5) s += dashes(streakList(x, y0, H, r, 0.04, 0.05).filter(([, y]) => y < y0 + Y(0.18)), 's-vglow', 1, [0.08, 0.16, 0.3]);
    // 3. The yachts, all racing left: hull heeled to leeward, a sheer line of light, a tall shaded
    //    mainsail, a jib or a spinnaker with its seams, a bow wave, and a reflection on the water.
    let fleet = '', rf = '', sprays = '';
    const yacht = (x, wl, L, heel, spin, hued) => {
      const mh = L * 1.45, mx = x + L * 0.08, hh = L * 0.1;
      const hull = `M${F(x - L * 0.5)} ${F(wl - hh)}H${F(x + L * 0.5)}L${F(x + L * 0.38)} ${F(wl)}H${F(x - L * 0.42)}Z`;
      const sheer = `M${F(x - L * 0.5)} ${F(wl - hh)}H${F(x + L * 0.5)}`;
      const main = `M${F(mx)} ${F(wl - hh - mh)}Q${F(mx + L * 0.18)} ${F(wl - hh - mh * 0.45)} ${F(mx + L * 0.46)} ${F(wl - hh * 1.4)}L${F(mx + L * 0.02)} ${F(wl - hh * 1.4)}Z`;
      const jib = `M${F(mx - L * 0.02)} ${F(wl - hh - mh * 0.86)}L${F(x - L * 0.48)} ${F(wl - hh * 1.1)}L${F(mx - L * 0.04)} ${F(wl - hh * 1.2)}Z`;
      const sp = `M${F(mx - L * 0.03)} ${F(wl - hh - mh * 0.92)}C${F(x - L * 0.95)} ${F(wl - hh - mh * 0.95)} ${F(x - L * 1.05)} ${F(wl - hh - mh * 0.25)} ${F(x - L * 0.62)} ${F(wl - hh * 1.6)}Q${F(x - L * 0.3)} ${F(wl - hh - mh * 0.2)} ${F(mx - L * 0.03)} ${F(wl - hh - mh * 0.92)}Z`;
      const seams = [0.3, 0.55, 0.78].map((k) => `M${F(mx - L * 0.03)} ${F(wl - hh - mh * 0.92)}Q${F(x - L * (0.2 + k * 0.7))} ${F(wl - hh - mh * (0.9 - k * 0.3))} ${F(x - L * (0.62 + 0.25 * Math.sin(k * 3)))} ${F(wl - hh - mh * (0.62 - k * 0.55))}`).join('');
      const mast = `M${F(mx)} ${F(wl - hh)}V${F(wl - hh - mh * 1.02)}`;
      const g = `transform="rotate(${F(heel)} ${F(x)} ${F(wl)})"`;
      let one = `<path class="isl-vhull" d="${hull}"/><path class="isl-vsheer" d="${sheer}" stroke-width="${F(Math.max(0.8, L * 0.012))}"/>`
        + `<path class="isl-vmast" d="${mast}" stroke-width="${F(Math.max(0.7, L * 0.01))}"/>`
        + `<path d="${main}" fill="url(#islvsailg)"/>`
        + (spin ? `<path class="${hued ? 'isl-vspin-k' : spin === 2 ? 'isl-vspin2' : 'isl-vspin'}" d="${sp}"/><path class="isl-vseam" d="${seams}" stroke-width=".8"/>` : `<path d="${jib}" fill="url(#islvsailg)"/>`);
      fleet += `<g ${g}>${one}</g>`;
      // its reflection, mirrored about its own waterline
      rf += `<g transform="translate(0 ${F(2 * wl)}) scale(1 -1)"><g ${g}>${one}</g></g>`;
      sprays += `M${F(x - L * 0.55)} ${F(wl)}q${F(-L * 0.12)} ${F(-hh * 0.8)} ${F(-L * 0.22)} ${F(hh * 0.2)}M${F(x + L * 0.4)} ${F(wl + 1)}h${F(L * 0.9)}M${F(x + L * 0.55)} ${F(wl + L * 0.05)}h${F(L * 0.6)}`;
      lights[0].push([x - L * 0.5, wl - hh, 'r'], [x - L * 0.46, wl - hh, 'g'], [mx, wl - hh - mh * 1.02, 'w']);
      s += dashes(streakList(x, wl + 1, Math.min(H, wl + L * 1.2), r, 0.06, 0.05), 's-vsailglint', 1, [0.06, 0.12, 0.2]);
    };
    const racers = [[0.62, 0.635, 0.035, -4, true, false], [0.47, 0.645, 0.045, -6, false, false], [0.79, 0.655, 0.05, -5, true, false],
      [0.3, 0.685, 0.066, -7, true, true], [0.56, 0.725, 0.085, -8, false, false], [0.86, 0.77, 0.1, -6, 2, false]];
    for (const [fx, fy, fl, hd, sp, hu] of racers) yacht(X(fx), Y(fy), X(fl), hd, sp, hu);
    // the fleet's reflections, broken by the water
    s += `<g clip-path="url(#islsea)" opacity=".14">${rf}</g>`;
    s += `<path class="isl-vsurf" d="${sprays}" stroke-width="${F(Math.max(1, Y(0.004)))}"/>`;
    s += fleet;
    // The lights, the yachts first: port red, starboard green, masthead white, each with a halo.
    let yl = '';
    for (const [x, y, c] of lights[0]) yl += `<circle class="isl-vnav-${c}" cx="${F(x)}" cy="${F(y)}" r="1.3"/>`;
    s += `<g class="isl-vwin" style="--i:0">${lights[0].map(([x, y]) => halo(x, y, 6)).join('')}${yl}</g>`;
    s += `<path class="s-vlight isl-vwin isl-vlast" style="--i:3" d="${lights[1].map(([x, y]) => `M${F(x)} ${F(y)}h0`).join('')}" stroke-width="1.4"/>`;
    return s;
  }

  /* LAMP-LIT STEPS (the Step-by-Step Guides index's head; the owner chose it, 2026-09-28): old stone
     steps climbing a hillside in flights to a lookout at the top, the kind of path up to Shirley
     Heights or Fort Berkeley. Low stone walls line each flight; a lantern stands at the foot, at each
     landing and at the top, each with its halo and the pool of light it lays on the steps; the
     hillside falls in lit and shaded planes with scrub along its crest; the lookout's ruined arches
     glow at the summit; below, the harbour, a yacht at anchor and the far shore's lights, each laying a
     broken column of light on the water. In the one pass the lanterns light one by one from the
     bottom up, step by step; the lantern at the top takes the page's hue. */
  function steps(W, H, v) {
    const y0 = v.y0, X = (f) => f * W, Y = (f) => f * H, r = rng(61);
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
    let s = '';
    // 1. The harbour: ripples, the far shore and its reflection, its lights and their columns.
    s += dashes(hatchList(W * 0.45, y0, H, r), 's-vrip', 1, [0.1, 0.18, 0.28]);
    const farShore = P([[-0.02, 0.6], [0.05, 0.585], [0.12, 0.575], [0.2, 0.582], [0.28, 0.595], [0.34, 0.602], [-0.02, 0.602]]);
    const farLand = `<path class="f-isl" d="${poly(farShore)}${scrub(farShore.slice(0, 6), 4, 0.7, 1.6)}"/>`;
    s += farLand + mirrored(y0, farLand, 0.2) + mist(X(-0.05), Y(0.6), X(0.42), Y(0.04), 0.5);
    const shoreLights = [];
    for (let i = 0; i < 12; i++) shoreLights.push([X(0.01 + r() * 0.3), Y(0.582 + r() * 0.014)]);
    for (const [x] of shoreLights) s += dashes(streakList(x, y0, H, r, 0.05, 0.05), 's-vglow', 1, [0.06, 0.13, 0.24]);
    // a yacht at anchor, its riding light and its column of light
    const bx = X(0.19), by = Y(0.8);
    s += dashes(streakList(bx, by + 2, H, r, 0.05, 0.08), 's-vglow', 1.1, [0.1, 0.2, 0.34]);
    s += `<g class="isl-vwin" style="--i:0">${halo(bx, by - Y(0.2), Y(0.045))}<circle class="f-pulse" cx="${F(bx)}" cy="${F(by - Y(0.2))}" r="1.4"/></g>`;
    s += `<path class="isl-vhull" d="M${F(bx - X(0.035))} ${F(by - Y(0.014))}H${F(bx + X(0.035))}L${F(bx + X(0.026))} ${F(by)}H${F(bx - X(0.028))}Z"/>`
      + `<path class="isl-vsheer" d="M${F(bx - X(0.035))} ${F(by - Y(0.014))}H${F(bx + X(0.035))}" stroke-width="1"/>`
      + `<path class="isl-vmast" d="M${F(bx)} ${F(by - Y(0.014))}V${F(by - Y(0.2))}M${F(bx)} ${F(by - Y(0.19))}L${F(bx + X(0.03))} ${F(by - Y(0.018))}M${F(bx)} ${F(by - Y(0.19))}L${F(bx - X(0.03))} ${F(by - Y(0.018))}" stroke-width=".9"/>`;
    // 2. The hillside rising to the summit, scrub along its crest and a rim of light.
    const crest = [[0.28, 1.03], [0.31, 0.93], [0.35, 0.84], [0.4, 0.74], [0.46, 0.64], [0.52, 0.55], [0.58, 0.47], [0.64, 0.4],
      [0.7, 0.34], [0.76, 0.295], [0.82, 0.27], [0.88, 0.262], [0.94, 0.275], [1.02, 0.3]];
    s += `<path class="f-far" d="${poly(P([...crest, [1.02, 1.03]]))}${scrub(P(crest.slice(1, 13)), 8, 1, 2.8)}"/>`;
    s += `<path class="s-rim" d="M${P(crest.slice(1, 14)).map(([x, y]) => `${F(x)} ${F(y + 0.5)}`).join('L')}" stroke-width="1.2" stroke-opacity=".45"/>`;
    // 3. The lookout at the summit: a two-storey stone guardhouse, part ruined, like those on the
    //    heights above English Harbour: three arches below and two windows above, all lit from
    //    within; a crenellated parapet; a corner turret; coursed stone; a broken wall stepping down
    //    the slope. It lights last, after the top lantern.
    const lx = X(0.878), lb = Y(0.272), lw = X(0.14), lh = Y(0.19), gx0 = lx - lw / 2, gx1 = lx + lw / 2, mid = lb - lh * 0.52;
    const tw2 = lw * 0.2, th = lh * 1.22;                    // the turret, on the right-hand corner
    let gh = `M${F(gx0)} ${F(lb)}V${F(lb - lh)}H${F(gx1 - tw2)}V${F(lb)}Z`;
    gh += `M${F(gx1 - tw2)} ${F(lb)}V${F(lb - th)}H${F(gx1)}V${F(lb)}Z`;
    for (let i = 0; i < 6; i++) {                            // merlons along the parapet
      const mx = gx0 + i * (lw - tw2) / 6;
      gh += `M${F(mx)} ${F(lb - lh)}h${F((lw - tw2) / 12)}v${F(-Y(0.022))}h${F(-(lw - tw2) / 12)}Z`;
    }
    for (let i = 0; i < 3; i++) {                            // and on the turret
      const mx = gx1 - tw2 + i * tw2 / 3;
      gh += `M${F(mx)} ${F(lb - th)}h${F(tw2 / 6)}v${F(-Y(0.02))}h${F(-tw2 / 6)}Z`;
    }
    // the broken wall stepping down the slope to the left
    gh += `M${F(gx0 - lw * 0.32)} ${F(lb + Y(0.012))}V${F(lb - lh * 0.3)}H${F(gx0 - lw * 0.2)}V${F(lb - lh * 0.42)}H${F(gx0 - lw * 0.08)}V${F(lb - lh * 0.55)}H${F(gx0)}V${F(lb)}Z`;
    s += halo(lx, lb - lh * 0.45, Y(0.24), 'islvwarm');
    s += `<path class="isl-vstone" d="${gh}"/>`;
    // the shaded turret face and the courses of stone
    s += `<path class="isl-vpshade" d="M${F(gx1 - tw2 * 0.45)} ${F(lb)}V${F(lb - th - Y(0.02))}H${F(gx1)}V${F(lb)}Z"/>`;
    let courses = '';
    for (let y = lb - Y(0.02); y > lb - lh + Y(0.01); y -= Y(0.022)) courses += `M${F(gx0 + 1)} ${F(y)}H${F(gx1 - 1)}`;
    s += `<path class="isl-vcourse" d="${courses}" stroke-width=".7"/>`;
    s += `<path class="isl-vcourse" d="M${F(gx0)} ${F(mid)}H${F(gx1 - tw2)}" stroke-width="1.6"/>`;
    // the openings, lit from within: three arches below, two windows above, a slit in the turret
    const archAt = (x, w, top, bot) => `M${F(x - w / 2)} ${F(bot)}V${F(top + w / 2)}A${F(w / 2)} ${F(w / 2)} 0 0 1 ${F(x + w / 2)} ${F(top + w / 2)}V${F(bot)}Z`;
    const bayW = (lw - tw2) / 3;
    let lit = '';
    for (let i = 0; i < 3; i++) lit += archAt(gx0 + bayW * (i + 0.5), bayW * 0.46, mid + Y(0.03), lb);
    for (let i = 0; i < 2; i++) { const wx = gx0 + (lw - tw2) * (0.3 + i * 0.4); lit += `M${F(wx - bayW * 0.16)} ${F(lb - lh + Y(0.045))}h${F(bayW * 0.32)}v${F(Y(0.05))}h${F(-bayW * 0.32)}Z`; }
    lit += `M${F(gx1 - tw2 / 2 - 1.5)} ${F(lb - th + Y(0.05))}h3v${F(Y(0.06))}h-3Z`;
    // (placed below, after the lanterns, so it lights last)
    const lookoutLit = lit;
    // 4. The steps, in profile: one staircase climbing the hillside to the lookout, a riser and a
    //    tread at a time, with two landings. The stone body under the treads, each tread's edge lit,
    //    each riser's face in shade.
    const x0 = X(0.33), yA = Y(0.97), x1 = X(0.8), yB = Y(0.272), nSteps = 21, landAt = [7, 14], land = X(0.035);
    const dx = (x1 - x0 - land * landAt.length) / nSteps, dy = (yA - yB) / nSteps, depth = Y(0.07);
    let edge = [[x0, yA]], treads = '', risers = '';
    const lanterns = [[x0 - X(0.012), yA]];
    let x = x0, y = yA;
    for (let i = 0; i < nSteps; i++) {
      risers += `M${F(x)} ${F(y)}V${F(y - dy)}`;
      y -= dy; edge.push([x, y]);
      const run = dx + (landAt.includes(i + 1) ? land : 0);
      treads += `M${F(x)} ${F(y)}H${F(x + run)}`;
      x += run; edge.push([x, y]);
      if (landAt.includes(i + 1)) lanterns.push([x - land * 0.5, y]);
    }
    lanterns.push([x1 - X(0.018), yB]);
    const body = edge.concat(edge.slice().reverse().map(([ex, ey]) => [ex + X(0.02), ey + depth]));
    // the pools of light first, so the stones sit in them
    s += lanterns.map(([lx2, ly2], i) => `<g class="isl-vwin" style="--i:${i};--isl-vstep:.6s">${pool(lx2 + X(0.02), ly2 + Y(0.01), X(0.08), Y(0.06), 0.85)}</g>`).join('');
    s += `<path class="isl-vriser" d="${poly(body)}"/>`;
    s += `<path class="isl-vstep-edge" d="${treads}" stroke-width="${F(Math.max(1.6, Y(0.008)))}"/>`;
    s += `<path class="isl-vstep-rise" d="${risers}" stroke-width="${F(Math.max(1, Y(0.004)))}"/>`;
    // a century plant on the slope, its rosette and its tall flowering stalk, and scrub by the steps
    const cpx = X(0.66), cpy = Y(0.66);
    let cp = '';
    for (const [ang, len] of [[-160, 0.045], [-145, 0.06], [-128, 0.07], [-110, 0.075], [-92, 0.078], [-74, 0.075], [-56, 0.07], [-38, 0.06], [-22, 0.045]]) {
      const rad = ang * Math.PI / 180, ex = cpx + Math.cos(rad) * X(len), ey = cpy + Math.sin(rad) * Y(len * 1.5);
      cp += `M${F(cpx - 4)} ${F(cpy)}L${F(ex)} ${F(ey)}L${F(cpx + 4)} ${F(cpy)}Z`;
    }
    const sh = Y(0.34), sx2 = cpx + X(0.004);
    cp += `M${F(sx2 - 2)} ${F(cpy)}L${F(sx2 + X(0.01) - 1.2)} ${F(cpy - sh)}H${F(sx2 + X(0.01) + 1.2)}L${F(sx2 + 2)} ${F(cpy)}Z`;
    for (let k = 0; k < 6; k++) {
      const by2 = cpy - sh * (0.55 + k * 0.08), bx2 = sx2 + X(0.01) * (0.55 + k * 0.08), bl = X(0.028) * (1 - k * 0.12);
      for (const sd of [-1, 1]) cp += `M${F(bx2)} ${F(by2)}q${F(sd * bl * 0.5)} ${F(-Y(0.012))} ${F(sd * bl)} ${F(-Y(0.004))}q${F(-sd * bl * 0.1)} ${F(Y(0.01))} ${F(-sd * bl)} ${F(Y(0.006))}Z`;
    }
    s += `<path class="f-near" d="${cp}"/>`;
    s += `<path class="f-near" d="${scrub(P([[0.37, 0.99], [0.47, 0.84], [0.56, 0.68], [0.7, 0.5], [0.78, 0.36]]).map(([ex, ey]) => [ex + X(0.035), ey + Y(0.06)]), 5, 1.4, 3.2)}"/>`;
    // 5. The lanterns: a post, a glazed lantern with its cap, a halo; the top one in the page's hue,
    //    and the last to light.
    lanterns.forEach(([lx2, ly2], i) => {
      const top = i === lanterns.length - 1, ph = Y(0.1), lw2 = X(0.009), lh2 = Y(0.03);
      s += `<path class="isl-vpost" d="M${F(lx2 - 1.1)} ${F(ly2)}V${F(ly2 - ph)}H${F(lx2 + 1.1)}V${F(ly2)}Z"/>`;
      s += `<g class="isl-vwin" style="--i:${i};--isl-vstep:.6s">`
        + halo(lx2, ly2 - ph - lh2 / 2, Y(top ? 0.1 : 0.085), top ? 'islvlamp' : 'islvbulb')
        + `<path class="${top ? 'isl-vlamp' : 'f-pulse'}" d="M${F(lx2 - lw2)} ${F(ly2 - ph)}V${F(ly2 - ph - lh2)}H${F(lx2 + lw2)}V${F(ly2 - ph)}Z"/></g>`;
      s += `<path class="isl-vpost" d="M${F(lx2 - lw2 * 1.5)} ${F(ly2 - ph - lh2)}L${F(lx2)} ${F(ly2 - ph - lh2 - Y(0.014))}L${F(lx2 + lw2 * 1.5)} ${F(ly2 - ph - lh2)}Z"/>`;
    });
    s += `<path class="f-pulse isl-vwin isl-vlast" style="--i:${lanterns.length + 0.6};--isl-vstep:.6s" d="${lookoutLit}"/>`;
    return s;
  }

  /* NELSON'S DOCKYARD (beside the Lecture Outline's checks, where the campus stood until it moved to
     the homepage): the Georgian naval dockyard at English Harbour, a UNESCO World Heritage Site. In
     front, standing in the harbour, the Sail Loft's pillars: the capped stone columns that are all
     that is left of the 1797 boat house and sail loft after the earthquake of 1871, with their
     reflections. Behind them at the quay the Copper and Lumber Store of 1789, its arched ground floor
     and upper windows lit; yachts' masts along the water to the right; above, the ridge of Shirley
     Heights with the lookout's lights on its top. A lamp on the quay takes the page's hue. */
  function dockyard(W, H, v) {
    const X = (f) => f * W, Y = (f) => f * H, r = rng(83);
    const P = (pts) => pts.map(([x, y]) => [X(x), Y(y)]);
    const poly = (pts) => 'M' + pts.map(([x, y]) => `${F(x)} ${F(y)}`).join('L') + 'Z';
    const arch = (x, yTop, w, yBot) => `M${F(x - w / 2)} ${F(yBot)}V${F(yTop + w / 2)}A${F(w / 2)} ${F(w / 2)} 0 0 1 ${F(x + w / 2)} ${F(yTop + w / 2)}V${F(yBot)}Z`;
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
    const lights = [[], [], []];      // 0 the Store, 1 the masts, 2 the ridge
    const wl = Y(0.63);               // the quay's waterline
    let s = `<rect y="${F(v.y0)}" width="${F(W)}" height="${F(H - v.y0)}" fill="url(#islvbay)"/>`;
    // 1. The ridge of Shirley Heights, the lookout's lights on its top.
    const ridge = P([[-0.02, 0.46], [0.1, 0.43], [0.22, 0.4], [0.34, 0.37], [0.46, 0.34], [0.56, 0.31], [0.64, 0.28],
      [0.72, 0.27], [0.8, 0.29], [0.9, 0.33], [1.02, 0.36], [1.02, 0.6], [-0.02, 0.6]]);
    s += `<path class="f-isl" d="${poly(ridge)}${scrub(ridge.slice(0, 11), 5, 0.9, 2.2)}"/>`;
    for (let i = 0; i < 6; i++) lights[2].push([X(0.69 + i * 0.012), Y(0.268 + (r() - 0.5) * 0.006)]);
    for (let i = 0; i < 10; i++) lights[2].push([X(0.1 + r() * 0.85), Y(0.42 + r() * 0.12)]);
    // 2. The dockyard's ground at the quay.
    s += `<path class="f-far" d="${poly(P([[-0.02, 0.56], [0.3, 0.55], [0.6, 0.56], [1.02, 0.57], [1.02, 0.635], [-0.02, 0.635]]))}"/>`;
    // 3. The Copper and Lumber Store: two storeys of brick, a hipped roof, an arcade below.
    const x0 = X(0.05), x1 = X(0.56), top = Y(0.475), mid = Y(0.555), bays = 9, bw = (x1 - x0) / bays;
    s += `<rect class="isl-vglow" x="${F(x0)}" y="${F(top)}" width="${F(x1 - x0)}" height="${F(wl - top)}" fill="url(#islvwarm)"/>`;
    s += `<path class="isl-vbrick" d="M${F(x0)} ${F(wl)}V${F(top)}H${F(x1)}V${F(wl)}Z"/>`;
    s += `<path class="isl-vroof2" d="M${F(x0 - X(0.01))} ${F(top + 1)}L${F(x0 + X(0.04))} ${F(top - Y(0.04))}H${F(x1 - X(0.04))}L${F(x1 + X(0.01))} ${F(top + 1)}Z"/>`;
    s += `<path class="s-hz" d="M${F(x0)} ${F(mid)}H${F(x1)}" stroke-width="1"/>`;
    let arches = '', wins = '';
    for (let i = 0; i < bays; i++) {
      const x = x0 + (i + 0.5) * bw;
      arches += arch(x, mid + Y(0.012), bw * 0.56, wl);
      wins += `M${F(x - bw * 0.16)} ${F(top + Y(0.018))}h${F(bw * 0.32)}v${F(Y(0.045))}h${F(-bw * 0.32)}Z`;
    }
    s += `<path class="f-pulse isl-vwin" style="--i:0" d="${arches}"/>`;
    s += `<path class="f-pulse isl-vwin" style="--i:1" d="${wins}"/>`;
    // the quay lamp, in the page's hue
    const lx = X(0.6), ly = Y(0.53);
    s += `<path class="f-near" d="M${F(lx - 1)} ${F(wl)}V${F(ly)}H${F(lx + 1)}V${F(wl)}Z"/>`;
    s += `<circle cx="${F(lx)}" cy="${F(ly)}" r="${F(Y(0.045))}" fill="url(#islvlamp)"/>`;
    s += `<circle class="isl-vlamp" cx="${F(lx)}" cy="${F(ly)}" r="${F(Math.max(1.5, Y(0.006)))}"/>`;
    // 4. Yachts along the quay to the right: masts, hulls, masthead lights, reflections.
    let masts = '', hulls = '', refl = '';
    for (let i = 0; i < 9; i++) {
      const x = X(0.64 + i * 0.042 + (r() - 0.5) * 0.01), mh = Y(0.18 + r() * 0.1), hw = X(0.018);
      masts += `M${F(x)} ${F(wl - Y(0.008))}V${F(wl - mh)}`;
      hulls += `M${F(x - hw)} ${F(wl - Y(0.012))}H${F(x + hw)}L${F(x + hw * 0.8)} ${F(wl + Y(0.004))}H${F(x - hw * 0.8)}Z`;
      lights[1].push([x, wl - mh]);
      refl += `<rect x="${F(x - 0.6)}" y="${F(wl + Y(0.008))}" width="1.2" height="${F(Y(0.08))}" fill="url(#islvrefl)"/>`;
    }
    s += `<path class="isl-vmast" d="${masts}" stroke-width="0.9"/><path class="isl-vhull" d="${hulls}"/>`;
    // 5. The Sail Loft's pillars in the harbour: a double row seen from the side, the nearer row large
    //    and capped, the farther row showing between them.
    const foot = Y(0.9), capTop = Y(0.66), pw = X(0.07);
    let back = '', front = '', caps = '', shade = '', prefl = '';
    const n = 6;
    for (let i = 0; i < n; i++) {
      const x = X(0.1 + i * 0.16), wv = pw * (0.92 + r() * 0.16), ct = capTop + Y((r() - 0.5) * 0.02);
      back += `M${F(x + pw * 0.95)} ${F(foot - Y(0.05))}V${F(capTop + Y(0.03))}H${F(x + pw * 1.55)}V${F(foot - Y(0.05))}Z`;
      front += `M${F(x)} ${F(foot)}V${F(ct)}H${F(x + wv)}V${F(foot)}Z`;
      caps += `M${F(x - wv * 0.08)} ${F(ct + 1)}V${F(ct - Y(0.016))}H${F(x + wv * 1.08)}V${F(ct + 1)}Z`;
      shade += `M${F(x + wv * 0.7)} ${F(foot)}V${F(ct)}H${F(x + wv)}V${F(foot)}Z`;
      prefl += `M${F(x)} ${F(foot)}H${F(x + pw)}L${F(x + pw * 0.9)} ${F(Math.min(H, foot + Y(0.1)))}H${F(x + pw * 0.1)}Z`;
    }
    s += `<path class="isl-vpback" d="${back}"/>`;
    s += `<path class="isl-vpreflect" d="${prefl}"/>`;
    s += `<path class="isl-vstone" d="${front}${caps}"/><path class="isl-vpshade" d="${shade}"/>`;
    s += `<g class="isl-vlamps">${refl}</g>`;
    // The lights, the Store first, then the masts, then the ridge.
    [[1, 1.7], [2, 1.5]].forEach(([g, sw], k) => {
      s += `<path class="s-vlight isl-vwin${g === 2 ? ' isl-vlast' : ''}" style="--i:${2 + k * 2}" d="${lights[g].map(([x, y]) => `M${F(x)} ${F(y)}h0`).join('')}" stroke-width="${sw}"/>`;
    });
    return s;
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
    'sailing-week': {
      draw: regatta,
      world: 'inland',
      horizon: 0.6,
      // From the sea off English Harbour, west-south-west: Montserrat on the left, the sunset behind
      // the south coast's hills on the right.
      face: 258,
      // wide enough that the Moon sits in the sky at dusk and at night (owner, 2026-09-28), a clear
      // disc, above the open water between the fleet and the coast
      ppd: (W, H, y0) => Math.min(W / 80, y0 / 36),
      moonBig: 2.4,
      moonX: 0.4,
      ground: null,
    },
    'lamp-steps': {
      draw: steps,
      world: 'inland',
      horizon: 0.6,
      // From the harbour side, west toward the last light above the hill; the Moon in the sky.
      face: 262,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 36),
      moonBig: 2.4,
      moonX: 0.42,
      ground: null,
    },
    'nelsons-dockyard': {
      draw: dockyard,
      world: 'inland',
      horizon: 0.6,
      // From the harbour, east at the dockyard and Shirley Heights above it.
      face: 95,
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
      + '<radialGradient id="islvmist"><stop offset="0" class="st-haze" stop-opacity=".5"/><stop offset=".6" class="st-haze" stop-opacity=".16"/><stop offset="1" class="st-haze" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="islvpool"><stop offset="0" class="st-g1" stop-opacity=".55"/><stop offset=".5" class="st-g1" stop-opacity=".18"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvsailg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="st-vsail" stop-opacity="1"/><stop offset="1" class="st-vsail2" stop-opacity="1"/></linearGradient>'
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
    // A piece may instead put the Moon at a share of the width (`moonX`), turning to face it.
    const anchor = P.world === 'coast' ? rel(SKY.d.sun[0]) - (W * 0.3 - W / 2) / ppd
      : P.moonX != null ? rel((SKY.d.moon[0] + SKY.n.moon[0]) / 2) - (W * P.moonX - W / 2) / ppd : rel(P.face);
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
      + L.moon(v, 'd', [], 'isl-d', P.moonBig || 1) + L.moon(v, 'n', [], 'isl-n', P.moonBig || 1)
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

  /* Print grain: drawn once into a small tile (a canvas), laid over every card, never animated. */
  let GRAIN = '';
  function grainURL() {
    if (GRAIN) return GRAIN;
    try {
      const c = document.createElement('canvas');
      c.width = c.height = 160;
      const x = c.getContext('2d');
      if (!x) return '';
      const d = x.createImageData(160, 160), r = rng(99);
      for (let i = 0; i < d.data.length; i += 4) {
        const n = r();
        if (n < 0.12) { d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; d.data[i + 3] = Math.floor(r() * 34); }
        else if (n < 0.26) d.data[i + 3] = Math.floor(r() * 90);
      }
      x.putImageData(d, 0, 0);
      GRAIN = c.toDataURL();
    } catch (e) { GRAIN = ''; }
    return GRAIN;
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
      const grain = grainURL();
      card.innerHTML = build(W, H, fig.dataset.vignette)
        + (grain ? `<i class="isl-grain" style="background-image:url(${grain})"></i>` : '');
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
