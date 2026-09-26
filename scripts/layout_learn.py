"""MkDocs hook: the Learn landing and the seven modules (layout redesign,
owner approved 2026-09-25; layout plan L13, navigation plan step 9).

Everything here is added to RENDERED HTML. The modules' spoken text is read
from their markdown source by scripts/narration_common.py, so nothing in
this file can change what the narrator says, and the committed recordings
stay current.

Modules (the lesson pages under pathway/):
  - a "Module N of 7" progress strip under the title. N is the module's
    place in the Learn tab of the navigation, and it must agree with the
    number in the module's own title or the build fails;
  - the authored "**Next:**" line, and Module 6's "**Done with the core
    pathway?**" line, rendered as buttons by a class this hook adds. The
    source line is untouched and still begins with "**Next:**", which is
    why narration skips it. One link becomes one filled Next button; links
    offered as alternatives ("A, B, or C, depending on your role") become a
    group of equal buttons; a line that is a sentence keeps its words, with
    a Next button for its first link. Each button states the minutes (and,
    for a module, the audience) from the target page's own meta chips;
  - the competency foot line (a meta-chip line after the Next line; the
    narration extractor strips every line that starts with a meta-chip
    span) marked for its own quiet style;
  - the footer's Next (which layout.js docks) follows the module's own
    Next line: Module 7 points at the first hands-on guide rather than at
    the Glossary, and Modules 3 and 4, whose Next lines offer a choice,
    name no single next module;
  - the head meta line marked so a wrapped line never starts with a dot.

Learn landing (pathway/index.md):
  - an empty "Continue where you left off" slot under the Start button,
    and the module list it needs. docs/javascripts/layout-learn.js fills
    the slot from this browser's localStorage and leaves it hidden when
    nothing is stored; nothing is ever sent anywhere;
  - checks, because the landing states minutes the modules also state:
    each route-map entry's minutes and audience must match its page's own
    chips, the stage totals (marked data-learn-minutes) must match the sum,
    and the Start button must name Module 1 and its minutes. A mismatch
    fails the build and names the sentence to fix.

Verification counts are printed on every build (CLAUDE.md working rule 2),
and the build fails unless all seven modules got their strip, their Next
buttons and their foot line.
"""
from __future__ import annotations

import html as _html
import json
import posixpath
import re
from pathlib import Path

from mkdocs.utils import get_relative_url

LANDING = "pathway/index.md"
PREFIX = "pathway/"

_FRONT = re.compile(r"^---\n.*?\n---\n", re.DOTALL)
_HEAD_LINE = re.compile(r'^<span class="meta-chip".*$', re.MULTILINE)
_CHIP = re.compile(r'<span class="meta-chip">(.*?)</span>')
_ABOUT = re.compile(r"^About (\d+) minutes$")
_H1 = re.compile(r"^# (.+?)\s*$", re.MULTILINE)
_MODULE_TITLE = re.compile(r"^Module (\d+): (.+)$")
_END_SRC = re.compile(r"^\*\*(Next:|Done with the core pathway\?)\*\*[ \t]*(.+)$", re.MULTILINE)
_MD_LINK = re.compile(r"\[([^\]]+)\]\(([^)\s]+)\)")
_END_HTML = re.compile(r"<p><strong>(Next:|Done with the core pathway\?)</strong>\s*(.*?)</p>", re.DOTALL)
_A = re.compile(r'<a href="([^"]*)"[^>]*>(.*?)</a>', re.DOTALL)
_ROUTE_ITEM = re.compile(r'^- <span class="route-n([^"]*)">(\d*)</span>(.*)$', re.MULTILINE)
_ROUTE_MIN = re.compile(r'<span class="route-min">(\d+) min</span>')
_ROUTE_FOR = re.compile(r'<span class="route-for">(.*?)</span>')
_STATED = re.compile(r'data-learn-minutes="(sum|each):([\w-]+)"[^>]*>(.*?)<', re.DOTALL)

_S: dict = {}


