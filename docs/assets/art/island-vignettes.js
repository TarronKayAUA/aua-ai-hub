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
  function palm(x, y, h, lean, seed, part) {
    const r = rng(seed);
    const tx = x + lean * h, ty = y - h;
    const w0 = h * 0.035, w1 = h * 0.022;
    let d = `M${F(x - w0)} ${F(y)}Q${F(x + lean * h * 0.35 - w0)} ${F(y - h * 0.55)} ${F(tx - w1)} ${F(ty)}`
      + `L${F(tx + w1)} ${F(ty)}Q${F(x + lean * h * 0.35 + w0)} ${F(y - h * 0.55)} ${F(x + w0)} ${F(y)}Z`;
    if (part === 'trunk') return d;
    if (part === 'fronds') d = '';
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

  // Palms as two paths in one class, trunks and fronds: one silhouette at night, and by Day brown trunks
  // under green fronds (owner, 2026-09-28: "the trunks of the trees should be brown to make them look
  // like palm trees").
  const palmsD = (list, cls) => `<path class="${cls} isl-ptrunk" d="${list.map((a) => palm(...a, 'trunk')).join('')}"/>`
    + `<path class="${cls}" d="${list.map((a) => palm(...a, 'fronds')).join('')}"/>`;

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
       at night) under a red pyramid roof, and its clock showing the time in Antigua;
     - the entrance portico at its foot, an arch under a small red gable, two tall palms either side;
     - three-storey blocks either side with red hipped roofs and a terracotta ground floor;
     - long two-storey outer wings, red hipped roofs, arched ground floor, a veranda above;
     - the drive's lawn in front, with lamp posts, one of them in the page's hue;
     - the sea behind (the north coast) and green hills to the east.
     Lights come on from the tower outward, wing by wing, in the one pass. */
  function campus(W, H, v, g, opt = {}) {
    const fw = W * (opt.fw || 1.1), cx = W * 0.5, base = g.at(cx) + 1, u = fw / 100;
    const r = rng(41);
    let walls = '', shade = '', band = '', roofs = '', dark = '', lit = '', rails = '', eaves = '', tiles = '';
    const litGroups = [];                     // [group, path] so the lights can come on in turn
    const win = (group, d, on) => { if (on) litGroups.push([group, d]); else dark += d; };

    // A hipped block from x0 to x1: walls to wallTop, roof rising roofH, hips inset by hip.
    const block = (x0, x1, wallTop, roofH, hip, over) => {
      walls += rect(x0, wallTop, x1 - x0, base - wallTop);
      roofs += `M${F(x0 - over)} ${F(wallTop + 0.5)}L${F(x0 + hip)} ${F(wallTop - roofH)}H${F(x1 - hip)}L${F(x1 + over)} ${F(wallTop + 0.5)}Z`;
      // Seen straight on, a hipped roof shows only its front slope (its hips are edge-on), so it is one plane,
      // as the tower's is; courses of tiles and the shadow under the eave give it depth (owner, 2026-09-30).
      eaves += rect(x0, wallTop, x1 - x0, 0.7 * u);
      for (const t of [0.34, 0.68]) {
        const a = (x0 - over) + (hip + over) * t, b = (x1 + over) - (hip + over) * t, y = wallTop + 0.5 - (roofH + 0.5) * t;
        tiles += rect(a, y - 0.11 * u, b - a, 0.22 * u);
      }
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
        const up = r() < 0.62, down = r() < 0.28;   // (drawn either way, so the other windows keep their lights)
        if (Math.abs(x - cx) < 25.1 * u) continue;   // hidden behind the inner block, which stands in front
        win(grp, rect(x - 0.55 * u, oTop + 1.2 * u, 1.1 * u, 1.9 * u), up);
        win(grp, arch(x, oTop + 4.9 * u, 1.3 * u, base - 0.3 * u), down);
      }
    }
    // The outer wings stand behind the inner blocks, as on the campus: their walls, roofs and rails are
    // drawn first (they had crossed the inner blocks' ends).
    const back = { walls, roofs, rails, eaves, tiles };
    walls = roofs = rails = eaves = tiles = '';
    // Inner blocks: three storeys, hipped roofs; terracotta ground floor with arched openings.
    const iTop = base - 13.6 * u;
    for (const s of [-1, 1]) {
      const a = cx + s * 6.8 * u, b = cx + s * 24.5 * u, x0 = Math.min(a, b), x1 = Math.max(a, b);
      block(x0, x1, iTop, 5.6 * u, 4.4 * u, 1 * u);
      band += rect(x0, base - 4.3 * u, x1 - x0, 4.3 * u);
      // the red pent roof across the block between its upper floors, as on the campus (in place of a rail)
      roofs += `M${F(x0 - 0.6 * u)} ${F(iTop + 4.5 * u)}L${F(x0 + 0.2 * u)} ${F(iTop + 3.3 * u)}H${F(x1 - 0.2 * u)}L${F(x1 + 0.6 * u)} ${F(iTop + 4.5 * u)}Z`;
      rails += `M${F(x0 + 0.8 * u)} ${F(iTop + 7.6 * u)}H${F(x1 - 0.8 * u)}`;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const x = x0 + (i + 0.5) * (x1 - x0) / n, grp = 1 + Math.round(Math.abs(x - cx) / (6 * u));
        win(grp, rect(x - 0.6 * u, iTop + 1.1 * u, 1.2 * u, 1.8 * u), r() < 0.72);
        win(grp, rect(x - 0.6 * u, iTop + 5.2 * u, 1.2 * u, 1.8 * u), r() < 0.72);
        win(grp, arch(x, base - 3.5 * u, 1.3 * u, base - 0.3 * u), r() < 0.45);
      }
    }
    // The tower: shaft, the open lookout, cornice, a low hipped roof with its cresting; the clock. Seen straight on, so no side of
    // it shows: no shaded strip down the shaft and no darker half to the roof, which had read as a turned
    // tower under a straight-on lookout, cornice and clock (owner, 2026-09-30: "it looks subtly off").
    const tw = 9 * u, tx0 = cx - tw / 2, shaftTop = base - 30 * u, lookH = 4.4 * u;
    walls += rect(tx0, shaftTop, tw, base - shaftTop);
    walls += rect(tx0 - 0.6 * u, shaftTop - lookH - 0.9 * u, tw + 1.2 * u, 0.9 * u);      // cornice
    // (its roof as every photograph shows it: low and hipped, a white cresting along the ridge, where a
    // tall pyramid had stood; owner, 2026-09-30)
    const te = shaftTop - lookH - 0.8 * u;
    roofs += `M${F(tx0 - 1.4 * u)} ${F(te)}L${F(tx0 + 1.8 * u)} ${F(te - 2.1 * u)}H${F(tx0 + tw - 1.8 * u)}L${F(tx0 + tw + 1.4 * u)} ${F(te)}Z`;
    for (const f of [0.34, 0.68]) {
      const a = tx0 - 1.4 * u + 3.2 * u * f, b = tx0 + tw + 1.4 * u - 3.2 * u * f;
      tiles += rect(a, te - 2.1 * u * f - 0.11 * u, b - a, 0.22 * u);
    }
    let posts = rect(tx0 + 1.8 * u, te - 2.55 * u, tw - 3.6 * u, 0.5 * u);
    for (let i = 0; i <= 6; i++) posts += rect(tx0 + (i / 6) * (tw - 0.7 * u), shaftTop - lookH, 0.7 * u, lookH);
    // a ledge at the lookout's foot and a low rail across its posts, both in front of its glow
    posts += rect(tx0 - 0.4 * u, shaftTop - 0.25 * u, tw + 0.8 * u, 0.65 * u) + rect(tx0, shaftTop - 1.4 * u, tw, Math.max(1, 0.35 * u));
    const lookout = rect(tx0, shaftTop - lookH, tw, lookH);
    // The clock (owner, 2026-09-30): its face 58% of the shaft's width, as a real tower's is, so it reads
    // at the homepage's size; quarter marks; hour and minute hands keeping Antigua's time (clockAngles(),
    // below), turned each minute by tickClocks().
    const ccy = shaftTop + 6.4 * u, cr = 2.6 * u, [ha, ma] = clockAngles();
    const hand = (cls, deg, len, w) => `<path class="isl-vhand ${cls}" data-c="${F(cx)} ${F(ccy)}" d="M${F(cx)} ${F(ccy + 0.16 * cr)}V${F(ccy - len)}"`
      + ` transform="rotate(${F(deg)} ${F(cx)} ${F(ccy)})" stroke-width="${F(w)}"/>`;
    let marks = '';
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; marks += `M${F(cx + Math.sin(a) * cr * 0.74)} ${F(ccy - Math.cos(a) * cr * 0.74)}L${F(cx + Math.sin(a) * cr * 0.9)} ${F(ccy - Math.cos(a) * cr * 0.9)}`; }
    // (a dark bezel round the face, so it stands out from the tower's pale stone by Day: owner, 2026-09-30)
    const clock = `<circle class="isl-vclock" cx="${F(cx)}" cy="${F(ccy)}" r="${F(cr)}"/>`
      + `<circle class="isl-vbezel" cx="${F(cx)}" cy="${F(ccy)}" r="${F(cr)}" stroke-width="${F(Math.max(1, cr * 0.12))}"/>`
      + `<path class="isl-vmark" d="${marks}" stroke-width="${F(Math.max(0.8, cr * 0.07))}"/>`
      + hand('isl-vhand-h', ha, cr * 0.5, Math.max(1.3, cr * 0.15)) + hand('isl-vhand-m', ma, cr * 0.78, Math.max(1, cr * 0.09))
      + `<circle class="isl-vpin" cx="${F(cx)}" cy="${F(ccy)}" r="${F(Math.max(0.8, cr * 0.09))}"/>`;
    win(0, rect(cx - 1 * u, shaftTop + 11 * u, 2 * u, 3 * u), true);
    // The portico: an arch under a small red gable.
    const pw = 11 * u, pTop = base - 8.6 * u;
    walls += rect(cx - pw / 2, pTop, pw, base - pTop);
    roofs += `M${F(cx - pw / 2 - 0.8 * u)} ${F(pTop + 0.4 * u)}L${F(cx)} ${F(pTop - 2.6 * u)}L${F(cx + pw / 2 + 0.8 * u)} ${F(pTop + 0.4 * u)}Z`;
    const door = arch(cx, pTop + 1.6 * u, 6.4 * u, base);

    let s = '';
    const railW = F(Math.max(1, 0.28 * u));
    // the outer wings, behind: walls, shaded end walls, roofs, eaves, tiles, rails
    s += `<path class="isl-vwall" d="${back.walls}"/><path class="isl-vshade" d="${shade}"/><path class="isl-vroof" d="${back.roofs}"/>`
      + `<path class="isl-vshade" d="${back.eaves}"/><path class="isl-vroof2" d="${back.tiles}"/><path class="isl-vrail" d="${back.rails}" stroke-width="${railW}"/>`;
    // the set-back wall joining the tower to the inner blocks, in shade (the sea had shown between them)
    s += `<path class="isl-vshade" d="${rect(cx - 6.9 * u, iTop + 0.5 * u, 13.8 * u, base - iTop - 0.5 * u)}"/>`;
    s += `<path class="isl-vwall" d="${walls}"/>`;
    s += `<path class="isl-vband" d="${band}"/>`;
    s += `<path class="isl-vroof" d="${roofs}"/>`;
    // the white gablet in the portico's roof, as on the campus
    s += `<path class="isl-vwall" d="${polyD([[cx - 1.7 * u, pTop + 0.15 * u], [cx, pTop - 1.05 * u], [cx + 1.7 * u, pTop + 0.15 * u]])}"/>`
      + `<path class="isl-vroof2" d="${polyD([[cx - 1.15 * u, pTop - 0.05 * u], [cx, pTop - 0.75 * u], [cx + 1.15 * u, pTop - 0.05 * u]])}"/>`;
    s += `<path class="isl-vshade" d="${eaves}"/><path class="isl-vroof2" d="${tiles}"/>`;
    s += `<path class="isl-vrail" d="${rails}" stroke-width="${railW}"/>`;
    s += `<path class="isl-vdark" d="${dark}"/>`;
    // the lookout glows; its posts stand in front of the glow
    s += `<path class="f-pulse isl-vwin" style="--i:0" d="${lookout}"/>`;
    s += `<path class="isl-vwall" d="${posts}"/>`;
    s += clock;
    // the band under the lookout carries the university's name in capitals, its seal beneath (owner, 2026-10-01;
    // at the homepage's size the letters are about two pixels tall, so they read as an inscription, not as words)
    s += `<text class="isl-vdark isl-vinscr" x="${F(cx)}" y="${F(shaftTop + 1.45 * u)}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif"`
      + ` font-size="${F(0.95 * u)}" textLength="${F(tw - 1 * u)}" lengthAdjust="spacingAndGlyphs">AMERICAN UNIVERSITY OF ANTIGUA</text>`
      + `<circle class="isl-vdark" cx="${F(cx)}" cy="${F(shaftTop + 2.55 * u)}" r="${F(0.55 * u)}"/>`;
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
    // People at the entrance by the hour (art-audit pass 4, 2026-10-01; by version): the campus had stood
    // empty in all five versions, so nothing said a medical school was in use. They come and go as the
    // library's readers do: one early arrival with a backpack walks in toward the lit door at Dawn; three
    // stand by the portico by Day, two of them in white coats; two leave to the left at Sunset, one with a
    // white coat over the arm; one late leaver stands in the lit doorway at Dusk; and no one is there at
    // Night, as the library is empty then. Each 2.1u tall (about 11 px at 1920), a person's size beside the
    // three-storey blocks, a shade generous so they still read as people at the hero's scale; standing at the
    // building's foot, clear of the door's middle, the palms' trunks, the flagpoles and the lamps; dimmed with
    // the light by version (isl-bfig), as the bell tower's reader is. Placed by hand, so no draws are taken
    // from r and the approved layout does not move. (The same in the Lecture Outline's campus, which no page
    // shows now.)
    {
      const ph = 2.1 * u, fy = base + 0.45 * u, sw = ph * 0.13, white = '#f2f1ec';
      const at = (dx, dy) => [cx + dx * u, fy + dy * u];
      const P = (dx, dy, o) => person(...at(dx, dy), ph, o);
      // a white coat: person()'s shirt and sleeves in white, and the coat's skirt hanging to the knee over the trousers
      const coat = (dx, dy, o) => {
        const [x, y] = at(dx, dy), ft = y - ph;
        return P(dx, dy, { ...o, shirt: white }) + `<path fill="${white}" d="${polyD([[x - sw * 0.84, ft + ph * 0.5], [x + sw * 0.84, ft + ph * 0.5], [x + sw * 0.96, ft + ph * 0.76], [x - sw * 0.96, ft + ph * 0.76]])}"/>`;
      };
      // Dawn: seen from behind a pace out from the door, a backpack over the shirt
      const [wx, wy] = at(-1.5, 0.5);
      const dawn = P(-1.5, 0.5, { shirt: '#c9b79a', legs: '#2f3a4a', hair: '#2a1d16' })
        + `<path fill="#34405a" d="${rect(wx - sw * 0.72, wy - ph + ph * 0.18, sw * 1.44, ph * 0.29)}"/>`;
      // Day: a student in a pale shirt left of the portico; two in white coats talking right of it
      const day = P(-8, 0, { shirt: '#a9c7de', legs: '#34445e', skin: '#b07a55', hair: '#2a1d16', front: true })
        + coat(7.5, 0.1, { legs: '#3a3f4a', skin: '#6b4630', front: true }) + coat(8.7, 0, { legs: '#4a4f5a', skin: '#c89b78', hair: '#4a3020' });
      // Sunset: two walking out to the left along the front, side by side before one of the left block's lit
      // ground-floor arches (the backlit front is too dark to show them against), the outer one with a white
      // coat over the arm
      const [sx, sy] = at(-21.05, -0.25);
      const sunset = P(-20.4, -0.15, { shirt: '#3d6466', legs: '#2f3a4a', skin: '#8d5a3b', front: true })
        + P(-21.05, -0.25, { shirt: '#7d4a52', legs: '#3a3f4a', skin: '#c89b78', hair: '#1d1916', front: true })
        + `<path fill="${white}" d="${rect(sx - sw * 1.32, sy - ph + ph * 0.4, sw * 0.7, ph * 0.28)}"/>`;
      // Dusk: on the threshold, dark against the lit door
      const dusk = person(cx + 1.1 * u, base, ph, { shirt: '#2b303b', legs: '#1d2129', skin: '#3b2b22', hair: '#121010', front: true });
      s += `<g class="isl-bfig"><g class="isl-lq" data-q="a">${dawn}</g><g class="isl-lq" data-q="y">${day}</g>`
        + `<g class="isl-lq" data-q="s">${sunset}</g><g class="isl-lq" data-q="d">${dusk}</g></g>`;
    }
    const lampH = 6.2 * u;
    let postsD = '', capsD = '', glows = '', heads = '', glassSh = '', collars = '';
    const lamps = [-0.93, -0.62, 0.62, 0.93];
    lamps.forEach((f, i) => {
      const lx = cx + f * erx, ly = ey - ery * Math.sqrt(Math.max(0, 1 - f * f)) - 1.2 * u;
      postsD += rect(lx - 0.22 * u, ly - lampH, 0.44 * u, lampH);
      capsD += `M${F(lx - 0.8 * u)} ${F(ly - lampH - 0.45 * u)}L${F(lx)} ${F(ly - lampH - 1.1 * u)}L${F(lx + 0.8 * u)} ${F(ly - lampH - 0.45 * u)}Z`;
      // by Day the lamp's head, unlit: a frosted glass globe, shaded on its underside, on an iron collar
      const hr = 0.6 * u, gy = ly - lampH;   // (every lamp the same model and size: they stand at one distance)
      heads += `M${F(lx - hr)} ${F(gy)}a${F(hr)} ${F(hr)} 0 1 0 ${F(2 * hr)} 0a${F(hr)} ${F(hr)} 0 1 0 ${F(-2 * hr)} 0Z`;
      glassSh += `M${F(lx + hr)} ${F(gy)}A${F(hr)} ${F(hr)} 0 0 1 ${F(lx - hr)} ${F(gy)}A${F(hr)} ${F(hr * 0.55)} 0 0 0 ${F(lx + hr)} ${F(gy)}Z`;
      collars += rect(lx - 0.34 * u, gy + hr * 0.82, 0.68 * u, 0.32 * u);
      if (i === 1) {
        glows += `<circle cx="${F(lx)}" cy="${F(ly - lampH)}" r="${F(3 * u)}" fill="url(#islvlamp)"/>`
          + `<circle class="isl-vlamp" cx="${F(lx)}" cy="${F(ly - lampH)}" r="${F(0.6 * u)}"/>`;
      } else {
        glows += `<circle cx="${F(lx)}" cy="${F(ly - lampH)}" r="${F(3 * u)}" fill="url(#islvbulb)"/>`
          + `<circle class="f-pulse" cx="${F(lx)}" cy="${F(ly - lampH)}" r="${F(0.6 * u)}"/>`;
      }
    });
    // (the post, the cap and, by Day, the glass and its collar each in their own colour: by Day the post is
    // iron, the cap bronze and the globe frosted glass; after dark the post and cap stay the silhouette they were)
    s += `<path class="isl-vdark isl-lpost" d="${postsD}"/><path class="isl-vdark isl-lcap" d="${capsD}"/>` + `<g class="isl-vlamps">${glows}</g>`
      + `<g class="isl-ydet"><path class="isl-lglass" d="${heads}"/><path class="isl-lglass2" d="${glassSh}"/>`
      + `<path class="isl-lpost" d="${collars}"/><path class="isl-lcap" d="${capsD}"/></g>`;

    // The four flags on their poles in front of the building, as in the owner's photographs: from the left
    // Antigua and Barbuda, Canada, India and the United States (owner, 2026-10-01: "pretty iconic"). They fly to
    // the right, sagging a little toward the fly, above the roofs against the sky; each flag in its own colours,
    // veiled toward night (isl-vflagveil), the poles in the walls' cream.
    const flag = (px, top, fh, kind) => {
      const w = fh * { ag: 1.5, ca: 2, in: 1.5, us: 1.9 }[kind], h = fh, a = Math.atan2(0.22 * u, w) * 180 / Math.PI;
      const box = (x, y, bw, bh, fill) => `<path fill="${fill}" d="${rect(x, y, bw, bh)}"/>`;
      let d = '';
      if (kind === 'ag') {        // red, with the inverted triangle: black (the rising sun in it), blue, white
        const band = (y1, y2, fill) => `<path fill="${fill}" d="${polyD([[w / 2 * y1 / h, y1], [w - w / 2 * y1 / h, y1], [w - w / 2 * y2 / h, y2], [w / 2 * y2 / h, y2]])}"/>`;
        d = box(0, 0, w, h, '#ce1126') + band(0, 0.42 * h, '#000000') + band(0.42 * h, 0.6 * h, '#0072c6') + band(0.6 * h, h, '#ffffff')
          + `<path fill="#fcd116" d="M${F(w / 2 - 0.2 * h)} ${F(0.42 * h)}a${F(0.2 * h)} ${F(0.2 * h)} 0 0 1 ${F(0.4 * h)} 0Z"/>`;
      } else if (kind === 'ca') {   // red, white, red, the maple leaf at the centre
        const L = [[0, -0.5], [0.08, -0.33], [0.2, -0.38], [0.16, -0.15], [0.38, -0.25], [0.33, -0.12], [0.48, -0.06], [0.3, 0.08], [0.34, 0.18], [0.06, 0.14], [0.04, 0.4],
          [-0.04, 0.4], [-0.06, 0.14], [-0.34, 0.18], [-0.3, 0.08], [-0.48, -0.06], [-0.33, -0.12], [-0.38, -0.25], [-0.16, -0.15], [-0.2, -0.38], [-0.08, -0.33]];
        d = box(0, 0, w, h, '#ffffff') + box(0, 0, w / 4, h, '#d52b1e') + box(w * 3 / 4, 0, w / 4, h, '#d52b1e')
          + `<path fill="#d52b1e" d="${polyD(L.map(([x, y]) => [w / 2 + x * 0.62 * h, h / 2 + y * 0.62 * h]))}"/>`;
      } else if (kind === 'in') {   // saffron, white, green, the navy wheel at the centre
        d = box(0, 0, w, h / 3, '#ff9933') + box(0, h / 3, w, h / 3, '#ffffff') + box(0, 2 * h / 3, w, h / 3 + 0.01, '#138808')
          + `<circle cx="${F(w / 2)}" cy="${F(h / 2)}" r="${F(0.13 * h)}" fill="none" stroke="#000080" stroke-width="${F(Math.max(0.5, 0.04 * h))}"/>`;
      } else {                     // thirteen stripes, the blue canton with its stars
        let red = '';
        for (let k = 0; k < 13; k += 2) red += rect(0, k * h / 13, w, h / 13);
        let stars = '';
        for (let r2 = 0; r2 < 5; r2++) for (let c2 = 0; c2 < 6; c2++) stars += `M${F((c2 + 0.5) * 0.4 * w / 6)} ${F((r2 + 0.5) * (7 * h / 13) / 5)}h0`;
        d = box(0, 0, w, h, '#ffffff') + `<path fill="#b22234" d="${red}"/>` + box(0, 0, 0.4 * w, 7 * h / 13, '#3c3b6e')
          + `<path d="${stars}" stroke="#ffffff" stroke-linecap="round" stroke-width="${F(Math.max(0.5, 0.045 * h))}"/>`;
      }
      // a soft ripple across the cloth, then the veil the evening draws over it
      d += `<path fill="#000000" fill-opacity=".1" d="${rect(0.34 * w, 0, 0.16 * w, h)}"/><path fill="#ffffff" fill-opacity=".1" d="${rect(0.6 * w, 0, 0.14 * w, h)}"/>`
        + `<path class="isl-vflagveil" d="${rect(0, 0, w, h)}"/>`;
      return `<g transform="translate(${F(px + 0.15 * u)} ${F(top + 0.35 * u)}) skewY(${F(a)})">${d}</g>`;
    };
    let poles = '', cloth = '';
    for (const [dx, kind] of [[-24, 'ag'], [-14.5, 'ca'], [14.5, 'in'], [24, 'us']]) {
      const px = cx + dx * u, top = base - 30.6 * u, pw2 = Math.max(1, 0.3 * u);
      poles += rect(px - pw2 / 2, top, pw2, base + 0.6 * u - top)
        + `M${F(px - 0.32 * u)} ${F(top - 0.2 * u)}a${F(0.32 * u)} ${F(0.32 * u)} 0 1 0 ${F(0.64 * u)} 0a${F(0.32 * u)} ${F(0.32 * u)} 0 1 0 ${F(-0.64 * u)} 0Z`;
      cloth += flag(px, top, 2.6 * u, kind);
    }
    s += `<path class="isl-vwall" d="${poles}"/>${cloth}`;

    // Palms: two tall ones flanking the portico, smaller ones along the front. The tall two stand far
    // enough out, and low enough, that their fronds keep clear of the clock's face (2026-09-30).
    const palms = [[cx - 10.8 * u, base + 1, 23 * u, -0.05, 17], [cx + 10.8 * u, base + 1, 22 * u, 0.06, 29]];
    [[-19, 12, -0.08], [19, 11, 0.07], [-36, 10, -0.05], [37, 11, 0.06], [-47, 8, 0.04]].forEach(([dx, h, lean], i) => {
      palms.push([cx + dx * u, base + 1, h * u, lean, 50 + i * 7]);
    });
    s += palmsD(palms, 'f-near');
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
    const bay = P([[0.27, 0.397], [0.3, 0.4], [0.45, 0.41], [0.6, 0.42], [0.72, 0.4], [0.8, 0.52], [0.78, 0.7],
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
    // (the blur's region is the whole card: measured on each shape's own box, it cut the shallows, the flanks
    // and the dry grass off in straight edges; review, 2026-09-30)
    s += `<defs><filter id="islvbayf" filterUnits="userSpaceOnUse" x="0" y="0" width="${F(W)}" height="${F(H)}"><feGaussianBlur stdDeviation="${F(W * 0.012)}"/></filter>`
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
    // At Sunset the Sun, just above the range, lays its path across the calm harbour, fainter than on the
    // open sea (owner, 2026-09-28: "a reflection of the sun on the water too"); the headland covers it
    // where it stands between.
    s += `<clipPath id="islvbayclip"><path d="${poly(bay)}"/></clipPath>`
      + `<g class="isl-s" clip-path="url(#islvbayclip)" opacity=".7">${sunWater(v, 's', W, v.y0, H, PIECES['shirley-heights'])}</g>`;
    // 1. The far hills: the small distant point on the left, then the main range behind Falmouth.
    const point = P([[0.295, 0.233], [0.31, 0.222], [0.33, 0.214], [0.355, 0.219], [0.375, 0.228], [0.4, 0.224],
      [0.43, 0.207], [0.47, 0.192], [0.51, 0.2], [0.55, 0.205], [0.56, 0.233]]);
    s += `<path class="f-isl" d="${poly(point)}"/>`;
    s += `<g class="isl-d"><path class="s-rim" d="${line(point.slice(4, 8).map(([x, y]) => [x, y + 0.5]))}" stroke-width=".8" stroke-opacity=".2"/></g>`;
    const range = P([[0.45, 0.25], [0.46, 0.236], [0.475, 0.226], [0.49, 0.214], [0.51, 0.2], [0.53, 0.186], [0.56, 0.168], [0.585, 0.154], [0.61, 0.164],
      [0.645, 0.149], [0.67, 0.16], [0.7, 0.176], [0.73, 0.19], [0.76, 0.198], [0.8, 0.204], [0.85, 0.199],
      [0.9, 0.21], [0.95, 0.214], [1.02, 0.22], [1.02, 0.285]]);
    s += `<path class="f-far isl-land" d="${poly(range)}${scrub(range.slice(1, -1), 4, 0.7, 1.8)}"/>`;
    // by Day the main peak's shaded flank, kept on the range (the small bumps along it had cast narrow wedges)
    s += `<clipPath id="islvrangec"><path d="${poly(range)}"/></clipPath><g class="isl-ydet" clip-path="url(#islvrangec)">${flanks(range.slice(0, 10), Yp(0.28))}</g>`;
    // at Sunset and Dusk, the range's slope facing the Sun catches the afterglow, faintly
    s += `<g class="isl-d"><path class="s-rim" d="${line(range.slice(1, 9).map(([x, y]) => [x, y + 0.5]))}" stroke-width="1" stroke-opacity=".28"/></g>`;
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
      lights.push([x, top, 2, 'm']);
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
      lights.push([x, top, 0, 'm']);
    }
    // 3. The headland: its cliff point on the left, its crest, and Fort Berkeley's spur into the bay.
    s += `<path class="f-near isl-land" d="${poly(head)}${scrub(head.slice(2, 17), 6, 0.9, 2.3)}"/>`;
    // by Day: the headland's shaded flank, its rock (the cliff at the point, Fort Berkeley's spur), its trees,
    // and the dockyard's buildings at its foot; at Dawn, the first light along its crest
    const dry = [P([[0.2, 0.37], [0.24, 0.345], [0.3, 0.33], [0.36, 0.33], [0.4, 0.36], [0.36, 0.395], [0.3, 0.4], [0.24, 0.39]]),
      P([[0.42, 0.37], [0.47, 0.36], [0.53, 0.37], [0.56, 0.4], [0.5, 0.415], [0.44, 0.41]])];   // by Day, dry grass on the headland
    const cliff = P([[0.19, 0.378], [0.194, 0.358], [0.203, 0.343], [0.212, 0.318], [0.224, 0.302], [0.234, 0.318], [0.238, 0.345], [0.23, 0.372], [0.22, 0.387], [0.2, 0.384]]);
    let strata = '';
    for (const [a, c] of [[[0.196, 0.36], [0.236, 0.356]], [[0.2, 0.348], [0.237, 0.343]], [[0.206, 0.336], [0.236, 0.331]], [[0.21, 0.324], [0.235, 0.32]], [[0.216, 0.312], [0.232, 0.31]]]) strata += line(P([a, c]));
    s += `<clipPath id="islvheadc"><path d="${poly(head)}"/></clipPath><g class="isl-ydet" clip-path="url(#islvheadc)">${flanks(head.slice(0, 18), Yp(0.42))}`
      + `<path class="isl-vdry" d="${dry.map(poly).join('')}" filter="url(#islvbayf)"/></g>`;
    s += `<g class="isl-ydet"><path class="isl-vrock" d="${poly(cliff)}"/><path class="isl-vrockline" d="${strata}" stroke-width=".8"/>`
      + `<path class="isl-vrockline" d="${line(head.slice(25, 32))}" stroke-width="${F(Math.max(1.2, Y(0.006)))}"/>`
      + `${trees(head.slice(4, 25), 150, Y(0.006), Y(0.012), 37)}</g>`;
    s += `<g class="isl-adet"><path class="isl-vgildline" d="${line(head.slice(2, 17))}" stroke-width="2" filter="url(#islvsoft)"/><path class="isl-vgildline" d="${line(head.slice(2, 17))}" stroke-width=".7"/></g>`;
    // From the owner's day photographs (2026-09-28): by Day, dry grass on the headland's lower slopes and
    // a pale rocky strip along its shore, and Fort Berkeley's stone walls along the spur.
    // (the dry grass is drawn with the headland's shade, above, clipped to the headland)
    s += `<g class="isl-ydet"><path class="isl-vrockshore" d="${line(head.slice(33))}" stroke-width="${F(Math.max(1.4, Y(0.007)))}"/>`
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
    // the surf breaking along the reef off the lookout's point, across the harbour's mouth (the owner's
    // photographs); by Day its dark rocks under it
    const reef = P([[0.196, 0.597], [0.22, 0.59], [0.25, 0.585], [0.285, 0.584]]);
    s += `<path class="isl-vsurf" d="${line(reef)}" stroke-width="${F(Math.max(1.2, Y(0.006)))}"/>`
      + `<g class="isl-ydet"><path class="isl-vrockline" d="${line(reef.map(([x, y]) => [x, y + 1.5]))}" stroke-width="1"/></g>`;
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
    // each dock lamp, and the light at the pier's end, lays its column on the bay (their own random stream)
    const cr = rng(223);
    let cols = '';
    for (let k = 0; k < 5; k++) {
      const u = (k + 0.5) / 5, cx = d0[0] + (d1[0] - d0[0]) * u, cy = d0[1] + (d1[1] - d0[1]) * u + dt;
      cols += dashes(streakList(cx, cy, cy + Y(0.09), cr, 0.05, 0.04), 's-vglow', 1, [0.1, 0.2, 0.35]);
    }
    cols += dashes(streakList(pier1[0] + 1, pier1[1] + pt, pier1[1] + pt + Y(0.07), cr, 0.05, 0.04), 's-vglow', 1, [0.1, 0.2, 0.35]);
    s += `<g class="isl-vwin" style="--i:0" clip-path="url(#islvbayclip)">${cols}</g>`;
    for (let k = 0; k < 5; k++) {
      const u = (k + 0.5) / 5;
      lights.push([d0[0] + (d1[0] - d0[0]) * u, d0[1] + (d1[1] - d0[1]) * u - Y(0.006), 0]);
    }
    let moored = '', mrefl = '';
    for (let i = 0; i < 11; i++) {
      const jx = r(), jf = r(), jt = r();        // the old quay's three draws per mast, so nothing else moves
      if (i > 6) continue;
      const u = (i + 0.4 + jx * 0.2) / 7, x = d0[0] + (d1[0] - d0[0]) * u, dy = d0[1] + (d1[1] - d0[1]) * u;
      const foot = dy + dt + Y(0.012 + jf * 0.004), top = foot - Y(0.07 + jt * 0.04), hw = X(0.011);
      moored += `M${F(x - hw)} ${F(foot - Y(0.008))}H${F(x + hw)}L${F(x + hw * 0.75)} ${F(foot)}H${F(x - hw * 0.8)}Z`;
      mrefl += `<rect x="${F(x - 0.6)}" y="${F(foot + Y(0.002))}" width="1.2" height="${F(Y(0.05))}" fill="url(#islvcoolrefl)"/>`;
      masts += `M${F(x)} ${F(foot - Y(0.008))}V${F(top)}`;
      lights.push([x, top, 0, 'm']);
    }
    s += `<path class="isl-vhull" d="${moored}"/><g class="isl-vlamps">${mrefl}</g>`;
    for (let i = 0; i < 18; i++) { r(); r(); }   // the dockyard's old random lights; its windows give them now
    // 5. Yachts at anchor across the bay: white hulls, masts, masthead lights and their reflections.
    let hulls = '', refl = '';
    const boats = [[0.385, 0.62], [0.42, 0.6], [0.455, 0.605], [0.49, 0.61], [0.5, 0.57], [0.535, 0.56], [0.555, 0.64],
      [0.58, 0.6], [0.605, 0.55], [0.62, 0.53], [0.635, 0.585], [0.655, 0.59], [0.67, 0.56], [0.685, 0.55],
      [0.62, 0.68], [0.55, 0.52], [0.45, 0.68], [0.52, 0.66], [0.7, 0.6], [0.4, 0.55]];
    // (boats 0 and 19, the two nearest the harbour's mouth, come and go by the hour: each is kept aside here
    // and drawn below, at anchor only in the versions it is home; art-audit pass 4, 2026-10-01)
    const roving = {};
    boats.forEach(([fx, fy], i) => {
      const x = X(fx), y = Yp(fy), hw = X(0.008), mh = Y(0.05 + (i % 4) * 0.008);
      const hull = `M${F(x - hw)} ${F(y)}L${F(x + hw)} ${F(y)}L${F(x + hw * 0.7)} ${F(y + Y(0.009))}L${F(x - hw * 0.7)} ${F(y + Y(0.009))}Z`;
      const rf = `<rect x="${F(x - 0.6)}" y="${F(y + Y(0.011))}" width="1.2" height="${F(Y(0.05))}" fill="url(#islvcoolrefl)"/>`;
      if (i === 0 || i === 19) { roving[i] = { x, y, hw, mh, hull, rf }; return; }
      hulls += hull;
      masts += `M${F(x)} ${F(y)}V${F(y - mh)}`;
      lights.push([x, y - mh, 1, 'm']);
      refl += rf;
    });
    s += `<path class="isl-vmast" d="${masts}" stroke-width="0.7"/>`;
    s += `<path class="isl-vhull" d="${hulls}"/>`;
    s += `<g class="isl-vlamps">${refl}</g>`;
    {
      // THE ANCHORAGE BY THE HOUR (art-audit pass 4, 2026-10-01; by version): boats leave English Harbour early
      // for a day's sail or a passage and come back in the evening, so the two boats nearest the mouth come and
      // go, and their places in the bay stand empty while they are out. At Dawn boat 19 motors out through the
      // mouth, bow to the open sea, its sail still furled on the boom; by Day it and boat 0 sail on the open sea
      // beyond the headland's point; at Sunset boat 19 motors home, boat 0 already back at anchor; from Dusk both
      // lie at anchor again. Each boat keeps its own mast's height, so it is the same boat out as at anchor.
      // Their lights follow the rules of the road (the owner, 2026-10-01: under sail the red port sidelight and
      // no masthead light; at anchor an anchor light): at anchor the all-round light at the masthead, as every
      // boat in the bay; under engine the masthead (steaming) light on the mast's forward face, part way up as
      // a yacht carries it, and the sidelight on the side we see, red to port heading out and green to
      // starboard coming in; by Day, under sail, none. Their own random stream (229), so nothing else moves.
      const ur = rng(229), hh = Y(0.009), sw = F(Math.max(1, Y(0.004)));
      // at anchor, drawn as the rest of the bay's boats are; the anchor lights of those at anchor in one path (Chrome
      // draws a lone round point a shade differently from the same point in a longer path, so Dusk and Night, with
      // both home, stay pixel for pixel as they were)
      const atAnchor = (list) => list.map(({ x, y, mh, hull }) => `<path class="isl-vmast" d="M${F(x)} ${F(y)}V${F(y - mh)}" stroke-width="0.7"/>`
        + `<path class="isl-vhull" d="${hull}"/>`).join('') + `<g class="isl-vlamps">${list.map((b) => b.rf).join('')}</g>`
        + `<path class="s-vcool isl-vwin" style="--i:2" d="${list.map(({ x, y, mh }) => `M${F(x)} ${F(y - mh)}h0`).join('')}" stroke-width="1.6"/>`;
      // a yacht's hull with its bow toward f (1 right, -1 left): a raked stem, a near-upright transom
      const hullD = (x, y, hw, f, h) => `M${F(x + f * hw)} ${F(y)}L${F(x - f * hw * 0.94)} ${F(y)}L${F(x - f * hw * 0.8)} ${F(y + h)}`
        + `L${F(x + f * hw * 0.6)} ${F(y + h)}Z`;
      // white water as lines on the sea, faded astern by a soft mask from the stern (x0) to where it has gone
      // (x1), so a wake trails off instead of ending square; ahead of x0 it is at full strength
      let wakes = 0;
      const wake = (x0, x1, lines) => {
        const id = `islvhwake${wakes++}`, d = lines.map(([ax, ay, bx, by]) => `M${F(ax)} ${F(ay)}L${F(bx)} ${F(by)}`).join('');
        return `<linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="${F(x0)}" y1="0" x2="${F(x1)}" y2="0">`
          + `<stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>`
          + `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${F(W)}" height="${F(H)}"><rect width="${F(W)}" height="${F(H)}" fill="url(#${id}g)"/></mask>`
          + `<path class="isl-vsurf" d="${d}" stroke-width="${sw}" mask="url(#${id})"/>`;
      };
      // Under engine, bow toward f: the sail furled on the boom (a roll along it in the sails' shaded tone, fullest
      // at the mast), the wake (the bow wave's arms opening from the stem, the far one hidden by the hull until the
      // stern, and the propeller's wash straight astern), the steaming light's column on the water, the sidelight.
      const motoring = ({ hw, mh }, fx, fy, f) => {
        // (the boom low over the deck, so the roll on it sits on the hull's line: higher, with water showing under
        // it, it read as a flag flying from the mast; review, 2026-10-01)
        const x = X(fx), y = Yp(fy), wl = y + hh, ft = Math.max(1, Y(0.005)), by = y - 0.3;
        let o = `<path class="isl-vmast" d="M${F(x)} ${F(y)}V${F(y - mh)}M${F(x)} ${F(by)}H${F(x - f * hw * 0.92)}" stroke-width="0.7"/>`
          + `<path class="isl-vfurl" d="M${F(x)} ${F(by + 0.2)}V${F(by - ft)}L${F(x - f * hw * 0.82)} ${F(by - ft * 0.75)}V${F(by + 0.2)}Z"/>`
          + `<path class="isl-vhull" d="${hullD(x, y, hw, f, hh)}"/>`;
        const st = x + f * hw * 0.6, sx = x - f * hw * 0.86, len = hw * 2.6 * (0.9 + ur() * 0.2), lw = hw * 1.5 * (0.9 + ur() * 0.2);
        o += wake(sx, sx - f * len, [[st, wl + 0.3, sx - f * len, wl + Y(0.011)], [sx, wl - 0.2, sx - f * len, wl - Y(0.006)], [sx, wl + 0.2, sx - f * lw, wl + 0.5]]);
        const lx = x + f * hw * 0.9, ly = y - Y(0.003), c = f < 0 ? 'r' : 'g';
        o += `<g class="isl-vlamps"><rect x="${F(x - 0.6)}" y="${F(wl + Y(0.002))}" width="1.2" height="${F(Y(0.05))}" fill="url(#islvcoolrefl)"/></g>`
          + `<g class="isl-vwin" style="--i:2">${halo(lx, ly, Math.max(3, Y(0.014)), f < 0 ? 'islvred' : 'islvgreen')}`
          + `<circle class="isl-vnav-${c}" cx="${F(lx)}" cy="${F(ly)}" r="${F(Math.max(0.9, Y(0.0035)))}"/>`
          + `<path class="s-vcool" d="M${F(x + f * 0.5)} ${F(y - mh * 0.62)}h0" stroke-width="1.6"/></g>`;
        return o;
      };
      // Under sail on the open sea, heading out (bow left, the port side toward us), smaller with the distance
      // (sc): a mainsail and a jib, a short wake, and a faint reflection about the waterline.
      const sailing = ({ hw, mh }, fx, fy, sc) => {
        const x = X(fx), wl = Yp(fy), h = hh * sc, y = wl - h, w = hw * sc, m = mh * sc;
        const boat = `<path class="isl-vmast" d="M${F(x)} ${F(y)}V${F(y - m)}" stroke-width="0.7"/>`
          + `<path class="isl-vsail" d="M${F(x + 0.4)} ${F(y - m)}L${F(x + w * 0.88)} ${F(y - m * 0.12)}H${F(x + 0.4)}Z`
          + `M${F(x - 0.4)} ${F(y - m * 0.86)}L${F(x - w * 0.92)} ${F(y - m * 0.06)}H${F(x - 0.4)}Z"/>`
          + `<path class="isl-vhull" d="${hullD(x, y, w, -1, h)}"/>`;
        const wx = x + w * 0.8, wn = wx + w * 2.2 * (0.9 + ur() * 0.2);
        return `<g opacity=".16" transform="translate(0 ${F(2 * wl)}) scale(1 -1)">${boat}</g>${boat}` + wake(wx, wn, [[wx, wl + 0.2, wn, wl + 0.4]]);
      };
      // (by Day the taller-masted boat 19 is the nearer of the two, so the farther boat is the smaller)
      s += `<g class="isl-lq" data-q="as">${atAnchor([roving[0]])}</g><g class="isl-lq" data-q="dn">${atAnchor([roving[0], roving[19]])}</g>`
        + `<g class="isl-lq" data-q="a">${motoring(roving[19], 0.23, 0.53, -1)}</g>`
        + `<g class="isl-lq" data-q="y">${sailing(roving[0], 0.07, 0.37, 0.8)}${sailing(roving[19], 0.13, 0.405, 0.85)}</g>`
        + `<g class="isl-lq" data-q="s">${motoring(roving[19], 0.25, 0.54, 1)}</g>`;
    }
    // 6. The lookout: the slope on the left, the rocks and scrub in front, organ-pipe cactus, a lantern.
    s += `<path class="f-near isl-land" d="${poly(slope)}${scrub(slope.slice(0, 19), 6, 1.2, 3.4)}"/>`;
    // Galleon Beach's palms along the back of the sand (every version: silhouettes by night, green by Day)
    const palms = [[0.79, 0.556, 0.052], [0.803, 0.58, 0.048], [0.806, 0.604, 0.056], [0.805, 0.63, 0.05], [0.797, 0.655, 0.054]]
      .map(([fx, fy, fh], k) => [X(fx), Yp(fy), Y(fh), 0.06 - k * 0.025, 301 + k]);
    s += palmsD(palms, 'isl-palm');
    // by Day, the lookout's own trees in front, the largest and brightest (the owner's photograph)
    s += `<g class="isl-ydet">${trees(slope, 120, Y(0.014), Y(0.045), 41)}</g>`;
    const lx = X(0.43), ly = Yp(0.772);
    // (on an iron post, as every lamp; its pool at its foot; the page's own light, the last in the pass)
    s += `<path class="isl-vpost" d="M${F(lx - 1)} ${F(ly + Y(0.02))}V${F(ly - Y(0.05))}H${F(lx + 1)}V${F(ly + Y(0.02))}Z"/>`;
    s += `<g class="isl-vwin isl-vlast" style="--i:8">${pool(lx, ly + Y(0.02), Y(0.05), Y(0.011), 0.6)}`
      + `<circle cx="${F(lx)}" cy="${F(ly - Y(0.06))}" r="${F(Y(0.055))}" fill="url(#islvlamp)"/>`
      + `<circle class="isl-vlamp" cx="${F(lx)}" cy="${F(ly - Y(0.06))}" r="${F(Math.max(1.5, Y(0.008)))}"/></g>`;
    {
      // (by Day its globe is frosted glass, shaded on its underside, as the campus's lamps)
      const gr = Math.max(1.5, Y(0.008)), gy = ly - Y(0.06);
      s += `<g class="isl-ydet"><circle class="isl-lglass" cx="${F(lx)}" cy="${F(gy)}" r="${F(gr)}"/>`
        + `<path class="isl-lglass2" d="M${F(lx + gr)} ${F(gy)}A${F(gr)} ${F(gr)} 0 0 1 ${F(lx - gr)} ${F(gy)}A${F(gr)} ${F(gr * 0.55)} 0 0 0 ${F(lx + gr)} ${F(gy)}Z"/></g>`;
    }
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
    // (the masthead lights, kind 'm', in the boats' cool white, the second light, each in its group's turn)
    const groups = [[], [], [], []], cool = [[], [], [], []];
    for (const [x, y, g, kind] of lights) (kind === 'm' ? cool : groups)[g].push(`M${F(x)} ${F(y)}h0`);
    const widths = [2.2, 1.6, 1.5, 1.25];
    groups.forEach((d, g) => {
      if (d.length) s += `<path class="s-vlight isl-vwin" style="--i:${g * 2}" d="${d.join('')}" stroke-width="${widths[g]}"/>`;
      if (cool[g].length) s += `<path class="s-vcool isl-vwin" style="--i:${g * 2}" d="${cool[g].join('')}" stroke-width="${widths[g]}"/>`;
    });
    s += `<ellipse class="isl-vglow" cx="${F(X(0.67))}" cy="${F(Yp(0.43))}" rx="${F(X(0.07))}" ry="${F(Y(0.06))}" fill="url(#islvwarm)"/>`;
    return s;
  }

  /* CURTAIN BLUFF (the For Faculty & Staff landing's head): the homepage's view until the campus took
     its place (owner, 2026-09-27), moved here as he asked. The view from the tip of Curtain Bluff, drawn
     by the coast world at true bearings: turned south-west on 2026-09-30 (the owner, who sees the whole
     of Montserrat from Turtle Bay on clear days, liked it with Montserrat and Nevis), so Montserrat
     lies on the left, Redonda's rock and Nevis toward the middle, the sunset right of them and
     Antigua's own coast running in on the right. By Day, the cloud that almost always caps Nevis Peak,
     turquoise shallows and a line of surf along Antigua's shore, and yachts with their reflections (the
     same four keep a sailor's day: home at Sunset, at anchor under the near point overnight, the first out
     again at Dawn; art-audit pass 4, 2026-10-01); in every version ripples dense toward the horizon and
     mist at the coast's foot. After dark a few faint
     lights: Antigua's shore first, each laying a thin column on the water, then Nevis, then Montserrat,
     where only the north is lived in (the south is the volcano's exclusion zone), and none on
     uninhabited Redonda. The magnificent frigatebird soars in the east wind in the open sky. */
  function curtainBluff(W, H, v) {
    const B = L.BIRD;
    if (!B) return '';
    const r = rng(1917), y0 = v.y0, ppd = v.ppd, VEX = L.VEX || 2.6;
    const [bx0, by0, bx1, by1] = B.box, span = clamp(W * 0.1, 56, 100), k = span / (bx1 - bx0);
    // (left of the Moon's place: at 0.64 its right wingtip lay on the night Moon's disc at every width; first
    // audit's mechanical sweep, measured 2026-10-01)
    const x = W * 0.58, y = y0 * 0.34;
    let s = '';
    // The sea's finish: ripples dense toward the horizon, long and sparse near the viewer.
    s += dashes(hatchList(W, y0, H, r), 's-vrip', 1, [0.1, 0.18, 0.28]);
    // The islands' outlines in this view, as island-core.js draws them, and the height of one at x.
    const isle = (i) => L.ISL[i].map(([az, h]) => [v.x(az), y0 - h * VEX * ppd]);
    const mont = isle(0), nevis = isle(2);
    const topAt = (pts, px) => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [xa, ya] = pts[i], [xb, yb] = pts[i + 1];
        if (px >= xa && px <= xb) return ya + (yb - ya) * (px - xa) / ((xb - xa) || 1);
      }
      return y0;
    };
    // Antigua's shore in the view: where each bearing's shore meets the sea ([x, shore y, the top of the
    // ground nearest the viewer there: the near point's crest where it stands in front, else the far crest]).
    const shore = [];
    for (const q of L.LAND) {
      const px = v.x(q[0]);
      if (px < -6 || px > W + 6 || q[1] < -90 || q[2] < -90) continue;
      shore.push([px, y0 - q[2] * ppd + 0.5, y0 - (q[4] > -90 ? q[4] : q[1]) * ppd]);
    }
    shore.sort((a, b) => a[0] - b[0]);
    const shoreD = shore.length > 1 ? 'M' + shore.map(([px, py]) => `${F(px)} ${F(py)}`).join('L') : '';
    if (shore.length > 1) {
      const xs = shore[0][0], ys = shore.reduce((m, q) => m + q[1], 0) / shore.length;
      s += mist(xs - W * 0.02, ys, W - xs + W * 0.04, Math.max(6, H * 0.03), 0.45);
    }
    // By Day: the cloud cap on Nevis Peak, the shallows and surf along the shore, the yachts.
    let day = '';
    if (nevis.length > 2) {
      let [sx, sy] = nevis[0];
      for (const [px, py] of nevis) if (py < sy) { sx = px; sy = py; }
      const nw = nevis[nevis.length - 1][0] - nevis[0][0];
      if (sx > 0 && sx < W && nw > 6) {
        const cw = Math.max(9, nw * 0.62), ch = cw * 0.34, base = sy + ch * 0.45;
        let cap = '';
        for (let j = 0; j < 5; j++) {
          const u = (j + 0.5) / 5, px = sx - cw / 2 + u * cw, pr = ch * (0.45 + Math.sin(u * Math.PI) * 0.55);
          cap += `M${F(px - pr)} ${F(base - pr * 0.5)}a${F(pr)} ${F(pr)} 0 1 0 ${F(2 * pr)} 0a${F(pr)} ${F(pr)} 0 1 0 ${F(-2 * pr)} 0Z`;
        }
        day += `<clipPath id="islvnevcap"><rect x="${F(sx - cw)}" y="${F(base - ch * 3)}" width="${F(cw * 2)}" height="${F(ch * 3)}"/></clipPath>`
          + `<path d="${cap}" fill="url(#islvcloud)" clip-path="url(#islvnevcap)" opacity=".92"/>`;
      }
    }
    if (shoreD) {
      day += `<path class="isl-vshallow" d="${shoreD}" transform="translate(0 ${F(Math.max(1.2, ppd * 0.22))})" stroke-width="${F(Math.max(1.8, ppd * 0.36))}"/>`
        + `<path class="isl-vsurf" d="${shoreD}" stroke-width="${F(Math.max(1, ppd * 0.13))}"/>`;
    }
    // (the yachts keep clear of the islands, and each has its reflection, with the red port sidelight a yacht
    // under sail shows, at the bow (their jibs point left, so we see their port side), and its faint column on
    // the water; art-audit wave 1, and the owner, 2026-10-01: no white masthead light under sail. Since
    // art-audit pass 4, 2026-10-01, these four are the Day picture only, drawn exactly as before; the other
    // versions follow the same four through the day, below.)
    // Each version's yachts gather in their own isl-lq group (data-q: a Dawn, y Day, s Sunset, d Dusk, n Night;
    // layout-art.css), as the library's things on the tables do.
    const Q = {};
    const put = (q, svg) => { Q[q] = (Q[q] || '') + svg; };
    const flush = () => { const o = Object.keys(Q).map((q) => `<g class="isl-lq" data-q="${q}">${Q[q]}</g>`).join(''); for (const q in Q) delete Q[q]; return o; };
    // a yacht under sail, bow to the left: its hull, mainsail aft of the mast and jib forward of it
    const underSail = (bx, by, L) => {
      const mh = L * 1.3;
      return `<path class="isl-vhull" d="M${F(bx - L / 2)} ${F(by - L * 0.1)}H${F(bx + L / 2)}L${F(bx + L * 0.36)} ${F(by)}H${F(bx - L * 0.4)}Z"/>`
        + `<path class="isl-vsail" d="M${F(bx)} ${F(by - L * 0.12)}V${F(by - mh)}L${F(bx + L * 0.42)} ${F(by - L * 0.14)}ZM${F(bx - L * 0.04)} ${F(by - mh * 0.85)}L${F(bx - L * 0.45)} ${F(by - L * 0.14)}H${F(bx - L * 0.04)}Z"/>`;
    };
    let yachts = '', ylit = '';
    const yr = rng(1931);
    for (const [fx, fy, s0] of [[0.33, 0.09, 1], [0.5, 0.15, 1.3], [0.2, 0.32, 1.7], [0.68, 0.06, 0.8]]) {
      const bx = W * fx, by = y0 + (H - y0) * fy, L = Math.max(8, W * 0.014 * s0);
      const boat = underSail(bx, by, L);
      yachts += `<g opacity=".16" transform="translate(0 ${F(2 * by)}) scale(1 -1)">${boat}</g>` + boat;
      const sx = bx - L * 0.44, sy = by - L * 0.08;
      ylit += halo(sx, sy, Math.max(2.5, L * 0.3), 'islvred') + dashes(streakList(sx, by + 1, by + (H - y0) * 0.25, yr, 0.03, 0.04), 's-vglow', 1, [0.04, 0.08, 0.12])
        + `<circle class="isl-vnav-r" cx="${F(sx)}" cy="${F(sy)}" r="${F(Math.max(1, L * 0.07))}"/>`;
    }
    s += `<g class="isl-ydet">${day}</g>`;
    put('y', yachts + `<g class="isl-vwin" style="--i:1">${ylit}</g>`);
    // The yachts by the hour (art-audit pass 4, 2026-10-01; the owner, 2026-10-01: what is drawn may change
    // between versions with a visible reason). Yachts sail by day and lie at anchor overnight, so the same
    // four keep a sailor's day: by Day they sail out as above; at Sunset they have turned for the anchorage
    // under the near point on the right, heading right, so we see their starboard sides and green starboard
    // sidelights; at Dusk the two that were nearest it are in and anchored while the other two still sail in;
    // at Night all four lie at anchor; at Dawn the first is already out, sailing left with its red sidelight,
    // and three still lie at anchor. A yacht at anchor shows the one all-round white anchor light at its
    // masthead (it is not under way, so it carries no sidelights; the owner's rule of no white masthead light
    // is for a yacht under sail, 2026-10-01). Their own random stream, so nothing approved moves.
    const ar = rng(1933);
    // under sail: dir 1 heading left (as by Day), -1 heading right, mirrored about its mast so the bow, and the
    // sidelight on it, lead to the right
    const sailing = (fx, fy, s0, dir) => {
      const bx = W * fx, by = y0 + (H - y0) * fy, L = Math.max(8, W * 0.014 * s0);
      const boat = dir < 0 ? `<g transform="translate(${F(2 * bx)} 0) scale(-1 1)">${underSail(bx, by, L)}</g>` : underSail(bx, by, L);
      const sx = bx - dir * L * 0.44, sy = by - L * 0.08;
      return `<g opacity=".16" transform="translate(0 ${F(2 * by)}) scale(1 -1)">${boat}</g>` + boat
        + `<g class="isl-vwin" style="--i:1">${halo(sx, sy, Math.max(2.5, L * 0.3), dir < 0 ? 'islvgreen' : 'islvred')}`
        + dashes(streakList(sx, by + 1, by + (H - y0) * 0.25, ar, 0.03, 0.04), 's-vglow', 1, [0.04, 0.08, 0.12])
        + `<circle class="isl-vnav-${dir < 0 ? 'g' : 'r'}" cx="${F(sx)}" cy="${F(sy)}" r="${F(Math.max(1, L * 0.07))}"/></g>`;
    };
    // The anchorage: the water just off the near point's shore (where the ground within 900 m stands in front
    // of the far shore, as land() in island-core.js draws it), from its left end to the card's right edge.
    const nearX = [];
    for (const q of L.LAND) {
      const px = v.x(q[0]);
      if (px >= 0 && px <= W && q[2] > -90 && q[4] > -90 && q[4] > q[2]) nearX.push(px);
    }
    const shoreAt = (px) => {
      for (let i = 0; i < shore.length - 1; i++) {
        const [xa, ya] = shore[i], [xb, yb] = shore[i + 1];
        if (px >= xa && px <= xb) return ya + (yb - ya) * (px - xa) / ((xb - xa) || 1);
      }
      return y0 + 1;
    };
    // at anchor, the size a yacht of about 12 m has at the near point's distance (from the view's own scale,
    // so it keeps its size beside the point at every width): a hull with its low coachroof, a bare mast with
    // its forestay and backstay (without them a mast alone read as a post), the mainsail furled on its boom,
    // lying head to the trade wind like every boat there (bows to the left), its reflection, and the anchor
    // light at the masthead with its column on the water
    const aL = Math.max(7, ppd * 1.35);
    const ax0 = (nearX.length ? Math.min(...nearX) : W * 0.84) + aL * 0.8, ax1 = W - 20;
    const atAnchor = (f) => {
      const ax = ax0 + (ax1 - ax0) * f, wl = shoreAt(ax) + 2 + ar() * 2, L = aL * (0.92 + ar() * 0.16);
      const mx = ax - L * 0.1, mh = L * 1.3, dk = wl - L * 0.13;
      const boat = `<path class="isl-vhull" d="M${F(ax - L / 2)} ${F(dk)}H${F(ax + L / 2)}L${F(ax + L * 0.38)} ${F(wl)}H${F(ax - L * 0.4)}Z`
        + `M${F(ax - L * 0.16)} ${F(dk + 0.2)}V${F(dk - L * 0.07)}H${F(ax + L * 0.2)}V${F(dk + 0.2)}Z"/>`
        + `<path class="isl-vmast" d="M${F(mx)} ${F(dk)}V${F(wl - mh)}" stroke-width=".8"/>`
        + `<g opacity=".5"><path class="isl-vmast" d="M${F(mx)} ${F(wl - mh)}L${F(ax - L * 0.48)} ${F(dk)}M${F(mx)} ${F(wl - mh)}L${F(ax + L * 0.47)} ${F(dk)}" stroke-width=".5"/></g>`
        + `<path class="isl-vsheer" d="M${F(mx)} ${F(wl - L * 0.3)}L${F(ax + L * 0.32)} ${F(wl - L * 0.28)}" stroke-width="${F(Math.max(1.2, L * 0.13))}" stroke-linecap="round"/>`;
      return `<g opacity=".16" transform="translate(0 ${F(2 * wl)}) scale(1 -1)">${boat}</g>` + boat
        + `<g class="isl-vwin" style="--i:1">${halo(mx, wl - mh, 3, 'islvcool')}`
        + dashes(streakList(mx, wl + 1, wl + 30, ar, 0.02, 0.03), 's-vcool', 1, [0.08, 0.16, 0.3])
        + `<circle class="isl-vnav-w" cx="${F(mx)}" cy="${F(wl - mh)}" r="1"/></g>`;
    };
    // Sunset: all four heading home, the three farther out a little nearer the anchorage than they sailed by
    // Day; the 0.68 one stays beside the Sun's path on the water.
    for (const [fx, fy, s0] of [[0.37, 0.09, 1], [0.54, 0.15, 1.3], [0.24, 0.32, 1.7], [0.68, 0.06, 0.8]]) put('s', sailing(fx, fy, s0, -1));
    // Dusk: the two from the left still sailing in, nearer again
    for (const [fx, fy, s0] of [[0.41, 0.09, 1], [0.28, 0.32, 1.7]]) put('d', sailing(fx, fy, s0, -1));
    // At anchor, each in its own berth from the outside in: the two in first at Dusk lie innermost and stay
    // through Night and Dawn; the 0.33 one beside them at Night and Dawn; the 0.2 one, outermost, at Night only,
    // since it is the first out at Dawn.
    put('n', atAnchor(0.05));
    put('na', atAnchor(0.3));
    put('dna', atAnchor(0.61) + atAnchor(0.89));
    // Dawn: the first boat out, sailing left past the bluff with its red port sidelight (near enough that its
    // sail stays below the horizon, and a little left of Nevis, so the island never stands on its masthead)
    put('a', sailing(0.56, 0.2, 1.15, 1));
    // After dark: a few faint lights, nearest first. Antigua's shore, each with a thin column on the water.
    const lightsOn = (pts, i, w, op, last) => (pts.length
      ? `<path class="s-vlight isl-vwin${last ? ' isl-vlast' : ''}" style="--i:${i}" d="${pts.map(([px, py]) => `M${F(px)} ${F(py)}h0`).join('')}" stroke-width="${F(w)}" stroke-opacity="${op}"/>`
      : '');
    const ant = [];
    const open = shore.filter((q) => q[1] - q[2] > 2);
    for (let i = 0; i < 12 && open.length; i++) {
      const q = open[Math.floor(r() * open.length)];
      ant.push([q[0], q[1] - (q[1] - q[2]) * (0.06 + r() * 0.3)]);
    }
    let cols = '';
    for (const [px] of ant) if (r() < 0.5) cols += dashes(streakList(px, y0, H, r, 0.03, 0.04).filter(([, py]) => py < y0 + (H - y0) * 0.35), 's-vglow', 1, [0.05, 0.1, 0.16]);
    // Nevis: a few along its foot. Montserrat: its lived-in north only.
    const onIsle = (pts, a0, a1, n) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        const px = v.x(a0 + r() * (a1 - a0)), top = topAt(pts, px);
        if (y0 - top > 1.5) out.push([px, y0 - 0.6 - (y0 - top) * (0.08 + r() * 0.3)]);
      }
      return out;
    };
    const nev = onIsle(nevis, 280.2, 282.7, 5), mon = onIsle(mont, 233.6, 240.6, 7);
    s += `<g class="isl-vwin" style="--i:1">${cols}</g>` + lightsOn(ant, 1, 1.2, 0.75) + lightsOn(nev, 2, 0.95, 0.6) + lightsOn(mon, 3, 1, 0.6, true);
    // The yachts, each version's own, in front of the shore's lights and their columns, which lie behind them
    // (art-audit pass 4, 2026-10-01: the anchored masts stand before the near point and its lights; by Day those
    // lights are off, so the Day picture is unchanged).
    s += flush();
    return s + `<g transform="translate(${F(x - bx0 * k)} ${F(y - by0 * k)}) scale(${F(k * 1000) / 1000})"><path class="f-bird" d="${B.d}"/></g>`;
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
  // By Day an unlit lantern is glass in an iron frame, not one dark shape (owner, 2026-10-01): two panes
  // of pale glass, shaded below, inset in the lantern's lit pane, which by Day turns iron (isl-ltframe)
  // and shows round them as the frame. Drawn only by Day, so the lit versions are unchanged.
  // People (art-audit, 2026-10-01: pictures with no one in them read as empty sets). person(): a standing figure,
  // feet at (x, fy), h tall, seen from behind or facing us (front), in the caller's colours; `reach`, a point
  // its right hand reaches up to (a notice, a door's handle). chairUser(): a wheelchair user facing right, the
  // rear wheel's contact point at the origin, u the height to the head's top; the caller places and turns it.
  // Both are drawn in literal colours: the piece dims them by version (isl-bfig).
  const person = (x, fy, h, { shirt = '#c7d6e3', legs = '#2f3a4a', skin = '#6b4630', hair = '#1d1916', front = false, reach = null } = {}) => {
    const sw = h * 0.13, hr = h * 0.075, ft = fy - h, hy = ft + hr;
    let o = `<path fill="${legs}" d="M${F(x - sw * 0.85)} ${F(fy)}L${F(x - sw * 0.75)} ${F(ft + h * 0.5)}H${F(x + sw * 0.75)}L${F(x + sw * 0.85)} ${F(fy)}H${F(x + sw * 0.1)}L${F(x)} ${F(ft + h * 0.62)}L${F(x - sw * 0.1)} ${F(fy)}Z"/>`;
    o += `<path fill="${shirt}" d="M${F(x - sw * 0.82)} ${F(ft + h * 0.53)}L${F(x - sw)} ${F(ft + h * 0.22)}Q${F(x - sw)} ${F(ft + h * 0.16)} ${F(x - sw * 0.6)} ${F(ft + h * 0.15)}H${F(x + sw * 0.6)}Q${F(x + sw)} ${F(ft + h * 0.16)} ${F(x + sw)} ${F(ft + h * 0.22)}L${F(x + sw * 0.82)} ${F(ft + h * 0.53)}Z`
      + rect(x - sw * 1.05, ft + h * 0.2, sw * 0.24, h * 0.3)
      + (reach ? `M${F(x + sw * 0.78)} ${F(ft + h * 0.18)}L${F(x + sw * 1.02)} ${F(ft + h * 0.16)}L${F(reach[0] + sw * 0.12)} ${F(reach[1])}L${F(reach[0] - sw * 0.12)} ${F(reach[1])}Z`
        : rect(x + sw * 0.81, ft + h * 0.2, sw * 0.24, h * 0.3)) + '"/>';
    o += `<path fill="${skin}" d="${rect(x - sw * 1.02, ft + h * 0.48, sw * 0.18, h * 0.07)}${reach ? rect(reach[0] - sw * 0.12, reach[1] - h * 0.05, sw * 0.24, h * 0.06) : rect(x + sw * 0.84, ft + h * 0.48, sw * 0.18, h * 0.07)}${rect(x - hr * 0.45, hy + hr * 0.6, hr * 0.9, h * 0.07)}"/>`;
    o += front ? `<circle fill="${skin}" cx="${F(x)}" cy="${F(hy)}" r="${F(hr)}"/><path fill="${hair}" d="M${F(x - hr * 1.02)} ${F(hy + hr * 0.1)}A${F(hr * 1.02)} ${F(hr * 1.06)} 0 0 1 ${F(x + hr * 1.02)} ${F(hy + hr * 0.1)}Q${F(x + hr * 0.5)} ${F(hy - hr * 0.45)} ${F(x - hr * 1.02)} ${F(hy + hr * 0.1)}Z"/>`
      : `<circle fill="${hair}" cx="${F(x)}" cy="${F(hy)}" r="${F(hr)}"/>`;
    o += `<path fill="#3a2e24" d="${rect(x - sw * 0.85, fy - h * 0.02, sw * 0.7, h * 0.03)}${rect(x + sw * 0.15, fy - h * 0.02, sw * 0.7, h * 0.03)}"/>`;
    return o;
  };
  const chairUser = (u, { shirt = '#b8573f', legs = '#3a3f4a', skin = '#8d5a3b', hair = '#1d1916' } = {}) => {
    const sw = Math.max(0.8, u * 0.025);
    let o = `<circle cx="0" cy="${F(-u * 0.22)}" r="${F(u * 0.22)}" fill="none" stroke="#2a2f36" stroke-width="${F(u * 0.035)}"/>`   // the rear wheel
      + `<circle cx="0" cy="${F(-u * 0.22)}" r="${F(u * 0.17)}" fill="none" stroke="#9aa3ad" stroke-width="${F(sw * 0.6)}"/>`   // its hand rim
      + `<circle cx="${F(u * 0.44)}" cy="${F(-u * 0.055)}" r="${F(u * 0.055)}" fill="#2a2f36"/>`   // the front caster
      + `<path fill="none" stroke="#7e8690" stroke-width="${F(sw)}" stroke-linejoin="round" d="M${F(-u * 0.1)} ${F(-u * 0.72)}L${F(-u * 0.04)} ${F(-u * 0.38)}H${F(u * 0.34)}L${F(u * 0.44)} ${F(-u * 0.11)}M${F(u * 0.38)} ${F(-u * 0.08)}h${F(u * 0.1)}"/>`;   // backrest, seat, footrest
    o += `<path fill="${legs}" d="M${F(-u * 0.02)} ${F(-u * 0.38)}L${F(u * 0.34)} ${F(-u * 0.39)}L${F(u * 0.43)} ${F(-u * 0.12)}H${F(u * 0.34)}L${F(u * 0.28)} ${F(-u * 0.3)}L${F(-u * 0.02)} ${F(-u * 0.28)}Z"/>`;   // thighs and shins
    o += `<path fill="${shirt}" d="M${F(-u * 0.06)} ${F(-u * 0.36)}L${F(-u * 0.05)} ${F(-u * 0.72)}Q${F(u * 0.03)} ${F(-u * 0.8)} ${F(u * 0.12)} ${F(-u * 0.72)}L${F(u * 0.13)} ${F(-u * 0.36)}Z"/>`;   // torso
    o += `<path fill="none" stroke="${shirt}" stroke-width="${F(u * 0.07)}" stroke-linecap="round" d="M${F(u * 0.06)} ${F(-u * 0.68)}L${F(u * 0.1)} ${F(-u * 0.45)}L${F(u * 0.04)} ${F(-u * 0.32)}"/>`;   // the arm to the hand rim
    o += `<circle fill="${skin}" cx="${F(u * 0.04)}" cy="${F(-u * 0.31)}" r="${F(u * 0.035)}"/>`;   // the hand
    o += `<circle fill="${skin}" cx="${F(u * 0.05)}" cy="${F(-u * 0.88)}" r="${F(u * 0.09)}"/><path fill="${hair}" d="M${F(u * 0.05 - u * 0.092)} ${F(-u * 0.87)}A${F(u * 0.092)} ${F(u * 0.095)} 0 0 1 ${F(u * 0.05 + u * 0.092)} ${F(-u * 0.87)}Q${F(u * 0.05)} ${F(-u * 0.93)} ${F(u * 0.05 - u * 0.092)} ${F(-u * 0.87)}Z"/>`;
    return o;
  };
  const panes = (x0, y0, w, h) => {
    const t = Math.max(0.6, w * 0.16), g = Math.max(0.5, t * 0.7), pw = (w - 2 * t - g) / 2, ph = h - 2 * t;
    if (pw < 0.4 || ph < 0.4) return '';
    let d = '', sh = '';
    for (const x of [x0 + t, x0 + t + pw + g]) { d += rect(x, y0 + t, pw, ph); sh += rect(x, y0 + t + ph * 0.55, pw, ph * 0.45); }
    // (lit, from Dawn to Night, the same frame and bar across the glow: a lit lantern had become one glowing
    // box; art-audit wave 1, 2026-10-01, found by three judges on three pictures)
    return `<g class="isl-ydet"><path class="isl-lglass" d="${d}"/><path class="isl-lglass2" d="${sh}"/></g>`
      + `<g class="isl-ltlit"><path class="isl-ltbar" d="M${F(x0 + t / 2)} ${F(y0 + t / 2)}h${F(w - t)}v${F(h - t)}h${F(t - w)}Z" stroke-width="${F(t)}"/>`
      + `<path class="isl-ltbar" d="M${F(x0 + w / 2)} ${F(y0 + t)}V${F(y0 + h - t)}" stroke-width="${F(g)}"/></g>`;
  };
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
    // (the glitter only while the afterglow is there, at Sunset and Dusk: at Dawn the western sky is empty)
    if (sunX > -W * 0.2 && sunX < W * 1.2) s += dashes(streakList(Math.min(W - 10, sunX), y0, H, r, 0.14, 0.1), 's-vglow isl-aglow isl-d', 1.3, [0.12, 0.24, 0.42]);
    // 1. Montserrat on the horizon, the Soufriere Hills its peak, its western flank rimmed. (The rims
    //    are kept out of the land's reflection: the water mirrors the hills, not a line of light.)
    const mont = P([[0.02, 0.6], [0.05, 0.58], [0.075, 0.558], [0.1, 0.535], [0.12, 0.522], [0.14, 0.53], [0.165, 0.552], [0.2, 0.578], [0.23, 0.6]]);
    land += `<path class="f-isl" d="${poly(mont)}"/>`;
    let rims = `<path class="s-rim" d="M${mont.slice(4, 8).map(([x, y]) => `${F(x)} ${F(y + 0.5)}`).join('L')}" stroke-width="1" stroke-opacity=".35"/>`;
    // 2. Antigua's south coast: a far range, then the near hills in planes, the crest rimmed.
    const range = P([[0.5, 0.6], [0.56, 0.57], [0.62, 0.535], [0.68, 0.49], [0.74, 0.455], [0.8, 0.43], [0.86, 0.41], [0.92, 0.395], [1.02, 0.38], [1.02, 0.6]]);
    land += `<path class="f-isl" d="${poly(range)}${scrub(range.slice(1, 9), 3, 0.6, 1.4)}"/>`;
    const hills = P([[0.58, 0.603], [0.62, 0.58], [0.66, 0.555], [0.7, 0.52], [0.74, 0.49], [0.78, 0.475], [0.82, 0.48], [0.86, 0.455], [0.9, 0.44], [0.95, 0.445], [1.02, 0.43], [1.02, 0.605], [0.58, 0.605]]);
    land += `<path class="f-far isl-land" d="${poly(hills)}${scrub(hills.slice(0, 11), 6, 0.8, 2)}"/>`;
    // the afterglow rims the true skyline, the far range's crest (it had run along the near hills, across
    // the land and down into the water: review, 2026-09-30)
    rims += `<path class="s-rim" d="M${range.slice(1, 9).map(([x, y]) => `${F(x)} ${F(y + 0.5)}`).join('L')}" stroke-width="1.2" stroke-opacity=".45"/>`;
    // the shore's lights, and so its houses by Day, stay on the near hills, below their crest
    const crestY = (x) => {
      for (let i = 0; i < 10; i++) {
        const [xa, ya] = hills[i], [xb, yb] = hills[i + 1];
        if (x >= xa && x <= xb) return ya + (yb - ya) * (x - xa) / (xb - xa);
      }
      return Y(0.43);
    };
    for (let i = 0; i < 18; i++) {
      const x = X(0.62 + r() * 0.38), y = Y(0.54 + r() * 0.055);
      lights[1].push([x, Math.max(y, crestY(x) + Y(0.015))]);
    }
    const regattaHouses = makeKit(W, H).dayHouses(lights[1], Y(0.02), 61);
    s += land + rims + regattaHouses + mirrored(y0, land, 0.18);
    s += mist(X(0.5), Y(0.6), X(0.55), Y(0.05), 0.55) + mist(X(0.0), Y(0.603), X(0.3), Y(0.03), 0.35);
    for (const [x] of lights[1]) if (r() < 0.5) s += dashes(streakList(x, y0, H, r, 0.04, 0.05).filter(([, y]) => y < y0 + Y(0.18)), 's-vglow', 1, [0.08, 0.16, 0.3]);
    // 3. The yachts, all racing left: hull heeled to leeward, a sheer line of light, a tall shaded
    //    mainsail, a jib or a spinnaker with its seams, a bow wave, and a reflection on the water.
    // (each version's fleet in its own bucket, drawn as that version's isl-lq group below)
    let clips = '', yi = 0;
    const B = {}, bk = (q) => (B[q] = B[q] || { fleet: '', rf: '', spD: '', spEls: '', glint: '', lights: [] });
    // dir 1 races left (the port side toward us), -1 heads right, mirrored about x (the starboard side);
    // q, the versions it shows in; rr, its random stream
    const yacht = (x, wl, L, heel, spin, hued, dir = 1, q = 'y', rr = r) => {
      const b = bk(q), m0 = dir < 0 ? `<g transform="translate(${F(2 * x)} 0) scale(-1 1)">` : '', m1 = dir < 0 ? '</g>' : '';
      const sg = dir < 0 ? 'islvsailgm' : 'islvsailg';   // (mirrored, the sails keep their lit edge to the Sun's side)
      const mh = L * 1.45, mx = x + L * 0.08, hh = L * 0.1, id = `islvwl${yi++}`;
      // Heel shows in the rig's lean; the hull tilts by half as much, since a whole hull tipped in the
      // picture's plane reads as pitching bow-down rather than heeling (review, 2026-09-30).
      const turn = (deg) => { const a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
        return (px, py) => [x + (px - x) * ca - (py - wl) * sa, wl + (px - x) * sa + (py - wl) * ca]; };
      const rot = turn(heel), rotH = turn(heel / 2);
      // The hull runs on below the waterline and is cut off there, outside its heel, so a heeled boat
      // sits in the water along its whole length instead of lifting its stern clear (review, 2026-09-30).
      const hull = `M${F(x - L * 0.5)} ${F(wl - hh)}H${F(x + L * 0.5)}L${F(x + L * 0.42)} ${F(wl + L * 0.12)}H${F(x - L * 0.44)}Z`;
      const sheer = `M${F(x - L * 0.5)} ${F(wl - hh)}H${F(x + L * 0.5)}`;
      const main = `M${F(mx)} ${F(wl - hh - mh)}Q${F(mx + L * 0.18)} ${F(wl - hh - mh * 0.45)} ${F(mx + L * 0.46)} ${F(wl - hh * 1.4)}L${F(mx + L * 0.02)} ${F(wl - hh * 1.4)}Z`;
      const jib = `M${F(mx - L * 0.02)} ${F(wl - hh - mh * 0.86)}L${F(x - L * 0.48)} ${F(wl - hh * 1.1)}L${F(mx - L * 0.04)} ${F(wl - hh * 1.2)}Z`;
      const sp = `M${F(mx - L * 0.03)} ${F(wl - hh - mh * 0.92)}C${F(x - L * 0.95)} ${F(wl - hh - mh * 0.95)} ${F(x - L * 1.05)} ${F(wl - hh - mh * 0.25)} ${F(x - L * 0.62)} ${F(wl - hh * 1.6)}Q${F(x - L * 0.3)} ${F(wl - hh - mh * 0.2)} ${F(mx - L * 0.03)} ${F(wl - hh - mh * 0.92)}Z`;
      const seams = [0.3, 0.55, 0.78].map((k) => `M${F(mx - L * 0.03)} ${F(wl - hh - mh * 0.92)}Q${F(x - L * (0.2 + k * 0.7))} ${F(wl - hh - mh * (0.9 - k * 0.3))} ${F(x - L * (0.62 + 0.25 * Math.sin(k * 3)))} ${F(wl - hh - mh * (0.62 - k * 0.55))}`).join('');
      const mast = `M${F(mx)} ${F(wl - hh)}V${F(wl - hh - mh * 1.02)}`;
      const boom = `M${F(mx)} ${F(wl - hh * 1.4)}H${F(mx + L * 0.48)}`;   // along the mainsail's foot
      const g = `transform="rotate(${F(heel)} ${F(x)} ${F(wl)})"`, gH = `transform="rotate(${F(heel / 2)} ${F(x)} ${F(wl)})"`;
      clips += `<clipPath id="${id}"><rect x="${F(x - L)}" y="${F(wl - H)}" width="${F(2 * L)}" height="${F(H)}"/></clipPath>`;
      const one = `<g clip-path="url(#${id})"><g ${gH}><path class="isl-vhull" d="${hull}"/><path class="isl-vsheer" d="${sheer}" stroke-width="${F(Math.max(0.8, L * 0.012))}"/></g></g>`
        + `<g ${g}><path class="isl-vmast" d="${mast}" stroke-width="${F(Math.max(0.7, L * 0.01))}"/>`
        + `<path d="${main}" fill="url(#${sg})"/><path class="isl-vmast" d="${boom}" stroke-width="${F(Math.max(0.8, L * 0.014))}"/>`
        + (spin ? `<path class="${hued ? 'isl-vspin-k' : spin === 2 ? 'isl-vspin2' : 'isl-vspin'}" d="${sp}"/><path class="isl-vseam" d="${seams}" stroke-width=".8"/>` : `<path d="${jib}" fill="url(#${sg})"/>`)
        + '</g>';
      b.fleet += m0 + one + m1;
      // its reflection, mirrored about its own waterline (the hull's cut mirrors with it)
      b.rf += `<g transform="translate(0 ${F(2 * wl)}) scale(1 -1)">${m0}${one}${m1}</g>`;
      // the bow wave climbs from where the stem meets the water, with foam running aft along the hull
      const [p1x, p1y] = rotH(x - L * 0.5, wl - hh), [p2x, p2y] = rotH(x - L * 0.44, wl + L * 0.12);
      const sx = p1x + (p2x - p1x) * (wl - p1y) / (p2y - p1y);
      const spr = `M${F(sx)} ${F(wl)}q${F(-L * 0.05)} ${F(-hh * 0.9)} ${F(-L * 0.15)} ${F(-hh * 0.1)}M${F(sx)} ${F(wl + 0.5)}H${F(x - L * 0.25)}`
        + `M${F(x + L * 0.4)} ${F(wl + 1)}h${F(L * 0.9)}M${F(x + L * 0.55)} ${F(wl + L * 0.05)}h${F(L * 0.6)}`;
      if (dir < 0) b.spEls += `<path class="isl-vsurf" transform="translate(${F(2 * x)} 0) scale(-1 1)" d="${spr}" stroke-width="${F(Math.max(1, Y(0.004)))}"/>`;
      else b.spD += spr;
      // its lights turn with it: the masthead light on the masthead, the port sidelight on the bow. Racing
      // left, it shows the viewer its port side, so no green (owner, 2026-09-30: "an important accuracy change").
      // (the port sidelight at the bow only: a white masthead light marks a yacht under engine, not one
      // racing under sail; owner, 2026-10-01)
      { const [lx, ly] = rotH(x - L * 0.5, wl - hh); b.lights.push(dir < 0 ? [2 * x - lx, ly, 'g'] : [lx, ly, 'r']); }   // (heading right: green)
      b.glint += dashes(streakList(x, wl + 1, Math.min(H, wl + L * 1.2), rr, 0.06, 0.05), 's-vsailglint', 1, [0.06, 0.12, 0.2]);
    };
    const racers = [[0.62, 0.635, 0.035, -4, true, false], [0.47, 0.645, 0.045, -6, false, false], [0.79, 0.655, 0.05, -5, true, false],
      [0.3, 0.685, 0.066, -7, true, true], [0.56, 0.725, 0.085, -8, false, false], [0.86, 0.77, 0.1, -6, 2, false]];
    for (const [fx, fy, fl, hd, sp, hu] of racers) yacht(X(fx), Y(fy), X(fl), hd, sp, hu);
    // The fleet by the hour (owner, 2026-10-01: what is drawn may change between versions with a reason;
    // art-audit wave 1, by version). Sailing Week races by day: today's six above race left by Day. At Dawn
    // the fleet is only just out of Falmouth and English Harbour, bunched toward the coast under jibs (the
    // coral boat already flying its spinnaker on the reach out). From Sunset it turns for home, heading right
    // so we see the boats' starboard sides and green sidelights: all six at Sunset (the coral clear of the
    // Sun's path), four at Dusk nearer the coast, the last two at Night. Their own random stream, so the
    // Day picture is drawn exactly as before.
    const r2 = rng(53);
    for (const [fx, fy, fl, hd, sp, hu] of [[0.56, 0.63, 0.035, -3, false, false], [0.65, 0.64, 0.045, -4, false, false], [0.83, 0.65, 0.05, -4, false, false],
      [0.45, 0.665, 0.06, -5, true, true], [0.73, 0.695, 0.08, -5, false, false], [0.92, 0.725, 0.09, -4, false, false]]) yacht(X(fx), Y(fy), X(fl), hd, sp, hu, 1, 'a', r2);
    for (const [fx, fy, fl, hd, sp, hu] of [[0.62, 0.635, 0.035, -4, true, false], [0.47, 0.645, 0.045, -6, false, false], [0.79, 0.655, 0.05, -5, true, false],
      [0.22, 0.685, 0.066, -7, true, true], [0.56, 0.725, 0.085, -8, false, false], [0.86, 0.77, 0.1, -6, 2, false]]) yacht(X(fx), Y(fy), X(fl), hd, sp, hu, -1, 's', r2);
    for (const [fx, fy, fl, hd, sp, hu] of [[0.83, 0.655, 0.05, -5, true, false], [0.26, 0.685, 0.066, -7, true, true], [0.6, 0.725, 0.085, -8, false, false],
      [0.9, 0.77, 0.1, -6, 2, false]]) yacht(X(fx), Y(fy), X(fl), hd, sp, hu, -1, 'd', r2);
    for (const [fx, fy, fl, hd, sp, hu] of [[0.3, 0.685, 0.066, -6, true, true], [0.92, 0.77, 0.1, -5, 2, false]]) yacht(X(fx), Y(fy), X(fl), hd, sp, hu, -1, 'n', r2);
    const QS = ['y', 'a', 's', 'd', 'n'];
    // the fleet's reflections, broken by the water
    s += clips + QS.filter((q) => B[q]).map((q) => `<g class="isl-lq" data-q="${q}">${B[q].glint}<g clip-path="url(#islsea)" opacity=".14">${B[q].rf}</g>`
      + (B[q].spD ? `<path class="isl-vsurf" d="${B[q].spD}" stroke-width="${F(Math.max(1, Y(0.004)))}"/>` : '') + B[q].spEls + '</g>').join('');
    // the shore's lights, behind the yachts (drawn after them, they had shown on the sails)
    s += `<path class="s-vlight isl-vwin isl-vlast" style="--i:3" d="${lights[1].map(([x, y]) => `M${F(x)} ${F(y)}h0`).join('')}" stroke-width="1.4"/>`;
    // Each version's fleet, and its sidelights: red to port racing left, green to starboard heading home.
    s += QS.filter((q) => B[q]).map((q) => `<g class="isl-lq" data-q="${q}">${B[q].fleet}<g class="isl-vwin" style="--i:0">`
      + B[q].lights.map(([x, y, c]) => halo(x, y, 6, c === 'g' ? 'islvgreen' : 'islvred')).join('')
      + B[q].lights.map(([x, y, c]) => `<circle class="isl-vnav-${c}" cx="${F(x)}" cy="${F(y)}" r="1.3"/>`).join('') + '</g></g>').join('');
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
    // the shore's lights, each a share of the way down the land at its x, so the lights (and the houses by
    // Day) sit on the land; the same two draws each, so nothing else moves
    const topAt = (px) => {
      for (let i = 0; i < 5; i++) {
        const [xa, ya] = farShore[i], [xb, yb] = farShore[i + 1];
        if (px >= xa && px <= xb) return ya + (yb - ya) * (px - xa) / (xb - xa);
      }
      return Y(0.6);
    };
    const shoreLights = [];
    for (let i = 0; i < 12; i++) {
      const lx0 = X(0.01 + r() * 0.3), tp = topAt(lx0);
      shoreLights.push([lx0, tp + (Y(0.6) - tp) * (0.25 + r() * 0.5)]);
    }
    s += makeKit(W, H).dayHouses(shoreLights, Y(0.016), 67);
    for (const [x] of shoreLights) s += dashes(streakList(x, y0, H, r, 0.05, 0.05), 's-vglow', 1, [0.06, 0.13, 0.24]);
    s += `<path class="s-vlight isl-vwin" style="--i:0" d="${lightsD(shoreLights)}" stroke-width="1.3"/>`;
    // a yacht at anchor, its riding light and its column of light
    const bx = X(0.19), by = Y(0.8);
    s += dashes(streakList(bx, by + 2, H, r, 0.05, 0.08), 's-vcoolglow', 1.1, [0.1, 0.2, 0.34]);
    // (its mast stands clear above the far shore, where its riding light had sat on the horizon like one more
    // shore light; a boom carries the furled mainsail; the yacht has its reflection, as every hull does)
    s += `<g class="isl-vwin" style="--i:0">${halo(bx, by - Y(0.25), Y(0.045), 'islvcool')}<circle class="f-pulse f-vcool" cx="${F(bx)}" cy="${F(by - Y(0.25))}" r="1.4"/></g>`;
    // Where her crew is (art-audit pass 4, lamp-steps-V2, by version; the owner, 2026-10-01: what is drawn may
    // change between versions with a reason). A crew rows ashore in the morning, climbs to watch the sunset, comes
    // down after dusk and rows back aboard for the night. So by Day, at Sunset and at Dusk their dinghy is drawn
    // up at the foot of the steps (data-q "ysd", below and in section 4), and at Night and Dawn it rides astern on
    // a slack painter with her portholes lit, because they are aboard ("an"). Her riding light stays on in every
    // lit version, as an anchor light does. Her coachroof, which carries the portholes, is in every version and
    // in her own drawing, so her reflection carries it (it takes up wave 1's lamp-steps-A2).
    const deck = by - Y(0.014), crA = bx - X(0.021), crF = bx + X(0.007), crH = Y(0.009);
    const coach = `M${F(crA)} ${F(deck)}L${F(crA + X(0.0015))} ${F(deck - crH)}H${F(crF - X(0.004))}L${F(crF)} ${F(deck)}Z`;
    const portsD = [0.24, 0.56].map((k) => rect(crA + (crF - crA) * k, deck - crH * 0.68, X(0.0036), crH * 0.4)).join('');
    const portX = crA + (crF - crA) * 0.42, portY = deck - crH * 0.48;
    // the portholes' light on the water: a short, faint warm column beside the riding light's cool one, about
    // half its strength, from its own random stream so nothing else moves
    s += `<g class="isl-lq" data-q="an"><g class="isl-vwin" style="--i:0">`
      + dashes(streakList(portX, by + 1, H, rng(6101), 0.04, 0.05).filter(([, yy]) => yy < by + Y(0.13)), 's-vglow', 1, [0.05, 0.1, 0.17]) + '</g></g>';
    const yacht = `<path class="isl-vhull" d="M${F(bx - X(0.035))} ${F(by - Y(0.014))}H${F(bx + X(0.035))}L${F(bx + X(0.026))} ${F(by)}H${F(bx - X(0.028))}Z"/>`
      // the coachroof: low, aft of the mast with the mast stepped on its forward end, a shade darker than the
      // hull, its top edge lit and its two portholes dark glass until someone is aboard
      + `<path class="isl-vhull" d="${coach}"/><path class="isl-vpshade" d="${coach}"/><path class="isl-vdark" d="${portsD}"/>`
      + `<path class="isl-vsheer" d="M${F(crA + X(0.0015))} ${F(deck - crH)}H${F(crF - X(0.004))}" stroke-width=".8"/>`
      + `<path class="isl-vsheer" d="M${F(bx - X(0.035))} ${F(by - Y(0.014))}H${F(bx + X(0.035))}" stroke-width="1"/>`
      + `<path class="isl-vmast" d="M${F(bx)} ${F(by - Y(0.014))}V${F(by - Y(0.25))}M${F(bx)} ${F(by - Y(0.24))}L${F(bx + X(0.03))} ${F(by - Y(0.018))}M${F(bx)} ${F(by - Y(0.24))}L${F(bx - X(0.03))} ${F(by - Y(0.018))}" stroke-width=".9"/>`
      + `<path class="isl-vsheer" d="M${F(bx)} ${F(by - Y(0.05))}L${F(bx - X(0.026))} ${F(by - Y(0.042))}" stroke-width="${F(Math.max(2, Y(0.008)))}" stroke-linecap="round"/>`;
    s += `<g clip-path="url(#islsea)" opacity=".15"><g transform="translate(0 ${F(2 * by)}) scale(1 -1)">${yacht}</g></g>` + yacht;
    // her portholes lit, with a small halo (a cabin lamp's, well under the riding light's), at Night and Dawn
    // only, when her crew is aboard
    s += `<g class="isl-lq" data-q="an"><g class="isl-vwin" style="--i:0">${halo(portX, portY, Y(0.021))}</g><path class="f-pulse isl-vwin" style="--i:0" d="${portsD}"/></g>`;
    // The dinghy (lamp-steps-V2; wave 1's lamp-steps-A3): a short rowing hull, its sheer rising to the bow at the
    // right, the inside seen over the near gunwale and darker, a thwart across it and an oar laid along it on the
    // thwart. (x, wl) is the middle of its waterline and L its length. It is drawn smaller astern of the yacht than
    // at the steps because it is farther off there: the yacht's waterline is about half as far below the horizon
    // as the steps' foot, so the same boat is about half the size.
    const dinghy = (x, wl, L) => {
      const hh = L * 0.17, sx = x - L * 0.5, sy = wl - hh, fx = x + L * 0.5, fy = wl - hh * 1.4, cy = wl - hh * 0.85;
      const nearD = `M${F(sx)} ${F(sy)}Q${F(x)} ${F(cy)} ${F(fx)} ${F(fy)}`;
      const hull = nearD + `Q${F(x + L * 0.44)} ${F(wl - hh * 0.3)} ${F(x + L * 0.34)} ${F(wl)}H${F(x - L * 0.46)}Z`;
      const farD = `M${F(fx)} ${F(fy)}Q${F(x)} ${F(wl - hh * 1.75)} ${F(sx + L * 0.03)} ${F(sy - hh * 0.55)}`;
      const inside = nearD + farD.replace(/^M[^Q]*/, '') + 'Z';
      const xt = x - L * 0.06, ow = Math.max(0.6, L * 0.03);
      // the near gunwale's forward part, from a third of the way along to the bow (the quadratic's own tail), where
      // a lantern's light catches it
      const t0 = 0.35, pt = (a, b, c) => (1 - t0) * (1 - t0) * a + 2 * t0 * (1 - t0) * b + t0 * t0 * c;
      const rim = `M${F(pt(sx, x, fx))} ${F(pt(sy, cy, fy))}Q${F((1 - t0) * x + t0 * fx)} ${F((1 - t0) * cy + t0 * fy)} ${F(fx)} ${F(fy)}`;
      const boat = `<path class="isl-vhull" d="${hull}"/><path class="isl-vhull" d="${inside}"/><path class="isl-vpshade" d="${inside}"/><path class="isl-vpshade" d="${inside}"/>`
        + `<path class="isl-vwood-f" d="${rect(xt - L * 0.035, wl - hh * 1.6, L * 0.07, hh * 0.6)}"/>`
        + `<path class="isl-vwood" d="M${F(x - L * 0.34)} ${F(wl - hh * 1.3)}L${F(x + L * 0.3)} ${F(wl - hh * 1.36)}" stroke-width="${F(ow)}"/>`
        + `<path class="isl-vwood" d="M${F(x - L * 0.36)} ${F(wl - hh * 1.3)}h${F(L * 0.13)}" stroke-width="${F(ow * 2.4)}"/>`
        + `<path class="isl-vsheer" d="${farD}" stroke-width="${F(ow)}"/><path class="isl-vsheer" d="${nearD}" stroke-width="${F(Math.max(0.8, L * 0.04))}"/>`;
      return { boat, fx, fy, rim, L };
    };
    // at Night and Dawn it rides astern, its painter slack and just clear of the water, from its bow to her stern
    {
      const d = dinghy(bx - X(0.0635), by, X(0.017)), sx2 = bx - X(0.034), sy2 = deck + 1;
      s += `<g class="isl-lq" data-q="an">${mirrored(by, d.boat, 0.15)}${d.boat}`
        + `<path class="isl-vmast" d="M${F(d.fx)} ${F(d.fy)}Q${F((d.fx + sx2) / 2)} ${F(by + Y(0.004))} ${F(sx2)} ${F(sy2)}" stroke-width=".6"/></g>`;
    }
    // by Day, at Sunset and at Dusk it is drawn up at the foot of the steps, its stem on the hill's edge (the hill
    // meets the water along (0.28, 1.03) to (0.31, 0.93)); its reflection here, under the hill, so the land covers
    // what would fall on it, and the boat itself in section 4, over the hill
    const dShore = dinghy(X(0.2876), Y(0.975), X(0.032));
    s += `<g class="isl-lq" data-q="ysd">${mirrored(Y(0.975), dShore.boat, 0.15)}</g>`;
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
    const tmw = tw2 / 5, tm = [0, 1, 2].map((i) => gx1 - tw2 + i * (tw2 - tmw) / 2);
    for (const mx of tm) gh += `M${F(mx)} ${F(lb - th)}h${F(tmw)}v${F(-Y(0.02))}h${F(-tmw)}Z`;   // and on the turret, one on each corner
    // the broken wall stepping down the slope to the left
    // (its foot buried in the hill: it had stood on a sliver of sky where the slope falls away; art-audit wave 1)
    gh += `M${F(gx0 - lw * 0.32)} ${F(lb + Y(0.03))}V${F(lb - lh * 0.3)}H${F(gx0 - lw * 0.2)}V${F(lb - lh * 0.42)}H${F(gx0 - lw * 0.08)}V${F(lb - lh * 0.55)}H${F(gx0)}V${F(lb)}Z`;
    const lookI = 4.6;   // the lookout lights after the four lanterns (lanterns.length + 0.6), its glow with it
    s += `<g class="isl-vwin isl-vlast" style="--i:${lookI};--isl-vstep:.6s">${halo(lx, lb - lh * 0.45, Y(0.24), 'islvwarm')}</g>`;
    s += `<path class="isl-vstone" d="${gh}"/>`;
    // the shaded turret face and the courses of stone
    // (only the stone: the shade had filled the gaps between the merlons, over the sky)
    const tsx = gx1 - tw2 * 0.45;
    let tsh = `M${F(tsx)} ${F(lb)}V${F(lb - th)}H${F(gx1)}V${F(lb)}Z`;
    for (const mx of tm) { const a = Math.max(mx, tsx); if (mx + tmw > a) tsh += rect(a, lb - th - Y(0.02), mx + tmw - a, Y(0.02)); }
    s += `<path class="isl-vpshade" d="${tsh}"/>`;
    let courses = '';
    // (carried up the turret and across the broken wall, which had been plain blocks beside the coursed house)
    const edgeAt = (yy) => (yy > lb - lh * 0.3 + 1 ? gx0 - lw * 0.32 : yy > lb - lh * 0.42 + 1 ? gx0 - lw * 0.2 : yy > lb - lh * 0.55 + 1 ? gx0 - lw * 0.08 : gx0);
    for (let y = lb - Y(0.02); y > lb - th + Y(0.01); y -= Y(0.022)) {
      const xa = y > lb - lh + Y(0.01) ? edgeAt(y) : gx1 - tw2;
      courses += `M${F(xa + 1)} ${F(y)}H${F(gx1 - 1)}`;
    }
    s += `<path class="isl-vcourse" d="${courses}" stroke-width=".7"/>`;
    s += `<path class="isl-vcourse" d="M${F(gx0)} ${F(mid)}H${F(gx1)}" stroke-width="1.6"/>`;
    // the openings, lit from within: three arches below, two windows above, a slit in the turret
    const archAt = (x, w, top, bot) => `M${F(x - w / 2)} ${F(bot)}V${F(top + w / 2)}A${F(w / 2)} ${F(w / 2)} 0 0 1 ${F(x + w / 2)} ${F(top + w / 2)}V${F(bot)}Z`;
    const bayW = (lw - tw2) / 3;
    let lit = '';
    for (let i = 0; i < 3; i++) lit += archAt(gx0 + bayW * (i + 0.5), bayW * 0.46, mid + Y(0.03), lb);
    for (let i = 0; i < 2; i++) { const wx = gx0 + (lw - tw2) * (0.3 + i * 0.4); lit += `M${F(wx - bayW * 0.16)} ${F(lb - lh + Y(0.045))}h${F(bayW * 0.32)}v${F(Y(0.05))}h${F(-bayW * 0.32)}Z`; }
    lit += `M${F(gx1 - tw2 * 0.725 - 1.5)} ${F(lb - th + Y(0.05))}h3v${F(Y(0.06))}h-3Z`;   // mid lit face, clear of the edge
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
    // (the body's offset copy kept short of the top's end: it had stuck out under the lookout as a wedge;
    // art-audit wave 1, 2026-10-01)
    const body = edge.concat(edge.slice().reverse().map(([ex, ey]) => [Math.min(ex + X(0.02), x1), ey + depth]));
    // The yacht's dinghy drawn up at the steps' foot by Day, at Sunset and at Dusk, while her crew is ashore
    // (lamp-steps-V2; the reason is beside the yacht in section 1): over the hill, so its stem rests on the shore,
    // and before the bottom lantern's pool, which lies over it once lit. Its painter runs slack to the lantern's
    // post, whose foot covers the knot; the lantern's light catches the gunwale on its side once it is lit.
    {
      const [px0, py0] = lanterns[0], tx = px0 - 1.1, ty = py0 - Y(0.012);
      s += `<g class="isl-lq" data-q="ysd">${dShore.boat}`
        + `<path class="isl-vmast" d="M${F(dShore.fx)} ${F(dShore.fy)}Q${F((dShore.fx + tx) / 2)} ${F(Math.max(dShore.fy, ty) + Y(0.007))} ${F(tx)} ${F(ty)}" stroke-width=".7"/>`
        + `<g class="isl-vlamps isl-vwin" style="--i:0;--isl-vstep:.6s"><g opacity=".8"><path class="isl-mlit" d="${dShore.rim}" stroke-width="${F(Math.max(0.8, dShore.L * 0.04))}"/></g></g></g>`;
    }
    // the pools of light first, so the stones sit in them
    s += lanterns.map(([lx2, ly2], i) => `<g class="isl-vwin" style="--i:${i};--isl-vstep:.6s">${pool(lx2 + X(0.02), ly2 + Y(0.01), X(0.08), Y(0.06), 0.85)}</g>`).join('');
    s += `<path class="isl-vriser" d="${poly(body)}"/>`;
    s += `<path class="isl-vstep-edge" d="${treads}" stroke-width="${F(Math.max(1.6, Y(0.008)))}"/>`;
    s += `<path class="isl-vstep-rise" d="${risers}" stroke-width="${F(Math.max(1, Y(0.004)))}"/>`;
    // a century plant on the slope, its rosette and its tall flowering stalk, and scrub by the steps
    const cpx = X(0.69), cpy = Y(0.66);   // (clear of the landing's lantern, which it had stood behind)
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
    s += shrubs(P([[0.41, 0.915], [0.49, 0.82], [0.57, 0.72], [0.76, 0.42]]).map(([ex, ey]) => [ex, ey, Y(0.036)]), r);
    // (each lantern's light on the stone it stands on, in its own turn: its pool had been drawn under the stair,
    // so only the grass beside it was lit; art-audit wave 1, 2026-10-01)
    s += lanterns.map(([lx2, ly2], i) => `<g class="isl-vwin" style="--i:${i};--isl-vstep:.6s">${pool(lx2, ly2 + Y(0.006), X(0.05), Y(0.016), 0.6)}</g>`).join('');
    // 5. The lanterns: a post, a glazed lantern with its cap, a halo; the top one in the page's hue,
    //    and the last to light.
    lanterns.forEach(([lx2, ly2], i) => {
      const top = i === lanterns.length - 1, ph = Y(0.1), lw2 = X(0.009), lh2 = Y(0.03);
      s += `<path class="isl-vpost" d="M${F(lx2 - 1.1)} ${F(ly2)}V${F(ly2 - ph)}H${F(lx2 + 1.1)}V${F(ly2)}Z"/>`;
      s += `<g class="isl-vwin" style="--i:${i};--isl-vstep:.6s">`
        + halo(lx2, ly2 - ph - lh2 / 2, Y(top ? 0.1 : 0.085), top ? 'islvlamp' : 'islvbulb')
        + `<path class="${top ? 'isl-vlamp' : 'f-pulse'} isl-ltframe" d="M${F(lx2 - lw2)} ${F(ly2 - ph)}V${F(ly2 - ph - lh2)}H${F(lx2 + lw2)}V${F(ly2 - ph)}Z"/></g>`
        + panes(lx2 - lw2, ly2 - ph - lh2, 2 * lw2, lh2);
      s += `<path class="isl-vpost isl-lcap" d="M${F(lx2 - lw2 * 1.5)} ${F(ly2 - ph - lh2)}L${F(lx2)} ${F(ly2 - ph - lh2 - Y(0.014))}L${F(lx2 + lw2 * 1.5)} ${F(ly2 - ph - lh2)}Z"/>`;
    });
    s += `<path class="f-pulse isl-vwin isl-vlast" style="--i:${lookI};--isl-vstep:.6s" d="${lookoutLit}"/>`;
    // The lookout by the hour (art-audit wave 1, by version; the owner, 2026-10-01): people climb to a lookout to
    // watch the sunset and go home after dark. One early walker at Dawn; two visitors by Day before the middle
    // arch, one pointing out to sea; four at Sunset, dark against the lit arches; no one at Dusk or Night.
    {
      const ph = Y(0.052), at = (k) => gx0 + bayW * k;
      const P2 = (x, o) => person(x, lb, ph, o);
      s += `<g class="isl-bfig"><g class="isl-lq" data-q="a">${P2(at(0.5), { shirt: '#c9b79a' })}</g>`
        + `<g class="isl-lq" data-q="y">${P2(at(1.3), { shirt: '#e8e2d4', reach: [at(1.3) - ph * 0.42, lb - ph * 0.86] })}${P2(at(1.68), { shirt: '#9ec0d6', legs: '#5a5148' })}</g>`
        + `<g class="isl-lq" data-q="s">${P2(at(0.32), { shirt: '#7d4a52' })}${P2(at(0.7), { shirt: '#3d6466' })}${P2(at(1.45), { shirt: '#b8573f' })}${P2(at(2.2), { shirt: '#5c5e3e' })}</g></g>`;
    }
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
  // Lights as points: ashore in tungsten (s-vlight), and on a boat (a point marked 'b') in a cool white
  // (s-vcool), as a modern yacht's or ship's anchor and masthead lights are LED (art audit, 2026-10-01:
  // the set had one light temperature; the second is the one true to the place).
  const lightsPaths = (pts, i = 0, w = 1.4) => {
    const shore = pts.filter((p) => p[2] !== 'b'), boat = pts.filter((p) => p[2] === 'b');
    return (shore.length ? `<path class="s-vlight isl-vwin" style="--i:${i}" d="${lightsD(shore)}" stroke-width="${w}"/>` : '')
      + (boat.length ? `<path class="s-vcool isl-vwin" style="--i:${i}" d="${lightsD(boat)}" stroke-width="${w}"/>` : '');
  };

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
      lights.push([bx, by - mh, 'b']);
      s += dashes(streakList(bx, by + 1, H, r, 0.05, 0.06), 's-vcoolglow', 1, [0.08, 0.16, 0.3]);
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
    s += `<g class="isl-vwin" style="--i:2">${halo(X(0.96), Y(0.46), Y(0.34), 'islvwarm')}${pool(gx0 + (gx1 - gx0) * 0.55, gBase + Y(0.015), Y(0.1), Y(0.025), 0.6)}</g>`;
    s += `<path d="M${F(gx0)} ${F(gBase)}V${F(gTop)}H${F(gx1)}V${F(gBase)}Z" fill="url(#islvfacade)"/>`;
    s += `<path class="isl-vwood-f" d="M${F(gx0 - Y(0.02))} ${F(gTop + 1)}L${F(gx0 + (gx1 - gx0) * 0.3)} ${F(gTop - Y(0.09))}H${F(gx1 + Y(0.1))}L${F(gx1 + Y(0.12))} ${F(gTop + 1)}Z"/>`;
    // its roof's courses of shingle, and the eave's shadow on the wall under it
    let shg = '';
    for (let k = 1; k <= 3; k++) {
      const tt = k / 4, sy = gTop + 1 - tt * (Y(0.09) + 1), sxl = (gx0 - Y(0.02)) + tt * ((gx0 + (gx1 - gx0) * 0.3) - (gx0 - Y(0.02)));
      shg += `M${F(sxl)} ${F(sy)}H${F(gx1 + Y(0.1))}`;
    }
    s += `<path class="isl-vcourse" d="${shg}" stroke-width=".7"/><path class="isl-vpshade" d="${rect(gx0, gTop + 1, X(1.03) - gx0, Y(0.03))}"/>`;
    // (its stone in running bond and quoins up its corner: with full-width lines only it had read as
    // weatherboard; the door and window, drawn after, cover the joints behind them)
    let gc = '', gq = '';
    for (let y = gBase - Y(0.03); y > gTop + Y(0.01); y -= Y(0.03)) gc += `M${F(gx0)} ${F(y)}H${F(gx1)}`;
    for (let y = gBase, j = 0; y - Y(0.03) > gTop + Y(0.005); y -= Y(0.03), j++) {
      for (let x = gx0 + Y(0.06) - (j % 2) * Y(0.03); x < W; x += Y(0.06)) gc += `M${F(x)} ${F(y - Y(0.03))}v${F(Y(0.03))}`;
      gq += rect(gx0, y - Y(0.03) + 0.6, Y(j % 2 ? 0.014 : 0.022), Y(0.03) - 1.2);
    }
    s += `<path class="isl-vcourse" d="${gc}" stroke-width=".7"/><path class="isl-vstone" d="${gq}" fill-opacity=".45"/>`;
    const dw = Y(0.05), dx = gx0 + (gx1 - gx0) * 0.55;
    s += `<path class="f-pulse isl-vwin" style="--i:2" d="M${F(dx - dw / 2)} ${F(gBase)}V${F(gBase - Y(0.1))}a${F(dw / 2)} ${F(dw / 2)} 0 0 1 ${F(dw)} 0V${F(gBase)}ZM${F(gx0 + Y(0.035))} ${F(gTop + Y(0.06))}h${F(Y(0.03))}v${F(Y(0.04))}h${F(-Y(0.03))}Z"/>`;
    // The lookout's people (art-audit pass 4, 2026-10-01: the telescope stood ready and no one ever came). side():
    // someone seen from the side, facing left (to the bay, the sunset, the eyepiece), feet at (x, fy), h tall, in
    // literal colours the piece dims by version (isl-bfig, as the bell tower's reader); `lean` tips the body forward
    // from the hips and `nod` tips the head back (radians); `hand` is the point the near hand goes to, bending the arm
    // at an elbow that falls down and back (else the arm hangs). It returns the drawing, the eye, and the front edge of
    // the head and chest for a rim of light. No faces in detail: the face is a disc of skin, the hair behind and above.
    const side = (x, fy, h, { shirt, legs = '#2f3a4a', skin = '#6b4630', hair = '#1d1916', lean = 0, nod = 0, hand = null }) => {
      const turn = (o, a, px, py) => [o[0] + (px * Math.cos(a) + py * Math.sin(a)) * h, o[1] + (py * Math.cos(a) - px * Math.sin(a)) * h];
      const hip = [x, fy - h * 0.5], T = (px, py) => turn(hip, lean, px, py), nk = T(0.005, -0.335), Hd = (px, py) => turn(nk, lean - nod, px, py);
      let o = `<path fill="${legs}" d="${polyD([[-0.065, 0], [-0.05, 0.24], [-0.045, 0.47], [0.035, 0.47], [0.05, 0.24], [0.075, 0]].map(([px, py]) => [x + px * h, hip[1] + py * h]))}"/>`;
      o += `<path fill="#3a2e24" d="${polyD([[x + h * 0.04, fy - h * 0.03], [x + h * 0.04, fy], [x - h * 0.11, fy], [x - h * 0.1, fy - h * 0.025]])}"/>`;   // the shoe, its toe forward
      o += `<path fill="${skin}" d="${polyD([T(-0.02, -0.3), T(-0.015, -0.36), T(0.025, -0.36), T(0.03, -0.3)])}"/>`;   // the neck
      const chest = [T(-0.07, 0.02), T(-0.075, -0.12), T(-0.085, -0.24), T(-0.06, -0.31)];
      o += `<path fill="${shirt}" d="${polyD([...chest, T(0, -0.335), T(0.06, -0.31), T(0.07, -0.2), T(0.065, -0.08), T(0.08, 0.02)])}"/>`;
      const hc = Hd(-0.012, -0.075), fc = Hd(-0.03, -0.068);
      o += `<circle fill="${hair}" cx="${F(hc[0])}" cy="${F(hc[1])}" r="${F(h * 0.072)}"/><circle fill="${skin}" cx="${F(fc[0])}" cy="${F(fc[1])}" r="${F(h * 0.052)}"/>`;
      const sp = T(0, -0.285), ua = h * 0.17, fa = h * 0.16, want = hand || [sp[0] - h * 0.01, sp[1] + h * 0.31];
      const dd = Math.min(Math.max(Math.hypot(want[0] - sp[0], want[1] - sp[1]), h * 0.05), (ua + fa) * 0.995), a0 = Math.atan2(want[1] - sp[1], want[0] - sp[0]);
      const al = Math.acos(Math.min(1, Math.max(-1, (ua * ua + dd * dd - fa * fa) / (2 * ua * dd))));
      const [ea, eb] = [a0 + al, a0 - al].map((a) => [sp[0] + ua * Math.cos(a), sp[1] + ua * Math.sin(a)]), el = ea[1] + ea[0] * 0.5 > eb[1] + eb[0] * 0.5 ? ea : eb;
      const hn = [sp[0] + dd * Math.cos(a0), sp[1] + dd * Math.sin(a0)];
      o += `<path fill="none" stroke="${shirt}" stroke-width="${F(h * 0.065)}" stroke-linecap="round" stroke-linejoin="round" d="${lineD([sp, el, hn])}"/><circle fill="${skin}" cx="${F(hn[0])}" cy="${F(hn[1])}" r="${F(h * 0.03)}"/>`;
      const brow = [235, 205, 180, 155, 135].map((dg) => Hd(-0.012 + 0.072 * Math.cos(dg * Math.PI / 180), -0.075 + 0.072 * Math.sin(dg * Math.PI / 180)));
      return { d: o, eye: Hd(-0.072, -0.087), rim: lineD(brow) + lineD(chest.slice().reverse()) };
    };
    // 5. The telescope on its tripod, trained on the sky (a telescope aimed level at a low Moon reads
    //    as pointing at the harbour, so it looks up and to the left, toward the Moon's side of the sky).
    const moonAt = [v.x((SKY.d.moon[0] + SKY.n.moon[0]) / 2), v.y((SKY.d.moon[1] + SKY.n.moon[1]) / 2)];
    const tx = X(0.8), ty = Y(0.33), footY = Y(0.56), len = Y(0.34), d0 = Y(0.038), d1 = Y(0.024);
    let ang = Math.atan2(moonAt[1] - ty, moonAt[0] - tx);
    if (!(ang < -0.2 && ang > -2.9)) ang = -2.5;
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
    const fx = tx + ux * len * 0.62, fy = ty + uy * len * 0.62, bx2 = tx - ux * len * 0.38, by2 = ty - uy * len * 0.38;
    // Someone at the eyepiece after dark (art-audit pass 4, 2026-10-01; by version: stargazers come out once it is
    // dark, so at Dusk and Night only, and by Day and at Dawn the telescope stands alone). Drawn before the telescope,
    // so the eyepiece crosses the face, and before the wall, which hides the legs as it hides the tripod's feet:
    // leaning in, the head tipped back along the tube, the eye just past the eyepiece's end and the near hand up at
    // its barrel. No taller than the guardhouse's door (the eyepiece is at the door's height, so the feet stand on a
    // low step, behind the wall). The lantern's warm light catches the face and chest on its side (isl-mlit, lit with
    // the lantern in the one pass), as it does the bell tower's reader.
    {
      const ew = Math.max(2, Y(0.02)), tip = [bx2 - ux * Y(0.03), by2 - uy * Y(0.03)];
      const eye = [tip[0] - ux * (ew / 2 + 0.6), tip[1] - uy * (ew / 2 + 0.6)];
      // (hair a shade lighter than the default near-black: dimmed for Night, the head had gone into the sky)
      const gaze = { shirt: '#d6cfbf', legs: '#2f3a4a', skin: '#8d5a3b', hair: '#3a2e26', lean: 0.22, nod: 0.85, hand: [bx2 - ux * Y(0.022) - nx * ew * 0.45, by2 - uy * Y(0.022) - ny * ew * 0.45] };
      const k = side(0, 0, Y(0.12), gaze).eye, who = side(eye[0] - k[0], Math.min(footY, eye[1] - k[1]), Y(0.12), gaze);
      s += `<g class="isl-lq" data-q="dn"><g class="isl-bfig">${who.d}</g><g class="isl-vlamps isl-vwin" style="--i:4"><g opacity=".6"><path class="isl-mlit" d="${who.rim}" stroke-width="${F(Math.max(0.7, Y(0.003)))}"/></g></g></g>`;
    }
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
    // (the objective's glass in the dew shield's mouth, seen nearly edge-on: a disc off its end read as a small Moon)
    const lcx = fx + ux * Y(0.01), lcy = fy + uy * Y(0.01);
    s += `<ellipse class="isl-vlens" cx="${F(lcx)}" cy="${F(lcy)}" rx="${F(Math.max(1, d0 * 0.3))}" ry="${F(d0)}" transform="rotate(${F(ang * 180 / Math.PI)} ${F(lcx)} ${F(lcy)})"/>`;
    // 6. The low wall along the lookout's edge, in front of the tripod's feet: coursed stone under a
    //    coping that catches the light, its foot following the crest.
    const wx0 = X(0.685), wx1 = X(0.905), wTop = Y(0.5);
    const lx = wx0 + Y(0.02), ly = wTop;   // (the lantern's post, drawn in 7; here so the visitors below keep clear of it)
    const foot = crest.filter(([x]) => x > wx0 && x < wx1).map(([x, y]) => [x, y + Y(0.03)]);
    const wallPts = [[wx0, wTop], [wx1, wTop], [wx1, Y(0.585)], ...foot.reverse(), [wx0, Y(0.61)]];
    // The lookout's visitors through the day (art-audit pass 4, 2026-10-01; by version: people walk early before the
    // heat, look at the bay by day and gather at a lookout for the sunset; after dark only the stargazer above is
    // there). At Dawn an early walker going up the footpath, seen from behind in mid-stride: the leading foot set
    // down a stride further up the path, so higher, the trailing heel lifted to show its sole, the near arm swung
    // forward (so shorter) and the other back. By Day one visitor leaning on the coping just left of the tripod's
    // left leg, a hand braced on the stone, looking down at the bay. At Sunset two at the wall between the lantern and that
    // leg, facing the setting Sun, the wall hiding them below the waist, their sunward edges rimmed by the low light
    // (s-rim). Sized as the stargazer, the walker larger as nearer; all drawn before the wall.
    {
      const wx = X(0.671), wf = Y(0.81), wh = Y(0.15), ws = wh * 0.13, wt = wf - wh, whr = wh * 0.075;
      let walk = `<path fill="#3b4049" d="${polyD([[wx - ws * 0.8, wt + wh * 0.5], [wx - ws * 0.62, wf - wh * 0.11], [wx - ws * 0.1, wf - wh * 0.11], [wx + ws * 0.05, wt + wh * 0.5]])}`
        + `${polyD([[wx - ws * 0.02, wt + wh * 0.5], [wx + ws * 0.18, wf - wh * 0.025], [wx + ws * 0.78, wf - wh * 0.025], [wx + ws * 0.8, wt + wh * 0.5]])}"/>`;   // the legs
      walk += `<path fill="#3a2e24" d="${rect(wx - ws * 0.66, wf - wh * 0.125, ws * 0.62, wh * 0.03)}${rect(wx + ws * 0.15, wf - wh * 0.04, ws * 0.66, wh * 0.03)}"/>`   // the shoes
        + `<path fill="#cfc6b6" d="${rect(wx + ws * 0.18, wf - wh * 0.014, ws * 0.6, wh * 0.018)}"/>`;   // the lifted heel's sole
      walk += `<path fill="#c97b63" d="M${F(wx - ws * 0.82)} ${F(wt + wh * 0.53)}L${F(wx - ws)} ${F(wt + wh * 0.22)}Q${F(wx - ws)} ${F(wt + wh * 0.16)} ${F(wx - ws * 0.6)} ${F(wt + wh * 0.15)}H${F(wx + ws * 0.6)}Q${F(wx + ws)} ${F(wt + wh * 0.16)} ${F(wx + ws)} ${F(wt + wh * 0.22)}L${F(wx + ws * 0.82)} ${F(wt + wh * 0.53)}Z`
        + `${rect(wx - ws * 1.05, wt + wh * 0.2, ws * 0.24, wh * 0.21)}M${F(wx + ws * 0.8)} ${F(wt + wh * 0.19)}L${F(wx + ws * 1.04)} ${F(wt + wh * 0.2)}L${F(wx + ws * 1.3)} ${F(wt + wh * 0.47)}L${F(wx + ws * 1.08)} ${F(wt + wh * 0.49)}Z"/>`;   // the shirt and the swinging arms
      walk += `<path fill="#5a3825" d="${rect(wx - ws * 1.02, wt + wh * 0.39, ws * 0.18, wh * 0.05)}${rect(wx + ws * 1.08, wt + wh * 0.46, ws * 0.2, wh * 0.06)}${rect(wx - whr * 0.45, wt + whr * 1.6, whr * 0.9, wh * 0.07)}"/>`   // hands, neck
        + `<circle fill="#1d1916" cx="${F(wx)}" cy="${F(wt + whr)}" r="${F(whr)}"/>`;   // the head, from behind
      const legX = (y) => tx - Y(0.12) * (y - ty - Y(0.02)) / (footY - ty - Y(0.02)), lg = legX(wTop);   // the tripod's left leg, where it crosses y
      const byDay = side(lg - Y(0.04), footY, Y(0.12), { shirt: '#b8573f', skin: '#5a3825', lean: 0.26, nod: -0.3, hand: [lg - Y(0.04) - Y(0.036), wTop - Y(0.004)] });
      const mid = (lx + lg) / 2, p1 = side(mid - Y(0.016), footY, Y(0.118), { shirt: '#e8e2d4', skin: '#c89b78', hair: '#3a2a20' }), p2 = side(mid + Y(0.016), footY, Y(0.11), { shirt: '#3d6466', skin: '#6b4630' });
      s += `<g class="isl-bfig"><g class="isl-lq" data-q="a">${walk}</g><g class="isl-lq" data-q="y">${byDay.d}</g><g class="isl-lq" data-q="s">${p2.d}${p1.d}</g></g>`
        + `<g class="isl-lq" data-q="s"><path class="s-rim" d="${p1.rim}${p2.rim}" stroke-width="${F(Math.max(0.7, Y(0.003)))}" stroke-opacity=".7"/></g>`;
    }
    s += `<path d="${polyD(wallPts)}" fill="url(#islvfacade)"/><path class="isl-vpshade" d="${polyD(wallPts)}"/>`;
    s += `<path class="isl-vstone" d="M${F(wx0 - Y(0.008))} ${F(wTop + Y(0.018))}V${F(wTop)}H${F(wx1)}V${F(wTop + Y(0.018))}Z"/>`;
    let wj = `M${F(wx0)} ${F(wTop + Y(0.045))}H${F(wx1)}`;
    // (two rows in a true bond, none past the wall's ends: in one row the joints had come in pairs, and at 1440
    // the last one stood on the guardhouse)
    for (let row = 0; row < 2; row++) {
      for (let x = wx0 + Y(0.05) - row * Y(0.025); x < wx1 - 1; x += Y(0.05)) if (x > wx0 + 1) wj += `M${F(x)} ${F(wTop + Y(row ? 0.045 : 0.018))}v${F(Y(row ? 0.035 : 0.027))}`;
    }
    s += `<path class="isl-vcourse" d="${wj}" stroke-width=".7"/>`;
    // 7. The lantern at the wall's end, over the path, in the page's hue: its pool, halo, and last.
    s += `<g class="isl-vwin isl-vlast" style="--i:4">${pool(lx + Y(0.02), Y(0.62), Y(0.2), Y(0.06), 0.7)}${halo(lx, ly - Y(0.1), Y(0.17), 'islvlamp')}`
      + `<path class="isl-vlamp isl-ltframe" d="M${F(lx - Y(0.014))} ${F(ly - Y(0.07))}V${F(ly - Y(0.13))}H${F(lx + Y(0.014))}V${F(ly - Y(0.07))}Z"/></g>`
      + panes(lx - Y(0.014), ly - Y(0.13), Y(0.028), Y(0.06));
    s += `<path class="isl-vpost" d="M${F(lx - 1)} ${F(ly)}V${F(ly - Y(0.07))}H${F(lx + 1)}V${F(ly)}Z"/><path class="isl-vpost isl-lcap" d="M${F(lx - Y(0.022))} ${F(ly - Y(0.13))}L${F(lx)} ${F(ly - Y(0.155))}L${F(lx + Y(0.022))} ${F(ly - Y(0.13))}Z"/>`;
    s += lightsPaths(lights);
    return s;
  }

  /* BETTY'S HOPE (the Tools & Prompts landing's head; the owner chose it, 2026-09-28): the restored
     sugar mill at Betty's Hope, a tool that turns wind into work, from the references studied (the art's
     source folder README lists them): a tapered tower of coursed stone with an arched door, a boxy
     wooden cap, four lattice sails and the long tail pole that turns the cap into the wind; its
     roofless twin beside it; the estate's stone house with lit windows; cane drying racks; the fields
     and far hills. By Day a guide at the tail pole's wheel and two visitors on the track, who walk back
     down it at Sunset (art-audit pass 4, 2026-10-01). In the one pass the sails turn a quarter as the lights come on, then rest; the lamp
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
    s += `<path class="isl-vpshade" d="M${F(hx0)} ${F(hTop + 1)}H${F(hx0 + hw)}v${F(Y(0.016))}H${F(hx0)}Z"/>`;   // the eaves' shadow
    let wins = '';
    for (let i = 0; i < 5; i++) {
      const wx = hx0 + hw * (0.12 + i * 0.19);
      wins += i === 2 ? `M${F(wx - Y(0.018))} ${F(hBot)}V${F(hTop + Y(0.04))}h${F(Y(0.036))}V${F(hBot)}Z` : `M${F(wx - Y(0.014))} ${F(hTop + Y(0.035))}h${F(Y(0.028))}v${F(Y(0.05))}h${F(-Y(0.028))}Z`;
    }
    s += `<path class="f-pulse isl-vwin" style="--i:1" d="${wins}"/>`;
    s += `<g class="isl-vwin" style="--i:1">${halo(hx0 + hw * 0.5, hTop + Y(0.07), Y(0.25), 'islvwarm')}${pool(hx0 + hw * 0.5, hBot + Y(0.02), Y(0.13), Y(0.035), 0.6)}</g>`;
    // 3b. The boiling house, roofless: a stone wall with a broken gable and three arched openings, the
    //     fields seen through them.
    const bx0 = X(0.3), bx1 = X(0.43), bTop = Y(0.64), bBase = Y(0.748), bwid = bx1 - bx0;
    // (the broken top stands a little higher and the arches a little lower, so stone runs over every arch:
    // their crowns had broken through it as little domes; review, 2026-09-30)
    let ruin = `M${F(bx0)} ${F(bBase)}V${F(bTop)}L${F(bx0 + bwid * 0.14)} ${F(Y(0.545))}L${F(bx0 + bwid * 0.26)} ${F(Y(0.585))}`;
    for (let i = 3; i <= 10; i++) ruin += `L${F(bx0 + bwid * i / 10)} ${F(bTop - Y(0.03) + r() * Y(0.03))}`;
    ruin += `V${F(bBase)}Z`;
    const ar = bwid * 0.065, spring = bBase - Y(0.04), acx = [0, 1, 2].map((i) => bx0 + bwid * (0.24 + i * 0.26));
    for (const cx of acx) ruin += `M${F(cx - ar)} ${F(bBase)}V${F(spring)}A${F(ar)} ${F(ar)} 0 0 1 ${F(cx + ar)} ${F(spring)}V${F(bBase)}Z`;
    s += `<path d="${ruin}" fill="url(#islvfacade)" fill-rule="evenodd"/>`;
    // the courses of stone, broken at the openings (they had run across the fields seen through them)
    let rc = '';
    for (let y = bBase - Y(0.025); y > bTop; y -= Y(0.025)) {
      const half = y >= spring ? ar : y > spring - ar ? Math.sqrt(ar * ar - (spring - y) * (spring - y)) : 0;
      let x = bx0;
      for (const cx of acx) { if (half > 0) { rc += `M${F(x)} ${F(y)}H${F(cx - half)}`; x = cx + half; } }
      rc += `M${F(x)} ${F(y)}H${F(bx1)}`;
    }
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
    s += `<path class="isl-vpshade" d="M${F(X(0.5) + Y(0.02))} ${F(Y(0.745))}L${F(X(0.5) + Y(0.02))} ${F(twin.top + Y(0.003))}L${F(X(0.5) + Y(0.054))} ${F(twin.top - Y(0.008))}L${F(X(0.5) + Y(0.09))} ${F(twin.top)}L${F(X(0.5) + Y(0.13))} ${F(Y(0.745))}Z"/>`;
    // its opening in the middle of its lit face, left of the edge where the shaded face turns away
    // (owner, 2026-09-30: a door on that edge did not match the drawing's corner)
    s += `<path class="isl-vdark" d="M${F(X(0.5) - Y(0.088))} ${F(Y(0.745))}V${F(Y(0.66))}a${F(Y(0.035))} ${F(Y(0.035))} 0 0 1 ${F(Y(0.07))} 0V${F(Y(0.745))}Z"/>`;
    // 5. The restored mill: tower, cap, tail pole, the lit door; the sails in their own group.
    const mx = X(0.74), mb = Y(0.75), mh = Y(0.42), mwb = Y(0.28), mwt = Y(0.19);
    const mill = tower(mx, mb, mh, mwb, mwt, false);
    const capY = mill.top, capW = mwt * 1.25, capH = Y(0.07);
    s += `<path class="isl-vwood" d="M${F(mx + capW * 0.3)} ${F(capY - capH * 0.4)}L${F(mx + capW * 0.3 + Y(0.26))} ${F(mb - Y(0.01))}" stroke-width="${F(Math.max(1.4, Y(0.012)))}"/>`;
    // the cart wheel at the tail pole's foot, by which the cap is turned into the wind
    s += `<circle class="isl-vwood" cx="${F(mx + capW * 0.3 + Y(0.26))}" cy="${F(mb - Y(0.03))}" r="${F(Y(0.028))}" stroke-width="1"/>`;
    s += `<path class="isl-vstone" d="${mill.d}"/><path class="isl-vcourse" d="${mill.c}" stroke-width=".6"/>`;
    s += `<path class="isl-vpshade" d="M${F(mx + Y(0.03))} ${F(mb)}L${F(mx + Y(0.025))} ${F(capY)}L${F(mx + mwt / 2)} ${F(capY)}L${F(mx + mwb / 2)} ${F(mb)}Z"/>`;
    s += `<path class="isl-vpshade" d="M${F(mx - mwt / 2)} ${F(capY + 1)}h${F(mwt)}v${F(Y(0.016))}h${F(-mwt)}Z"/>`;   // the cap's shadow
    s += `<path class="isl-vwood-f" d="M${F(mx - capW / 2)} ${F(capY + 1)}V${F(capY - capH)}H${F(mx + capW / 2)}V${F(capY + 1)}Z"/>`;
    s += `<path class="isl-vwood-f" d="M${F(mx - capW / 2 - Y(0.01))} ${F(capY - capH + 1)}L${F(mx - capW * 0.3)} ${F(capY - capH - Y(0.035))}H${F(mx + capW * 0.3)}L${F(mx + capW / 2 + Y(0.01))} ${F(capY - capH + 1)}Z"/>`;
    // the cap turns the corner with the tower: its side in the same shade, and the hip end of its roof
    // (owner's Court House corner, 2026-09-30; review)
    s += `<path class="isl-vpshade" d="M${F(mx + Y(0.025))} ${F(capY + 1)}V${F(capY - capH)}H${F(mx + capW / 2)}V${F(capY + 1)}Z`
      + `M${F(mx + Y(0.025))} ${F(capY - capH + 1)}L${F(mx + capW * 0.3)} ${F(capY - capH - Y(0.035))}L${F(mx + capW / 2 + Y(0.01))} ${F(capY - capH + 1)}Z"/>`;
    s += `<path class="isl-vwood" d="M${F(mx - capW / 2)} ${F(capY - capH * 0.5)}H${F(mx + capW / 2)}M${F(mx - capW * 0.3)} ${F(capY - capH - Y(0.02))}H${F(mx + capW * 0.3)}" stroke-width=".7"/>`;
    // the door, lit, in the middle of the lit face (as the twin's opening); its light on the ground; the
    // lamp beside it (last to light)
    const dcx = mx - Y(0.052);
    const door = `M${F(dcx - Y(0.035))} ${F(mb)}V${F(mb - Y(0.1))}a${F(Y(0.035))} ${F(Y(0.035))} 0 0 1 ${F(Y(0.07))} 0V${F(mb)}Z`;
    s += `<path class="f-pulse isl-vwin" style="--i:2" d="${door}"/>`;
    s += `<g class="isl-vwin" style="--i:2">${pool(dcx, mb + Y(0.02), Y(0.22), Y(0.05), 0.75)}</g>`;
    const lx = mx - mwb / 2 - Y(0.06);
    s += `<path class="isl-vpost" d="M${F(lx - 1)} ${F(mb + Y(0.01))}V${F(mb - Y(0.14))}H${F(lx + 1)}V${F(mb + Y(0.01))}Z"/>`;
    s += `<g class="isl-vwin isl-vlast" style="--i:4">${pool(lx, mb + Y(0.015), Y(0.1), Y(0.03), 0.6)}${halo(lx, mb - Y(0.155), Y(0.13), 'islvlamp')}<path class="isl-vlamp isl-ltframe" d="M${F(lx - Y(0.011))} ${F(mb - Y(0.14))}V${F(mb - Y(0.175))}H${F(lx + Y(0.011))}V${F(mb - Y(0.14))}Z"/></g>`;
    s += `<path class="isl-vpost isl-lcap" d="M${F(lx - Y(0.018))} ${F(mb - Y(0.175))}L${F(lx)} ${F(mb - Y(0.197))}L${F(lx + Y(0.018))} ${F(mb - Y(0.175))}Z"/>`   // its cap
      + panes(lx - Y(0.011), mb - Y(0.175), Y(0.022), Y(0.035));
    // cane drying racks by the mill, beyond the tail pole's wheel (they had tangled with it)
    let racks = '';
    for (let i = 0; i < 3; i++) {
      const rx0 = mx + capW * 0.3 + Y(0.26) + Y(0.05) + i * Y(0.1), ry = mb - Y(0.02) + i * Y(0.004);
      racks += `M${F(rx0)} ${F(ry)}h${F(Y(0.085))}M${F(rx0)} ${F(ry - Y(0.02))}h${F(Y(0.085))}M${F(rx0 + Y(0.01))} ${F(ry + Y(0.005))}v${F(-Y(0.03))}M${F(rx0 + Y(0.075))} ${F(ry + Y(0.005))}v${F(-Y(0.03))}`;
    }
    s += `<path class="isl-vwood" d="${racks}" stroke-width="1"/>`;
    // People at the estate (art-audit pass 4, 2026-10-01: no one was there in any version). tall(): a standing
    // adult's height where their feet are, the head just under the horizon, as for a viewer standing in the
    // field; by the mill that is about seven tenths of its door (a door of about 2.4 m), and on the track,
    // nearer us, more (about 15 px by the mill and 22 to 28 px on the track at 1920). Drawn with person() in
    // literal colours the piece dims by version (isl-bfig), and with no draws, so nothing else moves.
    const tall = (fy) => (fy - y0) * 0.88;
    // The guide at the tail pole (by version: the heritage site is open by day, so the guide is there by Day
    // only): beside the wheel by which the cap is turned, a hand on its rim, so the tool is seen being worked,
    // and turned to the visitors on the track. On the wheel's far side from the pole, which crosses every
    // place in front of the wheel at chest or head height (there it ran into the guide's shoulder), and in
    // front of the first cane rack, whose rails show behind the legs. Mirrored, so the reaching hand is the
    // one nearer the wheel.
    {
      const wx = mx + capW * 0.3 + Y(0.26), wy = mb - Y(0.03), wr = Y(0.028), gf = mb + Y(0.004), gx = wx + Y(0.048), a = -0.5;
      s += `<g class="isl-lq" data-q="y"><g transform="translate(${F(gx)} ${F(gf)}) scale(-1 1)"><g class="isl-bfig">`
        + `${person(0, 0, tall(gf), { shirt: '#e8e2d4', legs: '#3a3f4a', skin: '#5a3825', hair: '#121010', front: true, reach: [gx - wx - wr * Math.cos(a), wy + wr * Math.sin(a) - gf] })}</g></g></g>`;
    }
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
    // the dirt track from the foreground to the mill's door, and grass tufts (its two edges named, as cubic
    // curves, so the visitors below can stand on it at any card's shape; the path drawn is unchanged)
    const trackL = [[X(0.46), H + 2], [X(0.55), Y(0.9)], [dcx - Y(0.3), Y(0.8)], [dcx - Y(0.03), mb + 1]];
    const trackR = [[dcx + Y(0.03), mb + 1], [dcx - Y(0.2), Y(0.82)], [X(0.62), Y(0.92)], [X(0.56), H + 2]];
    const tp = ([x, y]) => `${F(x)} ${F(y)}`;
    s += `<path class="isl-vtrack" d="M${tp(trackL[0])}C${trackL.slice(1).map(tp).join(' ')}L${tp(trackR[0])}C${trackR.slice(1).map(tp).join(' ')}Z"/>`;
    let tufts = '';
    for (let i = 0; i < 60; i++) { const gx = X(r()), gy = Y(0.8 + r() * 0.2), gh = Y(0.02 + r() * 0.03); tufts += `M${F(gx)} ${F(gy)}l${F(-gh * 0.3)} ${F(-gh)}M${F(gx)} ${F(gy)}l${F(gh * 0.05)} ${F(-gh * 1.2)}M${F(gx)} ${F(gy)}l${F(gh * 0.35)} ${F(-gh * 0.9)}`; }
    s += `<path class="isl-vcane" d="${tufts}" stroke-width=".8"/>`;
    // Visitors on the track (by version: the heritage site is open by day and its last visitors leave as the
    // Sun sets, so no one is there at Dawn, Dusk or Night). By Day two walk up toward the mill, seen from behind,
    // one a step ahead; at Sunset the same two come back down toward us, facing us with the low Sun behind them,
    // its warm light on their sunward (left) edges (s-rim, outside the dimming). onTrack(fy, k): the point a share
    // k across the track where it crosses fy (each edge runs one way in y, so halving its curve's t finds it).
    // After the tufts, so they stand on the grass; sized by tall(), so about 20 px and more at 1920.
    {
      const onTrack = (fy, k) => {
        const at = (E) => {
          const c = (t, i) => { const u = 1 - t; return u * u * u * E[0][i] + 3 * u * u * t * E[1][i] + 3 * u * t * t * E[2][i] + t * t * t * E[3][i]; };
          const rises = E[0][1] > E[3][1];
          let lo = 0, hi = 1;
          for (let n = 0; n < 40; n++) { const m = (lo + hi) / 2; if ((c(m, 1) > fy) === rises) lo = m; else hi = m; }
          return c((lo + hi) / 2, 0);
        };
        const a = at(trackL), b = at(trackR);
        return a + (b - a) * k;
      };
      const pair = [{ shirt: '#c96f4a', legs: '#3b4a5c', skin: '#c89b78', hair: '#4a3426' }, { shirt: '#9fbad0', legs: '#b9a882', skin: '#8d5a3b', hair: '#1d1916' }];
      const fig = (fy, k, h, o, front) => { const x = onTrack(fy, k); return { x, fy, h, d: person(x, fy, h, { ...o, front }) }; };
      const up = [fig(Y(0.812), 0.56, tall(Y(0.812)), pair[0], false), fig(Y(0.83), 0.36, tall(Y(0.83)) * 0.94, pair[1], false)];
      const down = [fig(Y(0.852), 0.7, tall(Y(0.852)), pair[0], true), fig(Y(0.862), 0.38, tall(Y(0.862)) * 0.94, pair[1], true)];
      // the low Sun's rim on each (person()'s own proportions): round the head's sunward side, over the
      // shoulder and down the outer arm, set half its width inside the edge (centred on it, it stood off the
      // head like a halo)
      const rw = Math.max(0.7, Y(0.004));
      let rim = '';
      for (const { x, fy, h } of down) {
        const sw = h * 0.13, hr = h * 0.075, ft = fy - h, hy = ft + hr, ri = hr - rw / 2, ax = x - sw * 1.05 + rw / 2;
        rim += lineD([-100, -125, -150, -175, 160].map((dg) => [x + ri * Math.cos(dg * Math.PI / 180), hy + ri * Math.sin(dg * Math.PI / 180)]))
          + lineD([[x - sw * 0.55, ft + h * 0.15 + rw / 2], [x - sw * 0.9, ft + h * 0.165 + rw / 2], [ax, ft + h * 0.21], [ax, ft + h * 0.46]]);
      }
      s += `<g class="isl-bfig"><g class="isl-lq" data-q="y">${up[0].d}${up[1].d}</g><g class="isl-lq" data-q="s">${down[0].d}${down[1].d}</g></g>`
        + `<g class="isl-lq" data-q="s"><path class="s-rim" d="${rim}" stroke-width="${F(rw)}" stroke-opacity=".7"/></g>`;
    }
    // a few trees at the field's edge
    s += palmsD([[X(0.04), Y(0.76), Y(0.3), -0.06, 71], [X(0.95), Y(0.73), Y(0.26), 0.07, 73]], 'f-near');
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
    // The road's own ground, opaque, laid first so the windows' spill of light still falls on it: the street had been
    // only the track at .55 over the base sea, so by Day it turned harbour teal and at Night took the sea's navy, and
    // the Court House read as standing on the waterfront again (art-audit pass 4, 2026-10-01).
    const road = `M${F(-2)} ${F(street)}H${F(W + 2)}V${F(H + 2)}H${F(-2)}Z`;
    s += `<path class="isl-vstreet" d="${road}"/>`;
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
    // the next row back, in shade, behind the whole street: without it the harbour showed between the houses
    // right down to the pavement and put the courthouse on the waterfront (review, 2026-09-30)
    const back = `M${F(X(-0.03))} ${F(street)}V${F(v.y0 - Y(0.012))}H${F(X(1.03))}V${F(street)}Z`;
    s += `<path class="isl-tw0" d="${back}"/><path class="isl-vpshade" d="${back}"/>`;
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
    // the corner carried up: the parapet, the cornice and the coping turn with the wall, so their share of
    // the side face is in the same shade (owner, 2026-09-30); the projecting courses turn at their own
    // corner, just beyond the wall's
    const turn = (a, b, o) => `M${F(x1 + o)} ${F(b)}V${F(a)}H${F(x1 + sd + o)}V${F(b)}Z`;
    s += `<path class="isl-vpshade" d="${turn(top - Y(0.045), top, 0) + turn(top, top + Y(0.03), Y(0.014)) + turn(top - Y(0.06), top - Y(0.045), Y(0.006))}"/>`;
    // the string course between the floors, and the stone: channelled joints below, fine courses above
    let joints = `M${F(x0)} ${F(mid)}H${F(x1 + sd)}`;
    for (let y = mid + Y(0.045); y < street - Y(0.01); y += Y(0.036)) joints += `M${F(x0)} ${F(y)}H${F(x1 + sd)}`;
    let fine = '';
    for (let y = top + Y(0.08); y < mid - Y(0.01); y += Y(0.03)) fine += `M${F(x0)} ${F(y)}H${F(x1 + sd)}`;
    for (let y = wTop + Y(0.06); y < street - Y(0.01); y += Y(0.036)) joints += `M${F(wx0)} ${F(y)}H${F(x0)}`;
    s += `<path class="isl-vstone" d="M${F(x0 - Y(0.006))} ${F(mid - Y(0.004))}H${F(x1 + sd + Y(0.006))}v${F(Y(0.02))}H${F(x0 - Y(0.006))}Z"/>`;
    // the string course turns the corner too, like the cornice and parapet above it
    s += `<path class="isl-vpshade" d="${turn(mid - Y(0.004), mid + Y(0.016), Y(0.006))}"/>`;
    // and casts its shadow under it on both faces, as the cornice does, so it still reads on the shaded side by
    // Day, where the stone and the wall come to the same tone in shade (owner, 2026-09-30)
    s += `<path class="isl-vpshade" d="M${F(x0)} ${F(mid + Y(0.016))}H${F(x1 + sd)}v${F(Y(0.009))}H${F(x0)}Z"/>`;
    s += `<path class="isl-vcourse" d="${joints}" stroke-width="1.1"/><path class="isl-vcourse" d="${fine}" stroke-width=".6" stroke-opacity=".6"/>`;
    // quoins: long and short blocks up both corners of the block, lighter than the stone about them
    let quoins = '';
    for (let k = 0, y = street; y > top + Y(0.04); y -= Y(0.036), k++) {
      const qw = k % 2 ? Y(0.034) : Y(0.054), qh = Y(0.036) - 1.2;
      quoins += `M${F(x0)} ${F(y)}h${F(qw)}v${F(-qh)}h${F(-qw)}ZM${F(x1)} ${F(y)}h${F(-qw)}v${F(-qh)}h${F(qw)}Z`;
    }
    s += `<path class="isl-vstone" d="${quoins}"/>`;
    // the right-hand quoins return round the corner onto the side face, in its shade: each stone shows on both
    // faces, short where the front is long and long where it is short, foreshortened like the side (owner, 2026-09-30)
    let qret = '';
    for (let k = 0, y = street; y > top + Y(0.04); y -= Y(0.036), k++) {
      const rw = k % 2 ? Y(0.022) : Y(0.014), qh = Y(0.036) - 1.2;
      qret += `M${F(x1)} ${F(y)}h${F(rw)}v${F(-qh)}h${F(-rw)}Z`;
    }
    s += `<path class="isl-vstone" d="${qret}"/><path class="isl-vpshade" d="${qret}"/>`;
    // 3. The windows. Warm light over the lower facade first, so the openings sit in it.
    s += `<g class="isl-vwin" style="--i:3"><ellipse cx="${F((x0 + x1) / 2)}" cy="${F(street - Y(0.08))}" rx="${F((x1 - x0) * 0.62)}" ry="${F(Y(0.24))}" fill="url(#islvwarm)"/></g>`;
    // the ground floor: five tall round-arched windows with voussoirs and a keystone; three lit, their
    // light spilling out across the pavement
    let arches = '', dark = '', vous = '', keys = '', spill = '', glaze = '';
    for (let i = 0; i < 5; i++) {
      const cx = x0 + bw * (i + 0.5), aw = bw * 0.42, aTop = mid + Y(0.07), aBot = street - Y(0.03), rr = aw / 2, cy = aTop + rr;
      const d = `M${F(cx - rr)} ${F(aBot)}V${F(cy)}A${F(rr)} ${F(rr)} 0 0 1 ${F(cx + rr)} ${F(cy)}V${F(aBot)}Z`;
      const lit = i === 1 || i === 3 || i === 4;
      if (lit) {
        arches += d;
        spill += `M${F(cx - rr)} ${F(street)}H${F(cx + rr)}L${F(cx + rr * 1.8)} ${F(street + Y(0.09))}H${F(cx - rr * 1.8)}Z`;
      } else dark += d;
      // each arch glazed, lit or dark: a mullion up the middle, a transom at the spring of the arch and a fanlight of
      // four spokes from the transom's middle (art-audit pass 4, 2026-10-01: bare openings read as doorways, and lit
      // they were the largest flat bright shapes in the picture)
      glaze += `M${F(cx - rr)} ${F(cy)}H${F(cx + rr)}M${F(cx)} ${F(cy)}V${F(aBot)}`;
      for (let k = 1; k <= 4; k++) glaze += `M${F(cx)} ${F(cy)}L${F(cx + Math.cos(Math.PI * (1 + k / 5)) * rr)} ${F(cy + Math.sin(Math.PI * (1 + k / 5)) * rr)}`;
      for (let k = 0; k <= 6; k++) {
        const a = Math.PI + (k / 6) * Math.PI, ro = rr + Y(0.028);
        vous += `M${F(cx + Math.cos(a) * rr)} ${F(cy + Math.sin(a) * rr)}L${F(cx + Math.cos(a) * ro)} ${F(cy + Math.sin(a) * ro)}`;
      }
      keys += `M${F(cx - Y(0.012))} ${F(cy - rr - Y(0.03))}h${F(Y(0.024))}l${F(-Y(0.004))} ${F(Y(0.032))}h${F(-Y(0.016))}Z`;
      vous += `M${F(cx - rr - Y(0.028))} ${F(cy)}A${F(rr + Y(0.028))} ${F(rr + Y(0.028))} 0 0 1 ${F(cx + rr + Y(0.028))} ${F(cy)}`;
    }
    s += `<path class="isl-vdark" d="${dark}"/><path class="f-pulse isl-vwin" style="--i:3" d="${arches}"/>`;
    s += `<path class="isl-vmul" d="${arches}${dark}" stroke-width=".6" fill="none"/>`;
    s += `<path class="isl-vmul" d="${glaze}" stroke-width=".9"/>`;
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
    let ev = `M${F(ex - er - Y(0.026))} ${F(eTop + er)}A${F(er + Y(0.026))} ${F(er + Y(0.026))} 0 0 1 ${F(ex + er + Y(0.026))} ${F(eTop + er)}`;
    for (let k = 0; k <= 6; k++) {
      const a = Math.PI + (k / 6) * Math.PI, ro = er + Y(0.026);
      ev += `M${F(ex + Math.cos(a) * er)} ${F(eTop + er + Math.sin(a) * er)}L${F(ex + Math.cos(a) * ro)} ${F(eTop + er + Math.sin(a) * ro)}`;
    }
    s += `<path class="isl-vcourse" d="${ev}" stroke-width="1.2"/>`;
    s += `<path class="isl-vstone" d="M${F(ex - Y(0.012))} ${F(eTop - Y(0.028))}h${F(Y(0.024))}l${F(-Y(0.004))} ${F(Y(0.032))}h${F(-Y(0.016))}Z"/>`;
    s += `<g class="isl-vwin" style="--i:2"><path d="M${F(ex - er)} ${F(street)}H${F(ex + er)}L${F(ex + er * 1.8)} ${F(street + Y(0.09))}H${F(ex - er * 1.8)}Z" fill="url(#islvspill)" opacity=".8"/></g>`;
    s += `<g class="isl-vwin" style="--i:3"><path d="${spill}" fill="url(#islvspill)" opacity=".8"/></g>`;
    // the flagpole on the parapet, and its pennant in the page's hue
    const fx = x0 + (x1 - x0) * 0.5, fTop = top - Y(0.24);
    s += `<path class="isl-vmast" d="M${F(fx)} ${F(top - Y(0.06))}V${F(fTop)}" stroke-width="1.3"/>`;
    s += `<path class="isl-vpennant" d="M${F(fx)} ${F(fTop)}Q${F(fx + Y(0.07))} ${F(fTop + Y(0.01))} ${F(fx + Y(0.13))} ${F(fTop + Y(0.04))}Q${F(fx + Y(0.07))} ${F(fTop + Y(0.06))} ${F(fx)} ${F(fTop + Y(0.08))}Z"/>`;
    // 4. The low wall and its iron railings along the front, finials on the posts
    const rx0 = wx0, rx1 = x1 + sd;
    // (open in front of the wing's lit entrance, which the bars had crossed; each run ends on a heavier post)
    const gl = ex - er - Y(0.02), gr = ex + er + Y(0.02);
    let rail = '';
    for (const yy of [street - Y(0.07), street - Y(0.03)]) rail += `M${F(rx0)} ${F(yy)}H${F(gl)}M${F(gr)} ${F(yy)}H${F(rx1)}`;
    for (let x = rx0 + Y(0.01); x < rx1; x += Y(0.022)) if (x < gl - 1 || x > gr + 1) rail += `M${F(x)} ${F(street - Y(0.018))}V${F(street - Y(0.085))}`;
    s += `<path class="isl-vrailing" d="${rail}" stroke-width="1"/>`;
    s += `<path class="isl-vrailing" d="M${F(gl)} ${F(street + 1)}V${F(street - Y(0.09))}M${F(gr)} ${F(street + 1)}V${F(street - Y(0.09))}" stroke-width="1.8"/>`;
    s += `<path d="M${F(rx0)} ${F(street + 1)}V${F(street - Y(0.018))}H${F(gl)}V${F(street + 1)}ZM${F(gr)} ${F(street + 1)}V${F(street - Y(0.018))}H${F(rx1)}V${F(street + 1)}Z" fill="url(#islvfacade)"/>`;
    // 5. The street: the pavement and its kerb, the road's setts receding, lanterns on posts with their
    //    halos and pools, palms at the edges
    s += `<path class="isl-vtrack" d="${road}"/>`;
    s += `<path class="isl-vstep-edge" d="M${F(-2)} ${F(street + Y(0.045))}H${F(W + 2)}" stroke-width="${F(Math.max(1, Y(0.006)))}" stroke-opacity=".6"/>`;
    // the road's setts as blocks (art-audit pass 4, 2026-10-01: drawn as short dashes they read as ripples, and with
    // the sea showing through, the street as a harbour's edge): rows from the kerb that deepen toward the viewer, each
    // sett a little paler than the joints round it, its length varied so the joints stagger row to row. Their own
    // random stream (the old dashes were the last draws from r, so nothing else moves).
    const sr = rng(1752);
    let settA = '', settB = '';
    for (let y = street + Y(0.05), row = 0; y < H; row++) {
      const rh = Y(0.014) + (y - street) * 0.12, g = Math.max(0.8, rh * 0.13), sl = rh * 2.2;
      for (let x = -sl * (row % 2 ? 0.5 : 0) - sr() * sl * 0.3; x < W + 2;) {
        const w = sl * (0.8 + sr() * 0.4), d = rect(x + g / 2, y + g / 2, w - g, rh - g);
        if (sr() < 0.5) settA += d; else settB += d;
        x += w;
      }
      y += rh;
    }
    s += `<path class="isl-vstone" d="${settA}" fill-opacity=".2"/><path class="isl-vstone" d="${settB}" fill-opacity=".3"/>`;
    // (each lantern's pool laid before the people, who stand in its light; the lanterns themselves after them)
    for (const lx of [X(0.19), X(0.925)]) s += `<g class="isl-vwin" style="--i:1">${pool(lx, street + Y(0.06), Y(0.3), Y(0.06), 0.8)}</g>`;
    // 6. People on the pavement by the hour (art-audit pass 4, by version; 2026-10-01: the street was empty in every
    //    version, so nothing showed that anyone was there). The town is busy by day and empties by night: a sweeper
    //    starts early by the left lantern at Dawn; by Day a visitor steps into the museum's entrance and two people
    //    pass along the railings, one with her shopping; at Sunset a couple walk home; at Dusk one person waits under
    //    the left lantern, in its light; at Night the street is empty. One set of colours, dimmed with the light by
    //    version (isl-bfig); their clothes from their own random stream, so nothing else moves.
    {
      // (fh: a person of 1.7 m beside the lantern posts, about 4.3 m, and the storeys, about 4 m)
      const pr = rng(1751), fh = Y(0.105), fy = street + Y(0.02);
      const pick = (a) => a[Math.floor(pr() * a.length)];
      const who = (o = {}) => ({ shirt: pick(['#c7d6e3', '#e8e2d4', '#9ec0d6', '#b8573f', '#7d4a52', '#3d6466', '#5c5e3e', '#d9a441']),
        legs: pick(['#2f3a4a', '#5a5148', '#3a3f4a', '#4a4038']), skin: pick(['#6b4630', '#8d5a3b', '#4f3424', '#7a4e33']), hair: '#1d1916', ...o });
      // a colour darkened, for the far leg and arm, which are in their own shade
      const dim = (hex, k = 0.72) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
      // drawing in units of a figure's height h, its feet at the origin, facing right (the caller mirrors it)
      const kit = (h) => ({
        P: (a, b) => `${F(a * h)} ${F(b * h)}`,
        R: (a, b, w, hh) => rect(a * h, b * h, w * h, hh * h),
        limb: (pts, col, wd) => `<path fill="none" stroke="${col}" stroke-width="${F(Math.max(0.7, wd * h))}" stroke-linecap="round" stroke-linejoin="round" d="M${pts.map(([a, b]) => `${F(a * h)} ${F(b * h)}`).join('L')}"/>`,
      });
      const shoe = '#3a2e24';
      // A figure in profile, facing `dir` (1 right, -1 left), feet at (x, y), h tall, in person()'s proportions and
      // colours: a passer-by needs a stride, and person() stands still, facing us or turned away. The far leg and arm
      // in shade; `dress` a skirt to the knee, `bag` a market bag hanging from the near hand, `rim` the Sunset's light
      // along whichever edge faces the Sun, on the left (sunset: '18:11', between the palm and the lamp).
      const walker = (x, y, h, dir, c, { dress = false, bag = null, rim = false } = {}) => {
        const { P, R, limb } = kit(h), hr = 0.075, hx = 0.025, hy = -1 + hr, lc = dress ? c.skin : c.legs;
        const farArm = [[0.01, -0.79], [0.055, -0.66], [0.1, -0.555]];
        const nearArm = bag ? [[-0.005, -0.79], [-0.03, -0.66], [-0.035, -0.535]] : [[-0.005, -0.79], [-0.05, -0.66], [-0.085, -0.555]];
        // the far arm swinging forward and the far leg trailing, both in shade; then the near leg striding forward
        let o = limb(farArm.slice(0, 2), dim(c.shirt), 0.06) + limb(farArm.slice(1), dim(c.skin), 0.045);
        o += `<path fill="${dim(lc)}" d="M${P(-0.04, -0.5)}L${P(0.03, -0.5)}L${P(-0.1, -0.025)}L${P(-0.155, -0.025)}Z"/><path fill="${shoe}" d="${R(-0.17, -0.03, 0.08, 0.03)}"/>`;
        o += `<path fill="${lc}" d="M${P(-0.035, -0.5)}L${P(0.04, -0.5)}L${P(0.155, -0.025)}L${P(0.1, -0.025)}Z"/><path fill="${shoe}" d="${R(0.095, -0.03, 0.09, 0.03)}"/>`;
        // the body: a shirt to the hips, or a dress to the knee
        const hem = dress ? [[-0.11, -0.27], [0.115, -0.27]] : [[-0.075, -0.49], [0.07, -0.49]];
        o += `<path fill="${c.shirt}" d="M${P(...hem[0])}L${P(-0.085, -0.79)}Q${P(-0.08, -0.85)} ${P(-0.03, -0.855)}H${F(0.045 * h)}Q${P(0.085, -0.85)} ${P(0.085, -0.79)}L${P(...hem[1])}Z"/>`;
        if (bag) o += `<path fill="none" stroke="${bag}" stroke-width="${F(Math.max(0.6, 0.015 * h))}" d="M${P(-0.085, -0.43)}L${P(-0.035, -0.53)}L${P(0.025, -0.43)}"/>`
          + `<path fill="${bag}" d="${R(-0.1, -0.43, 0.14, 0.17)}"/><path fill="${dim(bag)}" d="${R(-0.1, -0.31, 0.14, 0.05)}"/>`;
        o += limb(nearArm.slice(0, 2), c.shirt, 0.06) + limb(nearArm.slice(1), c.skin, 0.045);
        // the neck, the head, and the hair over its back and crown
        o += `<path fill="${c.skin}" d="${R(-0.02, -0.885, 0.04, 0.04)}"/><circle fill="${c.skin}" cx="${F(hx * h)}" cy="${F(hy * h)}" r="${F(hr * h)}"/>`
          + `<path fill="${c.hair}" d="M${P(hx - hr * 1.02, hy + hr * 0.4)}A${F(hr * 1.03 * h)} ${F(hr * 1.05 * h)} 0 0 1 ${P(hx + hr * 0.8, hy - hr * 0.65)}Q${P(hx - hr * 0.05, hy - hr * 0.3)} ${P(hx - hr * 1.02, hy + hr * 0.4)}Z"/>`;
        let lit = '';
        if (rim) {
          // the edge toward the Sun, outside the dimming: the back when walking right, the face and front when left
          const sd = dir > 0 ? -1 : 1, body = dress ? [[0.085, -0.79], [0.11, -0.3]] : [[0.085, -0.79], [0.072, -0.52]];
          const leg = sd < 0 ? [[-0.045, dress ? -0.27 : -0.49], [-0.155, -0.035]] : [[0.045, dress ? -0.27 : -0.49], [0.155, -0.035]];
          lit = `<path class="s-rim" stroke-width="${F(Math.max(0.8, 0.025 * h))}" stroke-opacity=".75" d="M${P(hx + sd * hr * 0.55, hy - hr * 0.85)}A${F(hr * h)} ${F(hr * h)} 0 0 ${sd > 0 ? 1 : 0} ${P(hx + sd * hr * 0.75, hy + hr * 0.65)}`
            + `M${P(sd * body[0][0], body[0][1])}L${P(sd * body[1][0], body[1][1])}M${P(...leg[0])}L${P(...leg[1])}"/>`;
        }
        return `<g transform="translate(${F(x)} ${F(y)}) scale(${dir} 1)"><g class="isl-bfig">${o}</g>${lit}</g>`;
      };
      let ppl = '';
      // Dawn: the sweeper in a straw hat, bent over a long broom, working along toward the left lantern
      {
        const h = fh, c = who({ shirt: '#d9a441' }), { P, R, limb } = kit(h), hr = 0.075, hx = 0.27, hy = -0.875;
        // the broom: its handle down through both hands to the head on the ground ahead, the bristles splayed
        let o = limb([[0.17, -0.72], [0.5, -0.05]], '#8a6a4a', 0.028);
        o += `<path fill="#b8945a" d="M${P(0.44, -0.075)}L${P(0.55, -0.075)}L${P(0.63, 0)}L${P(0.39, 0)}Z"/>`
          + `<path fill="none" stroke="#7a6038" stroke-width="${F(Math.max(0.5, 0.01 * h))}" d="M${P(0.46, -0.06)}L${P(0.43, 0)}M${P(0.5, -0.06)}L${P(0.5, 0)}M${P(0.54, -0.06)}L${P(0.58, 0)}"/>`;
        // the far arm to the upper hand, and the far leg, in shade; the near leg a step ahead
        o += limb([[0.19, -0.78], [0.175, -0.66]], dim(c.shirt), 0.06) + limb([[0.175, -0.66], [0.236, -0.584]], dim(c.skin), 0.045);
        o += `<path fill="${dim(c.legs)}" d="M${P(-0.05, -0.5)}L${P(0.03, -0.5)}L${P(-0.06, -0.025)}L${P(-0.12, -0.025)}Z"/><path fill="${shoe}" d="${R(-0.135, -0.03, 0.08, 0.03)}"/>`;
        o += `<path fill="${c.legs}" d="M${P(-0.03, -0.5)}L${P(0.05, -0.5)}L${P(0.135, -0.025)}L${P(0.075, -0.025)}Z"/><path fill="${shoe}" d="${R(0.07, -0.03, 0.09, 0.03)}"/>`;
        // the back bent forward from the hips, the near arm down to the lower hand, the head low over the work
        o += `<path fill="${c.shirt}" d="M${P(-0.07, -0.47)}L${P(0.13, -0.81)}Q${P(0.17, -0.865)} ${P(0.225, -0.825)}L${P(0.27, -0.75)}L${P(0.075, -0.44)}Z"/>`;
        o += limb([[0.215, -0.78], [0.29, -0.63]], c.shirt, 0.06) + limb([[0.29, -0.63], [0.318, -0.414]], c.skin, 0.045);
        o += `<circle fill="${c.skin}" cx="${F(hx * h)}" cy="${F(hy * h)}" r="${F(hr * h)}"/>`;
        o += `<path fill="#c9b07a" d="M${P(hx - hr * 0.9, hy - hr * 0.25)}A${F(hr * 0.92 * h)} ${F(hr * 0.92 * h)} 0 0 1 ${P(hx + hr * 0.9, hy - hr * 0.25)}Z"/>`
          + `<path fill="none" stroke="#c9b07a" stroke-linecap="round" stroke-width="${F(Math.max(0.7, 0.02 * h))}" d="M${P(hx - hr * 1.7, hy - hr * 0.15)}L${P(hx + hr * 1.8, hy - hr * 0.3)}"/>`;
        ppl += `<g class="isl-lq" data-q="a"><g transform="translate(${F(X(0.23))} ${F(fy)}) scale(-1 1)"><g class="isl-bfig">${o}</g></g></g>`;
      }
      // Day: a visitor seen from behind stepping into the museum's entrance (its threshold the building's line, so a
      // little smaller than those on the pavement), a passer-by going left, a woman with her market bag going right
      ppl += `<g class="isl-lq" data-q="y"><g class="isl-bfig">${person((wx0 + x0) / 2, street + Y(0.004), fh * 0.94, who({ legs: '#8a7a5e' }))}</g>`
        + walker(X(0.53), fy, fh, -1, who()) + walker(X(0.76), fy + Y(0.006), fh * 0.97, 1, who(), { dress: true, bag: '#b08a52' }) + '</g>';
      // Sunset: a couple walking home side by side, the Sun's last light along their backs (the farther one first)
      ppl += `<g class="isl-lq" data-q="s">${walker(X(0.66) + fh * 0.13, fy - Y(0.006), fh * 0.97, 1, who(), { rim: true })}`
        + `${walker(X(0.66), fy + Y(0.004), fh, 1, who(), { dress: true, rim: true })}</g>`;
      // Dusk: one person waiting under the left lantern, facing us, its light on the lantern side (isl-mlit, in the
      // lantern's turn of the pass)
      {
        const x = X(0.205), ft = fy - fh, hr = fh * 0.075, sw = fh * 0.13, hy = ft + hr, sw2 = F(Math.max(0.8, Y(0.006)));
        ppl += `<g class="isl-lq" data-q="d"><g class="isl-bfig">${person(x, fy, fh, who({ front: true }))}</g>`
          + `<g class="isl-vlamps isl-vwin" style="--i:1"><path class="isl-mlit" d="M${F(x - sw * 1.04)} ${F(ft + fh * 0.21)}V${F(ft + fh * 0.5)}M${F(x - hr * 0.95)} ${F(hy - hr * 0.3)}A${F(hr)} ${F(hr)} 0 0 0 ${F(x - hr * 0.7)} ${F(hy + hr * 0.7)}" stroke-width="${sw2}"/></g></g>`;
      }
      s += ppl;
    }
    // the lanterns, after the people, so a post stands in front of anyone beside it
    for (const lx of [X(0.19), X(0.925)]) {
      const ph = Y(0.27), lw = Y(0.022), lh = Y(0.06);
      s += `<g class="isl-vwin" style="--i:1">${halo(lx, street - ph - lh / 2, Y(0.2))}`
        + `<path class="f-pulse isl-ltframe" d="M${F(lx - lw)} ${F(street - ph)}V${F(street - ph - lh)}H${F(lx + lw)}V${F(street - ph)}Z"/></g>`
        + panes(lx - lw, street - ph - lh, 2 * lw, lh);
      s += `<path class="isl-vpost" d="M${F(lx - 1.3)} ${F(street + Y(0.03))}V${F(street - ph)}H${F(lx + 1.3)}V${F(street + Y(0.03))}Z`
        + `M${F(lx - lw * 1.2)} ${F(street - ph + 1)}h${F(lw * 2.4)}v${F(Y(0.01))}h${F(-lw * 2.4)}Z"/>`
        + `<path class="isl-vpost isl-lcap" d="M${F(lx - lw * 1.5)} ${F(street - ph - lh)}L${F(lx)} ${F(street - ph - lh - Y(0.035))}L${F(lx + lw * 1.5)} ${F(street - ph - lh)}Z"/>`;
      s += `<path class="isl-vmul" d="M${F(lx)} ${F(street - ph)}V${F(street - ph - lh)}" stroke-width=".8"/>`;
    }
    s += palmsD([[X(0.035), street + Y(0.03), Y(0.44), -0.05, 91], [X(0.978), street + Y(0.03), Y(0.4), 0.06, 93]], 'f-near');
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
    // (art-audit pass 4, 2026-10-01) The liners' hulls deepen toward the boot-top (islsjhull) and toward the stem
    // as the bow turns away (islsjbow), and the floodlit cathedral's stone is warmest at its foot, where the
    // floodlight stands, and a step darker toward its cupolas (islsjcath; its darkening is put out by Day, when
    // the Sun lights the stone evenly, layout-art.css).
    let s = '<defs><linearGradient id="islsjhull" x1="0" y1="0" x2="0" y2="1"><stop offset=".15" class="st-sjshade" stop-opacity="0"/>'
      + '<stop offset=".8" class="st-sjshade" stop-opacity=".3"/></linearGradient>'
      + '<linearGradient id="islsjbow" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="st-sjshade" stop-opacity="0"/>'
      + '<stop offset="1" class="st-sjshade" stop-opacity=".3"/></linearGradient>'
      + '<linearGradient id="islsjcath" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-sjshade st-sjcath" stop-opacity=".22"/>'
      + '<stop offset=".45" class="st-sjshade st-sjcath" stop-opacity="0"/><stop offset=".55" class="st-g1" stop-opacity="0"/>'
      + '<stop offset="1" class="st-g1" stop-opacity=".34"/></linearGradient></defs>';
    // 1. The hills beyond, rimmed, their lights; the town's hillside in front of them.
    const hills = [[-0.02, 0.4], [0.08, 0.36], [0.18, 0.33], [0.3, 0.31], [0.42, 0.3], [0.52, 0.27], [0.6, 0.24], [0.68, 0.25], [0.76, 0.28], [0.86, 0.31], [0.95, 0.29], [1.02, 0.3]]
      .map(([x, y]) => [X(x), Y(y)]);
    s += `<path class="f-isl" d="${polyD([...hills, [X(1.02), y0], [X(-0.02), y0]])}${scrubLine(hills, 4, 0.8, 1.8, r)}"/>`;
    s += `<path class="s-rim" d="${lineD(hills.map(([x, y]) => [x, y + 0.5]))}" stroke-width="1" stroke-opacity=".3"/>`;
    const town = [[-0.02, 0.45], [0.12, 0.43], [0.26, 0.42], [0.4, 0.405], [0.52, 0.385], [0.62, 0.36], [0.68, 0.355], [0.76, 0.37], [0.88, 0.4], [1.02, 0.42]]
      .map(([x, y]) => [X(x), Y(y)]);
    for (let i = 0; i < 26; i++) {
      const x = X(r()), a = at(hills, x) + Y(0.012), b = at(town, x) - Y(0.006);
      // (none in the cathedral's column, so its towers stand clean against the hill by Day and no light is
      // painted on their stone at night; the draw is made either way, so the town keeps its layout)
      if (b > a) { const y = a + r() * (b - a); if (Math.abs(x - X(0.66)) > 38 * u) far.push([x, y]); }
    }
    s += makeKit(W, H).dayHouses(far, Y(0.014), 79);
    s += `<path class="f-far isl-land" d="${polyD([...town, [X(1.02), y0 + 1], [X(-0.02), y0 + 1]])}"/>`;
    // 2. The cathedral on the skyline: twin towers with cornices, cupolas and lanterns, belfry openings,
    //    the nave's gable between them; its floodlight comes on last.
    const cx = X(0.66), tw = 15 * u, gap = 25 * u, foot = at(town, cx) + Y(0.012), eave = foot - 32 * u, tt = foot - 82 * u;
    let cath = `M${F(cx - gap / 2 - tw)} ${F(foot)}V${F(eave)}H${F(cx + gap / 2 + tw)}V${F(foot)}Z`
      + `M${F(cx - gap / 2)} ${F(eave + 1)}L${F(cx)} ${F(eave - 14 * u)}L${F(cx + gap / 2)} ${F(eave + 1)}Z`;
    // (art-audit pass 4, 2026-10-01: the picture's last and brightest light was one flat cream shape that laid
    // no light round it) A shadow lies under each tower's cornice and under its string course, where hairlines
    // were, in every version; the floodlight warms the stone at the foot and leaves the cupolas a step darker
    // (islsjcath), and lays a pool of its light on the ground at the foot, both coming on with it; its column
    // on the harbour is drawn with the quay lamps' columns, below.
    let domes = '', belfry = '', cc = '';
    for (const sx of [-1, 1]) {
      const x = cx + sx * (gap / 2 + tw / 2), ct = tt - 4 * u;
      cath += `M${F(x - tw / 2)} ${F(eave + 1)}V${F(tt)}H${F(x + tw / 2)}V${F(eave + 1)}Z`;
      cath += `M${F(x - tw * 0.62)} ${F(tt + 1)}H${F(x + tw * 0.62)}V${F(ct)}H${F(x - tw * 0.62)}Z`;
      domes += `M${F(x - tw * 0.48)} ${F(ct)}A${F(tw * 0.48)} ${F(tw * 0.62)} 0 0 1 ${F(x + tw * 0.48)} ${F(ct)}Z`;
      domes += `M${F(x - tw * 0.1)} ${F(ct - tw * 0.58)}V${F(ct - tw * 1.05)}H${F(x + tw * 0.1)}V${F(ct - tw * 0.58)}Z`;
      belfry += `M${F(x - tw * 0.2)} ${F(tt + 26 * u)}V${F(tt + 12 * u)}a${F(tw * 0.2)} ${F(tw * 0.2)} 0 0 1 ${F(tw * 0.4)} 0V${F(tt + 26 * u)}Z`;
      cc += rect(x - tw / 2, tt + 1, tw, 2.4 * u) + rect(x - tw / 2, tt + 32 * u, tw, 1.2 * u) + rect(x - tw / 2, eave - 14 * u, tw, 2 * u);
    }
    belfry += `M${F(cx - 3 * u)} ${F(foot - 8 * u)}V${F(eave + 6 * u)}a${F(3 * u)} ${F(3 * u)} 0 0 1 ${F(6 * u)} 0V${F(foot - 8 * u)}Z`;
    s += `<g class="isl-vwin isl-vlast" style="--i:5"><ellipse cx="${F(cx)}" cy="${F(foot - 40 * u)}" rx="${F(70 * u)}" ry="${F(62 * u)}" fill="url(#islvwarm)"/>${pool(cx, foot, 45 * u, 6 * u)}</g>`;
    s += `<path class="isl-vcath" d="${cath}"/><g class="isl-vwin" style="--i:5"><path d="${cath}" fill="url(#islsjcath)"/></g>`;
    s += `<path class="isl-vpshade" d="${cc}"/><path class="isl-vship2" d="${domes}"/>`;
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
    // the floodlit cathedral's broken column, as wide as its facade (one under each tower and one under the
    // door; art-audit pass 4, 2026-10-01: every quay lamp laid one and the brightest light laid none), coming
    // on with the floodlight; from its own stream, so the town keeps its layout. The liners, drawn next, cover
    // its middle.
    const rc = rng(59);
    s += `<g class="isl-vwin" style="--i:5">${[-1, 0, 1].map((k) => dashes(streakList(cx + k * 14 * u, y0, H, rc, 0.05, 0.1), 's-vglow', 1.3, [0.1, 0.22, 0.4])).join('')}</g>`;
    // 5. Two cruise ships at the quay, broadside, bow to the right: a white hull with a dark boot-top
    //    at the waterline and its sheer rising to the raked bow, lifeboats slung along the side, decks
    //    stepping back in rows of lit cabins, portholes along the hull, a funnel aft with its dark cap,
    //    a masthead light; each with its reflection and columns of light under it.
    const ship = (x0, x1, wl, cls, i) => {
      const L = x1 - x0, hh = L * 0.085, dh = L * 0.03, decks = 5, cabins = [], ports = [];
      // (the hull is wound the same way round as the decks it shares a path with: wound the other way,
      // the sliver where the bottom deck overlaps the rising sheer cancelled out and the sea showed
      // through it, owner, 2026-09-30)
      const hull = `M${F(x0 + L * 0.03)} ${F(wl)}Q${F(x0 - L * 0.012)} ${F(wl - hh * 0.9)} ${F(x0 + L * 0.02)} ${F(wl - hh * 0.98)}L${F(x1)} ${F(wl - hh * 1.18)}L${F(x1 - L * 0.07)} ${F(wl)}Z`;
      const boot = `M${F(x0 + L * 0.03)} ${F(wl)}H${F(x1 - L * 0.07)}L${F(x1 - L * 0.062)} ${F(wl - hh * 0.24)}H${F(x0 + L * 0.018)}Z`;
      let sup = '', rails = '', boats = '', glass = '', shade = '', rake = '';
      for (let d = 0; d < decks; d++) {
        const yb = wl - hh * 1.02 - d * dh, yt = yb - dh, a = x0 + L * (0.04 + d * 0.014), b = x1 - L * (0.15 + d * 0.05);
        sup += `M${F(a)} ${F(yb + 1)}V${F(yt)}H${F(b)}L${F(b + dh * 1.3)} ${F(yb + 1)}Z`;
        // each deck's row of balcony glass, as on the owner's photograph of a cruise ship at the quay
        glass += `M${F(a + L * 0.01)} ${F(yb - dh * 0.66)}H${F(b - L * 0.004)}v${F(dh * 0.3)}H${F(a + L * 0.01)}Z`;
        rails += `M${F(a)} ${F(yt + 0.5)}H${F(b + dh * 0.25)}`;
        // (art-audit pass 4, 2026-10-01: each liner was one flat colour, a cut-out beside the fort's lit and
        // shaded stone) the shadow of the deck above along the top of this one, under its rail, and its
        // sloping forward end, turned away from the light, a step darker; no random draws, so the cabins keep
        // their places
        shade += rect(a, yt + 0.5, b - a, dh * 0.18);
        rake += `M${F(b)} ${F(yt + 0.5)}L${F(b + dh * 1.3)} ${F(yb + 1)}H${F(b)}Z`;
        for (let x = a + L * 0.012; x < b; x += L * 0.011) if (r() < 0.8) cabins.push([x, yb - dh * 0.5]);
      }
      // the raked bow, its plating turning away toward the stem, darkening toward it (islsjbow)
      const sheer = (x) => wl - hh * (0.98 + 0.2 * (x - x0 - L * 0.02) / (L * 0.98)), bwx = x1 - L * 0.12;
      const bow = `M${F(bwx)} ${F(sheer(bwx))}L${F(x1)} ${F(wl - hh * 1.18)}L${F(x1 - L * 0.07)} ${F(wl)}H${F(bwx - L * 0.03)}Z`;
      for (let x = x0 + L * 0.1; x < x1 - L * 0.3; x += L * 0.05) {
        const by = wl - hh * 1.02 + dh * 0.05, bl = L * 0.034;
        boats += `M${F(x)} ${F(by)}h${F(bl)}q${F(-bl * 0.1)} ${F(dh * 0.62)} ${F(-bl * 0.25)} ${F(dh * 0.62)}h${F(-bl * 0.5)}q${F(-bl * 0.15)} 0 ${F(-bl * 0.25)} ${F(-dh * 0.62)}Z`;
      }
      for (let x = x0 + L * 0.06; x < x1 - L * 0.12; x += L * 0.018) ports.push([x, wl - hh * 0.5]);
      const deckTop = wl - hh * 1.02 - decks * dh, fx = x0 + L * 0.2;
      const funnel = `M${F(fx)} ${F(deckTop + 1)}L${F(fx + L * 0.012)} ${F(deckTop - dh * 1.5)}H${F(fx + L * 0.078)}L${F(fx + L * 0.085)} ${F(deckTop + 1)}Z`;
      const cap = `M${F(fx + L * 0.012)} ${F(deckTop - dh * 1.5)}H${F(fx + L * 0.078)}L${F(fx + L * 0.08)} ${F(deckTop - dh * 1.05)}H${F(fx + L * 0.01)}Z`;
      // (the mast stands on the top deck, just back from its forward end; at 0.3L it had stood on nothing)
      const mx = x1 - L * 0.38, mast = `M${F(mx)} ${F(deckTop + 1)}V${F(deckTop - dh * 2.6)}`;
      // (the hull's darkening, islsjhull, is laid over the hull alone, so the decks above keep the ship's colour)
      const one = `<path class="${cls}" d="${hull}${sup}${funnel}"/><path d="${hull}" fill="url(#islsjhull)"/>`
        + `<path d="${bow}" fill="url(#islsjbow)"/><path class="isl-vpshade" d="${shade}"/><path class="isl-vpshade" d="${rake}" opacity=".6"/>`
        + `<path class="isl-vdark" d="${glass}" fill-opacity=".55"/><path class="isl-vhullband" d="${boot}${cap}"/>`
        + `<path class="isl-vdeck" d="${rails}" stroke-width=".8"/><path class="isl-vspin2" d="${boats}"/><path class="isl-vmast" d="${mast}" stroke-width="1"/>`;
      let o = `<g clip-path="url(#islsea)" opacity=".15"><g transform="translate(0 ${F(2 * wl)}) scale(1 -1)">${one}</g></g>`;
      for (let x = x0 + L * 0.08; x < x1 - L * 0.1; x += L * 0.07) o += dashes(streakList(x + (r() - 0.5) * L * 0.03, wl + 1, H, r, 0.05, 0.06), 's-vglow', 1, [0.06, 0.12, 0.24]);
      o += one;
      o += `<g class="isl-vwin" style="--i:${i}">${halo(mx, deckTop - dh * 2.6, 8 * u, 'islvcool')}<circle class="isl-vnav-w" cx="${F(mx)}" cy="${F(deckTop - dh * 2.6)}" r="${F(Math.max(1.2, 1.4 * u))}"/></g>`;
      o += `<path class="s-vlight isl-vwin" style="--i:${i}" d="${lightsD(cabins)}" stroke-width="${F(Math.max(1.2, 1.5 * u))}"/>`;
      o += `<path class="s-vlight isl-vwin" style="--i:${i}" d="${lightsD(ports)}" stroke-width="${F(Math.max(1, 1.2 * u))}" stroke-opacity=".7"/>`;
      return o;
    };
    // (the far ship in port at Dawn, by Day and at Sunset, and gone from Dusk: cruise ships call at St John's for
    // the day and sail in the late afternoon, and one staying into the evening, the near one, is ordinary; the
    // owner, 2026-10-01, and art-audit wave 2, by version. The town and the quay drawn under her fill the berth)
    // Both ships made fast (art-audit pass 4, 2026-10-01: with nothing holding her the near ship read as anchored
    // mid-harbour): lines from fairleads at the stem and the stern down to bollards, each sagging a little, as in
    // the owner's photograph of a ship at the cruise berth. A spring line would run along her side toward the
    // pier, behind her hull, so only the lines leading past her bow and stern show. No random draws, so the
    // town and the ships keep their layout.
    const fair = (x0, x1, wl) => { const L = x1 - x0, hh = L * 0.085; return { L, bow: [x1 - L * 0.02, wl - hh * 0.9], stern: [x0 + L * 0.012, wl - hh * 0.85] }; };
    const rope = (p, q) => `M${F(p[0])} ${F(p[1])}Q${F((p[0] + q[0]) / 2)} ${F((p[1] + q[1]) / 2 + 1.2 * u)} ${F(q[0])} ${F(q[1])}`;
    const bw = Math.max(1.2, 1.8 * u), bollard = (x, y) => rect(x - bw / 2, y - bw * 1.3, bw, bw * 1.3) + rect(x - bw * 0.75, y - bw * 1.55, bw * 1.5, bw * 0.4);
    // the far ship's two lines to bollards on the quay's edge; the bollards stay when she has sailed
    const fx0 = X(0.6), fx1 = X(0.94), fwl = y0 + Y(0.035), ff = fair(fx0, fx1, fwl), qy = y0 - Y(0.012), fB = [fx0 - 10 * u, fx1 + 14 * u];
    s += `<path class="isl-vcannon" d="${bollard(fB[0], qy)}${bollard(fB[1], qy)}"/>`;
    s += `<g class="isl-lq" data-q="ays">` + ship(fx0, fx1, fwl, 'isl-vship2', 2)
      + `<path class="isl-vmast" d="${rope(ff.stern, [fB[0], qy - bw])}${rope(ff.bow, [fB[1], qy - bw])}" stroke-width=".8"/></g>`;
    // The pier the near ship lies along, as in the same photograph: a low concrete deck on her far side, its
    // face in shade, its ends showing past her stern and her bow with dark bollards on them, mirrored faintly;
    // her hull, drawn next, covers its middle. Her lines go to two bollards at each end, a third standing free.
    const nx0 = X(0.28), nx1 = X(0.7), nwl = y0 + Y(0.12), nf = fair(nx0, nx1, nwl);
    const pw = nwl - 0.5 * u, pe = pw - 4.5 * u, pt = pe - 1.8 * u;   // the pier's foot at the water, its edge, its far side
    let pier = '', pface = '', pbol = '';
    for (const [a, b] of [[nx0 - 30 * u, nx0 + nf.L * 0.05], [nx1 - nf.L * 0.07, nx1 + 35 * u]]) { pier += rect(a, pt, b - a, pw - pt); pface += rect(a, pe, b - a, pw - pe); }
    const nB = [nx0 - 9 * u, nx0 - 19 * u, nx0 - 27 * u, nx1 + 11 * u, nx1 + 22 * u, nx1 + 32 * u];
    for (const x of nB) pbol += bollard(x, pe);
    const pierD = `<path class="isl-vstone" d="${pier}"/><path class="isl-vpshade" d="${pface}"/><path class="isl-vcannon" d="${pbol}"/>`;
    s += mirrored(pw, pierD, 0.14) + pierD;
    s += ship(nx0, nx1, nwl, 'isl-vship', 2);
    s += `<path class="isl-vmast" d="${rope(nf.stern, [nB[0], pe - bw])}${rope(nf.stern, [nB[1], pe - bw])}${rope(nf.bow, [nB[3], pe - bw])}${rope(nf.bow, [nB[4], pe - bw])}" stroke-width=".8"/>`;
    // a launch crossing toward the quay, its riding light and its column of light
    const lx0 = X(0.82), ly0 = Y(0.9), ll = 40 * u;
    s += dashes(streakList(lx0 + ll * 0.3, ly0 + 1, H, r, 0.05, 0.08), 's-vcoolglow', 1, [0.1, 0.2, 0.34]);
    const launch = `<path class="isl-vhull" d="M${F(lx0)} ${F(ly0 - 5 * u)}H${F(lx0 + ll)}L${F(lx0 + ll * 0.88)} ${F(ly0)}H${F(lx0 + ll * 0.06)}Z"/>`
      + `<path class="isl-vship2" d="M${F(lx0 + ll * 0.2)} ${F(ly0 - 5 * u)}V${F(ly0 - 11 * u)}H${F(lx0 + ll * 0.55)}L${F(lx0 + ll * 0.62)} ${F(ly0 - 5 * u)}Z"/>`;
    s += `<g opacity=".15"><g transform="translate(0 ${F(2 * ly0)}) scale(1 -1)">${launch}</g></g>` + launch;
    s += `<g class="isl-vwin" style="--i:1">${halo(lx0 + ll * 0.35, ly0 - 15 * u, 10 * u, 'islvcool')}<circle class="f-pulse f-vcool" cx="${F(lx0 + ll * 0.35)}" cy="${F(ly0 - 15 * u)}" r="${F(Math.max(1.2, 1.5 * u))}"/></g>`;
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
    // (the coping turns the corner onto the outer wall's top, as the Court House's cornice does)
    s += `<path d="${lineD([...par.slice(0, 6), outer[1]])}" stroke-width="${F(Math.max(1.5, 3 * u))}" stroke-linejoin="round" fill="none" style="stroke:var(--isl-vstone)"/>`;
    let pj = '';
    for (let y = pTop + 13 * u; y < pFoot - 2; y += 11 * u) pj += `M${F(X(-0.02))} ${F(y)}H${F(px1)}`;
    for (let y = pTop + 16 * u; y < H; y += 12 * u) pj += `M${F(px1 + 1)} ${F(y)}L${F(px1 + 12 * u + (y - pTop) * (X(0.05) - 12 * u) / (H - pTop))} ${F(y)}`;
    s += `<path class="isl-vcourse" d="${pj}" stroke-width=".7"/>`;
    s += `<path class="f-near isl-land" d="${polyD([[X(-0.02), pFoot], [px1, pFoot], [px1, H + 2], [X(-0.02), H + 2]])}"/>`;
    s += `<g class="isl-vwin" style="--i:0">${pool(X(0.07), pFoot + 12 * u, 80 * u, 16 * u, 0.8)}</g>`;
    // Visitors at the parapet, seen from behind, heads and shoulders against the water (art-audit pass 4,
    // 2026-10-01: the fort had no one in it). Who is there answers the hour (by version): by Day a passenger
    // up from the ships, in a sun hat, holds up a phone to photograph them; at Sunset and at Dusk a couple lean
    // on the coping, one pointing at the ships, as people come to the fort for the sunset and to see the ships
    // sail; before dawn and after dark the fort is empty. Sized from the parapet (a person about one and a half
    // times its height above the floor they stand on), so they keep their place at it whatever the card's
    // shape; in their own colours, dimmed as the light goes (isl-sjfig), with no light of their own (the
    // fort's lamp is too far along the wall to reach them).
    {
      const fy = pFoot + 12 * u, fh = (fy - pTop) * 1.55, sw = fh * 0.13, hr = fh * 0.075, ft = fy - fh, hy = ft + hr, sh = ft + fh * 0.18;
      const limb = (pts, col, w = sw * 0.3) => `<path d="M${pts.map(([x, y]) => `${F(x)} ${F(y)}`).join('L')}" fill="none" stroke="${col}" stroke-width="${F(w)}" stroke-linecap="round" stroke-linejoin="round"/>`;
      // o: shirt, legs (trousers) or skirt or shorts with bare legs, skin, hair (long to the shoulders or not),
      // hat; arms: 'lean' (both forearms on the coping), 'point' (the right arm at the ships), 'phone'
      const visitor = (x, o) => {
        const skin = o.skin, sl = [x - sw * 0.85, sh + sw * 0.12], sr = [x + sw * 0.85, sh + sw * 0.12];
        let g = `<ellipse class="isl-vcannon" cx="${F(x)}" cy="${F(fy + 0.5 * u)}" rx="${F(sw * 1.5)}" ry="${F(Math.max(1, 2 * u))}" fill-opacity=".3"/>`;   // its shadow on the floor
        if (o.legs) g += `<path fill="${o.legs}" d="M${F(x - sw * 0.85)} ${F(fy)}L${F(x - sw * 0.75)} ${F(ft + fh * 0.5)}H${F(x + sw * 0.75)}L${F(x + sw * 0.85)} ${F(fy)}H${F(x + sw * 0.1)}L${F(x)} ${F(ft + fh * 0.62)}L${F(x - sw * 0.1)} ${F(fy)}Z"/>`;
        else g += `<path fill="${skin}" d="${rect(x - sw * 0.7, ft + fh * 0.6, sw * 0.48, fy - ft - fh * 0.6)}${rect(x + sw * 0.22, ft + fh * 0.6, sw * 0.48, fy - ft - fh * 0.6)}"/>`;
        if (o.shorts) g += `<path fill="${o.shorts}" d="M${F(x - sw * 0.8)} ${F(ft + fh * 0.5)}L${F(x - sw * 0.86)} ${F(ft + fh * 0.7)}H${F(x + sw * 0.86)}L${F(x + sw * 0.8)} ${F(ft + fh * 0.5)}Z"/>`;
        if (o.skirt) g += `<path fill="${o.skirt}" d="M${F(x - sw * 0.78)} ${F(ft + fh * 0.48)}L${F(x - sw * 1.08)} ${F(ft + fh * 0.8)}H${F(x + sw * 1.08)}L${F(x + sw * 0.78)} ${F(ft + fh * 0.48)}Z"/>`;
        // the arms, drawn before the body so it covers where they meet it: the upper arm in the sleeve, the
        // forearm bare
        const arm = (s0, el, hand) => limb([s0, el], o.shirt) + limb([el, hand], skin);
        if (o.arms === 'phone') {
          // both hands up in front, above the hat, holding the phone level, its screen toward her and so toward us
          const px = x + hr * 0.3, py = hy - hr * 2.4;
          g += arm(sl, [x - sw * 1.25, sh - fh * 0.06], [px - hr * 1.1, py + hr * 0.4]) + arm(sr, [x + sw * 1.3, sh - fh * 0.06], [px + hr * 1.1, py + hr * 0.4]);
          g += `<path fill="#22262b" d="${rect(px - hr * 1.2, py - hr * 0.55, hr * 2.4, hr * 1.4)}"/><path fill="#cfe2ea" d="${rect(px - hr * 1.02, py - hr * 0.4, hr * 2.04, hr * 1.1)}"/>`;
        } else {
          // forearms on the coping: the elbows on it, the forearms reaching forward along it out of sight
          g += arm(sl, [x - sw * 1.35, pTop + 0.6 * u], [x - sw * 0.7, pTop + 0.2 * u]);
          g += o.arms === 'point'
            ? arm(sr, [x + sw * 1.45, sh - fh * 0.08], [x + sw * 2.3, sh - fh * 0.17]) + limb([[x + sw * 2.3, sh - fh * 0.17], [x + sw * 2.62, sh - fh * 0.2]], skin, sw * 0.13)
            : arm(sr, [x + sw * 1.35, pTop + 0.6 * u], [x + sw * 0.7, pTop + 0.2 * u]);
        }
        g += `<path fill="${o.shirt}" d="M${F(x - sw * 0.82)} ${F(ft + fh * 0.53)}L${F(x - sw)} ${F(ft + fh * 0.22)}Q${F(x - sw)} ${F(ft + fh * 0.16)} ${F(x - sw * 0.6)} ${F(ft + fh * 0.15)}H${F(x + sw * 0.6)}Q${F(x + sw)} ${F(ft + fh * 0.16)} ${F(x + sw)} ${F(ft + fh * 0.22)}L${F(x + sw * 0.82)} ${F(ft + fh * 0.53)}Z"/>`;   // the back
        g += `<path fill="${skin}" d="${rect(x - hr * 0.45, hy + hr * 0.6, hr * 0.9, fh * 0.07)}"/><circle fill="${o.hair}" cx="${F(x)}" cy="${F(hy)}" r="${F(hr)}"/>`;   // neck, the head from behind
        if (o.long) g += `<path fill="${o.hair}" d="M${F(x - hr)} ${F(hy)}V${F(ft + fh * 0.22)}Q${F(x)} ${F(ft + fh * 0.25)} ${F(x + hr)} ${F(ft + fh * 0.22)}V${F(hy)}Z"/>`;
        if (o.hat) g += `<ellipse fill="${o.hat}" cx="${F(x)}" cy="${F(hy - hr * 0.15)}" rx="${F(hr * 1.9)}" ry="${F(hr * 0.5)}"/><path fill="${o.hat}" d="M${F(x - hr * 0.9)} ${F(hy - hr * 0.1)}A${F(hr * 0.9)} ${F(hr * 0.95)} 0 0 1 ${F(x + hr * 0.9)} ${F(hy - hr * 0.1)}Z"/>`
          + `<path fill="#7a4a2e" d="${rect(x - hr * 0.9, hy - hr * 0.42, hr * 1.8, hr * 0.28)}"/>`;
        g += `<path fill="#3a2e24" d="${rect(x - sw * 0.85, fy - fh * 0.02, sw * 0.7, fh * 0.03)}${rect(x + sw * 0.15, fy - fh * 0.02, sw * 0.7, fh * 0.03)}"/>`;   // shoes
        return g;
      };
      const vx = X(0.325);
      s += `<g class="isl-sjfig"><g class="isl-lq" data-q="y">${visitor(vx, { shirt: '#d8735a', shorts: '#c2ab7f', skin: '#8d5a3b', hair: '#2a211b', hat: '#dcc690', arms: 'phone' })}</g>`
        + `<g class="isl-lq" data-q="sd">${visitor(vx - sw * 1.6, { shirt: '#3d8a8f', skirt: '#3d8a8f', skin: '#6b4630', hair: '#1d1916', long: true, arms: 'lean' })}`
        + `${visitor(vx + sw * 1.6, { shirt: '#e8e4da', legs: '#2f3a4a', skin: '#a8714f', hair: '#2a211b', arms: 'point' })}</g></g>`;
    }
    // the cannon: barrel tapering from breech to muzzle, its top edge catching the light; carriage and
    // wheels on the floor
    const bl = 70 * u, br = 8 * u, gx = eX - bl * 0.5, gy = pTop + eD - br * 0.2;
    s += `<g transform="rotate(-5 ${F(gx)} ${F(gy)})"><path class="isl-vcannon" d="M${F(gx - bl * 0.32)} ${F(gy - br * 1.05)}L${F(gx + bl * 0.68)} ${F(gy - br * 0.72)}V${F(gy - br * 0.18)}L${F(gx - bl * 0.32)} ${F(gy + br * 0.05)}Z`
      + `M${F(gx - bl * 0.32)} ${F(gy - br * 0.5)}m${F(-br * 0.55)} 0a${F(br * 0.55)} ${F(br * 0.55)} 0 1 0 ${F(br * 1.1)} 0a${F(br * 0.55)} ${F(br * 0.55)} 0 1 0 ${F(-br * 1.1)} 0Z"/>`
      + `<path class="isl-vlit" d="M${F(gx - bl * 0.3)} ${F(gy - br * 1.02)}L${F(gx + bl * 0.66)} ${F(gy - br * 0.7)}v${F(br * 0.2)}L${F(gx - bl * 0.3)} ${F(gy - br * 0.78)}Z"/></g>`;
    const wy = pFoot + 4 * u, wr = br * 1.25;
    // its shadow on the floor under the carriage and wheels, so it stands on the ground
    s += `<ellipse class="isl-vcannon" cx="${F(gx - bl * 0.03)}" cy="${F(wy + wr + u)}" rx="${F(bl * 0.34)}" ry="${F(3.5 * u)}" fill-opacity=".32"/>`;
    s += `<path class="isl-vcannon" d="M${F(gx - bl * 0.34)} ${F(wy)}L${F(gx - bl * 0.2)} ${F(gy - br * 0.1)}H${F(gx + bl * 0.14)}L${F(gx + bl * 0.24)} ${F(wy)}Z"/>`;
    for (const wx of [-0.22, 0.16]) s += `<circle class="isl-vcannon" cx="${F(gx + bl * wx)}" cy="${F(wy)}" r="${F(wr)}"/><circle class="isl-vlit" cx="${F(gx + bl * wx)}" cy="${F(wy)}" r="${F(wr * 0.35)}"/>`;
    // the fort's lamp on its post at the parapet's end
    const flx = X(0.035), fly = pTop;
    s += `<path class="isl-vpost" d="M${F(flx - 1.2)} ${F(fly)}V${F(fly - 16 * u)}H${F(flx + 1.2)}V${F(fly)}Z"/><path class="isl-vpost isl-lcap" d="M${F(flx - 7 * u)} ${F(fly - 30 * u)}L${F(flx)} ${F(fly - 36 * u)}L${F(flx + 7 * u)} ${F(fly - 30 * u)}Z"/>`;
    s += `<path class="isl-vlamp isl-vwin isl-ltframe" style="--i:0" d="M${F(flx - 4.5 * u)} ${F(fly - 16 * u)}V${F(fly - 30 * u)}H${F(flx + 4.5 * u)}V${F(fly - 16 * u)}Z"/>`
      + panes(flx - 4.5 * u, fly - 30 * u, 9 * u, 14 * u);
    // The hills' lights, with the town's.
    s += `<path class="s-vlight isl-vwin" style="--i:4" d="${lightsD(far)}" stroke-width="1.2"/>`;
    return s;
  }

  /* THE LIBRARY (the Learn landing's head; the owner chose it, 2026-09-29, from AUA's photographs of its
     library, in the art's source folder as references/aua-library-*): the study hall seen along its
     length, with no one in it and a painter's licence on its layout. A row of windows in the far wall
     and one in the right-hand wall carry the time of day: the campus's trees and palms outside, a
     red-roofed block with its windows, the sky, and at night the stars and the Moon. Long cherry tables
     with the hall's double banker's lamps (green shades on bronze stands), grey perforated chairs, the
     red study carrels with aluminium frames and blue number plates at the right, a bookcase along the
     left-hand wall, a dropped ceiling and pale tiles. By Day the lamps are off and the sun lies on the
     floor under the windows; at Dawn, Sunset, Dusk and Night they are lit, each with its glow, the light
     it spills and its pool on the table. In the one pass the far tables' lamps come on, then the near
     table's, left to right, the last glowing in the page's hue. Built in metres and projected (one-point
     perspective, the eye 1.9 m up and 12 m from the far wall), so it keeps its proportions as the card
     changes shape. */
  // The hall's frame, shared by the drawing and the Moon's pane: the far wall's top and foot, its ends,
  // the vanishing point (left of centre, so the right-hand wall shows its window) and the windows. It is
  // sized from the card's width, as a picture about four times as wide as it is tall; a taller card (the
  // Learn head grows when the "Continue where you left off" panel is shown; owner, 2026-09-29) shows
  // more of the same hall, more ceiling above and more floor below, rather than a larger room.
  function libraryFrame(W, H) {
    const Hs = Math.min(H, W / 4.17), oy = (H - Hs) * 0.38, Ys = (f) => oy + f * Hs;
    const bL = W * 0.08, bR = W * 0.8, yC = Ys(0.1), yF = Ys(0.56), m = (yF - yC) / 3;
    const ww = (bR - bL) * 0.17, gap = (bR - bL - 4 * ww) / 5;
    return { Hs, oy, Ys, vx: W * 0.42, vy: Ys(0.28), bL, bR, yC, yF, m, ww, wT: yF - 2.5 * m, wB: yF - 0.62 * m,
      wins: [0, 1, 2, 3].map((i) => bL + gap + i * (ww + gap)) };
  }
  function library(W, H, v) {
    const X = (f) => f * W, r = rng(419);
    const { Hs, Ys, vx, vy, bL, bR, yC, yF, m, ww, wT, wB, wins } = libraryFrame(W, H), S = (f) => f * Hs, D = 12;
    const sc = (z) => D / (D - z);
    const pt = (lx, h, z) => { const k = sc(z); return [vx + (lx - vx) * k, vy + (yF - h * m - vy) * k]; };
    const lxAt = (x, z) => vx + (x - vx) / sc(z);
    const along = (bx, by, x) => vy + (by - vy) * (x - vx) / (bx - vx);
    const quad = (...p) => polyD(p);
    const wd = (w) => F(Math.max(0.6, w));
    // The windows: four in the far wall (narrow, wide and narrow panes, as in the photograph), one in
    // the right-hand wall.
    const sx0 = X(0.86), sx1 = X(0.965);
    const rwin = [[sx0, along(bR, wT, sx0)], [sx1, along(bR, wT, sx1)], [sx1, along(bR, wB, sx1)], [sx0, along(bR, wB, sx0)]];
    let s = '<defs><linearGradient id="isllwallg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-lwall0"/><stop offset="1" class="st-lwall1"/></linearGradient>'
      + '<linearGradient id="isllshadeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-lglow0"/><stop offset="1" class="st-lglow1"/></linearGradient>'
      // (2026-10-01, art-audit pass 4) the blur that softens the furniture's shadows on the floor (its region
      // the whole card, so it never cuts a thin shadow into a box), and the dimming of the hall's right side
      // where no lamp reaches, from nothing at 0.55 of the width to the side wall's shade at the right edge
      + `<filter id="isllsoft" filterUnits="userSpaceOnUse" x="0" y="0" width="${F(W)}" height="${F(H)}"><feGaussianBlur stdDeviation="${F(Math.max(0.6, Hs * 0.005))}"/></filter>`
      + `<linearGradient id="isllfall" gradientUnits="userSpaceOnUse" x1="${F(X(0.55))}" y1="0" x2="${F(W)}" y2="0"><stop offset="0" class="st-lfall" stop-opacity="0"/><stop offset=".55" class="st-lfall" stop-opacity=".22"/><stop offset="1" class="st-lfall" stop-opacity=".4"/></linearGradient></defs>`;
    // 1. Outside, through the windows: palms and a two-storey block with a red roof behind the campus's
    //    trees, lights along the drive. The trees cover the sea build() lays below the horizon.
    const bx0 = wins[0] + ww * 0.1, bx1 = wins[0] + ww * 0.78, bTop = Ys(0.3), bBot = Ys(0.4);
    s += `<path class="isl-bhouse" d="${rect(bx0, bTop, bx1 - bx0, bBot - bTop)}"/>`;
    s += `<path class="isl-broofr" d="${polyD([[bx0 - m * 0.1, bTop + 0.5], [bx0 + m * 0.35, bTop - m * 0.22], [bx1 - m * 0.35, bTop - m * 0.22], [bx1 + m * 0.1, bTop + 0.5]])}"/>`;
    let bw = '';
    for (let row = 0; row < 2; row++) for (let x = bx0 + m * 0.15; x < bx1 - m * 0.2; x += m * 0.32) bw += rect(x, bTop + m * (0.12 + row * 0.26), m * 0.14, m * 0.13);
    s += `<path class="f-pulse isl-vwin" style="--i:0" d="${bw}"/>`;
    s += palmsD([[wins[1] + ww * 0.9, Ys(0.43), S(0.2), -0.1, 7], [wins[2] + ww * 0.28, Ys(0.43), S(0.17), 0.12, 11],
      [wins[3] + ww * 0.78, Ys(0.43), S(0.15), -0.06, 5], [X(0.925), Ys(0.48), S(0.27), -0.12, 13]], 'isl-palm');
    const tops = [];
    for (let x = -6, i = 0; x <= W + 12; x += m * 0.8, i++) tops.push([x, Ys(0.36) + Math.sin(i * 1.7) * m * 0.12 + (r() - 0.5) * m * 0.2]);
    s += `<path class="f-far isl-land" d="${polyD([[-6, H + 2], ...tops, [W + 12, H + 2]])}${scrubLine(tops, 4, m * 0.2, m * 0.45, r)}"/>`;
    const out = [];
    for (let i = 0; i < 9; i++) out.push([X(0.1 + r() * 0.88), Ys(0.385) + r() * m * 0.15]);
    s += `<path class="s-vlight isl-vwin" style="--i:0" d="${lightsD(out)}" stroke-width="1.2"/>`;
    // 2. The hall: ceiling, walls (the side walls a shade darker), the window openings, the floor.
    const cl = along(bL, yC, -2), cr = along(bR, yC, W + 2), fl = along(bL, yF, -2), fr = along(bR, yF, W + 2);
    const lw = [[-2, cl], [bL, yC], [bL, yF], [-2, fl]], rw = [[bR, yC], [W + 2, cr], [W + 2, fr], [bR, yF]];
    s += `<path class="isl-lceil" d="${polyD([[-2, -2], [W + 2, -2], [W + 2, cr], [bR, yC], [bL, yC], [-2, cl]])}"/>`;
    // (each opening shows the wall's thickness, 0.25 m, on the side that faces the camera: the far windows
    // left of the vanishing point their left jamb, those right of it their right; the side window its far
    // jamb. A jamb inside a hole fills again under evenodd. The frames sit back in the reveal, below.)
    const ko = D / (D + 0.25), rec = (x, y) => [vx + (x - vx) * ko, vy + (y - vy) * ko];
    const jamb = (x) => polyD([[x, wT], rec(x, wT), rec(x, wB), [x, wB]]);
    const jambs = wins.map((x) => (x + ww / 2 < vx ? jamb(x) : jamb(x + ww))).join('');
    const kz = (sx0 - vx) / (bR - vx), rjw = 0.25 * m * kz;
    const rj = polyD([[sx0, along(bR, wT, sx0)], [sx0 + rjw, along(bR, wT, sx0 + rjw)], [sx0 + rjw, along(bR, wB, sx0 + rjw)], [sx0, along(bR, wB, sx0)]]);
    s += `<path fill="url(#isllwallg)" fill-rule="evenodd" d="${rect(bL, yC, bR - bL, yF - yC)}${wins.map((x) => rect(x, wT, ww, wB - wT)).join('')}${jambs}"/>`;
    s += `<path class="isl-lsidew" d="${jambs}"/>`;
    s += `<path fill="url(#isllwallg)" fill-rule="evenodd" d="${polyD(lw)}${polyD(rw)}${polyD(rwin)}${rj}"/>`;
    s += `<path class="isl-lsidew" fill-rule="evenodd" d="${polyD(lw)}${polyD(rw)}${polyD(rwin)}"/>`;
    s += `<path class="isl-lfloor" d="${polyD([[-2, fl], [bL, yF], [bR, yF], [W + 2, fr], [W + 2, H + 2], [-2, H + 2]])}"/>`;
    // the dropped ceiling's grid and its light panels, lit by Day
    let g = '';
    const sTop = (vy + 2) / (vy - yC);
    for (let k = 1; k < 8; k++) { const lx = bL + (bR - bL) * k / 8; g += `M${F(lx)} ${F(yC)}L${F(vx + (lx - vx) * sTop)} -2`; }
    for (let z = 1.4; z < D - 0.5; z += 1.6) {
      const k = sc(z), y = vy + (yC - vy) * k;
      if (y < -1) break;
      g += `M${F(Math.max(-2, vx + (bL - vx) * k))} ${F(y)}H${F(Math.min(W + 2, vx + (bR - vx) * k))}`;
    }
    s += `<path class="isl-lgrid" d="${g}" stroke-width=".7"/>`;
    // light panels in the grid, row after row toward the viewer, as far as the ceiling shows
    let pn = '';
    for (let row = 0, z = 0.25; z < D - 1.5; row++, z += 2.2) {
      if (pt(bL, 3, z + 0.9)[1] < -2) break;
      for (const k of row % 2 ? [2, 4, 6] : [1, 3, 5]) {
        const l0 = bL + (bR - bL) * (k + 0.15) / 8, l1 = bL + (bR - bL) * (k + 0.85) / 8;
        pn += quad(pt(l0, 3, z), pt(l1, 3, z), pt(l1, 3, z + 0.9), pt(l0, 3, z + 0.9));
      }
    }
    s += `<path class="isl-lpanel" d="${pn}"/>`;
    // the floor's tiles, 0.8 m, and the skirting
    let fg = '';
    const sBot = (H + 2 - vy) / (yF - vy), tile = 0.8 * m, nT = Math.round((bR - bL) / tile);
    for (let k = 1; k < nT; k++) { const lx = bL + (bR - bL) * k / nT; fg += `M${F(lx)} ${F(yF)}L${F(vx + (lx - vx) * sBot)} ${F(H + 2)}`; }
    for (let z = 0.8; z < D; z += 0.8) {
      const k = sc(z), y = vy + (yF - vy) * k;
      if (y > H + 2) break;
      fg += `M${F(Math.max(-2, vx + (bL - vx) * k))} ${F(y)}H${F(Math.min(W + 2, vx + (bR - vx) * k))}`;
    }
    s += `<path class="isl-lgrout" d="${fg}" stroke-width=".6"/>`;
    s += `<path class="isl-lbase" d="M-2 ${F(fl)}L${F(bL)} ${F(yF)}H${F(bR)}L${F(W + 2)} ${F(fr)}" stroke-width="${wd(m * 0.06)}"/>`;
    // window frames, mullions and sills
    let wf = '', mul = '', sill = '';
    for (const x of wins) {
      const [fx0, fy0] = rec(x, wT), [fx1, fy1] = rec(x + ww, wB);   // the frame, set back in the reveal
      wf += rect(fx0, fy0, fx1 - fx0, fy1 - fy0);
      mul += `M${F(fx0 + (fx1 - fx0) * 0.27)} ${F(fy0)}V${F(fy1)}M${F(fx0 + (fx1 - fx0) * 0.73)} ${F(fy0)}V${F(fy1)}`;
      sill += rect(x - m * 0.08, wB, ww + m * 0.16, m * 0.07);
    }
    const sxr = sx0 + rjw, smx = (sxr + sx1) / 2;
    const rwinF = [[sxr, along(bR, wT, sxr)], [sx1, along(bR, wT, sx1)], [sx1, along(bR, wB, sx1)], [sxr, along(bR, wB, sxr)]];
    mul += `M${F(smx)} ${F(along(bR, wT, smx))}L${F(smx)} ${F(along(bR, wB, smx))}`;
    // #72: the side window's sill, in perspective, a little longer than the opening, thicker toward the viewer
    const kxw = (x) => (x - vx) / (bR - vx), sa = sx0 - m * 0.08 * kxw(sx0), sb = sx1 + m * 0.08 * kxw(sx1);
    sill += polyD([[sa, along(bR, wB, sa)], [sb, along(bR, wB, sb)], [sb, along(bR, wB, sb) + m * 0.07 * kxw(sb)], [sa, along(bR, wB, sa) + m * 0.07 * kxw(sa)]]);
    s += `<path class="isl-lframe" d="${wf}${polyD(rwinF)}" stroke-width="${wd(m * 0.07)}"/><path class="isl-lframe" d="${mul}" stroke-width="${wd(m * 0.05)}"/><path class="isl-lsill" d="${sill}"/>`;
    // By Day the sun lies on the floor under the far windows.
    let sun = '';
    for (const x of wins) sun += quad(pt(x - m * 0.2, 0, 0.12), pt(x + ww - m * 0.2, 0, 0.12), pt(x + ww - m * 1.6, 0, 3.4), pt(x - m * 1.6, 0, 3.4));
    s += `<path class="isl-ydet isl-lsun" d="${sun}"/>`;
    // (2026-10-01, art-audit pass 4) Every piece of furniture's shadow on the floor, so the tables, chairs,
    // bookcase and carrels stand on the tiles instead of floating over them, in all five versions. They are
    // collected as each piece is drawn and laid here, on the floor and over the Day sun (so its patches are
    // cut where the far tables and chairs stand) but under all the furniture, in one softened group whose
    // opacity is the version's (layout-art.css, isl-ldrop), so where two shadows meet they do not darken twice.
    const dropAt = s.length, drop = [];
    const floorQ = (lx0, lx1, za, zb) => drop.push(`<path d="${quad(pt(lx0, 0, za), pt(lx1, 0, za), pt(lx1, 0, zb), pt(lx0, 0, zb))}"/>`);
    // 3. The bookcase along the left-hand wall: five shelves of books in three colours.
    const cx = bL + m * 0.35, z0 = 0.3, z1 = 2.6, shelves = [0.1, 0.55, 1, 1.45, 1.9];
    floorQ(cx, cx + 0.22 * m, z0, z1);   // (its shadow, a strip along its foot)
    s += `<path class="isl-lcase" d="${quad(pt(cx, 0, z0), pt(cx, 2.05, z0), pt(cx, 2.05, z1), pt(cx, 0, z1))}"/>`;
    const books = ['', '', ''];
    for (let i = 0; i < shelves.length - 1; i++) {
      for (let z = z0 + 0.05; z < z1 - 0.06;) {
        const t = 0.05 + r() * 0.04, bh = 0.26 + r() * 0.13;
        books[Math.floor(r() * 3)] += quad(pt(cx, shelves[i], z), pt(cx, shelves[i] + bh, z), pt(cx, shelves[i] + bh, z + t), pt(cx, shelves[i], z + t));
        z += t + (r() < 0.12 ? 0.08 : 0.004);
      }
    }
    s += books.map((d, i) => `<path class="isl-lbk${i + 1}" d="${d}"/>`).join('');
    s += `<path class="isl-lcase2" d="${shelves.map((h) => `M${F(pt(cx, h, z0)[0])} ${F(pt(cx, h, z0)[1])}L${F(pt(cx, h, z1)[0])} ${F(pt(cx, h, z1)[1])}`).join('')}" stroke-width="${wd(m * 0.05)}"/>`;
    // 4. Furniture, drawn far to near. A double lamp: a round base, a pole, a crossbar, two conical
    //    shades; lit, each shade glows green and spills its light onto the table as a pool.
    const lamp = (lx, z, i, last) => {
      const k = sc(z), [bx, by] = pt(lx, 0.75, z), [, py] = pt(lx, 1.23, z), arm = 0.2 * m * k;
      let o = `<ellipse class="isl-lbronze" cx="${F(bx)}" cy="${F(by)}" rx="${F(0.09 * m * k)}" ry="${F(0.025 * m * k)}"/>`
        + `<path class="isl-lbronze" d="${rect(bx - Math.max(0.5, 0.012 * m * k), py, Math.max(1, 0.024 * m * k), by - py)}${rect(bx - arm, py, 2 * arm, Math.max(1, 0.02 * m * k))}"/>`;
      let lit = '', shade = '', hi = '', cap = '';
      for (const sx of [bx - arm, bx + arm]) {
        const [, t0] = pt(lx, 1.22, z), [, t1] = pt(lx, 1.08, z), rt = 0.04 * m * k, rb = 0.13 * m * k, e = 0.03 * m * k;
        const cone = `M${F(sx - rt)} ${F(t0)}H${F(sx + rt)}L${F(sx + rb)} ${F(t1)}Q${F(sx)} ${F(t1 + e)} ${F(sx - rb)} ${F(t1)}Z`;
        shade += cone;
        hi += `M${F(sx - rt * 0.6)} ${F(t0 + (t1 - t0) * 0.08)}L${F(sx - rb * 0.62)} ${F(t1 - (t1 - t0) * 0.12)}`;
        cap += rect(sx - rt * 0.7, t0 - Math.max(1, 0.02 * m * k), rt * 1.4, Math.max(1, 0.02 * m * k));
        const [, ty] = pt(lx, 0.75, z);
        lit += `<path d="${polyD([[sx - rb * 0.9, t1], [sx + rb * 0.9, t1], [sx + rb * 2.1, ty], [sx - rb * 2.1, ty]])}" fill="url(#islvspill)"/>`
          + pool(sx, ty + 0.02 * m * k, rb * 3, rb * 0.55, 0.85)
          + halo(sx, (t0 + t1) / 2, rb * 3.2, last ? 'islvlamp' : 'islvbulb')
          + `<path d="${cone}" fill="url(#isllshadeg)"/>`
          + `<path class="isl-lrim" d="M${F(sx - rb)} ${F(t1)}Q${F(sx)} ${F(t1 + e)} ${F(sx + rb)} ${F(t1)}" stroke-width="${wd(0.012 * m * k)}"/>`;
      }
      return o + `<path class="isl-lshade" d="${shade}"/><path class="isl-lshadehi" d="${hi}" stroke-width="${wd(0.02 * m * k)}"/><path class="isl-lbronze" d="${cap}"/>` + `<g class="isl-vlamps isl-vwin${last ? ' isl-vlast' : ''}" style="--i:${i}">${lit}</g>`;
    };
    // A table: its top, its front edge, and its four legs (the far pair first, behind the near).
    const table = (lx0, lx1, za, zb) => {
      floorQ(lx0 + 0.04 * m, lx1 - 0.04 * m, za + 0.04, zb - 0.02);   // (its shadow, under its top; 2026-10-01)
      const a = pt(lx0, 0.75, za), b = pt(lx1, 0.75, za), c = pt(lx1, 0.75, zb), d = pt(lx0, 0.75, zb);
      const c2 = pt(lx1, 0.7, zb), d2 = pt(lx0, 0.7, zb);
      let legs = '';
      for (const z of [za + 0.06, zb - 0.06]) for (const lx of [lx0 + 0.06 * m, lx1 - 0.12 * m]) legs += quad(pt(lx, 0.7, z), pt(lx + 0.06 * m, 0.7, z), pt(lx + 0.06 * m, 0, z), pt(lx, 0, z));
      return `<path class="isl-lwood2" d="${legs}"/><path class="isl-lwood" d="${quad(a, b, c, d)}"/><path class="isl-lwood2" d="${quad(d, c, c2, d2)}"/>`
        + `<path class="isl-ledge" d="M${F(a[0])} ${F(a[1])}L${F(b[0])} ${F(b[1])}" stroke-width="${wd(0.015 * m * sc(za))}"/>`;
    };
    // A shell chair, perforated, seen from the front or the back: its backrest, seat and legs.
    const chair = (lx, z) => {
      const k = sc(z), w = 0.22 * m * k, [cxp, top] = pt(lx, 0.9, z), [, seat] = pt(lx, 0.47, z), [, foot] = pt(lx, 0, z);
      // (its shadow, an ellipse round its feet as deep as the seat; 2026-10-01)
      const [, fa] = pt(lx, 0, z - 0.25), [, fb] = pt(lx, 0, z + 0.25);
      drop.push(`<ellipse cx="${F(cxp)}" cy="${F((fa + fb) / 2)}" rx="${F(w * 1.05)}" ry="${F(Math.max(0.6, (fb - fa) / 2))}"/>`);
      let dots = '';
      for (let row = 0; row < 3; row++) for (let col = -2; col <= 2; col++) {
        const dx = cxp + col * w * 0.32, dy = top + (seat - top) * (0.22 + row * 0.22);
        dots += `M${F(dx - 0.012 * m * k)} ${F(dy)}a${F(0.012 * m * k)} ${F(0.012 * m * k)} 0 1 0 ${F(0.024 * m * k)} 0a${F(0.012 * m * k)} ${F(0.012 * m * k)} 0 1 0 ${F(-0.024 * m * k)} 0Z`;
      }
      return `<path class="isl-lchairleg" d="M${F(cxp - w * 0.8)} ${F(seat)}L${F(cxp - w * 0.9)} ${F(foot)}M${F(cxp + w * 0.8)} ${F(seat)}L${F(cxp + w * 0.9)} ${F(foot)}" stroke-width="${wd(0.02 * m * k)}"/>`
        + `<path class="isl-lchair" d="M${F(cxp - w)} ${F(seat)}V${F(top + w * 0.35)}Q${F(cxp - w)} ${F(top)} ${F(cxp - w * 0.6)} ${F(top)}H${F(cxp + w * 0.6)}Q${F(cxp + w)} ${F(top)} ${F(cxp + w)} ${F(top + w * 0.35)}V${F(seat)}Z`
        + `M${F(cxp - w * 1.05)} ${F(seat)}h${F(w * 2.1)}v${F(Math.max(1, 0.04 * m * k))}h${F(-w * 2.1)}Z"/><path class="isl-lchairdot" d="${dots}"/>`;
    };
    // Things left on the tables (owner, 2026-09-29: "less sterile"): the hall in use by Day, a few early
    // arrivals at Dawn, winding down at Sunset, in use again at Dusk by a few students working under the lit
    // lamps, and empty at Night with its lamps still lit. (Dusk had kept only the library's own stacks; since
    // 2026-10-01, art-audit pass 4, it follows the owner's photograph of this hall at that hour, full under
    // the green lamps: medical students study into the evening.) Each item carries the versions it shows in
    // (data-q: a Dawn, y Day, s Sunset, d Dusk; layout-art.css).
    const Q = {};
    const put = (q, svg) => { Q[q] = (Q[q] || '') + svg; };
    const flush = () => { const o = Object.keys(Q).map((q) => `<g class="isl-lq" data-q="${q}">${Q[q]}</g>`).join(''); for (const q in Q) delete Q[q]; return o; };
    const hw = (z) => Math.max(0.5, 0.012 * m * sc(z));
    const onT = (lx, dx, h, z) => pt(lx + dx * m, h, z);
    const openBook = (lx, z, cover) => {
      const pg = (s1) => quad(onT(lx, 0.19 * s1, 0.758, z - 0.12), onT(lx, 0, 0.775, z - 0.135), onT(lx, 0, 0.775, z + 0.125), onT(lx, 0.19 * s1, 0.758, z + 0.135));
      let lines = '';
      for (const s1 of [-1, 1]) for (let i = 0; i < 4; i++) {
        const zz = z - 0.08 + i * 0.05, [ax, ay] = onT(lx, 0.03 * s1, 0.772, zz), [bx2, by2] = onT(lx, 0.16 * s1, 0.76, zz + 0.01);
        lines += `M${F(ax)} ${F(ay)}L${F(bx2)} ${F(by2)}`;
      }
      const [g0x, g0y] = onT(lx, 0, 0.775, z - 0.135), [g1x, g1y] = onT(lx, 0, 0.775, z + 0.125);
      return `<path class="${cover}" d="${quad(onT(lx, -0.2, 0.752, z - 0.14), onT(lx, 0.2, 0.752, z - 0.14), onT(lx, 0.2, 0.752, z + 0.14), onT(lx, -0.2, 0.752, z + 0.14))}"/>`
        + `<path class="isl-lpage" d="${pg(-1)}${pg(1)}"/><path class="isl-ltext" d="${lines}" stroke-width="${F(hw(z) * 0.6)}"/>`
        + `<path class="isl-lgutter" d="M${F(g0x)} ${F(g0y)}L${F(g1x)} ${F(g1y)}" stroke-width="${F(hw(z))}"/>`;
    };
    const stack = (lx, z, n, i0) => {
      let o = '';
      for (let i = 0; i < n; i++) {
        const h0 = 0.75 + i * 0.045, h1 = h0 + 0.042, w = 0.13 - (i % 2) * 0.02, d = 0.1 - (i % 3) * 0.01, dx = (i % 2 ? 0.015 : -0.01);
        const cls = `isl-lbk${((i0 + i) % 3) + 1}`;
        o += `<path class="${cls}" d="${quad(onT(lx, dx - w, h1, z - d), onT(lx, dx + w, h1, z - d), onT(lx, dx + w, h1, z + d), onT(lx, dx - w, h1, z + d))}"/>`
          + `<path class="${cls}" d="${quad(onT(lx, dx - w, h0, z + d), onT(lx, dx + w, h0, z + d), onT(lx, dx + w, h1, z + d), onT(lx, dx - w, h1, z + d))}"/>`
          + `<path class="isl-lpageedge" d="${quad(onT(lx, dx - w + 0.01, h0 + 0.006, z + d), onT(lx, dx + w - 0.01, h0 + 0.006, z + d), onT(lx, dx + w - 0.01, h1 - 0.006, z + d), onT(lx, dx - w + 0.01, h1 - 0.006, z + d))}"/>`;
      }
      return o;
    };
    // a laptop seen from behind its lid (a seat on the far side of the table) or from the front
    const lapBack = (lx, z) => {
      const [cx, cy] = onT(lx, 0, 0.865, z + 0.025);
      return `<path class="isl-llap" d="${quad(onT(lx, -0.16, 0.752, z), onT(lx, 0.16, 0.752, z), onT(lx, 0.16, 0.975, z + 0.05), onT(lx, -0.16, 0.975, z + 0.05))}"/>`
        + `<circle class="isl-llogo" cx="${F(cx)}" cy="${F(cy)}" r="${F(hw(z) * 1.3)}"/>`;
    };
    const lapFront = (lx, z) => `<path class="isl-llap" d="${quad(onT(lx, -0.16, 0.752, z), onT(lx, 0.16, 0.752, z), onT(lx, 0.16, 0.752, z + 0.22), onT(lx, -0.16, 0.752, z + 0.22))}"/>`
      + `<path class="isl-lbezel" d="${quad(onT(lx, -0.16, 0.754, z), onT(lx, 0.16, 0.754, z), onT(lx, 0.16, 0.975, z - 0.05), onT(lx, -0.16, 0.975, z - 0.05))}"/>`
      + `<path class="isl-lscreen" d="${quad(onT(lx, -0.145, 0.77, z - 0.004), onT(lx, 0.145, 0.77, z - 0.004), onT(lx, 0.145, 0.96, z - 0.046), onT(lx, -0.145, 0.96, z - 0.046))}"/>`;
    const bottle = (lx, z, cls) => {
      const [bx2, by2] = onT(lx, 0, 0.75, z), [, bt] = onT(lx, 0, 0.99, z), bw = 0.035 * m * sc(z);
      return `<path class="${cls}" d="M${F(bx2 - bw)} ${F(by2)}V${F(bt + bw)}Q${F(bx2 - bw)} ${F(bt)} ${F(bx2)} ${F(bt)}Q${F(bx2 + bw)} ${F(bt)} ${F(bx2 + bw)} ${F(bt + bw)}V${F(by2)}Z"/>`
        + `<path class="isl-lalu" d="${rect(bx2 - bw * 0.7, bt - bw * 0.9, bw * 1.4, bw * 1.1)}"/>`;
    };
    const mug = (lx, z) => {
      const [mx, my] = onT(lx, 0, 0.75, z), [, mt] = onT(lx, 0, 0.85, z), mw = 0.045 * m * sc(z);
      return `<path class="isl-lmug" d="M${F(mx - mw)} ${F(my)}V${F(mt)}H${F(mx + mw)}V${F(my)}Z"/><path class="isl-lmugh" d="M${F(mx + mw)} ${F(mt + (my - mt) * 0.25)}q${F(mw * 0.8)} ${F((my - mt) * 0.25)} 0 ${F((my - mt) * 0.5)}" stroke-width="${F(hw(z) * 1.2)}"/>`;
    };
    const note = (lx, z) => `<path class="isl-lpage" d="${quad(onT(lx, -0.11, 0.752, z - 0.1), onT(lx, 0.1, 0.752, z - 0.12), onT(lx, 0.13, 0.752, z + 0.1), onT(lx, -0.08, 0.752, z + 0.12))}"/>`;
    // (2026-10-01, art-audit pass 4) The evening's things, from the owner's photograph of this hall at Dusk
    // (references/aua-library-1-study-hall-dusk): a laptop's screen lit toward the viewer, its cool glow and
    // the faint cool wash it lays on the cherry in front of it (isl-vlamps, so it is a light like the lamps');
    // headphones set down on their ear cups; a charger's cable run from a laptop to the socket in the nearest
    // lamp's base (the lamp, drawn after, covers its end).
    const screenGlow = (lx, z) => {
      const k = sc(z), [gx, gy] = onT(lx, 0, 0.865, z - 0.025), [wx, wy] = onT(lx, 0, 0.752, z + 0.17);
      const [, w0] = onT(lx, 0, 0.752, z + 0.02), [, w1] = onT(lx, 0, 0.752, z + 0.32);
      return `<g class="isl-vlamps">${halo(gx, gy, 0.4 * m * k, 'islvcool')}<ellipse cx="${F(wx)}" cy="${F(wy)}" rx="${F(0.34 * m * k)}" ry="${F((w1 - w0) / 2)}" fill="url(#islvcool)" opacity=".7"/></g>`;
    };
    const phones = (lx, z) => {
      const k = sc(z), [hx, hy] = onT(lx, 0, 0.75, z), [, top] = onT(lx, 0, 0.92, z), sp = 0.075 * m * k, pr = 0.03 * m * k, ph = 0.06 * m * k;
      return `<path class="isl-lphones" d="M${F(hx - sp)} ${F(hy - ph * 0.8)}C${F(hx - sp)} ${F(top)} ${F(hx + sp)} ${F(top)} ${F(hx + sp)} ${F(hy - ph * 0.8)}" stroke-width="${F(Math.max(0.8, 0.018 * m * k))}"/>`
        + [-1, 1].map((sg) => `<ellipse class="isl-lbezel" cx="${F(hx + sg * sp)}" cy="${F(hy - ph / 2)}" rx="${F(pr)}" ry="${F(ph / 2)}"/>`).join('');
    };
    // (a clear water bottle, its blue label round the middle, as the photograph's are)
    const water = (lx, z) => {
      const [bx2, b0] = onT(lx, 0, 0.83, z), [, b1] = onT(lx, 0, 0.88, z), bw = 0.035 * m * sc(z);
      return bottle(lx, z, 'isl-lclear') + `<path class="isl-lsign" d="${rect(bx2 - bw, b1, 2 * bw, b0 - b1)}"/>`;
    };
    const cord = (a, b, sag, z) => `<path class="isl-lcord" d="M${F(a[0])} ${F(a[1])}Q${F((a[0] + b[0]) / 2)} ${F(Math.max(a[1], b[1]) + sag)} ${F(b[0])} ${F(b[1])}" stroke-width="${F(Math.max(0.7, 0.01 * m * sc(z)))}"/>`;
    // a backpack hung on the back of a chair that faces away from the viewer: its two shoulder straps,
    // in its own color, hooked over the top of the chair's back (owner, 2026-09-29)
    const bag = (lx, z, cls) => {
      const k = sc(z + 0.12), w = 0.15 * m * k, [bx2, top] = pt(lx, 0.86, z + 0.12), [, bot] = pt(lx, 0.46, z + 0.12), rr = w * 0.45;
      // each strap's rounded end just over the chair back's top edge, as a strap hooked over it
      const sw = Math.max(1, 0.035 * m * k), [, ctop] = pt(lx, 0.9, z);
      const straps = [-1, 1].map((s) => `M${F(bx2 + s * w * 0.46)} ${F(top + rr * 0.6)}L${F(bx2 + s * w * 0.44)} ${F(ctop + sw * 0.35)}`).join('');
      return `<path class="${cls}s" d="${straps}" stroke-width="${F(sw)}"/><path class="${cls}" d="M${F(bx2 - w)} ${F(bot)}V${F(top + rr)}Q${F(bx2 - w)} ${F(top)} ${F(bx2 - w + rr)} ${F(top)}H${F(bx2 + w - rr)}Q${F(bx2 + w)} ${F(top)} ${F(bx2 + w)} ${F(top + rr)}V${F(bot)}Z"/>`
        + `<path class="isl-lbagp" d="${rect(bx2 - w * 0.62, top + (bot - top) * 0.52, w * 1.24, (bot - top) * 0.4)}"/>`
        + `<path class="isl-lbagh" d="M${F(bx2 - w * 0.35)} ${F(top)}q${F(w * 0.35)} ${F(-w * 0.5)} ${F(w * 0.7)} 0" stroke-width="${F(Math.max(0.8, 0.02 * m * k))}"/>`;
    };
    // The far row: two tables before the windows, their lamps against the glass, chairs drawn up.
    const f0 = bL + 0.8 * m, f1 = bL + 5.8 * m, f2 = bL + 6.8 * m, f3 = bL + 11.8 * m;
    s += table(f0, f1, 1, 1.8) + table(f2, f3, 1, 1.8);
    const farSeats = [f0 + (f1 - f0) * 0.12, f0 + (f1 - f0) * 0.5, f0 + (f1 - f0) * 0.9, f2 + (f3 - f2) * 0.12, f2 + (f3 - f2) * 0.5, f2 + (f3 - f2) * 0.9];
    ['y', 'ys', 'y', 'y', 'ys', 'y'].forEach((q, i) => put(q, openBook(farSeats[i], 1.6, `isl-lbk${(i % 3) + 1}`) + (i % 2 ? note(farSeats[i] + 0.3 * m, 1.55) : '')));
    s += flush();
    let li = 0;
    for (const lx of [f0 + (f1 - f0) * 0.3, f0 + (f1 - f0) * 0.72, f2 + (f3 - f2) * 0.3, f2 + (f3 - f2) * 0.72]) s += lamp(lx, 1.4, li++, false);
    for (const lx of farSeats) s += chair(lx, 2.3);
    put('y', bag(farSeats[0], 2.3, 'isl-lbag1') + bag(farSeats[3], 2.3, 'isl-lbag3'));
    put('ys', bag(farSeats[4], 2.3, 'isl-lbag2'));
    s += flush();
    // The carrels: a row along the right, red panels over grey with aluminium posts and rails, a blue
    // number plate on each post, their dividers' top edges running off to the right, the row's end
    // panel toward the viewer (the photographs' rows of carrels, turned to run with the hall).
    const cz = [2.2, 3.3, 4.4, 5.5, 6.6], lc = lxAt(X(0.78), 6.6), lc1 = lc + 1.4 * m;
    let red = '', grey = '', alu = '', sign = '';
    for (let k = 0; k < cz.length - 1; k++) {
      const a = cz[k], b = cz[k + 1];
      red += quad(pt(lc, 0.78, a), pt(lc, 1.42, a), pt(lc, 1.42, b), pt(lc, 0.78, b));
      grey += quad(pt(lc, 0.08, a), pt(lc, 0.78, a), pt(lc, 0.78, b), pt(lc, 0.08, b));
    }
    red += quad(pt(lc, 0.78, 6.6), pt(lc1, 0.78, 6.6), pt(lc1, 1.42, 6.6), pt(lc, 1.42, 6.6));
    grey += quad(pt(lc, 0.08, 6.6), pt(lc1, 0.08, 6.6), pt(lc1, 0.78, 6.6), pt(lc, 0.78, 6.6));
    alu += quad(pt(lc, 1.42, cz[0]), pt(lc, 1.47, cz[0]), pt(lc, 1.47, 6.6), pt(lc, 1.42, 6.6)) + quad(pt(lc, 0.76, cz[0]), pt(lc, 0.8, cz[0]), pt(lc, 0.8, 6.6), pt(lc, 0.76, 6.6));
    // (the end's rails and posts wound as the long side's, so where they overlap the fill holds: wound the
    // other way the nearest post and rails had shown as hollow outlines)
    alu += quad(pt(lc, 1.42, 6.6), pt(lc, 1.47, 6.6), pt(lc1, 1.47, 6.6), pt(lc1, 1.42, 6.6)) + quad(pt(lc, 0.76, 6.6), pt(lc, 0.8, 6.6), pt(lc1, 0.8, 6.6), pt(lc1, 0.76, 6.6));
    for (const z of cz) {
      alu += quad(pt(lc, 0, z - 0.03), pt(lc, 1.47, z - 0.03), pt(lc, 1.47, z + 0.03), pt(lc, 0, z + 0.03));
      const [ax, ay] = pt(lc, 1.47, z), [bx2, by2] = pt(lc + 1.1 * m, 1.47, z);
      alu += `M${F(ax)} ${F(ay - 0.5)}L${F(bx2)} ${F(by2 - 0.5)}L${F(bx2)} ${F(by2 + Math.max(1, 0.03 * m * sc(z)))}L${F(ax)} ${F(ay + Math.max(1, 0.03 * m * sc(z)))}Z`;
      if (z < 6.6) sign += quad(pt(lc, 1.24, z + 0.05), pt(lc, 1.36, z + 0.05), pt(lc, 1.36, z + 0.3), pt(lc, 1.24, z + 0.3));
    }
    sign += quad(pt(lc + 0.08 * m, 1.24, 6.6), pt(lc + 0.36 * m, 1.24, 6.6), pt(lc + 0.36 * m, 1.36, 6.6), pt(lc + 0.08 * m, 1.36, 6.6));
    for (const x of [lc, lc1]) alu += quad(pt(x - 0.03 * m, 0, 6.6), pt(x - 0.03 * m, 1.47, 6.6), pt(x + 0.03 * m, 1.47, 6.6), pt(x + 0.03 * m, 0, 6.6));
    s += `<path class="isl-lred2" d="${grey}"/><path class="isl-lred" d="${red}"/><path class="isl-lredsh" d="${red}"/><path class="isl-lalu" d="${alu}"/><path class="isl-lsign" d="${sign}"/>`;
    // (their shadow, the row's footprint a little wider, seen along its side and under the panels' foot)
    floorQ(lc - 0.12 * m, lc1 + 0.04 * m, cz[0] - 0.04, 6.72);
    // (2026-10-01, art-audit pass 4) At Dusk and Night the lamps light only the tables, which all stand left
    // of the middle, so the hall falls into dimness away from them: a falloff over the right-hand floor,
    // carrels, walls and ceiling, from nothing at 0.55 of the width to the side wall's shade at the right
    // edge. The window openings are left out of it, since the view outside is not the room's light, except
    // where the carrels stand in front of them (a mask: the card, less the openings, plus the carrels; cut
    // out as plain holes, the openings had left a bright box on the row's end where it crosses the side
    // window). By Day, Dawn and Sunset the daylight through the windows fills the room evenly, so it is not
    // drawn there.
    const fx = X(0.55), fwin = wins.filter((x) => x + ww > fx).map((x) => rect(x, wT, ww, wB - wT)).join('');
    s += `<g class="isl-lq" data-q="dn"><defs><mask id="isllfallm" maskUnits="userSpaceOnUse" x="0" y="0" width="${F(W)}" height="${F(H)}">`
      + `<path fill="#fff" d="${rect(fx, -2, W + 2 - fx, H + 4)}"/><path fill="#000" d="${fwin}${polyD(rwin)}"/>`
      + [grey, red, alu, sign].map((d) => `<path fill="#fff" d="${d}"/>`).join('') + '</mask></defs>'
      + `<path fill="url(#isllfall)" mask="url(#isllfallm)" d="${rect(fx, -2, W + 2 - fx, H + 4)}"/></g>`;
    // The middle row: a table with two lamps, chairs on its far side.
    const m0 = lxAt(X(0.03), 5.4), m1 = lxAt(X(0.56), 5.4);
    for (const q of [0.12, 0.42, 0.7, 0.93]) s += chair(m0 + (m1 - m0) * q, 4.2);
    s += table(m0, m1, 4.6, 5.4);
    const mid = (q) => m0 + (m1 - m0) * q;
    put('y', openBook(mid(0.12), 4.85, 'isl-lbk2') + openBook(mid(0.7), 4.85, 'isl-lbk1') + bottle(mid(0.76), 4.75, 'isl-lbottle2'));
    // (d: in use at Dusk, as in the owner's photograph, with a clear water bottle beside the laptop; 2026-10-01)
    put('ysd', lapBack(mid(0.42), 4.8) + note(mid(0.46), 4.9));
    put('d', water(mid(0.35), 4.75));
    put('ysa', openBook(mid(0.93), 4.85, 'isl-lbk3'));
    put('yasd', stack(mid(0.56), 4.8, 2, 1));
    s += flush();
    s += lamp(m0 + (m1 - m0) * 0.28, 5, 4, false) + lamp(m0 + (m1 - m0) * 0.72, 5, 5, false);
    // The near table across the foot of the picture, its far edge and three lamps in full view: chairs
    // drawn up on its far side, a closed laptop, a pair of books, an open book, a red water bottle.
    const n0 = lxAt(X(-0.04), 9.4), n1 = lxAt(X(0.62), 9.4);
    for (const q of [0.06, 0.33, 0.66, 0.93]) s += chair(n0 + (n1 - n0) * q, 8);
    s += table(n0, n1, 8.4, 9.6);
    const near = (q) => n0 + (n1 - n0) * q;
    // seats on the far side, their things near the far edge
    put('yas', openBook(near(0.06), 8.72, 'isl-lbk1') + note(near(0.11), 8.66) + bottle(near(0.02), 8.6, 'isl-lbottle'));
    put('y', lapBack(near(0.33), 8.62) + openBook(near(0.38), 8.72, 'isl-lbk3'));
    // (d: this seat in use at Dusk, with a clear water bottle; 2026-10-01)
    put('ysd', openBook(near(0.64), 8.72, 'isl-lbk2') + stack(near(0.7), 8.66, 2, 2));
    put('d', water(near(0.565), 8.55));
    put('ys', lapBack(near(0.93), 8.62) + bottle(near(0.97), 8.7, 'isl-lbottle2'));
    // the library's own reference books, left stacked: the hall's baseline, gone only at Night
    put('yasd', stack(near(0.43), 8.62, 3, 0));
    // seats on the near side, their things near the near edge
    // clear of the first lamp's stand, which would otherwise stand in front of the screen (owner, 2026-09-29)
    put('ys', lapFront(near(0.34), 9.28) + mug(near(0.4), 9.3));
    // (d: this seat in use at Dusk, its headphones set down beside it and its charger run to the second
    // lamp's base, as in the owner's photograph; its laptop and mug follow the lamps, below; 2026-10-01)
    put('d', phones(near(0.39), 8.95)
      + cord(onT(near(0.34), 0.17, 0.752, 9.36), pt(near(0.5) - 0.06 * m, 0.75, 8.9), 0.05 * m * sc(9.2), 9.2));
    put('y', openBook(near(0.55), 9.34, 'isl-lbk1') + note(near(0.6), 9.3));
    put('ya', openBook(near(0.86), 9.34, 'isl-lbk2') + bottle(near(0.91), 9.3, 'isl-lbottle'));
    // (d: a second student at Dusk, at the near seat on the right, its charger run to the third lamp's base;
    // 2026-10-01. A takeaway box at the table's empty end was left out: at 1920 its red lid on a pale tub read
    // as a book, pass 4 review)
    put('d', cord(onT(near(0.9), -0.17, 0.752, 9.36), pt(near(0.8) + 0.06 * m, 0.75, 8.9), 0.05 * m * sc(9.2), 9.2));
    s += flush();
    for (const [q, i] of [[0.2, 6], [0.5, 7], [0.8, 8]]) s += lamp(n0 + (n1 - n0) * q, 8.9, i, i === 8);
    // (d: Dusk's two laptops, lit, with the first seat's mug and the second's clear water bottle. They stand
    // nearer than the lamps, so they are drawn after them: drawn before, the lamps' warm pools and spill had
    // run across the lit screens; 2026-10-01)
    put('d', lapFront(near(0.34), 9.28) + mug(near(0.4), 9.3) + screenGlow(near(0.34), 9.28)
      + lapFront(near(0.9), 9.28) + screenGlow(near(0.9), 9.28) + water(near(0.96), 9.3));
    s += flush();
    for (const q of [0.22, 0.55, 0.86]) s += chair(near(q), 10);
    // (each Dusk seat's bag shows with its things, so the reasons hold seat by seat; 2026-10-01)
    put('ysd', bag(near(0.22), 10, 'isl-lbag1'));
    put('y', bag(near(0.55), 10, 'isl-lbag2'));
    put('yad', bag(near(0.86), 10, 'isl-lbag3'));
    s += flush();
    // (the furniture's shadows, laid on the floor where it was drawn, before the bookcase; see dropAt)
    s = s.slice(0, dropAt) + `<g class="isl-ldrop" filter="url(#isllsoft)">${drop.join('')}</g>` + s.slice(dropAt);
    // (isl-lhall carries the library's own Dusk values for the carrels and window frames, layout-art.css)
    return `<g class="isl-lhall" style="--isl-vstep:.32s">${s}</g>`;
  }

  /* THE TOOL WALL (the Tool Directory's head; owner, 2026-09-29: art that ties to the page's title at a
     glance): a workshop's shadow board, every tool hanging in its own painted outline, which is what a
     directory of tools looks like on a wall. By Day and at Sunset the hammer is out on the bench and its
     outline is empty; at Dawn, before work starts, and from Dusk, once the bench is tidied, it is back in
     place and the board is complete (art-audit pass 4, 2026-10-01). A workbench below with a vise, a
     block plane on a plank and its shavings; a lamp hanging between the board and the window, lit in
     the page's hue; the window onto a harbour, boats at anchor, facing the Sun's setting bearing so the
     Sun sets in it at Sunset. Drawn face on, the tools sized from the board so they keep their shapes as the head's
     text changes the card's height. The harbour's lights come on, then the lamp, last. */
  function toolFrame(W, H) {
    const ww = clamp(H * 1.1, W * 0.2, W * 0.3), wx1 = W * 0.955, wx0 = wx1 - ww;
    return { wx0, wx1, ww, wT: H * 0.1, wB: H * 0.62, hz: H * 0.46 };
  }
  // The shadow board's tools, each drawn hanging from its hook at (0, 0), s the tool scale: its painted
  // outline (the same shape, grown by a stroke), and its parts by material.
  const TOOLS = {
    saw: (s) => {
      const blade = polyD([[-0.06 * s, 0.17 * s], [0.1 * s, 0.17 * s], [0.045 * s, 0.84 * s], [-0.035 * s, 0.84 * s]]);
      let teeth = '';
      for (let t = 0; t < 1; t += 0.06) {
        const x = 0.1 * s + (0.045 - 0.1) * s * t, y = 0.18 * s + 0.66 * s * t;
        teeth += `M${F(x)} ${F(y)}l${F(0.02 * s)} ${F(0.018 * s)}l${F(-0.02 * s)} ${F(0.02 * s)}`;
      }
      const grip = `M${F(-0.09 * s)} ${F(0.2 * s)}V${F(0.05 * s)}Q${F(-0.09 * s)} 0 ${F(-0.04 * s)} 0H${F(0.05 * s)}Q${F(0.11 * s)} 0 ${F(0.11 * s)} ${F(0.06 * s)}V${F(0.2 * s)}Z`;
      const hole = `M${F(-0.05 * s)} ${F(0.13 * s)}V${F(0.07 * s)}Q${F(-0.05 * s)} ${F(0.04 * s)} ${F(-0.02 * s)} ${F(0.04 * s)}H${F(0.05 * s)}Q${F(0.07 * s)} ${F(0.04 * s)} ${F(0.07 * s)} ${F(0.07 * s)}V${F(0.13 * s)}Z`;
      return { sil: blade + grip, parts: [['isl-lalu', blade], ['isl-tteeth', teeth, 0.012 * s], ['isl-lwood', grip + hole, 0, 'evenodd']] };
    },
    hammer: (s) => {
      const head = `M${F(-0.1 * s)} ${F(0.012 * s)}H${F(0.02 * s)}Q${F(0.1 * s)} ${F(0.01 * s)} ${F(0.13 * s)} ${F(0.07 * s)}Q${F(0.08 * s)} ${F(0.045 * s)} ${F(0.02 * s)} ${F(0.07 * s)}H${F(-0.1 * s)}Z`;
      const face = rect(-0.12 * s, 0, 0.035 * s, 0.085 * s);
      const handle = `M${F(-0.025 * s)} ${F(0.07 * s)}H${F(0.02 * s)}L${F(0.028 * s)} ${F(0.58 * s)}Q${F(0 * s)} ${F(0.63 * s)} ${F(-0.03 * s)} ${F(0.58 * s)}Z`;
      return { sil: head + face + handle, parts: [['isl-lbk3', handle], ['isl-tiron', head + face]] };
    },
    wrench: (s) => {
      const jaw = `M${F(-0.075 * s)} ${F(0.17 * s)}V${F(0.045 * s)}Q${F(-0.075 * s)} 0 ${F(-0.035 * s)} 0H${F(-0.016 * s)}V${F(0.085 * s)}H${F(0.016 * s)}V0H${F(0.035 * s)}Q${F(0.075 * s)} 0 ${F(0.075 * s)} ${F(0.045 * s)}V${F(0.17 * s)}Z`;
      const bar = `M${F(-0.034 * s)} ${F(0.16 * s)}H${F(0.034 * s)}L${F(0.03 * s)} ${F(0.66 * s)}Q${F(0.03 * s)} ${F(0.7 * s)} ${F(0 * s)} ${F(0.7 * s)}Q${F(-0.03 * s)} ${F(0.7 * s)} ${F(-0.03 * s)} ${F(0.66 * s)}Z`;
      const hole = `M${F(-0.012 * s)} ${F(0.64 * s)}a${F(0.012 * s)} ${F(0.012 * s)} 0 1 0 ${F(0.024 * s)} 0a${F(0.012 * s)} ${F(0.012 * s)} 0 1 0 ${F(-0.024 * s)} 0Z`;
      return { sil: jaw + bar, parts: [['isl-lalu', jaw + bar + hole, 0, 'evenodd']] };
    },
    drivers: (s) => {
      let sil = '';
      const parts = [];
      [[-0.1, 0.62, 'isl-lbottle'], [0, 0.52, 'isl-lbottle2'], [0.1, 0.44, 'isl-lbk3']].forEach(([dx, len, cls]) => {
        const x = dx * s, grip = `M${F(x - 0.03 * s)} ${F(0.2 * s)}V${F(0.03 * s)}Q${F(x - 0.03 * s)} 0 ${F(x)} 0Q${F(x + 0.03 * s)} 0 ${F(x + 0.03 * s)} ${F(0.03 * s)}V${F(0.2 * s)}Z`;
        const shaft = rect(x - 0.008 * s, 0.2 * s, 0.016 * s, (len - 0.2) * s);
        const fer = rect(x - 0.018 * s, 0.195 * s, 0.036 * s, 0.03 * s);
        sil += grip + shaft;
        parts.push([cls, grip], ['isl-lalu', shaft + fer], ['isl-tflute', `M${F(x - 0.012 * s)} ${F(0.04 * s)}V${F(0.18 * s)}M${F(x + 0.012 * s)} ${F(0.04 * s)}V${F(0.18 * s)}`, 0.008 * s]);
      });
      return { sil, parts };
    },
    pliers: (s) => {
      const arm = (sg) => `M${F(sg * 0.012 * s)} ${F(0.44 * s)}L${F(sg * 0.075 * s)} ${F(0.03 * s)}Q${F(sg * 0.068 * s)} 0 ${F(sg * 0.05 * s)} ${F(0.01 * s)}L${F(-sg * 0.012 * s)} ${F(0.42 * s)}Z`;
      const grip = (sg) => `M${F(sg * 0.075 * s)} ${F(0.03 * s)}Q${F(sg * 0.068 * s)} 0 ${F(sg * 0.05 * s)} ${F(0.01 * s)}L${F(sg * 0.03 * s)} ${F(0.24 * s)}L${F(sg * 0.052 * s)} ${F(0.25 * s)}Z`;
      const jaws = `M${F(-0.03 * s)} ${F(0.44 * s)}H${F(0.03 * s)}L${F(0.012 * s)} ${F(0.66 * s)}H${F(-0.012 * s)}Z`;
      const pivot = `M${F(-0.02 * s)} ${F(0.43 * s)}a${F(0.02 * s)} ${F(0.02 * s)} 0 1 0 ${F(0.04 * s)} 0a${F(0.02 * s)} ${F(0.02 * s)} 0 1 0 ${F(-0.04 * s)} 0Z`;
      return { sil: arm(-1) + arm(1) + jaws, parts: [['isl-lalu', arm(-1) + arm(1) + jaws], ['isl-lbottle', grip(-1) + grip(1)], ['isl-tiron', pivot]] };
    },
    chisels: (s) => {
      let sil = '';
      const parts = [];
      [-0.09, 0, 0.09].forEach((dx, i) => {
        const x = dx * s, w = (0.022 - i * 0.004) * s;
        const grip = `M${F(x - 0.026 * s)} ${F(0.15 * s)}V${F(0.025 * s)}Q${F(x - 0.026 * s)} 0 ${F(x)} 0Q${F(x + 0.026 * s)} 0 ${F(x + 0.026 * s)} ${F(0.025 * s)}V${F(0.15 * s)}Z`;
        const blade = `M${F(x - w)} ${F(0.16 * s)}H${F(x + w)}V${F(0.34 * s)}L${F(x - w)} ${F(0.37 * s)}Z`;
        sil += grip + blade;
        parts.push(['isl-lwood', grip], ['isl-tiron', rect(x - 0.02 * s, 0.145 * s, 0.04 * s, 0.022 * s)], ['isl-lalu', blade]);
      });
      return { sil, parts };
    },
    // chisels on top and, under them, a tape measure hung by its clip
    chiseltape: (s) => {
      const c = TOOLS.chisels(s), cy = 0.53 * s, R = 0.085 * s;
      const tape = `M${F(-R)} ${F(cy)}a${F(R)} ${F(R)} 0 1 0 ${F(2 * R)} 0a${F(R)} ${F(R)} 0 1 0 ${F(-2 * R)} 0Z`;
      const tab = rect(R * 0.55, cy + R * 0.5, R * 0.75, R * 0.28);
      const clip = rect(-R * 0.18, cy - R * 1.2, R * 0.36, R * 0.3);
      const hub = `M${F(-R * 0.32)} ${F(cy)}a${F(R * 0.32)} ${F(R * 0.32)} 0 1 0 ${F(R * 0.64)} 0a${F(R * 0.32)} ${F(R * 0.32)} 0 1 0 ${F(-R * 0.64)} 0Z`;
      return { sil: c.sil + tape + tab, parts: [...c.parts, ['isl-lbk3', tape], ['isl-tiron', hub + clip], ['isl-lalu', tab]] };
    },
    square: (s) => {
      const L = polyD([[0, 0], [0.045 * s, 0], [0.045 * s, 0.5 * s], [0.3 * s, 0.5 * s], [0.3 * s, 0.545 * s], [0, 0.545 * s]]);
      let ticks = '';
      for (let t = 0.04; t < 0.49; t += 0.03) ticks += `M${F(0.045 * s)} ${F(t * s)}h${F((Math.round(t / 0.03) % 5 ? -0.012 : -0.022) * s)}`;
      for (let t = 0.07; t < 0.29; t += 0.03) ticks += `M${F(t * s)} ${F(0.5 * s)}v${F((Math.round(t / 0.03) % 5 ? 0.012 : 0.022) * s)}`;
      return { sil: L, parts: [['isl-lalu', L], ['isl-tteeth', ticks, 0.006 * s]] };
    },
  };
  function toolWall(W, H, v) {
    const y0 = v.y0, X = (f) => f * W, Y = (f) => f * H, r = rng(523);
    const { wx0, wx1, ww, wT, wB } = toolFrame(W, H);
    const lights = [];
    let s = '<defs><linearGradient id="isltwallg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-lwall0"/><stop offset="1" class="st-lwall1"/></linearGradient></defs>';
    // 1. Through the window: the far side of the harbour, its hills on the horizon rimmed by the
    //    afterglow, mist at their foot; boats at anchor with their masts and masthead lights, each light
    //    laying its column on the water, and the boats' faint reflections.
    const hill = [[0, 0.01], [0.12, 0.05], [0.26, 0.085], [0.38, 0.07], [0.5, 0.045], [0.66, 0.06], [0.8, 0.035], [1, 0.015]]
      .map(([x, h]) => [wx0 + ww * x, y0 - Y(h)]);
    const farLand = `<path class="f-isl" d="${polyD([[wx0 - 2, y0 + 1], ...hill, [wx1 + 2, y0 + 1]])}${scrubLine(hill, 2, 0.5, 1.1, r)}"/>`;
    s += farLand + `<path class="s-rim" d="${lineD(hill.map(([x, y]) => [x, y + 0.5]))}" stroke-width="1" stroke-opacity=".3"/>`;
    s += mirrored(y0, farLand, 0.16) + mist(wx0, y0, ww, Y(0.05), 0.45);
    for (let i = 0; i < 7; i++) lights.push([wx0 + ww * (0.05 + r() * 0.9), y0 - Y(0.006 + r() * 0.03)]);
    let hulls = '', masts = '';
    // (the middle boat in the left pane's open water: on the mullion, its mast and light were hidden over
    // their column of light)
    for (const [fx, fy, k] of [[0.2, 0.1, 0.9], [0.4, 0.06, 0.7], [0.78, 0.13, 1.1]]) {
      const bx = wx0 + ww * fx, by = y0 + Y(fy), hw = Y(0.045) * k, mh = Y(0.24) * k;
      const hull = `M${F(bx - hw)} ${F(by - Y(0.016) * k)}H${F(bx + hw)}L${F(bx + hw * 0.72)} ${F(by)}H${F(bx - hw * 0.78)}Z`;
      hulls += hull;
      masts += `M${F(bx)} ${F(by - Y(0.016) * k)}V${F(by - mh)}M${F(bx)} ${F(by - mh * 0.85)}L${F(bx + hw * 0.9)} ${F(by - Y(0.02) * k)}`;
      lights.push([bx, by - mh, 'b']);
      s += dashes(streakList(bx, by + 1, H, r, 0.05, 0.06), 's-vcoolglow', 1, [0.08, 0.16, 0.3]);
      s += `<g opacity=".15"><g transform="translate(0 ${F(2 * by)}) scale(1 -1)"><path class="isl-vhull" d="${hull}"/><path class="isl-vmast" d="M${F(bx)} ${F(by)}V${F(by - mh)}" stroke-width=".8"/></g></g>`;
    }
    s += `<path class="isl-vhull" d="${hulls}"/><path class="isl-vmast" d="${masts}" stroke-width=".8"/>`;
    s += lightsPaths(lights);
    // 2. The wall with the window cut out of it, the reveal's shadow on its right jamb (the one the viewer,
    //    to the window's left, can see) and its sill, the
    //    frame, one mullion and one transom, and the sill.
    s += `<path fill="url(#isltwallg)" fill-rule="evenodd" d="${rect(-2, -2, W + 4, H + 4)}${rect(wx0, wT, ww, wB - wT)}"/>`;
    const rv = Math.max(2, Y(0.025));
    s += `<path class="isl-lsidew" d="${polyD([[wx1, wT], [wx1 - rv, wT + rv], [wx1 - rv, wB], [wx1, wB]])}${rect(wx0, wB - rv, ww, rv)}"/>`;
    s += `<path class="isl-lframe" d="${rect(wx0, wT, ww, wB - wT)}" stroke-width="${F(Math.max(1.5, Y(0.018)))}"/>`
      + `<path class="isl-lframe" d="M${F(wx0 + ww * 0.5)} ${F(wT)}V${F(wB)}M${F(wx0)} ${F(wT + (wB - wT) * 0.42)}H${F(wx1)}" stroke-width="${F(Math.max(1, Y(0.011)))}"/>`
      + `<path class="isl-lsill" d="${rect(wx0 - Y(0.02), wB, ww + Y(0.04), Math.max(2, Y(0.022)))}"/>`;
    // 3. The shadow board: a pegboard in a wooden frame, its holes in rows, each tool in its painted
    //    outline on a hook.
    const lampGap = clamp(H * 0.42, W * 0.08, W * 0.14);
    const bx0 = X(0.035), bx1 = wx0 - lampGap, bT = Y(0.07), bB = Y(0.66), bw = bx1 - bx0, bh = bB - bT;
    // (the lamp's place, drawn in section 5, and the bench's top, section 4, set here since the lamp's light
    // falls on the board and the wall down to the bench: art-audit pass 4)
    const lx = (bx1 + wx0) / 2, lT = Y(0.08), lB = Y(0.19), rt = Y(0.022), rb = Y(0.1), tTop = Y(0.705);
    s += `<path class="isl-tdrop" d="${rect(bx0 + Y(0.01), bT + Y(0.02), bw + Y(0.012), bh + Y(0.01))}"/>`;
    s += `<path class="isl-tboard" d="${rect(bx0, bT, bw, bh)}"/>`;
    let holes = '';
    const hs = Math.max(5, bh * 0.07), hr = Math.max(0.45, bh * 0.006);
    for (let y = bT + hs * 0.6; y < bB - hs * 0.3; y += hs) for (let x = bx0 + hs * 0.6; x < bx1 - hs * 0.3; x += hs) holes += `M${F(x - hr)} ${F(y)}a${F(hr)} ${F(hr)} 0 1 0 ${F(2 * hr)} 0a${F(hr)} ${F(hr)} 0 1 0 ${F(-2 * hr)} 0Z`;
    s += `<path class="isl-tpeg" d="${holes}"/>`;
    s += `<path class="isl-lwood2" fill-rule="evenodd" d="${rect(bx0 - Y(0.018), bT - Y(0.018), bw + Y(0.036), bh + Y(0.036))}${rect(bx0, bT, bw, bh)}"/>`;
    const order = [['saw', 0.22], ['hammer', 0.25], ['wrench', 0.15], ['drivers', 0.26], ['pliers', 0.15], ['chiseltape', 0.24], ['square', 0.3]];
    const tw = order.reduce((a, [, w]) => a + w, 0), ts = Math.min(bh * 0.95, bw / (tw + 0.5)), gap = (bw - tw * ts) / (order.length + 1);
    let x = bx0 + gap, sil = '', cast = '', hooks = '', board = '', hammerX = 0;
    for (const [k, w] of order) {
      const cx = k === 'square' ? x + 0.02 * ts : x + (w * ts) / 2, top = bT + bh * 0.1;
      const t = TOOLS[k](ts);
      const at = `translate(${F(cx)} ${F(top)})`;
      sil += `<path transform="${at}" d="${t.sil}"/>`;
      // (screwdrivers and chisels hang in a wooden rack across their group, just under the ferrules, as on a
      // real shadow board, and the tape measure hangs by its clip from its own peg)
      const rack = { drivers: [0.225, 0.14], chiseltape: [0.168, 0.125] }[k];
      if (!rack) hooks += `M${F(cx + (k === 'square' ? 0.02 * ts : 0))} ${F(top - bh * 0.035)}v${F(bh * 0.05)}`;
      if (k === 'chiseltape') hooks += `M${F(cx)} ${F(top + 0.39 * ts)}v${F(0.05 * ts)}`;
      // (each tool's shadow on the board, its own shape again with its rack's, drawn below; the hammer's only
      // while it hangs, in its group's versions: art-audit pass 4, 2026-10-01)
      const shape = `<path transform="${at}" d="${t.sil}${rack ? rect(-rack[1] * ts, rack[0] * ts, 2 * rack[1] * ts, 0.03 * ts) : ''}"/>`;
      cast += k === 'hammer' ? `<g class="isl-lq" data-q="adn">${shape}</g>` : shape;
      const drawn = t.parts.map(([cls, d, sw, rule]) => sw
        ? `<path class="${cls}" d="${d}" stroke-width="${F(Math.max(0.5, sw))}"/>`
        : `<path class="${cls}" d="${d}"${rule ? ` fill-rule="${rule}"` : ''}/>`);
      // (the bare steel's edges on the lamp's side, which is also the window's, catch the light: the saw's
      // toothed edge, the wrench's bar, the square's inner edges and its stock's end; laid over the metal,
      // under the teeth and the ticks; art-audit pass 4, 2026-10-01)
      const hi = {
        saw: `M${F(0.087 * ts)} ${F(0.19 * ts)}L${F(0.035 * ts)} ${F(0.82 * ts)}`,
        wrench: `M${F(0.024 * ts)} ${F(0.18 * ts)}L${F(0.021 * ts)} ${F(0.65 * ts)}`,
        square: `M${F(0.039 * ts)} ${F(0.012 * ts)}V${F(0.506 * ts)}H${F(0.294 * ts)}V${F(0.539 * ts)}`,
      }[k];
      if (hi) drawn.splice(1, 0, `<path class="isl-lshadehi" d="${hi}" stroke-width="${F(Math.max(0.7, ts * 0.01))}" stroke-linejoin="round"/>`);
      // (the hammer hangs in its outline at Dawn, before work starts, and at Dusk and Night, once the bench is
      // tidied; by Day and at Sunset it is out on the bench, section 4: art-audit pass 4, 2026-10-01)
      if (k === 'hammer') { hammerX = cx; board += `<g class="isl-lq" data-q="adn" transform="${at}">${drawn.join('')}</g>`; }
      else board += `<g transform="${at}">${drawn.join('')}</g>`;
      if (rack) board += `<path class="isl-lwood" transform="${at}" d="${rect(-rack[1] * ts, rack[0] * ts, 2 * rack[1] * ts, 0.03 * ts)}"/>`;
      x += w * ts + gap;
    }
    s += `<g class="isl-tsil" stroke-width="${F(Math.max(1.2, ts * 0.03))}" stroke-linejoin="round">${sil}</g>`;
    // The lamp's light on the board (art-audit pass 4, 2026-10-01: the board beside the lamp had taken none of
    // it): warm, strongest at the board's lamp end and falling off across it, centred below the bulb since the
    // shade keeps it off the wall above; with the lamp (Dawn to Night, not by Day), over the board and its
    // painted outlines and under the tools' shadows, which it does not reach; and over the wall round it, the
    // window's frame and the wall beside the lamp, down to the bench (laid over the board alone, the warmth had
    // stopped dead at its frame while the wall nearest the bulb stayed grey: pass 4 review). Above the shade's
    // rim it fades out, softly, since the shade keeps the light off the wall above. Then the shadows: soft, cast
    // down and to the left, away from the lamp and the window.
    const fcy = (lB + bB) / 2;
    s += `<defs><radialGradient id="isltfall" gradientUnits="userSpaceOnUse" cx="${F(lx)}" cy="${F(fcy)}" r="${F(Math.hypot(lx - bx0, bB - fcy))}">`
      + '<stop offset="0" class="st-g1" stop-opacity=".22"/><stop offset=".12" class="st-g1" stop-opacity=".15"/><stop offset=".35" class="st-g1" stop-opacity=".055"/>'
      + '<stop offset=".7" class="st-g1" stop-opacity=".015"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + `<linearGradient id="isltfallv" gradientUnits="userSpaceOnUse" x1="0" y1="${F(lT + (lB - lT) * 0.4)}" x2="0" y2="${F(lB + Y(0.06))}"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>`
      + `<mask id="isltfallm" maskUnits="userSpaceOnUse" x="0" y="0" width="${F(W)}" height="${F(H)}"><rect width="${F(W)}" height="${F(H)}" fill="url(#isltfallv)"/></mask>`
      + `<filter id="isltsoft" filterUnits="userSpaceOnUse" x="0" y="0" width="${F(W)}" height="${F(H)}"><feGaussianBlur stdDeviation="${F(Y(0.005))}"/></filter></defs>`;
    s += `<g class="isl-vlamps isl-vwin" style="--i:1"><path fill-rule="evenodd" mask="url(#isltfallm)" d="${rect(-2, -2, W + 4, tTop + 2)}${rect(wx0, wT, ww, wB - wT)}" fill="url(#isltfall)"/></g>`;
    s += `<g class="isl-tdrop" filter="url(#isltsoft)" transform="translate(${F(-Y(0.014))} ${F(Y(0.022))})">${cast}</g>`;
    s += `<path class="isl-thook" d="${hooks}" stroke-width="${F(Math.max(1, ts * 0.018))}" stroke-linecap="round"/>` + board;
    // 4. The bench: its top seen a little from above, its front, its legs, and the dark beneath it; a
    //    vise at its left end. By Day and at Sunset the hammer lies on it under its empty outline, with a
    //    block plane on a plank and a curl of shavings; at Night it is cleared but for the plank.
    const tFront = Y(0.74), tFoot = Y(0.84), bench1 = wx1 + Y(0.1);   // (tTop with the lamp's place, above)
    s += `<path class="isl-tunder" d="${rect(-2, tFoot, bench1 + 2, H - tFoot + 2)}"/>`;
    let legs = '';
    for (const lx of [X(0.03), (bench1 + X(0.03)) / 2, bench1 - Y(0.09)]) legs += rect(lx, tFoot, Y(0.05), H - tFoot + 2);
    s += `<path class="isl-lwood2" d="${legs}"/>`;
    s += `<path class="isl-lwood" d="${rect(-2, tTop, bench1 + 2, tFront - tTop)}"/><path class="isl-lwood2" d="${rect(-2, tFront, bench1 + 2, tFoot - tFront)}"/>`;
    s += `<path class="isl-ledge" d="M-2 ${F(tFront)}H${F(bench1)}" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/>`;
    let grain = '';
    for (let i = 0; i < 4; i++) { const gy = tFront + (tFoot - tFront) * (0.2 + i * 0.2); grain += `M${F(X(0.02 + r() * 0.1))} ${F(gy)}H${F(X(0.3 + r() * 0.5))}`; }
    s += `<path class="isl-tgrain" d="${grain}" stroke-width=".6"/>`;
    // the vise at the bench's end: the fixed jaw bolted to the top, the moving jaw a little apart, the
    // screw between them and its bar hanging through the end
    const u = ts, vx = X(0.012), jw = u * 0.11, jh = u * 0.2, vT = tTop - jh;
    // (the screw passes behind the jaws, its bar in front: drawn over them, a light cross had read as a window)
    s += `<path class="isl-lalu" d="${rect(vx + u * 0.005, vT + jh * 0.45, u * 0.26, u * 0.018)}"/>`
      + `<path class="isl-tiron" d="${rect(vx + u * 0.16, vT, jw, jh + 0.5)}${rect(vx + u * 0.02, vT, jw, jh * 0.85)}${rect(vx, tTop - u * 0.02, u * 0.33, u * 0.025)}"/>`
      + `<path class="isl-tjaw" d="M${F(vx + u * 0.02)} ${F(vT + 0.5)}h${F(jw)}M${F(vx + u * 0.16)} ${F(vT + 0.5)}h${F(jw)}" stroke-width="${F(Math.max(1, u * 0.014))}"/>`
      + `<path class="isl-lalu" d="${rect(vx - u * 0.005, vT + jh * 0.05, u * 0.016, jh * 0.95)}"/>`;
    // The working day, by version (art-audit pass 4, 2026-10-01; DESIGN.md 19.6: what is drawn may change with
    // a visible reason). At Dawn the job is laid out, the plank under the plane, but the hammer still hangs and
    // no shavings are down yet; by Day and at Sunset the work is in hand, the hammer down on the bench under its
    // empty outline and the shavings curling off the plank's end; at Dusk the bench is being tidied, the hammer
    // back on its hook, the shavings swept into one small heap and the plank set aside at the back of the bench
    // for tomorrow, the plane and the open toolbox still out; at Night all is put away but the set-aside plank.
    // (the board's own hammer, set down: it rests on its claw's tip and its handle's butt, face up, the
    // handle sloping to the bench; drawn as a flat handle into an upright head, it had read as a boot)
    const hm = TOOLS.hammer(u);
    const hammerFlat = `<g transform="translate(${F(hammerX + u * 0.32)} ${F(tTop - u * 0.141)}) rotate(78.7)">${hm.parts.map(([c, d]) => `<path class="${c}" d="${d}"/>`).join('')}</g>`;
    const px = bx0 + bw * 0.62, pw = u * 0.36, ph = u * 0.1;
    // (the toolbox's place and the pencil's, below, set here: the plank and its shavings keep between them)
    const bxW = u * 0.62, bxT = (bx1 + wx0) / 2 - bxW / 2, bxH = u * 0.2, lid = u * 0.05, pen0 = bx0 + bw * 0.43;
    // (the plane standing at b: on the plank while the job is out, on the bench itself at Dusk)
    const plane = (b) => `<path class="isl-tiron" d="M${F(px)} ${F(b + 0.5)}V${F(b - ph * 0.55)}L${F(px + pw * 0.1)} ${F(b - ph)}H${F(px + pw * 0.95)}L${F(px + pw)} ${F(b - ph * 0.6)}V${F(b + 0.5)}Z"/>`
      + `<path class="isl-lwood" d="M${F(px + pw * 0.16)} ${F(b - ph)}a${F(pw * 0.08)} ${F(pw * 0.08)} 0 1 1 ${F(pw * 0.16)} 0ZM${F(px + pw * 0.62)} ${F(b - ph)}q${F(pw * 0.02)} ${F(-ph * 1.4)} ${F(pw * 0.24)} ${F(-ph * 1.1)}l${F(pw * 0.04)} ${F(ph * 1.1)}Z"/>`;
    // The plank the plane is working (art-audit pass 4, 2026-10-01: the plane and its shavings had had nothing
    // to plane): pale wood, lying on the bench a little out from the wall; its planed
    // top face, its front edge a shade darker with the grain along it, and its sawn end, which the viewer, to
    // its right, just sees, darker still; a thin shadow where it meets the bench. Its own random stream (the
    // grain), so the approved layout does not move. It runs from a little behind the plane to well past it,
    // clear of the pencil, and leaves room for the shavings before the toolbox: in a narrow card (at 1120) it is
    // shorter past the plane and the curls lie closer together.
    const shEnd = bxT - u * 0.04, pk0 = Math.max(px - u * 0.15, pen0 + u * 0.34);
    const pkR = clamp(shEnd - px - pw - u * 0.36, u * 0.12, u * 0.4);
    // (a board's thickness and a planed top paler than its edges: thinner and in the pencil's ochre, set aside at
    // Dusk it had read as a longer pencil; pass 4 review)
    const rp = rng(5241), pkL = px + pw + pkR - pk0, pkT = u * 0.05, pkD = u * 0.028, pkS = pkD * 0.7;
    const pkG = [[0.35, rp(), rp()], [0.7, rp(), rp()]];   // (its grain, drawn once: one plank wherever it lies)
    const plank = (x0, yb) => {
      const x1 = x0 + pkL, yt = yb - pkT, yk = yt - pkD, end = polyD([[x1, yb], [x1, yt], [x1 + pkS, yk], [x1 + pkS, yk + pkT]]);
      let g = '';
      for (const [f, a, b] of pkG) g += `M${F(x0 + pkL * (0.03 + a * 0.1))} ${F(yt + pkT * f)}H${F(x1 - pkL * (0.04 + b * 0.25))}`;
      return `<path class="isl-tdrop" d="${rect(x0 - u * 0.01, yb - 0.5, pkL + pkS + u * 0.02, Math.max(1, u * 0.009))}"/>`
        + `<path class="isl-lbk3" d="${polyD([[x0, yb], [x0, yt], [x0 + pkS, yk], [x1 + pkS, yk], [x1 + pkS, yk + pkT], [x1, yb]])}"/>`
        + `<path class="isl-lpage" opacity=".4" d="${polyD([[x0, yt], [x0 + pkS, yk], [x1 + pkS, yk], [x1, yt]])}"/>`   // (the planed top, pale)
        // (one shade over the front edge and the end, a second over the end)
        + `<path class="isl-tdrop" d="${rect(x0, yt, pkL, pkT)}${end}"/><path class="isl-tdrop" d="${end}"/>`
        + `<path class="isl-tgrain" d="${g}" stroke-width=".5"/>`;
    };
    const pkB = tTop + (tFront - tTop) * 0.45, pk1 = pk0 + pkL + pkS, shStep = clamp((shEnd - pk1 - u * 0.08) / 4, u * 0.035, u * 0.07);
    // (the shavings curl off the plank's end onto the bench; the same draws as before, only moved there)
    let shav = '';
    for (let i = 0; i < 5; i++) { const sx2 = pk1 + u * 0.01 + i * shStep, rr = u * (0.022 + r() * 0.018); shav += `M${F(sx2)} ${F(pkB)}a${F(rr)} ${F(rr)} 0 1 1 ${F(rr * 1.5)} ${F(-rr * 0.3)}a${F(rr * 0.6)} ${F(rr * 0.6)} 0 1 1 ${F(-rr * 0.8)} ${F(rr * 0.2)}`; }
    // (at Dusk, the shavings swept into one small heap beside the plane: a few curls bunched on a low mound of
    // fine ones; its own random stream)
    const rh = rng(5243), hx = px + pw + u * 0.19;
    let heap = '';
    for (const [dx, dy, k] of [[-0.06, 0, 1], [-0.008, 0.002, 1], [0.048, 0, 1], [-0.034, -0.022, 0.85], [0.02, -0.022, 0.85], [-0.006, -0.04, 0.7]]) {
      const rr = u * (0.017 + rh() * 0.008) * k, sx2 = hx + u * dx - rr * 0.7, sy = tTop + u * dy;
      heap += `M${F(sx2)} ${F(sy)}a${F(rr)} ${F(rr)} 0 1 1 ${F(rr * 1.5)} ${F(-rr * 0.3)}a${F(rr * 0.6)} ${F(rr * 0.6)} 0 1 1 ${F(-rr * 0.8)} ${F(rr * 0.2)}`;
    }
    const mound = `<path class="isl-lbk3" opacity=".7" d="M${F(hx - u * 0.1)} ${F(tTop + 0.5)}C${F(hx - u * 0.07)} ${F(tTop - u * 0.06)} ${F(hx + u * 0.05)} ${F(tTop - u * 0.065)} ${F(hx + u * 0.09)} ${F(tTop + 0.5)}Z"/>`;
    const box = `<ellipse class="isl-tdrop" cx="${F(bxT + bxW * 0.55)}" cy="${F(tTop + u * 0.005)}" rx="${F(bxW * 0.56)}" ry="${F(u * 0.018)}"/>`
      + `<path class="isl-lred" d="${rect(bxT, tTop - bxH, bxW, bxH + 0.5)}"/>`
      + `<path class="isl-tlid" d="M${F(bxT - u * 0.01)} ${F(tTop - bxH + lid)}H${F(bxT + bxW + u * 0.01)}" stroke-width="${F(Math.max(1, u * 0.014))}"/>`
      + `<path class="isl-lalu" d="${rect(bxT + bxW * 0.46, tTop - bxH + lid * 0.4, bxW * 0.08, lid * 1.2)}"/>`
      + `<path class="isl-tiron" d="${rect(bxT + bxW * 0.3, tTop - bxH - u * 0.018, u * 0.02, u * 0.02)}${rect(bxT + bxW * 0.7 - u * 0.02, tTop - bxH - u * 0.018, u * 0.02, u * 0.02)}"/>`
      + `<path class="isl-thandle2" d="M${F(bxT + bxW * 0.3 + u * 0.01)} ${F(tTop - bxH - u * 0.012)}V${F(tTop - bxH - u * 0.07)}H${F(bxT + bxW * 0.7 - u * 0.01)}V${F(tTop - bxH - u * 0.012)}" stroke-width="${F(Math.max(1.2, u * 0.022))}" stroke-linejoin="round"/>`
      + `<path class="isl-lredsh" d="${rect(bxT + bxW * 0.8, tTop - bxH, bxW * 0.2, bxH + 0.5)}"/>`;
    const shw = F(Math.max(0.8, u * 0.012));
    // (set aside at the back, under the board, midway between the vise and the pencil: its far edge on the
    // bench's back line, against the wall)
    s += `<g class="isl-lq" data-q="dn">${plank((vx + u * 0.33 + pen0 - pkL) / 2, tTop + pkD)}</g>`
      + `<g class="isl-lq" data-q="ays">${plank(pk0, pkB)}${plane(pkB - pkT - pkD * 0.5)}</g>`
      + `<g class="isl-lq" data-q="ys">${hammerFlat}<path class="isl-tshave" d="${shav}" stroke-width="${shw}"/></g>`
      + `<g class="isl-lq" data-q="d">${plane(tTop)}${mound}<path class="isl-tshave" d="${heap}" stroke-width="${shw}"/></g>`
      + `<g class="isl-lq" data-q="aysd">${box}</g>`;
    // a pencil (the window faces west, so no sun lies on the bench by day; only the setting Sun reaches it)
    s += `<path class="isl-lbk3" d="M${F(pen0)} ${F(tTop - u * 0.02)}h${F(u * 0.26)}l${F(u * 0.04)} ${F(u * 0.01)}l${F(-u * 0.04)} ${F(u * 0.01)}h${F(-u * 0.26)}Z"/>`;
    // 5. The lamp: its cord from the ceiling, an enamel shade, and lit, the bulb under it, its halo in the
    //    page's hue, the light it spills down onto the bench and its pool there; the last light on.
    //    (its place, lx to rb, is set with the board's, section 3)
    s += `<path class="isl-tcord" d="M${F(lx)} -2V${F(lT)}" stroke-width="${F(Math.max(1.4, Y(0.009)))}"/>`;
    // (its bulb, unlit frosted glass in every version, the lit bulb over it from Dawn to Night: by Day the lamp
    // had had no glass; art-audit wave 2)
    s += `<ellipse class="isl-lglass" cx="${F(lx)}" cy="${F(lB + Y(0.008))}" rx="${F(rb * 0.45)}" ry="${F(Y(0.018))}"/>`;
    s += `<g class="isl-vlamps isl-vwin isl-vlast" style="--i:1">`
      + `<path d="${polyD([[lx - rb * 0.9, lB], [lx + rb * 0.9, lB], [lx + rb * 2.6, tTop], [lx - rb * 2.6, tTop]])}" fill="url(#islvspill)"/>`
      + pool(lx, tTop + Y(0.012), rb * 3.2, Y(0.03), 0.85) + halo(lx, lB, rb * 2.8, 'islvlamp')
      + `<ellipse class="isl-tbulb" cx="${F(lx)}" cy="${F(lB + Y(0.008))}" rx="${F(rb * 0.45)}" ry="${F(Y(0.018))}"/></g>`;
    s += `<path class="isl-tshade" d="M${F(lx - rt)} ${F(lT)}H${F(lx + rt)}L${F(lx + rb)} ${F(lB)}Q${F(lx)} ${F(lB + Y(0.02))} ${F(lx - rb)} ${F(lB)}Z"/>`
      + `<path class="isl-lshadehi" d="M${F(lx - rt * 0.4)} ${F(lT + Y(0.01))}L${F(lx - rb * 0.6)} ${F(lB - Y(0.012))}" stroke-width="${F(Math.max(0.8, Y(0.008)))}"/>`;
    return `<g style="--isl-vstep:.5s">${s}</g>`;
  }

  /* THE PROMPTING DESK (Learning to Prompt's head; owner, 2026-09-29: art tied to the title at a glance,
     and "fantastical or sci-fi" where it fits better): a study desk by a window. The open notebook's
     handwritten lines lift off the page as a ribbon of light that curls up into a speech bubble, and a
     softly glowing orb, the model, answers with a small bubble of its own: writing to an AI, and learning
     to. A desk lamp over the notebook, a stack of books and a mug; the window, at the left, faces east,
     so the Sun rises in it at Dawn, and the Moon stands in its upper pane at night (a painter's licence,
     as in the library). By Day the lamp is off; the ribbon, bubbles and orb keep their own light. In the
     one pass the lamp comes on, the ribbon and its bubble light, and the orb glows last, in the page's
     hue. Face on, sized from the card's height. */
  function promptFrame(W, H) {
    const ww = clamp(H * 1.0, W * 0.2, W * 0.27), wx0 = W * 0.04;
    return { wx0, wx1: wx0 + ww, ww, wT: H * 0.1, wB: H * 0.6, hz: H * 0.45 };
  }
  function promptDesk(W, H, v) {
    const y0 = v.y0, X = (f) => f * W, Y = (f) => f * H, r = rng(613);
    const { wx0, wx1, ww, wT, wB } = promptFrame(W, H), u = H;
    const lights = [];
    let s = '<defs><linearGradient id="islpwallg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-lwall0"/><stop offset="1" class="st-lwall1"/></linearGradient>'
      + '<radialGradient id="islporb" cx=".42" cy=".38" r=".62"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".35" class="st-k" stop-opacity=".9"/><stop offset="1" class="st-k" stop-opacity=".55"/></radialGradient>'
      + '<radialGradient id="islporbh"><stop offset="0" class="st-k" stop-opacity=".45"/><stop offset=".5" class="st-k" stop-opacity=".12"/><stop offset="1" class="st-k" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islpribbon" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff4d6" stop-opacity=".15"/><stop offset=".5" stop-color="#fff4d6" stop-opacity=".75"/><stop offset="1" class="st-k" stop-opacity=".9"/></linearGradient></defs>';
    // 1. Through the window: open sea to the east, a low cay on the horizon with a light, a boat
    //    under sail far out, the water's ripples (build()); the Sun rises here at Dawn.
    const cay = [[0.52, 0], [0.58, 0.02], [0.66, 0.03], [0.74, 0.022], [0.8, 0]].map(([x, h]) => [wx0 + ww * x, y0 - Y(h)]);
    const cayD = `<path class="f-isl" d="${polyD([[wx0 + ww * 0.5, y0 + 1], ...cay, [wx0 + ww * 0.82, y0 + 1]])}"/>`;
    s += cayD + mirrored(y0, cayD, 0.16) + mist(wx0 + ww * 0.45, y0, ww * 0.45, Y(0.04), 0.4);
    lights.push([wx0 + ww * 0.66, y0 - Y(0.04)]);
    s += dashes(streakList(wx0 + ww * 0.66, y0 + 1, H, r, 0.04, 0.05), 's-vglow', 1, [0.08, 0.16, 0.3]);
    const sb = wx0 + ww * 0.25, sy = y0 + Y(0.04);
    const boat = `<path class="isl-vhull" d="M${F(sb - Y(0.03))} ${F(sy - Y(0.01))}H${F(sb + Y(0.03))}L${F(sb + Y(0.022))} ${F(sy)}H${F(sb - Y(0.024))}Z"/>`
      + `<path class="isl-vsail" d="M${F(sb)} ${F(sy - Y(0.012))}V${F(sy - Y(0.1))}L${F(sb + Y(0.034))} ${F(sy - Y(0.016))}Z"/>`;
    // (its masthead light's column on the water and its faint reflection, as the cay's light and the cay have)
    s += dashes(streakList(sb, sy + 1, H, rng(617), 0.04, 0.05), 's-vcoolglow', 1, [0.08, 0.16, 0.3])
      + `<g opacity=".15"><g transform="translate(0 ${F(2 * sy)}) scale(1 -1)">${boat}</g></g>` + boat;
    lights.push([sb, sy - Y(0.1), 'b']);
    s += lightsPaths(lights);
    // 2. The wall, the window cut out of it, its reveal, frame and sill; a shelf of books above the desk.
    s += `<path fill="url(#islpwallg)" fill-rule="evenodd" d="${rect(-2, -2, W + 4, H + 4)}${rect(wx0, wT, ww, wB - wT)}"/>`;
    const rv = Math.max(2, Y(0.025));
    // (the reveal on the left jamb, the one the viewer, to the window's right, can see; the transom high, a
    // top light over tall lower panes, so the rising Sun stands whole below it: at 0.42 it cut the disc in two)
    s += `<path class="isl-lsidew" d="${polyD([[wx0, wT], [wx0 + rv, wT + rv], [wx0 + rv, wB], [wx0, wB]])}${rect(wx0, wB - rv, ww, rv)}"/>`;
    s += `<path class="isl-lframe" d="${rect(wx0, wT, ww, wB - wT)}" stroke-width="${F(Math.max(1.5, Y(0.018)))}"/>`
      + `<path class="isl-lframe" d="M${F(wx0 + ww * 0.5)} ${F(wT)}V${F(wB)}M${F(wx0)} ${F(wT + (wB - wT) * 0.3)}H${F(wx1)}" stroke-width="${F(Math.max(1, Y(0.011)))}"/>`
      + `<path class="isl-lsill" d="${rect(wx0 - Y(0.02), wB, ww + Y(0.04), Math.max(2, Y(0.022)))}"/>`;
    // 3. The desk: its top a little from above, its front with a drawer and its pull, its legs.
    const dTop = Y(0.72), dFront = Y(0.755), dFoot = Y(0.87), d0 = X(0.02), d1 = X(0.98);
    s += `<path class="isl-tunder" d="${rect(d0, dFoot, d1 - d0, H - dFoot + 2)}"/>`;
    s += `<path class="isl-lwood2" d="${rect(d0 + Y(0.03), dFoot, Y(0.05), H - dFoot + 2)}${rect(d1 - Y(0.08), dFoot, Y(0.05), H - dFoot + 2)}"/>`;
    s += `<path class="isl-lwood" d="${rect(d0, dTop, d1 - d0, dFront - dTop)}"/><path class="isl-lwood2" d="${rect(d0, dFront, d1 - d0, dFoot - dFront)}"/>`;
    s += `<path class="isl-ledge" d="M${F(d0)} ${F(dFront)}H${F(d1)}" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/>`;
    const drw = X(0.44), dw = X(0.16);
    s += `<path class="isl-tgrain" d="${rect(drw, dFront + Y(0.018), dw, dFoot - dFront - Y(0.036))}" stroke-width=".8"/>`
      + `<path class="isl-lbronze" d="${rect(drw + dw / 2 - Y(0.03), dFront + (dFoot - dFront) / 2 - Y(0.008), Y(0.06), Y(0.016))}"/>`;
    // 4. The notebook: spiral-bound, open on a slanted writing stand so its pages face the viewer, ruled
    //    and written on; the right page's writing stops where its last line lifts off as the ribbon. A
    //    pen lies on the desk beside the stand.
    const nx = X(0.47), nH = Y(0.3), nW = Y(0.5), nB = dTop - Y(0.025), nT = nB - nH;
    s += `<path class="isl-lwood2" d="${polyD([[nx - nW * 0.56, dTop], [nx + nW * 0.56, dTop], [nx + nW * 0.5, nT - Y(0.02)], [nx - nW * 0.5, nT - Y(0.02)]])}"/>`;
    const pg = (sd) => polyD([[nx, nB], [nx + sd * nW * 0.49, nB - Y(0.004)], [nx + sd * nW * 0.47, nT + Y(0.006)], [nx, nT]]);
    s += `<path class="isl-lbk2" d="${polyD([[nx - nW * 0.51, nB + 1], [nx + nW * 0.51, nB + 1], [nx + nW * 0.49, nT - Y(0.006)], [nx - nW * 0.49, nT - Y(0.006)]])}"/>`
      + `<path class="isl-lpage" d="${pg(-1)}${pg(1)}"/>`;
    s += `<path class="isl-lwood" d="${rect(nx - nW * 0.58, nB - Y(0.004), nW * 1.16, Y(0.028))}"/>`;
    let ruled = '', hw = '', coil = '';
    const rows = 7, rowY = (i) => nT + (nB - nT) * i / (rows + 1);
    for (let i = 1; i <= rows; i++) {
      const y = rowY(i);
      ruled += `M${F(nx - nW * 0.45)} ${F(y)}H${F(nx - nW * 0.05)}M${F(nx + nW * 0.05)} ${F(y)}H${F(nx + nW * 0.44)}`;
      for (const sd of [-1, 1]) {
        if (sd === 1 && i > 5) continue;
        const x0 = nx + sd * nW * 0.07, len = nW * (i === 5 && sd === 1 ? 0.2 : 0.36 - r() * 0.12);
        hw += `M${F(x0)} ${F(y - Y(0.005))}q${F(sd * len * 0.25)} ${F(-Y(0.009))} ${F(sd * len * 0.5)} 0t${F(sd * len * 0.5)} 0`;
      }
    }
    for (let y = nT + Y(0.016); y < nB - Y(0.008); y += Y(0.026)) coil += `M${F(nx - Y(0.013))} ${F(y)}a${F(Y(0.013))} ${F(Y(0.008))} 0 1 1 ${F(Y(0.026))} 0`;
    s += `<path class="isl-pruled" d="${ruled}" stroke-width=".7"/><path class="isl-phand" d="${hw}" stroke-width="${F(Math.max(0.8, Y(0.005)))}"/>`
      + `<path class="isl-pcoil" d="${coil}" stroke-width="${F(Math.max(0.9, Y(0.006)))}"/>`;
    const lift = [nx + nW * 0.28, rowY(5) - Y(0.005)];
    // (it lies on the desk's top, its slant read as depth; above the back edge it had floated against the wall)
    const pen = `M${F(nx + nW * 0.66)} ${F(dTop + Y(0.026))}l${F(Y(0.2))} ${F(-Y(0.02))}l${F(Y(0.014))} ${F(Y(0.005))}l${F(-Y(0.2))} ${F(Y(0.02))}Z`;
    s += `<path class="isl-lbk2" d="${pen}"/>`;
    // 5. The books and the mug at the right, the lamp at the left over the notebook.
    const bkx = X(0.925);
    let o = '';
    [[0.16, 0.05, 'isl-lbk1'], [0.15, 0.045, 'isl-lbk3'], [0.17, 0.05, 'isl-lbk2'], [0.14, 0.04, 'isl-lbk1']].reduce((y, [w, h, cls]) => {
      o += `<path class="${cls}" d="${rect(bkx - Y(w) / 2 + (r() - 0.5) * Y(0.02), y - Y(h), Y(w), Y(h))}"/><path class="isl-lpageedge" d="${rect(bkx - Y(w) / 2 + Y(0.01), y - Y(h) + Y(0.008), Y(w) - Y(0.02), Y(h) - Y(0.016))}"/>`;
      return y - Y(h);
    }, dTop);
    s += o;
    const mx = X(0.845), mw = Y(0.035), mt = dTop - Y(0.09);
    s += `<path class="isl-lmug" d="M${F(mx - mw)} ${F(dTop)}V${F(mt)}H${F(mx + mw)}V${F(dTop)}Z"/>`
      // (seen a little from above, its opening and the coffee in it; its side away from the window in shade:
      // by Day a plain pale block had vanished against the cream wall)
      + `<path class="isl-lredsh" d="${rect(mx + mw * 0.35, mt, mw * 0.65, dTop - mt)}"/>`
      + `<ellipse class="isl-lmug" cx="${F(mx)}" cy="${F(mt)}" rx="${F(mw)}" ry="${F(Y(0.008))}"/><ellipse class="isl-lbronze" cx="${F(mx)}" cy="${F(mt + 0.5)}" rx="${F(mw * 0.8)}" ry="${F(Y(0.0055))}"/>`
      + `<path class="isl-lmugh" d="M${F(mx + mw)} ${F(mt + Y(0.02))}q${F(mw * 0.9)} ${F(Y(0.025))} 0 ${F(Y(0.05))}" stroke-width="${F(Math.max(1, Y(0.01)))}"/>`;
    // the lamp: a weighted base, two arms, a shade tilted down at the notebook; lit, its bulb, halo, the
    // light spilling onto the pages and a warm pool on them
    const lb = wx1 + Y(0.07), la = [lb, dTop - Y(0.02)], lj = [lb + Y(0.03), dTop - Y(0.44)], lh = [nx - nW * 0.4, nT - Y(0.1)];
    s += `<path class="isl-tiron" d="${rect(lb - Y(0.06), dTop - Y(0.025), Y(0.12), Y(0.025))}"/>`
      + `<path class="isl-tarm" d="M${F(la[0])} ${F(la[1])}L${F(lj[0])} ${F(lj[1])}L${F(lh[0])} ${F(lh[1])}" stroke-width="${F(Math.max(1.4, Y(0.012)))}" stroke-linejoin="round"/>`;
    const sh = (a) => { const c = Math.cos(a), si = Math.sin(a); return (x, y) => [lh[0] + x * c - y * si, lh[1] + x * si + y * c]; };
    const R = sh(-0.45), shade = [R(-Y(0.02), -Y(0.02)), R(Y(0.02), -Y(0.02)), R(Y(0.07), Y(0.07)), R(-Y(0.07), Y(0.07))];
    const [bxl, byl] = R(0, Y(0.075));
    s += `<g class="isl-vlamps isl-vwin" style="--i:1"><path d="${polyD([R(-Y(0.06), Y(0.07)), R(Y(0.06), Y(0.07)), [nx + nW * 0.25, nB], [nx - nW * 0.5, nB]])}" fill="url(#islvspill)"/>`
      + pool(nx - nW * 0.12, nT + nH * 0.55, nW * 0.45, nH * 0.5, 0.55) + halo(bxl, byl, Y(0.16), 'islvbulb')
      + `<circle class="isl-tbulb" cx="${F(bxl)}" cy="${F(byl)}" r="${F(Y(0.018))}"/></g>`;
    s += `<path class="isl-tshade" d="${polyD(shade)}"/>`;
    // 6. The ribbon: the right page's last line lifts off and rises as a band of light, dashes like
    //    words riding along it, curling up into the speech bubble; the orb, right, answers.
    const ox = X(0.8), oy = Y(0.4), orr = Y(0.12);
    const bx2 = X(0.64), by2 = Y(0.19), bwid = Y(0.42), bht = Y(0.2);
    const p0 = lift, p1 = [bx2 - bwid * 0.32, by2 + bht * 0.85];
    const c1 = [p0[0] + Y(0.3), p0[1] + Y(0.06)], c2 = [p1[0] - Y(0.1), p1[1] + Y(0.3)];
    const rib = `M${F(p0[0])} ${F(p0[1])}C${F(c1[0])} ${F(c1[1])} ${F(c2[0])} ${F(c2[1])} ${F(p1[0])} ${F(p1[1])}`;
    const bez = (t, i) => { const q = 1 - t; return q ** 3 * p0[i] + 3 * q * q * t * c1[i] + 3 * q * t * t * c2[i] + t ** 3 * p1[i]; };
    const der = (t, i) => { const q = 1 - t; return 3 * q * q * (c1[i] - p0[i]) + 6 * q * t * (c2[i] - c1[i]) + 3 * t * t * (p1[i] - c2[i]); };
    let words = '';
    for (let t = 0.1; t < 0.93; t += 0.085) {
      const x = bez(t, 0), y = bez(t, 1), dx = der(t, 0), dy = der(t, 1), d = Math.hypot(dx, dy) || 1, len = Y(0.014 + r() * 0.014);
      words += `M${F(x - (dx / d) * len / 2)} ${F(y - (dy / d) * len / 2)}l${F((dx / d) * len)} ${F((dy / d) * len)}`;
    }
    const bubble = `M${F(bx2 - bwid / 2 + bht * 0.3)} ${F(by2 - bht / 2)}H${F(bx2 + bwid / 2 - bht * 0.3)}Q${F(bx2 + bwid / 2)} ${F(by2 - bht / 2)} ${F(bx2 + bwid / 2)} ${F(by2 - bht * 0.2)}V${F(by2 + bht * 0.2)}Q${F(bx2 + bwid / 2)} ${F(by2 + bht / 2)} ${F(bx2 + bwid / 2 - bht * 0.3)} ${F(by2 + bht / 2)}`
      + `H${F(bx2 - bwid * 0.18)}L${F(bx2 - bwid * 0.32)} ${F(by2 + bht * 0.85)}L${F(bx2 - bwid * 0.26)} ${F(by2 + bht / 2)}H${F(bx2 - bwid / 2 + bht * 0.3)}Q${F(bx2 - bwid / 2)} ${F(by2 + bht / 2)} ${F(bx2 - bwid / 2)} ${F(by2 + bht * 0.2)}V${F(by2 - bht * 0.2)}Q${F(bx2 - bwid / 2)} ${F(by2 - bht / 2)} ${F(bx2 - bwid / 2 + bht * 0.3)} ${F(by2 - bht / 2)}Z`;
    let lines = '';
    [[0.72, -0.2], [0.6, 0.02], [0.45, 0.22]].forEach(([len, dy]) => { lines += `M${F(bx2 - bwid * 0.36)} ${F(by2 + bht * dy)}h${F(bwid * len)}`; });
    s += `<g class="isl-vwin" style="--i:2"><path class="isl-pribbon" d="${rib}" stroke="url(#islpribbon)" stroke-width="${F(Math.max(2.5, Y(0.035)))}"/>`
      + `<path class="isl-pword" d="${words}" stroke-width="${F(Math.max(1, Y(0.009)))}"/>`
      + `<path class="isl-pbubble" d="${bubble}"/><path class="isl-pline" d="${lines}" stroke-width="${F(Math.max(1, Y(0.013)))}"/></g>`;
    // the orb, its halo and two faint rings; its reply, a small bubble of three dots above it
    let spark = '';
    for (let i = 0; i < 8; i++) { const a = r() * Math.PI * 2, d = orr * (1.5 + r() * 0.9); spark += `M${F(ox + Math.cos(a) * d)} ${F(oy + Math.sin(a) * d * 0.7)}h0`; }
    const rw2 = Y(0.19), rh2 = Y(0.1), rx2 = Math.min(W - rw2 * 0.6, ox + orr * 1.6), ry2 = oy - orr * 1.75;
    s += `<g class="isl-vlamps isl-vwin isl-vlast" style="--i:3"><ellipse cx="${F(ox)}" cy="${F(dTop + Y(0.014))}" rx="${F(orr * 1.6)}" ry="${F(Y(0.016))}" fill="url(#islporbh)" opacity=".55"/></g>`;   // its light on the desk
    s += `<g class="isl-vwin isl-vlast" style="--i:3">${halo(ox, oy, orr * 3, 'islporbh')}`
      + `<ellipse class="isl-pring" cx="${F(ox)}" cy="${F(oy)}" rx="${F(orr * 1.7)}" ry="${F(orr * 0.45)}" transform="rotate(-14 ${F(ox)} ${F(oy)})" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/>`
      + `<ellipse class="isl-pring" cx="${F(ox)}" cy="${F(oy)}" rx="${F(orr * 1.35)}" ry="${F(orr * 0.3)}" transform="rotate(22 ${F(ox)} ${F(oy)})" stroke-width="${F(Math.max(0.6, Y(0.004)))}"/>`
      + `<circle cx="${F(ox)}" cy="${F(oy)}" r="${F(orr)}" fill="url(#islporb)"/>`
      + `<path class="isl-pspark" d="${spark}" stroke-width="${F(Math.max(1.4, Y(0.012)))}"/>`
      + `<path class="isl-pbubble" d="M${F(rx2 - rw2 / 2 + rh2 * 0.4)} ${F(ry2 - rh2 / 2)}H${F(rx2 + rw2 / 2 - rh2 * 0.4)}A${F(rh2 / 2)} ${F(rh2 / 2)} 0 0 1 ${F(rx2 + rw2 / 2 - rh2 * 0.4)} ${F(ry2 + rh2 / 2)}H${F(rx2 - rw2 * 0.1)}L${F(rx2 - rw2 * 0.3)} ${F(ry2 + rh2 * 1.05)}L${F(rx2 - rw2 * 0.25)} ${F(ry2 + rh2 / 2)}H${F(rx2 - rw2 / 2 + rh2 * 0.4)}A${F(rh2 / 2)} ${F(rh2 / 2)} 0 0 1 ${F(rx2 - rw2 / 2 + rh2 * 0.4)} ${F(ry2 - rh2 / 2)}Z"/>`
      + `<path class="isl-pdot" d="M${F(rx2 - rw2 * 0.2)} ${F(ry2)}h0M${F(rx2)} ${F(ry2)}h0M${F(rx2 + rw2 * 0.2)} ${F(ry2)}h0" stroke-width="${F(Math.max(2, Y(0.024)))}"/></g>`;
    return `<g style="--isl-vstep:.45s">${s}</g>`;
  }

  /* THE BELL TOWER (the Announcements page's head; owner, 2026-09-29: art tied to the title at a glance):
     how a town once announced its news. A stone bell tower at the right, its bell mid-swing in the open
     belfry, rings of sound spreading from it and a few birds lifting off the roof; at its foot a notice
     board of pinned notes under a little roof, and a lantern in the page's hue; a town's roofs and a
     palm along the left, the sea beyond, the Moon in the open sky. Sized from the card's height and
     laid along its width. In the one pass the town's windows light, the rings spread one after
     another, and the lantern comes on last. */
  function bellTower(W, H, v) {
    const y0 = v.y0, X = (f) => f * W, Y = (f) => f * H, r = rng(719);
    const lights = [];
    let s = '';
    // 1. The sea beyond the town: a far headland on the horizon at the left, rimmed, mist at its foot.
    const head = [[-0.02, 0.02], [0.05, 0.06], [0.12, 0.08], [0.2, 0.06], [0.27, 0.03], [0.33, 0]].map(([x, h]) => [X(x), y0 - Y(h)]);
    const farLand = `<path class="f-isl" d="${polyD([[X(-0.02), y0 + 1], ...head, [X(0.34), y0 + 1]])}${scrubLine(head, 2, 0.5, 1.1, r)}"/>`;
    s += farLand + `<path class="s-rim" d="${lineD(head.map(([x, y]) => [x, y + 0.5]))}" stroke-width="1" stroke-opacity=".3"/>` + mist(X(-0.03), y0, X(0.4), Y(0.05), 0.45);
    // 2. The town: roofs of different heights stepping down toward the sea, gables and a hip or two,
    //    walls with small windows, lit from Dawn to Night.
    const ground = Y(0.86);
    // (the sea's finish: ripples dense toward the horizon and the headland's faint reflection, drawn with
    // their own random stream so the houses keep their sizes)
    s += dashes(hatchList(W, y0, ground, rng(733)), 's-vrip', 1, [0.1, 0.18, 0.28]) + mirrored(y0, farLand, 0.18);
    const walls = ['', '', ''];
    let roofs = '', wins = '';
    let x = X(0.3);
    const houses = [];
    while (x < X(0.66)) {
      const w = Y(0.22 + r() * 0.16), h = Y(0.12 + r() * 0.1), top = ground - h - Y(0.02 + r() * 0.05);
      houses.push([x, w, top]);
      x += w + Y(0.01);
    }
    houses.forEach(([hx, w, top], i) => {
      walls[i % 3] += rect(hx, top, w + Y(0.01) + 0.5, ground - top + 1);   // (a terrace: no seam of sea between)
      const pk = top - Y(0.06 + r() * 0.03);
      roofs += polyD([[hx - Y(0.015), top + 0.5], [hx + w / 2, pk], [hx + w + Y(0.015), top + 0.5]]);
      for (let k = 0; k < Math.max(1, Math.round(w / Y(0.09))); k++) {
        const wx = hx + Y(0.03) + k * Y(0.08);
        if (wx + Y(0.03) > hx + w - Y(0.02)) break;
        wins += rect(wx, top + Y(0.035), Y(0.03), Y(0.045));
      }
    });
    s += walls.map((d, i) => `<path class="isl-tw${i}" d="${d}"/>`).join('') + `<path class="isl-troof" d="${roofs}"/><path class="f-pulse isl-vwin" style="--i:0" d="${wins}"/>`;
    s += palmsD([[X(0.29), ground, Y(0.46), 0.14, 17], [X(0.26), ground, Y(0.34), -0.12, 9]], 'isl-palm');
    // 3. The ground: the square's paving along the foot of the picture, in perspective as the Way In
    //    picture's: stone, its joints widening toward the viewer and converging on the horizon (it had been
    //    grass crossed by parallel slanting strokes, which read as rain at night; review, 2026-09-30).
    s += `<path class="isl-apave" d="${rect(-2, ground, W + 4, H - ground + 2)}"/>`;
    let pav = '';
    for (let y = ground + Y(0.035); y < H; y += Y(0.04) + (y - ground) * 0.2) pav += `M-2 ${F(y)}H${F(W + 2)}`;
    for (let px = X(0.01); px < W; px += Y(0.09)) pav += `M${F(px)} ${F(ground)}l${F((px - W * 0.5) * 0.08)} ${F(H - ground)}`;
    s += `<path class="isl-vcourse" d="${pav}" stroke-width=".7" stroke-opacity=".5"/>`;
    // 4. The bell tower: a square stone shaft with quoins and string courses, the belfry's arched
    //    opening, a pyramid roof and a vane.
    const tc = X(0.81), tw = Y(0.34), tTop = Y(0.43), bel = Y(0.3), roofTop = Y(0.005);
    const t0 = tc - tw / 2, t1 = tc + tw / 2;
    // (seen straight on, as the campus clock tower: the shaft had a side face that the belfry and roof above
    // it did not have; its depth is the shadow under the belfry's cornice, below)
    s += `<path d="${rect(t0, tTop, tw, ground - tTop + 1)}" fill="url(#islvfacade)"/>`;
    let cr = '', qn = '';
    for (let y = tTop + Y(0.05); y < ground; y += Y(0.05)) cr += `M${F(t0)} ${F(y)}H${F(t1)}`;
    // (the quoins one course tall, on the courses, long and short in turn and flush with both corners: they had
    // overshot the right corner as see-through blocks and drifted off the courses; a plinth at the foot)
    const cs = Y(0.05);
    for (let y = tTop, k = 0; y + cs <= ground + 0.5; y += cs, k++) { const qw = Y(k % 2 ? 0.07 : 0.05); qn += rect(t0, y + 0.6, qw, cs - 1.2) + rect(t1 - qw, y + 0.6, qw, cs - 1.2); }
    s += `<path class="isl-vcourse" d="${cr}" stroke-width=".7"/><path class="isl-vstone" d="${qn}" fill-opacity=".45"/>`;
    s += `<path class="isl-vstone" d="${rect(t0 - Y(0.012), ground - Y(0.03), tw + Y(0.024), Y(0.03) + 1)}"/>`;
    // the belfry: its stage, wider, with a cornice under and over; the arched opening shows the sky
    const b0 = t0 - Y(0.02), b1 = t1 + Y(0.02), bTop = tTop - bel;
    s += `<path d="${rect(b0, bTop, b1 - b0, bel)}${arch(tc, bTop + Y(0.03), tw * 0.64, tTop - Y(0.02))}" fill="url(#islvfacade)" fill-rule="evenodd"/>`;
    s += `<path class="isl-vstone" d="${rect(b0 - Y(0.015), tTop - Y(0.012), b1 - b0 + Y(0.03), Y(0.024))}${rect(b0 - Y(0.015), bTop - Y(0.02), b1 - b0 + Y(0.03), Y(0.024))}"/>`;
    s += `<path class="isl-vpshade" d="${rect(t0, tTop + Y(0.012), tw, Y(0.03))}"/>`;   // the cornice's shadow on the shaft
    s += `<path class="isl-vsill" d="M${F(tc - tw * 0.33)} ${F(tTop - Y(0.02))}H${F(tc + tw * 0.33)}" stroke-width="${F(Math.max(1, Y(0.01)))}"/>`;
    // the bell, mid-swing on its yoke across the opening, its clapper hanging to the low side
    // (a smaller swing: at -22 degrees the rim crossed about 6px onto the stone beside the opening; art-audit
    // wave 1, 2026-10-01)
    const yokeY = bTop + Y(0.07), ang = -15;
    s += `<path class="isl-vbeam" d="M${F(tc - tw * 0.34)} ${F(yokeY)}H${F(tc + tw * 0.34)}" stroke-width="${F(Math.max(1.5, Y(0.016)))}"/>`;
    const bh2 = Y(0.16), bwid = Y(0.086);
    const bellD = `M${F(-bwid * 0.28)} ${F(Y(0.012))}C${F(-bwid * 0.3)} ${F(bh2 * 0.35)} ${F(-bwid * 0.55)} ${F(bh2 * 0.7)} ${F(-bwid)} ${F(bh2)}H${F(bwid)}C${F(bwid * 0.55)} ${F(bh2 * 0.7)} ${F(bwid * 0.3)} ${F(bh2 * 0.35)} ${F(bwid * 0.28)} ${F(Y(0.012))}Q0 ${F(-Y(0.008))} ${F(-bwid * 0.28)} ${F(Y(0.012))}Z`;
    // (the bell rings at Dawn, by Day and at Sunset, swung on its yoke, and hangs at rest at Dusk and Night, its
    // clapper down and its rope straight: bells are rung at set hours of the day, never in the night; art-audit
    // wave 1, by version)
    const bellG = (a, cl) => `<g transform="translate(${F(tc)} ${F(yokeY)}) rotate(${a})"><path d="M0 0V${F(Y(0.014))}" class="isl-vbeam" stroke-width="${F(Math.max(1.2, Y(0.012)))}"/>`
      + `<path d="${bellD}" fill="url(#islvbrass)"/><path class="isl-vbrass2" d="M${F(-bwid * 1.02)} ${F(bh2 - Y(0.012))}H${F(bwid * 1.02)}V${F(bh2)}H${F(-bwid * 1.02)}Z"/>`
      + `<path class="isl-vbeam" d="M0 ${F(bh2 * 0.5)}L${F(cl)} ${F(bh2 + Y(0.02))}" stroke-width="${F(Math.max(1, Y(0.01)))}"/><circle class="isl-vbrass2" cx="${F(cl - bwid * 0.01)}" cy="${F(bh2 + Y(0.024))}" r="${F(Y(0.012))}"/></g>`;
    s += '<g class="isl-lq" data-q="ays">' + bellG(ang, -bwid * 0.35);
    // the bell's rope, from its headstock down through the belfry floor to whoever rings it, on the side the
    // bell has swung away from
    // (art-audit wave 1: the bell swung with nothing to ring it)
    s += `<path class="isl-brope" d="M${F(tc - Y(0.04))} ${F(yokeY + Y(0.004))}Q${F(tc - Y(0.075))} ${F((yokeY + tTop) / 2)} ${F(tc - Y(0.085))} ${F(tTop - Y(0.02))}" stroke-width="${F(Math.max(0.9, Y(0.007)))}"/></g>`;
    s += '<g class="isl-lq" data-q="dn">' + bellG(0, 0)
      + `<path class="isl-brope" d="M${F(tc - Y(0.04))} ${F(yokeY + Y(0.004))}V${F(tTop - Y(0.02))}" stroke-width="${F(Math.max(0.9, Y(0.007)))}"/></g>`;
    // the pyramid roof and its vane
    s += `<path class="isl-troof" d="${polyD([[b0 - Y(0.03), bTop - Y(0.018)], [tc, roofTop + Y(0.04)], [b1 + Y(0.03), bTop - Y(0.018)]])}"/>`
      // (the vane whole inside the picture, on a short rod above the apex: it had been drawn above the frame)
      + `<path class="isl-vrail" d="M${F(tc)} ${F(roofTop + Y(0.045))}V${F(Y(0.012))}" stroke-width="${F(Math.max(1, Y(0.008)))}"/>`
      + `<path class="isl-vvane" d="M${F(tc)} ${F(Y(0.012))}h${F(Y(0.04))}l${F(-Y(0.01))} ${F(Y(0.013))}h${F(-Y(0.03))}Z"/>`;
    // 5. The rings of sound, spreading from the bell to the left, each in turn; birds lift off the roof.
    const scx = tc - Y(0.02), scy = yokeY + bh2 * 0.6;
    s += '<g class="isl-lq" data-q="ays">';   // (only while it rings)
    for (let k = 0; k < 3; k++) {
      // (from just outside the belfry: the inner ring had lain wholly on the pier beside the opening)
      const rr = Y(0.26 + k * 0.11), a0 = Math.PI * (0.8 + k * 0.01), a1 = Math.PI * 1.22;
      s += `<path class="isl-bsound isl-vwin" style="--i:${1 + k}" d="M${F(scx + Math.cos(a0) * rr)} ${F(scy + Math.sin(a0) * rr)}A${F(rr)} ${F(rr)} 0 0 1 ${F(scx + Math.cos(a1) * rr)} ${F(scy + Math.sin(a1) * rr)}" stroke-width="${F(Math.max(1.2, Y(0.014) * (1 - k * 0.2)))}" stroke-opacity="${(0.7 - k * 0.18).toFixed(2)}"/>`;
    }
    s += '</g>';
    let birds = '';
    for (const [bx, by, sz] of [[0.64, 0.16, 0.034], [0.69, 0.09, 0.028], [0.6, 0.26, 0.026]]) {
      const cx = X(bx), cy = Y(by), w = Y(sz);
      birds += `M${F(cx - w)} ${F(cy - w * 0.2)}Q${F(cx - w * 0.5)} ${F(cy - w * 0.6)} ${F(cx)} ${F(cy)}Q${F(cx + w * 0.5)} ${F(cy - w * 0.6)} ${F(cx + w)} ${F(cy - w * 0.2)}`;
    }
    // (the birds fly off as the bell rings at Dawn, by Day and at Sunset, glide in to roost at Dusk, nearer the
    // tower and lower with flatter wings, and at Night two doves sit on the belfry's sill under the resting bell;
    // art-audit wave 1, by version)
    let glide = '';
    for (const [bx, by, sz] of [[0.72, 0.2, 0.03], [0.75, 0.27, 0.026], [0.69, 0.31, 0.024]]) {
      const cx = X(bx), cy = Y(by), w = Y(sz);
      glide += `M${F(cx - w)} ${F(cy)}Q${F(cx - w * 0.5)} ${F(cy - w * 0.25)} ${F(cx)} ${F(cy)}Q${F(cx + w * 0.5)} ${F(cy - w * 0.25)} ${F(cx + w)} ${F(cy)}`;
    }
    let doves = '';
    for (const [dx, dir] of [[-Y(0.065), 1], [Y(0.06), -1]]) {
      const cx = tc + dx, cy = tTop - Y(0.02) - Y(0.008);
      doves += `<ellipse cx="${F(cx)}" cy="${F(cy)}" rx="${F(Y(0.015))}" ry="${F(Y(0.008))}"/><circle cx="${F(cx + dir * Y(0.013))}" cy="${F(cy - Y(0.007))}" r="${F(Y(0.006))}"/>`
        + `<path d="M${F(cx - dir * Y(0.012))} ${F(cy - Y(0.002))}l${F(-dir * Y(0.012))} ${F(Y(0.004))}l${F(dir * Y(0.004))} ${F(-Y(0.006))}Z"/>`;
    }
    s += `<g class="isl-lq" data-q="ays"><path class="isl-bbird" d="${birds}" stroke-width="${F(Math.max(1, Y(0.009)))}"/></g>`
      + `<g class="isl-lq" data-q="d"><path class="isl-bbird" d="${glide}" stroke-width="${F(Math.max(1, Y(0.009)))}"/></g>`
      + `<g class="isl-lq" data-q="n"><g class="isl-bdove">${doves}</g></g>`;
    // the tower's door, arched, in the middle of its base (art-audit wave 1: it had no way in)
    {
      const dw = Y(0.075), dT = ground - Y(0.03) - Y(0.15);
      s += `<path class="isl-vstone" d="${arch(tc, dT - Y(0.012), dw + Y(0.024), ground - Y(0.03))}"/><path class="isl-tdoor" d="${arch(tc, dT, dw, ground - Y(0.03))}"/>`
        + `<path class="isl-vcourse" d="M${F(tc)} ${F(dT + dw * 0.45)}V${F(ground - Y(0.03))}" stroke-width=".7"/>`;
    }
    // 6. The notice board at the tower's foot: two posts, a board in a frame under a little roof, its
    //    pinned notes; beside it the lantern on its post, in the page's hue, last.
    const nb0 = X(0.61), nb1 = nb0 + Y(0.4), nbT = Y(0.55), nbB = Y(0.78);
    s += `<path class="isl-vpost" d="${rect(nb0 + Y(0.02), nbB, Y(0.018), ground - nbB + 1)}${rect(nb1 - Y(0.038), nbB, Y(0.018), ground - nbB + 1)}"/>`;
    s += `<path class="isl-lwood2" d="${rect(nb0, nbT, nb1 - nb0, nbB - nbT)}"/><path class="isl-bcork" d="${rect(nb0 + Y(0.012), nbT + Y(0.012), nb1 - nb0 - Y(0.024), nbB - nbT - Y(0.024))}"/>`;
    s += `<path class="isl-lwood2" d="${polyD([[nb0 - Y(0.02), nbT + Y(0.004)], [(nb0 + nb1) / 2, nbT - Y(0.045)], [nb1 + Y(0.02), nbT + Y(0.004)]])}"/>`;   // (the board's own wood)
    let notes = '', pins = '', ink = '';
    // each note: its place across the board and down it (shares), its size (of the card's height), a tilt
    [[0.14, 0.42, 0.075, 0.1, -4], [0.34, 0.48, 0.085, 0.12, 3], [0.53, 0.4, 0.075, 0.09, -2], [0.71, 0.5, 0.09, 0.11, 5], [0.88, 0.44, 0.065, 0.085, -3]].forEach(([fx, fy, w, h, rot]) => {
      const cx = nb0 + (nb1 - nb0) * fx, cy = nbT + (nbB - nbT) * fy;
      notes += `<rect x="${F(cx - Y(w) / 2)}" y="${F(cy - Y(h) / 2)}" width="${F(Y(w))}" height="${F(Y(h))}" transform="rotate(${rot} ${F(cx)} ${F(cy)})"/>`;
      pins += `M${F(cx)} ${F(cy - Y(h) / 2 + Y(0.012))}h0`;
      for (let l = 0; l < 3; l++) ink += `M${F(cx - Y(w) * 0.32)} ${F(cy - Y(h) * 0.12 + l * Y(h) * 0.22)}h${F(Y(w) * (0.64 - l * 0.12))}`;
    });
    s += `<g class="isl-bnote">${notes}</g><path class="isl-bink" d="${ink}" stroke-width="${F(Math.max(0.6, Y(0.005)))}"/><path class="isl-bpin" d="${pins}" stroke-width="${F(Math.max(1.5, Y(0.014)))}"/>`;
    const lx = nb0 - Y(0.1), ly = Y(0.56);
    s += `<g class="isl-vwin isl-vlast" style="--i:4">${pool(lx, ground + Y(0.03), Y(0.2), Y(0.04), 0.7)}${halo(lx, ly - Y(0.06), Y(0.16), 'islvlamp')}`
      + `<path class="isl-vlamp isl-ltframe" d="M${F(lx - Y(0.014))} ${F(ly - Y(0.03))}V${F(ly - Y(0.09))}H${F(lx + Y(0.014))}V${F(ly - Y(0.03))}Z"/></g>`
      + panes(lx - Y(0.014), ly - Y(0.09), Y(0.028), Y(0.06));
    s += `<path class="isl-vpost" d="M${F(lx - 1)} ${F(ground)}V${F(ly - Y(0.03))}H${F(lx + 1)}V${F(ground)}Z"/><path class="isl-vpost isl-lcap" d="M${F(lx - Y(0.022))} ${F(ly - Y(0.09))}L${F(lx)} ${F(ly - Y(0.115))}L${F(lx + Y(0.022))} ${F(ly - Y(0.09))}Z"/>`;
    // Someone at the notice board, seen from behind in front of its left end, and a slatted bench on iron ends
    // in the lantern's pool beside it; the lantern's warm light on the person's near side and the bench's top
    // edges from Dawn to Night (art-audit wave 1, 2026-10-01: the square had no one in it). Who is there
    // answers the hour (by version): at Dawn someone pins up the day's notice, by Day and at Sunset someone
    // reads them, and after dark the square is empty; the bench stays.
    {
      const fx = nb0 + Y(0.075), fb = ground + Y(0.035), fh = Y(0.28), hr = fh * 0.075, sw = fh * 0.13;
      const ft = fb - fh, hy = ft + hr;
      let fig = `<path fill="#2f3a4a" d="M${F(fx - sw * 0.85)} ${F(fb)}L${F(fx - sw * 0.75)} ${F(ft + fh * 0.5)}H${F(fx + sw * 0.75)}L${F(fx + sw * 0.85)} ${F(fb)}H${F(fx + sw * 0.1)}L${F(fx)} ${F(ft + fh * 0.62)}L${F(fx - sw * 0.1)} ${F(fb)}Z"/>`;   // trousers
      fig += `<path fill="#c7d6e3" d="M${F(fx - sw * 0.82)} ${F(ft + fh * 0.53)}L${F(fx - sw)} ${F(ft + fh * 0.22)}Q${F(fx - sw)} ${F(ft + fh * 0.16)} ${F(fx - sw * 0.6)} ${F(ft + fh * 0.15)}H${F(fx + sw * 0.6)}Q${F(fx + sw)} ${F(ft + fh * 0.16)} ${F(fx + sw)} ${F(ft + fh * 0.22)}L${F(fx + sw * 0.82)} ${F(ft + fh * 0.53)}Z"/>`;   // shirt
      // (the pinner, at Dawn, has the right arm raised to the board, a hand flat on a new note, and the day's
      // other notices folded in the left hand)
      let pin = fig + `<path fill="#c7d6e3" d="${rect(fx - sw * 1.05, ft + fh * 0.2, sw * 0.24, fh * 0.3)}M${F(fx + sw * 0.78)} ${F(ft + fh * 0.18)}L${F(fx + sw * 1.02)} ${F(ft + fh * 0.16)}L${F(fx + sw * 1.12)} ${F(ft - fh * 0.04)}L${F(fx + sw * 0.9)} ${F(ft - fh * 0.04)}Z"/>`
        + `<path fill="#6b4630" d="${rect(fx - sw * 1.02, ft + fh * 0.48, sw * 0.18, fh * 0.07)}${rect(fx + sw * 0.88, ft - fh * 0.1, sw * 0.24, fh * 0.07)}${rect(fx - hr * 0.45, hy + hr * 0.6, hr * 0.9, fh * 0.07)}"/>`
        + `<path fill="#fbf6ea" d="${rect(fx - sw * 1.18, ft + fh * 0.5, sw * 0.32, fh * 0.1)}"/>`;
      fig += `<path fill="#c7d6e3" d="${rect(fx - sw * 1.05, ft + fh * 0.2, sw * 0.24, fh * 0.3)}${rect(fx + sw * 0.81, ft + fh * 0.2, sw * 0.24, fh * 0.3)}"/>`;   // sleeves
      fig += `<path fill="#6b4630" d="${rect(fx - sw * 1.02, ft + fh * 0.48, sw * 0.18, fh * 0.07)}${rect(fx + sw * 0.84, ft + fh * 0.48, sw * 0.18, fh * 0.07)}${rect(fx - hr * 0.45, hy + hr * 0.6, hr * 0.9, fh * 0.07)}"/>`;   // hands, neck
      const headShoes = `<circle fill="#1d1916" cx="${F(fx)}" cy="${F(hy)}" r="${F(hr)}"/>`   // the head, from behind
        + `<path fill="#3a2e24" d="${rect(fx - sw * 0.85, fb - fh * 0.02, sw * 0.7, fh * 0.03)}${rect(fx + sw * 0.15, fb - fh * 0.02, sw * 0.7, fh * 0.03)}"/>`;   // shoes
      fig += headShoes; pin += headShoes;
      const b0 = lx - Y(0.21), b1 = lx - Y(0.05), sy = ground + Y(0.005), bh = Y(0.07);
      let bench = `<path class="isl-vpost" d="${rect(b0 + Y(0.008), sy - bh * 0.95, Y(0.008), bh * 0.95 + Y(0.02))}${rect(b1 - Y(0.016), sy - bh * 0.95, Y(0.008), bh * 0.95 + Y(0.02))}"/>`;   // iron ends
      bench += `<path class="isl-bbench" d="${rect(b0, sy - Y(0.004), b1 - b0, Y(0.012))}${rect(b0, sy - bh * 0.62, b1 - b0, Y(0.011))}${rect(b0, sy - bh * 0.9, b1 - b0, Y(0.011))}"/>`;   // seat and back slats
      s += `<g class="isl-bfig">${bench}<g class="isl-lq" data-q="a">${pin}</g><g class="isl-lq" data-q="ys">${fig}</g></g>`;
      const sw2 = F(Math.max(0.8, Y(0.006)));
      s += `<g class="isl-vlamps isl-vwin" style="--i:4"><path class="isl-mlit" d="M${F(b0)} ${F(sy - Y(0.004))}H${F(b1)}M${F(b0)} ${F(sy - bh * 0.9)}H${F(b1)}" stroke-width="${sw2}"/>`
        + `<g class="isl-lq" data-q="ays"><path class="isl-mlit" d="M${F(fx - sw * 1.04)} ${F(ft + fh * 0.21)}V${F(ft + fh * 0.5)}M${F(fx - hr * 0.95)} ${F(hy - hr * 0.3)}A${F(hr)} ${F(hr)} 0 0 0 ${F(fx - hr * 0.7)} ${F(hy + hr * 0.7)}" stroke-width="${sw2}"/></g></g>`;
    }
    return `<g style="--isl-vstep:.4s">${s}</g>`;
  }

  /* Shared by the news pages' interiors (round 7, wave 2): the room's wall with one window cut out of it,
     so build()'s sky and whatever the piece draws outside show through; the reveal's shadow on the side
     `side` (-1 left, 1 right), the frame with one mullion and one transom, and the sill. `grad` is the
     id of the piece's wall gradient (the library's wall tokens). */
  function windowWall(W, H, f, grad, side = -1) {
    const { wx0, wx1, ww, wT, wB } = f, rv = Math.max(2, H * 0.025), jx = side < 0 ? wx0 : wx1;
    return `<defs><linearGradient id="${grad}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-lwall0"/><stop offset="1" class="st-lwall1"/></linearGradient></defs>`
      + `<path fill="url(#${grad})" fill-rule="evenodd" d="${rect(-2, -2, W + 4, H + 4)}${rect(wx0, wT, ww, wB - wT)}"/>`
      + `<path class="isl-lsidew" d="${polyD([[jx, wT], [jx - side * rv, wT + rv], [jx - side * rv, wB], [jx, wB]])}${rect(wx0, wB - rv, ww, rv)}"/>`
      + `<path class="isl-lframe" d="${rect(wx0, wT, ww, wB - wT)}" stroke-width="${F(Math.max(1.5, H * 0.018))}"/>`
      + `<path class="isl-lframe" d="M${F(wx0 + ww * 0.5)} ${F(wT)}V${F(wB)}M${F(wx0)} ${F(wT + (wB - wT) * 0.42)}H${F(wx1)}" stroke-width="${F(Math.max(1, H * 0.011))}"/>`
      + `<path class="isl-lsill" d="${rect(wx0 - H * 0.02, wB, ww + H * 0.04, Math.max(2, H * 0.022))}"/>`
      + `<path class="isl-tdrop" d="${rect(wx0 - H * 0.02, wB + Math.max(2, H * 0.022), ww + H * 0.04, Math.max(1.5, H * 0.012))}"/>`;   // the sill's shadow
  }
  // The view out of a round-7 window: far hills on the horizon rimmed by the afterglow, mist at their
  // foot, a few lights on them with their columns on the water, and a boat or two at anchor.
  function windowView(W, H, f, y0, r, boats = 2) {
    const { wx0, ww } = f, Y = (k) => k * H, lights = [];
    const hill = [[0, 0.012], [0.16, 0.05], [0.3, 0.075], [0.44, 0.05], [0.6, 0.066], [0.78, 0.03], [1, 0.012]].map(([x, h]) => [wx0 + ww * x, y0 - Y(h)]);
    const farLand = `<path class="f-isl" d="${polyD([[wx0 - 2, y0 + 1], ...hill, [wx0 + ww + 2, y0 + 1]])}${scrubLine(hill, 2, 0.5, 1.1, r)}"/>`;
    let s = farLand + `<path class="s-rim" d="${lineD(hill.map(([x, y]) => [x, y + 0.5]))}" stroke-width="1" stroke-opacity=".3"/>` + mirrored(y0, farLand, 0.16) + mist(wx0, y0, ww, Y(0.05), 0.45);
    for (let i = 0; i < 6; i++) lights.push([wx0 + ww * (0.06 + r() * 0.88), y0 - Y(0.006 + r() * 0.03)]);
    // (a short, faint column on the water under each of the hills' lights, as the windowView promised)
    const rl = rng(4057);
    for (const [lx] of lights) s += dashes(streakList(lx, y0 + 1, H, rl, 0.03, 0.025), 's-vglow', 1, [0.05, 0.1, 0.18]);
    let hulls = '', masts = '';
    for (const [fx, fy, k] of [[0.3, 0.08, 0.8], [0.72, 0.12, 1]].slice(0, boats)) {
      const bx = wx0 + ww * fx, by = y0 + Y(fy), hw = Y(0.04) * k, mh = Y(0.22) * k;
      const hd = `M${F(bx - hw)} ${F(by - Y(0.015) * k)}H${F(bx + hw)}L${F(bx + hw * 0.72)} ${F(by)}H${F(bx - hw * 0.78)}Z`, md = `M${F(bx)} ${F(by - Y(0.015) * k)}V${F(by - mh)}`;
      s += `<g transform="translate(0 ${F(2 * by)}) scale(1 -1)" opacity=".18"><path class="isl-vhull" d="${hd}"/><path class="isl-vmast" d="${md}" stroke-width=".8"/></g>`;   // its reflection
      hulls += hd;
      masts += md;
      lights.push([bx, by - mh, 'b']);
      s += dashes(streakList(bx, by + 1, H, r, 0.05, 0.06), 's-vcoolglow', 1, [0.08, 0.16, 0.3]);
    }
    s += `<path class="isl-vhull" d="${hulls}"/><path class="isl-vmast" d="${masts}" stroke-width=".8"/>`;
    return s + lightsPaths(lights);
  }
  const newsFrame = (W, H, side = 1) => {
    const ww = clamp(H * 0.95, W * 0.18, W * 0.26), wx0 = side > 0 ? W * 0.955 - ww : W * 0.045;
    return { wx0, wx1: wx0 + ww, ww, wT: H * 0.1, wB: H * 0.6, hz: H * 0.45 };
  };

  /* THIS WEEK'S CALENDAR (the This Week page's head; owner, 2026-09-29: art tied to the title at a
     glance): a wall calendar with this week's row ringed in the page's hue, its past days crossed off and
     today circled; a wall clock beside it showing the hour of the version (a little after six at Dawn,
     half past ten by Day, half past six at Sunset, half past seven at Dusk, ten at Night); a shelf with the
     week's paper folded on it and a cup; a sconce, lit from Dawn to Night; the window at the right onto
     the harbour, facing the Sun's setting bearing. Face on, sized from the card's height. The harbour's
     lights come on, then the sconce, and the ring is drawn last. */
  function weekCalendar(W, H, v) {
    const y0 = v.y0, X = (k) => k * W, Y = (k) => k * H, r = rng(811);
    const f = newsFrame(W, H, 1);
    let s = windowView(W, H, f, y0, r, 2) + windowWall(W, H, f, 'islcwallg', 1);
    // the shelf along the foot of the wall, its bracket shadows
    const sh = Y(0.8), sh1 = f.wx0 - Y(0.06);
    s += `<path class="isl-tdrop" d="${rect(X(0.03), sh + Y(0.03), sh1 - X(0.03), Y(0.03))}"/><path class="isl-lwood" d="${rect(X(0.03), sh, sh1 - X(0.03), Y(0.032))}"/>`
      + `<path class="isl-lwood2" d="${rect(X(0.08), sh + Y(0.032), Y(0.02), Y(0.08))}${rect(sh1 - X(0.05), sh + Y(0.032), Y(0.02), Y(0.08))}"/>`;
    // 1. The calendar: hung from a nail by its cord; a binding bar, a band where its month's picture
    //    would be, a row of day initials (ticks), and the month's grid, seven days by five weeks.
    const cw = Y(0.86), cx0 = X(0.44) - cw / 2, cT = Y(0.1), cB = Y(0.74), gT = cT + Y(0.2);
    // (its shadow falls down and to the left, away from the window and the sconce, the room's lights)
    s += `<path class="isl-tdrop" d="${rect(cx0 - Y(0.012), cT + Y(0.02), cw, cB - cT)}"/>`
      + `<path class="isl-bink" d="M${F(cx0 + cw * 0.3)} ${F(cT)}L${F(cx0 + cw / 2)} ${F(cT - Y(0.07))}L${F(cx0 + cw * 0.7)} ${F(cT)}" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/>`
      + `<circle class="isl-tiron" cx="${F(cx0 + cw / 2)}" cy="${F(cT - Y(0.07))}" r="${F(Math.max(1.2, Y(0.01)))}"/>`;
    // (art-audit pass 4, 2026-10-01: the edges of the months beneath show at the page's foot, each a pixel
    // lower and a step darker than the one above it, so the calendar reads as a pad of pages, not one card)
    const pe = Math.max(1, Y(0.0035));
    s += `<path class="isl-lpage" d="${rect(cx0, cB - 1, cw, 1 + 3 * pe)}"/>`;
    for (let i = 0; i < 3; i++) s += `<path class="isl-tdrop" d="${rect(cx0, cB + i * pe, cw, (3 - i) * pe)}"/>`;
    s += `<path class="isl-lpage" d="${rect(cx0, cT, cw, cB - cT)}"/><path class="isl-cband" d="${rect(cx0, cT, cw, Y(0.12))}"/>`
      // (art-audit pass 4, 2026-10-01: the sheet had one flat fill, the loudest area at Night; the sconce and the
      // window are both at its right, so it darkens toward its left edge, by how much set per version in
      // layout-art.css, st-cpage: most at Night, least by Day, the pages' edges under it too; then the binding
      // bar's shadow along the band)
      + `<defs><linearGradient id="islcpageg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="st-cpage"/><stop offset="1" class="st-cpage0"/></linearGradient></defs>`
      + `<path fill="url(#islcpageg)" d="${rect(cx0, cT, cw, cB - cT + 3 * pe)}"/><path class="isl-tdrop" d="${rect(cx0, cT + Y(0.008), cw, Math.max(1, Y(0.005)))}"/>`
      + `<path class="isl-tiron" d="${rect(cx0 - Y(0.006), cT - Y(0.012), cw + Y(0.012), Y(0.02))}"/>`;
    const cols = 7, rows = 5, gw = (cw - Y(0.06)) / cols, gh = (cB - gT - Y(0.03)) / rows, gx0 = cx0 + Y(0.03);
    // A1 (art-audit pass 4, 2026-10-01): the pen that crosses the days off, tied by a string round the binding
    // bar's left end and hanging down the calendar's edge beside the crossed-off days, a little off plumb. It
    // hangs on the page's edge, clear of the ring; a marker about one and a half times the cup's height, so it
    // reads at the picture's size. Its shadow falls down and to the left as the calendar's does, and a pale
    // line down its lit side (the sconce and the window are to the right) keeps its round barrel reading
    // against the dark wall at Night. Drawn upright about its top, then turned.
    const penX = cx0 - Y(0.004), penT = gT + 2 * gh, penL = Y(0.14), penW = Y(0.018), penA = 5;
    const penD = polyD([[-penW / 2, 0], [penW / 2, 0], [penW / 2, penL * 0.86], [penW * 0.1, penL], [-penW * 0.1, penL], [-penW / 2, penL * 0.86]]);
    s += `<path class="isl-cstring" d="M${F(penX)} ${F(cT - Y(0.012))}V${F(cT + Y(0.012))}Q${F(penX - Y(0.004))} ${F((cT + penT) / 2)} ${F(penX)} ${F(penT)}" stroke-width="${F(Math.max(0.7, Y(0.003)))}"/>`
      + `<g transform="translate(${F(penX - Y(0.012))} ${F(penT + Y(0.02))}) rotate(${penA})"><path class="isl-tdrop" d="${penD}"/></g>`
      + `<g transform="translate(${F(penX)} ${F(penT)}) rotate(${penA})">`
      + `<rect class="isl-lbk2" x="${F(-penW / 2)}" y="0" width="${F(penW)}" height="${F(penL * 0.87)}" rx="${F(penW * 0.35)}"/>`
      + `<path class="isl-lalu" d="${polyD([[-penW * 0.42, penL * 0.86], [penW * 0.42, penL * 0.86], [penW * 0.1, penL], [-penW * 0.1, penL]])}"/>`   // its pale tip
      + `<path class="isl-tiron" d="${rect(-penW / 2, penL * 0.38, penW, penL * 0.05)}${rect(-penW * 0.14, penL * 0.03, penW * 0.28, penL * 0.33)}"/>`   // the cap's band and its clip
      + `<path class="isl-lshadehi" d="M${F(penW * 0.3)} ${F(penL * 0.46)}V${F(penL * 0.82)}" stroke-width="${F(Math.max(0.6, penW * 0.16))}"/></g>`;
    let grid = '', ticks = '', dots = '';
    for (let c = 0; c < cols; c++) ticks += `M${F(gx0 + (c + 0.35) * gw)} ${F(gT - Y(0.03))}h${F(gw * 0.3)}`;
    for (let c = 0; c <= cols; c++) grid += `M${F(gx0 + c * gw)} ${F(gT)}V${F(gT + rows * gh)}`;
    for (let rr = 0; rr <= rows; rr++) grid += `M${F(gx0)} ${F(gT + rr * gh)}H${F(gx0 + cols * gw)}`;
    // (an event later this week, inside the ring after today; none under a crossed-off day or the ring's edge)
    for (const [c, rr, cls] of [[1, 0, 'isl-lbk2'], [4, 1, 'isl-lbk3'], [5, 2, 'isl-lbk1'], [5, 4, 'isl-lbk2'], [0, 4, 'isl-lbk3'], [6, 1, 'isl-lbk1']]) {
      dots += `<circle class="${cls}" cx="${F(gx0 + (c + 0.72) * gw)}" cy="${F(gT + (rr + 0.3) * gh)}" r="${F(Math.max(1, gh * 0.11))}"/>`;
    }
    s += `<path class="isl-bink" d="${ticks}" stroke-width="${F(Math.max(1, Y(0.01)))}"/><path class="isl-cgrid" d="${grid}" stroke-width=".8"/>${dots}`;
    // this week: the third row; its first days crossed off, today circled
    const wk = 2, wy = gT + wk * gh;
    let cross = '';
    for (let c = 0; c < 3; c++) { const x = gx0 + c * gw; cross += `M${F(x + gw * 0.22)} ${F(wy + gh * 0.22)}L${F(x + gw * 0.78)} ${F(wy + gh * 0.78)}M${F(x + gw * 0.78)} ${F(wy + gh * 0.22)}L${F(x + gw * 0.22)} ${F(wy + gh * 0.78)}`; }
    s += `<path class="isl-cmark" d="${cross}" stroke-width="${F(Math.max(1, Y(0.009)))}"/>`
      + `<circle class="isl-cmark" cx="${F(gx0 + 3.5 * gw)}" cy="${F(wy + gh / 2)}" r="${F(gh * 0.36)}" stroke-width="${F(Math.max(1, Y(0.009)))}"/>`;
    s += `<g class="isl-vwin isl-vlast" style="--i:3"><rect class="isl-cring" x="${F(gx0 - Y(0.012))}" y="${F(wy - Y(0.012))}" width="${F(cols * gw + Y(0.024))}" height="${F(gh + Y(0.024))}" rx="${F(gh * 0.35)}" stroke-width="${F(Math.max(1.6, Y(0.016)))}"/></g>`;
    // 2. The clock, left of the calendar, its hands at each version's hour.
    const kx = X(0.15), ky = Y(0.3), kr = Y(0.14);
    s += `<circle class="isl-tdrop" cx="${F(kx - Y(0.01))}" cy="${F(ky + Y(0.014))}" r="${F(kr)}"/><circle class="isl-lwood2" cx="${F(kx)}" cy="${F(ky)}" r="${F(kr)}"/><circle class="isl-lpage" cx="${F(kx)}" cy="${F(ky)}" r="${F(kr * 0.84)}"/>`;
    let marks = '';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; marks += `M${F(kx + Math.sin(a) * kr * 0.7)} ${F(ky - Math.cos(a) * kr * 0.7)}L${F(kx + Math.sin(a) * kr * 0.78)} ${F(ky - Math.cos(a) * kr * 0.78)}`; }
    s += `<path class="isl-bink" d="${marks}" stroke-width="${F(Math.max(0.8, Y(0.007)))}"/>`;
    const hand = (h, m) => { const ah = ((h % 12) + m / 60) / 12 * Math.PI * 2, am = m / 60 * Math.PI * 2;
      return `M${F(kx)} ${F(ky)}L${F(kx + Math.sin(ah) * kr * 0.42)} ${F(ky - Math.cos(ah) * kr * 0.42)}M${F(kx)} ${F(ky)}L${F(kx + Math.sin(am) * kr * 0.64)} ${F(ky - Math.cos(am) * kr * 0.64)}`; };
    // (the dusk hand hangs in its own version group: isl-d is hidden only at Dawn, Day and Night, so at
    // Sunset it showed beside the sunset hand and the clock had two hour hands, owner's review 2026-09-30)
    for (const [cls, h, m] of [['isl-a', 6, 5], ['isl-y', 10, 30], ['isl-s', 18, 30], ['isl-d', 19, 30], ['isl-n', 22, 0]]) {
      const dusk = cls === 'isl-d';
      const p = `<path class="${dusk ? 'isl-chand' : cls + ' isl-chand'}" d="${hand(h, m)}" stroke-width="${F(Math.max(1.2, Y(0.012)))}"/>`;
      s += dusk ? `<g class="isl-lq" data-q="d">${p}</g>` : p;
    }
    s += `<circle class="isl-tiron" cx="${F(kx)}" cy="${F(ky)}" r="${F(Math.max(1, Y(0.01)))}"/>`;
    // 3. The shelf's things: the week's paper, folded, its headline and columns; a cup; a small plant.
    const px = X(0.08), pw = Y(0.44), ph = Y(0.1);
    s += `<path class="isl-lpage" d="${polyD([[px, sh], [px + pw, sh], [px + pw * 0.97, sh - ph], [px + pw * 0.03, sh - ph]])}"/>`
      + `<path class="isl-bink" d="M${F(px + pw * 0.1)} ${F(sh - ph * 0.72)}h${F(pw * 0.7)}" stroke-width="${F(Math.max(1.2, Y(0.014)))}"/>`
      + `<path class="isl-ltext" d="M${F(px + pw * 0.1)} ${F(sh - ph * 0.38)}h${F(pw * 0.35)}M${F(px + pw * 0.52)} ${F(sh - ph * 0.38)}h${F(pw * 0.36)}M${F(px + pw * 0.1)} ${F(sh - ph * 0.18)}h${F(pw * 0.33)}M${F(px + pw * 0.52)} ${F(sh - ph * 0.18)}h${F(pw * 0.3)}" stroke-width="${F(Math.max(0.6, Y(0.006)))}"/>`;
    const mx = px + pw + Y(0.1), mw = Y(0.035), mt = sh - Y(0.09);
    s += `<path class="isl-lmug" d="M${F(mx - mw)} ${F(sh)}V${F(mt)}H${F(mx + mw)}V${F(sh)}Z"/>`
      + `<path class="isl-lredsh" d="${rect(mx - mw, mt, mw * 0.65, sh - mt)}"/>`   // (its side away from the lights)
      + `<ellipse class="isl-lmug" cx="${F(mx)}" cy="${F(mt)}" rx="${F(mw)}" ry="${F(Y(0.008))}"/><ellipse class="isl-lbronze" cx="${F(mx)}" cy="${F(mt + 0.5)}" rx="${F(mw * 0.8)}" ry="${F(Y(0.0055))}"/>`
      + `<path class="isl-lmugh" d="M${F(mx + mw)} ${F(mt + Y(0.02))}q${F(mw * 0.9)} ${F(Y(0.025))} 0 ${F(Y(0.05))}" stroke-width="${F(Math.max(1, Y(0.01)))}"/>`;
    const tx = sh1 - Y(0.12);
    s += `<path class="isl-lred" d="M${F(tx - Y(0.04))} ${F(sh)}L${F(tx - Y(0.05))} ${F(sh - Y(0.07))}H${F(tx + Y(0.05))}L${F(tx + Y(0.04))} ${F(sh)}Z"/>`
      // (a room's green in every version: as the hill's scrub it took the landscape's night colour indoors)
      + shrubs([[tx - Y(0.02), sh - Y(0.07), Y(0.045)], [tx + Y(0.025), sh - Y(0.075), Y(0.04)], [tx, sh - Y(0.1), Y(0.04)]], r).replace('f-near isl-shrub', 'isl-tshade isl-shrub');
    // 4. The sconce between the calendar and the window, lit from Dawn to Night.
    const lx = (cx0 + cw + f.wx0) / 2, ly = Y(0.22);
    // (its lit mouth under the shade, and its cone kept on the wall, between the calendar and the window)
    const cf = Math.min(Y(0.12), (f.wx0 - (cx0 + cw)) / 2 - Y(0.012));
    const st = Y(0.021), sb = Y(0.035), sm = ly + Y(0.07), mry = Y(0.01), tw = F(Math.max(0.8, Y(0.003)));
    s += `<g class="isl-vlamps isl-vwin" style="--i:1">${halo(lx, ly + Y(0.04), Y(0.22), 'islvbulb')}<path d="${polyD([[lx - sb, sm], [lx + sb, sm], [lx + cf, Y(0.62)], [lx - cf, Y(0.62)]])}" fill="url(#islvspill)"/></g>`;   // (from the shade's mouth)
    // C1 (art-audit pass 4, 2026-10-01): the stem and the shade were one brown, a broad neck on a body narrowing
    // downward, with no plate and no mouth, so by Day the sconce read as a bottle on the wall. Now an iron plate
    // on the wall, a thin brass rod from its knuckle, and a cream fabric shade with a bronze trim (isl-cfab),
    // flared toward its foot as a lampshade is, its side away from the window in shade; its open mouth seen
    // from below in every version, dark inside by Day and lit over it from Dawn to Night, as the hospital
    // room's lamp does. It keeps the old one's width, since at 1440 it stands close to the window's frame.
    s += `<rect class="isl-tiron" x="${F(lx - Y(0.013))}" y="${F(ly - Y(0.076))}" width="${F(Y(0.026))}" height="${F(Y(0.054))}" rx="${F(Y(0.009))}"/>`
      + `<path class="isl-lbronze" d="${rect(lx - Y(0.005), ly - Y(0.049), Y(0.01), Y(0.051))}"/><circle class="isl-lbronze" cx="${F(lx)}" cy="${F(ly - Y(0.049))}" r="${F(Y(0.008))}"/>`
      + `<path class="isl-cfab" d="M${F(lx - st)} ${F(ly)}H${F(lx + st)}L${F(lx + sb)} ${F(sm)}H${F(lx - sb)}Z" stroke-width="${tw}"/>`
      + `<path class="isl-lredsh" d="${polyD([[lx - st, ly], [lx - st * 0.25, ly], [lx - sb * 0.25, sm], [lx - sb, sm]])}"/>`
      + `<ellipse class="isl-cfab" cx="${F(lx)}" cy="${F(sm)}" rx="${F(sb)}" ry="${F(mry)}" stroke-width="${tw}"/><ellipse class="isl-tunder" cx="${F(lx)}" cy="${F(sm)}" rx="${F(sb)}" ry="${F(mry)}"/>`
      // (lit, the fabric glows with the bulb inside it: lit only at its mouth it had read as metal; pass 4 review)
      + `<g class="isl-vlamps isl-vwin" style="--i:1"><path class="isl-tbulb" opacity=".3" d="M${F(lx - st)} ${F(ly)}H${F(lx + st)}L${F(lx + sb)} ${F(sm)}H${F(lx - sb)}Z"/><ellipse class="isl-tbulb" cx="${F(lx)}" cy="${F(sm)}" rx="${F(sb - Y(0.003))}" ry="${F(mry - Y(0.002))}"/></g>`;
    return `<g style="--isl-vstep:.5s">${s}</g>`;
  }

  /* THE HOSPITAL ROOM (the Clinical Practice page's head; owner, 2026-09-29: art tied to the title at a
     glance): a hospital room, the bed with its head raised and a patient resting in it under the blanket, a
     drip stand with its bag and line, a monitor on its arm tracing a heartbeat in the page's hue, the curtain
     gathered on its track, a chair by the window (a visitor in it at Sunset, their cardigan on it by Day;
     art-audit pass 4, 2026-10-01), the blinds half down. The monitor is always on; a reading lamp over the
     bed is lit from Dawn to Night. Face on, sized from the card's height. The harbour's lights come on, then
     the lamp, and the monitor's trace last. */
  function hospitalRoom(W, H, v) {
    const y0 = v.y0, X = (k) => k * W, Y = (k) => k * H, r = rng(907);
    const f = newsFrame(W, H, 1);
    let s = windowView(W, H, f, y0, r, 1) + windowWall(W, H, f, 'islhwallg', 1);
    // the blinds, lowered over the window's upper half, slats and cords
    let slats = '';
    for (let y = f.wT + Y(0.02); y < f.wT + (f.wB - f.wT) * 0.4; y += Y(0.024)) slats += rect(f.wx0 + Y(0.01), y, f.ww - Y(0.02), Y(0.014));
    s += `<path class="isl-hslat" d="${slats}"/><path class="isl-hcord" d="M${F(f.wx0 + f.ww * 0.2)} ${F(f.wT)}V${F(f.wT + (f.wB - f.wT) * 0.5)}M${F(f.wx0 + f.ww * 0.8)} ${F(f.wT)}V${F(f.wT + (f.wB - f.wT) * 0.46)}" stroke-width="${F(Math.max(0.6, Y(0.004)))}"/>`;
    // the floor and the skirting
    const fl = Y(0.9);
    s += `<path class="isl-lfloor" d="${rect(-2, fl, W + 4, H - fl + 2)}"/><path class="isl-lbase" d="M-2 ${F(fl)}H${F(W + 2)}" stroke-width="${F(Math.max(1, Y(0.012)))}"/>`;
    // 1. The curtain, gathered at the left on its ceiling track.
    const cx1 = X(0.1);
    s += `<path class="isl-hrail" d="M-2 ${F(Y(0.04))}H${F(X(0.46))}" stroke-width="${F(Math.max(1.2, Y(0.012)))}"/>`;
    let folds = '';
    // (its top band an open mesh, as a cubicle curtain's is, the wall showing through it, a seam at its foot)
    const mB = Y(0.13);
    let mesh = '';
    for (let x = X(0.005); x < cx1; x += Y(0.018)) mesh += `M${F(x)} ${F(Y(0.045))}V${F(mB)}`;
    for (let y = Y(0.06); y < mB; y += Y(0.018)) mesh += `M-2 ${F(y)}H${F(cx1 + Y(0.004))}`;
    s += `<path class="isl-hcurtain" fill-opacity=".35" d="${rect(-2, Y(0.045), cx1 + 2 + Y(0.004), mB - Y(0.045))}"/><path class="isl-hfold" d="${mesh}" stroke-width=".6"/>`;
    for (let x = X(0.005); x < cx1; x += Y(0.035)) folds += `M${F(x)} ${F(mB)}Q${F(x + Y(0.012))} ${F(Y(0.45))} ${F(x - Y(0.004))} ${F(fl - Y(0.04))}`;
    s += `<path class="isl-hfold" d="M-2 ${F(mB)}H${F(cx1 + Y(0.004))}" stroke-width="${F(Math.max(1, Y(0.01)))}"/>`;
    s += `<path class="isl-hcurtain" d="M-2 ${F(mB)}H${F(cx1)}Q${F(cx1 + Y(0.03))} ${F(Y(0.5))} ${F(cx1 - Y(0.01))} ${F(fl - Y(0.035))}H-2Z"/><path class="isl-hfold" d="${folds}" stroke-width="${F(Math.max(0.8, Y(0.008)))}"/>`;
    // 2. The bed: its frame on wheels, the mattress, the head raised, the pillow, the blanket, a rail.
    // (its wheels on the floor in front of the wall, with its shadow: it had hung above the floor line)
    const b0 = X(0.2), b1 = X(0.62), bTop = Y(0.64), bMid = Y(0.7), bLeg = Y(0.87);
    s += `<ellipse class="isl-tdrop" cx="${F((b0 + b1) / 2)}" cy="${F(Y(0.93))}" rx="${F((b1 - b0) / 2 + Y(0.02))}" ry="${F(Y(0.012))}"/>`;
    const hx = b0 + (b1 - b0) * 0.28;
    s += `<path class="isl-hframe" d="${rect(b0, bMid, b1 - b0, Y(0.028))}M${F(b0 + Y(0.03))} ${F(bMid)}V${F(bLeg)}M${F(b1 - Y(0.03))} ${F(bMid)}V${F(bLeg)}" stroke-width="${F(Math.max(1.2, Y(0.014)))}"/>`;
    for (const wx of [b0 + Y(0.03), b1 - Y(0.03)]) s += `<circle class="isl-tiron" cx="${F(wx)}" cy="${F(bLeg + Y(0.03))}" r="${F(Y(0.03))}"/>`;
    s += `<path class="isl-hframe" d="M${F(b1)} ${F(bMid + Y(0.02))}V${F(bTop - Y(0.12))}M${F(b0)} ${F(bMid + Y(0.02))}V${F(bTop - Y(0.3))}" stroke-width="${F(Math.max(1.4, Y(0.016)))}"/>`;
    s += `<path class="isl-hmat" d="${polyD([[b0 + Y(0.01), bMid], [b1 - Y(0.01), bMid], [b1 - Y(0.01), bTop], [hx, bTop], [b0 + Y(0.05), bTop - Y(0.22)], [b0 + Y(0.01), bTop - Y(0.2)]])}"/>`;
    s += `<path class="isl-lpage" d="M${F(b0 + Y(0.04))} ${F(bTop - Y(0.2))}Q${F(b0 + Y(0.14))} ${F(bTop - Y(0.3))} ${F(b0 + Y(0.2))} ${F(bTop - Y(0.12))}Q${F(b0 + Y(0.12))} ${F(bTop - Y(0.06))} ${F(b0 + Y(0.06))} ${F(bTop - Y(0.1))}Z"/>`;
    // The patient (art-audit pass 4, 2026-10-01, hospital-room-A1, which also settles C1; the owner chose it):
    // the monitor traced a heartbeat and the drip ran into the pillow of an empty bed. Someone now rests under
    // the blanket, a plain head on the pillow turned to the window, no face drawn, one arm out over the
    // blanket with the drip's cannula on its forearm. The same in all five versions (the monitor reads them at
    // every hour, so they never leave), dimmed with the room's light by version as the Lecture Hall's people
    // are (isl-mroom). Placed along the mattress: on(s, w) is the point s along its surface from the top of
    // the raised head, down the slope to the bend at hx and on along the flat, and w above it.
    const pA = [b0 + Y(0.05), bTop - Y(0.22)], pL = Math.hypot(hx - pA[0], bTop - pA[1]);
    const pd = [(hx - pA[0]) / pL, (bTop - pA[1]) / pL], pn = [pd[1], -pd[0]];
    const on = (sd, w) => (sd <= pL ? [pA[0] + pd[0] * sd + pn[0] * w, pA[1] + pd[1] * sd + pn[1] * w] : [hx + sd - pL, bTop - w]);
    const P = (p) => `${F(p[0])} ${F(p[1])}`;
    const crD = (p) => `M${P(p[0])}` + p.slice(1).map((c, i) => {   // a smooth line through the points
      const a = p[Math.max(0, i - 1)], b = p[i], d = p[Math.min(p.length - 1, i + 2)];
      return `C${F(b[0] + (c[0] - a[0]) / 6)} ${F(b[1] + (c[1] - a[1]) / 6)} ${F(c[0] - (d[0] - b[0]) / 6)} ${F(c[1] - (d[1] - b[1]) / 6)} ${P(c)}`;
    }).join('');
    const crZ = (p) => `M${P(p[0])}` + p.map((b, i) => {   // the same, closed round on itself
      const n = p.length, a = p[(i + n - 1) % n], c = p[(i + 1) % n], d = p[(i + 2) % n];
      return `C${F(b[0] + (c[0] - a[0]) / 6)} ${F(b[1] + (c[1] - a[1]) / 6)} ${F(c[0] - (d[0] - b[0]) / 6)} ${F(c[1] - (d[1] - b[1]) / 6)} ${P(c)}`;
    }).join('') + 'Z';
    const pSkin = '#8a5a3c', pHair = '#231c18', pGown = '#a9c2bb';
    // (the head in profile, its back in the pillow, its face to the window: the skull, jaw and chin in skin, no
    // features, the hair over its crown and back. hp(a, b) is a point a head radii toward the face, b toward
    // the crown; the neck runs down toward the shoulders)
    const hr = Y(0.045), hc = on(Y(0.11), Y(0.058));
    const fl0 = Math.hypot(pn[0] + 0.9, pn[1]), fv = [(pn[0] + 0.9) / fl0, pn[1] / fl0], cv = [fv[1], -fv[0]];
    const hp = (a, b) => [hc[0] + (fv[0] * a + cv[0] * b) * hr, hc[1] + (fv[1] * a + cv[1] * b) * hr];
    const nk = (p) => [p[0] + pd[0] * Y(0.045), p[1] + pd[1] * Y(0.045)];
    let pt = `<path fill="${pSkin}" d="${polyD([hp(-0.6, -0.55), hp(0.15, -0.85), nk(hp(0.15, -0.85)), nk(hp(-0.6, -0.55))])}"/>`   // the neck
      + `<path fill="${pSkin}" d="${crZ([[-0.2, 1], [0.55, 0.85], [0.95, 0.3], [1, -0.2], [0.72, -0.95], [0.2, -0.97], [-0.2, -0.75], [-0.75, -0.55], [-1, 0.1], [-0.75, 0.75]].map(([a, b]) => hp(a, b)))}"/>`
      + `<path fill="${pHair}" d="${crZ([[0.5, 0.9], [-0.2, 1.08], [-0.83, 0.8], [-1.08, 0.1], [-0.8, -0.6], [-0.35, -0.35], [-0.1, 0.15], [0.28, 0.52]].map(([a, b]) => hp(a, b)))}"/>`;
    // (the gown at the shoulder, between the neck and the blanket's turned-down edge)
    const sE = Y(0.21), wE = Y(0.095);
    pt += `<path fill="${pGown}" d="M${P(on(sE + Y(0.006), -Y(0.004)))}L${P(on(sE + Y(0.006), wE - Y(0.008)))}Q${P(on(Y(0.172), Y(0.098)))} ${P(on(Y(0.152), Y(0.062)))}L${P(on(Y(0.145), Y(0.01)))}Z"/>`;
    s += `<g class="isl-mroom">${pt}</g>`;
    // The blanket over them (C1/A1): a long low mound from the chest, down the raised head and over the hips,
    // a rise at the knees and a small tent at the feet, then flat to the foot of the bed. Along the raised
    // head it lies on the mattress; from the hips it hangs over the bed's side as before. The legs keep a
    // body's proportions at every width (stretched to fill the long bed, at 1920 they had been twice a
    // person's: pass 4 review); past the feet the blanket lies flat to the foot of the bed, as it does.
    const sHip = Y(0.42), xHip = on(sHip, 0)[0], xFt = xHip + Y(0.38);
    const lg = (k, w) => [xHip + (xFt - xHip) * k, bTop - w];
    // (the legs kept below the side rail's bar, so the rail reads as standing clear of them)
    const sil = [[sE, wE], [Y(0.27), Y(0.1)], [Y(0.34), Y(0.09)], [sHip, Y(0.074)]]
      .filter(([sd]) => sd < pL - Y(0.03) || sd > pL + Y(0.03)).map(([sd, w]) => on(sd, w))   // (none in the bend itself)
      .concat([lg(0.22, Y(0.056)), lg(0.48, Y(0.058)), lg(0.76, Y(0.047)), [xFt - Y(0.09), bTop - Y(0.048)], [xFt - Y(0.03), bTop - Y(0.07)], [xFt, bTop - Y(0.084)],
        [xFt + Y(0.04), bTop - Y(0.066)], [xFt + Y(0.12), bTop - Y(0.036)], [b1 - Y(0.005), bTop - Y(0.03)]]);
    s += `<path class="isl-hblanket" d="${crD(sil)}V${F(bMid + Y(0.035))}H${F(hx - Y(0.07))}L${P(on(pL - Y(0.06), -Y(0.004)))}L${P(on(sE, -Y(0.004)))}Z"/>`;
    // (its top turned down across the chest, the sheet's colour, with the fold's shadow under it; this replaces
    // the short dash that had stood for the turned-down edge on the empty bed and read as a stray mark)
    const sB = sE + Y(0.035);
    s += `<path class="isl-lpage" d="${polyD([on(sE, -Y(0.004)), on(sE, wE + Y(0.004)), on(sB, Y(0.103)), on(sB, -Y(0.004))])}"/>`
      + `<path class="isl-hfold" d="M${P(on(sB, 0))}L${P(on(sB, Y(0.1)))}" stroke-width="${F(Math.max(0.8, Y(0.008)))}"/>`;
    // (the near arm out over the blanket: the gown's short sleeve down the side, the elbow bent, the forearm
    // across to the belly and the hand resting there, kept clear of the side rail; where the card is narrower
    // the raised head is steeper and shorter, and the arm lies straighter along the side. The cannula, taped
    // on the forearm, is where the drip's line now ends)
    const aSh = Y(0.185), aEnd = Math.min(Y(0.39), pL + Y(0.025)), aK = clamp((aEnd - aSh - Y(0.15)) / Y(0.055), 0, 1);
    const aS = on(aSh, Y(0.05)), aE = on(aSh + (aEnd - aSh) * 0.6, Y(0.035)), aH = on(aEnd, Y(0.04) + Y(0.035) * aK);
    const aw = Y(0.026), mid = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k], aC = mid(aE, aH, 0.55);
    const al = Math.hypot(aH[0] - aE[0], aH[1] - aE[1]), au = [(aH[0] - aE[0]) / al, (aH[1] - aE[1]) / al];
    s += `<path class="isl-hfold" d="M${F(aE[0])} ${F(aE[1] + Y(0.012))}L${F(aH[0] + au[0] * Y(0.018))} ${F(aH[1] + au[1] * Y(0.018) + Y(0.012))}" stroke-width="${F(aw * 0.8)}"/>`;   // its shadow on the blanket
    s += `<g class="isl-mroom"><path fill="none" stroke="${pSkin}" stroke-width="${F(aw)}" stroke-linecap="round" stroke-linejoin="round" d="M${P(aS)}L${P(aE)}L${P(aH)}"/>`
      + `<path fill="none" stroke="${pSkin}" stroke-width="${F(aw * 1.1)}" stroke-linecap="round" d="M${P(aH)}l${F(au[0] * Y(0.018))} ${F(au[1] * Y(0.018))}"/>`   // the hand
      + `<path fill="none" stroke="${pGown}" stroke-width="${F(aw * 1.25)}" stroke-linecap="round" d="M${P(aS)}L${P(mid(aS, aE, 0.35))}"/></g>`;
    // (the side rail at the bed's head end, a third of its length, as a hospital bed's head rails are: half its
    // length, at 1920 its end post had stood on the patient's feet; pass 4 review)
    s += `<path class="isl-hframe" d="${rect(hx + Y(0.06), bTop - Y(0.08), (b1 - hx) * 0.32, Y(0.012))}M${F(hx + Y(0.07))} ${F(bTop - Y(0.07))}V${F(bTop)}M${F(hx + (b1 - hx) * 0.32)} ${F(bTop - Y(0.07))}V${F(bTop)}" stroke-width="${F(Math.max(1, Y(0.01)))}"/>`;
    // 3. The drip stand at the bed's head: pole, hooks, the bag with its fluid level, the line.
    const ix = b0 - Y(0.1), iT = Y(0.12);
    s += `<ellipse class="isl-tdrop" cx="${F(ix)}" cy="${F(fl + Y(0.025))}" rx="${F(Y(0.08))}" ry="${F(Y(0.008))}"/>`;
    s += `<path class="isl-hframe" d="M${F(ix)} ${F(fl + Y(0.025))}V${F(iT)}M${F(ix - Y(0.05))} ${F(iT + Y(0.01))}H${F(ix + Y(0.05))}M${F(ix - Y(0.07))} ${F(fl + Y(0.025))}H${F(ix + Y(0.07))}" stroke-width="${F(Math.max(1.2, Y(0.012)))}"/>`;
    // (the bag hangs from the hook on a short hanger; a drip chamber under it, the line leaving from that)
    s += `<path class="isl-hframe" d="M${F(ix + Y(0.05))} ${F(iT + Y(0.01))}V${F(iT + Y(0.034))}" stroke-width="${F(Math.max(0.8, Y(0.007)))}"/>`;
    const bagT = iT + Y(0.03), bagB = iT + Y(0.2);
    s += `<path class="isl-hbag" d="M${F(ix + Y(0.02))} ${F(bagT)}H${F(ix + Y(0.08))}V${F(bagB - Y(0.02))}Q${F(ix + Y(0.05))} ${F(bagB + Y(0.01))} ${F(ix + Y(0.02))} ${F(bagB - Y(0.02))}Z"/>`
      + `<path class="isl-hfluid" d="M${F(ix + Y(0.02))} ${F(bagT + Y(0.07))}H${F(ix + Y(0.08))}V${F(bagB - Y(0.02))}Q${F(ix + Y(0.05))} ${F(bagB + Y(0.01))} ${F(ix + Y(0.02))} ${F(bagB - Y(0.02))}Z"/>`
      + `<path class="isl-hbag" d="${rect(ix + Y(0.043), bagB - Y(0.006), Y(0.014), Y(0.036))}"/>`
      // (the line runs to the cannula on the patient's forearm, art-audit pass 4, 2026-10-01: it had ended on the
      // pillow; the tape over it drawn last, so the line tucks under it)
      + `<path class="isl-hcord" d="M${F(ix + Y(0.05))} ${F(bagB + Y(0.03))}C${F(ix + Y(0.06))} ${F(Y(0.55))} ${F(aC[0] - Y(0.12))} ${F(bTop - Y(0.02))} ${F(aC[0])} ${F(aC[1])}" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/>`
      + `<g class="isl-mroom"><path fill="#eef0ec" d="${rect(aC[0] - Y(0.008), aC[1] - Y(0.007), Y(0.016), Y(0.014))}"/></g>`;
    // 4. The monitor on its wall arm above the bed's head: its screen, a heartbeat trace in the page's hue,
    //    two readings as bars.
    const mx0 = b0 + Y(0.1), mT = Y(0.12), mw = Y(0.36), mh = Y(0.24);
    s += `<path class="isl-hframe" d="M${F(mx0 - Y(0.05))} ${F(mT + mh * 0.5)}H${F(mx0)}" stroke-width="${F(Math.max(1.6, Y(0.02)))}"/>`
      + `<path class="isl-lalu" d="${rect(mx0 - Y(0.066), mT + mh * 0.5 - Y(0.035), Y(0.018), Y(0.07))}"/>`   // its wall plate
      + `<path class="isl-tiron" d="${rect(mx0, mT, mw, mh)}"/><path class="isl-hscreen" d="${rect(mx0 + Y(0.015), mT + Y(0.015), mw - Y(0.03), mh - Y(0.03))}"/>`;
    const ey = mT + mh * 0.42, ex0 = mx0 + Y(0.03), ew = mw * 0.62;
    const ecg = `M${F(ex0)} ${F(ey)}h${F(ew * 0.18)}l${F(ew * 0.04)} ${F(-mh * 0.08)}l${F(ew * 0.04)} ${F(mh * 0.08)}h${F(ew * 0.06)}l${F(ew * 0.03)} ${F(mh * 0.06)}l${F(ew * 0.04)} ${F(-mh * 0.3)}l${F(ew * 0.04)} ${F(mh * 0.36)}l${F(ew * 0.03)} ${F(-mh * 0.12)}h${F(ew * 0.12)}l${F(ew * 0.05)} ${F(-mh * 0.06)}l${F(ew * 0.05)} ${F(mh * 0.06)}h${F(ew * 0.28)}`;
    s += `<g class="isl-vwin isl-vlast" style="--i:3"><path class="isl-hecg" d="${ecg}" stroke-width="${F(Math.max(1.2, Y(0.012)))}"/></g>`;
    s += `<path class="isl-hread" d="${rect(mx0 + mw * 0.72, mT + mh * 0.22, mw * 0.16, mh * 0.12)}${rect(mx0 + mw * 0.72, mT + mh * 0.52, mw * 0.12, mh * 0.1)}"/>`
      + `<path class="isl-hread2" d="M${F(ex0)} ${F(mT + mh * 0.75)}h${F(ew * 0.8)}" stroke-width="${F(Math.max(0.8, Y(0.008)))}" stroke-dasharray="${F(Y(0.02))} ${F(Y(0.012))}"/>`;
    // 5. The reading lamp over the bed, lit from Dawn to Night; the chair by the window.
    const lx = b0 + (b1 - b0) * 0.62, ly = Y(0.2);
    s += `<g class="isl-vlamps isl-vwin" style="--i:1">${halo(lx, ly + Y(0.03), Y(0.2), 'islvbulb')}<path d="${polyD([[lx - Y(0.05), ly + Y(0.04)], [lx + Y(0.05), ly + Y(0.04)], [lx + Y(0.18), bTop - Y(0.04)], [lx - Y(0.18), bTop - Y(0.04)]])}" fill="url(#islvspill)"/>${pool(lx, bTop - Y(0.01), Y(0.19), Y(0.04), 0.45)}</g>`
      + `<path class="isl-lbronze" d="${rect(lx - Y(0.07), ly - Y(0.015), Y(0.14), Y(0.03))}"/><path class="isl-cshade" d="M${F(lx - Y(0.06))} ${F(ly + Y(0.015))}H${F(lx + Y(0.06))}V${F(ly + Y(0.04))}H${F(lx - Y(0.06))}Z"/>`
      // (its open underside, seen from below: dark by Day, lit from Dawn to Night where the cone begins)
      + `<ellipse class="isl-cshade" cx="${F(lx)}" cy="${F(ly + Y(0.04))}" rx="${F(Y(0.058))}" ry="${F(Y(0.01))}"/><ellipse class="isl-tdrop" cx="${F(lx)}" cy="${F(ly + Y(0.04))}" rx="${F(Y(0.058))}" ry="${F(Y(0.01))}"/>`
      + `<g class="isl-vlamps isl-vwin" style="--i:1"><ellipse class="isl-tbulb" cx="${F(lx)}" cy="${F(ly + Y(0.04))}" rx="${F(Y(0.058))}" ry="${F(Y(0.01))}"/></g>`;
    const chx = f.wx0 - Y(0.12);
    s += `<ellipse class="isl-tdrop" cx="${F(chx)}" cy="${F(fl + Y(0.012))}" rx="${F(Y(0.09))}" ry="${F(Y(0.008))}"/>`;
    s += `<path class="isl-lchair" d="M${F(chx - Y(0.08))} ${F(Y(0.72))}H${F(chx + Y(0.08))}V${F(Y(0.76))}H${F(chx - Y(0.08))}ZM${F(chx + Y(0.05))} ${F(Y(0.72))}V${F(Y(0.52))}H${F(chx + Y(0.08))}V${F(Y(0.72))}Z"/>`
      + `<path class="isl-lchairleg" d="M${F(chx - Y(0.07))} ${F(Y(0.76))}V${F(fl + Y(0.012))}M${F(chx + Y(0.07))} ${F(Y(0.76))}V${F(fl + Y(0.012))}" stroke-width="${F(Math.max(1, Y(0.01)))}"/>`;
    // 6. The visitor (art-audit pass 4, 2026-10-01, hospital-room-V1). Who is in the chair answers the hour
    //    (by version), for evening visiting hours: at Sunset a visitor sits with the patient, facing the bed,
    //    the low Sun through the window warming their back; by Day they have stepped out and left their
    //    cardigan over the chair's back; at Dawn, Dusk and Night visiting is over and the chair is empty.
    //    Dimmed with the room's light (isl-mroom); the Sun's warm rim is light, so it is not.
    {
      const at = (dx, dy) => [chx + Y(dx), Y(0.72) + Y(dy)];   // from the seat's top above the chair's middle
      const vSkin = '#6b4630', vHair = '#1d1916', vCard = '#7f5a76', fk = (fl + Y(0.012)) / H - 0.72;   // (fk: the floor where the chair stands)
      // (where the card is narrower the chair stands nearer the bed's foot, and the feet are tucked back under
      // the seat, clear of the bed's wheel)
      const ax = Math.max(-0.118, (b1 - chx) / H + 0.03);
      let v = `<path fill="#2f3a4a" d="${polyD([[0.048, 0.002], [0.048, -0.05], [0.02, -0.062], [-0.105, -0.055], [-0.122, -0.035], [ax, fk - 0.015], [ax + 0.03, fk - 0.015], [-0.09, 0.002]].map(([a, b]) => at(a, b)))}"/>`   // trousers: the thigh on the seat, the shin to the floor
        + `<path fill="#3a2e24" d="${polyD([at(ax - 0.019, fk - 0.017), at(ax + 0.041, fk - 0.017), at(ax + 0.041, fk), at(ax - 0.019, fk)])}"/>`;   // the shoe
      v += `<path fill="${vCard}" d="M${P(at(0.048, -0.04))}L${P(at(0.05, -0.2))}Q${P(at(0.046, -0.232))} ${P(at(0.008, -0.232))}Q${P(at(-0.028, -0.23))} ${P(at(-0.032, -0.195))}L${P(at(-0.036, -0.06))}Q${P(at(-0.03, -0.045))} ${P(at(-0.01, -0.045))}Z"/>`   // the torso, in the cardigan
        + `<path fill="#e8e2d4" d="${polyD([at(-0.028, -0.212), at(-0.012, -0.226), at(-0.02, -0.12), at(-0.033, -0.12)])}"/>`;   // the shirt at its open front
      // (the head in profile facing the bed, as the patient's is drawn, mirrored: no features)
      const vr = Y(0.042), vc = at(0.004, -0.29), vf = [-0.995, 0.1], vu = [-0.1, -0.995];
      const vp = (a, b) => [vc[0] + (vf[0] * a + vu[0] * b) * vr, vc[1] + (vf[1] * a + vu[1] * b) * vr];
      v += `<path fill="${vSkin}" d="${rect(chx - Y(0.009), Y(0.72) - Y(0.262), Y(0.022), Y(0.04))}"/>`   // the neck
        + `<path fill="${vSkin}" d="${crZ([[-0.2, 1], [0.55, 0.85], [0.95, 0.3], [1, -0.2], [0.72, -0.95], [0.2, -0.97], [-0.2, -0.75], [-0.75, -0.55], [-1, 0.1], [-0.75, 0.75]].map(([a, b]) => vp(a, b)))}"/>`
        + `<path fill="${vHair}" d="${crZ([[0.5, 0.9], [-0.2, 1.08], [-0.83, 0.8], [-1.08, 0.1], [-0.8, -0.6], [-0.35, -0.35], [-0.1, 0.15], [0.28, 0.52]].map(([a, b]) => vp(a, b)))}"/>`;
      // (the near arm down the side and the forearm forward, the hands together in the lap)
      v += `<path fill="none" stroke="${vCard}" stroke-width="${F(Y(0.028))}" stroke-linecap="round" stroke-linejoin="round" d="M${P(at(0.02, -0.205))}L${P(at(0.012, -0.095))}L${P(at(-0.05, -0.075))}"/>`
        + `<path fill="none" stroke="${vSkin}" stroke-width="${F(Y(0.026))}" stroke-linecap="round" d="M${P(at(-0.055, -0.074))}L${P(at(-0.075, -0.07))}"/>`;
      const rim = `<path class="isl-mlit" d="M${P(at(0.051, -0.05))}L${P(at(0.052, -0.198))}M${P(vp(-0.55, 0.88))}Q${P(vp(-1.12, 0.45))} ${P(vp(-0.95, -0.4))}" stroke-width="${F(Math.max(0.8, Y(0.007)))}"/>`;
      // (the cardigan by Day, folded over the top of the chair's back, a sleeve hanging on each side, its folds
      // in shadow)
      const card = `<path fill="${vCard}" d="M${P(at(0.032, -0.085))}L${P(at(0.037, -0.19))}Q${P(at(0.064, -0.232))} ${P(at(0.093, -0.19))}L${P(at(0.1, -0.1))}Q${P(at(0.09, -0.092))} ${P(at(0.08, -0.1))}L${P(at(0.05, -0.094))}Q${P(at(0.042, -0.08))} ${P(at(0.032, -0.085))}Z"/>`
        + `<path fill="none" stroke="${vCard}" stroke-width="${F(Y(0.018))}" stroke-linecap="round" d="M${P(at(0.04, -0.17))}L${P(at(0.03, -0.035))}M${P(at(0.092, -0.165))}L${P(at(0.104, -0.05))}"/>`
        + `<path class="isl-hfold" d="M${P(at(0.042, -0.192))}Q${P(at(0.064, -0.218))} ${P(at(0.088, -0.192))}M${P(at(0.041, -0.15))}L${P(at(0.034, -0.04))}M${P(at(0.091, -0.15))}L${P(at(0.1, -0.055))}" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/>`;
      s += `<g class="isl-lq" data-q="s"><g class="isl-mroom">${v}</g>${rim}</g><g class="isl-lq" data-q="y"><g class="isl-mroom">${card}</g></g>`;
    }
    return `<g style="--isl-vstep:.5s">${s}</g>`;
  }

  /* THE LECTURE THEATRE (the Medical Education page's head; owner, 2026-09-29: art tied to the title at a
     glance): a lecture theatre seen from the back rows. The screen shows a heart in the page's hue, its
     chambers and great vessels, and the notes beside it; the lectern with its reading lamp and a laptop;
     an articulated skeleton on its stand beside it; high windows along the front wall carry the sky; the
     rows of seats step down toward the front. The projector's light and the screen are always on; the
     lectern's lamp is lit from Dawn to Night. The windows' lights, then the lamp, then the heart. */
  function lectureHall(W, H, v) {
    const y0 = v.y0, X = (k) => k * W, Y = (k) => k * H, r = rng(1013);
    // the high windows: three, along the top of the front wall; the view is sky and a far line of hills
    // (spaced evenly from X(0.12) to a margin short of the screen: at fixed places the third ran under it)
    const ww = Y(0.36), wT = Y(0.08), wB = Y(0.3), wL = X(0.12), wR = X(0.62) - Y(0.07) - ww, wins = [wL, (wL + wR) / 2, wR];
    let s = '';
    const hill = [];
    for (let x = -4, i = 0; x < W + 8; x += Y(0.12), i++) hill.push([x, y0 - Y(0.01 + (Math.sin(i * 0.9) + 1) * 0.012)]);
    s += `<path class="f-isl" d="${polyD([[-4, y0 + 1], ...hill, [W + 8, y0 + 1]])}"/>`;
    let wallD = rect(-2, -2, W + 4, H + 4);
    for (const x of wins) wallD += rect(x, wT, ww, wB - wT);
    s += `<defs><linearGradient id="isllwallg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-lwall0"/><stop offset="1" class="st-lwall1"/></linearGradient></defs><path fill="url(#isllwallg2)" fill-rule="evenodd" d="${wallD}"/>`;
    let fr = '', mul = '';
    for (const x of wins) { fr += rect(x, wT, ww, wB - wT); mul += `M${F(x + ww / 3)} ${F(wT)}V${F(wB)}M${F(x + (2 * ww) / 3)} ${F(wT)}V${F(wB)}`; }
    // (the wall's thickness: each head's soffit, seen from below, under the frame; a sill and its shadow)
    let sills = '', sillSh = '', heads = '';
    for (const x of wins) {
      sills += rect(x - Y(0.015), wB, ww + Y(0.03), Math.max(2, Y(0.018)));
      sillSh += rect(x - Y(0.015), wB + Math.max(2, Y(0.018)), ww + Y(0.03), Math.max(1.2, Y(0.01)));
      heads += rect(x, wT, ww, Math.max(1.5, Y(0.015)));
    }
    s += `<path class="isl-lsidew" d="${heads}"/>`;
    s += `<path class="isl-lframe" d="${fr}" stroke-width="${F(Math.max(1.4, Y(0.014)))}"/><path class="isl-lframe" d="${mul}" stroke-width="${F(Math.max(0.8, Y(0.008)))}"/>`;
    s += `<path class="isl-tdrop" d="${sillSh}"/><path class="isl-lsill" d="${sills}"/>`;
    // The chalkboard under the first two windows (the left of the wall had been bare): a slate in an
    // aluminium frame, a wordless sketch of the circulation (the heart, the lungs' small loop and the body's
    // large one, arrows), a half-wiped smudge, and in its tray two sticks of chalk and a duster. And a wall
    // clock between those windows keeping Antigua's time, as the campus tower's does (clockAngles(),
    // turned each minute by tickClocks()). (art-audit wave 1, 2026-10-01)
    {
      const b0 = wins[0] + ww * 0.1, b1 = wins[1] + ww * 0.6, bT = Y(0.37), bB = Y(0.6), bw = b1 - b0, bh = bB - bT;
      const fx = (k) => b0 + bw * k, fy = (k) => bT + bh * k, cw = Math.max(0.9, Y(0.007));
      // What is on the board answers the hour's lecture (the owner, 2026-10-01: a different subject for each
      // professor; the writing stylised so it reads as notes without words): Dawn's histology, a cell and its
      // nucleus; Day's circulation; Sunset's radiology, the lungs and a checklist; Dusk's neuroanatomy, a
      // neuron and its myelinated axon, left on the board through the Night.
      const rs = rng(1301);
      const scrib = (x0, y0, w) => {   // a line of chalk handwriting: loops of varied height, gaps between words
        let d = `M${F(x0)} ${F(y0)}`, x = x0;
        while (x < x0 + w) {
          const dx = Y(0.007) + rs() * Y(0.007), h = (rs() < 0.25 ? 1.9 : 1) * Y(0.007);
          d += `q${F(dx / 2)} ${F(-h)} ${F(dx)} 0`; x += dx;
          if (rs() < 0.16) { d += `m${F(Y(0.009))} 0`; x += Y(0.009); }
        }
        return d;
      };
      let circ = `M${F(fx(0.47))} ${F(fy(0.42))}h${F(bw * 0.06)}v${F(bh * 0.2)}h${F(-bw * 0.06)}Z`   // the heart, a box
        + `M${F(fx(0.47))} ${F(fy(0.47))}C${F(fx(0.36))} ${F(fy(0.47))} ${F(fx(0.22))} ${F(fy(0.4))} ${F(fx(0.22))} ${F(fy(0.52))}C${F(fx(0.22))} ${F(fy(0.64))} ${F(fx(0.36))} ${F(fy(0.58))} ${F(fx(0.47))} ${F(fy(0.58))}`   // the lungs' loop
        + `M${F(fx(0.53))} ${F(fy(0.47))}C${F(fx(0.7))} ${F(fy(0.4))} ${F(fx(0.86))} ${F(fy(0.3))} ${F(fx(0.86))} ${F(fy(0.52))}C${F(fx(0.86))} ${F(fy(0.76))} ${F(fx(0.7))} ${F(fy(0.66))} ${F(fx(0.53))} ${F(fy(0.58))}`   // the body's loop
        + `M${F(fx(0.27))} ${F(fy(0.4))}l${F(bw * 0.03)} ${F(bh * 0.03)}l${F(-bw * 0.03)} ${F(bh * 0.04)}M${F(fx(0.8))} ${F(fy(0.65))}l${F(-bw * 0.03)} ${F(bh * 0.03)}l${F(bw * 0.03)} ${F(bh * 0.04)}`   // arrows
        + `M${F(fx(0.12))} ${F(fy(0.8))}h${F(bw * 0.2)}M${F(fx(0.12))} ${F(fy(0.88))}h${F(bw * 0.13)}`   // a note, as lines
      circ += scrib(fx(0.12), fy(0.8), bw * 0.24) + scrib(fx(0.12), fy(0.9), bw * 0.16);
      const cellR = bw * 0.11;
      const cell = `M${F(fx(0.27) - cellR)} ${F(fy(0.5))}a${F(cellR)} ${F(cellR * 0.85)} 0 1 0 ${F(2 * cellR)} 0a${F(cellR)} ${F(cellR * 0.85)} 0 1 0 ${F(-2 * cellR)} 0Z`
        + `M${F(fx(0.27) - cellR * 0.36)} ${F(fy(0.5))}a${F(cellR * 0.36)} ${F(cellR * 0.32)} 0 1 0 ${F(cellR * 0.72)} 0a${F(cellR * 0.36)} ${F(cellR * 0.32)} 0 1 0 ${F(-cellR * 0.72)} 0Z`
        + `M${F(fx(0.21))} ${F(fy(0.62))}h0M${F(fx(0.34))} ${F(fy(0.4))}h0M${F(fx(0.33))} ${F(fy(0.6))}h0M${F(fx(0.2))} ${F(fy(0.42))}h0`
        + `M${F(fx(0.38))} ${F(fy(0.45))}L${F(fx(0.5))} ${F(fy(0.32))}` + scrib(fx(0.52), fy(0.33), bw * 0.3) + scrib(fx(0.52), fy(0.47), bw * 0.36) + scrib(fx(0.52), fy(0.61), bw * 0.26)
        + scrib(fx(0.1), fy(0.16), bw * 0.34);
      const lungs = `M${F(fx(0.25))} ${F(fy(0.22))}C${F(fx(0.12))} ${F(fy(0.3))} ${F(fx(0.1))} ${F(fy(0.7))} ${F(fx(0.18))} ${F(fy(0.78))}C${F(fx(0.24))} ${F(fy(0.8))} ${F(fx(0.27))} ${F(fy(0.6))} ${F(fx(0.27))} ${F(fy(0.24))}Z`
        + `M${F(fx(0.33))} ${F(fy(0.22))}C${F(fx(0.46))} ${F(fy(0.3))} ${F(fx(0.48))} ${F(fy(0.7))} ${F(fx(0.4))} ${F(fy(0.78))}C${F(fx(0.34))} ${F(fy(0.8))} ${F(fx(0.31))} ${F(fy(0.6))} ${F(fx(0.31))} ${F(fy(0.24))}Z`
        + `M${F(fx(0.29))} ${F(fy(0.08))}V${F(fy(0.3))}M${F(fx(0.29))} ${F(fy(0.3))}L${F(fx(0.25))} ${F(fy(0.4))}M${F(fx(0.29))} ${F(fy(0.3))}L${F(fx(0.33))} ${F(fy(0.4))}`
        + [0.22, 0.38, 0.54, 0.7].map((k2) => `M${F(fx(0.56))} ${F(fy(k2))}l${F(bw * 0.012)} ${F(bh * 0.04)}l${F(bw * 0.024)} ${F(-bh * 0.08)}` + scrib(fx(0.62), fy(k2), bw * (0.18 + rs() * 0.14))).join('');
      const neuron = `M${F(fx(0.22) - bw * 0.05)} ${F(fy(0.52))}a${F(bw * 0.05)} ${F(bw * 0.045)} 0 1 0 ${F(bw * 0.1)} 0a${F(bw * 0.05)} ${F(bw * 0.045)} 0 1 0 ${F(-bw * 0.1)} 0Z`
        + `M${F(fx(0.17))} ${F(fy(0.47))}L${F(fx(0.1))} ${F(fy(0.32))}M${F(fx(0.13))} ${F(fy(0.39))}L${F(fx(0.07))} ${F(fy(0.4))}M${F(fx(0.18))} ${F(fy(0.58))}L${F(fx(0.09))} ${F(fy(0.72))}M${F(fx(0.22))} ${F(fy(0.45))}L${F(fx(0.24))} ${F(fy(0.27))}M${F(fx(0.24))} ${F(fy(0.33))}L${F(fx(0.29))} ${F(fy(0.25))}`
        + `M${F(fx(0.27))} ${F(fy(0.52))}H${F(fx(0.78))}` + [0.33, 0.43, 0.53, 0.63].map((k2) => `M${F(fx(k2))} ${F(fy(0.48))}h${F(bw * 0.07)}v${F(bh * 0.08)}h${F(-bw * 0.07)}Z`).join('')
        + `M${F(fx(0.78))} ${F(fy(0.52))}L${F(fx(0.86))} ${F(fy(0.4))}M${F(fx(0.78))} ${F(fy(0.52))}L${F(fx(0.87))} ${F(fy(0.52))}M${F(fx(0.78))} ${F(fy(0.52))}L${F(fx(0.86))} ${F(fy(0.64))}`
        + scrib(fx(0.1), fy(0.14), bw * 0.4) + scrib(fx(0.12), fy(0.84), bw * 0.3);
      const board = (d) => `<path class="isl-mchalk" d="${d}" stroke-width="${F(cw)}"/>`;
      s += `<g class="isl-mroom"><path class="isl-lalu" d="${rect(b0 - Y(0.008), bT - Y(0.008), bw + Y(0.016), bh + Y(0.016))}"/><path class="isl-mboard" d="${rect(b0, bT, bw, bh)}"/>`
        + `<ellipse class="isl-mchalk" cx="${F(fx(0.18))}" cy="${F(fy(0.22))}" rx="${F(bw * 0.12)}" ry="${F(bh * 0.1)}" style="stroke:none;fill-opacity:.1"/>`   // a half-wiped smudge (inline style: the class's stroke had drawn it as a hard oval)
        + `<g class="isl-lq" data-q="a">${board(cell)}</g><g class="isl-lq" data-q="y">${board(circ)}</g><g class="isl-lq" data-q="s">${board(lungs)}</g><g class="isl-lq" data-q="dn">${board(neuron)}</g>`
        + `<path class="isl-lalu" d="${rect(b0, bB + Y(0.006), bw, Math.max(1.5, Y(0.012)))}"/>`   // the tray
        + `<path class="isl-mchalkf" d="${rect(fx(0.3), bB + Y(0.002), bw * 0.05, Math.max(1, Y(0.006)))}${rect(fx(0.38), bB + Y(0.002), bw * 0.035, Math.max(1, Y(0.006)))}"/>`
        + `<path class="isl-lwood2" d="${rect(fx(0.7), bB - Y(0.004), bw * 0.08, Math.max(1.5, Y(0.012)))}"/><path class="isl-mchalkf" d="${rect(fx(0.7), bB + Y(0.004), bw * 0.08, Math.max(0.8, Y(0.004)))}"/></g>`;
      const ccx = (wins[0] + ww + wins[1]) / 2, ccy = Y(0.17), cr = Y(0.045), [ha, ma] = clockAngles();
      const hand = (cls, deg, len, w) => `<path class="isl-vhand ${cls}" data-c="${F(ccx)} ${F(ccy)}" d="M${F(ccx)} ${F(ccy + 0.16 * cr)}V${F(ccy - len)}" transform="rotate(${F(deg)} ${F(ccx)} ${F(ccy)})" stroke-width="${F(w)}"/>`;
      let marks = '';
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, r0 = cr * (i % 3 ? 0.84 : 0.74); marks += `M${F(ccx + Math.sin(a) * r0)} ${F(ccy - Math.cos(a) * r0)}L${F(ccx + Math.sin(a) * cr * 0.92)} ${F(ccy - Math.cos(a) * cr * 0.92)}`; }
      s += `<ellipse class="isl-tdrop" cx="${F(ccx + Y(0.004))}" cy="${F(ccy + Y(0.006))}" rx="${F(cr * 1.12)}" ry="${F(cr * 1.12)}"/>`   // its shadow on the wall
        + `<circle class="isl-tiron" cx="${F(ccx)}" cy="${F(ccy)}" r="${F(cr * 1.12)}"/><circle class="isl-mclockf" cx="${F(ccx)}" cy="${F(ccy)}" r="${F(cr)}"/>`
        + `<path class="isl-vmark" d="${marks}" stroke-width="${F(Math.max(0.6, cr * 0.06))}"/>`
        + hand('isl-vhand-h', ha, cr * 0.5, Math.max(1.1, cr * 0.13)) + hand('isl-vhand-m', ma, cr * 0.78, Math.max(0.9, cr * 0.08))
        + `<circle class="isl-vpin" cx="${F(ccx)}" cy="${F(ccy)}" r="${F(Math.max(0.7, cr * 0.09))}"/>`;
    }
    // The exit door near the left end of the front wall: a steel door in its frame, a narrow vision panel and
    // a push bar, and over it the lit green sign with its running figure (no words), which stays lit at every
    // hour as an exit sign does, its glow on the door head from Dawn to Night (art-audit wave 1; the owner,
    // 2026-10-01: exit signs are green).
    {
      const e0 = X(0.02), e1 = X(0.08), eT = Y(0.27), eB = Y(0.84), ew = e1 - e0;
      const g0 = e0 + ew * 0.16, gT = eT - Y(0.075), gw = ew * 0.68, gh = Y(0.05);
      s += `<g class="isl-mroom"><path class="isl-lalu" d="${rect(e0 - Y(0.01), eT - Y(0.01), ew + Y(0.02), eB - eT + Y(0.01))}"/>`
        + `<path fill="#66707a" d="${rect(e0, eT, ew, eB - eT)}"/><path fill="#8fa2b3" d="${rect(e0 + ew * 0.62, eT + Y(0.06), ew * 0.16, Y(0.16))}"/>`
        + `<path class="isl-lalu" d="${rect(e0 + ew * 0.1, eT + Y(0.3), ew * 0.8, Math.max(1.5, Y(0.014)))}"/></g>`;
      const exitGlow = `<ellipse cx="${F(g0 + gw / 2)}" cy="${F(gT + gh / 2)}" rx="${F(gw * 1.3)}" ry="${F(gh * 2.2)}" fill="url(#isllexitg)"/>`;
      s += `<defs><radialGradient id="isllexitg"><stop offset="0" stop-color="#3ad07c" stop-opacity=".45"/><stop offset="1" stop-color="#3ad07c" stop-opacity="0"/></radialGradient></defs>`
        + `<g class="isl-lq" data-q="aysd"><g class="isl-vlamps">${exitGlow}</g></g>`
        // (at Night, with the projector off, the glow is the last light in the pass: the pass ends on an
        // isl-vlast's animationend, and without one the card stayed running and replayed on every redraw)
        + `<g class="isl-lq" data-q="n"><g class="isl-vlamps isl-vlast">${exitGlow}</g></g>`;
      const fx = (k) => g0 + gw * k, fy = (k) => gT + gh * k, sw = Math.max(0.8, gh * 0.09);
      s += `<path fill="#178a4a" d="${rect(g0, gT, gw, gh)}"/>`
        + `<path stroke="#f1fff6" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="${F(sw)}" d="`
        + `M${F(fx(0.3))} ${F(fy(0.32))}L${F(fx(0.27))} ${F(fy(0.6))}L${F(fx(0.18))} ${F(fy(0.82))}M${F(fx(0.27))} ${F(fy(0.6))}L${F(fx(0.38))} ${F(fy(0.82))}`   // body, legs
        + `M${F(fx(0.18))} ${F(fy(0.42))}L${F(fx(0.29))} ${F(fy(0.38))}L${F(fx(0.4))} ${F(fy(0.48))}`   // arms
        + `M${F(fx(0.52))} ${F(fy(0.2))}V${F(fy(0.82))}H${F(fx(0.68))}V${F(fy(0.2))}Z`   // the doorway
        + `M${F(fx(0.74))} ${F(fy(0.5))}H${F(fx(0.92))}M${F(fx(0.86))} ${F(fy(0.38))}L${F(fx(0.92))} ${F(fy(0.5))}L${F(fx(0.86))} ${F(fy(0.62))}"/>`   // the arrow
        + `<circle fill="#f1fff6" cx="${F(fx(0.33))}" cy="${F(fy(0.2))}" r="${F(gh * 0.1)}"/>`;
    }
    // 1. The screen at the right of the front wall, lit from Dawn to Dusk with the hour's slide and its notes,
    //    the projector's beam; at Night the hall is closed and the projector off, the screen blank and dark.
    const sx0 = X(0.62), sx1 = X(0.97), sT = Y(0.08), sB = Y(0.6), scx = sx0 + (sx1 - sx0) * 0.34, scy = (sT + sB) / 2;
    // (from a projector hung from the ceiling: the beam had come from nowhere at the top edge)
    const pjx = X(0.8), pjy = Y(0.035);
    // (the beam is the projector's own cool white, faint, seen in the dark hall's air; not by Day, and none at
    // Night, the projector off)
    s += `<defs><linearGradient id="isllbeam" gradientUnits="userSpaceOnUse" x1="${F(pjx)}" y1="${F(pjy)}" x2="${F(pjx)}" y2="${F(sB)}"><stop offset="0" class="st-vcool" stop-opacity=".2"/><stop offset="1" class="st-vcool" stop-opacity=".04"/></linearGradient></defs>`
      + `<g class="isl-lq" data-q="aysd"><path class="isl-mbeam" d="${polyD([[pjx - Y(0.015), pjy], [pjx + Y(0.015), pjy], [sx1, sT], [sx1, sB], [sx0, sB], [sx0, sT]])}" fill="url(#isllbeam)"/></g>`;
    s += `<path class="isl-tiron" d="${rect(pjx - 1, -2, 2, Y(0.014) + 2)}${rect(pjx - Y(0.055), Y(0.012), Y(0.11), Y(0.028))}"/>`;
    s += `<path class="isl-tiron" d="${rect(sx0 - Y(0.012), sT - Y(0.012), sx1 - sx0 + Y(0.024), sB - sT + Y(0.024))}"/><path class="isl-mscreen" d="${rect(sx0, sT, sx1 - sx0, sB - sT)}"/>`
      + `<defs><radialGradient id="isllscrv" cx=".5" cy=".45" r=".75"><stop offset=".35" stop-color="#0b1a2b" stop-opacity="0"/><stop offset="1" stop-color="#0b1a2b" stop-opacity=".24"/></radialGradient></defs>`
      + `<g class="isl-lq" data-q="aysd"><path class="isl-mscrv" d="${rect(sx0, sT, sx1 - sx0, sB - sT)}" fill="url(#isllscrv)"/></g>`;   // its falloff (first audit; none at Night, the screen off)
    // The heart as an anatomy slide shows it, from the front (first audit, 2026-10-01: it had read as a
    // Valentine tied with string): the right atrium bulging at the viewer's left, the apex down and to the
    // right, the superior vena cava coming down into the atrium, the aorta rising and arching to the right
    // with its three branches, the pulmonary trunk in front of it running up to the right, and the groove
    // between the ventricles running down to the apex; leader lines to the notes. (k: the heart's unit)
    const k = Math.min((sB - sT) * 0.36, (sx1 - sx0) * 0.2), hcy = scy + k * 0.27;
    const P = (x, y) => `${F(scx + x * k)} ${F(hcy + y * k)}`;
    const heart = `M${P(-0.52, -0.42)}C${P(-0.85, -0.3)} ${P(-0.9, 0.15)} ${P(-0.62, 0.38)}C${P(-0.3, 0.62)} ${P(0.25, 0.86)} ${P(0.55, 0.92)}`
      + `C${P(0.82, 0.7)} ${P(0.95, 0.2)} ${P(0.82, -0.12)}C${P(0.72, -0.38)} ${P(0.5, -0.48)} ${P(0.3, -0.44)}C${P(0.05, -0.5)} ${P(-0.3, -0.5)} ${P(-0.52, -0.42)}Z`;
    const vessels = `M${P(-0.62, -0.4)}V${F(hcy - 0.98 * k)}M${P(-0.42, -0.44)}V${F(hcy - 0.98 * k)}`   // the superior vena cava
      + `M${P(-0.28, -0.46)}V${F(hcy - 0.92 * k)}C${P(-0.28, -1.34)} ${P(0.52, -1.34)} ${P(0.52, -0.86)}`   // the aorta: ascending, the arch
      + `M${P(-0.05, -0.46)}V${F(hcy - 0.86 * k)}C${P(-0.05, -1.04)} ${P(0.3, -1.04)} ${P(0.3, -0.82)}`
      + `M${P(-0.08, -1.13)}V${F(hcy - 1.42 * k)}M${P(0.1, -1.18)}V${F(hcy - 1.46 * k)}M${P(0.28, -1.14)}L${P(0.34, -1.4)}`   // its three branches
      + `M${P(0.02, -0.44)}C${P(0.04, -0.7)} ${P(0.16, -0.82)} ${P(0.32, -0.86)}L${P(0.72, -0.88)}`   // the pulmonary trunk, in front
      + `M${P(0.26, -0.44)}C${P(0.31, -0.6)} ${P(0.43, -0.7)} ${P(0.58, -0.72)}L${P(0.72, -0.74)}`
      + `M${P(0.42, -0.42)}Q${P(0.6, -0.5)} ${P(0.68, -0.36)}`;   // the left auricle
    const septum = `M${P(0.22, -0.4)}C${P(0.3, 0)} ${P(0.38, 0.45)} ${P(0.52, 0.86)}`   // the groove between the ventricles
      + `M${P(-0.5, -0.3)}C${P(-0.3, -0.16)} ${P(-0.02, -0.2)} ${P(0.18, -0.38)}`;   // and between atrium and ventricle
    // The slide answers the hour's lecture too (the owner, 2026-10-01: "relevant medical school topics depending
    // on the professor"): Dawn's histology, a stained section in a round microscope field (pink tissue, purple
    // nuclei, a gland's lumen ringed by its cells); by Day the heart; Sunset's radiology, a chest X-ray (dark
    // lungs, pale ribs, spine, clavicles, the heart's shadow and the diaphragm); Dusk's neuroanatomy, the brain
    // from the side (its lobes' sulci, the cerebellum, the brainstem). At Night the hall is closed and the
    // projector off. Each lights last in the pass.
    const slide = (q, inner) => `<g class="isl-lq" data-q="${q}"><g class="isl-vwin isl-vlast" style="--i:3">${inner}</g></g>`;
    let notes = '';
    const nx = sx0 + (sx1 - sx0) * 0.66, ny = (i) => sT + (sB - sT) * (0.28 + i * 0.14);
    for (let i = 0; i < 4; i++) notes += `M${F(nx)} ${F(ny(i))}h${F((sx1 - sx0) * (0.26 - (i % 2) * 0.08))}`;
    // (the heart's two leader lines, from the aorta's arch and the left ventricle to the first two notes)
    const leaders = `M${P(0.52, -1.05)}L${F(nx - Y(0.012))} ${F(ny(0))}M${P(0.9, 0.2)}L${F(nx - Y(0.012))} ${F(ny(1))}`;
    s += slide('y', `<path class="isl-mheart" d="${heart}" stroke-width="${F(Math.max(1.4, Y(0.014)))}"/><path class="isl-mheart2" d="${vessels}${septum}" stroke-width="${F(Math.max(1, Y(0.009)))}"/>`
      + `<path class="isl-mnote" d="${leaders}" stroke-width="${F(Math.max(1, Y(0.012)))}"/>`);
    {
      const rh = rng(1303), R = k * 1.05, cyM = scy;
      let nuc = '';
      for (let i = 0; i < 46; i++) {
        const a2 = rh() * Math.PI * 2, rr = Math.sqrt(rh()) * R * 0.92, x = scx + Math.cos(a2) * rr, y = cyM + Math.sin(a2) * rr;
        if (Math.hypot(x - (scx - R * 0.15), y - cyM) < R * 0.34) continue;   // (clear of the gland's lumen)
        nuc += `<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(R * 0.045)}" ry="${F(R * 0.032)}" transform="rotate(${F(rh() * 180)} ${F(x)} ${F(y)})"/>`;
      }
      for (let i = 0; i < 16; i++) {   // the gland's own cells ringing its lumen
        const a2 = (i / 16) * Math.PI * 2, x = scx - R * 0.15 + Math.cos(a2) * R * 0.3, y = cyM + Math.sin(a2) * R * 0.26;
        nuc += `<ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(R * 0.04)}" ry="${F(R * 0.028)}" transform="rotate(${F(a2 * 180 / Math.PI)} ${F(x)} ${F(y)})"/>`;
      }
      s += slide('a', `<circle cx="${F(scx)}" cy="${F(cyM)}" r="${F(R)}" fill="#e7a6bd"/>`
        + `<ellipse cx="${F(scx + R * 0.35)}" cy="${F(cyM - R * 0.35)}" rx="${F(R * 0.35)}" ry="${F(R * 0.22)}" fill="#f3cbd8"/><ellipse cx="${F(scx + R * 0.2)}" cy="${F(cyM + R * 0.5)}" rx="${F(R * 0.4)}" ry="${F(R * 0.18)}" fill="#f3cbd8"/>`
        + `<ellipse cx="${F(scx - R * 0.15)}" cy="${F(cyM)}" rx="${F(R * 0.2)}" ry="${F(R * 0.15)}" fill="#fbeef2"/>`
        + `<g fill="#5b3a8c">${nuc}</g><circle cx="${F(scx)}" cy="${F(cyM)}" r="${F(R)}" fill="none" stroke="#2f2a35" stroke-width="${F(Math.max(1.2, Y(0.01)))}"/>`);
    }
    {
      const xw = k * 1.0, xT = sT + (sB - sT) * 0.07, xB = sB - (sB - sT) * 0.07, xh = xB - xT, X0 = scx - xw;
      const xr = (fxx, fyy) => `${F(scx + fxx * xw)} ${F(xT + fyy * xh)}`;
      let ribs = '';
      for (let i = 0; i < 6; i++) {
        const yy = 0.24 + i * 0.1;
        ribs += `M${xr(-0.06, yy)}C${xr(-0.5, yy - 0.06)} ${xr(-0.86, yy + 0.02)} ${xr(-0.8, yy + 0.12)}M${xr(0.06, yy)}C${xr(0.5, yy - 0.06)} ${xr(0.86, yy + 0.02)} ${xr(0.8, yy + 0.12)}`;
      }
      s += slide('s', `<path fill="#2b3137" d="${rect(X0, xT, 2 * xw, xh)}"/>`
        + `<path fill="#0e1215" d="M${xr(-0.1, 0.18)}C${xr(-0.55, 0.16)} ${xr(-0.8, 0.45)} ${xr(-0.74, 0.82)}C${xr(-0.5, 0.78)} ${xr(-0.25, 0.8)} ${xr(-0.1, 0.84)}ZM${xr(0.1, 0.18)}C${xr(0.55, 0.16)} ${xr(0.8, 0.45)} ${xr(0.74, 0.82)}C${xr(0.5, 0.78)} ${xr(0.25, 0.8)} ${xr(0.1, 0.84)}Z"/>`   // the lungs
        + `<path fill="#9aa2a9" fill-opacity=".85" d="M${xr(-0.08, 0.5)}C${xr(-0.12, 0.66)} ${xr(0.02, 0.86)} ${xr(0.42, 0.82)}C${xr(0.5, 0.66)} ${xr(0.3, 0.5)} ${xr(0.06, 0.48)}Z"/>`   // the heart's shadow (to the patient's left)
        + `<path fill="#8a9299" d="${rect(scx - xw * 0.07, xT + xh * 0.06, xw * 0.14, xh * 0.86)}"/>`   // the spine
        + `<path fill="none" stroke="#c4cad0" stroke-opacity=".75" stroke-width="${F(Math.max(0.8, Y(0.006)))}" d="${ribs}M${xr(-0.08, 0.14)}L${xr(-0.62, 0.11)}M${xr(0.08, 0.14)}L${xr(0.62, 0.11)}"/>`   // ribs, clavicles
        + `<path fill="#b6bdc3" d="M${xr(-0.8, 0.86)}C${xr(-0.5, 0.74)} ${xr(-0.2, 0.8)} ${xr(0, 0.86)}C${xr(0.25, 0.76)} ${xr(0.55, 0.76)} ${xr(0.8, 0.86)}V${xr(0.8, 0.98).split(' ')[1]}H${F(scx - 0.8 * xw)}Z"/>`);   // the diaphragm and abdomen
    }
    {
      const B2 = (x, y) => `${F(scx + x * k)} ${F(scy + y * k)}`;
      const brain = `M${B2(-0.95, 0.1)}C${B2(-1.0, -0.45)} ${B2(-0.55, -0.85)} ${B2(0, -0.85)}C${B2(0.55, -0.85)} ${B2(0.95, -0.5)} ${B2(0.95, -0.05)}C${B2(0.95, 0.25)} ${B2(0.75, 0.35)} ${B2(0.55, 0.32)}`
        + `C${B2(0.35, 0.3)} ${B2(0.2, 0.42)} ${B2(-0.05, 0.38)}C${B2(-0.35, 0.36)} ${B2(-0.55, 0.45)} ${B2(-0.72, 0.34)}C${B2(-0.86, 0.27)} ${B2(-0.92, 0.22)} ${B2(-0.95, 0.1)}Z`;
      const cbl = `M${B2(0.42, 0.36)}C${B2(0.48, 0.64)} ${B2(0.86, 0.62)} ${B2(0.88, 0.38)}C${B2(0.8, 0.3)} ${B2(0.6, 0.3)} ${B2(0.42, 0.36)}Z`;
      const lines = `M${B2(-0.58, 0.1)}C${B2(-0.3, 0)} ${B2(0, -0.06)} ${B2(0.32, -0.12)}`   // the lateral sulcus
        + `M${B2(0.05, -0.85)}C${B2(0, -0.6)} ${B2(0.12, -0.4)} ${B2(0.04, -0.14)}`   // the central sulcus
        + `M${B2(-0.55, -0.55)}C${B2(-0.4, -0.45)} ${B2(-0.5, -0.3)} ${B2(-0.3, -0.2)}M${B2(0.35, -0.6)}C${B2(0.45, -0.4)} ${B2(0.3, -0.25)} ${B2(0.5, -0.12)}M${B2(-0.4, 0.22)}C${B2(-0.2, 0.18)} ${B2(0, 0.24)} ${B2(0.15, 0.2)}`
        + `M${B2(0.55, 0.42)}C${B2(0.65, 0.4)} ${B2(0.75, 0.44)} ${B2(0.82, 0.42)}M${B2(0.5, 0.5)}C${B2(0.62, 0.48)} ${B2(0.72, 0.52)} ${B2(0.8, 0.5)}`   // the cerebellum's folia
        + `M${B2(0.26, 0.38)}C${B2(0.3, 0.6)} ${B2(0.3, 0.8)} ${B2(0.26, 0.98)}M${B2(0.4, 0.4)}C${B2(0.42, 0.6)} ${B2(0.4, 0.8)} ${B2(0.38, 0.98)}`;   // the brainstem
      s += slide('d', `<path class="isl-mheart" d="${brain}${cbl}" stroke-width="${F(Math.max(1.4, Y(0.014)))}"/><path class="isl-mheart2" d="${lines}" stroke-width="${F(Math.max(1, Y(0.009)))}"/>`);
    }
    s += `<g class="isl-lq" data-q="aysd"><path class="isl-mnote" d="${notes}" stroke-width="${F(Math.max(1, Y(0.012)))}"/></g>`;
    // 2. The lectern with its lamp and a laptop; the skeleton on its stand beside it.
    const lx = X(0.44), lT = Y(0.56), lB = Y(0.84);
    // The lecturer behind the lectern, facing the hall in a white coat over a pale shirt, the laptop in front
    // of their chest; the lectern's lamp, at their left, lights that side from Dawn to Dusk. (art-audit wave
    // 1, 2026-10-01: the lamp had had nothing to light)
    {
      // A different professor at each hour, with the hour's lecture (the owner, 2026-10-01): at Dawn the
      // histologist in a green cardigan, by Day the anatomist in a white coat, at Sunset the radiologist, grey
      // and in glasses and a navy jacket, at Dusk the neuroanatomist in burgundy. At Night no one: the hall is
      // closed (the owner, 2026-10-01), the lamp off and the laptop gone home with its professor.
      const px = lx - Y(0.015), hy = Y(0.39), hr = Y(0.031), sh = Y(0.45);
      const prof = ({ coat, shirt, skin, hair, style, glasses = false, lapels = true }) => {
        const body = `M${F(px - Y(0.08))} ${F(lT + 1)}L${F(px - Y(0.078))} ${F(sh + Y(0.02))}Q${F(px - Y(0.074))} ${F(sh)} ${F(px - Y(0.04))} ${F(sh - Y(0.006))}H${F(px + Y(0.04))}Q${F(px + Y(0.074))} ${F(sh)} ${F(px + Y(0.078))} ${F(sh + Y(0.02))}L${F(px + Y(0.08))} ${F(lT + 1)}Z`;
        let o = `<path fill="${coat}" d="${body}"/>`;
        if (lapels) o += `<path fill="${shirt}" d="M${F(px - Y(0.022))} ${F(sh - Y(0.005))}L${F(px)} ${F(sh + Y(0.06))}L${F(px + Y(0.022))} ${F(sh - Y(0.005))}Z"/>`
          + `<path stroke="#000" stroke-opacity=".18" fill="none" stroke-width="${F(Math.max(0.7, Y(0.005)))}" d="M${F(px - Y(0.022))} ${F(sh - Y(0.005))}L${F(px)} ${F(sh + Y(0.06))}L${F(px + Y(0.022))} ${F(sh - Y(0.005))}M${F(px - Y(0.03))} ${F(sh + Y(0.02))}L${F(px - Y(0.012))} ${F(sh + Y(0.07))}M${F(px + Y(0.03))} ${F(sh + Y(0.02))}L${F(px + Y(0.012))} ${F(sh + Y(0.07))}"/>`;
        else o += `<path fill="${shirt}" d="M${F(px - Y(0.018))} ${F(sh - Y(0.006))}Q${F(px)} ${F(sh + Y(0.025))} ${F(px + Y(0.018))} ${F(sh - Y(0.006))}Z"/>`;   // a round neckline
        o += `<path fill="${skin}" d="${rect(px - Y(0.012), hy + hr * 0.6, Y(0.024), sh - hy - hr * 0.5)}"/><circle fill="${skin}" cx="${F(px)}" cy="${F(hy)}" r="${F(hr)}"/>`;
        const cap = `M${F(px - hr * 1.02)} ${F(hy + hr * 0.1)}A${F(hr * 1.02)} ${F(hr * 1.06)} 0 0 1 ${F(px + hr * 1.02)} ${F(hy + hr * 0.1)}Q${F(px + hr * 0.5)} ${F(hy - hr * 0.45)} ${F(px - hr * 1.02)} ${F(hy + hr * 0.1)}Z`;
        o += `<path fill="${hair}" d="${cap}${style === 'long' ? `M${F(px - hr * 1.05)} ${F(hy)}V${F(sh + Y(0.03))}H${F(px - hr * 0.6)}V${F(hy + hr * 0.4)}ZM${F(px + hr * 1.05)} ${F(hy)}V${F(sh + Y(0.03))}H${F(px + hr * 0.6)}V${F(hy + hr * 0.4)}Z` : ''}"/>`;
        if (style === 'bun') o += `<circle fill="${hair}" cx="${F(px + hr * 0.2)}" cy="${F(hy - hr * 1.05)}" r="${F(hr * 0.45)}"/>`;
        if (glasses) o += `<path fill="none" stroke="#1d1916" stroke-width="${F(Math.max(0.7, Y(0.004)))}" d="M${F(px - hr * 0.72)} ${F(hy + hr * 0.05)}h${F(hr * 0.56)}M${F(px + hr * 0.16)} ${F(hy + hr * 0.05)}h${F(hr * 0.56)}M${F(px - hr * 0.16)} ${F(hy + hr * 0.05)}h${F(hr * 0.32)}"/>`;
        return `<g class="isl-mroom">${o}</g>`;
      };
      s += '<g class="isl-lq" data-q="aysd">';   // (a professor from Dawn to Dusk; gone home at Night)
      s += `<g class="isl-lq" data-q="a">${prof({ coat: '#3f6650', shirt: '#efe6d2', skin: '#b07a55', hair: '#2a1d16', style: 'bun', lapels: false })}</g>`
        + `<g class="isl-lq" data-q="y">${prof({ coat: '#efeee9', shirt: '#a9bdd3', skin: '#7a4b30', hair: '#1b1715', style: 'short' })}</g>`
        + `<g class="isl-lq" data-q="s">${prof({ coat: '#2f3d5c', shirt: '#f2f2ee', skin: '#c89b78', hair: '#b9b6b0', style: 'short', glasses: true })}</g>`
        + `<g class="isl-lq" data-q="d">${prof({ coat: '#7a2f3e', shirt: '#5a3825', skin: '#5a3825', hair: '#141110', style: 'long', lapels: false })}</g>`;
      s += `<g class="isl-vlamps isl-vwin" style="--i:1"><path class="isl-mlit" d="M${F(px + hr * 0.75)} ${F(hy - hr * 0.55)}A${F(hr)} ${F(hr)} 0 0 1 ${F(px + hr * 0.85)} ${F(hy + hr * 0.5)}M${F(px + Y(0.062))} ${F(sh - Y(0.003))}Q${F(px + Y(0.077))} ${F(sh + Y(0.01))} ${F(px + Y(0.079))} ${F(lT)}" stroke-width="${F(Math.max(0.8, Y(0.007)))}"/></g>`;
      s += '</g>';
    }
    s += `<path class="isl-lwood" d="${polyD([[lx - Y(0.1), lT], [lx + Y(0.1), lT], [lx + Y(0.08), lB], [lx - Y(0.08), lB]])}"/><path class="isl-lwood2" d="${rect(lx - Y(0.12), lT - Y(0.02), Y(0.24), Y(0.025))}"/>`
      + `<path class="isl-lwood2" fill-opacity=".55" d="${polyD([[lx - Y(0.07), lT + Y(0.03)], [lx + Y(0.07), lT + Y(0.03)], [lx + Y(0.058), lB - Y(0.03)], [lx - Y(0.058), lB - Y(0.03)]])}"/>`   // its front panel
      + `<path class="isl-tgrain" d="M${F(lx - Y(0.04))} ${F(lT + Y(0.05))}L${F(lx - Y(0.034))} ${F(lB - Y(0.05))}M${F(lx)} ${F(lT + Y(0.05))}V${F(lB - Y(0.05))}M${F(lx + Y(0.04))} ${F(lT + Y(0.05))}L${F(lx + Y(0.034))} ${F(lB - Y(0.05))}" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/>`
      + `<g class="isl-lq" data-q="aysd"><path class="isl-llap" d="${polyD([[lx - Y(0.07), lT - Y(0.02)], [lx + Y(0.02), lT - Y(0.02)], [lx + Y(0.04), lT - Y(0.1)], [lx - Y(0.05), lT - Y(0.1)]])}"/></g>`;
    s += `<g class="isl-lq" data-q="aysd"><g class="isl-vlamps isl-vwin" style="--i:1">${halo(lx + Y(0.07), lT - Y(0.07), Y(0.14), 'islvbulb')}</g></g>`
      + `<path class="isl-tarm" d="M${F(lx + Y(0.07))} ${F(lT - Y(0.02))}Q${F(lx + Y(0.1))} ${F(lT - Y(0.1))} ${F(lx + Y(0.06))} ${F(lT - Y(0.08))}" stroke-width="${F(Math.max(1, Y(0.01)))}"/><path class="isl-tshade" d="${rect(lx + Y(0.03), lT - Y(0.09), Y(0.06), Y(0.02))}"/>`
      + `<g class="isl-lq" data-q="aysd"><g class="isl-vlamps isl-vwin" style="--i:1"><ellipse class="isl-tbulb" cx="${F(lx + Y(0.06))}" cy="${F(lT - Y(0.069))}" rx="${F(Y(0.026))}" ry="${F(Y(0.005))}"/>${pool(lx + Y(0.05), lT - Y(0.018), Y(0.07), Y(0.008), 0.6)}</g></g>`;   // its lit mouth, its pool on the top (off at Night)
    // the skeleton: skull and jaw, the spine, the rib cage, the pelvis, arms and legs, on a stand
    // (its skull had sat on the third window's sill and the figure was oversize: lower and smaller, its feet
    // now behind the first row's desk rail; first audit, 2026-10-01)
    const kx = X(0.53), top = Y(0.36), u = Y(0.043);
    let bones = `M${F(kx)} ${F(top + u * 1.4)}V${F(top + u * 5.6)}`;
    for (let i = 0; i < 5; i++) { const ry = top + u * (1.9 + i * 0.55), rw = u * (1.05 - Math.abs(i - 1.6) * 0.12); bones += `M${F(kx - rw)} ${F(ry + u * 0.25)}Q${F(kx - rw)} ${F(ry - u * 0.2)} ${F(kx)} ${F(ry)}Q${F(kx + rw)} ${F(ry - u * 0.2)} ${F(kx + rw)} ${F(ry + u * 0.25)}`; }
    bones += `M${F(kx - u * 1.1)} ${F(top + u * 1.7)}L${F(kx - u * 1.5)} ${F(top + u * 3.4)}L${F(kx - u * 1.6)} ${F(top + u * 5.0)}M${F(kx + u * 1.1)} ${F(top + u * 1.7)}L${F(kx + u * 1.45)} ${F(top + u * 3.4)}L${F(kx + u * 1.3)} ${F(top + u * 5.0)}`;
    bones += `M${F(kx - u * 0.6)} ${F(top + u * 6.2)}L${F(kx - u * 0.75)} ${F(top + u * 8.2)}L${F(kx - u * 0.7)} ${F(top + u * 10.2)}M${F(kx + u * 0.6)} ${F(top + u * 6.2)}L${F(kx + u * 0.72)} ${F(top + u * 8.2)}L${F(kx + u * 0.65)} ${F(top + u * 10.2)}`;
    // its collarbones, from the top of the breastbone out to each shoulder (the arms had hung unattached)
    bones += `M${F(kx - u * 1.1)} ${F(top + u * 1.7)}Q${F(kx - u * 0.55)} ${F(top + u * 1.35)} ${F(kx)} ${F(top + u * 1.55)}Q${F(kx + u * 0.55)} ${F(top + u * 1.35)} ${F(kx + u * 1.1)} ${F(top + u * 1.7)}`;
    const bonesF = `M${F(kx - u * 0.6)} ${F(top + u * 0.6)}a${F(u * 0.6)} ${F(u * 0.62)} 0 1 1 ${F(u * 1.2)} 0q0 ${F(u * 0.5)} ${F(-u * 0.25)} ${F(u * 0.7)}h${F(-u * 0.7)}q${F(-u * 0.25)} ${F(-u * 0.2)} ${F(-u * 0.25)} ${F(-u * 0.7)}Z`
      + `M${F(kx - u * 0.9)} ${F(top + u * 5.6)}Q${F(kx)} ${F(top + u * 5.1)} ${F(kx + u * 0.9)} ${F(top + u * 5.6)}L${F(kx + u * 0.6)} ${F(top + u * 6.4)}Q${F(kx)} ${F(top + u * 6.8)} ${F(kx - u * 0.6)} ${F(top + u * 6.4)}Z`;
    // (its shadow on the wall just behind it, so its bones read against a wall of nearly their own colour;
    // offset a little, a thin shaded edge on each bone rather than a ghost copy)
    s += `<g transform="translate(${F(Y(0.005))} ${F(Y(0.007))})"><path class="isl-mbshadow" d="${bones}" stroke-width="${F(Math.max(1, u * 0.2))}"/><path class="isl-tdrop" d="${bonesF}"/></g>`;
    s += `<path class="isl-mstand" d="M${F(kx)} ${F(top - u * 0.6)}V${F(top)}M${F(kx)} ${F(top + u * 10.3)}V${F(lB)}M${F(kx - u * 1.3)} ${F(lB)}H${F(kx + u * 1.3)}" stroke-width="${F(Math.max(1.2, u * 0.2))}"/>`
      + `<path class="isl-mbone" d="${bones}" stroke-width="${F(Math.max(1, u * 0.2))}"/>`
      + `<path class="isl-mbonef" d="${bonesF}"/>`
      + `<path class="isl-mhole" d="M${F(kx - u * 0.32)} ${F(top + u * 0.62)}h0M${F(kx + u * 0.32)} ${F(top + u * 0.62)}h0" stroke-width="${F(Math.max(1.4, u * 0.28))}"/>`;
    // 3. The rows of seats, stepping down toward the front: two rows of seat backs across the foot of the
    //    picture, the nearer larger and lower, and the desk rail in front of each.
    // (the tiers in shade behind the seats: the pale wall had shown between them down to the foot, and the
    // lectern's and the stand's feet below the rail)
    const tier = rect(-2, Y(0.78), W + 4, H - Y(0.78) + 2);
    s += `<path class="isl-lfloor" d="${tier}"/><path class="isl-tdrop" d="${tier}"/>`;
    for (const [yt, sz, cls] of [[0.8, 0.13, 'isl-mseat'], [0.9, 0.18, 'isl-mseat2']]) {
      let seats = '';
      for (let x = -Y(sz) * 0.3; x < W + Y(sz); x += Y(sz) * 1.15) seats += `M${F(x)} ${F(H + 2)}V${F(Y(yt) + Y(sz) * 0.3)}Q${F(x)} ${F(Y(yt))} ${F(x + Y(sz) * 0.3)} ${F(Y(yt))}H${F(x + Y(sz) * 0.7)}Q${F(x + Y(sz))} ${F(Y(yt))} ${F(x + Y(sz))} ${F(Y(yt) + Y(sz) * 0.3)}V${F(H + 2)}Z`;
      // (an armrest between each pair of seats: the backs had been bare slabs; and each back's top edge caught
      // by the screen's light at Dusk, strongest nearest the screen; first audit, 2026-10-01; at Night the
      // projector is off)
      let arms = '';
      const rims = ['', '', ''], scrX = (sx0 + sx1) / 2;
      // Students in the rows, seen from behind: heads and shoulders above the seat backs (one in a white coat,
      // one lit by a laptop's cool glow at Dawn, by Day and at Dusk), drawn behind the backs (art-audit wave 1,
      // 2026-10-01: the hall had been an empty room of seats).
      // Who is in the hall at each hour (art-audit wave 1, by version; the owner, 2026-10-01: what is drawn
      // may change between versions with a reason): a few early students at Dawn, nearly full by Day, thinning
      // at Sunset as classes end, four staying for an evening review at Dusk, and at Night no one: halls are
      // closed to students after hours (the owner, 2026-10-01). Each version's people are their own isl-lq group.
      const C = { coat: '#efeee9', navy: '#2f3d5c', maroon: '#6b2e33', teal: '#3d6466', olive: '#5c5e3e', grey: '#6c6f75', plum: '#5a3d5c', sand: '#8a7a5c' };
      const ROSTER = yt < 0.85 ? {
        a: [[3, 'coat', 'short'], [9, 'maroon', 'bun']],
        y: [[1, 'navy', 'short'], [2, 'coat', 'long'], [3, 'coat', 'short'], [4, 'navy', 'long'], [6, 'grey', 'bun'], [7, 'teal', 'short'], [9, 'maroon', 'bun'],
          [10, 'sand', 'short'], [12, 'plum', 'long'], [13, 'teal', 'short'], [14, 'olive', 'long'], [16, 'coat', 'short'], [18, 'navy', 'bun']],
        s: [[4, 'navy', 'long'], [10, 'sand', 'short'], [13, 'teal', 'short'], [16, 'coat', 'short']],
        d: [[3, 'coat', 'short'], [4, 'navy', 'long']],
      } : {
        a: [[7, 'navy', 'bun', true]],
        y: [[2, 'teal', 'short'], [4, 'grey', 'long'], [7, 'navy', 'bun', true], [9, 'maroon', 'short'], [12, 'olive', 'bun']],
        s: [[2, 'teal', 'short'], [9, 'maroon', 'short']],
        d: [[7, 'navy', 'bun', true], [12, 'olive', 'bun']],   // (and no one at Night)
      };
      const byQ = {};
      for (const q of Object.keys(ROSTER)) {
        let ppl = '', glow = '';
        const pr = ['', '', ''];
        for (const [i, cl, hair, lap] of ROSTER[q]) {
          const z = Y(sz), cx = -z * 0.3 + i * z * 1.15 + z * 0.5, top = Y(yt), hr = z * 0.17, hy = top - z * 0.34;
          ppl += `<path fill="${C[cl]}" d="M${F(cx - z * 0.44)} ${F(top + z * 0.4)}L${F(cx - z * 0.42)} ${F(top - z * 0.02)}Q${F(cx - z * 0.4)} ${F(top - z * 0.15)} ${F(cx - z * 0.14)} ${F(top - z * 0.16)}H${F(cx + z * 0.14)}Q${F(cx + z * 0.4)} ${F(top - z * 0.15)} ${F(cx + z * 0.42)} ${F(top - z * 0.02)}L${F(cx + z * 0.44)} ${F(top + z * 0.4)}Z"/>`
            + `<path fill="#6e4a33" d="${rect(cx - hr * 0.42, hy + hr * 0.6, hr * 0.84, z * 0.12)}"/>`
            + `<circle fill="#1d1916" cx="${F(cx)}" cy="${F(hy)}" r="${F(hr)}"/>`
            + (hair === 'long' ? `<path fill="#1d1916" d="M${F(cx - hr)} ${F(hy)}V${F(top - z * 0.1)}H${F(cx + hr)}V${F(hy)}Z"/>` : '')
            + (hair === 'bun' ? `<circle fill="#1d1916" cx="${F(cx + hr * 0.15)}" cy="${F(hy - hr * 1.05)}" r="${F(hr * 0.45)}"/>` : '');
          if (lap) glow += halo(cx, hy + hr, z * 0.55, 'islvcool');
          const near = 1 - Math.min(1, Math.abs(cx - (sx0 + sx1) / 2) / (W * 0.75));
          pr[near > 0.66 ? 2 : near > 0.33 ? 1 : 0] += `M${F(cx - z * 0.38)} ${F(top - z * 0.06)}Q${F(cx - z * 0.36)} ${F(top - z * 0.15)} ${F(cx - z * 0.12)} ${F(top - z * 0.155)}H${F(cx + z * 0.12)}Q${F(cx + z * 0.36)} ${F(top - z * 0.15)} ${F(cx + z * 0.38)} ${F(top - z * 0.06)}`;
        }
        byQ[q] = { ppl, glow, pr };
      }
      for (let x = -Y(sz) * 0.3; x < W + Y(sz); x += Y(sz) * 1.15) {
        const ax = x + Y(sz) * 1.075;
        arms += rect(ax - Y(sz) * 0.035, Y(yt) + Y(sz) * 0.42, Y(sz) * 0.07, H + 2 - Y(yt) - Y(sz) * 0.42) + rect(ax - Y(sz) * 0.07, Y(yt) + Y(sz) * 0.4, Y(sz) * 0.14, Y(sz) * 0.05);
        const near = 1 - Math.min(1, Math.abs(x + Y(sz) * 0.5 - scrX) / (W * 0.75));
        rims[near > 0.66 ? 2 : near > 0.33 ? 1 : 0] += `M${F(x + Y(sz) * 0.06)} ${F(Y(yt) + Y(sz) * 0.22)}Q${F(x + Y(sz) * 0.06)} ${F(Y(yt) + Y(sz) * 0.02)} ${F(x + Y(sz) * 0.3)} ${F(Y(yt) + Y(sz) * 0.02)}H${F(x + Y(sz) * 0.7)}Q${F(x + Y(sz) * 0.94)} ${F(Y(yt) + Y(sz) * 0.02)} ${F(x + Y(sz) * 0.94)} ${F(Y(yt) + Y(sz) * 0.22)}`;
      }
      s += `<path class="isl-lwood2" d="${rect(-2, Y(yt) - Y(0.035), W + 4, Y(0.03))}"/>${Object.keys(byQ).map((q) => `<g class="isl-lq" data-q="${q}"><g class="isl-vlamps">${byQ[q].glow}</g><g class="isl-mroom">${byQ[q].ppl}</g></g>`).join('')}<path class="${cls}" d="${seats}"/><path class="isl-lwood2" d="${arms}"/>`
        + '<g class="isl-lq" data-q="aysd">' + rims.map((d, i) => (d ? `<path class="isl-mrim" d="${d}" stroke-width="${F(Math.max(1, Y(0.008)))}" stroke-opacity="${[0.12, 0.24, 0.38][i]}"/>` : '')).join('') + '</g>'
        + Object.keys(byQ).map((q) => `<g class="isl-lq" data-q="${q}">` + byQ[q].pr.map((d, i) => (d ? `<path class="isl-mrim" d="${d}" stroke-width="${F(Math.max(1, Y(0.008)))}" stroke-opacity="${[0.12, 0.24, 0.38][i]}"/>` : '')).join('') + '</g>').join('');
    }
    return `<g style="--isl-vstep:.5s">${s}</g>`;
  }

  /* THE DISH AND THE NETWORK (the General AI page's head; owner, 2026-09-29: art tied to the title at a
     glance, "fantastical or sci-fi" where it fits better): a radio dish on a headland over the sea, turned
     to the sky, where a constellation drawn as a neural network (as the homepage hero's was, until 2026-09-30) receives
     its beam; the network's nodes light layer by layer, the output last, in the page's hue. A small
     station with lit windows at the dish's foot, and its keeper, somewhere different at each hour (art-audit
     pass 4, 2026-10-01). Sized from the card's height. */
  function dishNet(W, H, v) {
    const y0 = v.y0, X = (k) => k * W, Y = (k) => k * H, r = rng(1123);
    let s = '';
    // 1. The headland at the right, rising from the sea, rimmed; mist at its foot; scrub on its crest.
    const crest = [[0.52, 1.02], [0.56, 0.9], [0.61, 0.8], [0.67, 0.72], [0.74, 0.68], [0.84, 0.66], [0.94, 0.67], [1.02, 0.68]].map(([x, y]) => [X(x), Y(y)]);
    s += mist(X(0.4), y0 + Y(0.04), X(0.2), Y(0.08), 0.45);
    // (the station's concrete footing, carried down under its downhill end: its floor had hung over the falling
    // slope, sky showing beneath; drawn before the land, which covers it wherever the ground is higher)
    const bx = X(0.64), bT = Y(0.58), bw = Y(0.36);
    s += `<path class="isl-aramp" d="${rect(bx, bT + Y(0.14) - 1, bw, Y(0.08))}"/>`;
    s += `<path class="f-far isl-land" d="${polyD([...crest, [X(1.02), H + 2]])}"/>`;
    s += `<path class="s-rim" d="${lineD(crest.slice(1, 6).map(([x, y]) => [x, y + 0.5]))}" stroke-width="1.2" stroke-opacity=".45"/>`;
    s += shrubs([[0.585, 0.86, 0.05], [0.64, 0.77, 0.045], [0.9, 0.7, 0.05], [0.98, 0.75, 0.06]].map(([x, y, k]) => [X(x), Y(y), Y(k)]), r);
    // 2. The station: a low block with lit windows beside the dish's foot.
    //    (its lit windows' glow, its roof edge catching the last light, a door in its right bay with its pool,
    //    and a concrete base course, so it stands off the hill after dark, when wall and hill share a tone)
    s += `<path class="isl-tw0" d="${rect(bx, bT, bw, Y(0.14))}"/><path class="isl-troof" d="${rect(bx - Y(0.01), bT - Y(0.015), bw + Y(0.02), Y(0.02))}"/>`
      + `<g class="isl-vwin" style="--i:0">${halo(bx + Y(0.15), bT + Y(0.065), Y(0.2), 'islvwarm')}${pool(bx + Y(0.3125), bT + Y(0.155), Y(0.07), Y(0.014), 0.6)}</g>`
      + `<path class="s-rim" d="M${F(bx - Y(0.01))} ${F(bT - Y(0.015) + 0.5)}H${F(bx + bw + Y(0.01))}" stroke-width="1" stroke-opacity=".4"/>`
      + `<path class="f-pulse isl-vwin" style="--i:0" d="${rect(bx + Y(0.04), bT + Y(0.04), Y(0.05), Y(0.04))}${rect(bx + Y(0.13), bT + Y(0.04), Y(0.05), Y(0.04))}${rect(bx + Y(0.22), bT + Y(0.04), Y(0.04), Y(0.06))}${rect(bx + Y(0.295), bT + Y(0.04), Y(0.035), Y(0.086))}"/>`
      + `<path class="isl-aramp" d="${rect(bx - Y(0.004), bT + Y(0.126), bw + Y(0.008), Y(0.014))}"/>`;
    // 3. The dish: a lattice pedestal, the yoke, the bowl turned up and to the left, the feed on its legs.
    const dx = X(0.85), footY = Y(0.68), pivY = Y(0.32), R = Y(0.38), ang = -2.35;
    const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
    s += `<path class="isl-dtruss" d="M${F(dx - Y(0.08))} ${F(footY)}L${F(dx - Y(0.02))} ${F(pivY + Y(0.06))}M${F(dx + Y(0.08))} ${F(footY)}L${F(dx + Y(0.02))} ${F(pivY + Y(0.06))}M${F(dx - Y(0.06))} ${F(footY - Y(0.1))}H${F(dx + Y(0.06))}M${F(dx - Y(0.04))} ${F(footY - Y(0.2))}H${F(dx + Y(0.04))}M${F(dx - Y(0.06))} ${F(footY - Y(0.1))}L${F(dx + Y(0.04))} ${F(footY - Y(0.2))}M${F(dx + Y(0.06))} ${F(footY - Y(0.1))}L${F(dx - Y(0.04))} ${F(footY - Y(0.2))}" stroke-width="${F(Math.max(1, Y(0.01)))}"/>`;
    // the pedestal set into a concrete plinth, over its shadow (its legs had ended as bare lines on the grass)
    s += `<ellipse class="isl-tdrop" cx="${F(dx)}" cy="${F(footY + Y(0.01))}" rx="${F(Y(0.115))}" ry="${F(Y(0.016))}"/><path class="isl-aramp" d="${rect(dx - Y(0.1), footY - Y(0.012), Y(0.2), Y(0.024))}"/>`;
    // The station's keeper (art-audit pass 4, 2026-10-01: nothing said anyone worked here). One person, in a
    // different place at each hour (by version), because the dish is serviced in daylight and observes after
    // dark, so the keeper works outside by day and at the console at night: at Dawn in the lit doorway with the
    // shift's first coffee, a dark figure against the light with the mug pale at the chest; by Day at the dish's
    // foot in a white shirt and a hard hat, the toolbox set down beside them; at Sunset walking back along the
    // crest to the door, toolbox in hand, the low Sun rimming their front; at Dusk and Night seated at the
    // console, head and shoulders dark in the tall third window, a screen beyond them edging them in its cool
    // light (lit with the windows). Sized from the door, Y(0.086) tall, so about 2.1 m: a standing adult is
    // Y(0.074), about 17 css px at 1920 (the station's own scale allows no more). Drawn after the pedestal, so
    // that where a narrower card brings the dish up against the station (from about 1280 down) the keeper can
    // stand on the ground in front of the plinth, between its legs, instead of on the open crest beside it.
    // Placed by hand, so no draws are taken; literal colours, dimmed by version (isl-bfig).
    {
      const hu = Y(0.074), m = hu / 1.8, sw = hu * 0.13, hr = hu * 0.075, Q = {};
      const put = (q, svg) => { Q[q] = (Q[q] || '') + svg; };
      const open = dx - bx - bw >= Y(0.2);   // room on the crest between the station and the plinth
      const toolbox = (cx, gy) => `<path fill="#3d6290" d="${rect(cx - 0.14 * hu, gy - 0.13 * hu, 0.28 * hu, 0.13 * hu)}"/>`
        + `<path fill="#2b4669" d="${rect(cx - 0.145 * hu, gy - 0.13 * hu, 0.29 * hu, 0.035 * hu)}"/>`
        + `<path fill="none" stroke="#2a2f36" stroke-width="${F(Math.max(0.6, 0.025 * hu))}" d="M${F(cx - 0.06 * hu)} ${F(gy - 0.13 * hu)}V${F(gy - 0.175 * hu)}H${F(cx + 0.06 * hu)}V${F(gy - 0.13 * hu)}"/>`;
      const drop = (cx, gy, w) => `<ellipse class="isl-tdrop" cx="${F(cx)}" cy="${F(gy)}" rx="${F(w)}" ry="${F(0.035 * hu)}"/>`;
      // Dawn: in the doorway, on its threshold (the base course), facing out, the mug held at the chest.
      const dcx = bx + Y(0.3125), thr = bT + Y(0.126), mug = [dcx + sw * 0.2, thr - hu * 0.6];
      put('a', `<g class="isl-bfig">${person(dcx, thr, hu, { shirt: '#3b4352', legs: '#262b33', skin: '#4a3024', hair: '#17140f', front: true, reach: mug })}`
        + `<path class="isl-lmug" d="${rect(mug[0] - 0.04 * hu, mug[1] - 0.08 * hu, 0.08 * hu, 0.09 * hu)}"/></g>`);
      // Day: on the grass left of the plinth, facing us, the toolbox at their side (or, on a narrow card, in
      // front of the plinth's middle, under the dish, with the toolbox at its foot).
      const ax = open ? dx - Y(0.14) : dx, ay = open ? footY + Y(0.005) : footY + Y(0.022), ahy = ay - hu + hr;
      const tbx = open ? ax - 0.33 * hu : ax + 0.34 * hu;
      put('y', `<g class="isl-bfig">${drop(ax, ay, 0.2 * hu)}${drop(tbx, ay, 0.18 * hu)}${toolbox(tbx, ay)}`
        + person(ax, ay, hu, { shirt: '#f1eee6', legs: '#34405a', skin: '#8d5a3b', hair: '#1d1916', front: true })
        + `<path fill="#e5b437" d="M${F(ax - hr * 1.1)} ${F(ahy - hr * 0.05)}A${F(hr * 1.1)} ${F(hr * 1.15)} 0 0 1 ${F(ax + hr * 1.1)} ${F(ahy - hr * 0.05)}Z${rect(ax - hr * 1.45, ahy - hr * 0.2, hr * 2.9, hr * 0.32)}"/></g>`);
      // Sunset: walking left along the crest, halfway from the plinth to the door, seen side on in mid-stride;
      // the near hand carries the toolbox, the far arm swings forward; the feet on the line from the plinth's
      // foot to the threshold (or, on a narrow card, setting off from in front of the plinth).
      const wx = open ? (dcx + dx - Y(0.1)) / 2 : dx + Y(0.01), wy = open ? (thr + footY + Y(0.005)) / 2 : footY + Y(0.022);
      const W2 = (px, py) => [wx + px * hu, wy - py * hu];   // a point px across (forward is left, negative) and py up, in heights
      const leg = (fx, sh) => `<path fill="${sh}" d="${polyD([W2(-0.04, 0.5), W2(0.04, 0.5), W2(fx + 0.03, 0.03), W2(fx - 0.03, 0.03)])}"/>`
        + `<path fill="#3a2e24" d="${polyD([W2(fx - 0.075, 0), W2(fx + 0.035, 0), W2(fx + 0.035, 0.035), W2(fx - 0.06, 0.035)])}"/>`;
      const hand = W2(0.015, 0.46), head = W2(-0.035, 0.915), face = W2(-0.055, 0.905);
      let walk = `<path fill="none" stroke="#c4c0b6" stroke-width="${F(0.06 * hu)}" stroke-linecap="round" d="${lineD([W2(-0.01, 0.79), W2(-0.07, 0.64), W2(-0.12, 0.53)])}"/>`;   // the far arm, forward
      walk += leg(0.12, '#283041') + leg(-0.13, '#34405a');   // the far leg trailing, the near leg leading
      walk += `<path fill="#f1eee6" d="${polyD([W2(-0.065, 0.48), W2(-0.075, 0.66), W2(-0.06, 0.8), W2(-0.02, 0.825), W2(0.04, 0.81), W2(0.065, 0.7), W2(0.06, 0.48)])}"/>`;   // the day's white shirt
      walk += `<path fill="#8d5a3b" d="${rect(head[0] - 0.02 * hu, wy - 0.86 * hu, 0.035 * hu, 0.05 * hu)}"/>`   // the neck
        + `<circle fill="#1d1916" cx="${F(head[0] + 0.012 * hu)}" cy="${F(head[1])}" r="${F(0.072 * hu)}"/><circle fill="#8d5a3b" cx="${F(face[0])}" cy="${F(face[1])}" r="${F(0.052 * hu)}"/>`   // hair behind, the face forward
        + `<path fill="#e5b437" d="M${F(head[0] - 0.07 * hu)} ${F(head[1] - 0.02 * hu)}A${F(0.075 * hu)} ${F(0.075 * hu)} 0 0 1 ${F(head[0] + 0.08 * hu)} ${F(head[1] - 0.02 * hu)}Z${rect(head[0] - 0.115 * hu, head[1] - 0.035 * hu, 0.2 * hu, 0.025 * hu)}"/>`;   // the hard hat, its brim forward
      walk += `<path fill="none" stroke="#d9d4c9" stroke-width="${F(0.065 * hu)}" stroke-linecap="round" d="${lineD([W2(0, 0.78), hand])}"/><circle fill="#8d5a3b" cx="${F(hand[0])}" cy="${F(hand[1])}" r="${F(0.032 * hu)}"/>`;   // the near arm, down to the toolbox
      put('s', `<g class="isl-bfig">${drop(wx, wy, 0.22 * hu)}${walk}${toolbox(hand[0], wy - 0.29 * hu)}</g>`
        + `<path class="s-rim" d="${lineD([W2(-0.06, 0.8), W2(-0.075, 0.66), W2(-0.065, 0.5)])}M${F(face[0] - 0.045 * hu)} ${F(face[1] - 0.03 * hu)}l${F(-0.005 * hu)} ${F(0.05 * hu)}" stroke-width="${F(Math.max(0.6, Y(0.003)))}" stroke-opacity=".7"/>`);
      // Dusk and Night: seated at the console in the tall third window, seen from behind, the window's sill
      // cutting them at the chest; the screen beyond, on the desk at their right, edges their head and
      // shoulder on that side.
      const w0 = bx + Y(0.22), ww = Y(0.04), sill = bT + Y(0.1), kx = w0 + ww * 0.36, khy = thr - 1.17 * m, ksh = thr - 0.98 * m;
      const scr = [w0 + ww * 0.5, thr - 1.13 * m, ww * 0.42, 0.3 * m];
      put('dn', `<path class="isl-lbezel" d="${rect(scr[0] - 0.4, scr[1] - 0.4, scr[2] + 0.8, scr[3] + 0.8)}"/>`
        + `<g class="isl-vwin" style="--i:0"><path class="isl-lscreen" d="${rect(...scr)}"/></g>`
        + `<g class="isl-bfig"><path fill="#252b35" d="M${F(kx - sw)} ${F(sill)}V${F(ksh + sw * 0.35)}Q${F(kx - sw)} ${F(ksh)} ${F(kx - sw * 0.45)} ${F(ksh)}H${F(kx + sw * 0.45)}Q${F(kx + sw)} ${F(ksh)} ${F(kx + sw)} ${F(ksh + sw * 0.35)}V${F(sill)}Z"/>`
        + `<path fill="#1a1d22" d="${rect(kx - hr * 0.5, khy, hr, ksh - khy + 0.5)}"/><circle fill="#15181d" cx="${F(kx)}" cy="${F(khy)}" r="${F(hr)}"/></g>`
        + `<g class="isl-vwin" style="--i:0"><path class="s-vcool" d="M${F(kx + hr * 0.2)} ${F(khy - hr * 0.95)}A${F(hr)} ${F(hr)} 0 0 1 ${F(kx + hr * 0.7)} ${F(khy + hr * 0.7)}M${F(kx + sw * 0.55)} ${F(ksh)}Q${F(kx + sw)} ${F(ksh)} ${F(kx + sw)} ${F(ksh + sw * 0.6)}" stroke-width="${F(Math.max(0.5, 0.025 * hu))}" stroke-opacity=".85"/></g>`);
      s += Object.keys(Q).map((q) => `<g class="isl-lq" data-q="${q}">${Q[q]}</g>`).join('');
    }
    const rimA = [dx + nx * R, pivY + ny * R], rimB = [dx - nx * R, pivY - ny * R], depth = R * 0.42;
    const back = [dx - ux * depth, pivY - uy * depth];
    s += `<path class="isl-ddish" d="M${F(rimA[0])} ${F(rimA[1])}Q${F(back[0] - ux * depth)} ${F(back[1] - uy * depth)} ${F(rimB[0])} ${F(rimB[1])}Z"/>`
      // (its roundness: a shaded band along the back of the shell, widest at its apex, tapering to the rim)
      + `<path class="isl-lsidew" d="M${F(rimA[0])} ${F(rimA[1])}Q${F(dx - 2 * ux * depth)} ${F(pivY - 2 * uy * depth)} ${F(rimB[0])} ${F(rimB[1])}Q${F(dx - 1.2 * ux * depth)} ${F(pivY - 1.2 * uy * depth)} ${F(rimA[0])} ${F(rimA[1])}Z"/>`
      + `<path class="isl-ddish2" d="M${F(rimA[0])} ${F(rimA[1])}Q${F(dx + ux * R * 0.14)} ${F(pivY + uy * R * 0.14)} ${F(rimB[0])} ${F(rimB[1])}" stroke-width="${F(Math.max(1.4, Y(0.014)))}"/>`;
    const focus = [dx + ux * R * 0.85, pivY + uy * R * 0.85];
    s += `<path class="isl-dtruss" d="M${F(rimA[0] + (focus[0] - rimA[0]) * 0.05)} ${F(rimA[1] + (focus[1] - rimA[1]) * 0.05)}L${F(focus[0])} ${F(focus[1])}L${F(rimB[0] + (focus[0] - rimB[0]) * 0.05)} ${F(rimB[1] + (focus[1] - rimB[1]) * 0.05)}" stroke-width="${F(Math.max(0.8, Y(0.007)))}"/>`
      + `<circle class="isl-tiron" cx="${F(focus[0])}" cy="${F(focus[1])}" r="${F(Math.max(1.5, Y(0.016)))}"/>`;
    // 4. The network in the sky: three layers of nodes joined layer to layer, the output node at the right
    //    nearest the dish; the beam from the dish's feed to it; the nodes light layer by layer.
    const layers = [[0.14, [0.18, 0.4, 0.62]], [0.3, [0.12, 0.3, 0.48, 0.66]], [0.46, [0.26, 0.5]], [0.6, [0.36]]]
      .map(([x, ys]) => ys.map((yy) => [X(x), Y(yy)]));
    let links = '';
    for (let l = 0; l < layers.length - 1; l++) for (const a of layers[l]) for (const b of layers[l + 1]) links += `M${F(a[0])} ${F(a[1])}L${F(b[0])} ${F(b[1])}`;
    const out = layers[layers.length - 1][0];
    s += `<path d="${polyD([[focus[0] - Y(0.01), focus[1]], [focus[0] + Y(0.01), focus[1] + Y(0.01)], [out[0] + Y(0.02), out[1] + Y(0.03)], [out[0] - Y(0.01), out[1] - Y(0.03)]])}" fill="url(#islnbeam)"/>`;
    // (the beam leaves the feed brightest and fades as it spreads toward the node, in the network's own pale
    // colour (st-node), so the page's hue stays on the node and its halo alone: art-audit pass 4, 2026-10-01;
    // it had brightened toward the node in the page's hue, so it read as a comet falling and spread the one
    // accent across a wedge of sky)
    s += `<defs><linearGradient id="islnbeam" gradientUnits="userSpaceOnUse" x1="${F(focus[0])}" y1="${F(focus[1])}" x2="${F(out[0])}" y2="${F(out[1])}"><stop offset="0" class="st-node" stop-opacity=".3"/><stop offset="1" class="st-node" stop-opacity=".06"/></linearGradient></defs>`;
    s += `<path class="s-net" d="${links}" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/>`;
    layers.forEach((ly, l) => {
      const last = l === layers.length - 1;
      s += `<g class="isl-vwin${last ? ' isl-vlast' : ''}" style="--i:${l + 1}">`
        + ly.map(([x, y]) => (last ? halo(x, y, Y(0.12), 'islvlamp') + `<circle class="isl-vlamp" cx="${F(x)}" cy="${F(y)}" r="${F(Math.max(2, Y(0.022)))}"/>`
          : `<circle class="s-node isl-nnode" cx="${F(x)}" cy="${F(y)}" r="${F(Math.max(1.6, Y(0.016)))}" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/>`)).join('') + '</g>';
    });
    // signals along the beam, a few short bright dashes
    let sig = '';
    for (const t of [0.25, 0.5, 0.75]) { const x = focus[0] + (out[0] - focus[0]) * t, y = focus[1] + (out[1] - focus[1]) * t; sig += `M${F(x)} ${F(y)}l${F((out[0] - focus[0]) * 0.03)} ${F((out[1] - focus[1]) * 0.03)}`; }
    s += `<path class="isl-bsound isl-vwin" style="--i:4" d="${sig}" stroke-width="${F(Math.max(1.4, Y(0.012)))}"/>`;
    // a small pale halo at the feed, where the beam leaves the dish, lit with the signals (art-audit pass 4,
    // 2026-10-01); a glow, so not by Day (isl-vlamps), when the beam and its dashes still show
    s += `<g class="isl-vwin" style="--i:4"><g class="isl-vlamps">${halo(focus[0], focus[1], Y(0.055), 'islvcool')}</g></g>`;
    return `<g style="--isl-vstep:.45s">${s}</g>`;
  }

  /* THE COMMITTEE ROOM (the Committee Work and Updates page's head; owner, 2026-09-29: art tied to the
     title at a glance): the committee's room with its work in progress, seen from the near side of the
     table, the viewer's own place, where the open folder of minutes lies. A round table, chairs round the
     far side and the ends, a place at each with its papers, a folded name card and a glass, the folders
     of minutes stacked in the middle beside a jug of water; a lamp hanging low over the table, lit from
     Dawn to Night; on the back wall the committee's project board, notes moving from to do through under
     way to done; a flip chart on its easel with the agenda, its items ticked off in the page's hue; the
     window at the left onto the harbour, facing the Sun's setting bearing. The room is one true
     perspective (owner, 2026-09-30: the far chairs looked "very tall or floating" and "the chairs all look
     different sizes" when each was sized by hand): the eye is at a seated height and its horizon is the
     sea's horizon in the window, so everything farther is smaller and higher, the floorboards meet on that
     horizon, and every foot stands on the floor at its own depth. Face on, sized from the card's height.
     By Day the meeting is under way and at Sunset it has just ended, shown by the members' things rather
     than the members (art-audit pass 4, 2026-10-01; see the chairs and the places, below).
     The harbour's lights come on, then the lamp, and the agenda's ticks one by one, the last of them last
     (reviewed 2026-09-30 by blind "which page is this?" tests and a craft and five-versions check before
     the owner saw it). */
  function committeeRoom(W, H, v) {
    const y0 = v.y0, X = (k) => k * W, Y = (k) => k * H, r = rng(1307);
    const f = newsFrame(W, H, -1);
    let s = windowView(W, H, f, y0, r, 2) + windowWall(W, H, f, 'islkwallg', -1);
    // The camera, in metres: the eye 1.2 m above the floor (seated), looking level, so its horizon is the
    // window's (f.hz); the table's centre 2.88 m ahead (far enough that the table lies flat, not looming),
    // the table 2.5 m across and 0.75 m high; the back wall 5 m away. fc is the focal length in pixels, set so the table fills the same share of the card
    // at every width. P(x, d, h) is the place of a point x across, d ahead and h up.
    const R = 1.25, D = 2.88, E = 1.2, dW = 5.0, hz = f.hz;
    const fc = Math.min(Y(0.6), X(0.18)) * D / R;
    const tx = Math.max(X(0.56), f.wx1 + Y(0.05) + fc * 1.85 / D);
    const P = (x, d, h) => [tx + fc * x / d, hz + fc * (E - h) / d], sc = (d) => fc / d;
    const ring = (cx, cd, rad, h, t0 = 0, t1 = 2 * Math.PI, n = 48) => {
      const out = [];
      for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n; out.push(P(cx + rad * Math.cos(t), cd + rad * Math.sin(t), h)); }
      return out;
    };
    const box = (pts) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2, (Math.max(...xs) - Math.min(...xs)) / 2, (Math.max(...ys) - Math.min(...ys)) / 2]; };
    // 0. The room: the floor from the back wall's foot (wb) to the card's edge, its boards running toward
    //    the viewer and meeting on the horizon; a skirting board; a rug under the table and chairs.
    const wb = P(0, dW, 0)[1], dNear = fc * E / (H - hz);
    s += `<path class="isl-lfloor" d="${rect(-2, wb, W + 4, H - wb + 2)}"/>`;
    let planks = '';
    for (let x = -14; x <= 14; x += 0.3) {
      const [xa, ya] = P(x, dW, 0), [xb, yb] = P(x, dNear, 0);
      if (Math.max(xa, xb) > -4 && Math.min(xa, xb) < W + 4) planks += `M${F(xa)} ${F(ya)}L${F(xb)} ${F(yb)}`;
    }
    s += `<path class="isl-lgrout" d="${planks}" stroke-width=".7" stroke-opacity=".5"/>`
      + `<path class="isl-lwood2" d="${rect(-2, wb - 0.1 * sc(dW), W + 4, 0.1 * sc(dW))}"/>`
      + `<path class="isl-lbase" d="M-2 ${F(wb)}H${F(W + 2)}" stroke-width="${F(Math.max(1, Y(0.008)))}"/>`;
    s += `<path class="isl-krug" d="${polyD(ring(0, D, 1.95, 0))}"/><path class="isl-krugb" d="${polyD(ring(0, D, 1.8, 0))}" stroke-width="${F(Math.max(0.8, Y(0.008)))}"/>`;
    // 1. The project board on the back wall between the window and the lamp, 1.35 to 2.15 m up: a whiteboard
    //    in its frame, three columns (to do, under way, done) under their headings, the notes in each, the
    //    last column fullest. (It is the picture's clearest sign of work in progress, so it is as wide as the
    //    wall allows.)
    const reg0 = f.wx1 + Y(0.06), reg1 = tx - Y(0.19), bw = Math.min(2.2 * sc(dW), reg1 - reg0);
    if (bw > Y(0.24)) {
      const bx0 = (reg0 + reg1) / 2 - bw / 2, bT = P(0, dW, 2.15)[1], bh = 0.8 * sc(dW), cw = bw / 3, ns = Math.min(bh * 0.24, cw * 0.36);
      s += `<path class="isl-tdrop" d="${rect(bx0 + Y(0.01), bT + Y(0.013), bw, bh)}"/><path class="isl-lalu" d="${rect(bx0, bT, bw, bh)}"/>`
        + `<path class="isl-kboard" d="${rect(bx0 + Y(0.008), bT + Y(0.008), bw - Y(0.016), bh - Y(0.016))}"/>`
        + `<path class="isl-kbox" d="M${F(bx0 + cw)} ${F(bT + bh * 0.1)}V${F(bT + bh - Y(0.016))}M${F(bx0 + 2 * cw)} ${F(bT + bh * 0.1)}V${F(bT + bh - Y(0.016))}" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/>`;
      // its pen ledge along the foot, with its shadow and a marker lying on it
      const ty0 = bT + bh, th = Math.max(2, 0.035 * sc(dW)), mkh = Math.max(1.5, 0.02 * sc(dW));
      s += `<path class="isl-tdrop" d="${rect(bx0 + bw * 0.08 + Y(0.006), ty0 + Y(0.008), bw * 0.84, th)}"/><path class="isl-lalu" d="${rect(bx0 + bw * 0.08, ty0, bw * 0.84, th)}"/>`
        + `<path class="isl-tiron" d="${rect(bx0 + bw * 0.62, ty0 - mkh, 0.13 * sc(dW), mkh)}"/>`;
      let heads = '';
      for (let c = 0; c < 3; c++) heads += `M${F(bx0 + c * cw + cw * 0.25)} ${F(bT + bh * 0.16)}h${F(cw * 0.5)}`;
      s += `<path class="isl-khead" d="${heads}" stroke-width="${F(Math.max(1.2, Y(0.012)))}"/>`;
      // each note: its column, its place across and down the column, its color and a small tilt
      let ink = '';
      for (const [c, fx, row, cls, rot] of [[0, 0.5, 0, 'isl-knote', -4], [0, 0.5, 1, 'isl-lbk2', 3], [1, 0.5, 0, 'isl-knote', 2], [1, 0.5, 1, 'isl-lbk1', -3],
        [2, 0.3, 0, 'isl-knote', 3], [2, 0.72, 0, 'isl-lbk2', -2], [2, 0.5, 1, 'isl-knote', -3]]) {
        const cx = bx0 + c * cw + cw * fx, cy = bT + bh * (0.4 + row * 0.32);
        s += `<rect class="${cls}" x="${F(cx - ns / 2)}" y="${F(cy - ns / 2)}" width="${F(ns)}" height="${F(ns)}" transform="rotate(${rot} ${F(cx)} ${F(cy)})"/>`;
        ink += `M${F(cx - ns * 0.3)} ${F(cy - ns * 0.1)}h${F(ns * 0.6)}M${F(cx - ns * 0.3)} ${F(cy + ns * 0.15)}h${F(ns * 0.4)}`;
      }
      s += `<path class="isl-bink" d="${ink}" stroke-width="${F(Math.max(0.6, Y(0.005)))}"/>`;
    }
    // 2. The flip chart on its easel near the back wall at the right, 4.5 m away: two front legs to the
    //    floor and one behind, the pad (0.9 m wide, 0.85 to 1.95 m up) clamped at the top with its used
    //    sheets rolled over the clamp, the agenda: a heading and four items, each with its box; the first
    //    three ticked in the page's hue, one after another.
    const eD = 4.5, pwS = 0.9 * sc(eD), pcx = Math.min(X(0.9), W - pwS * 0.7), ex = (pcx - tx) / sc(eD);
    const [p0, pT] = P(ex - 0.45, eD, 1.95), [p1, pB] = P(ex + 0.45, eD, 0.85), pw = p1 - p0, ps = sc(eD);
    const [fl0x, fl0y] = P(ex - 0.55, eD - 0.15, 0), [fl1x, fl1y] = P(ex + 0.55, eD - 0.15, 0), [bkx, bky] = P(ex, eD + 0.3, 0), [bkx2, bky2] = P(ex, eD + 0.05, 1.85);
    const [esx, esy, esr, esq] = box(ring(ex, eD, 0.55, 0));
    s += `<ellipse class="isl-tdrop" cx="${F(esx)}" cy="${F(esy)}" rx="${F(esr)}" ry="${F(esq)}"/>`
      + `<path class="isl-kleg" d="M${F(bkx2)} ${F(bky2)}L${F(bkx)} ${F(bky)}" stroke-width="${F(Math.max(1.1, 0.035 * ps))}" stroke-opacity=".7"/>`
      + `<path class="isl-kleg" d="M${F(p0 + 0.08 * ps)} ${F(pT)}L${F(fl0x)} ${F(fl0y)}M${F(p1 - 0.08 * ps)} ${F(pT)}L${F(fl1x)} ${F(fl1y)}" stroke-width="${F(Math.max(1.3, 0.045 * ps))}"/>`;
    s += `<path class="isl-tdrop" d="${rect(p0 + Y(0.01), pT + Y(0.013), pw, pB - pT)}"/><path class="isl-lpage" d="${rect(p0, pT, pw, pB - pT)}"/>`
      + `<path class="isl-lpageedge" d="${rect(p0 - 0.025 * ps, pT, 0.025 * ps, 0.15 * ps)}${rect(p1, pT, 0.025 * ps, 0.12 * ps)}"/>`
      + `<rect class="isl-lpage" x="${F(p0 - 0.02 * ps)}" y="${F(pT - 0.08 * ps)}" width="${F(pw + 0.04 * ps)}" height="${F(0.065 * ps)}" rx="${F(0.032 * ps)}"/>`
      + `<path class="isl-tdrop" d="${rect(p0 - 0.02 * ps, pT - 0.025 * ps, pw + 0.04 * ps, 0.015 * ps)}"/>`
      + `<path class="isl-tiron" d="${rect(p0 - 0.035 * ps, pT - 0.02 * ps, pw + 0.07 * ps, 0.05 * ps)}"/>`
      + `<path class="isl-kleg" d="M${F(p0 + 0.05 * ps)} ${F(pB)}H${F(p1 - 0.05 * ps)}" stroke-width="${F(Math.max(1.3, 0.045 * ps))}"/>`;
    const ix0 = p0 + pw * 0.12, bs = 0.13 * ps, itemY = (i) => pT + (0.36 + i * 0.2) * ps;
    let boxes = '', text = '';
    for (let i = 0; i < 4; i++) {
      const y = itemY(i);
      boxes += rect(ix0, y - bs / 2, bs, bs);
      text += `M${F(ix0 + bs * 1.6)} ${F(y)}h${F(pw * [0.52, 0.4, 0.48, 0.34][i])}`;
    }
    s += `<path class="isl-bink" d="${text}" stroke-width="${F(Math.max(1, 0.026 * ps))}"/>`
      + `<path class="isl-khead" d="M${F(ix0)} ${F(pT + 0.2 * ps)}h${F(pw * 0.6)}" stroke-width="${F(Math.max(1.4, 0.045 * ps))}"/>`
      + `<path class="isl-kbox" d="${boxes}" stroke-width="${F(Math.max(0.8, 0.02 * ps))}"/>`;
    // the ticks: hidden, not faint, until their turn (isl-vtick), so the agenda is not seen done early
    for (let i = 0; i < 3; i++) {
      const y = itemY(i), tick = `M${F(ix0 + bs * 0.18)} ${F(y)}L${F(ix0 + bs * 0.45)} ${F(y + bs * 0.32)}L${F(ix0 + bs * 1.05)} ${F(y - bs * 0.62)}`;
      s += `<g class="isl-vwin isl-vtick${i === 2 ? ' isl-vlast' : ''}" style="--i:${2 + i}"><path class="isl-cring" d="${tick}" stroke-width="${F(Math.max(2, 0.055 * ps))}"/></g>`;
    }
    // 3. The chairs: one chair, drawn in the camera wherever it stands round the table, facing its centre:
    //    a padded back 0.42 m wide on a slight lean, up to 0.96 m, a seat at 0.45 m, four legs; its shadow
    //    on the floor under it; its parts drawn from the farthest to the nearest. (2026-10-01, art-audit pass 4:
    //    it stands rad metres from the table's centre, 1.55 when set at the table, and is turned yaw degrees
    //    from facing the centre, since a chair pulled out or pushed back is rarely left square to the table;
    //    coat, when given, names the versions in which a jacket hangs over its back. Set at the table and
    //    square, it is drawn exactly as before.)
    const chair = (a, rad = 1.55, yaw = 0, coat = '') => {
      const ar = a * Math.PI / 180, cx = rad * Math.cos(ar), cd = D + rad * Math.sin(ar), at = ar + yaw * Math.PI / 180;
      const ux = -Math.cos(at), ud = -Math.sin(at), vx = -ud, vd = ux;          // u the way it faces (the table, when square), v across the seat
      const Q = (u, vv, h) => P(cx + u * ux + vv * vx, cd + u * ud + vv * vd, h), dOf = (u, vv) => cd + u * ud + vv * vd;
      const [shx, shy, shr, shq] = box(ring(cx, cd, 0.32, 0));
      const parts = [];
      for (const [lu, lv] of [[-0.18, -0.19], [-0.18, 0.19], [0.18, -0.19], [0.18, 0.19]]) {
        const [x0, y1a] = Q(lu, lv, 0.42), [x1, y1b] = Q(lu, lv, 0);
        parts.push([dOf(lu, lv), `<path class="isl-lchairleg" d="M${F(x0)} ${F(y1a)}L${F(x1)} ${F(y1b)}" stroke-width="${F(Math.max(1, 0.035 * sc(cd)))}"/>`]);
      }
      // the seat: its sides, then its top
      const sq = [[-0.2, -0.22], [0.22, -0.22], [0.22, 0.22], [-0.2, 0.22]];
      let sides = '';
      for (let i = 0; i < 4; i++) {
        const [ua, va] = sq[i], [ub, vb] = sq[(i + 1) % 4];
        sides += polyD([Q(ua, va, 0.42), Q(ub, vb, 0.42), Q(ub, vb, 0.48), Q(ua, va, 0.48)]);
      }
      parts.push([dOf(0.01, 0), `<path class="isl-kchairs" d="${sides}"/><path class="isl-kchair" d="${polyD(sq.map(([u, vv]) => Q(u, vv, 0.48)))}"/>`]);
      // the back: a rounded panel with depth, its far face, the band between its faces, its near face and
      // the padding on it
      const h0 = 0.48, h1 = 0.96, rr = 0.09, vL = -0.21, vR = 0.21, outline = [[vL, h0]];
      for (let i = 0; i <= 4; i++) { const t = Math.PI - (i / 4) * Math.PI / 2; outline.push([vL + rr + Math.cos(t) * rr, h1 - rr + Math.sin(t) * rr]); }
      for (let i = 0; i <= 4; i++) { const t = Math.PI / 2 - (i / 4) * Math.PI / 2; outline.push([vR - rr + Math.cos(t) * rr, h1 - rr + Math.sin(t) * rr]); }
      outline.push([vR, h0]);
      const lean = (h) => -0.07 * (h - h0) / (h1 - h0);
      const face = (u, k2 = 1, lo = h0, hi = h1) => outline.map(([vv, h]) => { const hm = lo + (h - h0) * (hi - lo) / (h1 - h0); return Q(u + lean(hm), vv * k2, hm); });
      const fa = face(-0.25), fb = face(-0.19), aFar = dOf(-0.25, 0) > dOf(-0.19, 0);
      const [far, near, uNear] = aFar ? [fa, fb, -0.19] : [fb, fa, -0.25];
      let band = '';
      for (let i = 0; i < outline.length - 1; i++) band += polyD([fa[i], fa[i + 1], fb[i + 1], fb[i]]);
      parts.push([dOf(-0.22, 0), `<path class="isl-kchair" d="${polyD(far)}"/><path class="isl-kchairs" d="${band}"/>`
        + `<path class="isl-kchair" d="${polyD(near)}"/><path class="isl-kpad" d="${polyD(face(uNear, 0.72, 0.56, 0.9))}"/>`]);
      // (2026-10-01, art-audit pass 4) A jacket left over the back: its body hangs down behind the back and its
      // sleeves beside it, showing past its sides in the back's shade, and its collar and shoulders fold over
      // the top toward the seat. Its two parts sort with the chair's own, so the back stands between them.
      if (coat) {
        const J = (u, pts) => polyD(pts.map(([vv, h]) => Q(u + lean(h), vv, h)));
        // (its shoulders round the back's corners, rr2 out from the back's own; the crest of the fold catches
        // the light; the collar's notch at the middle of the fold's edge)
        const arc = (rr2) => {
          const l = [];
          for (let i = 0; i <= 6; i++) { const t = Math.PI - (i / 6) * Math.PI / 2; l.push([vL + rr + Math.cos(t) * rr2, h1 - rr + Math.sin(t) * rr2]); }
          return [...l, ...l.map(([vv, h]) => [-vv, h]).reverse()];
        };
        const top = arc(rr + 0.025), crest = [...top, ...arc(rr + 0.008).reverse()];
        const hang = [[-0.22, 0.42], [-0.3, 0.5], [-0.3, 0.8], ...top, [0.3, 0.8], [0.3, 0.5], [0.22, 0.42]];
        const fold = [...top, [0.245, 0.79], [0.16, 0.835], [0.075, 0.885], [0, 0.855], [-0.075, 0.885], [-0.16, 0.835], [-0.245, 0.79]];
        const uB = -0.26, uF = -0.175;
        parts.push([dOf(uB, 0), `<g class="isl-lq" data-q="${coat}"><path class="isl-lbag1" d="${J(uB, hang)}"/><path class="isl-tdrop" d="${J(uB, hang)}"/></g>`]);
        parts.push([dOf(uF, 0), `<g class="isl-lq" data-q="${coat}"><path class="isl-lbag1" d="${J(uF, fold)}"/><path class="isl-lbagp" d="${J(uF, crest)}"/></g>`]);
      }
      parts.sort((p, q) => q[0] - p[0]);
      return `<ellipse class="isl-tdrop" cx="${F(shx)}" cy="${F(shy)}" rx="${F(shr)}" ry="${F(shq)}"/>` + parts.map((p) => p[1]).join('');
    };
    // (2026-10-01, art-audit pass 4) The room changes with the hour, as the library's tables do (DESIGN.md
    // 19.6): by Day the meeting is under way, so two chairs are pulled out and turned and the members' things
    // are spread on the table (a laptop, coffee, papers); at Sunset it has just ended, so one chair is left
    // pushed back, a cup is left behind and a jacket hangs over a chair; at Dawn, Dusk and Night the room is
    // tidy, set for the next meeting, as it had been in all five. The members themselves are not drawn: their
    // things keep the picture about the committee's work (the blind test, round 7). Each group carries the
    // versions it shows in (data-q: a Dawn, y Day, s Sunset, d Dusk, n Night; layout-art.css).
    const QS = {};
    const put = (q, svg) => { QS[q] = (QS[q] || '') + svg; };
    const flush = () => { const o = Object.keys(QS).map((q) => `<g class="isl-lq" data-q="${q}">${QS[q]}</g>`).join(''); for (const q in QS) delete QS[q]; return o; };
    // round the far side and at the ends, from the farthest; the near side is the viewer's place. By Day the
    // chairs at the far corners are pulled out and turned, as their members left them for a moment (25 cm
    // out and 20 degrees round: at 12 degrees, behind the table, they had read as set straight); at Sunset the
    // one at the left end is left pushed back, and a jacket hangs over the far right one.
    s += chair(90);
    put('asdn', chair(138)); put('y', chair(138, 1.8, 20)); s += flush();
    put('asdn', chair(42, 1.55, 0, 's')); put('y', chair(42, 1.8, -20)); s += flush();
    put('aydn', chair(180)); put('s', chair(180, 1.85, 15)); s += flush();
    s += chair(0);
    // 4. The table: its shadow on the floor, the pedestal and its foot, the rim's near half (darker), the
    //    top with an inset band and a little grain, the lamp's light pooled on it, the near edge catching it.
    const [tsx, tsy, tsr, tsq] = box(ring(0, D, 1.05, 0));
    s += `<ellipse class="isl-tdrop" cx="${F(tsx)}" cy="${F(tsy)}" rx="${F(tsr)}" ry="${F(tsq)}"/>`
      + `<path class="isl-lwood2" d="${polyD([P(-0.09, D, 0.68), P(0.09, D, 0.68), P(0.07, D, 0.04), P(-0.07, D, 0.04)])}${polyD(ring(0, D, 0.42, 0.04))}"/>`;
    const top = ring(0, D, R, 0.75), nearTop = ring(0, D, R, 0.75, Math.PI, 2 * Math.PI), nearBot = ring(0, D, R, 0.68, Math.PI, 2 * Math.PI);
    s += `<path class="isl-lwood2" d="${polyD([...nearTop, ...nearBot.reverse()])}"/><path class="isl-lwood" d="${polyD(top)}"/>`
      + `<path class="isl-kring" d="${polyD(ring(0, D, R * 0.9, 0.751))}" stroke-width="${F(Math.max(0.8, Y(0.008)))}"/>`;
    let grain = '';
    for (const [gr, t0, t1] of [[0.72, 0.35, 2.8], [0.5, 3.6, 5.7]]) grain += 'M' + ring(0, D, R * gr, 0.751, t0, t1, 16).map(([x, y]) => `${F(x)} ${F(y)}`).join('L');
    const [plx, ply, plr, plq] = box(ring(0, D, 0.85, 0.75));
    s += `<path class="isl-tgrain" d="${grain}" stroke-width="${F(Math.max(0.6, Y(0.005)))}"/>`
      + `<g class="isl-vlamps isl-vwin" style="--i:1">${pool(plx, ply, plr, plq, 0.55)}</g>`
      + `<path class="isl-ledge" d="M${nearTop.map(([x, y]) => `${F(x)} ${F(y)}`).join('L')}" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/>`;
    // 5. The places at the chairs: a sheet of paper lying on the table, a folded name card standing between
    //    it and the table's middle, facing the others, and a glass beside it; all in the camera, so the far
    //    places are smaller.
    let paper = '', cards = '', cardTop = '', glass = '';
    for (const a of [138, 90, 42, 180, 0]) {
      const ar = a * Math.PI / 180, ux = -Math.cos(ar), ud = -Math.sin(ar), vx = -ud, vd = ux;
      const at = (rad, u, vv) => [rad * Math.cos(ar) + u * ux + vv * vx, D + rad * Math.sin(ar) + u * ud + vv * vd];
      const pt = (rad, u, vv, h) => { const [x, d] = at(rad, u, vv); return P(x, d, h); };
      paper += polyD([pt(0.95, -0.15, -0.105, 0.752), pt(0.95, -0.15, 0.105, 0.752), pt(0.95, 0.15, 0.105, 0.752), pt(0.95, 0.15, -0.105, 0.752)]);
      const card = [pt(0.66, 0, -0.1, 0.75), pt(0.66, 0, 0.1, 0.75), pt(0.66, 0, 0.1, 0.83), pt(0.66, 0, -0.1, 0.83)];
      cards += polyD(card);
      cardTop += `M${F(card[3][0])} ${F(card[3][1])}L${F(card[2][0])} ${F(card[2][1])}`;
      const [gx, gd] = at(0.98, 0, 0.24), [gbx, gby] = P(gx, gd, 0.75), [, gty] = P(gx, gd, 0.87), gw = 0.036 * sc(gd);
      glass += `M${F(gbx - gw)} ${F(gby)}L${F(gbx - gw * 1.2)} ${F(gty)}H${F(gbx + gw * 1.2)}L${F(gbx + gw)} ${F(gby)}Z`;
    }
    // (2026-10-01, art-audit pass 4) The members' things, by version (see the chairs, above). A place's
    // frame, as in the loop: rad from the table's centre toward the place, u toward the centre, v across.
    const place = (a) => {
      const ar = a * Math.PI / 180, ux = -Math.cos(ar), ud = -Math.sin(ar), vx = -ud, vd = ux;
      const at = (rad, u, vv) => [rad * Math.cos(ar) + u * ux + vv * vx, D + rad * Math.sin(ar) + u * ud + vv * vd];
      return { at, pt: (rad, u, vv, h) => { const [x, d] = at(rad, u, vv); return P(x, d, h); } };
    };
    // By Day the paper at the far right place is fanned into three sheets, the two added ones under the
    // first and a shade duller, each sheet's edge marked by a thin shadow on the one below it (paper on paper
    // is otherwise one white shape).
    {
      const { pt } = place(42), sheet = (t, du, dv) => {
        const c = Math.cos(t * Math.PI / 180), sn = Math.sin(t * Math.PI / 180);
        return [[-0.15, -0.105], [-0.15, 0.105], [0.15, 0.105], [0.15, -0.105]].map(([u, vv]) => pt(0.95, u * c - vv * sn + du, u * sn + vv * c + dv, 0.752));
      };
      const lift = (pts) => polyD(pts.map(([x, y]) => [x + Math.max(0.4, Y(0.003)), y + Math.max(0.5, Y(0.004))]));
      const a1 = sheet(-18, 0.02, -0.17), a2 = sheet(14, -0.03, 0.16), a0 = sheet(0, 0, 0);
      put('y', `<path class="isl-lpageedge" d="${polyD(a1)}"/><path class="isl-tdrop" d="${lift(a2)}"/><path class="isl-lpageedge" d="${polyD(a2)}"/><path class="isl-tdrop" d="${lift(a0)}"/>`);
    }
    s += flush() + `<path class="isl-lpage" d="${paper}"/>`;
    // By Day a laptop open at the far place, seen from behind its lid, which leans back toward the viewer
    // from its hinge: the base on the table under it, the lid's back with its logo. Set left of the place's
    // middle, so the chair behind it still shows; under that place's name card, which stands nearer.
    {
      const { pt } = place(90), lv = -0.1, [, ld] = place(90).at(0.78, 0, lv), q4 = (r0, h0, r1, h1, w) => polyD([pt(r0, 0, lv - w, h0), pt(r0, 0, lv + w, h0), pt(r1, 0, lv + w, h1), pt(r1, 0, lv - w, h1)]);
      const [gx, gy] = pt(0.785, 0, lv, 0.87);
      put('y', `<path class="isl-lalu" d="${polyD([pt(0.82, 0, lv - 0.16, 0.765), pt(0.82, 0, lv + 0.16, 0.765), pt(1.04, 0, lv + 0.16, 0.765), pt(1.04, 0, lv - 0.16, 0.765)])}${q4(0.82, 0.751, 0.82, 0.765, 0.16)}"/>`
        + `<path class="isl-lbezel" d="${q4(0.82, 0.765, 0.745, 0.975, 0.155)}"/><circle class="isl-llogo" cx="${F(gx)}" cy="${F(gy)}" r="${F(Math.max(0.6, 0.014 * sc(ld)))}"/>`);
    }
    s += flush() + `<path class="isl-kcard" d="${cards}"/><path class="isl-kcardtop" d="${cardTop}" stroke-width="${F(Math.max(0.8, Y(0.006)))}"/><path class="isl-kglass" d="${glass}"/>`;
    // Coffee: by Day a cup at the far left place and one at the right end; at Sunset the far left one is
    // left behind. Each a small cylinder with its handle, sized by its depth, its shadow on the table.
    const cup = (a, rad, vv, hs) => {
      const [x, d] = place(a).at(rad, 0, vv), [mx, my] = P(x, d, 0.75), [, mt] = P(x, d, 0.84), mw = 0.04 * sc(d), mh = my - mt;
      return `<ellipse class="isl-tdrop" cx="${F(mx + hs * mw * 0.5)}" cy="${F(my)}" rx="${F(mw * 1.6)}" ry="${F(Math.max(0.6, mw * 0.35))}"/>`
        + `<path class="isl-lmug" d="M${F(mx - mw)} ${F(my)}V${F(mt)}H${F(mx + mw)}V${F(my)}Z"/>`
        + `<path class="isl-lmugh" d="M${F(mx + hs * mw)} ${F(mt + mh * 0.22)}q${F(hs * mw * 0.85)} ${F(mh * 0.22)} 0 ${F(mh * 0.5)}" stroke-width="${F(Math.max(0.7, 0.014 * sc(d)))}"/>`;
    };
    put('ys', cup(138, 0.92, -0.26, -1));
    put('y', cup(0, 0.92, -0.25, 1));
    s += flush();
    // the minutes: three closed folders stacked toward the back, each with its tab on the far edge
    for (const [kk, cls] of [[0, 'isl-lbk2'], [1, 'isl-lbk3'], [2, 'isl-lred']]) {
      const h = 0.752 + kk * 0.022, fx = -0.34 + (kk - 1) * 0.015, fd = D + 0.1;
      const q = [P(fx - 0.17, fd - 0.12, h + 0.02), P(fx + 0.17, fd - 0.12, h + 0.02), P(fx + 0.17, fd + 0.12, h + 0.02), P(fx - 0.17, fd + 0.12, h + 0.02)];
      s += `<path class="${cls}" d="${polyD([P(fx - 0.17, fd - 0.12, h), P(fx + 0.17, fd - 0.12, h), q[1], q[0]])}"/><path class="isl-tdrop" d="${polyD([P(fx - 0.17, fd - 0.12, h), P(fx + 0.17, fd - 0.12, h), q[1], q[0]])}"/>`
        + `<path class="${cls}" d="${polyD(q)}${polyD([P(fx + 0.02, fd + 0.12, h + 0.02), P(fx + 0.09, fd + 0.12, h + 0.02), P(fx + 0.09, fd + 0.15, h + 0.02), P(fx + 0.02, fd + 0.15, h + 0.02)])}"/>`;
    }
    // the jug of water beside them
    {
      const jd = D + 0.12, [jx, jy] = P(0.42, jd, 0.75), js = sc(jd);
      s += `<path class="isl-kglass" d="M${F(jx - 0.065 * js)} ${F(jy)}L${F(jx - 0.075 * js)} ${F(jy - 0.2 * js)}Q${F(jx)} ${F(jy - 0.25 * js)} ${F(jx + 0.09 * js)} ${F(jy - 0.235 * js)}L${F(jx + 0.075 * js)} ${F(jy - 0.2 * js)}L${F(jx + 0.065 * js)} ${F(jy)}Z"/>`
        // (its handle opposite its spout; both had been on the right)
        + `<path class="isl-kglassh" d="M${F(jx - 0.075 * js)} ${F(jy - 0.18 * js)}q${F(-0.08 * js)} ${F(0.025 * js)} ${F(-0.01 * js)} ${F(0.13 * js)}" stroke-width="${F(Math.max(1, 0.022 * js))}"/>`;
    }
    // the open folder at the viewer's own place, the near side: its two leaves, the minutes on the right,
    // their lines, and a pen
    {
      const od = D - 0.72, q = (x, dd) => P(x, od + dd, 0.753);
      s += `<path class="isl-lbk3" d="${polyD([q(-0.23, -0.16), q(0.23, -0.16), q(0.23, 0.16), q(-0.23, 0.16)])}"/>`
        + `<path class="isl-lpage" d="${polyD([q(0.01, -0.145), q(0.215, -0.145), q(0.215, 0.145), q(0.01, 0.145)])}"/>`;
      let lines = '';
      for (let l = 0; l < 5; l++) { const dd = 0.11 - l * 0.055, [xa, ya] = q(0.04, dd), [xb] = q(0.04 + 0.15 - (l % 2) * 0.05, dd); lines += `M${F(xa)} ${F(ya)}H${F(xb)}`; }
      const [pa, pb] = [q(-0.18, -0.03), q(-0.02, 0.02)];
      s += `<path class="isl-ltext" d="${lines}" stroke-width="${F(Math.max(0.7, Y(0.006)))}" stroke-opacity=".7"/>`
        + `<path class="isl-tiron" d="M${F(pa[0])} ${F(pa[1])}L${F(pb[0])} ${F(pb[1])}" stroke-width="${F(Math.max(1.2, 0.012 * sc(od)))}" stroke-linecap="round"/>`;
    }
    // 6. The lamp over the table, its rim 1.7 m up: a wide shade on its rod from the ceiling, whose lit
    //    underside (seen from below, the eye being lower), halo and cone of light show from Dawn to Night,
    //    its light falling on the table.
    const [lcx, lTop] = P(0, D, 1.9), [, lBot] = P(0, D, 1.7), lt = 0.08 * sc(D), lb = 0.28 * sc(D);
    const under = ring(0, D, 0.27, 1.7);
    s += `<g class="isl-vlamps isl-vwin" style="--i:1">${halo(lcx, lBot, 0.5 * sc(D), 'islvbulb')}<path d="${polyD([[lcx - lb, lBot], [lcx + lb, lBot], ...ring(0, D, 0.95, 0.75, 2 * Math.PI, Math.PI, 12)])}" fill="url(#islvspill)" opacity=".6"/></g>`;
    s += `<path class="isl-tiron" d="${rect(lcx - 1, -2, 2, lTop + 2)}"/>`
      + `<path class="isl-cshade" d="M${F(lcx - lt)} ${F(lTop)}H${F(lcx + lt)}L${F(lcx + lb)} ${F(lBot)}H${F(lcx - lb)}Z"/>`
      + `<path class="isl-lbronze" d="${rect(lcx - lb, lBot - Y(0.008), 2 * lb, Y(0.008))}"/>`
      // (its opening, seen from below as the camera requires, dark by Day; lit from Dawn to Night over it)
      + `<path class="isl-cshade" d="${polyD(under)}"/><path class="isl-tdrop" d="${polyD(under)}"/>`
      + `<g class="isl-vlamps isl-vwin" style="--i:1"><path class="isl-tbulb" d="${polyD(under)}"/></g>`;
    return `<g style="--isl-vstep:.45s">${s}</g>`;
  }

  /* THE WAY IN (the Accessibility page's head; owner, 2026-09-29: art tied to the title at a glance): a
     building's entrance with a way in for everyone. A wide glazed double door under a canopy, lit from
     within, its light on the landing in front of it; steps climbing to the landing from the right and,
     from the left, a long gentle ramp at 1 in 12 along the front of the building, its handrail carried on
     level past its foot and open in front of the door; small lights set in the ramp's side; the blue sign
     with the symbol of access hung high on the street lamp at the ramp's foot, clear of anyone passing;
     the building's windows in bays centred on the door; palms, a planter; the sea and a far headland
     beyond the low wall at the left, where the Sun sets, the Moon in the sky above. The page has no kind,
     so no page hue. In the one pass the street lamp lights, then the ramp's lights from its foot to the
     landing, the windows, the lanterns by the door, and the doorway last (reviewed 2026-09-30 by blind
     "which page is this?" tests and a craft and five-versions check before the owner saw it). */
  const WAYIN_SUN = '18:26', WAYIN_HZ = 0.62;
  function wayIn(W, H, v) {
    const y0 = v.y0, X = (k) => k * W, Y = (k) => k * H, r = rng(2310);
    let s = '';
    const street = Y(0.86);
    // 1. Beyond: a far headland on the horizon at the left, mist at its foot, a few lights on its slopes
    //    (each below the crest at its place).
    const head = [[-0.02, 0.015], [0.06, 0.05], [0.13, 0.075], [0.2, 0.06], [0.27, 0.03], [0.34, 0.01], [0.4, 0]].map(([x, h]) => [X(x), y0 - Y(h)]);
    const crestAt = (x) => { for (let i = 0; i < head.length - 1; i++) { const [xa, ya] = head[i], [xb, yb] = head[i + 1]; if (x >= xa && x <= xb) return y0 - (ya + (yb - ya) * (x - xa) / (xb - xa)); } return 0; };
    const farLand = `<path class="f-isl" d="${polyD([[X(-0.02), y0 + 1], ...head, [X(0.4), y0 + 1]])}${scrubLine(head, 2, 0.5, 1.1, r)}"/>`;
    s += farLand + `<path class="s-rim" d="${lineD(head.map(([x, y]) => [x, y + 0.5]))}" stroke-width="1" stroke-opacity=".3"/>` + mirrored(y0, farLand, 0.16) + mist(X(-0.03), y0, X(0.44), Y(0.05), 0.45);
    const far = [];
    for (let i = 0; i < 5; i++) { const x = X(0.02 + r() * 0.3); far.push([x, y0 - crestAt(x) * (0.2 + r() * 0.55)]); }
    s += `<path class="s-vlight isl-vwin" style="--i:0" d="${lightsD(far)}" stroke-width="1.3"/>`;
    // by Day, the houses those lights belong to, where a roof stays under the headland's crest
    s += makeKit(W, H).dayHouses(far.filter(([x, y]) => crestAt(x) - (y0 - y) > Y(0.017)), Y(0.012), 97);
    for (const [x] of far) s += dashes(streakList(x, y0 + 1, H, r, 0.05, 0.05), 's-vglow', 1, [0.06, 0.12, 0.22]);
    // 2. The low sea wall along the back of the square, its coping lit; the square's paving, solid ground.
    const wT = Y(0.77);
    s += `<path d="${rect(-2, wT, W + 4, street - wT + 1)}" fill="url(#islvfacade)"/><path class="isl-vstone" d="${rect(-2, wT - Y(0.012), W + 4, Y(0.016))}"/>`;
    let wj = '';
    for (let x = X(0.01); x < W; x += Y(0.11)) wj += `M${F(x)} ${F(wT + Y(0.004))}V${F(street)}`;
    s += `<path class="isl-vcourse" d="${wj}M-2 ${F(wT + Y(0.045))}H${F(W + 2)}" stroke-width=".7"/>`;
    s += `<path class="isl-apave" d="${rect(-2, street, W + 4, H - street + 2)}"/>`;
    let pav = '';
    for (let y = street + Y(0.035); y < H; y += Y(0.04) + (y - street) * 0.2) pav += `M-2 ${F(y)}H${F(W + 2)}`;
    for (let x = -r() * 10; x < W; x += Y(0.09)) pav += `M${F(x)} ${F(street)}l${F((x - W * 0.5) * 0.08)} ${F(H - street)}`;
    s += `<path class="isl-vcourse" d="${pav}" stroke-width=".7" stroke-opacity=".5"/>`;
    // 3. The building: two storeys of stone at the right, its ground floor rusticated and finer courses
    //    above, quoins up the exposed corner, a string course, the parapet's coping catching the last
    //    light. Seen straight on, it shows no side: its quoins make the corner (art-audit wave 1, 2026-10-01: a
    //    shaded strip of side had shown at its left end, against the ruling for buildings seen straight on).
    const b0 = X(0.4), bTop = Y(0.14), mid = Y(0.4), land = street - Y(0.09);
    s += `<path d="${rect(b0, bTop, W - b0 + 2, street - bTop + 1)}" fill="url(#islvfacade)"/>`;
    let rust = '', fine = '';
    for (let y = mid + Y(0.05); y < street - Y(0.01); y += Y(0.05)) rust += `M${F(b0 + Y(0.035))} ${F(y)}H${F(W + 2)}`;
    for (let y = bTop + Y(0.06); y < mid - Y(0.01); y += Y(0.035)) fine += `M${F(b0 + Y(0.035))} ${F(y)}H${F(W + 2)}`;
    s += `<path class="isl-vcourse" d="${rust}" stroke-width=".8"/><path class="isl-vcourse" d="${fine}" stroke-width=".5" stroke-opacity=".3"/>`;
    let quoins = '';
    for (let k = 0, y = street; y > bTop + Y(0.04); y -= Y(0.045), k++) quoins += rect(b0 + Y(0.035), y - Y(0.045) + 1.2, k % 2 ? Y(0.04) : Y(0.065), Y(0.045) - 1.2);
    s += `<path class="isl-vstone" d="${quoins}"/>`
      + `<path class="isl-vstone" d="${rect(b0 - Y(0.012), bTop - Y(0.03), W - b0 + 14, Y(0.03))}${rect(b0, mid - Y(0.008), W - b0 + 2, Y(0.018))}"/>`
      + `<path class="isl-vpshade" d="${rect(b0, bTop, W - b0 + 2, Y(0.02))}"/>`
      + `<path class="s-rim" d="M${F(b0 - Y(0.012))} ${F(bTop - Y(0.03) + 0.5)}H${F(W + 2)}" stroke-width="1.2" stroke-opacity=".45"/>`;
    // the door's bay: the entrance at the middle of the landing, which runs from lx0 to lx1; the windows
    // in bays measured out from the door, so one stands centred over it; on the ground floor tall windows
    // from the door's head nearly to the floor, either side of the door
    const lx0 = X(0.56), lx1 = Math.min(X(0.76), lx0 + Y(0.78)), dx = (lx0 + lx1) / 2, dw = Y(0.22), dT = land - Y(0.25);
    const pitch = Y(0.3), ww = Y(0.14), bays = [];
    for (let k = -9; k <= 9; k++) { const x = dx + k * pitch - ww / 2; if (x > b0 + Y(0.1) && x + ww < W - Y(0.02)) bays.push([k, x]); }
    // The offices by the hour (art-audit pass 4, 2026-10-01, by version; the owner, 2026-10-01: what is drawn may
    // change between versions with a reason). The same rooms had been lit at Dawn, at Sunset, at Dusk and at ten
    // at night, so the front never told the hour; now lights go on as people arrive and off as they go home.
    // Every opening is glass first (isl-vdark), so a room left dark in a version still shows its window, and by
    // Day every opening is one daylight glass, as the door is. Then each room is lit in the versions someone is
    // in it, counted from the door (k), so at a narrower card, with fewer bays, the end rooms keep their parts:
    // '*' the hall over the door and the ground-floor office at the right-hand end (the security office), which
    // stay lit all night, so they are the Night set, drawn in every version and keeping Night dark; 'as' the top
    // floor's right-hand end room, the first the cleaner opens at Dawn, still lit at Sunset; 'sd' the room left
    // of the hall and the one beyond the empty room right of it, people working late; 's' the rooms further left
    // upstairs and every ground-floor room left of the door, lit only at Sunset, the end of the working day; ''
    // the room right of the hall and the other ground-floor rooms right of the door, empty, dark in every
    // version. At 1920 Dawn has three lit, Sunset seven of nine, Dusk four, Night two.
    const gnd = (x) => x + ww < dx - dw / 2 - Y(0.12) || x > dx + dw / 2 + Y(0.12);
    const kTop = bays[bays.length - 1][0], kGnd = Math.max(...bays.filter(([, x]) => gnd(x)).map(([k]) => k));
    const upQ = (k) => (k === 0 ? '*' : k === kTop ? 'as' : k === 1 ? '' : k < -1 ? 's' : 'sd');
    const gQ = (k) => (k === kGnd ? '*' : k < 0 ? 's' : '');
    const Q = {};
    let lit = '', glass = '', bars = '', heads = '', sills = '';
    const put = (q, d) => { glass += d; if (q === '*') lit += d; else if (q) Q[q] = (Q[q] || '') + d; };
    for (const [k, x] of bays) {
      put(upQ(k), rect(x, bTop + Y(0.05), ww, Y(0.16)));
      bars += `M${F(x + ww / 2)} ${F(bTop + Y(0.05))}v${F(Y(0.16))}`;
      heads += rect(x, bTop + Y(0.05), ww, Y(0.014));
      sills += rect(x - Y(0.012), bTop + Y(0.21), ww + Y(0.024), Y(0.014));
      if (gnd(x)) {
        put(gQ(k), rect(x, dT, ww, land - Y(0.03) - dT));
        bars += `M${F(x + ww / 2)} ${F(dT)}V${F(land - Y(0.03))}M${F(x)} ${F(dT + Y(0.06))}h${F(ww)}`;
        heads += rect(x, dT, ww, Y(0.016));
        sills += rect(x - Y(0.012), land - Y(0.03), ww + Y(0.024), Y(0.014));
      }
    }
    s += `<path class="isl-vdark" d="${glass}"/><g class="isl-lq" data-q="y"><path class="f-pulse" d="${glass}"/></g>`
      + `<path class="f-pulse isl-vwin" style="--i:5" d="${lit}"/>`
      + Object.entries(Q).map(([q, d]) => `<g class="isl-lq" data-q="${q}"><path class="f-pulse isl-vwin" style="--i:5" d="${d}"/></g>`).join('')
      + `<path class="isl-vmul" d="${bars}" stroke-width=".9"/>`
      + `<path class="isl-vpshade" d="${heads}"/><path class="isl-vstone" d="${sills}"/>`;
    // 4. The entrance: a canopy on two tie rods over a wide glazed double door; the door lit within, its
    //    darker frame, the meeting stiles and a pull handle on each leaf; a lantern either side under the
    //    canopy; the canopy's underside lit by the door (shaded by Day).
    const c0 = dx - dw / 2 - Y(0.08), c1 = dx + dw / 2 + Y(0.08), cT = dT - Y(0.045);
    // (the door's glass is its own lit element, so while it waits its turn it is dark glass, not a faint
    // glow; its wash on the wall and the canopy's lit underside come on with it)
    s += `<g class="isl-vwin" style="--i:7"><ellipse cx="${F(dx)}" cy="${F(land - Y(0.1))}" rx="${F(Y(0.55))}" ry="${F(Y(0.26))}" fill="url(#islvwarm)"/>`
      + `<path d="${rect(c0, cT + Y(0.03), c1 - c0, Y(0.05))}" fill="url(#islvspill)"/></g>`
      + `<path class="f-pulse isl-vwin isl-vlast" style="--i:7" d="${rect(dx - dw / 2, dT, dw, land - dT)}"/>`;
    s += `<path class="isl-aframe" d="${rect(dx - dw / 2, dT, dw, land - dT)}M${F(dx)} ${F(dT)}V${F(land)}M${F(dx - dw / 2)} ${F(dT + Y(0.045))}H${F(dx + dw / 2)}" stroke-width="${F(Math.max(1.4, Y(0.013)))}"/>`
      + `<path class="isl-aframe" d="M${F(dx - Y(0.02))} ${F(dT + Y(0.11))}v${F(Y(0.08))}M${F(dx + Y(0.02))} ${F(dT + Y(0.11))}v${F(Y(0.08))}" stroke-width="${F(Math.max(1.4, Y(0.013)))}"/>`;
    s += `<path class="isl-arail" d="M${F(c0 + Y(0.012))} ${F(cT)}L${F(c0 + Y(0.07))} ${F(cT - Y(0.07))}M${F(c1 - Y(0.012))} ${F(cT)}L${F(c1 - Y(0.07))} ${F(cT - Y(0.07))}" stroke-width="1"/>`
      + `<path class="isl-vstone" d="${rect(c0, cT, c1 - c0, Y(0.03))}"/><path class="isl-vpshade isl-ydet" d="${rect(c0, cT + Y(0.03), c1 - c0, Y(0.016))}"/>`;
    for (const sd of [-1, 1]) {
      const lx = dx + sd * (dw / 2 + Y(0.045)), lyy = dT + Y(0.05);
      s += `<g class="isl-vwin" style="--i:6">${halo(lx, lyy, Y(0.11))}<path class="f-pulse isl-ltframe" d="${rect(lx - Y(0.013), lyy - Y(0.028), Y(0.026), Y(0.046))}"/></g>`
        + panes(lx - Y(0.013), lyy - Y(0.028), Y(0.026), Y(0.046))
        + `<path class="isl-vpost isl-lcap" d="${rect(lx - Y(0.019), lyy - Y(0.037), Y(0.038), Y(0.011))}"/><path class="isl-vpost" d="${rect(lx - Y(0.017), lyy + Y(0.018), Y(0.034), Y(0.009))}"/>`;
    }
    // the door's light on the square below the landing
    s += `<g class="isl-vwin" style="--i:7"><path d="${polyD([[dx - dw * 0.8, street], [dx + dw * 0.8, street], [dx + dw * 1.6, street + Y(0.12)], [dx - dw * 1.6, street + Y(0.12)]])}" fill="url(#islvspill)" opacity=".8"/></g>`;
    // 5. The landing, the steps up to it from the right and the ramp from the left: one poured concrete
    //    form, cooler than the building's stone so it reads against the wall; each tread's edge lit, each
    //    riser in shade, the ramp's edge lit; a shadow line where it meets the square.
    const nSt = 4, rise = (street - land) / nSt, run = Y(0.06);
    let body = [[lx0, land], [lx1, land]], treads = `M${F(lx0)} ${F(land)}H${F(lx1)}`, risers = '';
    let x = lx1, y = land;
    for (let i = 0; i < nSt; i++) {
      risers += `M${F(x)} ${F(y)}V${F(y + rise)}`;
      y += rise; body.push([x, y]);
      treads += `M${F(x)} ${F(y)}H${F(x + run)}`;
      x += run; body.push([x, y]);
    }
    const sx1 = x;
    // the ramp rises the landing's height over twelve times its length (1 in 12, a ramp's usual slope),
    // shortened only where a narrow card leaves no room
    const rx0 = Math.max(X(0.12), lx0 - (street - land) * 12), slope = (land - street) / (lx0 - rx0);
    body = [[rx0, street], ...body, [sx1, street]];
    s += `<path class="isl-aramp" d="${polyD(body)}"/><path class="isl-vpshade" d="${rect(rx0, street - Y(0.008), sx1 - rx0, Y(0.01))}"/>`;
    s += `<path class="isl-vstep-edge" d="${treads}M${F(rx0)} ${F(street)}L${F(lx0)} ${F(land)}" stroke-width="${F(Math.max(1.6, Y(0.01)))}"/>`
      + `<path class="isl-vstep-rise" d="${risers}" stroke-width="${F(Math.max(1, Y(0.005)))}"/>`
      + `<g class="isl-vwin" style="--i:7"><path class="s-vglow" d="M${F(lx0)} ${F(land + 0.5)}H${F(lx1)}" stroke-width="${F(Math.max(1.2, Y(0.008)))}" stroke-opacity=".6"/></g>`;
    // 6. The handrail: one rail along the ramp, across the landing's edge to the posts beside the door,
    //    open in front of the door, on from there down the steps, carried on level past the ramp's foot and
    //    the steps' foot; posts along it. Small lights set in the ramp's side at its posts, lighting from
    //    its foot to the landing.
    const hr = Y(0.115), ext = Y(0.07), dl = dx - dw / 2 - Y(0.07), dr = dx + dw / 2 + Y(0.07);
    const nP = Math.max(3, Math.round((lx0 - rx0) / Y(0.3)));
    let posts = '';
    for (let i = 0; i <= nP; i++) { const px2 = rx0 + (lx0 - rx0) * i / nP, py = street + (px2 - rx0) * slope; posts += `M${F(px2)} ${F(py)}V${F(py - hr)}`; }
    for (const px2 of [dl, dr, lx1]) posts += `M${F(px2)} ${F(land)}V${F(land - hr)}`;
    posts += `M${F(sx1)} ${F(street)}V${F(street - hr)}M${F(rx0 - ext)} ${F(street)}V${F(street - hr)}M${F(sx1 + ext)} ${F(street)}V${F(street - hr)}`;
    const rail = `M${F(rx0 - ext)} ${F(street - hr)}H${F(rx0)}L${F(lx0)} ${F(land - hr)}H${F(dl)}M${F(dr)} ${F(land - hr)}H${F(lx1)}L${F(sx1)} ${F(street - hr)}H${F(sx1 + ext)}`;
    for (let i = 1; i < nP; i++) {
      const qx = rx0 + (lx0 - rx0) * i / nP + Y(0.03), qy = street + (qx - rx0) * slope;
      s += `<g class="isl-vwin" style="--i:${i}">${pool(qx, street + Y(0.015), Y(0.07), Y(0.016), 0.6)}<path class="f-pulse" d="${rect(qx - Y(0.012), qy + Y(0.012), Y(0.024), Y(0.009))}"/></g>`;
    }
    // The ramp by the hour (art-audit wave 1, by version; the owner, 2026-10-01: what is drawn may change between
    // versions with a reason): at Dawn someone opening up, a hand on the door's handle; by Day a wheelchair user
    // going up the ramp; at Sunset going home, down it; after hours, at Dusk and Night, no one. Drawn before the
    // rail, so the near rail crosses in front of them.
    {
      const at = (t) => { const qx = rx0 + (lx0 - rx0) * t; return [qx, street + (qx - rx0) * slope]; };
      const ang = Math.atan(slope) * 180 / Math.PI, u = Y(0.16);
      const [ux, uy] = at(0.45), [dx2, dy2] = at(0.18);
      s += `<g class="isl-bfig"><g class="isl-lq" data-q="y"><g transform="translate(${F(ux)} ${F(uy)}) rotate(${F(ang)})">${chairUser(u)}</g></g>`
        + `<g class="isl-lq" data-q="s"><g transform="translate(${F(dx2)} ${F(dy2)}) rotate(${F(ang)}) scale(-1 1)">${chairUser(u)}</g></g>`
        + `<g class="isl-lq" data-q="a">${person(dx - dw * 0.22, land, Y(0.21), { shirt: '#e8e2d4', legs: '#2f3a4a', reach: [dx - Y(0.02), dT + Y(0.15)] })}</g></g>`;
    }
    s += `<path class="isl-arail" d="${posts}" stroke-width="${F(Math.max(1, Y(0.008)))}"/><path class="isl-arail" d="${rail}" stroke-width="${F(Math.max(1.2, Y(0.01)))}"/>`;
    // 7. The planter by the steps and its palm; the street lamp at the ramp's foot, kept clear of the card's
    //    edge, and the left palm only where it clears the lamp; the sign hung on the lamp's post under the
    //    lantern, above head height and against the sky: a blue panel with the symbol of access, a person
    //    in a wheelchair, and an arrow toward the ramp.
    const pl0 = sx1 + ext + Y(0.05), ph = Y(0.5), ss = Y(0.15);
    const px = Math.max(ss * 0.8 + Y(0.03), rx0 - ext - Y(0.2));
    s += palmsD([[px - Y(0.42), street + Y(0.02), Y(0.72), 0.06, 23], [pl0 + Y(0.3), street - Y(0.05), Y(0.7), -0.1, 29]].filter(([x2], i) => (i === 0 ? x2 > -Y(0.1) : x2 < W - Y(0.05))), 'isl-palm');
    // (the planter poured in the entrance's concrete, its lip lit and its foot in shadow: in the wall's own
    // stone it had no edge, and the shrubs had seemed to sit on a ledge of the building)
    s += `<path class="isl-aramp" d="${rect(pl0, street - Y(0.06), W, Y(0.06))}"/>`
      + `<path class="isl-vstep-edge" d="M${F(pl0)} ${F(street - Y(0.06))}H${F(W + 2)}" stroke-width="${F(Math.max(1.6, Y(0.01)))}"/><path class="isl-vpshade" d="${rect(pl0, street - Y(0.008), W, Y(0.01))}"/>`
      + shrubs([[pl0 + Y(0.08), street - Y(0.06), Y(0.07)], [pl0 + Y(0.24), street - Y(0.06), Y(0.08)], [pl0 + Y(0.4), street - Y(0.06), Y(0.07)]].filter(([x2]) => x2 < W + Y(0.05)), r);
    s += `<g class="isl-vwin" style="--i:0">${pool(px, street + Y(0.05), Y(0.3), Y(0.06), 0.8)}${halo(px, street - ph - Y(0.03), Y(0.2))}`
      + `<path class="f-pulse isl-ltframe" d="${rect(px - Y(0.02), street - ph - Y(0.06), Y(0.04), Y(0.055))}"/></g>`;
    // The bench by the sea wall, and who is there by the hour (art-audit pass 4, 2026-10-01; the owner, 2026-10-01:
    // what is drawn may change between versions with a reason). The square by the sea had been empty at every hour.
    // A slatted bench on two iron ends stands on the paving at the wall's foot, in the street lamp's pool between
    // the left palm and the lamp, its back to the viewer, so whoever sits on it faces the sea; it is there in all
    // five, left out only where a narrow card puts the lamp near its edge and leaves no room for the bench whole
    // (in a window 1280 or 1120 px wide, for example). Who is there answers the hour (by version): at Sunset two people sit on it
    // watching the Sun go down, one leaning toward the other, and they stay on under the lamp at Dusk; at Dawn a
    // walker passes before the heat; by Day nobody sits in the full sun, and at Night the waterfront is empty.
    // Drawn after the lamp's pool, so it stands in it, and before the post. The people are at the scale of the
    // person at the door (a standing adult Y(0.21), person()'s proportions), a sitter's crown at the wheelchair
    // user's height (chairUser's u, Y(0.16)); person() has no seated or side-on pose, so they are drawn here, in
    // literal colours dimmed by version (isl-bfig). The lamp's warm light (isl-mlit) falls on the bench's top
    // edges and on each person's side toward it from Dawn to Night, not by Day, when the lamp is out. No random
    // draws, so nothing else moves.
    {
      const gy = street + Y(0.02), b0 = px - Y(0.3), b1 = px - Y(0.08), h = Y(0.21), hr = h * 0.075, sw = h * 0.13;
      const seat = gy - Y(0.055), sT = gy - Y(0.106), sl = Y(0.009), sg = Y(0.0055), ir = Math.max(1, Y(0.008));
      const lw = F(Math.max(0.8, Y(0.005))), lamp = (d) => `<g class="isl-vlamps isl-vwin" style="--i:0"><path class="isl-mlit" d="${d}" stroke-width="${lw}"/></g>`;
      // A sitter seen from behind (x the middle, the lamp to the right): the lower legs under the seat, then the
      // body sitting on it (the shirt to the seat, the upper arms hanging to the elbows, the neck, the head), then
      // the seat slat across the body's foot, so it sits on the seat and a leaning body is cut cleanly there, then
      // the bench's back across it, so the head and shoulders show above the top slat against the sea and the shirt
      // between the slats. `lean` turns the body about the seat, the lamp's light on it turned with it.
      const sitter = (x, { shirt, legs, skin, hair, lean = 0 }) => {
        const ct = seat - h * 0.52, hy = ct + hr, rot = (o) => (lean ? `<g transform="rotate(${lean} ${F(x)} ${F(seat)})">${o}</g>` : o);
        return {
          legs: `<path fill="${legs}" d="${rect(x - sw * 0.62, seat, sw * 0.5, gy - seat - h * 0.02)}${rect(x + sw * 0.12, seat, sw * 0.5, gy - seat - h * 0.02)}"/>`
            + `<path fill="#3a2e24" d="${rect(x - sw * 0.68, gy - h * 0.03, sw * 0.62, h * 0.03)}${rect(x + sw * 0.06, gy - h * 0.03, sw * 0.62, h * 0.03)}"/>`,
          body: rot(`<path fill="${shirt}" d="M${F(x - sw * 0.88)} ${F(seat + h * 0.015)}L${F(x - sw)} ${F(ct + h * 0.22)}Q${F(x - sw)} ${F(ct + h * 0.16)} ${F(x - sw * 0.6)} ${F(ct + h * 0.15)}H${F(x + sw * 0.6)}Q${F(x + sw)} ${F(ct + h * 0.16)} ${F(x + sw)} ${F(ct + h * 0.22)}L${F(x + sw * 0.88)} ${F(seat + h * 0.015)}Z`
            + `${rect(x - sw * 1.05, ct + h * 0.2, sw * 0.24, h * 0.2)}${rect(x + sw * 0.81, ct + h * 0.2, sw * 0.24, h * 0.2)}"/>`
            + `<path fill="${skin}" d="${rect(x - hr * 0.45, hy + hr * 0.6, hr * 0.9, h * 0.07)}"/><circle fill="${hair}" cx="${F(x)}" cy="${F(hy)}" r="${F(hr)}"/>`),
          rim: rot(lamp(`M${F(x + hr * 0.15)} ${F(hy - hr * 0.99)}A${F(hr)} ${F(hr)} 0 0 1 ${F(x + hr * 0.97)} ${F(hy + hr * 0.25)}`
            + `M${F(x + sw * 0.6)} ${F(ct + h * 0.15)}Q${F(x + sw * 1.05)} ${F(ct + h * 0.16)} ${F(x + sw * 1.05)} ${F(ct + h * 0.22)}V${F(sT - Y(0.004))}`)),
        };
      };
      if (b0 >= Y(0.02)) {
        // the two at Sunset and Dusk, a little apart on the bench, the one nearer the lamp leaning toward the other
        const pr = [sitter(b0 + (b1 - b0) * 0.33, { shirt: '#d8cdb6', legs: '#3a3f4a', skin: '#6b4630', hair: '#1d1916' }),
          sitter(b0 + (b1 - b0) * 0.65, { shirt: '#7d9bb8', legs: '#4a3f3a', skin: '#a06a48', hair: '#3b2a20', lean: -10 })];
        let back = '';
        for (let i = 0; i < 3; i++) back += rect(b0, sT + i * (sl + sg), b1 - b0, sl);   // the back's three slats
        let ends = '';
        for (const xe of [b0 + Y(0.014), b1 - Y(0.014)]) ends += rect(xe - ir / 2, sT - Y(0.004), ir, gy - sT + Y(0.004)) + rect(xe - ir * 1.4, gy - Y(0.005), ir * 2.8, Y(0.005));   // an iron end and its foot
        s += `<ellipse class="isl-vpshade" cx="${F((b0 + b1) / 2)}" cy="${F(gy)}" rx="${F((b1 - b0) / 2 + Y(0.012))}" ry="${F(Y(0.007))}"/>`   // its shadow on the paving
          + `<g class="isl-bfig"><g class="isl-lq" data-q="sd">${pr[0].legs}${pr[1].legs}${pr[0].body}${pr[1].body}</g><path class="isl-bbench" d="${rect(b0 + Y(0.004), seat, b1 - b0 - Y(0.008), Y(0.008))}"/></g>`
          + lamp(`M${F(b0 + Y(0.004))} ${F(seat)}H${F(b1 - Y(0.004))}`)   // (the seat's lit edge)
          + `<g class="isl-bfig"><path class="isl-bbench" d="${back}"/><path class="isl-vpost" d="${ends}"/></g>`
          + lamp(`M${F(b0)} ${F(sT)}H${F(b1)}`)
          + `<g class="isl-lq" data-q="sd">${pr[0].rim}${pr[1].rim}</g>`;
      }
      // The walker at Dawn, side on, in mid-stride toward the right, in the middle of the paving between the lamp
      // and the rail's level end (where the narrowest card leaves no room there, on the lamp's other side): the far
      // arm and leg first, a shade darker, then the shirt, the shorts, the near leg forward and the near arm back,
      // the head, the trainers; a contact shadow under the feet.
      const re = rx0 - ext, wx = re - px >= Y(0.14) ? (px + re) / 2 : px - Y(0.09), wy = street + Y(0.025);
      const cx = wx + h * 0.012, cy = wy - h + hr, sd = wx > px ? -1 : 1, hip = [wx, wy - h * 0.47], sh = [wx + h * 0.005, wy - h * 0.8];
      const limb = (pts, col, wd) => `<path fill="none" stroke="${col}" stroke-width="${F(wd)}" stroke-linecap="round" stroke-linejoin="round" d="M${pts.map(([a, b]) => `${F(a)} ${F(b)}`).join('L')}"/>`;
      const fLeg = [hip, [wx - h * 0.06, wy - h * 0.25], [wx - h * 0.14, wy - h * 0.065]], nLeg = [hip, [wx + h * 0.075, wy - h * 0.25], [wx + h * 0.15, wy - h * 0.04]];
      const fArm = [sh, [wx + h * 0.063, wy - h * 0.64], [wx + h * 0.155, wy - h * 0.53]], nArm = [sh, [wx - h * 0.067, wy - h * 0.646], [wx - h * 0.105, wy - h * 0.5]];
      const along = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
      let wk = `<ellipse class="isl-vpshade" cx="${F(wx)}" cy="${F(wy)}" rx="${F(h * 0.2)}" ry="${F(Y(0.006))}"/><g class="isl-bfig">`;
      wk += limb(fArm, '#6e4430', h * 0.042) + limb([sh, along(sh, fArm[1], 0.55)], '#2b6b66', h * 0.06)   // the far arm, forward, its sleeve
        + limb(fLeg, '#6e4430', h * 0.05) + limb([hip, along(hip, fLeg[1], 0.7)], '#232c39', h * 0.075)   // the far leg, back, its shorts
        + limb([[wx - h * 0.165, wy - h * 0.06], [wx - h * 0.1, wy - h * 0.008]], '#b9bec4', h * 0.035);   // its trainer, toe down
      wk += `<path fill="#3a8c86" d="M${F(wx - h * 0.06)} ${F(wy - h * 0.46)}L${F(wx - h * 0.055)} ${F(wy - h * 0.8)}Q${F(wx)} ${F(wy - h * 0.87)} ${F(wx + h * 0.065)} ${F(wy - h * 0.8)}L${F(wx + h * 0.05)} ${F(wy - h * 0.46)}Z"/>`;   // the shirt
      wk += limb(nLeg, '#8d5a3b', h * 0.052) + limb([[wx - h * 0.02, wy - h * 0.48], hip, along(hip, nLeg[1], 0.7)], '#2f3a4a', h * 0.08)   // the near leg, forward, the shorts
        + limb([[wx + h * 0.135, wy - h * 0.01], [wx + h * 0.215, wy - h * 0.03]], '#dfe3e8', h * 0.035)   // its trainer, heel down
        + limb(nArm, '#8d5a3b', h * 0.045) + limb([sh, along(sh, nArm[1], 0.55)], '#3a8c86', h * 0.065);   // the near arm, back, its sleeve
      wk += `<path fill="#8d5a3b" d="${rect(wx - h * 0.018, wy - h * 0.88, h * 0.04, h * 0.05)}"/><circle fill="#8d5a3b" cx="${F(cx)}" cy="${F(cy)}" r="${F(hr)}"/>`
        + `<path fill="#1d1916" d="M${F(cx + hr * 0.64)} ${F(cy - hr * 0.77)}A${F(hr)} ${F(hr)} 0 0 0 ${F(cx - hr * 0.64)} ${F(cy + hr * 0.77)}L${F(cx - hr * 0.22)} ${F(cy + hr * 0.42)}Q${F(cx + hr * 0.05)} ${F(cy - hr * 0.42)} ${F(cx + hr * 0.64)} ${F(cy - hr * 0.77)}Z"/></g>`;   // the hair over the crown and the back of the head, the face's side left bare
      // (the lamp's light on the side turned to it: the back of the head and the shirt's back, broken where the
      // near arm swings across it, or the head's and the shirt's front)
      wk += lamp(`M${F(cx + sd * hr * 0.3)} ${F(cy - hr * 0.95)}A${F(hr)} ${F(hr)} 0 0 ${sd > 0 ? 1 : 0} ${F(cx + sd * hr * 0.97)} ${F(cy + hr * 0.2)}`
        + (sd < 0 ? `M${F(wx - h * 0.052)} ${F(wy - h * 0.79)}L${F(wx - h * 0.055)} ${F(wy - h * 0.72)}M${F(wx - h * 0.057)} ${F(wy - h * 0.62)}L${F(wx - h * 0.06)} ${F(wy - h * 0.49)}`
          : `M${F(wx + h * 0.065)} ${F(wy - h * 0.8)}L${F(wx + h * 0.05)} ${F(wy - h * 0.5)}`));
      s += `<g class="isl-lq" data-q="a">${wk}</g>`;
    }
    s += panes(px - Y(0.02), street - ph - Y(0.06), Y(0.04), Y(0.055))
      + `<path class="isl-vpost" d="M${F(px - 1.3)} ${F(street + Y(0.02))}V${F(street - ph)}H${F(px + 1.3)}V${F(street + Y(0.02))}Z`
      + `M${F(px - Y(0.026))} ${F(street - ph + 1)}h${F(Y(0.052))}v${F(Y(0.012))}h${F(-Y(0.052))}Z"/>`
      + `<path class="isl-vpost isl-lcap" d="M${F(px - Y(0.03))} ${F(street - ph - Y(0.06))}L${F(px)} ${F(street - ph - Y(0.095))}L${F(px + Y(0.03))} ${F(street - ph - Y(0.06))}Z"/>`;
    const sx = px - ss * 0.75, sy = street - ph + Y(0.035);
    const P = (a, b) => `${F(sx + a * ss)} ${F(sy + b * ss)}`;
    s += `<path class="isl-vpost" d="${rect(px - Y(0.03), sy - Y(0.008), Y(0.06), Y(0.01))}"/>`
      + `<path class="isl-lsign" d="${rect(sx, sy, ss * 1.5, ss)}"/>`
      + `<path class="isl-asym" d="${rect(sx + ss * 0.05, sy + ss * 0.05, ss * 1.4, ss * 0.9)}" stroke-width="${F(Math.max(0.7, ss * 0.03))}"/>`
      + `<circle class="isl-asymf" cx="${F(sx + 0.47 * ss)}" cy="${F(sy + 0.19 * ss)}" r="${F(ss * 0.075)}"/>`
      // the figure: the back, the thigh forward along the seat, the lower leg down to the footrest, the arm
      // forward; the wheel an open ring round the seat; then the arrow toward the ramp
      + `<path class="isl-asym" d="M${P(0.43, 0.3)}L${P(0.45, 0.58)}L${P(0.66, 0.58)}L${P(0.76, 0.82)}M${P(0.44, 0.42)}L${P(0.62, 0.42)}" stroke-width="${F(Math.max(1.2, ss * 0.075))}" stroke-linejoin="round"/>`
      + `<path class="isl-asym" d="M${P(0.28, 0.46)}A${F(ss * 0.2)} ${F(ss * 0.2)} 0 1 0 ${P(0.62, 0.74)}" stroke-width="${F(Math.max(1.2, ss * 0.07))}"/>`
      + `<path class="isl-asym" d="M${P(0.95, 0.5)}L${P(1.3, 0.5)}M${P(1.2, 0.4)}L${P(1.3, 0.5)}L${P(1.2, 0.6)}" stroke-width="${F(Math.max(1.2, ss * 0.07))}" stroke-linejoin="round"/>`;
    return `<g style="--isl-vstep:.35s">${s}</g>`;
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
    // the lawn runs the hero's whole width, so no wing stands over the water (owner, 2026-09-28); AUA
    // stands inland at Coolidge, so land end to end is the truer picture too
    const lawnG = rise(x1 + 6, H, -8, -4, base, base, 29);
    const inner = campus(Wr, H, v, g, { fw: 1.02, lawn: true });
    const u = Wr * 1.02 / 100, top = base - 42 * u;
    return {
      svg: extraDefs() + `<path class="f-near isl-land" d="${lawnG.d}"/><g transform="translate(${F(x0)} 0)">${inner}</g>`,
      box: [x0 + Wr * 0.02, top - 8, x1, H],
    };
  };

  /* The homepage hero's Dawn, Day and Sunset (island-core.js, buildHero): the section pictures' clouds
     and Sun, the clouds kept right of the words' column and clear of every line, the bird,
     the Moon and Venus, so white text keeps its contrast against the sky. */
  A.heroSky = function (v, W, H, x0, clear, withDefs) {
    // the phone and tablet hero (no campus scene) sets its words on the horizon itself and never fetches this
    // file: it keeps each version's light without clouds or a Sun, however it came to be drawn
    if (withDefs) return extraDefs();
    const y0 = v.y0, pad = 16;
    const ok = (a, b, c, d) => a > x0 && !clear.some(([p, q, r2, s2]) => a < r2 + pad && c > p - pad && b < s2 + pad && d > q - pad);
    return `<g class="isl-a">${bands(W, y0, 89, ok)}</g><g class="isl-y">${clouds(W, y0, 211, ok)}</g>`
      + `<g class="isl-s">${sunDisc(v, 's', W, y0, H, { sunset: '18:11' })}</g>`;
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
      // turned south-west so Montserrat and Nevis are in view (owner, 2026-09-30): the sunset 72% of the way in
      sunAt: 0.72,
      // the Sun sinking behind the tip of the low point of land left of the bluff, its path on the sea
      sunset: '18:25',
      horizon: 0.7,
      // the Moon, about 24 degrees up, and Venus in the sky above the horizon
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 29),
      under: false,
      ground: null,
    },
    'sailing-week': {
      draw: regatta,
      world: 'inland',
      // the Sun touching the sea between the yachts, its path running down between their reflections
      sunset: '18:28',
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
      // the Sun touching the sea where the stair's slope meets it, so the slope leads the eye to it
      sunset: '18:28',
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
      // the Sun resting on the summit of the far range, its path on the open sea below
      sunset: '18:02',
      horizon: 0.62,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 30),
      moonBig: 2.4,
      moonX: 0.32,
      ground: null,
    },
    'bettys-hope': {
      draw: bettysHope,
      world: 'inland',
      moonPath: false,   // (inland: no water under the Moon)
      // the Sun just touching the far hills, framed between the great house and the boiling house
      sunset: '18:10',
      sunPath: false,
      horizon: 0.64,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 30),
      moonBig: 2.2,
      moonX: 0.3,
      ground: null,
    },
    'court-house': {
      draw: courtHouse,
      world: 'inland',
      moonPath: false,   // (no water under the Moon: the street covers the base sea, opaque since art-audit pass 4, 2026-10-01)
      // the Sun resting on the rooftops down the street, between the palm and the lamp
      sunset: '18:11',
      horizon: 0.62,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 30),
      moonBig: 2.4,
      moonX: 0.16,
      ground: null,
    },
    'st-johns-harbour': {
      draw: harbour,
      world: 'inland',
      sunPath: false,
      // The horizon is the quay, so the town is mirrored in the harbour; the view turns to put the
      // Moon over the hills, left of the cathedral.
      horizon: 0.6,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 30),
      moonBig: 2.4,
      moonX: 0.24,
      ground: null,
    },
    'library': {
      draw: library,
      world: 'inland',
      // An interior: the windows face east of the evening sky, so no Sun is in them at Sunset; the
      // horizon sits under the campus's trees, and the Moon is set in a pane of the second window
      // (its true phase and tilt, the place a painter's licence, as at Shirley Heights).
      horizon: (W, H) => libraryFrame(W, H).wB / H,
      face: 100,
      sunPath: false,
      ppd: (W) => W / 62,
      // the middle pane of the second window, its disc clear of the wall above
      moonAt: (W, H) => { const f = libraryFrame(W, H); return [(f.wins[1] + f.ww / 2) / W, (f.wT + (f.wB - f.wT) * 0.36) / H]; },
      moonBig: 1.5,
      ground: null,
    },
    'tool-wall': {
      draw: toolWall,
      world: 'inland',
      // An interior: the window faces the Sun's setting bearing, the view turned so the Sun stands on the
      // far hill in the window's right-hand pane at Sunset, its path on the harbour below; the horizon
      // is the window's; the Moon in the window's upper left pane (its true phase and tilt, the place a
      // painter's licence, as in the library). At the default minute the hill hid the whole disc while its
      // path still showed on the water, so every window piece sets at 18:23 (review, 2026-09-30); here the
      // transom crossed the disc at 18:23, so this one sets at 18:26, the view turned so the Sun stands at
      // 0.86 of the window, where the hill is low enough to hold it just under the bar (review, 2026-09-30).
      sunset: '18:26',
      horizon: (W, H) => toolFrame(W, H).hz / H,
      face: (W, H) => { const f = toolFrame(W, H); return 290.8 - ((f.wx0 + f.ww * 0.86) / W - 0.5) * 62; },
      // the window's bars: a planet that would stand half behind one is left out, as the wall would hide it
      bars: (W, H) => {
        const f = toolFrame(W, H), t = H * 0.012, tr = f.wT + (f.wB - f.wT) * 0.42, mx = f.wx0 + f.ww / 2;
        return [[f.wx0, f.wT - t, f.wx1, f.wT + t], [f.wx0, tr - t, f.wx1, tr + t], [mx - t, f.wT, mx + t, f.wB], [f.wx0 - t, f.wT, f.wx0 + t, f.wB], [f.wx1 - t, f.wT, f.wx1 + t, f.wB]];
      },
      ppd: (W) => W / 62,
      moonAt: (W, H) => { const f = toolFrame(W, H); return [(f.wx0 + f.ww * 0.26) / W, (f.wT + (f.hz - f.wT) * 0.38) / H]; },
      moonBig: 1.2,
      ground: null,
    },
    'prompt-desk': {
      draw: promptDesk,
      world: 'inland',
      // An interior: the window faces east, the view turned so the rising Sun stands in its right-hand
      // pane at Dawn, its path on the sea; at Sunset the Sun is behind the viewer, and the sky alone
      // turns red. The Moon in the upper right pane (a painter's licence, as in the library).
      horizon: (W, H) => promptFrame(W, H).hz / H,
      face: (W, H) => { const f = promptFrame(W, H); return SKY.a.sun[0] - ((f.wx0 + f.ww * 0.62) / W - 0.5) * 62; },
      ppd: (W) => W / 62,
      moonAt: (W, H) => { const f = promptFrame(W, H); return [(f.wx0 + f.ww * 0.76) / W, (f.wT + (f.hz - f.wT) * 0.22) / H]; },
      bars: (W, H) => {
        const f = promptFrame(W, H), t = H * 0.012, tr = f.wT + (f.wB - f.wT) * 0.3, mx = f.wx0 + f.ww / 2;
        return [[f.wx0, f.wT - t, f.wx1, f.wT + t], [f.wx0, tr - t, f.wx1, tr + t], [mx - t, f.wT, mx + t, f.wB], [f.wx0 - t, f.wT, f.wx0 + t, f.wB], [f.wx1 - t, f.wT, f.wx1 + t, f.wB]];
      },
      moonBig: 1.2,
      ground: null,
    },
    'bell-tower': {
      draw: bellTower,
      world: 'inland',
      // Facing west over the town to the sea, the afterglow behind the roofs; the Moon in the open sky
      // between the headland and the tower.
      sunset: '18:24',
      horizon: 0.72,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 30),
      moonBig: 2.2,
      moonX: 0.42,
      ground: null,
    },
    // The news pages (round 7, wave 2): interiors whose windows face the Sun's setting bearing, so the
    // Sun sets in them at Sunset (18:23, standing on the far hill, as in the tool wall), and the Moon in an
    // upper pane; the lecture theatre's high windows show sky and a line of far hills; the dish stands on a
    // headland with the Moon in the open sky.
    'week-calendar': {
      draw: weekCalendar,
      world: 'inland',
      sunset: '18:23',
      horizon: (W, H) => newsFrame(W, H, 1).hz / H,
      face: (W, H) => { const f = newsFrame(W, H, 1); return 290.8 - ((f.wx0 + f.ww * 0.7) / W - 0.5) * 62; },
      ppd: (W) => W / 62,
      moonAt: (W, H) => { const f = newsFrame(W, H, 1); return [(f.wx0 + f.ww * 0.26) / W, (f.wT + (f.hz - f.wT) * 0.38) / H]; },
      moonBig: 1.2,
      ground: null,
    },
    'hospital-room': {
      draw: hospitalRoom,
      world: 'inland',
      sunset: '18:23',
      horizon: (W, H) => newsFrame(W, H, 1).hz / H,
      face: (W, H) => { const f = newsFrame(W, H, 1); return 290.8 - ((f.wx0 + f.ww * 0.7) / W - 0.5) * 62; },
      ppd: (W) => W / 62,
      // below the blinds, in the window's lower left pane
      moonAt: (W, H) => { const f = newsFrame(W, H, 1); return [(f.wx0 + f.ww * 0.26) / W, (f.wT + (f.hz - f.wT) * 0.72) / H]; },
      moonBig: 1.1,
      ground: null,
    },
    'lecture-hall': {
      draw: lectureHall,
      world: 'inland',
      sunPath: false,
      horizon: 0.27,
      face: 262,
      ppd: (W) => W / 62,
      moonAt: (W, H) => [(W * 0.37 - H * 0.035) / W, 0.15],   // (the middle window's centre, as it is spaced now)
      moonBig: 1,
      ground: null,
    },
    'dish-net': {
      draw: dishNet,
      world: 'inland',
      sunset: '18:26',
      horizon: 0.8,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 30),
      moonBig: 2,
      moonX: 0.08,
      ground: null,
    },
    // Round 7, wave 3: the committee room, its window at the left facing the Sun's setting bearing as the
    // news interiors' do (the Sun at 18:23 on the far hill), the Moon in its upper left pane; the way in,
    // facing west over the sea wall with the Moon in the open sky at the left. The Accessibility page has
    // no kind, so the way in has no page hue.
    'committee-room': {
      draw: committeeRoom,
      world: 'inland',
      sunset: '18:23',
      horizon: (W, H) => newsFrame(W, H, -1).hz / H,
      face: (W, H) => { const f = newsFrame(W, H, -1); return 290.8 - ((f.wx0 + f.ww * 0.7) / W - 0.5) * 62; },
      ppd: (W) => W / 62,
      moonAt: (W, H) => { const f = newsFrame(W, H, -1); return [(f.wx0 + f.ww * 0.26) / W, (f.wT + (f.hz - f.wT) * 0.38) / H]; },
      moonBig: 1.2,
      ground: null,
    },
    'way-in': {
      draw: wayIn,
      world: 'inland',
      // the view turned so the Sun sets in the open sky between the lamp and the building, on the far
      // headland's slope, its path on the sea beyond the wall; the Moon set high in the same open sky,
      // clear of the lamp (its true phase and tilt, the place a painter's licence, as in the library); the turn uses the
      // same minute, horizon and scale as build(), so the Sun keeps its place at every card width. Day's
      // and Dawn's clouds keep clear of the building's corner, where they piled up like steam.
      sunset: WAYIN_SUN,
      horizon: WAYIN_HZ,
      ppd: (W, H, y0) => Math.min(W / 62, y0 / 30),
      face: (W, H) => SKY.sunset[WAYIN_SUN][0] + 0.2 * W / Math.min(W / 62, Math.round(H * WAYIN_HZ) / 30),
      moonAt: [0.26, 0.17],
      moonBig: 2.2,
      cloudOk: (W) => (x0, y0, x1) => x1 < W * 0.37 || x0 > W * 0.41,
      ground: null,
    },
    'shirley-heights': {
      draw: heights,
      world: 'inland',
      // the Sun sinking behind the far hills, as in the owner's dusk photograph, its path across the harbour
      sunset: '18:25',
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
      + `<rect class="isl-veg-b isl-veg-b${id.slice(-1)}" width="${size}" height="${size}"/>`
      + blobs('isl-veg-d', n, r0, r1) + blobs('isl-veg-l', Math.round(n * 0.75), r0, r1) + blobs('isl-veg-t', Math.round(n * 0.06), r0 * 1.2, r1 * 1.5)
      + '</pattern>';
  }

  function extraDefs() {
    return '<defs>'
      + vegPattern('islvegf', 53, 70, 0.45, 1.2, 0.24, 5) + vegPattern('islvegn', 131, 170, 0.7, 2.6, 0.32, 7)
      + '<radialGradient id="islvwarm"><stop offset="0" class="st-g1" stop-opacity=".26"/><stop offset=".6" class="st-g1" stop-opacity=".08"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvspill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-g1" stop-opacity=".2"/><stop offset="1" class="st-g1" stop-opacity="0"/></linearGradient>'
      + '<radialGradient id="islvlamp"><stop offset="0" class="st-k" stop-opacity=".6"/><stop offset=".5" class="st-k" stop-opacity=".18"/><stop offset="1" class="st-k" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvrefl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-g1" stop-opacity=".55"/><stop offset="1" class="st-g1" stop-opacity="0"/></linearGradient>'
      // (a boat's light: its cool halo and its reflection, as the warm ones above; the second light)
      + '<radialGradient id="islvred"><stop offset="0" class="st-vred" stop-opacity=".45"/><stop offset=".5" class="st-vred" stop-opacity=".12"/><stop offset="1" class="st-vred" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="islvcool"><stop offset="0" class="st-vcool" stop-opacity=".5"/><stop offset=".5" class="st-vcool" stop-opacity=".14"/><stop offset="1" class="st-vcool" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvcoolrefl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-vcool" stop-opacity=".55"/><stop offset="1" class="st-vcool" stop-opacity="0"/></linearGradient>'
      + '<radialGradient id="islvmist"><stop offset="0" class="st-haze" stop-opacity=".5"/><stop offset=".6" class="st-haze" stop-opacity=".16"/><stop offset="1" class="st-haze" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="islvpool"><stop offset="0" class="st-g1" stop-opacity=".55"/><stop offset=".5" class="st-g1" stop-opacity=".18"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvsailgm" x1="1" y1="0" x2="0" y2="0"><stop offset="0" class="st-vsail" stop-opacity="1"/><stop offset="1" class="st-vsail2" stop-opacity="1"/></linearGradient>'
      + '<radialGradient id="islvgreen"><stop offset="0" class="st-vgreen" stop-opacity=".45"/><stop offset=".5" class="st-vgreen" stop-opacity=".12"/><stop offset="1" class="st-vgreen" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvsailg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" class="st-vsail" stop-opacity="1"/><stop offset="1" class="st-vsail2" stop-opacity="1"/></linearGradient>'
      + '<linearGradient id="islvbrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-vbrass" stop-opacity="1"/><stop offset=".5" class="st-vbrass2" stop-opacity="1"/><stop offset="1" class="st-vbrass3" stop-opacity="1"/></linearGradient>'
      + '<linearGradient id="islvbay" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-vbay" stop-opacity=".55"/><stop offset="1" class="st-vbay" stop-opacity=".35"/></linearGradient>'
      + '<linearGradient id="islvharb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-sea0" stop-opacity="0"/><stop offset=".45" class="st-sea0" stop-opacity=".5"/><stop offset="1" class="st-sea0" stop-opacity=".3"/></linearGradient>'
      + '<linearGradient id="islvfacade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-vstrata" stop-opacity="1"/><stop offset="1" class="st-vstone" stop-opacity="1"/></linearGradient>'
      + '<linearGradient id="islvcloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-cloud" stop-opacity="1"/><stop offset=".55" class="st-cloud" stop-opacity="1"/><stop offset="1" class="st-cloud-s" stop-opacity="1"/></linearGradient>'
      + '<linearGradient id="islvgild" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-gild" stop-opacity=".6"/><stop offset=".55" class="st-gild" stop-opacity="0"/></linearGradient>'
      + '<radialGradient id="islvsunlow"><stop offset="0" stop-color="#ffd08a" stop-opacity=".85"/><stop offset=".12" stop-color="#ffb066" stop-opacity=".45"/><stop offset=".45" stop-color="#ff9a5a" stop-opacity=".14"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="islvsunrefl"><stop offset="0" stop-color="#fff2c6" stop-opacity=".95"/><stop offset=".3" stop-color="#ffcf85" stop-opacity=".5"/><stop offset="1" stop-color="#ff9a5a" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="islvdawn"><stop offset="0" class="st-g1" stop-opacity=".9"/><stop offset=".45" class="st-g2" stop-opacity=".35"/><stop offset="1" class="st-g2" stop-opacity="0"/></radialGradient>'
      + '<radialGradient id="islvbulb"><stop offset="0" class="st-g1" stop-opacity=".5"/><stop offset=".5" class="st-g1" stop-opacity=".14"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '</defs>';
  }

  /* THE FIVE TIMES OF DAY (owner, 2026-09-28): every picture has Dawn, Day, Sunset, Dusk and Night, the
     visitor's local time choosing among them in both schemes (the card's data-sky). The versions differ in
     light, not in drawing: the sky, sea, land and material colors are each version's
     tokens (layout-art.css); lights are on at Dawn, Dusk and Night and off by Day; stars, grain and the
     Moon belong to Dusk and Night. What only Dawn and Day draw is here: the glow where the Sun is about
     to rise, when the view faces it, and trade-wind cumulus, the same clouds at both, lit pink at Dawn and
     white by Day. */
  function clouds(W, y0, seed, ok) {
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
      if (ok && !ok(cx - w / 2 - h, base - h * 2.4, cx + w / 2 + h, base)) continue;
      defs += `<clipPath id="islvcb${i}"><rect x="${F(cx - w)}" y="${F(base - h * 3)}" width="${F(w * 2)}" height="${F(h * 3)}"/></clipPath>`;
      d += `<path d="${c}" fill="url(#islvcloud)" clip-path="url(#islvcb${i})" opacity="${F(0.45 + t * 0.45)}"/>`;
    }
    return `<defs>${defs}</defs>${d}`;
  }
  // Dawn's clouds are its own: long, low bands of stratocumulus, their tops catching the light first.
  function bands(W, y0, seed, ok) {
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
      if (ok && !ok(x - w / 2 - 1.8 * w / k, y - h * 2, x + w / 2 + 1.8 * w / k, y + h * 1.4)) continue;
      d += `<path d="${c}" fill="url(#islvcloud)" opacity="${F(0.5 + t * 0.4)}"/>`;
    }
    return d;
  }
  // The Sun, drawn only where it truly is in view at a version's moment (owner, 2026-09-28: "if the sun
  // would be visible ... please add them"): at the size the Moon is drawn, low and orange at the horizon,
  // its lower edge cut by the horizon, a glow around it and its light laid on the water below. Land and
  // buildings drawn after it cover it where they stand in front.
  // The Sunset moment: a picture's own (`sunset: 'HH:MM'`), 18:31 by default. ?isl-sunat=HH:MM tries
  // another minute in every picture, for review.
  let sunatQ = null;
  try { sunatQ = new URLSearchParams(location.search).get('isl-sunat'); } catch (e) { /* no query */ }
  // The campus clock keeps Antigua's time (owner, 2026-09-30: "fixed to antigua time"): Atlantic Standard
  // Time, UTC-4 all year, since Antigua keeps no daylight saving, worked out from the visitor's own clock,
  // so it is right wherever the page is read. (The sky follows the visitor's own time of day, so a reader
  // abroad sees what time it is on campus; the owner chose that, and the art write-up says so.)
  // ?isl-clock=HH:MM sets it, for review.
  let clockQ = null;
  try {
    const q = new URLSearchParams(location.search).get('isl-clock');
    if (/^\d{1,2}:\d{2}$/.test(q || '')) clockQ = q.split(':').map(Number);
  } catch (e) { /* no query */ }
  const antiguaNow = () => {
    if (clockQ) return clockQ;
    const d = new Date(Date.now() - 4 * 3600e3);
    return [d.getUTCHours(), d.getUTCMinutes()];
  };
  const clockAngles = () => { const [h, m] = antiguaNow(); return [((h % 12) + m / 60) * 30, m * 6]; };
  // Every drawn clock's hands turn at each minute's turn and when a hidden tab returns; only their angle
  // changes, nothing is redrawn and nothing else moves.
  function tickClocks() {
    const [ha, ma] = clockAngles();
    for (const e of document.querySelectorAll('.isl-vhand')) {
      e.setAttribute('transform', `rotate(${F(e.classList.contains('isl-vhand-h') ? ha : ma)} ${e.getAttribute('data-c')})`);
    }
  }
  if (!clockQ) {
    const next = () => setTimeout(() => { tickClocks(); next(); }, 60000 - (Date.now() % 60000) + 50);
    next();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tickClocks(); });
  }
  const sunAt = (m, P) => (m === 's' ? SKY.sunset[SKY.sunset[sunatQ] ? sunatQ : (P.sunset || '18:31')] : SKY[m].sun);
  // The Sun as the eye sees it low in the sky (owner, 2026-09-28: the first disc was "very stylized against
  // a softly shadowed landscape", and its size changed from picture to picture). One size on the screen in
  // every picture, set by the picture's width, not its scale; a soft disc, deeper and redder the nearer it
  // is to the horizon, whose edge melts into its own bloom, and a wide warm bloom lying along the horizon
  // beneath it, in a clear sky (a wisp of haze across it read as a stray cloud: owner, the same day). At
  // the horizon the air flattens the disc.
  const sunR = (W) => clamp(W * 0.0115, 7, 9.5);
  const mixHex = (a, b, t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t)
    + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, '0')).join('');
  function sunDisc(v, m, W, y0, H, P) {
    const [az, alt] = sunAt(m, P), x = v.x(az), y = v.y(alt), rr = sunR(W);
    if (x < -rr * 3 || x > W + rr * 3 || y < -rr * 3 || y > y0 + rr) return '';
    const k = clamp(alt / 10, 0, 1), flat = 0.84 + 0.16 * clamp(alt / 1.2, 0, 1);
    const core = mixHex('#ffd49a', '#fff3d6', k), rim = mixHex('#ff9860', '#ffc978', k), id = `islvsd${m}${Math.round(alt * 10)}`;
    let s = `<defs><radialGradient id="${id}"><stop offset="0" stop-color="${core}"/><stop offset=".55" stop-color="${mixHex(core, rim, 0.45)}"/>`
      + `<stop offset=".8" stop-color="${rim}" stop-opacity=".92"/><stop offset="1" stop-color="${rim}" stop-opacity="0"/></radialGradient>`
      + `<filter id="${id}f" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${F(rr * 0.14)}"/></filter></defs>`;
    s += `<ellipse cx="${F(x)}" cy="${F(Math.max(y, y0 - rr))}" rx="${F(rr * 18)}" ry="${F(rr * 5)}" fill="url(#islvsunlow)" opacity="${F(0.35 + 0.35 * (1 - k))}" clip-path="url(#islsky)"/>`
      + `<circle cx="${F(x)}" cy="${F(y)}" r="${F(rr * 4.5)}" fill="url(#islvsunlow)" opacity=".75" clip-path="url(#islsky)"/>`
      + `<g clip-path="url(#islsky)"><ellipse cx="${F(x)}" cy="${F(y)}" rx="${F(rr * 1.12)}" ry="${F(rr * 1.12 * flat)}" fill="url(#${id})" filter="url(#${id}f)"/></g>`;
    return s;
  }
  // The Sun's light on the water (owner, 2026-09-28: "so we can get a reflection of the sun on the water
  // too"): just under the horizon a bright band where the disc's own reflection merges with it, then its
  // path of broken glitter straight toward the viewer, widening as it comes near, gold at the horizon and
  // orange and fainter nearer. Drawn over the sea and under the land, so every shore and hull covers it.
  function sunWater(v, m, W, y0, H, P) {
    const [az, alt] = sunAt(m, P), x = v.x(az), rr = sunR(W);
    // no path where land hides the Sun itself (`sunPath: false`): what hides the Sun from the viewer
    // hides it from the water in front of the viewer too
    if (P.sunPath === false || x < -rr * 6 || x > W + rr * 6 || alt > 12) return '';
    const r = rng(173), lit = clamp(1.15 - alt / 5, 0.45, 1);   // the lower the Sun, the brighter its path
    let d0 = '', d1 = '', d2 = '';
    for (let y = y0 + 1.2; y < H; y += 1.4 + (y - y0) * 0.028) {
      const k = (y - y0) / (H - y0), half = rr * (0.55 + k * 4.2);
      const n = 1 + Math.round(r() * 3 * (1 - k * 0.4));
      for (let i = 0; i < n; i++) {
        const cx = x + gauss(r) * half, len = Math.max(1.5, rr * (0.18 + r() * 0.7) * (1 + k * 2.6));
        const seg = `M${F(cx - len / 2)} ${F(y)}h${F(len)}`;
        if (k < 0.12) d0 += seg; else if (k < 0.45) d1 += seg; else d2 += seg;
      }
    }
    const sw = Math.max(1, rr * 0.12);
    // the glitter softened a little, as light broken on moving water is
    return `<defs><filter id="islvswf${m}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${F(rr * 0.05)}"/></filter></defs>`
      + `<ellipse cx="${F(x)}" cy="${F(y0 + 0.5)}" rx="${F(rr * 2.8)}" ry="${F(rr * 0.6)}" fill="url(#islvsunrefl)" clip-path="url(#islsea)" opacity="${F(lit * 0.85)}"/>`
      + `<g filter="url(#islvswf${m})"><path class="isl-vsunpath" d="${d0}" stroke-width="${F(sw * 1.2)}" stroke-opacity="${F(0.8 * lit)}"/>`
      + `<path class="isl-vsunpath2" d="${d1}" stroke-width="${F(sw)}" stroke-opacity="${F(0.55 * lit)}"/>`
      + `<path class="isl-vsunpath2" d="${d2}" stroke-width="${F(sw)}" stroke-opacity="${F(0.28 * lit)}"/></g>`;
  }
  // The Moon's path on the water (art audit, 2026-10-01): broken glitter straight down from under the
  // painted Moon toward the viewer, cool white, widening as it comes near, as bright as the Moon is full.
  // Drawn before the land, which covers it wherever the Moon stands over land, and shown at Dusk and
  // Night only (at Sunset the water is the Sun's). `at` is the drawn Moon's [x, y, r], or null. A piece
  // with no water under its Moon says `moonPath: false`.
  function moonWater(m, at, W, y0, H) {
    if (!at || !SKY.moonUp) return '';
    const [x, , mr] = at, k = SKY[m].moon[2];
    if (x < -mr * 4 || x > W + mr * 4) return '';
    const r = rng(m === 'n' ? 181 : 179), lit = clamp(0.25 + k * 0.75, 0, 1);
    let d0 = '', d1 = '', d2 = '';
    for (let y = y0 + 1.5; y < H; y += 1.5 + (y - y0) * 0.03) {
      const t = (y - y0) / (H - y0), half = mr * (0.5 + t * 3.2);
      const n = 1 + Math.round(r() * 2.4 * (1 - t * 0.3));
      for (let i = 0; i < n; i++) {
        const cx = x + gauss(r) * half, len = Math.max(1.2, mr * (0.2 + r() * 0.6) * (1 + t * 2));
        const seg = `M${F(cx - len / 2)} ${F(y)}h${F(len)}`;
        if (t < 0.12) d0 += seg; else if (t < 0.45) d1 += seg; else d2 += seg;
      }
    }
    const sw = Math.max(0.8, mr * 0.1);
    return `<g class="isl-vmoonw" clip-path="url(#islsea)"><path class="isl-vmoonpath" d="${d0}" stroke-width="${F(sw)}" stroke-opacity="${F(0.35 * lit)}"/>`
      + `<path class="isl-vmoonpath" d="${d1}" stroke-width="${F(sw)}" stroke-opacity="${F(0.5 * lit)}"/>`
      + `<path class="isl-vmoonpath" d="${d2}" stroke-width="${F(sw)}" stroke-opacity="${F(0.32 * lit)}"/></g>`;
  }
  // `ok`, a piece's own keep-clear test (PIECES `cloudOk`), leaves out a band or cloud that would sit where
  // the piece does not want one; the others keep their places.
  function dawnDay(v, W, y0, H, seed = 0, ok) {
    const p = v.ppd, sx = v.x(SKY.a.sun[0]);
    const glow = sx > -W * 0.3 && sx < W * 1.3
      ? `<ellipse cx="${F(sx)}" cy="${F(y0)}" rx="${F(40 * p)}" ry="${F(8 * p)}" fill="url(#islvdawn)" clip-path="url(#islsky)"/>` : '';
    return `<g class="isl-a">${glow}${bands(W, y0, 89 + seed, ok)}</g><g class="isl-y">${clouds(W, y0, 211 + seed, ok)}</g>`;
  }

  function build(W, H, piece) {
    const P = PIECES[piece];
    if (!P || W < 200 || H < 100) return '';   // a head fitted to short text can be under 200px
    // A piece may set its own scale (pixels per degree); the Curtain Bluff view needs a wider field
    // for the Moon and Venus to sit in the sky, as in the homepage hero.
    const y0g = Math.round(H * ((typeof P.horizon === 'function' ? P.horizon(W, H) : P.horizon) || 0.58));
    const moonAt = typeof P.moonAt === 'function' ? P.moonAt(W, H) : P.moonAt;
    const ppd = P.ppd ? P.ppd(W, H, y0g) : W / 62;
    const y0 = y0g;
    // The anchor: a coast scene puts the sunset a third of the way in (or at `sunAt`, a share of the
    // width); an inland one faces P.face.
    // A piece may instead put the Moon at a share of the width (`moonX`), turning to face it.
    const anchor = P.world === 'coast' ? rel(SKY.d.sun[0]) - (W * (P.sunAt || 0.3) - W / 2) / ppd
      : P.moonX != null ? rel((SKY.d.moon[0] + SKY.n.moon[0]) / 2) - (W * P.moonX - W / 2) / ppd
      : rel(typeof P.face === 'function' ? P.face(W, H) : P.face);
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
      const vm = moonAt ? view(W * moonAt[0] - rel(SKY[m].moon[0]) * ppd, H * moonAt[1] + SKY[m].moon[1] * ppd, ppd, W, H) : v;
      const cls = m === 'd' ? 'isl-d' : 'isl-n', drawn = L.moon(vm, m, [], cls, big), [mx, my, mr] = L.moonBox(vm, m, big);
      sky[m] = {
        moon: drawn,
        planets: L.planets(vm, m, P.bars ? P.bars(W, H) : [], cls),   // (clear of a window's bars)
        box: drawn ? [[mx - mr, my - mr, mx + mr, my + mr]] : [],
        hole: drawn ? `<circle cx="${F(mx)}" cy="${F(my)}" r="${F(mr + 1)}" fill="#000"/>` : '',
        at: drawn ? [mx, my, mr] : null,   // (for its path on the water)
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
      + dawnDay(v, W, y0, H, piece === 'shirley-heights' ? 0 : [...piece].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7), P.cloudOk ? P.cloudOk(W, H) : undefined)
      + `<g class="isl-a">${sunDisc(v, 'a', W, y0, H, P)}</g><g class="isl-s">${sunDisc(v, 's', W, y0, H, P)}</g>`
      + (P.world === 'coast' ? islands(v, 'f-isl') : '')
      + `<rect y="${y0}" width="${F(W)}" height="${F(sea + 1)}" fill="url(#islseag)"/>`
      + L.glowSea(v, 'd', 'isl-d', reflH) + L.glowSea(v, 'n', 'isl-n', reflH)
      + gSea
      + `<path class="s-hz" d="M0 ${y0 + 0.5}H${F(W)}" stroke-width="1"/>`
      + ripples(v, 0, W, H, [], 9, 0.8)
      + `<g class="isl-a">${sunWater(v, 'a', W, y0, H, P)}</g><g class="isl-s">${sunWater(v, 's', W, y0, H, P)}</g>`
      + (P.moonPath === false ? '' : `<g class="isl-d">${moonWater('d', sky.d.at, W, y0, H)}</g><g class="isl-n">${moonWater('n', sky.n.at, W, y0, H)}</g>`)
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

  // Which version a card shows: the visitor's own clock, in both schemes (A.pickSky in island-core.js).
  const pickSky = () => A.pickSky();

  /* The caption (owner, 2026-09-29): scripts/layout_art.py writes what the picture shows
     (data/art_slots.yaml); this adds the time of day the picture is drawn at, in the words the data
     gives (data-when), linked to the write-up on the five versions (data-about), and keeps it in step
     when the picture turns with the clock. */
  function caption(cap, sky) {
    if (!cap) return;
    if (!cap._isl) {
      let when = {};
      try { when = JSON.parse(cap.dataset.when || '{}'); } catch (e) { /* the words alone */ }
      const a = document.createElement('a');
      a.href = cap.dataset.about || '';
      // Where the link goes, shown on hover (owner, 2026-09-29) and read as the link's description.
      if (cap.dataset.hover) a.title = cap.dataset.hover;
      cap.append(', ', a, '.');
      cap._isl = { a, when };
    }
    const { a, when } = cap._isl;
    a.textContent = when[sky] || sky;
  }

  A.vignette = function (fig) {
    if (fig._isl) return;
    const card = document.createElement('div');
    card.className = 'isl isl-vig';
    card.dataset.sky = pickSky();
    // The drawing is decorative; the caption beneath it says what it shows.
    card.setAttribute('aria-hidden', 'true');
    // its own scrub patterns for the Day land (ids renamed by own(svg, 'v'); a crossfade copy renames them again)
    card.style.setProperty('--isl-vegf', 'url(#islvvegf)');
    card.style.setProperty('--isl-vegn', 'url(#islvvegn)');
    A.watchSky(card);
    const cap = fig.querySelector(':scope > figcaption');
    caption(cap, card.dataset.sky);
    fig.insertBefore(card, fig.firstChild);
    fig._isl = card;
    // The caption's own height, which the picture gives up so the figure keeps the height it had. Its
    // gap above is topped up to a whole pixel, so the two add up exactly and nothing shifts by a fraction.
    const capH = () => {
      if (!cap || !cap.offsetHeight) return 0;
      cap.style.marginTop = '';   // the stylesheet's gap, in rem, at the page's current type size
      const cs = getComputedStyle(cap);
      const gap = parseFloat(cs.marginTop);
      const raw = cap.getBoundingClientRect().height + gap + parseFloat(cs.marginBottom);
      const c = Math.ceil(raw - 0.01);
      cap.style.marginTop = `${gap + c - raw}px`;
      return c;
    };
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
      // The caption beneath takes its line from the picture, so nothing beside or below it moves.
      const c = capH();
      // A fitted picture raised to a breadcrumb above the title (layout-art.css) grows by that height.
      const lift = text ? Math.max(0, -parseFloat(getComputedStyle(fig).marginTop) || 0) : 0;
      const H = text ? Math.floor(Math.max(120, text.getBoundingClientRect().height + lift)) - c
        : aspect ? Math.floor(clamp(W * aspect, 180, 700)) - c
          : Math.floor(clamp(Math.min(W * 1.02, innerHeight - 5.5 * rem - 24), 320, 820)) - c;
      const key = W + 'x' + H;
      if (key === last) return;
      last = key;
      // A crossfade copy (island-core.js turnSky) keeps the old size, so it would overlap the caption:
      // at a new size the picture switches at once instead.
      const ghost = card.nextElementSibling;
      if (ghost && ghost.classList.contains('isl-ghost')) ghost.remove();
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
      } else if (!card.classList.contains('isl-vrun')) {
        // A redraw after the pass has ended (or under reduced motion) shows the finished frame. One that comes
        // while the pass is still running (the web font arriving re-measures the picture beside text that
        // grew: This Week and About lost their pass to it; first audit, 2026-10-01) leaves it running: the
        // redrawn picture's elements are new, so its pass starts again on them.
        card.classList.add('isl-vstill');
      }
    };
    paint();
    // At a change of version the caption's words change, and with them perhaps its line count: the
    // picture is re-measured in the same moment, so nothing below moves even for a frame.
    document.addEventListener('isl-sky', () => { caption(cap, card.dataset.sky); paint(); });
    // The caption's line breaks can change when the page's web font arrives: measure again then.
    if (cap && document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
    (A.redraw = A.redraw || []).push(() => { last = ''; paint(); });
    let t;
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(paint, 150); });
      ro.observe(fig);
      const text = fig.dataset.fit === 'text' && fig.parentElement.querySelector(':scope > .isl-head__text, :scope > .isl-stack__text');
      if (text) ro.observe(text);
      // A caption that wraps to a second line (a narrow window, a longer time of day) gives up that line too.
      if (cap) ro.observe(cap);
    }
  };
})();
