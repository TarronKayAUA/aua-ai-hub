Space round: READY

# Space Round Status

Branch `space-round`, cut from origin/main 1f6b2f8. Brief: `_round/c/BRIEF.md`. The last site commit is 90e45d3; this file is committed after it.

Commits:

- 70d09ff: navigation
- a186904: write-ups, About head, short lone sections
- c24737a: subsections as tiles, plus the checkers
- c3b2917: small grids, long quoted boxes
- c28eecb: governance cards, Courses and Resources
- b131656: prompt notes
- 5031d25: stacked sections in two columns
- 63ad3f5: archive columns
- e3661d4: stacked leaves
- 658ebd9: level 2
- 90e45d3: level 3

## Environment

- **Real font.** Chromium trusts the agent proxy CA, so `_round/measure.py` measures with Inter from Google Fonts: `apt-get install libnss3-tools`, then `certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n ccr-agent-proxy -i /root/.ccr/agent-proxy-ca.crt`. Checked: the Google Fonts CSS request returns 200.
- **Round tools in `_round/c/`:**
  - `gaps.py`: every blank component of every page.
  - `nav_check.py`: the foot's Browse disclosure with and without JavaScript, plus reachability.
  - `overflow.py`: sideways scroll.
  - `linkcheck.py`: internal links.
  - `measure_table.py`: the before/after table.
  - `sitebrowser.py`: shared by the checks above.

## 1. Redundant Navigation (Built)

**The foot's Browse disclosure is retired visually, site-wide.** The markup is kept, so it remains the complete way round without JavaScript.

- **How it is hidden:**
  - docs/javascripts/layout-nav.js, as the very last statement of the control's setup, runs `if (map && bar.isConnected) body.classList.add("has-secmap")`. That is after the corner control is built, placed and set to fold. If anything earlier throws, or JavaScript is off, the class is never set.
  - docs/stylesheets/layout-nav.css then applies `display: none` to `body.has-secmap .md-typeset .secfoot__all`, and to `.secfoot__maps` when On this page is also hidden (it already was, under `has-secnav`).
  - `display: none` removes the disclosure from rendering, from the tab order and from the accessibility tree.
- **Proof** (`_round/c/nav_check.py`, final build; six sample pages: about, a write-up, a guide, a prompt page, a tool guide, This Week):
  - **With JavaScript:** the control is built, Browse is not rendered, and the foot's ARIA snapshot does not contain it. More in This Section is still shown.
  - **Without JavaScript:** Browse is shown and in the accessibility tree, Tab reaches its summary, and Enter opens the section map.

**No page lists the same destinations twice.** In scripts/layout_nav.py, `_body_listed` collects the whole pages the body already lists: a list item or table cell that starts with its link (after any row tag or route number), or a card's link. `_more` leaves those pages out of More in This Section and drops the list when nothing is left. Breadcrumbs and the corner control are not counted. The build prints each case: 18 cards on 6 pages.

| Page | Cards left out | Result |
|---|---|---|
| worked-examples/index | the 4 write-ups | list dropped |
| playbooks/index | 7 guides | 3 left |
| tools/agents | 4 agent guides | 1 left |
| tools/index | Gemini Notebook | 5 left |
| basics/how-llms-work | Common Misconceptions | 3 left |
| the June 9 announcement | Conferences | 2 left |

## 2. Project Write-Ups (Built)

**Index (docs/worked-examples/index.md):**

- The table is now whole-link cards, two to a row: the governance landing's `gov-cards` pattern, with a hover title and chevron.
- Each card keeps both descriptions word for word, under the table's own column names as small labels ("What it is", "What it demonstrates").
- The index is a reading page now (removed from `SHELF` in scripts/layout_frame.py), so it has panels and outlines, and its prose keeps the measure. Its longest line went from 205 characters to 88.
- The "How to read these" note moved up, beside the introduction, instead of sitting alone under the cards. This is a rearrangement; no words changed.
- The Color key sits directly above the cards (layout_width now keeps a key with the wide block it keys).

