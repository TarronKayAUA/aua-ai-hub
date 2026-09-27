"""MkDocs hook: page types, the action slot, and the standard page ending.

Layout redesign (owner approved 2026-09-25; SPEC section 12). Every page is
one of five types, each with a frame the whole site shares:

  door       landing pages: no breadcrumb, cards and rows
  task       step-by-step guides: reading column, one action in the head
  lesson     the pathway modules: reading column, Listen row, Next button
  reference  everything else that is read: reading column
  shelf      catalogues (directory, library, news, calendars): full width

No page of any type shows the left navigation sidebar or the right "On this
page" column (navigation synthesis, 2026-09-26). Their jobs moved to the
section navigator (scripts/layout_nav.py, docs/javascripts/layout-nav.js):
"Browse <section>" opens the section as a map, "On this page" opens the
page's sections as chips, the page's action docks beside them while its own
place is out of view, and every inner page ends with "More in this section"
(Previous and Next on the seven modules) and the section's map.
On phones Material's menu drawer still works: below 76.25em it shows the
navigation whatever the page hides.

A page chooses its type with front matter `page_type: <type>` (not
`template:`, which MkDocs reserves for a Jinja template name). Without it,
the type comes from the page's address, so the nine narrated pages and the
pipeline-owned news pages never need editing (their spoken text and their
generated source stay untouched; everything here is injected into the
rendered HTML, which narration and search do not read).

Front matter this hook understands:

  page_type: door | task | lesson | reference | shelf
  action:                       # at most one primary, one secondary
    - text: Start Module 1: How AI Works (10 minutes)
      link: pathway/how-ai-works.md     # a docs path, optional #anchor
    - text: See the whole pathway
      link: pathway/index.md#route
      style: secondary

Raw-HTML links are not covered by MkDocs anchor validation, so every link
this hook writes is resolved against the site's files at build time, and a
missing target fails the build instead of shipping a broken button.
"""
from __future__ import annotations

import html as _html
import re

from mkdocs.utils import get_relative_url

TYPES = ("door", "task", "lesson", "reference", "shelf")
DOOR = {"index.md", "students.md", "faculty.md", "pathway/index.md",
        "news-and-events.md", "governance/index.md", "tools-and-prompts.md"}
SHELF = {"tools/index.md", "prompts/index.md", "prompts/exchange.md",
         "playbooks/index.md", "benchmarks.md",
         "conferences.md", "opportunities.md", "announcements/index.md",
         "news/archive/index.md"}
# worked-examples/index.md and learning/index.md are reading pages since the
# space round: their prose keeps the measure, and their sections sit in
# panels, a section of one or two cards beside its neighbour.


def page_type(page) -> str:
    meta = page.meta or {}
    if meta.get("template") in TYPES:
        raise ValueError(f"layout_frame: {page.file.src_uri} sets template: {meta['template']}; "
                         "use page_type: (MkDocs reads template: as a Jinja file name)")
    chosen = meta.get("page_type")
    if chosen in TYPES:
        return chosen
    src = page.file.src_uri
    if src in DOOR:
        return "door"
    if src in SHELF or src.startswith("benchmarks/"):
        return "shelf"
    if src.startswith("news/") and not src.startswith("news/archive/"):
        return "shelf"
    if src.startswith("pathway/"):
        return "lesson"
    if src.startswith("playbooks/"):
        return "task"
    return "reference"


def on_page_markdown(markdown, page, config, files):
    kind = page_type(page)
    page.meta["page_type"] = kind
    hide = list(page.meta.get("hide") or [])
    for flag in ("navigation", "toc"):
        if flag not in hide:
            hide.append(flag)
    if hide:
        page.meta["hide"] = hide
    return markdown


def _resolve(link: str, page, files) -> str:
    """A docs path (optionally #anchor) to a URL relative to this page."""
    if "://" in link or link.startswith("mailto:"):
        return link
    path, _, anchor = link.partition("#")
    target = files.get_file_from_path(path)
    if target is None:
        raise ValueError(f"layout_frame: {page.file.src_uri} links to {link!r}, which does not exist")
    url = get_relative_url(target.url, page.url)
    return url + ("#" + anchor if anchor else "")


def _action_html(page, files) -> str:
    items = page.meta.get("action") or []
    if not items:
        return ""
    if len(items) > 2 or sum(1 for i in items if i.get("style", "primary") == "primary") > 1:
        raise ValueError(f"layout_frame: {page.file.src_uri} has more than one primary action "
                         "or more than two actions; the one-button rule allows one of each")
    out = []
    for item in items:
        style = item.get("style", "primary")
        cls = "md-button md-button--primary" if style == "primary" else "md-button"
        href = _resolve(item["link"], page, files)
        out.append(f'<a class="{cls}" href="{_html.escape(href)}">{_html.escape(item["text"])}</a>')
    return '<div class="page-action" data-page-action>' + "".join(out) + "</div>"


_META_P = re.compile(r'(</h1>\s*)(<p>\s*<span class="meta-chip".*?</p>)', re.S)


def _insert_after_head(html: str, block: str) -> str:
    m = _META_P.search(html)
    if m:
        return html[:m.end()] + block + html[m.end():]
    i = html.find("</h1>")
    if i == -1:
        return block + html
    return html[:i + 5] + block + html[i + 5:]


def _feedback_url(config) -> str | None:
    for link in (config.get("extra") or {}).get("footer_links") or []:
        if link.get("text", "").lower() == "feedback" and "://" in link.get("url", ""):
            return link["url"]
    return None


def _page_end(page, config, reviewed_html: str = "") -> str:
    """The standard ending. The review date comes from render_data.py's
    existing freshness line (it also says how review dates are kept), moved
    in here so the date appears once; this hook never prints its own."""
    bits = []
    if reviewed_html:
        bits.append(reviewed_html)
    feedback = _feedback_url(config)
    if feedback:
        bits.append(f'<p class="page-end__meta"><a href="{_html.escape(feedback)}">'
                    "Report a problem with this page</a></p>")
    # "Back to <section>" is now part of the section foot that
    # scripts/layout_nav.py writes above this block: "More in this section"
    # (led, on a prompt page, by the page it belongs to), or Previous and
    # Next on the seven modules.
    if not bits:
        return ""
    return '<div class="page-end">' + "".join(bits) + "</div>"


def on_page_content(html, page, config, files):
    kind = page.meta.get("page_type") or page_type(page)
    action = _action_html(page, files)
    if action:
        html = _insert_after_head(html, action)
    if kind != "door":
        reviewed = ""
        m = _REVIEWED_P.search(html)
        if m:
            reviewed, html = m.group(0), html[:m.start()] + html[m.end():]
        html = html + _page_end(page, config, reviewed)
    return html


_REVIEWED_P = re.compile(r'<p class="page-reviewed">.*?</p>', re.S)


def on_post_page(output, page, config):
    kind = page.meta.get("page_type") or page_type(page)
    return output.replace("<body ", f'<body data-page-type="{kind}" ', 1)
