# SPEC.md: AUA AI Hub

Project specification for an automated AI information hub for the American University of Antigua College of Medicine (AUACOM).

This document is the source of truth for scope and behavior. If implementation needs to deviate from anything here, flag the deviation and confirm with the owner before proceeding. Working rules and style rules live in CLAUDE.md.

- Owner: Assistant Dean for AI in Medical Education (chairs the AUA AI Governance Committee)
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

- Hand-authored (pipeline must never modify): everything under `docs/` except `docs/news/` and `docs/digest.xml`; `feeds.yaml`; `data/conferences.yaml`; `data/tools.yaml`; `prompts/curator.md`.
- Data-driven (rendered at build time from YAML): the conferences table and the tools directory.
- Generated (humans never hand-edit): `docs/news/**`, `docs/digest.xml`, `includes/latest.md`, `includes/latest-videos.md`, `includes/livebench.md`, `data/seen_items.json`.

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

- Home (`index.md`): one-paragraph mission statement, pinned announcements (latest 3), a "Latest items" block of the 5 newest news items pulled in via the snippets include, and a last-updated stamp.
- AI Basics: "How LLMs Work" plain-language primer (roughly 1,200 words, no math), Glossary (terms listed in section 6), and a Common Misconceptions page.
- Tools: index page rendering the directory from `data/tools.yaml` with governance badges, grouped by category.
- Learning: curated learning paths organized by audience: Faculty getting started, Faculty teaching with AI, Students, and Going deeper (technical).
- News: This Week (latest weekly digest), General AI, Medical Education, Clinical Practice, and an Archive organized by ISO week.
- Conferences: table rendered from `data/conferences.yaml` (rendering rules in section 6).
- Announcements: index of owner-authored posts under `docs/announcements/`, newest first.
- About: purpose of the site, how news items are selected (transparency about the pipeline and the LLM step), a governance note, a disclaimer (the site is informational, AI-generated summaries may contain errors, readers should verify primary sources, and nothing here is institutional policy unless explicitly marked as such), and a contact line.

Theme configuration: Material with light and dark toggle, search, navigation tabs, and per-page table of contents. Placeholder palette of deep blue primary with amber accent until official AUA branding is supplied. Site name placeholder: "AUA AI Hub".

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
- A visible banner on the Tools index: "Governance statuses are provisional pending AI Governance Committee ratification." Do not remove this banner; only the owner removes it.

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
   - Weekly, when the ISO week has changed since the last digest (effectively Mondays): snapshot the week's kept items into `docs/news/this-week.md`, append a copy to `docs/news/archive/<year>-w<week>.md`, and regenerate `docs/digest.xml`.
   - `data/seen_items.json` updated and pruned to 60 days.
