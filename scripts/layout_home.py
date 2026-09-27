"""MkDocs hook: the timely column on the home page and the News & Events landing.

Layout redesign (2026-09-25; layout plan L11 and L18, navigation plan step
11, owner decisions 4, 7 and 11). Both pages are Door pages that show what
is new and what is coming up beside their main routes (reorganized in the
news round, 2026-09-27: one column per written feed, and three labeled
cards for what is coming up). Nothing in that column is typed into a page:
the news comes from the pipeline's own feed pages (docs/news/<feed>.md) and,
cross-checked against them, includes/latest.md; dates from
data/conferences.yaml; open calls from there and data/opportunities.yaml;
and the poll from data/polls.yaml, and every status (open, passed, to be
announced) is computed against the build date, which the page states.

Markers, each an HTML comment on a line of its own, replaced in memory
(nothing is written back into docs/):

  <!-- timely:feed F N -->           one Latest News column: the N newest
                                     items of news feed F (docs/news/F.md,
                                     the pipeline's page, read as built),
                                     under the feed's own name, with a link
                                     to the feed
  <!-- timely:feeds-mini N F [F ...] --> the home page's miniature: the N
                                     newest of each feed under its name
  <!-- timely:events N -->           the Conferences and Events card: the
                                     next N events, each with its dates,
                                     place and any open call for abstracts
  <!-- timely:calls N -->            the Open Calls card: open calls for
                                     abstracts and open opportunities
                                     (data/opportunities.yaml), by deadline
  <!-- timely:committee -->          the From the AI Committee card: the
                                     open poll, or a quiet line when none is
                                     open
  <!-- timely:minutes P [P ...] -->  the total of the "About N minutes"
                                     chips on the pages P (docs paths), so a
                                     time quoted on the home page cannot
                                     drift from the modules' own

The links to each block's full list are ordinary markdown in the page, so
MkDocs checks them; this hook writes external links only (sources,
conference sites, the poll form).

A stale build cannot keep a status alive past its date: each dated item
carries its cut-off date, and docs/javascripts/layout-home.js hides an item
whose date has passed on the reader's own calendar and shows the next one
rendered behind it. The "as of" line keeps the build date, so a stalled
pipeline still shows (the 2026-09-08 lesson: a date that always reads
"today" can never warn anyone).

Verification counts print on every build, and bad data fails it (CLAUDE.md
working rule 2): an include line that does not parse, an item that is not a
kept Medical Education item in data/seen_items.json, a date field that is
neither a date nor one of its documented words, an event that ends before it
starts, a poll without a question or link, a page without its time chip, an
unknown marker, or a marker left behind.
"""
from __future__ import annotations

import html
import json
import re
from datetime import date, datetime
from pathlib import Path

import posixpath
import sys

import yaml

import render_data as rd

MARKER_RE = re.compile(r"<!--\s*timely:([\w-]+)((?:[ \t]+[^\s>]+)*)[ \t]*-->")
LEFTOVER_RE = re.compile(r"<!--\s*timely:")

# The include's line shape, from aggregate.render_latest_include:
#   - [Title with \[escaped\] brackets](url) (Source, September 25, 2026)
INCLUDE_LINE_RE = re.compile(
    r"^- \[(?P<title>(?:\\.|[^\\\]])*)\]\((?P<url>\S+)\) "
    r"\((?P<source>.+), (?P<date>[A-Z][a-z]+ \d{1,2}, \d{4})\)$")
INCLUDE_EMPTY = "No items yet."
HOME_CATEGORY = "medical_education"  # aggregate.LATEST_CATEGORY
MINUTES_RE = re.compile(r"About (\d+) minutes")

DATE_WORDS = {"start_date": {"tbd"}, "end_date": {"tbd"},
              "abstract_deadline": {"tbd", "passed"}}
# Items rendered behind the visible ones, for the reader-side date check.
SPARES = 3


def _long(d: date) -> str:
    return f"{d:%B} {d.day}, {d.year}"


def _range(start: date, end: date) -> str:
    if start == end:
        return _long(start)
    if (start.year, start.month) == (end.year, end.month):
        return f"{start:%B} {start.day} to {end.day}, {end.year}"
    if start.year == end.year:
        return f"{start:%B} {start.day} to {end:%B} {end.day}, {end.year}"
    return f"{_long(start)} to {_long(end)}"


