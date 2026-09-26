/* Prompt Library chooser (owner approved 2026-09-23; rebuilt on the shared
   shelf skeleton for the layout redesign, L16, 2026-09-25).

   Progressive enhancement over a page that is complete without it:
   render_data.py prints every prompt as a row (data-prompt, data-audience,
   data-category) inside its category section, and a JSON island of chip
   labels and section orders. This script fills the filter column with three
   groups, "Who is it for?", "What do you want to do?" and "Saved on this
   device", and hides what does not match. Nothing is removed from the page.

   - From 60em the filters sit in a sticky column beside the results. On
     phones they fold to one line ("Students · 14 prompts", Change), so the
     first prompt is on the first screen.
   - For students, Study comes first, then Residency (PROMPT_AUDIENCE_FIRST
     in render_data.py). A prompt listed in two sections (also_for) shows
     once, in the first visible one; counts are of prompts, not rows.
   - Counts on each option follow the other filters, and an option that
     would match nothing is disabled rather than leading to an empty list.
   - The choice is kept in the address (?for=students&task=study_strategy)
     so a filtered view can be shared; Saved is not, since it lives only in
     this browser. Arriving by a #prompt or #category link shows the whole
     library, so the linked row is never hidden. */
(function () {
  "use strict";

  function init() {
    var host = document.getElementById("prompt-chooser");
    var dataEl = document.getElementById("prompt-chooser-data");
    var shelf = document.getElementById("prompt-shelf");
    if (!host || !dataEl || !shelf) return;
    var data;
    try {
      data = JSON.parse(dataEl.textContent);
    } catch (err) {
      return;
    }
    var results = shelf.querySelector(".pl-results");
    var countEl = document.getElementById("prompt-count");
    var groups = [].slice.call(shelf.querySelectorAll(".pl-group"));
    var groupByKey = {};
    groups.forEach(function (g) { groupByKey[g.getAttribute("data-category")] = g; });
    var prompts = {};
    var order = [];
    [].slice.call(shelf.querySelectorAll(".pl-row")).forEach(function (row) {
      var id = row.getAttribute("data-prompt");
      if (!prompts[id]) {
        prompts[id] = { id: id, audience: row.getAttribute("data-audience"), cats: [], rows: [] };
        order.push(id);
      }
      prompts[id].cats.push(row.getAttribute("data-category"));
      prompts[id].rows.push(row);
    });
    if (!order.length) return;
    var saves = window.AUAPromptSaves || { available: false, list: function () { return []; } };
    var chips = {};
    data.categories.forEach(function (c) { chips[c[0]] = c[1]; });
    var audienceLabel = {};
    data.audiences.forEach(function (a) { audienceLabel[a[0]] = a[1]; });
    var anchors = {};
    data.categories.forEach(function (c) { anchors[c[2]] = true; });
    var defaultOrder = data.categories.map(function (c) { return c[0]; });
    var phone = window.matchMedia("(max-width: 59.9375em)");

    /* ---- the filter column ------------------------------------------- */
    function option(type, name, value, label) {
      var id = "pl-" + name + "-" + (value || "all");
      return '<label class="pl-option" for="' + id + '"><input type="' + type + '" name="pl-' + name +
        '" id="' + id + '" value="' + value + '"><span class="pl-option__label">' + label +
        '</span><span class="pl-option__count" aria-hidden="true"></span><span class="pl-sr"></span></label>';
    }
    host.innerHTML =
      '<form class="pl-form" action="#" onsubmit="return false">' +
      '<fieldset class="pl-fieldset"><legend>Who is it for?</legend><div class="pl-options">' +
      option("radio", "for", "", "Everyone") +
      data.audiences.map(function (a) { return option("radio", "for", a[0], a[1]); }).join("") +
      "</div></fieldset>" +
      '<fieldset class="pl-fieldset"><legend>What do you want to do?</legend><div class="pl-options">' +
      option("radio", "task", "", "Anything") +
      data.categories.map(function (c) { return option("radio", "task", c[0], c[1]); }).join("") +
      "</div></fieldset>" +
      '<fieldset class="pl-fieldset pl-fieldset--saved"' + (saves.available ? "" : " hidden") +
      "><legend>Saved on this device</legend><div class=\"pl-options\">" +
      option("checkbox", "saved", "1", "Only my saved prompts") +
      '</div><p class="pl-hint">Save marks a prompt in this browser only; nothing is sent anywhere.</p></fieldset>' +
      "</form>" +
      '<div class="pl-filters__foot">' +
      '<button type="button" class="pl-clear" hidden>Show all prompts</button>' +
      '<button type="button" class="md-button md-button--primary pl-done"></button>' +
      "</div>";
    host.hidden = false;
    shelf.classList.add("is-ready");

    // Phones: one line that says what is showing, with Change.
    var summary = document.createElement("div");
    summary.className = "shelf__summary pl-summary";
    summary.innerHTML = '<p class="pl-summary__text"></p>' +
      '<button type="button" class="pl-summary__change" aria-controls="prompt-chooser"></button>';
    shelf.insertBefore(summary, host);
    var summaryText = summary.querySelector(".pl-summary__text");
    var changeBtn = summary.querySelector(".pl-summary__change");
    var clearBtn = host.querySelector(".pl-clear");
    var doneBtn = host.querySelector(".pl-done");
    var empty = document.createElement("p");
    empty.className = "pl-empty";
    empty.hidden = true;
    results.insertBefore(empty, countEl ? countEl.nextSibling : results.firstChild);

    var state = { "for": "", task: "", saved: false };
    var timer = null;

    /* ---- matching ----------------------------------------------------- */
    function savedSet() {
      var set = {};
      saves.list().forEach(function (id) { set[id] = true; });
      return set;
    }
    function matches(p, st, saved) {
      var forOk = !st["for"] || p.audience === st["for"] || p.audience === "both";
      var taskOk = !st.task || p.cats.indexOf(st.task) !== -1;
      var savedOk = !st.saved || !!saved[p.id];
      return forOk && taskOk && savedOk;
    }
    function count(st, saved) {
      return order.filter(function (id) { return matches(prompts[id], st, saved); }).length;
    }
    function describe(n, st) {
      var bits = [];
      if (st["for"]) bits.push(audienceLabel[st["for"]] || st["for"]);
      if (st.task) bits.push(chips[st.task] || st.task);
      if (st.saved) bits.push("Saved");
      var nice = n + (n === 1 ? " prompt" : " prompts");
      if (!bits.length) return { html: "All " + nice, text: "All " + nice + "." };
      return { html: "<strong>" + bits.join(", ") + "</strong> · " + nice,
               text: "Showing " + nice + ": " + bits.join(", ").toLowerCase() + "." };
    }
    function setURL() {
      if (!window.history || !history.replaceState) return;
      var q = [];
      if (state["for"]) q.push("for=" + encodeURIComponent(state["for"]));
      if (state.task) q.push("task=" + encodeURIComponent(state.task));
      history.replaceState(null, "", location.pathname + (q.length ? "?" + q.join("&") : "") + location.hash);
    }

    /* ---- applying a choice -------------------------------------------- */
    function apply(opts) {
      opts = opts || {};
      var saved = savedSet();
      // Option counts follow the other filters.
      host.querySelectorAll("input").forEach(function (input) {
        var name = input.name.slice(3);
        var trial = { "for": state["for"], task: state.task, saved: state.saved };
        trial[name] = name === "saved" ? true : input.value;
        var n = count(trial, saved);
        var label = input.parentNode;
        label.querySelector(".pl-option__count").textContent = n;
        label.querySelector(".pl-sr").textContent = ", " + n + (n === 1 ? " prompt" : " prompts");
        if (name === "saved") {
          input.checked = state.saved;
          input.disabled = n === 0 && !state.saved;
        } else {
          input.checked = state[name] === input.value;
          input.disabled = n === 0 && input.value !== "";
        }
        label.classList.toggle("is-checked", input.checked);
        label.classList.toggle("is-disabled", input.disabled);
      });

      // Section order: an audience's first sections lead (students: Study).
      var keys = (state["for"] && data.orders[state["for"]]) || defaultOrder;
      keys.forEach(function (key) {
        if (groupByKey[key]) results.appendChild(groupByKey[key]);
      });

      // Each matching prompt shows once, in the first visible section that
      // holds it (a prompt listed in two sections is not shown twice).
      var visibleRows = 0;
      var shownGroups = {};
      order.forEach(function (id) {
        var p = prompts[id];
        var on = matches(p, state, saved);
        var chosen = null;
        if (on) {
          keys.forEach(function (key) {
            if (chosen || (state.task && key !== state.task)) return;
            p.rows.forEach(function (row) {
              if (!chosen && row.getAttribute("data-category") === key) chosen = row;
            });
          });
        }
        p.rows.forEach(function (row) { row.hidden = row !== chosen; });
        if (chosen) {
          visibleRows += 1;
          shownGroups[chosen.getAttribute("data-category")] = true;
        }
      });
      groups.forEach(function (g) { g.hidden = !shownGroups[g.getAttribute("data-category")]; });

      var filtered = !!(state["for"] || state.task || state.saved);
      var words = describe(visibleRows, state);
      if (countEl) countEl.innerHTML = words.html;
      summaryText.innerHTML = words.html;
      clearBtn.hidden = !filtered;
      doneBtn.textContent = "Show " + visibleRows + (visibleRows === 1 ? " prompt" : " prompts");
      empty.hidden = visibleRows !== 0;
      empty.textContent = visibleRows ? "" : (state.saved
        ? "No saved prompts match. Save a prompt from its row or its page to keep it here."
        : "No prompts match these choices.");
      changeBtn.textContent = shelf.classList.contains("is-folded") ? (filtered ? "Change" : "Filter") : "Done";
      if (opts.announce !== false) liveSay(words.text);
      if (opts.url !== false) setURL();
    }

    // A polite status message, written a moment after the last change so a
    // run of quick choices is read once.
    var live = document.createElement("p");
    live.className = "pl-sr";
    live.setAttribute("role", "status");
    live.setAttribute("aria-live", "polite");
    host.appendChild(live);
    function liveSay(text) {
      clearTimeout(timer);
      live.textContent = "";
      timer = setTimeout(function () { live.textContent = text; }, 450);
    }

    /* ---- folding on phones ------------------------------------------------ */
    // Only a reader's own tap moves focus: opening puts it on the chosen
    // option, closing on the line that says what is showing.
    function fold(folded, byReader) {
      shelf.classList.toggle("is-folded", folded);
      changeBtn.setAttribute("aria-expanded", folded ? "false" : "true");
      var filtered = !!(state["for"] || state.task || state.saved);
      changeBtn.textContent = folded ? (filtered ? "Change" : "Filter") : "Done";
      if (!byReader) return;
      if (!folded) {
        var first = host.querySelector("input:checked") || host.querySelector("input");
        if (first) first.focus();
      } else {
        changeBtn.focus();
        if (summary.getBoundingClientRect().top < 0) summary.scrollIntoView({ block: "start" });
      }
    }
    changeBtn.addEventListener("click", function () {
      fold(!shelf.classList.contains("is-folded"), true);
    });
    doneBtn.addEventListener("click", function () { fold(true, true); });

    host.addEventListener("change", function (ev) {
      var input = ev.target;
      if (!input || !input.name) return;
      var name = input.name.slice(3);
      if (name === "saved") state.saved = input.checked; else state[name] = input.value;
      apply();
    });
    clearBtn.addEventListener("click", function () {
      state = { "for": "", task: "", saved: false };
      apply();
      var first = host.querySelector("input");
      if (first) first.focus();
    });
    document.addEventListener("aua:saved-prompts", function () {
      apply({ announce: false, url: false });
    });

    /* ---- arrival: ?for= and ?task=, unless a #prompt or #section link
       was followed ------------------------------------------------------- */
    var params = null;
    try { params = new URLSearchParams(location.search); } catch (err) { params = null; }
    var hash = location.hash ? location.hash.slice(1) : "";
    var linked = hash && (prompts[hash] || anchors[hash]);
    if (params && !linked) {
      var f = params.get("for"), k = params.get("task");
      if (f && document.getElementById("pl-for-" + f)) state["for"] = f;
      if (k && document.getElementById("pl-task-" + k)) state.task = k;
    }
    apply({ announce: false, url: false });
    fold(phone.matches, false);
    phone.addEventListener("change", function () { fold(phone.matches, false); });
    if (linked) {
      var target = document.getElementById(hash);
      if (target) target.scrollIntoView();
    }
  }

  // Same start-up as the site's other widget scripts (navigation.instant is
  // deliberately off; see tools-chooser.js). layout-prompts.js, which loads
  // after this file, defines window.AUAPromptSaves before DOMContentLoaded.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
