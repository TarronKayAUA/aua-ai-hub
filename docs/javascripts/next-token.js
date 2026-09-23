/* Next-token stepper on basics/how-llms-work.md (owner approved 2026-09-23).
   Progressive enhancement in the same idiom as hardware.js: the static loop
   diagram on the page stays the no-JavaScript version, and this adds a
   reader-driven walk through one reply. Nothing moves until the reader
   presses a button; the only motion (bars filling, the newest word
   arriving) is removed under prefers-reduced-motion by CSS. Every state is
   also stated in text: percentages beside the bars, a "picked" label, an
   underline on the newest word, and a polite live region for screen
   readers. The words come from data/next_token_demo.yaml, rendered into the
   JSON island by scripts/render_data.py. */
(function () {
  "use strict";

  function init() {
    var root = document.getElementById("nt-demo");
    var dataEl = document.getElementById("nt-data");
    if (!root || !dataEl || root.dataset.ready) return;
    root.dataset.ready = "1";
    var data = JSON.parse(dataEl.textContent);
    var el = function (sel) { return root.querySelector(sel); };
    var textEl = el(".nt-text"), list = el(".nt-cands"), note = el(".nt-note"),
        next = el(".nt-next"), reset = el(".nt-reset"), count = el(".nt-count"),
        status = el(".nt-status"), attach = el(".nt-attach"),
        weighLabel = el(".nt-weigh-label"), finalEl = el(".nt-final");
    var chips = root.querySelectorAll(".nt-chip");
    var scenario = chips.length ? chips[0].getAttribute("data-scenario") : "none";
    var k = 0;

    function steps() { return data.scenarios[scenario].steps; }
    function picks(upto) {
      return steps().slice(0, upto).map(function (s) { return s.cands[0][0]; });
    }
    function join(words) {
      return words.reduce(function (acc, w) {
        return acc + (acc === "" || w === "." ? "" : " ") + w;
      }, "");
    }
    function row(label, pct, cls) {
      var li = document.createElement("li");
      li.className = "nt-cand" + (cls ? " " + cls : "");
      var tok = document.createElement("span");
      tok.className = "nt-tok";
      tok.textContent = label;
      var bar = document.createElement("span");
      bar.className = "nt-bar";
      var fill = document.createElement("span");
      fill.className = "nt-fill";
      bar.appendChild(fill);
      var pctEl = document.createElement("span");
      pctEl.className = "nt-pct";
      pctEl.textContent = pct + "%" + (cls === "is-picked" ? " picked" : "");
      li.appendChild(tok);
      li.appendChild(bar);
      li.appendChild(pctEl);
      li.dataset.pct = pct;
      return li;
    }

    function render(animate) {
      var all = steps(), n = all.length;
      var words = picks(k);
      textEl.textContent = "";
      var before = join(words.slice(0, -1)), last = words[words.length - 1];
      if (before) textEl.appendChild(document.createTextNode(before));
      if (last) {
        if (before && last !== ".") textEl.appendChild(document.createTextNode(" "));
        var span = document.createElement("span");
        span.className = "nt-newest" + (animate ? " nt-arrive" : "");
        span.textContent = last;
        textEl.appendChild(span);
      }
      list.textContent = "";
      if (k === 0) {
        weighLabel.textContent = "What the model will weigh";
        note.textContent = data.start_note;
      } else {
        var s = all[k - 1];
        weighLabel.textContent = "What the model weighed for token " + k;
        s.cands.forEach(function (c, i) {
          list.appendChild(row(c[0], c[1], i === 0 ? "is-picked" : ""));
        });
        if (s.other) list.appendChild(row(s.otherLabel, s.other, "is-other"));
        note.textContent = s.note;
        var fills = list.querySelectorAll(".nt-fill");
        fills.forEach(function (f) {
          f.style.width = animate ? "0" : f.closest("li").dataset.pct + "%";
        });
        if (animate) {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              fills.forEach(function (f) { f.style.width = f.closest("li").dataset.pct + "%"; });
            });
          });
        }
        // A bare "." reads as nothing, or as "dot", in a screen reader.
        var said = s.cands[0][0] === "." ? "a period" : s.cands[0][0];
        status.textContent = "Picked " + said + ", " + s.cands[0][1] +
          " percent. Reply so far: " + join(words);
      }
      finalEl.hidden = k < n;
      finalEl.textContent = k >= n ? data.scenarios[scenario].final : "";
      attach.hidden = scenario !== "pasted";
      count.textContent = "Token " + k + " of " + n;
      next.disabled = k >= n;
      next.textContent = k >= n ? "Reply finished" : "Next token";
    }

    next.addEventListener("click", function () {
      if (k < steps().length) { k += 1; render(true); }
    });
    reset.addEventListener("click", function () {
      k = 0;
      status.textContent = "";
      render(false);
      next.focus();
    });
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        scenario = chip.getAttribute("data-scenario");
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle("is-active", on);
          c.setAttribute("aria-pressed", on ? "true" : "false");
        });
        // Keep the reader's place and swap only what the model can see.
        render(false);
        if (k > 0) {
          status.textContent = chip.textContent + ". " + status.textContent;
        }
      });
    });
    render(false);
  }

  // Same start-up as the site's other widget scripts. navigation.instant is
  // deliberately off (SPEC section 12); turning it on would need every one
  // of these rewritten against Material's document$ observable.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