**Kind.** data/section_map.yaml gives the existing "Project Write-Ups" group `kind: guide`, the hue whose description already names worked examples. The file had a second, later entry for the group, which overrode the first; the two are now one entry. As a result, the cards, the write-ups' feet and the About feet wear the guide color, with Color key lines.

**Write-ups.** Their prose is untouched and their headings were already in title case. Each keeps More in This Section, and its Browse disclosure goes, per section 1. The index keeps its banner; no other section's pages carry banners, so the write-ups match.

**Anchors added** (the card titles are h2, as on the governance landing): `#when-a-check-stops-checking`, `#i-fixed-software-i-cannot-read`, `#my-favorite-game-was-not-a-game`, `#the-neanderthal-gene-that-explained-nothing`.

## 3. Remaining Empty Space

### How It Was Measured

**`_round/c/gaps.py`** covers every page (the sitemap minus the weekly digests: 95 pages) at 1920x1000 and 1440x900. It uses measure.py's definition of blank (at least 160px each way and 57,600 px², ink grown by 12px), with two differences:

- It works over the whole page, inside the content frame, repeatedly taking the largest empty rectangle, so each gap is reported once with its page, place, size and the heading above it.
- An outline alone does not fill a panel, so the empty half of an outlined panel counts as blank.

It also scrolls the page first and treats only fixed elements as chrome. A leaf's figure side is `position: sticky`, and an early version wrongly left those figures out.

**`_round/measure.py`** is the brief's tool. It counts a whole outlined panel, including an empty half, as used; see the note under the tables.

### Level 1: Rearranging (Built)

Rules in scripts/layout_width.py, which apply to every reading page:

1. **An h1 never occupies a cell alone.**
   - A section is lifted beside the head only when the head has a meta line.
   - The head split keeps at least the first group after a bare title with it.
   - On About, the title runs across the top and Contact pairs with Purpose.
2. **A short lone section pairs with a neighbour.** A section that is one paragraph (so it could fill only one column of a full row) pairs with the next section up to three times its weight (`LONE_RATIO`).
3. **h3 subsections can be tiles.** Before this round they never could, because the check forbade the subsection's own heading. So one-paragraph subsections each spanned the full width with text only in the left half (Module 6 had four). Only a nested h3 disqualifies now, and tiles went from 180 to 218. The module docstring's invariant now reads "a tile holds no heading but its own"; inversions are still 0.
4. **A grid of one or two cards is no longer "wide".** It sits beside its introducing paragraph and can pair; a full row of three or more cards fills the row, top-aligned. This fixed eight lone video cards on the agents page.
5. **A long quoted box stays one box across the frame.** This covers a note made only of prose, such as a model's unedited output on the worked examples. Its bold-led parts sit two to a row, read left, right, then down; otherwise its body runs in two-column pieces a screen at a time.
6. **A one-paragraph introduction shares its wide object's row,** in a panel, instead of taking a half-empty panel of its own.
7. **A stacked section uses two columns when that fits a screen** (docs/javascripts/layout-width.js). The "fits one screen" rule stacks a pair of sections, a lettered part, or text beside a figure when it is taller than the screen, which left the right half empty. The stacked section now tries two columns (`.w-cols`) and keeps them only when the result fits one screen, so no one scrolls back up to start a column.

Page fixes:

8. **Governance landing:** four cards read as two rows of two, not three and one.
9. **Courses and Resources** (learning/index.md) is a reading page. Its longest line went from 207 characters to reading measure, and its sections of one or two cards pair.
10. **Prompt pages:** on the 7 prompts with no fill-in panel and no worked example, the Notes move into the track beside the prompt text, which otherwise held one line. The words and the `#notes` anchor are unchanged; the heading is now an h3 under the prompt's heading, and so leaves the On this page chips.
11. **News Archive:** the list of weeks runs in three columns from 60em, read down each column, newest first. This is CSS only; the generated page is untouched.

The narrated pages' text is unchanged; items 3 and 7 change only their layout.

### Level 2: Something Functional (Built, for the Owner's Decision)

**The Directory Today** (commit 658ebd9)

