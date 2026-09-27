# Space round (2026-09-27): brief for designer C

Branch `space-round`, cut from origin/main 1f6b2f8 (live). Work only here. Everything from the width
and polish rounds still applies: SPEC section 12, and CLAUDE.md's Published content style rules
(full-frame layout with the panel outlines kept, color by meaning plus Color key lines, Chicago
title case with scripts/title_case.py, ordering, whole-card links with the homepage-card hover,
figures with their words in HTML).

## The owner's words (2026-09-27, with screenshots of About and Project Write-Ups at about 1920px)

> In terms of the remaining empty space, we should consider places where we can make it
> functional, if there is absolutely no use for the space that improves the presentation of the
> information or provides more information, we can consider generating bespoke art for those
> areas. Secondly the bottom of the about page is where the project writeups now live it also has
> redundant nav because we have the bottom left nav bar here + a collapsible nav element which
> offers the same thing. Finally, the project writeups section could use a little love to bring it
> into alignment with the rest of the site, we have the redundant nav elements and two sets of
> links here, this is also present within the individual writeups (redundant nav elements) (I
> think in the individual writeups, the more in this section part is fine but the collapsible
> element should probably be deprecated in favor of the bottom left nav element.)

## 1. Redundant navigation (build it, site-wide)

- The section foot's "Browse <Section>" collapsible duplicates the bottom-left control on every
  page. Retire it **visually**, site-wide. Keep "More in This Section".
- Careful: docs/javascripts/layout-nav.js builds both floating panels FROM that foot
  (`[data-secfoot]`, written by scripts/layout_nav.py around lines 700 to 890), and its header
  comment says the foot is the complete no-JavaScript way round. So do not delete the markup.
  Hide the Browse disclosure once the corner control has built itself (for example a class the
  script sets on success), so a reader without JavaScript, or a page where the control fails,
  still has it. Say in STATUS exactly how it is hidden (it must leave the accessibility tree
  too, not only the screen) and prove the no-JS case.
- General rule: a page does not list the same destinations twice in two page-level link lists.
  Where the body already lists its section's pages as rows or cards (the write-ups index is the
  case he showed), the foot's More in This Section leaves those pages out, and is dropped if
  nothing is left. Breadcrumbs and the corner control do not count as lists.

## 2. Project Write-Ups (build it)

Pages: docs/worked-examples/index.md plus this-site.md, sharex-hdr.md, recommender.md, genome.md
(nav group "Project Write-Ups" under About & Contact).

- Index: the table (Write-up | What it is | What it demonstrates) becomes the site's kind rows or
  cards: whole-row links, homepage-card hover, both descriptions kept word for word, laid out for
  the full frame. Its foot then no longer repeats the four write-ups (rule above).
- Bring the section into line with the rest of the site: panels and outlines, heading case, the
  kind color and a Color key line where colors appear, banner, feet. Do not rewrite the
  write-ups' prose: the owner wrote it. Heading case fixes are fine.
- Each write-up keeps More in This Section; its Browse collapsible goes per section 1.

## 3. Remaining empty space (measure, build, and list for the owner's decision)

His order of preference, which is the rule:

1. **Rearrange existing content** so the space goes away.
2. **Something functional** that improves how the information is presented or adds information.
   Values come from data files or existing pages, never hardcoded (CLAUDE.md rule 1).
3. **Bespoke art**, only where 1 and 2 have nothing to offer.

Steps:

- Measure every page (reading pages and landing pages) at 1920 and 1440 with `_round/measure.py`
  (restored here from the archived width kit). List the blank components, largest first: page,
  where, size.
- The example he showed, About (docs/about.md) at 1920: the "About" h1 sits alone in the left
  column beside the Contact panel, leaving a column-high gap under it; the Purpose panel spans the
  full width with its text only in the left half. Fix the RULE in scripts/layout_width.py, not
  just this page: an h1 never occupies a grid cell alone, and a short lone section pairs with a
  neighbour instead of spanning a row.
- Build every level-1 fix.
- Build the level-2 and level-3 ideas on this branch too, so the owner sees them in one preview,
  but he accepts or rejects each one. In STATUS list each with: page and place, what it is, its
  data source, the EXACT new wording (quoted in full), and one line on why it earns the space.
  New wording follows the style rules: no em dashes, plain language, sentence case except
  titles, neutral, no restrictions and no restating of the policy.
- Art: match the house banner style (for example the Project Write-Ups banner): abstract and
  geometric, in the page's kind hue, no words in the drawing, decorative (aria-hidden, empty alt),
  right in both color schemes, small SVG. An SVG referenced by `<img>` cannot read page CSS
  variables, so it carries its own colors; inline SVG may use the tokens. The site's register is
  accuracy and restraint over flash: propose the best few, never art where something useful
  would fit, and never so much that a page reads as decorated.

## Constraints

- The nine narrated pages (the seven docs/pathway/ modules, docs/basics/how-llms-work.md,
  docs/basics/misconceptions.md): no change to any text the narration reads, headings and their
  case included. Layout changes are fine. If a fix would need a text change there, list it
  instead of making it. No narration runs in the cloud.
- Never edit docs/governance/policy.md. Never hand-edit generated files (docs/news/**,
  includes/*, docs/prompts/exchange.md, data/seen_items.json and the other pipeline-owned files).
- Before READY: `mkdocs build --strict` clean; title_case 0 violations; layout_width block
  integrity (blocks read = written); no sideways scroll from 360 to 1920; every page reachable by
  keyboard, and with JavaScript off; anchors unchanged (list any removed); a before/after measure
  table (blank share and characters per line by page kind at 1920 and 1440) plus the list of gaps
  still left and why.
- Keep round files under `_round/` (dropped at merge). Do not commit screenshots.
- Resume point: `_round/c/STATUS.md`, pushed as you go. First line `Space round: READY` when done,
  otherwise `Space round: IN PROGRESS, <step>`.
