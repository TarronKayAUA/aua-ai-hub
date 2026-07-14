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

import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

import yaml

TOOLS_MARKER = "<!-- render:tools -->"
OPEN_MODELS_MARKER = "<!-- render:open-models -->"
GUIDE_VIDEOS_LOCAL_MARKER = "<!-- render:guide-videos:local -->"
CONFERENCES_MARKER = "<!-- render:conferences -->"
OPPORTUNITIES_MARKER = "<!-- render:opportunities -->"
LAST_UPDATED_MARKER = "<!-- render:last-updated -->"
PROMPTS_MARKER = "<!-- render:prompts -->"
PROMPT_RESOURCES_MARKER = "<!-- render:prompt-resources -->"
COMMITTEE_MARKER = "<!-- render:committee -->"
HARDWARE_ESTIMATOR_MARKER = "<!-- render:hardware-estimator -->"

PROMPT_CATEGORY_LABELS = {
    "research": "Research",
    "mcq_generation": "MCQ Generation",
    "mcq_vetting": "MCQ Vetting",
    "data_analysis": "Data Analysis",
    "content_generation": "Content Generation",
    "study_strategy": "Study Strategy",
}

PROMPT_STATUS_LABELS = {
    "draft": ("Draft", "badge-under-review"),
    "reviewed": ("Reviewed", "badge-approved"),
}

PROMPT_RESOURCE_TYPES = {"video", "guide", "paper"}

CATEGORY_LABELS = {
    "assistants": "Assistants",
    "agents": "Agents",
    "research": "Research",
    "medical_learning": "Medical Learning",
    "presentations_design": "Presentations and Design",
    "image_generation": "Image Generation",
    "video_generation": "Video Generation",
    "music_audio": "Music and Audio",
    "writing_slides": "Writing",
    "meetings_transcription": "Meetings and Transcription",
    "local": "Local Models",
}

# One-line descriptor rendered under every category heading, above the
# collapsed bar, so readers know what they are about to expand. Required:
# the renderer fails on a category without one. Keep each to one short
# sentence; longer guidance belongs in CATEGORY_INTROS below.
CATEGORY_DESCRIPTORS = {
    "assistants": "General-purpose chat assistants for questions, drafting, and analysis.",
    "agents": "Tools that plan and carry out multi-step tasks on your behalf.",
    "research": "Literature search, evidence synthesis, and manuscript checking.",
    "medical_learning": "Practice questions, case work, and tutoring for medical study.",
    "presentations_design": "Slide decks, posters, and visual design.",
    "image_generation": "Still images from text prompts and references.",
    "video_generation": "Short video clips from text or image prompts.",
    "music_audio": "Music, voice, and sound generation.",
    "writing_slides": "Drafting, editing, and grammar support.",
    "meetings_transcription": "Meeting capture, transcription, and notes.",
    "local": "Apps for running open-weights models on your own machine.",
}

# Optional longer guidance that belongs to the category rather than any
# one tool; renders inside the collapsed block, above the cards.
CATEGORY_INTROS = {
    "presentations_design": (
        "To improve an existing PowerPoint deck without rebuilding it, "
        "start with tools that work on the .pptx file itself: PowerPoint "
        "Designer applies suggestions inside the file, and Claude Design "
        "and Canva import a PowerPoint deck and export the result back to "
        "one. Gamma builds in its own format first and its PowerPoint "
        "export can shift layouts; Beautiful.ai also works in its own "
        "format but exports to PowerPoint cleanly."
    ),
}

MODALITY_LABELS = {
    "language": "Language",
    "image": "Image generation",
    "video": "Video generation",
    "audio": "Music and audio",
    "data": "Tabular data",
}

# Same idea for the open-weights modality subsections.
MODALITY_DESCRIPTORS = {
    "language": "Chat, reasoning, and coding model families to run on your own hardware.",
    "image": "Image generators for local or self-hosted pipelines.",
    "video": "Video generators; the heaviest hardware demands on this page.",
    "audio": "Music and sound generation models.",
    "data": "Models for tabular and structured data.",
}

GUIDE_VIDEO_GROUPS = {"agents", "local"}

STATUS_LABELS = {
    "listed": ("Listed", "badge-listed"),
    "licensed": ("Licensed", "badge-licensed"),
    "reviewed": ("Reviewed", "badge-reviewed"),
    "caution": ("Use with caution", "badge-caution"),
    "restricted": ("Restricted", "badge-restricted"),
}

# Standings worth calling out on a collapsed category bar; listed is the
# unmarked default and stays silent.
STATUS_EXCEPTIONS = ("licensed", "reviewed", "caution", "restricted")

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


