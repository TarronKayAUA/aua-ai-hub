"""MkDocs hook: Island Night vignettes in approved empty spaces (art round, 2026-09-27).

The owner's order for an empty space on a reading page is: rearrange what is
there, then something functional from the data, and only where neither fits,
art. The places that passed that test and that he approved are listed in
data/art_slots.yaml; nothing here finds places on its own.

For each listed place this hook adds one empty, decorative element, in the
page's content (on_page_content), before any layout hook runs: at the end of
the named h2 section, or, with `section: _head` on a landing page, beside the
page's head (see HEADS below):

    <figure class="isl-vignette" data-vignette="<piece>" data-kind="<kind>"
            [data-aspect="<height / width>"]><figcaption class="isl-cap" ...>
            <caption></figcaption></figure>

layout_width.py then treats it as the object that follows the section's last
block, so it lands beside that block as a leaf, in the track that was empty.
docs/javascripts/layout-art.js draws it (docs/assets/art/island-vignettes.js)
only where it is shown, from 68.75em; below that it is hidden and nothing is
fetched. Without JavaScript it stays empty, which is the space as it was.

Where the slot has a `caption`, the element holds one line of text (owner,
2026-09-29): what the picture shows, in a figcaption that island-vignettes.js
completes with the time of day the picture is drawn at, linked to the write-up
that explains the five versions, with `captions.hover` as the link's hover text
(the `captions` block). A picture that is not of a particular place has no
caption and no figcaption. The drawing itself stays
decorative (aria-hidden); the caption is read. The narration reads markdown and
the title-case check leaves captions alone (they are sentence case), so both are
unchanged. The build fails if a listed page or section is missing, so a renamed
heading cannot silently drop a scene, and if the write-up or its heading is gone.
"""
from __future__ import annotations

import html as _html
import json
import re
from pathlib import Path

import yaml
from mkdocs.utils import get_relative_url

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "art_slots.yaml"

_S = {"slots": [], "placed": [], "pages_seen": set(), "captions": {}, "captioned": 0}

TIMES = ("dawn", "day", "sunset", "dusk", "night")


# HEADS (art round 2, 2026-09-27: the owner wants the pieces seen, not buried): on a landing page
# the head is the title, the lede, the search field and the jump links, before the Color key and the
# first card grid. `section: _head` wraps those blocks in `div.isl-head` with the figure after them;
# docs/stylesheets/layout-art.css sets the two side by side from 68.75em, the picture on the right
# where the head left the frame empty. Below that the wrapper is an ordinary block and the figure is
# hidden, so the page reads as before.
# A head ends at the first thing that is not the title and its lede: a section, a door's cards or rows,
# a shelf (the Tool Directory's, whose first h2 is inside it), a news page's brief or the feed panel
# layout_week has already wrapped it in (a <section>, which the head must never split), or a grid of
# resource cards (Learning to Prompt, which has no h2) (2026-09-29).
HEAD_END = re.compile(r'<(h2\b|section\b|div class="grid|p class="kind-key|div class="learn-door|div data-tp-landing'
                      r'|div class="shelf|div class="door-rows|div class="section-brief|div class="video-grid'
                      r'|div class="wk-feeds)')


def _balanced(fragment: str) -> bool:
    """A head must hold whole elements: every div and section it opens it also closes (2026-09-29, after two
    news pages lost their layout when the head swallowed the opening tag of a wrapper an earlier hook had
    added). The build fails instead of shipping a broken page."""
    return all(len(re.findall(rf"<{t}\b", fragment)) == len(re.findall(rf"</{t}>", fragment)) for t in ("div", "section"))

# STACKS (2026-09-28, the About page): `section: [first, last]` wraps the h2 sections from `first`
# through `last` in `div.isl-stack` with the picture beside them. `first` may be `_title` (owner,
# 2026-09-29): the stack then starts at the page's h1, so the picture's top is level with the title,
# as on the landings; layout_width.py finds the title inside the stack. layout_width.py gives the stack
# its own role and a full-width row, so the sections stack in one column and the picture takes the
# other; below 68.75em it is an ordinary block and the figure is hidden.
#
# FIT (2026-09-28, the owner: "don't shift elements down, just fit it in to the small section of
# text at the top"): `fit: text` makes the picture exactly as tall as the text beside it, so a head
# or stack keeps the height it had; docs/assets/art/island-vignettes.js reads the text's height.


