/* Prompt library: arriving at a prompt by link (the at-a-glance table,
   the right-hand table of contents, or an external link) expands that
   prompt's collapsed "Show the prompt" block, so the reader lands on
   the content rather than a closed toggle. Manual scrollers still open
   blocks by hand. No-op on pages without collapsed blocks. */
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
    if (!target || !/^H[2-4]$/.test(target.tagName)) {
      return;
    }
    var el = target.nextElementSibling;
    while (el && !/^H[1-4]$/.test(el.tagName)) {
      if (el.tagName === "DETAILS") {
        el.open = true;
        break;
      }
      el = el.nextElementSibling;
    }
  }

  window.addEventListener("hashchange", expandForHash);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", expandForHash);
  } else {
    expandForHash();
  }
})();
