# Handoff round (2026-09-27): write down the design language, bring the tools home

Branch `design-docs`, cut from origin/main 5096938 (live: the week round). This is the LAST work
on the owner's cloud credit (about $54 left). After it, all work on this site happens locally on
his laptop, by sessions that have never seen this weekend and have only the repository and their
own memory notes. Everything you know that they would need has to end up in the repository.

## The owner's words

> so to wrap things up, I think we need to document things so that future sessions know what our
> design specs are. I'm down to $54/250 for cloud sessions and once that is depleted I'm unlikely
> to leverage them in the future because they are billed separately, so anything we've learned
> from builder C that needs to be documented for future work by you on this laptop should be
> documented. As the hub expands and future pages are added I'd like them to inherit the design
> language we've worked on this weekend so consistency is maintained, I'd also like a clean
> handoff once that last 54 is used up so that we can pick up from that point onwards and
> continue to work locally thereafter.

## Budget and order (the credit may run out mid-round)

Work in this order and PUSH after each step, so a sudden stop leaves usable work:

1. DESIGN.md (the most valuable part; do it first and well).
2. The tools, ported so they run on the laptop.
3. The pointers in CLAUDE.md, SPEC.md and README.
4. HANDOFF (open items).

Keep `_round/c/STATUS.md` current, first line `Handoff round: IN PROGRESS, <step>` and finally
`Handoff round: READY`. Be economical with long sweeps: run each full check once at the end, not
after every edit.

## 1. DESIGN.md at the repository root: the design language

Written for a future session (a model or a person) adding or changing a page who must make it look
and behave like the rest of the site without having been here. Describe what IS, taken from the
code, with file and function names, and say where each rule is enforced. It is a reference, not a
history: dated owner decisions stay in SPEC section 12 and CLAUDE.md; link to them rather than
repeat them. At minimum:

- **Principles**, briefly, in the owner's terms: the full frame with no large blank areas; panels
  in thin outlines (kept on purpose); one 31rem reading measure; color by meaning; restraint
  (accuracy over flash); the policy as the only rulebook; nothing hardcoded that belongs in data.
