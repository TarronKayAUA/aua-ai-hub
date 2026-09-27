/* News topic chips: choosing a chip filters the news cards that follow
   it by their data-topic attribute; All restores the full list. Chips
   are rendered by the pipeline only when a section has at least two
   real topics.

   On This Week a section's items come in two tiers (2026-09-23): the
   newest show directly and the rest sit in a collapsed "Show the other
   N" block. A chip filters every list up to the next heading, both tiers,
   so choosing a topic never leaves a matching item hidden.

   Week round, part 2 (2026-09-27): while a topic is chosen, the matches of
   both tiers read as ONE list: the collapsed tier is opened and marked
   .is-merged, which hides its "Show the other N" header and its box
   (layout-news.css), because that label counts the whole tier while it
   would hold only matches. The first match shown is marked .is-lead so no
   list starts with a separator rule. Choosing All restores the first tier
   and a closed "Show the other N" exactly as on load.

   Layout redesign (L19, 2026-09-25): the row is a labelled group of
   toggle buttons (aria-pressed), one line that scrolls sideways on
   phones, and a status line under it says how many items show, which a
   screen reader announces. The pipeline ships the row hidden; this
   script reveals it, so without JavaScript there are no dead buttons and
   the full list shows. */
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

  function status(row) {
    var next = row.nextElementSibling;
    if (next && next.classList.contains("topic-status")) {
      return next;
    }
    var p = document.createElement("p");
    p.className = "topic-status";
    p.setAttribute("role", "status");
    row.insertAdjacentElement("afterend", p);
    return p;
  }

  function choose(row, btn) {
    var lists = sectionLists(row);
    if (!lists.length) {
      return;
    }
    row.querySelectorAll(".topic-chip").forEach(function (chip) {
      var on = chip === btn;
      chip.classList.toggle("is-active", on);
      chip.setAttribute("aria-pressed", on ? "true" : "false");
    });
    var topic = btn.getAttribute("data-topic");
    var shown = 0;
    var total = 0;
    lists.forEach(function (entry) {
      var matched = 0;
      entry.list.querySelectorAll(".news-card").forEach(function (card) {
        // Untagged cards count under Other in the chip totals, so they
        // must match the Other filter too.
        var cardTopic = card.getAttribute("data-topic") || "other";
        var show = !topic || cardTopic === topic;
        card.style.display = show ? "" : "none";
        total += 1;
        if (show) {
          matched += 1;
        }
      });
      shown += matched;
      if (entry.holder) {
        entry.holder.classList.toggle("is-merged", !!topic);
        entry.holder.open = !!topic;
      }
    });
    var lead = null;
    lists.forEach(function (entry) {
      entry.list.querySelectorAll(".news-card").forEach(function (card) {
        var first = !!topic && !lead && card.style.display !== "none";
        if (first) {
          lead = card;
        }
        card.classList.toggle("is-lead", first);
      });
    });
    status(row).textContent = topic
      ? "Showing " + shown + " of " + total
      : "Showing all " + total;
  }

  document.querySelectorAll(".topic-chips").forEach(function (row) {
    row.hidden = false;
    status(row);
  });

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest(".topic-chip");
    if (!btn) {
      return;
    }
    var row = btn.closest(".topic-chips");
    if (row) {
      choose(row, btn);
    }
  });
})();
