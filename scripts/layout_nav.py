"""MkDocs hook: the section navigator (navigation synthesis, 2026-09-26).

No page has a left navigation sidebar or a right "On this page" column
(scripts/layout_frame.py hides both everywhere). What they did is done here,
from one model of each tab built from the nav in mkdocs.yml, with icons,
one-line subtitles, nouns and kinds from data/section_map.yaml:

  - the SECTION MAP: a tab drawn as groups of small cards with icons, the
    current page filled and marked in words. A subsection of the tab is a
    group; a run of pages sitting directly in the tab is a group named in
    data/section_map.yaml. Which pages appear, their order and their titles
    come from mkdocs.yml and nothing else. Each group's badge counts its own
    pages with its noun ("5 guides"); a lesson a group builds on (Module 7
    for Work with Agents) sits apart under "Related lesson in Learn".
  - the PAGE FOOT on every inner page: "More in this section" cards (the
    section or group overview first, then nav order); on the seven modules,
    where there is a real order, "Where to go next" instead, holding the
    module's own Next (moved here from the end of its text, so every module
    ends the same way) and, secondary, Previous and any related group. Then
    the whole section map in a closed <details>, and the page's sections in
    another (a compact A to Z for a page that has the glossary's index).
    These are the links a reader without JavaScript uses;
    docs/javascripts/layout-nav.js lifts the same HTML into the "Browse
    <section>" and "On this page" controls, so they can never disagree.
  - the TOOLS & PROMPTS LANDING (docs/tools-and-prompts.md, slot
    <div data-tp-landing></div>): "Find a Tool" and "Use a Prompt" first,
    each with a browse button and a few shortcuts, then the guide groups in
    parallel, then a Compare Models band. The first two nav groups of the
    tab are the primary cards, the last is the band, the rest are guides.
    Counts come from data/tools.yaml, data/tool_tasks.yaml and
    data/prompts.yaml; which shortcuts appear, and any shorter landing label,
    from presentation flags (`landing: true` in tool_tasks.yaml;
    PROMPT_CATEGORY_LANDING and PROMPT_CATEGORY_LANDING_LABELS in
    scripts/render_data.py), never typed here.
  - COLOR BY MEANING: every page has a kind (tool, prompt, guide, lesson,
    benchmark, news, governance, or none), derived from the `kinds:`,
    tab, group and page entries in data/section_map.yaml. Every list or
    card that points at a page wears that page's kind through one shared
    rule (a left bar, a tint, a colored title): the maps, the page feet,
    the landing, the landing pages' rows and cards, the Learn route map and
    shelf, a module's Next, the Prompt Library's rows, and a prompt page's
    "Where it is used" and "Related prompts". Utility controls keep the
    common control color. Each kind names a hue in the palette block at the
    top of docs/stylesheets/layout-nav.css; the kind-to-hue mapping is
    written into each page as CSS custom properties, so reassigning a color
    is a data edit and changing one is a token edit. A quiet "Color key"
    names the kinds drawn: on a landing page once, above the first colored
    block; on an inner page above each colored block that adds a kind the
    page has not keyed yet; and always inside the section map.
  - PROMPT LINKS go to the prompt's own page: a link to the Prompt Library
    with a prompt's anchor (prompts/index.md#<slug>, in hub rows, guides and
    prompt notes) is rewritten, in on_page_content, to that prompt's
    generated page. Category anchors and query links are left alone. It runs
    before on_env, so "Where it is used" counts the rewritten link exactly
    as it counted the anchor.
  - BREADCRUMBS: a group with no overview page of its own (Work with
    sources) makes Material link its crumb to its first page; the crumb
    goes to the group's anchor on the section's landing page instead.

Everything else is written in on_post_page, when every page's title is
known, so none of it enters the search index (a map on every page would
otherwise make every page match every section's titles), the narration
(which reads markdown), or the "Where it is used" counts. Every link is made
with get_relative_url from a page that exists, every generated href is
checked against the built site after the build (fragments included), and
the build prints what it wrote and fails on a mismatch (CLAUDE.md working
rule 2).
"""
from __future__ import annotations

import html as _html
import re
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import material
import yaml
from mkdocs.utils import get_relative_url

import layout_frame
import render_data as rd

ICONS = Path(material.__file__).parent / "templates" / ".icons" / "material"
LANDING_SLOT = "<div data-tp-landing></div>"
LANDING_TAB = "Tools & Prompts"
LIBRARY = "prompts/index.md"
PALETTE_CSS = Path("docs") / "stylesheets" / "layout-nav.css"
_HOST = "https://hub.invalid/"

# What each block of data/section_map.yaml may hold. An unquoted comma in a
# YAML flow mapping ends the value and turns the rest of the line into stray
# keys ("sub: Chat, work, or code" becomes sub "Chat" plus keys "work" and
# "or code"), so unknown keys fail the build.
ALLOWED = {
    "kinds": {"label", "token", "description"},
    "tabs": {"icon", "loose", "kind"},
    "groups": {"icon", "blurb", "route", "kind", "tag", "module", "steps", "noun", "anchor"},
    "pages": {"icon", "sub", "kind"},
}

_S: dict = {}


# --- data ------------------------------------------------------------------------

def _palette(root: Path) -> dict[str, set]:
    """The hue names the palette block defines, per scheme: a hue counts
    only when --hue-<name>, --hue-<name>-tint and --hue-<name>-line are all
    set, so a kind can never point at half a hue."""
    css = (root / PALETTE_CSS).read_text(encoding="utf-8")
    start, end = css.find("/* PALETTE START"), css.find("/* PALETTE END")
    if start == -1 or end == -1:
        raise ValueError(f"layout_nav: {PALETTE_CSS} has no PALETTE START / PALETTE END block")
    block = css[start:end]
    light = re.search(r'\[data-md-color-scheme="default"\]\s*\{(.*?)\}', block, re.S)
    dark = re.search(r'\[data-md-color-scheme="slate"\]\s*\{(.*?)\}', block, re.S)
    if not light or not dark:
        raise ValueError(f"layout_nav: the palette block in {PALETTE_CSS} needs a light "
                         "and a slate rule")
    out = {}
    for scheme, m in (("light", light), ("dark", dark)):
        names = set(re.findall(r"--hue-([a-z]+)(?:-(?:tint|line))?\s*:", m.group(1)))
        out[scheme] = {n for n in names
                       if all(re.search(rf"--hue-{n}{s}\s*:", m.group(1)) for s in ("", "-tint", "-line"))}
    return out


def on_config(config):
    root = Path(config["docs_dir"]).parent
    deco = yaml.safe_load((root / "data" / "section_map.yaml").read_text(encoding="utf-8")) or {}
    tools = yaml.safe_load((root / "data" / "tools.yaml").read_text(encoding="utf-8")) or []
    tasks = yaml.safe_load((root / "data" / "tool_tasks.yaml").read_text(encoding="utf-8")) or []
    prompts = rd.load_prompts(config)
    extra_top = set(deco) - set(ALLOWED) - {"order"}
    if extra_top:
        raise ValueError(f"layout_nav: data/section_map.yaml has unknown blocks {sorted(extra_top)}")
    for block, keys in ALLOWED.items():
        for name, entry in (deco.get(block) or {}).items():
            extra = set(entry or {}) - keys
            if extra:
                raise ValueError(f"layout_nav: data/section_map.yaml {block} {name!r} has unknown "
                                 f"keys {sorted(extra)}; quote a value that contains a comma")
    kinds = deco.get("kinds") or {}
    palette = _palette(root)
    for kid, k in kinds.items():
        if not re.fullmatch(r"[a-z]+", kid) or not (k or {}).get("label") or not k.get("token"):
            raise ValueError(f"layout_nav: kind {kid!r} needs a lowercase id, a label and a token")
        for scheme in ("light", "dark"):
            if k["token"] not in palette[scheme]:
                raise ValueError(f"layout_nav: kind {kid!r} uses hue {k['token']!r}, which the "
                                 f"palette block in {PALETTE_CSS} does not define for the "
                                 f"{scheme} scheme (--hue-{k['token']}, -tint and -line)")
    order = deco.get("order") or []
    if sorted(order) != sorted(kinds):
        raise ValueError(f"layout_nav: data/section_map.yaml `order:` must list every kind once "
                         f"(kinds: {sorted(kinds)}; order: {order})")
    for block in ("tabs", "groups", "pages"):
        for name, entry in (deco.get(block) or {}).items():
            if (entry or {}).get("kind") and entry["kind"] not in kinds:
                raise ValueError(f"layout_nav: {block} {name!r} names kind {entry['kind']!r}, "
                                 f"which is not in the kinds table")
    for cat in rd.PROMPT_CATEGORY_LANDING:
        if cat not in rd.PROMPT_CATEGORY_LABELS:
            raise ValueError(f"layout_nav: PROMPT_CATEGORY_LANDING names unknown category {cat!r}")
    for cat in rd.PROMPT_CATEGORY_LANDING_LABELS:
        if cat not in rd.PROMPT_CATEGORY_LANDING:
            raise ValueError(f"layout_nav: PROMPT_CATEGORY_LANDING_LABELS names {cat!r}, which "
                             "is not a landing shortcut")
    label = (config.get("extra") or {}).get("nav_control_label", False)
    if not isinstance(label, bool):
        raise ValueError("layout_nav: mkdocs.yml extra: nav_control_label must be true or false")
    _S.clear()
    _S.update(fold_label=label,
        deco=deco, kinds=kinds, palette=palette, icons={}, tabs=[], where={}, kind={},
        counts={"tools": len(tools), "prompts": len(prompts)},
        tools=tools, tasks=tasks, members=rd.tool_task_members(tools, tasks), prompts=prompts,
        hrefs=[], feet=0, expected_feet=0, full=0, keys=0, rows={}, row_pages=0,
        tocs=0, azs=0, undecorated=set(), module_links=0, rewritten=0, rewrite_pages=0,
        crumbs=0, lesson_ends=0, door_feet=0, doors_seen=0, foot_dedup=[],
    )
    if not tools or not prompts:
        raise ValueError("layout_nav: could not count data/tools.yaml or data/prompts.yaml")
    return config