- **Where:** Tool Directory (docs/tools/index.md), beside the paragraphs under the statuses table, at the right of the frame from 60em. Below 60em it follows them.
- **What:** how many tools the directory holds, how many carry each status (every status shown, zeros included), and the span of the entries' check dates.
- **Data source:** data/tools.yaml, counted at build time by `_render_directory_today` in scripts/render_data.py (marker `<!-- render:directory-today -->`). The build fails if the counts do not add up to the tools read, and it prints its verification line, today: 75 tools read; Listed 73, Licensed 2, Reviewed 0, Use with Caution 0, Restricted 0; sum 75; 75 check dates.
- **Exact new wording:**
  - Title: "The Directory Today"
  - Total: "75 tools" (the number comes from the data)
  - The five status labels are the existing ones.
  - Note: "Entries were last checked between June 9, 2026 and September 26, 2026." The dates come from the data. On one date it reads "Entries were last checked on <date>."; if some entries lacked a date it would add " (<n> of <total> carry a date)", which does not apply today.
  - The panel's accessible name is "The directory today".
- **Why it earns the space:** the statuses table says what each status means, and this shows where the directory actually stands against them, in a column the explanation's measure left empty.

### Level 3: Art (Built, for the Owner's Decision)

**Governance banner in the landing head** (commit 90e45d3)

- **Where:** Governance landing (docs/governance/index.md), beside the introduction, from 60em. Below that it is not shown.
- **What:** the section's own existing banner, `docs/assets/section-governance.svg`, which no page used. It is navy, abstract and geometric (a document with a check mark between column strokes), and has no words. It is new to the page but not a new drawing.
- **Decorative:** `alt=""`, `aria-hidden="true"`. The SVG carries its own colors, so it renders the same in both schemes.
- **Data source:** none (art).
- **Exact new wording:** none.
- **Why it earns the space:** the landing's head left the right half empty beside a three-line introduction, and nothing functional belongs there; the page's substance is the four cards directly below.

I did not propose other art. The remaining gaps are inside reading layouts, where art would decorate a page rather than serve it, or are small.

### Gaps Still Left, and Why

Final build, 1920 unless noted, largest first:

| Page | Where, size | Why it is left |
|---|---|---|
| examples/lecture-outline | "What to Check", right of a 10-item numbered list, 912x2272 | One list of long checks. Even in two columns it is taller than one screen, so the fits-one-screen rule keeps it in one column; filling the space would mean splitting the list, which changes its text. |
| tools/ (index) | the 11 category rows, 592x1888 between names and counts | Rows run name to count across the frame. Two columns of rows would move a category when it opens, and would interact with the chooser's filters and Open All. Left for the owner to decide. |
| examples/study-practice-questions and examples/memo-and-minutes | "What Went In", beside a long quoted input, 912x1104 and 912x736 | A short paragraph beside long slides or notes; there is nothing else to place beside them without rewording. |
| benchmarks/ | beside the LiveBench snapshot, 592x1392 | The table is pipeline-generated (includes/livebench.md), sets its own width, and is not hand-editable. |
| prompts/ (library) | after the last prompt row, 672x1168 | The end of the list; a list's last row cannot be pulled up. |
| tools/agents | "Where to Start", the last section, 912x848 | A lone final section with nothing after it to pair with. |
| accessibility | under Known Limitations, 944x816 | Its tile pairs with the taller What the Site Does. Report a Problem is a one-paragraph last section with nothing to pair with. |
| Several reading pages with text beside a figure (pathway/rules, tools/hardware, worked-examples/sharex-hdr, tools/research, tools/first-session, playbooks/score-reports) | 500 to 650k px² each | One side (text or figure) is much taller. Keeping a paragraph beside its figure is a house rule, so the shorter side keeps some space under it. |
| The two announcement posts | head, 672x928 and 912x608 | Short posts: the rows and the closing text split unevenly between the two columns. |
| students/, faculty/ | beside Start with the Basics, and Also on This Site, about 615k and 550k | Hub sections of unequal height. |

52 one-paragraph sections still sit alone across the full width; the build lists them. Almost all are small: a prompt's Notes where the side already has a fill-in panel, and each weekly digest's Comments line. None is over 1,300 characters.

