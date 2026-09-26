/* Arriving at a collapsed block by link opens it, so the reader lands on
   the content rather than a closed toggle. Two shapes:
   - a heading (h2 to h4) followed by a collapsed block before the next
     heading: the Tool Directory's categories and open-weights models (the
     generic behaviour since 2026-07-14);
   - a link to a <details> element itself, or to anything inside one: the
     Prompt Library's notes at the foot (what the statuses mean, and what
     to expect across models), linked from the line under its title and
     from every prompt page (layout redesign, 2026-09-25).
   Manual scrollers still open blocks by hand. No-op on pages without
   collapsed blocks. */
(function () {
  "use strict";

  function expandForHash() {
    if (!location.hash) {
      return;
    }
    var id;
    try {
      id = decodeURIComponent(location.hash.slice(1));
    } catch (err) {
      return;
    }
    var target = document.getElementById(id);
    if (!target) {
      return;
    }
    if (target.tagName === "DETAILS" || (target.closest && target.closest("details"))) {
      var opened = false;
      for (var el = target; el; el = el.parentElement) {
        if (el.tagName === "DETAILS" && !el.open) {
          el.open = true;
          opened = true;
        }
      }
      if (opened) {
        target.scrollIntoView();
      }
      return;
    }
    if (!/^H[2-4]$/.test(target.tagName)) {
      return;
    }
    var next = target.nextElementSibling;
    while (next && !/^H[1-4]$/.test(next.tagName)) {
      if (next.tagName === "DETAILS") {
        next.open = true;
        break;
      }
      next = next.nextElementSibling;
    }
  }

  // A link to the hash already in the address fires no hashchange, so
  // same-page links are handled on click as well.
  document.addEventListener("click", function (e) {
    var link = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (link && link.getAttribute("href") === location.hash) {
      setTimeout(expandForHash, 0);
    }
  });
  window.addEventListener("hashchange", expandForHash);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", expandForHash);
  } else {
    expandForHash();
  }
})();
