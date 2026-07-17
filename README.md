# AUA AI Hub

Curated artificial intelligence reference and news hub for the American University of Antigua College of Medicine (AUACOM). Maintained by Dr. Tarron Kayalackakom, Assistant Dean of AI in Medical Education.

Built with MkDocs Material, deployed to GitHub Pages, and refreshed by a Python feed-aggregation pipeline running on GitHub Actions. See SPEC.md for the full specification and CLAUDE.md for working rules.

## Local development

```
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m mkdocs serve
```

Validation build (run after any nav or content change):

```
.venv\Scripts\python -m mkdocs build --strict
```

## How the data-driven pages work

Render markers under `docs/` are replaced at build time from their matching files under `data/` by an MkDocs hook, `scripts/render_data.py`, registered under `hooks:` in `mkdocs.yml`. Hook-rendered surfaces: the conferences table (`docs/conferences.md`), the opportunities board (`docs/opportunities.md`), the tools directory and its open-weights section (`docs/tools/index.md`), the prompt library (`docs/prompts/index.md`) and the Learning to Prompt resources (`docs/prompts/learning.md`), the Courses and Resources cards (`docs/learning/index.md`), the committee page (`docs/governance/committee.md`), the polls block (`docs/announcements/index.md`), the guide-video lists (`docs/tools/agents.md`, `docs/tools/local.md`), the hardware estimator's data island (`docs/tools/hardware.md`), and the homepage last-updated stamp.

Why a hook instead of a pre-build script: the hook runs automatically inside both `mkdocs serve` and `mkdocs build --strict`, so there is no extra workflow step to forget, and the rendered tables are injected in memory only. Nothing generated is ever written into hand-authored files under `docs/`.

To update the conferences table or the tools directory, edit the YAML files only. The hook replaces the `<!-- render:conferences -->` and `<!-- render:tools -->` markers at build time.

## Content classes

- Hand-authored: everything under `docs/` except `docs/news/**`, `docs/prompts/exchange.md`, and `docs/digest.xml`; `feeds.yaml`; the owner-owned data files (`data/conferences.yaml`, `data/conference_watchlist.yaml`, `data/opportunities.yaml`, `data/tools.yaml`, `data/open_models.yaml`, `data/local_models.yaml`, `data/hardware_tiers.yaml`, `data/prompts.yaml`, `data/prompt_resources.yaml`, `data/guide_videos.yaml`, `data/learning_resources.yaml`, `data/committee.yaml`, `data/committee_work.yaml`, `data/polls.yaml`); and the four owner-tunable prompt files (`prompts/curator.md`, `prompts/digest.md`, `prompts/digest_narrative.md`, `prompts/section_brief.md`).
- Data-driven: every hook-rendered surface listed above, rendered from YAML at build time.
- Generated (never hand-edit): `docs/news/**`, `docs/prompts/exchange.md`, `docs/digest.xml`, `includes/latest.md`, `includes/latest-videos.md`, `includes/livebench.md`, `includes/community-prompts.md`, `includes/committee-updates.md` (`includes/prompt-maturity-note.md` is the hand-authored exception), `data/seen_items.json`, `data/conference_flags.md` (created on demand), `data/conference_watch_state.json`, `data/opportunity_watch_state.json`, `data/page_review_state.json`.

## Videos and podcasts

The Videos and Podcasts pages (and the homepage video strip) are produced by
the same pipeline from the `video_feeds` and `podcast_feeds` lists in
`feeds.yaml` (channel/show RSS, no API keys). Cards link out to the original
platform; nothing is embedded. To add or remove a channel or show, edit
`feeds.yaml` and run `python scripts/verify_feeds.py` before committing.

## Prompt library

`data/prompts.yaml` holds the prompt library; the render hook builds the
Prompts page from it at build time. Owner edits the YAML only; prompts marked
`status: draft` carry a visible Draft badge until the owner reviews them.

## Routine maintenance playbook

Common tasks, in the order things should happen. Every pipeline-touching
change follows the same closing sequence: dry-run, check the verification
block, `mkdocs build --strict`, commit, push (CI deploys automatically).

**Add or remove a news feed** — edit `categories:` in `feeds.yaml`; run
`python scripts/verify_feeds.py` (must pass) and a pipeline dry run; commit.

