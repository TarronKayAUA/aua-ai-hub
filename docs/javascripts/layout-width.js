/* Reading pages use the width (width round, designer C, review fix 6).
 *
 * Every arrangement a reader takes in "down the left, then the right" (a
 * two-column spread, lettered subsections side by side, prose beside its
 * figure, two sections paired in a row) is built to fit one screen, so no
 * one scrolls back up to start the second column. That holds for ordinary
 * windows; a short window, browser zoom or enlarged text can break it. This
 * measures each one as laid out and, when it is taller than the space below
 * the header, sets it as one sequential column at the same measure (the
 * .w-single and .w-stack rules in layout-width.css). It re-checks when the
 * window, zoom or fonts change. Without JavaScript, a height media query in
 * the stylesheet does the same for short windows.
 */
(function () {
  "use strict";
  var page = document.querySelector(".w-page");
  if (!page) return;
  var wide = window.matchMedia("(min-width: 68.75em)");

  function avail() {
    var header = document.querySelector(".md-header");
    var top = header ? header.getBoundingClientRect().bottom : 0;
    return window.innerHeight - Math.max(0, top) - 24;
  }

  // Two cells read side by side in the grid: neither spans both tracks.
  function pairs() {
    var out = [];
    document.querySelectorAll(".w-rows").forEach(function (rows) {
      var cells = Array.prototype.filter.call(rows.children, function (c) {
        return c.classList.contains("w-cell") && !c.classList.contains("w-span");
      });
      for (var i = 0; i + 1 < cells.length; i += 2) out.push([cells[i], cells[i + 1]]);
    });
    return out;
  }

  function check() {
    var all = page.querySelectorAll(".w-single, .w-stack");
    Array.prototype.forEach.call(all, function (el) { el.classList.remove("w-single", "w-stack"); });
    if (!wide.matches) return;
    var room = avail();
    var flows = Array.prototype.filter.call(page.querySelectorAll(".w-flow"), function (f) {
      return f.getBoundingClientRect().height > room;
    });
    var sides = Array.prototype.filter.call(page.querySelectorAll(".w-leaf, .w-pair"), function (s) {
      return s.firstElementChild && s.firstElementChild.getBoundingClientRect().height > room &&
        s.children.length > 1;
    });
    var rows = pairs().filter(function (p) {
      return p[0].getBoundingClientRect().height > room;
    });
    // Read everything first, then write, so one change cannot mislead the next.
    flows.forEach(function (f) { f.classList.add("w-single"); });
    sides.forEach(function (s) { s.classList.add("w-stack"); });
    rows.forEach(function (p) { p[0].classList.add("w-stack"); p[1].classList.add("w-stack"); });
  }

  var timer = null;
  function later() {
    window.clearTimeout(timer);
    timer = window.setTimeout(check, 80);
  }
  check();
  window.addEventListener("resize", later);
  window.addEventListener("load", check);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(check);
  if (wide.addEventListener) wide.addEventListener("change", check);
})();
