/* Layout redesign (2026-09-25): behaviour for the news package.
 *
 * 1. This Week's row of section links sticks under the header from 60em
 *    (layout-news.css). This keeps --news-sticky-top equal to the header's
 *    real height, which changes with the width, and marks the link of the
 *    section being read with aria-current="location".
 * 2. The LiveBench table keeps scrolling sideways on narrow screens, with
 *    its rank and model columns held in place. This marks the table
 *    .is-scrollable whenever it is wider than its column, which shows the
 *    "Swipe for category scores" hint only when there is something to swipe
 *    to. Material wraps tables in its scroll container after load, so the
 *    check runs on resize and whenever the table's box changes.
 * Without JavaScript the row still jumps and the table still scrolls; only
 * the current-section mark and the hint are missing.
 */
(function () {
  "use strict";

  /* --- This Week: sticky section row ------------------------------------- */
  var row = document.querySelector(".md-typeset .section-chips");
  var header = document.querySelector(".md-header");
  if (row) {
    var links = Array.prototype.slice.call(row.querySelectorAll('a[href^="#"]'));
    var targets = links.map(function (a) {
      return document.getElementById(decodeURIComponent(a.getAttribute("href").slice(1)));
    });
    var sticky = window.matchMedia("(min-width: 60em)");

    var setTop = function () {
      if (header) {
        document.documentElement.style.setProperty(
          "--news-sticky-top", header.getBoundingClientRect().height + "px");
      }
    };

    var mark = function () {
      var box = row.getBoundingClientRect();
      var top = header ? header.getBoundingClientRect().bottom : 0;
      row.classList.toggle("is-stuck", sticky.matches && window.scrollY > 0 && box.top <= top + 1);
      // A section is "in view" once its heading has risen into the top
      // part of the window, just under the row.
      var line = box.bottom + Math.min(120, window.innerHeight * 0.2);
      var current = -1;
      targets.forEach(function (h, i) {
        if (h && h.getBoundingClientRect().top <= line) current = i;
      });
      if (!sticky.matches) current = -1;
      links.forEach(function (a, i) {
        if (i === current) a.setAttribute("aria-current", "location");
        else a.removeAttribute("aria-current");
      });
    };

    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () { ticking = false; mark(); });
      }
    }, { passive: true });
    window.addEventListener("resize", function () { setTop(); mark(); });
    window.addEventListener("hashchange", function () { window.requestAnimationFrame(mark); });
    window.addEventListener("load", mark);
    if (header && "ResizeObserver" in window) {
      new ResizeObserver(setTop).observe(header);
    }
    setTop();
    mark();
  }

  /* --- Search results: keep the first match in view ------------------------
   * layout-news.css cuts each result to a few lines under its title. When a
   * result's first matched word falls below the cut (searching "Copilot"
   * found the Assistants section, whose text names ten tools before it),
   * the text is re-cut to start shortly before that word, with an ellipsis,
   * so a reader can see why the result is there. Material re-renders the
   * list as you type, so new results are handled as they arrive. */
  var list = document.querySelector(".md-search-result__list");
  if (list && "MutationObserver" in window) {
    var CONTEXT = 60; // characters kept before the match

    var windowResult = function (article) {
      var box = article.getBoundingClientRect();
      if (!box.height) return; // inside a closed "more on this page"
      article.setAttribute("data-news-windowed", "");
      var heading = article.querySelector("h1, h2");
      if (!heading || heading.querySelector("mark")) return;
      var mark = null;
      article.querySelectorAll("mark").forEach(function (m) {
        if (!mark && !heading.contains(m)) mark = m;
      });
      if (!mark || mark.getBoundingClientRect().bottom <= box.bottom + 1) return;
      var start = heading.nextSibling;
      if (!start) return;
      var before = document.createRange();
      before.setStartBefore(start);
      before.setEndBefore(mark);
      var lead = before.toString().replace(/\s+/g, " ");
      lead = lead.slice(Math.max(0, lead.length - CONTEXT));
      lead = lead.replace(/^\S*\s/, "");
      var after = document.createRange();
      after.setStartBefore(mark);
      after.setEndAfter(article.lastChild);
      var rest = after.extractContents();
      before.deleteContents();
      var snippet = document.createElement("span");
      snippet.className = "news-search-snippet";
      snippet.appendChild(document.createTextNode("… " + lead));
      snippet.appendChild(rest);
      article.appendChild(snippet);
    };

    var scan = function () {
      list.querySelectorAll(".md-search-result__article:not([data-news-windowed])").forEach(windowResult);
    };
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      window.requestAnimationFrame(function () { pending = false; scan(); });
    }).observe(list, { childList: true, subtree: true });
  }

  /* --- LiveBench: swipe hint when the table overflows ---------------------- */
  var box = document.querySelector(".livebench-table");
  var table = box && box.querySelector("table");
  if (table) {
    var update = function () {
      var el = table.closest(".md-typeset__scrollwrap") || table;
      box.classList.toggle("is-scrollable", el.scrollWidth > el.clientWidth + 1);
    };
    if ("ResizeObserver" in window) {
      new ResizeObserver(update).observe(box);
    }
    window.addEventListener("resize", update);
    window.addEventListener("load", update);
    update();
  }
})();
