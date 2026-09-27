"""MkDocs hook: reading pages use the width (width round, designer C, 2026-09-26).

Direction C: the site's pages come in kinds, and each kind gets the
arrangement that suits it, drawn from one shared grid so a module, a guide,
the glossary and the policy still read as one family. The kinds are not a
list of pages: every arrangement below is chosen from the page's type
(layout_frame.py) and its own structure, so a page written tomorrow gets one
too.

THE GRID. From 68.75em (1100px) a reading page shares the landing pages'
frame and lays its sections out on two equal tracks. Every piece of running
text sits in a box exactly one measure wide (31rem, about 79 characters),
because each panel's side padding is (track - measure) / 2: the tracks fill
the frame and the lines stay readable. Below 68.75em every wrapper here is
display: contents and the page is today's single column
(docs/stylesheets/layout-width.css).

THE SHAPES. Each h2 section (and, inside a section with h3s, each h3
subsection) becomes one of:

  tile     a section light enough for half the width; two consecutive tiles
           of similar weight share a row
  spread   a longer run of prose across both tracks in two columns, cut at
           block boundaries into pieces short enough that both columns of a
           piece fit on one screen (so nobody scrolls back up to start the
           second column); every paragraph stays whole in one column
  leaf     prose beside the figure, note or table that follows it (or
           precedes it), in source order
  set      objects side by side: a module's self-checks, notes, figures
  steps    a guide's numbered steps as a band of cards (task and lesson
           pages only), with the last row completed by count in CSS
  wide     a table of four or more columns, a card grid, long code: the
           whole frame
  band     the heading (and short intro) of a section whose h3 subsections
           follow as their own tiles

The page head keeps the title and meta line on the left, open like a
landing page's title, and puts what follows it (a guide's prompt panel, the
policy's reader's map, a tool guide's at-a-glance table, a lesson's short
first section) in the right track, so the first screen is used.

All of this is written in on_post_page, after layout_nav.py has written the
section foot, so nothing here enters the search index or the narration
(which reads markdown). The wrappers are plain divs with no role, so a
screen reader's view is unchanged. Headings keep their ids.

INVARIANTS, checked on every page. Deleting the tags this hook inserted
gives back the article exactly as it was: no block is lost, duplicated or
reordered, so reading order is source order (BRIEF rule 4). No h2 or h3 can
sit above an earlier one: a tile holds no heading but its own, flows and leaves hold no
headings, a heading is always the first thing in its cell, and cells fill
row by row. A page whose article cannot be split cleanly is left as it is
and named in the verification block.
"""
from __future__ import annotations

import re
from html.parser import HTMLParser

READING = ("task", "lesson", "reference")
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "param", "source", "track", "wbr"}
PROSE = {"p", "ul", "ol", "dl", "blockquote", "hr"}
_COMMENT = re.compile(r"<!--.*?-->", re.S)

# Weights are character-equivalents: one character of body text at the
# measure, about 79 to a line. They estimate height, never content.
TILE_MAX = 2200          # a section this light can take half the width
PAIR_RATIO, PAIR_SLACK = 1.5, 350   # tiles pair when heavier <= ratio * lighter + slack
LONE_RATIO = 3.0         # a one-paragraph section pairs more freely than that
CHUNK = 2400             # one piece of a spread: both columns fit a screen at 1440
LIFT_MAX = 1400          # a first section this light can sit beside a bare head
STEP_ITEMS, STEP_MEAN = 3, 200      # a numbered list of procedures becomes step cards

_S = {"pages": 0, "wrapped": 0, "left": [], "kinds": {}, "shapes": {}, "heads": {},
      "blocks_in": 0, "blocks_out": 0}


# --- reading the article -----------------------------------------------------------

class _Children(HTMLParser):
    """The top-level elements of an HTML fragment, as character spans."""

    def __init__(self, text: str):
        super().__init__(convert_charrefs=False)
        self.text = text
        self.starts = [0] + [m.end() for m in re.finditer("\n", text)]
        self.depth = 0
        self.open = None
        self.spans: list[tuple[int, int, str, dict]] = []
        self.stray = False
        self.feed(text)
        self.close()

    def _at(self) -> int:
        line, col = self.getpos()
        return self.starts[line - 1] + col

    def _leaf(self, tag, attrs):
        start = self._at()
        self.spans.append((start, self.text.index(">", start) + 1, tag, dict(attrs)))

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            if self.depth == 0:
                self._leaf(tag, attrs)
            return
        if self.depth == 0:
            self.open = (self._at(), tag, dict(attrs))
        self.depth += 1

    def handle_startendtag(self, tag, attrs):
        if self.depth == 0:
            self._leaf(tag, attrs)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        self.depth -= 1
        if self.depth == 0 and self.open:
            start, otag, attrs = self.open
            self.spans.append((start, self.text.index(">", self._at()) + 1, otag, attrs))
            self.open = None
        elif self.depth < 0:
            self.stray = True
            self.depth = 0

    def handle_data(self, data):
        if self.depth == 0 and data.strip():
            self.stray = True

    def ok(self) -> bool:
        """Every character belongs to a block, or is whitespace or a comment
        between blocks."""
        if self.stray or self.depth != 0:
            return False
        pos = 0
        for start, end, _, _ in self.spans:
            if start < pos or _COMMENT.sub("", self.text[pos:start]).strip():
                return False
            pos = end
        return not _COMMENT.sub("", self.text[pos:]).strip()