def _text(value: str) -> str:
    """Escape for HTML, and neutralize the characters Markdown's inline
    processing would act on if this ever lands inside a markdown block
    (CLAUDE.md, the ??? admonition gotcha): entities render identically
    either way."""
    out = html.escape(str(value), quote=True)
    for ch, ent in (("*", "&#42;"), ("_", "&#95;"), ("`", "&#96;"),
                    ("[", "&#91;"), ("]", "&#93;")):
        out = out.replace(ch, ent)
    return out


def _href(url: str, what: str) -> str:
    url = str(url or "").strip()
    if not url.startswith("https://") or any(c in url for c in ' "<>'):
        raise ValueError(f"layout_home: {what} has an unusable link {url!r}")
    return html.escape(url, quote=True)


class _Build:
    """What one build reads, loaded once and printed once per page."""

    def __init__(self, config):
        self.shown = []   # (page, feed, count) for each Latest News list rendered
        self.root = Path(config["docs_dir"]).parent
        self.today = date.today()
        self._news = None
        self._calendar = None
        self._polls = None

    # --- news ---------------------------------------------------------------

    def news(self):
        if self._news is not None:
            return self._news
        path = self.root / "includes" / "latest.md"
        lines = path.read_text(encoding="utf-8").splitlines()
        items, empty = [], False
        for n, line in enumerate(lines, 1):
            s = line.strip()
            if not s or (s.startswith("<!--") and s.endswith("-->")):
                continue
            if s.startswith(INCLUDE_EMPTY):
                empty = True
                continue
            m = INCLUDE_LINE_RE.match(s)
            if not m:
                raise ValueError(f"layout_home: includes/latest.md line {n} does not "
                                 f"parse as a news item: {s[:120]!r}")
            item = m.groupdict()
            item["title"] = re.sub(r"\\(.)", r"\1", item["title"])
            items.append(item)
        if empty and items:
            raise ValueError("layout_home: includes/latest.md has both items and "
                             "its empty-state line")
        ledger = json.loads((self.root / "data" / "seen_items.json")
                            .read_text(encoding="utf-8"))
        kept = {r["url"]: r for r in ledger.get("items", []) if r.get("kept")}
        for item in items:
            rec = kept.get(item["url"])
            if rec is None:
                raise ValueError("layout_home: includes/latest.md links "
                                 f"{item['url']!r}, which is not a kept item in "
                                 "data/seen_items.json")
            if rec.get("category") != HOME_CATEGORY:
                raise ValueError(
                    "layout_home: includes/latest.md holds "
                    f"{item['title'][:60]!r} from {rec.get('category')!r}; the "
                    f"home include carries {HOME_CATEGORY} only (aggregate.py "
                    "LATEST_CATEGORY). Regenerate it before building.")
        self._news = items
        print("layout_home: news verification")
        print(f"  include items read : {len(items)}")
        print(f"  in ledger, kept, {HOME_CATEGORY}: {len(items)} "
              f"of {len(items)} (cross-check ok)")
        return items

    # --- feeds --------------------------------------------------------------

    def feed(self, slug):
        """A written feed as the pipeline published it: its name (the
        page's H1) and its items in page order (title, link, source, date),
        read from docs/news/<slug>.md. Medical Education is cross-checked
        against includes/latest.md, which the pipeline writes from the same
        items."""
        self._feeds = getattr(self, "_feeds", {})
        if slug in self._feeds:
            return self._feeds[slug]
        path = self.root / "docs" / "news" / f"{slug}.md"
        if not path.exists():
            raise ValueError(f"layout_home: no feed page docs/news/{slug}.md")
        text = path.read_text(encoding="utf-8")
        h1 = re.search(r"^# (.+?)\s*$", text, re.M)
        # Each card runs from its opening tag to the next card's (a card may
        # end with a thumbnail after its body, so no closing-tag pattern).
        starts = [m.start() for m in re.finditer(r'<div class="news-card"', text)]
        cards = [text[a:b] for a, b in zip(starts, starts[1:] + [len(text)])]
        items = []
        for body in cards:
            a = re.search(r'<a class="news-card-title" href="([^"]+)">(.*?)</a>', body, re.S)
            src = re.search(r'<span class="source-chip">(.*?)</span>', body, re.S)
            when = re.search(r'<span class="news-card-date">(.*?)</span>', body, re.S)
            if not (a and src and when):
                raise ValueError(f"layout_home: a news card on docs/news/{slug}.md does not parse")
            items.append({"url": html.unescape(a.group(1)), "title": html.unescape(" ".join(a.group(2).split())),
                          "source": html.unescape(src.group(1)), "date": html.unescape(when.group(1))})
        opened = text.count('<div class="news-card"')
        if not h1 or len(items) != opened:
            raise ValueError(f"layout_home: docs/news/{slug}.md: {len(items)} cards read of "
                             f"{opened}, or no title")
        if slug == HOME_CATEGORY.replace("_", "-"):
            include = [i["url"] for i in self.news()]
            if [i["url"] for i in items[:len(include)]] != include:
                raise ValueError("layout_home: includes/latest.md does not list the newest items "
                                 f"of docs/news/{slug}.md in order; regenerate them together")
        self._feeds[slug] = (h1.group(1), items)
        print(f"layout_home: feed {slug}: {len(items)} items on the page (all parsed)")
        return self._feeds[slug]

    # --- opportunities ------------------------------------------------------

    def opportunities(self):
        """The opportunities open to join today, by the Opportunities page's
        own rule (render_data.opportunity_state)."""
        if getattr(self, "_opps", None) is not None:
            return self._opps
        entries = yaml.safe_load((self.root / "data" / "opportunities.yaml")
                                 .read_text(encoding="utf-8-sig")) or []
        states = {}
        for opp in entries:
            for key in ("name", "url", "type", "deadline"):
                if not opp.get(key):
                    raise ValueError(f"layout_home: opportunity {opp.get('name')!r} is missing {key!r}")
            _href(opp["url"], f"opportunity {opp['name']!r}")
            states.setdefault(rd.opportunity_state(opp, self.today), []).append(opp)
        self._opps = states.get("open", [])
        n = sum(len(v) for v in states.values())
        print("layout_home: opportunities verification")
        print(f"  entries read      : {len(entries)}; open {len(states.get('open', []))}, "
              f"in progress {len(states.get('in_progress', []))}, past {len(states.get('past', []))} "
              f"(total {n}, cross-check {'ok' if n == len(entries) else 'MISMATCH'})")
        if n != len(entries):
            raise AssertionError("layout_home: opportunity split does not add up")
        return self._opps

    # --- calendar -----------------------------------------------------------

    def calendar(self):
        if self._calendar is not None:
            return self._calendar
        path = self.root / "data" / "conferences.yaml"
        entries = yaml.safe_load(path.read_text(encoding="utf-8-sig")) or []
        today = self.today
        confs = []
        for entry in entries:
            name = entry.get("name")
            for key in ("name", "url", "location"):
                if not entry.get(key):
                    raise ValueError(f"layout_home: conference {name!r} is missing {key!r}")
            _href(entry["url"], f"conference {name!r}")
            conf = {"name": name, "url": entry["url"], "location": entry["location"]}
            for key, words in DATE_WORDS.items():
                value = entry.get(key)
                if isinstance(value, date):
                    conf[key] = value
                elif isinstance(value, str) and value.strip().lower() in words:
                    conf[key] = value.strip().lower()
                else:
                    raise ValueError(
                        f"layout_home: conference {name!r} has {key} {value!r}; "
                        f"expected a date or one of {sorted(words)}")
            dated = [isinstance(conf[k], date) for k in ("start_date", "end_date")]
            if dated[0] != dated[1]:
                raise ValueError(f"layout_home: conference {name!r} has one of its "
                                 "start and end dates TBD but not the other")
            if all(dated) and conf["end_date"] < conf["start_date"]:
                raise ValueError(f"layout_home: conference {name!r} ends before it starts")
            confs.append(conf)

        calls = sorted((c for c in confs if isinstance(c["abstract_deadline"], date)
                        and c["abstract_deadline"] >= today),
                       key=lambda c: (c["abstract_deadline"], c["name"]))
        dated = sorted((c for c in confs if isinstance(c["end_date"], date)
                        and c["end_date"] >= today),
                       key=lambda c: (c["start_date"], c["name"]))
        undated = [c for c in confs if c["end_date"] == "tbd"]
        past = [c for c in confs if isinstance(c["end_date"], date)
                and c["end_date"] < today]
        passed = sum(1 for c in confs if c["abstract_deadline"] == "passed"
                     or (isinstance(c["abstract_deadline"], date)
                         and c["abstract_deadline"] < today))
        tbd = sum(1 for c in confs if c["abstract_deadline"] == "tbd")
        if len(dated) + len(undated) + len(past) != len(confs):
            raise AssertionError("layout_home: conference split does not add up")
        if len(calls) + passed + tbd != len(confs):
            raise AssertionError("layout_home: abstract deadline split does not add up")
        self._calendar = {"calls": calls, "events": dated + undated}
        print("layout_home: calendar verification (as of " + today.isoformat() + ")")
        print(f"  entries read      : {len(confs)}")
        print(f"  events            : {len(dated)} upcoming dated, "
              f"{len(undated)} dates TBD, {len(past)} past "
              f"(total {len(dated) + len(undated) + len(past)}, cross-check ok)")
        print(f"  abstract deadlines: {len(calls)} open, {passed} passed, {tbd} TBD "
              f"(total {len(calls) + passed + tbd}, cross-check ok)")
        if calls:
            print(f"  next open call    : {calls[0]['name']} "
                  f"({calls[0]['abstract_deadline'].isoformat()})")
        return self._calendar

    # --- polls --------------------------------------------------------------

    def polls(self):
        if self._polls is not None:
            return self._polls
        path = self.root / "data" / "polls.yaml"
        data = yaml.safe_load(path.read_text(encoding="utf-8-sig")) or {}
        active = data.get("active") or []
        shown, lapsed = [], []
        for poll in active:
            for key in ("question", "url"):
                if not poll.get(key):
                    raise ValueError(f"layout_home: an active poll in data/polls.yaml "
                                     f"is missing {key!r}")
            _href(poll["url"], f"poll {poll['question'][:40]!r}")
            closes = _closing_date(poll.get("closes"))
            if closes is not None and closes < self.today:
                # Time passing is not bad data, so the build goes on; the
                # poll is simply not shown as open.
                lapsed.append(poll)
            else:
                shown.append(poll)
        self._polls = shown
        print("layout_home: poll verification")
        print(f"  active in file    : {len(active)}")
        print(f"  shown as open     : {len(shown)}")
        print(f"  past closing date : {len(lapsed)} (not shown; move to closed in "
              "data/polls.yaml)" if lapsed else "  past closing date : 0")
        return shown