def _icon(name: str) -> str:
    if name not in _S["icons"]:
        f = ICONS / f"{name}.svg"
        if not f.exists():
            raise ValueError(f"layout_nav: data/section_map.yaml names icon {name!r}, "
                             "which is not a Material Design icon")
        svg = f.read_text(encoding="utf-8").strip()
        _S["icons"][name] = svg.replace("<svg ", '<svg aria-hidden="true" focusable="false" ', 1)
    return _S["icons"][name]


def _fill(text: str) -> str:
    return text.format(**_S["counts"]) if text else ""


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


# --- the model: tabs, groups, entries, kinds -------------------------------------

def _pages_in(section) -> list:
    out = []
    for child in section.children:
        if child.is_page:
            out.append(child)
        elif child.is_section:
            out.extend(_pages_in(child))
    return out


def on_nav(nav, config, files):
    deco = _S["deco"]
    gdeco_all = deco.get("groups") or {}
    tabs = []
    for item in nav.items:
        if not item.is_section:
            continue
        tdeco = (deco.get("tabs") or {}).get(item.title) or {}
        loose = list(tdeco.get("loose") or [])
        tab = {"title": item.title, "icon": tdeco.get("icon", "folder-outline"),
               "kind": tdeco.get("kind"), "landing": None, "groups": [], "flat": []}
        children = list(item.children)
        first = children[0] if children else None
        if first is not None and first.is_page and (
                first.file.src_uri in layout_frame.DOOR
                or (first.meta or {}).get("page_type") == "door"):
            tab["landing"] = first
            children = children[1:]
        run = None
        for child in children:
            pages = _pages_in(child) if child.is_section else [child]
            # A one-page subsection folds into the run of loose pages (it
            # exists only so navigation.indexes leaves its index page alone),
            # unless data/section_map.yaml names it as a group of its own.
            wrapper = child.is_section and len(pages) == 1 and child.title not in gdeco_all
            if child.is_page or wrapper:
                if run is None:
                    name = loose.pop(0) if loose else item.title
                    run = {"title": name, "entries": [], "section": False}
                    tab["groups"].append(run)
                run["entries"].append({"page": pages[0], "title": child.title if wrapper else None})
            else:
                run = None
                tab["groups"].append({"title": child.title, "section": True,
                                      "entries": [{"page": p, "title": None} for p in pages]})
        for group in tab["groups"]:
            gdeco = gdeco_all.get(group["title"]) or {}
            module = None
            if gdeco.get("module"):
                f = files.get_file_from_path(gdeco["module"])
                if f is None or f.page is None:
                    raise ValueError(f"layout_nav: group {group['title']!r} names module "
                                     f"{gdeco['module']!r}, which is not a page")
                module = f.page
            steps = int(gdeco.get("steps") or 0)
            first_page = group["entries"][0]["page"] if group["entries"] else None
            # A group's overview: its index page, or the first page of a
            # group that numbers its steps after one (Work with Agents).
            has_overview = bool(first_page is not None and (first_page.is_index or steps))
            anchor = gdeco.get("anchor") or (_slug(group["title"]) if tab["title"] == LANDING_TAB else "")
            group.update(icon=gdeco.get("icon", tab["icon"]), blurb=gdeco.get("blurb", ""),
                         tag=gdeco.get("tag", ""), route=bool(gdeco.get("route")),
                         kind=gdeco.get("kind") or tab["kind"], module=module, steps=steps,
                         noun=gdeco.get("noun", "pages"), anchor=anchor,
                         overview=has_overview, tab=tab)
            for entry in group["entries"]:
                entry["group"] = group
                entry["pos"] = len(tab["flat"]) + 1
                tab["flat"].append(entry)
                src = entry["page"].file.src_uri
                _S["where"][src] = (tab, entry)
                pdeco = (deco.get("pages") or {}).get(src) or {}
                _S["kind"][src] = pdeco.get("kind") or group["kind"]
        if tab["flat"]:
            tabs.append(tab)
            if tab["landing"] is not None:
                src = tab["landing"].file.src_uri
                _S["where"][src] = (tab, None)
                pdeco = (deco.get("pages") or {}).get(src) or {}
                _S["kind"][src] = pdeco.get("kind") or tab["kind"]
    # The data file cannot drift from the nav: a group or page it decorates
    # must exist.
    known = {g["title"] for t in tabs for g in t["groups"]}
    stale = sorted(set(gdeco_all) - known)
    if stale:
        raise ValueError(f"layout_nav: data/section_map.yaml decorates groups the nav does not "
                         f"have: {stale}")
    stale = sorted(set(deco.get("pages") or {}) - set(_S["where"]))
    if stale:
        raise ValueError(f"layout_nav: data/section_map.yaml decorates pages the nav does not "
                         f"have: {stale}")
    if not any(t["title"] == LANDING_TAB for t in tabs):
        raise ValueError(f"layout_nav: the nav has no {LANDING_TAB!r} tab")
    _S["tabs"] = tabs
    _S["files"] = files
    _S["by_path"] = {f.url: f for f in files.documentation_pages()}
    for g in (g for t in tabs for g in t["groups"] if g["module"] is not None):
        _S.setdefault("module_of", {})[g["module"].file.src_uri] = g
    # Every generated prompt page, by the slug the library uses as its anchor.
    lib = files.get_file_from_path(LIBRARY)
    if lib is None:
        raise ValueError(f"layout_nav: no {LIBRARY}")
    _S["library_url"] = lib.url
    urls = {}
    for entry in _S["prompts"]:
        slug = rd._prompt_slug(entry["title"])
        f = files.get_file_from_path(f"prompts/{slug}.md")
        if f is None:
            raise ValueError(f"layout_nav: no generated page for prompt {entry['title']!r}")
        urls[slug] = f.url
    _S["prompt_urls"] = urls
    counts: dict[str, int] = {}
    for kind in _S["kind"].values():
        counts[kind or "none"] = counts.get(kind or "none", 0) + 1
    print("layout_nav: section model from the nav")
    for tab in tabs:
        print(f"  {tab['title']:<22}: {len(tab['flat']):>2} pages in {len(tab['groups'])} groups"
              + (f", landing {tab['landing'].file.src_uri}" if tab["landing"] else ", no landing"))
    print("  kinds of nav pages   : " + ", ".join(f"{k} {n}" for k, n in sorted(counts.items())))
    return nav


def _home_of(page):
    """For a page outside the nav (a prompt page, a weekly digest, an
    announcement): the nav page it belongs to, by its nav parent or else by
    the index page of its folder or the nearest folder above."""
    parent = page.parent
    while parent is not None:
        for p in _pages_in(parent):
            if p.file.src_uri in _S["where"] and _S["where"][p.file.src_uri][1] is not None:
                return p
        parent = parent.parent
    folder = page.file.src_uri.rsplit("/", 1)[0] if "/" in page.file.src_uri else ""
    while folder:
        cand = f"{folder}/index.md"
        if cand in _S["where"] and _S["where"][cand][1] is not None:
            return _S["where"][cand][1]["page"]
        folder = folder.rsplit("/", 1)[0] if "/" in folder else ""
    return None


