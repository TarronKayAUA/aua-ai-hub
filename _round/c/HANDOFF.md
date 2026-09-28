# Handoff from the cloud rounds (2026-09-27)

For the local session to fold into its notes. It is not merged. It holds what is not written anywhere else: DESIGN.md holds the design language, SPEC section 12 the decisions, and CLAUDE.md the working rules. Everything below was true on `design-docs` at the end of the handoff round.

## Where things are

- **The live site is origin/main 5096938** (the week round merged). `design-docs` adds only documents and authoring tools. Its built site is byte-identical to 5096938's build; STATUS.md records the proof.
- **The round branches** (`width-c`, `space-round`, `news-round`, `polish-round`, `prompt-rows`, `week-round` and others) each hold `_round/c/STATUS.md` with that round's full record: measurements, and the exact wording added. They are history and nothing to merge. SPEC section 12 points at them.
- **The design check suite:** `scripts/design_check.py` plus `scripts/design/` (overflow, links, nav, news, measure, gaps) and `scripts/design/baselines.json`. It replaces the `_round/` tools, which never reached main.

## First thing to do on the laptop

1. Run `python scripts/design_check.py` once from the system Python 3.13 that already has Playwright for figure_sheet.py. If Chromium is missing, run `python -m playwright install chromium`.
2. **It has only been run on Linux** (this cloud container). Expect one of these small Windows issues on the first run:
   - Chromium not installed for that Python;
   - console encoding (the script calls `sys.stdout.reconfigure(encoding="utf-8")`);
   - the `.venv\Scripts\python.exe` build path. That path is the one figure_sheet.py already uses, so it should be fine.
3. **Expect measure differences on the first laptop run.** The baseline was measured in the cloud with Inter from Google Fonts at 1920x1080 and 1440x900, in headless Chromium. Font hinting on Windows can move a line break or two, so a page's blank share may drift by a point. The tolerance is 5 points; a failure over that deserves a look, not a baseline refresh. If the first run is clean apart from noise, refresh the baseline on the laptop once (`--only measure --update-baselines`) so future comparisons are like for like, and commit it.
4. A full run took 13 minutes in the cloud (measure and overflow about 5.5 each: 95 pages measured at two widths, 111 pages loaded at 7 widths); a laptop may take longer. For a single page, use `--page <address>/`, which takes seconds.

## Fragile spots (where a future change can break something quietly or loudly)

- **layout_week.py depends on the pipeline's markup.** It reads:
  - the brief as `render_brief_html` writes it in scripts/aggregate.py (`<details class="note section-brief-more">`);
  - the digest's section titles ("Conference calendar updates", "New opportunities");
  - the section ids (`videos`, `podcasts`, `also-this-week`, `the-week-in-brief`);
  - the "Show the other N videos" wording.

  If aggregate.py changes any of these, the build fails loudly (`_check_brief` and `_check_arrange`, or "a brief could not be read"). The fix is to update the regexes at the top of layout_week.py. A new digest section with an unknown title is not an error: it is left unwrapped, full width.
- **`_TAIL` in layout_week.py** splits off the page ending by the classes `page-end` and `page-reviewed`, which layout_frame writes. Renaming those classes would put the foot back inside the last news section.
- **The Color key placement** (layout_nav `_color_page`) looks for a `div` with class `kind-group` directly around a `section.kind-block`. layout_week relies on that for the news panels. A wrapper added between them moves the key.
- **The last-row rule on grid lists** is hidden by `clip-path: inset(0 0 1px 0)` on the list (layout-news.css). This works because each card's rule is its bottom border at the list's bottom edge. Padding on the list, or a card with a bottom margin, would bring the rule back.
- **The merged Topic tier** (`.is-merged`) restyles Material's `details.abstract`, the site-wide "Show the N ..." row style in layout.css. A change to that shared style needs a look at This Week with a topic chosen.
- **`scroll-margin-top: 4.6rem`** on the feed panels' headings is tuned to the sticky jump-chip row's height. If the row grows (say, a sixth chip wraps it to two lines), recheck it with the news check (it asserts the panel clears the row).
- **The corner control's fold** has a "real movement" guard: only a pointer that moves more than 1px opens it. Do not remove it: without it, folding under a resting pointer reopens the control, and Escape then loops.
- **`design_check.py` reads two build lines:** "blocks read/written" and "left as they were" from layout_width, and the title_case total line. If those print formats change, the build step reports that a line is missing, and it is a failure. Update the regexes in `build_site`.
- **Two blank-space measures that disagree by design.** measure (the baseline) counts an outlined panel as fully used. gaps counts the inside of an outline as blank. Use measure for regressions and gaps for finding places.
- **News audio is built in CI only.** A local build has no `news-*` or `digest-*` MP3s, so the brief players are absent locally and the news check skips its Listen steps (it says so). That is expected, not a failure.

