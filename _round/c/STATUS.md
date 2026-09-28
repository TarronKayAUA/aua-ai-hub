Handoff round: READY

# Handoff Round Status (resume point)

Branch `design-docs`, cut from origin/main 5096938 (the week round, live). Brief: `_round/c/BRIEF.md`. All four steps are done and pushed, in the brief's order, and every check before READY passes.

## What was delivered

| Step | Delivered |
|---|---|
| 1. DESIGN.md | `DESIGN.md` at the repository root, in 16 sections. Details below the table. |
| 2. Tools | `scripts/design_check.py`, the checks in `scripts/design/`, and the baseline in `scripts/design/baselines.json`. Details below the table. |
| 3. Pointers | A CLAUDE.md bullet under Published content style, SPEC section 12 entries, and a README playbook entry. Details below the table. |
| 4. HANDOFF | `_round/c/HANDOFF.md`. Details below the table. |

**DESIGN.md** covers:

1. principles;
2. the hook pipeline in registration order, with integrity checks and what to do when one fails;
3. page types;
4. layout rules: layout_width's shapes and rules, and the news panels;
5. breakpoints;
6. components;
7. color;
8. typography and case;
9. ordering;
10. motion and accessibility;
11. the empty space policy;
12. checklists for a new page, a new section and a new data-driven list;
13. things not to do;
14. gaps left on purpose;
15. the measured baseline;
16. the design check suite.

**The tools:**

- The checks in `scripts/design/` are `overflow`, `links`, `nav`, `news` and `measure`, plus the report-only `gaps`. `common.py` holds the in-process server and the report.
- `scripts/design/baselines.json` holds the baseline for 95 pages at 1920 and 1440: blank share, worst screen, height, line lengths and heading inversions.
- The tools are ported from the round tools on origin/week-round (`_round/measure.py`, `_round/c/*.py`).
- They use pathlib, need no shell commands, build through `.venv` when it exists, and have `--offline` for fonts. They are not in CI.

**The pointers:**

- CLAUDE.md: one bullet, "Design language", under Published content style.
- SPEC section 12: "Remaining empty space and redundant navigation: the space round", "This Week, the digests and the feed pages in news panels: the week round", and "The design language is written down".
- README: a playbook entry, "Add a page, a section, or a data-driven list".

**HANDOFF.md** covers:

- where things are;
- the first run on the laptop (the suite has only run on Linux);
- fragile spots;
- ideas not built;
- 12 candidate places for bespoke art, with sizes at 1920 and 1440 and their kind hue;
- owner preferences learned in the cloud rounds.

## Checks before READY

| Check | Result |
|---|---|
| `mkdocs build --strict` | clean (run by design_check's build step) |
| title_case | 2702 checked, 0 violations |
| The site is byte-identical to 5096938's build | `diff -rq` of the two builds: no differences, 252 files each. Details below the table. |
| `python scripts/design_check.py` | clean. Details below the table. |
| Every file and function named in DESIGN.md exists | `python _round/c/names_check.py`: 40 paths, 58 code names (all defined), 29 CSS names; 0 missing. Details below the table. |
| No screenshots committed | none; round files are under `_round/` |

**Byte-identical site.** The base build was made at 7aedfb9, whose only difference from 5096938 is `_round/c/BRIEF.md` (`git diff --stat 5096938 7aedfb9`). The final build is the one design_check kept. `git diff --stat 5096938 HEAD` touches only:

- CLAUDE.md, README.md, SPEC.md and DESIGN.md;
- `_round/`;
- `scripts/design_check.py` and `scripts/design/`.

None of those are site inputs.

**The design check run:**

| Check | Result |
|---|---|
| build | strict, blocks read/written equal, 0 pages left as they were |
| overflow | 111 pages x 7 widths = 777 loads, 0 with sideways scroll |
| links | 19,628 internal links, 0 unresolved |
| nav | 14 passed |
| news | 98 passed |
| measure | 902 passed on the rerun |

The first full run flagged one thing in measure: the home page's 21 heading inversions. That count is by design; SPEC section 12, in the full-frame entry, records that the home page's two-column top reads as inversions under the script's rule. The measure check now stores inversions in the baseline and fails only when a page gains one. Every page but the home page has 0. The measure rerun on the same build then passed all 902 checks.

**The names check** reads DESIGN.md's paths, its backticked function, constant and key names, and its CSS classes and custom properties. It found one stale name, "nav_check", which is now "the `nav` check (scripts/design/nav.py)".

## Notes for the next session

- The suite ran on Linux in the cloud, with the repo's `.venv` Python holding Playwright. On the laptop, run it from the system Python 3.13 (HANDOFF.md, "First thing to do on the laptop").
- A full run took 13 minutes here (measure about 5.5, overflow about 5.5).
