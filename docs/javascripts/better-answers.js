/* Token estimator for the Getting Better Answers page
   (docs/basics/better-answers.md). Counts words in the pasted text and
   converts at the site's stated heuristic of roughly three quarters of
   a word per token (tokens = words * 4/3). Everything runs in the
   browser; the text is never transmitted. The window sizes shown are
   representative reference points, not claims about any product. */
(function () {
  "use strict";

  var WINDOWS = [
    { label: "a smaller context window", tokens: 32000 },
    { label: "a larger context window", tokens: 200000 }
  ];

  function pct(tokens, windowTokens) {
    var p = (tokens / windowTokens) * 100;
    if (p < 0.1) return "under 0.1%";
    if (p >= 100) return "more than the whole";
    return (p < 10 ? p.toFixed(1) : Math.round(p)) + "%";
  }

  function init() {
    var input = document.getElementById("tok-input");
    var result = document.getElementById("tok-result");
    if (!input || !result) return;

    function update() {
      var text = input.value.trim();
      if (!text) {
        result.textContent = "Paste or type above to see the estimate.";
        return;
      }
      var words = text.split(/\s+/).length;
      var tokens = Math.round((words * 4) / 3);
      var html =
        "<p><strong>≈ " + tokens.toLocaleString("en-US") +
        " tokens</strong> (" + words.toLocaleString("en-US") +
        " words)</p>";
      WINDOWS.forEach(function (w) {
        var fill = Math.min(100, (tokens / w.tokens) * 100);
        html +=
          "<p>" + pct(tokens, w.tokens) + " of " + w.label + " (" +
          w.tokens.toLocaleString("en-US") + " tokens)</p>" +
          '<div class="tok-bar"><div class="tok-fill" style="width:' +
          fill.toFixed(2) + '%"></div></div>';
      });
      html +=
        '<p class="tok-note">Representative window sizes; the real ' +
        "window depends on the assistant and plan, and real " +
        "tokenizers vary by model.</p>";
      result.innerHTML = html;
    }

    input.addEventListener("input", update);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