def _closing_date(value):
    """`closes` is a display string ("July 19, 2026"); read a date from it
    when it holds one, so a lapsed poll is never labelled open."""
    if value is None or value == "":
        return None
    if isinstance(value, date):
        return value
    m = re.search(r"([A-Z][a-z]+) (\d{1,2}), (\d{4})", str(value))
    if not m:
        return None
    try:
        return datetime.strptime(" ".join(m.groups()), "%B %d %Y").date()
    except ValueError:
        return None


# --- rendering -----------------------------------------------------------------


def _nav():
    """The running layout_nav hook, for page kinds (MkDocs registers hooks by
    their path, so `import layout_nav` would load a second, empty copy)."""
    for module in list(sys.modules.values()):
        if (getattr(module, "__file__", "") or "").endswith("layout_nav.py") and getattr(module, "_S", {}).get("kind"):
            return module
    raise AssertionError("layout_home: the layout_nav hook has not built its kinds yet")


def _link(target: str, src: str) -> str:
    """A docs path as a markdown link target from the page `src`, so MkDocs
    rewrites and checks it like any hand-written link."""
    return posixpath.relpath(target, posixpath.dirname(src) or ".")


def _card(kind_of_page: str, card_id: str, title: str, body: str, more: str) -> str:
    """One labeled card: a single heading, its body, and its "All ..." link.
    It wears the kind of the page its link opens, and layout_nav keys it."""
    kind = _nav().kind_of(kind_of_page)
    attrs = f' data-kind="{kind}"' if kind else ""
    return (f'<section class="timely-block ne-card kind-block"{attrs} markdown>\n\n'
            f'### {title} {{: #{card_id} data-search-exclude="true" }}\n\n'
            f"{body}\n\n{more}\n\n</section>")


