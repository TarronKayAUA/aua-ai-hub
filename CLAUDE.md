# CLAUDE.md

Project memory for Claude Code sessions in this repository. Read SPEC.md before doing any work. SPEC.md is the source of truth for scope and behavior; this file is the source of truth for how to work. The README's "Routine maintenance playbook" covers the most common tasks step by step.

## What this project is

AUA AI Hub: a MkDocs Material site for the American University of Antigua College of Medicine, plus a Python feed-aggregation pipeline and GitHub Actions automation, deployed to GitHub Pages at zero cost. Live at https://tarronkayaua.github.io/aua-ai-hub/ (repo TarronKayAUA/aua-ai-hub). All three SPEC build phases shipped in June 2026, plus owner-approved additions documented in SPEC section 12: videos, podcasts, benchmarks page with a nightly LiveBench table, prompt library with curated learning resources, the Governance section (published AI Responsible Use Policy, committee page, tool review process, and a Committee Updates page with a self-serve Discussions-mirrored feed), committee polls on the Announcements page, a six-module AI literacy pathway, faculty playbooks, a rolling This Week page with a Friday highlights digest, official AUA branding, visit counter, and the watch/health workflows. The owner is the Assistant Dean of AI in Medical Education and chairs the institution's AI Committee. This is institution-facing work: accuracy and restraint over flash.

## Non-negotiable working rules

1. Never hardcode data values that should come from a source file or feed. News, videos, and podcasts come only from the pipeline; the conference table only from data/conferences.yaml; the tools directory only from data/tools.yaml; the open-weights models section only from data/open_models.yaml; the prompt library only from data/prompts.yaml and its learning resources only from data/prompt_resources.yaml; the setup-video lists only from data/guide_videos.yaml; the Courses and Resources cards only from data/learning_resources.yaml; feed rosters and LLM endpoints/models only from feeds.yaml. If you are about to paste a value into a page or script, stop and wire the data path instead.
2. After any multi-item generation step, print verification counts: inputs read, items kept and dropped, files written. Cross-check totals and fail loudly on mismatch.
3. Before declaring any feature complete, check it against SPEC acceptance criteria and state which criteria were verified and how.
4. Verify external facts instead of guessing. Every feed URL is fetched and parsed before committing (scripts/verify_feeds.py). Conference dates that cannot be confirmed from an official source are written as TBD, never invented. The conference-watch workflow (auto mode since 2026-07-01) may apply a calendar change itself only when it passes every gate: the extraction is grounded in the fetched official page, the dates stay coherent, and the value was stable across two consecutive runs (state in data/conference_watch_state.json, pipeline-owned, never hand-edit). Applied lines carry an auto-verified provenance comment; gate failures become issue proposals; new conferences are always propose-only. Library APIs, endpoints, and model identifiers are checked against current documentation, not training memory.
5. Errors in this project are costly to the owner. Prefer a smaller verified step over a larger unverified one.

## Published content style

These rules apply to everything rendered on the site, including pipeline-generated summaries:

- No em dashes anywhere in site copy. Use commas, periods, colons, or parentheses instead. The pipeline post-processes LLM output to enforce this; check generated output too.
- Plain language for medical educators and students. Expand acronyms on first use per page. US English.
- Neutral tone. No hype, no vendor editorializing, no superlatives in news summaries.
- Governance statuses in the tools directory describe the institution's relationship with a tool (listed | licensed | reviewed | caution | restricted; reframed 2026-07-14 from the review-pipeline vocabulary, owner approved). A listing is not an endorsement, and committee review is request-driven. Review statuses in the prompt library remain provisional until the AI Committee ratifies them, and that provisional framing stays. Only the owner changes statuses in either file.
- Authority register (owner preference, 2026-06-12): status language describes where material is in its process, never an endorsement the owner grants. Authority is attributed to the AI Committee and the policy, not to the Assistant Dean; the role appears as maintainer and contact point only, always without "Office of the". The PHI and FERPA floors stay strict; everything else stays modest.

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
- PowerShell 5.1 `Set-Content -Encoding utf8` writes a BOM; restore files with `git checkout --` rather than round-tripping, and use `git commit -F <file>` for multi-line commit messages. Write the message file with a BOM-free tool (a BOM corrupted the subject of commit e0bf7e6). PowerShell `Select-Object -First N` closes the pipe early and makes the upstream command report failure (a passing `mkdocs build --strict` showed exit 255 this way); check the build's own output, not the chain's exit code.
- The weekly digest fires on the UTC Friday, which is Thursday evening local. To regenerate a week's digest (selection and narrative rerun, archive page overwritten under the same guid): clear `last_digest_week` and `last_digest_at` and drop that week's entry from `digests` in data/seen_items.json, via a one-time script that prints before/after state. The narrative is skipped on dry runs because the call is paid.
- A full `verify_links.py` sweep exceeds a 10-minute foreground window; run it in the background. Media curation is one-shot: a dropped video or news item is recorded as seen and never re-offered, so prompt changes are forward-looking unless specific ledger entries are flipped or un-seen by hand (exactly-once-checked scripts only).
- LiveBench's app bundle stopped labeling releases with a "LiveBench-" prefix (noticed 2026-07-13 after weeks of silent fallback to a stale pinned table). Discovery now probes every date-like bundle token against table_{date}.csv newest-first, so the data endpoint is the source of truth; if the table ever goes stale again, check whether the bundle URL pattern itself changed.
- LLM prompt contracts: models copy example values verbatim. An example drop reason left in the curator output contract ("title is rumor-framed") silently overrode the rule forbidding title-based drops (2026-07-14). Keep every example in a schema or contract consistent with the rules above it.
- MkDocs rewrites markdown link/image paths but NOT raw HTML src/href. With directory URLs, a page at docs/news/foo.md serves from /news/foo/, so raw HTML referencing docs/assets needs ../../assets (the briefs banner bug, 2026-06-11). External SVGs referenced via img cannot read the page's CSS variables, so site artwork under docs/assets is self-contained-color.

## Repository conventions

- Generated files (never hand-edit, pipeline-owned): docs/news/**, docs/prompts/exchange.md, docs/digest.xml, includes/latest.md, includes/latest-videos.md, includes/livebench.md, includes/community-prompts.md, includes/committee-updates.md, data/seen_items.json, data/conference_flags.md, data/conference_watch_state.json, data/page_review_state.json. Exception: includes/prompt-maturity-note.md is hand-authored. The pipeline never modifies hand-authored files, with one field-level exception: the weekly content watch may update only the `last_reviewed` front-matter line of docs pages enrolled in prose page review (scripts/page_review.py), never body text. The Exchange page is verbatim community content: style rules and link checks do not apply to it.
- Comments and the community Prompt Exchange run on the repo's GitHub Discussions (giscus partial in overrides/, category ids in feeds.yaml community block). Generated content pages carry comments front matter; moderation is the owner's, through GitHub.
- Owner-owned data files (the weekly content-watch workflow may update only the `last_reviewed` dates in data/tools.yaml, nothing else; all substantive roster changes go through its issue proposals): data/tools.yaml, data/open_models.yaml, data/conferences.yaml, data/conference_watchlist.yaml, data/prompts.yaml, data/prompt_resources.yaml, data/guide_videos.yaml, data/learning_resources.yaml, data/committee.yaml, data/committee_work.yaml, data/polls.yaml, feeds.yaml, prompts/curator.md, prompts/digest.md, prompts/digest_narrative.md, prompts/section_brief.md. graphics/ holds official AUA logos and member photos; regenerate web assets with scripts/build_brand_assets.py. The approved AI policy on docs/governance/policy.md is verbatim institutional text: never edit its wording, only replace it whole when the owner supplies a newly approved version.
- Secrets exist only as GitHub Actions secrets or local environment variables. Nothing secret in code, YAML, or commit history.
- Commit messages are descriptive. Pipeline commits use the prefix `chore(news): refresh YYYY-MM-DD`.

## Process

- For any new feature or structural change, present a short plan and wait for approval before writing code. Routine maintenance covered by the README playbook needs no plan.
- Issue triage sessions (acting on the automation's GitHub issues) follow .claude/commands/triage.md, invocable in Claude Code as /triage; the file is self-contained instructions for any model.
- When SPEC.md and the code disagree, surface the conflict. Do not silently change either one.
- Work in small steps with verification after each. Do not chain multiple unverified changes.
- When uncertain about anything external (a feed URL, a schema, a current model id, a conference date), check rather than guess.
