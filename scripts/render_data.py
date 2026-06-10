"""MkDocs hook that renders data/conferences.yaml and data/tools.yaml into pages.

Registered under `hooks:` in mkdocs.yml, so it runs inside both `mkdocs serve`
and `mkdocs build --strict` with no separate pre-build step. It replaces marker
comments in hand-authored pages with markdown rendered from YAML, in memory
only: nothing generated is written into the docs/ source tree.

Markers:
    <!-- render:conferences -->   in docs/conferences.md
    <!-- render:tools -->         in docs/tools/index.md
    <!-- render:last-updated -->  in docs/index.md (build date stamp; stays
                                  current because the site rebuilds nightly
                                  once the Phase 2 pipeline is live)

Verification counts are printed on every build and the hook raises (failing
the build) if totals do not cross-check (CLAUDE.md working rule 2).
"""

from datetime import date
from pathlib import Path

import yaml

TOOLS_MARKER = "<!-- render:tools -->"
CONFERENCES_MARKER = "<!-- render:conferences -->"
LAST_UPDATED_MARKER = "<!-- render:last-updated -->"

CATEGORY_LABELS = {
    "assistants": "Assistants",
    "research": "Research",
    "writing_slides": "Writing and Slides",
    "meetings_transcription": "Meetings and Transcription",
    "media": "Media",
    "local": "Local Models",
}

STATUS_LABELS = {
    "approved": ("Approved", "badge-approved"),
    "conditional": ("Conditional", "badge-conditional"),
    "restricted": ("Restricted", "badge-restricted"),
    "under_review": ("Under review", "badge-under-review"),
}

FORMAT_LABELS = {
    "in_person": "In person",
    "hybrid": "Hybrid",
    "virtual": "Virtual",
}

DEADLINE_BADGE_WINDOW_DAYS = 45


def _data_dir(config) -> Path:
    return Path(config["docs_dir"]).parent / "data"


def _load(path: Path) -> list:
    if not path.exists():
        raise FileNotFoundError(f"render_data hook: missing data file {path}")
    entries = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(entries, list) or not entries:
        raise ValueError(f"render_data hook: {path} did not parse to a non-empty list")
    return entries


def _badge(label: str, css: str, title: str = "") -> str:
    title_attr = f' title="{title}"' if title else ""
    return f'<span class="badge {css}"{title_attr}>{label}</span>'


# --- tools -----------------------------------------------------------------


def _render_tools(config) -> str:
    tools = _load(_data_dir(config) / "tools.yaml")

    by_category: dict[str, list] = {}
    for tool in tools:
        category = tool["category"]
        if category not in CATEGORY_LABELS:
            raise ValueError(f"render_data hook: unknown tool category {category!r}")
        if tool["governance_status"] not in STATUS_LABELS:
            raise ValueError(
                f"render_data hook: unknown governance_status "
                f"{tool['governance_status']!r} on {tool['name']!r}"
            )
        by_category.setdefault(category, []).append(tool)

    lines = []
    rendered = 0
    per_category_counts = {}
    for category, label in CATEGORY_LABELS.items():
        group = by_category.get(category, [])
        if not group:
            continue
        per_category_counts[label] = len(group)
        lines.append(f"## {label}")
        lines.append("")
        lines.append('<div class="tool-grid">')
        for tool in sorted(group, key=lambda t: t["name"].lower()):
            status_label, status_css = STATUS_LABELS[tool["governance_status"]]
            badge = _badge(status_label, status_css, tool.get("status_note", ""))
            lines.append(
                '<div class="tool-card">\n'
                '  <div class="tool-card-head">'
                f'<a href="{tool["url"]}">{tool["name"]}</a>{badge}</div>\n'
                f'  <div class="tool-card-sub">{tool["vendor"]}'
                f'<span class="cost-chip">{tool["cost"]}</span></div>\n'
                f'  <p class="tool-card-blurb">{tool["blurb"]}</p>\n'
                "</div>"
            )
            rendered += 1
        lines.append("</div>")
        lines.append("")

    if rendered != len(tools):
        raise AssertionError(
            f"render_data hook: tools count mismatch, read {len(tools)} "
            f"but rendered {rendered}"
        )

    print("render_data: tools verification")
    print(f"  entries read    : {len(tools)}")
    for label, count in per_category_counts.items():
        print(f"  {label:<16}: {count}")
    print(f"  rendered total  : {rendered} (cross-check ok)")

    return "\n".join(lines)


# --- conferences ------------------------------------------------------------


