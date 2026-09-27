/* Prompt Library rows and prompt pages (layout redesign L16, L17;
 * 2026-09-25).
 *
 * 1. Copy. A library row's Copy button ([data-copy]) copies that prompt's
 *    stored text from the page's #prompt-texts JSON island; a prompt page's
 *    Copy prompt buttons ([data-copy-from]) copy the visible prompt block's
 *    text. Either way the string handed to the clipboard is the text in
 *    data/prompts.yaml, byte for byte (the build checks both sources), and
 *    nothing has to be opened first. The button says "Copied" and a status
 *    message says what was copied.
 * 2. Save. A small toggle keeps a list of prompt ids in this browser's
 *    localStorage and nowhere else ("on this device"); the library's Saved
 *    filter (prompt-chooser.js) reads the same list through
 *    window.AUAPromptSaves. The first save in a browser explains that once,
 *    in a note under the row. Storage can be missing or throw (private
 *    windows, blocked site data, previews), so every access is wrapped and
 *    the Save controls stay hidden when it does not work.
 * 3. Prompt pages. The prompt text folds after about 24rem behind "Show the
 *    whole prompt". Copy prompt joins the section navigator's controls
 *    (layout-nav.js) while every Copy prompt on the page is out of view.
 * Without JavaScript none of this is needed: the buttons stay hidden, each
 * library title links to its prompt's page, and the page shows the text.
 */