def _news_items(items, slug) -> str:
    rows = []
    for item in items:
        rows.append(
            '<li class="timely-item">'
            f'<a class="timely-title" href="{_href(item["url"], "news item")}">'
            f'{_text(item["title"])}</a>'
            f'<span class="timely-meta">{_text(item["source"])} &middot; '
            f'{_text(item["date"])}</span></li>')
    return f'<ul class="timely-list" data-feed="{slug}">' + "".join(rows) + "</ul>"


def _feed_html(build: _Build, arg: str, src: str) -> str:
    parts = arg.split()
    if len(parts) != 2:
        raise ValueError(f"layout_home: timely:feed needs a feed and a count, got {arg.strip()!r}")
    slug, count = parts[0], _count(parts[1], "feed")
    name, items = build.feed(slug)
    shown = items[:count]
    body = (_news_items(shown, slug) if shown else
            '<p class="timely-empty">No items yet. The pipeline adds items several times a day.</p>')
    more = f"[All {name} News](" + _link(f"news/{slug}.md", src) + "){ .timely-more }"
    build.shown.append((src, slug, count))
    return _card(f"news/{slug}.md", f"latest-{slug}", name, body, more)


def _feeds_mini_html(build: _Build, arg: str, src: str) -> str:
    parts = arg.split()
    if len(parts) < 2:
        raise ValueError(f"layout_home: timely:feeds-mini needs a count and feeds, got {arg.strip()!r}")
    count = _count(parts[0], "feeds-mini")
    blocks = []
    for slug in parts[1:]:
        name, items = build.feed(slug)
        shown = items[:count]
        build.shown.append((src, slug, count))
        blocks.append(_kicker(name))
        blocks.append(_news_items(shown, slug) if shown else
                      '<p class="timely-empty">No items yet.</p>')
    return "\n\n".join(blocks)


