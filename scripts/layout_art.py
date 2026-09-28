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
            [data-aspect="<height / width>"] aria-hidden="true"></figure>

layout_width.py then treats it as the object that follows the section's last
block, so it lands beside that block as a leaf, in the track that was empty.
docs/javascripts/layout-art.js draws it (docs/assets/art/island-vignettes.js)
only where it is shown, from 68.75em; below that it is hidden and nothing is
fetched. Without JavaScript it stays empty, which is the space as it was.

The element holds no text, so search, the narration (which reads markdown)
and the title-case check are unchanged. The build fails if a listed page or
section is missing, so a renamed heading cannot silently drop a scene.
"""
from __future__ import annotations

import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "art_slots.yaml"

_S = {"slots": [], "placed": [], "pages_seen": set()}


# HEADS (art round 2, 2026-09-27: the owner wants the pieces seen, not buried): on a landing page
# the head is the title, the lede, the search field and the jump links, before the Color key and the
# first card grid. `section: _head` wraps those blocks in `div.isl-head` with the figure after them;
# docs/stylesheets/layout-art.css sets the two side by side from 68.75em, the picture on the right
# where the head left the frame empty. Below that the wrapper is an ordinary block and the figure is
# hidden, so the page reads as before.
HEAD_END = re.compile(r'<(h2\b|div class="grid|p class="kind-key)')


def _load() -> list[dict]:
    raw = yaml.safe_load(DATA.read_text(encoding="utf-8")) or {}
    slots = raw.get("slots") or []
    for s in slots:
        missing = [k for k in ("page", "section", "piece") if not s.get(k)]
        if missing:
            raise SystemExit(f"layout_art: {DATA.name} entry {s} lacks {', '.join(missing)}")
    return slots


def on_config(config, **kwargs):
    _S["slots"] = _load()
    _S["placed"] = []
    _S["pages_seen"] = set()
    return config


def on_page_content(html, page, config, files, **kwargs):
    src = page.file.src_uri
    mine = [s for s in _S["slots"] if s["page"] == src]
    if not mine:
        return html
    _S["pages_seen"].add(src)
    for s in mine:
        kind = f' data-kind="{s["kind"]}"' if s.get("kind") else ""
        aspect = f' data-aspect="{float(s["aspect"]):.3f}"' if s.get("aspect") else ""
        if s["section"] == "_head":
            h1 = re.search(r"<h1\b", html)
            end = HEAD_END.search(html, h1.end()) if h1 else None
            if not h1 or not end:
                raise SystemExit(f"layout_art: {src} has no landing head to sit beside (data/art_slots.yaml)")
            fig = (f'<figure class="isl-vignette isl-vignette--head" data-vignette="{s["piece"]}"{kind}{aspect}'
                   f' aria-hidden="true"></figure>')
            html = (html[:h1.start()] + '<div class="isl-head"><div class="isl-head__text">' + html[h1.start():end.start()]
                    + "</div>" + fig + "</div>\n" + html[end.start():])
        else:
            m = re.search(r'<h2\b[^>]*\bid="' + re.escape(s["section"]) + r'"[^>]*>', html)
            if not m:
                raise SystemExit(f"layout_art: {src} has no h2 with id \"{s['section']}\" (data/art_slots.yaml)")
            nxt = re.compile(r"<h2\b").search(html, m.end())
            at = nxt.start() if nxt else len(html)
            fig = (f'<figure class="isl-vignette" data-vignette="{s["piece"]}"{kind}{aspect}'
                   f' aria-hidden="true"></figure>\n')
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
