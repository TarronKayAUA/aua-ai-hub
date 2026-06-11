# CLAUDE.md

Project memory for Claude Code sessions in this repository. Read SPEC.md before doing any work. SPEC.md is the source of truth for scope and behavior; this file is the source of truth for how to work. The README's "Routine maintenance playbook" covers the most common tasks step by step.

## What this project is

AUA AI Hub: a MkDocs Material site for the American University of Antigua College of Medicine, plus a Python feed-aggregation pipeline and GitHub Actions automation, deployed to GitHub Pages at zero cost. Live at https://tarronkayaua.github.io/aua-ai-hub/ (repo TarronKayAUA/aua-ai-hub). All three SPEC build phases shipped in June 2026, plus owner-approved additions documented in SPEC section 12: videos, podcasts, benchmarks page with a nightly LiveBench table, prompt library with curated learning resources, the Governance section (published AI Responsible Use Policy, committee page, and tool review process), a six-module AI literacy pathway, faculty playbooks, a rolling This Week page with a Friday highlights digest, official AUA branding, visit counter, and the watch/health workflows. The owner is the Assistant Dean of AI in Medical Education and chairs the institution's AI Governance Committee. This is institution-facing work: accuracy and restraint over flash.

## Non-negotiable working rules

1. Never hardcode data values that should come from a source file or feed. News, videos, and podcasts come only from the pipeline; the conference table only from data/conferences.yaml; the tools directory only from data/tools.yaml; the open-weights models section only from data/open_models.yaml; the prompt library only from data/prompts.yaml and its learning resources only from data/prompt_resources.yaml; the setup-video lists only from data/guide_videos.yaml; the Courses and Resources cards only from data/learning_resources.yaml; feed rosters and LLM endpoints/models only from feeds.yaml. If you are about to paste a value into a page or script, stop and wire the data path instead.
2. After any multi-item generation step, print verification counts: inputs read, items kept and dropped, files written. Cross-check totals and fail loudly on mismatch.
3. Before declaring any feature complete, check it against SPEC acceptance criteria and state which criteria were verified and how.
4. Verify external facts instead of guessing. Every feed URL is fetched and parsed before committing (scripts/verify_feeds.py). Conference dates that cannot be confirmed from an official source are written as TBD, never invented; the pipeline never edits data/conferences.yaml (the conference-watch workflow only proposes changes in issues). Library APIs, endpoints, and model identifiers are checked against current documentation, not training memory.
5. Errors in this project are costly to the owner. Prefer a smaller verified step over a larger unverified one.

## Published content style

These rules apply to everything rendered on the site, including pipeline-generated summaries:

- No em dashes anywhere in site copy. Use commas, periods, colons, or parentheses instead. The pipeline post-processes LLM output to enforce this; check generated output too.
- Plain language for medical educators and students. Expand acronyms on first use per page. US English.
- Neutral tone. No hype, no vendor editorializing, no superlatives in news summaries.
- Governance statuses in the tools directory and review statuses in the prompt library are provisional until the AI Governance Committee ratifies them. Provisional banners stay in place. Only the owner changes statuses.

## Stack and commands

- Python 3.11+ (this machine has 3.13 in `.venv\`; run everything as `& ".venv\Scripts\python.exe" ...`). Dependencies pinned in requirements.txt. Pillow is an authoring-only extra for scripts/build_brand_assets.py, deliberately not pinned.
- Local preview: `mkdocs serve`. Validation build: `mkdocs build --strict` (run after any nav or content change; CI gates deploys on it).
- Pipeline dry run: `python scripts/aggregate.py --dry-run --verbose` (always dry-run first and review the verification block before any write-mode run). LLM curation needs GITHUB_TOKEN (GitHub Models) or ANTHROPIC_API_KEY in the environment; without either it falls back to keyword mode and says so in the verification block.
- Checkers: `python scripts/verify_feeds.py` (all feeds), `python scripts/verify_links.py --all-docs` (all links), `python scripts/conference_watch.py` (conference proposal report, read-only).

## Hard-won gotchas

- GitHub Models free tier rejects requests over 8,000 tokens; candidate payloads are budget-packed under `max_payload_chars` in the feeds.yaml llm block. The curation model sometimes mislabels categories, so media curation calls treat any keep as that call's media type.
- GitHub Actions does not expose GITHUB_TOKEN as an env var automatically; workflow steps that need it must set `env: GITHUB_TOKEN: ${{ github.token }}` or curation silently falls back to keyword mode.
- Pushes made with the default GITHUB_TOKEN do not trigger other workflows; refresh.yml builds and deploys itself after committing.
- PubMed and amia.org return 403 to all scripted clients; PubMed RSS URLs are owner-generated through pubmed.gov's Create RSS flow. gamma.app 403s scripts but is live (allowlisted in verify_links.py). YouTube channel ids must come from a channel page's canonical link, not the first channelId in the page source. Podcast RSS URLs resolve reliably through the Apple Podcasts directory API.
- PowerShell 5.1 `Set-Content -Encoding utf8` writes a BOM; restore files with `git checkout --` rather than round-tripping, and use `git commit -F <file>` for multi-line commit messages.

## Repository conventions

- Generated files (never hand-edit, pipeline-owned): docs/news/**, docs/prompts/exchange.md, docs/digest.xml, includes/latest.md, includes/latest-videos.md, includes/livebench.md, includes/community-prompts.md, data/seen_items.json, data/conference_flags.md. The pipeline never modifies hand-authored files. The Exchange page is verbatim community content: style rules and link checks do not apply to it.
- Comments and the community Prompt Exchange run on the repo's GitHub Discussions (giscus partial in overrides/, category ids in feeds.yaml community block). Generated content pages carry comments front matter; moderation is the owner's, through GitHub.
- Owner-owned data files: data/tools.yaml, data/open_models.yaml, data/conferences.yaml, data/conference_watchlist.yaml, data/prompts.yaml, data/prompt_resources.yaml, data/committee.yaml, feeds.yaml, prompts/curator.md, prompts/digest.md. graphics/ holds official AUA logos and member photos; regenerate web assets with scripts/build_brand_assets.py. The approved AI policy on docs/governance/policy.md is verbatim institutional text: never edit its wording, only replace it whole when the owner supplies a newly approved version.
- Secrets exist only as GitHub Actions secrets or local environment variables. Nothing secret in code, YAML, or commit history.
- Commit messages are descriptive. Pipeline commits use the prefix `chore(news): refresh YYYY-MM-DD`.

## Process

- For any new feature or structural change, present a short plan and wait for approval before writing code. Routine maintenance covered by the README playbook needs no plan.
- When SPEC.md and the code disagree, surface the conflict. Do not silently change either one.
- Work in small steps with verification after each. Do not chain multiple unverified changes.
- When uncertain about anything external (a feed URL, a schema, a current model id, a conference date), check rather than guess.
