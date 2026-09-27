"""MkDocs hook: the timely column on the home page and the News & Events landing.

Layout redesign (2026-09-25; layout plan L11 and L18, navigation plan step
11, owner decisions 4, 7 and 11). Both pages are Door pages that show what
is new and what is coming up beside their main routes. Nothing in that
column is typed into a page: the news comes from includes/latest.md (the
pipeline's Medical Education include), dates from data/conferences.yaml,
and the poll from data/polls.yaml, and every status (open, passed, to be
announced) is computed against the build date, which the page states.

Markers, each an HTML comment on a line of its own, replaced in memory
(nothing is written back into docs/):

  <!-- timely:news N -->             the N newest items in includes/latest.md
  <!-- timely:coming-up N -->        the next open call for abstracts, then
                                     the next N events
  <!-- timely:poll -->               the open AI Committee poll, or a quiet
                                     line when none is open
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

import yaml

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


def _news_html(build: _Build, arg: str) -> str:
    count = _count(arg, "news")
    items = build.news()
    if not items:
        return ('<p class="timely-empty">No items yet. The pipeline adds items '
                "several times a day.</p>")
    rows = []
    for item in items[:count]:
        rows.append(
            '<li class="timely-item">'
            f'<a class="timely-title" href="{_href(item["url"], "news item")}">'
            f'{_text(item["title"])}</a>'
            f'<span class="timely-meta">{_text(item["source"])} &middot; '
            f'{_text(item["date"])}</span></li>')
    return '<ul class="timely-list">' + "".join(rows) + "</ul>"


def _kicker(text: str) -> str:
    """A small heading inside a timely block. A <p> with the heading role, not
    an <h3>: md_in_html hands an <h3> to the toc extension, which gives it an
    anchor and makes it a search section of its own."""
    return f'<p class="timely-kicker" role="heading" aria-level="3">{text}</p>'


def _deadline_meta(conf, today) -> str:
    """The abstract deadline line. An open one carries the date it flips on
    and the words it flips to, for the reader-side check in layout-home.js."""
    d = conf["abstract_deadline"]
    if isinstance(d, date) and d >= today:
        passed = f"Abstract deadline passed ({_long(d)})"
        return (f'<span class="timely-meta" data-open-until="{d.isoformat()}" '
                f'data-passed-text="{passed}">'
                '<span class="timely-status timely-status--open">Open</span>'
                f" &middot; abstracts due {_long(d)}</span>")
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


def _coming_up_html(build: _Build, arg: str) -> str:
    count = _count(arg, "coming-up")
    cal = build.calendar()
    today = build.today
    built = today.isoformat()

    calls = cal["calls"][:1 + SPARES]
    call_rows = [_conf_item(c, [_deadline_meta(c, today), _when_where(c)],
                            c["abstract_deadline"], i > 0)
                 for i, c in enumerate(calls)]

    # The conference shown as the open call is not repeated as an event.
    first_call = calls[0]["name"] if calls else None
    events = [c for c in cal["events"] if c["name"] != first_call][:count + SPARES]
    event_rows = [_conf_item(c, [_when_where(c), _deadline_meta(c, today)],
                             c["end_date"] if isinstance(c["end_date"], date) else None,
                             i >= count)
                  for i, c in enumerate(events)]

    # Each block on a line of its own, blank lines between: inside md_in_html
    # a raw HTML block ends at its closing tag, and anything after it on the
    # same line would be wrapped in a paragraph.
    blocks = [
        _kicker("Open Call for Abstracts"),
        _group(call_rows, 1, built, "No open call for abstracts is listed right now."),
        _kicker("Next Event" if count == 1 else "Next Events"),
        _group(event_rows, count, built, "No upcoming events are listed right now."),
        f'<p class="timely-asof">Status as of {_long(today)}.</p>',
    ]
    print(f"  coming-up block   : 1 open call slot ({len(calls)} rendered), "
          f"{count} event slot(s) ({len(events)} rendered)")
    return "\n\n".join(blocks)


def _poll_html(build: _Build, arg: str) -> str:
    if arg.strip():
        raise ValueError(f"layout_home: timely:poll takes no argument, got {arg.strip()!r}")
    polls = build.polls()
    head = _kicker("The AI Committee Is Asking")
    if not polls:
        return head + '\n\n<p class="timely-empty">No committee poll is open right now.</p>'
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
    return head + '\n\n<ul class="timely-list">' + "".join(rows) + "</ul>"


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
        if name == "news":
            return "\n\n" + _news_html(build, arg) + "\n\n"
        if name == "coming-up":
            return "\n\n" + _coming_up_html(build, arg) + "\n\n"
        if name == "poll":
            return "\n\n" + _poll_html(build, arg) + "\n\n"
        if name == "minutes":
            return _minutes(build, arg, files)
        raise ValueError(f"layout_home: {src} has an unknown marker timely:{name}")

    print(f"layout_home: markers in {src}")
    markdown = MARKER_RE.sub(replace, markdown)
    if LEFTOVER_RE.search(markdown):
        raise ValueError(f"layout_home: {src} has a timely marker this hook could not read")
    print("  replaced          : " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))
    return markdown


def on_post_page(output, page, config):
    door = DOORS.get(page.file.src_uri)
    if door:
        output = output.replace("<body ", f'<body data-door="{door}" ', 1)
    return output