## Ideas not built (candidates, none promised)

- **"Also this week"** on the digests is the one list still in CSS columns. It is groups of single links, so there is no row to align. A grid of topic groups (each group a small panel, three across) would make it consistent with section 4.2 of DESIGN.md, at the cost of uneven group heights.
- **The Tool Directory's category rows** could run two columns wide from 76em. They were left because opening a category would move its neighbour, and because of the chooser's filters and Open All (DESIGN.md section 14). A version that opens a category across both columns (a `grid-column: 1 / -1` on the open row) would avoid the jump; it is untested.
- **Door pages' card text** runs to 114 characters a line at 1920 (the hubs' card descriptions). A max-width on the card body, or three cards across instead of two where they are two, would bring it near the measure.
- **The design check could also run figure_sheet.py** as a seventh check. It was kept separate because it needs Pillow and writes contact sheets.
- **A "new page" scaffold command** (write the markdown with front matter, add the nav line and a section_map entry) would make DESIGN.md's checklist mechanical. It was not built because nav placement is a judgement call.

## Candidate places for bespoke art (the owner wants these made locally)

Art only where nothing useful fits (DESIGN.md section 11): abstract and geometric, in the page's kind hue or the Island Night palette, no words, decorative, self-contained color if it is an SVG in an `img`, and hidden below the breakpoint where the gap exists. Sizes are the blank region measured on the live build by `design_check.py --only gaps`, in CSS pixels, width x height.

| Page | Where | 1920 | 1440 | Kind hue |
|---|---|---|---|---|
| examples/lecture-outline | Right of "What Came Back" (the long list of checks) | 912 x 2272 | 720 x 2064 | guide, amber (`--hue-amber`) |
| tools/ (Tool Directory) | Right of "Find Tools by Task", beside the category rows | 592 x 1888 | 416 x 1728 | tool, blue (`--hue-blue`) |
| examples/study-practice-questions | Left, under "What Went In", beside the long quoted input | 912 x 1104 | 736 x 1008 | guide, amber |
| examples/memo-and-minutes | Left, under "What Went In" | 912 x 736 | 736 x 688 | guide, amber |
| benchmarks/ | Right of the LiveBench snapshot | 592 x 1408 | 336 x 1264 | benchmark, violet (`--hue-violet`) |
| tools/agents | Right of "Where to Start", the last section | 912 x 848 | 672 x 768 | guide, amber |
| prompts/ (Prompt Library) | After the last prompt row, right side | 672 x 1168 | 592 x 768 | prompt, teal (`--hue-teal`) |
| accessibility | Right of "Known Limitations" | 944 x 848 | 688 x 720 | no kind: Island Night palette |
| students/ | Right of "Start with the Basics (30 Minutes)" | 784 x 784 | 576 x 720 | no kind: Island Night palette |
| faculty/ | Right of "Also on This Site" | 800 x 688 | 592 x 608 | no kind: Island Night palette |
| announcements/2026-06-09-aua-ai-hub-launch | Left of the head, under the title | 912 x 608 | 736 x 528 | news, coral (`--hue-coral`) |
| news/this-week | Right of the podcast cards | 1040 x 768 | 816 x 672 | news, coral |

The first four are inside reading layouts, where a figure-like piece of art would read as content. Prefer something functional there first. For example, on the tool and benchmark pages, a small data panel in the style of "The Directory Today" (counts by category, or the snapshot's date and model count), computed from data. The last row, This Week, could hold a quiet news-hue pattern, since podcasts are usually one to three.

The kinds for examples/ and tools/agents are "guide" by data/section_map.yaml's description ("Step-by-step guides, tool guides, agent guides and worked examples"). Confirm with the colors on the page's own feet before drawing.

## Owner preferences learned this weekend (not all written elsewhere)

- **The owner reviews in previews and screenshots,** at 1920x1080 on his own screen. He notices misalignment (the w38 columns), controls that cannot be undone (the brief's fold) and links that all land on one place (the jump chips). Check those by eye, not only by script.
- **He prefers keeping a feature and fixing it** over removing it, and wants every existing function kept through a redesign (chips, "Show the other N", Listen).
- **New wording is always listed back to him, quoted exactly,** in the round's STATUS. Keep doing that for any new label.
- **"For the owner's decision"** is the right framing for anything added beyond the brief (a functional panel, art, a restyled page). Build it so it can be backed out in one step, and say how.
- **Budget:** cloud credit is gone after this round. Long sweeps (the full design check, a full `verify_links.py`) should run in the background and only once per change.
