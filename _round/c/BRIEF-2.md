# Week round, part 2 (2026-09-27): the owner's review of the preview

Same branch (`week-round`), same rules and checks as `_round/c/BRIEF.md`. He liked the round ("Other
than that, it looks great!"). Five things, from his words and screenshots:

> Small bug, I'm not sure if this one is fixable but the show other items contains some of the
> articles. I'm guessing it is if some of the articles are not part of the main batch, they are
> contained in this dropdown and automatically expanded. Also, having a way to hide the expanded
> brief would be good, right you you can expand it but not collapse it again. The nav sections are
> also a little broken, all Med ed, clinical practice and general ai all link to the same location
> on the page and clicking any of them highlights general ai. Videos and podcast link is fine.
> thoughts on applying the same design language (red) do the individual pages, even if not, we
> should give a way to collapse the expanded news segment there too. On the w38 page the layout of
> the two column style there is a little messy due to misalignment. Other than that, it looks
> great!

## 1. A topic filter and "Show the other N items" (This Week, and anywhere topics.js runs)

What he saw: with "Simulation and skills 2" chosen ("Showing 2 of 43"), both matches sat INSIDE
an opened "Show the other 33 items" disclosure; with "Attitudes and adoption 9", three matches
showed, then the "Show the other 33 items" header, then the rest of the matches under it. The
label says 33 while it holds matches only, and the reader cannot tell why the list is split.

Fix: while a topic other than All is chosen, the matches from both tiers read as ONE list (the
disclosure's header is not shown and nothing of the fold is visible as a fold); choosing All
restores the first tier plus a closed "Show the other N items" exactly as on load. Keep "Showing X
of Y", keep the keyboard and no-JavaScript behaviour (without JavaScript nothing filters, so the
fold stays as it is).

## 2. The brief can be folded again (This Week, the three feed pages, and the archive if it has one)

Opening "Read the rest of this week's brief" should stay as it is (the continuation reads straight
on from the lede), but add a way back: a control at the END of the continuation labelled
"Hide the rest of this week's brief" that closes the fold, shows the "Read the rest" label again
and returns focus to it. Keep the player and the date line outside the fold. List the new wording.

## 3. The jump chips for the three feeds (This Week)

Cause: at widths where the three feed panels sit side by side their headings share one row, so
all three chips scroll to the same place and the scroll-highlight picks the last (General AI).
Fix: a feed chip brings its panel into view AND makes clear which panel it meant (move focus to
that panel's heading, and a brief, reduced-motion-safe highlight of that panel); the chip the
reader clicked is the one shown as current, and scrolling alone never marks a feed chip the
reader did not pick while the three panels share a row. Where the panels stack (phones), the
chips behave as before. Videos and Podcasts already work: leave them.

## 4. The three feed pages (docs/news/medical-education.md, clinical-practice.md, general-ai.md)

He asked for thoughts on giving them the same design language (the news-hue panel of Latest News
and This Week); recommended, so build it for his yes or no in the preview: the feed in one
news-hue panel on the full frame, its brief across the top (with the fold from item 2), Topic
chips, and the items as a grid of cards that fills the frame in ROWS (see item 5), ending with the
page's existing "Show the other N" if it has one. Same integrity rules (render time only, nothing
generated edited, the narration's text unchanged, prove it again).

## 5. Two-column lists must align (archive weeks, e.g. docs/news/archive/2026-w38.md)

What he saw on w38: the Clinical Practice panel spans two tracks and sets its list in two
columns, but the columns flow top to bottom, so items do not line up across, the right column
starts with a separator rule the left does not have, and the separators sit at different heights.
Fix: whenever a list runs in more than one column (here, the feed pages from item 4, and anywhere
else the hook does it), place items in rows: row-aligned, the same separator treatment in every
column, no leading rule in any column, order reading left to right then down. Check w24 to w39.

## Done means

Everything in BRIEF.md's checks again, plus: item 1 with every chip in every column at 1920 and
390 (including a topic found only in the second tier, and back to All); item 2 open, close, and
focus return by keyboard; item 3 each feed chip lands on and marks its own panel at 1920, 1440
and 390; item 5 a row-alignment check (the tops of items in the same row within 1px). STATUS first
line `Week round: READY (part 2)` when done.