def _kicker(text: str) -> str:
    """A small label inside a card or block. A <p> with the heading role, not
    an <h3>: md_in_html hands an <h3> to the toc extension, which gives it an
    anchor and makes it a search section of its own."""
    return f'<p class="timely-kicker" role="heading" aria-level="3">{text}</p>'


def _deadline_meta(conf, today, open_only=False) -> str:
    """The abstract deadline line. An open one carries the date it flips on
    and the words it flips to, for the reader-side check in layout-home.js."""
    d = conf["abstract_deadline"]
    if isinstance(d, date) and d >= today:
        passed = f"Abstract deadline passed ({_long(d)})"
        return (f'<span class="timely-meta" data-open-until="{d.isoformat()}" '
                f'data-passed-text="{passed}">'
                '<span class="timely-status timely-status--open">Open</span>'
                f" &middot; abstracts due {_long(d)}</span>")
    if open_only:
        return ""
    if isinstance(d, date):
        text = f"Abstract deadline passed ({_long(d)})"
    elif d == "passed":
        text = "Abstract deadline passed"
    else:
        text = "Abstract deadline to be announced"
    return f'<span class="timely-meta">{text}</span>'


def _when_where(conf) -> str:
    when = (_range(conf["start_date"], conf["end_date"])
            if isinstance(conf["start_date"], date) else "Dates to be announced")
    return f'<span class="timely-meta">{when} &middot; {_text(conf["location"])}</span>'


def _conf_item(conf, meta, until, hidden) -> str:
    attrs = f' data-until="{until.isoformat()}"' if until else ""
    attrs += " hidden" if hidden else ""
    return (f'<li class="timely-item"{attrs}>'
            f'<a class="timely-title" href="{_href(conf["url"], conf["name"])}">'
            f'{_text(conf["name"])}</a>{"".join(meta)}</li>')


def _group(rows, show: int, built: str, empty: str) -> str:
    """One list the reader-side check can re-pick from: `show` items visible,
    the rest hidden behind them, and an empty line shown when none is left."""
    empty_li = (f'<li class="timely-empty" data-timely-empty'
                f'{" hidden" if rows else ""}>{empty}</li>')
    return (f'<ul class="timely-list" data-timely-group data-show="{show}" '
            f'data-built="{built}">' + "".join(rows) + empty_li + "</ul>")