def _render_hardware_estimator(config) -> str:
    """Data island + container for the hardware estimator widget
    (docs/javascripts/hardware.js), plus a static Q4 sizing table that
    serves as the no-JavaScript fallback and a quick reference. All
    numbers come from data/local_models.yaml and data/hardware_tiers.yaml;
    the widget computes from the same arithmetic the page teaches."""
    models = _load(_data_dir(config) / "local_models.yaml")
    tiers = _load(_data_dir(config) / "hardware_tiers.yaml")
    for m in models:
        if m["arch"] not in ("dense", "moe"):
            raise ValueError(
                f"render_data hook: unknown arch {m['arch']!r} "
                f"on {m['name']!r}")
    payload = json.dumps({"models": models, "tiers": tiers},
                         ensure_ascii=False)
    rows = [
        "<table><thead><tr><th>Model</th><th>Type</th>"
        "<th>Total parameters</th>"
        "<th>Memory needed at Q4 (approx.)</th></tr></thead><tbody>"
    ]
    for m in models:
        need = m["total_b"] * 0.57 + 1.5
        kind = "Mixture-of-experts" if m["arch"] == "moe" else "Dense"
        rows.append(
            f"<tr><td>{m['name']}</td><td>{kind}</td>"
            f"<td>{m['total_b']:g}B</td>"
            f"<td>about {need:.0f} GB</td></tr>")
    rows.append("</tbody></table>")

    print("render_data: hardware estimator verification")
    print(f"  models read : {len(models)}")
    print(f"  tiers read  : {len(tiers)}")
    print(f"  table rows  : {len(rows) - 2} (cross-check "
          f"{'ok' if len(rows) - 2 == len(models) else 'MISMATCH'})")
    if len(rows) - 2 != len(models):
        raise AssertionError(
            "render_data hook: hardware table count mismatch")

    return (
        f'<script type="application/json" id="hw-data">{payload}</script>\n'
        '<div class="hw-estimator" id="hw-estimator"></div>\n\n'
        + "".join(rows) + "\n"
    )


def _favicon_img(url: str) -> str:
    """Tool branding without a new data field: the favicon of the tool's own
    domain via Google's favicon service. Hotlinked third-party images are
    established practice on this site (video thumbnails hotlink i.ytimg.com,
    news thumbnails hotlink publishers). Hidden onerror, so a tool whose
    favicon is unavailable renders a text-only head."""
    domain = urlparse(url).netloc
    return ('<img class="tool-card-icon" '
            f'src="https://www.google.com/s2/favicons?domain={domain}'
            '&amp;sz=64" alt="" loading="lazy" '
            "onerror=\"this.style.display='none'\">")


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
    standing_counts: dict[str, int] = {}
    for category, label in CATEGORY_LABELS.items():
        group = by_category.get(category, [])
        if not group:
            continue
        per_category_counts[label] = len(group)
        lines.append(f"## {label}")
        lines.append("")
        descriptor = CATEGORY_DESCRIPTORS.get(category)
        if not descriptor:
            raise ValueError(
                f"render_data hook: category {category!r} has no descriptor"
            )
        lines.append(descriptor)
        lines.append("")
        # Collapsed by default; the bar advertises the count and every
        # non-listed standing so no signal hides behind the toggle.
        # Arriving by link auto-expands (docs/javascripts/prompts.js).
        exceptions = []
        for standing in STATUS_EXCEPTIONS:
            n = sum(1 for t in group if t["governance_status"] == standing)
            if n:
                exceptions.append(f"{n} {STATUS_LABELS[standing][0].lower()}")
        noun = "tool" if len(group) == 1 else "tools"
        summary = f"Show the {len(group)} {noun}"
        if exceptions:
            summary += f" ({', '.join(exceptions)})"
        lines.append(f'??? abstract "{summary}"')
        lines.append("")
        intro = CATEGORY_INTROS.get(category)
        if intro:
            lines.append(f"    {intro}")
            lines.append("")
        body = ['<div class="tool-grid">']
        for tool in sorted(group, key=lambda t: t["name"].lower()):
            status_label, status_css = STATUS_LABELS[tool["governance_status"]]
            badge = _badge(status_label, status_css, tool.get("status_note", ""))
            body.append(
                '<div class="tool-card">\n'
                '  <div class="tool-card-head">'
                f'<a href="{tool["url"]}">{_favicon_img(tool["url"])}'
                f'{tool["name"]}</a>{badge}</div>\n'
                f'  <div class="tool-card-sub">{tool["vendor"]}'
                f'<span class="cost-chip">{tool["cost"]}</span></div>\n'
                f'  <p class="tool-card-blurb">{tool["blurb"]}</p>\n'
                "</div>"
            )
            rendered += 1
            standing = tool["governance_status"]
            standing_counts[standing] = standing_counts.get(standing, 0) + 1
        body.append("</div>")
        for chunk in body:
            for line in chunk.split("\n"):
                lines.append(f"    {line}" if line else "")
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
    standings = ", ".join(f"{k} {v}" for k, v in sorted(standing_counts.items()))
    print(f"  standings       : {standings}")
    print(f"  rendered total  : {rendered} (cross-check ok)")

    return "\n".join(lines)


