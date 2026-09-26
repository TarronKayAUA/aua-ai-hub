"""MkDocs hook: the section navigator (navigation design d2, 2026-09-26).

No page has a left navigation sidebar or a right "On this page" column
(scripts/layout_frame.py hides both everywhere). What they did is done here
instead, with one model of each tab built from the nav:

  - the SECTION MAP: a tab drawn as groups of small cards with icons, the
    current page marked. A subsection of the tab is a group; a run of pages
    sitting directly in the tab is a group named in data/section_map.yaml.
    Which pages appear, their order and their titles come from mkdocs.yml
    and nothing else; the data file adds only icons and one-line subtitles.
  - the PAGE FOOT on every inner page: previous and next in the section as
    two cards, then the whole section map inside a closed <details>, which
    is the map a reader without JavaScript uses.
    docs/javascripts/layout-nav.js lifts the same map into the floating
    section navigator (a pill at the foot of the screen naming the section
    and the page's place in it), so the two can never disagree.
  - the TOOLS & PROMPTS LANDING (docs/tools-and-prompts.md), which is the
    same map drawn full page, in the slot <div data-secmap-full></div>.

Everything is written in on_post_page, when every page's title is known,
so none of it enters the search index (a map on every page would otherwise
make every page match every section's titles) or the narration, which
reads markdown. Every link is made with get_relative_url from a page that
exists in the nav, and the build prints what it wrote and fails on a
mismatch (CLAUDE.md working rule 2).
"""
from __future__ import annotations

import html as _html
import re
from pathlib import Path

import material
import yaml
from mkdocs.utils import get_relative_url

import layout_frame

ICONS = Path(material.__file__).parent / "templates" / ".icons" / "material"
FULL_SLOT = "<div data-secmap-full></div>"
STATS_SLOT = "<p data-secmap-stats></p>"
HUES = 6

_S: dict = {}


# --- data ---------------------------------------------------------------------

def on_config(config):
    root = Path(config["docs_dir"]).parent
    deco = yaml.safe_load((root / "data" / "section_map.yaml").read_text(encoding="utf-8"))
    tools = yaml.safe_load((root / "data" / "tools.yaml").read_text(encoding="utf-8"))
    prompts = yaml.safe_load((root / "data" / "prompts.yaml").read_text(encoding="utf-8"))
    if isinstance(prompts, dict):
        prompts = prompts.get("prompts") or []
    _S.clear()
    _S.update(deco=deco, icons={}, tabs=[], where={}, counts={
        "tools": len(tools or []), "prompts": len(prompts or [])},
        feet=0, full=0, expected_feet=0, undecorated=set())
    if not _S["counts"]["tools"] or not _S["counts"]["prompts"]:
        raise ValueError("layout_nav: could not count data/tools.yaml or data/prompts.yaml")
    # An unquoted comma in a YAML flow mapping ends the value and turns the
    # rest of the line into stray keys ("sub: Chat, work, or code" becomes
    # sub "Chat" plus keys "work" and "or code"), so unknown keys fail here.
    allowed = {"tabs": {"icon", "loose"}, "groups": {"icon", "blurb", "route"},
               "pages": {"icon", "sub"}}
    for block, keys in allowed.items():
        for name, entry in (deco.get(block) or {}).items():
            extra = set(entry or {}) - keys
            if extra:
                raise ValueError(f"layout_nav: data/section_map.yaml {block} {name!r} has unknown "
                                 f"keys {sorted(extra)}; quote a value that contains a comma")
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