def _text(fragment: str) -> str:
    fragment = re.sub(r"<(script|style)\b.*?</\1>", "", fragment, flags=re.S)
    fragment = re.sub(r'<a class="headerlink".*?</a>', "", fragment, flags=re.S)
    return " ".join(re.sub(r"<[^>]+>", " ", fragment).split())


class Block:
    __slots__ = ("start", "end", "tag", "cls", "html", "role", "chars", "weight", "wide",
                 "items", "question", "leadin")

    def __init__(self, start, end, tag, attrs, html):
        self.start, self.end, self.tag, self.html = start, end, tag, html
        self.cls = set((attrs.get("class") or "").split())
        self.chars = len(_text(html))
        self.items = len(re.findall(r"<li\b", html)) if tag in ("ol", "ul") else 0
        self.question = tag == "details" and "question" in self.cls
        self.role = self._role()
        self.wide = self._wide()
        self.weight = self._weight()
        self.leadin = self._leadin()

    def _leadin(self) -> bool:
        """A block that introduces the next one and must never be parted from
        it: a minor heading, a paragraph that is all bold (the policy's
        "C. Safeguarding privacy and confidentiality"), or a sentence ending
        in a colon before its list."""
        if self.role in ("h4", "h5", "h6"):
            return True
        if self.tag != "p" or self.role != "prose":
            return False
        text = _text(self.html)
        if text.endswith(":"):
            return True
        return self.chars <= 160 and bool(re.fullmatch(r"<p[^>]*>\s*<(strong|b)>.*</\1>\s*</p>", self.html, re.S))

    def _role(self) -> str:
        t, c = self.tag, self.cls
        if re.fullmatch(r"h[1-6]", t):
            return t
        if "kind-key" in c:
            return "key"
        if (t == "nav" and "secfoot" in c) or c & {"page-end", "learn-foot", "learn-next"}:
            return "tail"
        if t in ("script", "style"):
            return "silent"
        if t == "p" and (c & {"learn-progress", "learn-meta"} or 'class="meta-chip' in self.html[:400]):
            return "chrome"
        if c & {"listen", "page-action"}:
            return "chrome"
        if t in PROSE:
            return "prose"
        # A prompt page's side of "The prompt" (its length, the fill-in
        # panel, its worked example): it introduces the prompt text, so it
        # sits beside it as a paragraph would (layout_prompt_pages.py).
        if t == "div" and "pp-side" in c:
            return "prose"
        # A list of page links shown as rows (a module's Going Deeper): it is
        # the list it was, so it is placed as the list was.
        if t == "div" and "door-rows" in c:
            return "prose"
        if t == "div" and len(re.findall(r"<h2\b", self.html)) >= 2 and not self._grid():
            return "terms"
        if t == "figure":
            return "figure"
        if t == "details":
            return "details"
        if "admonition" in c:
            return "note"
        if "md-typeset__scrollwrap" in c or t == "table":
            return "table"
        if "highlight" in c or t == "pre":
            return "code"
        if self._grid():
            return "cards"
        return "object"

    def _grid(self) -> bool:
        return "grid" in self.cls or any(x.endswith("-grid") for x in self.cls)

    def _grid_items(self) -> int:
        """How many cards a grid holds: its top-level children, or the items
        of the one list it wraps."""
        inner = self.html[self.html.index(">") + 1:self.html.rindex("</")]
        kids = _Children(inner)
        if not kids.ok():
            return 99
        spans = [s for s in kids.spans if s[2] not in ("script", "style")]
        if len(spans) == 1 and spans[0][2] in ("ul", "ol"):
            s, e = spans[0][0], spans[0][1]
            sub = _Children(inner[s:e][inner[s:e].index(">") + 1:inner[s:e].rindex("</")])
            return len(sub.spans) if sub.ok() else 99
        return len(spans)

    def _wide(self) -> bool:
        if self.role == "terms":
            return True
        if self.role == "cards":
            # One or two cards sit beside the paragraph that introduces them
            # (space round: a lone video card had a full row to itself).
            return self._grid_items() >= 3
        if self.role == "table":
            first = re.search(r"<tr\b.*?</tr>", self.html, re.S)
            return bool(first) and len(re.findall(r"<th\b", first.group(0))) >= 4
        if self.role == "code":
            return any(len(line) >= 90 for line in re.sub(r"<[^>]+>", "", self.html).split("\n"))
        return False

    def _weight(self) -> int:
        r, n = self.role, self.chars
        if r in ("key", "silent", "tail"):
            return 0
        if r == "h1":
            return 300
        if r == "h2":
            return 250
        if r in ("h3", "h4", "h5", "h6"):
            return 180
        if r == "chrome":
            return 120
        if r == "prose":
            return n + 60 + 25 * self.items
        if r == "figure":
            return max(1000, int(n * 1.6))
        if r == "details":
            return 160 if self.question else 180
        if r == "note":
            return int(n * 1.15) + 220
        if r == "table":
            return 200 + 130 * len(re.findall(r"<tr\b", self.html))
        if r == "code":
            return 100 + 80 * self.html.count("\n")
        return n + 300


# --- planning ----------------------------------------------------------------------

