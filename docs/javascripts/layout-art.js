/* Layout redesign (2026-09-25): behaviour for the art package.

   Island Night (2026-09-26): the site's scenery, a view from Curtain Bluff on Antigua's south-west
   coast at dusk. This file only decides what a page needs and fetches it:
   - the home page hero (the element marked data-island-hero) needs docs/assets/art/island-core.js;
   - the gutters beside the page column (the element marked data-island-sides, written by
     overrides/main.html on every page) need island-core.js and
     island-sides.js, and only when a gutter is at least 80px wide. Phones never fetch either
     gutter file, and a page with neither mark fetches nothing.
   - the fainter stars (docs/assets/art/island-deep.js, about 40 KB compressed) only at Night (a picture
     whose clock says Night, or the dark scheme's gutters),
     a few seconds after the page has loaded (or when the reader switches to dark), then every drawing
     redraws once with them;
   - a vignette (a figure marked data-vignette, placed by scripts/layout_art.py from
     data/art_slots.yaml) needs island-core.js and island-vignettes.js, only once one is shown
     (from 68.75em; below that it is hidden and nothing is fetched).
   The drawing, its sources and its checks are described at the top of island-core.js. Styles:
   docs/stylesheets/layout-art.css. Without JavaScript the hero keeps its plain brand gradient. */
(function () {
  'use strict';
  var hero = document.querySelector('[data-island-hero]');
  var sides = document.querySelector('[data-island-sides]');
  var vigs = document.querySelectorAll('figure[data-vignette]');
  if (!hero && !sides && !vigs.length) return;
  var me = document.currentScript && document.currentScript.src;
  var base = me ? me.replace(/javascripts\/layout-art\.js(\?.*)?$/, '') : '';
  var state = {};

  function wide() {
    var grid = document.querySelector('.md-main .md-grid');
    return !!grid && grid.getBoundingClientRect().left >= 80;
  }

  function load(name, done) {
    if (state[name] === 'ready') return done();
    if (state[name]) return;
    state[name] = 'loading';
    var s = document.createElement('script');
    s.src = base + 'assets/art/' + name;
    s.async = true;
    s.onload = function () { state[name] = 'ready'; done(); };
    s.onerror = function () { state[name] = 'failed'; };
    document.head.appendChild(s);
  }

  function shownVigs() {
    return Array.prototype.filter.call(vigs, function (f) { return f.offsetWidth > 0; });
  }
  // The bold homepage hero (desktop, from 68.75em) draws the campus, which lives in
  // island-vignettes.js: that file is fetched before the hero paints, so the picture appears once,
  // complete. If it fails, the hero paints the Curtain Bluff view as before.
  var boldHero = hero && window.matchMedia('(min-width: 68.75em)').matches;
  function then(name, done) {
    if (state[name] === 'ready' || state[name] === 'failed') return done();
    var s = document.createElement('script');
    s.src = base + 'assets/art/' + name;
    s.async = true;
    state[name] = 'loading';
    s.onload = function () { state[name] = 'ready'; done(); };
    s.onerror = function () { state[name] = 'failed'; done(); };
    document.head.appendChild(s);
  }
  function run() {
    var wantSides = sides && wide();
    var wantVigs = shownVigs().length > 0;
    if (!hero && !wantSides && !wantVigs) return;
    load('island-core.js', function () {
      var A = window.IslandArt;
      if (!A || !A.lib) return;
      if (hero && boldHero) then('island-vignettes.js', function () { A.hero(hero); });
      else if (hero) A.hero(hero);
      if (wantSides) load('island-sides.js', function () { if (A.sides) A.sides(sides); });
      if (wantVigs) load('island-vignettes.js', function () {
        if (A.vignette) shownVigs().forEach(A.vignette);
      });
    });
  }

  run();
  // The fainter stars: night only (a picture whose clock says Night, or the dark scheme's gutters), after
  // the page (and the hero's one pass) has settled.
  function deepWanted() {
    var night = document.body.getAttribute('data-md-color-scheme') === 'slate' || !!document.querySelector('.isl[data-sky="night"]');
    return night && state['island-core.js'] === 'ready' &&
      window.matchMedia('(min-width: 60em)').matches;   // phones: the small hero would not show them
  }
  function deep() {
    if (!deepWanted() || state['island-deep.js']) return;
    load('island-deep.js', function () {
      var A = window.IslandArt;
      (A && A.redraw || []).forEach(function (f) { f(); });
    });
  }
  if (document.readyState === 'complete') setTimeout(deep, 4500);
  else window.addEventListener('load', function () { setTimeout(deep, 4500); });
  if ('MutationObserver' in window) {
    new MutationObserver(deep).observe(document.body, { attributes: true, attributeFilter: ['data-md-color-scheme'] });
  }
  if (sides || vigs.length) {
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(run, 250);
    });
  }
})();
