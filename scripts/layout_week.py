"""MkDocs hook: This Week and the weekly digests in three columns (week round,
designer C, 2026-09-27).

The owner's direction, on This Week (docs/news/this-week.md) and the weekly
archive pages (docs/news/archive/YYYY-wNN.md): one column per feed in the
Latest News panel look of News & Events, the whole frame used, every
feature kept (each feed's brief with its spoken version, its Topic chips,
its "Show the other N items"), videos in two rows, podcasts at a sensible
size, and a brief whose continuation is not a box inside a box.

These pages are written by scripts/aggregate.py and are never hand-edited,
so everything here happens at render time, on the HTML of the page's
content (on_page_content), and so reaches every archived week too:

1. THE BRIEF (This Week and the three feed pages). The lede stays, the
   continuation paragraphs move into a plain disclosure labelled "Read the
   rest of this week's brief" directly under it (ending in a "Hide the rest
   of this week's brief" button that folds it again), and the player (when its
   audio exists) and the "The picture as of" line sit under that, outside
   the disclosure, so Listen is never hidden. A brief with no continuation
   gets no disclosure. Nothing is reworded; the narration reads the
   markdown, which is unchanged, so the spoken text cannot change.

2. THE FEEDS. Each h2 section that holds a news list becomes a panel
   (`section.wk-feed`, the news kind, keyed once by layout_nav), and the
   run of feed panels sits in one row of as many columns as there are
   feeds. A panel keeps its heading, brief, chips, list and "Show the other
   N items"; docs/javascripts/topics.js filters every list after its chips
   up to the panel's end, the collapsed tier included, as before.

3. THE REST. The digest's week in brief, its short update sections
   (conference calendar, new opportunities) as a row of panels, videos,
   podcasts and "Also this week" (in columns) are placed so no panel sits
   mostly empty: on a digest, videos and podcasts share one row, and a feed
   with far more items than the others spans two tracks with its list in
   two columns. On This Week, the first ten videos show (two rows of five)
   and the rest stay behind "Show the other N videos", its count updated.

4. THE FEED PAGES (week round, part 2). Each feed page's brief, chips and
   items go in one news-hue panel on the full frame, the items in a grid
   that fills the frame in rows (layout-news.css).

Wherever a list runs in more than one column (the feed pages, a digest's
wide feed), it is a grid: items line up across each row, read left to
right then down, and every item has the same rule under it, the last
row's clipped, so no column starts with a rule.

Every page it touches is checked: removing the wrappers this hook inserted
(and the horizontal rules it dropped between sections) gives back the
content exactly, so no block is lost, duplicated or reordered. The build
prints what it did per page and fails if a page it should arrange cannot
be arranged.
"""
from __future__ import annotations

import re
import sys

WEEK = "news/this-week.md"
DIGEST = re.compile(r"news/archive/\d{4}-w\d{2}\.md")
FEED_PAGES = {"news/medical-education.md", "news/clinical-practice.md", "news/general-ai.md"}
BRIEF_LABEL = "Read the rest of this week's brief"
HIDE_LABEL = "Hide the rest of this week's brief"
VISIBLE_VIDEOS = 10          # two rows of five across the frame

_S: dict = {}

_BRIEF = re.compile(
    r'<details class="note section-brief-more">\s*<summary[^>]*>.*?</summary>(.*?)</details>', re.S)
_LISTEN = re.compile(r'<div class="listen"[^>]*>.*?</div>', re.S)
_DATE = re.compile(r'<p class="section-brief-date">.*?</p>', re.S)
_PARA = re.compile(r"<p>.*?</p>", re.S)
_H2 = re.compile(r'<h2 id="([^"]+)">(.*?)</h2>', re.S)
_HR = re.compile(r"\s*<hr\s*/?>\s*")
_CARD = re.compile(r'<a class="video-card".*?</a>', re.S)


def on_config(config):
    _S.clear()
    _S.update(briefs=0, folds=0, pages={}, videos_moved=0)
    return config


