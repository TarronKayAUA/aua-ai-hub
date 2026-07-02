/* Widgets for the Hardware for Local AI page (docs/tools/hardware.md).
   Two independent pieces, both progressive enhancements over static
   content:

   1. TPS feel demo (#tps-demo): types a sample passage at a selectable
      tokens-per-second rate so readers can feel what a number means.
      This is a simulation of a rate, not a benchmark claim.
   2. Estimator (#hw-estimator): reads the JSON island rendered from
      data/local_models.yaml and data/hardware_tiers.yaml and applies the
      same arithmetic the page teaches: memory needed from total
      parameters and quantization; speed ceiling from memory bandwidth
      divided by active bytes per token; a real-world factor of 0.6.
*/
(function () {
  "use strict";

  /* ---- TPS feel demo -------------------------------------------------- */
  var SAMPLE =
    "A 58-year-old man with hypertension presents with three days of " +
    "worsening shortness of breath. On examination there is jugular " +
    "venous distention and bibasilar crackles. The most likely " +
    "explanation is decompensated heart failure, and first-line " +
    "management is a loop diuretic with close monitoring of renal " +
    "function and electrolytes. Local models produce answers like this " +
    "one word at a time, and the rate at which the words arrive is the " +
    "single number that decides whether the tool feels usable.";
  var WORDS_PER_TOKEN = 0.75;

  function initDemo() {
    var demo = document.getElementById("tps-demo");
    if (!demo) return;
    var output = demo.querySelector(".tps-demo-output");
    var buttons = demo.querySelectorAll("button[data-tps]");
    var timer = null;

    function run(tps, button) {
      if (timer) clearInterval(timer);
      buttons.forEach(function (b) { b.classList.remove("tps-active"); });
      button.classList.add("tps-active");
      var words = SAMPLE.split(" ");
      var i = 0;
      output.textContent = "";
      var interval = 1000 / (tps * WORDS_PER_TOKEN);
      timer = setInterval(function () {
        if (i >= words.length) { clearInterval(timer); return; }
        output.textContent += (i ? " " : "") + words[i];
        i += 1;
      }, interval);
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        run(parseFloat(b.getAttribute("data-tps")), b);
      });
    });
  }

  /* ---- Estimator ------------------------------------------------------ */
  var QUANTS = [
    { id: "q4", label: "Q4 (4-bit, the usual choice)", bpp: 0.57 },
    { id: "q8", label: "Q8 (8-bit, near-lossless)", bpp: 1.06 },
    { id: "fp16", label: "FP16 (full precision)", bpp: 2.0 }
  ];
  var OVERHEAD_GB = 1.5; // working memory at modest context; grows with it
  var REALWORLD = 0.6;   // fraction of the theoretical ceiling to expect

  function band(tps) {
    if (tps < 5) return "a crawl: usable only for short answers";
    if (tps < 15) return "reading speed: fine for chat";
    if (tps < 40) return "comfortable: faster than you read";
    return "effectively instant";
  }

  function initEstimator() {
    var host = document.getElementById("hw-estimator");
    var dataEl = document.getElementById("hw-data");
    if (!host || !dataEl) return;
    var data = JSON.parse(dataEl.textContent);

    function select(id, label, options) {
      return (
        '<label class="hw-label">' + label +
        '<select id="' + id + '">' + options + "</select></label>"
      );
    }
    var modelOpts = data.models.map(function (m, i) {
      return '<option value="' + i + '">' + m.name + " (" +
        (m.arch === "moe" ? "MoE, " : "dense, ") + m.total_b +
        "B)</option>";
    }).join("");
    var quantOpts = QUANTS.map(function (q, i) {
      return '<option value="' + i + '">' + q.label + "</option>";
    }).join("");
    var tierOpts = data.tiers.map(function (t, i) {
      return '<option value="' + i + '">' + t.name + "</option>";
    }).join("");

    host.innerHTML =
      select("hw-model", "Model", modelOpts) +
      select("hw-quant", "Quantization", quantOpts) +
      select("hw-tier", "Your hardware", tierOpts) +
      '<div class="hw-result" id="hw-result"></div>';

    function compute() {
      var m = data.models[document.getElementById("hw-model").value];
      var q = QUANTS[document.getElementById("hw-quant").value];
      var t = data.tiers[document.getElementById("hw-tier").value];
      var weights = m.total_b * q.bpp;
      var need = weights + OVERHEAD_GB;
      var lines = [];
      lines.push(
        "<p><strong>Memory needed:</strong> " + m.total_b + "B × " +
        q.bpp + " bytes ≈ " + weights.toFixed(1) + " GB of weights + ~" +
        OVERHEAD_GB + " GB working memory = <strong>" + need.toFixed(1) +
        " GB</strong> (long contexts need more).</p>");
      if (need <= t.memory_gb) {
        var ceiling = t.bandwidth_gbs / (m.active_b * q.bpp);
        var real = ceiling * REALWORLD;
        lines.push(
          "<p><strong>Fits</strong> in " + t.memory_gb +
          " GB. Speed estimate: " + t.bandwidth_gbs + " GB/s ÷ (" +
          m.active_b + "B active × " + q.bpp +
          " bytes) ≈ " + Math.round(ceiling) +
          " tokens/second ceiling, so expect roughly <strong>" +
          Math.round(real) + " tokens/second</strong>: " +
          band(real) + ".</p>");
        if (m.arch === "moe") {
          lines.push(
            "<p class=\"hw-note\">Mixture-of-experts: all " + m.total_b +
            "B parameters must fit in memory, but only " + m.active_b +
            "B work on each token, which is why it runs like a small " +
            "model.</p>");
        }
      } else {
        lines.push(
          "<p><strong>Does not fit:</strong> needs " + need.toFixed(1) +
          " GB but this hardware has " + t.memory_gb +
          " GB. Spilling the difference into slower memory drags every " +
          "token down to the slowest link, and speed collapses toward a " +
          "crawl. Choose a smaller model or a stronger quantization.</p>");
      }
      document.getElementById("hw-result").innerHTML = lines.join("");
    }

    ["hw-model", "hw-quant", "hw-tier"].forEach(function (id) {
      document.getElementById(id).addEventListener("change", compute);
    });
    compute();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initDemo();
      initEstimator();
    });
  } else {
    initDemo();
    initEstimator();
  }
})();