def _render_open_models(config) -> str:
    models = _load(_data_dir(config) / "open_models.yaml")

    by_modality: dict[str, list] = {}
    for entry in models:
        modality = entry.get("modality", "language")
        if modality not in MODALITY_LABELS:
            raise ValueError(
                f"render_data hook: unknown modality {modality!r} "
                f"on {entry['name']!r}")
        by_modality.setdefault(modality, []).append(entry)

    lines = []
    rendered = 0
    per_modality = {}
    for modality, label in MODALITY_LABELS.items():
        group = by_modality.get(modality, [])
        if not group:
            continue
        per_modality[label] = len(group)
        lines.append(f"### {label}")
        lines.append("")
        descriptor = MODALITY_DESCRIPTORS.get(modality)
        if not descriptor:
            raise ValueError(
                f"render_data hook: modality {modality!r} has no descriptor"
            )
        lines.append(descriptor)
        lines.append("")
        # Collapsed like the tool categories above; prompts.js expands on
        # arrival by link. Models carry licenses, not statuses, so the bar
        # needs only the count.
        noun = "model family" if len(group) == 1 else "model families"
        lines.append(f'??? abstract "Show the {len(group)} {noun}"')
        lines.append("")
        body = ['<div class="tool-grid">']
        for entry in sorted(group, key=lambda m: m["name"].lower()):
            body.append(
                '<div class="tool-card">\n'
                '  <div class="tool-card-head">'
                f'<a href="{entry["url"]}">{entry["name"]}</a></div>\n'
                f'  <div class="tool-card-sub">{entry["vendor"]}'
                f'<span class="cost-chip">{entry["license"]}</span></div>\n'
                f'  <p class="tool-card-blurb">{entry["blurb"]}</p>\n'
                "</div>"
            )
            rendered += 1
        body.append("</div>")
        for chunk in body:
            for line in chunk.split("\n"):
                lines.append(f"    {line}" if line else "")
        lines.append("")

    print("render_data: open models verification")
    print(f"  entries read : {len(models)}")
    for label, count in per_modality.items():
        print(f"  {label:<16}: {count}")
    print(f"  cards rendered: {rendered} (cross-check "
          f"{'ok' if rendered == len(models) else 'MISMATCH'})")
    if rendered != len(models):
        raise AssertionError("render_data hook: open models count mismatch")
    return "\n".join(lines)


def _youtube_id(url: str) -> str:
    match = re.search(r"[?&]v=([\w-]+)", url)
    if not match:
        raise ValueError(f"render_data hook: cannot derive video id from {url!r}")
    return match.group(1)


def _video_card(url: str, title: str, meta: str, desc: str = "",
                thumbnail: str = "") -> str:
    """One thumbnail card, reusing the pipeline's video-card markup and CSS.
    YouTube thumbnails derive from the video id; an empty thumbnail renders
    a text-only card."""
    if not thumbnail and "youtube.com/watch" in url:
        thumbnail = f"https://i.ytimg.com/vi/{_youtube_id(url)}/hqdefault.jpg"
    img = (f'  <img src="{thumbnail}" alt="Thumbnail: {title}" '
           'loading="lazy">\n') if thumbnail else ""
    desc_part = (f'\n  <span class="video-card-desc">{desc}</span>'
                 if desc else "")
    return (
        f'<a class="video-card" href="{url}" target="_blank" rel="noopener">\n'
        f"{img}"
        f'  <span class="video-card-title">{title}</span>\n'
        f'  <span class="video-card-meta">{meta}</span>{desc_part}\n'
        "</a>"
    )


def _load_guide_videos(config) -> list:
    videos = _load(_data_dir(config) / "guide_videos.yaml")
    for entry in videos:
        if entry["group"] not in GUIDE_VIDEO_GROUPS:
            raise ValueError(
                f"render_data hook: unknown guide video group "
                f"{entry['group']!r} on {entry['title']!r}"
            )
    return videos


