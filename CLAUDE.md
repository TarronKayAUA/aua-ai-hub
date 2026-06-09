# CLAUDE.md

Project memory for Claude Code sessions in this repository. Read SPEC.md before doing any work. SPEC.md is the source of truth for scope and behavior; this file is the source of truth for how to work.

## What this project is

AUA AI Hub: a MkDocs Material site for the American University of Antigua College of Medicine, plus a Python feed-aggregation pipeline and GitHub Actions automation, deployed to GitHub Pages at zero cost. The owner is the Assistant Dean for AI in Medical Education and chairs the institution's AI Governance Committee. This is institution-facing work: accuracy and restraint over flash.

## Non-negotiable working rules

1. Never hardcode data values that should come from a source file or feed. News items come only from the pipeline, the conference table only from data/conferences.yaml, the tools directory only from data/tools.yaml. If you are about to paste a value into a page or script, stop and wire the data path instead.
2. After any multi-item generation step (parsing feeds, rendering tables, writing pages), print verification counts: inputs read, items kept and dropped, files written. Cross-check totals (for example, per-category counts must sum to the total kept) and fail loudly on mismatch.
3. Before declaring any phase or feature complete, check it against the acceptance criteria in SPEC.md section 11 and state which criteria were verified and how.
4. Verify external facts instead of guessing. Every feed URL is fetched and parsed successfully before it is committed to feeds.yaml. Conference dates that cannot be confirmed from an official source are written as TBD, never invented. Library APIs, endpoints, and model identifiers that may have changed since training are checked against current documentation.
5. Errors in this project are costly to the owner. Prefer a smaller verified step over a larger unverified one.

## Published content style

These rules apply to everything rendered on the site, including pipeline-generated summaries:

- No em dashes anywhere in site copy. Use commas, periods, colons, or parentheses instead. The pipeline must also enforce this on LLM output by post-processing.
- Plain language for medical educators and students. Expand acronyms on first use per page. US English.
- Neutral tone. No hype, no vendor editorializing, no superlatives in news summaries.
- Governance statuses in the tools directory are provisional until the AI Governance Committee ratifies them. All seed entries stay under_review, the provisional banner stays in place, and statuses are never presented as approved policy. Only the owner changes these.

## Stack and commands

- Python 3.11 or newer. Dependencies pinned in requirements.txt (mkdocs-material, feedparser, PyYAML, requests, python-dateutil, rapidfuzz).
- Local preview: `mkdocs serve`
- Validation build: `mkdocs build --strict` (run after any nav or content change)
- Pipeline dry run: `python scripts/aggregate.py --dry-run --verbose` (always dry-run first and review the verification block before any write-mode run)

## Repository conventions

- Generated files live only at: docs/news/**, docs/digest.xml, includes/latest.md, data/seen_items.json, data/conference_flags.md. Never hand-edit generated files, and never let the pipeline modify hand-authored files.
- Secrets exist only as GitHub Actions secrets or local environment variables. Nothing secret in code, YAML, or commit history. A .env file, if used locally, is gitignored.
- Commit messages are descriptive. Pipeline commits use the prefix `chore(news): refresh YYYY-MM-DD`.
- Workflow gotcha to remember: pushes made with the default GITHUB_TOKEN do not trigger other workflows. The refresh workflow must build and deploy the site itself after committing; do not rely on deploy.yml firing from the pipeline's push.

## Process

- For any new feature or structural change, present a short plan and wait for approval before writing code.
- When SPEC.md and the code disagree, surface the conflict. Do not silently change either one.
- Work in small steps with verification after each. Do not chain multiple unverified changes.
- When uncertain about anything external (a feed URL, a schema, a current model id, a conference date), check rather than guess.
