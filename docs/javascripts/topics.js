/* News topic chips: clicking a chip filters the news cards that follow
   it by their data-topic attribute; All restores the full list. Chips
   are rendered by the pipeline only when a section has at least two
   real topics. Without JavaScript the chips are inert and the full
   list shows, so this is progressive enhancement only.

   On This Week a section's items come in two tiers (2026-09-23): the
   newest show directly and the rest sit in a collapsed "Show the other
   N" block. A chip filters every list up to the next heading, both tiers,
   and opens the collapsed tier when it holds a match, so choosing a topic
   never leaves a matching item hidden. */
(function () {
  "use strict";

  function sectionLists(row) {
    var lists = [];
    var el = row.nextElementSibling;
    while (el && !/^(H1|H2|HR)$/.test(el.tagName)) {
      if (el.classList && el.classList.contains("news-list")) {
        lists.push({ list: el, holder: null });
      } else if (el.querySelectorAll) {
        el.querySelectorAll(".news-list").forEach(function (list) {
          lists.push({ list: list, holder: list.closest("details") });
        });
      }
      el = el.nextElementSibling;
    }
    return lists;
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".topic-chip");
    if (!btn) {
      return;
    }
    var row = btn.closest(".topic-chips");
    if (!row) {
      return;
    }
    var lists = sectionLists(row);
    if (!lists.length) {
      return;
    }
    row.querySelectorAll(".topic-chip").forEach(function (chip) {
      chip.classList.remove("is-active");
    });
    btn.classList.add("is-active");
    var topic = btn.getAttribute("data-topic");
    lists.forEach(function (entry) {
      var matched = 0;
      entry.list.querySelectorAll(".news-card").forEach(function (card) {
        // Untagged cards count under Other in the chip totals, so they
        // must match the Other filter too.
        var cardTopic = card.getAttribute("data-topic") || "other";
        var show = !topic || cardTopic === topic;
        card.style.display = show ? "" : "none";
        if (show) {
          matched += 1;
        }
      });
      if (topic && entry.holder && matched) {
        entry.holder.open = true;
      }
    });
  });
})();
