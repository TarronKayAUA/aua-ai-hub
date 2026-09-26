"""MkDocs hook: the section navigator (navigation synthesis, 2026-09-26).

No page has a left navigation sidebar or a right "On this page" column
(scripts/layout_frame.py hides both everywhere). What they did is done here,
from one model of each tab built from the nav in mkdocs.yml, with icons,
one-line subtitles and kinds from data/section_map.yaml:

  - the SECTION MAP: a tab drawn as groups of small cards with icons, the
    current page filled and marked in words. A subsection of the tab is a
    group; a run of pages sitting directly in the tab is a group named in
    data/section_map.yaml. Which pages appear, their order and their titles
    come from mkdocs.yml and nothing else.
  - the PAGE FOOT on every inner page: "More in this section" cards (on the
    seven modules, where there is a real order, Previous and Next instead),
    then the whole section map in a closed <details>, and the page's
    sections in another. These are the links a reader without JavaScript
    uses; docs/javascripts/layout-nav.js lifts the same HTML into the
    "Browse <section>" and "On this page" controls, so the floating panels
    and the foot can never disagree.
  - the TOOLS & PROMPTS LANDING (docs/tools-and-prompts.md, slot
    <div data-tp-landing></div>): "Find a tool" and "Use a prompt" first,
    each with a browse button and a few shortcuts, then the guide groups in
    parallel, then a Compare models band. The first two nav groups of the
    tab are the primary cards, the last is the band, the rest are guides.
    Counts come from data/tools.yaml, data/tool_tasks.yaml and
    data/prompts.yaml; which shortcuts appear from presentation flags
    (`landing: true` in tool_tasks.yaml, PROMPT_CATEGORY_LANDING in
    scripts/render_data.py), never typed here.
  - COLOR BY MEANING: every page has a kind (tool, prompt, guide, lesson,
    benchmark, news, governance, or none), derived from the `kinds:`,
    tab, group and page entries in data/section_map.yaml. A link is colored
    by the kind of the page it opens: in the maps, the page feet, the
    landing, and the link rows on the landing pages (For Students, For
    Faculty & Staff, Home, News & Events, Governance). Each kind names a hue
    in the palette block at the top of docs/stylesheets/layout-nav.css; the
    kind-to-hue mapping is written into each page as a few CSS custom
    properties, so reassigning a color is a data edit and changing one is a
    token edit. Wherever colors are drawn, a quiet key names exactly the
    kinds drawn there, computed from what was rendered.

Everything is written in on_post_page, when every page's title is known,
so none of it enters the search index (a map on every page would otherwise
make every page match every section's titles), the narration (which reads
markdown), or the prompt pages' "Where it is used" rows (computed from page
content in on_env). Every link is made with get_relative_url from a page
that exists, every generated href is checked against the built site after
the build (fragments included), and the build prints what it wrote and
fails on a mismatch (CLAUDE.md working rule 2).
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
PALETTE_CSS = Path("docs") / "stylesheets" / "layout-nav.css"
_HOST = "https://hub.invalid/"

# What each block of data/section_map.yaml may hold. An unquoted comma in a
# YAML flow mapping ends the value and turns the rest of the line into stray
# keys ("sub: Chat, work, or code" becomes sub "Chat" plus keys "work" and
# "or code"), so unknown keys fail the build.
ALLOWED = {
    "kinds": {"label", "token", "description"},
    "tabs": {"icon", "loose", "kind"},
    "groups": {"icon", "blurb", "route", "kind", "tag", "module", "steps"},
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
    extra_top = set(deco) - set(ALLOWED)
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
    for block in ("tabs", "groups", "pages"):
        for name, entry in (deco.get(block) or {}).items():
            if (entry or {}).get("kind") and entry["kind"] not in kinds:
                raise ValueError(f"layout_nav: {block} {name!r} names kind {entry['kind']!r}, "
                                 f"which is not in the kinds table")
    for cat in rd.PROMPT_CATEGORY_LANDING:
        if cat not in rd.PROMPT_CATEGORY_LABELS:
            raise ValueError(f"layout_nav: PROMPT_CATEGORY_LANDING names unknown category {cat!r}")
    _S.clear()
    _S.update(
        deco=deco, kinds=kinds, palette=palette, icons={}, tabs=[], where={}, kind={},
        counts={"tools": len(tools), "prompts": len(prompts)},
        tools=tools, tasks=tasks, members=rd.tool_task_members(tools, tasks), prompts=prompts,
        hrefs=[], feet=0, expected_feet=0, full=0, keys=0, rows={}, row_pages=0,
        tocs=0, undecorated=set(), module_links=0,
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
                    run = {"title": name, "entries": []}
                    tab["groups"].append(run)
                run["entries"].append({"page": pages[0], "title": child.title if wrapper else None})
            else:
                run = None
                tab["groups"].append({"title": child.title,
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
            group.update(icon=gdeco.get("icon", tab["icon"]), blurb=gdeco.get("blurb", ""),
                         tag=gdeco.get("tag", ""), route=bool(gdeco.get("route")),
                         kind=gdeco.get("kind") or tab["kind"], module=module,
                         steps=int(gdeco.get("steps") or 0), tab=tab)
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
    if f is None and path == "":
        return None
    return kind_of(f.src_uri) if f is not None else None


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
            f'<span class="kind-key__lead">Colors:</span> {items}</p>')


_NUM = re.compile(r"^(\d+)\.\s+(.+)$")


def _module_label(page) -> str:
    m = _NUM.match(_page_title(page))
    return f"Module {m.group(1)}: {m.group(2)}" if m else _page_title(page)


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
    """The Learn module a group builds on, as one more card in the group."""
    mod = group["module"]
    kind = kind_of(mod.file.src_uri)
    if kind:
        used.add(kind)
    _S["module_links"] += 1
    return (f'<li><a class="secmap__card secmap__card--cross{_kcls(kind)}"{_kattr(kind)} '
            f'href="{_esc(_href(mod, page))}"><span class="secmap__icon">{_icon("school-outline")}</span>'
            f'<span class="secmap__words"><span class="secmap__title">{_esc(_module_label(mod))}</span> '
            f'<span class="secmap__sub">The lesson in Learn that introduces them</span></span></a></li>')


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
        cards = "".join(_card(e, here_src, page, inside, used) for e in group["entries"])
        if group["module"] is not None and group["module"].file.src_uri != here_src:
            cards += _module_card(group, page, used)
        tag = f'<span class="secmap__tag">{_esc(group["tag"])}</span>' if group["tag"] else ""
        noun = "page" if n == 1 else "pages"
        groups.append(f'<li class="{cls}"{_kattr(group["kind"])} style="--n:{n}">'
                      f'<p class="secmap__head"><span class="secmap__gicon">{_icon(group["icon"])}</span>'
                      f'<span class="secmap__gname">{_esc(group["title"])}{tag}</span>'
                      f'<span class="secmap__count">{n}<span class="secmap__sr"> {noun}</span></span></p>'
                      f'<ul class="secmap__cards">{cards}</ul></li>')
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


def _toc(article_html: str, page) -> str:
    heads = [(hid, _plain(inner)) for hid, inner in _H2.findall(article_html)]
    heads = [(hid, text) for hid, text in heads if text]
    if len(heads) < 2:
        return ""
    overrides = (page.meta or {}).get("short_labels") or {}
    chips = []
    for hid, full in heads:
        short = overrides.get(hid) or short_label(full)
        name = f' aria-label="{_esc(full)}"' if short != full else ""
        chips.append(f'<li><a class="secnav__chip" href="#{_esc(hid)}" title="{_esc(full)}"{name}>'
                     f'{_esc(short)}</a></li>')
    _S["tocs"] += 1
    n = len(heads)
    return (f'<details class="secfoot__toc" data-sectoc><summary>'
            f'<span class="secfoot__sicon secfoot__sicon--toc">{_icon("format-list-bulleted")}</span>'
            f'<span class="secfoot__stext">On this page</span>'
            f'<span class="secfoot__scount">{n} sections</span></summary>'
            f'<div class="secfoot__body"><ol class="secnav__chips">{"".join(chips)}</ol></div></details>')


# --- the page foot --------------------------------------------------------------------

def _foot_card(kind_label: str, target, title: str, sub: str, page, used: set, *,
               arrow: str = "", rel: str = "", cls: str = "") -> str:
    kind = kind_of(target.file.src_uri)
    if kind:
        used.add(kind)
    pdeco = (_S["deco"].get("pages") or {}).get(target.file.src_uri) or {}
    icon = _icon(arrow) if arrow else _icon(pdeco.get("icon", "file-document-outline"))
    href = _href(target, page)
    rel_attr = f' rel="{rel}"' if rel else ""
    dir_html = f'<span class="secfoot__dir">{_esc(kind_label)}</span> ' if kind_label else ""
    return (f'<a class="secfoot__card{(" " + cls) if cls else ""}{_kcls(kind)}"{_kattr(kind)} '
            f'href="{_esc(href)}"{rel_attr}><span class="secfoot__icon">{icon}</span>'
            f'<span class="secfoot__words">{dir_html}<span class="secfoot__title">{_esc(title)}</span>'
            + (f' <span class="secfoot__sub">{_esc(sub)}</span>' if sub else "")
            + "</span></a>")


def _entry_sub(entry) -> str:
    pdeco = (_S["deco"].get("pages") or {}).get(entry["page"].file.src_uri) or {}
    return _fill(pdeco.get("sub", "")) or entry["group"]["title"]


def _more(tab, entry, page, in_nav: bool, home, used: set) -> str:
    """"More in this section": the page's group siblings; when the group
    has fewer than two, the first page of each other group in the tab. A
    page outside the nav starts with the page it belongs to."""
    group = entry["group"]
    here = page.file.src_uri if in_nav else None
    picks = [] if in_nav else [entry]
    picks += [e for e in group["entries"] if e["page"].file.src_uri != here and e is not entry]
    if len([e for e in picks if e["group"] is group]) < 2:
        for g in tab["groups"]:
            if g is not group and g["entries"]:
                picks.append(g["entries"][0])
    picks = picks[:6]
    if not picks:
        return ""
    cards = "".join(f"<li>{_foot_card('', e['page'], _title(e), _entry_sub(e), page, used)}</li>"
                    for e in picks)
    return (f'<h2 class="secfoot__h">More in this section</h2>'
            f'<ul class="secfoot__more">{cards}</ul>')


def _pn(tab, entry, page, used: set) -> str:
    """Previous and next, for the seven modules only. A lesson follows its
    own Next line (scripts/layout_learn.py sets page.next_page, and clears
    it where the module offers a choice)."""
    cards = []
    i = entry["pos"] - 1
    flat = tab["flat"]
    if i > 0:
        prev = flat[i - 1]
        cards.append(_foot_card("Previous", prev["page"], _title(prev), prev["group"]["title"], page,
                                used, arrow="arrow-left", rel="prev", cls="secfoot__card--prev"))
    elif tab["landing"] is not None:
        cards.append(_foot_card("Previous", tab["landing"], tab["title"], "Section overview", page,
                                used, arrow="arrow-left", rel="prev", cls="secfoot__card--prev"))
    nxt = page.next_page
    if nxt is not None:
        found = _S["where"].get(nxt.file.src_uri)
        sub = found[1]["group"]["title"] if found and found[1] else ""
        if found and found[0] is not tab:
            sub = f"{found[0]['title']}: {sub}" if sub else found[0]["title"]
        cards.append(_foot_card("Next", nxt, _page_title(nxt), sub, page, used,
                                arrow="arrow-right", rel="next", cls="secfoot__card--next"))
    return f'<div class="secfoot__pn">{"".join(cards)}</div>' if cards else ""


def _module_back(page, used: set) -> str:
    """A lesson that a Tools & Prompts group builds on links to that group
    on the landing (Module 7 to "Work with agents")."""
    group = (_S.get("module_of") or {}).get(page.file.src_uri)
    if group is None:
        return ""
    tab = group["tab"]
    if tab["landing"] is None:
        return ""
    kind = group["kind"]
    if kind:
        used.add(kind)
    anchor = _slug(group["title"])
    href = _href(tab["landing"], page, anchor=anchor)
    n = len(group["entries"])
    _S["module_links"] += 1
    return (f'<div class="secfoot__related"><p class="secfoot__label">When you want to try it</p>'
            f'<a class="secfoot__card secfoot__card--related{_kcls(kind)}"{_kattr(kind)} href="{_esc(href)}">'
            f'<span class="secfoot__icon">{_icon(group["icon"])}</span><span class="secfoot__words">'
            f'<span class="secfoot__title">{_esc(group["title"])}</span> '
            f'<span class="secfoot__sub">The {n} agent guides in {_esc(tab["title"])}'
            + (f', {_esc(group["tag"][:1].lower() + group["tag"][1:])}' if group["tag"] else "")
            + "</span></span></a></div>")


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def _foot(page, article_html: str) -> str:
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
    top = (_pn(tab, entry, page, used) if lesson else _more(tab, entry, page, in_nav, home, used))
    top += _module_back(page, used) if in_nav else ""
    top_key = _key(used)
    total = len(tab["flat"])
    overview = ""
    if tab["landing"] is not None:
        overview = (f'<a class="secfoot__overview" href="{_esc(_href(tab["landing"], page))}">'
                    f'{_esc(tab["title"])} overview</a>')
    summary = (f'<summary><span class="secfoot__sicon">{_icon(tab["icon"])}</span>'
               f'<span class="secfoot__stext">Browse {_esc(tab["title"])}</span>'
               f'<span class="secfoot__scount">{total} pages</span></summary>')
    where = entry["group"]["title"] if in_nav else f"inside {_title(entry)}"
    return (f'<nav class="secfoot" aria-label="{_esc(tab["title"])}: this section" data-secfoot '
            f'data-section="{_esc(tab["title"])}" data-total="{total}" '
            f'data-groups="{len(tab["groups"])}" data-where="{_esc(where)}">'
            f'{top}{top_key}'
            f'<div class="secfoot__maps"><details class="secfoot__all">{summary}'
            f'<div class="secfoot__body">{overview}{_map(tab, here_src, page, inside=not in_nav)}</div>'
            f'</details>{_toc(article_html, page)}</div></nav>')


# --- the Tools & Prompts landing ---------------------------------------------------------

def _group_head(g, level: int = 2) -> str:
    tag = f'<span class="tp-tag">{_esc(g["tag"])}</span>' if g["tag"] else ""
    return (f'<div class="tp-head"><span class="tp-head__icon">{_icon(g["icon"])}</span>'
            f'<div class="tp-head__words"><h{level} class="tp-head__title" id="{_slug(g["title"])}">'
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

    # Find a tool: the directory, and the tasks flagged for the landing.
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
        f'<section class="tp-card tp-card--primary"{_kattr(g["kind"])} aria-labelledby="{_slug(g["title"])}">'
        f'{_group_head(g)}'
        f'<a class="tp-go"{_kattr(dkind)} href="{_esc(_href(directory, page))}">'
        f'Browse all {len(_S["tools"])} tools{arrow}</a>'
        f'<p class="tp-sub">Or start from a task</p><ul class="tp-shorts">{"".join(shortcuts)}</ul>'
        f'<p class="tp-note">Every other task is in the directory\'s chooser.</p>'
        + (f'<ul class="tp-rows">{others}</ul>' if others else "") + "</section>")

    # Use a prompt: the library, the categories flagged for the landing
    # (counted exactly as the library's chooser counts what the link
    # selects), and the group's other pages.
    g = groups[1]
    library = g["entries"][0]["page"]
    lkind = kind_of(library.file.src_uri)
    prompts = _S["prompts"]
    shortcuts = []
    expanded: set = set()
    for cat, audience in rd.PROMPT_CATEGORY_LANDING.items():
        n = sum(1 for e in prompts
                if (e["category"] == cat or cat in (e.get("also_for") or []))
                and (audience is None or e["audience"] in (audience, "both")))
        if not n:
            raise ValueError(f"layout_nav: landing prompt shortcut {cat!r} would show no prompts")
        query = f"?for={audience}&task={cat}" if audience else f"?task={cat}"
        who = rd.PROMPT_AUDIENCE_META[audience] if audience else ""
        # House style expands an acronym on its first use on a page: the
        # first chip that uses one ("Write MCQs") shows the category's full
        # label instead ("Multiple-Choice Question (MCQ) Writing").
        label = rd.PROMPT_CATEGORY_CHIPS[cat]
        for acro in re.findall(r"\b([A-Z]{2,})s?\b", label):
            if acro not in expanded:
                expanded.add(acro)
                if f"({acro})" in rd.PROMPT_CATEGORY_LABELS[cat]:
                    label = rd.PROMPT_CATEGORY_LABELS[cat]
        shortcuts.append(_shortcut(label, n, "prompt",
                                   _href(library, page, query), lkind, used, who))
    others = "".join(f"<li>{_row(e, page, used)}</li>" for e in g["entries"][1:])
    prompt_card = (
        f'<section class="tp-card tp-card--primary"{_kattr(g["kind"])} aria-labelledby="{_slug(g["title"])}">'
        f'{_group_head(g)}'
        f'<a class="tp-go"{_kattr(lkind)} href="{_esc(_href(library, page))}">'
        f'Browse all {len(prompts)} prompts{arrow}</a>'
        f'<p class="tp-sub">Or start from a task</p><ul class="tp-shorts">{"".join(shortcuts)}</ul>'
        + (f'<ul class="tp-rows">{others}</ul>' if others else "") + "</section>")

    # The guide groups, side by side. A group with `steps` shows its first
    # page as the overview, numbers the next `steps` guides, and lists the
    # rest after "Then"; a group with a `module` links the lesson in Learn.
    mids = []
    for g in groups[2:-1]:
        entries = g["entries"]
        body = ""
        if g["steps"] and len(entries) > 1:
            first = entries[0]
            body += (f'<p class="tp-sub">Start here</p><ul class="tp-rows"><li>{_row(first, page, used)}</li></ul>')
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
        if g["module"] is not None:
            mkind = kind_of(g["module"].file.src_uri)
            if mkind:
                used.add(mkind)
            _S["module_links"] += 1
            body += (f'<a class="tp-cross{_kcls(mkind)}"{_kattr(mkind)} href="{_esc(_href(g["module"], page))}">'
                     f'<span class="tp-row__icon">{_icon("school-outline")}</span><span class="tp-row__words">'
                     f'<span class="tp-row__title">New to agents? {_esc(_module_label(g["module"]))}</span> '
                     f'<span class="tp-row__sub">The lesson in Learn that introduces them</span></span></a>')
        mids.append(f'<section class="tp-card"{_kattr(g["kind"])} aria-labelledby="{_slug(g["title"])}">'
                    f'{_group_head(g)}{body}</section>')

    # Compare models: a band of tiles across the page.
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
    band = (f'<section class="tp-band"{_kattr(g["kind"])} aria-labelledby="{_slug(g["title"])}">'
            f'{_group_head(g)}<ul class="tp-tiles">{"".join(tiles)}</ul></section>')

    listed = sum(len(x["entries"]) for x in groups)
    print(f"layout_nav: {LANDING_TAB} landing: {len(groups)} groups, {listed} pages from the nav, "
          f"{len(_S['tools'])} tools ({sum(1 for t in _S['tasks'] if t.get('landing'))} task shortcuts), "
          f"{len(prompts)} prompts ({len(rd.PROMPT_CATEGORY_LANDING)} category shortcuts)")
    _S["full"] += 1
    return (f'{_key(used)}<div class="tp-landing">'
            f'<div class="tp-primary">{tool_card}{prompt_card}</div>'
            f'<div class="tp-guides">{"".join(mids)}</div>{band}</div>')


# --- link rows on the landing pages ------------------------------------------------------

_TAG = re.compile(r"<(/?)(div|ul|li)\b([^>]*)>", re.I)
_A_HREF = re.compile(r'<a\b[^>]*\bhref="([^"]*)"', re.I)


def _decorate_rows(output: str, page) -> str:
    """On a landing page, color each link row (the rows inside grid cards,
    and door rows) by the kind of the page it opens, and put one key above
    the first colored block naming the kinds used."""
    start = output.find("<article")
    end = output.rfind("</article>")
    if start == -1 or end == -1:
        return output
    art = output[start:end]
    edits = []                 # (position in art, text to insert)
    used: set = set()
    first_block = None
    depth = 0                  # div depth
    block = None               # (kind of block, div depth at which it opened, ul depth)
    ul = 0
    for m in _TAG.finditer(art):
        close, tag, attrs = m.group(1), m.group(2).lower(), m.group(3)
        if tag == "div":
            if close:
                depth -= 1
                if block is not None and depth < block[1]:
                    block = None
            else:
                depth += 1
                cls = re.search(r'class="([^"]*)"', attrs)
                cls = cls.group(1).split() if cls else []
                if block is None and ("door-rows" in cls or {"grid", "cards"} <= set(cls)):
                    block = ("door" if "door-rows" in cls else "grid", depth, m.start())
                    ul = 0
            continue
        if block is None:
            continue
        if tag == "ul":
            ul += -1 if close else 1
            continue
        if tag == "li" and not close:
            want = 1 if block[0] == "door" else 2
            if ul != want:
                continue
            nxt = art.find("<li", m.end())
            stop = art.find("</li>", m.end())
            seg_end = min(x for x in (nxt, stop, len(art)) if x != -1)
            a = _A_HREF.search(art, m.end(), seg_end)
            if not a:
                continue
            kind = _kind_of_href(a.group(1), page)
            if not kind:
                continue
            used.add(kind)
            _S["rows"][kind] = _S["rows"].get(kind, 0) + 1
            if first_block is None:
                first_block = block[2]
            tag_end = m.end() - 1
            if 'class="' in attrs:
                # "<li" is three characters; attrs starts right after it.
                edits.append((m.start() + 3 + attrs.index('class="') + 7, "kind-row kind-mark "))
                edits.append((tag_end, f' data-kind="{kind}"'))
            else:
                edits.append((tag_end, f' class="kind-row kind-mark" data-kind="{kind}"'))
    if not used:
        return output
    edits.append((first_block, _key(used)))
    _S["row_pages"] += 1
    for pos, text in sorted(edits, key=lambda e: e[0], reverse=True):
        art = art[:pos] + text + art[pos:]
    return output[:start] + art + output[end:]


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
    src = page.file.src_uri
    output = output.replace("</head>", _kind_style() + "</head>", 1)
    kind = (page.meta or {}).get("page_type")
    if LANDING_SLOT in output:
        if src != "tools-and-prompts.md" or output.count(LANDING_SLOT) != 1:
            raise ValueError(f"layout_nav: {src} holds the landing slot; only "
                             "docs/tools-and-prompts.md may, exactly once")
        return output.replace(LANDING_SLOT, _landing(page), 1)
    if kind == "door":
        return _decorate_rows(output, page)
    at = output.find('<div class="page-end">')
    if at == -1:
        at = output.find("</article>")
    start = output.find("<article")
    foot = _foot(page, output[start:at] if start != -1 and at != -1 else "")
    if not foot:
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
          f"{_S['tocs']} with On this page")
    print(f"  landing                         : {_S['full']} ({LANDING_TAB})")
    print(f"  colored link rows on landings   : "
          + (", ".join(f"{k} {n}" for k, n in sorted(_S['rows'].items())) or "none")
          + f" (on {_S['row_pages']} pages)")
    print(f"  color keys written              : {_S['keys']}")
    print(f"  links to and from Learn modules : {_S['module_links']}")
    print(f"  palette hues with no kind       : {', '.join(unused) or 'none'}")
    print(f"  icons used                      : {len(_S['icons'])}")
    print(f"  generated links                 : {len(_S['hrefs'])} checked, {len(bad)} broken")
    if _S["undecorated"]:
        print(f"  pages with no icon or subtitle  : {', '.join(sorted(_S['undecorated']))}")
    if bad:
        raise AssertionError("layout_nav: generated links that do not resolve:\n  "
                             + "\n  ".join(bad[:20]))
    if _S["feet"] != _S["expected_feet"] or _S["full"] != 1:
        raise AssertionError("layout_nav: a page foot or the landing was not written")