def kind_of(src: str) -> str | None:
    """A page's kind: its own, or for a page outside the nav, that of the
    nav page it belongs to."""
    if src in _S["kind"]:
        return _S["kind"][src]
    f = _S["files"].get_file_from_path(src)
    if f is None or f.page is None:
        return None
    home = _home_of(f.page)
    kind = _S["kind"].get(home.file.src_uri) if home is not None else None
    _S["kind"][src] = kind
    return kind


def _kind_of_href(href: str, page) -> str | None:
    """The kind of the page a link opens (None for an external link or a
    page without a kind)."""
    parts = urlsplit(urljoin(_HOST + page.url, _html.unescape(href)))
    if parts.netloc != urlsplit(_HOST).netloc:
        return None
    path = parts.path.lstrip("/")
    f = _S["by_path"].get(path) or _S["by_path"].get(path.removesuffix("index.html"))
    return kind_of(f.src_uri) if f is not None else None


# --- prompt links go to the prompt's own page ----------------------------------------

_HREF_ATTR = re.compile(r'(\bhref=")([^"]*)(")')


def on_page_content(html, page, config, files):
    if page.file.src_uri == LIBRARY:
        return html      # the library's own anchors point at rows on the same page
    lib_path = _S["library_url"]
    host = urlsplit(_HOST).netloc
    n = 0

    def swap(m):
        nonlocal n
        href = _html.unescape(m.group(2))
        parts = urlsplit(urljoin(_HOST + page.url, href))
        if parts.netloc != host or parts.query or not parts.fragment:
            return m.group(0)
        path = parts.path.lstrip("/").removesuffix("index.html")
        if path != lib_path:
            return m.group(0)
        target = _S["prompt_urls"].get(parts.fragment)
        if target is None:
            return m.group(0)            # a category anchor (#research) stays
        n += 1
        new = get_relative_url(target, page.url)
        _S["hrefs"].append((page.url, new))
        return m.group(1) + _html.escape(new, quote=True) + m.group(3)

    html = _HREF_ATTR.sub(swap, html)
    if n:
        _S["rewritten"] += n
        _S["rewrite_pages"] += 1
    return html


# --- rendering: small pieces -----------------------------------------------------

def _esc(text) -> str:
    return _html.escape(str(text or ""), quote=True)


def _plain(fragment: str) -> str:
    fragment = re.sub(r'<a class="headerlink".*?</a>', "", fragment, flags=re.S)
    return " ".join(_html.unescape(re.sub(r"<[^>]+>", "", fragment)).replace("¶", "").split())


def _href(target, page, query: str = "", anchor: str = "") -> str:
    href = get_relative_url(target.url, page.url) + query + (f"#{anchor}" if anchor else "")
    _S["hrefs"].append((page.url, href))
    return href


def _page_title(page) -> str:
    """A page's own title. MkDocs falls back to the file name when it finds
    no title ("Index" for the News Archive, whose first line is a comment),
    so a title that is only the file name is replaced by the page's H1."""
    title = page.title or ""
    derived = page.file.name.replace("-", " ").replace("_", " ")
    if not title or title.lower() == derived.lower():
        m = re.search(r"<h1[^>]*>(.*?)</h1>", page.content or "", re.S)
        if m and _plain(m.group(1)):
            return _plain(m.group(1))
    return title or derived.capitalize()


def _title(entry) -> str:
    return entry["title"] or _page_title(entry["page"])


def _kattr(kind) -> str:
    return f' data-kind="{kind}"' if kind else ""


def _kcls(kind) -> str:
    return " kind-mark" if kind else ""


def _key(kinds_used) -> str:
    """The color key: one quiet line naming exactly the kinds drawn beside
    it, in the kinds table's order. Each swatch is a mini card drawn by the
    same rule as the items it explains (.kind-mark), so the key cannot name
    a color the items do not wear."""
    used = [k for k in _S["kinds"] if k in kinds_used]
    if not used:
        return ""
    _S["keys"] += 1
    items = "".join(f'<span class="kind-key__k"><span class="kind-key__sw kind-mark" data-kind="{k}" '
                    f'aria-hidden="true"></span>{_esc(_S["kinds"][k]["label"])}</span>' for k in used)
    return (f'<p class="kind-key" role="note" aria-label="What the colors mean">'
            f'<span class="kind-key__lead">Color key:</span> {items}</p>')


_NUM = re.compile(r"^(\d+)\.\s+(.+)$")


def _module_label(page) -> str:
    m = _NUM.match(_page_title(page))
    return f"Module {m.group(1)}: {m.group(2)}" if m else _page_title(page)


def _count(n: int, noun: str) -> str:
    one = noun[:-1] if noun.endswith("s") else noun
    return f"{n} {one if n == 1 else noun}"


# --- the section map -----------------------------------------------------------------

def _card(entry, here_src, page, inside: bool, used: set) -> str:
    p = entry["page"]
    src = p.file.src_uri
    pdeco = (_S["deco"].get("pages") or {}).get(src) or {}
    if not pdeco:
        _S["undecorated"].add(src)
    title = _title(entry)
    kind = kind_of(src)
    if kind:
        used.add(kind)
    mark = _icon(pdeco.get("icon", entry["group"]["icon"]))
    num = _NUM.match(title) if entry["group"]["route"] else None
    if num:
        mark, title = f'<span class="secmap__num">{num.group(1)}</span>', num.group(2)
    sub = _fill(pdeco.get("sub", ""))
    current = src == here_src
    # A page outside the nav (a prompt page, a weekly digest) marks the
    # page it belongs to: "true" rather than "page", since it is not it.
    attrs = (' aria-current="true"' if inside else ' aria-current="page"') if current else ""
    cls = "secmap__card" + _kcls(kind) + (" is-current" if current else "")
    here = (f'<span class="secmap__here">{"You are inside this" if inside else "You are here"}</span>'
            if current else "")
    # Spaces between the spans, so the link's text reads "Tool Directory 75
    # tools..." rather than "Tool Directory75 tools...".
    return (f'<li><a class="{cls}"{_kattr(kind)} href="{_esc(_href(p, page))}"{attrs}>'
            f'<span class="secmap__icon">{mark}</span>'
            f'<span class="secmap__words"><span class="secmap__title">{_esc(title)}</span>'
            + (f' <span class="secmap__sub">{_esc(sub)}</span>' if sub else "")
            + (f" {here}" if here else "") + "</span></a></li>")


def _module_card(group, page, used: set) -> str:
    """The Learn module a group builds on, as its own small block."""
    mod = group["module"]
    kind = kind_of(mod.file.src_uri)
    if kind:
        used.add(kind)
    _S["module_links"] += 1
    pdeco = (_S["deco"].get("pages") or {}).get(mod.file.src_uri) or {}
    sub = _fill(pdeco.get("sub", ""))
    return (f'<p class="secmap__subhead">Related Lesson in Learn</p>'
            f'<ul class="secmap__cards secmap__cards--related"><li>'
            f'<a class="secmap__card secmap__card--cross{_kcls(kind)}"{_kattr(kind)} '
            f'href="{_esc(_href(mod, page))}"><span class="secmap__icon">{_icon("school-outline")}</span>'
            f'<span class="secmap__words"><span class="secmap__title">{_esc(_module_label(mod))}</span>'
            + (f' <span class="secmap__sub">{_esc(sub)}</span>' if sub else "")
            + "</span></a></li></ul>"
            f'<p class="secmap__subhead">The {_esc(group["noun"].title())}</p>')


def _map(tab, here_src, page, inside: bool = False) -> str:
    groups = []
    used: set = set()
    for group in tab["groups"]:
        n = len(group["entries"])
        cls = "secmap__group"
        if group["route"]:
            cls += " secmap__group--route"
        if n >= 6:
            cls += " secmap__group--wide"
        if any(e["page"].file.src_uri == here_src for e in group["entries"]):
            cls += " is-here"
        related = ""
        if group["module"] is not None and group["module"].file.src_uri != here_src:
            related = _module_card(group, page, used)
        cards = "".join(_card(e, here_src, page, inside, used) for e in group["entries"])
        tag = f'<span class="secmap__tag">{_esc(group["tag"])}</span>' if group["tag"] else ""
        groups.append(f'<li class="{cls}"{_kattr(group["kind"])} data-group="{_esc(group["title"])}">'
                      f'<p class="secmap__head"><span class="secmap__gicon">{_icon(group["icon"])}</span>'
                      f'<span class="secmap__gname">{_esc(group["title"])}{tag}</span>'
                      f'<span class="secmap__count">{_esc(_count(n, group["noun"]))}</span></p>'
                      f'{related}<ul class="secmap__cards">{cards}</ul></li>')
    return (f'<div class="secmap" data-secmap><ol class="secmap__groups">{"".join(groups)}</ol>'
            f'{_key(used)}</div>')