def _nav():
    """The loaded layout_nav hook (MkDocs registers hooks under their path,
    so a plain import would load a second, empty copy)."""
    for module in list(sys.modules.values()):
        if (getattr(module, "__file__", "") or "").endswith("layout_nav.py") and getattr(module, "_S", {}).get("kind"):
            return module
    return None


# --- 1. the brief ---------------------------------------------------------------

def _brief(html: str, src: str) -> str:
    def fix(m: re.Match) -> str:
        body = m.group(1)
        listen = _LISTEN.findall(body)
        date = _DATE.findall(body)
        rest = _DATE.sub("", _LISTEN.sub("", body))
        paras = _PARA.findall(rest)
        if re.sub(r"\s", "", _PARA.sub("", rest)):
            raise ValueError(f"layout_week: {src}: a brief's fold holds something other than "
                             "paragraphs, the player and the date line")
        _S["briefs"] += 1
        fold = ""
        if paras:
            _S["folds"] += 1
            # The way back sits at the end of the continuation. It ships
            # hidden and layout-news.js reveals it, so without JavaScript
            # there is no dead button (the native summary closes the fold).
            fold = ('<details class="section-brief-more">'
                    f'<summary data-search-exclude="">{BRIEF_LABEL}</summary>'
                    + "\n".join(paras)
                    + f'\n<button type="button" class="section-brief-hide" data-search-exclude="" hidden>'
                    f"{HIDE_LABEL}</button></details>\n")
        return fold + "\n".join(listen + date)
    new, n = _BRIEF.subn(fix, html)
    if "section-brief-more" in html and not n:
        raise ValueError(f"layout_week: {src}: a brief could not be read")
    return new


# --- 2 and 3. the arrangement ------------------------------------------------------

def _sections(html: str):
    """The content as (head, [(id, title, html)]): split before each h2, the
    horizontal rule that separates sections left out."""
    starts = [m.start() for m in _H2.finditer(html)]
    if not starts:
        return html, []
    head = html[:starts[0]]
    out = []
    for i, s in enumerate(starts):
        e = starts[i + 1] if i + 1 < len(starts) else len(html)
        chunk = html[s:e]
        m = _H2.match(chunk)
        title = re.sub(r"<[^>]+>", "", m.group(2)).replace("&para;", "").replace("¶", "").strip()
        out.append((m.group(1), title, chunk))
    return head, out


def _strip_hr(chunk: str) -> tuple[str, int]:
    """A section's trailing horizontal rule (the pipeline's separator)."""
    m = re.search(r"\s*<hr\s*/?>\s*$", chunk)
    if m:
        return chunk[:m.start()] + "\n", 1
    return chunk, 0


def _videos(chunk: str) -> str:
    """Two rows of videos showing, the rest behind the disclosure."""
    grid = re.search(r'(<div class="video-grid">)(.*?)(\n</div>)', chunk, re.S)
    more = re.search(r'<details class="abstract">\s*<summary>Show the other (\d+) videos</summary>'
                     r'\s*<p><div class="video-grid">(.*?)\n</div></p>\s*</details>', chunk, re.S)
    if not grid or not more:
        return chunk
    shown, hidden = _CARD.findall(grid.group(2)), _CARD.findall(more.group(2))
    if len(hidden) != int(more.group(1)):
        raise AssertionError("layout_week: the videos' Show the other N count does not match its cards")
    take = max(0, min(len(hidden), VISIBLE_VIDEOS - len(shown)))
    if not take:
        return chunk
    moved, left = hidden[:take], hidden[take:]
    _S["videos_moved"] += take
    new_grid = grid.group(1) + grid.group(2) + "\n" + "\n".join(moved) + grid.group(3)
    new_more = ("" if not left else
                '<details class="abstract">\n<summary>Show the other '
                f'{len(left)} video{"s" if len(left) != 1 else ""}</summary>\n'
                '<p><div class="video-grid">\n' + "\n".join(left) + "\n</div></p>\n</details>")
    out = chunk[:grid.start()] + new_grid + chunk[grid.end():more.start()] + new_more + chunk[more.end():]
    return out


