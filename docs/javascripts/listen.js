/* Narration player: one compact Listen row (layout redesign, 2026-09-25;
   first version with six speed pills, 2026-09-02).

   scripts/render_data.py injects a native <audio controls> element, and
   the AI-voice note, wherever a generated MP3 exists: under the head of a
   narrated page, and inside each news brief. This script turns each one
   into a row of two buttons:

     [> Listen to this module]  [Speed 1x]

   Listen is an outline button, never the page's filled primary: it is one
   way to take in the page, not the thing everyone should do first. It
   becomes Pause while playing and Resume after a pause. Speed cycles 1x,
   1.25x, 1.5x and 2x, announces the new speed to screen readers, applies
   to every player on the page, and is remembered across pages in
   localStorage (wrapped in try/catch: a private window simply forgets).
   Once playback starts, a position slider and the elapsed and total time
   appear under the row, so a listener can go back without a menu.

   Browsers preserve pitch by default. A speed saved before 2026-09-25
   (2.5x or 3x) keeps working until the listener presses Speed, which
   then starts the cycle again at 1x.

   Progressive enhancement: without JavaScript, or if this script fails,
   the native player stays exactly as injected. The note stays visible in
   every case, because Speechify's terms require that disclosure. */
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

  function applyRate(rate) {
    players.forEach(function (p) {
      p.audio.preservesPitch = true;
      p.audio.playbackRate = rate;
      setLabel(p.rate, null, "Speed " + rateText(rate));
    });
  }

  function enhance(box) {
    var audio = box.querySelector("audio");
    if (!audio || box.hasAttribute("data-listen-ready")) return;
    box.setAttribute("data-listen-ready", "");
    var kind = box.getAttribute("data-listen") || (box.closest(".section-brief") ? "brief" : "page");
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

    var progress = el("div", "listen-progress");
    progress.hidden = true;
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

    var live = el("span", "listen-sr");
    live.setAttribute("aria-live", "polite");

    var note = box.querySelector(".listen-note");
    box.insertBefore(row, note || null);
    box.insertBefore(progress, note || null);
    box.appendChild(live);
    audio.removeAttribute("controls");

    var player = { audio: audio, play: play, rate: rate };
    players.push(player);

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

    rate.addEventListener("click", function () {
      var r = nextRate(savedRate());
      saveRate(r);
      applyRate(r);
      live.textContent = "";
      window.setTimeout(function () {
        live.textContent = r === 1 ? "Normal speed" : "Speed " + String(r) + " times";
      }, 50);
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
      progress.hidden = false;
      showState();
    });
    ["pause", "ended", "emptied"].forEach(function (ev) { audio.addEventListener(ev, showState); });
    ["timeupdate", "loadedmetadata", "durationchange", "seeked"].forEach(function (ev) {
      audio.addEventListener(ev, function () { showTime(false); });
    });
    audio.addEventListener("error", function () {
      play.disabled = true;
      setLabel(play, "play", "Recording unavailable");
      progress.hidden = true;
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
