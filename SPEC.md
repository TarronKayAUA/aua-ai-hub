# SPEC.md: AUA AI Hub

Project specification for an automated AI information hub for the American University of Antigua College of Medicine (AUACOM).

This document is the source of truth for scope and behavior. If implementation needs to deviate from anything here, flag the deviation and confirm with the owner before proceeding. Working rules and style rules live in CLAUDE.md.

- Owner: Assistant Dean of AI in Medical Education (chairs the AUA AI Committee)
- Audience: AUACOM faculty (primary) and students (secondary)
- Visibility: all content is public-facing; the repository is public
- Status: greenfield build

## 1. Goals and constraints

1. A curated reference site: AI basics, a recommended-tools directory with governance status badges, learning resources, and a conference calendar.
2. An automated news layer that refreshes itself nightly from configured feeds, organized into three beats: General AI, Medical Education, and Clinical Practice.
3. A stable weekly digest feed at `docs/digest.xml`. An external Power Automate flow (out of scope for this repo) will watch that feed and email the digest to faculty and student distribution lists. The contract this repo must honor: exactly one new RSS item per weekly digest.

Hard constraints:

- Zero hosting cost. GitHub Pages plus GitHub Actions only. No servers, no databases, no client-side API calls, no paid services required to operate. The LLM curation step must have a free default and a no-LLM fallback.
- Set and forget. One dead feed must never break a run. Failures must surface on their own (workflow failure notifications plus a monthly feed-health report) rather than requiring daily checks.
- Owner-editable. All manual content updates happen by editing markdown or YAML files only. No code changes needed for routine content work.

## 2. Architecture overview

```
feeds.yaml + PubMed saved-search RSS
        |
GitHub Action, nightly cron
        |
scripts/aggregate.py
   fetch -> normalize -> filter -> dedupe -> curate (LLM or keyword)
        |
   writes: docs/news/*.md, includes/latest.md,
           docs/digest.xml (weekly), data/seen_items.json
        |
commit -> mkdocs build -> deploy to GitHub Pages
        |
Power Automate (external) watches docs/digest.xml -> Outlook email
```

Three content classes, strictly separated:

- Hand-authored (pipeline must never modify): everything under `docs/` except `docs/news/` and `docs/digest.xml`; `feeds.yaml`; `data/conference_watchlist.yaml`; `data/tools.yaml`; `data/prompts.yaml`; `data/committee.yaml`; `prompts/curator.md`; `prompts/digest.md`; `prompts/digest_narrative.md`; `prompts/section_brief.md`. `data/conferences.yaml` is shared ownership since 2026-07-01: owner-edited, plus gated auto-updates from the conference-watch workflow (section 13).
- Data-driven (rendered at build time from YAML by the MkDocs hook): the conferences table, the tools directory, the prompt library, and the committee page.
- Generated (humans never hand-edit): `docs/news/**`, `docs/digest.xml`, `includes/latest.md`, `includes/latest-videos.md`, `includes/livebench.md`, `data/seen_items.json`, `data/conference_flags.md`.

## 3. Stack

- Python 3.11+
- MkDocs with the Material theme (latest stable), pymdownx extensions including `snippets` (used to pull `includes/latest.md` into the homepage)
- Libraries: `mkdocs-material`, `feedparser`, `PyYAML`, `requests`, `python-dateutil`, `rapidfuzz`
- GitHub Actions for automation; GitHub Pages deployed via the official `actions/upload-pages-artifact` and `actions/deploy-pages` actions (Pages source: GitHub Actions, not a branch)
- LLM curation (Phase 3): GitHub Models inference as the free default, authenticated with the workflow `GITHUB_TOKEN` using the `models: read` permission. Anthropic API as the alternative when an `ANTHROPIC_API_KEY` secret is present. Automatic fallback to keyword mode when neither is available or on any LLM error. Verify current GitHub Models endpoint, available model identifiers, and current Anthropic model strings from official documentation at build time; do not rely on training-data memory for these.

## 4. Repository layout

```
mkdocs.yml
requirements.txt
SPEC.md
CLAUDE.md
README.md
feeds.yaml
data/
  conferences.yaml
  tools.yaml
  seen_items.json          (generated)
  conference_flags.md      (generated, Phase 3)
prompts/
  curator.md
scripts/
  aggregate.py
includes/
  latest.md                (generated)
docs/
  index.md
  basics/ ...
  tools/ ...
  learning/ ...
  news/ ...                (generated pages live here)
  conferences.md
  announcements/ ...
  about.md
.github/workflows/
  refresh.yml
  deploy.yml
  feed-health.yml
```

If a small helper is needed to render YAML into pages (conferences, tools), prefer an MkDocs hook or a simple pre-build script invoked by the workflows; keep it minimal and document the choice in README.md.

## 5. Site structure and navigation

- Home (`index.md`): hero block with the AUA wordmark and mission line, a card grid for the start-here sections, a "Latest items" block of the 5 newest news items, a "Latest videos" strip, pinned announcements, and a last-updated stamp.
- AI Basics: "How LLMs Work" plain-language primer (roughly 1,200 words, no math), Glossary (terms listed in section 6), and a Common Misconceptions page.
- Tools: index page rendering the directory from `data/tools.yaml` with governance badges, grouped by category.
- Prompts: prompt library rendered from `data/prompts.yaml` (section 12).
- Learning: curated learning paths organized by audience: Faculty getting started, Faculty teaching with AI, Students, and Going deeper (technical).
- News: This Week (rolling trailing-seven-day view, refreshed nightly), Medical Education, Clinical Practice, General AI, Videos, Podcasts, and an Archive of weekly digests organized by ISO week.
- Benchmarks: leaderboard explainer, link cards, and the nightly LiveBench snapshot (section 12).
- Conferences: table rendered from `data/conferences.yaml` (rendering rules in section 6).
- Governance: the approved AI Responsible Use Policy and the AI Committee page (section 12).
- Announcements: index of owner-authored posts under `docs/announcements/`, newest first.
- About: purpose of the site, how content is selected (transparency about the pipeline and the LLM steps), a governance note, a privacy note, a disclaimer (the site is informational, AI-generated summaries may contain errors, readers should verify primary sources, and nothing here is institutional policy unless explicitly marked as such), the maintainer card, and a contact line.

