# DESIGN.md: the AUA AI Hub design language

This is the design reference for the site. Every new page, section or data-driven list follows it, so the hub reads as one piece as it grows. It describes what the code does today and names the file, function or rule that enforces each point. Dated owner decisions, and the reasons behind them, are recorded in SPEC.md section 12 and CLAUDE.md ("Published content style"). This file links to them and does not repeat them.

Before a layout change ships, run `python scripts/design_check.py` (section 16) as well as `mkdocs build --strict`.

Contents:

1. Principles
2. The build pipeline of hooks
3. Page types
4. Layout rules (reading pages, news panels)
5. Breakpoints
6. Components
7. Color
8. Typography and case
9. Ordering
10. Motion and accessibility
11. Empty space policy
12. Checklists: a new page, a new section, a new data-driven list
13. Things not to do
14. Known gaps left on purpose
15. Current measures (the baseline)
16. The design check suite

---

## 1. Principles

- **The full frame, with no large blank areas.** Every page uses the width of the window. Reading pages lay their sections out on two tracks. Shelves (catalogues and news) fill the frame with grids and panels. When space is left over, the order of remedies is fixed (section 11).
- **Panels in thin outlines, kept on purpose.** Sections, spreads and panels sit in thin outlined boxes like the landing pages' cards. The owner chose the outlines over a calmer, borderless look because they close up large empty areas. Do not remove them for calm.
- **One reading measure.** Every piece of running text on a reading page is one measure wide: 31rem, about 79 characters (`--w-measure` in docs/stylesheets/layout-width.css). Wider frames get more columns, never longer lines.
- **Color by meaning.** Each hue means one kind of page everywhere (tool, prompt, guide, lesson, benchmark, news and events, governance). A color is never assigned by position or section. Wherever colors appear, a "Color key:" line names them, and color never carries meaning alone (section 7).
- **Restraint.** Accuracy over flash. Motion is brief and optional, art is decorative and quiet, and copy is plain and neutral (CLAUDE.md, "Published content style").
- **The policy is the only rulebook.** Site copy links to the AI Responsible Use Policy rather than restating it. Site copy adds no rules of its own, and alarm styling is kept for practical hazards (CLAUDE.md, the policy register bullets).
- **Nothing hardcoded that belongs in data.** Lists, counts, dates and labels come from `data/*.yaml`, `feeds.yaml` or the pipeline. Layout hooks read the page's own structure and never type content into a page (CLAUDE.md, working rule 1).
- **Everything happens at render time.** Layout hooks change the rendered HTML, never the markdown source. That is why generated pages, the policy page and narrated pages can all be restyled without touching their text. Search reads the rendered HTML as of `on_page_content`; narration reads the markdown.

---

## 2. The build pipeline of hooks

Hooks run in the order they are registered in `mkdocs.yml` under `hooks:`. For each event, MkDocs calls every hook's handler in that order:

| # | Hook | Main events | What it does |
|---|---|---|---|
| 1 | `scripts/render_data.py` | `on_page_markdown` | Replaces `<!-- render:... -->` markers with markdown rendered from YAML: tools, conferences, opportunities, prompts, committee, polls, glossary A to Z, the hardware estimator, "The Directory Today" (`_render_directory_today`). It also injects the Listen player (`_inject_narration`) where an MP3 exists. It prints verification counts and raises when a total does not cross-check. |
| 2 | `scripts/layout_frame.py` | `on_page_markdown`, `on_page_content`, `on_post_page` | Sets the **page type** (`page_type`, section 3) and writes it as `data-page-type` on `<body>`. Renders the front-matter `action:` button in the head (`_action_html`). Adds the page ending: review date and "Report a problem with this page" (`_page_end`). |
| 3 | `scripts/layout_home.py` | `on_page_markdown`, `on_post_page` | The home page and News & Events landing's timely column (`<!-- timely:... -->` markers): Latest News columns (`_feed_html`), events (`_events_html`), open calls (`_calls_html`), committee items, all computed against the build date. |
| 4 | `scripts/layout_guides.py` | `on_page_markdown`, `on_page_content`, `on_post_page` | The step-by-step guides: the answer-first panel (`_panel`) with the prompt from data/prompts.yaml and a Copy button, templates, and steps. It checks that every copy text matches data/prompts.yaml. |
| 5 | `scripts/layout_prompt_pages.py` | `on_files`, `on_page_content`, `on_post_page`, `on_post_build` | One virtual page per prompt at `prompts/<slug>/` (`on_files`), with the side panel "Fill In Your Details" (`_side`), "Where it is used" and related prompts. It checks every link and fragment it writes (`_check_links`), that Copy text matches the data, and that every prompt page is in sitemap.xml. |
| 6 | `scripts/layout_news.py` | `on_page_markdown`, `on_page_content` | Takes weekly digests out of search, stacks registered wide tables into labelled rows on phones (`stack_tables`), and checks This Week's jump links (`check_jump_links`). |
| 7 | `scripts/layout_week.py` | `on_page_content`, `on_post_build` | This Week, the weekly digests and the three feed pages: brief restructure (`_brief`), three feed panels and the rest of a digest (`_arrange`, `_arrange_body`, `_videos`, `_dominant`), and the feed-page panel (`_feed_page`). It checks itself (`_check_brief`, `_check_arrange`). Details are in section 4.2. |
| 8 | `scripts/layout_learn.py` | `on_nav`, `on_page_markdown`, `on_page_content`, `on_post_build` | The seven modules: the "Module N of 7" strip (checked against the title), Next buttons (`_next_block`), the competency foot line, and "Going Deeper" as rows (`_going_deeper_rows`). Also the Learn landing. |
| 9 | `scripts/layout_nav.py` | `on_nav`, `on_page_content`, `on_post_page`, `on_post_build` | The section model from the mkdocs.yml nav plus data/section_map.yaml. It builds the section map (`_site_map`, `_map`), the page foot (`_foot`, `_more`), the Tools & Prompts landing (`_landing`), color by kind (`kind_of`, `_color_page`, `_key`), prompt-link rewriting, and breadcrumbs (`_crumbs`). Every generated href is checked after the build. |
| 10 | `scripts/layout_width.py` | `on_post_page`, `on_post_build` | Reading pages on two tracks: shapes, pairing, spreads and leaves (`_plan`, `_wrap`, `_chunks`). It also lays out landing-page prose (`_wrap_door`). Details are in section 4.1. |
| 11 | `scripts/title_case.py` | `on_post_page`, `on_post_build` | Checks titles, headings, names and labels in the final HTML and fails the build on a violation (section 8). It runs last so it sees every page as served. |

