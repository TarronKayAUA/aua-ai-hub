"""MkDocs hook: one page per prompt (layout redesign L17, owner decision 5,
2026-09-25).

Every entry in data/prompts.yaml gets its own page at prompts/<slug>/, the
same slug the library row's #anchor has always used, so an address and an
anchor always name the same prompt. Nothing is written to docs/: the pages
are virtual files added in on_files, built from the data file on every
build, and they sit in the Prompt Library section of the navigation (tab,
breadcrumb, "Back to Prompt Library") without being listed in the sidebar.

A page reads, top to bottom: title, meta line, tagline; "How to use it"
(the entry's optional `use:` steps, or its notes when it has none) with
Copy prompt; the notes; the prompt text, wrapped and folded after about
24rem with a second Copy; "Where it is used", computed from every link to
the prompt across the built site; and related prompts, computed from the
notes and the categories.

Checks, because MkDocs anchor validation never sees links a hook writes:
every link in the library and in each prompt page must resolve to a built
page or file, and every #fragment to an id on it (on_post_page); the text
each Copy button copies must be byte-identical to data/prompts.yaml, on the
library and on every page; and every prompt page must be in sitemap.xml
(on_post_build). Any failure stops the build.
"""
from __future__ import annotations

import html as _html
import json
import re
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import render_data as rd
from mkdocs.structure.files import File, InclusionLevel
from mkdocs.utils import get_relative_url

LIBRARY = "prompts/index.md"
TEXT_SLOT = '<div class="pp-text" data-pp-text="{slug}"></div>'
USED_SLOT = '<div class="pp-used" data-pp-used="{slug}"></div>'
RELATED_MAX = 3
_HOST = "https://site.invalid/"

_state: dict = {}


# --- page content -------------------------------------------------------------


def _mentions(text: str, title: str):
    return re.search(r"(?<![\w-])" + re.escape(title.lower()) + r"(?![\w-])", text.lower())


# Common words that say nothing about what a prompt is for.
_STOP = frozenset({
    "about", "after", "again", "against", "also", "always", "another", "answer",
    "around", "attach", "attached", "because", "before", "being", "below",
    "between", "both", "build", "builds", "built", "cannot", "check", "could",
    "does", "doing", "each", "every", "first", "from", "have", "into", "item",
    "items", "just", "like", "made", "make", "makes", "more", "most", "much",
    "must", "need", "never", "only", "other", "over", "paste", "prompt",
    "prompts", "same", "says", "should", "since", "some", "such", "than", "that",
    "their", "them", "then", "there", "these", "they", "this", "those",
    "through", "under", "until", "used", "uses", "using", "very", "what", "when",
    "where", "which", "while", "will", "with", "without", "work", "works",
    "would", "write", "your", "yours",
})


def _words(entry: dict) -> set[str]:
    text = (entry["tagline"] + " " + rd._plain(entry.get("notes", ""))).lower()
    return {w for w in re.findall(r"[a-z]{4,}", text) if w not in _STOP}


def _related_one(slug: str, by_slug: dict, words: dict) -> list[str]:
    entry = by_slug[slug]
    ordered: list[str] = []
    notes = rd._plain(entry.get("notes", ""))
    named = sorted((m.start(), other) for other, e in by_slug.items()
                   if other != slug and (m := _mentions(notes, e["title"])))
    ordered += [other for _, other in named]
    ordered += [other for other, e in by_slug.items()
                if _mentions(rd._plain(e.get("notes", "")), entry["title"])]
    for category in [entry["category"], *entry.get("also_for", [])]:
        section = [other for other, e in by_slug.items()
                   if (category == e["category"] or category in e.get("also_for", []))
                   and ("both" in (entry["audience"], e["audience"])
                        or entry["audience"] == e["audience"])]
        section.sort(key=lambda other: -len(words[slug] & words[other]))
        ordered += section
    picked: list[str] = []
    for other in ordered:
        if other != slug and other not in picked and len(picked) < RELATED_MAX:
            picked.append(other)
    return picked


