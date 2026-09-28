/* Island Night vignettes: small scenes from the same view, one subject each (art round, 2026-09-27).
 * Loaded by docs/javascripts/layout-art.js only where a vignette is shown (from 68.75em), after
 * island-core.js. Decorative only (aria-hidden). The places are data/art_slots.yaml, placed by
 * scripts/layout_art.py; the owner approves each one.
 *
 * THE WORLD IS ISLAND NIGHT'S. Each scene is a crop of the view west from Curtain Bluff at the same
 * moment (18 May 2026, dusk in the light scheme and night in the dark), drawn with island-core's own
 * sky, stars, Moon, afterglow, far islands, sea and Antigua's land at true bearings, in its own
 * palette (the --isl-* tokens). The crop puts the sunset a third of the way in, so the afterglow
 * and its reflection frame the subject; the scale (pixels per degree) comes from the card's width.
 *
 * THE SUBJECT IS INVENTED, like the network and the frigatebird: a painter's figure placed on the
 * near ground, not to scale or to a bearing. It stays a silhouette against the sky, lit from within
 * in the palette's warm stops, with the page's kind hue (--k, set by [data-kind]) as its one small
 * accent. No words.
 *
 * MOTION: one pass. The card fades in and the windows light one by one, then everything is still.
 * With motion reduced, the still frame at once. A repaint (a resize) never replays the pass.
 */