**Where a change belongs.**

- Content from data belongs in render_data (or layout_home for timely items).
- A new page type, or a change to the page ending, belongs in layout_frame.
- Anything about sections, feet, kinds, colors or the map belongs in layout_nav.
- How a reading page uses the width belongs in layout_width.
- News pages belong in layout_news and layout_week.

Styles live in one file per package (section 6). Scripts under `docs/javascripts/` add behaviour only. Everything they enhance works as plain HTML without them.

**Integrity checks and what to do when one fails.**

- **layout_width, "blocks read/written: N / N".** Removing the wrappers the hook inserted must give back the article exactly as it was (`_remove_inserted_closers`), and no heading may sit above an earlier one. A page that cannot be split cleanly is left as it was and listed under "left as they were". If that list is not 0, or read differs from written, the page's structure confused the planner. Typical causes are unbalanced raw HTML, a heading inside a raw HTML block, or an admonition holding headings. Fix the page's markup; do not loosen the check.
- **layout_week.** `_check_brief` asserts that the brief's paragraphs, player, date line and lede are the same set before and after. `_check_arrange` asserts that the page's text is the same, in the same order, apart from the recounted "Show the other N videos". It raises if This Week was not arranged, or if a feed page was not put in a panel. If the pipeline changes the brief markup (`render_brief_html` in scripts/aggregate.py) or a digest's section names, update the regexes at the top of layout_week.py. Do not change the check.
- **layout_nav** checks every generated link (fragments included) after the build. It also fails when data/section_map.yaml names an icon that does not exist, or a `token` that is not in the palette.
- **render_data and the other hooks** print verification counts (CLAUDE.md, working rule 2). A mismatch raises. Read the printed block, fix the data, and rebuild.
- **title_case** lists each violation with its page and element. Fix the text, or, for a reviewed name its publisher spells that way, add it to `EXEMPT` in scripts/title_case.py.

---

## 3. Page types

Every page has one of five types, set by `page_type()` in scripts/layout_frame.py:

| Type | For | How a page gets it | What the frame does |
|---|---|---|---|
| `door` | Landing pages: home, For Students, For Faculty & Staff, Learn, News & Events, Governance, Tools & Prompts | listed in `DOOR` | No breadcrumb; cards and rows; prose below the cards is paired by `_wrap_door` in layout_width |
| `task` | Step-by-step guides | address starts with `playbooks/` | Reading page, with the guide's answer-first panel in the head (layout_guides) |
| `lesson` | The seven modules and the Learn pages | address starts with `pathway/` | Reading page, with the progress strip, Listen row and Next buttons (layout_learn) |
| `reference` | Everything else that is read: tool guides, quick references, the glossary, the policy, the committee, write-ups, Courses and Resources | the default | Reading page |
| `shelf` | Catalogues and news: the Tool Directory, the Prompt Library and Exchange, the guides index, benchmarks, conferences, opportunities, announcements, the news pages, the News Archive and the weekly digests | listed in `SHELF`, or `benchmarks/`, `news/*` and `news/archive/YYYY-wNN` | Full frame, with grids, panels and filter bands; no reading grid |

- A page can override its type with front matter `page_type: <type>`. Use `page_type`, never `template:` (MkDocs reserves `template:`, and the hook raises if it is used for a type).
- No page shows Material's left sidebar or right "On this page" column. layout_frame hides both everywhere, and navigation is the corner control plus the page foot (section 6.5). Below 76.25em, Material's drawer still opens from the menu button.
- Reading pages (`READING = ("task", "lesson", "reference")` in layout_width.py) get the two-track grid from 68.75em. Below that width they are a single column: every wrapper is `display: contents`.