def _related(prompts: list[dict]) -> dict[str, list[str]]:
    """Up to RELATED_MAX related prompts for each prompt, in this order:
    prompts its notes name (in the order named), prompts whose notes name
    it, then prompts in its own sections for a compatible audience, closest
    first by the words their taglines and notes share (ties in file order)."""
    by_slug = {rd._prompt_slug(e["title"]): e for e in prompts}
    words = {slug: _words(e) for slug, e in by_slug.items()}
    return {slug: _related_one(slug, by_slug, words) for slug in by_slug}


def _round_words(n: int) -> int:
    return n if n < 100 else round(n, -1)


def _sentence(text: str) -> str:
    text = " ".join(text.split())
    return text if text.endswith((".", "?", "!")) else text + "."


def _markdown(entry: dict, slug: str, related: list[str], by_slug: dict) -> str:
    """The page source. Links in markdown (notes, steps, the statuses link)
    are validated by MkDocs itself; the raw HTML ones are checked by
    on_post_page."""
    title = entry["title"]
    status, _ = rd.PROMPT_STATUS_LABELS[entry["status"]]
    audience = rd.PROMPT_AUDIENCE_META[entry["audience"]]
    notes = (entry.get("notes") or "").strip()
    use = entry.get("use")
    esc_title = _html.escape(title)
    meta = (f'<span class="meta-chip">Prompt</span><span class="meta-chip">{audience}</span>'
            f'<span class="meta-chip">{status}</span> <span class="meta-note">'
            "[Draft and Reviewed prompts are both usable](index.md#prompt-statuses)</span>")
    lines = [
        f"# {title}",
        "",
        meta,
        "",
        _sentence(entry["tagline"]),
        "{: .pp-lede }",
        "",
        '<div class="pp-panel" data-page-action markdown>',
        "",
        "## How to use it { #how-to-use-it }",
        "",
    ]
    if use:
        lines += [f"{i}. {' '.join(step.split())}" for i, step in enumerate(use, 1)]
    else:
        lines += [notes]
    copy_button = ('<button type="button" class="md-button md-button--primary pp-copy" '
                   f'data-copy-from="prompt-text-source" data-title="{esc_title}" hidden>Copy prompt</button>')
    save_button = (f'<button type="button" class="pl-save pp-save" data-save="{slug}" '
                   f'data-title="{esc_title}" hidden>Save</button>')
    lines += [
        "",
        '<div class="pp-actions" data-search-exclude>',
        copy_button,
        '<a class="md-button pp-read" href="#the-prompt">Read the prompt</a>',
        save_button,
        "</div>",
        "",
    ]
    # The requirement the library shows beside Copy, kept beside it here
    # too, under the buttons so Copy stays on a phone's first screen. When
    # the notes fill the panel (no `use:` steps) it is already in them.
    if use and entry.get("note_visible"):
        lines += [f'<p class="pp-note">{_html.escape(" ".join(entry["note_visible"].split()))}</p>', ""]
    lines += ["</div>", ""]
    if use and notes:
        lines += ["## Notes { #notes }", "", notes, ""]
    words = len(entry["prompt"].split())
    lines += [
        "## The prompt { #the-prompt }",
        "",
        f"About {_round_words(words):,} words. Copy prompt copies all of it, word for word.",
        "{: .pp-text-intro }",
        "",
        TEXT_SLOT.format(slug=slug),
        "",
        "## Where it is used { #where-it-is-used }",
        "",
        USED_SLOT.format(slug=slug),
        "",
    ]
    if related:
        rows = "".join(
            f'<li><a href="../{other}/"><span class="pp-rows__title">'
            f'{_html.escape(by_slug[other]["title"])}</span><span class="pp-rows__sub">'
            f'{_html.escape(_sentence(by_slug[other]["tagline"]))}</span></a></li>'
            for other in related)
        lines += ["## Related prompts { #related-prompts }", "",
                  f'<ul class="pp-rows">{rows}</ul>', ""]
    return "\n".join(lines)