_TAIL = re.compile(r'<(?:div class="page-end"|p class="page-reviewed")')


def _arrange(html: str, src: str) -> str:
    # The page's ending (layout_frame's review date and report link, added
    # before this hook runs) stays after the last section, never inside it.
    last_h2 = max((m.start() for m in _H2.finditer(html)), default=0)
    tail_m = _TAIL.search(html, last_h2)
    tail = ""
    if tail_m:
        html, tail = html[:tail_m.start()], html[tail_m.start():]
    return _arrange_body(html, src) + tail


def _dominant(counts: list[int]) -> int | None:
    """The index of a feed with at least four items and at least twice as
    many as any other feed, or None."""
    if len(counts) < 2 or len(counts) > 3:
        return None
    top = max(counts)
    k = counts.index(top)
    rest = counts[:k] + counts[k + 1:]
    return k if top >= 4 and top >= 2 * max(rest) else None


def _arrange_body(html: str, src: str) -> str:
    head, sections = _sections(html)
    if not sections:
        raise ValueError(f"layout_week: {src} has no sections to arrange")
    nav = _nav()
    kind = nav.kind_of(src) if nav else None
    kattr = f' data-kind="{kind}"' if kind else ""
    out = [head]
    shapes = []
    i = 0
    while i < len(sections):
        sid, title, chunk = sections[i]
        chunk, _ = _strip_hr(chunk)
        if 'class="news-list' in chunk:
            run = []
            while i < len(sections) and 'class="news-list' in sections[i][2]:
                c, _ = _strip_hr(sections[i][2])
                run.append((sections[i][0], c))
                i += 1
            # On a digest, a feed with far more items than the others takes
            # two tracks and sets its list in two columns, so the short
            # columns beside it do not stand over a tall empty space.
            wide = _dominant([c.count('class="news-card"') for _, c in run]) if src != WEEK else None
            tracks = len(run) + (1 if wide is not None else 0)
            out.append(f'<div class="wk-feeds kind-group" data-wk-n="{tracks}">')
            for k, (fid, c) in enumerate(run):
                cls = "wk-feed ne-card kind-block" + (" wk-feed--wide" if k == wide else "")
                out.append(f'<section class="{cls}"{kattr} aria-labelledby="{fid}">{c}</section>')
            out.append("</div>\n")
            shapes.append(f"feeds {len(run)}" + (f" (feed {wide + 1} wide)" if wide is not None else ""))
            continue
        if sid == "videos" and src != WEEK and i + 1 < len(sections) and sections[i + 1][0] == "podcasts":
            # On a digest, videos and podcasts share one row, each card one
            # share of it (at most 18rem), rather than two mostly empty rows.
            pchunk, _ = _strip_hr(sections[i + 1][2])
            v, p = len(_CARD.findall(chunk)), len(_CARD.findall(pchunk))
            out.append(f'<div class="wk-mediarow" style="--wk-cols: minmax(0, {v}fr) minmax(0, {p}fr); '
                       f'--wk-cards: {v + p}">'
                       f'<section class="wk-media" aria-labelledby="videos" style="--wk-n: {v}">{chunk}</section>'
                       f'<section class="wk-media wk-podcasts" aria-labelledby="podcasts" style="--wk-n: {p}">'
                       f"{pchunk}</section></div>\n")
            shapes.append(f"media row {v}+{p}")
            i += 2
            continue
        if title in ("Conference calendar updates", "New opportunities"):
            run = []
            while i < len(sections) and sections[i][1] in ("Conference calendar updates", "New opportunities"):
                c, _ = _strip_hr(sections[i][2])
                run.append((sections[i][0], c))
                i += 1
            out.append(f'<div class="wk-updates" data-wk-n="{len(run)}">')
            for uid, c in run:
                out.append(f'<section class="wk-update" aria-labelledby="{uid}">{c}</section>')
            out.append("</div>\n")
            shapes.append(f"updates {len(run)}")
            continue
        if sid == "videos" and src == WEEK:
            chunk = _videos(chunk)
        cls = {"videos": "wk-media", "podcasts": "wk-media wk-podcasts", "also-this-week": "wk-also",
               "the-week-in-brief": "wk-brief"}.get(sid)
        if cls:
            out.append(f'<section class="{cls}" aria-labelledby="{sid}">{chunk}</section>\n')
            shapes.append(cls.split()[-1])
        else:
            out.append(chunk)
        i += 1
    _S["pages"][src] = shapes
    return "".join(out)


