/* Narration speed control (2026-09-02). Every .listen container (injected
   by scripts/render_data.py wherever a generated MP3 exists) gets a row of
   speed buttons under its native audio element. Choosing a speed applies
   to every player on the page and is remembered across pages in
   localStorage, so a listener who prefers 2x sets it once. Browsers
   preserve pitch by default and mute audio outside a useful range (Gecko:
   0.25x to 4x), so 3x is the deliberate ceiling. Progressive enhancement:
   without JavaScript the plain player still works. */
(function () {
  "use strict";

  var KEY = "aua-listen-rate";
  var RATES = [1, 1.25, 1.5, 2, 2.5, 3];

  function savedRate() {
    try {
      var v = parseFloat(window.localStorage.getItem(KEY));
      return RATES.indexOf(v) >= 0 ? v : 1;
    } catch (e) {
      return 1;
    }
  }

  function saveRate(rate) {
    try {
      window.localStorage.setItem(KEY, String(rate));
    } catch (e) {
      /* storage unavailable (private mode, blocked); the choice still applies on this page */
    }
  }

  function label(rate) {
    return (rate % 1 === 0 ? rate.toFixed(0) : String(rate)) + "×";
  }

  function applyRate(rate) {
    document.querySelectorAll(".listen audio").forEach(function (audio) {
      audio.preservesPitch = true;
      audio.playbackRate = rate;
    });
    document.querySelectorAll(".listen-speed button").forEach(function (btn) {
      var active = parseFloat(btn.getAttribute("data-rate")) === rate;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function build() {
    var rate = savedRate();
    document.querySelectorAll(".listen").forEach(function (box) {
      var audio = box.querySelector("audio");
      if (!audio || box.querySelector(".listen-speed")) {
        return;
      }
      var group = document.createElement("div");
      group.className = "listen-speed";
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Playback speed");
      RATES.forEach(function (r) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "listen-speed-btn";
        btn.setAttribute("data-rate", String(r));
        btn.textContent = label(r);
        group.appendChild(btn);
      });
      audio.insertAdjacentElement("afterend", group);
      /* Some browsers reset playbackRate when the source loads; reapply on play. */
      audio.addEventListener("play", function () {
        audio.preservesPitch = true;
        audio.playbackRate = savedRate();
      });
    });
    applyRate(rate);
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".listen-speed-btn");
    if (!btn) {
      return;
    }
    var rate = parseFloat(btn.getAttribute("data-rate"));
    saveRate(rate);
    applyRate(rate);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