def _guide_video_card(entry) -> str:
    note = " ".join(entry["note"].split()) if entry.get("note") else ""
    return _video_card(
        url=entry["url"],
        title=entry["title"],
        meta=f"{entry['channel']}, {entry['length']}, {entry['published']}",
        desc=note,
    )


def _render_guide_videos_group(config, group: str) -> str:
    videos = [v for v in _load_guide_videos(config) if v["group"] == group]
    if not videos:
        raise AssertionError(
            f"render_data hook: no guide videos for group {group!r}"
        )
    print(f"render_data: guide videos verification ({group})")
    print(f"  rendered     : {len(videos)} cards")
    return ('<div class="video-grid">\n'
            + "\n".join(_guide_video_card(v) for v in videos)
            + "\n</div>")


def _render_learning_resources(config, markdown: str) -> str:
    """Replace every render:learning-resources:<section> marker with that
    section's card grid. Every entry must be placed exactly once."""
    entries = _load(_data_dir(config) / "learning_resources.yaml")
    by_section: dict[str, list] = {}
    for entry in entries:
        by_section.setdefault(entry["section"], []).append(entry)
    marker_re = re.compile(r"<!-- render:learning-resources:([\w-]+) -->")
    seen = []

    def _sub(match):
        section = match.group(1)
        if section not in by_section:
            raise AssertionError(
                f"render_data hook: marker for unknown learning resource "
                f"section {section!r}"
            )
        seen.append(section)
        cards = [
            _video_card(
                url=e["url"],
                title=e["title"],
                meta=f"{e['source']}, {e['kind']}",
                desc=" ".join(e["blurb"].split()),
                thumbnail=e.get("thumbnail", ""),
            )
            for e in by_section[section]
        ]
        return '<div class="video-grid">\n' + "\n".join(cards) + "\n</div>"

    markdown = marker_re.sub(_sub, markdown)
    missing = sorted(set(by_section) - set(seen))
    duplicates = sorted({s for s in seen if seen.count(s) > 1})
    if missing or duplicates:
        raise AssertionError(
            f"render_data hook: learning resource placement mismatch "
            f"(missing markers {missing}, duplicate markers {duplicates})"
        )
    placed = sum(len(by_section[s]) for s in seen)
    print("render_data: learning resources verification")
    print(f"  entries read : {len(entries)}")
    print(f"  placed       : {placed} across {len(seen)} sections "
          f"(cross-check {'ok' if placed == len(entries) else 'MISMATCH'})")
    return markdown


def _render_guide_videos_per_tool(config, markdown: str) -> str:
    """Replace every render:guide-videos:agents:<slug> marker with that
    tool's card. The page's markers and the data file's agent slugs must
    match one to one; anything orphaned fails the build."""
    videos = {v["slug"]: v for v in _load_guide_videos(config)
              if v["group"] == "agents"}
    marker_re = re.compile(r"<!-- render:guide-videos:agents:([\w-]+) -->")
    seen = []

    def _sub(match):
        slug = match.group(1)
        if slug not in videos:
            raise AssertionError(
                f"render_data hook: marker for unknown agent video "
                f"slug {slug!r}"
            )
        seen.append(slug)
        return ('<div class="video-grid">\n'
                + _guide_video_card(videos[slug])
                + "\n</div>")

    markdown = marker_re.sub(_sub, markdown)
    missing = sorted(set(videos) - set(seen))
    duplicates = sorted({s for s in seen if seen.count(s) > 1})
    if missing or duplicates:
        raise AssertionError(
            f"render_data hook: agent video placement mismatch "
            f"(missing markers {missing}, duplicate markers {duplicates})"
        )
    print("render_data: guide videos verification (agents)")
    print(f"  rendered     : {len(seen)} per-tool cards (cross-check ok)")
    return markdown


# --- prompt resources ---------------------------------------------------------


def _load_prompt_resources(config) -> dict[str, list]:
    """Load and validate data/prompt_resources.yaml, grouped by category."""
    resources = _load(_data_dir(config) / "prompt_resources.yaml")
    grouped: dict[str, list] = {}
    valid_categories = {"general", *PROMPT_CATEGORY_LABELS}
    for entry in resources:
        category = entry["category"]
        if category not in valid_categories:
            raise ValueError(
                f"render_data hook: unknown resource category {category!r} "
                f"on {entry['title']!r}"
            )
        if entry["type"] not in PROMPT_RESOURCE_TYPES:
            raise ValueError(
                f"render_data hook: unknown resource type {entry['type']!r} "
                f"on {entry['title']!r}"
            )
        grouped.setdefault(category, []).append(entry)
    return grouped