def _reset():
    _S.clear()
    _S.update(modules=[], by_src={}, nav_pages={}, facts={}, docs=None,
              strips=0, ends={}, feet=0, landing_checked=False, footer_moved=[])


def on_config(config):
    _reset()
    _S["docs"] = Path(config["docs_dir"])
    return config


# --- reading pages ------------------------------------------------------------

def _facts(src: str) -> dict:
    """Title, head meta chips and minutes of one page, read from its source."""
    if src in _S["facts"]:
        return _S["facts"][src]
    path = _S["docs"] / src
    if not path.is_file():
        raise ValueError(f"layout_learn: {src} does not exist")
    body = _FRONT.sub("", path.read_text(encoding="utf-8"), count=1)
    head = body.split("\n## ", 1)[0]
    h1 = _H1.search(head)
    line = _HEAD_LINE.search(head)
    chips = _CHIP.findall(line.group(0)) if line else []
    minutes = [int(m.group(1)) for m in (_ABOUT.match(c) for c in chips) if m]
    others = [c for c in chips if not _ABOUT.match(c)]
    facts = {"src": src, "h1": h1.group(1) if h1 else "", "body": body,
             "minutes": minutes[0] if minutes else None,
             "audience": others[0] if others else None}
    _S["facts"][src] = facts
    return facts


def _target(page_src: str, href: str) -> str:
    """A markdown link destination to the docs path it points at."""
    path = href.split("#", 1)[0]
    return posixpath.normpath(posixpath.join(posixpath.dirname(page_src), path))


def _round5(n: int) -> int:
    return int(5 * round(n / 5))


def _end_line(src: str, body: str) -> dict:
    """The module's closing line: its label, its links, and its shape."""
    found = _END_SRC.findall(body)
    if len(found) != 1:
        raise ValueError(f"layout_learn: {src} should have exactly one line starting "
                         f"'**Next:**' or '**Done with the core pathway?**', found {len(found)}")
    label, rest = found[0]
    links = _MD_LINK.findall(rest)
    if not links:
        raise ValueError(f"layout_learn: {src}: its {label} line has no link")
    parts = _MD_LINK.split(rest)
    seps = parts[0::3]                      # before, between, after the links
    pre, mids, post = seps[0], seps[1:-1], seps[-1]
    if (len(links) >= 2 and not pre.strip()
            and all(re.fullmatch(r"\s*(?:,\s*)?(?:or\s+)?", s) for s in mids)
            and "or" in mids[-1]):
        shape = "choice"
    elif len(links) == 1 and not pre.strip() and not post.strip(" .\t"):
        shape = "single"
    else:
        shape = "sentence"
    qualifier = post.strip().lstrip(",").strip().rstrip(".").strip() if shape == "choice" else ""
    return {"label": label, "shape": shape, "qualifier": qualifier,
            "targets": [_target(src, href) for _, href in links]}


# --- navigation ---------------------------------------------------------------

def on_nav(nav, config, files):
    if _S.get("docs") is None:
        _reset()
        _S["docs"] = Path(config["docs_dir"])
    _S["nav_pages"] = {p.file.src_uri: p for p in nav.pages}
    pages = [p for p in nav.pages
             if p.file.src_uri.startswith(PREFIX) and p.file.src_uri != LANDING]
    modules = []
    for n, page in enumerate(pages, 1):
        src = page.file.src_uri
        facts = _facts(src)
        m = _MODULE_TITLE.match(facts["h1"])
        if not m or int(m.group(1)) != n:
            raise ValueError(f"layout_learn: {src} is number {n} in the Learn navigation "
                             f"but its title is {facts['h1']!r}; the progress strip needs "
                             f"the two to agree")
        if facts["minutes"] is None:
            raise ValueError(f"layout_learn: {src} has no 'About N minutes' meta chip")
        end = _end_line(src, facts["body"])
        modules.append({"n": n, "id": posixpath.splitext(posixpath.basename(src))[0],
                        "src": src, "title": m.group(2), "h1": facts["h1"],
                        "minutes": facts["minutes"], "audience": facts["audience"],
                        "end": end})
    by_src = {m["src"]: m for m in modules}
    for mod in modules:
        mod["next"] = [by_src[t]["id"] for t in mod["end"]["targets"] if t in by_src]
    _S["modules"] = modules
    _S["by_src"] = by_src
    total = len(modules)
    print("layout_learn: pathway modules verification")
    print(f"  modules in the Learn tab: {total} (titles numbered 1 to {total} in order: ok)")
    print("  minutes per module      : "
          + ", ".join(str(m["minutes"]) for m in modules)
          + f" (sum {sum(m['minutes'] for m in modules)})")
    print("  closing lines           : "
          + ", ".join(f"{m['n']} {m['end']['shape']}" for m in modules))
    return nav


