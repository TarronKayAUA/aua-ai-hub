Week round: READY (part 2)

# Week Round Status (resume point)

Branch `week-round`. Part 2 follows `_round/c/BRIEF-2.md` (the owner's review of the preview, five fixes). BRIEF.md's rules and checks still apply, and every check from both briefs passes on the final build. Part 1's record follows below this section, unchanged except where part 2 supersedes it (marked).

## Part 2: the five fixes

Everything is still done at render time and in the site's own scripts and styles:

- **No generated file was touched.** `git diff 79ce3c9 -- docs/news` is empty.
- **aggregate.py is unchanged.**
- **No narration was run.**

Files changed:

- `docs/javascripts/topics.js`
- `docs/javascripts/layout-news.js`
- `docs/stylesheets/layout-news.css`
- `scripts/layout_week.py`

### 1. Topic filter: the matches read as one list

While a topic other than All is chosen, the "Show the other N items" tier opens and merges into the list:

- its header and box are hidden;
- there is no gap;
- a separator rule sits between every two matches, and none above the first.

"Showing X of Y" stays. Choosing All restores the first tier plus a closed "Show the other N items" with its header, exactly as on load.

Without JavaScript nothing filters, and the fold stays as it is. This applies everywhere topics.js runs: the three This Week columns and the three feed pages.

### 2. The brief can be folded again

The continuation now ends in a **"Hide the rest of this week's brief"** button. It closes the fold, shows "Read the rest of this week's brief" again, and returns focus to that label.

Opening still hides the label, so the text carries straight on from the lede. Because the label held keyboard focus, focus now moves to the start of the continuation when it opens; Tab walks its source links to the Hide button.

The button is rendered by the hook, hidden, and revealed by layout-news.js. Without JavaScript there is no dead button, and the opened fold keeps its label, which closes it.

The player and the date line stay outside the fold. This applies to This Week (3 folds) and the three feed pages. The archive weeks have no fold (their week in brief is always open).

### 3. The jump chips for the three feeds

A feed chip now:

- brings its panel into view, with the whole panel and its outline below the sticky chips row (22 to 26px clear at 1024 to 1920);
- moves focus to that panel's heading;
- outlines that panel for a moment. The outline fades out; under reduced motion it is still and then goes.

While the panels share a row, the chip used is the one marked current. Scrolling alone never marks another feed chip, and the pick is forgotten once the reader scrolls on to Videos or Podcasts. Where the panels stack (phones), the chips mark nothing as current, as before.

Videos and Podcasts are unchanged.

### 4. The feed pages in the same design language, for the owner's yes or no

Medical Education, Clinical Practice and General AI now put their brief, Topic chips and items in one news-hue panel on the full frame. Their text is unchanged.

- **The brief:** its text at a reading measure on the left, opened or closed, with the player and the "picture as of" line beside it on the right.
- **The chips.**
- **The items:** a grid in rows in the Latest News item style, three across from 76em, two from 60em, one on phones.

The pages have no "Show the other N" today. If one appears, it stays at the end of the panel.

**If the owner says no, the change is easy to back out:** remove the `_feed_page` step in `on_page_content` of layout_week.py and the "feed pages" CSS block. The brief fold from item 2 stays either way.

### 5. Lists in more than one column align in rows

A digest's wide feed and the feed pages are now grids, not CSS columns:

- items line up across each row and read left to right, then down;
- every item has the same rule under it and none above;
- the list clips its last row's rule, so no column starts or ends with a stray line;
- a row's items stretch to the row's height, so the rules of one row sit level.

Checked on w24 to w39 (the 13 weeks with a wide feed) and on the three feed pages at 1920 and 1440: row tops and rules are within 0.00px everywhere.

### New wording (part 2, quoted exactly)

- "Hide the rest of this week's brief" (the button at the end of the brief's continuation).

There is no other new label. The feed pages add no text.

### Part 2 checks on the final build

| Check | Result |
|---|---|
| `mkdocs build --strict` | clean |
| title_case | 2702 checked, 0 violations |
| layout_width block integrity | 1620 / 1620, 0 left as they were |
| Sideways scroll, 111 pages x 7 widths (360 to 1920) | 0 of 777 loads |
| `_round/c/week_check.py` (part 1's checks, updated for the Hide button) | ok, 92 checks |
| `_round/c/week2_check.py` (part 2) | ok, 65 checks. Details below the table. |
| `_round/c/nav_check.py` | ok; with JS off, 111 of 111 pages reachable |
| `_round/c/linkcheck.py` | 19628 internal links, 0 unresolved |
| Anchors (every `id` on 111 pages, base 79ce3c9 against final) | 0 removed, 0 added |
| Narration (`_round/c/narration_proof.py 79ce3c9`) | identical for all 7. Hashes below the table. |

What week2_check covers:

- **Item 1:** every chip in every panel, on This Week and the three feed pages, at 1920 and 390, by keyboard. Each chip shows exactly its count as one list, with no fold header visible, no leading rule, and "Showing X of Y". All then restores a closed fold, as on load. This includes the topics found only in the second tier, such as Simulation and skills.
- **Item 2:** each of the 4 folds opens by Enter, and focus moves to the continuation. The last element is the Hide button, and Tab reaches it inside the fold. Enter closes the fold and focus returns to the label. With JS off, the opened fold keeps its label and has no dead button.
- **Item 3:** each feed chip at 1920, 1440 and 390 focuses its own heading, outlines its own panel and lands in view. At 1920 and 1440 it marks itself current and stays current after a small scroll. At 390 it marks none, as before.
- **Items 4 and 5:** 16 lists at each of 1920 and 1440. Row tops and rules are within 0.00px, reading order is left to right, and there are no top rules.

Narration hashes:

- digest-2026-w39: 59c5d3b201c2dfaf
- the three feed-page briefs and the three This Week briefs: a3888995a02bdc8b, 0b02acfdc3d62515, d623cc365623e50f (each identical on both pages)

### Before and after (`_round/measure.py`; base 79ce3c9, after part 2)

| Page | Height 1920 | Blank 1920 | Height 1440 | Blank 1440 |
|---|---|---|---|---|
| news/this-week | 10313 → 5643 | 39% → 24% | 9390 → 5300 | 41% → 27% |
| news/archive/2026-w39 | 12722 → 7966 | 20% → 21% | 11463 → 7488 | 21% → 18% |
| news/archive/2026-w38 | 11073 → 7657 | 22% → 20% | 10022 → 7175 | 20% → 17% |
| news/medical-education | 4641 → 2618 | 39% → 34% | 4226 → 2407 | 42% → 30% |
| news/clinical-practice | 4512 → 2521 | 39% → 31% | 4108 → 2344 | 40% → 35% |
| news/general-ai | 4311 → 2485 | 41% → 39% | 3926 → 2306 | 41% → 33% |

---

# Part 1 record


Branch `week-round` (from origin/main 79ce3c9). Brief: `_round/c/BRIEF.md`. Every check the brief asks for passes on the final build (below).

## What was built, and how

Everything happens at render time, in a new MkDocs hook, `scripts/layout_week.py`. It is registered in mkdocs.yml after layout_news and before layout_learn, layout_nav, layout_width and title_case.

- **No generated file was touched.** `git diff 79ce3c9 -- docs/news` is empty.
- **aggregate.py is unchanged** and was never run in write mode.
- Because the hook works on the rendered HTML, every archived week gets the new look, and so will future weeks.

The only other code changes are:

- `docs/stylesheets/layout-news.css`: a week-round block at the end.
- `scripts/layout_frame.py`: the weekly digests are now "shelf" pages (full frame) instead of "reference" pages.
- `mkdocs.yml`: the hook is registered.

### This Week (news/this-week.md)

1. **Three columns, one per feed**, in the Latest News panel look of News & Events.
   - Each panel has an outline, the news hue on its left edge, and the feed name as its heading.
   - Each item shows its title, then "source · date", then the summary. Thin rules separate items.
   - Each panel keeps its own brief with Listen, its Topic chips, its list and its "Show the other N items".
   - The panel is the section that docs/javascripts/topics.js already filters to. Choosing a chip whose topic appears only in the collapsed tier still opens that tier and shows exactly the chip's count.
   - The jump chips still work.
2. **The brief is restructured.** In order:
   - The lede.
   - Directly under it, a plain disclosure labelled "Read the rest of this week's brief". It holds only the continuation paragraphs.
   - Then, outside the disclosure: the player (Listen, Speed, the AI-voice note) and the "The picture as of" line.

   There is no box inside a box, and the audio is `preload="none"`. A brief with no continuation gets no disclosure (the hook handles that case; none occurs in today's data).
3. **Videos: ten show, in two rows of five.** The rest stay behind "Show the other N videos", with N recounted (today "Show the other 3 videos"). The hook asserts that the old N matched the number of hidden cards before rewriting it.
4. **Podcasts** now show at card size (11 to 14rem) rather than the full width of the frame.
5. **The foot is spread across the frame.** More in This Section runs as cards across the width, with the report link under it. The foot is kept outside the last section, not inside it.
6. **Phones**: one column in feed order, nothing lost, no sideways scroll from 360 to 1920.

### Weekly archive pages (16 weeks, news/archive/2026-w24 to w39)

- **The week in brief** runs in two balanced columns across the frame, with Listen spanning both.
- **Conference calendar and opportunity updates** sit in slim panels in one row.
- **The feed sections are in the same three-column panel look.** When one feed has at least 4 items and at least twice as many as any other feed, it spans two tracks and sets its list in two columns. Otherwise its neighbours would sit over a tall empty space; for example, w38 has 1 and 7 items.
  - Order is unchanged.
  - Phones return it to one column.
  - This applies to 13 of the 16 weeks. The build log lists each week's shape.
- **Videos and podcasts share one row** when a week has both, with each card taking one share (at most 18rem). Before, each took a mostly empty full-width row.
- **"Also this week"** runs in three balanced columns.
  - A topic group may continue into the next column.
  - An item never splits.
  - A group's name stays with its first item.
- **The foot** is fixed as on This Week.
- **The archive index** (news/archive/) is unchanged. Its foot was already spread across the frame.

### Also, for consistency

The three feed pages (Medical Education, Clinical Practice, General AI) show the same brief, so it is restructured the same way there. Their layout is otherwise unchanged.

## Design decisions the owner may want to know

- **Opening the brief's disclosure hides its label**, so the continuation reads straight on from the lede as one text. (Superseded in part 2: it can now be folded again with "Hide the rest of this week's brief", and focus moves into the continuation.)
- **Line length.** On shelves, the brief's columns and the item summaries run at about 90 to 110 characters per line at 1920. This Week was already about that before (median 106). Paragraphs outside the panels are held to 44rem.

## Integrity (built into the hook; the build fails on a mismatch)

- **The brief step only moves blocks.** The sorted set of paragraphs, player, date line and lede is identical before and after.
- **The arrangement only wraps.** The page's text, in order, is identical once the hook's wrappers and the horizontal rules it drops between sections are removed. The one exception is the recounted "Show the other N videos" on This Week.
- **The build prints what it did.** It restructured 6 briefs (6 with a continuation to fold), arranged 17 pages with their shapes, and moved 4 videos up. It fails if This Week was not arranged.

## Narration: spoken text unchanged

`_round/c/narration_proof.py 79ce3c9` runs `narrate.news_targets()` on this tree and on a worktree of the base commit. No narration was run.

```
  digest-2026-w39                               same  sha256 59c5d3b201c2dfaf  1943 chars
  news-clinical-practice-clinical-practice      same  sha256 0b02acfdc3d62515  1213 chars
  news-general-ai-general-ai                    same  sha256 d623cc365623e50f  1170 chars
  news-medical-education-medical-education      same  sha256 a3888995a02bdc8b  1417 chars
  news-this-week-clinical-practice              same  sha256 0b02acfdc3d62515  1213 chars
  news-this-week-general-ai                     same  sha256 d623cc365623e50f  1170 chars
  news-this-week-medical-education              same  sha256 a3888995a02bdc8b  1417 chars
narration_proof: identical
```

The narration reads the markdown, which this round does not touch, so the result could not have been otherwise. The proof shows it anyway.

## Checks on the final build

| Check | Result |
|---|---|
| `mkdocs build --strict` | clean, no warnings |
| title_case | 2702 checked, 0 violations |
| layout_width block integrity | blocks read/written 1620 / 1620, 0 left as they were |
| Sideways scroll (`_round/c/overflow.py`, 111 pages x 360, 390, 768, 1024, 1280, 1440, 1920) | 777 loads, 0 with sideways scroll |
| `_round/c/week_check.py`, This Week at 1920 and 390, by keyboard | ok. Details below the table. |
| `_round/c/week_check.py`, archive w39 at 1920 and 390 | ok. Three panels side by side at 1920 and stacked at 390; no audio before Listen; Listen by keyboard fetches the digest audio; with JS off, every card is present and the player is preload=none. |
| `_round/c/nav_check.py` (Navigate control, JS on and off) | ok; with JS off, 111 of 111 pages are reachable |
| `_round/c/linkcheck.py` | 19628 internal links in 112 pages, 0 unresolved |
| Anchors (every `id` on 111 pages, base build against final) | 0 removed, 0 added |

What week_check covers on This Week, at 1920 and 390, by keyboard:

- Each jump chip brings its heading into view.
- The panels sit side by side at 1920 and stack in feed order at 390.
- In each column, the chip whose topic is only behind "Show the other N items" shows exactly its count, opens the tier, leaves the other columns alone, and shows a status line. All restores every card.
- Every "Show the other N" opens with Enter.
- Each fold is labelled "Read the rest of this week's brief", holds only paragraphs, and opens with Enter. The player and the date line sit outside it.
- No audio is requested before Listen, and Listen by keyboard fetches the brief's audio.
- With JavaScript off:
  - all 130 cards are present;
  - the chips rows stay hidden;
  - all 3 ledes and 3 folds show;
  - all 3 players are preload=none.

## Before and after (`_round/measure.py`, height in px, blank share per screen)

| Page | Height 1920 | Blank 1920 | Height 1440 | Blank 1440 |
|---|---|---|---|---|
| news/this-week | 10313 → 5643 | 39% → 24% | 9390 → 5300 | 41% → 27% |
| news/archive/2026-w39 | 12722 → 7966 | 20% → 21% | 11463 → 7488 | 21% → 18% |
| news/archive/2026-w38 | 11073 → 7633 | 22% → 20% | 10022 → 7153 | 20% → 17% |

The archives were "reference" pages before (one narrow measure). They are now roughly a third shorter with about the same or less blank share.

The largest blank areas left on these pages are the ones every shelf page has:

- the space beside the short intro at the top;
- the space beside the comments note at the foot;
- on This Week, the space to the right of its two podcast cards.

## New wording (every new label, quoted exactly)

- "Read the rest of this week's brief" (the brief's disclosure; it replaces "Read this week's brief, or listen").
- No other new label. "Show the other N videos" on This Week keeps its wording; only N changes (today "Show the other 3 videos").

## Housekeeping

- Round tools live under `_round/`. They were brought from origin/space-round, plus `_round/c/week_check.py` and `_round/c/narration_proof.py`.
- No screenshots are committed. Screenshots and measurements live in the session scratch directory.
- For local testing, placeholder MP3s were copied into docs/assets/audio so the players render:
  - the three This Week briefs;
  - the three feed pages;
  - digests w38 and w39.

  They are gitignored (`news-*`, `digest-*`) and were never committed.