def _fmt_range(start, end) -> str:
    if isinstance(start, str) or isinstance(end, str):
        return "TBD"
    if start == end:
        return start.strftime("%b %d, %Y").replace(" 0", " ")
    if start.year == end.year and start.month == end.month:
        return f"{start.strftime('%b')} {start.day} to {end.day}, {end.year}"
    if start.year == end.year:
        return (
            f"{start.strftime('%b')} {start.day} to "
            f"{end.strftime('%b')} {end.day}, {end.year}"
        )
    return (
        f"{start.strftime('%b')} {start.day}, {start.year} to "
        f"{end.strftime('%b')} {end.day}, {end.year}"
    )


def _deadline_cell(deadline, today) -> str:
    if deadline == "passed":
        return "Passed"
    if isinstance(deadline, str):  # TBD
        return "TBD"
    if deadline < today:
        return "Passed"
    cell = deadline.strftime("%b %d, %Y").replace(" 0", " ")
    days_left = (deadline - today).days
    if days_left <= DEADLINE_BADGE_WINDOW_DAYS:
        cell += " " + _badge(f"deadline in {days_left} days", "badge-deadline")
    return cell


def _sort_key(conf, today):
    """Ascending by next relevant date; TBD entries last."""
    start = conf["start_date"]
    deadline = conf["abstract_deadline"]
    if isinstance(start, str):  # TBD dates sort last
        return (1, date.max)
    if not isinstance(deadline, str) and deadline >= today:
        return (0, deadline)
    return (0, start)


def _conference_row(conf, today) -> str:
    start, end = conf["start_date"], conf["end_date"]
    name_cell = f"[{conf['name']}]({conf['url']})"
    dates_cell = _fmt_range(start, end)
    if isinstance(start, str):
        dates_cell = "TBD " + _badge("dates unconfirmed", "badge-unconfirmed")
    return (
        f"| {name_cell} | {conf['organizer']} | {dates_cell} | {conf['location']} "
        f"| {FORMAT_LABELS[conf['format']]} "
        f"| {_deadline_cell(conf['abstract_deadline'], today)} |"
    )


CONFERENCE_HEADER = (
    "| Conference | Organizer | Dates | Location | Format | Abstract deadline |\n"
    "| --- | --- | --- | --- | --- | --- |"
)


def _render_conferences(config) -> str:
    conferences = _load(_data_dir(config) / "conferences.yaml")
    today = date.today()

    upcoming, past = [], []
    for conf in conferences:
        if conf["format"] not in FORMAT_LABELS:
            raise ValueError(
                f"render_data hook: unknown format {conf['format']!r} "
                f"on {conf['name']!r}"
            )
        end = conf["end_date"]
        if not isinstance(end, str) and end < today:
            past.append(conf)
        else:
            upcoming.append(conf)

    upcoming.sort(key=lambda c: _sort_key(c, today))
    past.sort(key=lambda c: c["end_date"], reverse=True)

    lines = ["## Upcoming", ""]
    if upcoming:
        lines.append(CONFERENCE_HEADER)
        lines.extend(_conference_row(c, today) for c in upcoming)
    else:
        lines.append("No upcoming events are listed at the moment.")
    lines.append("")

    if past:
        lines.append('??? note "Past events"')
        lines.append("")
        for row in [CONFERENCE_HEADER] + [_conference_row(c, today) for c in past]:
            for inner in row.split("\n"):
                lines.append("    " + inner)
        lines.append("")

    tbd_count = sum(1 for c in upcoming if isinstance(c["start_date"], str))
    if len(upcoming) + len(past) != len(conferences):
        raise AssertionError(
            f"render_data hook: conference count mismatch, read {len(conferences)} "
            f"but split into {len(upcoming)} upcoming + {len(past)} past"
        )

    print("render_data: conferences verification")
    print(f"  entries read : {len(conferences)}")
    print(f"  upcoming     : {len(upcoming)} (of which dates TBD: {tbd_count})")
    print(f"  past         : {len(past)}")
    print(f"  total        : {len(upcoming) + len(past)} (cross-check ok)")

    return "\n".join(lines)


# --- hook entry point -------------------------------------------------------


def on_page_markdown(markdown, page, config, files):
    src = page.file.src_uri
    if src == "tools/index.md":
        if TOOLS_MARKER not in markdown:
            raise AssertionError(
                "render_data hook: tools/index.md is missing the "
                f"{TOOLS_MARKER} marker"
            )
        return markdown.replace(TOOLS_MARKER, _render_tools(config))
    if src == "conferences.md":
        if CONFERENCES_MARKER not in markdown:
            raise AssertionError(
                "render_data hook: conferences.md is missing the "
                f"{CONFERENCES_MARKER} marker"
            )
        return markdown.replace(CONFERENCES_MARKER, _render_conferences(config))
    if src == "index.md" and LAST_UPDATED_MARKER in markdown:
        stamp = date.today().strftime("%B %d, %Y").replace(" 0", " ")
        return markdown.replace(LAST_UPDATED_MARKER, stamp)
    return markdown