def _sub_for(target_src: str) -> str:
    """What a Next button says under its title: audience and minutes for a
    module, minutes for any other page, read from that page's own chips."""
    mod = _S["by_src"].get(target_src)
    if mod:
        bits = [mod["audience"], f"About {mod['minutes']} minutes"]
        return " · ".join(b for b in bits if b)
    facts = _facts(target_src)
    return f"About {facts['minutes']} minutes" if facts["minutes"] else ""


# --- the landing's checks -----------------------------------------------------

def _check_landing(markdown: str, page) -> None:
    modules = _S["modules"]
    by_n = {m["n"]: m for m in modules}
    items = _ROUTE_ITEM.findall(markdown)
    seen_modules, guides, problems = set(), [], []
    for cls, num, rest in items:
        link = _MD_LINK.search(rest)
        if not link:
            problems.append(f"route map entry {rest!r} has no link")
            continue
        src = _target(LANDING, link.group(2))
        facts = _facts(src)
        stated = _ROUTE_MIN.search(rest)
        if not stated:
            problems.append(f"route map entry for {src} states no minutes")
        elif facts["minutes"] is None or int(stated.group(1)) != facts["minutes"]:
            problems.append(f"route map says {stated.group(1)} min for {src}, "
                            f"its page says {facts['minutes']}")
        audience = _ROUTE_FOR.search(rest)
        if audience and audience.group(1) != facts["audience"]:
            problems.append(f"route map says {audience.group(1)!r} for {src}, "
                            f"its page says {facts['audience']!r}")
        if num:
            mod = by_n.get(int(num))
            if not mod or mod["src"] != src:
                problems.append(f"route map station {num} links {src}, which is not Module {num}")
            else:
                seen_modules.add(mod["n"])
        else:
            if src in _S["by_src"]:
                problems.append(f"route map lists module {src} without its number")
            guides.append(facts)
    if seen_modules != set(by_n):
        problems.append(f"route map is missing modules {sorted(set(by_n) - seen_modules)}")

    def modules_in(spec):
        a, _, b = spec.partition("-")
        return [by_n[i] for i in range(int(a), int(b or a) + 1) if i in by_n]

    stated_checked = 0
    for kind, spec, text in _STATED.findall(markdown):
        text = " ".join(text.split())
        if spec == "guides":
            values = [g["minutes"] for g in guides]
        else:
            values = [m["minutes"] for m in modules_in(spec)]
        if not values or None in values:
            problems.append(f"data-learn-minutes={kind}:{spec} matches no pages")
            continue
        if kind == "sum":
            total = sum(values)
            want = _round5(total) if "about" in text.lower() else total
            got = re.search(r"(\d+) minutes", text)
            if not got or int(got.group(1)) != want:
                problems.append(f"{text!r} ({kind}:{spec}) should say {want} "
                                f"(the pages add up to {total})")
        else:
            lo, hi = min(values), max(values)
            want = f"{lo} to {hi} minutes" if lo != hi else f"{lo} minutes"
            if want not in text:
                problems.append(f"{text!r} ({kind}:{spec}) should say {want!r}")
        stated_checked += 1

    first = by_n.get(1)
    actions = (page.meta or {}).get("action") or []
    start = next((a for a in actions if a.get("style", "primary") == "primary"), None)
    if first and start:
        want = f"Start Module 1: {first['title']} ({first['minutes']} minutes)"
        if start.get("text") != want or start.get("link") != first["src"]:
            problems.append(f"the Start button should read {want!r} and link {first['src']}")
    elif first:
        problems.append("the landing has no primary action (the Start button)")

    if problems:
        raise ValueError("layout_learn: the Learn landing disagrees with its pages:\n  - "
                         + "\n  - ".join(problems))
    print("layout_learn: Learn landing verification")
    print(f"  route map entries : {len(items)} ({len(seen_modules)} modules, "
          f"{len(guides)} hands-on guides), minutes match their pages: ok")
    print(f"  guides' minutes   : {sum(g['minutes'] for g in guides)} in total")
    print(f"  stated totals     : {stated_checked} checked: ok")
    print(f"  Start button      : names Module 1 and its {first['minutes']} minutes: ok")
    _S["landing_checked"] = True


