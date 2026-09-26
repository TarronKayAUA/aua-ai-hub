/* Layout frame behaviour (layout redesign, 2026-09-25).
 *
 * 1. (Moved 2026-09-26: the docked action and the headings list are now
 *    part of the section navigator, docs/javascripts/layout-nav.js.)
 * 2. The menu button opens with Enter or Space, and the closed drawer is
 *    taken out of the Tab order (it held 89 invisible Tab stops, AC-2).
 * 3. The search field names what it searches, and the active tab is
 *    scrolled into view in the tab strip.
 * Nothing here is needed to read or use a page; without JavaScript every
 * action is still in the slot at the top and the drawer still works.
 */
(function () {
  "use strict";
  var wide = window.matchMedia("(min-width: 76.25em)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* --- search placeholder ------------------------------------------------ */
  var PLACEHOLDER = "Search guides, tools and prompts";
  document.querySelectorAll(".md-search__input").forEach(function (input) {
    input.setAttribute("placeholder", PLACEHOLDER);
    input.setAttribute("aria-label", PLACEHOLDER);
  });

  /* --- the tab strip: active tab into view, and "more" chevrons ------------
     When the strip is wider than the screen, a chevron at each edge that
     has tabs beyond it (and the fade under it) says there are more, and a
     tap scrolls the strip that way. The strip opens with the active tab in
     view and a whole tab, not a fragment, at its left edge. The chevrons
     are buttons with names, so voice control and screen readers can use
     them; they are left out of the Tab order because every tab link is
     already reachable with Tab, and focusing one scrolls it into view. */
  var tabList = document.querySelector(".md-tabs__list");
  var activeTab = document.querySelector(".md-tabs__item--active");
  var CHEVRON = {
    prev: "M15.41 16.58 10.83 12l4.58-4.59L14 6l-6 6 6 6z",
    next: "M8.59 16.58 13.17 12 8.59 7.41 10 6l6 6-6 6z"
  };
  function tabStrip(list) {
    var grid = list.parentNode;
    var rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
    function make(dir) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hub-tabs-more hub-tabs-more--" + dir;
      b.tabIndex = -1;
      b.setAttribute("aria-label", dir === "next" ? "Show more sections" : "Show earlier sections");
      b.title = dir === "next" ? "More sections" : "Earlier sections";
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' +
        CHEVRON[dir] + '"/></svg>';
      b.hidden = true;
      b.addEventListener("click", function () {
        var step = Math.max(list.clientWidth * 0.6, 120) * (dir === "next" ? 1 : -1);
        list.scrollBy({ left: step, behavior: reduce.matches ? "auto" : "smooth" });
      });
      grid.appendChild(b);
      return b;
    }
    var prev = make("prev");
    var next = make("next");
    function sync() {
      var max = list.scrollWidth - list.clientWidth;
      var atStart = list.scrollLeft <= 2;
      var atEnd = list.scrollLeft >= max - 2;
      prev.hidden = max <= 2 || atStart;
      next.hidden = max <= 2 || atEnd;
      grid.classList.toggle("hub-tabs--more-prev", !prev.hidden);
      grid.classList.toggle("hub-tabs--more-next", !next.hidden);
    }
    // Open on the active tab, with the tab before it whole at the left
    // edge (clear of the chevron) when both fit.
    if (activeTab && list.scrollWidth > list.clientWidth) {
      var items = Array.prototype.slice.call(list.children);
      var at = items.indexOf(activeTab);
      var origin = list.getBoundingClientRect().left - list.scrollLeft;
      var leftOf = function (item) { return item.getBoundingClientRect().left - origin; };
      var reserve = 2 * rem;
      var target = leftOf(activeTab) - reserve;
      var before = items[at - 1];
      if (before && leftOf(before) - reserve + list.clientWidth
          >= leftOf(activeTab) + activeTab.offsetWidth + reserve) {
        target = leftOf(before) - reserve;
      }
      list.scrollLeft = at <= 0 ? 0 : Math.max(0, target);
    }
    grid.classList.add("hub-tabs");
    var queued = false;
    list.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () { queued = false; sync(); });
    }, { passive: true });
    window.addEventListener("resize", sync);
    sync();
  }
  if (tabList) tabStrip(tabList);

  /* --- heading permalinks out of the Tab order ----------------------------- */
  document.querySelectorAll(".md-typeset .headerlink").forEach(function (a) {
    a.setAttribute("tabindex", "-1");
  });

  /* --- menu button and drawer ---------------------------------------------- */
  var drawer = document.getElementById("__drawer");
  var menu = document.querySelector('label[for="__drawer"][role="button"]');
  var side = document.querySelector(".md-sidebar--primary");
  function syncDrawer() {
    if (!side || !drawer) return;
    var hidden = !wide.matches && !drawer.checked;
    if ("inert" in side) side.inert = hidden;
    if (menu) menu.setAttribute("aria-expanded", drawer.checked ? "true" : "false");
  }
  if (menu && drawer) {
    menu.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        drawer.checked = !drawer.checked;
        drawer.dispatchEvent(new Event("change"));
        syncDrawer();
      }
    });
    drawer.addEventListener("change", syncDrawer);
    wide.addEventListener("change", syncDrawer);
    syncDrawer();
  }
  // The docked action, the phone action bar and the Sections sheet that
  // lived here moved to docs/javascripts/layout-nav.js, the section
  // navigator (navigation design d2, 2026-09-26).
})();