---

## 4. Layout rules

### 4.1 Reading pages (scripts/layout_width.py, docs/stylesheets/layout-width.css, docs/javascripts/layout-width.js)

**The grid.**

- From 68.75em (1100px), a reading page shares the landing pages' frame and lays out its sections on two equal tracks.
- A panel's side padding is `(track - measure) / 2`, clamped between 1.2rem and 3.4rem (`--w-pad`). So text is one measure wide whatever the frame width.
- The page head keeps the title and meta line on the left. What follows the head goes in the right track: a guide's prompt panel, the policy's reader's map, a tool guide's at-a-glance table, or a short first section (`LIFT_MAX`).

**The shapes.** Each h2 section, and each h3 subsection inside a section that has h3s, becomes one shape, recorded as `data-w-shape` on its cell:

| Shape | When | What it looks like |
|---|---|---|
| `tile` | A section at most `TILE_MAX` (2200) weight units | Half the width. Two consecutive tiles of similar weight share a row. |
| `spread` | Longer prose | Both tracks, in two columns, cut at block boundaries into pieces of about `CHUNK` (2400) units, so both columns of a piece fit one screen at 1440. Every paragraph stays whole in one column. |
| `leaf` | Prose followed or preceded by a figure, note or table | The prose beside the object, in source order. The paragraph just before a figure always sits beside it. |
| `set` | Objects side by side: a module's self-checks, notes, figures | Cards in a row, with the last row completed by count in CSS. |
| `steps` | A task or lesson's numbered steps that are short and alike | A band of step cards. Long or uneven steps stay one numbered list, in two balanced columns. |
| `wide` | A table of four or more columns, a card grid of three or more, long code | The whole frame. |
| `band` | The heading and short intro of a section whose h3s follow as their own tiles | Across the top of those tiles. |

**Rules the planner (`_plan`) keeps:**