def on_page_markdown(markdown, page, config, files):
    if page.file.src_uri == LANDING and _S["modules"]:
        _check_landing(markdown, page)
    return markdown


# --- the footer's Next follows the module's own Next line ---------------------

def on_page_context(context, page, config, nav):
    """The footer's Next (which layout.js also docks on phones and beside
    the page on desktop) follows the module's own closing line: its first
    link, or nothing when that line offers a choice, because naming one
    module there ("Next: 4. Teaching and Assessment" after Module 3) would
    contradict "depending on your role"."""
    mod = _S["by_src"].get(page.file.src_uri)
    if not mod:
        return context
    if mod["end"]["shape"] == "choice":
        if page.next_page is not None:
            page.next_page = None
            _S["footer_moved"].append(f"Module {mod['n']} -> none (a choice)")
        return context
    target = _S["nav_pages"].get(mod["end"]["targets"][0])
    if target is not None and target is not page.next_page:
        page.next_page = target
        _S["footer_moved"].append(f"Module {mod['n']} -> {target.file.src_uri}")
    return context


# --- rendered HTML ------------------------------------------------------------

def _strip(mod: dict) -> str:
    total = len(_S["modules"])
    cells = "".join('<span class="is-current"></span>' if i == mod["n"] else "<span></span>"
                    for i in range(1, total + 1))
    return (f'<p class="learn-progress" data-learn-module="{mod["id"]}">'
            f'<span class="learn-progress__label">Module {mod["n"]} of {total}</span>'
            f'<span class="learn-progress__track" aria-hidden="true">{cells}</span></p>')


def _button(href: str, title: str, sub: str, primary: bool) -> str:
    cls = ("md-button md-button--primary learn-next__btn" if primary
           else "md-button learn-next__btn learn-next__btn--choice")
    sub_html = f'<span class="learn-next__sub">{_html.escape(sub)}</span>' if sub else ""
    return (f'<a class="{cls}" href="{href}"><span class="learn-next__title">{title}</span>'
            f'{sub_html}</a>')


def _next_block(mod: dict, label: str, inner: str) -> str:
    end = mod["end"]
    anchors = _A.findall(inner)
    if len(anchors) != len(end["targets"]):
        raise ValueError(f"layout_learn: {mod['src']}: the rendered {label} line has "
                         f"{len(anchors)} links, the source has {len(end['targets'])}")
    lid = f"learn-next-{mod['id']}"
    if end["shape"] == "choice":
        heading = "Next" + (f", {end['qualifier']}" if end["qualifier"] else "")
        rows = "".join(f"<li>{_button(href, text, _sub_for(t), False)}</li>"
                       for (href, text), t in zip(anchors, end["targets"]))
        return (f'<div class="learn-next learn-next--choice">'
                f'<p class="learn-next__label" id="{lid}">{_html.escape(heading)}</p>'
                f'<ul class="learn-next__choices" aria-labelledby="{lid}">{rows}</ul></div>')
    href, text = anchors[0]
    heading = label.rstrip(":")
    words = ""
    if end["shape"] == "sentence":
        # Keep the author's sentence; its first link becomes the button, so
        # in the sentence it is bold text rather than a second link.
        first = _A.search(inner)
        words = inner[:first.start()] + f"<strong>{text}</strong>" + inner[first.end():]
        words = f'<p class="learn-next__text">{words.strip()}</p>'
    return (f'<div class="learn-next">'
            f'<p class="learn-next__label" id="{lid}">{_html.escape(heading)}</p>{words}'
            f'{_button(href, text, _sub_for(end["targets"][0]), True)}</div>')