def _resource_meta(entry) -> str:
    if entry["type"] == "video":
        length = f", {entry['length']}" if entry.get("length") else ""
        return f"{entry['source']} video{length}"
    if entry["type"] == "guide":
        return f"{entry['source']} guide"
    return entry["source"]  # paper; source carries "Journal, Year"


def _resource_line(entry) -> str:
    blurb = " ".join(entry["blurb"].split())
    return (f"- **[{entry['title']}]({entry['url']})** "
            f"({_resource_meta(entry)}): {blurb}")


def _render_prompt_resources_general(grouped: dict[str, list]) -> str:
    """General resources render as thumbnail cards (YouTube thumbnails
    derive from the video id; pages carry a verified thumbnail field;
    entries without one render as text-only cards)."""
    cards = [
        _video_card(
            url=entry["url"],
            title=entry["title"],
            meta=_resource_meta(entry),
            desc=" ".join(entry["blurb"].split()),
            thumbnail=entry.get("thumbnail", ""),
        )
        for entry in grouped.get("general", [])
    ]
    return '<div class="video-grid">\n' + "\n".join(cards) + "\n</div>"


# --- prompts ------------------------------------------------------------------


def _prompt_slug(title: str) -> str:
    """Stable anchor for a prompt heading, from the title alone.

    The default toc slug would include the badge text, so a link would
    break the day a prompt's status flips from Draft to Reviewed.
    """
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def _render_prompts(config, resource_groups: dict[str, list]) -> str:
    prompts = _load(_data_dir(config) / "prompts.yaml")

    by_category: dict[str, list] = {}
    for entry in prompts:
        category = entry["category"]
        if category not in PROMPT_CATEGORY_LABELS:
            raise ValueError(
                f"render_data hook: unknown prompt category {category!r}"
            )
        if entry["status"] not in PROMPT_STATUS_LABELS:
            raise ValueError(
                f"render_data hook: unknown prompt status {entry['status']!r}"
            )
        if not entry.get("tagline"):
            raise ValueError(
                f"render_data hook: prompt {entry['title']!r} has no tagline "
                "(required for the at-a-glance table)"
            )
        by_category.setdefault(category, []).append(entry)

    slugs = [_prompt_slug(e["title"]) for e in prompts]
    if len(set(slugs)) != len(slugs):
        raise ValueError("render_data hook: duplicate prompt anchor slugs")

    lines = ["## The library at a glance", ""]
    lines.append("| Prompt | For | Status | What it does |")
    lines.append("| --- | --- | --- | --- |")
    for category, label in PROMPT_CATEGORY_LABELS.items():
        for entry in by_category.get(category, []):
            status_label, _ = PROMPT_STATUS_LABELS[entry["status"]]
            lines.append(
                f"| [{entry['title']}](#{_prompt_slug(entry['title'])}) "
                f"| {entry['audience']} | {status_label} "
                f"| {entry['tagline'].strip()} |"
            )
    lines.append("")

    rendered = 0
    resources_placed = 0
    per_category = {}
    for category, label in PROMPT_CATEGORY_LABELS.items():
        group = by_category.get(category, [])
        if not group:
            continue
        per_category[label] = len(group)
        lines.extend([f"## {label}", ""])
        for entry in group:
            status_label, status_css = PROMPT_STATUS_LABELS[entry["status"]]
            badge = _badge(status_label, status_css)
            audience = _badge(entry["audience"], "badge-unconfirmed")
            slug = _prompt_slug(entry["title"])
            lines.append(
                f"### {entry['title']} {badge} {audience} "
                f"{{: #{slug} data-toc-label=\"{entry['title']}\" }}"
            )
            lines.append("")
            if entry.get("notes"):
                lines.append(f"*{entry['notes'].strip()}*")
                lines.append("")
            lines.append('??? example "Show the prompt"')
            lines.append("")
            lines.append("    ```text")
            for prompt_line in entry["prompt"].rstrip().split("\n"):
                lines.append(f"    {prompt_line}" if prompt_line else "")
            lines.append("    ```")
            lines.append("")
            rendered += 1
        category_resources = resource_groups.get(category, [])
        if category_resources:
            lines.append("**Further reading**")
            lines.append("")
            lines.extend(_resource_line(e) for e in category_resources)
            lines.append("")
            resources_placed += len(category_resources)

    if rendered != len(prompts):
        raise AssertionError(
            f"render_data hook: prompts count mismatch, read {len(prompts)} "
            f"but rendered {rendered}"
        )
    expected_resources = sum(
        len(v) for k, v in resource_groups.items() if k != "general"
    )
    if resources_placed != expected_resources:
        raise AssertionError(
            f"render_data hook: prompt resources mismatch, "
            f"{expected_resources} category resources read but "
            f"{resources_placed} placed (a resource may point at a category "
            f"with no prompts)"
        )

    print("render_data: prompts verification")
    print(f"  entries read : {len(prompts)}")
    for label, count in per_category.items():
        print(f"  {label:<18}: {count}")
    print(f"  rendered total: {rendered} (cross-check ok)")
    print(f"  resources: general {len(resource_groups.get('general', []))}, "
          f"per-category {resources_placed} (cross-check ok)")
    return "\n".join(lines)


