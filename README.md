# AUA AI Hub

Curated artificial intelligence reference and news hub for the American University of Antigua College of Medicine (AUACOM). Maintained by Dr. Tarron Kayalackakom, Assistant Dean for AI in Medical Education.

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

The conferences table (`docs/conferences.md`) and the tools directory (`docs/tools/index.md`) are rendered from `data/conferences.yaml` and `data/tools.yaml` by an MkDocs hook, `scripts/render_data.py`, registered under `hooks:` in `mkdocs.yml`.

Why a hook instead of a pre-build script: the hook runs automatically inside both `mkdocs serve` and `mkdocs build --strict`, so there is no extra workflow step to forget, and the rendered tables are injected in memory only. Nothing generated is ever written into hand-authored files under `docs/`.

To update the conferences table or the tools directory, edit the YAML files only. The hook replaces the `<!-- render:conferences -->` and `<!-- render:tools -->` markers at build time.

## Content classes

- Hand-authored: everything under `docs/` except `docs/news/` and `docs/digest.xml`; `feeds.yaml`; `data/conferences.yaml`; `data/tools.yaml`; `prompts/curator.md`.
- Data-driven: the conferences table and tools directory, rendered from YAML at build time.
- Generated (never hand-edit): `docs/news/**`, `docs/digest.xml`, `includes/latest.md`, `data/seen_items.json`, `data/conference_flags.md`.

## Phase 2 sequencing note

The News section is deliberately absent from the Phase 1 nav. The first Phase 2 deliverable commit must, in a single commit: run the pipeline to create `docs/news/*.md` and `includes/latest.md`, add the News entries to the `nav:` block in `mkdocs.yml`, and add the "Latest items" snippet block to `docs/index.md`. Splitting these across commits in the wrong order makes `mkdocs build --strict` fail on nav entries that point to files that do not exist yet.

## Custom domain (future)

To serve the site from an AUA subdomain instead of github.io:

1. Ask AUA IT to create a CNAME DNS record pointing the chosen subdomain (for example `ai.auamed.org`) at `tarronkayaua.github.io`.
2. In the repository settings under Pages, set the custom domain to that subdomain and keep "Enforce HTTPS" checked once the certificate is issued.
3. Update `site_url` in `mkdocs.yml` to the new domain.
