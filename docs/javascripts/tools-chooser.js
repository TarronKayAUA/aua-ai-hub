/* Tool Directory: the task chooser on a two-pane shelf.

   Task chooser owner approved 2026-09-23; shelf layout from the layout
   redesign, 2026-09-25 (plan change L15).

   Progressive enhancement over the build-time task index that
   scripts/render_data.py renders from data/tools.yaml and
   data/tool_tasks.yaml (#tool-task-index). That index is the data source
   and the no-JavaScript fallback at once: each .tt-item carries the task
   id, chip label and group as data attributes, links to its tools' cards
   by #tool-... anchors, and holds the "Where to start", guide and
   standings sentences already rendered (so MkDocs has rewritten and
   checked their links).

   With JavaScript the index is hidden and replaced by a radio group of
   chips in the filter column (sticky beside the results from 60em). The
   results pane gains a live count with one "Show all", and choosing a task
   shows its cards above the category rows, cloned from those rows so the
   card markup has one source. The rows themselves never change: every
   card stays in the page's HTML, in its category, for site search, search
   engines and existing #category and #tool-... links.

   On phones, a task chosen by touch or pointer folds the chips to one line
   ("Study for exams, 11 tools [Change task]") so the results start on the
   first screen. A choice made with the keyboard never folds the group,
   because arrow keys move through it and hiding it would drop focus; the
   status line announces the count instead.

   URL: ?task=<id> selects a task on arrival and is kept current with
   replaceState, so the address bar is always a shareable link. */