# The stored prompts are hard-wrapped at about 72 characters. Shown as
# they are, every line breaks twice on a phone and reads raggedly, so the
# page shows them reflowed: a line break the author's wrap width made is
# joined back into its sentence, and every intentional one (a heading, a
# list item, a field such as "Key: E", a short line, a blank line) stays.
# Only whitespace changes, which on_page_content proves for every prompt;
# Copy never uses this text (see _text_block).
_REFLOW_WIDTH = 50
_REFLOW_MARKER = re.compile(r"^(?:[-*•] |\d+[.)] |\([A-Za-z0-9]{1,3}\) |[A-Z]{1,2}\d{1,2} [A-Z]|\[)")
_REFLOW_LABEL = re.compile(r"^[A-Z][A-Za-z0-9 ,/()'&.-]{0,60}:(?:\s|$)")
_REFLOW_HEADING = re.compile(r"^[A-Z][A-Z0-9 ,/'&-]{2,}(?:\s*\(.*\))?:?$")


_REFLOW_COLUMNS = re.compile(r"\S {3,}\S")


def _reflow(text: str) -> str:
    out: list[str] = []
    last_indent = 0
    last_len = 0
    for line in text.split("\n"):
        cur = line.strip()
        indent = len(line) - len(line.lstrip(" "))
        prev = out[-1].rstrip() if out else ""
        join = (cur and prev and last_len >= _REFLOW_WIDTH
                and indent >= last_indent  # a dedent starts a new line
                and not prev.endswith("]")
                and not (prev.endswith(":") and not cur[0].islower())
                and not _REFLOW_COLUMNS.search(prev) and not _REFLOW_COLUMNS.search(line)
                and not _REFLOW_HEADING.match(prev.strip())
                and not _REFLOW_HEADING.match(cur)
                and not _REFLOW_MARKER.match(cur)
                and not _REFLOW_LABEL.match(cur))
        if join:
            # A word hyphenated across the break ("single-best-" then
            # "answer") joins without a space.
            glue = "" if re.search(r"[A-Za-z]-$", prev) else " "
            out[-1] = prev + glue + cur
        else:
            out.append(line)
        last_indent = indent if cur else 0
        last_len = len(line.rstrip())
    return "\n".join(out)


def _text_block(entry: dict) -> str:
    """The prompt as readers see it, and, separately, as Copy gives it.

    The visible block is the reflowed text, excluded from search so a hit
    shows the page's title, tagline and notes rather than a wall of
    instructions. The copy source is the stored text itself, in a JSON
    island, so both Copy buttons give data/prompts.yaml byte for byte."""
    title = _html.escape(entry["title"])
    body = _html.escape(_reflow(entry["prompt"]), quote=False)
    # A <section> holding no other <section>: Material's search parser
    # matches elements by tag name alone, so an excluded <div> would stop
    # being excluded at the first nested </div>.
    return (
        '<section class="pp-text" id="prompt-text" aria-label="Prompt text" data-search-exclude>'
        f'<div class="pp-text__body" id="prompt-text-body">{body}</div>'
        '<div class="pp-text__bar">'
        f'<button type="button" class="md-button pp-copy" data-copy-from="prompt-text-source" '
        f'data-title="{title}" hidden>Copy prompt</button>'
        '<button type="button" class="md-button pp-expand" aria-expanded="true" '
        'aria-controls="prompt-text-body" hidden>Show the whole prompt</button>'
        "</div></section>"
        f'<script type="application/json" id="prompt-text-source">{rd.prompt_json(entry["prompt"])}</script>'
    )


# --- hook events ----------------------------------------------------------------