class Unit:
    """A heading and the blocks under it (or the head: everything before the
    first h2)."""

    def __init__(self, blocks: list[Block], level: int):
        self.blocks = blocks
        self.level = level

    @property
    def weight(self) -> int:
        return sum(b.weight for b in self.blocks)

    def has(self, *roles) -> bool:
        return any(b.role in roles for b in self.blocks)

    @property
    def tileable(self) -> bool:
        # An h3 subsection's own heading does not stop it being a tile (the
        # band shape exists so subsections can pair); an h3 nested inside a
        # section does. Until the space round a subsection could never be a
        # tile, so one-paragraph subsections each spanned the full width.
        nested = self.blocks[1:] if self.level == 3 else self.blocks
        return (self.weight <= TILE_MAX and not any(b.role == "h3" for b in nested)
                and not any(b.wide or b.role == "terms" for b in self.blocks))


def _one_column(u: Unit) -> bool:
    """A section whose body is one piece of prose: across the whole width it
    could only fill one of the two columns."""
    groups = _glue(u.blocks)
    if groups and _lead(groups[0]).role in ("h2", "h3"):
        groups = groups[1:]
    real = [g for g in groups if _lead(g).role not in ("key", "silent")]
    return len(real) == 1 and _lead(real[0]).role == "prose"


def _pairable(a: Unit, b: Unit) -> bool:
    lo, hi = sorted((a.weight, b.weight))
    return a.tileable and b.tileable and hi <= PAIR_RATIO * lo + PAIR_SLACK


def _glue(blocks: list[Block]) -> list[list[Block]]:
    """Blocks as groups that must stay together: a color key with the block
    it keys, a script island with the block before it."""
    groups: list[list[Block]] = []
    pending: list[Block] = []
    for b in blocks:
        if b.role == "key":
            pending.append(b)
            continue
        if b.role == "silent" and groups and not pending:
            groups[-1].append(b)
            continue
        groups.append(pending + [b])
        pending = []
    if pending:
        if groups:
            groups[-1].extend(pending)
        else:
            groups.append(pending)
    # A lead-in joins the group after it, so no column, piece, leaf or panel
    # can end on a heading whose content starts somewhere else.
    merged: list[list[Block]] = []
    for g in groups:
        if merged and _ends_leadin(merged[-1]):
            merged[-1].extend(g)
        else:
            merged.append(g)
    return merged


def _starts_leadin(g: list[Block]) -> bool:
    first = next((b for b in g if b.role not in ("key", "silent")), None)
    return bool(first and first.leadin)


def _ends_leadin(g: list[Block]) -> bool:
    last = next((b for b in reversed(g) if b.role not in ("key", "silent")), None)
    return bool(last and last.leadin)


def _lead(g: list[Block]) -> Block:
    """The block that says what a group is: past any key, script or lead-in."""
    return next((b for b in g if b.role not in ("key", "silent") and not b.leadin),
                next((b for b in g if b.role not in ("key", "silent")), g[0]))


def _step_lengths(b: Block) -> list[int]:
    inner = b.html[b.html.index(">") + 1:b.html.rindex("</")]
    kids = _Children(inner)
    return [len(_text(inner[s:e])) for s, e, t, _ in kids.spans if t == "li"]


def _step_cols(b: Block) -> int:
    """How many step cards across, from the steps' own lengths: three when
    they are short and alike, two when alike but longer (and even in number,
    so none is left alone), otherwise none: one continuous numbered list."""
    lengths = _step_lengths(b)
    if len(lengths) < STEP_ITEMS or min(lengths) == 0:
        return 0
    lo, hi = min(lengths), max(lengths)
    if hi <= 360 and hi <= 1.8 * lo:
        return 3
    if hi <= 520 and hi <= 1.6 * lo and len(lengths) % 2 == 0:
        return 2
    return 0


def _is_steps(b: Block, kind: str) -> bool:
    return (kind in ("task", "lesson") and b.tag == "ol" and b.items >= STEP_ITEMS
            and b.chars / b.items >= STEP_MEAN and not re.search(r"<h[1-6]\b", b.html)
            and _step_cols(b) > 0)