Theme configuration: Material with light and dark toggle, search, navigation tabs, and per-page table of contents. Official AUA branding applied 2026-06-10: palette sampled from the logo artwork (seal blue #07618c primary, wordmark navy #1b4165 dark), white seal header mark, favicon, and hero wordmark, regenerated from `graphics/` by `scripts/build_brand_assets.py`. Site name: "AUA AI Hub".

## 6. Hand-authored seed content (Phase 1)

The builder drafts seed content for every section below; the owner refines afterward. All published-copy style rules in CLAUDE.md apply, including the prohibition on em dashes in site copy.

### Glossary (one short plain-language entry each, alphabetized)

LLM (large language model), token, context window, parameters, weights, training vs. inference, pretraining, fine-tuning, RLHF, prompt, system prompt, prompt engineering, zero-shot and few-shot, chain of thought, reasoning model, hallucination (confabulation), grounding, RAG (retrieval-augmented generation), embedding, vector database, temperature, multimodal, vision model, agent, tool use (function calling), MCP (Model Context Protocol), benchmark, eval, leaderboard, open weights vs. open source, local model, quantization, GPU and VRAM, API, rate limit, latency, knowledge cutoff, jailbreak, guardrails, red teaming, alignment, bias, model card, PHI and FERPA considerations when using AI tools.

### Tools directory (`data/tools.yaml`)

Schema:

```yaml
- name: ""
  vendor: ""
  category: assistants | research | writing_slides | meetings_transcription | media | local
  url: ""
  cost: free | freemium | paid | institutional
  governance_status: under_review   # approved | conditional | restricted | under_review
  status_note: ""
  last_reviewed: YYYY-MM-DD
  blurb: ""   # one sentence, plain language
```

Rules:

- Default every seed entry to `governance_status: under_review`. The builder must not assign approved, conditional, or restricted statuses on its own.
- Badge rendering: approved green, conditional amber, restricted red, under_review grey.
- A visible banner on the Tools index: "Governance statuses are provisional pending AI Committee ratification." Do not remove this banner; only the owner removes it.

Seed entries (builder drafts blurbs; verify each URL resolves): Claude, ChatGPT, Gemini, Microsoft 365 Copilot; Elicit, Consensus, Scite, NotebookLM, OpenEvidence, Semantic Scholar; Gamma, Grammarly; Whisper (local transcription), Microsoft Teams transcription; Ollama, LM Studio, Open WebUI.

### Learning resources

Seed list (verify every link at build time; drop or replace dead ones and note replacements in the commit message): Anthropic Academy courses, DeepLearning.AI short courses, Google AI Essentials, Elements of AI, Andrej Karpathy's "Intro to Large Language Models" lecture, 3Blue1Brown's neural networks video series, plus a medical-education shelf seeded with current AAMC and AMA AI-in-medicine resources.

### Conferences (`data/conferences.yaml`)

Schema:

```yaml
- name: ""
  organizer: ""
  start_date: YYYY-MM-DD   # or TBD
  end_date: YYYY-MM-DD     # or TBD
  location: ""
  format: in_person | hybrid | virtual
  abstract_deadline: YYYY-MM-DD   # or TBD or passed
  url: ""
  tags: [meded, ai, clinical]
```

Seed list: AMEE; the Ottawa Conference; IAMSE; AAMC Learn Serve Lead; IME (Innovations in Medical Education, USC); ASME Annual Scholarship Meeting; AIME (Artificial Intelligence in Medicine); ML4H; CHIL; SAIL.

Date integrity rule: verify dates and deadlines against each conference's official site during the build. Any date that cannot be confirmed is written as TBD. Never invent or estimate a date.

Rendering rules: sort ascending by next relevant date (abstract_deadline if in the future, otherwise start_date); show a "deadline in N days" badge when an abstract deadline is within 45 days; collapse events whose end_date has passed into a "Past events" section; entries with TBD dates sort last with a "dates unconfirmed" badge.

## 7. Feed configuration (`feeds.yaml`)

Schema:

```yaml
defaults:
  lookback_days: 8
  max_items_per_feed: 25
  request_timeout_seconds: 10
categories:
  general_ai:
    label: General AI
    feeds:
      - name: ""
        url: ""
  medical_education:
    label: Medical Education
    feeds: []
  clinical_practice:
    label: Clinical Practice
    feeds: []
keyword_block: [sponsored, webinar replay, crypto, giveaway, promo code]
keyword_boost: [release, benchmark, open weights, local model, medical education, medical student, clinical, FDA, USMLE, assessment, curriculum]
```

Candidate sources follow. Verification rule: every URL must be fetched and successfully parsed by feedparser during Phase 2 before it is committed to `feeds.yaml`. Replace or drop any candidate that fails, and record replacements in the commit message. URLs below marked "verify" are best guesses to be confirmed; unmarked URLs still get the same verification pass.

General AI:

- Simon Willison's weblog (Atom): `https://simonwillison.net/atom/everything/`
- Hugging Face blog: `https://huggingface.co/blog/feed.xml`
- Hacker News filtered via hnrss: `https://hnrss.org/newest?q=LLM+OR+%22language+model%22&points=100`
- r/LocalLLaMA weekly top: `https://www.reddit.com/r/LocalLLaMA/top/.rss?t=week`
- arXiv cs.CL: `https://rss.arxiv.org/rss/cs.CL` (high volume; the curation layer is expected to trim aggressively)
- Ars Technica AI section feed (verify exact URL)
- LMArena blog feed for benchmark movements (verify)

Medical Education:

- PubMed saved-search RSS (see PubMed note below). Suggested query:
  `("artificial intelligence"[tiab] OR "large language model*"[tiab] OR ChatGPT[tiab] OR "machine learning"[tiab]) AND ("medical education"[tiab] OR "medical student*"[tiab] OR "undergraduate medical education"[tiab] OR residen*[tiab] OR "health professions education"[tiab])`
- JMIR Medical Education table-of-contents feed (verify)
- NEJM AI table-of-contents feed (verify)
- Medical Teacher table-of-contents feed (verify)
- Academic Medicine table-of-contents feed (verify)

Clinical Practice:

- PubMed saved-search RSS. Suggested query:
  `("artificial intelligence"[tiab] OR "large language model*"[tiab] OR "machine learning"[tiab]) AND ("clinical decision support"[tiab] OR diagnos*[tiab] OR "patient safety"[tiab] OR "clinical workflow"[tiab])`
- npj Digital Medicine: `https://www.nature.com/npjdigitalmed.rss` (verify)
- The Lancet Digital Health table-of-contents feed (verify)

PubMed note: PubMed generates RSS URLs server-side. Run each query at pubmed.gov, click "Create RSS", set the item limit to 50, and paste the resulting URL into `feeds.yaml`. The builder may do this via browser-equivalent fetch if feasible; otherwise mark these entries `url: TODO-OWNER` and list them in the Phase 2 handoff notes. The owner may later refine the queries in PubMed and regenerate the URLs without touching code.

## 8. Aggregation pipeline (`scripts/aggregate.py`)

Behavior, in order:

1. Load `feeds.yaml`. Fetch every feed with the configured timeout and up to 2 retries. Per-feed error isolation is mandatory: a failed feed is logged and counted but never aborts the run. Exit nonzero only if every feed fails.
2. Normalize entries to: title, url, source name, published datetime (timezone-aware UTC; entries without a parseable date are skipped and counted), and summary (HTML stripped, truncated to 500 characters).
3. Apply the lookback window from `defaults.lookback_days`. Discard any item whose title or summary matches a `keyword_block` term (case-insensitive).
4. Deduplicate: canonicalize URLs (strip utm_* and similar tracking parameters, normalize trailing slashes) and drop exact URL matches; then drop fuzzy title duplicates across feeds using rapidfuzz ratio >= 92; then drop anything already present in `data/seen_items.json`, a rolling 60-day ledger of canonical URLs and title hashes that the pipeline updates each run and commits. First run bootstraps an empty ledger and is bounded by the lookback window.
5. Curate, in one of two modes (section 9): LLM mode when available, otherwise keyword mode (score by `keyword_boost` matches plus source weight, keep top N per category, use original summaries). The verification printout must state which mode ran.
6. Write outputs:
   - `docs/news/general-ai.md`, `docs/news/medical-education.md`, `docs/news/clinical-practice.md`: the latest 15 kept items each, newest first. Each item renders as a linked title, source name, date, and one-sentence summary.
   - `includes/latest.md`: the 5 newest kept items across all categories, for the homepage include.
   - Every run: regenerate `docs/news/this-week.md` as a rolling view of everything kept in the trailing seven days (owner-approved change, 2026-06-10; the page is current every day rather than a frozen weekly snapshot).
   - Weekly, on the configured digest day (feeds.yaml `digest:` block, default Friday) when the ISO week has not yet had a digest: run a second-stage highlights selection over everything kept since the previous digest (instructions in `prompts/digest.md`, per-type budgets in the digest block, score-plus-recency fallback when no LLM is available), write the highlights plus an "Also this week" link list to `docs/news/archive/<year>-w<week>.md`, and regenerate `docs/digest.xml` with the highlights. The digest item links to that archive page, which is the stable mirror of the email. The digest also opens with a "Conference calendar updates" section when the human-curated calendar changed since the previous digest (additions and field changes for future events, detected by diffing against a snapshot stored in the ledger at each digest); the pipeline reports calendar changes but still never makes them.
   - `data/seen_items.json` updated and pruned to 60 days.
7. Print the mandatory verification block (owner's standing rule): feeds attempted, succeeded, failed (named); raw item count; counts after window, after block-filter, after dedupe; kept per category; files written with per-file item counts; curation mode used. Assert that category counts sum to the total kept and fail loudly on mismatch.
8. CLI flags: `--dry-run` (no writes), `--no-llm`, `--since-days N`, `--verbose`.

Digest contract (consumed by Power Automate): `docs/digest.xml` is valid RSS 2.0. Exactly one new `<item>` is added per weekly digest, with a stable guid of the form `aua-ai-digest-<year>-W<week>`, a title like "AUA AI Hub Digest: Week of <date>", and a description containing the digest as simple HTML: an opening "The week in brief" narrative when one was generated (see section 12), then category headings, linked items, and one-sentence summaries. The channel retains the 12 most recent digests.

## 9. LLM curation (Phase 3)

- The curator system prompt lives in `prompts/curator.md` so the owner can tune it without touching code. Requirements for that prompt: audience is medical school faculty and students; plain language; neutral on vendors; no hype or superlatives; select at most 12 items per run; prefer model releases, benchmark movements, open-weights and local-model news, peer-reviewed medical education findings, and clinical deployment or regulatory news; drop funding gossip, listicles, and near-duplicates of already-covered stories; write a one-sentence summary of at most 35 words per kept item; set `is_cfp` true for conference or call-for-papers announcements.
- Strict JSON output contract (full coverage, owner approved 2026-07-02): the model returns one entry for every candidate sent, kept or dropped. Dropped entries carry `"keep": false` and a short `reason` naming the rule applied; the reasons flow to the verbose run log and to the dropped item's ledger stub, so any curation decision can be audited afterward instead of guessed at (the change that motivated it: four wrongly dropped videos whose reasons were unrecoverable). Full coverage also makes silent truncation detectable: a response that omits candidates fails parsing on the first attempt (corrective retry), and on the second attempt unaccounted candidates become drops with a placeholder reason. Reasons are the model's self-report, useful for prompt debugging, not ground truth.

```json
{"items": [{"id": "", "keep": true, "category": "general_ai", "summary": "", "importance": 3, "is_cfp": false}, {"id": "", "keep": false, "reason": ""}]}
```

- One batched call per run for news (a second, separate batched call covers video candidates; see section 14). Cap news candidates sent to the LLM at 120, selected by keyword score descending; truncate each candidate to a 140-character title plus a 100-character summary, and greedily pack candidates under the provider's payload budget (GitHub Models' free tier caps requests at 8,000 tokens; the budget lives in the `llm:` block of feeds.yaml). On JSON parse failure, retry once with a corrective instruction, then fall back to keyword mode. Log the outcome in the verification block.
- CFP-flagged items are appended to `data/conference_flags.md` for owner review. The pipeline never edits `data/conferences.yaml` itself; conference data changes stay human-in-the-loop.
- Post-process every LLM summary before publishing: replace any em dash with a comma or period, enforce the 35-word cap, strip any markdown or HTML the model included, and reject empty summaries (fall back to the feed's own summary).
- Provider selection order: `ANTHROPIC_API_KEY` present, use the Anthropic API with an inexpensive current model (verify current model strings from official docs at build time; make the model id a config value, not a literal scattered through code); else, when running in Actions with models access, use GitHub Models; else keyword mode.

## 10. Workflows

`refresh.yml`:

- Triggers: `schedule` with six cron slots every four hours (`20 0,4,8,12,16,20 * * *`), plus `workflow_dispatch`. Changed from two morning slots on 2026-07-01: GitHub runs cron best-effort, and observed delays grew from occasional to a consistent 5 to 11 hours on every slot through June 2026, so scheduled times cannot be trusted; six slots blanket the day so content lands morning, midday, and evening local (UTC-4) whatever the delay. Multiple runs are harmless and cheap (ledger dedupe means fresh items are curated exactly once, briefs are hash-gated, digest fires at most once per ISO week, commit only on change; extra cost is per-call overhead, cents per month).
- Permissions: `contents: write`, `models: read`, `pages: write`, `id-token: write`.
- Concurrency group `refresh`, no cancel-in-progress. Timeout 15 minutes.
- Steps: checkout; set up Python with pip caching; install requirements; run `scripts/aggregate.py`; if `git diff` shows changes, commit as `chore(news): refresh YYYY-MM-DD` and push; then build with `mkdocs build --strict` and deploy to Pages within this same workflow.
- Critical gotcha this design exists to handle: pushes made with the default `GITHUB_TOKEN` do not trigger other workflows. The refresh workflow therefore must build and deploy itself rather than relying on `deploy.yml` to fire.

`deploy.yml`:

- Triggers: `push` to main (covers the owner's manual content edits) plus `workflow_dispatch`.
- Steps: `mkdocs build --strict`, upload Pages artifact, deploy.

`feed-health.yml`:

- Triggers: monthly cron plus `workflow_dispatch`.
- Attempts every feed in `feeds.yaml`. If any fail, open or update a single GitHub issue titled "Feed health: N feeds failing" listing the failures. GitHub's own notification email to the owner is the alert mechanism; no external services.

## 11. Build phases and acceptance criteria

Phase 1, static site:

- `mkdocs build --strict` passes and the site deploys to GitHub Pages.
- The conferences table renders from YAML only. Test: change one date in `data/conferences.yaml`, rebuild, and confirm the table changes.
- Tools badges render from `data/tools.yaml`; every seed entry is `under_review`; the provisional-status banner is present.
- Every seed link in Learning and Tools was fetched successfully during the build (no committed 404s).

Phase 2, pipeline in keyword mode:

- Every feed URL committed to `feeds.yaml` was verified parseable.
- `python scripts/aggregate.py --dry-run --verbose` prints the full verification block and exits 0.
- A deliberately broken feed URL in a test configuration does not abort the run; it is isolated and counted.
- News pages populate; running the pipeline twice in a row produces no duplicate items (seen ledger works).
- One manual `workflow_dispatch` of `refresh.yml` updates the live site end to end with no manual steps.

Phase 3, LLM curation and digest:

- A real run produces valid JSON from the curator and publishes post-processed summaries.
- The fallback path is exercised by simulating an LLM failure and the run still completes in keyword mode.
- `docs/digest.xml` validates as RSS 2.0 and gains exactly one new item per weekly snapshot, with a stable guid.
- The em-dash post-processor is verified with a test string containing one.

All phases:

- No secrets in the repository (search for common key patterns before each phase sign-off).
- No data values hardcoded anywhere a data file should be the source.

## 12. Videos and visual presentation (scope addition, owner approved 2026-06-10)

### Curated video feeds

- `feeds.yaml` carries a `video_feeds` section: a list of YouTube channels (name plus channel_id; the RSS URL derives as `https://www.youtube.com/feeds/videos.xml?channel_id=<id>`), a lookback window, a per-run keep budget, and page/homepage item counts. Channel ids are resolved from the channel's own page (canonical link) and verified with feedparser before committing, the same rule as news feeds. `scripts/verify_feeds.py` checks them alongside news feeds.
- The pipeline fetches channels with the same per-feed error isolation, applies the video lookback window and keyword blocklist, skips YouTube Shorts, dedupes by canonical URL and the seen ledger (no fuzzy-title pass: distinct channels legitimately cover the same story), and curates with a second, videos-only LLM call using the same curator prompt and JSON contract. Any kept decision in that call is a video regardless of the category label the model returns. Keyword fallback: newest first, at most two per channel, up to the keep budget.
- Outputs: `docs/news/videos.md` (one thumbnail card grid per section in `video_feeds.groups`, newest first within each, capped per section; a video's section comes from its channel's `group` key, owner-assigned, never from model labels; empty sections do not render) and `includes/latest-videos.md` (homepage strip, `home_items` cards, ungrouped). Video cards show thumbnail, title, channel, and date, and link out to YouTube; nothing is embedded and no YouTube scripts load on the site. Thumbnails hotlink YouTube's standard `i.ytimg.com` images. The weekly digest gains a Videos section.
- Channel roster changes are owner edits to feeds.yaml only. Roster as approved: Matthew Berman, Two Minute Papers, Bijan Bowen, WorldofAI, AI Search, Wes Roth, Anthropic, OpenAI, Google DeepMind, AI Explained, IBM Technology, Yannic Kilcher; Stanford AIMI added 2026-06-12 (owner approved; `group: medical`, 90-day per-channel lookback for its monthly seminar cadence); Stanford MedAI, The Medical Futurist, and Radiology: Artificial Intelligence added 2026-07-02 (owner approved, same medical-group pattern, ids from canonical links and feeds verified) so the Medical AI section has more than one supplying channel. Optional per-channel keys: `group` (Videos page section, default general) and `lookback_days`. Owner editorial rule, 2026-06-12, narrowed 2026-07-02: videos whose titles are built on shock phrasing, drama, rumor framing, or innuendo are dropped regardless of content quality, because titles render verbatim on an institution-facing page; a single emphasized word or a question mark does not disqualify a substantive test or comparison (encoded in prompts/curator.md). Small-batch calibration, 2026-07-02: the six-slot refresh schedule means a media curation call may contain only one or two candidates, so the curator prompt instructs per-item judgment rather than list-relative targets (the June "target 8 to 12" wording silently zeroed the keep rate on small batches); four wrongly dropped videos from that stretch were un-seen by an exactly-once script the same day.

### Video descriptions

- The curator writes a one-sentence description (35-word cap, same style rules as news summaries) for every kept video, rendered under the card so readers know what a video covers before clicking. In keyword fallback mode videos carry no description; raw YouTube descriptions are never published.

### Benchmarks page (owner approved 2026-06-10)

- `docs/benchmarks.md` is hand-authored: a plain-language explainer on reading leaderboards plus link cards to Artificial Analysis, LiveBench, BenchLM, and LMArena.
- The LiveBench snapshot table is generated nightly into `includes/livebench.md` and pulled in via snippets. The pipeline discovers the current LiveBench release id from the site's app bundle (falling back to a pinned version in the `benchmarks:` block of feeds.yaml), fetches the published per-task CSV and category mapping, computes category averages and the global average the way LiveBench's own leaderboard does, and renders the top N models with attribution and an as-of date. On any failure the previous snapshot is kept and the verification block says so; the build never breaks on upstream changes.

### Podcasts (owner approved 2026-06-10)

- `feeds.yaml` carries a `podcast_feeds` section mirroring `video_feeds`: a list of shows (name plus RSS url, resolved through the Apple Podcasts directory and verified with feedparser), a lookback window, a per-run keep budget, and a page item count. The pipeline ingests episodes with the same isolation, blocklist, and ledger dedupe as videos, curates them with a focused LLM call (up to 8 kept per run, one-sentence description each), and renders `docs/news/podcasts.md` as a card grid using each show's artwork. Cards link to the episode's own page; nothing is embedded. The weekly digest's media section includes kept episodes.

### Prompt library (skeleton, owner approved 2026-06-10)

- `data/prompts.yaml` is hand-authored, owner-owned data: each entry has title, category (research, mcq_generation, mcq_vetting, data_analysis, content_generation), audience, status (draft or reviewed), last_reviewed, notes, and the prompt text. The render hook builds `docs/prompts/index.md` from it: prompts grouped by category, status and audience badges, prompt text in copyable code blocks, with a visible drafts-pending-review banner. Seed entries are placeholders the owner iterates on; only the owner flips status to reviewed.

### Operational additions (owner approved 2026-06-10)

- `link-health.yml`: monthly workflow running `scripts/verify_links.py --all-docs` (data files plus every hand-authored page, excluding the generated news tree); opens or updates a single "Link health: N links failing" issue and closes it on recovery.
- A privacy-respecting visit counter (GoatCounter, cookie-free, site code tarronkay) runs from `docs/javascripts/counter.js` and is disclosed on the About page. This amends the section 13 exclusion of analytics, by owner decision.
- `content-watch.yml`: weekly workflow running `scripts/content_watch.py` (owner approved 2026-07-01). Two inputs: the week's kept news read against the tools and open-models rosters by the feeds.yaml `content_watch` task (claude-sonnet-5, one call), and a rotation of the twelve tools entries with the oldest `last_reviewed` dates, whose pages are fetched and checked by the `content_verify` task (claude-haiku-4-5). The only automatic write is bumping `last_reviewed` on entries verified alive-and-accurate (the bump is the rotation state; the full directory cycles roughly monthly); every substantive change (add, remove, reword, recost) is proposed in a "Content watch" GitHub issue with reasons and evidence links, ready for the owner or a future model session to apply. Synthesis recommendations must cite one of the week's item URLs or they are dropped. Roughly 25 to 50 cents per month.
- `conference-watch.yml`: every-second-day workflow running `scripts/conference_watch.py`, which fetches each official page in `data/conferences.yaml` plus the recurring events in `data/conference_watchlist.yaml`, has the LLM (feeds.yaml task conference_watch, claude-haiku-4-5, ~2-3 cents a run) extract explicitly stated dates for the next edition, and filters non-actionable noise (past editions, cosmetic location rewording, deadlines already marked passed). Since 2026-07-01 (owner approved) the default mode is auto: a changed field is applied to `data/conferences.yaml` only when it passes every gate: the model's evidence quote appears verbatim in the fetched page, the entry stays date-coherent (end after start, deadline before start, nothing in the past), and the same value was extracted on two consecutive runs (tracked in `data/conference_watch_state.json`, pipeline-owned). Applied lines carry an inline `# auto-verified YYYY-MM-DD` provenance comment, the workflow commits the change, and the next refresh run deploys it; the weekly digest's conference-updates section picks the change up automatically via the ledger snapshot. Anything failing a gate becomes a GitHub issue proposal with evidence and source links, new conferences (watchlist findings) are always propose-only, and `mode: propose` in the feeds.yaml `conference_watch` block turns all writing off. The date-integrity rule is amended, not repealed: published dates come from the official page fetched at runtime, never from model memory, and never estimated.

### Governance section (owner approved 2026-06-11)

- `docs/governance/policy.md` carries the approved AI Responsible Use Policy verbatim (currently the version effective July 30, 2025), headed by a status block with effective and last-update dates. Only approved policy text is ever published; drafts under committee review never appear. When a revised policy is approved, the page is updated and the superseded version is archived with clear status labeling. The policy was scanned before publication and contains no emails, URLs, or internal-only references. Source document retained in `documents/` (not deployed).
- `docs/governance/committee.md` lists the AI Committee from `data/committee.yaml` (owner-owned), rendered by the hook as photo cards with name, committee role badge, and title/affiliation lines. Per owner decision, no institutional email addresses appear on the public page. Member photos live in `graphics/` and are processed to `docs/assets/committee/` by `scripts/build_brand_assets.py`.

### Comments and community Prompt Exchange (owner approved 2026-06-11)

- Comments run on giscus backed by the repo's public GitHub Discussions (Announcements category, pathname mapping, reactions on). The partial lives at `overrides/partials/comments.html` (theme `custom_dir: overrides`) and activates on pages whose front matter sets `comments: true`; the pipeline emits that front matter on all generated content pages (This Week, the three news categories, Videos, Podcasts, and weekly digest archive pages). Posting requires a free GitHub account, stated next to every widget and in the About privacy section. The widget theme follows the site's light/dark palette.
- The community Prompt Exchange is a Discussions category (node id pinned in the `community:` block of feeds.yaml so renames are safe). The nightly pipeline queries the GraphQL API for the category's discussions and renders two generated artifacts: a top-voted rail in `includes/community-prompts.md` for the library page, and a full on-site board mirror at `docs/prompts/exchange.md` (every post's body HTML-escaped and shown as posted, sorted by votes, capped per the config, welcome post excluded, vote/reply links back to GitHub, keep-last-good on failure). Because the Exchange page is verbatim community content, the no-em-dash rule and the link-health scan do not apply to it. Community prompts enter the reviewed library only through owner testing and promotion, with contributor credit. A welcome post (discussion 2) documents the sharing format and ground rules (no PHI, FERPA data, or exam content).
- Moderation happens through GitHub's Discussions tools under the owner's account, manual by design (flag-first automation can be added later if volume demands it).
- A community standards line (professional discussion; no patient information, student records, or exam content; content subject to moderation; linked to the AI Responsible Use Policy) appears above every comment box (`overrides/partials/comments.html`), in the Exchange page intro (pipeline-generated), and in the About page's Comments and feedback section. The wording was ratified by the committee chair on 2026-06-11; edit in those three places to change it.

### Prompt learning resources, expanded tools directory, and local guide (owner approved 2026-06-10)

- `data/prompt_resources.yaml` (owner-owned) holds curated learning resources for the Prompt Library, every URL verified before commit. Entries with category `general` render in a "Learning to prompt" section at the top of the library page; entries with a prompt category render as "Further reading" under that category's prompts. Selection bar: evergreen quality reflecting current prompting practice (role, context, examples, structured output, reasoning models), with peer-reviewed items preferred for category entries. `scripts/verify_links.py` collects the file, and treats a 403 reached through a doi.org link as resolved since doi.org returns 404 for unknown DOIs.
- Tools directory expansion: the Assistants category includes the major Chinese consumer assistants (DeepSeek, Qwen Chat, Kimi, Z.ai), each with a status note that the service is operated from China and data-handling terms need review before institutional use. A Medical Learning category lists student-facing study tools (Neural Consult, Thea, Medical Student AI, Nabu Tutor, Oncourse AI); listings are not endorsements, per the About disclaimer, and exam-prep accuracy claims are the vendors' own. StepGenie was listed at launch and removed on 2026-06-11 after three same-day signals (TLS certificate failing strict verification, scripted clients blocked, and the campus firewall categorizing the domain as phishing); it may return if the certificate and categorization both clear.
- `data/open_models.yaml` (owner-owned) renders an "Open-weights models" section at the bottom of the tools page through its own marker, beneath hand-authored prose explaining what open weights means: model families (gpt-oss, Llama 4, Gemma 4, Qwen3, DeepSeek, Kimi K2, Mistral) shown with vendor, license chip, and blurb. Entries carry a license instead of a cost and governance badge because they are model families, not hosted services; blurbs may name current flagship releases, with last_reviewed marking staleness.
- Prompt library, first real content (owner approved 2026-06-12): the NBME-style question tutor (students, `reviewed`; owner co-authored) plus flagship rewrites of all five faculty prompts (`draft` pending the owner's cross-provider testing). Shared design philosophy, recorded here because it should govern future entries: every prompt engineers against its task's specific failure modes (grounding rules with honest exits, strict output contracts, silent self-verification, interaction defaults), and embedded exemplars are always original, never question-bank items. The library page carries a cross-model disclaimer (prompts target current US frontier assistants; output varies with capability, provenance, version, and context). Owner decision 2026-06-12: prompts do not police what sources users attach (an unenforceable refusal erodes the guidance the site can stand behind); the PHI/FERPA floors are the non-negotiables.
- Site voice (owner directive 2026-06-12, rule recorded in CLAUDE.md): status language describes process, never an endorsement the owner grants; authority is attributed to the AI Committee and the policy; the Assistant Dean appears as maintainer and contact point only, without "Office of the". Curation category discipline added to prompts/curator.md the same day: general_ai is general technology news only, medical-topic items route to the medical categories or drop, and preprints need broad significance (the audience calibration sets the significance bar, not a topic preference).
- Visual refinements (owner approved 2026-06-12): extra air above h2 section starts, digest archive pages open with docs/assets/section-digest.svg (emitted by render_digest_archive), video card descriptions clamp at three lines, news-list gap 0.85rem, and tool directory cards show favicon branding derived from each tool's domain via Google's favicon service (no data field; onerror-hidden; open-weights models deliberately excluded to avoid repeated vendor logos).
- Hardware for Local AI guide (owner approved 2026-07-02): docs/tools/hardware.md, hand-authored companion to the local quick-start, teaching one verifiable estimate (tokens per second ceiling = memory bandwidth / active bytes per token) instead of stale product rankings or unmeasured benchmark claims. Covers the memory hierarchy (VRAM, unified memory, RAM, SSD, HDD) with representative bandwidths, quantization bytes-per-parameter, dense vs mixture-of-experts (total parameters size memory, active parameters set speed), KV-cache working memory, laptop thermals, NPU expectation-setting, a dated memory-market note (32GB DDR5 near $375 mid-2026 vs $80-120 a year prior, cited), and a what-you-probably-own triage table. Two JS widgets in docs/javascripts/hardware.js: a TPS feel demo (types a passage at selectable rates; explicitly a simulation, not a benchmark) and an estimator computing fit and speed bands from data/local_models.yaml (parameter counts verified from Hugging Face safetensors metadata) and data/hardware_tiers.yaml (capacity-tier based by design, so it does not stale like product lists), both owner-owned and rendered through a data island by render_data.py with cross-checks; a static Q4 sizing table is the no-JavaScript fallback.
- Getting Better Answers guide (owner requested 2026-07-02): docs/basics/better-answers.md, hand-authored, in Learn > Reference directly after How LLMs Work. The user-skills companion to the hardware page's machine-side view of context: one window but two budgets (input versus the much smaller per-reply output cap, with no numeric caps stated because they stale; outline-then-sections is the pattern for long deliverables), context flooding (attention dilution, misleading off-topic material, attachment token cost; the curate-then-place habit, with NotebookLM as the off-ramp when sources genuinely exceed the window; lost-in-the-middle cited to Liu et al. 2023 and scoped as substantially reduced in newer models), conversation drift and the summarize-and-carry recovery, memory as retrieval-not-learning with the PHI/FERPA floor and its mechanism (memory off or a temporary chat, delete entries that slip through), standing instructions (short and stable; role and defaults in instructions, task in the message, matching the prompt library's paste-into-Project notes), and a six-item pre-task checklist opening with the sensitive-data gate. Cross-linked four ways: from How LLMs Work's context-window figure, from the hardware page's KV-cache paragraph, from the prompt library's two-habits line, and out to the Prompting Fundamentals module and prompt library. Carries three inline SVG figures (window-budget diagram with the output cap drawn to scale, approximate token-cost comparator, summarize-and-carry flow) and an interactive token estimator (docs/javascripts/better-answers.js): words x 4/3 tokens computed entirely in the browser against two representative window sizes labeled as such, never product claims.
- Site-wide visual pass (owner approved 2026-07-02): the goal is rhythm without decoration, so every added visual is an original inline SVG figure in the established house style (theme CSS variables, dark-mode safe, captioned, one figure per page encoding that page's load-bearing structure), never stock imagery. A text-density audit (words per visual anchor, counting figures, admonitions, tables, widgets, and render markers) ranked the hand-authored pages; the first batch added figures to the nine worst: misconceptions (trust-by-provenance panels), the three playbooks (drafts-vs-decides swimlane; the exam-items bright line; syllabus tiers on the shared policy floor), the research guide (six-stage pipeline mapped to tools), the local guide (where-your-text-goes lanes), the review process (gate-domain flow with annual re-review loop), the About page (sources through nightly pipeline to generated sections), and the Prompting Fundamentals module (anatomy of a strong request with the iteration loop). Excluded by design: the verbatim policy page, the glossary, card-grid landing pages, and all pipeline-generated pages. pymdownx.tasklist (custom_checkbox) was enabled in the same pass so the playbook checklists render as checkboxes instead of literal brackets. Remaining pathway modules already sit below the density threshold thanks to their self-check admonitions; a second batch added figures only where a diagram carries the page's core structure: the agent loop inside its permissions boundary (agents guide), the data gate before every paste (Rules), the caution gradient across teaching tasks (Teaching and Assessment), the three zones of research AI use (Research and Scholarship), and the two clinical worlds over the shared data floor (Clinical Contexts). Module 1 stays figure-free by design: it defers to How LLMs Work, which carries the diagrams. The site is now at one structural figure per hand-authored teaching page; further additions should clear the same bar, not chase coverage.
- AI for Research guide (owner approved 2026-07-01): docs/tools/research.md, hand-authored in the Tools nav following the agents/local pattern (guide page plus directory category). Brand-agnostic, organized by research task (discovery and mapping, screening and extraction, evidence questions, source-grounded synthesis, analysis and agentic workbenches, writing and disclosure), with a dated cost table, AUA field-fit notes (medical education vs bench science vs clinical), and guardrails stated plainly: verify every citation, check the journal's ICMJE-style AI policy, keep IRB-covered and unpublished data out of consumer tools. Claude Science (Anthropic's beta local-first research workbench, paid plans, macOS/Linux with WSL for Windows) and ResearchRabbit joined the Research category; OpenEvidence's entry carries the US-credentials access caveat (NPI or US medical school; withdrew from UK/EU spring 2026). Deep-research modes are covered in the guide text, not as directory entries, because they are features of assistants already listed.
- Media generation and presentations expansion (owner approved 2026-06-12): four new directory categories. Presentations and Design (Claude Design, PowerPoint Designer, Canva, Beautiful.ai, plus Gamma moved from the renamed Writing category) carries a category intro answering the faculty question of improving an existing .pptx in place; category intros are a render_data.py feature (CATEGORY_INTROS). Image Generation (Midjourney, GPT Image, ImageFX, Adobe Firefly, Ideogram), Video Generation (Veo via Flow, Runway, Kling, Hailuo, HeyGen, Synthesia; OpenAI's Sora is deliberately absent, discontinued April 2026), and Music and Audio (Suno, Udio, ElevenLabs). Chinese services carry the standard China data-handling note; avatar and voice tools carry a documented-consent note; Suno carries a training-data litigation note. The open-weights section gained a `modality` field (language default, image, video, audio) rendered as subsections: FLUX.1, Stable Diffusion 3.5, Qwen-Image; Wan, HunyuanVideo, LTX-Video; MusicGen, Stable Audio Open, ACE-Step, licenses verified against Hugging Face card tags. midjourney.com and claude.com joined the verify_links manual allowlist (both block scripted clients; confirmed live).
- `docs/tools/local.md` (Running AI Models Locally, in a Tools nav section alongside the directory) is a hand-authored guide: why run models locally and the honest trade-offs, memory rules of thumb, the simple chat path (LM Studio, Ollama, Open WebUI), beyond-chat tooling (ComfyUI for local image and video generation, Whisper for voice), and a governance admonition that the AI Responsible Use Policy applies regardless of where a model runs.

### Literacy pathway, playbooks, and review-process page (owner approved 2026-06-10)

- `docs/pathway/` is a hand-authored six-module AI literacy pathway (How AI Works, Prompting Fundamentals, The Rules, Teaching and Assessment, Research and Scholarship, Clinical Contexts). Each module carries audience and time, learning objectives, a focused core leaning on existing pages rather than duplicating them, collapsible scenario self-checks with answers, and the CGEA/AAMC educator-competency domain it maps to (the six modules cover all seven domains of the CGEA framework, linked from the pathway overview). The Rules module is grounded only in the policy version currently in force; when a revised policy is ratified, this module is part of the alignment pass. The pathway serves the policy's training-resources commitment; formal designation as required training is a committee decision. Nav: the "AI Basics" group became "Learn" (pathway first, the three basics pages under Reference, the Learning page as Courses and Resources).
- `docs/playbooks/` holds hand-authored task-level walkthroughs with a fixed shape: where AI helps and hurts, what to gather first, the workflow with linked prompt-library templates, task-specific guardrails, and a verification checklist. First three (faculty-facing): Preparing a Lecture, Writing and Vetting Exam Questions (bright line: finalized secure items, keys, and licensed bank content never enter public AI tools), and Your Syllabus AI Statement (three adaptable template tiers: restrictive, disclosure-based, encouraged). Top-level Playbooks nav section; homepage card replaces the Learning card.
- `docs/governance/review-process.md` (How Tools Are Reviewed) publishes the tool review rubric: screening facts confirmed from vendor terms, six scored domains with data privacy as a gate domain that caps outcomes, statuses mapped to the directory badges with approvals naming the sensitive data categories they cover, annual re-review. Provisional banner pending committee ratification. The iteration draft lives in `documents/tool-review-rubric-DRAFT-v1.md` (not deployed).
- For Students page (owner approved 2026-07-02, launch preparation): docs/students.md, top-level nav entry after Playbooks, plus a homepage card (the Start here grid went from four cards to six, adding For Students and Prompts, so the second row pairs the two audience entries). Purely a routing page: the three essential pathway modules, the data rules restated in student terms strictly from module 3 and the policy (no new interpretation), the Medical Learning tools and the reviewed question tutor, Getting Better Answers, clinical-site expectations, and participation routes. It deliberately does not answer "can I use AI for this assignment"; that remains the student FAQ, still gated on policy ratification. A pre-launch mobile and accessibility sweep (14 pages at 375px, programmatic: overflow, image alt, heading order, empty links, unlabeled controls) found no real defects; two accepted notes are Material's own copy buttons (title-attribute naming) and pymdownx task-list checkboxes (disabled, non-focusable, standard markup). Both deploy jobs (deploy.yml, refresh.yml) auto-retry the Pages deployment twice on a lengthening backoff (90 then 180 seconds) when GitHub Pages returns its transient "try again later" rejection, which fired repeatedly on 2026-07-02/03 including one stretch that outlasted a single 60-second retry; a persistent outage still fails the run on the third attempt, and the six-slot refresh schedule redeploys the site regardless.
- Deliberately not built yet: the student FAQ page (waiting on ratification of the revised policy so it is grounded in approved text), and a Local Voices section (waiting for local content, possibly a podcast). Local Voices design is owner-approved (2026-06-10) and ready to build when the first content exists: an owner-owned data file (local_voices.yaml) rendered by the hook as featured cards (person, one-line description, thumbnail linking to the video or episode), its own top-level nav entry, and a homepage card; if the content is a podcast with an RSS feed, the feed is also added to podcast_feeds so episodes flow to the Podcasts page automatically. Do not publish the section with zero entries.

### Agents, setup videos, cloud GPUs, and media benchmarks (owner approved 2026-06-11)

- The tools directory gains an Agents category (Claude Code, Cowork, Codex, ChatGPT Agent Mode, Manus, Comet, OpenClaw), and `docs/tools/agents.md` is the companion guide: agent loop explained plainly, the field organized by where the agent lives, a risk model covering consequential actions and prompt injection, and guardrails citing only the policy in force (agent-specific provisions join the post-ratification alignment pass).
- `data/guide_videos.yaml` (owner-owned) holds curated setup and walkthrough videos rendered into the agents and local pages via `render:guide-videos:agents` and `render:guide-videos:local` markers. Verification bar: every entry checked before commit via YouTube's oEmbed (live, channel, title) plus duration and upload date from the watch page; official-channel videos preferred; one entry per tool; refresh when interfaces change. `verify_links.py` checks YouTube watch URLs through oEmbed because watch pages rate-limit scripted checks (HTTP 429).
- Running Models Locally gains a renting-a-GPU section (AWS plus rental marketplaces such as RunPod and Vast.ai) with the trade-off stated honestly: rented capability means data leaves the machine, so the policy's data rules apply as for any hosted tool.
- Benchmarks is now a nav section: Language Models (original page, URL unchanged), plus Image Generation and Video Generation pages explaining blind human-preference arenas and linking Artificial Analysis and LMArena leaderboards. The image page's medical-contexts section is grounded in peer-reviewed evaluations cited by DOI and states the institutional line: no public leaderboard measures clinical accuracy, generated medical imagery needs expert review and AI labeling, and patient data never enters generation tools.
- Investigated and shelved (2026-06-11): nightly arena snapshot tables on the image and video pages via the Artificial Analysis Data API. Built, then reverted the same day when the live API answered that the media model-list endpoints require a Pro subscription (HTTP 403, "requires a Pro subscription"), failing the owner's zero-cost requirement; the documentation had read as if the free tier covered them. The pages stay link-first unless a zero-cost, stable data source appears. Full implementation preserved in git history (commit 84802c5) if AA's tiers ever change; the unused ARTIFICIAL_ANALYSIS_LEADERBOARD_API repository secret can be deleted by the owner.

### Prompt-maturity disclaimers and media-rich resource cards (owner approved 2026-06-11)

- `includes/prompt-maturity-note.md` is a hand-authored snippet (an exception in the otherwise pipeline-owned includes/ directory) carrying an "Under construction" admonition: the prompt library holds placeholder drafts pending institution-tested prompts. It is included on all playbook pages and the prompt-dependent pathway modules (2, 4, and 5). Single edit point; remove the includes and the file when the library matures.
- The AI Agents guide is organized per agent: each of the seven gets its own section with a description, its verified walkthrough video, and official documentation links (all verified live). Per-agent video placement uses `render:guide-videos:agents:<slug>` markers matched one to one against the data file's agent entries, failing the build on any mismatch.
- Guide videos and the Prompt Library's general learning resources render as thumbnail cards reusing the pipeline's video-card markup and CSS. YouTube thumbnails derive from the video id (i.ytimg.com); non-video resources carry an optional thumbnail field in data/prompt_resources.yaml holding the page's own og:image URL, verified at authoring time; entries without one render as text-only cards.
- verify_links.py treats a strict-client TLS failure on a manually-verified host like its other bot-block cases, dated in the allowlist (mechanism added 2026-06-11 for stepgenie.app, whose directory entry was removed the same day when the campus firewall also flagged the domain; the handling stays for future cases).
- The Courses and Resources page renders from `data/learning_resources.yaml` (owner-owned) as thumbnail cards at `render:learning-resources:<section>` markers, every entry placed exactly once or the build fails; og:image thumbnails verified at authoring time, text-only cards where a page has none. The Assistants category includes Perplexity (added 2026-06-11).

### Committee Updates page and polls (owner approved 2026-06-11)

- `docs/governance/updates.md` (Committee Updates, in the Governance nav) has two parts. Current projects render from `data/committee_work.yaml` (owner-owned; plain public-safe summaries with status badges and updated dates). The updates feed mirrors an announcement-format GitHub Discussions category ("Committee updates"; only maintainers can post there, making it the owner's self-serve publishing channel): the nightly pipeline writes `includes/committee-updates.md` newest-first with keep-last-good, configured by the `committee_updates` block in feeds.yaml, and skips cleanly while `category_id` is empty (category creation has no API; the owner creates it in the Discussions UI, then the id is fetched via GraphQL and pinned in feeds.yaml).
- Polls run on Microsoft Forms in the owner's tenant and render from `data/polls.yaml` onto the Announcements page as a "The committee is asking" block (linked, not embedded, so no new scripts load); when no poll is active a quiet placeholder points to Committee Updates, and closed polls list one-line outcomes. Owner decision: poll links live on Announcements for visibility; results are reported as committee update posts.
- The owner's planned research study (an IRB-submitted follow-up survey) is deliberately NOT listed in current projects: announcing a survey to the population it will sample could prime responses. Add it only when the owner says so (post-IRB approval at the earliest).

### Section briefs (owner approved 2026-06-11)

- Each news category page opens with an original SVG section banner (docs/assets/section-*.svg, hand-authored, self-contained brand-gradient colors because external SVGs cannot read page CSS variables) and a section brief: one 60-110 word narrative tying together the most significant threads among the items currently on the page, with bracketed numbered links to those items.
- Briefs are written by the strongest free GitHub Models entry (openai/gpt-4.1, high tier; the GPT-5 family is gated to paid Copilot plans, verified empirically 2026-06-11), configured in the feeds.yaml `llm.briefs` block with instructions in prompts/section_brief.md (owner-tunable). Three calls per night at most.
- Trust contract: the model sees a numbered list of the page's items (forum/community sources excluded via `exclude_domains`; they stay on the page but are never cited in the brief) and may reference only those numbers; the pipeline validates every reference, link-ifies them to the exact item URLs, enforces word and reference-count bounds, and applies a dash policy (word-joining dashes become hyphens, others become commas). Any failure keeps the stored brief.
- Briefs live in the ledger (`section_briefs`) keyed by a hash of the eligible item URLs, so a brief regenerates only when its page's item set changes; pages render whatever the ledger holds, including in keyword mode. Owner accepted the prose register after reviewing live samples: informative orientation, consistent with the no-hype rule, explicitly not marketing copy.
- Per-task provider wiring shipped 2026-06-11 (owner spend plan, ANTHROPIC_API_KEY secret in place with prepaid credits, auto-reload off, and a workspace monthly limit): the feeds.yaml `llm.tasks` block assigns curation to claude-haiku-4-5, weekly digest selection to claude-sonnet-5 (upgraded from Haiku 2026-07-02, owner approved: one call per week makes the premium pennies a month, and the digest is the flagship emailed artifact), and the digest narrative to claude-opus-4-8, with section briefs staying on free gpt-4.1; every Anthropic task falls back to the free GitHub path, then keyword mode, when the key is absent or a call fails. Verified live in CI: curation mode reports `llm (anthropic, claude-haiku-4-5)`. Standing decision 2026-07-02: curation stays on Haiku until about a week of drop-reason logs (the audit trail above) shows whether its misfires are rule misapplication, which would justify Sonnet, or defensible judgment calls, which would not.
- Digest narrative shipped 2026-06-12: each weekly digest opens with "The week in brief", one cohesive 120-260 word story over the digest highlights, written by the `llm.tasks` digest_narrative model (claude-opus-4-8) with instructions in prompts/digest_narrative.md (owner-tunable). News items are grounded in fetched article text, capped per item and in total via the feeds.yaml `digest.narrative` block; pages that block scripted clients fall back to stored summaries; videos and podcasts contribute at title-plus-description level. Same trust contract as the section briefs (validated numbered links, word/reference bounds, dash policy), with one stricter rule: on failure the narrative is omitted, never downgraded to a weaker model. Since 2026-07-01 a rejected or failed draft gets exactly one corrective retry on the same model (the validator's reason is quoted back; worst case doubles the weekly cost, still cents) after the W26 narrative was discarded over a 13-word overshoot; the word cap is a tolerance band (320) wider than the prompt's stated target. Skipped on dry runs because the call is paid. The verification block logs words, linked references, articles fetched, token usage, and an estimated cost from list prices in feeds.yaml. First live run (W24 regeneration after the Wednesday seed run was reset): 257 words, 5 linked references, 6 of 8 articles fetched, ~$0.05.

### Visual conventions

- Homepage: hero block (gradient on the theme primary color, mission line, two buttons), Material grid cards for the four start-here sections, Latest items list, Latest videos strip, pinned announcements, last-updated stamp.
- News category pages and digest pages render items as cards (source chip, date, linked title, summary) via the pipeline renderers; the tools directory renders as card grids per category via the MkDocs hook; conferences remain a table because dates and deadlines are tabular.
- News cards carry an article thumbnail when one is available: taken from the feed entry when present, otherwise extracted from the kept article's og:image tag (kept items only, best effort, never fatal). Thumbnail URLs repeated across items on a page are publisher logos and are suppressed; a broken image hides itself client-side.
- News category order is medical education, clinical practice, general AI (owner preference, 2026-06-10), expressed in the feeds.yaml categories order (which drives the digest) and mirrored in the nav. The general_ai keep bar in prompts/curator.md explicitly excludes minor release notes, forum tinkering threads, and rumor posts.
- Typography: Inter for text, JetBrains Mono for code. All card styling lives in `docs/stylesheets/extra.css` using Material CSS variables so light and dark schemes both work. The palette remains the placeholder pending AUA branding (section 13).
- Layout (owner preferences, 2026-06-11): the content grid is capped at 78rem (Material default 61rem) so wide screens get room for tables and card grids, with phones unaffected; table cells carry tighter horizontal padding so the 10-column LiveBench snapshot fits without clipping; the homepage hero contents are centered as a deliberate display-element exception, while all reading text stays left-aligned for readability. Each decision is commented at its rule in extra.css.

## 13. Out of scope

- The Power Automate flow itself (owner builds it in the institutional M365 tenant; this repo only guarantees the stable `digest.xml` contract).
- Custom domain configuration (leave CNAME instructions in README.md; the owner will coordinate a subdomain with AUA IT).
- Analytics, authentication, and comments.

## 14. Open items (current as of 2026-06-12)

Owner actions:

- Create the "Committee updates" Discussions category (announcement format, UI only); the builder then pins its GraphQL id in the `committee_updates` block of feeds.yaml to activate the updates feed.
- The AI workshop poll closes Sunday, July 19, 2026: move it to `closed` in data/polls.yaml with a one-line outcome and post the result as a committee update.
- Spot-test the five Draft library prompts on ChatGPT and Gemini with real materials and flip each to `reviewed` in data/prompts.yaml as it passes (the cross-model disclaimer on the library page covers variance meanwhile). The under-construction snippet, includes/prompt-maturity-note.md, retires when faculty experience with the prompts accumulates.
- Build the Power Automate flow from docs/digest.xml before the first institutional digest send; institutional rollout planned mid-July 2026.
- Take governance statuses (including the 2026-06-12 media and presentations categories, all under_review) and the review rubric to the AI Committee; remove the provisional banners only after.
- Replace TBD conference dates as they are confirmed.
- Seed the Prompt Exchange with first real community prompts.

Builder actions, triggered by owner events:

- On ratification of the revised AI Responsible Use Policy: replace the policy page verbatim (archiving the superseded version), build the student "Can I use AI for this?" FAQ on the ratified text, align site wording to the AI Responsible Use Subcommittee naming and reporting contact, and update pathway module 3 and the agents-page guardrails to the new provisions.
- On first Local Voices content: build the section per the design recorded in section 12.
- On owner instruction only (post-IRB at the earliest): list the research study on Committee Updates. Never publish IRB form internals.

Platform watch (recorded 2026-07-03): the MkDocs ecosystem is in transition. MkDocs 1.x is unmaintained (no release in 18 months as of early 2026), MkDocs 2.0 is a rewrite that is incompatible with Material for MkDocs by design (plugins and the templating the theme depends on are removed), and the Material team is building Zensical, a successor generator promising drop-in support for MkDocs 1.x projects (their analysis: https://squidfunk.github.io/mkdocs-material/blog/2026/02/18/mkdocs-2.0/, the source of the warning banner in every build log). Nothing is urgent: this site's dependencies are pinned, the build is CI-only so unmaintained build tooling carries negligible security exposure, and the site keeps working indefinitely as-is. The eventual action, on no deadline, is to evaluate Zensical's drop-in claim against this repo's custom pieces (the scripts/render_data.py hook, overrides/ partials, extra CSS and JS) once Zensical is stable, rather than ever moving to MkDocs 2.0. Do not sponsor Material Insiders in the meantime; new-feature investment in the old platform is the wrong side of the transition.
