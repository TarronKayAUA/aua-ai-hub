/* Learn landing and modules (layout redesign, 2026-09-25).
 *
 * On a module (a page with the build's progress strip, [data-learn-module]):
 * remembers, in this browser only, that the module was opened, and that it
 * was finished once its closing Next buttons have been on screen or its
 * recording has played to the end.
 *
 * On the Learn landing: from what this browser remembers, shows "Continue
 * where you left off" under the Start button and marks the route map
 * ("Opened" or "Finished"). With nothing stored, the slot stays hidden and
 * the page is exactly as built.
 *
 * What is stored, under one localStorage key: module identifiers only (the
 * last one opened, those opened, those finished). No times, no names, and
 * nothing leaves the browser. Every storage call is wrapped in try/catch,
 * because a private window or blocked site data can make it throw; the
 * pages then simply show no progress. "Forget my progress" removes the key.
 */
(function () {
  "use strict";
  var KEY = "aua-learn-progress";

  function ids(list) {
    return Array.isArray(list) ? list.filter(function (x) { return typeof x === "string"; }) : [];
  }

  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      if (!d || typeof d !== "object") return null;
      return { last: typeof d.last === "string" ? d.last : "", seen: ids(d.seen), done: ids(d.done) };
    } catch (e) {
      return null;
    }
  }

  function save(d) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify({ v: 1, last: d.last, seen: d.seen, done: d.done }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function forget() {
    try {
      window.localStorage.removeItem(KEY);
    } catch (e) {
      /* nothing was stored, or storage is blocked: either way nothing remains to forget */
    }
  }

  function add(list, id) {
    if (list.indexOf(id) < 0) list.push(id);
  }

  /* --- a module: record opened, then finished ------------------------------ */
  function trackModule(strip) {
    var id = strip.getAttribute("data-learn-module");
    if (!id) return;
    var d = load() || { last: "", seen: [], done: [] };
    d.last = id;
    add(d.seen, id);
    if (!save(d)) return;

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      var cur = load() || { last: id, seen: [], done: [] };
      add(cur.seen, id);
      add(cur.done, id);
      save(cur);
    }
    var end = document.querySelector(".learn-next");
    if (end && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting) {
            finish();
            io.disconnect();
            return;
          }
        }
      }, { threshold: 0.6 });
      io.observe(end);
    }
    var audio = document.querySelector('.listen[data-listen="module"] audio');
    if (audio) audio.addEventListener("ended", finish);
  }

  /* --- the landing: continue where you left off ----------------------------- */
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function row(mod, sub) {
    var a = el("a", "learn-continue__row");
    a.href = mod.url;
    a.appendChild(el("span", "learn-continue__name", "Module " + mod.n + ": " + mod.title));
    a.appendChild(el("span", "learn-continue__sub", sub));
    return a;
  }

  function markMap(modules, d) {
    var map = document.querySelector(".route-map");
    if (!map) return;
    map.querySelectorAll(".route-status").forEach(function (s) { s.remove(); });
    if (!d) return;
    modules.forEach(function (m) {
      var state = d.done.indexOf(m.id) >= 0 ? "done" : d.seen.indexOf(m.id) >= 0 ? "seen" : "";
      if (!state) return;
      map.querySelectorAll("a").forEach(function (a) {
        if (a.getAttribute("href") !== m.url) return;
        var text = a.closest(".route-text") || a;
        text.appendChild(el("span", "route-status route-status--" + state,
          state === "done" ? "Finished" : "Opened"));
      });
    });
  }

  function showContinue(slot, modules, d) {
    var byId = {};
    modules.forEach(function (m) { byId[m.id] = m; });
    var last = d && byId[d.last];
    slot.textContent = "";
    if (!last) {
      slot.hidden = true;
      return;
    }
    var title = el("h2", "learn-continue__title", "Continue where you left off");
    title.id = "continue-where-you-left-off";
    slot.setAttribute("role", "region");
    slot.setAttribute("aria-labelledby", title.id);
    slot.appendChild(title);

    var rows = el("div", "learn-continue__rows");
    var lead = "";
    var minutes = function (m) { return "About " + m.minutes + " minutes"; };
    if (d.done.indexOf(last.id) < 0) {
      // Opened and not finished: the module itself.
      rows.appendChild(row(last, "Opened on this device, not finished · " + minutes(last)));
    } else {
      // Finished: what comes after it, unless that is finished too.
      var next = last.next.map(function (id) { return byId[id]; })
        .filter(function (m) { return m && d.done.indexOf(m.id) < 0; });
      if (next.length) {
        lead = "You finished Module " + last.n + ": " + last.title + " on this device. "
          + (next.length === 1 ? "Up next:" : "Up next, pick one:");
        next.forEach(function (m) {
          rows.appendChild(row(m, (d.seen.indexOf(m.id) >= 0 ? "Opened, not finished" : "Not started")
            + " · " + minutes(m)));
        });
      } else {
        rows.appendChild(row(last, "Finished on this device · " + minutes(last)));
      }
    }
    if (lead) slot.appendChild(el("p", "learn-continue__lead", lead));
    slot.appendChild(rows);

    var foot = el("p", "learn-continue__foot", "Your progress is kept in this browser only. ");
    var clear = el("button", "learn-continue__forget", "Forget my progress");
    clear.type = "button";
    clear.addEventListener("click", function () {
      forget();
      markMap(modules, null);
      slot.hidden = true;
      slot.textContent = "";
      var start = document.querySelector("[data-page-action] a");
      if (start) start.focus();
    });
    foot.appendChild(clear);
    slot.appendChild(foot);
    slot.hidden = false;
  }

  function landing(slot, island) {
    var modules;
    try {
      modules = JSON.parse(island.textContent).modules || [];
    } catch (e) {
      return;
    }
    var d = load();
    if (!d) return;
    showContinue(slot, modules, d);
    markMap(modules, d);
  }

  var strip = document.querySelector("[data-learn-module]");
  if (strip) trackModule(strip);
  var slot = document.querySelector("[data-learn-continue]");
  var island = document.getElementById("learn-modules");
  if (slot && island) landing(slot, island);
})();