class Plan:
    """Cells in order. A cell is (shape, span, parts); a part is a list of
    blocks, or ("flow"|"leaf"|"set"|"terms", ...) for a sub-wrapper."""

    def __init__(self, kind: str):
        self.kind = kind
        self.cells: list[tuple[str, int, list]] = []

    def add(self, shape, span, parts):
        self.cells.append((shape, span, parts))
        _S["shapes"][shape] = _S["shapes"].get(shape, 0) + 1

    # A unit that takes the whole width: its heading first, then its body as
    # rows of spreads, leaves, sets, step bands and wide objects.
    def full(self, unit: Unit):
        groups = _glue(unit.blocks)
        heading: list[Block] = []
        if groups and _lead(groups[0]).role in ("h2", "h3"):
            heading = groups.pop(0)
        rows = self._rows(groups)
        if not rows:
            self.add("band", 2, [heading])
            return
        first = True
        for shape, parts in rows:
            # A short paragraph left after a leaf stays in that panel, below
            # it, rather than opening a panel of its own.
            if (not first and shape == "spread" and len(parts[0][1]) == 1
                    and _weight(parts[0][1]) <= 450 and self.cells[-1][0] in ("leaf", "spread")):
                self.cells[-1][2].append(_flat(parts[0][1]))
                continue
            self.add(shape, 2, ([heading] if first and heading else []) + parts)
            first = False

    def _rows(self, groups: list[list[Block]]) -> list[tuple[str, list]]:
        """Consecutive prose becomes a run; a run meets the object next to
        it as a leaf; objects together become a set; anything wide, and a
        guide's steps, get a row to themselves."""
        items: list[tuple[str, list[list[Block]]]] = []
        for g in groups:
            b = _lead(g)
            if b.role == "prose" and not _is_steps(b, self.kind):
                if items and items[-1][0] == "run":
                    items[-1][1].append(g)
                else:
                    items.append(("run", [g]))
            elif b.wide:
                items.append(("wide", [g]))
            elif _is_steps(b, self.kind):
                items.append(("steps", [g]))
            else:
                if items and items[-1][0] == "objs":
                    items[-1][1].append(g)
                else:
                    items.append(("objs", [g]))
        rows: list[tuple[str, list]] = []
        i = 0
        while i < len(items):
            what, gs = items[i]
            nxt = items[i + 1] if i + 1 < len(items) else None
            if what == "run" and sum(1 for g in gs if _starts_leadin(g)) >= 2:
                # Several lead-ins (the policy's lettered parts): split at
                # them, each subsection opening with its own lead-in, and set
                # subsections of similar length side by side.
                first = next(k for k, g in enumerate(gs) if _starts_leadin(g))
                for piece in (_chunks(gs[:first]) if first else []):
                    rows.append(("spread", [("flow", piece)]))
                subs: list[list] = []
                for g in gs[first:]:
                    if _starts_leadin(g) or not subs:
                        subs.append([])
                    subs[-1].append(g)
                parts: list = []
                k = 0
                while k < len(subs):
                    a = subs[k]
                    b = subs[k + 1] if k + 1 < len(subs) else None
                    lo, hi = sorted((_weight(a), _weight(b) if b else 0))
                    if b and hi <= 1.8 * lo + 300:
                        parts.append(("pair", a, b))
                        k += 2
                    else:
                        parts.append(("pair", a, []))
                        k += 1
                rows.append(("spread", parts))
                i += 1
                continue
            if what == "run" and nxt and nxt[0] == "objs":
                # The paragraph that introduces the object sits directly
                # beside it; anything before that spreads above. When the
                # object is the taller, the prose that follows it wraps in
                # under its introduction (the object spans both rows).
                lead, beside = gs[:-1], gs[-1:]
                for piece in (_chunks(lead) if lead else []):
                    rows.append(("spread", [("flow", piece)]))
                under: list = []
                after = items[i + 2] if i + 2 < len(items) else None
                room = _weight(nxt[1]) - _weight(beside)
                if after and after[0] == "run" and room > 200:
                    while after[1] and _weight(after[1][:1]) <= room + 150:
                        room -= _weight(after[1][:1])
                        under.append(after[1].pop(0))
                    if not after[1]:
                        items.pop(i + 2)
                rows.append(("leaf", [("leaf", beside, nxt[1], under)]))
                i += 2
                continue
            if what == "objs" and nxt and nxt[0] == "run" and _weight(gs) >= 400:
                pieces = _chunks(nxt[1])
                rows.append(("leaf", [("leaf", gs, pieces[0])]))
                for piece in pieces[1:]:
                    rows.append(("spread", [("flow", piece)]))
                i += 2
                continue
            if what == "run" and nxt and nxt[0] == "wide" and len(gs) == 1 and _weight(gs) <= 700:
                # A one-paragraph introduction shares its wide object's row
                # (cards, a long table) instead of a half-empty panel of its
                # own above it (space round).
                rows.append(("wide", [_flat(gs), _flat(nxt[1])]))
                i += 2
                continue
            if what == "run":
                for piece in _chunks(gs):
                    rows.append(("spread", [("flow", piece)]))
            elif what == "objs":
                if len(gs) == 1 and _long_note(_lead(gs[0])):
                    # A long quoted box keeps its one box, and its contents
                    # run in two columns a screen at a time (space round).
                    g, lead = gs[0], _lead(gs[0])
                    k = g.index(lead)
                    rows.append(("wide", [x for x in ([g[:k]], ("noteflow", lead), [g[k + 1:]])
                                          if not isinstance(x, list) or x[0]]))
                elif len(gs) == 1 and not _lead(gs[0]).question:
                    rows.append(("wide", [_flat(gs)]))
                else:
                    rows.append(("set", [("set", gs)]))
            elif what == "steps":
                rows.append((f"steps{_step_cols(_lead(gs[0]))}", [_flat(gs)]))
            else:
                rows.append(("wide", [_flat(gs)]))
            i += 1
        return rows


NOTE_FLOW_MIN = CHUNK        # a note this heavy runs in two columns inside its box


def _note_body(b: Block):
    """A note's inner blocks after its title, as (offset of inner html, blocks),
    or None when it does not split cleanly."""
    if b.role != "note":
        return None
    inner_start = b.html.index(">") + 1
    inner_end = b.html.rindex("</")
    kids = _Children(b.html[inner_start:inner_end])
    if not kids.ok():
        return None
    inner = b.html[inner_start:inner_end]
    blocks = [Block(s, e, tg, a, inner[s:e]) for s, e, tg, a in kids.spans]
    body = [x for x in blocks if "admonition-title" not in x.cls]
    return inner_start, inner_end, blocks, body