def _caption_ok(where: str, text) -> None:
    """A caption or time phrase is one plain line in the site's style: no final punctuation (the
    renderer adds ", <time>."), no em dash."""
    if not isinstance(text, str) or not text.strip() or text != text.strip() or "\n" in text:
        raise SystemExit(f"layout_art: {DATA.name} {where} must be one line of text, got {text!r}")
    if text[-1] in ".,;:!?":
        raise SystemExit(f"layout_art: {DATA.name} {where} must not end in punctuation: {text!r}")
    if "—" in text:
        raise SystemExit(f"layout_art: {DATA.name} {where} has an em dash: {text!r}")


def _load() -> tuple[list[dict], dict]:
    raw = yaml.safe_load(DATA.read_text(encoding="utf-8")) or {}
    slots = raw.get("slots") or []
    for s in slots:
        missing = [k for k in ("page", "section", "piece") if not s.get(k)]
        if missing:
            raise SystemExit(f"layout_art: {DATA.name} entry {s} lacks {', '.join(missing)}")
        if "caption" in s:
            _caption_ok(f"{s['page']} caption", s["caption"])
    caps = raw.get("captions") or {}
    times = caps.get("times") or {}
    if sorted(times) != sorted(TIMES):
        raise SystemExit(f"layout_art: {DATA.name} captions.times must name exactly {', '.join(TIMES)}")
    for k in TIMES:
        _caption_ok(f"captions.times.{k}", times[k])
    about = caps.get("about") or ""
    if about.count("#") != 1 or not about.split("#")[0].endswith(".md") or not about.split("#")[1]:
        raise SystemExit(f"layout_art: {DATA.name} captions.about must be <page>.md#<heading id>, got {about!r}")
    _caption_ok("captions.hover", caps.get("hover"))
    return slots, {"times": {k: times[k] for k in TIMES}, "about": about, "hover": caps["hover"]}


def on_config(config, **kwargs):
    _S["slots"], _S["captions"] = _load()
    _S["placed"] = []
    _S["pages_seen"] = set()
    _S["captioned"] = 0
    return config


def _figcaption(s: dict, page, files) -> str:
    """The caption line: the slot's words now; island-vignettes.js adds the time of day, linked.
    Nothing for a slot without a caption."""
    if not s.get("caption"):
        return ""
    path, anchor = _S["captions"]["about"].split("#")
    target = files.get_file_from_path(path)
    if target is None:
        raise SystemExit(f"layout_art: captions.about names {path}, which is not in the docs (data/art_slots.yaml)")
    href = get_relative_url(target.url, page.url) + "#" + anchor
    when = _html.escape(json.dumps(_S["captions"]["times"]), quote=True)
    _S["captioned"] += 1
    hover = _html.escape(_S["captions"]["hover"], quote=True)
    return (f'<figcaption class="isl-cap" data-when="{when}" data-about="{_html.escape(href, quote=True)}"'
            f' data-hover="{hover}">'
            f'{_html.escape(s["caption"], quote=False)}</figcaption>')