def _asof(build: _Build) -> str:
    return f'<p class="timely-asof">Status as of {_long(build.today)}.</p>'


def _events_html(build: _Build, arg: str, src: str) -> str:
    count = _count(arg, "events")
    cal = build.calendar()
    today = build.today
    events = cal["events"][:count + SPARES]
    rows = [_conf_item(c, [_when_where(c), _deadline_meta(c, today, open_only=True)],
                       c["end_date"] if isinstance(c["end_date"], date) else None, i >= count)
            for i, c in enumerate(events)]
    body = (_group(rows, count, today.isoformat(), "No upcoming events are listed right now.")
            + "\n\n" + _asof(build))
    more = "[All Conferences and Events](" + _link("conferences.md", src) + "){ .timely-more }"
    print(f"  events card       : {count} slot(s) ({len(events)} rendered)")
    return _card("conferences.md", "conferences-and-events", "Conferences and Events", body, more)


def _calls_html(build: _Build, arg: str, src: str) -> str:
    """Open calls, soonest deadline first: calls for abstracts from the
    conference calendar, and the opportunities open to join. An
    opportunity with a worded deadline ("Rolling") follows the dated ones."""
    count = _count(arg, "calls")
    today = build.today
    calls = []
    for c in build.calendar()["calls"]:
        d = c["abstract_deadline"]
        calls.append((d, c["name"], c["url"], f"Call for abstracts &middot; due {_long(d)}", d))
    for o in build.opportunities():
        d = o["deadline"]
        kind = rd.OPPORTUNITY_TYPE_LABELS.get(o["type"], "")
        if isinstance(d, date):
            calls.append((d, o["name"], o["url"], f"{kind} &middot; apply by {_long(d)}", d))
        else:
            calls.append((date.max, o["name"], o["url"], f"{kind} &middot; deadline: {_text(d)}", None))
    calls.sort(key=lambda x: (x[0], x[1]))
    shown = calls[:count + SPARES]
    rows = [(f'<li class="timely-item"{f" data-until={chr(34)}{until.isoformat()}{chr(34)}" if until else ""}'
             f'{" hidden" if i >= count else ""}>'
             f'<a class="timely-title" href="{_href(url, name)}">{_text(name)}</a>'
             f'<span class="timely-meta">{meta}</span></li>')
            for i, (_d, name, url, meta, until) in enumerate(shown)]
    body = (_group(rows, count, today.isoformat(), "No open calls are listed right now.")
            + "\n\n" + _asof(build))
    more = "[All Opportunities](" + _link("opportunities.md", src) + "){ .timely-more }"
    print(f"  open calls card   : {len(calls)} open ({len(build.calendar()['calls'])} calls for "
          f"abstracts, {len(build.opportunities())} opportunities); {count} slot(s)")
    return _card("opportunities.md", "open-calls", "Open Calls", body, more)


def _committee_html(build: _Build, arg: str, src: str) -> str:
    if arg.strip():
        raise ValueError(f"layout_home: timely:committee takes no argument, got {arg.strip()!r}")
    polls = build.polls()
    if not polls:
        body = '<p class="timely-empty">No committee poll is open right now.</p>'
    else:
        rows = []
        for poll in polls:
            note = [_text(" ".join(str(poll["note"]).split()))] if poll.get("note") else []
            if poll.get("restricted"):
                note.append("Needs an AUA account.")
            closes = poll.get("closes")
            status = (f'<span class="timely-status timely-status--open">Open</span> as of '
                      f"{_long(build.today)}")
            status += (f"; closes {_text(closes)}" if closes else ", with no closing date")
            meta = "".join(f'<span class="timely-meta">{m}</span>'
                           for m in (" ".join(note), status) if m)
            rows.append(f'<li class="timely-item"><a class="timely-title" '
                        f'href="{_href(poll["url"], "poll")}">{_text(poll["question"])}</a>'
                        f"{meta}</li>")
        body = '<ul class="timely-list">' + "".join(rows) + "</ul>"
    more = ("[Announcements and Committee Polls](" + _link("announcements/index.md", src)
            + "){ .timely-more }")
    return _card("announcements/index.md", "from-the-ai-committee", "From the AI Committee", body, more)