1. **A heading is always first in its cell and stays with what it introduces.** The same goes for a bold lettered line (the policy's "C. Safeguarding ...") and a sentence ending in a colon. A passage with several lettered parts splits at those headings.
2. **Reading order is source order.** Cells fill row by row, and no h2 or h3 sits above an earlier one. The invariant is checked on every page.
3. **An h1 never occupies a cell alone.** A section is lifted beside the head only when the head has a meta line, and the head split keeps at least the first group after a bare title with it.
4. **A short lone section pairs.** A one-paragraph section pairs with the next section up to `LONE_RATIO` (3.0) times its weight.
5. **A small card grid sits beside its text.** A grid of one or two cards is not "wide". It sits beside its introducing paragraph and can pair. Three or more cards fill the row, top-aligned.
6. **A one-paragraph introduction shares its wide object's row,** in a panel.
7. **A long note stays one box.** A note of at least `NOTE_FLOW_MIN` weight runs in two columns inside its box. Bold-led parts sit two to a row.
8. **Everything read "down the left, then the right" must fit one screen.** This covers a spread piece, lettered parts, text beside a figure, and a pair of sections. docs/javascripts/layout-width.js measures each one as laid out. When it is taller than the space below the header, it becomes one sequential column (`.w-single`, `.w-stack`). A stacked section then tries two columns (`.w-cols`) and keeps them only if they fit. Without JavaScript, a height media query does the same for short windows.
9. **The Color key stays with the block it keys,** even when that block is wide.

The build prints the shapes in use ("cells by shape"), how many short sections were paired, and every one-paragraph section still alone across the width. That list is advisory; each entry has a reason.

### 4.2 News pages (scripts/layout_week.py, docs/stylesheets/layout-news.css)

- **This Week** (`news/this-week.md`):
  - one panel per feed (`section.wk-feed.ne-card.kind-block`, the news kind), three across from 60em in a `div.wk-feeds.kind-group`, stacking below that;
  - each panel holds its heading, brief, Topic chips, list and "Show the other N items";
  - Videos: ten show, in two rows of five (`VISIBLE_VIDEOS`), and the rest stay behind "Show the other N videos", recounted;
  - Podcasts: cards 11 to 14rem wide.
- **Weekly digests** (`news/archive/YYYY-wNN.md`):
  - the week in brief in two columns (`wk-brief`), with Listen spanning both;
  - updates as a row of slim panels (`wk-updates`);
  - the feeds in the same panels. A feed with at least 4 items and at least twice as many as any other (`_dominant`) spans two tracks, with its list in two columns;
  - videos and podcasts share one row (`wk-mediarow`), each card one share, at most 18rem;
  - "Also this week" in three balanced CSS columns. A topic group may continue into the next column, an item never splits, and a group's label stays with its first item.
- **The three feed pages** (Medical Education, Clinical Practice, General AI):
  - one news-hue panel on the full frame (`wk-feed--page`, `_feed_page`);
  - the brief's text at a 46rem measure on the left, with Listen and the date line beside it;
  - then the chips, then the items as a grid: three across from 76em, two from 60em, one below.
- **Lists in more than one column are grids, never CSS columns.**
  - Items line up across each row and read left to right, then down.
  - Every item has the same rule under it and none above, and `clip-path: inset(0 0 1px 0)` on the list hides the last row's rule.
  - A row's items stretch to its height, so a row's rules sit level.
  - "Also this week" is the one place CSS columns remain. Its entries are single links in groups, and there is no row to align.
- **The page foot** is outside the arranged sections (`_TAIL` in layout_week.py), so it spans the frame.

---

## 5. Breakpoints

Material's base size is 20px up to 100em. It is 22px from 100em (1600px) and 24px from 125em, so rem-based sizes grow on very wide screens.

| Breakpoint | What changes | Where |
|---|---|---|
| `max-width: 30em` | Small phones: compact widgets | extra.css |
| `max-width: 37.4375em` | The corner control shows "Browse section" instead of the section name | layout-nav.css, layout-nav.js |
| `max-width: 44.9375em` / `min-width: 45em` | Phone versus tablet. Registered wide tables stack into "Label: value" rows; section-chip arrows go; two-up card grids | layout-news.css, layout.css, layout-hubs.css, layout-home.css, layout-nav.css |
| `max-width: 59.9375em` / `min-width: 60em` | Multi-column layouts start: This Week's three feed panels, digest rows, hub and landing grids, the sticky jump-chip row, the News Archive's three columns | layout-news.css and most layout-*.css |
| `max-width: 68.7344em` / `min-width: 68.75em` | The reading grid (two tracks) starts; below it reading pages are one column | layout-width.css, layout-width.js |
| `min-width: 76em` | Feed pages show three items across | layout-news.css |
| `max-width: 76.2344em` | Material's drawer threshold; the page uses the drawer for navigation | layout.css |

When a new rule needs a breakpoint, use one of these rather than a new value.

---

## 6. Components

Each component lists its markup (who writes it), its CSS home and its JavaScript behaviour. Everything interactive works as plain HTML without JavaScript.

### 6.1 Whole-card links and the hover

- **Markup.** A card with one destination has one link. Its title link has class `card-link`, and a `::after` stretches it over the whole card (layout.css, "Cards and link rows"). A card with several destinations does not lift.
- **Hover.** The card lifts 2px with the `--md-shadow-z2` shadow, and the title link underlines while the pointer or focus is on the card. The rules are in extra.css (`.grid.cards > ul > li:hover` and "The same lift for the other whole-card links") and layout.css. Focus shows a 2px `--hub-focus` outline on the card.
- **Reduced motion:** no lift, no transition. The underline stays (extra.css, "Reduced motion").
- **Where it is used:** hub cards, governance cards (layout-hubs.css `gov-cards`), prompt rows (`.pl-row`), news cards, timely items, tool and video cards.

### 6.2 Kind rows and card grids

- Any list or card that points at a page wears that page's kind. layout_nav `_color_page` adds `kind-mark` and `data-kind`, which gives a left bar, a tint and a colored title.
- Utility controls keep the common control color.
- Card grids use Material's `grid cards` markup. On reading pages, layout_width places a grid by size (rule 5 in 4.1).

### 6.3 The Color key line

- Where it appears: a landing page has one key, above the first colored block. An inner page has a key above each colored block that adds a kind the page has not keyed yet. The key always appears inside the section map.
- Format: "Color key:", then a swatch and a label for each kind drawn there, and only those kinds.
- It is written by layout_nav `_key`, placed before the enclosing `kind-group` when there is one, and styled in layout-nav.css.
- It sits directly above what it keys, with no gap that detaches it.

### 6.4 The section foot

Every inner page ends with a foot written by layout_nav `_foot`:

- **"More in This Section":** cards, with the section or group overview first, then nav order.
  - On the modules the heading is "Where to Go Next" instead, holding Next, then Previous and any related group.
  - A page never lists the same destinations twice. `_body_listed` collects the pages the body already links as whole items, and `_more` leaves them out (the build prints each case).
- **The Browse disclosure:** the whole section map in a closed `<details>`, and the page's sections in another. This is the no-JavaScript way round. With JavaScript, docs/javascripts/layout-nav.js builds the corner control from the same HTML and then sets `body.has-secmap`, and layout-nav.css hides the disclosure. It is hidden only after the control exists, so if anything fails the foot stays visible.
- **The page end:** the review date, if any, and "Report a problem with this page" (layout_frame `_page_end`).

### 6.5 The corner control (docs/javascripts/layout-nav.js, layout-nav.css)

- **What it holds.** Bottom left, on every page with content (landings included; not the 404 page): "Browse <section>" and "On this page", plus any Filters, Next or Copy prompt that is out of view.
- **Folding.**
  - It folds after 4 seconds (`foldSoon(4000)`) into a round compass button.
  - The fold is animated: the tray shrinks and fades into the compass over 300ms (`FOLD_MS`), using transform and opacity only.
  - Opening is instant. With reduced motion, folding is instant too.
- **The label.** `extra: nav_control_label` in mkdocs.yml puts the word "Navigate" beside the folded compass; the foot carries it as `data-fold-label`.
- **Opening.** Hover, focus or a tap opens it.
- **The real-movement guard.** Only a pointer that really moves (more than 1px from where it rested) opens the control. Folding changes what sits under a resting pointer, and without the guard the control would reopen itself.
- **Panels.** Escape or Close returns focus to the control. The folding tray is `inert`, so it is not focusable and is hidden from assistive technology.

### 6.6 News: the panel, the brief, Topic chips and jump chips

- **News panel** (Latest News look): an outline, the news hue on the left edge, and the feed name as the heading. Each item shows the title first (link color, 600), then "source · date" in muted small type, then the summary. Thin rules separate items. Thumbnails are hidden. The CSS is `.wk-feed` in layout-news.css.
- **The brief** (layout_week `_brief`, from the pipeline's `render_brief_html`), in this order:
  1. the lede;
  2. a plain `<details class="section-brief-more">` labelled "Read the rest of this week's brief", holding only the continuation, which ends in a "Hide the rest of this week's brief" button (rendered `hidden`);
  3. outside the fold, the Listen player (`preload="none"`) and "The picture as of ..." line.

  A brief with no continuation gets no fold. docs/javascripts/layout-news.js then:

  - reveals the Hide button and adds `.has-hide`, so the open fold hides its label and the text carries straight on;
  - moves focus to the continuation's first paragraph when the fold opens;
  - on Hide, closes the fold and returns focus to the label.

  Without JavaScript, the label stays visible and closes the fold.
- **Topic chips** (docs/javascripts/topics.js):
  - The pipeline ships the chip row `hidden`, and the script reveals it, so there are never dead buttons.
  - Choosing a topic filters every list up to the next heading, both tiers included.
  - While a topic is chosen, the collapsed "Show the other N" tier opens as `.is-merged`, with its header and box hidden, so the matches read as one list. The first match gets `.is-lead`, so the list has no leading rule.
  - A status line says "Showing X of Y". All restores the load state.
- **Jump chips** (This Week's `nav.section-chips`):
  - They stick under the header from 60em, and layout-news.js marks the section in view with `aria-current`.
  - A feed chip focuses its panel's heading (`tabindex="-1"`) and outlines the panel for 1.6s (`.is-picked`; a still outline under reduced motion).
  - While the panels share a row, the chip the reader picked stays current, and scrolling never marks another feed chip.
  - The panel headings' `scroll-margin-top` keeps the whole panel clear of the sticky row.

### 6.7 The prompt page panel (scripts/layout_prompt_pages.py, docs/javascripts/layout-prompts.js)

Each prompt page has a side panel, "Fill In Your Details" (`_side`), with one field per `[bracketed]` blank. Fields fill the blanks in the displayed prompt, and Copy copies the filled text. Without JavaScript the prompt shows with its blanks, and Copy is a link to the text. The Copy text must match data/prompts.yaml byte for byte, or the build fails.

### 6.8 Figures with words in HTML

- New figures put their words in HTML and draw only shapes, using the `.hf-*` vocabulary in extra.css: `.hf-box` (with `--ok --info --warn --stop --plain`), `.hf-panels`, `.hf-flow` with `.hf-arrow`, `.hf-return` and `.hf-gradient`.
- A single-SVG figure scales its text with the drawing, which made labels 4 to 6px on phones.
- The figure colors are `--aua-ok`, `--aua-figure-line`, `--aua-warn` and `--aua-alert`, all scheme-aware, and every color has words beside it.
- Check new figures with `python scripts/figure_sheet.py`: nothing under 11px, at 1440 and 390 in both schemes.

### 6.9 Island Night scenery and section banners

- **Island Night** is a dusk view from Curtain Bluff, drawn in code:
  - docs/assets/art/island-core.js draws the home hero; island-sides.js draws the gutters beside the column on wide screens.
  - docs/javascripts/layout-art.js fetches them only where they are needed (the gutters when at least 80px wide; never on phones).
  - Colors are tokens in layout-art.css: dusk in the light scheme, night in the dark scheme.
  - Only the home hero moves, once, within about 3 seconds, and reduced motion shows the still frame. The gutters never move.
  - Without JavaScript, the hero keeps its brand gradient.
- **Section banners** (`.section-banner`, extra.css; SVGs in docs/assets/) are self-contained color, because an SVG in an `img` cannot read CSS variables. A banner is decorative (`alt=""`, `aria-hidden="true"`). The Governance landing shows its banner beside the introduction from 60em.

---

## 7. Color

- **Kinds** are defined in `data/section_map.yaml` under `kinds:`. Each has a `label`, a `token` and a `description`:

  | Kind | Token |
  |---|---|
  | tool | blue |
  | prompt | teal |
  | guide | amber |
  | lesson | green |
  | benchmark | violet |
  | news | coral |
  | governance | navy |

  Rose is defined in the palette and held in reserve.
- **How a page gets its kind.** A tab's `kind:` covers every page in the tab and a group's covers the group; a page entry overrides. A page outside the nav, such as a prompt page or a digest, takes the kind of the nav page it belongs to (`kind_of` in layout_nav.py). A page with no kind (hubs, About) stays uncolored.
- **The palette** is in docs/stylesheets/layout-nav.css between `PALETTE START` and `PALETTE END`: `--hue-<token>`, `--hue-<token>-tint` and `--hue-<token>-line`, in both `[data-md-color-scheme="default"]` and `"slate"`. Each page carries `[data-kind] { --k, --k-tint, --k-line }`, so reassigning a hue is a data edit and changing one is a token edit.
- **Adding a kind:**
  1. Add it under `kinds:` with a token that exists in both schemes, or add the three tokens to both schemes first.
  2. Assign it to a tab, group or page in data/section_map.yaml.
  3. Add it to `order:`.
  4. Build. layout_nav fails on an unknown token.
- **Contrast.** Every hue's text color measures at least 4.6:1 on `#ffffff`, on `#f5f8fb` and on its own tint in the light scheme, and on `#2c3344` and its own tint in the dark scheme. Check colored text on its own tint, not only on the page.
- **Never alone.** Color never carries meaning alone. The Color key names what the colors mean, and titles and labels say it in words.

---

## 8. Typography and case

- **The type scale as rendered.** The body font is Inter (Google Fonts). Sizes below are at 1440, with 1920 in parentheses:

  | Element | Size and weight |
  |---|---|
  | body text | 16px (17.6px) |
  | h1 | 32px (35.2px), weight 500 |
  | h2 | 25px (27.5px), weight 300 |
  | h3 | 20px (22px), weight 400 |
  | meta line | 14.4px (15.84px) |
  | Color key | 12.4px (13.64px) |
  | news panel headings | 0.95rem, bold |
  | news item titles | 0.75rem, weight 600 |
  | news item summaries | 0.72rem |

  Nothing a reader must read is under 11px (the figure rule).
- **Title case** (Chicago style) applies to page titles, nav labels, section headings h2 to h4, card and row titles, prompt titles, category names, short labels, group names and audience tags ("Faculty", "Students", "Faculty & Students", "Everyone").
- **Sentence case** applies to buttons, body text, descriptions, taglines, subtitles and figure titles.
- **Excluded from title case:** the verbatim policy page, pipeline-generated pages and includes, news headlines, and publishers' own names. The rules are in CLAUDE.md.
- **Enforced by scripts/title_case.py.** It checks the final HTML (row and card link titles included; external and button-style links are left out by rule) and the data files, and fails the build on a violation.
  - `ALWAYS_LOWER` lists the small words.
  - `AMBIGUOUS` lists words that pass either way.
  - `EXEMPT` takes only reviewed names that their owners spell that way.
- A heading change on a narrated page makes its recording stale; see section 13.

---

## 9. Ordering

- Where pages of different kinds are listed together: logical order first. Where nothing says otherwise, the order is guides, then lessons, then prompts, then tools.
- `order:` in data/section_map.yaml drives generated lists, such as "Where it is used" on prompt pages.
- Which pages a section shows, and their order, come from the nav in mkdocs.yml and nothing else. data/section_map.yaml only decorates them (icons, subtitles, nouns, kinds).

---

## 10. Motion and accessibility

- **Reduced motion is honoured everywhere.** It removes card lifts and transitions (extra.css) and makes the corner control's fold instant. The Island Night hero shows its still frame, the jump-chip outline is still, and smooth scrolling is off. Nothing carries meaning through motion.
- **Focus after a jump or a fold:**
  - a feed jump chip focuses its panel's heading;
  - opening the brief moves focus to its first continuation paragraph, and Hide returns focus to the label;
  - Escape or Close on a corner-control panel returns focus to the control.

  Targets that take focus programmatically get `tabindex="-1"` and no ring of their own. Something visible (the panel outline, or the text itself) shows where the reader is.
- **The no-JavaScript path:**

  | Feature | Without JavaScript |
  |---|---|
  | Topic chips | the row stays hidden, and the full list shows |
  | The brief | the fold's label opens and closes it |
  | Navigation | the foot's Browse and On this page disclosures |
  | Copy buttons | links to the text |
  | Figures | HTML |
  | Stacked tables | labelled in the HTML |

  `nav_check` in the design suite proves every sitemap page is reachable with JavaScript off.
- **Keyboard.** Every control is reachable by Tab and works with Enter or Space. Disclosures use `<details>`/`<summary>` or `aria-expanded` with `aria-controls`. Focus never lands on something hidden.
- **Targets** are at least 44px where they are primary (rows in cards, fold summaries at 2.2rem), and at least 1.6rem for compact in-panel controls such as the Listen buttons inside news panels.
- **Screen readers.** Wrappers the layout hooks insert are plain `div`s or labelled `section`s (`aria-labelledby` pointing to the heading), so the reading order and the landmarks match the source.

---

## 11. Empty space policy

When a layout leaves a large blank area, remedies apply in this order:

1. **Rearrange.** Pair, lift or spread using the rules in section 4. Most gaps close here.
2. **Something functional, from data.** Add a panel that earns its place and is computed from a data file. The model is "The Directory Today" on the Tool Directory (`_render_directory_today` in render_data.py): counts from data/tools.yaml, a printed verification line, and a build failure if the counts do not add up.
3. **Art,** only where nothing useful fits. The art must be abstract and geometric, in the page's kind hue or the Island Night palette, with no words, and decorative (`alt=""`, `aria-hidden="true"`). It must be self-contained color if it is an SVG in an `img`, and it is hidden below the breakpoint where the gap exists. The Governance banner beside its introduction is the model.

Never add words to fill space. Never invent content, and never hardcode numbers.

---

## 12. Checklists

### A new page

1. **Write the markdown** under `docs/`, and add the page to the `nav:` in mkdocs.yml in the right tab and group. The nav decides the page's section, group, order, breadcrumb and foot.
2. **Type.** Check what `page_type()` gives it from its address (section 3). If it is wrong, set `page_type:` in front matter.
3. **Kind.** If the page's group or tab has no `kind:` in data/section_map.yaml, or the page differs from its group, add a page entry with its `kind:`. If the page needs an icon or a one-line subtitle in the map, add those too.
4. **What the hooks do automatically:**
   - the frame, the breadcrumb, the page ending and the foot (More in This Section and the Browse disclosure);
   - the corner control;
   - kind colors on every link to the page, and the Color key;
   - the two-track layout if it is a reading page;
   - title-case checking.
5. **What the author must do:**
   - Use title case for the title and headings (section 8), and sentence case elsewhere.
   - Use h2 for sections and h3 for subsections. Put a heading first, followed by what it introduces. Do not put headings inside raw HTML or admonitions.
   - For cards, use whole-card links: one `card-link` per single-destination card.
   - Do not repeat links the foot already gives: a list of the section's pages in the body means the foot leaves them out, never both.
   - Draw figures with the `.hf-*` vocabulary and words in HTML.
   - Put nothing in the page that belongs in a data file (CLAUDE.md, working rule 1).
   - Write no rules of its own; link to the policy instead (CLAUDE.md).
   - Use no em dashes, plain US English, and expand acronyms on first use.
6. **Checks before it ships:**
   - `mkdocs build --strict`, then read the hook blocks: layout_width "left as they were: 0" and read = written, title_case 0 violations, and layout_nav links checked;
   - `python scripts/design_check.py --page <address>/`;
   - `python scripts/figure_sheet.py` if the page has a figure;
   - `python scripts/verify_links.py` on the page's external links.

### A new section (a new tab)

1. Add the tab to `nav:` in mkdocs.yml, with a landing page first. Add the landing to `DOOR` in layout_frame.py if it is a door.
2. In data/section_map.yaml, give the tab an icon and a kind (or leave it uncolored for a hub), name any loose runs of pages (`loose:`), and give groups their icons, subtitles and nouns.
3. If the kind is new, follow "Adding a kind" in section 7.
4. Build, then open the landing and one inner page at 1920, 1440 and 390. Check the corner control's Browse map, the foot and the Color key.
5. Run `python scripts/design_check.py`.

### A new data-driven list

1. Put the data in `data/<name>.yaml`, owner-owned, with a comment block explaining the fields.
2. Render it in `scripts/render_data.py` behind a `<!-- render:<name> -->` marker, in memory only.
3. Print verification counts (read, kept, dropped, written) and raise on a mismatch (CLAUDE.md, working rule 2).
4. Reuse existing markup: rows (`pl-row` style), cards (`grid cards` with `card-link`) or the news item style. Links must wear their target's kind.
5. If the list runs in more than one column, make it a grid in rows (section 4.2), never CSS columns.
6. If it filters, follow the Topic chip pattern: the row ships `hidden` and JavaScript reveals it, with a status line and no dead buttons.
7. Run `python scripts/design_check.py`.

---

## 13. Things not to do

| Do not | Why |
|---|---|
| Restore the single centred 33rem column on reading pages | The owner chose the full frame. The single column left half of every wide screen blank (SPEC 12, width round). |
| Remove the panel outlines for calm | The owner chose them: they close up large blank areas. |
| Add a second list of navigation to a page (a "see also" list of the section's pages, a sidebar) | The foot and the corner control already list the section. A page never lists the same destinations twice (`_body_listed`). |
| Use CSS columns for a list of cards or items | Columns flow top to bottom, so items do not line up across and rules sit at different heights (the w38 bug). Use a grid. |
| Hand-edit generated pages or includes (docs/news/**, includes/*, docs/prompts/exchange.md) | The pipeline rewrites them. Change their look at render time (layout_week, layout_news), or change the generator. |
| Change a narrated page's text or heading case without re-recording | The narration reads every heading. An edited page is served with no player until its audio is regenerated locally (CLAUDE.md, Narration). |
| Edit docs/governance/policy.md | It is verbatim institutional text. It is only replaced whole. |
| Add restrictions, warnings in red or amber, or rule language | The policy is the only rulebook (CLAUDE.md, policy register). |
| Put words inside an SVG figure | They scale with the drawing and become unreadable on phones. |
| Add a new breakpoint value | Use those in section 5, so layouts change together. |
| Loosen an integrity check to make a build pass | The check is what proves nothing was lost or reordered. Fix the markup or the hook. |
| Assign a color by position or section | Color means kind (section 7). |
| Add filler text or invented content to close a gap | See the empty space policy (section 11). |

---

## 14. Known gaps left on purpose

These blank areas remain, measured at 1920. Do not "fix" them blindly; each has a reason:

| Page | Where, size | Why it is left |
|---|---|---|
| examples/lecture-outline | "What to Check", right of a 10-item list, about 912x2272 | One list of long checks. It is taller than a screen even in two columns, so the fits-one-screen rule keeps it in one column. Splitting it would change its text. |
| tools/ (index) | The 11 category rows, about 592x1888 | Two columns of rows would move a category when it opens, and would interact with the chooser's filters and Open All. For the owner to decide. |
| examples/study-practice-questions, examples/memo-and-minutes | "What Went In", beside a long quoted input | A short paragraph beside long material; there is nothing to place beside it without rewording. |
| benchmarks/ | Beside the LiveBench snapshot, about 592x1392 | The table is pipeline-generated (includes/livebench.md) and sets its own width. |
| prompts/ (library) | After the last prompt row | The end of a list cannot be pulled up. |
| tools/agents | "Where to Start", the last section | A lone final section with nothing after it to pair with. |
| accessibility | Under Known Limitations | Its tile pairs with a taller neighbour, and the last section is one paragraph. |
| Reading pages with text beside a figure (pathway/rules, tools/hardware, worked-examples/sharex-hdr, tools/research, tools/first-session, playbooks/score-reports) | Under the shorter side | A paragraph stays beside its figure (house rule), so the shorter side keeps some space. |
| The two announcement posts | Head | Short posts split unevenly between the two columns. |
| students/, faculty/ | Beside "Start with the Basics" and "Also on This Site" | Hub sections of unequal height. |
| Every shelf page | Beside the short intro at the top, and beside the comments note at the foot | The intro and comments paragraphs are held to 44rem for reading; the page head has nothing else to hold. |
| news/this-week | Right of the two podcast cards | Podcasts keep card size; the row has nothing else. |
| Short feed columns on a digest | Under a feed with far fewer items than its neighbour | The dominant-feed rule closes the worst cases; the rest is the week's own balance. |

The layout_width build block also lists every one-paragraph section still alone across the width (about 30). Almost all are a prompt's Notes, where the side already has a panel.

---

## 15. Current measures (the baseline)

These figures are from `scripts/design_check.py measure`, on the build of 5096938 (the week round, live). Blank share is the share of each screen (below the header) in a large empty region: at least 160px each way and 57,600px², with ink grown by 12px. Outlined panels count as used. CPL is characters per line of running text.

(The table is being recorded in this round; until it lands, the space round's figures in SPEC section 12 are the reference.)

The same figures, per page, are in `scripts/design/baselines.json`. The suite compares against them (section 16).

---

## 16. The design check suite

`python scripts/design_check.py` is an authoring tool. It is not part of CI, in the same way as `scripts/figure_sheet.py`.

What it does:

1. Builds the site into a temporary folder with `mkdocs build --strict`.
2. Serves the build to a headless Chromium through Playwright.
3. Runs the checks.
4. Prints one summary and exits non-zero on a failure.

The checks live in `scripts/design/`, one module each:

| Check | What it proves |
|---|---|
| `overflow` | No page scrolls sideways at 360, 390, 768, 1024, 1280, 1440 or 1920. |
| `links` | Every internal link and `#fragment` in the built site resolves. |
| `nav` | The foot's Browse disclosure works with and without JavaScript, and every sitemap page is reachable by keyboard with JavaScript off. |
| `news` | This Week and a digest: jump chips, Topic chips (every chip, both tiers, back to All), every "Show the other N", the brief's fold (open, Hide, focus), Listen with `preload="none"`, feed chips marking their own panel, rows aligned in multi-column lists (w24 onwards and the feed pages), and the no-JavaScript reading. |
| `measure` | Blank share and characters per line per page at 1920 and 1440, compared with `scripts/design/baselines.json`. |
| `gaps` | An optional report of every blank region, largest first, with where it is. Not a pass/fail check. |

It needs Python 3.11+ with `playwright` installed and Chromium available (`python -m playwright install chromium` once). On the owner's laptop that is the system Python 3.13, as for figure_sheet.py; the site build itself uses mkdocs from the repo's `.venv` when it exists. See the module docstring of scripts/design_check.py for options (one check, one page, keeping the build, refreshing the baselines).