def on_page_content(html, page, config, files, **kwargs):
    src = page.file.src_uri
    mine = [s for s in _S["slots"] if s["page"] == src]
    if not mine:
        return html
    _S["pages_seen"].add(src)
    for s in mine:
        kind = f' data-kind="{s["kind"]}"' if s.get("kind") else ""
        aspect = f' data-aspect="{float(s["aspect"]):.3f}"' if s.get("aspect") else ""
        fit = ' data-fit="text"' if s.get("fit") == "text" else ""
        aspect += fit
        cap = _figcaption(s, page, files)
        # Without a caption the whole figure is decoration, hidden from screen readers as before.
        if not cap:
            aspect += ' aria-hidden="true"'
        if isinstance(s["section"], list):
            first, last = s["section"][0], s["section"][-1]
            a = (re.search(r"<h1\b", html) if first == "_title"
                 else re.search(r'<h2\b[^>]*\bid="' + re.escape(first) + r'"[^>]*>', html))
            b = re.search(r'<h2\b[^>]*\bid="' + re.escape(last) + r'"[^>]*>', html)
            if not a or not b or b.start() < a.start():
                raise SystemExit(f"layout_art: {src} has no h2 sections {first} to {last} in order (data/art_slots.yaml)")
            nxt = re.compile(r"<h2\b").search(html, b.end())
            end = nxt.start() if nxt else len(html)
            fig = (f'<figure class="isl-vignette isl-vignette--stack" data-vignette="{s["piece"]}"{kind}{aspect}'
                   f'>{cap}</figure>')
            html = (html[:a.start()] + '<div class="isl-stack"><div class="isl-stack__text">' + html[a.start():end]
                    + "</div>" + fig + "</div>\n" + html[end:])
            _S["placed"].append(f'{src}#{first}..{last} ({s["piece"]})')
            continue
        if s["section"] == "_head":
            h1 = re.search(r"<h1\b", html)
            end = HEAD_END.search(html, h1.end()) if h1 else None
            if not h1 or not end:
                raise SystemExit(f"layout_art: {src} has no landing head to sit beside (data/art_slots.yaml)")
            if not _balanced(html[h1.start():end.start()]):
                raise SystemExit(f"layout_art: {src}: the head would split an element (an unclosed div or section "
                                 "before its end); add that element's opening to HEAD_END")
            fig = (f'<figure class="isl-vignette isl-vignette--head" data-vignette="{s["piece"]}"{kind}{aspect}'
                   f'>{cap}</figure>')
            html = (html[:h1.start()] + '<div class="isl-head"><div class="isl-head__text">' + html[h1.start():end.start()]
                    + "</div>" + fig + "</div>\n" + html[end.start():])
        else:
            m = re.search(r'<h2\b[^>]*\bid="' + re.escape(s["section"]) + r'"[^>]*>', html)
            if not m:
                raise SystemExit(f"layout_art: {src} has no h2 with id \"{s['section']}\" (data/art_slots.yaml)")
            nxt = re.compile(r"<h2\b").search(html, m.end())
            at = nxt.start() if nxt else len(html)
            fig = (f'<figure class="isl-vignette" data-vignette="{s["piece"]}"{kind}{aspect}'
                   f'>{cap}</figure>\n')
            html = html[:at] + fig + html[at:]
        _S["placed"].append(f'{src}#{s["section"]} ({s["piece"]})')
    return html


def on_post_build(config, **kwargs):
    slots = _S["slots"]
    placed = _S["placed"]
    print("layout_art: Island Night vignettes (data/art_slots.yaml)")
    print(f"  slots read   : {len(slots)}")
    print(f"  placed       : {len(placed)}")
    for p in placed:
        print(f"    {p}")
    unseen = sorted({s["page"] for s in slots} - _S["pages_seen"])
    if unseen:
        raise SystemExit(f"layout_art: listed pages not built: {', '.join(unseen)}")
    if len(placed) != len(slots):
        raise SystemExit(f"layout_art: {len(slots)} slots read but {len(placed)} placed")
    # Every slot with a caption has it on the page, and the write-up its time words link to still has
    # that heading.
    want = sum(1 for s in slots if s.get("caption"))
    print(f"  captioned    : {_S['captioned']} of {want} with a caption ({len(placed) - want} without, by design)")
    if _S["captioned"] != want:
        raise SystemExit(f"layout_art: {want} slots have a caption but {_S['captioned']} were captioned")
    path, anchor = _S["captions"]["about"].split("#")
    stem = path[:-len("index.md")] if path.endswith("index.md") else path[:-3] + "/"
    built = Path(config["site_dir"]) / stem / "index.html"
    if not built.exists() or f'id="{anchor}"' not in built.read_text(encoding="utf-8"):
        raise SystemExit(f"layout_art: captions.about {path}#{anchor} has no such heading in the built site")
    print(f"  caption link : {path}#{anchor} (heading found)")
