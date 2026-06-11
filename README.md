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

The conferences table (`docs/conferences.md`), the tools directory (`docs/tools/index.md`), the prompt library (`docs/prompts/index.md`), and the committee page (`docs/governance/committee.md`) are rendered from their matching files under `data/` by an MkDocs hook, `scripts/render_data.py`, registered under `hooks:` in `mkdocs.yml`.

Why a hook instead of a pre-build script: the hook runs automatically inside both `mkdocs serve` and `mkdocs build --strict`, so there is no extra workflow step to forget, and the rendered tables are injected in memory only. Nothing generated is ever written into hand-authored files under `docs/`.

To update the conferences table or the tools directory, edit the YAML files only. The hook replaces the `<!-- render:conferences -->` and `<!-- render:tools -->` markers at build time.

## Content classes

- Hand-authored: everything under `docs/` except `docs/news/` and `docs/digest.xml`; `feeds.yaml`; `data/conferences.yaml`; `data/tools.yaml`; `prompts/curator.md`.
- Data-driven: the conferences table and tools directory, rendered from YAML at build time.
- Generated (never hand-edit): `docs/news/**`, `docs/prompts/exchange.md`, `docs/digest.xml`, `includes/latest.md`, `includes/latest-videos.md`, `includes/livebench.md`, `includes/community-prompts.md`, `data/seen_items.json`, `data/conference_flags.md`.

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
dry-run as above.

**Add or remove a podcast** — find the RSS URL via the Apple Podcasts
directory (`https://itunes.apple.com/search?term=NAME&media=podcast` returns
`feedUrl`); add to `podcast_feeds:`; verify and dry-run as above.

**Add a tool, conference, or prompt** — edit the matching file in `data/`;
for new URLs run `python scripts/verify_links.py`; conference dates must be
confirmed from the official site or written as TBD; build strict and commit.

**Apply a conference-watch proposal** — open the monthly "Conference watch"
issue, check each proposal against its linked source, edit
`data/conferences.yaml` yourself, build strict, commit, close the issue.

**Tune what the curator keeps or how it writes** — edit `prompts/curator.md`
(no code changes); test with a pipeline dry run with `GITHUB_TOKEN` set.

**Tune the weekly digest** — the send day and per-type budgets live in the
`digest:` block of `feeds.yaml`; the highlight-selection instructions live in
`prompts/digest.md`. The digest fires on the configured day's nightly run,
one per ISO week.

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
`link-health` (a link died), `conference-watch` (proposed calendar updates).
Nightly `refresh` and push-triggered `deploy` failures arrive as Actions
failure notifications; the run log's verification block says what happened.

**Never hand-edit** `docs/news/**`, `docs/digest.xml`, `includes/*.md`
generated by the pipeline, `data/seen_items.json`, or
`data/conference_flags.md`; the next nightly run overwrites them.

## Custom domain (future)

To serve the site from an AUA subdomain instead of github.io:

1. Ask AUA IT to create a CNAME DNS record pointing the chosen subdomain (for example `ai.auamed.org`) at `tarronkayaua.github.io`.
2. In the repository settings under Pages, set the custom domain to that subdomain and keep "Enforce HTTPS" checked once the certificate is issued.
3. Update `site_url` in `mkdocs.yml` to the new domain.