# --- the page's sections ("On this page") ---------------------------------------------

_STOP = {"a", "an", "the", "and", "or", "of", "to", "for", "in", "on", "with", "your",
         "you", "is", "it", "by", "at", "from", "vs."}
SHORT_MAX = 30


def short_label(text: str, limit: int = SHORT_MAX) -> str:
    """A chip's words, taken from its heading: a heading that fits is kept;
    otherwise a trailing parenthesis goes, then the shorter side of a colon,
    then the words before a comma, and last the leading words with an
    ellipsis. The full heading stays the chip's accessible name and title."""
    t = " ".join(text.split())
    if len(t) <= limit:
        return t
    m = re.match(r"^(.*?\S)\s*\([^()]*\)$", t)
    if m and len(m.group(1)) >= 2:
        t = m.group(1)
        if len(t) <= limit:
            return t
    if ": " in t:
        head, tail = t.split(": ", 1)
        for cand in sorted((head, tail[:1].upper() + tail[1:]), key=len):
            if len(cand) <= limit and len(cand.split()) >= 1:
                return cand
        t = min((head, tail), key=len)
    if ", " in t:
        head = t.split(", ", 1)[0]
        if len(head) <= limit and len(head.split()) >= 2:
            return head
    out: list[str] = []
    for w in t.split():
        if len(" ".join(out + [w])) > limit - 1:
            break
        out.append(w)
    while len(out) > 1 and out[-1].lower().strip(",.;:") in _STOP:
        out.pop()
    return " ".join(out).rstrip(",.;:") + "…"


_H2 = re.compile(r'<h2\b[^>]*\bid="([^"]+)"[^>]*>(.*?)</h2>', re.S)
_AZ = re.compile(r'<(\w+) class="glossary-az"[^>]*>(.*?)</\1>', re.S)
_AZ_ITEM = re.compile(r'<a href="#([^"]+)">([^<]+)</a>|<span class="is-empty"[^>]*>([^<]+)</span>')


def _toc(article_html: str, page) -> str:
    heads = [(hid, _plain(inner)) for hid, inner in _H2.findall(article_html)]
    heads = [(hid, text) for hid, text in heads if text]
    if len(heads) < 2:
        return ""
    names = dict(heads)
    az = _AZ.search(article_html)
    if az:
        # A page with the glossary's A to Z index: its terms by letter, as
        # the index itself has them, instead of one chip per term.
        noun = "terms"
        items = []
        for hid, letter, empty in _AZ_ITEM.findall(az.group(2)):
            if hid:
                first = names.get(hid, "")
                items.append(f'<li><a class="secnav__chip secnav__letter" href="#{_esc(hid)}" '
                             f'title="{_esc(letter)}: from {_esc(first)}" '
                             f'aria-label="{_esc(letter)}, from {_esc(first)}">{_esc(letter)}</a></li>')
            else:
                items.append(f'<li><span class="secnav__letter is-empty" aria-hidden="true">'
                             f'{_esc(empty)}</span></li>')
        body = f'<ol class="secnav__chips secnav__az">{"".join(items)}</ol>'
        _S["azs"] += 1
    else:
        noun = "sections"
        overrides = (page.meta or {}).get("short_labels") or {}
        chips = []
        for hid, full in heads:
            short = overrides.get(hid) or short_label(full)
            name = f' aria-label="{_esc(full)}"' if short != full else ""
            chips.append(f'<li><a class="secnav__chip" href="#{_esc(hid)}" title="{_esc(full)}"{name}>'
                         f'{_esc(short)}</a></li>')
        body = f'<ol class="secnav__chips">{"".join(chips)}</ol>'
    _S["tocs"] += 1
    n = len(heads)
    return (f'<details class="secfoot__toc" data-sectoc data-count="{n}" data-noun="{noun}"><summary>'
            f'<span class="secfoot__sicon secfoot__sicon--toc">{_icon("format-list-bulleted")}</span>'
            f'<span class="secfoot__stext">On this page</span>'
            f'<span class="secfoot__scount">{n} {noun}</span></summary>'
            f'<div class="secfoot__body">{body}</div></details>')


# --- the page foot --------------------------------------------------------------------

def _foot_card(kind_label: str, target, title: str, sub: str, page, used: set, *,
               arrow: str = "", rel: str = "", cls: str = "", anchor: str = "", icon: str = "") -> str:
    kind = kind_of(target.file.src_uri)
    if kind:
        used.add(kind)
    pdeco = (_S["deco"].get("pages") or {}).get(target.file.src_uri) or {}
    mark = _icon(arrow) if arrow else _icon(icon or pdeco.get("icon", "file-document-outline"))
    href = _href(target, page, anchor=anchor)
    rel_attr = f' rel="{rel}"' if rel else ""
    dir_html = f'<span class="secfoot__dir">{_esc(kind_label)}</span> ' if kind_label else ""
    return (f'<a class="secfoot__card{(" " + cls) if cls else ""}{_kcls(kind)}"{_kattr(kind)} '
            f'href="{_esc(href)}"{rel_attr}><span class="secfoot__icon">{mark}</span>'
            f'<span class="secfoot__words">{dir_html}<span class="secfoot__title">{_esc(title)}</span>'
            + (f' <span class="secfoot__sub">{_esc(sub)}</span>' if sub else "")
            + "</span></a>")


def _entry_sub(entry) -> str:
    pdeco = (_S["deco"].get("pages") or {}).get(entry["page"].file.src_uri) or {}
    return _fill(pdeco.get("sub", "")) or entry["group"]["title"]


# A page-level list of links in the body: a list item or table cell that
# starts with its link (after any row tag or route number), or a card's link.
_BODY_LIST_LINK = re.compile(
    r'<(?:li|td)\b[^>]*>\s*(?:<span class="(?:row-tag|route-n[^"]*|route-text|row-pair)"[^>]*>(?:[^<]*</span>\s*)?)*'
    r'<a\b[^>]*?\bhref="([^"#?]*)"'
    r'|<a\b[^>]*\bclass="[^"]*\bcard-link\b[^"]*"[^>]*\bhref="([^"#?]*)"')


def _body_listed(article_html: str, page) -> set[str]:
    """The pages the body already lists as rows, cards or table rows (whole
    pages only: a link to a section of a page, or with a filter, is not the
    page). Running text does not count: it is not a list."""
    out = set()
    for m in _BODY_LIST_LINK.finditer(article_html):
        href = m.group(1) if m.group(1) is not None else m.group(2)
        if not href:
            continue
        parts = urlsplit(urljoin(_HOST + page.url, _html.unescape(href)))
        if parts.netloc != urlsplit(_HOST).netloc:
            continue
        path = parts.path.lstrip("/")
        f = _S["by_path"].get(path) or _S["by_path"].get(path.removesuffix("index.html"))
        if f is not None:
            out.add(f.src_uri)
    return out


def _more(tab, entry, page, in_nav: bool, used: set, listed: frozenset = frozenset()) -> str:
    """"More in this section": the section or group overview first, then
    nav order. The rest are the page's group siblings; when the group has
    fewer than two, the first page of each other group in the tab, groups of
    the page's own kind first. A page outside the nav starts from the page
    it belongs to."""
    group = entry["group"]
    here = page.file.src_uri if in_nav else None
    picks = []          # (page, title, sub)
    seen = {here}
    overview = group["entries"][0] if group["overview"] else None
    if overview is not None and overview["page"].file.src_uri != here:
        picks.append((overview["page"], _title(overview), _entry_sub(overview)))
    elif tab["landing"] is not None:
        picks.append((tab["landing"], tab["title"], "Section overview"))
    seen |= {p.file.src_uri for p, _, _ in picks}
    siblings = [e for e in group["entries"] if e["page"].file.src_uri not in seen]
    picks += [(e["page"], _title(e), _entry_sub(e)) for e in siblings]
    seen |= {e["page"].file.src_uri for e in siblings}
    if len(siblings) < 2:
        # Other groups whose first page is this page's kind come first (a
        # reader finishing a guide most likely wants the next guide), then
        # the rest, each in nav order (ordering principle, 2026-09-27).
        mine = kind_of(entry["page"].file.src_uri)
        others = sorted((g for g in tab["groups"] if g["entries"]),
                        key=lambda g: kind_of(g["entries"][0]["page"].file.src_uri) != mine)
        for g in others:
            if g is not group and g["entries"][0]["page"].file.src_uri not in seen:
                e = g["entries"][0]
                picks.append((e["page"], _title(e), _entry_sub(e)))
                seen.add(e["page"].file.src_uri)
    # One page never lists the same destinations twice (space round,
    # 2026-09-27): what the body already lists as rows or cards leaves the
    # foot, and the foot's list goes if nothing is left.
    dropped = [p.file.src_uri for p, _, _ in picks if p.file.src_uri in listed]
    if dropped:
        picks = [x for x in picks if x[0].file.src_uri not in listed]
        _S["foot_dedup"].append((page.file.src_uri, dropped, len(picks)))
    picks = picks[:6]
    if not picks:
        return ""
    cards = "".join(f"<li>{_foot_card('', p, t, s, page, used)}</li>" for p, t, s in picks)
    return (f'<h2 class="secfoot__h">More in This Section</h2>'
            f'<ul class="secfoot__more">{cards}</ul>')