(function () {
  'use strict';
  const A = window.IslandArt;
  if (!A || !A.lib || A.vignette) return;
  const L = A.lib;
  const { SKY, view, islands, land, stars, ripples, defs, own, rng, F, clamp, rel } = L;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  /* The ground the subject stands on: a low rise of the bluff from the right edge, darkest of all
     (f-near), with a scrub edge. Returns the path and a function giving its top at x. */
  function rise(W, H, x0, top, seed) {
    const r = rng(seed), pts = [];
    for (let x = x0; x <= W + 4; x += 6) {
      const t = clamp((x - x0) / Math.max(1, W * 0.18), 0, 1);
      const ease = t * t * (3 - 2 * t);
      pts.push([x, H + 2 - (H + 2 - top) * ease + (r() - 0.5) * 1.6]);
    }
    let d = `M${F(x0)} ${F(H + 2)}`;
    for (const [x, y] of pts) d += `L${F(x)} ${F(y)}`;
    d += `L${F(W + 4)} ${F(H + 2)}Z`;
    // scrub: small rounded clumps along the crest
    for (let i = 2; i < pts.length; i += 1) {
      if (r() < 0.3) continue;
      const [x, y] = pts[i], rr = 1.6 + r() * 2.6;
      d += `M${F(x - rr)} ${F(y + rr * 0.4)}a${F(rr)} ${F(rr * 0.8)} 0 0 1 ${F(2 * rr)} 0Z`;
    }
    const at = (x) => {
      let best = H + 2;
      for (const [px, py] of pts) if (Math.abs(px - x) < 4) best = Math.min(best, py);
      return best;
    };
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

  /* THE LECTURE HALL (Lecture Outline, beside "What to Check"): a public building of the islands'
     Georgian kind, seven bays wide. Upstairs the lecture room, its tall arched windows lit; downstairs
     an open arcade, faintly lit within, its middle arch the door; a pediment over the middle bays and
     a small cupola with a lit lantern on the ridge; a lamp on a post in the page's hue; a palm to the
     west. */
  function lectureHall(W, H, v, g) {
    const bw = clamp(W * 0.5, 180, 440), bx = W - bw - W * 0.06, bay = bw / 7;
    const base = g.at(bx + bw / 2) + 2;
    const gH = bw * 0.2, uH = bw * 0.21, roofH = bw * 0.09, over = bw * 0.03;
    const course = base - gH, top = course - uH;
    const cx = bx + bw / 2;
    const arch = (x, yTop, w, yBot) => `M${F(x - w / 2)} ${F(yBot)}V${F(yTop + w / 2)}A${F(w / 2)} ${F(w / 2)} 0 0 1 ${F(x + w / 2)} ${F(yTop + w / 2)}V${F(yBot)}Z`;
    let s = '';
    // the body, the hipped roof, the pediment and the cupola: one silhouette
    const pedW = bay * 3.2, pedH = roofH * 1.25;
    const cupW = bay * 0.7, cupH = roofH * 1.5, ridge = top - roofH;
    s += `<path class="f-near" d="M${F(bx)} ${F(base)}V${F(top)}H${F(bx + bw)}V${F(base)}Z`
      + `M${F(bx - over)} ${F(top + 1)}L${F(bx + bw * 0.1)} ${F(ridge)}H${F(bx + bw * 0.9)}L${F(bx + bw + over)} ${F(top + 1)}Z`
      + `M${F(cx - pedW / 2 - over)} ${F(top + 1)}L${F(cx)} ${F(top - pedH)}L${F(cx + pedW / 2 + over)} ${F(top + 1)}Z`
      + `M${F(cx - cupW / 2)} ${F(ridge + 1)}V${F(ridge - cupH)}H${F(cx + cupW / 2)}V${F(ridge + 1)}Z`
      + `M${F(cx - cupW / 2 - over)} ${F(ridge - cupH + 0.5)}L${F(cx)} ${F(ridge - cupH - cupW * 0.62)}L${F(cx + cupW / 2 + over)} ${F(ridge - cupH + 0.5)}Z"/>`;
    // the afterglow catches the roof's west slope and the pediment (stronger at dusk)
    const rimD = `M${F(bx - over)} ${F(top + 0.5)}L${F(bx + bw * 0.1)} ${F(ridge + 0.5)}H${F(cx - cupW / 2)}`
      + `M${F(cx - pedW / 2 - over)} ${F(top + 0.5)}L${F(cx)} ${F(top - pedH + 0.5)}`;
    s += `<path class="s-rim isl-d" d="${rimD}" stroke-width="1.2" stroke-opacity=".55"/>`
      + `<path class="s-rim isl-n" d="${rimD}" stroke-width="1" stroke-opacity=".3"/>`;
    // cornice and string course
    s += `<path class="s-hz" d="M${F(bx)} ${F(top + 0.5)}H${F(bx + bw)}M${F(bx)} ${F(course)}H${F(bx + bw)}" stroke-width="1"/>`;
    // the lit room behind the upstairs windows, and the arcade's lamplight
    s += `<rect class="isl-vglow" x="${F(bx + bay * 0.2)}" y="${F(top + uH * 0.02)}" width="${F(bw - bay * 0.4)}" height="${F(uH * 0.96)}" fill="url(#islvwarm)"/>`;
    const archW = bay * 0.62, archTop = course + gH * 0.14;
    let arcade = '';
    for (let i = 0; i < 7; i++) if (i !== 3) arcade += arch(bx + bay * (i + 0.5), archTop, archW, base);
    s += `<path class="isl-varc" d="${arcade}" fill="url(#islvarc)"/>`;
    // upstairs windows, lighting in turn; mullions so they read as windows
    const winW = bay * 0.42, winTop = top + uH * 0.16, winBot = course - uH * 0.12;
    let mul = '';
    for (let i = 0; i < 7; i++) {
      const x = bx + bay * (i + 0.5);
      s += `<path class="f-pulse isl-vwin" style="--i:${i}" d="${arch(x, winTop, winW, winBot)}"/>`;
      mul += `M${F(x)} ${F(winTop + winW * 0.3)}V${F(winBot)}M${F(x - winW / 2)} ${F(winTop + (winBot - winTop) * 0.56)}H${F(x + winW / 2)}`;
    }
    s += `<path class="isl-vmul" d="${mul}" stroke-width="1"/>`;
    // the door, lit, and its light on the ground
    s += `<path class="f-pulse isl-vwin" style="--i:7" d="${arch(cx, archTop, archW, base)}"/>`;
    s += `<path class="isl-vspill" d="M${F(cx - archW / 2)} ${F(base)}H${F(cx + archW / 2)}L${F(cx + archW * 1.9)} ${F(Math.min(H, base + gH * 1.1))}H${F(cx - archW * 1.9)}Z" fill="url(#islvspill)"/>`;
    // the cupola's lantern, last to light
    s += `<path class="f-pulse isl-vwin isl-vlast" style="--i:8" d="${arch(cx, ridge - cupH * 0.78, cupW * 0.42, ridge - cupH * 0.12)}"/>`;
    // the lamp on a post by the path, in the page's hue
    const lx = bx - bay * 0.55, ly = base - gH * 1.05;
    s += `<path class="f-near" d="M${F(lx - 1.2)} ${F(g.at(lx) + 2)}V${F(ly)}H${F(lx + 1.2)}V${F(g.at(lx) + 2)}Z"/>`;
    s += `<circle class="isl-vlamp-glow" cx="${F(lx)}" cy="${F(ly - bay * 0.12)}" r="${F(bay * 0.95)}" fill="url(#islvlamp)"/>`;
    s += `<path class="isl-vlamp" d="M${F(lx - bay * 0.09)} ${F(ly)}V${F(ly - bay * 0.24)}H${F(lx + bay * 0.09)}V${F(ly)}Z"/>`;
    s += `<path class="f-near" d="M${F(lx - bay * 0.13)} ${F(ly - bay * 0.24)}L${F(lx)} ${F(ly - bay * 0.34)}L${F(lx + bay * 0.13)} ${F(ly - bay * 0.24)}Z"/>`;
    // the palm, west of the lamp
    const px = bx - bay * 1.6;
    s += `<path class="f-near" d="${palm(px, g.at(px) + 2, bw * 0.72, -0.1, 17)}"/>`;
    return s;
  }

  const PIECES = { 'lecture-hall': lectureHall };

  function extraDefs() {
    return '<defs>'
      + '<radialGradient id="islvwarm"><stop offset="0" class="st-g1" stop-opacity=".34"/><stop offset=".6" class="st-g1" stop-opacity=".1"/><stop offset="1" class="st-g1" stop-opacity="0"/></radialGradient>'
      + '<linearGradient id="islvspill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-g1" stop-opacity=".22"/><stop offset="1" class="st-g1" stop-opacity="0"/></linearGradient>'
      + '<linearGradient id="islvarc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="st-g1" stop-opacity=".3"/><stop offset="1" class="st-g1" stop-opacity=".06"/></linearGradient>'
      + '<radialGradient id="islvlamp"><stop offset="0" class="st-k" stop-opacity=".55"/><stop offset=".5" class="st-k" stop-opacity=".16"/><stop offset="1" class="st-k" stop-opacity="0"/></radialGradient>'
      + '</defs>';
  }

  function build(W, H, piece) {
    const draw = PIECES[piece];
    if (!draw || W < 200 || H < 200) return '';
    const ppd = W / 62;
    const sunAz = SKY.d.sun[0];
    const y0 = Math.round(H * 0.58);
    const v = view(W * 0.3 - rel(sunAz) * ppd, y0, ppd, W, H);
    const sea = H - y0;
    const g = rise(W, H, W * 0.38, y0 + sea * 0.42, 23);
    const svg = `<svg class="isl-o isl-art" width="${F(W)}" height="${F(H)}" viewBox="0 0 ${F(W)} ${F(H)}">${defs(W, y0, H)}${extraDefs()}`
      + `<rect width="${F(W)}" height="${y0 + 1}" fill="url(#islskyg)"/>`
      + `<rect y="${F(y0 - 2.4 * ppd)}" width="${F(W)}" height="${F(2.4 * ppd)}" fill="url(#islhazeg)"/>`
      + L.glowSky(v, 'd', 'isl-d') + L.glowSky(v, 'n', 'isl-n')
      + stars(v, 'd', [], 'isl-d') + stars(v, 'n', [], 'isl-n')
      + L.planets(v, 'd', [], 'isl-d') + L.planets(v, 'n', [], 'isl-n')
      + L.moon(v, 'd', [], 'isl-d') + L.moon(v, 'n', [], 'isl-n')
      + islands(v, 'f-isl')
      + `<rect y="${y0}" width="${F(W)}" height="${F(sea + 1)}" fill="url(#islseag)"/>`
      + L.glowSea(v, 'd', 'isl-d', Math.min(sea - 1, 5.5 * ppd)) + L.glowSea(v, 'n', 'isl-n', Math.min(sea - 1, 5.5 * ppd))
      + `<path class="s-hz" d="M0 ${y0 + 0.5}H${F(W)}" stroke-width="1"/>`
      + ripples(v, 0, W, H, [], 9, 0.8)
      + land(v, 0, W, 13, [['d', 'isl-d', 1], ['n', 'isl-n', 0.6]])
      + `<path class="f-near" d="${g.d}"/>`
      + draw(W, H, v, g)
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
    let t;
    if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(t); t = setTimeout(paint, 150); }).observe(fig);
  };
})();