def _landing_html(html: str, page) -> str:
    modules = [{"id": m["id"], "n": m["n"], "title": m["title"],
                "url": get_relative_url(_S["nav_pages"][m["src"]].url, page.url),
                "minutes": m["minutes"], "next": m["next"]}
               for m in _S["modules"]]
    data = json.dumps({"modules": modules}, ensure_ascii=False).replace("</", "<\\/")
    block = ('<div class="learn-continue" data-learn-continue hidden></div>'
             f'<script type="application/json" id="learn-modules">{data}</script>')
    i = html.find("data-page-action")
    j = html.find("</div>", i) if i != -1 else -1
    if j == -1:
        raise ValueError("layout_learn: the Learn landing has no action slot to put "
                         "'Continue where you left off' under")
    return html[:j + 6] + block + html[j + 6:]


def _mark_meta(html: str, src: str) -> str:
    """Class the head meta line (the first meta-chip paragraph after the
    title), so its separators never start a wrapped line."""
    i = html.find("</h1>")
    j = html.find('<p><span class="meta-chip"', i)
    if i == -1 or j == -1:
        raise ValueError(f"layout_learn: {src} has no meta line under its title")
    return html[:j] + '<p class="learn-meta">' + html[j + 3:]


def on_page_content(html, page, config, files):
    src = page.file.src_uri
    if src == LANDING and _S["modules"]:
        return _landing_html(_mark_meta(html, src), page)
    mod = _S["by_src"].get(src)
    if not mod:
        return html

    i = html.find("</h1>")
    if i == -1:
        raise ValueError(f"layout_learn: {src} has no title to put the progress strip under")
    html = _mark_meta(html[:i + 5] + _strip(mod) + html[i + 5:], src)
    _S["strips"] += 1

    found = list(_END_HTML.finditer(html))
    if len(found) != 1:
        raise ValueError(f"layout_learn: {src}: expected one rendered closing line, found {len(found)}")
    m = found[0]
    html = html[:m.start()] + _next_block(mod, m.group(1), m.group(2)) + html[m.end():]
    _S["ends"][src] = mod["end"]["shape"]

    # The competency foot line: a meta-chip paragraph after the closing line.
    tail_at = html.find('<div class="learn-next')
    foot = html.find('<p><span class="meta-chip">', tail_at)
    if foot == -1:
        raise ValueError(f"layout_learn: {src} has no competency foot line after its Next line")
    html = html[:foot] + '<p class="learn-foot">' + html[foot + 3:]
    _S["feet"] += 1
    return html


def on_post_build(config):
    total = len(_S["modules"])
    shapes = {}
    for shape in _S["ends"].values():
        shapes[shape] = shapes.get(shape, 0) + 1
    print("layout_learn: rendered")
    print(f"  progress strips : {_S['strips']} of {total}")
    print(f"  closing buttons : {len(_S['ends'])} of {total} ("
          + ", ".join(f"{v} {k}" for k, v in sorted(shapes.items())) + ")")
    print(f"  foot lines      : {_S['feet']} of {total}")
    print("  footer Next     : follows the Next line"
          + (f" ({'; '.join(_S['footer_moved'])})" if _S["footer_moved"] else " (no change needed)"))
    print(f"  landing checked : {'yes' if _S['landing_checked'] else 'NO'}")
    if not (_S["strips"] == len(_S["ends"]) == _S["feet"] == total and _S["landing_checked"]):
        raise AssertionError("layout_learn: not every module was rendered with its strip, "
                             "Next buttons and foot line, or the landing was not checked")