_LEARN_NEXT = re.compile(r'<div class="learn-next[^"]*">.*?</div>', re.S)
_LEARN_BTN = re.compile(r'(<a class="md-button[^"]*learn-next__btn[^"]*)(" href=")([^"]*)(")')


def _kind_buttons(block: str, page, used: set) -> str:
    """A module's Next buttons wear the kind of the page each opens."""
    def paint(m):
        kind = _kind_of_href(m.group(3), page)
        if not kind:
            return m.group(0)
        used.add(kind)
        return m.group(1) + " kind-mark" + '" data-kind="' + kind + m.group(2) + m.group(3) + m.group(4)
    return _LEARN_BTN.sub(paint, block)


def _module_back(page, used: set) -> str:
    """A lesson that a Tools & Prompts group builds on links, secondary, to
    that group on the landing (Module 7 to "Work with Agents")."""
    group = (_S.get("module_of") or {}).get(page.file.src_uri)
    if group is None or group["tab"]["landing"] is None:
        return ""
    tab = group["tab"]
    n = len(group["entries"])
    _S["module_links"] += 1
    sub = f"The {_count(n, group['noun'])} in {tab['title']}"
    if group["tag"]:
        sub += f", {group['tag'][:1].lower()}{group['tag'][1:]}"
    return _related_card(group, page, used, sub)


def _related_card(group, page, used: set, sub: str) -> str:
    kind = group["kind"]
    if kind:
        used.add(kind)
    href = _href(group["tab"]["landing"], page, anchor=group["anchor"])
    return (f'<a class="secfoot__card secfoot__card--related{_kcls(kind)}"{_kattr(kind)} href="{_esc(href)}">'
            f'<span class="secfoot__icon">{_icon(group["icon"])}</span><span class="secfoot__words">'
            f'<span class="secfoot__title">{_esc(group["title"])}</span> '
            f'<span class="secfoot__sub">{_esc(sub)}</span></span></a>')


def _lesson_end(tab, entry, page, learn_next: str, used: set) -> str:
    """A module's ending, the same on all seven: "Where to go next", the
    module's own Next (one card, with its time; or its choice of modules),
    then, secondary, Previous and any related group."""
    top = '<h2 class="secfoot__h">Where to Go Next</h2>'
    if learn_next:
        top += _kind_buttons(learn_next, page, used)
    also = []
    i = entry["pos"] - 1
    if i > 0:
        prev = tab["flat"][i - 1]
        also.append(_foot_card("Previous", prev["page"], _title(prev), prev["group"]["title"], page,
                               used, arrow="arrow-left", rel="prev", cls="secfoot__card--prev"))
    elif tab["landing"] is not None:
        also.append(_foot_card("Previous", tab["landing"], tab["title"], "Section overview", page,
                               used, arrow="arrow-left", rel="prev", cls="secfoot__card--prev"))
    if not learn_next and page.next_page is not None:
        nxt = page.next_page
        also.append(_foot_card("Next", nxt, _page_title(nxt), "", page, used,
                               arrow="arrow-right", rel="next", cls="secfoot__card--next"))
    back = _module_back(page, used)
    if back:
        also.append(back)
    if also:
        top += (f'<div class="secfoot__also"><p class="secfoot__label">Also</p>'
                f'<div class="secfoot__alsorow">{"".join(also)}</div></div>')
    _S["lesson_ends"] += 1
    return top


def _foot(page, article_html: str, learn_next: str, keyed: set) -> str:
    src = page.file.src_uri
    found = _S["where"].get(src)
    home = None
    if found is None:
        home = _home_of(page)
        if home is None:
            return ""
        found = _S["where"][home.file.src_uri]
    tab, entry = found
    if entry is None:           # a landing page is its own map
        return ""
    in_nav = home is None
    here_src = src if in_nav else home.file.src_uri
    used: set = set()
    lesson = in_nav and (page.meta or {}).get("page_type") == "lesson"
    top = (_lesson_end(tab, entry, page, learn_next, used) if lesson
           else _more(tab, entry, page, in_nav, used, frozenset(_body_listed(article_html, page))))
    # A key here only when these cards add a kind the page has not keyed; it
    # goes under the ending's heading.
    top_key = _key(used) if used - keyed else ""
    if top_key and top.startswith("<h2"):
        cut = top.index("</h2>") + 5
        top, top_key = top[:cut] + top_key + top[cut:], ""
    total = len(tab["flat"])
    overview = ""
    if tab["landing"] is not None:
        overview = (f'<a class="secfoot__overview" href="{_esc(_href(tab["landing"], page))}">'
                    f'{_esc(tab["title"])} Overview</a>')
    summary = (f'<summary><span class="secfoot__sicon">{_icon(tab["icon"])}</span>'
               f'<span class="secfoot__stext">Browse {_esc(tab["title"])}</span>'
               f'<span class="secfoot__scount">{total} pages</span></summary>')
    where = entry["group"]["title"] if in_nav else f"inside {_title(entry)}"
    here_group = entry["group"]["title"]
    return (f'<nav class="secfoot" aria-label="{_esc(tab["title"])}: this section" data-secfoot '
            f'data-section="{_esc(tab["title"])}" data-total="{total}" '
            f'data-groups="{len(tab["groups"])}" data-where="{_esc(where)}" '
            f'data-group="{_esc(here_group)}">'
            f'{top_key}{top}'
            f'<div class="secfoot__maps"><details class="secfoot__all">{summary}'
            f'<div class="secfoot__body">{overview}{_map(tab, here_src, page, inside=not in_nav)}</div>'
            f'</details>{_toc(article_html, page)}</div></nav>')


def _site_map(page) -> tuple[str, int, int]:
    """The homepage's map: one group per tab, each holding the tab's
    landing page and one card per group of the tab (not every page), in nav
    order, each card wearing its kind. Built from the same model as the
    section maps, so it cannot drift from the nav. Returns the map, the
    pages it covers and the number of tabs."""
    groups, used, pages = [], set(), 0
    for tab in _S["tabs"]:
        cards = []
        if tab["landing"] is not None:
            lp = tab["landing"]
            kind = kind_of(lp.file.src_uri)
            if kind:
                used.add(kind)
            pdeco = (_S["deco"].get("pages") or {}).get(lp.file.src_uri) or {}
            cards.append(f'<li><a class="secmap__card{_kcls(kind)}"{_kattr(kind)} href="{_esc(_href(lp, page))}">'
                         f'<span class="secmap__icon">{_icon(pdeco.get("icon", tab["icon"]))}</span>'
                         f'<span class="secmap__words"><span class="secmap__title">{_esc(tab["title"])} Overview</span>'
                         f' <span class="secmap__sub">The section\'s landing page</span></span></a></li>')
        for g in tab["groups"]:
            first = g["entries"][0]["page"]
            if not g["overview"] and g["anchor"] and tab["landing"] is not None:
                href = _href(tab["landing"], page, anchor=g["anchor"])
            else:
                href = _href(first, page)
            kind = g["kind"]
            if kind:
                used.add(kind)
            n = len(g["entries"])
            cards.append(f'<li><a class="secmap__card{_kcls(kind)}"{_kattr(kind)} href="{_esc(href)}">'
                         f'<span class="secmap__icon">{_icon(g["icon"])}</span>'
                         f'<span class="secmap__words"><span class="secmap__title">{_esc(g["title"])}</span>'
                         f' <span class="secmap__sub">{_esc(_count(n, g["noun"]))}</span></span></a></li>')
        pages += len(tab["flat"])
        cls = "secmap__group" + (" secmap__group--wide" if len(cards) >= 6 else "")
        groups.append(f'<li class="{cls}"{_kattr(tab["kind"])} data-group="{_esc(tab["title"])}">'
                      f'<p class="secmap__head"><span class="secmap__gicon">{_icon(tab["icon"])}</span>'
                      f'<span class="secmap__gname">{_esc(tab["title"])}</span>'
                      f'<span class="secmap__count">{_esc(_count(len(tab["flat"]), "pages"))}</span></p>'
                      f'<ul class="secmap__cards">{"".join(cards)}</ul></li>')
    html = (f'<div class="secmap secmap--site" data-secmap><ol class="secmap__groups">{"".join(groups)}</ol>'
            f'{_key(used)}</div>')
    return html, pages, len(_S["tabs"])