**Add or remove a YouTube channel** — get the channel id from the channel
page's canonical link (`<link rel="canonical" href=".../channel/UC...">`,
not the first channelId in the source); add to `video_feeds:`; verify and
dry-run as above. Optional per-channel keys: `group` picks the Videos page
section (default `general`; `medical` renders under Medical AI) and
`lookback_days` widens the window for low-cadence channels such as seminar
series. Sections and their caps live in `video_feeds.groups`.

**Add or remove a podcast** — find the RSS URL via the Apple Podcasts
directory (`https://itunes.apple.com/search?term=NAME&media=podcast` returns
`feedUrl`); add to `podcast_feeds:`; verify and dry-run as above.

**Add a tool, conference, or prompt** — edit the matching file in `data/`;
for new URLs run `python scripts/verify_links.py`; conference dates must be
confirmed from the official site or written as TBD; build strict and commit.
Tool categories, their page order, and category intro paragraphs live in
`CATEGORY_LABELS` and `CATEGORY_INTROS` in `scripts/render_data.py` (the
hook fails the build on an unknown category). Sites that block scripted
clients go in the `MANUALLY_VERIFIED` allowlist in `scripts/verify_links.py`
with the date they were confirmed live in a browser.

**Add a prompt learning resource** — edit `data/prompt_resources.yaml`
(category `general` renders on the Learning to Prompt page,
`docs/prompts/learning.md`; a prompt category renders as Further
reading under that section of the library); the bar is evergreen
quality reflecting current practice; verify the link, build strict,
commit.

**Update the open-weights model list** — edit `data/open_models.yaml`;
blurbs may name current flagships, so refresh blurb and `last_reviewed`
together; verify links, build strict, commit.

**Edit the literacy pathway or playbooks** — hand-authored pages under
`docs/pathway/` and `docs/playbooks/`; keep the fixed page shapes
(objectives/self-checks; guardrails/checklist), keep module 3 and all
playbook guardrails consistent with the policy version in force, and
re-check the CGEA mapping note if module scope changes.

**Add or refresh a setup video** — edit `data/guide_videos.yaml` (group
`agents` or `local`); verify the video via YouTube oEmbed (live, right
channel/title) and note duration and upload date; one entry per tool,
official channels preferred; build strict, commit.

**Run a poll** — create it in Microsoft Forms (restricted to the AUA
organization), then add question/url/closes to the `active` list in
`data/polls.yaml`; on close, move it to `closed` with a one-line
outcome and post the result as a committee update.

**Post a committee update or edit current projects** — updates are
posts in the "Committee updates" Discussions category (announcement
format; mirrored to the site nightly once `category_id` is set in the
`committee_updates` block of feeds.yaml). The current-projects list is
`data/committee_work.yaml`; keep summaries public-safe.

**Conference calendar upkeep** — mostly automatic since 2026-07-01: the
conference-watch workflow (every second day) applies date and location
changes it can ground in the official page, keep coherent, and confirm on
two consecutive runs, committing them with an inline auto-verified
comment. What still needs you: "Conference watch" issues carry anything
that failed a gate plus newly announced editions of watchlist events;
check each against its linked source, edit `data/conferences.yaml`
yourself, and close the issue. Set `mode: propose` in the feeds.yaml
`conference_watch` block to turn all automatic writing off. Never
hand-edit `data/conference_watch_state.json`.

**Tune what the curator keeps or how it writes** — edit `prompts/curator.md`
(no code changes); test with a pipeline dry run with `GITHUB_TOKEN` set.

**Tune the weekly digest** — the send day and per-type budgets live in the
`digest:` block of `feeds.yaml`; the highlight-selection instructions live in
`prompts/digest.md`. The digest fires on the configured day's nightly run,
one per ISO week. The opening narrative ("The week in brief") is written by
the paid `digest_narrative` model in the `llm.tasks` block; its instructions
live in `prompts/digest_narrative.md` and its length, reference, and
article-extraction caps in the `digest.narrative` block. It is omitted,
never downgraded, when the Anthropic path is unavailable, and skipped on
dry runs because the call is paid.

**Tune the section briefs** — the writing instructions live in
`prompts/section_brief.md`; the model and excluded source domains live in
the `llm.briefs` block of `feeds.yaml`. Briefs regenerate only when a
page's item set changes; test with a dry run with `GITHUB_TOKEN` set.