# --- the model: tabs, groups, entries ------------------------------------------

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
    tabs = []
    for item in nav.items:
        if not item.is_section:
            continue
        tdeco = (deco.get("tabs") or {}).get(item.title) or {}
        loose = list(tdeco.get("loose") or [])
        tab = {"title": item.title, "icon": tdeco.get("icon", "folder-outline"),
               "landing": None, "groups": [], "flat": []}
        children = list(item.children)
        first = children[0] if children else None
        if first is not None and first.is_page and (
                first.file.src_uri in layout_frame.DOOR
                or (first.meta or {}).get("page_type") == "door"
                or first.file.src_uri == "tools-and-prompts.md"):
            tab["landing"] = first
            children = children[1:]
        run = None
        for child in children:
            single = child.is_section and len(_pages_in(child)) == 1
            if child.is_page or single:
                page = child if child.is_page else _pages_in(child)[0]
                if run is None:
                    name = loose.pop(0) if loose else item.title
                    run = {"title": name, "entries": []}
                    tab["groups"].append(run)
                run["entries"].append({"page": page, "title": child.title if single else None})
            elif child.is_section:
                run = None
                tab["groups"].append({"title": child.title,
                                      "entries": [{"page": p, "title": None} for p in _pages_in(child)]})
        for gi, group in enumerate(tab["groups"]):
            gdeco = (deco.get("groups") or {}).get(group["title"]) or {}
            group.update(icon=gdeco.get("icon", tab["icon"]), blurb=gdeco.get("blurb", ""),
                         route=bool(gdeco.get("route")), hue=gi % HUES)
            for entry in group["entries"]:
                entry["group"] = group
                entry["pos"] = len(tab["flat"]) + 1
                tab["flat"].append(entry)
                _S["where"][entry["page"].file.src_uri] = (tab, entry)
        if tab["flat"]:
            tabs.append(tab)
            if tab["landing"] is not None:
                _S["where"][tab["landing"].file.src_uri] = (tab, None)
    _S["tabs"] = tabs
    print("layout_nav: section model from the nav")
    for tab in tabs:
        print(f"  {tab['title']:<22}: {len(tab['flat']):>2} pages in {len(tab['groups'])} groups"
              + (f", landing {tab['landing'].file.src_uri}" if tab["landing"] else ", no landing"))
    return nav


def _home_of(page):
    """For a page outside the nav (a prompt page, a weekly digest, an
    announcement): the nav page it belongs to, by its nav parent or else by
    the index page of its folder or the nearest folder above."""
    parent = page.parent
    while parent is not None:
        for p in _pages_in(parent):
            if p.file.src_uri in _S["where"]:
                return p
        parent = parent.parent
    folder = page.file.src_uri.rsplit("/", 1)[0] if "/" in page.file.src_uri else ""
    while folder:
        cand = f"{folder}/index.md"
        if cand in _S["where"]:
            return _S["where"][cand][1]["page"] if _S["where"][cand][1] else None
        folder = folder.rsplit("/", 1)[0] if "/" in folder else ""
    return None


# --- rendering -------------------------------------------------------------------

def _esc(text) -> str:
    return _html.escape(str(text or ""), quote=True)


def _title(entry) -> str:
    return entry["title"] or entry["page"].title or entry["page"].file.name


_NUM = re.compile(r"^(\d+)\.\s+(.+)$")


def _card(entry, here_src, page, full: bool, inside: bool = False) -> str:
    p = entry["page"]
    pdeco = (_S["deco"].get("pages") or {}).get(p.file.src_uri) or {}
    if not pdeco:
        _S["undecorated"].add(p.file.src_uri)
    title = _title(entry)
    mark = _icon(pdeco.get("icon", entry["group"]["icon"]))
    num = _NUM.match(title) if entry["group"]["route"] else None
    if num:
        mark, title = f'<span class="secmap__num">{num.group(1)}</span>', num.group(2)
    sub = _fill(pdeco.get("sub", ""))
    current = p.file.src_uri == here_src
    href = get_relative_url(p.url, page.url)
    # A page outside the nav (a prompt page, a weekly digest) marks the
    # page it belongs to: "true" rather than "page", since it is not it.
    attrs = (' aria-current="true"' if inside else ' aria-current="page"') if current else ""
    cls = "secmap__card" + (" is-current" if current else "")
    here = (f'<span class="secmap__here">{"You are inside this" if inside else "You are here"}</span>'
            if current else "")
    return (f'<li><a class="{cls}" href="{_esc(href)}"{attrs}>'
            f'<span class="secmap__icon">{mark}</span>'
            # Spaces between the spans, so the link's text reads "Tool
            # Directory 75 tools..." rather than "Tool Directory75 tools...".
            f'<span class="secmap__words"><span class="secmap__title">{_esc(title)}</span>'
            + (f' <span class="secmap__sub">{_esc(sub)}</span>' if sub else "")
            + (f" {here}" if here else "") + "</span></a></li>")


