"""MkDocs hook that renders data/conferences.yaml and data/tools.yaml into pages.

Registered under `hooks:` in mkdocs.yml, so it runs inside both `mkdocs serve`
and `mkdocs build --strict` with no separate pre-build step. It replaces marker
comments in hand-authored pages with markdown rendered from YAML, in memory
only: nothing generated is written into the docs/ source tree.

Markers:
    <!-- render:conferences -->  in docs/conferences.md
    <!-- render:tools -->        in docs/tools/index.md

Verification counts are printed on every build and the hook fails loudly if
totals do not cross-check (CLAUDE.md working rule 2).
"""

# Full implementation lands with the data files. Until then the hook is a
# no-op so the scaffold builds.


def on_page_markdown(markdown, page, config, files):
    return markdown
