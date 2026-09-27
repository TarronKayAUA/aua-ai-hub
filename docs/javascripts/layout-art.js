/* Layout redesign (2026-09-25): behaviour for the art package.

   Island Night (2026-09-26): the site's scenery, a view from Curtain Bluff on Antigua's south-west
   coast at dusk. This file only decides what a page needs and fetches it:
   - the home page hero (the element marked data-island-hero) needs docs/assets/art/island-core.js;
   - the gutters beside the page column (the element marked data-island-sides, written by
     overrides/main.html on every page) need island-core.js and
     island-sides.js, and only when a gutter is at least 80px wide. Phones never fetch either
     gutter file, and a page with neither mark fetches nothing.
   The drawing, its sources and its checks are described at the top of island-core.js. Styles:
   docs/stylesheets/layout-art.css. Without JavaScript the hero keeps its plain brand gradient. */
(function () {
  'use strict';
  var hero = document.querySelector('[data-island-hero]');
  var sides = document.querySelector('[data-island-sides]');
  if (!hero && !sides) return;
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

  function run() {
    var wantSides = sides && wide();
    if (!hero && !wantSides) return;
    load('island-core.js', function () {
      var A = window.IslandArt;
      if (!A || !A.lib) return;
      if (hero) A.hero(hero);
      if (wantSides) load('island-sides.js', function () { if (A.sides) A.sides(sides); });
    });
  }

  run();
  if (sides) {
    var t;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(run, 250);
    });
  }
})();
