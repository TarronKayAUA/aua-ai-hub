/* Tool Directory task chooser (owner approved 2026-09-23).

   Progressive enhancement over the build-time task index that
   scripts/render_data.py renders from data/tools.yaml and
   data/tool_tasks.yaml (#tool-task-index). That index is the data source
   and the no-JavaScript fallback at once: each .tt-item carries the task
   id, chip label and group as data attributes, links to its tools' cards
   by #tool-... anchors, and holds the guide and standings sentences
   already rendered (so MkDocs has rewritten and checked their links).

   With JavaScript the index is hidden and replaced by a radio group of
   chips. Choosing one shows the matching cards directly underneath,
   cloned from the category sections so the card markup has one source.
   The category sections below stay exactly as they were: every card is
   still in the page's HTML, in its category, for site search, search
   engines, the table of contents and existing #category links.

   URL: ?task=<id> selects a task on arrival and is kept current with
   replaceState, so the address bar is always a shareable link. #tool-...
   and #category anchors keep working (prompts.js opens categories; this
   file opens the category around a card anchor). */
(function () {
  "use strict";

  var DEBOUNCE_MS = 450;

  function init() {
    var index = document.getElementById("tool-task-index");
    var host = document.getElementById("tool-chooser");
    if (!index || !host) return;

    var items = [].slice.call(index.querySelectorAll(".tt-item[data-task]"));
    if (!items.length) return;

    var tasks = items.map(function (el) {
      var ids = [].slice.call(el.querySelectorAll(".tt-tools a[href^='#tool-']"))
        .map(function (a) { return a.getAttribute("href").slice(1); });
      var guide = el.querySelector(".tt-guide");
      var standing = el.querySelector(".tt-standing");
      return {
        id: el.getAttribute("data-task"),
        label: el.getAttribute("data-label"),
        heading: el.getAttribute("data-heading") || el.getAttribute("data-label"),
        group: el.getAttribute("data-group") || "task",
        home: el.getAttribute("data-home") || "",
        ids: ids,
        guideHTML: guide ? guide.innerHTML : "",
        standingHTML: standing ? standing.innerHTML : ""
      };
    });
    var byId = {};
    tasks.forEach(function (t) { byId[t.id] = t; });
    var total = document.querySelectorAll("article .tool-card[id^='tool-']").length;

    /* ---- build the widget ------------------------------------------- */
    function chip(t) {
      var inputId = "tc-" + t.id;
      var n = t.ids.length;
      return '<span class="tc-chip">' +
        '<input type="radio" name="tc-task" id="' + inputId + '" value="' + t.id + '">' +
        '<label for="' + inputId + '">' + t.label +
        '<span class="tc-count" aria-hidden="true">' + n + "</span>" +
        '<span class="tc-sr">, ' + n + (n === 1 ? " tool" : " tools") + "</span>" +
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
      "</fieldset></form>" +
      '<div class="tc-bar">' +
      '<p class="tc-status" id="tc-status" role="status" aria-live="polite" aria-atomic="true"></p>' +
      '<button type="button" class="tc-clear" id="tc-clear" hidden>Clear choice</button>' +
      "</div>" +
      '<section class="tc-results" id="tc-results" aria-labelledby="tc-results-heading" hidden>' +
      '<div class="tc-results-top">' +
      '<h3 class="tc-results-heading" id="tc-results-heading"></h3>' +
      '<a class="tc-change" href="#find-tools-by-task">Choose another task</a>' +
      "</div>" +
      '<p class="tc-guide" id="tc-guide"></p>' +
      '<p class="tc-standing" id="tc-standing"></p>' +
      '<div class="tool-grid tc-grid" id="tc-grid"></div>' +
      '<div id="tc-also"></div>' +
      '<p class="tc-foot"><a id="tc-permalink" href="#">Link to this list</a>' +
      ' · <a href="#assistants" id="tc-browse">Browse all ' + total + " tools by category</a></p>" +
      "</section>" +
      '<p class="tc-idle" id="tc-idle">Or browse all ' + total +
      ' tools by category below. <button type="button" class="tc-openall" id="tc-openall">Open every category</button></p>';

    index.hidden = true;
    host.hidden = false;
    // "Browse all ... by category" points at the first category heading.
    var firstCat = document.querySelector("article h2[id] + p + details");
    if (firstCat) {
      document.getElementById("tc-browse").setAttribute(
        "href", "#" + firstCat.previousElementSibling.previousElementSibling.id);
    }

    var statusEl = document.getElementById("tc-status");
    var clearBtn = document.getElementById("tc-clear");
    var results = document.getElementById("tc-results");
    var heading = document.getElementById("tc-results-heading");
    var guideEl = document.getElementById("tc-guide");
    var standingEl = document.getElementById("tc-standing");
    var grid = document.getElementById("tc-grid");
    var also = document.getElementById("tc-also");
    var permalink = document.getElementById("tc-permalink");
    var idle = document.getElementById("tc-idle");
    var openAll = document.getElementById("tc-openall");
    var timer = null;

    /* ---- helpers ------------------------------------------------------ */
    function categoryOf(card) {
      var det = card.closest("details");
      var h = det;
      while (h && !/^H2$/.test(h.tagName)) h = h.previousElementSibling;
      return h ? { id: h.id, label: h.firstChild.textContent.trim() } : null;
    }

    function cloneCard(id, homeCategory) {
      var src = document.getElementById(id);
      if (!src) return null;
      var c = src.cloneNode(true);
      c.removeAttribute("id");
      c.classList.add("tc-clone");
      var cat = categoryOf(src);
      if (cat && cat.id !== homeCategory) {
        var p = document.createElement("p");
        p.className = "tc-home";
        p.innerHTML = 'In the directory under <a href="#' + cat.id + '">' + cat.label + "</a>";
        c.appendChild(p);
      }
      return { el: c, cat: cat };
    }

    function announce(text) {
      clearTimeout(timer);
      // Empty first, then set, so repeating the same text is re-announced.
      statusEl.textContent = "";
      timer = setTimeout(function () { statusEl.textContent = text; }, DEBOUNCE_MS);
    }

    function setURL(taskId) {
      if (!window.history || !history.replaceState) return;
      var url = location.pathname + (taskId ? "?task=" + encodeURIComponent(taskId) : "");
      history.replaceState(null, "", url);
    }

    /* ---- render ------------------------------------------------------- */
    function show(taskId, opts) {
      opts = opts || {};
      var t = byId[taskId];
      if (!t) return clear(opts);
      var radio = document.getElementById("tc-" + taskId);
      if (radio && !radio.checked) radio.checked = true;

      heading.textContent = t.heading;
      guideEl.innerHTML = t.guideHTML;
      guideEl.hidden = !t.guideHTML;
      standingEl.innerHTML = t.standingHTML;
      standingEl.hidden = !t.standingHTML;

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
        var h4 = document.createElement("h4");
        h4.className = "tc-also-heading";
        h4.textContent = "Also useful, from other categories";
        also.appendChild(h4);
        var g2 = document.createElement("div");
        g2.className = "tool-grid tc-grid";
        elsewhere.forEach(function (el) { g2.appendChild(el); });
        also.appendChild(g2);
      }

      permalink.setAttribute("href", "?task=" + encodeURIComponent(taskId));
      results.hidden = false;
      clearBtn.hidden = false;
      idle.hidden = true;
      var n = t.ids.length;
      announce(n + (n === 1 ? " tool" : " tools") + " for " + t.heading + ", listed below.");
      if (opts.url !== false) setURL(taskId);
    }

    function clear(opts) {
      opts = opts || {};
      host.querySelectorAll("input[name='tc-task']").forEach(function (r) { r.checked = false; });
      results.hidden = true;
      clearBtn.hidden = true;
      idle.hidden = false;
      grid.innerHTML = "";
      also.innerHTML = "";
      if (opts.announce !== false) announce("Choice cleared. The full directory is below, by category.");
      if (opts.url !== false) setURL("");
    }

    /* A chip chosen by pointer or touch brings the first result into view
       when it would otherwise sit below the fold (on a phone the chips
       alone fill most of a screen). Keyboard choices never scroll: arrow
       keys move through the group, and the status line announces the
       count. Focus is never moved. */
    var byPointer = false;
    host.addEventListener("pointerdown", function (ev) {
      byPointer = !!(ev.target && ev.target.closest && ev.target.closest(".tc-chip"));
    });
    function revealFirstResult() {
      var first = results.querySelector(".tool-card");
      if (!first) return;
      var r = first.getBoundingClientRect();
      var over = r.bottom - window.innerHeight + 16;
      if (over > 0) {
        var reduce = window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollBy({ top: over, behavior: reduce ? "auto" : "smooth" });
      }
    }
    host.addEventListener("change", function (ev) {
      if (ev.target && ev.target.name === "tc-task") {
        show(ev.target.value);
        if (byPointer) revealFirstResult();
      }
      byPointer = false;
    });
    /* "Choose another task" returns to the chips without touching the
       hash, and puts focus on the chosen chip so arrow keys continue. */
    results.querySelector(".tc-change").addEventListener("click", function (ev) {
      ev.preventDefault();
      var checked = host.querySelector("input[name='tc-task']:checked") ||
        host.querySelector("input[name='tc-task']");
      document.getElementById("find-tools-by-task").scrollIntoView({ block: "start" });
      if (checked) checked.focus({ preventScroll: true });
    });
    clearBtn.addEventListener("click", function () {
      clear();
      var first = host.querySelector("input[name='tc-task']");
      if (first) first.focus();
    });

    /* ---- open or close every category -------------------------------- */
    function categoryDetails() {
      return [].slice.call(document.querySelectorAll("article h2[id]")).map(function (h) {
        var el = h.nextElementSibling;
        while (el && !/^H[1-3]$/.test(el.tagName)) {
          if (el.tagName === "DETAILS") return el;
          el = el.nextElementSibling;
        }
        return null;
      }).filter(Boolean);
    }
    openAll.addEventListener("click", function () {
      var ds = categoryDetails();
      var anyClosed = ds.some(function (d) { return !d.open; });
      ds.forEach(function (d) { d.open = anyClosed; });
      openAll.textContent = anyClosed ? "Close every category" : "Open every category";
    });

    /* ---- card anchors: open the category around #tool-... ------------- */
    function revealCardFromHash() {
      if (!location.hash || location.hash.indexOf("#tool-") !== 0) return;
      var card = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (!card) return;
      var det = card.closest("details");
      if (det) det.open = true;
      card.classList.remove("tc-target");
      void card.offsetWidth; // restart the highlight
      card.classList.add("tc-target");
      card.scrollIntoView({ block: "center" });
    }
    window.addEventListener("hashchange", revealCardFromHash);

    /* ---- arrival ------------------------------------------------------ */
    var fromURL = null;
    try {
      fromURL = new URLSearchParams(location.search).get("task");
    } catch (err) { fromURL = null; }
    if (fromURL && byId[fromURL]) {
      show(fromURL, { url: false });
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