- **The build pipeline of hooks**, in registration order (mkdocs.yml), what each one does, what
  it asserts, and what it prints, so a reader knows where a change belongs: layout_frame (page
  types), layout_nav, layout_width, layout_week, layout_home, layout_learn, layout_prompt_pages,
  render_data, title_case, and the rest you know of. Include the integrity checks (for example
  layout_width's "blocks read = written") and what to do when one fails.
- **Page types** (door, task, lesson, reference, shelf, and any others): what each is for, how a
  page gets its type, and what the frame does with it at each width.
- **Layout rules** of layout_width and layout_week: the shapes (tile, spread, leaf, set, steps,
  wide, band, and the week round's), when each applies, the fits-one-screen rule, headings always
  with what they introduce, a paragraph beside its figure, an h1 never alone in a cell, short lone
  sections pairing, card grids beside their text, lists in rows (never CSS columns that misalign),
  and the breakpoints (68.75em, 60em, 76em, 44.9375em and any others) with what changes at each.
- **Components**, each with its markup, its CSS home and its JS behaviour: whole-card links and
  the hover (lift, then title underline, none under reduced motion); kind rows; card grids; the
  Color key line and its spacing; the section foot (More in This Section; the hidden Browse
  disclosure that the corner control builds from and that is the no-JavaScript path; the rule that
  a page never lists the same destinations twice); the bottom-left corner control (fold timing,
  the "Navigate" label, the real-movement guard); the news panel (Latest News look), the brief
  (lede, player, "Read the rest" / "Hide the rest"), Topic chips and the second tier, jump chips;
  the prompt page panel (Fill In Your Details); figures with words in HTML; the Island Night
  scenery (hero and gutters, every page) and the section banners.
- **Color**: the kinds, where the palette tokens live, how a new kind would be added, contrast
  checks (text on its own tint as well as the page), both schemes.
- **Typography and case**: the type scale actually in use, Chicago title case for titles,
  headings, names and labels, sentence case for buttons and body, and scripts/title_case.py (what
  it checks, its EXEMPT list rule).
- **Ordering**: logical first, otherwise guides, lessons, prompts, tools (`order:` in
  data/section_map.yaml).
- **Motion and accessibility**: reduced motion everywhere, focus handling (what gets focus after a
  jump or a fold), the no-JavaScript path for every control, keyboard reachability, 44px targets.
- **Empty space policy**: rearrange first, then something functional from data, then art only
  where nothing useful fits; the art style (abstract, geometric, in the kind's hue or the Island
  Night palette, no words, decorative).
- **Adding a new page: a checklist.** Where it goes in mkdocs.yml and data/section_map.yaml, how
  it gets its type and kind, what the hooks will do to it automatically, what the author must do
  (title case, whole-card links, no duplicate link lists, figures in HTML, Color key where colors
  appear), and which checks to run before it ships. Do the same for **a new section** and **a new
  data-driven list**.
- **Things not to do**, each with its reason (restore the single 33rem column, remove the
  outlines, add a second nav list, use CSS columns for lists, hand-edit generated pages, change a
  narrated page's text or heading case without re-recording, and so on).
- **Known gaps left on purpose**, with reasons (the space round's "Gaps Still Left" table), so a
  future session does not "fix" them blindly.
- **Current measures** (blank share and characters per line by page type at 1920 and 1440, page
  heights for the news pages) as the baseline a regression is judged against.

## 2. The tools, runnable on the laptop

The round tools (`_round/measure.py`, and in `_round/c/`: gaps, overflow, nav_check, linkcheck,
sitebrowser, week_check, week2_check, narration_proof, measure_table; take them from
origin/week-round) become authoring tools in the repository, like scripts/figure_sheet.py:

- One entry point, `scripts/design_check.py`, that builds the site to a temporary folder, serves
  it, runs the suite, prints one summary, and exits non-zero on a failure. Options to run one check
  or one page. Keep each check as its own module under one folder you choose (say where).
- It must run on the laptop: Windows 11, Python 3.13 with Playwright and Chromium installed
  (system Python, not the repo's .venv, as figure_sheet.py documents), no bash-only commands,
  paths via pathlib, the build through `mkdocs` in the repo's .venv or the current interpreter.
  The proxy-CA and font setup you needed in the cloud does not apply there (Google Fonts loads
  directly); drop it or make it optional.
- Record the baselines from DESIGN.md somewhere the suite can compare against (a JSON file is
  fine) and say how to refresh them after an approved change.
- Do not add any of it to CI; it is an authoring check, like figure_sheet.

## 3. Pointers

- CLAUDE.md: one short bullet under Published content style (or wherever fits best) saying that
  DESIGN.md is the design reference every new page follows and that `scripts/design_check.py`
  runs before a layout change ships. Keep CLAUDE.md's existing wording; add, do not rewrite.
- SPEC.md section 12: entries for the space round and the week round (owner approved 2026-09-27),
  in the style of the neighbouring entries, and a line pointing to DESIGN.md.
- README: the maintenance playbook gets "Adding a page" pointing to DESIGN.md's checklist, if the
  playbook has no such entry.

## 4. HANDOFF

`_round/c/HANDOFF.md` (the local session folds it into its notes; it is not merged): everything
you know that is not written anywhere else. Ideas you had and did not build, fragile spots in the
code, anything you would warn the next person about, and the candidate places for the bespoke art
the owner wants made locally next (from the gaps table), with sizes at 1920 and 1440 and the
page's kind hue.

## Checks before READY

`mkdocs build --strict` clean; title_case 0 violations; the site's output byte-identical to
5096938's build apart from nothing (this round changes docs and tools, not pages: prove it with a
diff of the built site); `python scripts/design_check.py` runs clean in your environment; every
file and function named in DESIGN.md exists (a small script that greps them is enough). Round
files stay under `_round/`; no screenshots.