# --- committee work and polls ---------------------------------------------------

COMMITTEE_WORK_MARKER = "<!-- render:committee-work -->"
POLLS_MARKER = "<!-- render:polls -->"


def _render_committee_work(config) -> str:
    projects = _load(_data_dir(config) / "committee_work.yaml")
    lines = []
    for entry in projects:
        summary = " ".join(entry["summary"].split())
        lines.append(
            f"**{entry['project']}** "
            + _badge(entry["status"], "badge-under-review")
            + f"\n: {summary} *(updated {entry['updated']})*\n"
        )
    print("render_data: committee work verification")
    print(f"  projects read : {len(projects)}")
    print(f"  rendered      : {len(lines)} (cross-check "
          f"{'ok' if len(lines) == len(projects) else 'MISMATCH'})")
    if len(lines) != len(projects):
        raise AssertionError("render_data hook: committee work count mismatch")
    return "\n".join(lines)


def _render_polls(config) -> str:
    path = _data_dir(config) / "polls.yaml"
    data = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    active = data.get("active") or []
    closed = data.get("closed") or []
    lines = []
    if active:
        for poll in active:
            note = f" {poll['note']}" if poll.get("note") else ""
            lines.append(
                # Committee polls are restricted to the AUA organization in
                # Forms (owner-confirmed 2026-06-11). If a public poll ever
                # runs, move this sentence into a per-poll field.
                f'!!! question "The AI Committee is asking"\n'
                f"    **{poll['question']}**{note} Responses are collected "
                f"through Microsoft Forms, need an AUA account to access, "
                f"and take under a minute.\n\n"
                f"    [Answer the poll]({poll['url']})"
                f"{{ .md-button .md-button--primary }} "
                f"*Closes {poll['closes']}.*"
            )
    else:
        lines.append(
            "No poll is open right now. New polls from the AI Committee "
            "are announced here, and results are reported on the "
            "[Committee Updates](../governance/updates.md) page."
        )
    if closed:
        lines.append("")
        lines.append('??? note "Past polls"')
        lines.append("")
        for poll in closed:
            lines.append(f"    - **{poll['question']}** {poll['outcome']}")
    print("render_data: polls verification")
    print(f"  active: {len(active)}, closed: {len(closed)}")
    return "\n".join(lines)


# --- committee ----------------------------------------------------------------


def _render_committee(config) -> str:
    members = _load(_data_dir(config) / "committee.yaml")

    cards = []
    for member in members:
        role = member["committee_role"]
        role_css = "badge-approved" if role == "Chair" else (
            "badge-conditional" if role == "Student Representative"
            else "badge-under-review")
        lines = "".join(
            f'<span class="committee-line">{line}</span>'
            for line in member.get("lines", [])
        )
        cards.append(
            '<div class="committee-card">\n'
            f'  <img src="../../assets/committee/{member["photo"]}" '
            f'alt="Portrait of {member["name"]}" loading="lazy">\n'
            f'  <span class="committee-name">{member["name"]}</span>\n'
            f'  {_badge(role, role_css)}\n'
            f'  {lines}\n'
            "</div>"
        )

    print("render_data: committee verification")
    print(f"  members read : {len(members)}")
    print(f"  cards rendered: {len(cards)} (cross-check "
          f"{'ok' if len(cards) == len(members) else 'MISMATCH'})")
    if len(cards) != len(members):
        raise AssertionError("render_data hook: committee count mismatch")
    return ('<div class="committee-grid">\n' + "\n".join(cards) + "\n</div>")


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
        if days_left == 0:
            label = "closes today"
        elif days_left == 1:
            label = "closes tomorrow"
        else:
            label = f"closes in {days_left} days"
        cell += " " + _badge(label, "badge-deadline")
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

OPPORTUNITY_TYPE_LABELS = {
    "buildathon": "Buildathon",
    "hackathon": "Hackathon",
    "challenge": "Challenge",
    "datathon": "Datathon",
    "competition": "Competition",
    "fellowship": "Fellowship",
    "program": "Program",
}

OPPORTUNITY_HEADER = (
    "| Opportunity | Type | Application deadline | Event dates | Format "
    "| Eligibility |\n"
    "| --- | --- | --- | --- | --- | --- |"
)