def on_files(files, config):
    prompts = rd.load_prompts(config)
    by_slug = {rd._prompt_slug(e["title"]): e for e in prompts}
    related = _related(prompts)
    _state.clear()
    _state["pages"] = {}
    for slug, entry in by_slug.items():
        src = f"prompts/{slug}.md"
        if files.get_file_from_path(src) is not None:
            raise ValueError(f"layout_prompt_pages: docs/{src} exists, so the page for "
                             f"{entry['title']!r} cannot be generated there")
        files.append(File.generated(config, src, content=_markdown(entry, slug, related[slug], by_slug),
                                    inclusion=InclusionLevel.NOT_IN_NAV))
        _state["pages"][src] = (slug, entry)
    _state["related_rows"] = sum(len(v) for v in related.values())
    return files


def on_nav(nav, config, files):
    """Give each prompt page the Prompt Library as its parent, without
    listing it: the Tools & Prompts tab is active, the breadcrumb reads
    Home > Tools & Prompts > Prompt Library, and the page ending's Back row
    returns to the library."""
    library = files.get_file_from_path(LIBRARY)
    section = library.page.parent if library is not None and library.page is not None else None
    if section is None:
        raise ValueError("layout_prompt_pages: prompts/index.md is not in a nav section")
    for src in _state["pages"]:
        files.get_file_from_path(src).page.parent = section
    _state["nav_rank"] = {p.file.src_uri: i for i, p in enumerate(nav.pages)}
    return nav


def on_page_markdown(markdown, page, config, files):
    found = _state.get("pages", {}).get(page.file.src_uri)
    if not found:
        return markdown
    # A prompt page is a Task page (layout plan section 4): one action,
    # Copy prompt, in the reading frame. Set here, after layout_frame.py has
    # typed the page by its address, rather than with front matter
    # `template: task`, because MkDocs itself reads `template` as the name of
    # the Jinja template to render and fails the build on "task".
    page.meta["page_type"] = "task"
    # Also set after render_data.py has run, so the page ending
    # (layout_frame.py) prints the prompt's own review date from
    # data/prompts.yaml, and render_data's note about the machine review of
    # prose pages, which does not cover prompts, is not added.
    if found[1].get("last_reviewed"):
        page.meta["last_reviewed"] = found[1]["last_reviewed"]
    return markdown


def on_page_content(html, page, config, files):
    found = _state.get("pages", {}).get(page.file.src_uri)
    if not found:
        return html
    slug, entry = found
    slot = TEXT_SLOT.format(slug=slug)
    if html.count(slot) != 1:
        raise AssertionError(f"layout_prompt_pages: prompt text slot missing on {page.file.src_uri}")
    if re.sub(r"\s", "", _reflow(entry["prompt"])) != re.sub(r"\s", "", entry["prompt"]):
        raise AssertionError(f"layout_prompt_pages: the reflowed display of {entry['title']!r} "
                             "changed more than whitespace")
    return html.replace(slot, _text_block(entry))


def _text(fragment: str) -> str:
    fragment = re.sub(r'<a class="headerlink".*?</a>', "", fragment, flags=re.DOTALL)
    return " ".join(_html.unescape(re.sub(r"<[^>]+>", "", fragment)).split())


_HEAD_RE = re.compile(r'<h([1-6])[^>]*\bid="([^"]+)"[^>]*>(.*?)</h\1>', re.DOTALL)
_LINK_RE = re.compile(r'<a\s[^>]*?\bhref="([^"]*)"[^>]*>(.*?)</a>', re.DOTALL)