def _door_foot(page, article_html: str) -> str:
    """A landing page's foot, for the corner control only: it is written
    hidden, because the landing page already is its section's map and
    without JavaScript nothing is missing. A section landing carries its
    section's map with its own overview marked as where the reader is; the
    homepage, which belongs to no single section, carries the whole site."""
    src = page.file.src_uri
    found = _S["where"].get(src)
    if found is not None and found[1] is None:
        tab = found[0]
        overview = (f'<a class="secfoot__overview" href="{_esc(_href(tab["landing"], page))}" '
                    f'aria-current="page">{_esc(tab["title"])} Overview '
                    f'<span class="secfoot__here">You are here</span></a>')
        body = overview + _map(tab, None, page)
        attrs = (f'data-section="{_esc(tab["title"])}" data-total="{len(tab["flat"])}" '
                 f'data-groups="{len(tab["groups"])}" '
                 f'data-where="on the {_esc(tab["title"])} overview" data-group=""')
        label, total, icon = f'Browse {_esc(tab["title"])}', len(tab["flat"]), tab["icon"]
    elif page.is_homepage:
        body, total, n = _site_map(page)
        attrs = (f'data-section="the site" data-short="Browse" data-title="The whole site" '
                 f'data-unit="section" data-total="{total}" data-groups="{n}" '
                 f'data-where="on the home page" data-group=""')
        label, icon = "Browse the site", "sitemap-outline"
    else:
        return ""
    summary = (f'<summary><span class="secfoot__sicon">{_icon(icon)}</span>'
               f'<span class="secfoot__stext">{label}</span>'
               f'<span class="secfoot__scount">{total} pages</span></summary>')
    _S["door_feet"] += 1
    return (f'<nav class="secfoot secfoot--door" hidden data-secfoot {attrs}>'
            f'<div class="secfoot__maps"><details class="secfoot__all">{summary}'
            f'<div class="secfoot__body">{body}</div></details>{_toc(article_html, page)}</div></nav>')


def _with_door_foot(output: str, page) -> str:
    _S["doors_seen"] += 1
    start, at = output.find("<article"), output.rfind("</article>")
    if start == -1 or at == -1:
        raise ValueError(f"layout_nav: landing page {page.file.src_uri} has no article for its foot")
    foot = _door_foot(page, output[start:at])
    return output[:at] + foot + output[at:]


# --- the Tools & Prompts landing ---------------------------------------------------------

def _group_head(g, level: int = 2) -> str:
    tag = f'<span class="tp-tag">{_esc(g["tag"])}</span>' if g["tag"] else ""
    return (f'<div class="tp-head"><span class="tp-head__icon">{_icon(g["icon"])}</span>'
            f'<div class="tp-head__words"><h{level} class="tp-head__title" id="{_esc(g["anchor"])}">'
            f'{_esc(g["title"])}</h{level}>{tag}'
            + (f'<p class="tp-head__desc">{_esc(g["blurb"])}</p>' if g["blurb"] else "")
            + "</div></div>")


def _row(entry, page, used: set, lead: str = "") -> str:
    p = entry["page"]
    kind = kind_of(p.file.src_uri)
    if kind:
        used.add(kind)
    pdeco = (_S["deco"].get("pages") or {}).get(p.file.src_uri) or {}
    sub = _fill(pdeco.get("sub", ""))
    icon = lead or f'<span class="tp-row__icon">{_icon(pdeco.get("icon", entry["group"]["icon"]))}</span>'
    return (f'<a class="tp-row{_kcls(kind)}"{_kattr(kind)} href="{_esc(_href(p, page))}">{icon}'
            f'<span class="tp-row__words"><span class="tp-row__title">{_esc(_title(entry))}</span>'
            + (f' <span class="tp-row__sub">{_esc(sub)}</span>' if sub else "") + "</span></a>")


def _shortcut(label: str, n: int, noun: str, href: str, kind, used: set, who: str = "") -> str:
    if kind:
        used.add(kind)
    plural = noun if n == 1 else noun + "s"
    who_html = f' <span class="tp-short__who">{_esc(who)}</span>' if who else ""
    return (f'<li><a class="tp-short{_kcls(kind)}"{_kattr(kind)} href="{_esc(href)}">'
            f'<span class="tp-short__words"><span class="tp-short__t">{_esc(label)}</span>{who_html}</span>'
            f'<span class="tp-short__n">{n}<span class="secmap__sr"> {plural}</span></span></a></li>')


def _landing(page) -> str:
    tab = next(t for t in _S["tabs"] if t["title"] == LANDING_TAB)
    groups = tab["groups"]
    if len(groups) < 4:
        raise ValueError(f"layout_nav: {LANDING_TAB} needs two primary groups, at least one guide "
                         "group and a last group for the band")
    used: set = set()
    arrow = _icon("arrow-right")

    # Find a Tool: the directory, and the tasks flagged for the landing.
    g = groups[0]
    directory = g["entries"][0]["page"]
    dkind = kind_of(directory.file.src_uri)
    shortcuts = []
    for t in _S["tasks"]:
        if t.get("landing"):
            n = len(_S["members"][t["id"]])
            shortcuts.append(_shortcut(t["label"], n, "tool", _href(directory, page, f"?task={t['id']}"),
                                       dkind, used))
    if not shortcuts:
        raise ValueError("layout_nav: no task in data/tool_tasks.yaml has landing: true")
    others = "".join(f"<li>{_row(e, page, used)}</li>" for e in g["entries"][1:])
    tool_card = (
        f'<section class="tp-card tp-card--primary"{_kattr(g["kind"])} aria-labelledby="{_esc(g["anchor"])}">'
        f'{_group_head(g)}'
        f'<a class="tp-go"{_kattr(dkind)} href="{_esc(_href(directory, page))}">'
        f'Browse all {len(_S["tools"])} tools{arrow}</a>'
        f'<p class="tp-sub">Or Start from a Task</p><ul class="tp-shorts">{"".join(shortcuts)}</ul>'
        f'<p class="tp-note">Every other task is in the directory\'s chooser.</p>'
        + (f'<ul class="tp-rows">{others}</ul>' if others else "") + "</section>")

    # Use a Prompt: the library, the categories flagged for the landing
    # (counted exactly as the library's chooser counts what the link
    # selects), and the group's other pages.
    g = groups[1]
    library = g["entries"][0]["page"]
    lkind = kind_of(library.file.src_uri)
    prompts = _S["prompts"]
    shortcuts = []
    for cat, audience in rd.PROMPT_CATEGORY_LANDING.items():
        n = sum(1 for e in prompts
                if (e["category"] == cat or cat in (e.get("also_for") or []))
                and (audience is None or e["audience"] in (audience, "both")))
        if not n:
            raise ValueError(f"layout_nav: landing prompt shortcut {cat!r} would show no prompts")
        query = f"?for={audience}&task={cat}" if audience else f"?task={cat}"
        who = rd.PROMPT_AUDIENCE_META[audience] if audience else ""
        label = rd.PROMPT_CATEGORY_LANDING_LABELS.get(cat) or rd.PROMPT_CATEGORY_CHIPS[cat]
        shortcuts.append(_shortcut(label, n, "prompt", _href(library, page, query), lkind, used, who))
    others = "".join(f"<li>{_row(e, page, used)}</li>" for e in g["entries"][1:])
    prompt_card = (
        f'<section class="tp-card tp-card--primary"{_kattr(g["kind"])} aria-labelledby="{_esc(g["anchor"])}">'
        f'{_group_head(g)}'
        f'<a class="tp-go"{_kattr(lkind)} href="{_esc(_href(library, page))}">'
        f'Browse all {len(prompts)} prompts{arrow}</a>'
        f'<p class="tp-sub">Or Start from a Task</p><ul class="tp-shorts">{"".join(shortcuts)}</ul>'
        + (f'<ul class="tp-rows tp-rows--pair">{others}</ul>' if others else "") + "</section>")

    # The guide groups, side by side. A group with a `module` meets the
    # reader with that lesson first; a group with `steps` then shows its
    # first page as the overview, numbers the next `steps` guides, and
    # lists the rest after "Then".
    mids = []
    for g in groups[2:-1]:
        entries = g["entries"]
        body = ""
        if g["module"] is not None:
            mkind = kind_of(g["module"].file.src_uri)
            if mkind:
                used.add(mkind)
            _S["module_links"] += 1
            body += (f'<a class="tp-cross{_kcls(mkind)}"{_kattr(mkind)} href="{_esc(_href(g["module"], page))}">'
                     f'<span class="tp-row__icon">{_icon("school-outline")}</span><span class="tp-row__words">'
                     f'<span class="tp-row__title">New to Agents? {_esc(_module_label(g["module"]))}</span> '
                     f'<span class="tp-row__sub">The lesson in Learn that introduces them</span></span></a>')
        if g["steps"] and len(entries) > 1:
            first = entries[0]
            body += (f'<p class="tp-sub">Start Here</p><ul class="tp-rows"><li>{_row(first, page, used)}</li></ul>')
            steps = entries[1:1 + g["steps"]]
            rest = entries[1 + g["steps"]:]
            body += '<ol class="tp-rows tp-rows--steps">' + "".join(
                f'<li>{_row(e, page, used, lead=f"<span class=tp-row__num aria-hidden=true>{i}</span>")}</li>'
                for i, e in enumerate(steps, 1)) + "</ol>"
            if rest:
                body += ('<p class="tp-sub">Then</p><ul class="tp-rows">'
                         + "".join(f"<li>{_row(e, page, used)}</li>" for e in rest) + "</ul>")
        else:
            body += '<ul class="tp-rows">' + "".join(f"<li>{_row(e, page, used)}</li>" for e in entries) + "</ul>"
        mids.append(f'<section class="tp-card"{_kattr(g["kind"])} aria-labelledby="{_esc(g["anchor"])}">'
                    f'{_group_head(g)}{body}</section>')

    # Compare Models: a band of tiles across the page.
    g = groups[-1]
    tiles = []
    for e in g["entries"]:
        p = e["page"]
        kind = kind_of(p.file.src_uri)
        if kind:
            used.add(kind)
        pdeco = (_S["deco"].get("pages") or {}).get(p.file.src_uri) or {}
        tiles.append(f'<li><a class="tp-tile{_kcls(kind)}"{_kattr(kind)} href="{_esc(_href(p, page))}">'
                     f'<span class="tp-row__icon">{_icon(pdeco.get("icon", g["icon"]))}</span>'
                     f'<span class="tp-row__words"><span class="tp-row__title">{_esc(_title(e))}</span> '
                     f'<span class="tp-row__sub">{_esc(_fill(pdeco.get("sub", "")))}</span></span>'
                     f'<span class="tp-tile__go">{arrow}</span></a></li>')
    band = (f'<section class="tp-band"{_kattr(g["kind"])} aria-labelledby="{_esc(g["anchor"])}">'
            f'{_group_head(g)}<ul class="tp-tiles">{"".join(tiles)}</ul></section>')

    listed = sum(len(x["entries"]) for x in groups)
    print(f"layout_nav: {LANDING_TAB} landing: {len(groups)} groups, {listed} pages from the nav, "
          f"{len(_S['tools'])} tools ({sum(1 for t in _S['tasks'] if t.get('landing'))} task shortcuts), "
          f"{len(prompts)} prompts ({len(rd.PROMPT_CATEGORY_LANDING)} category shortcuts)")
    _S["full"] += 1
    return (f'{_key(used)}<div class="tp-landing">'
            f'<div class="tp-primary">{tool_card}{prompt_card}</div>'
            f'<div class="tp-guides">{"".join(mids)}</div>{band}</div>')


