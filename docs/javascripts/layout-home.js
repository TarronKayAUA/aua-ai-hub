/* Home page and News & Events landing (layout redesign, 2026-09-25).
 *
 * 1. The search field in the home hero opens the site's own search.
 *    A tap or click moves focus into Material's search box in the same
 *    event, which is what lets a phone raise its keyboard; typing into the
 *    field, or pressing Enter, carries the text across. Without this
 *    script the field still works: it submits to ?q=, which Material's
 *    search reads on load.
 * 2. The timely blocks cannot outlive their dates. scripts/layout_home.py
 *    computes open and passed against the build date and renders the next
 *    few items hidden behind the visible ones; if the reader's own date is
 *    later than the build's, an item whose date has passed is dropped, the
 *    next one shown, and an open deadline that has since passed says so.
 *    The "Status as of" line keeps the build date on purpose, so a stalled
 *    build still shows.
 */
(function () {
  "use strict";

  /* --- 1. search field ------------------------------------------------------ */
  var form = document.querySelector("form[data-home-search]");
  var field = form && form.querySelector("input");
  var query = document.querySelector(".md-search__input");
  var toggle = document.getElementById("__search");

  function openSearch() {
    if (!field || !query) return false;
    var text = field.value;
    field.value = "";
    if (toggle && !toggle.checked) toggle.click();
    query.focus();
    if (text) {
      query.value = text;
      query.dispatchEvent(new Event("input", { bubbles: true }));
      query.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    }
    return true;
  }

  if (field && query) {
    field.addEventListener("click", openSearch);
    field.addEventListener("keydown", function (e) {
      if (e.isComposing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        openSearch();
      } else if (e.key && e.key.length === 1) {
        // Focus moves before the character lands, so it lands in the
        // site search rather than here.
        openSearch();
      }
    });
    form.addEventListener("submit", function (e) {
      if (openSearch()) e.preventDefault();
    });
  }

  /* --- 2. reader-side date check -------------------------------------------- */
  var groups = document.querySelectorAll("[data-timely-group]");
  if (!groups.length) return;
  var now = new Date();
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  var today = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());

  groups.forEach(function (list) {
    if (today <= (list.getAttribute("data-built") || "")) return;
    var show = parseInt(list.getAttribute("data-show"), 10) || 1;
    var shown = 0;
    list.querySelectorAll("li.timely-item").forEach(function (li) {
      var until = li.getAttribute("data-until");
      var live = !until || until >= today;
      li.hidden = !(live && shown < show);
      if (!li.hidden) shown += 1;
    });
    var empty = list.querySelector("[data-timely-empty]");
    if (empty) empty.hidden = shown > 0;
    list.querySelectorAll("[data-open-until]").forEach(function (meta) {
      if (meta.getAttribute("data-open-until") < today) {
        meta.textContent = meta.getAttribute("data-passed-text");
      }
    });
  });
})();