Text changes on narrated pages that would help: none needed and none made.

## Constraints

- **`mkdocs build --strict`:** clean on the final build.
- **Title case:** 2702 checked, 2702 pass, 0 violations.
- **layout_width block integrity:** blocks read = written, 2335 / 2335. Every inserted wrapper is proved removable; the article is unchanged once they are removed.
- **Narration:** the nine narrated pages' markdown is unchanged. `git diff 1f6b2f8 HEAD` on docs/pathway/*, docs/basics/how-llms-work.md and docs/basics/misconceptions.md is empty. `narrate.py --check` ok. No narration was run.
- **Never edited:** docs/governance/policy.md and every generated file (docs/news/**, includes/*, docs/prompts/exchange.md, data/seen_items.json and the rest); `git diff` on those is empty.
- **No sideways scroll:** `_round/c/overflow.py` loaded 111 pages at 360, 390, 768, 1024, 1280, 1440 and 1920 (777 loads) with 0 sideways scroll.
- **Keyboard and no-JavaScript:** `_round/c/nav_check.py` follows every keyboard-reachable link from the home page. With JavaScript off, 111 of 111 sitemap pages are reached; with JavaScript on, 111 of 111 (including the corner control's panels). measure.py's focus column shows no fully hidden stops.
- **Anchors:** 0 removed, 4 added (the write-up card titles, listed above), comparing every page's ids in the start build with the final build.
- **Links:** 19,620 internal links, 0 unresolved (files and #fragments).
- **Screenshots:** none committed.

## Before and After

### measure.py

Blank share per screen and characters per line, by page kind, at 1920 and 1440. Before is the start build; after is the final build; 95 pages in each.

| Page type | Before: pages, blank 1920, blank 1440, cpl median, p90 max, max | After: pages, blank 1920, blank 1440, cpl median, p90 max, max |
|---|---|---|
| door | 7, 21%, 17%, 98, 114, 114 | 7, 19%, 15%, 97, 114, 114 |
| lesson | 7, 29%, 15%, 79, 85, 88 | 7, 33%, 23%, 79, 85, 88 |
| reference | 29, 17%, 18%, 79, 89, 92 | 31, 17%, 19%, 79, 89, 92 |
| shelf | 19, 31%, 33%, 197, 212, 212 | 17, 32%, 34%, 194, 212, 212 |
| task | 33, 16%, 17%, 79, 88, 89 | 33, 16%, 16%, 79, 88, 89 |
| all | 95, 20%, 21%, 79, 212, 212 | 95, 21%, 21%, 79, 212, 212 |

Largest per-page drops:

- learning/: 41% to 16% at 1920, 46% to 21% at 1440.
- governance/: 44% to 31%, and 39% to 26%.
- prompts/score-report-study-planner: 24% to 15%.
- news/archive: 49% to 44%, and 55% to 42%.
- examples/lecture-outline: 33% to 25%.

**Why the measure.py table understates the change:**

- measure.py treats an outlined panel as fully used, so the empty right half of a full-width panel never counted as blank. When those sections pair as tiles, the smaller space between and below panels is counted. That is why the lesson modules read slightly higher here, although their rows of one-column text are gone (Module 6 is the clearest case).
- On every inner page, the retired Browse disclosure box used to count as used space at the foot.
- Shelf pages keep long lines by design (tables, card grids, the tool chooser); the two shelves with long prose, the write-ups index and Courses and Resources, are reading pages now at 88 characters or less.

### gaps.py

Blank components across all 95 pages, counting the inside of outlines:

| Width | Before | After |
|---|---|---|
| 1920 | 157.4M px² in 644 components; 44 of 500k+ px²; 9 of 1M+; largest 4,871k | 132.0M px² in 627 components; 23 of 500k+; 3 of 1M+; largest 2,072k |
| 1440 | 102.8M px² in 492 components; 17 of 500k+; 2 of 1M+; largest 3,655k | 84.0M px² in 481 components; 5 of 500k+; 1 of 1M+; largest 1,486k |

That is 16% less blank area at 1920 and 18% less at 1440, and about half the large gaps at 1920 and seven in ten at 1440.
