"""MkDocs hook for the news package of the layout redesign (2026-09-25).

Three jobs, all at build time, none of which edits a source file:

1. Weekly digest pages leave the search index (navigation plan decision
   14). The sixteen-plus digests (news/archive/YYYY-wNN.md) repeat the week's
   news and crowded guides, tools and prompts out of the results. The pages
   themselves, the archive index and the RSS feed are unchanged; only the
   index entry goes, through Material's standard `search: exclude` page
   setting, set here because the digest files are pipeline-owned.

2. Wide tables stack into labelled rows on phones (layout plan L20). A
   table opts in when its page and its first header cell are registered in
   STACKED_TABLES below; the hook then marks the table `data-stack` and gives
   every body cell a `data-label` naming its column, which
   docs/stylesheets/layout-news.css shows as "Label: value" under 45em. The
   labels are written into the HTML here rather than by a script, so the
   stacked rows read correctly without JavaScript. The table keeps no class,
   so Material's `table:not([class])` styling still applies on wide screens.
   Registration is by page and header, not by editing the page, because
   three of the four pages belong to other packages; if a registered table
   can no longer be found (its header was renamed, or the table moved), the
   build fails rather than quietly shipping a table that runs off a phone.

3. Links this package writes as raw HTML are checked, since MkDocs does not
   validate raw-HTML anchors: every jump link in This Week's section row
   must land on a heading of the page.
"""
from __future__ import annotations

import html as _html
import re

DIGEST_PAGE = re.compile(r"news/archive/\d{4}-w\d{2}\.md")

# Page (docs path) -> first header cell of each table to stack there.
STACKED_TABLES: dict[str, tuple[str, ...]] = {
    "conferences.md": ("Conference",),              # Upcoming and Past events
    "playbooks/score-reports.md": ("Report",),       # the report comparison
    "tools/research.md": ("Tool",),                  # costs at a glance
    "governance/review-process.md": ("Status",),     # what each status means
}

_TABLE = re.compile(r"<table>(.*?)</table>", re.DOTALL)
_ROW = re.compile(r"<tr>(.*?)</tr>", re.DOTALL)
_HEAD_CELL = re.compile(r"<th[^>]*>(.*?)</th>", re.DOTALL)
_BODY_CELL = re.compile(r"<td([^>]*)>")
_TAGS = re.compile(r"<[^>]+>")


def _cell_text(cell_html: str) -> str:
    return " ".join(_html.unescape(_TAGS.sub("", cell_html)).split())


def _stack_table(inner: str) -> str:
    """One table's inner HTML with data-label on every body cell."""
    head, _, body = inner.partition("</thead>")
    labels = [_cell_text(c) for c in _HEAD_CELL.findall(head)]

    def label_row(row: re.Match) -> str:
        cells = iter(labels)

        def label_cell(cell: re.Match) -> str:
            label = next(cells, "")
            attrs = cell.group(1)
            if not label or "data-label" in attrs:
                return cell.group(0)
            return f'<td{attrs} data-label="{_html.escape(label)}">'

        return "<tr>" + _BODY_CELL.sub(label_cell, row.group(1)) + "</tr>"

    labelled = head + "</thead>" + _ROW.sub(label_row, body)
    # Explicit table roles: some browsers drop a table's semantics once its
    # rows are displayed as blocks, which the phone layout does.
    labelled = re.sub(r"<(thead|tbody)>", r'<\1 role="rowgroup">', labelled)
    labelled = labelled.replace("<tr>", '<tr role="row">')
    labelled = re.sub(r"<th(?=[\s>])", '<th role="columnheader"', labelled)
    return re.sub(r"<td(?=[\s>])", '<td role="cell"', labelled)


def stack_tables(src: str, html: str) -> str:
    wanted = STACKED_TABLES.get(src)
    if not wanted:
        return html
    found = {first: 0 for first in wanted}

    def sub(m: re.Match) -> str:
        inner = m.group(1)
        heads = _HEAD_CELL.findall(inner.partition("</thead>")[0])
        first = _cell_text(heads[0]) if heads else ""
        if first not in found:
            return m.group(0)
        found[first] += 1
        return ('<table data-stack="" role="table">' + _stack_table(inner)
                + "</table>")

    html = _TABLE.sub(sub, html)
    missing = [first for first, n in found.items() if not n]
    if missing:
        raise ValueError(
            f"layout_news: {src} has no table headed {missing!r} to stack on "
            "phones. The header was renamed or the table removed; update "
            "STACKED_TABLES in scripts/layout_news.py to match.")
    return html


_SECTION_ROW = re.compile(r'<nav class="section-chips"[^>]*>(.*?)</nav>', re.DOTALL)


def check_jump_links(src: str, html: str) -> None:
    for row in _SECTION_ROW.findall(html):
        for target in re.findall(r'href="#([^"]+)"', row):
            if f'id="{target}"' not in html:
                raise ValueError(
                    f"layout_news: {src} jumps to #{target}, which no heading "
                    "on the page carries")


def on_page_markdown(markdown, page, config, files):
    if DIGEST_PAGE.fullmatch(page.file.src_uri):
        search = dict(page.meta.get("search") or {})
        search["exclude"] = True
        page.meta["search"] = search
    return markdown


def on_page_content(html, page, config, files):
    src = page.file.src_uri
    html = stack_tables(src, html)
    if src.startswith("news/"):
        check_jump_links(src, html)
    return html