def on_env(env, config, files):
    """Every page's final content exists now, so "Where it is used" can be
    computed from the links the readers will actually see: a link to a
    prompt's #anchor or page, or a link to the library whose text names
    the prompt (the guides link some prompts through their category)."""
    pages = _state["pages"]
    library = files.get_file_from_path(LIBRARY)
    lib_path = "/" + library.url
    page_path = {"/" + files.get_file_from_path(src).url: slug for src, (slug, _) in pages.items()}
    titles = {slug: " ".join(entry["title"].lower().split()) for slug, entry in pages.values()}
    used: dict[str, dict] = {slug: {} for slug in titles}
    for f in files.documentation_pages():
        page = f.page
        if page is None or not page.content or f.src_uri == LIBRARY or f.src_uri in pages:
            continue
        content = page.content
        heads = [(m.start(), int(m.group(1)), m.group(2), _text(m.group(3)))
                 for m in _HEAD_RE.finditer(content)]
        for m in _LINK_RE.finditer(content):
            parts = urlsplit(urljoin(_HOST + f.url, _html.unescape(m.group(1))))
            if parts.netloc != urlsplit(_HOST).netloc:
                continue
            hits = set()
            if parts.path == lib_path:
                if parts.fragment in titles:
                    hits.add(parts.fragment)
                else:
                    text = _text(m.group(2)).lower()
                    hits |= {slug for slug, t in titles.items() if t in text}
            elif parts.path in page_path:
                hits.add(page_path[parts.path])
            if not hits:
                continue
            before = [h for h in heads if h[0] < m.start() and h[1] in (2, 3)]
            anchor, heading = (before[-1][2], before[-1][3]) if before else (None, None)
            for slug in hits:
                used[slug].setdefault(f.src_uri, (page, anchor, heading))
    rank = _state["nav_rank"]
    total = 0
    for src, (slug, _entry) in pages.items():
        ppage = files.get_file_from_path(src).page
        rows = []
        for tsrc, (tpage, anchor, heading) in sorted(used[slug].items(),
                                                     key=lambda kv: (rank.get(kv[0], 10**6), kv[0])):
            href = get_relative_url(tpage.file.url, ppage.file.url) + (f"#{anchor}" if anchor else "")
            sub = f'<span class="pp-rows__sub">{_html.escape(heading)}</span>' if heading else ""
            rows.append(f'<li><a href="{_html.escape(href)}"><span class="pp-rows__title">'
                        f'{_html.escape(tpage.title or tsrc)}</span>{sub}</a></li>')
        total += len(rows)
        block = (f'<ul class="pp-rows">{"".join(rows)}</ul>' if rows else
                 '<p class="pp-used-none">No other page on this site links to this prompt yet.</p>')
        slot = USED_SLOT.format(slug=slug)
        if ppage.content.count(slot) != 1:
            raise AssertionError(f"layout_prompt_pages: where-used slot missing on {src}")
        ppage.content = ppage.content.replace(slot, block)
    _state["used_rows"] = total
    _state["used_none"] = sorted(entry["title"] for slug, entry in pages.values() if not used[slug])
    _state["files"] = files
    # The home page's File.url is "./", a form urljoin never produces, so
    # key every page by the path a resolved link actually has.
    _state["ids"] = {_site_path(f.url): set(re.findall(r'\bid="([^"]+)"', f.page.content or ""))
                     for f in files.documentation_pages() if f.page is not None}
    _state["urls"] = {"/" + _site_path(f.url) for f in files}
    _state["links_checked"] = 0
    _state["copies_checked"] = 0
    return env


_ISLAND_RE = re.compile(r'<script type="application/json" id="prompt-texts">(.*?)</script>', re.DOTALL)
_BODY_RE = re.compile(r'<div class="pp-text__body" id="prompt-text-body">(.*?)</div>', re.DOTALL)
_SOURCE_RE = re.compile(r'<script type="application/json" id="prompt-text-source">(.*?)</script>', re.DOTALL)


def _site_path(url: str) -> str:
    return "" if url in ("./", ".") else url