(function () {
  "use strict";

  var DEBOUNCE_MS = 450;
  var phone = window.matchMedia("(max-width: 59.9375em)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function behavior() {
    return reduce.matches ? "auto" : "smooth";
  }

  function init() {
    var index = document.getElementById("tool-task-index");
    var host = document.getElementById("tool-chooser");
    var shelf = document.getElementById("directory-shelf");
    if (!index || !host || !shelf) return;
    var filters = shelf.querySelector(".shelf__filters");
    var pane = shelf.querySelector(".shelf__results");
    if (!filters || !pane) return;

    var items = [].slice.call(index.querySelectorAll(".tt-item[data-task]"));
    if (!items.length) return;

    var tasks = items.map(function (el) {
      var ids = [].slice.call(el.querySelectorAll(".tt-tools a[href^='#tool-']"))
        .map(function (a) { return a.getAttribute("href").slice(1); });
      var guide = el.querySelector(".tt-guide");
      var standing = el.querySelector(".tt-standing");
      var start = el.querySelector(".tt-start");
      return {
        id: el.getAttribute("data-task"),
        label: el.getAttribute("data-label"),
        heading: el.getAttribute("data-heading") || el.getAttribute("data-label"),
        group: el.getAttribute("data-group") || "task",
        home: el.getAttribute("data-home") || "",
        ids: ids,
        guideHTML: guide ? guide.innerHTML : "",
        standingHTML: standing ? standing.innerHTML : "",
        startHTML: start ? start.innerHTML : ""
      };
    });
    var byId = {};
    tasks.forEach(function (t) { byId[t.id] = t; });
    var total = document.querySelectorAll("article .tool-card-title[id^='tool-']").length;

    function noun(n) { return n + (n === 1 ? " tool" : " tools"); }

    /* ---- filter column: chips and the phone summary ------------------ */
    function chip(t) {
      var inputId = "tc-" + t.id;
      var n = t.ids.length;
      return '<span class="tc-chip">' +
        '<input type="radio" name="tc-task" id="' + esc(inputId) + '" value="' + esc(t.id) + '">' +
        '<label for="' + esc(inputId) + '"><span class="tc-label">' + esc(t.label) + "</span>" +
        '<span class="tc-count" aria-hidden="true">' + n + "</span>" +
        '<span class="tc-sr">, ' + noun(n) + "</span>" +
        "</label></span>";
    }
    var taskChips = tasks.filter(function (t) { return t.group !== "data"; }).map(chip).join("");
    var dataChips = tasks.filter(function (t) { return t.group === "data"; }).map(chip).join("");

    host.innerHTML =
      '<form class="tc-form" action="#" onsubmit="return false">' +
      '<fieldset class="tc-fieldset">' +
      '<legend class="tc-legend">What do you want to do?</legend>' +
      '<div class="tc-chips">' + taskChips + "</div>" +
      (dataChips ? '<p class="tc-subhead">Or by data and licensing</p>' +
        '<div class="tc-chips">' + dataChips + "</div>" : "") +
      "</fieldset></form>";

    var summary = document.createElement("div");
    summary.className = "shelf__summary tool-summary";
    summary.hidden = true;
    summary.innerHTML =
      '<p class="tool-summary__text"><strong id="ts-label"></strong>,' +
      ' <span class="tool-summary__count" id="ts-count"></span></p>' +
      '<button type="button" class="tool-summary__change" id="ts-change"' +
      ' aria-controls="tool-chooser" aria-expanded="false">Change task</button>';
    host.parentNode.insertBefore(summary, host);

    /* ---- results pane: count line, live status, the chosen set ------- */
    var statusline = pane.querySelector(".tool-statusline");
    var countLine = document.createElement("div");
    countLine.className = "tool-count";
    countLine.hidden = true;
    countLine.innerHTML =
      // Ids here start "tc-", never "tool-", which card anchors own.
      '<p class="tool-count__text" id="tc-count-text"></p>' +
      '<button type="button" class="tool-showall" id="tc-showall">Show all</button>';
    var live = document.createElement("p");
    live.className = "tool-sr";
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    live.setAttribute("aria-atomic", "true");
    var results = document.createElement("section");
    results.className = "tool-set";
    results.id = "tc-results";
    results.hidden = true;
    results.setAttribute("aria-labelledby", "tc-results-heading");
    results.innerHTML =
      '<h2 class="tool-set__heading" id="tc-results-heading"></h2>' +
      '<div class="tool-start" id="tc-start"></div>' +
      '<p class="tool-set__standing" id="tc-standing"></p>' +
      '<div class="tool-grid tool-set__grid" id="tc-grid"></div>' +
      '<div id="tc-also"></div>' +
      '<p class="tool-set__guide" id="tc-guide"></p>' +
      '<p class="tool-set__foot"><a id="tc-permalink" href="#">Link to this list</a></p>';
    pane.insertBefore(countLine, pane.firstChild);
    pane.insertBefore(live, countLine.nextSibling);
    var after = statusline || live;
    pane.insertBefore(results, after.nextSibling);

    index.hidden = true;
    host.hidden = false;
    shelf.classList.add("is-enhanced");

    var countText = document.getElementById("tc-count-text");
    var showAll = document.getElementById("tc-showall");
    var heading = document.getElementById("tc-results-heading");
    var startEl = document.getElementById("tc-start");
    var standingEl = document.getElementById("tc-standing");
    var guideEl = document.getElementById("tc-guide");
    var grid = document.getElementById("tc-grid");
    var also = document.getElementById("tc-also");
    var permalink = document.getElementById("tc-permalink");
    var tsLabel = document.getElementById("ts-label");
    var tsCount = document.getElementById("ts-count");
    var tsChange = document.getElementById("ts-change");
    var timer = null;

    /* ---- helpers ------------------------------------------------------ */
    function categoryOf(card) {
      var row = card.closest(".tool-cat");
      var h = row && row.querySelector("h2[id]");
      if (!h) return null;
      return { id: h.id, label: (h.firstChild ? h.firstChild.textContent : h.textContent).trim() };
    }

    function cloneCard(id, homeCategory) {
      var title = document.getElementById(id);
      var src = title && title.closest(".tool-card");
      if (!src) return null;
      var c = src.cloneNode(true);
      [].slice.call(c.querySelectorAll("[id]")).forEach(function (el) { el.removeAttribute("id"); });
      c.classList.add("tc-clone");
      c.setAttribute("data-tool", id);
      var cat = categoryOf(src);
      if (cat && cat.id !== homeCategory) {
        var p = document.createElement("p");
        p.className = "tc-home";
        p.innerHTML = 'In the directory under <a href="#' + esc(cat.id) + '">' + esc(cat.label) + "</a>";
        c.appendChild(p);
      }
      return { el: c, cat: cat };
    }

    function announce(text) {
      clearTimeout(timer);
      // Empty first, then set, so repeating the same text is re-announced.
      live.textContent = "";
      timer = setTimeout(function () { live.textContent = text; }, DEBOUNCE_MS);
    }

    function setURL(taskId) {
      if (!window.history || !history.replaceState) return;
      var url = location.pathname + (taskId ? "?task=" + encodeURIComponent(taskId) : "");
      history.replaceState(null, "", url);
    }

    function headerOffset() {
      var header = document.querySelector(".md-header");
      var r = header ? header.getBoundingClientRect() : null;
      return (r && r.bottom > 0 ? r.bottom : 0) + 12;
    }

    function scrollToEl(el, extra) {
      var y = el.getBoundingClientRect().top + window.pageYOffset - headerOffset() - (extra || 0);
      window.scrollTo({ top: Math.max(0, y), behavior: behavior() });
    }

    /* ---- fold (phones only; CSS ignores it from 60em) ----------------- */
    function fold(on) {
      shelf.classList.toggle("is-folded", on);
      summary.hidden = !on;
      tsChange.setAttribute("aria-expanded", on ? "false" : "true");
    }

    /* ---- render ------------------------------------------------------- */
    function show(taskId, opts) {
      opts = opts || {};
      var t = byId[taskId];
      if (!t) return clear(opts);
      var radio = document.getElementById("tc-" + taskId);
      if (radio && !radio.checked) radio.checked = true;
      var n = t.ids.length;

      heading.textContent = t.heading;
      startEl.innerHTML = t.startHTML;
      startEl.hidden = !t.startHTML;
      standingEl.innerHTML = t.standingHTML;
      standingEl.hidden = !t.standingHTML;
      guideEl.innerHTML = t.guideHTML;
      guideEl.hidden = !t.guideHTML;

      grid.innerHTML = "";
      also.innerHTML = "";
      var home = [], elsewhere = [];
      t.ids.forEach(function (id) {
        var c = cloneCard(id, t.home);
        if (!c) return;
        (t.home && c.cat && c.cat.id !== t.home ? elsewhere : home).push(c.el);
      });
      home.forEach(function (el) { grid.appendChild(el); });
      if (elsewhere.length) {
        var label = document.createElement("p");
        label.className = "tc-also-heading";
        label.textContent = "Also useful, from other categories";
        also.appendChild(label);
        var g2 = document.createElement("div");
        g2.className = "tool-grid tool-set__grid";
        elsewhere.forEach(function (el) { g2.appendChild(el); });
        also.appendChild(g2);
      }

      countText.innerHTML = "Showing <strong>" + n + "</strong> of " + total + " tools";
      tsLabel.textContent = t.label;
      tsCount.textContent = noun(n);
      permalink.setAttribute("href", "?task=" + encodeURIComponent(taskId));
      results.hidden = false;
      countLine.hidden = false;
      announce(noun(n) + " for " + t.heading + ", listed below.");
      if (opts.url !== false) setURL(taskId);
    }

    function clear(opts) {
      opts = opts || {};
      host.querySelectorAll("input[name='tc-task']").forEach(function (r) { r.checked = false; });
      results.hidden = true;
      countLine.hidden = true;
      grid.innerHTML = "";
      also.innerHTML = "";
      fold(false);
      if (opts.announce !== false) announce("Showing all " + total + " tools, by category.");
      if (opts.url !== false) setURL("");
    }

    /* Pointer and touch choices are told apart from keyboard ones, because
       only they may fold the chips or scroll the page. */
    var byPointer = false;
    host.addEventListener("pointerdown", function (ev) {
      byPointer = !!(ev.target && ev.target.closest && ev.target.closest(".tc-chip"));
    });
    host.addEventListener("change", function (ev) {
      if (!ev.target || ev.target.name !== "tc-task") return;
      var pointer = byPointer;
      byPointer = false;
      show(ev.target.value);
      if (phone.matches) {
        if (!pointer) return;
        fold(true);
        // The chip just chosen is hidden now; keep focus on the control
        // that brings it back rather than letting it fall to the page.
        tsChange.focus({ preventScroll: true });
        var r = summary.getBoundingClientRect();
        if (r.top < headerOffset() - 12 || r.top > window.innerHeight * 0.45) scrollToEl(summary);
      } else {
        // Wide screens: the chips stay put in their sticky column, so the
        // results can be brought into view without losing the reader's
        // place in the group.
        // The extra 48px clears Material's "Back to top" pill, which
        // appears under the header while the page scrolls up.
        var top = countLine.getBoundingClientRect().top;
        if (top < headerOffset() - 12) scrollToEl(countLine, 48);
      }
    });

    tsChange.addEventListener("click", function () {
      fold(false);
      var checked = host.querySelector("input[name='tc-task']:checked") ||
        host.querySelector("input[name='tc-task']");
      if (checked) checked.focus({ preventScroll: true });
      var r = host.getBoundingClientRect();
      if (r.top < headerOffset() - 12) scrollToEl(host);
    });

    showAll.addEventListener("click", function () {
      clear();
      var first = host.querySelector("input[name='tc-task']");
      if (first) first.focus({ preventScroll: true });
    });

    /* "Where to start" names link to their cards; inside the chosen set,
       go to the copy shown in the results rather than the closed row. */
    startEl.addEventListener("click", function (ev) {
      var a = ev.target.closest && ev.target.closest("a[href^='#tool-']");
      if (!a) return;
      var clone = results.querySelector('.tc-clone[data-tool="' + a.getAttribute("href").slice(1) + '"]');
      if (!clone) return;
      ev.preventDefault();
      flash(clone);
      clone.scrollIntoView({ block: "center", behavior: behavior() });
      var link = clone.querySelector(".tool-card-title a");
      if (link) link.focus({ preventScroll: true });
    });

    /* ---- card anchors: open the row around #tool-... ------------------ */
    function flash(card) {
      card.classList.remove("tc-target");
      void card.offsetWidth; // restart the highlight
      card.classList.add("tc-target");
    }
    function revealCardFromHash() {
      if (!location.hash || location.hash.indexOf("#tool-") !== 0) return;
      var title = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      var card = title && title.closest(".tool-card");
      if (!card) return;
      var det = card.closest("details");
      if (det) det.open = true;
      flash(card);
      card.scrollIntoView({ block: "center" });
    }
    window.addEventListener("hashchange", revealCardFromHash);

    /* A window widened past 60em shows every chip again (CSS); a folded
       summary left behind would be stale, so drop the fold state. */
    phone.addEventListener("change", function () {
      if (!phone.matches) fold(false);
    });

    /* ---- arrival ------------------------------------------------------ */
    var fromURL = null;
    try {
      fromURL = new URLSearchParams(location.search).get("task");
    } catch (err) { fromURL = null; }
    if (fromURL && byId[fromURL]) {
      show(fromURL, { url: false });
      if (phone.matches) fold(true);
    } else {
      clear({ announce: false, url: false });
    }
    revealCardFromHash();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
