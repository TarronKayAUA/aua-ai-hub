"""MkDocs hook: page types, the action slot, and the standard page ending.

Layout redesign (owner approved 2026-09-25; SPEC section 12). Every page is
one of five types, each with a frame the whole site shares:

  door       landing pages: no sidebars, no breadcrumb, cards and rows
  task       step-by-step guides: reading column, one action in the head
  lesson     the pathway modules: reading column, Listen row, Next button
  reference  everything else that is read: reading column
  shelf      catalogues (directory, library, news, calendars): wide, no
             "on this page" column

A page chooses its type with front matter `template: <type>`. Without it,
the type comes from the page's address, so the nine narrated pages and the
pipeline-owned news pages never need editing (their spoken text and their
generated source stay untouched; everything here is injected into the
rendered HTML, which narration and search do not read).

Front matter this hook understands:

  template: door | task | lesson | reference | shelf
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

import datetime as _dt
import html as _html
import re

from mkdocs.utils import get_relative_url

TYPES = ("door", "task", "lesson", "reference", "shelf")
DOOR = {"index.md", "students.md", "faculty.md", "pathway/index.md",
        "news-and-events.md", "governance/index.md"}
SHELF = {"tools/index.md", "prompts/index.md", "prompts/exchange.md",
         "playbooks/index.md", "learning/index.md", "benchmarks.md",
         "conferences.md", "opportunities.md", "announcements/index.md",
         "news/archive/index.md", "worked-examples/index.md"}


def page_type(page) -> str:
    chosen = (page.meta or {}).get("template")
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
    wanted = {"door": ("navigation", "toc"), "shelf": ("toc",)}.get(kind, ())
    for flag in wanted:
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


def _first_page(section):
    for child in section.children:
        if child.is_page:
            return child
        if child.is_section:
            found = _first_page(child)
            if found is not None:
                return found
    return None


def _back_target(page):
    section = page.parent
    while section is not None:
        first = _first_page(section)
        if first is not None and first is not page:
            return section.title, first
        section = section.parent
    return None


def _feedback_url(config) -> str | None:
    for link in (config.get("extra") or {}).get("footer_links") or []:
        if link.get("text", "").lower() == "feedback" and "://" in link.get("url", ""):
            return link["url"]
    return None


def _reviewed(value) -> str | None:
    if isinstance(value, _dt.date):
        return f"{value:%B} {value.day}, {value.year}"
    if isinstance(value, str) and re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
        d = _dt.date.fromisoformat(value)
        return f"{d:%B} {d.day}, {d.year}"
    return None


def _page_end(page, config) -> str:
    bits = []
    reviewed = _reviewed(page.meta.get("last_reviewed"))
    feedback = _feedback_url(config)
    line = []
    if reviewed:
        line.append(f"Content last reviewed {reviewed}.")
    if feedback:
        line.append(f'<a href="{_html.escape(feedback)}">Report a problem with this page</a>')
    if line:
        bits.append('<p class="page-end__meta">' + " ".join(line) + "</p>")
    back = _back_target(page)
    if back:
        title, target = back
        href = get_relative_url(target.url, page.url)
        bits.append(f'<a class="page-end__back" href="{_html.escape(href)}">Back to {_html.escape(title)}</a>')
    if not bits:
        return ""
    return '<div class="page-end">' + "".join(bits) + "</div>"


def on_page_content(html, page, config, files):
    kind = page.meta.get("page_type") or page_type(page)
    action = _action_html(page, files)
    if action:
        html = _insert_after_head(html, action)
    if kind != "door":
        html = html + _page_end(page, config)
    return html


def on_post_page(output, page, config):
    kind = page.meta.get("page_type") or page_type(page)
    return output.replace("<body ", f'<body data-page-type="{kind}" ', 1)