(function () {
  "use strict";

  var KEY = "aua-hub:saved-prompts";
  var ICON = {
    copy: "M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z",
    done: "M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z",
    save: "M17,18L12,15.82L7,18V5H17M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z",
    saved: "M17,3H7A2,2 0 0,0 5,5V21L12,18L19,21V5C19,3.89 18.1,3 17,3Z"
  };

  function svg(name) {
    return '<svg class="pl-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' +
      ICON[name] + '"/></svg>';
  }

  /* --- saved prompts: this browser only, every access wrapped ------------ */
  var saves = (function () {
    var ok = false;
    try {
      var probe = "aua-hub:probe";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
      ok = true;
    } catch (err) {
      ok = false;
    }
    function list() {
      if (!ok) return [];
      try {
        var value = JSON.parse(window.localStorage.getItem(KEY) || "[]");
        return Array.isArray(value) ? value.filter(function (id) { return typeof id === "string"; }) : [];
      } catch (err) {
        return [];
      }
    }
    function write(ids) {
      try {
        window.localStorage.setItem(KEY, JSON.stringify(ids));
        return true;
      } catch (err) {
        return false;
      }
    }
    function changed() {
      var event;
      try {
        event = new CustomEvent("aua:saved-prompts");
      } catch (err) {
        event = document.createEvent("Event");
        event.initEvent("aua:saved-prompts", false, false);
      }
      document.dispatchEvent(event);
    }
    // Another tab changed the list: keep this one in step.
    window.addEventListener("storage", function (e) {
      if (e.key === KEY) changed();
    });
    return {
      available: ok,
      list: list,
      has: function (id) { return list().indexOf(id) !== -1; },
      // Returns true (now saved), false (now removed) or null (not stored).
      toggle: function (id) {
        if (!ok) return null;
        var ids = list();
        var at = ids.indexOf(id);
        if (at === -1) ids.push(id); else ids.splice(at, 1);
        if (!write(ids)) return null;
        changed();
        return at === -1;
      }
    };
  })();
  window.AUAPromptSaves = saves;

  /* --- one polite status message for the whole page ----------------------- */
  var status = null;
  var statusTimer = null;
  function announce(text) {
    if (!status) {
      status = document.createElement("div");
      status.className = "pl-sr";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      document.body.appendChild(status);
    }
    clearTimeout(statusTimer);
    status.textContent = "";
    statusTimer = setTimeout(function () { status.textContent = text; }, 100);
  }

  /* --- copy ---------------------------------------------------------------- */
  var texts = null;
  function libraryText(id) {
    if (texts === null) {
      var island = document.getElementById("prompt-texts");
      try {
        texts = island ? JSON.parse(island.textContent) : {};
      } catch (err) {
        texts = {};
      }
    }
    return Object.prototype.hasOwnProperty.call(texts, id) ? texts[id] : null;
  }

  // A prompt page shows its text reflowed for reading; what it copies is
  // the stored text, kept in its own JSON island (#prompt-text-source).
  function textFor(button) {
    if (button.hasAttribute("data-copy")) return libraryText(button.getAttribute("data-copy"));
    var source = document.getElementById(button.getAttribute("data-copy-from"));
    if (!source) return null;
    if (source.tagName === "SCRIPT") {
      try {
        var value = JSON.parse(source.textContent);
        return typeof value === "string" ? value : null;
      } catch (err) {
        return null;
      }
    }
    return source.textContent;
  }

  // For browsers without the async clipboard (or a page not served
  // securely): a hidden, read-only textarea and the older copy command.
  function copyByCommand(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.setAttribute("aria-hidden", "true");
    area.style.position = "fixed";
    area.style.top = "0";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    var active = document.activeElement;
    area.select();
    area.setSelectionRange(0, text.length);
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(area);
    if (active && typeof active.focus === "function") active.focus();
    return ok;
  }

  function writeClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function" && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return copyByCommand(text); }
      );
    }
    return Promise.resolve(copyByCommand(text));
  }

  function fillButton(button, icon, label, hidden) {
    button.innerHTML = svg(icon) + '<span class="pl-btn__label"></span>' +
      (hidden ? '<span class="pl-sr"></span>' : "");
    button.querySelector(".pl-btn__label").textContent = label;
    if (hidden) button.querySelector(".pl-sr").textContent = hidden;
  }

  function setupCopy(button) {
    if (button.getAttribute("data-ready")) return;
    button.setAttribute("data-ready", "1");
    var label = (button.textContent || "Copy").trim();
    var title = button.getAttribute("data-title") || "";
    // Library rows all say "Copy", so each names its prompt for screen
    // readers; the visible word still starts the accessible name.
    var extra = button.hasAttribute("data-copy") ? " " + title : "";
    button.setAttribute("data-label", label);
    fillButton(button, "copy", label, extra);
    button.hidden = false;
  }

  function flash(button, ok) {
    var label = button.getAttribute("data-label") || "Copy";
    var title = button.getAttribute("data-title") || "the prompt";
    var extra = button.hasAttribute("data-copy") ? " " + title : "";
    clearTimeout(button._plTimer);
    button.classList.toggle("is-done", ok);
    button.classList.toggle("is-failed", !ok);
    fillButton(button, ok ? "done" : "copy", ok ? "Copied" : "Copy failed", extra);
    announce(ok ? "Copied " + title + ". Paste it into your assistant."
                : "Could not copy. Open the prompt's page and select the text there.");
    button._plTimer = setTimeout(function () {
      button.classList.remove("is-done", "is-failed");
      fillButton(button, "copy", label, extra);
    }, 2400);
  }

  function copyFrom(button) {
    var text = textFor(button);
    if (text === null) {
      flash(button, false);
      return;
    }
    writeClipboard(text).then(function (ok) { flash(button, ok); }, function () { flash(button, false); });
  }

  /* --- save toggles ---------------------------------------------------------- */
  function paintSave(button) {
    var id = button.getAttribute("data-save");
    var on = saves.has(id);
    var long = button.classList.contains("pp-save");
    var title = button.getAttribute("data-title") || "";
    var label = on ? (long ? "Saved on this device" : "Saved") : (long ? "Save on this device" : "Save");
    fillButton(button, on ? "saved" : "save", label, long ? "" : " " + title + " on this device");
    button.classList.toggle("is-on", on);
  }

  function setupSave(button) {
    if (!saves.available) return;
    if (!button.getAttribute("data-ready")) {
      button.setAttribute("data-ready", "1");
      button.hidden = false;
    }
    paintSave(button);
  }

  /* The first save explains, once, where saved prompts live: a note under
     the row (or under a prompt page's buttons) until OK is pressed. Once
     shown it is not shown again in this browser. */
  var TOLD_KEY = "aua-hub:saved-prompts-told";
  var TIP_LEAD = "Saved on this device only.";
  var TIP_REST = "Your saved prompts stay in this browser: they are not sent anywhere, " +
    "and they do not follow you to another browser or device. The Prompt Library's " +
    "Saved filter lists them.";
  var TIP_TEXT = TIP_LEAD + " " + TIP_REST;

  function told() {
    try {
      return window.localStorage.getItem(TOLD_KEY) === "1";
    } catch (err) {
      return true;
    }
  }

  function explainOnce(button) {
    if (told()) return false;
    try {
      window.localStorage.setItem(TOLD_KEY, "1");
    } catch (err) {
      return false;
    }
    var tip = document.createElement("div");
    tip.className = "pl-save-tip";
    tip.setAttribute("role", "note");
    var text = document.createElement("p");
    text.className = "pl-save-tip__text";
    var lead = document.createElement("strong");
    lead.textContent = TIP_LEAD;
    text.appendChild(lead);
    text.appendChild(document.createTextNode(" " + TIP_REST));
    var ok = document.createElement("button");
    ok.type = "button";
    ok.className = "pl-save-tip__ok";
    ok.textContent = "OK";
    ok.addEventListener("click", function () {
      tip.parentNode.removeChild(tip);
      button.focus();
    });
    tip.appendChild(text);
    tip.appendChild(ok);
    var row = button.closest(".pl-row");
    var actions = button.closest(".pp-actions");
    if (row) {
      row.appendChild(tip);
    } else if (actions) {
      actions.parentNode.insertBefore(tip, actions.nextSibling);
    } else {
      button.parentNode.insertBefore(tip, button.nextSibling);
    }
    return true;
  }

  function toggleSave(button) {
    var id = button.getAttribute("data-save");
    var title = button.getAttribute("data-title") || "This prompt";
    var now = saves.toggle(id);
    if (now === null) {
      announce("This browser is not keeping saved prompts, so nothing was saved.");
      return;
    }
    if (now && explainOnce(button)) {
      announce(title + " saved. " + TIP_TEXT);
      return;
    }
    announce(now ? title + " saved on this device. The Prompt Library's Saved filter lists it."
                 : title + " removed from your saved prompts.");
  }

  /* --- wiring ------------------------------------------------------------------ */
  function init() {
    document.querySelectorAll("button.pl-copy, button.pp-copy").forEach(setupCopy);
    document.querySelectorAll("button.pl-save").forEach(setupSave);

    document.addEventListener("click", function (e) {
      var target = e.target && e.target.closest ? e.target.closest("button") : null;
      if (!target) return;
      if (target.classList.contains("pl-copy") || target.classList.contains("pp-copy")) {
        copyFrom(target);
      } else if (target.classList.contains("pl-save")) {
        toggleSave(target);
      }
    });
    document.addEventListener("aua:saved-prompts", function () {
      document.querySelectorAll("button.pl-save[data-ready]").forEach(paintSave);
    });

    /* Prompt page: fold the text after about 24rem. */
    var body = document.getElementById("prompt-text-body");
    var expand = document.querySelector("button.pp-expand");
    if (body && expand) {
      var box = body.parentNode;
      var rem = parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
      if (body.scrollHeight > rem * 24 * 1.25) {
        var setOpen = function (open) {
          box.classList.toggle("is-folded", !open);
          expand.setAttribute("aria-expanded", open ? "true" : "false");
          expand.textContent = open ? "Show less" : "Show the whole prompt";
        };
        setOpen(false);
        expand.hidden = false;
        expand.addEventListener("click", function () {
          var open = box.classList.contains("is-folded");
          setOpen(open);
          if (!open && box.getBoundingClientRect().top < 0) {
            box.scrollIntoView({ block: "start" });
          }
        });
        /* Arriving at #the-prompt (a library row's Read the prompt, this
           page's own Read the prompt, or a hash change) opens the whole
           prompt, as Show the whole prompt does, and brings the section's
           start into view below the header (its scroll-margin, from
           layout-prompts.css). Instant, so the same with reduced motion. */
        var arrive = function () {
          if (window.location.hash !== "#the-prompt") return;
          setOpen(true);
          var start = document.getElementById("the-prompt");
          if (start) start.scrollIntoView({ block: "start" });
        };
        arrive();
        window.addEventListener("hashchange", arrive);
        // Already at #the-prompt, a click on the page's own link changes no
        // hash: open it all the same.
        document.querySelectorAll('a[href="#the-prompt"]').forEach(function (a) {
          a.addEventListener("click", function () { window.setTimeout(arrive, 0); });
        });
        // Web fonts and late layout can move the heading after the first
        // jump; settle once more when the page has loaded.
        window.addEventListener("load", function () {
          if (window.location.hash === "#the-prompt") arrive();
        });
      }
    }

    /* Prompt page: Fill In Your Details. Each field fills its blanks in
       the prompt text as the reader types (the <mark>s the build put
       round them); Copy with my answers copies the stored prompt with the
       answers spliced into the exact places the build recorded, any empty
       field's blank left as written; Clear empties them all. The answers
       live only in these fields: nothing is stored or sent. Without
       JavaScript the panel is a "Have ready" list instead. */
    var fill = document.querySelector("[data-pp-fill]");
    var fillSource = document.getElementById("prompt-fill-source");
    var textSource = document.getElementById("prompt-text-source");
    if (fill && fillSource && textSource) setupFill(fill, fillSource, textSource);

    /* Prompt page: layout-nav.js docks a copy of Copy prompt (a
       button.pp-copy, wired above like the others) while every Copy prompt
       on the page is out of view. */
  }

  function setupFill(panel, fillSource, textSource) {
    var spec, original;
    try {
      spec = JSON.parse(fillSource.textContent);
      original = JSON.parse(textSource.textContent);
    } catch (err) {
      return;
    }
    var inputs = Array.prototype.slice.call(panel.querySelectorAll("[data-fill]"));
    var marks = {};
    Array.prototype.forEach.call(document.querySelectorAll("mark.pp-blank"), function (m) {
      var id = m.getAttribute("data-fill");
      (marks[id] = marks[id] || []).push(m);
      m.setAttribute("data-blank", m.textContent);
    });
    var status = panel.querySelector(".pp-fill__status");
    var copy = panel.querySelector(".pp-fill-copy");
    var clear = panel.querySelector(".pp-fill-clear");
    var copyLabel = copy.textContent;

    function paint(input) {
      var value = input.value;
      (marks[input.getAttribute("data-fill")] || []).forEach(function (m) {
        var on = value.trim() !== "";
        m.textContent = on ? value : m.getAttribute("data-blank");
        m.classList.toggle("is-filled", on);
      });
    }
    function filled() {
      var byId = {};
      inputs.forEach(function (i) { byId[i.getAttribute("data-fill")] = i.value; });
      var cuts = [];
      spec.forEach(function (field) {
        var value = byId[String(field.id)];
        if (!value || value.trim() === "") return;
        field.spans.forEach(function (span) { cuts.push([span[0], span[1], value]); });
      });
      cuts.sort(function (a, b) { return b[0] - a[0]; });
      var text = original;
      cuts.forEach(function (c) { text = text.slice(0, c[0]) + c[2] + text.slice(c[1]); });
      return text;
    }
    inputs.forEach(function (input) {
      input.addEventListener("input", function () { paint(input); });
    });
    copy.addEventListener("click", function () {
      writeClipboard(filled()).then(function (ok) { done(ok); }, function () { done(false); });
    });
    function done(ok) {
      clearTimeout(copy._ppTimer);
      copy.textContent = ok ? "Copied with your answers" : "Copy failed";
      status.textContent = ok ? "Copied the prompt with your answers. Paste it into your assistant."
                              : "Could not copy. Select the prompt text and copy it instead.";
      copy._ppTimer = setTimeout(function () {
        copy.textContent = copyLabel;
        status.textContent = "";
      }, 2400);
    }
    clear.addEventListener("click", function () {
      inputs.forEach(function (input) { input.value = ""; paint(input); });
      status.textContent = "Cleared.";
      if (inputs[0]) inputs[0].focus();
    });
    var ready = panel.parentNode.querySelector(".pp-fill__ready");
    if (ready) ready.hidden = true;
    panel.hidden = false;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