**Change the curation model or provider** — edit the `llm:` block in
`feeds.yaml` only. Adding an `ANTHROPIC_API_KEY` repository secret switches
the nightly run to the Anthropic path automatically; removing it switches
back. Mind the GitHub Models 8,000-token request cap (`max_payload_chars`).

**Update the committee roster** — edit `data/committee.yaml`; for a new
member, add their photo to `graphics/`, map it in
`scripts/build_brand_assets.py`, and run that script; build strict, commit.

**Replace the AI policy when a new version is approved** — move the old text
in `docs/governance/policy.md` to a clearly labeled superseded archive page,
paste the newly approved text verbatim with its effective date in the status
block, and never publish drafts.

**Moderate comments or the Prompt Exchange** — everything lives in the
repo's GitHub Discussions; use GitHub's hide/delete/lock tools. To promote a
community prompt: test it, add it to `data/prompts.yaml` with contributor
credit in the notes, mark it reviewed, and reply on the discussion.

**Update branding** — drop new artwork in `graphics/`, run
`python scripts/build_brand_assets.py` (needs `pip install pillow`), review
the regenerated files in `docs/assets/`, build strict, commit.

**When automation emails you** — each workflow opens or updates a GitHub
issue when something needs a human: `feed-health` (a feed died),
`link-health` (a link died), `conference-watch` (calendar items that
failed an auto-apply gate, plus new conferences), `opportunity-watch`
(weekly open calls and deadlines with paste-ready YAML for
`data/opportunities.yaml`), the monthly tool-discovery scheduled task
(directory candidates, propose-only; the task lives outside the repo in
the maintainer's Claude Code scheduled tasks), and `content-watch`
(weekly roster recommendations: tools that launched, died, or changed,
with evidence links and the entries to edit; verified-unchanged entries
get their `last_reviewed` dates bumped automatically).
Content-watch also re-reviews evergreen prose pages on budgets computed
from each page's own volatile-claim census: machine-verified pages get
their front-matter `last_reviewed` date bumped, and a drifted claim
reaches the issue only after persisting two consecutive runs, quoting
the exact sentence. After substantively editing an enrolled page, update
its `last_reviewed` yourself or just leave it; an early clean machine
review bumps it for you. To check a page immediately, run the
content-watch workflow with its `review_page` input (e.g.
`tools/hardware.md`), or locally:
`python scripts/content_watch.py --no-bump --review-page tools/hardware.md`
(claim verdicts print in the log).
Nightly `refresh` and push-triggered `deploy` failures arrive as Actions
failure notifications; the run log's verification block says what happened.

**Force an immediate site refresh** — run the `Nightly news refresh`
workflow manually (Actions tab, workflow_dispatch, or
`gh workflow run refresh.yml`); it curates, commits, builds, and
deploys itself. For a local write-mode run instead, always dry-run
first (`python scripts/aggregate.py --dry-run --verbose`), review the
verification block, then rerun without `--dry-run`; pull before and
push promptly after, because the nightly runs commit to main and races
corrupt the ledger merge.

**Regenerate a week's digest** — clear `last_digest_week` and
`last_digest_at` and drop that week's entry from `digests` in
`data/seen_items.json` via a one-time script that prints before/after
state, then run the refresh; selection and narrative rerun and the
archive page is overwritten under the same guid. The narrative is
skipped on dry runs because the call is paid.

**Tune the news topic chips** — the per-category topic vocabularies
live in the `topics:` block of `feeds.yaml` (owner-tunable; the
curator copies labels verbatim, anything unmatched lands in Other).
Renaming or adding a label is forward-looking only; already-tagged
ledger items keep their stored topic.

**Never hand-edit** `docs/news/**`, `docs/prompts/exchange.md`,
`docs/digest.xml`, the pipeline-generated `includes/*.md`,
`data/seen_items.json`, `data/conference_flags.md`, or the
`*_watch_state.json` and `page_review_state.json` files under `data/`;
the automation owns them and the next run overwrites them.

## Custom domain (future)

To serve the site from an AUA subdomain instead of github.io:

1. Ask AUA IT to create a CNAME DNS record pointing the chosen subdomain (for example `ai.auamed.org`) at `tarronkayaua.github.io`.
2. In the repository settings under Pages, set the custom domain to that subdomain and keep "Enforce HTTPS" checked once the certificate is issued.
3. Update `site_url` in `mkdocs.yml` to the new domain.
