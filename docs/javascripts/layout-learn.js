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

  /* Lesson rows outside the Learn map (a hub's "Start with the Basics",
     news round 2026-09-27) carry the same Opened or Finished mark. A
     module's identifier is its page's folder name, so each row finds its
     module from its own link; nothing is listed twice. */
  function markRows(d) {
    if (!d) return;
    document.querySelectorAll(".route-stage--solo .route-text > a").forEach(function (a) {
      var parts = new URL(a.getAttribute("href"), location.href).pathname.split("/").filter(Boolean);
      var id = parts[parts.length - 1];
      var state = d.done.indexOf(id) >= 0 ? "done" : d.seen.indexOf(id) >= 0 ? "seen" : "";
      if (!state) return;
      a.parentNode.insertBefore(el("span", "route-status route-status--" + state,
        state === "done" ? "Finished" : "Opened"), a.nextSibling);
    });
  }

  var strip = document.querySelector("[data-learn-module]");
  if (strip) trackModule(strip);
  var slot = document.querySelector("[data-learn-continue]");
  var island = document.getElementById("learn-modules");
  if (slot && island) landing(slot, island);
  if (document.querySelector(".route-stage--solo")) markRows(load());
})();

/* =========================================================================
 * ART: the Learn plate (Specimen and Signal, added 2026-09-26).
 * Everything above this line is the learn package and is unchanged.
 * -------------------------------------------------------------------------
 * Draws the decorative plate under Module 1's title (the empty
 * [data-learn-plate] wrapper in docs/pathway/how-ai-works.md; it stood beside
 * the Learn landing's title until 2026-09-28, when that head took the
 * telescope) from two generated files in docs/assets/art/:
 *   learn-plate.svg   the drawing; its signal layer already rests on the
 *                     composed still (what reduced motion shows, and where
 *                     the motion ends)
 *   learn-plate.json  one pass of the signal: keyframes per signal element
 * Only at 60em and up, and only when the head leaves room (fit, below), so
 * phones and narrow windows fetch neither file.
 *
 * The signal plays once (3.3 seconds; the length is in learn-plate.json)
 * with the Web Animations API, on transform and opacity only. It is skipped, and the still shows at once,
 * under prefers-reduced-motion, in a hidden tab, or when the files arrive
 * too late for the pass to end within 5 seconds of the page loading (WCAG
 * 2.2.2, so the page needs no pause control). Hiding the tab mid-pass
 * pauses it; on return it resumes only if it can still end inside those 5
 * seconds, and otherwise goes straight to the still. Decoration only: if
 * anything fails, the page stays exactly as built.
 */