# --- color by meaning on the page's own lists and cards --------------------------------

_TAG = re.compile(r"<(/?)(div|ul|li)\b([^>]*)>", re.I)
_A_HREF = re.compile(r'<a\b[^>]*\bhref="([^"]*)"', re.I)
# Containers whose list items are each a link to one page, and the list
# depth of those items inside the container.
_ROW_BLOCKS = {"door-rows": 1, "home-routes": 1, "learn-shelf": 1, "route-stage": 1}
_KEY_OUTSIDE = {"route-stage": "route-map"}


def _add_class(tag_start: int, attrs: str, edits: list, cls: str, kind: str, tag_len: int = 3):
    """Queue edits that add a class and data-kind to the opening tag whose
    '<' is at tag_start and whose name is tag_len characters long."""
    close = tag_start + 1 + tag_len + len(attrs)       # position of the tag's '>'
    if 'class="' in attrs:
        edits.append((tag_start + 1 + tag_len + attrs.index('class="') + 7, cls + " "))
        edits.append((close, f' data-kind="{kind}"'))
    else:
        edits.append((close, f' class="{cls}" data-kind="{kind}"'))


def _decorate(art: str, page) -> tuple[list, list]:
    """Find the lists and cards in an article that point at pages and queue
    the edits that give each item its page's kind. Returns (edits, blocks),
    blocks being (position, kinds) for each colored list or card group."""
    edits: list = []
    blocks: list = []
    depth = 0
    block = None                # [name, div depth, start, kinds]
    ul = 0

    def item(pos, attrs, href, cls, tag_len=2):
        kind = _kind_of_href(href, page)
        if not kind:
            return
        block[3].add(kind)
        _S["rows"][kind] = _S["rows"].get(kind, 0) + 1
        _add_class(pos, attrs, edits, cls, kind, tag_len)

    def close_block():
        if block is not None and block[3]:
            start = block[2]
            # A block laid out as one cell of a larger grid (a Learn route
            # stage) keys the grid, so the key is not a cell of its own.
            outer = _KEY_OUTSIDE.get(block[0])
            if outer:
                at = art.rfind(f'class="{outer}"', 0, start)
                if at != -1:
                    start = art.rfind("<", 0, at)
            blocks.append((start, set(block[3])))

    for m in _TAG.finditer(art):
        close, tag, attrs = m.group(1), m.group(2).lower(), m.group(3)
        if tag == "div":
            if close:
                depth -= 1
                if block is not None and depth < block[1]:
                    close_block()
                    block = None
            else:
                depth += 1
                cls = re.search(r'class="([^"]*)"', attrs)
                cls = cls.group(1).split() if cls else []
                if block is None:
                    name = next((c for c in cls if c in _ROW_BLOCKS), None)
                    if name is None and {"grid", "cards"} <= set(cls):
                        name = "grid"
                    if name:
                        block = [name, depth, m.start(), set()]
                        ul = 0
            continue
        if block is None:
            continue
        if tag == "ul":
            ul += -1 if close else 1
            continue
        if tag == "li" and not close:
            nxt = art.find("<li", m.end())
            stop = art.find("</li>", m.end())
            sub = art.find("<ul", m.end())
            seg_end = min(x for x in (nxt, stop, sub, len(art)) if x != -1)
            if block[0] == "grid":
                if ul == 2:
                    a = _A_HREF.search(art, m.end(), seg_end)
                    if a:
                        item(m.start(), attrs, a.group(1), "kind-row kind-mark")
                elif ul == 1:
                    card = re.search(r'<a class="card-link" href="([^"]*)"', art[m.end():seg_end])
                    if card:
                        item(m.start(), attrs, card.group(1), "kind-card kind-mark")
            elif ul == _ROW_BLOCKS[block[0]]:
                a = _A_HREF.search(art, m.end(), seg_end)
                if a:
                    item(m.start(), attrs, a.group(1), "kind-row kind-mark")
    close_block()

    # A prompt page's "Where it is used" and "Related prompts" rows.
    for lm in re.finditer(r'<ul class="pp-rows">(.*?)</ul>', art, re.S):
        kinds = set()
        for li in re.finditer(r'<li>(<a href="([^"]*)")', lm.group(0)):
            kind = _kind_of_href(li.group(2), page)
            if not kind:
                continue
            kinds.add(kind)
            _S["rows"][kind] = _S["rows"].get(kind, 0) + 1
            edits.append((lm.start() + li.start() + 3, f' class="kind-row kind-mark" data-kind="{kind}"'))
        if kinds:
            blocks.append((lm.start(), kinds))

    # The Prompt Library's rows, each titled with a link to its prompt page.
    kinds = set()
    first = None
    for rm in re.finditer(r'<(\w+) class="pl-row"([^>]*)>\s*<h3 class="pl-row__title"><a href="([^"]*)"', art):
        kind = _kind_of_href(rm.group(3), page)
        if not kind:
            continue
        kinds.add(kind)
        _S["rows"][kind] = _S["rows"].get(kind, 0) + 1
        first = rm.start() if first is None else first
        tag_end = rm.start() + 1 + len(rm.group(1)) + len(' class="pl-row"') + len(rm.group(2))
        edits.append((rm.start() + 1 + len(rm.group(1)) + len(' class="pl-row'), " kind-mark"))
        edits.append((tag_end, f' data-kind="{kind}"'))
    if kinds:
        count = art.find('<p class="pl-results__count"')
        blocks.append((count if count != -1 else first, kinds))

    # Cards a hook has already colored by the page they open (the News &
    # Events and home cards, scripts/layout_home.py): each counts as a
    # colored block, keyed above the grid that holds it (a `kind-group`).
    for cm in re.finditer(r'<section class="[^"]*\bkind-block\b[^"]*" data-kind="([a-z]+)"', art):
        pos = cm.start()
        div = art.rfind("<div ", 0, pos)
        if div != -1 and "kind-group" in art[div:art.find(">", div)] and "</div>" not in art[div:pos]:
            pos = div
        _S["rows"][cm.group(1)] = _S["rows"].get(cm.group(1), 0) + 1
        blocks.append((pos, {cm.group(1)}))

    # A module's Next buttons, where they are still in the page (a door).
    for bm in _LEARN_BTN.finditer(art):
        kind = _kind_of_href(bm.group(3), page)
        if kind:
            edits.append((bm.end(1), " kind-mark" + '" data-kind="' + kind))
    return edits, sorted(blocks, key=lambda b: b[0])