def _check_links(output: str, page) -> int:
    start, end = output.find("<article"), output.rfind("</article>")
    if start == -1 or end == -1:
        raise AssertionError(f"layout_prompt_pages: no article on {page.file.src_uri}")
    article = output[start:end]
    own_ids = set(re.findall(r'\bid="([^"]+)"', output))
    checked = 0
    for href in re.findall(r'\bhref="([^"]*)"', article):
        href = _html.unescape(href)
        if not href or re.match(r"[a-z][a-z0-9+.-]*:", href, re.IGNORECASE) or href.startswith("//"):
            continue  # external, mailto: and the like are verify_links.py's job
        parts = urlsplit(urljoin(_HOST + page.file.url, href))
        path, fragment = parts.path, parts.fragment
        same = path == "/" + page.file.url
        if not same and path not in _state["urls"]:
            raise AssertionError(f"layout_prompt_pages: {page.file.src_uri} links to {href!r}, "
                                 "which is not a page or file in the built site")
        if fragment:
            ids = own_ids if same else _state["ids"].get(path.lstrip("/"), set())
            if fragment not in ids:
                raise AssertionError(f"layout_prompt_pages: {page.file.src_uri} links to {href!r}, "
                                     f"but that page has no #{fragment}")
        checked += 1
    return checked


def on_post_page(output, page, config):
    src = page.file.src_uri
    pages = _state.get("pages", {})
    if src == LIBRARY:
        _state["links_checked"] += _check_links(output, page)
        found = _ISLAND_RE.findall(output)
        if len(found) != 1:
            raise AssertionError("layout_prompt_pages: the library has no single prompt text island")
        texts = json.loads(found[0])
        expected = {slug: entry["prompt"] for slug, entry in pages.values()}
        if texts != expected:
            bad = sorted(s for s in expected if texts.get(s) != expected[s])
            raise AssertionError(f"layout_prompt_pages: library Copy text differs from "
                                 f"data/prompts.yaml for {bad or 'the set of prompts'}")
        _state["copies_checked"] += len(texts)
    elif src in pages:
        _slug, entry = pages[src]
        _state["links_checked"] += _check_links(output, page)
        source = _SOURCE_RE.findall(output)
        if len(source) != 1 or json.loads(source[0]) != entry["prompt"]:
            raise AssertionError(f"layout_prompt_pages: the Copy text on {src} is not "
                                 "byte-identical to data/prompts.yaml")
        shown = _BODY_RE.findall(output)
        if len(shown) != 1 or (re.sub(r"\s", "", _html.unescape(shown[0]))
                               != re.sub(r"\s", "", entry["prompt"])):
            raise AssertionError(f"layout_prompt_pages: the prompt shown on {src} differs "
                                 "from data/prompts.yaml by more than line breaks")
        _state["copies_checked"] += 1
    return output


def on_post_build(config):
    pages = _state["pages"]
    sitemap = Path(config.site_dir) / "sitemap.xml"
    locs = set(re.findall(r"<loc>([^<]+)</loc>", sitemap.read_text(encoding="utf-8")))
    base = (config.site_url or "").rstrip("/") + "/"
    files = _state["files"]
    missing = [src for src in pages
               if base + files.get_file_from_path(src).url not in locs]
    if missing:
        raise AssertionError(f"layout_prompt_pages: prompt pages missing from sitemap.xml: {missing}")
    expected_copies = 2 * len(pages)  # the library's 24, plus one per page
    if _state["copies_checked"] != expected_copies:
        raise AssertionError(f"layout_prompt_pages: checked {_state['copies_checked']} copy "
                             f"texts, expected {expected_copies}")
    print("layout_prompt_pages: prompt pages verification")
    print(f"  prompts read      : {len(pages)}")
    print(f"  pages generated   : {len(pages)} (in sitemap.xml: {len(pages) - len(missing)}, cross-check ok)")
    print(f"  copy texts        : {_state['copies_checked']} byte-identical to data/prompts.yaml "
          f"({len(pages)} in the library, {len(pages)} on the pages)")
    print(f"  links asserted    : {_state['links_checked']} (library and prompt pages, all resolve)")
    print(f"  where-used rows   : {_state['used_rows']}; not linked yet: "
          f"{', '.join(_state['used_none']) or 'none'}")
    print(f"  related rows      : {_state['related_rows']}")