def _opportunity_deadline_cell(deadline, today) -> str:
    # String deadlines ("Rolling", "TBD", "Closed") render verbatim;
    # date deadlines get the conference-style countdown badge and flip
    # to Passed on their own.
    if isinstance(deadline, str):
        return deadline
    return _deadline_cell(deadline, today)


def _opportunity_row(opp, today) -> str:
    detail = " ".join(str(opp["relevance"]).split())
    if opp.get("support"):
        detail += " " + " ".join(str(opp["support"]).split())
    name_cell = (
        f"[{opp['name']}]({opp['url']})<br>"
        f"<small>{opp['organizer']}. {detail}</small>"
    )
    start, end = opp.get("start_date"), opp.get("end_date")
    dates_cell = _fmt_range(start, end) if start and end else (
        "TBD" if isinstance(start, str) else "See site")
    return (
        f"| {name_cell} | {OPPORTUNITY_TYPE_LABELS[opp['type']]} "
        f"| {_opportunity_deadline_cell(opp['deadline'], today)} "
        f"| {dates_cell} | {FORMAT_LABELS[opp['format']]} "
        f"| {opp['eligibility']} |"
    )


def _opportunity_sort_key(opp, today):
    """Ascending by next relevant date; undated entries last."""
    deadline, start = opp["deadline"], opp.get("start_date")
    if not isinstance(deadline, str) and deadline >= today:
        return (0, deadline)
    if start and not isinstance(start, str):
        return (0, start)
    return (1, date.max)


def _render_opportunities(config) -> str:
    opportunities = _load(_data_dir(config) / "opportunities.yaml")
    today = date.today()

    required = ("name", "url", "organizer", "type", "format",
                "eligibility", "deadline", "relevance", "verified")
    open_now, past = [], []
    for opp in opportunities:
        for field in required:
            if not opp.get(field):
                raise ValueError(
                    f"render_data hook: opportunity "
                    f"{opp.get('name', '?')!r} is missing {field!r}"
                )
        if opp["type"] not in OPPORTUNITY_TYPE_LABELS:
            raise ValueError(
                f"render_data hook: unknown opportunity type "
                f"{opp['type']!r} on {opp['name']!r}"
            )
        if opp["format"] not in FORMAT_LABELS:
            raise ValueError(
                f"render_data hook: unknown format {opp['format']!r} "
                f"on {opp['name']!r}"
            )
        deadline, end = opp["deadline"], opp.get("end_date")
        deadline_passed = (not isinstance(deadline, str)
                           and deadline < today)
        event_over = end is not None and not isinstance(end, str) \
            and end < today
        closed = str(deadline).lower() == "closed"
        if event_over or closed or (deadline_passed and end is None):
            past.append(opp)
        else:
            open_now.append(opp)

    open_now.sort(key=lambda o: _opportunity_sort_key(o, today))
    past.sort(key=lambda o: str(o.get("end_date") or o["deadline"]),
              reverse=True)

    lines = ["## Open and upcoming", ""]
    if open_now:
        lines.append(OPPORTUNITY_HEADER)
        lines.extend(_opportunity_row(o, today) for o in open_now)
    else:
        lines.append(
            "No open opportunities are listed at the moment. Know of "
            "one? See the note below."
        )
    lines.append("")

    if past:
        lines.append('??? note "Past opportunities"')
        lines.append("")
        for row in [OPPORTUNITY_HEADER] + [
            _opportunity_row(o, today) for o in past
        ]:
            for inner in row.split("\n"):
                lines.append("    " + inner)
        lines.append("")

    if len(open_now) + len(past) != len(opportunities):
        raise AssertionError(
            f"render_data hook: opportunity count mismatch, read "
            f"{len(opportunities)} but split into {len(open_now)} open "
            f"+ {len(past)} past"
        )

    print("render_data: opportunities verification")
    print(f"  entries read : {len(opportunities)}")
    print(f"  open         : {len(open_now)}")
    print(f"  past         : {len(past)}")
    print(f"  total        : {len(open_now) + len(past)} (cross-check ok)")

    return "\n".join(lines)


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


def _reviewed_footer(meta, src: str) -> str:
    """Freshness line for pages enrolled in prose page review (owner
    approved 2026-07-09): surfaces the last_reviewed front-matter date
    that the weekly machine review keeps current. Returns "" for pages
    without the key. The About link is a markdown link (source-relative)
    so MkDocs rewrites and validates it; raw HTML hrefs would not be."""
    reviewed = (meta or {}).get("last_reviewed")
    if not reviewed:
        return ""
    if isinstance(reviewed, str):
        reviewed = date.fromisoformat(reviewed)
    stamp = f"{reviewed.strftime('%B')} {reviewed.day}, {reviewed.year}"
    about = "../" * src.count("/") + "about.md"
    return (f'\n\n<p class="page-reviewed" markdown>Content last reviewed '
            f'{stamp}. Review dates are maintained as described on the '
            f'[About page]({about}).</p>\n')