def _feed_page(html: str, src: str) -> str:
    """A feed page's brief, chips and items in one news-hue panel on the
    full frame (week round, part 2): everything from the brief to the end of
    the list, the page's own "Show the other N" included, before the page's
    ending."""
    start = html.find('<div class="section-brief">')
    if start == -1:
        start = html.find('<div class="topic-chips"')
    if start == -1:
        start = html.find('<div class="news-list')
    tail_m = _TAIL.search(html, max(start, 0))
    end = tail_m.start() if tail_m else len(html)
    if start == -1 or 'class="news-list' not in html[start:end]:
        raise ValueError(f"layout_week: {src}: no feed to put in a panel")
    h1 = re.search(r'<h1 id="([^"]+)"', html)
    label = f' aria-labelledby="{h1.group(1)}"' if h1 else ""
    nav = _nav()
    kind = nav.kind_of(src) if nav else None
    kattr = f' data-kind="{kind}"' if kind else ""
    body = html[start:end].rstrip()
    items = body.count('class="news-card"')
    _S["pages"][src] = [f"feed panel, {items} items in rows"]
    return (html[:start] + f'<section class="wk-feed wk-feed--page ne-card kind-block"{kattr}{label}>'
            + body + "</section>\n" + html[end:])


def _text(s: str) -> str:
    return re.sub(r"\s+", "", re.sub(r"<[^>]+>", "", _HR.sub("", s)))


def _check_brief(before: str, after: str, src: str):
    """The brief step moves blocks, never changes them: the same paragraphs,
    player and date line, only the fold's label is new."""
    blocks = lambda s: sorted(_PARA.findall(s) + _LISTEN.findall(s) + _DATE.findall(s)
                              + re.findall(r'<p class="section-brief-lede">.*?</p>', s, re.S))
    if blocks(before) != blocks(after):
        raise AssertionError(f"layout_week: restructuring the briefs on {src} changed a block")


def _check_arrange(before: str, after: str, src: str):
    """The arrangement only wraps: the page's text, in order, is unchanged
    (on This Week, bar the videos' "Show the other N videos" count)."""
    norm = lambda s: re.sub(r"Showtheother\d+videos?", "", _text(s))
    if norm(before) != norm(after):
        raise AssertionError(f"layout_week: arranging {src} changed its text or its order")


def on_page_content(html, page, config, files):
    src = page.file.src_uri
    if not (src == WEEK or src in FEED_PAGES or DIGEST.fullmatch(src)):
        return html
    if src == WEEK or src in FEED_PAGES:
        before, html = html, _brief(html, src)
        _check_brief(before, html, src)
    if src == WEEK or DIGEST.fullmatch(src):
        before, html = html, _arrange(html, src)
        _check_arrange(before, html, src)
    if src in FEED_PAGES:
        before, html = html, _feed_page(html, src)
        _check_arrange(before, html, src)
    return html


def on_post_build(config):
    print("layout_week: This Week, the weekly digests and the feed pages")
    print(f"  briefs restructured : {_S['briefs']} ({_S['folds']} with a continuation to fold)")
    print(f"  pages arranged      : {len(_S['pages'])}")
    for src, shapes in sorted(_S["pages"].items()):
        print(f"    {src}: {', '.join(shapes)}")
    print(f"  videos moved up     : {_S['videos_moved']} (This Week shows {VISIBLE_VIDEOS})")
    if WEEK not in _S["pages"]:
        raise AssertionError("layout_week: This Week was not arranged")
    missing = FEED_PAGES - set(_S["pages"])
    if missing:
        raise AssertionError(f"layout_week: feed pages not put in a panel: {sorted(missing)}")