def _apply(art: str, edits: list) -> str:
    for pos, text in sorted(edits, key=lambda e: e[0], reverse=True):
        art = art[:pos] + text + art[pos:]
    return art


def _color_page(output: str, page, door: bool) -> tuple[str, set]:
    """Color the article's lists and cards by kind and write their keys: on
    a landing page one key above the first colored block, naming every kind
    on the page; elsewhere a key above each colored block that adds a kind
    the page has not keyed yet. Returns the output and the kinds keyed."""
    start = output.find("<article")
    end = output.rfind("</article>")
    if start == -1 or end == -1:
        return output, set()
    art = output[start:end]
    edits, blocks = _decorate(art, page)
    keyed: set = set()
    if blocks:
        if door:
            union = set().union(*(k for _, k in blocks))
            edits.append((blocks[0][0], _key(union)))
            keyed = union
        else:
            for pos, kinds in blocks:
                if kinds - keyed:
                    edits.append((pos, _key(kinds)))
                    keyed |= kinds
        _S["row_pages"] += 1
    return output[:start] + _apply(art, edits) + output[end:], keyed


# --- breadcrumbs --------------------------------------------------------------------------

_CRUMB = re.compile(r'(<li class="md-path__item">\s*<a href=")([^"]*)(" class="md-path__link">\s*'
                    r'<span class="md-ellipsis">\s*)(.*?)(\s*</span>)', re.S)


def _crumbs(output: str, page) -> str:
    """A group with no overview page of its own: its crumb goes to the
    group on the section's landing page, not to the group's first page."""
    found = _S["where"].get(page.file.src_uri)
    if found is None:
        home = _home_of(page)
        found = _S["where"].get(home.file.src_uri) if home is not None else None
    if found is None:
        return output
    tab = found[0]
    if tab["landing"] is None:
        return output
    targets = {g["title"]: g for g in tab["groups"]
               if g["section"] and not g["overview"] and g["anchor"]}
    if not targets:
        return output

    def swap(m):
        g = targets.get(_html.unescape(m.group(4).strip()))
        if g is None:
            return m.group(0)
        _S["crumbs"] += 1
        return m.group(1) + _esc(_href(tab["landing"], page, anchor=g["anchor"])) + m.group(3) + m.group(4) + m.group(5)

    return _CRUMB.sub(swap, output)


# --- hook events -----------------------------------------------------------------------------

def _kind_style() -> str:
    """The kinds table as CSS: each kind points at its hue's tokens. Written
    into every page, so assigning a color to a kind is an edit to
    data/section_map.yaml alone; the values live in the palette block."""
    rules = []
    for kid, k in _S["kinds"].items():
        h = k["token"]
        rules.append(f'[data-kind="{kid}"]{{--k:var(--hue-{h});--k-tint:var(--hue-{h}-tint);'
                     f'--k-line:var(--hue-{h}-line)}}')
    return '<style id="kind-map">' + "".join(rules) + "</style>"


def on_post_page(output, page, config):
    output = _post_page(output, page)
    if _S["fold_label"]:
        # The folded control's word (mkdocs.yml extra: nav_control_label).
        output = output.replace(" data-secfoot ", ' data-secfoot data-fold-label="Navigate" ', 1)
    return output


def _post_page(output, page):
    src = page.file.src_uri
    output = output.replace("</head>", _kind_style() + "</head>", 1)
    output = _crumbs(output, page)
    kind = (page.meta or {}).get("page_type")
    if LANDING_SLOT in output:
        if src != "tools-and-prompts.md" or output.count(LANDING_SLOT) != 1:
            raise ValueError(f"layout_nav: {src} holds the landing slot; only "
                             "docs/tools-and-prompts.md may, exactly once")
        return _with_door_foot(output.replace(LANDING_SLOT, _landing(page), 1), page)
    if kind == "door" or src in layout_frame.DOOR:
        return _with_door_foot(_color_page(output, page, door=True)[0], page)
    # A module's own Next moves to its ending, under "Where to go next".
    learn_next = ""
    if kind == "lesson":
        m = _LEARN_NEXT.search(output)
        if m:
            learn_next = m.group(0)
            output = output[:m.start()] + output[m.end():]
    output, keyed = _color_page(output, page, door=False)
    at = output.find('<div class="page-end">')
    if at == -1:
        at = output.find("</article>")
    start = output.find("<article")
    foot = _foot(page, output[start:at] if start != -1 and at != -1 else "", learn_next, keyed)
    if not foot:
        if learn_next:
            raise ValueError(f"layout_nav: {src} lost its Next block: no section foot to hold it")
        return output
    _S["expected_feet"] += 1
    if at == -1:
        raise ValueError(f"layout_nav: {src} has no page ending or article to put the section foot in")
    _S["feet"] += 1
    return output[:at] + foot + output[at:]


def on_post_build(config):
    site = Path(config["site_dir"])
    ids_cache: dict[str, set] = {}
    bad = []
    for page_url, href in _S["hrefs"]:
        parts = urlsplit(urljoin(_HOST + page_url, _html.unescape(href)))
        path = parts.path.lstrip("/")
        target = site / path
        if path == "" or path.endswith("/"):
            target = target / "index.html"
        if not target.exists():
            bad.append(f"{page_url or '/'} -> {href}")
            continue
        if parts.fragment:
            key = str(target)
            if key not in ids_cache:
                ids_cache[key] = set(re.findall(r'\bid="([^"]+)"', target.read_text(encoding="utf-8")))
            if parts.fragment not in ids_cache[key]:
                bad.append(f"{page_url or '/'} -> {href} (no #{parts.fragment})")
    unused = sorted(set(_S["palette"]["light"]) - {k["token"] for k in _S["kinds"].values()})
    print("layout_nav: rendered")
    print(f"  section feet (map, sections)    : {_S['feet']} of {_S['expected_feet']} inner pages, "
          f"{_S['tocs']} with On this page ({_S['azs']} as an A to Z)")
    print(f"  landing feet (corner control)   : {_S['door_feet']} of {_S['doors_seen']} landing pages")
    print(f"  module endings                  : {_S['lesson_ends']} (Where to go next)")
    print(f"  landing                         : {_S['full']} ({LANDING_TAB})")
    print(f"  prompt links to prompt pages    : {_S['rewritten']} rewritten on {_S['rewrite_pages']} pages")
    print(f"  group crumbs to the landing     : {_S['crumbs']}")
    print(f"  colored rows and cards in pages : "
          + (", ".join(f"{k} {n}" for k, n in sorted(_S['rows'].items())) or "none")
          + f" (on {_S['row_pages']} pages)")
    print(f"  color keys written              : {_S['keys']}")
    removed = sum(len(d) for _, d, _ in _S["foot_dedup"])
    print(f"  foot cards the body already lists: {removed} left out on {len(_S['foot_dedup'])} pages"
          + "".join(f"\n    {src}: {', '.join(d)} ({'list dropped' if n == 0 else f'{n} left'})"
                    for src, d, n in _S["foot_dedup"]))
    print(f"  links to and from Learn modules : {_S['module_links']}")
    print(f"  palette hues with no kind       : {', '.join(unused) or 'none'}")
    print(f"  icons used                      : {len(_S['icons'])}")
    print(f"  generated links                 : {len(_S['hrefs'])} checked, {len(bad)} broken")
    if _S["undecorated"]:
        print(f"  pages with no icon or subtitle  : {', '.join(sorted(_S['undecorated']))}")
    if bad:
        raise AssertionError("layout_nav: generated links that do not resolve:\n  "
                             + "\n  ".join(bad[:20]))
    if _S["door_feet"] != _S["doors_seen"]:
        raise AssertionError("layout_nav: a landing page has no foot for the corner control")
    if _S["feet"] != _S["expected_feet"] or _S["full"] != 1 or _S["lesson_ends"] != 7:
        raise AssertionError("layout_nav: a page foot, a module ending or the landing was not written")
