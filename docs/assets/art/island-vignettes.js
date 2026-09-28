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
  /* THE DAYLIGHT KIT (2026-09-28), first built for Shirley Heights and shared so every picture draws its
     Day version to the same standard: a point-in-outline test, round shapes, tree crowns kept whole on the
     land (lit on their sunward side, three greens, larger nearer), shaded flanks that follow the slopes,
     and buildings drawn in every version (dark with lit windows at Dawn, Sunset, Dusk and Night; walls and
     hipped roofs by Day), so a light at night is a building by Day. */
  function makeKit(W, H) {
    const Y = (f) => f * H;
    const inPoly = (x, y, pts) => {
      let c = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i], [xj, yj] = pts[j];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const circ = (x, y, rr) => `M${F(x - rr)} ${F(y)}a${F(rr)} ${F(rr)} 0 1 0 ${F(2 * rr)} 0a${F(rr)} ${F(rr)} 0 1 0 ${F(-2 * rr)} 0Z`;
    const trees = (pts, n, s0, s1, seed) => {
      const rr = rng(seed), xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
      const xa = Math.min(...xs), xb = Math.max(...xs), ya = Math.min(...ys), yb = Math.max(...ys), list = [];
      for (let k = 0, tries = 0; k < n && tries < n * 40; tries++) {
        const x = xa + rr() * (xb - xa), y = ya + rr() * (yb - ya);
        if (!inPoly(x, y, pts)) continue;
        const near = (y - ya) / Math.max(1, yb - ya), sz = (s0 + (s1 - s0) * near) * (0.7 + rr() * 0.6);
        // the whole crown on the land, never overhanging the water (the owner, 2026-09-28: "one small tree
        // in the water")
        if (!inPoly(x - sz, y, pts) || !inPoly(x + sz, y, pts) || !inPoly(x, y + sz, pts)) continue;
        list.push([x, y, sz]);
        k++;
      }
      list.sort((p, q) => p[1] - q[1]);
      // each crown a cluster of leaf masses, not a ball: its shade to the lower left, three greens, and a
      // few small sunlit masses on the upper right (the Sun is high, behind the lookout, to the right)
      let out = '';
      const tones = ['isl-vtree', 'isl-vtree2', 'isl-vtree3'];
      for (const [x, y, sz] of list) {
        let crown = '', shade = '', lit = '';
        const k = 3 + Math.floor(rr() * 4);
        for (let j = 0; j < k; j++) {
          const a = rr() * Math.PI * 2, dist = sz * 0.45 * rr(), cr = sz * (0.42 + rr() * 0.3);
          const cx = x + Math.cos(a) * dist, cy = y + Math.sin(a) * dist * 0.8;
          crown += circ(cx, cy, cr);
          shade += circ(cx - sz * 0.22, cy + sz * 0.18, cr);
          if (rr() < 0.55) lit += circ(cx + cr * 0.35, cy - cr * 0.35, cr * (0.28 + rr() * 0.18));
        }
        out += `<path class="isl-vtree-d" d="${shade}"/><path class="${tones[Math.floor(rr() * 3)]}" d="${crown}"/><path class="isl-vtree-l" d="${lit}"/>`;
      }
      return out;
    };
    const flanks = (crest, baseY) => {          // shade each peak's left flank, down to the land's foot
      let d = '';
      for (let i = 1; i < crest.length - 1; i++) {
        const [x, y] = crest[i];
        if (!(y < crest[i - 1][1] && y <= crest[i + 1][1])) continue;
        let j = i;
        while (j > 0 && crest[j - 1][1] > crest[j][1]) j--;
        const pts = crest.slice(j, i + 1), xv = pts[0][0];
        // the shaded flank: from the valley up the crest to the peak, then down the spur that runs from the
        // peak toward the lower left, so the shade follows the slope instead of dropping straight down
        d += 'M' + pts.map(([px, py]) => `${F(px)} ${F(py)}`).join('L') + `L${F(x - (x - xv) * 0.35)} ${F(baseY)}L${F(xv - (x - xv) * 0.25)} ${F(baseY)}Z`;
      }
      return `<path class="isl-vshadow" d="${d}" filter="url(#islvbayf)"/>`;
    };
    // THE BUILDINGS (owner, 2026-09-28: a building by Day should be the one whose windows are lit at night):
    // one set drawn in every version. At Dawn, Dusk and Night they are dark shapes, a shade lighter than the
    // land, with lit windows; by Day, white or stone walls under gray or red hipped roofs, the hip away from
    // the Sun in shade, the windows as glass.
    const bld = () => ({ walls: '', stone: '', grey: '', red: '', shade: '', win: '', halo: '' });
    const house = (bb, x, base, w, opt = {}) => {
      const h = w * (opt.tall ? 0.72 : 0.52), rh = w * 0.34, ov = w * 0.1, top = base - h;
      bb[opt.stone ? 'stone' : 'walls'] += `M${F(x - w / 2)} ${F(base)}h${F(w)}v${F(-h)}h${F(-w)}Z`;
      bb[opt.red ? 'red' : 'grey'] += `M${F(x - w / 2 - ov)} ${F(top + 0.3)}L${F(x - w * 0.22)} ${F(top - rh)}H${F(x + w * 0.22)}L${F(x + w / 2 + ov)} ${F(top + 0.3)}Z`;
      bb.shade += `M${F(x - w * 0.22)} ${F(top - rh)}L${F(x - w / 2 - ov)} ${F(top + 0.3)}H${F(x - w * 0.3)}Z`;
      const n = opt.win || (w > Y(0.03) ? 3 : w > Y(0.02) ? 2 : 1), ww = Math.max(1, w * 0.12), wh = Math.max(1.2, h * 0.3);
      for (let k = 0; k < n; k++) {
        const wx = x - w / 2 + (w * (k + 0.5)) / n - ww / 2;
        bb.win += `M${F(wx)} ${F(base - h * 0.22)}h${F(ww)}v${F(-wh)}h${F(-ww)}Z`;
        if (opt.tall) bb.win += `M${F(wx)} ${F(base - h * 0.62)}h${F(ww)}v${F(-wh)}h${F(-ww)}Z`;
      }
      bb.halo += halo(x, base - h * 0.5, w * 0.95);
    };
    const drawB = (bb, i) => `<path class="isl-bhouse" d="${bb.walls}"/><path class="isl-bstone" d="${bb.stone}"/>`
      + `<path class="isl-broof" d="${bb.grey}"/><path class="isl-broofr" d="${bb.red}"/><path class="isl-vshadow" d="${bb.shade}"/>`
      + `<g class="isl-vwin" style="--i:${i}">${bb.halo}<path class="f-pulse" d="${bb.win}"/></g>`;
    // By Day, small houses where a picture's far lights stand on land (never at a masthead): white walls,
    // red or gray roofs, sized for their distance.
    const dayHouses = (pts, size, seed) => {
      const rr = rng(seed);
      let wl = '', rf = '', rg = '';
      for (const [x, y] of pts) {
        if (rr() < 0.3) continue;
        const w = size * (0.8 + rr() * 0.5), h = w * 0.62;
        wl += `M${F(x - w / 2)} ${F(y)}h${F(w)}v${F(-h)}h${F(-w)}Z`;
        const roof = `M${F(x - w * 0.62)} ${F(y - h + 0.3)}L${F(x)} ${F(y - h - w * 0.36)}L${F(x + w * 0.62)} ${F(y - h + 0.3)}Z`;
        if (rr() < 0.55) rf += roof; else rg += roof;
      }
      return `<g class="isl-ydet"><path class="isl-vhouse" d="${wl}"/><path class="isl-vroof" d="${rf}"/><path class="isl-vroofg" d="${rg}"/></g>`;
    };
    return { inPoly, circ, trees, flanks, bld, house, drawB, dayHouses };
  }

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
    // BY DAY (owner, 2026-09-28: "we need to render more features so the landscape doesn't look like green
    // blobs"): what daylight shows and the other versions leave in shadow, drawn only for the Day version
    // (isl-ydet): each hill's flank turned from the Sun in shade (at mid-morning the Sun is high, behind
    // the lookout and to the right), tree crowns lit on their sunward side, larger and brighter nearer,
    // the headland's rock, turquoise shallows along the shores, the dockyard's buildings and a road. At
    // Dawn (isl-adet) the first light gilds the hilltops.
    const { inPoly, circ, trees, flanks, bld, house, drawB } = makeKit(W, H);
    // The bay catches the last of the sky: its own water, a shade lighter and, at dusk, faintly teal.
    const bay = P([[0.19, 0.37], [0.3, 0.4], [0.45, 0.41], [0.6, 0.42], [0.72, 0.4], [0.8, 0.52], [0.78, 0.7],
      [0.66, 0.8], [0.3, 0.8], [0.2, 0.62]]);
    const town = P([[0.705, 0.45], [0.72, 0.432], [0.75, 0.418], [0.8, 0.412], [0.86, 0.418], [0.92, 0.41],
      [1.02, 0.402], [1.02, 1.02], [0.7, 1.02], [0.74, 0.74], [0.785, 0.66], [0.795, 0.6], [0.78, 0.56],
      [0.745, 0.54], [0.72, 0.52], [0.71, 0.48]]);
    const head = P([[0.19, 0.378], [0.194, 0.358], [0.203, 0.343], [0.212, 0.318], [0.224, 0.302], [0.258, 0.297],
      [0.288, 0.297], [0.31, 0.29], [0.34, 0.279], [0.37, 0.27], [0.4, 0.266], [0.43, 0.268], [0.46, 0.276], [0.5, 0.284], [0.54, 0.289],
      [0.58, 0.295], [0.62, 0.31], [0.66, 0.33], [0.7, 0.37], [0.715, 0.41], [0.7, 0.425], [0.66, 0.432],
      [0.62, 0.436], [0.58, 0.44], [0.535, 0.442],
      // Fort Berkeley: a narrow rocky finger pointing into the bay
      [0.522, 0.458], [0.513, 0.482], [0.5, 0.5], [0.486, 0.508], [0.474, 0.5], [0.478, 0.482], [0.49, 0.462],
      [0.494, 0.445], [0.47, 0.434], [0.44, 0.422], [0.4, 0.415], [0.35, 0.41], [0.3, 0.404], [0.25, 0.392],
      [0.215, 0.386]]);
    const slope = P([[-0.02, 0.535], [0.05, 0.545], [0.1, 0.56], [0.15, 0.575], [0.19, 0.592], [0.22, 0.612],
      [0.245, 0.66], [0.26, 0.74], [0.3, 0.76], [0.36, 0.73], [0.42, 0.77], [0.5, 0.79], [0.58, 0.8], [0.64, 0.74],
      [0.68, 0.67], [0.73, 0.66], [0.8, 0.7], [0.88, 0.72], [1.02, 0.74], [1.02, 1.05], [-0.02, 1.05]]);
    s += `<defs><filter id="islvbayf" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${F(W * 0.012)}"/></filter>`
      + `<filter id="islvsoft" x="-5%" y="-50%" width="110%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>`
      + `<path d="${poly(bay)}" fill="url(#islvbay)" filter="url(#islvbayf)"/>`;
    // by Day, turquoise shallows along the bay's shores, under the land that covers their inner half
    // by Day, Galleon Beach's water: palest close to the sand, with darker patches of seagrass further out
    // (the owner, 2026-09-28: "the water near the beach itself can be a little lighter than the water a
    // little further out")
    const beachLine = P([[0.748, 0.545], [0.772, 0.558], [0.79, 0.585], [0.792, 0.615], [0.784, 0.655]]);
    s += `<g class="isl-ydet"><path class="isl-vgrass" d="${[[0.66, 0.6, 0.03, 0.014], [0.6, 0.665, 0.035, 0.012], [0.71, 0.655, 0.022, 0.012], [0.55, 0.61, 0.025, 0.01]]
      .map(([fx, fy, rx, ry]) => `M${F(X(fx - rx))} ${F(Yp(fy))}a${F(X(rx))} ${F(Y(ry))} 0 1 0 ${F(X(2 * rx))} 0a${F(X(rx))} ${F(Y(ry))} 0 1 0 ${F(-X(2 * rx))} 0Z`).join('')}" filter="url(#islvbayf)"/>`
      + `<path class="isl-vshallow2" d="${line(beachLine)}" stroke-width="${F(Y(0.1))}" filter="url(#islvbayf)"/></g>`;
    s += `<g class="isl-ydet"><path class="isl-vshallow" d="${line(head.slice(18))}${line(town.slice(8))}${line(slope.slice(4, 18))}" `
      + `stroke-width="${F(Y(0.045))}" filter="url(#islvbayf)"/></g>`;
    // 1. The far hills: the small distant point on the left, then the main range behind Falmouth.
    const point = P([[0.295, 0.233], [0.31, 0.222], [0.33, 0.214], [0.355, 0.219], [0.375, 0.228], [0.4, 0.224],
      [0.43, 0.207], [0.47, 0.192], [0.51, 0.2], [0.55, 0.205], [0.56, 0.233]]);
    s += `<path class="f-isl" d="${poly(point)}"/>`;
    const range = P([[0.45, 0.25], [0.46, 0.236], [0.475, 0.226], [0.49, 0.214], [0.51, 0.2], [0.53, 0.186], [0.56, 0.168], [0.585, 0.154], [0.61, 0.164],
      [0.645, 0.149], [0.67, 0.16], [0.7, 0.176], [0.73, 0.19], [0.76, 0.198], [0.8, 0.204], [0.85, 0.199],
      [0.9, 0.21], [0.95, 0.214], [1.02, 0.22], [1.02, 0.285]]);
    s += `<path class="f-far isl-land" d="${poly(range)}${scrub(range.slice(1, -1), 4, 0.7, 1.8)}"/>`;
    s += `<g class="isl-ydet">${flanks(range.slice(0, -1), Yp(0.28))}</g>`;
    s += `<g class="isl-adet"><path d="${poly(range)}" fill="url(#islvgild)"/><path class="isl-vgildline" d="${line(range.slice(1, -1))}" stroke-width="2.2" filter="url(#islvsoft)"/><path class="isl-vgildline" d="${line(range.slice(1, -1))}" stroke-width=".8"/></g>`;
    for (let i = 0; i < 30; i++) {             // villages on the range's lower slopes
      const x = 0.55 + r() * 0.47;
      lights.push([X(x), Yp(0.25 + r() * 0.03), 3, 'h']);
    }
    // 2. Falmouth Harbour (the sea's own water, left clear) and its big yachts' masts and lights.
    let masts = '';
    for (let i = 0; i < 11; i++) {
      const x = X(0.72 + r() * 0.26), foot = Yp(0.3 + r() * 0.012), top = foot - Y(0.035 + r() * 0.035);
      masts += `M${F(x)} ${F(foot)}V${F(top)}`;
      lights.push([x, top, 2]);
    }
    for (let i = 0; i < 22; i++) lights.push([X(0.58 + r() * 0.42), Yp(0.29 + r() * 0.025), 2, 'h']);
    // the low land between the two harbours, and the town's slope on the right
    const between = P([[0.6, 0.326], [0.7, 0.32], [0.8, 0.325], [0.9, 0.318], [1.02, 0.318], [1.02, 0.358], [0.62, 0.358]]);
    s += `<path class="f-far isl-land" d="${poly(between)}"/>`;
    s += `<path class="f-near isl-land" d="${poly(town)}${scrub(town.slice(0, 7), 5, 0.9, 2.2)}"/>`;
    s += `<g class="isl-ydet">${trees(town, 110, Y(0.007), Y(0.016), 31)}`
      + `<path class="isl-vroad" d="M${F(X(1.02))} ${F(Yp(0.6))}C${F(X(0.93))} ${F(Yp(0.58))} ${F(X(0.9))} ${F(Yp(0.5))} ${F(X(0.84))} ${F(Yp(0.49))}S${F(X(0.78))} ${F(Yp(0.45))} ${F(X(0.75))} ${F(Yp(0.43))}" stroke-width="${F(Math.max(1, Y(0.006)))}"/></g>`;
    // The houses on the slope and along Galleon Beach (owner, 2026-09-28), drawn in every version: the beach's
    // cottages behind the sand, the two larger buildings above it, and houses up the hill, their windows the
    // slope's lights at night. (The random draws the slope's old lights made are kept, so nothing else moves.)
    for (let i = 0; i < 34; i++) { r(); r(); }
    const hr = rng(509), homes = bld(), spots = [];
    for (const [fx, fy, fw, win] of [[0.817, 0.577, 0.012, 2], [0.821, 0.6, 0.011, 2], [0.819, 0.624, 0.012, 2], [0.814, 0.647, 0.011, 1],
      [0.824, 0.54, 0.024, 4], [0.85, 0.51, 0.02, 3]]) spots.push([X(fx), Yp(fy), X(fw), win]);
    for (let tries = 0; spots.length < 30 && tries < 3000; tries++) {
      const x = X(0.75 + hr() * 0.26), y = Yp(0.43 + hr() * 0.22), w = X(0.008 + hr() * 0.006);
      if (!inPoly(x, y, town) || inPoly(x, y, slope)) continue;
      if (spots.some(([sx, sy, sw]) => Math.abs(sx - x) < (sw + w) * 0.75 && Math.abs(sy - y) < Y(0.035))) continue;
      spots.push([x, y, w, 0]);
    }
    spots.sort((p, q) => p[1] - q[1]);
    for (const [x, y, w, win] of spots) house(homes, x, y, w, { red: hr() < 0.35, win: win || undefined });
    s += drawB(homes, 6);
    // Galleon Beach: the pale curve of sand on the bay's right shore
    // the beach as a band of sand along the water's edge, and its small pier out into the bay (the owner's
    // photograph), with a light at the pier's end
    const sandBand = [...beachLine, ...P([[0.79, 0.66], [0.799, 0.615], [0.798, 0.583], [0.779, 0.552], [0.754, 0.54]])];
    s += `<path class="isl-vsandband" d="${poly(sandBand)}"/>`;
    s += `<path class="isl-vsand" d="${line(beachLine)}" stroke-width="${F(Math.max(1, Y(0.005)))}"/>`;
    const pier0 = P([[0.776, 0.566]])[0], pier1 = P([[0.742, 0.575]])[0], pt = Y(0.005);
    s += `<path class="isl-bdock" d="M${F(pier0[0])} ${F(pier0[1])}L${F(pier1[0])} ${F(pier1[1])}l0 ${F(pt)}L${F(pier0[0])} ${F(pier0[1] + pt)}Z"/>`;
    lights.push([pier1[0] + 1, pier1[1] - Y(0.008), 1]);
    // The inner harbour, running right from the dockyard behind a green spit, with its masts
    for (let i = 0; i < 12; i++) {
      const x = X(0.73 + r() * 0.24), foot = Yp(0.395 + r() * 0.01), top = foot - Y(0.03 + r() * 0.03);
      masts += `M${F(x)} ${F(foot)}V${F(top)}`;
      lights.push([x, top, 0]);
    }
    // 3. The headland: its cliff point on the left, its crest, and Fort Berkeley's spur into the bay.
    s += `<path class="f-near isl-land" d="${poly(head)}${scrub(head.slice(2, 17), 6, 0.9, 2.3)}"/>`;
    // by Day: the headland's shaded flank, its rock (the cliff at the point, Fort Berkeley's spur), its trees,
    // and the dockyard's buildings at its foot; at Dawn, the first light along its crest
    const cliff = P([[0.19, 0.378], [0.194, 0.358], [0.203, 0.343], [0.212, 0.318], [0.224, 0.302], [0.234, 0.318], [0.238, 0.345], [0.23, 0.372], [0.22, 0.387], [0.2, 0.384]]);
    let strata = '';
    for (const [a, c] of [[[0.196, 0.36], [0.236, 0.356]], [[0.2, 0.348], [0.237, 0.343]], [[0.206, 0.336], [0.236, 0.331]], [[0.21, 0.324], [0.235, 0.32]], [[0.216, 0.312], [0.232, 0.31]]]) strata += line(P([a, c]));
    s += `<g class="isl-ydet">${flanks(head.slice(0, 18), Yp(0.42))}<path class="isl-vrock" d="${poly(cliff)}"/><path class="isl-vrockline" d="${strata}" stroke-width=".8"/>`
      + `<path class="isl-vrockline" d="${line(head.slice(25, 32))}" stroke-width="${F(Math.max(1.2, Y(0.006)))}"/>`
      + `${trees(head.slice(4, 25), 150, Y(0.006), Y(0.012), 37)}</g>`;
    s += `<g class="isl-adet"><path class="isl-vgildline" d="${line(head.slice(2, 17))}" stroke-width="2" filter="url(#islvsoft)"/><path class="isl-vgildline" d="${line(head.slice(2, 17))}" stroke-width=".7"/></g>`;
    // From the owner's day photographs (2026-09-28): by Day, dry grass on the headland's lower slopes and
    // a pale rocky strip along its shore, and Fort Berkeley's stone walls along the spur.
    const dry = [P([[0.2, 0.37], [0.24, 0.345], [0.3, 0.33], [0.36, 0.33], [0.4, 0.36], [0.36, 0.395], [0.3, 0.4], [0.24, 0.39]]),
      P([[0.42, 0.37], [0.47, 0.36], [0.53, 0.37], [0.56, 0.4], [0.5, 0.415], [0.44, 0.41]])];
    s += `<g class="isl-ydet"><path class="isl-vdry" d="${dry.map(poly).join('')}" filter="url(#islvbayf)"/>`
      + `<path class="isl-vrockshore" d="${line(head.slice(33))}" stroke-width="${F(Math.max(1.4, Y(0.007)))}"/>`
      + `<path class="isl-vfort" d="${line(P([[0.512, 0.446], [0.506, 0.462], [0.498, 0.478], [0.49, 0.494]]))}M${F(X(0.484))} ${F(Yp(0.5))}h${F(X(0.02))}" stroke-width="${F(Math.max(1.2, Y(0.006)))}"/></g>`;
    // The compound on the bluff (owner, 2026-09-28, from satellite imagery and his photographs): several
    // buildings under gray hipped roofs along the top of the knob, dark with lit windows at Dawn, Dusk and
    // Night; by Day, with the trees around them, their pools and terrace and the driveway down the slope.
    const bluff = bld();
    for (const [fx, fy, fw, win] of [[0.237, 0.306, 0.009, 1], [0.25, 0.303, 0.013, 2], [0.266, 0.302, 0.016, 3],
      [0.282, 0.302, 0.012, 2], [0.294, 0.304, 0.009, 1], [0.259, 0.31, 0.009, 1]]) house(bluff, X(fx), Yp(fy), X(fw), { win });
    s += `<g class="isl-ydet">${trees(P([[0.228, 0.301], [0.3, 0.297], [0.312, 0.312], [0.236, 0.318]]), 16, Y(0.006), Y(0.01), 43)}</g>`;
    s += drawB(bluff, 1);
    s += `<g class="isl-ydet"><path class="isl-vpool" d="M${F(X(0.262))} ${F(Yp(0.315))}h${F(X(0.009))}v${F(-Y(0.006))}h${F(-X(0.009))}ZM${F(X(0.285))} ${F(Yp(0.312))}h${F(X(0.006))}v${F(-Y(0.005))}h${F(-X(0.006))}Z"/>`
      + `<path class="isl-vterrace" d="M${F(X(0.273))} ${F(Yp(0.315))}h${F(X(0.008))}v${F(-Y(0.005))}h${F(-X(0.008))}Z"/>`
      + `<path class="isl-vroad" d="${line(P([[0.298, 0.307], [0.308, 0.311], [0.316, 0.318], [0.33, 0.326]]))}" stroke-width="${F(Math.max(1, Y(0.005)))}"/></g>`;
    const shore = head.slice(18);
    s += `<path class="isl-vshore" d="${line(shore)}" stroke-width="1"/>`;
    s += `<path class="isl-vsurf" d="${line(P([[0.186, 0.366], [0.19, 0.38], [0.2, 0.388], [0.215, 0.39], [0.235, 0.396]]))}" stroke-width="${F(Math.max(1.2, Y(0.006)))}"/>`;
    // 4. Nelson's Dockyard (owner, 2026-09-28: "there is a dock jutting out into the bay, there is also a land
    //    bridge which is occupied by buildings"): the land between the bay and the inner harbour, built over with
    //    the dockyard's stone buildings, and a dock running out into the bay with yachts moored along it, the
    //    same in every version. Its windows, the dock's lamps and the moored yachts' lights come on first.
    const bridge = P([[0.688, 0.398], [0.708, 0.39], [0.728, 0.397], [0.745, 0.41], [0.752, 0.43], [0.738, 0.444], [0.718, 0.45], [0.698, 0.446], [0.684, 0.432]]);
    s += `<path class="f-near isl-land" d="${poly(bridge)}"/>`;
    const yard = bld();
    for (const [fx, fy, fw, tall] of [[0.698, 0.428, 0.013, 1], [0.713, 0.424, 0.014, 0], [0.73, 0.43, 0.012, 1], [0.702, 0.443, 0.016, 0],
      [0.72, 0.447, 0.017, 1], [0.738, 0.441, 0.012, 0]]) house(yard, X(fx), Yp(fy), X(fw), { stone: true, tall: !!tall, win: 3 });
    s += drawB(yard, 0);
    const d0 = [X(0.7), Yp(0.452)], d1 = [X(0.628), Yp(0.47)], dt = Y(0.008);
    s += `<path class="isl-bdock" d="M${F(d0[0])} ${F(d0[1])}L${F(d1[0])} ${F(d1[1])}l0 ${F(dt)}L${F(d0[0])} ${F(d0[1] + dt)}Z"/>`;
    for (let k = 0; k < 5; k++) {
      const u = (k + 0.5) / 5;
      lights.push([d0[0] + (d1[0] - d0[0]) * u, d0[1] + (d1[1] - d0[1]) * u - Y(0.006), 0]);
    }
    let moored = '';
    for (let i = 0; i < 11; i++) {
      const jx = r(), jf = r(), jt = r();        // the old quay's three draws per mast, so nothing else moves
      if (i > 6) continue;
      const u = (i + 0.4 + jx * 0.2) / 7, x = d0[0] + (d1[0] - d0[0]) * u, dy = d0[1] + (d1[1] - d0[1]) * u;
      const foot = dy + dt + Y(0.012 + jf * 0.004), top = foot - Y(0.07 + jt * 0.04), hw = X(0.011);
      moored += `M${F(x - hw)} ${F(foot - Y(0.008))}H${F(x + hw)}L${F(x + hw * 0.75)} ${F(foot)}H${F(x - hw * 0.8)}Z`;
      masts += `M${F(x)} ${F(foot - Y(0.008))}V${F(top)}`;
      lights.push([x, top, 0]);
    }
    s += `<path class="isl-vhull" d="${moored}"/>`;
    for (let i = 0; i < 18; i++) { r(); r(); }   // the dockyard's old random lights; its windows give them now
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
    s += `<path class="f-near isl-land" d="${poly(slope)}${scrub(slope.slice(0, 19), 6, 1.2, 3.4)}"/>`;
    // Galleon Beach's palms along the back of the sand (every version: silhouettes by night, green by Day)
    let palms = '';
    [[0.79, 0.556, 0.052], [0.803, 0.58, 0.048], [0.806, 0.604, 0.056], [0.805, 0.63, 0.05], [0.797, 0.655, 0.054]].forEach(([fx, fy, fh], k) => {
      palms += palm(X(fx), Yp(fy), Y(fh), 0.06 - k * 0.025, 301 + k);
    });
    s += `<path class="isl-palm" d="${palms}"/>`;
    // by Day, the lookout's own trees in front, the largest and brightest (the owner's photograph)
    s += `<g class="isl-ydet">${trees(slope, 120, Y(0.014), Y(0.045), 41)}</g>`;
    const lx = X(0.43), ly = Yp(0.772);
    s += `<path class="f-near" d="M${F(lx - 1)} ${F(ly + Y(0.02))}V${F(ly - Y(0.05))}H${F(lx + 1)}V${F(ly + Y(0.02))}Z"/>`;
    s += `<circle cx="${F(lx)}" cy="${F(ly - Y(0.06))}" r="${F(Y(0.055))}" fill="url(#islvlamp)"/>`;
    s += `<circle class="isl-vlamp" cx="${F(lx)}" cy="${F(ly - Y(0.06))}" r="${F(Math.max(1.5, Y(0.008)))}"/>`;
    // By Day the far lights that are houses (the villages on the range, Falmouth's shore) show as small
    // houses; a masthead's light is never a house. The near buildings are drawn in every version above.
    let walls = '', roofsR = '', roofsG = '';
    for (const [x, y, g, kind] of lights) {
      if (kind !== 'h' || r() < 0.4) continue;
      const w = Y(0.008 + (g === 3 ? 0.004 : 0)), h = w * 0.62;
      walls += `M${F(x - w / 2)} ${F(y)}h${F(w)}v${F(-h)}h${F(-w)}Z`;
      const roof = `M${F(x - w * 0.62)} ${F(y - h + 0.3)}L${F(x)} ${F(y - h - w * 0.36)}L${F(x + w * 0.62)} ${F(y - h + 0.3)}Z`;
      if (r() < 0.55) roofsR += roof; else roofsG += roof;
    }
    s += `<g class="isl-ydet"><path class="isl-vhouse" d="${walls}"/><path class="isl-vroof" d="${roofsR}"/><path class="isl-vroofg" d="${roofsG}"/></g>`;
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
    let yachts = '';
    for (const [fx, fy, s0] of [[0.2, 0.09, 1], [0.34, 0.16, 1.3], [0.12, 0.3, 1.7], [0.47, 0.06, 0.8]]) {
      const bx = W * fx, by = v.y0 + (H - v.y0) * fy, L = Math.max(8, W * 0.014 * s0), mh = L * 1.3;
      yachts += `<path class="isl-vhull" d="M${F(bx - L / 2)} ${F(by - L * 0.1)}H${F(bx + L / 2)}L${F(bx + L * 0.36)} ${F(by)}H${F(bx - L * 0.4)}Z"/>`
        + `<path class="isl-vsail" d="M${F(bx)} ${F(by - L * 0.12)}V${F(by - mh)}L${F(bx + L * 0.42)} ${F(by - L * 0.14)}ZM${F(bx - L * 0.04)} ${F(by - mh * 0.85)}L${F(bx - L * 0.45)} ${F(by - L * 0.14)}H${F(bx - L * 0.04)}Z"/>`;
    }
    return `<g class="isl-ydet">${yachts}</g>`
      + `<g transform="translate(${F(x - bx0 * k)} ${F(y - by0 * k)}) scale(${F(k * 1000) / 1000})"><path class="f-bird" d="${B.d}"/></g>`;
  }

  /* THE FINISH (owner, 2026-09-28: the art should reach the quality of his media tracker's scenes).
     The techniques that give those scenes their depth, here in Island Night's palette and both
     schemes: ripples dense at the horizon and long near the viewer; a broken column of light on the
     water under every light, its dashes widening and scattering with distance; a faint mirrored
     reflection of the land; soft halos around lamps and pools of light on the ground; mist lying at the
     foot of the land; and a print grain on the sky, fainter on the water and never on the land
     (build() lays it under the land, so every hill, building and ship covers it). Colours come from
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
    land += `<path class="f-far isl-land" d="${poly(hills)}${scrub(hills.slice(0, 11), 6, 0.8, 2)}"/>`;
    land += `<path class="s-rim" d="M${hills.slice(0, 11).map(([x, y]) => `${F(x)} ${F(y + 0.5)}`).join('L')}" stroke-width="1.2" stroke-opacity=".5"/>`;
    for (let i = 0; i < 18; i++) lights[1].push([X(0.62 + r() * 0.38), Y(0.54 + r() * 0.055)]);
    const regattaHouses = makeKit(W, H).dayHouses(lights[1], Y(0.02), 61);
    s += land + regattaHouses + mirrored(y0, land, 0.18);
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
    s += makeKit(W, H).dayHouses(shoreLights, Y(0.016), 67);
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
    s += `<path class="f-far isl-land" d="${poly(P([...crest, [1.02, 1.03]]))}${scrub(P(crest.slice(1, 13)), 8, 1, 2.8)}"/>`;
    s += `<g class="isl-ydet">${makeKit(W, H).trees(P([...crest, [1.02, 1.03]]), 80, Y(0.012), Y(0.032), 83)}</g>`;
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

  /* Shared by the pieces below: a scrub edge along a line of points, and polygon paths. */
  function scrubLine(pts, n, s0, s1, r) {
    let d = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const [xa, ya] = pts[i], [xb, yb] = pts[i + 1];
      for (let j = 0; j < n; j++) {
        const t2 = r(), x = xa + (xb - xa) * t2, y = ya + (yb - ya) * t2, rr = s0 + r() * (s1 - s0);
        d += `M${F(x - rr)} ${F(y + rr * 0.45)}a${F(rr)} ${F(rr * 0.82)} 0 0 1 ${F(2 * rr)} 0Z`;
      }
    }
    return d;
  }
  // Shrubs ([x, y, size], y at the foot): a rounded crown of overlapping circles, domed, over a
  // broad base, its upper edge catching the light (a lighter crown under the dark one, which sits a
  // little lower and to the right). Flat-bottomed humps scattered on a slope read as pebbles; these
  // read as scrub once they are big enough to see.
  function shrubs(list, r) {
    let lit = '', dark = '';
    const circ = (x, y, rr) => `M${F(x - rr)} ${F(y)}a${F(rr)} ${F(rr)} 0 1 0 ${F(2 * rr)} 0a${F(rr)} ${F(rr)} 0 1 0 ${F(-2 * rr)} 0Z`;
    for (const [cx, cy, sz] of list) {
      const n = 4 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1)) * 2 - 1, rr = sz * (0.3 + r() * 0.2);
        const x = cx + t * sz * 0.72, y = cy - sz * (0.32 + (1 - t * t) * 0.42) + (r() - 0.5) * sz * 0.14;
        lit += circ(x, y, rr);
        dark += circ(x + rr * 0.16, y + rr * 0.2, rr);
      }
      // the base, wound the same way as the circles (a base wound the other way cancels where they overlap)
      dark += `M${F(cx + sz * 0.9)} ${F(cy)}a${F(sz * 0.9)} ${F(sz * 0.42)} 0 0 0 ${F(-sz * 1.8)} 0Z`;
    }
    return `<path class="isl-vlit isl-shrubl" d="${lit}"/><path class="f-near isl-shrub" d="${dark}"/>`;
  }
  const polyD = (pts) => 'M' + pts.map(([x, y]) => `${F(x)} ${F(y)}`).join('L') + 'Z';
  const lineD = (pts) => 'M' + pts.map(([x, y]) => `${F(x)} ${F(y)}`).join('L');
  const lightsD = (pts) => pts.map(([x, y]) => `M${F(x)} ${F(y)}h0`).join('');

  /* THE TELESCOPE (the Learn landing's head; the owner chose it, 2026-09-28): learning as looking
     further. A brass telescope on its tripod at a hilltop lookout, trained on the night sky beside the
     Moon; a low stone wall along the lookout's edge hides its feet, with a lantern in the lesson hue at
     its end; a small stone guardhouse at the edge of the picture, its door and window lit; the hill
     falls to the harbour in scrub, a footpath climbing it; below, boats at anchor and the far hills'
     lights, each laying a column of light on the water; the Milky Way above at night. The picture fits
     the height of the head's text, so everything is sized from the card's height and placed along
     its width. The harbour's lights come on, then the guardhouse, then the lantern, last. */
  function telescope(W, H, v) {
    const y0 = v.y0, X = (f) => f * W, Y = (f) => f * H, r = rng(311);
    const lights = [];
    let s = '';
    // 1. The water: ripples, the far hills rimmed by the afterglow, their lights, mist at their foot.
    s += dashes(hatchList(W * 0.62, y0, H, r), 's-vrip', 1, [0.1, 0.18, 0.28]);
    const far = [[-0.02, 0.02], [0.06, 0.05], [0.13, 0.09], [0.2, 0.07], [0.27, 0.12], [0.34, 0.08], [0.42, 0.1], [0.5, 0.06], [0.58, 0.04], [0.66, 0]]
      .map(([x, h]) => [X(x), y0 - Y(h)]);
    const farLand = `<path class="f-isl" d="${polyD([[X(-0.02), y0 + 1], ...far, [X(0.66), y0 + 1]])}${scrubLine(far, 3, 0.6, 1.4, r)}"/>`;
    s += farLand + `<path class="s-rim" d="${lineD(far.slice(0, 7).map(([x, y]) => [x, y + 0.5]))}" stroke-width="1" stroke-opacity=".3"/>`;
    s += mirrored(y0, farLand, 0.18) + mist(X(-0.05), y0, X(0.66), Y(0.06), 0.5);
    for (let i = 0; i < 18; i++) lights.push([X(0.02 + r() * 0.56), y0 - Y(0.004 + r() * 0.04)]);
    s += makeKit(W, H).dayHouses(lights, Y(0.022), 71);
    for (const [x] of lights) if (r() < 0.6) s += dashes(streakList(x, y0, H, r, 0.04, 0.05), 's-vglow', 1, [0.06, 0.12, 0.22]);
    // 2. Boats at anchor below: hulls, masts, masthead lights, their columns and their reflections.
    let boats = '', masts = '';
    const moor = [[0.08, 0.16, 1], [0.17, 0.28, 0.8], [0.27, 0.12, 1.3], [0.36, 0.22, 0.9], [0.44, 0.31, 1.1]];
    for (const [fx, fy, k] of moor) {
      const bx = X(fx), by = y0 + Y(fy), hw = Y(0.03) * k, mh = Y(0.09 + r() * 0.05) * k;
      boats += `M${F(bx - hw)} ${F(by - Y(0.012))}H${F(bx + hw)}L${F(bx + hw * 0.75)} ${F(by)}H${F(bx - hw * 0.8)}Z`;
      masts += `M${F(bx)} ${F(by - Y(0.012))}V${F(by - mh)}`;
      lights.push([bx, by - mh]);
      s += dashes(streakList(bx, by + 1, H, r, 0.05, 0.06), 's-vglow', 1, [0.08, 0.16, 0.3]);
      s += `<g opacity=".15"><g transform="translate(0 ${F(2 * by)}) scale(1 -1)"><path class="isl-vhull" d="M${F(bx - hw)} ${F(by - Y(0.012))}H${F(bx + hw)}L${F(bx + hw * 0.75)} ${F(by)}H${F(bx - hw * 0.8)}Z"/><path class="isl-vmast" d="M${F(bx)} ${F(by)}V${F(by - mh)}" stroke-width=".8"/></g></g>`;
    }
    s += `<path class="isl-vhull" d="${boats}"/><path class="isl-vmast" d="${masts}" stroke-width=".8"/>`;
    // 3. The hill, rising from the water to the level top where the lookout stands: mist at its foot,
    //    its crest rimmed, a footpath climbing it, and scrub along the crest, on its face and at the
    //    foot of the picture, darker than the hill.
    const crest = [[0.5, 1.03], [0.53, 0.9], [0.57, 0.78], [0.62, 0.68], [0.67, 0.61], [0.72, 0.575], [0.78, 0.56], [0.86, 0.555], [1.02, 0.55]]
      .map(([x, y]) => [X(x), Y(y)]);
    s += mist(X(0.38), y0 + Y(0.12), X(0.22), Y(0.1), 0.45);
    s += `<path class="f-far isl-land" d="${polyD([...crest, [X(1.02), H + 2]])}"/>`;
    s += `<g class="isl-ydet">${makeKit(W, H).trees([...crest, [X(1.02), H + 2]], 50, Y(0.012), Y(0.03), 89)}</g>`;
    s += `<path class="s-rim" d="${lineD(crest.slice(1, 7).map(([x, y]) => [x, y + 0.5]))}" stroke-width="1.2" stroke-opacity=".45"/>`;
    s += `<path class="isl-vtrack" d="M${F(X(0.62))} ${F(H + 2)}C${F(X(0.66))} ${F(Y(0.85))} ${F(X(0.64))} ${F(Y(0.72))} ${F(X(0.7))} ${F(Y(0.6))}L${F(X(0.725))} ${F(Y(0.585))}C${F(X(0.68))} ${F(Y(0.72))} ${F(X(0.7))} ${F(Y(0.86))} ${F(X(0.665))} ${F(H + 2)}Z"/>`;
    // scrub on the crest's edge against the water, a few shrubs on the slope, and a bank of them along
    // the foot of the picture, largest nearest
    s += shrubs([[0.538, 0.9, 0.04], [0.562, 0.825, 0.035], [0.598, 0.75, 0.04], [0.64, 0.665, 0.03]].map(([x, y, k]) => [X(x), Y(y), Y(k)]), r);
    s += shrubs([[0.595, 0.9, 0.07], [0.755, 0.78, 0.07], [0.86, 0.71, 0.06], [0.94, 0.86, 0.08]].map(([x, y, k]) => [X(x), Y(y), Y(k)]), r);
    s += shrubs([[0.55, 1.08, 0.14], [0.75, 1.1, 0.13], [0.86, 1.08, 0.16], [0.99, 1.06, 0.15]].map(([x, y, k]) => [X(x), Y(y), Y(k)]), r);
    // 4. The guardhouse at the lookout's far end: coursed stone, a hipped roof of old shingle, its
    //    arched door and a small window lit from within.
    const gx0 = X(0.905), gx1 = X(1.03), gTop = Y(0.33), gBase = Y(0.56);
    s += `<g class="isl-vwin" style="--i:2">${halo(X(0.96), Y(0.46), Y(0.34), 'islvwarm')}</g>`;
    s += `<path d="M${F(gx0)} ${F(gBase)}V${F(gTop)}H${F(gx1)}V${F(gBase)}Z" fill="url(#islvfacade)"/>`;
    s += `<path class="isl-vwood-f" d="M${F(gx0 - Y(0.02))} ${F(gTop + 1)}L${F(gx0 + (gx1 - gx0) * 0.3)} ${F(gTop - Y(0.09))}H${F(gx1 + Y(0.1))}L${F(gx1 + Y(0.12))} ${F(gTop + 1)}Z"/>`;
    let gc = '';
    for (let y = gBase - Y(0.03); y > gTop + Y(0.01); y -= Y(0.03)) gc += `M${F(gx0)} ${F(y)}H${F(gx1)}`;
    s += `<path class="isl-vcourse" d="${gc}" stroke-width=".7"/>`;
    const dw = Y(0.05), dx = gx0 + (gx1 - gx0) * 0.55;
    s += `<path class="f-pulse isl-vwin" style="--i:2" d="M${F(dx - dw / 2)} ${F(gBase)}V${F(gBase - Y(0.1))}a${F(dw / 2)} ${F(dw / 2)} 0 0 1 ${F(dw)} 0V${F(gBase)}ZM${F(gx0 + Y(0.035))} ${F(gTop + Y(0.06))}h${F(Y(0.03))}v${F(Y(0.04))}h${F(-Y(0.03))}Z"/>`;
    // 5. The telescope on its tripod, trained on the sky (a telescope aimed level at a low Moon reads
    //    as pointing at the harbour, so it looks up and to the left, toward the Moon's side of the sky).
    const moonAt = [v.x((SKY.d.moon[0] + SKY.n.moon[0]) / 2), v.y((SKY.d.moon[1] + SKY.n.moon[1]) / 2)];
    const tx = X(0.8), ty = Y(0.33), footY = Y(0.56), len = Y(0.34), d0 = Y(0.038), d1 = Y(0.024);
    let ang = Math.atan2(moonAt[1] - ty, moonAt[0] - tx);
    if (!(ang < -0.2 && ang > -2.9)) ang = -2.5;
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
    const fx = tx + ux * len * 0.62, fy = ty + uy * len * 0.62, bx2 = tx - ux * len * 0.38, by2 = ty - uy * len * 0.38;
    s += `<path class="isl-vtripod" d="M${F(tx)} ${F(ty + Y(0.02))}L${F(tx - Y(0.12))} ${F(footY)}M${F(tx)} ${F(ty + Y(0.02))}L${F(tx + Y(0.11))} ${F(footY)}M${F(tx)} ${F(ty + Y(0.02))}L${F(tx + Y(0.015))} ${F(footY + 1)}M${F(tx - Y(0.06))} ${F(ty + Y(0.12))}L${F(tx + Y(0.06))} ${F(ty + Y(0.12))}" stroke-width="${F(Math.max(1.4, Y(0.008)))}"/>`;
    const q = (x, y, w) => [[x + nx * w, y + ny * w], [x - nx * w, y - ny * w]];
    const [a1, a2] = q(fx, fy, d0), [b1, b2] = q(bx2, by2, d1);
    s += `<path d="${polyD([a1, b1, b2, a2])}" fill="url(#islvbrass)"/>`;
    const sh = [fx - ux * len * 0.12, fy - uy * len * 0.12], [c1, c2] = q(sh[0], sh[1], d0 * 1.15), [e1, e2] = q(fx + ux * Y(0.01), fy + uy * Y(0.01), d0 * 1.15);
    s += `<path class="isl-vbrass2" d="${polyD([c1, e1, e2, c2])}"/>`;
    // the finder scope, riding on two brackets along the tube
    const fd = [tx + nx * d0 * 1.6 + ux * len * 0.08, ty + ny * d0 * 1.6 + uy * len * 0.08];
    let brk = '';
    for (const k of [0.13, 0.28]) brk += `M${F(tx + ux * len * k + nx * d0 * 0.8)} ${F(ty + uy * len * k + ny * d0 * 0.8)}l${F(nx * d0 * 0.8)} ${F(ny * d0 * 0.8)}`;
    s += `<path class="isl-vbrass2" d="${brk}" stroke-width="${F(Math.max(1, Y(0.006)))}"/>`;
    s += `<path class="isl-vbrass2" d="M${F(fd[0])} ${F(fd[1])}l${F(ux * len * 0.25)} ${F(uy * len * 0.25)}" stroke-width="${F(Math.max(1.5, Y(0.012)))}" stroke-linecap="round"/>`;
    s += `<path class="isl-vbrass2" d="M${F(bx2)} ${F(by2)}l${F(-ux * Y(0.03))} ${F(-uy * Y(0.03))}" stroke-width="${F(Math.max(2, Y(0.02)))}" stroke-linecap="round"/>`;
    s += `<rect class="isl-vtripod-f" x="${F(tx - Y(0.015))}" y="${F(ty - Y(0.012))}" width="${F(Y(0.03))}" height="${F(Y(0.034))}"/>`;
    s += `<circle class="isl-vlens" cx="${F(fx + ux * Y(0.012))}" cy="${F(fy + uy * Y(0.012))}" r="${F(Math.max(1.2, d0 * 0.55))}"/>`;
    // 6. The low wall along the lookout's edge, in front of the tripod's feet: coursed stone under a
    //    coping that catches the light, its foot following the crest.
    const wx0 = X(0.685), wx1 = X(0.905), wTop = Y(0.5);
    const foot = crest.filter(([x]) => x > wx0 && x < wx1).map(([x, y]) => [x, y + Y(0.03)]);
    const wallPts = [[wx0, wTop], [wx1, wTop], [wx1, Y(0.585)], ...foot.reverse(), [wx0, Y(0.61)]];
    s += `<path d="${polyD(wallPts)}" fill="url(#islvfacade)"/><path class="isl-vpshade" d="${polyD(wallPts)}"/>`;
    s += `<path class="isl-vstone" d="M${F(wx0 - Y(0.008))} ${F(wTop + Y(0.018))}V${F(wTop)}H${F(wx1)}V${F(wTop + Y(0.018))}Z"/>`;
    let wj = `M${F(wx0)} ${F(wTop + Y(0.045))}H${F(wx1)}`;
    for (let x = wx0 + Y(0.05), k = 0; x < wx1; x += Y(0.05), k++) wj += `M${F(x + (k % 2) * Y(0.025))} ${F(wTop + Y(0.018))}v${F(Y(0.027))}`;
    s += `<path class="isl-vcourse" d="${wj}" stroke-width=".7"/>`;
    // 7. The lantern at the wall's end, over the path, in the page's hue: its pool, halo, and last.
    const lx = wx0 + Y(0.02), ly = wTop;
    s += `<g class="isl-vwin isl-vlast" style="--i:4">${pool(lx + Y(0.02), Y(0.62), Y(0.2), Y(0.06), 0.7)}${halo(lx, ly - Y(0.1), Y(0.17), 'islvlamp')}`
      + `<path class="isl-vlamp" d="M${F(lx - Y(0.014))} ${F(ly - Y(0.07))}V${F(ly - Y(0.13))}H${F(lx + Y(0.014))}V${F(ly - Y(0.07))}Z"/></g>`;
    s += `<path class="isl-vpost" d="M${F(lx - 1)} ${F(ly)}V${F(ly - Y(0.07))}H${F(lx + 1)}V${F(ly)}ZM${F(lx - Y(0.022))} ${F(ly - Y(0.13))}L${F(lx)} ${F(ly - Y(0.155))}L${F(lx + Y(0.022))} ${F(ly - Y(0.13))}Z"/>`;
    s += `<path class="s-vlight isl-vwin" style="--i:0" d="${lightsD(lights)}" stroke-width="1.4"/>`;
    return s;
  }

  /* BETTY'S HOPE (the Tools & Prompts landing's head; the owner chose it, 2026-09-28): the restored
     sugar mill at Betty's Hope, a tool that turns wind into work, from the references studied (the art's
     source folder README lists them): a tapered tower of coursed stone with an arched door, a boxy
     wooden cap, four lattice sails and the long tail pole that turns the cap into the wind; its
     roofless twin beside it; the estate's stone house with lit windows; cane drying racks; the fields
     and far hills. In the one pass the sails turn a quarter as the lights come on, then rest; the lamp
     by the mill door is last. Sized from the card's height: the head's text is short. */
  function bettysHope(W, H, v) {
    const y0 = v.y0, X = (f) => f * W, Y = (f) => f * H, r = rng(223);
    const lights = [[], []];
    let s = '';
    // 1. Far hills along the horizon, their lights, mist.
    const far = [[-0.02, 0.03], [0.1, 0.07], [0.2, 0.05], [0.3, 0.09], [0.4, 0.06], [0.5, 0.04], [0.62, 0.08], [0.74, 0.05], [0.86, 0.07], [1.02, 0.04]]
      .map(([x, h]) => [X(x), y0 - Y(h)]);
    s += `<path class="f-isl" d="${polyD([[X(-0.02), y0 + Y(0.02)], ...far, [X(1.02), y0 + Y(0.02)]])}${scrubLine(far, 3, 0.6, 1.4, r)}"/>`;
    for (let i = 0; i < 14; i++) lights[0].push([X(r()), y0 - Y(0.005 + r() * 0.04)]);
    s += makeKit(W, H).dayHouses(lights[0], Y(0.028), 73);
    // 2. The fields: a rolling middle ground, rows of cane, darker toward the viewer; mist.
    const field = [[-0.02, 0.76], [0.1, 0.74], [0.25, 0.75], [0.4, 0.73], [0.55, 0.74], [0.7, 0.72], [0.85, 0.73], [1.02, 0.71]].map(([x, y]) => [X(x), Y(y)]);
    s += `<path class="f-far isl-land" d="${polyD([[X(-0.02), y0], [X(1.02), y0], ...field.slice().reverse()])}"/>`;
    s += mist(X(-0.05), y0 + Y(0.03), X(1.1), Y(0.06), 0.45);
    let cane = '';
    for (let row = 0; row < 5; row++) {
      const yy = y0 + Y(0.04 + row * 0.035), hh = Y(0.02 + row * 0.006);
      for (let x = X(-0.01); x < X(1.01); x += Y(0.006 + r() * 0.014 + row * 0.002)) {
        const h2 = hh * (0.55 + r() * 0.7), lean = (r() - 0.5) * h2 * 0.9;
        cane += `M${F(x)} ${F(yy + r() * Y(0.01))}q${F(lean * 0.3)} ${F(-h2 * 0.6)} ${F(lean)} ${F(-h2)}`;
      }
    }
    s += `<path class="isl-vcane" d="${cane}" stroke-width=".8" stroke-opacity=".75"/>`;
    s += `<path class="f-near isl-land" d="${polyD([...field, [X(1.02), H + 2], [X(-0.02), H + 2]])}"/>`;
    // 3. The estate house on the left: stone, a hipped roof, windows lit, a lamp by the door.
    const hx0 = X(0.12), hw = Y(0.62), hTop = Y(0.6), hBot = Y(0.75), hRoof = Y(0.1);
    s += `<path class="isl-vstone" d="M${F(hx0)} ${F(hBot)}V${F(hTop)}H${F(hx0 + hw)}V${F(hBot)}Z"/>`;
    s += `<path class="isl-vwood-f" d="M${F(hx0 - Y(0.02))} ${F(hTop + 1)}L${F(hx0 + hw * 0.15)} ${F(hTop - hRoof)}H${F(hx0 + hw * 0.85)}L${F(hx0 + hw + Y(0.02))} ${F(hTop + 1)}Z"/>`;
    let wins = '';
    for (let i = 0; i < 5; i++) {
      const wx = hx0 + hw * (0.12 + i * 0.19);
      wins += i === 2 ? `M${F(wx - Y(0.018))} ${F(hBot)}V${F(hTop + Y(0.04))}h${F(Y(0.036))}V${F(hBot)}Z` : `M${F(wx - Y(0.014))} ${F(hTop + Y(0.035))}h${F(Y(0.028))}v${F(Y(0.05))}h${F(-Y(0.028))}Z`;
    }
    s += `<path class="f-pulse isl-vwin" style="--i:1" d="${wins}"/>`;
    s += `<g class="isl-vwin" style="--i:1">${halo(hx0 + hw * 0.5, hTop + Y(0.07), Y(0.25), 'islvwarm')}</g>`;
    // 3b. The boiling house, roofless: a stone wall with a broken gable and three arched openings, the
    //     fields seen through them.
    const bx0 = X(0.3), bx1 = X(0.43), bTop = Y(0.64), bBase = Y(0.748), bwid = bx1 - bx0;
    let ruin = `M${F(bx0)} ${F(bBase)}V${F(bTop)}L${F(bx0 + bwid * 0.14)} ${F(Y(0.575))}L${F(bx0 + bwid * 0.26)} ${F(Y(0.615))}`;
    for (let i = 3; i <= 10; i++) ruin += `L${F(bx0 + bwid * i / 10)} ${F(bTop + Y(0.004) + r() * Y(0.03))}`;
    ruin += `V${F(bBase)}Z`;
    for (let i = 0; i < 3; i++) {
      const cx = bx0 + bwid * (0.24 + i * 0.26), ar = bwid * 0.075;
      ruin += `M${F(cx - ar)} ${F(bBase)}V${F(bBase - Y(0.05))}A${F(ar)} ${F(ar)} 0 0 1 ${F(cx + ar)} ${F(bBase - Y(0.05))}V${F(bBase)}Z`;
    }
    s += `<path d="${ruin}" fill="url(#islvfacade)" fill-rule="evenodd"/>`;
    let rc = '';
    for (let y = bBase - Y(0.025); y > bTop; y -= Y(0.025)) rc += `M${F(bx0)} ${F(y)}H${F(bx1)}`;
    s += `<path class="isl-vcourse" d="${rc}" stroke-width=".6"/>`;
    // 4. The twin mill, roofless, a shorter tower with a broken top and a dark arched opening.
    const tower = (cx, base, th, wb, wt, broken) => {
      const top = base - th;
      let d = `M${F(cx - wb / 2)} ${F(base)}L${F(cx - wt / 2)} ${F(top)}`;
      if (broken) d += `L${F(cx - wt * 0.2)} ${F(top - Y(0.012))}L${F(cx + wt * 0.05)} ${F(top + Y(0.006))}L${F(cx + wt * 0.3)} ${F(top - Y(0.008))}`;
      d += `L${F(cx + wt / 2)} ${F(top)}L${F(cx + wb / 2)} ${F(base)}Z`;
      let c = '';
      for (let y = base - Y(0.03); y > top + Y(0.01); y -= Y(0.028)) {
        const k = (base - y) / th, half = (wb + (wt - wb) * k) / 2;
        c += `M${F(cx - half)} ${F(y)}H${F(cx + half)}`;
      }
      return { d, c, top };
    };
    const twin = tower(X(0.5), Y(0.745), Y(0.4), Y(0.26), Y(0.18), true);
    s += `<path class="isl-vstone" d="${twin.d}"/><path class="isl-vcourse" d="${twin.c}" stroke-width=".6"/>`;
    s += `<path class="isl-vpshade" d="M${F(X(0.5) + Y(0.02))} ${F(Y(0.745))}L${F(X(0.5) + Y(0.02))} ${F(twin.top)}L${F(X(0.5) + Y(0.09))} ${F(twin.top)}L${F(X(0.5) + Y(0.13))} ${F(Y(0.745))}Z"/>`;
    s += `<path class="isl-vdark" d="M${F(X(0.5) - Y(0.035))} ${F(Y(0.745))}V${F(Y(0.66))}a${F(Y(0.035))} ${F(Y(0.035))} 0 0 1 ${F(Y(0.07))} 0V${F(Y(0.745))}Z"/>`;
    // 5. The restored mill: tower, cap, tail pole, the lit door; the sails in their own group.
    const mx = X(0.74), mb = Y(0.75), mh = Y(0.42), mwb = Y(0.28), mwt = Y(0.19);
    const mill = tower(mx, mb, mh, mwb, mwt, false);
    const capY = mill.top, capW = mwt * 1.25, capH = Y(0.07);
    s += `<path class="isl-vwood" d="M${F(mx + capW * 0.3)} ${F(capY - capH * 0.4)}L${F(mx + capW * 0.3 + Y(0.26))} ${F(mb - Y(0.01))}" stroke-width="${F(Math.max(1.4, Y(0.012)))}"/>`;
    // the cart wheel at the tail pole's foot, by which the cap is turned into the wind
    s += `<circle class="isl-vwood" cx="${F(mx + capW * 0.3 + Y(0.26))}" cy="${F(mb - Y(0.03))}" r="${F(Y(0.028))}" stroke-width="1"/>`;
    s += `<path class="isl-vstone" d="${mill.d}"/><path class="isl-vcourse" d="${mill.c}" stroke-width=".6"/>`;
    s += `<path class="isl-vpshade" d="M${F(mx + Y(0.03))} ${F(mb)}L${F(mx + Y(0.025))} ${F(capY)}L${F(mx + mwt / 2)} ${F(capY)}L${F(mx + mwb / 2)} ${F(mb)}Z"/>`;
    s += `<path class="isl-vwood-f" d="M${F(mx - capW / 2)} ${F(capY + 1)}V${F(capY - capH)}H${F(mx + capW / 2)}V${F(capY + 1)}Z"/>`;
    s += `<path class="isl-vwood-f" d="M${F(mx - capW / 2 - Y(0.01))} ${F(capY - capH + 1)}L${F(mx - capW * 0.3)} ${F(capY - capH - Y(0.035))}H${F(mx + capW * 0.3)}L${F(mx + capW / 2 + Y(0.01))} ${F(capY - capH + 1)}Z"/>`;
    s += `<path class="isl-vwood" d="M${F(mx - capW / 2)} ${F(capY - capH * 0.5)}H${F(mx + capW / 2)}M${F(mx - capW * 0.3)} ${F(capY - capH - Y(0.02))}H${F(mx + capW * 0.3)}" stroke-width=".7"/>`;
    // the door, lit; its light on the ground; the lamp beside it (last to light)
    const door = `M${F(mx - Y(0.035))} ${F(mb)}V${F(mb - Y(0.1))}a${F(Y(0.035))} ${F(Y(0.035))} 0 0 1 ${F(Y(0.07))} 0V${F(mb)}Z`;
    s += `<path class="f-pulse isl-vwin" style="--i:2" d="${door}"/>`;
    s += `<g class="isl-vwin" style="--i:2">${pool(mx, mb + Y(0.02), Y(0.22), Y(0.05), 0.75)}</g>`;
    const lx = mx - mwb / 2 - Y(0.06);
    s += `<path class="isl-vpost" d="M${F(lx - 1)} ${F(mb + Y(0.01))}V${F(mb - Y(0.14))}H${F(lx + 1)}V${F(mb + Y(0.01))}Z"/>`;
    s += `<g class="isl-vwin isl-vlast" style="--i:4">${halo(lx, mb - Y(0.155), Y(0.13), 'islvlamp')}<path class="isl-vlamp" d="M${F(lx - Y(0.011))} ${F(mb - Y(0.14))}V${F(mb - Y(0.175))}H${F(lx + Y(0.011))}V${F(mb - Y(0.14))}Z"/></g>`;
    // cane drying racks by the mill
    let racks = '';
    for (let i = 0; i < 3; i++) {
      const rx0 = mx + mwb / 2 + Y(0.08) + i * Y(0.1), ry = mb - Y(0.02) + i * Y(0.004);
      racks += `M${F(rx0)} ${F(ry)}h${F(Y(0.085))}M${F(rx0)} ${F(ry - Y(0.02))}h${F(Y(0.085))}M${F(rx0 + Y(0.01))} ${F(ry + Y(0.005))}v${F(-Y(0.03))}M${F(rx0 + Y(0.075))} ${F(ry + Y(0.005))}v${F(-Y(0.03))}`;
    }
    s += `<path class="isl-vwood" d="${racks}" stroke-width="1"/>`;
    // the sails: four lattice sails on stocks, from the hub at the cap's front; they turn in the pass
    const hubX = mx - capW * 0.1, hubY = capY - capH * 0.5, sl = Y(0.3), sw2 = Y(0.055);
    let stocks = '', lattice = '';
    for (let k = 0; k < 4; k++) {
      const a = (-58 + k * 90) * Math.PI / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
      stocks += `M${F(hubX)} ${F(hubY)}l${F(ux * sl)} ${F(uy * sl)}`;
      const p0 = [hubX + ux * sl * 0.18, hubY + uy * sl * 0.18], p1 = [hubX + ux * sl, hubY + uy * sl];
      lattice += `M${F(p0[0])} ${F(p0[1])}L${F(p1[0])} ${F(p1[1])}L${F(p1[0] + nx * sw2)} ${F(p1[1] + ny * sw2)}L${F(p0[0] + nx * sw2)} ${F(p0[1] + ny * sw2)}Z`;
      for (let j = 1; j < 7; j++) {
        const t = 0.18 + (j / 7) * 0.82, qx = hubX + ux * sl * t, qy = hubY + uy * sl * t;
        lattice += `M${F(qx)} ${F(qy)}l${F(nx * sw2)} ${F(ny * sw2)}`;
      }
      lattice += `M${F(p0[0] + nx * sw2 * 0.5)} ${F(p0[1] + ny * sw2 * 0.5)}L${F(p1[0] + nx * sw2 * 0.5)} ${F(p1[1] + ny * sw2 * 0.5)}`;
    }
    s += `<g class="isl-vsails" style="transform-origin:${F(hubX)}px ${F(hubY)}px">`
      + `<path class="isl-vlattice" d="${lattice}" stroke-width=".8"/><path class="isl-vwood" d="${stocks}" stroke-width="${F(Math.max(1.6, Y(0.014)))}"/>`
      + `<circle class="isl-vwood-f" cx="${F(hubX)}" cy="${F(hubY)}" r="${F(Y(0.018))}"/></g>`;
    // the dirt track from the foreground to the mill's door, and grass tufts
    s += `<path class="isl-vtrack" d="M${F(X(0.46))} ${F(H + 2)}C${F(X(0.55))} ${F(Y(0.9))} ${F(mx - Y(0.3))} ${F(Y(0.8))} ${F(mx - Y(0.02))} ${F(mb + 1)}L${F(mx + Y(0.04))} ${F(mb + 1)}C${F(mx - Y(0.2))} ${F(Y(0.82))} ${F(X(0.62))} ${F(Y(0.92))} ${F(X(0.56))} ${F(H + 2)}Z"/>`;
    let tufts = '';
    for (let i = 0; i < 60; i++) { const gx = X(r()), gy = Y(0.8 + r() * 0.2), gh = Y(0.02 + r() * 0.03); tufts += `M${F(gx)} ${F(gy)}l${F(-gh * 0.3)} ${F(-gh)}M${F(gx)} ${F(gy)}l${F(gh * 0.05)} ${F(-gh * 1.2)}M${F(gx)} ${F(gy)}l${F(gh * 0.35)} ${F(-gh * 0.9)}`; }
    s += `<path class="isl-vcane" d="${tufts}" stroke-width=".8"/>`;
    // a few trees at the field's edge
    s += `<path class="f-near" d="${palm(X(0.04), Y(0.76), Y(0.3), -0.06, 71)}${palm(X(0.95), Y(0.73), Y(0.26), 0.07, 73)}"/>`;
    s += `<path class="s-vlight isl-vwin" style="--i:0" d="${lightsD(lights[0])}" stroke-width="1.3"/>`;
    return s;
  }

  /* THE OLD COURT HOUSE (the Governance landing's head; the owner chose it, 2026-09-28): St John's
     Court House of 1750, where the court sat downstairs and the Legislative Council met upstairs, now
     the Museum of Antigua and Barbuda; drawn from the references studied (the art's source folder
     README lists them). A two-storey Georgian block of stone, darker toward the cornice and warmer
     where the lamps reach it: channelled rustication and tall round-arched windows with voussoirs and
     keystones on the ground floor, sash windows with lintels and sills above, quoins at both corners,
     a projecting cornice and parapet, a flagpole with a pennant in the governance hue; a lower wing
     with an arched entrance; iron railings on a low wall; the lit windows' light spilling across the
     pavement; Georgian lanterns with their halos and pools; the town's roofs behind. The street lamps
     light first, then the entrance and the ground floor, then the council room upstairs, last. */
  function courtHouse(W, H, v) {
    const X = (f) => f * W, Y = (f) => f * H, r = rng(1750);
    const street = Y(0.84);
    let s = '';
    // 1. The town behind: roofs hipped, gabled and flat, at different heights, a few lit windows.
    // (by Day the town's houses show their walls in the island's pastels under red or gray roofs; at night
    // they are the same dark shapes as before, windows lit)
    const walls = ['', '', ''];
    let roofsR = '', roofsG = '', tw = '', n = 0;
    for (let x = X(-0.03); x < X(1.03); n++) {
      const w = X(0.045 + r() * 0.04), eave = Y(0.56 + r() * 0.1), pitch = Y(0.03 + r() * 0.04), kind = r();
      walls[n % 3] += `M${F(x)} ${F(street)}V${F(eave)}H${F(x + w)}V${F(street)}Z`;
      let roof = `M${F(x)} ${F(eave + 0.3)}`;
      if (kind < 0.45) roof += `L${F(x + w * 0.25)} ${F(eave - pitch)}H${F(x + w * 0.75)}L${F(x + w)} ${F(eave + 0.3)}Z`;
      else if (kind < 0.8) roof += `L${F(x + w / 2)} ${F(eave - pitch * 1.2)}L${F(x + w)} ${F(eave + 0.3)}Z`;
      else roof += `V${F(eave - pitch * 0.4)}H${F(x + w)}V${F(eave + 0.3)}Z`;
      if (n % 5 === 1 || n % 5 === 3) roofsG += roof; else roofsR += roof;
      for (const f of [0.28, 0.62]) if (r() < 0.45) tw += `M${F(x + w * f)} ${F(eave + Y(0.03))}h${F(Y(0.016))}v${F(Y(0.026))}h${F(-Y(0.016))}Z`;
      x += w + X(0.004 + r() * 0.01);
    }
    s += walls.map((d, k) => `<path class="isl-tw${k}" d="${d}"/>`).join('') + `<path class="isl-troof" d="${roofsR}"/><path class="isl-troofg" d="${roofsG}"/>`
      + `<path class="f-pulse isl-vwin" style="--i:0" d="${tw}" opacity=".7"/>`;
    s += mist(X(-0.05), Y(0.7), X(1.1), Y(0.12), 0.3);
    // 2. The lower wing, left, and the main block: stone darker toward the top, the side face in shade.
    const x0 = X(0.44), x1 = X(0.84), sd = X(0.032), top = Y(0.3), mid = Y(0.58), bw = (x1 - x0) / 5;
    const wx0 = X(0.26), wTop = Y(0.5);
    s += `<path d="M${F(wx0)} ${F(street)}V${F(wTop)}H${F(x0)}V${F(street)}Z" fill="url(#islvfacade)"/>`;
    s += `<path class="isl-vstone" d="M${F(wx0 - Y(0.01))} ${F(wTop + Y(0.015))}V${F(wTop - Y(0.035))}H${F(x0)}V${F(wTop + Y(0.015))}Z"/>`;
    s += `<path class="isl-vpshade" d="M${F(wx0)} ${F(wTop + Y(0.015))}H${F(x0)}v${F(Y(0.018))}H${F(wx0)}Z"/>`;
    s += `<path d="M${F(x0)} ${F(street)}V${F(top)}H${F(x1)}V${F(street)}Z" fill="url(#islvfacade)"/>`;
    s += `<path d="M${F(x1)} ${F(street)}V${F(top)}H${F(x1 + sd)}V${F(street)}Z" fill="url(#islvfacade)"/>`;
    s += `<path class="isl-vpshade" d="M${F(x1)} ${F(street)}V${F(top)}H${F(x1 + sd)}V${F(street)}ZM${F(x1)} ${F(street)}V${F(top)}H${F(x1 + sd)}V${F(street)}Z"/>`;
    // the cornice, projecting, lit along its top; the shadow it casts; the parapet above
    s += `<path class="isl-vstone" d="M${F(x0 - Y(0.014))} ${F(top + Y(0.03))}V${F(top)}H${F(x1 + sd + Y(0.014))}V${F(top + Y(0.03))}Z"/>`;
    s += `<path class="isl-vpshade" d="M${F(x0)} ${F(top + Y(0.03))}H${F(x1 + sd)}v${F(Y(0.022))}H${F(x0)}Z"/>`;
    s += `<path d="M${F(x0)} ${F(top + 1)}V${F(top - Y(0.055))}H${F(x1 + sd)}V${F(top + 1)}Z" fill="url(#islvfacade)"/>`;
    s += `<path class="isl-vstone" d="M${F(x0 - Y(0.006))} ${F(top - Y(0.045))}V${F(top - Y(0.06))}H${F(x1 + sd + Y(0.006))}V${F(top - Y(0.045))}Z"/>`;
    // the string course between the floors, and the stone: channelled joints below, fine courses above
    let joints = `M${F(x0)} ${F(mid)}H${F(x1 + sd)}`;
    for (let y = mid + Y(0.045); y < street - Y(0.01); y += Y(0.036)) joints += `M${F(x0)} ${F(y)}H${F(x1 + sd)}`;
    let fine = '';
    for (let y = top + Y(0.08); y < mid - Y(0.01); y += Y(0.03)) fine += `M${F(x0)} ${F(y)}H${F(x1 + sd)}`;
    for (let y = wTop + Y(0.06); y < street - Y(0.01); y += Y(0.036)) joints += `M${F(wx0)} ${F(y)}H${F(x0)}`;
    s += `<path class="isl-vstone" d="M${F(x0 - Y(0.006))} ${F(mid - Y(0.004))}H${F(x1 + sd + Y(0.006))}v${F(Y(0.02))}H${F(x0 - Y(0.006))}Z"/>`;
    s += `<path class="isl-vcourse" d="${joints}" stroke-width="1.1"/><path class="isl-vcourse" d="${fine}" stroke-width=".6" stroke-opacity=".6"/>`;
    // quoins: long and short blocks up both corners of the block, lighter than the stone about them
    let quoins = '';
    for (let k = 0, y = street; y > top + Y(0.04); y -= Y(0.036), k++) {
      const qw = k % 2 ? Y(0.034) : Y(0.054), qh = Y(0.036) - 1.2;
      quoins += `M${F(x0)} ${F(y)}h${F(qw)}v${F(-qh)}h${F(-qw)}ZM${F(x1)} ${F(y)}h${F(-qw)}v${F(-qh)}h${F(qw)}Z`;
    }
    s += `<path class="isl-vstone" d="${quoins}"/>`;
    // 3. The windows. Warm light over the lower facade first, so the openings sit in it.
    s += `<g class="isl-vwin" style="--i:3"><ellipse cx="${F((x0 + x1) / 2)}" cy="${F(street - Y(0.08))}" rx="${F((x1 - x0) * 0.62)}" ry="${F(Y(0.24))}" fill="url(#islvwarm)"/></g>`;
    // the ground floor: five tall round-arched windows with voussoirs and a keystone; three lit, their
    // light spilling out across the pavement
    let arches = '', dark = '', vous = '', keys = '', spill = '';
    for (let i = 0; i < 5; i++) {
      const cx = x0 + bw * (i + 0.5), aw = bw * 0.42, aTop = mid + Y(0.07), aBot = street - Y(0.03), rr = aw / 2, cy = aTop + rr;
      const d = `M${F(cx - rr)} ${F(aBot)}V${F(cy)}A${F(rr)} ${F(rr)} 0 0 1 ${F(cx + rr)} ${F(cy)}V${F(aBot)}Z`;
      const lit = i === 1 || i === 3 || i === 4;
      if (lit) {
        arches += d;
        spill += `M${F(cx - rr)} ${F(street)}H${F(cx + rr)}L${F(cx + rr * 1.8)} ${F(street + Y(0.09))}H${F(cx - rr * 1.8)}Z`;
      } else dark += d;
      for (let k = 0; k <= 6; k++) {
        const a = Math.PI + (k / 6) * Math.PI, ro = rr + Y(0.028);
        vous += `M${F(cx + Math.cos(a) * rr)} ${F(cy + Math.sin(a) * rr)}L${F(cx + Math.cos(a) * ro)} ${F(cy + Math.sin(a) * ro)}`;
      }
      keys += `M${F(cx - Y(0.012))} ${F(cy - rr - Y(0.03))}h${F(Y(0.024))}l${F(-Y(0.004))} ${F(Y(0.032))}h${F(-Y(0.016))}Z`;
      vous += `M${F(cx - rr - Y(0.028))} ${F(cy)}A${F(rr + Y(0.028))} ${F(rr + Y(0.028))} 0 0 1 ${F(cx + rr + Y(0.028))} ${F(cy)}`;
    }
    s += `<path class="isl-vdark" d="${dark}"/><path class="f-pulse isl-vwin" style="--i:3" d="${arches}"/>`;
    s += `<path class="isl-vmul" d="${arches}${dark}" stroke-width=".6" fill="none"/>`;
    s += `<path class="isl-vcourse" d="${vous}" stroke-width="1.2"/><path class="isl-vstone" d="${keys}"/>`;
    // the upper floor, the council room: five sash windows, lintels and sills, glazing bars; lit last
    let sash = '', sashDark = '', trim = '', bars = '';
    for (let i = 0; i < 5; i++) {
      const cx = x0 + bw * (i + 0.5), sw = bw * 0.36, sTop = top + Y(0.085), sBot = mid - Y(0.045);
      const d = `M${F(cx - sw / 2)} ${F(sBot)}V${F(sTop)}H${F(cx + sw / 2)}V${F(sBot)}Z`;
      if (i === 4) sashDark += d; else sash += d;
      trim += `M${F(cx - sw * 0.72)} ${F(sBot)}h${F(sw * 1.44)}v${F(Y(0.014))}h${F(-sw * 1.44)}Z`;
      trim += `M${F(cx - sw * 0.62)} ${F(sTop)}l${F(-Y(0.006))} ${F(-Y(0.024))}h${F(sw * 1.24 + Y(0.012))}l${F(-Y(0.006))} ${F(Y(0.024))}Z`;
      const third = (sBot - sTop) / 3;
      bars += `M${F(cx)} ${F(sTop)}V${F(sBot)}M${F(cx - sw / 2)} ${F(sTop + third)}H${F(cx + sw / 2)}M${F(cx - sw / 2)} ${F(sTop + 2 * third)}H${F(cx + sw / 2)}`;
    }
    s += `<path class="isl-vdark" d="${sashDark}"/><path class="f-pulse isl-vwin isl-vlast" style="--i:5" d="${sash}"/>`;
    s += `<path class="isl-vmul" d="${bars}" stroke-width=".9"/><path class="isl-vstone" d="${trim}"/>`;
    // the wing's arched entrance, lit, with its voussoirs, and two small windows either side
    const ex = (wx0 + x0) / 2, er = (x0 - wx0) * 0.13, eTop = wTop + Y(0.09);
    s += `<path class="f-pulse isl-vwin" style="--i:2" d="M${F(ex - er)} ${F(street)}V${F(eTop + er)}A${F(er)} ${F(er)} 0 0 1 ${F(ex + er)} ${F(eTop + er)}V${F(street)}Z`
      + `M${F(wx0 + (x0 - wx0) * 0.14)} ${F(wTop + Y(0.11))}h${F(Y(0.036))}v${F(Y(0.12))}h${F(-Y(0.036))}ZM${F(x0 - (x0 - wx0) * 0.14 - Y(0.036))} ${F(wTop + Y(0.11))}h${F(Y(0.036))}v${F(Y(0.12))}h${F(-Y(0.036))}Z"/>`;
    s += `<path class="isl-vcourse" d="M${F(ex - er - Y(0.026))} ${F(eTop + er)}A${F(er + Y(0.026))} ${F(er + Y(0.026))} 0 0 1 ${F(ex + er + Y(0.026))} ${F(eTop + er)}" stroke-width="1.2"/>`;
    s += `<g class="isl-vwin" style="--i:2"><path d="M${F(ex - er)} ${F(street)}H${F(ex + er)}L${F(ex + er * 1.8)} ${F(street + Y(0.09))}H${F(ex - er * 1.8)}Z" fill="url(#islvspill)" opacity=".8"/></g>`;
    s += `<g class="isl-vwin" style="--i:3"><path d="${spill}" fill="url(#islvspill)" opacity=".8"/></g>`;
    // the flagpole on the parapet, and its pennant in the page's hue
    const fx = x0 + (x1 - x0) * 0.5, fTop = top - Y(0.24);
    s += `<path class="isl-vmast" d="M${F(fx)} ${F(top - Y(0.06))}V${F(fTop)}" stroke-width="1.3"/>`;
    s += `<path class="isl-vpennant" d="M${F(fx)} ${F(fTop)}Q${F(fx + Y(0.07))} ${F(fTop + Y(0.01))} ${F(fx + Y(0.13))} ${F(fTop + Y(0.04))}Q${F(fx + Y(0.07))} ${F(fTop + Y(0.06))} ${F(fx)} ${F(fTop + Y(0.08))}Z"/>`;
    // 4. The low wall and its iron railings along the front, finials on the posts
    const rx0 = wx0, rx1 = x1 + sd;
    let rail = `M${F(rx0)} ${F(street - Y(0.07))}H${F(rx1)}M${F(rx0)} ${F(street - Y(0.03))}H${F(rx1)}`;
    for (let x = rx0 + Y(0.01); x < rx1; x += Y(0.022)) rail += `M${F(x)} ${F(street - Y(0.018))}V${F(street - Y(0.085))}`;
    s += `<path class="isl-vrailing" d="${rail}" stroke-width="1"/>`;
    s += `<path d="M${F(rx0)} ${F(street + 1)}V${F(street - Y(0.018))}H${F(rx1)}V${F(street + 1)}Z" fill="url(#islvfacade)"/>`;
    // 5. The street: the pavement and its kerb, the road's setts receding, lanterns on posts with their
    //    halos and pools, palms at the edges
    s += `<path class="isl-vtrack" d="M${F(-2)} ${F(street)}H${F(W + 2)}V${F(H + 2)}H${F(-2)}Z"/>`;
    s += `<path class="isl-vstep-edge" d="M${F(-2)} ${F(street + Y(0.045))}H${F(W + 2)}" stroke-width="${F(Math.max(1, Y(0.006)))}" stroke-opacity=".6"/>`;
    let setts = '';
    for (let y = street + Y(0.07); y < H; y += Y(0.024) + (y - street) * 0.12) for (let x = -r() * 20; x < W; x += Y(0.03) + (y - street) * 0.5 + r() * 6) setts += `M${F(x)} ${F(y)}h${F(Y(0.016) + (y - street) * 0.3)}`;
    s += `<path class="isl-vcourse" d="${setts}" stroke-width=".8" stroke-opacity=".5"/>`;
    for (const lx of [X(0.19), X(0.925)]) {
      const ph = Y(0.27), lw = Y(0.022), lh = Y(0.06);
      s += `<g class="isl-vwin" style="--i:1">${pool(lx, street + Y(0.06), Y(0.3), Y(0.06), 0.8)}${halo(lx, street - ph - lh / 2, Y(0.2))}`
        + `<path class="f-pulse" d="M${F(lx - lw)} ${F(street - ph)}V${F(street - ph - lh)}H${F(lx + lw)}V${F(street - ph)}Z"/></g>`;
      s += `<path class="isl-vpost" d="M${F(lx - 1.3)} ${F(street + Y(0.03))}V${F(street - ph)}H${F(lx + 1.3)}V${F(street + Y(0.03))}Z`
        + `M${F(lx - lw * 1.5)} ${F(street - ph - lh)}L${F(lx)} ${F(street - ph - lh - Y(0.035))}L${F(lx + lw * 1.5)} ${F(street - ph - lh)}Z`
        + `M${F(lx - lw * 1.2)} ${F(street - ph + 1)}h${F(lw * 2.4)}v${F(Y(0.01))}h${F(-lw * 2.4)}Z"/>`;
      s += `<path class="isl-vmul" d="M${F(lx)} ${F(street - ph)}V${F(street - ph - lh)}" stroke-width=".8"/>`;
    }
    s += `<path class="f-near" d="${palm(X(0.035), street + Y(0.03), Y(0.44), -0.05, 91)}${palm(X(0.978), street + Y(0.03), Y(0.4), 0.06, 93)}"/>`;
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

  /* ST JOHN'S HARBOUR (the About page, beside Contact and Purpose; redrawn to the section 19 finish on
     2026-09-28, the owner: "do another pass of that art using your new art specs"). St John's, the
     capital, seen from Fort James's rampart at the harbour mouth looking in, from the references in the
     art's source folder (references/web-st-johns-harbour-cruise-ships, owner-st-johns-cruise-ship,
     web-fort-james-*). In front, the fort's stone parapet with an embrasure, a cannon on its carriage
     and the fort's lamp; two cruise ships at the quay, white hulls over a dark boot-top, lifeboats
     slung along their sides, decks of lit cabins, a funnel and a masthead light; the town climbing the
     hill behind in houses of different sizes, walls and roofs, trees between them, windows lit; the
     cathedral's twin towers on the skyline; the hills beyond, the Moon above. On the water: ripples,
     broken columns of light under the quay lamps and the ships, the town and the ships mirrored
     faintly, mist along the quay, a launch with its riding light. Sizes come from one unit, so the
     ships keep their shape whatever the card's proportions. The lights come on at the fort, then the
     quay, the ships and the town, and the cathedral's floodlight last. */
  function harbour(W, H, v) {
    const y0 = v.y0, X = (f) => f * W, Y = (f) => f * H, r = rng(57);
    const u = Math.min(W / 814, H / 527);
    const at = (pts, x) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [xa, ya] = pts[i], [xb, yb] = pts[i + 1];
        if (x >= xa && x <= xb) return ya + (yb - ya) * (x - xa) / (xb - xa);
      }
      return pts[pts.length - 1][1];
    };
    const far = [], quayL = [];
    let s = '';
    // 1. The hills beyond, rimmed, their lights; the town's hillside in front of them.
    const hills = [[-0.02, 0.4], [0.08, 0.36], [0.18, 0.33], [0.3, 0.31], [0.42, 0.3], [0.52, 0.27], [0.6, 0.24], [0.68, 0.25], [0.76, 0.28], [0.86, 0.31], [0.95, 0.29], [1.02, 0.3]]
      .map(([x, y]) => [X(x), Y(y)]);
    s += `<path class="f-isl" d="${polyD([...hills, [X(1.02), y0], [X(-0.02), y0]])}${scrubLine(hills, 4, 0.8, 1.8, r)}"/>`;
    s += `<path class="s-rim" d="${lineD(hills.map(([x, y]) => [x, y + 0.5]))}" stroke-width="1" stroke-opacity=".3"/>`;
    const town = [[-0.02, 0.45], [0.12, 0.43], [0.26, 0.42], [0.4, 0.405], [0.52, 0.385], [0.62, 0.36], [0.68, 0.355], [0.76, 0.37], [0.88, 0.4], [1.02, 0.42]]
      .map(([x, y]) => [X(x), Y(y)]);
    for (let i = 0; i < 26; i++) {
      const x = X(r()), a = at(hills, x) + Y(0.012), b = at(town, x) - Y(0.006);
      if (b > a) far.push([x, a + r() * (b - a)]);
    }
    s += makeKit(W, H).dayHouses(far, Y(0.014), 79);
    s += `<path class="f-far isl-land" d="${polyD([...town, [X(1.02), y0 + 1], [X(-0.02), y0 + 1]])}"/>`;
    // 2. The cathedral on the skyline: twin towers with cornices, cupolas and lanterns, belfry openings,
    //    the nave's gable between them; its floodlight comes on last.
    const cx = X(0.66), tw = 15 * u, gap = 25 * u, foot = at(town, cx) + Y(0.012), eave = foot - 32 * u, tt = foot - 82 * u;
    let cath = `M${F(cx - gap / 2 - tw)} ${F(foot)}V${F(eave)}H${F(cx + gap / 2 + tw)}V${F(foot)}Z`
      + `M${F(cx - gap / 2)} ${F(eave + 1)}L${F(cx)} ${F(eave - 14 * u)}L${F(cx + gap / 2)} ${F(eave + 1)}Z`;
    let domes = '', belfry = '', cc = '';
    for (const sx of [-1, 1]) {
      const x = cx + sx * (gap / 2 + tw / 2), ct = tt - 4 * u;
      cath += `M${F(x - tw / 2)} ${F(eave + 1)}V${F(tt)}H${F(x + tw / 2)}V${F(eave + 1)}Z`;
      cath += `M${F(x - tw * 0.62)} ${F(tt + 1)}H${F(x + tw * 0.62)}V${F(ct)}H${F(x - tw * 0.62)}Z`;
      domes += `M${F(x - tw * 0.48)} ${F(ct)}A${F(tw * 0.48)} ${F(tw * 0.62)} 0 0 1 ${F(x + tw * 0.48)} ${F(ct)}Z`;
      domes += `M${F(x - tw * 0.1)} ${F(ct - tw * 0.58)}V${F(ct - tw * 1.05)}H${F(x + tw * 0.1)}V${F(ct - tw * 0.58)}Z`;
      belfry += `M${F(x - tw * 0.2)} ${F(tt + 26 * u)}V${F(tt + 12 * u)}a${F(tw * 0.2)} ${F(tw * 0.2)} 0 0 1 ${F(tw * 0.4)} 0V${F(tt + 26 * u)}Z`;
      cc += `M${F(x - tw / 2)} ${F(tt + 32 * u)}h${F(tw)}M${F(x - tw / 2)} ${F(eave - 14 * u)}h${F(tw)}`;
    }
    belfry += `M${F(cx - 3 * u)} ${F(foot - 8 * u)}V${F(eave + 6 * u)}a${F(3 * u)} ${F(3 * u)} 0 0 1 ${F(6 * u)} 0V${F(foot - 8 * u)}Z`;
    s += `<g class="isl-vwin isl-vlast" style="--i:5"><ellipse cx="${F(cx)}" cy="${F(foot - 40 * u)}" rx="${F(70 * u)}" ry="${F(62 * u)}" fill="url(#islvwarm)"/></g>`;
    s += `<path class="isl-vcath" d="${cath}"/><path class="isl-vship2" d="${domes}"/><path class="isl-vcourse" d="${cc}" stroke-width=".8"/>`;
    s += `<path class="isl-vcathwin isl-vwin isl-vlast" style="--i:5" d="${belfry}"/>`;
    // 3. The town, from the cathedral's hill down to the quay: houses of different sizes, walls and
    //    roofs, gabled and hipped, trees between them, windows lit, the nearer the larger; drawn far to
    //    near so the nearer overlap. Kept apart so the harbour can mirror it.
    const items = [];
    for (let i = 0; i < 200; i++) {
      const x = X(-0.03 + r() * 1.05), t0 = at(town, x) + Y(0.018), y = t0 + (y0 - Y(0.014) - t0) * Math.pow(r(), 0.7);
      if (Math.abs(x - cx) < gap / 2 + tw * 1.7 && y < foot + Y(0.035)) continue;
      items.push([y, x, r() < 0.22]);
    }
    items.sort((a, b) => a[0] - b[0]);
    let tn = '';
    for (const [y, x, tree] of items) {
      const near = clamp((y - Y(0.36)) / (y0 - Y(0.36)), 0, 1), k = u * (0.6 + near * 0.75);
      if (tree) { tn += shrubs([[x, y, 8 * k]], r); continue; }
      const w = (12 + r() * 14) * k, h = (8 + r() * 6) * k, pitch = (4 + r() * 4) * k;
      const wall = ['isl-vtown', 'isl-vwall', 'isl-vstone'][Math.floor(r() * 3)];
      const roof = r() < 0.4 ? 'isl-vroof' : r() < 0.5 ? 'isl-vroof2' : 'isl-vriser';
      tn += `<path class="${wall}" d="M${F(x)} ${F(y)}v${F(-h)}h${F(w)}v${F(h)}Z"/>`;
      tn += `<path class="${roof}" d="M${F(x - k)} ${F(y - h + 0.5)}`
        + (r() < 0.5 ? `L${F(x + w * 0.25)} ${F(y - h - pitch)}H${F(x + w * 0.75)}` : `L${F(x + w / 2)} ${F(y - h - pitch * 1.1)}`) + `L${F(x + w + k)} ${F(y - h + 0.5)}Z"/>`;
      let lit = '', dark = '';
      const nw = w > 18 * k ? 2 : 1;
      for (let j = 0; j < nw; j++) {
        const wx = x + w * (nw === 1 ? 0.38 : 0.2 + j * 0.44), d = `M${F(wx)} ${F(y - h * 0.78)}h${F(3.2 * k)}v${F(h * 0.42)}h${F(-3.2 * k)}Z`;
        if (r() < 0.55) lit += d; else dark += d;
      }
      if (dark) tn += `<path class="isl-vdark" d="${dark}"/>`;
      if (lit) tn += `<path class="f-pulse isl-vwin" style="--i:3" d="${lit}"/>`;
    }
    s += tn;
    // the quay's stone edge, its lamps with their halos, and mist lying along it
    const qe = `M${F(X(-0.02))} ${F(y0 - Y(0.012))}H${F(X(1.02))}V${F(y0 + 1)}H${F(X(-0.02))}Z`;
    s += `<path class="isl-vstone" d="${qe}"/><path class="isl-vpshade" d="${qe}"/>`;
    for (let i = 0; i < 15; i++) quayL.push([X(0.03 + i * 0.067 + r() * 0.02), y0 - Y(0.022)]);
    s += `<g class="isl-vwin" style="--i:1">${quayL.map(([x, y]) => halo(x, y, 9 * u)).join('')}</g>`;
    s += `<path class="s-vlight isl-vwin" style="--i:1" d="${lightsD(quayL)}" stroke-width="${F(Math.max(1.6, 2 * u))}"/>`;
    // 4. The water: ripples dense toward the quay, the town mirrored faintly, mist, and a broken
    //    column of light under each quay lamp.
    s += dashes(hatchList(W, y0, H, r), 's-vrip', 1, [0.1, 0.18, 0.28]);
    s += mirrored(y0, tn, 0.14) + mist(X(-0.05), y0 + Y(0.01), X(1.1), Y(0.05), 0.4);
    for (const [x] of quayL) s += dashes(streakList(x, y0, H, r, 0.04, 0.05), 's-vglow', 1, [0.08, 0.16, 0.3]);
    // 5. Two cruise ships at the quay, broadside, bow to the right: a white hull with a dark boot-top
    //    at the waterline and its sheer rising to the raked bow, lifeboats slung along the side, decks
    //    stepping back in rows of lit cabins, portholes along the hull, a funnel aft with its dark cap,
    //    a masthead light; each with its reflection and columns of light under it.
    const ship = (x0, x1, wl, cls, i) => {
      const L = x1 - x0, hh = L * 0.085, dh = L * 0.03, decks = 5, cabins = [], ports = [];
      const hull = `M${F(x0 + L * 0.03)} ${F(wl)}H${F(x1 - L * 0.07)}L${F(x1)} ${F(wl - hh * 1.18)}L${F(x0 + L * 0.02)} ${F(wl - hh * 0.98)}Q${F(x0 - L * 0.012)} ${F(wl - hh * 0.9)} ${F(x0 + L * 0.03)} ${F(wl)}Z`;
      const boot = `M${F(x0 + L * 0.03)} ${F(wl)}H${F(x1 - L * 0.07)}L${F(x1 - L * 0.062)} ${F(wl - hh * 0.24)}H${F(x0 + L * 0.018)}Z`;
      let sup = '', rails = '', boats = '';
      for (let d = 0; d < decks; d++) {
        const yb = wl - hh * 1.02 - d * dh, yt = yb - dh, a = x0 + L * (0.04 + d * 0.014), b = x1 - L * (0.15 + d * 0.05);
        sup += `M${F(a)} ${F(yb + 1)}V${F(yt)}H${F(b)}L${F(b + dh * 1.3)} ${F(yb + 1)}Z`;
        rails += `M${F(a)} ${F(yt + 0.5)}H${F(b + dh * 0.25)}`;
        for (let x = a + L * 0.012; x < b; x += L * 0.011) if (r() < 0.8) cabins.push([x, yb - dh * 0.5]);
      }
      for (let x = x0 + L * 0.1; x < x1 - L * 0.3; x += L * 0.05) {
        const by = wl - hh * 1.02 + dh * 0.05, bl = L * 0.034;
        boats += `M${F(x)} ${F(by)}h${F(bl)}q${F(-bl * 0.1)} ${F(dh * 0.62)} ${F(-bl * 0.25)} ${F(dh * 0.62)}h${F(-bl * 0.5)}q${F(-bl * 0.15)} 0 ${F(-bl * 0.25)} ${F(-dh * 0.62)}Z`;
      }
      for (let x = x0 + L * 0.06; x < x1 - L * 0.12; x += L * 0.018) ports.push([x, wl - hh * 0.5]);
      const deckTop = wl - hh * 1.02 - decks * dh, fx = x0 + L * 0.2;
      const funnel = `M${F(fx)} ${F(deckTop + 1)}L${F(fx + L * 0.012)} ${F(deckTop - dh * 1.5)}H${F(fx + L * 0.078)}L${F(fx + L * 0.085)} ${F(deckTop + 1)}Z`;
      const cap = `M${F(fx + L * 0.012)} ${F(deckTop - dh * 1.5)}H${F(fx + L * 0.078)}L${F(fx + L * 0.08)} ${F(deckTop - dh * 1.05)}H${F(fx + L * 0.01)}Z`;
      const mx = x1 - L * 0.3, mast = `M${F(mx)} ${F(deckTop + 1)}V${F(deckTop - dh * 2.6)}`;
      const one = `<path class="${cls}" d="${hull}${sup}${funnel}"/><path class="isl-vhullband" d="${boot}${cap}"/>`
        + `<path class="isl-vdeck" d="${rails}" stroke-width=".8"/><path class="isl-vspin2" d="${boats}"/><path class="isl-vmast" d="${mast}" stroke-width="1"/>`;
      let o = `<g clip-path="url(#islsea)" opacity=".15"><g transform="translate(0 ${F(2 * wl)}) scale(1 -1)">${one}</g></g>`;
      for (let x = x0 + L * 0.08; x < x1 - L * 0.1; x += L * 0.07) o += dashes(streakList(x + (r() - 0.5) * L * 0.03, wl + 1, H, r, 0.05, 0.06), 's-vglow', 1, [0.06, 0.12, 0.24]);
      o += one;
      o += `<g class="isl-vwin" style="--i:${i}">${halo(mx, deckTop - dh * 2.6, 8 * u)}<circle class="isl-vnav-w" cx="${F(mx)}" cy="${F(deckTop - dh * 2.6)}" r="${F(Math.max(1.2, 1.4 * u))}"/></g>`;
      o += `<path class="s-vlight isl-vwin" style="--i:${i}" d="${lightsD(cabins)}" stroke-width="${F(Math.max(1.2, 1.5 * u))}"/>`;
      o += `<path class="s-vlight isl-vwin" style="--i:${i}" d="${lightsD(ports)}" stroke-width="${F(Math.max(1, 1.2 * u))}" stroke-opacity=".7"/>`;
      return o;
    };
    s += ship(X(0.6), X(0.94), y0 + Y(0.035), 'isl-vship2', 2);
    s += ship(X(0.28), X(0.7), y0 + Y(0.12), 'isl-vship', 2);
    // a launch crossing toward the quay, its riding light and its column of light
    const lx0 = X(0.82), ly0 = Y(0.9), ll = 40 * u;
    s += dashes(streakList(lx0 + ll * 0.3, ly0 + 1, H, r, 0.05, 0.08), 's-vglow', 1, [0.1, 0.2, 0.34]);
    const launch = `<path class="isl-vhull" d="M${F(lx0)} ${F(ly0 - 5 * u)}H${F(lx0 + ll)}L${F(lx0 + ll * 0.88)} ${F(ly0)}H${F(lx0 + ll * 0.06)}Z"/>`
      + `<path class="isl-vship2" d="M${F(lx0 + ll * 0.2)} ${F(ly0 - 5 * u)}V${F(ly0 - 11 * u)}H${F(lx0 + ll * 0.55)}L${F(lx0 + ll * 0.62)} ${F(ly0 - 5 * u)}Z"/>`;
    s += `<g opacity=".15"><g transform="translate(0 ${F(2 * ly0)}) scale(1 -1)">${launch}</g></g>` + launch;
    s += `<g class="isl-vwin" style="--i:1">${halo(lx0 + ll * 0.35, ly0 - 15 * u, 10 * u)}<circle class="f-pulse" cx="${F(lx0 + ll * 0.35)}" cy="${F(ly0 - 15 * u)}" r="${F(Math.max(1.2, 1.5 * u))}"/></g>`;
    s += `<path class="isl-vmast" d="M${F(lx0 + ll * 0.35)} ${F(ly0 - 11 * u)}V${F(ly0 - 14 * u)}" stroke-width="1"/>`;
    // 6. Fort James in front: its low stone parapet with an embrasure and its coping, the rampart's
    //    outer wall dropping into the water at its end, the floor in front, the fort's lamp's halo and
    //    pool, and the cannon on its carriage on the floor, its barrel laid through the embrasure.
    const pTop = Y(0.845), pFoot = Y(0.905), px1 = X(0.42), eX = X(0.2), eW = 22 * u, eD = 10 * u;
    const par = [[X(-0.02), pTop], [eX - eW, pTop], [eX - eW * 0.6, pTop + eD], [eX + eW * 0.6, pTop + eD], [eX + eW, pTop], [px1, pTop], [px1, pFoot], [X(-0.02), pFoot]];
    const outer = [[px1, pTop], [px1 + 12 * u, pTop + 4 * u], [px1 + X(0.05), H + 2], [px1, H + 2]];
    s += `<g class="isl-vwin" style="--i:0">${halo(X(0.035), pTop - 22 * u, 40 * u, 'islvlamp')}</g>`;
    s += `<path d="${polyD(outer)}" fill="url(#islvfacade)"/>`;
    s += `<path d="${polyD(par)}" fill="url(#islvfacade)"/><path class="isl-vpshade" d="${polyD(par)}"/><path class="isl-vpshade" d="${polyD(par)}"/>`;
    s += `<path d="${lineD(par.slice(0, 6))}" stroke-width="${F(Math.max(1.5, 3 * u))}" fill="none" style="stroke:var(--isl-vstone)"/>`;
    let pj = '';
    for (let y = pTop + 13 * u; y < pFoot - 2; y += 11 * u) pj += `M${F(X(-0.02))} ${F(y)}H${F(px1)}`;
    for (let y = pTop + 16 * u; y < H; y += 12 * u) pj += `M${F(px1 + 1)} ${F(y)}L${F(px1 + 12 * u + (y - pTop) * (X(0.05) - 12 * u) / (H - pTop))} ${F(y)}`;
    s += `<path class="isl-vcourse" d="${pj}" stroke-width=".7"/>`;
    s += `<path class="f-near isl-land" d="${polyD([[X(-0.02), pFoot], [px1, pFoot], [px1, H + 2], [X(-0.02), H + 2]])}"/>`;
    s += `<g class="isl-vwin" style="--i:0">${pool(X(0.07), pFoot + 12 * u, 80 * u, 16 * u, 0.8)}</g>`;
    // the cannon: barrel tapering from breech to muzzle, its top edge catching the light; carriage and
    // wheels on the floor
    const bl = 70 * u, br = 8 * u, gx = eX - bl * 0.5, gy = pTop + eD - br * 0.2;
    s += `<g transform="rotate(-5 ${F(gx)} ${F(gy)})"><path class="isl-vcannon" d="M${F(gx - bl * 0.32)} ${F(gy - br * 1.05)}L${F(gx + bl * 0.68)} ${F(gy - br * 0.72)}V${F(gy - br * 0.18)}L${F(gx - bl * 0.32)} ${F(gy + br * 0.05)}Z`
      + `M${F(gx - bl * 0.32)} ${F(gy - br * 0.5)}m${F(-br * 0.55)} 0a${F(br * 0.55)} ${F(br * 0.55)} 0 1 0 ${F(br * 1.1)} 0a${F(br * 0.55)} ${F(br * 0.55)} 0 1 0 ${F(-br * 1.1)} 0Z"/>`
      + `<path class="isl-vlit" d="M${F(gx - bl * 0.3)} ${F(gy - br * 1.02)}L${F(gx + bl * 0.66)} ${F(gy - br * 0.7)}v${F(br * 0.2)}L${F(gx - bl * 0.3)} ${F(gy - br * 0.78)}Z"/></g>`;
    const wy = pFoot + 4 * u, wr = br * 1.25;
    s += `<path class="isl-vcannon" d="M${F(gx - bl * 0.34)} ${F(wy)}L${F(gx - bl * 0.2)} ${F(gy - br * 0.1)}H${F(gx + bl * 0.14)}L${F(gx + bl * 0.24)} ${F(wy)}Z"/>`;
    for (const wx of [-0.22, 0.16]) s += `<circle class="isl-vcannon" cx="${F(gx + bl * wx)}" cy="${F(wy)}" r="${F(wr)}"/><circle class="isl-vlit" cx="${F(gx + bl * wx)}" cy="${F(wy)}" r="${F(wr * 0.35)}"/>`;
    // the fort's lamp on its post at the parapet's end
    const flx = X(0.035), fly = pTop;
    s += `<path class="isl-vpost" d="M${F(flx - 1.2)} ${F(fly)}V${F(fly - 16 * u)}H${F(flx + 1.2)}V${F(fly)}ZM${F(flx - 7 * u)} ${F(fly - 30 * u)}L${F(flx)} ${F(fly - 36 * u)}L${F(flx + 7 * u)} ${F(fly - 30 * u)}Z"/>`;
    s += `<path class="isl-vlamp isl-vwin" style="--i:0" d="M${F(flx - 4.5 * u)} ${F(fly - 16 * u)}V${F(fly - 30 * u)}H${F(flx + 4.5 * u)}V${F(fly - 16 * u)}Z"/>`;
    // The hills' lights, with the town's.
    s += `<path class="s-vlight isl-vwin" style="--i:4" d="${lightsD(far)}" stroke-width="1.2"/>`;
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
    'telescope': {
      draw: telescope,
      world: 'inland',
      horizon: 0.62,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 30),
      moonBig: 2.4,
      moonX: 0.32,
      ground: null,
    },
    'bettys-hope': {
      draw: bettysHope,
      world: 'inland',
      horizon: 0.64,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 30),
      moonBig: 2.2,
      moonX: 0.3,
      ground: null,
    },
    'court-house': {
      draw: courtHouse,
      world: 'inland',
      horizon: 0.62,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 30),
      moonBig: 2.4,
      moonX: 0.16,
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
      // The horizon is the quay, so the town is mirrored in the harbour; the view turns to put the
      // Moon over the hills, left of the cathedral.
      horizon: 0.6,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 30),
      moonBig: 2.4,
      moonX: 0.24,
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
      // The Moon's true place is above this short sky, so it is set in the open sky over the afterglow
      // (owner, 2026-09-28: "Feel free to add the moon to the image on the student page").
      moonAt: [0.2, 0.11],
      ground: null,
    },
  };

  // Vegetated land by Day: a mottle of darker and lighter scrub and a few bare patches over the land's
  // own color, finer and fainter with distance. Pieces mark vegetated land with `isl-land`; the Day
  // version fills it with these (layout-art.css); every other version keeps the flat color.
  function vegPattern(id, size, n, r0, r1, alpha, seed) {
    const r = rng(seed);
    const blobs = (cls, count, s0, s1) => {
      let d = '';
      for (let i = 0; i < count; i++) {
        const x = r() * size, y = r() * size, rx = s0 + r() * (s1 - s0), ry = rx * (0.55 + r() * 0.3);
        for (const [ox, oy] of [[0, 0], [size, 0], [-size, 0], [0, size], [0, -size]]) {
          if (x + ox + rx < 0 || x + ox - rx > size || y + oy + ry < 0 || y + oy - ry > size) continue;
          d += `M${F(x + ox - rx)} ${F(y + oy)}a${F(rx)} ${F(ry)} 0 1 0 ${F(2 * rx)} 0a${F(rx)} ${F(ry)} 0 1 0 ${F(-2 * rx)} 0Z`;
        }
      }
      return `<path class="${cls}" d="${d}" fill-opacity="${alpha}"/>`;
    };
    return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">`
      + `<rect class="isl-veg-b" width="${size}" height="${size}"/>`
      + blobs('isl-veg-d', n, r0, r1) + blobs('isl-veg-l', Math.round(n * 0.75), r0, r1) + blobs('isl-veg-t', Math.round(n * 0.06), r0 * 1.2, r1 * 1.5)
      + '</pattern>';
  }

  A.pieces = PIECES;   // read by review tools (which way each picture looks, how much sky it holds)

  function extraDefs() {
    return '<defs>'
      + vegPattern('islvegf', 53, 70, 0.45, 1.2, 0.24, 5) + vegPattern('islvegn', 131, 170, 0.7, 2.6, 0.32, 7)
      + '<radialGradient id="islvwarm"><stop offset="0" class="st-g1" stop-opacity=".26"/><stop offset=".6" class="st-g1" stop-opacity=".08"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvspill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-g1" stop-opacity=".2"/><stop offset="1" class="st-g1" stop-opacity="0"/></linearGradient>'
      + '<radialGradient id="islvlamp"><stop offset="0" class="st-k" stop-opacity=".6"/><stop offset=".5" class="st-k" stop-opacity=".18"/><stop offset="1" class="st-k" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvrefl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-g1" stop-opacity=".55"/><stop offset="1" class="st-g1" stop-opacity="0"/></linearGradient>'
      + '<linearGradient id="islvhol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-vhol" stop-opacity=".78"/><stop offset=".6" class="st-vhol" stop-opacity=".5"/><stop offset="1" class="st-vhol" stop-opacity=".32"/></linearGradient>'
      + '<radialGradient id="islvmist"><stop offset="0" class="st-haze" stop-opacity=".5"/><stop offset=".6" class="st-haze" stop-opacity=".16"/><stop offset="1" class="st-haze" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="islvpool"><stop offset="0" class="st-g1" stop-opacity=".55"/><stop offset=".5" class="st-g1" stop-opacity=".18"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvsailg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="st-vsail" stop-opacity="1"/><stop offset="1" class="st-vsail2" stop-opacity="1"/></linearGradient>'
      + '<linearGradient id="islvbrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-vbrass" stop-opacity="1"/><stop offset=".5" class="st-vbrass2" stop-opacity="1"/><stop offset="1" class="st-vbrass3" stop-opacity="1"/></linearGradient>'
      + '<linearGradient id="islvbay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-vbay" stop-opacity=".55"/><stop offset="1" class="st-vbay" stop-opacity=".35"/></linearGradient>'
      + '<linearGradient id="islvharb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-sea0" stop-opacity="0"/><stop offset=".45" class="st-sea0" stop-opacity=".5"/><stop offset="1" class="st-sea0" stop-opacity=".3"/></linearGradient>'
      + '<linearGradient id="islvfacade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-vstrata" stop-opacity="1"/><stop offset="1" class="st-vstone" stop-opacity="1"/></linearGradient>'
      + '<linearGradient id="islvcloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-cloud" stop-opacity="1"/><stop offset=".55" class="st-cloud" stop-opacity="1"/><stop offset="1" class="st-cloud-s" stop-opacity="1"/></linearGradient>'
      + '<linearGradient id="islvgild" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-gild" stop-opacity=".6"/><stop offset=".55" class="st-gild" stop-opacity="0"/></linearGradient>'
      + '<radialGradient id="islvsun"><stop offset="0" stop-color="#fffdf0" stop-opacity=".95"/><stop offset=".1" stop-color="#fff8dc" stop-opacity=".6"/><stop offset=".4" stop-color="#ffffff" stop-opacity=".14"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="islvsundisc"><stop offset="0" stop-color="#fffbea"/><stop offset=".55" stop-color="#ffe29a"/><stop offset=".85" stop-color="#ffab52"/><stop offset="1" stop-color="#ff8a3d"/></radialGradient>'
      + '<radialGradient id="islvsunlow"><stop offset="0" stop-color="#ffd08a" stop-opacity=".85"/><stop offset=".12" stop-color="#ffb066" stop-opacity=".45"/><stop offset=".45" stop-color="#ff9a5a" stop-opacity=".14"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="islvdawn"><stop offset="0" class="st-g1" stop-opacity=".9"/><stop offset=".45" class="st-g2" stop-opacity=".35"/><stop offset="1" class="st-g2" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="islvbulb"><stop offset="0" class="st-g1" stop-opacity=".5"/><stop offset=".5" class="st-g1" stop-opacity=".14"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '</defs>';
  }

  /* THE FOUR TIMES OF DAY (owner, 2026-09-28): every picture has Dawn, Day and Dusk in the light scheme,
     the visitor's local time choosing among them (the card's data-sky), and Night in the dark scheme. The
     versions differ in light, not in drawing: the sky, sea, land and material colors are each version's
     tokens (layout-art.css); lights are on at Dawn, Dusk and Night and off by Day; stars, grain and the
     Moon belong to Dusk and Night. What only Dawn and Day draw is here: the glow where the Sun is about
     to rise, when the view faces it, and trade-wind cumulus, the same clouds at both, lit pink at Dawn and
     white by Day. */
  function clouds(W, y0, seed) {
    const r = rng(seed);
    let d = '', defs = '';
    const n = Math.round(clamp(W / 55, 8, 22));
    for (let i = 0; i < n; i++) {
      const t = Math.pow(r(), 1.8);                  // most clouds far off, low toward the horizon
      const base = y0 * (0.94 - t * 0.5);            // the flat base's height: never near the top edge
      const k = 0.3 + t * 0.8;                       // higher clouds are nearer, so larger
      const w = W * (0.035 + r() * 0.05) * k, h = w * (0.2 + r() * 0.14);
      const cx = r() * (W + w) - w / 2;
      const puffs = 5 + Math.floor(r() * 5);
      let c = '';
      for (let j = 0; j < puffs; j++) {
        const u = (j + 0.5) / puffs + (r() - 0.5) * 0.08, px = cx - w / 2 + u * w;
        const pr = h * (0.28 + Math.sin(clamp(u, 0, 1) * Math.PI) * 0.55) * (0.75 + r() * 0.5), py = base - pr * (0.55 + r() * 0.3);
        c += `M${F(px - pr)} ${F(py)}a${F(pr)} ${F(pr)} 0 1 0 ${F(2 * pr)} 0a${F(pr)} ${F(pr)} 0 1 0 ${F(-2 * pr)} 0Z`;
      }
      // the flat base: the puffs are cut at the level where the air condenses
      defs += `<clipPath id="islvcb${i}"><rect x="${F(cx - w)}" y="${F(base - h * 3)}" width="${F(w * 2)}" height="${F(h * 3)}"/></clipPath>`;
      d += `<path d="${c}" fill="url(#islvcloud)" clip-path="url(#islvcb${i})" opacity="${F(0.45 + t * 0.45)}"/>`;
    }
    return `<defs>${defs}</defs>${d}`;
  }
  // Dawn's clouds are its own: long, low bands of stratocumulus, their tops catching the light first.
  function bands(W, y0, seed) {
    const r = rng(seed);
    let d = '';
    const n = Math.round(clamp(W / 110, 5, 10));
    for (let i = 0; i < n; i++) {
      const t = Math.pow(r(), 1.3), y = y0 * (0.9 - t * 0.5);
      const w = W * (0.1 + r() * 0.2) * (0.5 + t), h = Math.max(1.6, y0 * (0.01 + r() * 0.016) * (0.6 + t));
      const x = r() * (W + w) - w / 2, k = 5 + Math.floor(r() * 5);
      let c = '';
      for (let j = 0; j < k; j++) {
        const u = j / (k - 1), cx = x - w / 2 + u * w, rx = (w / k) * (0.9 + r() * 0.8);
        const ry = h * (0.45 + Math.sin(u * Math.PI) * 0.6) * (0.7 + r() * 0.5);
        c += `M${F(cx - rx)} ${F(y)}a${F(rx)} ${F(ry)} 0 1 0 ${F(2 * rx)} 0a${F(rx)} ${F(ry)} 0 1 0 ${F(-2 * rx)} 0Z`;
      }
      d += `<path d="${c}" fill="url(#islvcloud)" opacity="${F(0.5 + t * 0.4)}"/>`;
    }
    return d;
  }
  // The Sun, drawn only where it truly is in view at a version's moment (owner, 2026-09-28: "if the sun
  // would be visible ... please add them"): at the size the Moon is drawn, low and orange at the horizon,
  // its lower edge cut by the horizon, a glow around it and its light laid on the water below. Land and
  // buildings drawn after it cover it where they stand in front.
  function sunDisc(v, m, W, y0, H, P) {
    const [az, alt] = SKY[m].sun, x = v.x(az), y = v.y(alt), rr = 0.267 * 3 * (P.moonBig || 1) * v.ppd;
    if (x < -rr || x > W + rr || y < -rr || y > y0 + rr) return '';
    const r = rng(173);
    return `<circle cx="${F(x)}" cy="${F(y)}" r="${F(rr * 9)}" fill="url(#islvsunlow)" clip-path="url(#islsky)"/>`
      + `<circle cx="${F(x)}" cy="${F(y)}" r="${F(rr)}" fill="url(#islvsundisc)" clip-path="url(#islsky)"/>`
      + dashes(streakList(x, y0, H, r, 0.1, 0.09), 's-vglow', 1.4, [0.14, 0.28, 0.5]);
  }
  function dawnDay(v, W, y0, H, seed = 0) {
    const p = v.ppd, sx = v.x(SKY.a.sun[0]), r = rng(97);
    const glow = sx > -W * 0.3 && sx < W * 1.3
      ? `<ellipse cx="${F(sx)}" cy="${F(y0)}" rx="${F(40 * p)}" ry="${F(8 * p)}" fill="url(#islvdawn)" clip-path="url(#islsky)"/>` : '';
    // FOR COMPARISON (?isl-sun=1), the Sun placed by license: rising on the horizon at Dawn, high in the
    // corner by Day, each with its light on the water.
    const ds = clamp(H * 0.045, 9, 20), dx = W * 0.12;
    const dawnSun = `<g class="isl-sun"><ellipse cx="${F(dx)}" cy="${F(y0)}" rx="${F(ds * 9)}" ry="${F(ds * 3)}" fill="url(#islvdawn)" clip-path="url(#islsky)"/>`
      + `<circle class="isl-vsunrise" cx="${F(dx)}" cy="${F(y0 + ds * 0.35)}" r="${F(ds)}" clip-path="url(#islsky)"/>`
      + dashes(streakList(dx, y0, H, r, 0.1, 0.09), 's-vglow', 1.4, [0.14, 0.28, 0.5]) + '</g>';
    const ys = clamp(H * 0.035, 8, 16), yx = W * 0.1, yy = y0 * 0.3;
    const daySun = `<g class="isl-sun"><circle cx="${F(yx)}" cy="${F(yy)}" r="${F(ys * 10)}" fill="url(#islvsun)" clip-path="url(#islsky)"/>`
      + `<circle class="isl-vsunday" cx="${F(yx)}" cy="${F(yy)}" r="${F(ys)}"/>`
      + dashes(streakList(yx, y0, H, r, 0.12, 0.1), 'isl-sparkle', 1.2, [0.18, 0.3, 0.5]) + '</g>';
    return `<g class="isl-a">${glow}${bands(W, y0, 89 + seed)}${dawnSun}</g><g class="isl-y">${clouds(W, y0, 211 + seed)}${daySun}</g>`;
  }

  function build(W, H, piece) {
    const P = PIECES[piece];
    if (!P || W < 200 || H < 100) return '';   // a head fitted to short text can be under 200px
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
    // The Moon and Venus, in each scheme. A piece whose sky is too short for the Moon's true place may
    // put it at `moonAt` ([x, y], shares of the width and height): the true phase and tilt, the place
    // a painter's licence, Venus keeping its true offset (Shirley Heights; owner, 2026-09-28: "Feel
    // free to add the moon"). The stars leave the Moon's disc clear, as in the hero: its dark side
    // is only faintly opaque, and stars showed through it (owner, the same day).
    const big = P.moonBig || 1, sky = {};
    for (const m of ['d', 'n']) {
      const vm = P.moonAt ? view(W * P.moonAt[0] - rel(SKY[m].moon[0]) * ppd, H * P.moonAt[1] + SKY[m].moon[1] * ppd, ppd, W, H) : v;
      const cls = m === 'd' ? 'isl-d' : 'isl-n', drawn = L.moon(vm, m, [], cls, big), [mx, my, mr] = L.moonBox(vm, m, big);
      sky[m] = {
        moon: drawn,
        planets: L.planets(vm, m, [], cls),
        box: drawn ? [[mx - mr, my - mr, mx + mr, my + mr]] : [],
        hole: drawn ? `<circle cx="${F(mx)}" cy="${F(my)}" r="${F(mr + 1)}" fill="#000"/>` : '',
      };
    }
    // The print grain: on the sky, and fainter on the water, laid before the land so the land covers
    // it (owner, 2026-09-28: over the whole card, "on the land it reads as visual noise"), and before
    // Venus and the Moon, with a hole where each scheme's Moon stands, so neither is speckled. At
    // dusk the grain's dark specks show against the bright sky (owner, 2026-09-28: "reads a little
    // noisy"), so there it fades out toward the afterglow at the horizon; at night it reads as stars.
    const grain = grainURL();
    const gFade = `<linearGradient id="islvgfd" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${F(y0)}"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#777"/><stop offset=".85" stop-color="#000"/></linearGradient>`;
    const gMask = (m) => `<mask id="islvgm${m}"><rect width="${F(W)}" height="${y0 + 1}" fill="${m === 'n' ? '#fff' : 'url(#islvgfd)'}"/>${sky[m] ? sky[m].hole : ''}</mask>`;
    const gDef = grain ? `<defs><pattern id="islvgrain" patternUnits="userSpaceOnUse" width="160" height="160"><image href="${grain}" width="160" height="160"/></pattern>${gFade}${gMask('d')}${gMask('n')}${gMask('a')}</defs>` : '';
    const gSky = grain ? ['d', 'n', 'a'].map((m) => `<g class="isl-${m}"><rect class="isl-vgrain" width="${F(W)}" height="${y0 + 1}" fill="url(#islvgrain)" mask="url(#islvgm${m})"/></g>`).join('') : '';
    const gSea = grain ? `<rect class="isl-vgrain isl-vgrain--sea" y="${y0}" width="${F(W)}" height="${F(sea + 1)}" fill="url(#islvgrain)"/>` : '';
    const svg = `<svg class="isl-o isl-art" width="${F(W)}" height="${F(H)}" viewBox="0 0 ${F(W)} ${F(H)}">${defs(W, y0, H)}${extraDefs()}${gDef}`
      + `<rect width="${F(W)}" height="${y0 + 1}" fill="url(#islskyg)"/>`
      + L.milkyWay(v, 'n', 'isl-n')
      + `<rect y="${F(y0 - 2.4 * ppd)}" width="${F(W)}" height="${F(2.4 * ppd)}" fill="url(#islhazeg)"/>`
      + L.glowSky(v, 'd', 'isl-d') + L.glowSky(v, 'n', 'isl-n')
      + stars(v, 'd', sky.d.box, 'isl-d isl-dstars') + stars(v, 'n', sky.n.box, 'isl-n')
      + gSky
      + sky.d.planets + sky.n.planets
      + sky.d.moon + sky.n.moon
      + dawnDay(v, W, y0, H, piece === 'shirley-heights' ? 0 : [...piece].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7))
      + `<g class="isl-a">${sunDisc(v, 'a', W, y0, H, P)}</g><g class="isl-s">${sunDisc(v, 's', W, y0, H, P)}</g>`
      + (P.world === 'coast' ? islands(v, 'f-isl') : '')
      + `<rect y="${y0}" width="${F(W)}" height="${F(sea + 1)}" fill="url(#islseag)"/>`
      + L.glowSea(v, 'd', 'isl-d', reflH) + L.glowSea(v, 'n', 'isl-n', reflH)
      + gSea
      + `<path class="s-hz" d="M0 ${y0 + 0.5}H${F(W)}" stroke-width="1"/>`
      + ripples(v, 0, W, H, [], 9, 0.8)
      + (P.world === 'coast' ? land(v, 0, W, 13, [['d', 'isl-d', 1], ['n', 'isl-n', 0.6]], P.under !== false) : '')
      + (P.hills ? hills(W, g.at(W / 2), P.hills(W, y0), 31) : '')
      + (g.d ? `<path class="f-near" d="${g.d}"/>` : '')
      + P.draw(W, H, v, g)
      + '</svg>';
    return own(svg, 'v');
  }

  /* Print grain: drawn once into a small tile (a canvas), never animated; build() lays it on the sky
     and, fainter, on the water, under the land. */
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

  // Which light-scheme version a card shows, by the visitor's own clock (owner, 2026-09-28; SPEC section
  // 12): Dawn from 5:00, Day from 9:00, Sunset from 17:00, Dusk from 19:00. ?isl-sky=dawn|day|sunset|dusk
  // forces one, for review. The dark scheme is always Night, whatever this says.
  function pickSky() {
    try {
      const q = new URLSearchParams(location.search).get('isl-sky');
      if (q === 'dawn' || q === 'day' || q === 'dusk' || q === 'sunset') return q;
    } catch (e) { /* no query: the clock decides */ }
    const h = new Date().getHours();
    return h >= 5 && h < 9 ? 'dawn' : h >= 9 && h < 17 ? 'day' : h >= 17 && h < 19 ? 'sunset' : 'dusk';
  }

  A.vignette = function (fig) {
    if (fig._isl) return;
    const card = document.createElement('div');
    card.className = 'isl isl-vig';
    card.dataset.sky = pickSky();
    try { if (new URLSearchParams(location.search).get('isl-sun') === '1') card.dataset.sun = '1'; } catch (e) { /* no query */ }
    fig.appendChild(card);
    fig._isl = card;
    let last = '', started = false;
    const paint = () => {
      // As tall as the window allows below the sticky offset of the leaf's side (5.5rem,
      // layout-width.css), and never much taller than it is wide.
      const W = Math.floor(fig.clientWidth);
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 20;
      // A slot with an aspect (a wide head slot) takes its own shape; one set to fit the text is
      // exactly as tall as the text beside it, so nothing on the page moves.
      const aspect = parseFloat(fig.dataset.aspect);
      const text = fig.dataset.fit === 'text' ? fig.parentElement.querySelector(':scope > .isl-head__text, :scope > .isl-stack__text') : null;
      const H = text ? Math.floor(Math.max(120, text.getBoundingClientRect().height))
        : aspect ? Math.floor(clamp(W * aspect, 180, 700))
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
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(paint, 150); });
      ro.observe(fig);
      const text = fig.dataset.fit === 'text' && fig.parentElement.querySelector(':scope > .isl-head__text, :scope > .isl-stack__text');
      if (text) ro.observe(text);
    }
  };
})();
