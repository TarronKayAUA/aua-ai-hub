/* Narration player (layout redesign, 2026-09-25; compact form for pages,
   2026-09-26; first version with six speed pills, 2026-09-02).

   scripts/render_data.py injects a native <audio controls> element, and
   the AI-voice note, wherever a generated MP3 exists: under the head meta
   line of a narrated page, and inside each news brief. This script turns
   each one into buttons, in one of two forms.

   A page or module (the player sits right after the head meta line):
   audio is a utility, not the page's first action, so one small Listen
   button joins the end of the meta line, beside the minutes:

     For everyone · About 10 minutes · [> Listen]

   Pressing it starts the recording and opens the player under the line:
   a position slider, the elapsed and total time, a Speed menu, and the
   AI-voice note. Until then the page shows nothing else for audio, so the
   module's own text starts right under its title. Listen becomes Pause
   while playing and Resume after a pause; its description is the note, so
   a screen reader hears the disclosure before the recording starts.

   A news brief keeps its row of two buttons inside the brief, with the
   note under them: [> Listen]  [Speed 1x]. There, Speed cycles 1x, 1.25x,
   1.5x and 2x and announces the new speed to screen readers.

   Either way the speed applies to every player on the page and is
   remembered across pages in localStorage (wrapped in try/catch: a
   private window simply forgets). Browsers preserve pitch by default. A
   speed saved before 2026-09-25 (2.5x or 3x) keeps working: the menu
   offers it, and the cycling button starts again at 1x when pressed.

   Progressive enhancement: without JavaScript, or if this script fails,
   the native player and the note stay exactly as injected. The note is
   always shown with the controls that play the recording, because
   Speechify's terms require that disclosure. */
