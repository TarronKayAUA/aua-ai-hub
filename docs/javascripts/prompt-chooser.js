/* Prompt library chooser (owner approved 2026-09-23).

   Same idiom and styles as tools-chooser.js: progressive enhancement over a
   page that is complete without it. render_data.py marks every prompt
   heading with data-audience and data-category and leaves a small JSON
   island of chip labels; this script adds two radio groups ("Who is it
   for?" and "What do you want to do?") and hides what does not match: rows
   of the at-a-glance table, prompt blocks (a heading and everything up to
   the next heading), and category sections left with no prompts. Nothing
   is removed from the page, so site search, the table of contents and
   #prompt links are unaffected, and arriving by a #prompt link shows the
   whole library. Filters combine; counts on each chip follow the other
   filter, and a chip that would match nothing is disabled rather than
   leading to an empty page. The choice is kept in the URL (?for=students
   &task=research) so a filtered view can be shared. */
(function () {
  "use strict";

  function init() {
    var host = document.getElementById("prompt-chooser");
    var dataEl = document.getElementById("prompt-chooser-data");
    if (!host || !dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var article = host.closest("article") || document.body;

    /* ---- map the page: each prompt block and each category section ---- */
    var categoryIds = {};
    data.categories.forEach(function (c) { categoryIds[c[2]] = c[0]; });
    var prompts = [];      // {id, audience, category, els: [...]}
    var sections = {};     // category key -> {els: [...], prompts: [...]}
    var current = null, currentPrompt = null, inLibrary = false;
    [].slice.call(article.children).forEach(function (el) {
      if (el.tagName === "H2") {
        var key = categoryIds[el.id];
        currentPrompt = null;
        if (key) {
          inLibrary = true;
          current = sections[key] = { els: [el], prompts: [] };
        } else {
          current = null;
        }
        return;
      }
      if (!current) return;
      if (el.tagName === "HR") { current = null; return; }
      if (el.tagName === "H3" && el.dataset.category) {
        currentPrompt = { id: el.id, audience: el.dataset.audience,
                          category: el.dataset.category, els: [el] };
        prompts.push(currentPrompt);
        current.prompts.push(currentPrompt);
        return;
      }
      // A category's "Further reading" (a bold paragraph and its list, from
      // render_data.py) belongs to the section, not to the last prompt.
      if (el.tagName === "P" && el.textContent.trim() === "Further reading") {
        currentPrompt = null;
      }
      (currentPrompt || current).els.push(el);
    });
    if (!inLibrary || !prompts.length) return;
    var byId = {};
    prompts.forEach(function (p) { byId[p.id] = p; });
    var rows = [].slice.call(article.querySelectorAll("table tr")).filter(function (tr) {
      var a = tr.querySelector("td a[href^='#']");
      return a && byId[a.getAttribute("href").slice(1)];
    }).map(function (tr) {
      return { tr: tr, prompt: byId[tr.querySelector("td a[href^='#']").getAttribute("href").slice(1)] };
    });

    /* ---- build the widget --------------------------------------------- */
    function chip(name, value, label) {
      var id = "pc-" + name + "-" + value;
      return '<span class="tc-chip"><input type="radio" name="pc-' + name + '" id="' + id +
        '" value="' + value + '"><label for="' + id + '">' + label +
        '<span class="tc-count" aria-hidden="true"></span><span class="tc-sr"></span></label></span>';
    }
    host.innerHTML =
      '<form class="tc-form" action="#" onsubmit="return false">' +
      '<fieldset class="tc-fieldset"><legend class="tc-legend">Who is it for?</legend>' +
      '<div class="tc-chips">' + chip("for", "", "Everyone") +
      data.audiences.map(function (a) { return chip("for", a[0], a[1]); }).join("") +
      "</div></fieldset>" +
      '<fieldset class="tc-fieldset pc-second"><legend class="tc-legend">What do you want to do?</legend>' +
      '<div class="tc-chips">' + chip("task", "", "Anything") +
      data.categories.map(function (c) { return chip("task", c[0], c[1]); }).join("") +
      "</div></fieldset></form>" +
      '<div class="tc-bar"><p class="tc-status" role="status" aria-live="polite" aria-atomic="true"></p>' +
      '<button type="button" class="tc-clear" hidden>Show every prompt</button></div>';
    host.hidden = false;
    var statusEl = host.querySelector(".tc-status");
    var clearBtn = host.querySelector(".tc-clear");
    var state = { "for": "", task: "" };
    var timer = null;

    function matches(p, st) {
      var forOk = !st["for"] || p.audience === st["for"] || p.audience === "both";
      var taskOk = !st.task || p.category === st.task;
      return forOk && taskOk;
    }
    function count(st) {
      return prompts.filter(function (p) { return matches(p, st); }).length;
    }
    function labelOf(name, value) {
      var input = document.getElementById("pc-" + name + "-" + value);
      return input ? input.nextElementSibling.firstChild.textContent : "";
    }
    function announce(text) {
      clearTimeout(timer);
      statusEl.textContent = "";
      timer = setTimeout(function () { statusEl.textContent = text; }, 450);
    }
    function setURL() {
      if (!window.history || !history.replaceState) return;
      var q = [];
      if (state["for"]) q.push("for=" + encodeURIComponent(state["for"]));
      if (state.task) q.push("task=" + encodeURIComponent(state.task));
      history.replaceState(null, "", location.pathname + (q.length ? "?" + q.join("&") : "") + location.hash);
    }

    function apply(opts) {
      opts = opts || {};
      // Chip counts follow the other filter; a chip that would match nothing
      // is disabled (and says so to screen readers) instead of emptying the page.
      host.querySelectorAll("input[type=radio]").forEach(function (input) {
        var name = input.name.slice(3);
        var trial = { "for": state["for"], task: state.task };
        trial[name] = input.value;
        var n = count(trial);
        var label = input.nextElementSibling;
        label.querySelector(".tc-count").textContent = n;
        label.querySelector(".tc-sr").textContent = ", " + n + (n === 1 ? " prompt" : " prompts");
        input.disabled = n === 0 && input.value !== "";
        input.checked = state[name] === input.value;
      });
      var shown = 0;
      prompts.forEach(function (p) {
        var on = matches(p, state);
        if (on) shown += 1;
        p.els.forEach(function (el) { el.hidden = !on; });
      });
      Object.keys(sections).forEach(function (key) {
        var any = sections[key].prompts.some(function (p) { return matches(p, state); });
        sections[key].els.forEach(function (el) { el.hidden = !any; });
      });
      rows.forEach(function (r) { r.tr.hidden = !matches(r.prompt, state); });
      var filtered = !!(state["for"] || state.task);
      clearBtn.hidden = !filtered;
      if (opts.announce !== false) {
        if (!filtered) {
          announce("Showing all " + prompts.length + " prompts.");
        } else {
          var parts = [];
          if (state.task) parts.push(labelOf("task", state.task).toLowerCase());
          if (state["for"]) parts.push("for " + labelOf("for", state["for"]).toLowerCase());
          announce(shown + (shown === 1 ? " prompt" : " prompts") + " shown: " + parts.join(", ") + ".");
        }
      }
      if (opts.url !== false) setURL();
    }

    host.addEventListener("change", function (ev) {
      var input = ev.target;
      if (!input || input.type !== "radio") return;
      state[input.name.slice(3)] = input.value;
      apply();
    });
    clearBtn.addEventListener("click", function () {
      state = { "for": "", task: "" };
      apply();
      var first = host.querySelector("input[type=radio]");
      if (first) first.focus();
    });

    /* ---- arrival: ?for= and ?task=, unless a #prompt link was followed -- */
    var params = null;
    try { params = new URLSearchParams(location.search); } catch (err) { params = null; }
    if (params && !(location.hash && byId[location.hash.slice(1)])) {
      var f = params.get("for"), k = params.get("task");
      if (f && document.getElementById("pc-for-" + f)) state["for"] = f;
      if (k && document.getElementById("pc-task-" + k)) state.task = k;
    }
    apply({ announce: false, url: false });
  }

  // Same start-up as the site's other widget scripts (navigation.instant is
  // deliberately off; see tools-chooser.js).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