def _map(tab, here_src, page, full: bool = False, inside: bool = False) -> str:
    groups = []
    for group in tab["groups"]:
        n = len(group["entries"])
        cls = f"secmap__group secmap__group--h{group['hue']}"
        if group["route"]:
            cls += " secmap__group--route"
        if n >= 6:
            cls += " secmap__group--wide"
        if any(e["page"].file.src_uri == here_src for e in group["entries"]):
            cls += " is-here"
        blurb = (f'<p class="secmap__blurb">{_esc(group["blurb"])}</p>'
                 if full and group["blurb"] else "")
        cards = "".join(_card(e, here_src, page, full, inside) for e in group["entries"])
        groups.append(f'<li class="{cls}" style="--n:{n}">'
                      f'<p class="secmap__head"><span class="secmap__gicon">{_icon(group["icon"])}</span>'
                      f'<span class="secmap__gname">{_esc(group["title"])}</span>'
                      f'<span class="secmap__count">{n}</span></p>{blurb}'
                      f'<ul class="secmap__cards">{cards}</ul></li>')
    variant = " secmap--full" if full else ""
    return f'<div class="secmap{variant}" data-secmap><ol class="secmap__groups">{"".join(groups)}</ol></div>'


def _track(tab, here_src) -> str:
    """The section's shape in ticks, one per page, a gap between groups:
    the pill shows it beside "Page 11 of 16"."""
    out = []
    for group in tab["groups"]:
        ticks = "".join('<i class="is-current"></i>' if e["page"].file.src_uri == here_src else "<i></i>"
                        for e in group["entries"])
        cls = "sectrack__g is-here" if any(e["page"].file.src_uri == here_src
                                           for e in group["entries"]) else "sectrack__g"
        out.append(f'<span class="{cls}">{ticks}</span>')
    return f'<span class="sectrack" aria-hidden="true">{"".join(out)}</span>'


def _pn_card(kind: str, label: str, target, title: str, sub: str, page) -> str:
    href = get_relative_url(target.url, page.url)
    rel = ' rel="prev"' if kind == "prev" else (' rel="next"' if kind == "next" else "")
    arrow = _icon("arrow-left" if kind in ("prev", "back") else "arrow-right")
    return (f'<a class="secfoot__card secfoot__card--{kind}" href="{_esc(href)}"{rel}>'
            f'<span class="secfoot__arrow">{arrow}</span>'
            f'<span class="secfoot__words"><span class="secfoot__dir">{_esc(label)}</span> '
            f'<span class="secfoot__title">{_esc(title)}</span>'
            + (f' <span class="secfoot__sub">{_esc(sub)}</span>' if sub else "")
            + "</span></a>")


def _where_label(target) -> str:
    found = _S["where"].get(target.file.src_uri)
    if not found:
        return ""
    tab, entry = found
    if entry is None:
        return f"{tab['title']} overview"
    return entry["group"]["title"]