(function () {
  "use strict";

  var KEY = "aua-listen-rate";
  var CYCLE = [1, 1.25, 1.5, 2];
  var KNOWN = [1, 1.25, 1.5, 2, 2.5, 3];
  var SEEK_STEP = 5;
  var SEEK_PAGE = 30;
  var SVG = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
  var ICON = {
    play: "<svg " + SVG + '><path d="M8 5.14v13.72L19 12z"/></svg>',
    pause: "<svg " + SVG + '><path d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z"/></svg>'
  };
  var players = [];

  function savedRate() {
    try {
      var v = parseFloat(window.localStorage.getItem(KEY));
      return KNOWN.indexOf(v) >= 0 ? v : 1;
    } catch (e) {
      return 1;
    }
  }

  function saveRate(rate) {
    try {
      window.localStorage.setItem(KEY, String(rate));
    } catch (e) {
      /* storage unavailable (private mode, blocked): the speed still applies on this page */
    }
  }

  function nextRate(rate) {
    for (var i = 0; i < CYCLE.length; i++) {
      if (CYCLE[i] > rate) return CYCLE[i];
    }
    return CYCLE[0];
  }

  function rateText(rate) {
    return String(rate) + "×";
  }

  function clock(s) {
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function spokenTime(s) {
    if (!isFinite(s) || s < 0) s = 0;
    var m = Math.floor(s / 60);
    var sec = Math.floor(s % 60);
    var out = [];
    if (m) out.push(m + (m === 1 ? " minute" : " minutes"));
    if (sec || !m) out.push(sec + (sec === 1 ? " second" : " seconds"));
    return out.join(" ");
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  function setLabel(btn, icon, text, hidden) {
    btn.innerHTML = icon ? ICON[icon] : "";
    btn.appendChild(el("span", "listen-btn__text", text));
    if (hidden) btn.appendChild(el("span", "listen-sr", hidden));
  }

  /* The Speed menu offers the cycle's speeds, plus a legacy saved speed
     (2.5x or 3x) when that is what this browser remembers. */
  function fillSpeeds(select, rate) {
    var list = CYCLE.slice();
    if (list.indexOf(rate) < 0) list.push(rate);
    if (select.options.length !== list.length) {
      select.textContent = "";
      list.forEach(function (r) {
        var opt = el("option", null, rateText(r));
        opt.value = String(r);
        select.appendChild(opt);
      });
    }
    select.value = String(rate);
  }

  function applyRate(rate) {
    players.forEach(function (p) {
      p.audio.preservesPitch = true;
      p.audio.playbackRate = rate;
      if (p.rate) setLabel(p.rate, null, "Speed " + rateText(rate));
      if (p.speed) fillSpeeds(p.speed, rate);
    });
  }

  /* The head meta line a page's player sits under, if it has one. */
  function metaLine(box) {
    var prev = box.previousElementSibling;
    return prev && prev.tagName === "P" && prev.querySelector(".meta-chip") ? prev : null;
  }

  var uid = 0;

  function enhance(box) {
    var audio = box.querySelector("audio");
    if (!audio || box.hasAttribute("data-listen-ready")) return;
    box.setAttribute("data-listen-ready", "");
    var kind = box.getAttribute("data-listen") || (box.closest(".section-brief") ? "brief" : "page");
    var meta = kind === "brief" ? null : metaLine(box);
    if (meta) {
      enhanceCompact(box, audio, kind, meta);
      return;
    }
    var idle = kind === "module" ? "Listen to this module"
      : kind === "brief" ? "Listen to this brief" : "Listen to this page";
    /* Several briefs share a page, and each sits in a narrow box, so a
       brief's button shows just "Listen" and carries the brief's name for
       screen readers ("Listen to the Medical Education brief";
       data-listen-name comes from the build). A page has one player and
       needs no name. */
    var name = box.getAttribute("data-listen-name") || "";
    var to = "";
    var of = "";
    if (name) {
      idle = "Listen";
      to = " to the " + name + " brief";
      of = " the " + name + " brief";
    }

    var row = el("div", "listen-row");
    var play = el("button", "listen-btn listen-play");
    play.type = "button";
    var rate = el("button", "listen-btn listen-rate");
    rate.type = "button";
    row.appendChild(play);
    row.appendChild(rate);

    var bar = seekBar(of);
    bar.progress.hidden = true;

    var live = el("span", "listen-sr");
    live.setAttribute("aria-live", "polite");

    var note = box.querySelector(".listen-note");
    box.insertBefore(row, note || null);
    box.insertBefore(bar.progress, note || null);
    box.appendChild(live);
    audio.removeAttribute("controls");

    players.push({ audio: audio, play: play, rate: rate });

    rate.addEventListener("click", function () {
      var r = nextRate(savedRate());
      saveRate(r);
      applyRate(r);
      live.textContent = "";
      window.setTimeout(function () {
        live.textContent = r === 1 ? "Normal speed" : "Speed " + String(r) + " times";
      }, 50);
    });

    wire({ audio: audio, play: play, seek: bar.seek, time: bar.time, reveal: bar.progress,
           idle: idle, to: to, of: of });
  }

  /* A page or module: Listen at the end of the head meta line, and the
     player (slider, time, Speed menu and the note) folded under the line
     until the recording is started. */
  function enhanceCompact(box, audio, kind, meta) {
    var n = ++uid;
    var what = kind === "module" ? "module" : "page";
    var note = box.querySelector(".listen-note");
    if (note && !note.id) note.id = "listen-note-" + n;

    var chip = el("span", "meta-chip meta-listen");
    var play = el("button", "listen-toggle");
    play.type = "button";
    if (note) play.setAttribute("aria-describedby", note.id);
    chip.appendChild(play);
    meta.appendChild(chip);

    var panel = el("div", "listen-panel");
    panel.id = "listen-panel-" + n;
    panel.hidden = true;
    panel.setAttribute("role", "group");
    panel.setAttribute("aria-label", "Recording of this " + what);
    play.setAttribute("aria-controls", panel.id);

    var bar = seekBar("");
    var speedField = el("span", "listen-speed-field");
    var speedLabel = el("label", "listen-speed-label", "Speed");
    var speed = el("select", "listen-speed");
    speed.id = "listen-speed-" + n;
    speedLabel.htmlFor = speed.id;
    speedField.appendChild(speedLabel);
    speedField.appendChild(speed);
    bar.progress.appendChild(speedField);
    panel.appendChild(bar.progress);
    if (note) panel.appendChild(note);
    box.classList.add("listen--compact");
    box.appendChild(panel);
    audio.removeAttribute("controls");

    players.push({ audio: audio, play: play, speed: speed });
    fillSpeeds(speed, savedRate());

    speed.addEventListener("change", function () {
      var r = parseFloat(speed.value);
      if (KNOWN.indexOf(r) < 0) return;
      saveRate(r);
      applyRate(r);
    });

    // "AI voice" stays on the visible label: the full note sits in the
    // folded player, and the narration provider's terms ask for a clear
    // disclosure that the voice is AI-generated before anyone listens.
    wire({ audio: audio, play: play, seek: bar.seek, time: bar.time, reveal: panel,
           idle: "Listen (AI voice)", to: " to this " + what, of: "" });
  }

  /* The position slider and the elapsed / total time. */
  function seekBar(of) {
    var progress = el("div", "listen-progress");
    var seek = el("input", "listen-seek");
    seek.type = "range";
    seek.min = "0";
    seek.max = "0";
    seek.step = "1";
    seek.value = "0";
    seek.setAttribute("aria-label", "Position in" + (of || " the recording"));
    var time = el("span", "listen-time");
    time.setAttribute("aria-hidden", "true");
    time.textContent = "0:00";
    progress.appendChild(seek);
    progress.appendChild(time);
    return { progress: progress, seek: seek, time: time };
  }

  /* Play, pause, the slider and the time, shared by both forms. `reveal`
     is what appears once playback starts: the slider row in a brief, the
     whole player on a page. */
  function wire(p) {
    var audio = p.audio;
    var play = p.play;
    var seek = p.seek;
    var time = p.time;
    var idle = p.idle;
    var to = p.to;
    var of = p.of;

    function showState() {
      if (play.disabled) return;
      if (!audio.paused && !audio.ended) {
        setLabel(play, "pause", "Pause", of);
      } else if (audio.ended || audio.currentTime === 0) {
        setLabel(play, "play", audio.ended ? "Listen again" : idle, to);
      } else {
        setLabel(play, "play", "Resume", of);
      }
      play.classList.toggle("is-playing", !audio.paused && !audio.ended);
    }

    function showTime(announce) {
      var d = audio.duration;
      if (isFinite(d) && d > 0) {
        seek.max = String(Math.ceil(d));
        time.textContent = clock(audio.currentTime) + " / " + clock(d);
      } else {
        time.textContent = clock(audio.currentTime);
      }
      seek.value = String(Math.floor(audio.currentTime));
      /* Keep the slider's spoken value current, but not every tick while a
         screen reader user has it focused: that would chatter. */
      if (announce || document.activeElement !== seek) {
        seek.setAttribute("aria-valuetext", spokenTime(audio.currentTime)
          + (isFinite(d) && d > 0 ? " of " + spokenTime(d) : ""));
      }
    }

    play.addEventListener("click", function () {
      if (audio.paused || audio.ended) {
        players.forEach(function (p) { if (p.audio !== audio) p.audio.pause(); });
        audio.preservesPitch = true;
        audio.playbackRate = savedRate();
        var started = audio.play();
        if (started && typeof started.catch === "function") {
          started.catch(function () { showState(); });
        }
      } else {
        audio.pause();
      }
    });

    seek.addEventListener("input", function () {
      audio.currentTime = parseFloat(seek.value) || 0;
      showTime(true);
    });
    seek.addEventListener("keydown", function (e) {
      var step = { ArrowLeft: -SEEK_STEP, ArrowDown: -SEEK_STEP, ArrowRight: SEEK_STEP, ArrowUp: SEEK_STEP,
                   PageDown: -SEEK_PAGE, PageUp: SEEK_PAGE }[e.key];
      if (!step) return;
      e.preventDefault();
      var max = parseFloat(seek.max) || audio.duration || 0;
      audio.currentTime = Math.max(0, Math.min(max, audio.currentTime + step));
      showTime(true);
    });

    audio.addEventListener("play", function () {
      /* Some browsers reset playbackRate when the source loads; reapply. */
      audio.preservesPitch = true;
      audio.playbackRate = savedRate();
      p.reveal.hidden = false;
      showState();
    });
    ["pause", "ended", "emptied"].forEach(function (ev) { audio.addEventListener(ev, showState); });
    ["timeupdate", "loadedmetadata", "durationchange", "seeked"].forEach(function (ev) {
      audio.addEventListener(ev, function () { showTime(false); });
    });
    audio.addEventListener("error", function () {
      play.disabled = true;
      setLabel(play, "play", "Recording unavailable");
      p.reveal.hidden = true;
    });

    showState();
  }

  function build() {
    document.querySelectorAll(".listen").forEach(enhance);
    applyRate(savedRate());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