def on_page_markdown(markdown, page, config, files):
    src = page.file.src_uri
    markdown += _reviewed_footer(page.meta, src)
    if src == "tools/index.md":
        for marker in (TOOLS_MARKER, OPEN_MODELS_MARKER):
            if marker not in markdown:
                raise AssertionError(
                    f"render_data hook: tools/index.md is missing the "
                    f"{marker} marker"
                )
        markdown = markdown.replace(TOOLS_MARKER, _render_tools(config))
        return markdown.replace(OPEN_MODELS_MARKER, _render_open_models(config))
    if src == "tools/agents.md":
        return _render_guide_videos_per_tool(config, markdown)
    if src == "learning/index.md":
        return _render_learning_resources(config, markdown)
    if src == "tools/local.md":
        if GUIDE_VIDEOS_LOCAL_MARKER not in markdown:
            raise AssertionError(
                "render_data hook: tools/local.md is missing the "
                f"{GUIDE_VIDEOS_LOCAL_MARKER} marker"
            )
        return markdown.replace(
            GUIDE_VIDEOS_LOCAL_MARKER,
            _render_guide_videos_group(config, "local"),
        )
    if src == "tools/hardware.md":
        if HARDWARE_ESTIMATOR_MARKER not in markdown:
            raise AssertionError(
                "render_data hook: tools/hardware.md is missing the "
                f"{HARDWARE_ESTIMATOR_MARKER} marker"
            )
        return markdown.replace(
            HARDWARE_ESTIMATOR_MARKER, _render_hardware_estimator(config)
        )
    if src == "conferences.md":
        if CONFERENCES_MARKER not in markdown:
            raise AssertionError(
                "render_data hook: conferences.md is missing the "
                f"{CONFERENCES_MARKER} marker"
            )
        return markdown.replace(CONFERENCES_MARKER, _render_conferences(config))
    if src == "opportunities.md":
        if OPPORTUNITIES_MARKER not in markdown:
            raise AssertionError(
                "render_data hook: opportunities.md is missing the "
                f"{OPPORTUNITIES_MARKER} marker"
            )
        return markdown.replace(
            OPPORTUNITIES_MARKER, _render_opportunities(config)
        )
    if src == "governance/updates.md":
        if COMMITTEE_WORK_MARKER not in markdown:
            raise AssertionError(
                "render_data hook: governance/updates.md is missing the "
                f"{COMMITTEE_WORK_MARKER} marker"
            )
        return markdown.replace(
            COMMITTEE_WORK_MARKER, _render_committee_work(config)
        )
    if src == "announcements/index.md":
        if POLLS_MARKER not in markdown:
            raise AssertionError(
                "render_data hook: announcements/index.md is missing the "
                f"{POLLS_MARKER} marker"
            )
        return markdown.replace(POLLS_MARKER, _render_polls(config))
    if src == "governance/committee.md":
        if COMMITTEE_MARKER not in markdown:
            raise AssertionError(
                "render_data hook: governance/committee.md is missing the "
                f"{COMMITTEE_MARKER} marker"
            )
        return markdown.replace(COMMITTEE_MARKER, _render_committee(config))
    if src == "prompts/index.md":
        if PROMPTS_MARKER not in markdown:
            raise AssertionError(
                f"render_data hook: prompts/index.md is missing the "
                f"{PROMPTS_MARKER} marker"
            )
        resource_groups = _load_prompt_resources(config)
        return markdown.replace(
            PROMPTS_MARKER, _render_prompts(config, resource_groups)
        )
    if src == "prompts/learning.md":
        if PROMPT_RESOURCES_MARKER not in markdown:
            raise AssertionError(
                f"render_data hook: prompts/learning.md is missing the "
                f"{PROMPT_RESOURCES_MARKER} marker"
            )
        resource_groups = _load_prompt_resources(config)
        return markdown.replace(
            PROMPT_RESOURCES_MARKER,
            _render_prompt_resources_general(resource_groups),
        )
    if src == "index.md" and LAST_UPDATED_MARKER in markdown:
        stamp = date.today().strftime("%B %d, %Y").replace(" 0", " ")
        return markdown.replace(LAST_UPDATED_MARKER, stamp)
    return markdown
