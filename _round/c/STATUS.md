Space round: IN PROGRESS, step 3 (measuring gaps; level-1 fixes under way)

# Space Round Status (resume point)

Branch `space-round` (from origin/main 1f6b2f8). Brief: `_round/c/BRIEF.md`.

## Environment

- Chromium trusts the agent proxy CA, so Google Fonts load and `_round/measure.py` measures with Inter: `apt-get install libnss3-tools`, then `certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n ccr-agent-proxy -i /root/.ccr/agent-proxy-ca.crt`. Checked: the Google Fonts CSS request returns status 200.
- Builds: /tmp/sp-base (branch start, 1f6b2f8 plus the brief), then /tmp/sp-N as work proceeds.
- Round tools (kept under `_round/c/`):
  - `gaps.py`: every blank component, largest first.
  - `nav_check.py`: the Browse disclosure with and without JavaScript, plus keyboard reachability.

## Step 1: Redundant Navigation (built, commit 70d09ff)

**The foot's Browse disclosure.** The markup is unchanged.

- docs/javascripts/layout-nav.js, as its very last statement after the control is built, placed and folded: `if (map && bar.isConnected) body.classList.add("has-secmap")`. If anything earlier throws, or JavaScript is off, the class is never set.
- docs/stylesheets/layout-nav.css: `body.has-secmap .md-typeset .secfoot__all` and `body.has-secmap.has-secnav .md-typeset .secfoot__maps` get `display: none`, which removes them from rendering and from the accessibility tree. On this page was already hidden by `has-secnav`.
- Proof (`_round/c/nav_check.py`, six sample pages: about, a write-up, a guide, a prompt page, a tool guide, This Week):
  - With JavaScript: the control is built, Browse is not rendered, and the foot's ARIA snapshot does not contain it. More in This Section is shown.
  - Without JavaScript: Browse is shown and in the tree, Tab reaches its summary, and Enter opens the map.
  - Reachability from the home page by keyboard-reachable links: all 111 sitemap pages, with JavaScript off and on.

**No destination listed twice.** In scripts/layout_nav.py, `_body_listed` collects the pages the body already lists (as list items or table cells that start with their link, or as card links, whole-page links only). `_more` leaves those pages out of More in This Section and drops the list when nothing is left. The build prints each case. At the time of writing: 18 cards on 6 pages.

| Page | Cards left out | Result |
|---|---|---|
| worked-examples/index | the 4 write-ups | list dropped |
| playbooks/index | 7 guides | 3 left |
| tools/agents | 4 agent guides | 1 left |
| tools/index | Gemini Notebook | 5 left |
| basics/how-llms-work | Common Misconceptions | 3 left |
| the launch announcement | Conferences | 2 left |

## Step 2: Project Write-Ups (built, commit a186904)

- **Index** (docs/worked-examples/index.md):
  - The table is now whole-link cards, using the governance landing pattern (`grid cards gov-cards wx-cards`, two to a row).
  - Both descriptions are kept word for word under the table's own column names as small labels ("What it is", "What it demonstrates").
  - The index is a reading page now (removed from layout_frame SHELF), so its prose keeps the 31rem measure and sits in panels. Measured: its longest line went from 205 characters to 88.
  - The "How to read these" note moved up, beside the intro and before the cards (rearranged, not reworded).
  - Its foot's More in This Section is dropped by the step 1 rule.
- **Kind:** data/section_map.yaml gives the "Project Write-Ups" group `kind: guide`, the hue whose description already names worked examples. The existing entry is extended, not duplicated. The cards, the write-ups' feet and their Color key lines now wear it.
- **Write-ups:** the prose is untouched. Headings were already in title case, and each write-up keeps More in This Section.

## Step 3: Layout Rules (level 1, built so far)

In scripts/layout_width.py:

- **No lone h1.** A first section is lifted beside the head only when the head has more than its title (a meta line). On About, the title now runs across the top and Contact pairs with Purpose.
- **One-paragraph sections pair.** A section whose text would fill only one column of a full-width row pairs with its neighbour, up to three times its weight (`LONE_RATIO`).
- **Subsections can be tiles.** An h3 subsection was never tileable, because the check forbade its own heading. As a result, one-paragraph subsections each spanned the full width; Module 6 had four. Only a nested h3 disqualifies now. This is a layout change only; narrated text is untouched.
- **Color keys stay with their block.** A key goes with the wide block it keys (the write-ups' key had landed in the head).