7. Print the mandatory verification block (owner's standing rule): feeds attempted, succeeded, failed (named); raw item count; counts after window, after block-filter, after dedupe; kept per category; files written with per-file item counts; curation mode used. Assert that category counts sum to the total kept and fail loudly on mismatch.
8. CLI flags: `--dry-run` (no writes), `--no-llm`, `--since-days N`, `--verbose`.

Digest contract (consumed by Power Automate): `docs/digest.xml` is valid RSS 2.0. Exactly one new `<item>` is added per weekly digest, with a stable guid of the form `aua-ai-digest-<year>-W<week>`, a title like "AUA AI Hub Digest: Week of <date>", and a description containing the digest as simple HTML (category headings, linked items, one-sentence summaries). The channel retains the 12 most recent digests.

## 9. LLM curation (Phase 3)

- The curator system prompt lives in `prompts/curator.md` so the owner can tune it without touching code. Requirements for that prompt: audience is medical school faculty and students; plain language; neutral on vendors; no hype or superlatives; select at most 12 items per run; prefer model releases, benchmark movements, open-weights and local-model news, peer-reviewed medical education findings, and clinical deployment or regulatory news; drop funding gossip, listicles, and near-duplicates of already-covered stories; write a one-sentence summary of at most 35 words per kept item; set `is_cfp` true for conference or call-for-papers announcements.
- Strict JSON output contract:

```json
{"items": [{"id": "", "keep": true, "category": "general_ai", "summary": "", "importance": 3, "is_cfp": false}]}
```

- One batched call per run for news (a second, separate batched call covers video candidates; see section 14). Cap news candidates sent to the LLM at 120, selected by keyword score descending; truncate each candidate to a 140-character title plus a 100-character summary, and greedily pack candidates under the provider's payload budget (GitHub Models' free tier caps requests at 8,000 tokens; the budget lives in the `llm:` block of feeds.yaml). On JSON parse failure, retry once with a corrective instruction, then fall back to keyword mode. Log the outcome in the verification block.
- CFP-flagged items are appended to `data/conference_flags.md` for owner review. The pipeline never edits `data/conferences.yaml` itself; conference data changes stay human-in-the-loop.
- Post-process every LLM summary before publishing: replace any em dash with a comma or period, enforce the 35-word cap, strip any markdown or HTML the model included, and reject empty summaries (fall back to the feed's own summary).
- Provider selection order: `ANTHROPIC_API_KEY` present, use the Anthropic API with an inexpensive current model (verify current model strings from official docs at build time; make the model id a config value, not a literal scattered through code); else, when running in Actions with models access, use GitHub Models; else keyword mode.

## 10. Workflows

`refresh.yml`:

- Triggers: `schedule` with cron `15 9 * * *` (09:15 UTC, about 5:15 AM in Antigua, which observes UTC-4 year-round) plus `workflow_dispatch`.
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
- Outputs: `docs/news/videos.md` (thumbnail card grid, newest first, capped by `page_items`) and `includes/latest-videos.md` (homepage strip, `home_items` cards). Video cards show thumbnail, title, channel, and date, and link out to YouTube; nothing is embedded and no YouTube scripts load on the site. Thumbnails hotlink YouTube's standard `i.ytimg.com` images. The weekly digest gains a Videos section.
- Channel roster changes are owner edits to feeds.yaml only. Roster as approved: Matthew Berman, Two Minute Papers, Bijan Bowen, WorldofAI, AI Search, Wes Roth, Anthropic, OpenAI, Google DeepMind, AI Explained, IBM Technology, Yannic Kilcher.

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
- `conference-watch.yml`: monthly workflow running `scripts/conference_watch.py`, which fetches each official page in `data/conferences.yaml` plus the recurring events in `data/conference_watchlist.yaml`, has the LLM extract explicitly stated dates for the next edition, filters non-actionable noise (past editions, cosmetic location rewording, deadlines already marked passed), and opens a GitHub issue proposing changes with evidence quotes and source links. The script never edits data files; conference data stays human-in-the-loop per section 9.

### Visual conventions

- Homepage: hero block (gradient on the theme primary color, mission line, two buttons), Material grid cards for the four start-here sections, Latest items list, Latest videos strip, pinned announcements, last-updated stamp.
- News category pages and digest pages render items as cards (source chip, date, linked title, summary) via the pipeline renderers; the tools directory renders as card grids per category via the MkDocs hook; conferences remain a table because dates and deadlines are tabular.
- Typography: Inter for text, JetBrains Mono for code. All card styling lives in `docs/stylesheets/extra.css` using Material CSS variables so light and dark schemes both work. The palette remains the placeholder pending AUA branding (section 13).

## 13. Out of scope

- The Power Automate flow itself (owner builds it in the institutional M365 tenant; this repo only guarantees the stable `digest.xml` contract).
- Custom domain configuration (leave CNAME instructions in README.md; the owner will coordinate a subdomain with AUA IT).
- Analytics, authentication, and comments.

## 14. Open items for the owner

- Confirm the site name and supply AUA branding (colors, logo) to replace placeholders.
- Generate the PubMed RSS URLs (or approve the builder doing so) and confirm the queries.
- Replace TBD conference dates as they are confirmed.
- Take governance statuses to the AI Governance Committee for ratification, update `data/tools.yaml` accordingly, and remove the provisional banner.
