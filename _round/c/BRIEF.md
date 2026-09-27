# Week round (2026-09-27): brief for designer C

Branch `week-round`, cut from origin/main 79ce3c9 (live; the space round shipped as 4ca9a36).
Your round tools from the space round (`measure.py`, `gaps.py`, `nav_check.py`, `overflow.py`,
`sitebrowser.py` and the rest) are on origin/space-round under `_round/`: bring them over with
`git checkout origin/space-round -- _round/measure.py _round/c/<file>` as needed. Every rule from
the earlier rounds still applies (SPEC section 12; CLAUDE.md's Published content style rules).

## The owner's words (2026-09-27, with screenshots at about 1920px)

> Just the this week section for now, I'd prefer not to lose the features that are there (i.e:
> the spoken briefs) (on the subject of the briefs, why is there is there a collapsible element
> embedded within it? It seems that the outer part is just the start of the brief and should
> either be contained within the collapsed segment or both should sit together on the outside
> since the collapsed part is just a continuation, or perhaps just have the text say "read the
> rest of this week's brief", we can have the listening part outside the collapsed segment and
> give the option for further reading alone in it), I also don't want to lose those topic filters,
> but I would like to make it a 3 column design, the bottom can still end with a "show the other x
> items", this would also allow us to widen the page and more videos could be shown in two rows.
> You could borrow the same look as the "latest news" section for consistency. For news archive,
> 3 columns in the same style could also work, the podcast thumbnail is oversized for some reason.
> and the lower part of the page is clustered on the left, it could be spread across both sides as
> it is on other pages.

What his screenshots showed:

- **News & Events, Latest News** (the look to borrow): three outlined panels side by side,
  Medical Education, Clinical Practice, General AI, each with the news hue's left border, its
  feed name as the panel heading, items as title link plus "source · date" separated by thin
  rules, and "All <Feed> News ›" at the foot of the panel.
- **This Week today** (docs/news/this-week.md): a narrow centred column (about 1,050px of a
  1,700px window), with jump chips at the top (Medical Education 43 ↓, Clinical Practice 45 ↓,
  General AI 42 ↓, Videos 13 ↓, Podcasts 2 ↓), then each feed stacked one under another: heading,
  the brief panel, the Topic filter chips (All 43, Teaching and curriculum 18, and so on), one
  card per row (source in capitals, date, title, summary), then "Show the other N items". The page
  is about 10,500px tall at 1920.
- **The brief** shows its opening paragraph, then a disclosure "Read this week's brief, or
  listen" which, when opened, holds the rest of the brief plus Listen, Speed 1×, the
  "Read aloud ... by an AI-generated voice" note and "The picture as of <date>" line. Opened, it
  reads as a box inside a box.
- **A weekly archive page** (docs/news/archive/2026-wNN.md): panels two by two (Conference
  calendar updates beside Medical Education, then Clinical Practice beside General AI), the
  conference panel mostly empty below its one item.
- **Podcasts** on that page: the podcast's cover image rendered the full width of the frame,
  far too large.
- **The foot** of those pages: More in This Section as two columns of cards packed into the left
  half, "Report a problem with this page" off to the right, where other pages spread the cards
  across the frame.

## What to build

### This Week (docs/news/this-week.md)

1. **Three columns**, one per feed (Medical Education, Clinical Practice, General AI), in the
   Latest News panel look (same outline, hue, heading and item rules), using the full frame like
   the rest of the site. Keep each item's summary: this page is where the summaries live.
2. **Each column keeps its features**: its brief with the spoken version, its Topic filter chips,
   and its "Show the other N items" at the column's foot. The filters must still work inside a
   column, including on the items behind "Show the other N items" (check what topics.js does
   today and keep that behaviour). The jump chips at the top still take a reader to each feed.
3. **The brief, restructured** as he proposes: the opening paragraph and the Listen control
   (Listen, Speed, the AI-voice note, the "picture as of" line) visible together; the disclosure
   holds only the continuation text and is labelled "Read the rest of this week's brief". Opened,
   the continuation reads as the same text carrying on, not a box inside a box. The player must
   not start fetching audio until Listen is pressed (keep or set `preload="none"`). A brief with
   no continuation shows no disclosure.
4. **Videos in two rows** across the wider frame (as many per row as fit well), the rest behind
   its "Show the other N videos". **Podcasts** at a sensible thumbnail size.
5. **The foot spread across the frame** as on other pages (More in This Section cards and the
   report link).
6. **Phones**: one column, in feed order, nothing lost; no sideways scroll from 360 to 1920.

### Weekly archive pages (docs/news/archive/2026-wNN.md, 17 today)

Same three-column look for their feed sections, with the other sections (conference calendar
updates, videos, podcasts, whatever each week carries) placed so no panel sits mostly empty.
Podcast thumbnails and the foot fixed as above. The archive index (docs/news/archive/index.md,
already three columns of weeks) stays as it is unless it needs the same foot fix.

## How: these pages are GENERATED

docs/news/** is written by scripts/aggregate.py (the brief, the player and "Show the other N"
come from it, around lines 2600 to 2640) and must never be hand-edited. So:

- Do the layout, and if possible the brief restructure, at RENDER time (a build hook, CSS, JS),
  so the preview shows it on the pages as they are and every archived week gets it too.
- If a change in aggregate.py is truly needed, keep it small, explain why in STATUS, and make
  sure pages already written still render correctly. Never run aggregate.py in write mode;
  `--dry-run` only.
- The news narration (Kokoro, built in CI) reads the brief's text. Its spoken text must not
  change: show that the narration's text extraction for this-week and one archive page is
  identical before and after. No narration runs.

## Checks before READY

`mkdocs build --strict` clean; title_case 0 violations; layout_width block integrity; no sideways
scroll 360 to 1920; the Topic filters, the jump chips, every "Show the other N" and the Listen
player work at 1920 and 390, with keyboard, and the page still reads fully with JavaScript off;
anchors unchanged (list any removed); before/after page height and blank share for this-week and
two archive weeks at 1920 and 1440. New wording: list every new label, quoted exactly (so far the
only one expected is "Read the rest of this week's brief").

Keep round files under `_round/`; no screenshots committed. Resume point `_round/c/STATUS.md`,
pushed as you go: first line `Week round: READY` when done, otherwise
`Week round: IN PROGRESS, <step>`.
