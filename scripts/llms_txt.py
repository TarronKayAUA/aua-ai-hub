"""MkDocs hook: llms.txt, a plain map of the site for AI systems (2026-10-02).

Why: llms.txt (https://llmstxt.org) is a proposed convention, a markdown file at a
site's root path that names its pages, each with a line saying what it is, so an AI
assistant or AI search tool reading the site for someone can go straight to the right
page. Owner request, discoverability; optional and cheap, because everything in it is
already on the site: the nav in mkdocs.yml (sections and order), each page's title, and
the description scripts/page_descriptions.py gave it. Nothing is typed here, so it
cannot drift from the site.

Layout: the site name as the title, the site description as the summary, then one
section per nav tab listing its pages in nav order (nested groups flattened, since the
convention has one level of section). Pages outside the nav (each prompt's own page,
the announcements, the weekly digests) are listed under "Optional", the convention's
name for links a reader may skip. Written to site/llms.txt.
"""

from __future__ import annotations

import html
from pathlib import Path

from mkdocs.structure.nav import Section
from mkdocs.structure.pages import Page

_state: dict = {}


def on_env(env, config, files):
    _state["files"] = files
    return env


def on_nav(nav, config, files):
    _state["nav"] = nav
    return nav


def _line(page: Page, config) -> str:
    desc = config["site_description"] if page.is_homepage else (page.meta.get("description") or "")
    desc = " ".join(html.unescape(str(desc)).split())
    title = page.title.replace("[", "(").replace("]", ")")
    return f"- [{title}]({page.canonical_url})" + (f": {desc}" if desc else "")


def _flatten(item) -> list[Page]:
    if isinstance(item, Page):
        return [item]
    if isinstance(item, Section):
        return [p for child in item.children for p in _flatten(child)]
    return []   # an external link in the nav


def on_post_build(config):
    nav = _state["nav"]
    site = config["site_url"]
    out = [f"# {config['site_name']}", "", f"> {config['site_description']}", "",
           f"Sitemap: {site}sitemap.xml", "",
           f"Weekly digest (RSS): {site}digest.xml", ""]
    listed: set[str] = set()
    sections = 0
    for item in nav.items:
        pages = _flatten(item)
        if not pages:
            continue
        out += [f"## {item.title}", ""] + [_line(p, config) for p in pages] + [""]
        listed.update(p.file.src_uri for p in pages)
        sections += 1
    all_pages = [f.page for f in _state["files"].documentation_pages() if f.page is not None]
    extra = sorted((p for p in all_pages if p.file.src_uri not in listed),
                   key=lambda p: p.file.src_uri)
    if extra:
        out += ["## Optional", ""] + [_line(p, config) for p in extra] + [""]
    text = "\n".join(out).rstrip() + "\n"
    (Path(config["site_dir"]) / "llms.txt").write_text(text, encoding="utf-8")
    in_nav = len(listed)
    print("llms_txt: site/llms.txt, a map of the site for AI systems")
    print(f"  em dashes          : {text.count(chr(0x2014))} (expected 0: site copy has none)")
    print(f"  nav sections       : {sections}")
    print(f"  pages in the nav   : {in_nav}")
    print(f"  pages outside it   : {len(extra)} (listed under Optional)")
    print(f"  total              : {in_nav + len(extra)} of {len(all_pages)} pages"
          + (" (cross-check ok)" if in_nav + len(extra) == len(all_pages) else " MISMATCH"))
    if in_nav + len(extra) != len(all_pages):
        raise ValueError("llms_txt: listed pages do not add up to the site's pages")