def _long_note(b: Block) -> bool:
    if b.role != "note" or b.weight < NOTE_FLOW_MIN:
        return False
    nb = _note_body(b)
    return bool(nb) and sum(1 for x in nb[3] if x.role == "prose") >= 4 and all(
        x.role in ("prose", "key", "silent") for x in nb[3])


def _flat(groups: list[list[Block]]) -> list[Block]:
    return [b for g in groups for b in g]


def _weight(groups: list[list[Block]]) -> int:
    return sum(b.weight for b in _flat(groups))


def _chunks(run: list[list[Block]]) -> list[list[list[Block]]]:
    """A prose run cut at block boundaries into pieces of at most CHUNK,
    balanced so the last piece is not a stub."""
    total = _weight(run)
    if total <= CHUNK:
        return [run]
    n = -(-total // CHUNK)
    target = total / n
    pieces, cur, acc = [], [], 0
    for g in run:
        w = sum(b.weight for b in g)
        if cur and acc + w / 2 > target and len(pieces) < n - 1:
            pieces.append(cur)
            cur, acc = [], 0
        cur.append(g)
        acc += w
    pieces.append(cur)
    return pieces


def _split_units(blocks: list[Block], level: str) -> list[list[Block]]:
    out: list[list[Block]] = [[]]
    for b in blocks:
        if b.role == level:
            out.append([])
        out[-1].append(b)
    return out


def _plan(blocks: list[Block], kind: str) -> tuple[Plan, list[Block], list[Block], Unit | None]:
    """The page as cells: returns the plan, the head's left and right blocks,
    and the section lifted into the head, if any."""
    plan = Plan(kind)
    head, *sections = _split_units(blocks, "h2")
    units = [Unit(s, 2) for s in sections]

    # The head: title and meta on the left; what follows beside them.
    chrome_end = 0
    while chrome_end < len(head) and head[chrome_end].role in ("h1", "chrome", "key", "silent"):
        chrome_end += 1
    main, rest = head[:chrome_end], head[chrome_end:]
    after_head: list[Block] = []
    for i, b in enumerate(rest):
        if b.wide:
            # A color key keying the wide block goes with it, not into the
            # head (space round: the write-ups' key sat above the wrong panel).
            while i and rest[i - 1].role in ("key", "silent"):
                i -= 1
            rest, after_head = rest[:i], rest[i:]
            break
    left, right, lifted = main, [], None
    if rest:
        groups = _glue(rest)
        best = None
        # A bare title never takes a cell alone: with no meta line, at least
        # the first group after the title stays with it (space round).
        first_k = 0 if any(b.role == "chrome" for b in main) else 1
        for k in range(first_k, len(groups)):
            wl = sum(b.weight for b in main) + _weight(groups[:k])
            wr = _weight(groups[k:])
            score = abs(wl - wr) - (150 if _lead(groups[k]).role != "prose" else 0)
            if best is None or score < best[0]:
                best = (score, k)
        k = best[1] if best else len(groups)
        left, right = main + _flat(groups[:k]), _flat(groups[k:])
    elif (units and units[0].tileable and units[0].weight <= LIFT_MAX and not after_head
          and any(b.role == "chrome" for b in main)):
        # A section is lifted beside the head only when the head has more
        # than its title (a meta line): an h1 never sits in a cell alone,
        # with a column-high gap under it (space round, owner, 2026-09-27).
        # A bare title runs across the top and the sections pair below it.
        lifted = units.pop(0)
    how = "split" if right else "lifted" if lifted else "title only"
    _S["heads"][how] = _S["heads"].get(how, 0) + 1

    if after_head:
        for g in _glue(after_head):
            b = _lead(g)
            if b.role == "terms":
                plan.add("terms", 2, [("terms", g)])
            elif b.wide:
                plan.add("wide", 2, [g])
            else:
                plan.full(Unit(g, 1))

    # Sections: deep ones (with h3) as a band and their subsections;
    # the rest as tiles that pair, or rows across the width.
    queue: list[Unit] = []
    for u in units:
        if u.has("h3"):
            intro, *subs = _split_units(u.blocks, "h3")
            queue.append(Unit(intro, 2))
            queue.extend(Unit(s, 3) for s in subs)
        else:
            queue.append(u)
    i = 0
    while i < len(queue):
        u = queue[i]
        nxt = queue[i + 1] if i + 1 < len(queue) else None
        deep_head = u.level == 2 and nxt is not None and nxt.level == 3
        nxt_deep = (nxt is not None and nxt.level == 2 and i + 2 < len(queue)
                    and queue[i + 2].level == 3)
        # A short section that would sit alone across the whole width with
        # its text in one column pairs with its neighbour instead, even when
        # their weights differ more than tiles usually allow (space round).
        lone_pair = (nxt is not None and u.tileable and nxt.tileable and _one_column(u)
                     and max(u.weight, nxt.weight) <= LONE_RATIO * min(u.weight, nxt.weight) + PAIR_SLACK)
        if (not deep_head and not nxt_deep and nxt and nxt.level == u.level
                and (_pairable(u, nxt) or lone_pair)):
            if not _pairable(u, nxt):
                _S["lone_paired"] = _S.get("lone_paired", 0) + 1
            plan.add("tile", 1, [u.blocks])
            plan.add("tile", 1, [nxt.blocks])
            i += 2
            continue
        if deep_head and u.weight <= 800:
            plan.add("band", 2, [u.blocks])
        else:
            if u.tileable and not deep_head and _one_column(u):
                _S.setdefault("lone", []).append((_S.get("cur"), _text(u.blocks[0].html)[:40], u.weight))
            plan.full(u)
        i += 1
    return plan, left, right, lifted


# --- writing -----------------------------------------------------------------------

def _wrap(article: str, page_type: str, src: str) -> str | None:
    kids = _Children(article)
    if not kids.ok():
        return None
    blocks = [Block(s, e, t, a, article[s:e]) for s, e, t, a in kids.spans]
    tail_at = len(blocks)
    while tail_at and blocks[tail_at - 1].role in ("tail", "silent"):
        tail_at -= 1
    body = blocks[:tail_at]
    if not body or not any(b.role == "h1" for b in body[:3]):
        return None
    kind = _kind(page_type, body)
    plan, left, right, lifted = _plan(body, kind)

    inserted: list[str] = []
    out: list[str] = [article[:body[0].start]]
    pos = body[0].start
    used: list[Block] = []

    def open_(tag: str):
        inserted.append(tag)
        out.append(tag)

    def close():
        out.append("</div>")

    def put(bs: list[Block]):
        nonlocal pos
        for b in bs:
            if b.start < pos:
                raise ValueError(f"layout_width: {src}: block out of order while writing")
            out.append(article[pos:b.start])
            out.append(article[b.start:b.end])
            pos = b.end
            used.append(b)

    def put_part(part):
        if isinstance(part, tuple):
            what = part[0]
            if what == "flow":
                open_('<div class="w-part w-flow">')
                for n, g in enumerate(part[1]):
                    real = [b for b in g if b.role not in ("key", "silent")]
                    k = max((j for j, b in enumerate(g) if b.leadin), default=-1)
                    if (n == 0 and k >= 0 and len(real) > 1 and g[k + 1:]
                            and all(b.tag in ("ul", "ol") or b.role in ("key", "silent") for b in g[k + 1:])):
                        # A lead-in opening the spread runs across the top;
                        # its list balances in two columns right under it.
                        open_('<div class="w-part w-spanall">')
                        put(g[:k + 1])
                        close()
                        put(g[k + 1:])
                    elif any(b.leadin for b in g) and len(real) > 1:
                        open_('<div class="w-part w-keep">')
                        put(g)
                        close()
                    else:
                        put(g)
                close()
            elif what == "leaf":
                under = part[3] if len(part) > 3 else []
                open_('<div class="w-part w-leaf w-leaf--wrap">' if under else '<div class="w-part w-leaf">')
                for side in (part[1], part[2]):
                    open_('<div class="w-part w-leaf__side">')
                    put(_flat(side))
                    close()
                if under:
                    open_('<div class="w-part w-leaf__side w-leaf__under">')
                    put(_flat(under))
                    close()
                close()
            elif what == "set":
                open_(f'<div class="w-part w-set" data-w-n="{len(part[1])}">')
                for g in part[1]:
                    put(g)
                close()
            elif what == "pair":
                open_('<div class="w-part w-pair">')
                for side in (part[1], part[2]):
                    if side:
                        open_('<div class="w-part w-pair__side">')
                        put(_flat(side))
                        close()
                close()
            elif what == "terms":
                _put_terms(part[1])
            elif what == "noteflow":
                _put_noteflow(part[1])
        else:
            put(part)

    def _put_noteflow(b: Block):
        """A long note: its title as it is, then its body in pieces, each a
        two-column flow, a lead-in kept with what it introduces."""
        nonlocal pos
        inner_start, inner_end, blocks, body = _note_body(b)
        inner = b.html[inner_start:inner_end]
        out.append(article[pos:b.start])
        out.append(b.html[:inner_start])
        groups: list[list[Block]] = []
        for x in body:
            if groups and groups[-1][-1].leadin:
                groups[-1].append(x)
            else:
                groups.append([x])
        first_body = body[0].start
        out.append(inner[:first_body])
        ipos = first_body

        def write(bs: list[Block]):
            nonlocal ipos
            out.append(inner[ipos:bs[-1].end])
            ipos = bs[-1].end

        # Parts that each open with a bold lead-in ("Section 2 (10 min...)")
        # sit two to a row, read left, right, then down; otherwise the body
        # runs as two-column flows a screen at a time.
        subs: list[list[Block]] = []
        for g in groups:
            if g[0].leadin or not subs:
                subs.append([])
            subs[-1].extend(g)
        if sum(1 for s in subs if s[0].leadin) >= 3:
            for k in range(0, len(subs), 2):
                open_('<div class="w-part w-pair">')
                for side in subs[k:k + 2]:
                    out.append(inner[ipos:side[0].start])
                    ipos = side[0].start
                    open_('<div class="w-part w-pair__side">')
                    write(side)
                    close()
                close()
        else:
            for piece in _chunks(groups):
                open_('<div class="w-part w-flow">')
                for g in piece:
                    keep = len(g) > 1 and g[0].leadin
                    if keep:
                        out.append(inner[ipos:g[0].start])
                        ipos = g[0].start
                        open_('<div class="w-part w-keep">')
                    write(g)
                    if keep:
                        close()
                close()
        out.append(inner[ipos:])
        out.append(b.html[inner_end:])
        pos = b.end
        used.append(b)
        _S["noteflows"] = _S.get("noteflows", 0) + 1

    def _put_terms(group: list[Block]):
        """A div holding a run of h2 entries (the glossary): each entry
        wrapped as a tile, inside the div, in order."""
        nonlocal pos
        for b in group:
            if b.role != "terms":
                put([b])
                continue
            inner_start = b.html.index(">") + 1
            inner_end = b.html.rindex("</")
            inner = b.html[inner_start:inner_end]
            sub = _Children(inner)
            if not sub.ok():
                put([b])
                continue
            out.append(article[pos:b.start])
            out.append(b.html[:inner_start])
            open_('<div class="w-terms">')
            ipos = 0
            entries = _split_units([Block(s, e, t, a, inner[s:e]) for s, e, t, a in sub.spans], "h2")
            for entry in entries:
                if not entry:
                    continue
                out.append(inner[ipos:entry[0].start])
                open_('<div class="w-term">' if entry[0].role == "h2" else '<div class="w-term w-term--lead">')
                out.append(inner[entry[0].start:entry[-1].end])
                close()
                ipos = entry[-1].end
            out.append(inner[ipos:])
            close()
            out.append(b.html[inner_end:])
            pos = b.end
            used.append(b)

    page_open = f'<div class="w-page" data-w-kind="{kind}">'
    inserted.append(page_open)
    out.append(page_open)

    head_cls = "w-head w-head--split" if right else "w-head w-head--lifted" if lifted else "w-head"
    open_(f'<div class="{head_cls}">')
    open_('<div class="w-head__main">')
    put(left)
    close()
    if right:
        # A side that opens with something boxed of its own (a guide's prompt
        # panel, a note, a table) stays open: no box around a box.
        first = next(b for b in right if b.role not in ("key", "silent"))
        panel = "" if first.role in ("note", "table", "object", "figure", "details") else " w-panel"
        open_(f'<div class="w-head__side{panel}">')
        put(right)
        close()
    elif lifted:
        open_('<div class="w-head__side w-panel" data-w-shape="tile">')
        put(lifted.blocks)
        close()
    close()

    open_('<div class="w-rows">')
    for shape, span, parts in plan.cells:
        classes = "w-cell" + (" w-span" if span == 2 else "")
        if shape in ("tile", "spread", "leaf") or (shape == "wide" and any(
                isinstance(part, list) and any(b.role in ("figure", "prose") for b in part) for part in parts)):
            classes += " w-panel"
        open_(f'<div class="{classes}" data-w-shape="{shape}">')
        for part in parts:
            put_part(part)
        close()
    close()
    close()  # w-page
    out.append(article[pos:])
    new = "".join(out)

    if [b.start for b in used] != [b.start for b in body]:
        raise ValueError(f"layout_width: {src}: {len(body)} blocks read, {len(used)} written")
    stripped = new
    for tag in inserted:
        stripped = stripped.replace(tag, "", 1)
    if _remove_inserted_closers(stripped, article) != article:
        raise ValueError(f"layout_width: wrapping {src} changed its article; nothing was written")
    _S["blocks_in"] += len(body)
    _S["blocks_out"] += len(used)
    _S["kinds"][kind] = _S["kinds"].get(kind, 0) + 1
    return new


def _kind(page_type: str, body: list[Block]) -> str:
    """The page's kind, from its type and its structure (never its address)."""
    if any(b.role == "terms" for b in body):
        return "glossary"
    if page_type in ("lesson", "task"):
        return page_type
    if any(b.role == "cards" for b in body) and sum(1 for b in body if b.role == "h2") <= 1:
        return "people"
    return "reference"


def _remove_inserted_closers(stripped: str, article: str) -> str:
    """Drop, from the wrapped text with its opening tags removed, exactly the
    closing tags the wrapper added: every '</div>' in stripped that article
    does not have at that point."""
    close = "</div>"
    out, i, j = [], 0, 0
    while i < len(stripped):
        if stripped.startswith(close, i):
            if article.startswith(close, j):
                out.append(close)
                j += len(close)
            i += len(close)
        elif j < len(article) and stripped[i] == article[j]:
            out.append(stripped[i])
            i += 1
            j += 1
        else:
            return stripped
    return "".join(out)


_ARTICLE = re.compile(r'(<article class="md-content__inner md-typeset">)(.*)(</article>)', re.S)


def _wrap_door(article: str, src: str) -> str | None:
    """A landing page keeps its title, search and card rows as they are; the
    h2 sections after its last card grid get the reading pages' rows."""
    kids = _Children(article)
    if not kids.ok():
        return None
    blocks = [Block(s, e, t, a, article[s:e]) for s, e, t, a in kids.spans]
    last_cards = max((i for i, b in enumerate(blocks) if b.role == "cards" or "hub-jobs" in b.cls), default=-1)
    start = next((i for i in range(last_cards + 1, len(blocks)) if blocks[i].role == "h2"), None)
    if start is None:
        return None
    end = len(blocks)
    while end > start and blocks[end - 1].role in ("tail", "silent") or (
            end > start and "page-reviewed" in blocks[end - 1].cls):
        end -= 1
    region = blocks[start:end]
    plan = Plan("door")
    units = [Unit(u, 2) for u in _split_units(region, "h2") if u]
    i = 0
    while i < len(units):
        u, nxt = units[i], units[i + 1] if i + 1 < len(units) else None
        if nxt and _pairable(u, nxt):
            plan.add("tile", 1, [u.blocks])
            plan.add("tile", 1, [nxt.blocks])
            i += 2
            continue
        plan.full(u)
        i += 1
    inserted, out = [], [article[:region[0].start]]
    pos = region[0].start
    used = []

    def open_(tag):
        inserted.append(tag)
        out.append(tag)

    def put(bs):
        nonlocal pos
        for b in bs:
            out.append(article[pos:b.start])
            out.append(article[b.start:b.end])
            pos = b.end
            used.append(b)

    open_('<div class="w-page w-page--door" data-w-kind="door">')
    open_('<div class="w-rows">')
    for shape, span, parts in plan.cells:
        classes = "w-cell" + (" w-span" if span == 2 else "") + (" w-panel" if shape in ("tile", "spread", "leaf") else "")
        open_(f'<div class="{classes}" data-w-shape="{shape}">')
        for part in parts:
            if isinstance(part, tuple) and part[0] == "flow":
                open_('<div class="w-part w-flow">')
                put(_flat(part[1]))
                out.append("</div>")
            elif isinstance(part, tuple) and part[0] == "leaf":
                under = part[3] if len(part) > 3 else []
                open_('<div class="w-part w-leaf w-leaf--wrap">' if under else '<div class="w-part w-leaf">')
                for side in (part[1], part[2]) + ((under,) if under else ()):
                    open_('<div class="w-part w-leaf__side w-leaf__under">' if side is under
                          else '<div class="w-part w-leaf__side">')
                    put(_flat(side))
                    out.append("</div>")
                out.append("</div>")
            elif isinstance(part, tuple) and part[0] == "pair":
                open_('<div class="w-part w-pair">')
                for side in (part[1], part[2]):
                    if side:
                        open_('<div class="w-part w-pair__side">')
                        put(_flat(side))
                        out.append("</div>")
                out.append("</div>")
            elif isinstance(part, tuple) and part[0] == "set":
                open_(f'<div class="w-part w-set" data-w-n="{len(part[1])}">')
                for g in part[1]:
                    put(g)
                out.append("</div>")
            else:
                put(part)
        out.append("</div>")
    out.append("</div></div>")
    out.append(article[pos:])
    new = "".join(out)
    if [b.start for b in used] != [b.start for b in region]:
        raise ValueError(f"layout_width: {src}: landing prose blocks out of order")
    stripped = new
    for tag in inserted:
        stripped = stripped.replace(tag, "", 1)
    if _remove_inserted_closers(stripped, article) != article:
        raise ValueError(f"layout_width: wrapping {src} changed its article; nothing was written")
    _S["doors"] = _S.get("doors", 0) + 1
    return new


def on_post_page(output, page, config):
    page_type = (page.meta or {}).get("page_type")
    if page_type == "door":
        m = _ARTICLE.search(output)
        wrapped = _wrap_door(m.group(2), page.file.src_uri) if m else None
        if wrapped is None:
            return output
        return output[:m.start(2)] + wrapped + output[m.end(2):]
    if page_type not in READING:
        return output
    _S["pages"] += 1
    _S["cur"] = page.file.src_uri
    m = _ARTICLE.search(output)
    if not m:
        _S["left"].append((page.file.src_uri, "no article"))
        return output
    wrapped = _wrap(m.group(2), page_type, page.file.src_uri)
    if wrapped is None:
        _S["left"].append((page.file.src_uri, "article did not split into whole blocks"))
        return output
    _S["wrapped"] += 1
    new = output[:m.start(2)] + wrapped + output[m.end(2):]
    # Everything outside the article must come through untouched.
    if new[:m.start(2)] != output[:m.start(2)] or new[len(new) - (len(output) - m.end(2)):] != output[m.end(2):]:
        raise ValueError(f"layout_width: {page.file.src_uri}: the page outside the article changed")
    return new.replace("<body ", '<body data-width="packed" ', 1)


def on_post_build(config):
    fmt = lambda d: ", ".join(f"{k} {n}" for k, n in sorted(d.items()))
    print("layout_width: reading pages arranged")
    print(f"  reading pages      : {_S['pages']}")
    print(f"  arranged           : {_S['wrapped']} ({fmt(_S['kinds'])})")
    print(f"  heads              : {fmt(_S['heads'])}")
    print(f"  cells by shape     : {fmt(_S['shapes'])}")
    print(f"  blocks read/written: {_S['blocks_in']} / {_S['blocks_out']}")
    print(f"  short sections paired with an unequal neighbour: {_S.get('lone_paired', 0)}")
    print(f"  long notes set in two columns inside their box: {_S.get('noteflows', 0)}")
    print(f"  one-paragraph sections still alone across the width: {len(_S.get('lone', []))}"
          + "".join(f"\n    {s}: {h!r} ({w})" for s, h, w in _S.get("lone", [])))
    print(f"  landing pages with prose rows: {_S.get('doors', 0)}")
    print(f"  left as they were  : {len(_S['left'])}" + "".join(f"\n    {s}: {why}" for s, why in _S["left"]))
    if _S["wrapped"] + len(_S["left"]) != _S["pages"] or _S["blocks_in"] != _S["blocks_out"]:
        raise ValueError("layout_width: pages or blocks do not add up (see the counts above)")
