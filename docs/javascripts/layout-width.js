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
    var all = page.querySelectorAll(".w-single, .w-stack, .w-cols");
    Array.prototype.forEach.call(all, function (el) { el.classList.remove("w-single", "w-stack", "w-cols"); });
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
    // Space round (owner, 2026-09-27): a section stacked across the whole
    // width left its right half empty. Each stacked section (a paired cell,
    // or a side of lettered parts) now sets its own text in two columns
    // when that brings it within one screen, so the rule above still holds;
    // one taller than two screens stays one column.
    var parts = [];
    rows.forEach(function (p) { parts.push(p[0], p[1]); });
    sides.forEach(function (s) {
      if (s.classList.contains("w-pair")) Array.prototype.forEach.call(s.children, function (c) { parts.push(c); });
    });
    // A lettered part left alone in its row (no partner of similar length)
    // has the same empty half beside it.
    Array.prototype.forEach.call(page.querySelectorAll(".w-pair > .w-pair__side:only-child"), function (c) {
      parts.push(c);
    });
    parts.forEach(function (el) { el.classList.add("w-cols"); });
    var tall = parts.filter(function (el) { return el.getBoundingClientRect().height > room; });
    tall.forEach(function (el) { el.classList.remove("w-cols"); });
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
