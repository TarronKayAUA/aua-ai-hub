/* News topic chips: clicking a chip filters the news cards that follow
   it by their data-topic attribute; All restores the full list. Chips
   are rendered by the pipeline only when a section has at least two
   real topics. Without JavaScript the chips are inert and the full
   list shows, so this is progressive enhancement only. */
(function () {
  "use strict";

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".topic-chip");
    if (!btn) {
      return;
    }
    var row = btn.closest(".topic-chips");
    if (!row) {
      return;
    }
    var list = row.nextElementSibling;
    while (list && !(list.classList && list.classList.contains("news-list"))) {
      list = list.nextElementSibling;
    }
    if (!list) {
      return;
    }
    row.querySelectorAll(".topic-chip").forEach(function (chip) {
      chip.classList.remove("is-active");
    });
    btn.classList.add("is-active");
    var topic = btn.getAttribute("data-topic");
    list.querySelectorAll(".news-card").forEach(function (card) {
      // Untagged cards count under Other in the chip totals, so they
      // must match the Other filter too.
      var cardTopic = card.getAttribute("data-topic") || "other";
      var show = !topic || cardTopic === topic;
      card.style.display = show ? "" : "none";
    });
  });
})();