def _minutes(build: _Build, arg: str, files) -> str:
    paths = arg.split()
    if not paths:
        raise ValueError("layout_home: timely:minutes needs at least one docs path")
    total, parts = 0, []
    for path in paths:
        target = files.get_file_from_path(path)
        if target is None:
            raise ValueError(f"layout_home: timely:minutes names {path!r}, which does not exist")
        head = Path(target.abs_src_path).read_text(encoding="utf-8").splitlines()[:25]
        m = MINUTES_RE.search("\n".join(head))
        if not m:
            raise ValueError(f"layout_home: {path} has no 'About N minutes' chip near its "
                             "top, so the home page cannot state its time")
        total += int(m.group(1))
        parts.append(f"{path} {m.group(1)}")
    print(f"  minutes           : {' + '.join(parts)} = {total}")
    return str(total)


def _count(arg: str, name: str) -> int:
    arg = arg.strip()
    if not re.fullmatch(r"[1-9]\d?", arg):
        raise ValueError(f"layout_home: timely:{name} needs a count from 1 to 99, got {arg!r}")
    return int(arg)


_BUILD = None

# Pages whose frame layout-home.css adjusts, named on <body> so the styles
# never depend on :has() support.
DOORS = {"index.md": "home", "news-and-events.md": "news-events"}


def on_pre_build(config):
    global _BUILD
    _BUILD = _Build(config)


def on_page_markdown(markdown, page, config, files):
    if not LEFTOVER_RE.search(markdown):
        return markdown
    build = _BUILD or _Build(config)
    src = page.file.src_uri
    counts = {}

    def replace(m):
        name, arg = m.group(1), m.group(2)
        counts[name] = counts.get(name, 0) + 1
        render = {"feed": _feed_html, "feeds-mini": _feeds_mini_html, "events": _events_html,
                  "calls": _calls_html, "committee": _committee_html}.get(name)
        if render:
            return "\n\n" + render(build, arg, src) + "\n\n"
        if name == "minutes":
            return _minutes(build, arg, files)
        raise ValueError(f"layout_home: {src} has an unknown marker timely:{name}")

    print(f"layout_home: markers in {src}")
    markdown = MARKER_RE.sub(replace, markdown)
    if LEFTOVER_RE.search(markdown):
        raise ValueError(f"layout_home: {src} has a timely marker this hook could not read")
    print("  replaced          : " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))
    return markdown


def on_post_build(config):
    """Each Latest News list, as built, shows exactly the newest items of its
    feed page as built: the links are read back from the site."""
    if _BUILD is None or not _BUILD.shown:
        return
    site = Path(config["site_dir"])

    def built(src):
        path = site / ("index.html" if src == "index.md" else src[:-3] + "/index.html")
        return path.read_text(encoding="utf-8")

    bad = []
    for src, slug, count in _BUILD.shown:
        page = built(src)
        m = re.search(rf'<ul class="timely-list" data-feed="{slug}">(.*?)</ul>', page, re.S)
        shown = re.findall(r'<a class="timely-title" href="([^"]+)"', m.group(1)) if m else None
        feed = built(f"news/{slug}.md")
        top = re.findall(r'<a class="news-card-title" href="([^"]+)"', feed)[:count]
        if shown != top:
            bad.append(f"{src} {slug}: {len(shown or [])} shown, expected {len(top)}")
    print("layout_home: latest news verification (read back from the built site)")
    print(f"  lists checked     : {len(_BUILD.shown)} "
          f"({', '.join(f'{s}:{f} {n}' for s, f, n in _BUILD.shown)})")
    print(f"  equal to the newest items on their feed page: {len(_BUILD.shown) - len(bad)} "
          f"of {len(_BUILD.shown)}")
    if bad:
        raise AssertionError("layout_home: Latest News lists that are not their feed's newest "
                             "items: " + "; ".join(bad))


def on_post_page(output, page, config):
    door = DOORS.get(page.file.src_uri)
    if door:
        output = output.replace("<body ", f'<body data-door="{door}" ', 1)
    return output