def _foot(page) -> str:
    src = page.file.src_uri
    found = _S["where"].get(src)
    home = None
    if found is None:
        home = _home_of(page)
        if home is None:
            return ""
        found = _S["where"][home.file.src_uri]
    tab, entry = found
    if entry is None:           # a landing page: it is the map already
        return ""
    in_nav = home is None
    here_src = src if in_nav else home.file.src_uri

    # Previous and next in the section. A lesson follows its own Next line
    # (scripts/layout_learn.py sets page.next_page, and clears it where the
    # module offers a choice); a page outside the nav gets one card back to
    # the page it belongs to.
    cards = []
    if in_nav:
        i = entry["pos"] - 1
        flat = tab["flat"]
        if i > 0:
            prev = flat[i - 1]
            cards.append(_pn_card("prev", "Previous", prev["page"], _title(prev), prev["group"]["title"], page))
        elif tab["landing"] is not None:
            cards.append(_pn_card("prev", "Previous", tab["landing"], tab["title"], "Section overview", page))
        if (page.meta or {}).get("page_type") == "lesson":
            nxt = page.next_page
            if nxt is not None:
                cards.append(_pn_card("next", "Next", nxt, nxt.title, _where_label(nxt), page))
        elif i + 1 < len(flat):
            nxt = flat[i + 1]
            cards.append(_pn_card("next", "Next", nxt["page"], _title(nxt), nxt["group"]["title"], page))
        elif tab["landing"] is not None:
            cards.append(_pn_card("next", "Back to", tab["landing"], tab["title"], "Section overview", page))
    else:
        cards.append(_pn_card("back", "Back to", home, _title(entry), entry["group"]["title"], page))

    total = len(tab["flat"])
    pos = entry["pos"] if in_nav else ""
    overview = ""
    if tab["landing"] is not None:
        href = get_relative_url(tab["landing"].url, page.url)
        overview = (f'<a class="secfoot__overview" href="{_esc(href)}">'
                    f'{_esc(tab["title"])} overview</a>')
    summary = (f'<summary><span class="secfoot__sicon">{_icon(tab["icon"])}</span>'
               f'<span class="secfoot__stext">All {total} pages in {_esc(tab["title"])}</span>'
               f'{_track(tab, here_src)}</summary>')
    return (f'<nav class="secfoot" aria-label="{_esc(tab["title"])}: this section" data-secfoot '
            f'data-section="{_esc(tab["title"])}" data-pos="{pos}" data-total="{total}" '
            f'data-group="{_esc(entry["group"]["title"])}">'
            f'<div class="secfoot__pn">{"".join(cards)}</div>'
            f'<details class="secfoot__all">{summary}'
            f'<div class="secfoot__body">{overview}{_map(tab, here_src, page, inside=not in_nav)}</div></details></nav>')


def _stats(tab) -> str:
    c = _S["counts"]
    return (f'<p class="tp-stats"><span><strong>{c["tools"]}</strong> tools</span>'
            f'<span><strong>{c["prompts"]}</strong> prompts</span>'
            f'<span><strong>{len(tab["flat"])}</strong> pages in {len(tab["groups"])} groups</span></p>')


def on_post_page(output, page, config):
    src = page.file.src_uri
    if FULL_SLOT in output:
        found = _S["where"].get(src)
        if not found or found[1] is not None:
            raise ValueError(f"layout_nav: {src} has a full-map slot but is not a tab's landing page")
        tab = found[0]
        if output.count(FULL_SLOT) != 1 or output.count(STATS_SLOT) > 1:
            raise ValueError(f"layout_nav: {src} must hold the full-map slot exactly once "
                             "(and not quote it in a comment)")
        output = output.replace(FULL_SLOT, _map(tab, src, page, full=True), 1)
        output = output.replace(STATS_SLOT, _stats(tab), 1)
        _S["full"] += 1
        return output
    kind = (page.meta or {}).get("page_type")
    if kind == "door":
        return output
    foot = _foot(page)
    if not foot:
        return output
    _S["expected_feet"] += 1
    at = output.find('<div class="page-end">')
    if at == -1:
        at = output.find("</article>")
    if at == -1:
        raise ValueError(f"layout_nav: {src} has no page ending or article to put the section foot in")
    _S["feet"] += 1
    return output[:at] + foot + output[at:]


def on_post_build(config):
    print("layout_nav: rendered")
    print(f"  section feet (prev/next and map): {_S['feet']} of {_S['expected_feet']} inner pages")
    print(f"  full-page maps                  : {_S['full']} (Tools & Prompts landing)")
    print(f"  icons used                      : {len(_S['icons'])}")
    if _S["undecorated"]:
        print(f"  pages with no icon or subtitle  : {', '.join(sorted(_S['undecorated']))}")
    if _S["feet"] != _S["expected_feet"] or _S["full"] != 1:
        raise AssertionError("layout_nav: a page foot or the landing's full map was not written")