(function () {
  "use strict";
  var host = document.querySelector("[data-learn-plate]");
  if (!host || !window.fetch || !window.matchMedia || !window.Promise || !window.URL) return;
  var here = (document.currentScript && document.currentScript.src) || location.href;
  var SVG_URL = new URL("../assets/art/learn-plate.svg", here).href;
  var MOTION_URL = new URL("../assets/art/learn-plate.json", here).href;
  var WIDE = window.matchMedia("screen and (min-width: 60em)");
  var REDUCE = window.matchMedia("(prefers-reduced-motion: reduce)");
  var LIMIT = 5000; /* ms after the page started loading: all motion has ended by then */
  var FADE = 400; /* the plate's fade-in, layout-learn.css */
  var NS = "http://www.w3.org/2000/svg";
  var started = false;
  var anims = [];
  var MAX_H = 8.064; /* rem: the plate's full height, as it was on the landing */
  var MIN_H = 5; /* rem: less room than this and the plate is not drawn */

  /* The plate fills the space the head's main column leaves under the title's
     lines, beside the goals panel, down to that panel's bottom edge (the
     column stretches to the row, layout-learn.css). This measures that space
     and sets the plate's height; with too little room it stays hidden. */
  function fit() {
    var main = host.parentElement;
    if (!main) return false;
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var box = main.getBoundingClientRect();
    var used = box.top;
    Array.prototype.forEach.call(main.children, function (c) {
      if (c !== host) used = Math.max(used, c.getBoundingClientRect().bottom);
    });
    var h = Math.min(MAX_H * rem, box.bottom - used - rem);
    var ok = WIDE.matches && h >= MIN_H * rem;
    if (ok) {
      host.style.height = h + "px";
      host.setAttribute("data-room", "");
    } else {
      host.style.height = "";
      host.removeAttribute("data-room");
    }
    return ok;
  }

  function now() {
    return window.performance && performance.now ? performance.now() : LIMIT;
  }

  function quiet() {
    return REDUCE.matches || document.hidden || typeof Element.prototype.animate !== "function";
  }

  /* Drop the animations: each element falls back to its own attributes in
     the SVG, which are the composed still. */
  function settle() {
    var list = anims;
    anims = [];
    list.forEach(function (a) {
      try {
        a.cancel();
      } catch (e) {
        /* already gone */
      }
    });
    var layer = host.querySelector(".lp-art--signal");
    if (layer) layer.style.willChange = "";
  }

  function play(motion, layer) {
    var dur = motion && motion.duration;
    if (!(dur > 0) || !Array.isArray(motion.tracks) || now() + dur > LIMIT) return false;
    layer.style.willChange = "opacity";
    motion.tracks.forEach(function (t) {
      var el = layer.querySelector("#" + t.id);
      if (!el || !Array.isArray(t.k)) return;
      var frames = t.k.map(function (f) {
        var k = { offset: f[0], opacity: f[1] };
        if (f.length > 3) k.transform = "translate(" + f[2] + "px," + f[3] + "px)";
        return k;
      });
      try {
        anims.push(el.animate(frames, { duration: dur, fill: "both", easing: "linear" }));
      } catch (e) {
        /* a malformed track is skipped; the element keeps its still */
      }
    });
    if (!anims.length) return false;
    Promise.all(anims.map(function (a) { return a.finished; })).then(settle, function () {});
    return true;
  }

  function place(svgText, motion) {
    var panel = document.createElement("div");
    panel.className = "learn-plate__panel";
    panel.innerHTML = svgText; /* this site's own generated file */
    var art = panel.querySelector("svg.lp-art");
    var signal = art && art.querySelector(".lp-signal");
    if (!signal) return;
    /* The light that moves gets its own <svg>, promoted while it moves, so
       the drawing underneath is painted once. */
    var layer = document.createElementNS(NS, "svg");
    layer.setAttribute("class", "lp-art lp-art--signal");
    layer.setAttribute("viewBox", art.getAttribute("viewBox"));
    layer.setAttribute("preserveAspectRatio", art.getAttribute("preserveAspectRatio") || "xMidYMid slice");
    layer.setAttribute("aria-hidden", "true");
    layer.setAttribute("focusable", "false");
    layer.appendChild(signal);
    panel.appendChild(layer);
    host.appendChild(panel);
    var moving = !quiet() && play(motion, layer);
    /* Show it on the next frame, so the fade (when allowed) starts from
       clear; no fade at all if it would end after the 5-second mark. */
    window.requestAnimationFrame(function () {
      if (!moving && now() + FADE > LIMIT) panel.style.transition = "none";
      panel.setAttribute("data-state", "shown");
    });
  }

  function mount() {
    if (started || !fit()) return;
    started = true;
    var motion = quiet() ? null : fetch(MOTION_URL).then(function (r) {
      return r.ok ? r.json() : null;
    }).catch(function () {
      return null;
    });
    Promise.all([
      fetch(SVG_URL).then(function (r) {
        if (!r.ok) throw new Error("learn plate: HTTP " + r.status);
        return r.text();
      }),
      motion
    ]).then(function (got) {
      place(got[0], got[1]);
    }).catch(function () {
      /* decoration only: without the drawing the head is as it was */
    });
  }

  document.addEventListener("visibilitychange", function () {
    if (!anims.length) return;
    if (document.hidden) {
      anims.forEach(function (a) { a.pause(); });
      return;
    }
    var left = 0;
    anims.forEach(function (a) {
      var d = a.effect && a.effect.getTiming ? Number(a.effect.getTiming().duration) || 0 : 0;
      left = Math.max(left, d - (a.currentTime || 0));
    });
    if (now() + left > LIMIT) settle();
    else anims.forEach(function (a) { a.play(); });
  });

  function onChange(mq, fn) {
    if (mq.addEventListener) mq.addEventListener("change", fn);
    else if (mq.addListener) mq.addListener(fn);
  }
  onChange(REDUCE, function () {
    if (REDUCE.matches) settle();
  });
  onChange(WIDE, function () {
    if (fit()) mount();
  });
  /* The column, and everything in it: the Listen control settles to its
     compact size only after listen.js runs, and the column does not change
     size when it does. */
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () {
      if (fit()) mount();
    });
    ro.observe(host.parentElement);
    Array.prototype.forEach.call(host.parentElement.children, function (c) {
      if (c !== host) ro.observe(c);
    });
  }
  mount();
})();
