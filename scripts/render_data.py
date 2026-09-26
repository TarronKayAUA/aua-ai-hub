"""MkDocs hook that renders data/conferences.yaml and data/tools.yaml into pages.

Registered under `hooks:` in mkdocs.yml, so it runs inside both `mkdocs serve`
and `mkdocs build --strict` with no separate pre-build step. It replaces marker
comments in hand-authored pages with markdown rendered from YAML, in memory
only: nothing generated is written into the docs/ source tree.

Markers:
    <!-- render:conferences -->   in docs/conferences.md
    <!-- render:tools -->         in docs/tools/index.md (also tool-chooser,
                                  tool-access and open-models there)
    <!-- render:last-updated -->  in docs/index.md (build date stamp; stays
                                  current because the site rebuilds nightly
                                  once the Phase 2 pipeline is live)

Verification counts are printed on every build and the hook raises (failing
the build) if totals do not cross-check (CLAUDE.md working rule 2).
"""

import html
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

import yaml

from narration_common import (NEWS_PAGES, STATIC_PAGES, audio_exists, brief_slug,
                              digest_slug, page_slug, player_html,
                              static_audio_current)

TOOLS_MARKER = "<!-- render:tools -->"
OPEN_MODELS_MARKER = "<!-- render:open-models -->"
GUIDE_VIDEOS_LOCAL_MARKER = "<!-- render:guide-videos:local -->"
CONFERENCES_MARKER = "<!-- render:conferences -->"
OPPORTUNITIES_MARKER = "<!-- render:opportunities -->"
PROMPTS_MARKER = "<!-- render:prompts -->"
PROMPT_RESOURCES_MARKER = "<!-- render:prompt-resources -->"
SKILLS_MARKER = "<!-- render:skills -->"
COMMITTEE_MARKER = "<!-- render:committee -->"
HARDWARE_ESTIMATOR_MARKER = "<!-- render:hardware-estimator -->"
NEXT_TOKEN_MARKER = "<!-- render:next-token-demo -->"
TOOL_CHOOSER_MARKER = "<!-- render:tool-chooser -->"
GLOSSARY_AZ_MARKER = "<!-- render:glossary-az -->"
DIGEST_PAGE_RE = re.compile(r"news/archive/(\d{4})-w(\d{2})\.md")

PROMPT_CATEGORY_LABELS = {
    "research": "Research",
    "mcq_generation": "Multiple-Choice Question (MCQ) Writing",
    "mcq_vetting": "MCQ Review",
    "data_analysis": "Data Analysis",
    "content_generation": "Content Generation",
    "feedback": "Feedback on Student Work",
    "study_strategy": "Study Strategy",
    "residency": "Residency Applications",
}

# Display labels for the prompts.yaml audience field, which stores lowercase
# keys (2026-09-22 audit: the at-a-glance table printed "both" and
# "faculty" verbatim).
PROMPT_AUDIENCE_LABELS = {
    "faculty": "Faculty",
    "students": "Students",
    "both": "Faculty and students",
}

# Chip text for the prompt library chooser (owner approved 2026-09-23):
# short, sentence case, one per PROMPT_CATEGORY_LABELS key (checked at
# render time), since the section headings are too long for a pill.
PROMPT_CATEGORY_CHIPS = {
    "research": "Research",
    "mcq_generation": "Write MCQs",
    "mcq_vetting": "Review MCQs",
    "data_analysis": "Analyze data",
    "content_generation": "Make teaching content",
    "feedback": "Give feedback",
    "study_strategy": "Study",
    "residency": "Residency",
}

# Landing shortcuts (navigation synthesis, 2026-09-26): the categories the Tools &
# Prompts landing offers as one-click entries into the library, in this
# order, each with the audience its link pre-selects (None for both). A
# presentation flag only: which prompts a category holds, and how many,
# still come from data/prompts.yaml.
PROMPT_CATEGORY_LANDING = {
    "study_strategy": "students",
    "mcq_generation": "faculty",
    "mcq_vetting": "faculty",
    "research": None,
    "content_generation": None,
    "feedback": None,
}

# The quiet line under each library row and the meta line on each prompt
# page (layout redesign, 2026-09-25): plain words, not badge pills, so a
# status never looks like a button or an endorsement.
PROMPT_AUDIENCE_META = {
    "faculty": "For faculty",
    "students": "For students",
    "both": "For faculty and students",
}

# Section order when the library is filtered to one audience (layout
# redesign L16, 2026-09-25): students see Study first, then Residency, then
# the rest in PROMPT_CATEGORY_LABELS order. An audience not named here, and
# the unfiltered library, keep PROMPT_CATEGORY_LABELS order.
PROMPT_AUDIENCE_FIRST = {
    "students": ("study_strategy", "residency"),
}

# Addresses a generated prompt page may not take, because a hand-authored
# page in docs/prompts/ already serves there.
PROMPT_RESERVED_SLUGS = {"index", "learning", "exchange"}

# Most steps "How to use it" shows on a prompt page (the design calls for
# three; a longer list stops being a quick start).
PROMPT_USE_MAX_STEPS = 4


def _long_date(value) -> str:
    """A checked date as readers write it (September 22, 2026), not ISO."""
    if hasattr(value, "strftime"):
        return f"{value:%B} {value.day}, {value.year}"
    return str(value)


PROMPT_STATUS_LABELS = {
    "draft": ("Draft", "badge-under-review"),
    "reviewed": ("Reviewed", "badge-reviewed"),
}

# Skill provenance is the safety-relevant fact about a skill, so it is
# what the roster badges (2026-08-19). The three values are the only
# sources data/skills.yaml admits; see that file's header for why.
SKILL_PROVENANCE_LABELS = {
    "builtin": ("Built in", "badge-approved"),
    "anthropic": ("From Anthropic", "badge-reviewed"),
    "aua": ("Written at AUA", "badge-licensed"),
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

# One-line descriptor for every category: the first line inside its row
# once opened (the rows themselves are one line each since the layout
# redesign, 2026-09-25). Required: the renderer fails on a category without
# one. Keep each to one short sentence; longer guidance belongs in
# CATEGORY_INTROS below.
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
    "agents": (
        "The [AI Agents field guide](agents.md) frames this category: what "
        "agents are good and bad at, what to watch for, and where to start. "
        "[Your First Agent Session](first-session.md) runs one in 20 minutes."
    ),
    "research": (
        "[AI for Research](research.md) maps these tools to each stage of a "
        "project, starting with Scopus with AI, licensed through the AUA "
        "Library; [Gemini Notebook]"
        "(gemini-notebook.md) has its own guide because it works from your "
        "own uploads rather than the open web."
    ),
    "local": (
        "[Running Models Locally](local.md) is the walkthrough for these "
        "apps, and [Hardware for Local AI](hardware.md) sizes the machine."
    ),
    "presentations_design": (
        "To improve an existing PowerPoint deck without rebuilding it, "
        "start with tools that work on the .pptx file itself: PowerPoint "
        "Design Suggestions applies suggestions inside the file, and Claude Design "
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
    "language": "Chat, reasoning, and coding model families, from laptop-sized models to data-center scale.",
    "image": "Image generators for local or self-hosted pipelines.",
    "video": "Video generators for local or self-hosted pipelines, generally needing more video memory than image models.",
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

# Short meanings for the task chooser's standings line, worded from the
# "How to read the statuses" legend on docs/tools/index.md; order is the
# order a mixed line lists them in.
STATUS_SHORT = {
    "licensed": "procured by the university",
    "reviewed": "examined by the AI Committee; see the note on the card",
    "caution": "see the note on the card",
    "restricted": "found unsuitable for institutional use",
}

# Cost values a card may print (SPEC section 6, plus the AUA-licensed label
# Scopus with AI carries). Anything else fails the build rather than
# printing an unexplained word on a card; the directory's legend explains
# each one. The "Where to start" note spells out the one label a newcomer
# cannot act on as written.
COST_LABELS = ("free", "freemium", "paid", "institutional", "AUA-licensed")
COST_WORDS = {"institutional": "needs an organization's license"}
COST_WORDS_SHARED = {"institutional": "need an organization's license"}

# "What AUA provides" on a card (layout redesign, 2026-09-25, from the
# independent review's point that availability, approval and cost must not
# blur): confirmed institutional access (status licensed, or the
# AUA-licensed cost label) is kept apart from tools that need SOME
# organization's license, so an Institutional label is never read as a
# promise of AUA access. Nothing on the site establishes whether AUA holds
# those licenses (owner decision 8 in the navigation plan), so the second
# line asserts neither answer.
ACCESS_LINES = {
    "licensed": "access, through a university license.",
    "institutional": "not confirmed. This tool needs an organization's license.",
}

# The label on the decision aid above a task's results. It is editorial,
# drawn from each tool's own description and this site's guides, so it is
# set apart from the status tags and says it is not an endorsement.
START_LABEL = "Where to start"
START_QUALIFIER = "suggestions, not endorsements"
# One line under the label saying how the suggestions were chosen, so an
# editorial pick is not read as a committee review (DRAFT wording for the
# owner's sign-off, 2026-09-26, restating the rule in data/tool_tasks.yaml:
# every reason restates the tool's own description or a guide on this
# site, and none is a quality ranking).
START_BASIS = ("Each is picked because its description here, or a guide on this "
               "site, says it fits the task; not a ranking or an AI Committee "
               "review.")

# What a card's "Checked" date means, said on the first card of each grid
# (layout-tools.css hides it on the rest): the listing's details were
# checked, not the tool. The weekly content watch may set the date itself,
# so it says nothing about who checked (see the tool-card-checked rule in
# extra.css).
CHECKED_MEANS = ("the date this listing's details (link, description, and "
                 "cost) were last checked; not a review of the tool")

TOOL_ACCESS_MARKER = "<!-- render:tool-access -->"

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


def _render_next_token_demo(config) -> str:
    """Container, controls and data island for the next-token stepper
    (docs/javascripts/next-token.js) on basics/how-llms-work.md, owner
    approved 2026-09-23. Every word a reader sees comes from
    data/next_token_demo.yaml except the button labels; the checks below
    are the rules stated in that file's header. The marker is an HTML
    comment, which the narration extractor strips, so adding or changing
    the demo never changes the page's spoken text."""
    path = _data_dir(config) / "next_token_demo.yaml"
    if not path.exists():
        raise FileNotFoundError(f"render_data hook: missing data file {path}")
    demo = yaml.safe_load(path.read_text(encoding="utf-8"))
    scenarios = demo["scenarios"]
    if len(scenarios) < 2:
        raise ValueError("render_data hook: next_token_demo needs two scenarios")
    n_steps = len(scenarios[0]["steps"])
    payload = {"start_note": demo["start_note"], "scenarios": {}}
    for sc in scenarios:
        if len(sc["steps"]) != n_steps:
            raise ValueError(
                f"render_data hook: next_token_demo scenario {sc['key']!r} has "
                f"{len(sc['steps'])} steps, expected {n_steps}")
        steps = []
        for i, step in enumerate(sc["steps"], 1):
            pcts = [int(p) for _, p in step["cands"]]
            total = sum(pcts) + int(step.get("other", 0))
            if total != 100:
                raise ValueError(
                    f"render_data hook: next_token_demo {sc['key']} step {i} "
                    f"sums to {total}, not 100")
            if pcts != sorted(pcts, reverse=True):
                raise ValueError(
                    f"render_data hook: next_token_demo {sc['key']} step {i} "
                    "candidates are not listed most likely first")
            steps.append({"cands": [[str(t), int(p)] for t, p in step["cands"]],
                          "other": int(step.get("other", 0)),
                          "otherLabel": step.get("other_label", "everything else"),
                          "note": step["note"]})
        payload["scenarios"][sc["key"]] = {"label": sc["label"], "steps": steps,
                                          "final": sc["final"]}
    blob = json.dumps(payload, ensure_ascii=False)
    if "\u2014" in blob or "\u2014" in json.dumps(demo, ensure_ascii=False):
        raise ValueError("render_data hook: em dash in next_token_demo.yaml")
    # A literal "</" inside the island would end the script element early.
    blob = blob.replace("</", "<\\/")

    chips = []
    for i, sc in enumerate(scenarios):
        active = i == 0
        chips.append(
            f'<button type="button" class="nt-chip{" is-active" if active else ""}" '
            f'data-scenario="{html.escape(sc["key"])}" '
            f'aria-pressed="{"true" if active else "false"}">'
            f'{html.escape(sc["label"])}</button>')
    print("render_data: next-token demo verification")
    print(f"  scenarios   : {len(scenarios)}")
    print(f"  steps each  : {n_steps} (all sum to 100)")
    esc = html.escape
    return (
        '<div class="nt-demo" id="nt-demo" markdown="0">\n'
        f'<p class="nt-title">{esc(demo["title"])}</p>\n'
        '<div class="nt-scenarios" role="group" aria-label="What the model can see">\n'
        + "\n".join(chips) + "\n</div>\n"
        '<div class="nt-context">\n'
        '<span class="nt-label">You asked</span>\n'
        f'<span class="nt-ask">{esc(demo["ask"])}</span>\n'
        f'<span class="nt-attach" hidden>{esc(demo["attachment"])}</span>\n'
        '</div>\n'
        '<div class="nt-reply">\n'
        '<span class="nt-label">Reply so far</span>\n'
        '<span class="nt-text"></span><span class="nt-caret" aria-hidden="true"></span>\n'
        '</div>\n'
        '<div class="nt-weigh">\n'
        '<span class="nt-label nt-weigh-label">What the model will weigh</span>\n'
        '<ul class="nt-cands"></ul>\n'
        f'<p class="nt-note">{esc(demo["start_note"])}</p>\n'
        '<p class="nt-final" hidden></p>\n'
        '</div>\n'
        '<div class="nt-controls">\n'
        '<button type="button" class="nt-next">Next token</button>\n'
        '<button type="button" class="nt-reset">Start over</button>\n'
        f'<span class="nt-count">Token 0 of {n_steps}</span>\n'
        '</div>\n'
        '<p class="nt-status" role="status" aria-live="polite"></p>\n'
        f'<p class="nt-disclaimer">{esc(demo["disclaimer"])}</p>\n'
        f'<noscript><p class="nt-note">{esc(demo["noscript"])}</p></noscript>\n'
        f'<script type="application/json" id="nt-data">{blob}</script>\n'
        '</div>\n'
    )


def _digest_week_label(name: str) -> str:
    year, week = name.removesuffix(".md").split("-w")
    return f"Week {int(week)}, {year}"


def _digest_page(src: str, markdown: str, config) -> str:
    """Weekly digest pages (news/archive/YYYY-wNN.md) are generated once, sit
    outside the nav, and had no way back to the rest of the site; their
    browser and search title also read "2026 w38", because MkDocs takes a
    page title from the H1 only when the H1 comes first and the GENERATED
    comment sat above it (2026-09-23 navigation review). Both are fixed
    here at build time rather than by rewriting generated files, so every
    existing week is covered and new ones need nothing: the comment is left
    out of the rendered page (it stays in the source), and a line linking
    the previous week, the archive and the next week goes under the H1 and
    at the foot of the page."""
    weeks = sorted(p.name for p in (Path(config["docs_dir"]) / "news" / "archive").glob("*-w*.md"))
    name = Path(src).name
    i = weeks.index(name)
    parts = []
    if i > 0:
        parts.append(f"[\u2190 {_digest_week_label(weeks[i - 1])}]({weeks[i - 1]})")
    parts.append("[All weeks in the News Archive](index.md)")
    if i + 1 < len(weeks):
        parts.append(f"[{_digest_week_label(weeks[i + 1])} \u2192]({weeks[i + 1]})")
    nav = " \u00b7 ".join(parts) + "\n{: .digest-nav }"
    markdown = re.sub(r"\A\s*<!-- GENERATED[^\n]*-->[ \t]*\n", "", markdown)
    h1 = re.search(r"^# .+$", markdown, flags=re.MULTILINE)
    if not h1:
        raise AssertionError(f"render_data hook: {src} has no H1")
    if h1.start() != len(markdown) - len(markdown.lstrip()):
        raise AssertionError(f"render_data hook: {src} H1 is not the first block")
    markdown = markdown[:h1.end()] + "\n\n" + nav + "\n" + markdown[h1.end():]
    return markdown.rstrip("\n") + "\n\n" + nav + "\n"


def _render_glossary_az(markdown: str) -> str:
    """A to Z jump row for basics/glossary.md (owner approved 2026-09-23).
    Built from the glossary's own term headings at build time, so a new
    term needs no second edit: each letter links to its first term, using
    the same slug function MkDocs' toc extension gives the heading (or the
    heading's pinned {: #id }), and letters with no terms render as plain,
    dimmed text hidden from screen readers. The page promises that entries
    are alphabetized, and the first-of-letter links depend on it, so an
    out-of-order term fails the build."""
    from markdown.extensions.toc import slugify
    if '<div class="glossary" markdown>' not in markdown:
        raise AssertionError("render_data hook: glossary wrapper div not found")
    body = markdown.split('<div class="glossary" markdown>', 1)[1]
    terms = []
    for m in re.finditer(r"^## (.+?)(?:\s*\{:\s*#([\w-]+)[^}]*\})?\s*$", body, flags=re.MULTILINE):
        terms.append((m.group(1).strip(), m.group(2) or slugify(m.group(1).strip(), "-")))
    names = [name.lower() for name, _ in terms]
    if names != sorted(names):
        bad = next(n for n, s in zip(names, sorted(names)) if n != s)
        raise AssertionError(f"render_data hook: glossary terms are not alphabetized "
                             f"(first out of place: {bad!r})")
    first: dict[str, str] = {}
    for name, anchor in terms:
        letter = name[0].upper()
        if letter.isalpha():
            first.setdefault(letter, anchor)
    parts = []
    for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ":
        if letter in first:
            parts.append(f'<a href="#{first[letter]}">{letter}</a>')
        else:
            parts.append(f'<span class="is-empty" aria-hidden="true">{letter}</span>')
    print("render_data: glossary A to Z verification")
    print(f"  terms read   : {len(terms)} (alphabetized)")
    print(f"  letters used : {len(first)} of 26")
    return ('<nav class="glossary-az" aria-label="Jump to a letter in the glossary">'
            + "".join(parts) + "</nav>")


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


# The standing sentence 56 listings used to carry (removed from the data
# 2026-09-23; the non-endorsement point is said once, in the directory
# legend and on About). Still stripped so a pasted-back copy never reaches
# a card; only what a note says BEYOND it goes on the card.
BOILERPLATE_NOTE = ("Listed for discovery, not endorsement; "
                    "the policy's data rules apply.")


def _card_note(note: str) -> str:
    """The part of a status note that belongs on the card, or "".

    Status notes were reachable only as a badge tooltip until 2026-09-08, so
    touch and keyboard users could not read them and they were absent from
    the search index, while the page told readers to "hover any badge" and
    the caution row told them to read the note before using the tool. On a
    phone neither instruction could be followed. Nineteen of the 75 notes
    carry something real: documented-consent requirements for avatar and
    voice tools, services operated from China, credential limits, ongoing
    litigation. Those are exactly the entries where hover-only mattered most.

    The tooltip is deliberately left in place: this is additive, so nothing a
    reader can reach today stops being reachable.
    """
    text = (note or "").strip()
    if text.startswith(BOILERPLATE_NOTE):
        text = text[len(BOILERPLATE_NOTE):].strip()
    return text


def _tool_anchor(name: str) -> str:
    """Stable card id, e.g. "tool-gemini-notebook". The task chooser links
    to cards by it, and other pages may. Renaming a tool changes its
    anchor; duplicates fail the build in _render_tools."""
    return "tool-" + re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _join_names(names: list[str], conj: str = "and") -> str:
    if len(names) <= 1:
        return "".join(names)
    if len(names) == 2:
        return f"{names[0]} {conj} {names[1]}"
    return ", ".join(names[:-1]) + f", {conj} {names[-1]}"


_NUMBER_WORDS = ("No", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
                 "Eight", "Nine")


def _number_word(n: int) -> str:
    """Sentence-initial count: "One", "Three", or digits from 10."""
    return _NUMBER_WORDS[n] if n < len(_NUMBER_WORDS) else str(n)


def _tool_access(tool: dict) -> str:
    """Which "What AUA provides" line a card carries: "licensed" for
    confirmed institutional access, "institutional" for a tool that needs
    some organization's license, "" for everything else."""
    if tool["governance_status"] == "licensed" or tool["cost"] == "AUA-licensed":
        return "licensed"
    if tool["cost"] == "institutional":
        return "institutional"
    return ""


def _check_cost(tool: dict) -> None:
    if tool.get("cost") not in COST_LABELS:
        raise ValueError(f"render_data hook: {tool['name']!r} has cost "
                         f"{tool.get('cost')!r}; expected one of {COST_LABELS}")


def _tool_standing_sentence(group: list[dict]) -> str:
    """One line naming the standings in a set of tools that are more than
    Listed, e.g. "Scopus with AI is Licensed: procured by the university.",
    or "" when every tool in the set is simply Listed. The non-endorsement
    point is said once, in the directory's legend and on the About page,
    rather than under every set of results (owner decision, 2026-09-23)."""
    counts: dict[str, int] = {}
    for tool in group:
        if tool["governance_status"] in STATUS_EXCEPTIONS:
            counts[tool["governance_status"]] = counts.get(tool["governance_status"], 0) + 1
    if not counts:
        return ""
    if len(counts) == 1:
        standing, n = next(iter(counts.items()))
        if n == 1:
            lead = next(t["name"] for t in group if t["governance_status"] == standing) + " is"
        else:
            lead = f"All {n} are" if n == len(group) else f"{n} of these are"
        return f"{lead} {STATUS_LABELS[standing][0]}: {STATUS_SHORT[standing]}."
    parts = [f"{counts[s]} {STATUS_LABELS[s][0]} ({STATUS_SHORT[s]})"
             for s in STATUS_SHORT if s in counts]
    return "Standings: " + _join_names(parts) + "."


def tool_task_members(tools: list, tasks: list) -> dict[str, list]:
    """Each tool_tasks.yaml task's tools, derived from data/tools.yaml (a
    task's category or status, plus each tool's optional `also_for`). The
    chooser and the Tools & Prompts landing (layout_nav.py) both
    call this, so a shortcut's count is always the chooser's count."""
    members: dict[str, list] = {t["id"]: [] for t in tasks}
    for tool in tools:
        extra = tool.get("also_for") or []
        for tid in extra:
            if tid not in members:
                raise ValueError(f"render_data hook: {tool['name']!r} also_for "
                                 f"unknown task {tid!r}")
        for t in tasks:
            if (t.get("from_category") == tool["category"]
                    or t.get("from_status") == tool["governance_status"]
                    or t["id"] in extra):
                members[t["id"]].append(tool)
    return members


def _render_tool_chooser(config) -> str:
    """The Tool Directory's task chooser (owner approved 2026-09-23): a
    build-time task index that is both the no-JavaScript fallback and the
    data docs/javascripts/tools-chooser.js turns into chips. Tasks come from
    data/tool_tasks.yaml; membership is derived from data/tools.yaml (a
    task's category or status, plus each tool's optional `also_for`), so a
    new tool joins the chooser with no second edit. Markdown inside
    md_in_html, so MkDocs rewrites and checks the guide and card links. The
    index carries data-search-exclude, so site search indexes each tool
    once, in its category."""
    tools = _load(_data_dir(config) / "tools.yaml")
    tasks = _load(_data_dir(config) / "tool_tasks.yaml")
    task_ids = [t["id"] for t in tasks]
    if len(set(task_ids)) != len(task_ids):
        raise ValueError("render_data hook: duplicate task id in tool_tasks.yaml")
    for t in tasks:
        if t.get("from_category") and t["from_category"] not in CATEGORY_LABELS:
            raise ValueError(f"render_data hook: task {t['id']!r} names unknown "
                             f"category {t['from_category']!r}")
        if t.get("from_status") and t["from_status"] not in STATUS_LABELS:
            raise ValueError(f"render_data hook: task {t['id']!r} names unknown "
                             f"status {t['from_status']!r}")
        if t.get("group", "task") not in ("task", "data"):
            raise ValueError(f"render_data hook: task {t['id']!r} has unknown group")
    members = tool_task_members(tools, tasks)
    empty = [tid for tid, group in members.items() if not group]
    if empty:
        raise ValueError(f"render_data hook: tool chooser tasks with no tools: {empty}")
    in_any = {tool["name"] for group in members.values() for tool in group}
    orphans = sorted({tool["name"] for tool in tools} - in_any)
    if orphans:
        raise ValueError(f"render_data hook: tools in no chooser task: {orphans}")
    institutional = sorted((tool["name"] for tool in tools
                            if tool["cost"] == "institutional"), key=str.lower)
    start_counts = {t["id"]: _check_start_with(t, members[t["id"]]) for t in tasks}

    lines = [
        '<div class="tool-chooser" id="tool-chooser" hidden></div>',
        "",
        # A <section>, not a <div>: Material's search parser tracks excluded
        # elements by tag name alone, so the first inner <div> to close
        # would end the exclusion of an outer <div> (measured 2026-09-23:
        # only the first task was excluded). The attribute also needs a
        # value, or md_in_html drops it.
        '<section class="tool-task-index" id="tool-task-index" data-search-exclude="" markdown>',
        "",
        ("Each task lists its tools; the names link to their cards in the "
         "directory below."),
        "",
    ]
    for t in tasks:
        group = sorted(members[t["id"]], key=lambda x: x["name"].lower())
        home = ""
        if t.get("from_category"):
            home = re.sub(r"[^a-z0-9]+", "-",
                          CATEGORY_LABELS[t["from_category"]].lower()).strip("-")
        attrs = (f'data-task="{html.escape(t["id"])}" '
                 f'data-label="{html.escape(t["label"])}" '
                 f'data-heading="{html.escape(t["heading"])}" '
                 f'data-group="{t.get("group", "task")}" data-home="{home}"')
        links = ", ".join(f"[{x['name']}](#{_tool_anchor(x['name'])})" for x in group)
        guide = " ".join((t.get("guide") or "").split())
        standing = _tool_standing_sentence(group)
        if t.get("from_status") == "licensed" and institutional:
            standing = (standing + " " if standing else "") + (
                f"{len(institutional)} more carry the Institutional cost "
                "label, meaning they need an organization's license: "
                f"{_join_names(institutional)}.")
        lines += [f'<div class="tt-item" {attrs} markdown>', "",
                  f"**{t['label']}** ({len(group)}): {links}", "{ .tt-tools }", ""]
        lines += _start_with_lines(t, group)
        if guide:
            lines += [guide, "{ .tt-guide }", ""]
        if standing:
            lines += [standing, "{ .tt-standing }", ""]
        lines += ["</div>", ""]
    lines += ["</section>", ""]
    out = "\n".join(lines)
    if "\u2014" in out:
        raise ValueError("render_data hook: em dash in the tool chooser")

    print("render_data: tool chooser verification")
    print(f"  tasks read      : {len(tasks)}")
    for t in tasks:
        source = t.get("from_category") or t.get("from_status") or "also_for only"
        print(f"    {t['id']:<14}: {len(members[t['id']]):>2} ({source})")
    print(f"  tools with also_for: {sum(1 for x in tools if x.get('also_for'))}")
    print(f"  tools in a task : {len(in_any)} of {len(tools)} (cross-check ok)")
    with_start = [tid for tid, n in start_counts.items() if n]
    rendered_starts = out.count('<div class="tt-start"')
    print(f"  where to start  : {len(with_start)} of {len(tasks)} tasks (DRAFT, "
          f"owner sign-off pending), {sum(start_counts.values())} tool mentions, "
          f"all in their task (cross-check "
          f"{'ok' if rendered_starts == len(with_start) else 'MISMATCH'})")
    if rendered_starts != len(with_start):
        raise AssertionError(
            f"render_data hook: {len(with_start)} tasks carry start_with but "
            f"{rendered_starts} Where to start notes rendered")
    rendered_basis = out.count("{ .tt-start-basis }")
    print(f"  how chosen line : {rendered_basis} of {rendered_starts} notes (DRAFT "
          f"wording; cross-check {'ok' if rendered_basis == rendered_starts else 'MISMATCH'})")
    if rendered_basis != rendered_starts:
        raise AssertionError("render_data hook: a Where to start note is missing "
                             "the line saying how its suggestions were chosen")
    return out


def _check_start_with(task: dict, group: list[dict]) -> int:
    """Validate a task's optional start_with (DRAFT, awaiting owner sign-off,
    2026-09-25) and return how many tool mentions it makes. The build fails
    on a malformed item or on a tool that is not in the task, because a
    suggestion naming a tool the reader cannot see in the results below it
    is a broken promise, and a renamed tool would otherwise vanish from the
    note silently."""
    items = task.get("start_with") or []
    if not isinstance(items, list) or len(items) > 2:
        raise ValueError(f"render_data hook: task {task['id']!r} start_with "
                         "must be a list of one or two items")
    names = {tool["name"] for tool in group}
    mentions = 0
    for item in items:
        tools = item.get("tools") or []
        if not item.get("need") or not item.get("why") or not 1 <= len(tools) <= 3:
            raise ValueError(f"render_data hook: task {task['id']!r} has a "
                             "start_with item without a need, a why, and one "
                             "to three tools")
        missing = [n for n in tools if n not in names]
        if missing:
            raise ValueError(f"render_data hook: task {task['id']!r} start_with "
                             f"names {missing}, which are not in that task")
        mentions += len(tools)
    return mentions


def _start_with_lines(task: dict, group: list[dict]) -> list[str]:
    """The "Where to start" note as markdown inside the task index, so
    MkDocs rewrites and checks its links and the chooser can copy it. Each
    tool is named with its cost from data/tools.yaml, which is the access
    and cost half of the decision aid."""
    items = task.get("start_with") or []
    if not items:
        return []
    by_name = {tool["name"]: tool for tool in group}
    out = ['<div class="tt-start" markdown>', "",
           f"**{START_LABEL}** ({START_QUALIFIER})", "{ .tt-start-label }", "",
           START_BASIS, "{ .tt-start-basis }", ""]
    for item in items:
        tools = [by_name[name] for name in item["tools"]]
        links = [f"[{t['name']}](#{_tool_anchor(t['name'])})" for t in tools]
        costs = [t["cost"] for t in tools]
        if len(tools) > 1 and len(set(costs)) == 1:
            # "Canva or Claude Design (both freemium)", said once.
            shared = COST_WORDS_SHARED.get(costs[0], costs[0])
            named = (_join_names(links, "or")
                     + f" ({'both' if len(tools) == 2 else 'all'} {shared})")
        else:
            named = _join_names([f"{link} ({COST_WORDS.get(c, c)})"
                                 for link, c in zip(links, costs)], "or")
        why = " ".join(str(item["why"]).split())
        out.append(f"- **{item['need']}:** {named}. {why}")
    out += ["", "</div>", ""]
    return out


def _browse_row(heading: str, label: str, count_text: str, extra_class: str = "") -> list[str]:
    """Open one category as a one-line browse row (layout redesign,
    2026-09-25; it replaced a heading, a descriptor and a "Show the N tools"
    bar, twelve of which stacked down the page). The real heading keeps its
    id, so every #category link and search result still lands, and floats at
    the left of a disclosure whose summary carries the count at the right:
    one row reading "Research ... 14 tools", clickable end to end
    (layout-tools.css). The summary names its category for screen readers,
    since a Tab stop reading only "14 tools" would lose its context.

    Raw <details markdown> at column 0 rather than a ??? admonition: an
    admonition indents its body, so the card HTML inside it went through
    paragraph processing and every grid was wrapped in a <p>, which is why
    search indexed the cards as run-together text ("AstaListed Allen
    Institute for AIfree")."""
    cls = "tool-cat" + (f" {extra_class}" if extra_class else "")
    return [f'<div class="{cls}" markdown>', "", f"{heading} {label}", "",
            '<details class="tool-cat__list" markdown>',
            f'<summary><span class="tool-sr">{html.escape(label)}: </span>'
            f"{count_text}</summary>", ""]


BROWSE_ROW_CLOSE = ["", "</details>", "", "</div>", ""]

# Ids on docs/tools/index.md that begin "tool-" but are not cards: the H1
# and the chooser's containers. A tool whose anchor matched one would give
# the page a duplicate id.
RESERVED_TOOL_IDS = {"tool-directory", "tool-chooser", "tool-task-index"}


def _tool_card(tool: dict, anchor: str) -> tuple[str, bool, str]:
    """One tool card; returns (html, note shown, access line kind).

    The card's title is a real heading carrying the stable #tool-... id, so
    site search returns one result per tool and heading navigation can move
    card to card; it is raw HTML, so it stays out of the contents list. The
    status and cost are data-search-exclude'd leaf spans (Material's search
    parser tracks excluded elements by tag name, so they must not contain a
    nested span), and they sit outside the heading so its name is the
    tool's name alone. The status tooltip keeps the note it has carried
    since 2026-09-08, so nothing reachable before becomes unreachable."""
    esc = lambda s: html.escape(str(s), quote=False)
    status = tool["governance_status"]
    status_label = STATUS_LABELS[status][0]
    note = _card_note(tool.get("status_note", ""))
    title = f' title="{html.escape(note)}"' if note else ""
    parts = [
        '<div class="tool-card">',
        f'<h3 class="tool-card-title" id="{anchor}"><a href="{html.escape(tool["url"])}">'
        f'{_favicon_img(tool["url"])}{esc(tool["name"])}</a></h3>',
        '<span class="tool-sr" data-search-exclude="">Status: </span>'
        f'<span class="tool-status tool-status--{status}" data-search-exclude=""'
        f"{title}>{status_label}</span>",
        f'<p class="tool-card-sub">{esc(tool["vendor"])}'
        f'<span class="tool-card-cost" data-search-exclude="">{esc(tool["cost"])}</span></p>',
        f'<p class="tool-card-blurb">{esc(tool["blurb"])}</p>',
    ]
    if note:
        parts.append(f'<p class="tool-card-note">{esc(note)}</p>')
    access = _tool_access(tool)
    if access:
        parts.append('<p class="tool-card-access"><strong>What AUA provides:</strong> '
                     f"{ACCESS_LINES[access]}</p>")
    checked = tool.get("last_reviewed")
    if checked:
        parts.append(f'<p class="tool-card-checked">Checked {_long_date(checked)}'
                     f'<span class="tool-card-checked__means" data-search-exclude="">: '
                     f"{CHECKED_MEANS}</span></p>")
    parts.append("</div>")
    return "\n".join(parts), bool(note), access


def _render_tools(config) -> str:
    """The directory by category (render:tools), as one-line browse rows
    that open onto the cards. The chooser above clones these cards, so they
    are the one source of card markup."""
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
        _check_cost(tool)
        by_category.setdefault(category, []).append(tool)

    # Not a "tool-" id: those are reserved for cards (_tool_anchor).
    lines = [f'<p class="tool-browse" id="browse-by-category">Browse all {len(tools)} '
             "tools by category</p>", ""]
    rendered = 0
    notes_shown = 0
    access_shown: dict[str, int] = {}
    per_category_counts = {}
    standing_counts: dict[str, int] = {}
    anchors: set[str] = set()
    for category, label in CATEGORY_LABELS.items():
        group = by_category.get(category, [])
        if not group:
            continue
        per_category_counts[label] = len(group)
        descriptor = CATEGORY_DESCRIPTORS.get(category)
        if not descriptor:
            raise ValueError(
                f"render_data hook: category {category!r} has no descriptor"
            )
        # The row advertises the count and every standing other than Listed,
        # so no signal hides behind the toggle. Arriving by link opens it
        # (docs/javascripts/prompts.js for #category, tools-chooser.js for
        # #tool-...).
        exceptions = []
        for standing in STATUS_EXCEPTIONS:
            n = sum(1 for t in group if t["governance_status"] == standing)
            if n:
                exceptions.append(f"{n} {STATUS_LABELS[standing][0]}")
        noun = "tool" if len(group) == 1 else "tools"
        count_text = f"{len(group)} {noun}"
        if exceptions:
            count_text += " \u00b7 " + ", ".join(exceptions)
        lines += _browse_row("##", label, count_text)
        lines += [descriptor, "{ .tool-cat__desc }", ""]
        intro = CATEGORY_INTROS.get(category)
        if intro:
            lines += [intro, "{ .tool-cat__intro }", ""]
        # md_in_html parses these cards into the document tree, so the toc
        # extension gives each card heading a permalink and an entry in the
        # page's contents. Both are hidden on this page (layout-tools.css
        # hides the permalinks; shelf pages hide the contents column), and
        # the explicit #tool-... ids are kept as written.
        lines.append('<div class="tool-grid">')
        for tool in sorted(group, key=lambda t: t["name"].lower()):
            anchor = _tool_anchor(tool["name"])
            if anchor in anchors or anchor in RESERVED_TOOL_IDS:
                raise ValueError(f"render_data hook: the card anchor {anchor!r} "
                                 "is taken by another tool or by the page itself")
            anchors.add(anchor)
            card, noted, access = _tool_card(tool, anchor)
            lines.append(card)
            notes_shown += noted
            if access:
                access_shown[access] = access_shown.get(access, 0) + 1
            rendered += 1
            standing = tool["governance_status"]
            standing_counts[standing] = standing_counts.get(standing, 0) + 1
        lines.append("</div>")
        lines += BROWSE_ROW_CLOSE

    if rendered != len(tools):
        raise AssertionError(
            f"render_data hook: tools count mismatch, read {len(tools)} "
            f"but rendered {rendered}"
        )
    out = "\n".join(lines)
    if "\u2014" in out:
        raise ValueError("render_data hook: em dash in the tools directory")
    headings = len(re.findall(r'<h3 class="tool-card-title" id="tool-', out))
    if headings != rendered:
        raise AssertionError(f"render_data hook: {rendered} tool cards but "
                             f"{headings} carry a #tool-... heading")

    print("render_data: tools verification")
    print(f"  entries read    : {len(tools)}")
    for label, count in per_category_counts.items():
        print(f"  {label:<16}: {count}")
    standings = ", ".join(f"{k} {v}" for k, v in sorted(standing_counts.items()))
    print(f"  standings       : {standings}")
    print(f"  rendered total  : {rendered} (cross-check ok)")
    print(f"  card headings   : {headings} with a #tool-... id (cross-check ok)")
    dated = sum(1 for t in tools if t.get("last_reviewed"))
    means = out.count('class="tool-card-checked__means"')
    print(f"  checked dates   : {dated} of {len(tools)}, each with its meaning "
          f"(shown on the first card of a grid; cross-check "
          f"{'ok' if means == dated else 'MISMATCH'})")
    if means != dated:
        raise AssertionError(f"render_data hook: {dated} tools carry a Checked date "
                             f"but {means} cards say what it means")
    # Cross-check the visible notes against the data rather than trusting the
    # loop: a note that stops rendering is a caution a reader stops seeing.
    expected_notes = sum(
        1 for t in tools if _card_note(t.get("status_note", "")))
    print(f"  notes on cards  : {notes_shown} of {len(tools)} "
          f"(cross-check {'ok' if notes_shown == expected_notes else 'MISMATCH'})")
    if notes_shown != expected_notes:
        raise AssertionError(
            f"render_data hook: {expected_notes} tools carry a substantive "
            f"status note but {notes_shown} rendered on a card")
    expected_access = {}
    for t in tools:
        kind = _tool_access(t)
        if kind:
            expected_access[kind] = expected_access.get(kind, 0) + 1
    print(f"  AUA access lines: {access_shown.get('licensed', 0)} licensed, "
          f"{access_shown.get('institutional', 0)} needing an organization's "
          f"license (cross-check {'ok' if access_shown == expected_access else 'MISMATCH'})")
    if access_shown != expected_access:
        raise AssertionError("render_data hook: What AUA provides lines do not "
                             "match data/tools.yaml")
    return out


def _render_tool_access(config) -> str:
    """"What AUA provides" in the directory's statuses section
    (render:tool-access), from data/tools.yaml: confirmed institutional
    access first, then, as a separate statement, the tools that need some
    organization's license, so the second group is never read as provided."""
    tools = _load(_data_dir(config) / "tools.yaml")
    licensed = sorted((t["name"] for t in tools if _tool_access(t) == "licensed"),
                      key=str.lower)
    needs = sorted((t["name"] for t in tools if _tool_access(t) == "institutional"),
                   key=str.lower)
    if licensed:
        noun = "tool is" if len(licensed) == 1 else "tools are"
        text = (f"{_number_word(len(licensed))} {noun} licensed by the "
                f"university: {_join_names(licensed)}.")
    else:
        text = "No tool in the directory is licensed by the university yet."
    if needs:
        verb, obj = ("needs", "it") if len(needs) == 1 else ("need", "them")
        more = " more" if licensed else ""
        text += (f" {_number_word(len(needs))}{more} {verb} an organization's "
                 f"license, and this directory does not confirm AUA access to "
                 f"{obj}: {_join_names(needs)}.")
    out = f"**What AUA provides.** {text}\n{{ .tool-access }}\n"
    if "\u2014" in out:
        raise ValueError("render_data hook: em dash in the tool access line")
    print("render_data: tool access verification")
    print(f"  licensed        : {len(licensed)} ({_join_names(licensed) or 'none'})")
    print(f"  needs a license : {len(needs)} ({_join_names(needs) or 'none'})")
    return out


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

    esc = lambda s: html.escape(str(s), quote=False)
    lines = []
    rendered = 0
    dated = 0
    per_modality = {}
    for modality, label in MODALITY_LABELS.items():
        group = by_modality.get(modality, [])
        if not group:
            continue
        per_modality[label] = len(group)
        descriptor = MODALITY_DESCRIPTORS.get(modality)
        if not descriptor:
            raise ValueError(
                f"render_data hook: modality {modality!r} has no descriptor"
            )
        # The same one-line browse rows as the tool categories above;
        # prompts.js opens one on arrival by link. Models carry licenses,
        # not statuses, so the row needs only the count. The h3 ids must not
        # change (image-generation_1 and its siblings are deduplicated
        # against the category h2s, so these rows stay after them).
        noun = "model family" if len(group) == 1 else "model families"
        lines += _browse_row("###", label, f"{len(group)} {noun}", "tool-cat--models")
        lines += [descriptor, "{ .tool-cat__desc }", ""]
        lines.append('<div class="tool-grid">')
        for entry in sorted(group, key=lambda m: m["name"].lower()):
            # docs/tools/index.md promises that each entry "shows the date
            # its license and description were last checked". Every entry
            # has carried last_reviewed since launch but no card ever
            # rendered it, so the page stated something false about itself
            # (found 2026-09-08). Raise rather than print "Checked None":
            # a page that promises a date must not ship one that is absent.
            checked = entry.get("last_reviewed")
            if not checked:
                raise ValueError(
                    f"render_data hook: open model {entry['name']!r} has no "
                    f"last_reviewed, but the page promises a checked date")
            lines.append("\n".join([
                '<div class="tool-card tool-card--model">',
                # A paragraph, not a heading: a heading here would get an id
                # from the toc extension, and a search result landing on it
                # inside a closed row would show nothing. Search indexes
                # the models under their modality row, which opens on
                # arrival.
                f'<p class="tool-card-title"><a href="{html.escape(entry["url"])}">'
                f'{esc(entry["name"])}</a></p>',
                f'<p class="tool-card-sub">{esc(entry["vendor"])}'
                f'<span class="tool-card-license">{esc(entry["license"])}</span></p>',
                f'<p class="tool-card-blurb">{esc(entry["blurb"])}</p>',
                f'<p class="tool-card-checked">Checked {_long_date(checked)}</p>',
                "</div>",
            ]))
            rendered += 1
            dated += 1
        lines.append("</div>")
        lines += BROWSE_ROW_CLOSE

    print("render_data: open models verification")
    print(f"  entries read : {len(models)}")
    for label, count in per_modality.items():
        print(f"  {label:<16}: {count}")
    print(f"  cards rendered: {rendered} (cross-check "
          f"{'ok' if rendered == len(models) else 'MISMATCH'})")
    print(f"  checked dates : {dated} (cross-check "
          f"{'ok' if dated == rendered else 'MISMATCH'})")
    if rendered != len(models):
        raise AssertionError("render_data hook: open models count mismatch")
    if dated != rendered:
        raise AssertionError(
            f"render_data hook: {rendered} open model cards rendered but "
            f"{dated} carry a checked date; the page promises one on each")
    return "\n".join(lines)


def _youtube_id(url: str) -> str:
    match = re.search(r"[?&]v=([\w-]+)", url)
    if not match:
        raise ValueError(f"render_data hook: cannot derive video id from {url!r}")
    return match.group(1)


def _video_card(url: str, title: str, meta: str, desc: str = "",
                thumbnail: str = "",
                fallback_thumbnail: str = "") -> str:
    """One thumbnail card, reusing the pipeline's video-card markup and CSS.
    YouTube thumbnails derive from the video id; an empty thumbnail renders
    a text-only card."""
    if not thumbnail and "youtube.com/watch" in url:
        thumbnail = f"https://i.ytimg.com/vi/{_youtube_id(url)}/hqdefault.jpg"
    # Applied only after the YouTube derivation above, never before it:
    # passing a fallback in as `thumbnail` would suppress the real video
    # thumbnail and silently replace it with brand artwork.
    thumbnail = thumbnail or fallback_thumbnail
    # Hidden onerror, the same treatment _favicon_img gives a missing favicon:
    # a thumbnail whose host has dropped the image collapses the card to text
    # instead of showing a broken-image box in a 16:9 grey slot, and text-only
    # is already the documented shape for an entry with no thumbnail
    # (2026-09-05, owner approved). verify_links.py now checks these at
    # authoring time; this is what a reader sees between rot and repair.
    img = (f'  <img src="{thumbnail}" alt="Thumbnail: {title}" '
           "loading=\"lazy\" onerror=\"this.style.display='none'\">\n"
           ) if thumbnail else ""
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
                # Some sources publish no og:image (DeepLearning.AI and
                # Harvard Business Publishing both serve none to a
                # scripted fetch, checked 2026-08-19), which left
                # text-only cards sitting awkwardly beside thumbnailed
                # ones. Rather than hotlink an arbitrary vendor image
                # that would misrepresent the page and eventually rot,
                # those fall back to local brand artwork. The path is
                # page-relative because MkDocs does not rewrite raw HTML
                # src attributes, and these markers appear only in
                # docs/learning/index.md, which serves from /learning/.
                thumbnail=e.get("thumbnail", ""),
                fallback_thumbnail="../assets/resource-card.svg",
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


def _plain(text: str) -> str:
    """Markdown links reduced to their text, whitespace collapsed."""
    return " ".join(re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text or "").split())


PROMPT_KEYS = {"title", "tagline", "category", "audience", "status",
               "last_reviewed", "notes", "prompt",
               # Optional, added for the layout redesign (2026-09-25):
               "featured", "also_for", "use", "note_visible"}


def load_prompts(config) -> list[dict]:
    """Load data/prompts.yaml and check every field the library rows and the
    generated prompt pages (scripts/layout_prompt_pages.py) rely on.

    Both hooks call this, so they can never disagree about what a valid
    entry is. The optional fields are owner-owned like the rest:
      featured: true        sorts the prompt first in each section it is in
      also_for: [category]  lists it in another section too (the chooser's
                            Study chip finds the NBME-style question tutor);
                            its card and #anchor stay in its own category
      use: [step, ...]      "How to use it" on the prompt's page (markdown,
                            links relative to docs/prompts/ as in notes)
      note_visible: text    one sentence of the notes shown beside Copy in
                            the library, quoted word for word from the notes
                            so it can never drift from them
    """
    prompts = _load(_data_dir(config) / "prompts.yaml")
    if set(PROMPT_CATEGORY_CHIPS) != set(PROMPT_CATEGORY_LABELS):
        raise ValueError("render_data hook: PROMPT_CATEGORY_CHIPS and "
                         "PROMPT_CATEGORY_LABELS must name the same categories")
    for audience, first in PROMPT_AUDIENCE_FIRST.items():
        if audience not in PROMPT_AUDIENCE_LABELS or not set(first) <= set(PROMPT_CATEGORY_LABELS):
            raise ValueError("render_data hook: PROMPT_AUDIENCE_FIRST names an "
                             f"unknown audience or category: {audience!r} {first!r}")
    seen = set()
    for entry in prompts:
        title = entry.get("title")
        if not isinstance(title, str) or not title.strip():
            raise ValueError(f"render_data hook: a prompt has no title: {entry!r:.80}")
        unknown = sorted(set(entry) - PROMPT_KEYS)
        if unknown:
            raise ValueError(f"render_data hook: prompt {title!r} has unknown "
                             f"field(s) {unknown}; allowed: {sorted(PROMPT_KEYS)}")
        if entry.get("category") not in PROMPT_CATEGORY_LABELS:
            raise ValueError(f"render_data hook: unknown prompt category "
                             f"{entry.get('category')!r} on {title!r}")
        if entry.get("status") not in PROMPT_STATUS_LABELS:
            raise ValueError(f"render_data hook: unknown prompt status "
                             f"{entry.get('status')!r} on {title!r}")
        if entry.get("audience") not in PROMPT_AUDIENCE_LABELS:
            raise ValueError(f"render_data hook: unknown prompt audience "
                             f"{entry.get('audience')!r} on {title!r}")
        if not entry.get("tagline"):
            raise ValueError(f"render_data hook: prompt {title!r} has no tagline "
                             "(required for its library row and its page)")
        if not isinstance(entry.get("prompt"), str) or not entry["prompt"].strip():
            raise ValueError(f"render_data hook: prompt {title!r} has no prompt text")
        slug = _prompt_slug(title)
        if slug in seen:
            raise ValueError(f"render_data hook: duplicate prompt anchor slug {slug!r}")
        if slug in PROMPT_RESERVED_SLUGS:
            raise ValueError(f"render_data hook: prompt {title!r} would take the "
                             f"address prompts/{slug}/, which a page already uses")
        seen.add(slug)
        if "featured" in entry and not isinstance(entry["featured"], bool):
            raise ValueError(f"render_data hook: featured on {title!r} must be true or false")
        also = entry.get("also_for", [])
        if (not isinstance(also, list) or len(set(also)) != len(also)
                or any(c not in PROMPT_CATEGORY_LABELS for c in also)
                or entry["category"] in also):
            raise ValueError(f"render_data hook: also_for on {title!r} must list other "
                             f"known categories once each, got {also!r}")
        use = entry.get("use")
        if use is not None and (not isinstance(use, list)
                                or not 1 <= len(use) <= PROMPT_USE_MAX_STEPS
                                or any(not isinstance(s, str) or not s.strip() for s in use)):
            raise ValueError(f"render_data hook: use on {title!r} must be a list of 1 to "
                             f"{PROMPT_USE_MAX_STEPS} steps")
        note = entry.get("note_visible")
        if note is not None:
            if not isinstance(note, str) or not note.strip() or "[" in note:
                raise ValueError(f"render_data hook: note_visible on {title!r} must be "
                                 "plain text (no links)")
            if " ".join(note.split()) not in _plain(entry.get("notes", "")):
                raise ValueError(f"render_data hook: note_visible on {title!r} must be "
                                 "quoted word for word from its notes, so the line "
                                 "beside Copy can never say more than the notes do")
    return prompts


def prompt_json(value) -> str:
    """JSON that is safe inside a <script> element: <, > and & are written
    as \\u escapes, so no prompt text can end the element early, and
    JSON.parse gives back every character exactly."""
    return (json.dumps(value, ensure_ascii=False)
            .replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026"))


def prompt_group_order(audience: str | None = None) -> list[str]:
    """Section order: PROMPT_CATEGORY_LABELS, with an audience's first
    sections moved to the front (students: Study, then Residency)."""
    first = list(PROMPT_AUDIENCE_FIRST.get(audience, ()))
    return first + [k for k in PROMPT_CATEGORY_LABELS if k not in first]


def _prompt_row(entry, slug: str, category: str, also: bool) -> str:
    """One library row: the title links to the prompt's own page; Copy and
    Save are buttons that docs/javascripts/layout-prompts.js reveals, so a
    reader without JavaScript never meets a control that does nothing. The
    #slug anchor sits on the row in the prompt's own category only."""
    title = html.escape(entry["title"])
    tagline = html.escape(" ".join(entry["tagline"].split()))
    status, _ = PROMPT_STATUS_LABELS[entry["status"]]
    audience = PROMPT_AUDIENCE_META[entry["audience"]]
    note = entry.get("note_visible")
    anchor = "" if also else f' id="{slug}"'
    also_attr = " data-also" if also else ""
    opening = (f'<div class="pl-row"{anchor} data-prompt="{slug}" '
               f'data-audience="{entry["audience"]}" data-category="{category}"{also_attr}>')
    parts = [
        opening,
        f'<h3 class="pl-row__title"><a href="{slug}/">{title}</a></h3>',
        f'<p class="pl-row__tagline">{tagline}</p>',
        f'<p class="pl-row__meta"><span>{status}</span><span>{audience}</span></p>',
    ]
    # Every part is its own grid cell (layout-prompts.css): beside Copy on
    # wide screens; on a phone the text runs full width and Copy sits at
    # the end of the status line, which keeps each row short.
    if note:
        parts.append(f'<p class="pl-row__note">{html.escape(" ".join(note.split()))}</p>')
    copy = f'<button type="button" class="pl-copy" data-copy="{slug}" data-title="{title}" hidden>Copy</button>'
    save = f'<button type="button" class="pl-save" data-save="{slug}" data-title="{title}" hidden>Save</button>'
    parts += ['<div class="pl-row__actions">', copy, save, '</div>', '</div>']
    return "".join(parts)


def _further_reading_html(entries: list) -> str:
    """A section's studies and guides, folded after its prompts: secondary
    to the prompts, one tap away (a quiet disclosure, layout.css)."""
    items = "".join(
        f'<li><a href="{html.escape(e["url"])}">{html.escape(e["title"])}</a> '
        f'<span class="pl-further__meta">({html.escape(_resource_meta(e))})</span>: '
        f'{html.escape(" ".join(e["blurb"].split()))}</li>'
        for e in entries)
    return (f'<details class="note pl-further"><summary>Further reading ({len(entries)})</summary>'
            f'<ul>{items}</ul></details>')


def _render_prompts(config, resource_groups: dict[str, list]) -> str:
    """The Prompt Library shelf (layout redesign L16, owner approved
    2026-09-25): a filter column beside the results from 60em, and one row
    per prompt with a Copy button that copies the stored text without
    opening anything. The at-a-glance table is gone (owner decision 6); the
    rows carry the tagline and filter the same way. Each prompt's full text
    is on its own page (scripts/layout_prompt_pages.py) and, for Copy, in a
    JSON island here. The results are excluded from site search, so search
    returns one result per prompt, its page."""
    prompts = load_prompts(config)
    by_category: dict[str, list] = {}
    for entry in prompts:
        by_category.setdefault(entry["category"], []).append((entry, False))
        for other in entry.get("also_for", []):
            by_category.setdefault(other, []).append((entry, True))
    for group in by_category.values():
        # Featured first, otherwise file order (sort() is stable).
        group.sort(key=lambda pair: not pair[0].get("featured"))

    # The chooser (docs/javascripts/prompt-chooser.js) reads this island
    # for chip labels and section order; it filters by the data attributes
    # on each row. Without JavaScript the filter column stays hidden and
    # every row shows.
    chooser = {
        "categories": [[key, PROMPT_CATEGORY_CHIPS[key], key.replace("_", "-"),
                        PROMPT_CATEGORY_LABELS[key]]
                       for key in PROMPT_CATEGORY_LABELS if key in by_category],
        "audiences": [[a, PROMPT_AUDIENCE_LABELS[a]] for a in ("students", "faculty")],
        "orders": {a: [k for k in prompt_group_order(a) if k in by_category]
                   for a in PROMPT_AUDIENCE_FIRST},
        "total": len(prompts),
    }
    texts = {_prompt_slug(e["title"]): e["prompt"] for e in prompts}
    island = prompt_json(texts)
    if json.loads(island) != texts:
        raise AssertionError("render_data hook: the prompt text island does not "
                             "round-trip; Copy would not give the stored text")

    # The results are a <section> holding no other <section>: Material's
    # search parser matches elements by tag name alone, so an excluded
    # <div> would stop being excluded at the first nested </div>.
    out = ['<div class="shelf pl-shelf" id="prompt-shelf">',
           '<div class="shelf__filters pl-filters" id="prompt-chooser" hidden></div>',
           '<section class="shelf__results pl-results" aria-label="Prompts" data-search-exclude>',
           f'<p class="pl-results__count" id="prompt-count">All {len(prompts)} prompts</p>']
    primary_rows = also_rows = resources_placed = 0
    per_category = {}
    for key in prompt_group_order():
        group = by_category.get(key, [])
        if not group:
            continue
        label = PROMPT_CATEGORY_LABELS[key]
        per_category[label] = sum(1 for _, also in group if not also)
        # Anchors are pinned to the category key, so relabeling a heading
        # (MCQ Generation became Multiple-Choice Question (MCQ) Writing on
        # 2026-09-22) never breaks the playbooks' #mcq-generation links.
        anchor = key.replace("_", "-")
        out.append(f'<div class="pl-group" id="{anchor}" data-category="{key}">')
        out.append(f'<h2 class="pl-group__title">{html.escape(label)}</h2>')
        out.append('<div class="pl-rows">')
        for entry, also in group:
            out.append(_prompt_row(entry, _prompt_slug(entry["title"]), key, also))
            if also:
                also_rows += 1
            else:
                primary_rows += 1
        out.append('</div>')
        category_resources = resource_groups.get(key, [])
        if category_resources:
            out.append(_further_reading_html(category_resources))
            resources_placed += len(category_resources)
        out.append('</div>')
    out.append('</section>')
    out.append('</div>')
    out.append(f'<script type="application/json" id="prompt-chooser-data">{prompt_json(chooser)}</script>')
    out.append(f'<script type="application/json" id="prompt-texts">{island}</script>')

    if primary_rows != len(prompts):
        raise AssertionError(
            f"render_data hook: prompts count mismatch, read {len(prompts)} "
            f"but rendered {primary_rows}"
        )
    expected_also = sum(len(e.get("also_for", [])) for e in prompts)
    if also_rows != expected_also:
        raise AssertionError(f"render_data hook: {expected_also} also_for listings "
                             f"read but {also_rows} rendered")
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
    print(f"  rendered total: {primary_rows} rows (cross-check ok)")
    also_names = [f"{e['title']} in {', '.join(PROMPT_CATEGORY_LABELS[c] for c in e['also_for'])}"
                  for e in prompts if e.get("also_for")]
    print(f"  also listed  : {also_rows} ({'; '.join(also_names) or 'none'}) (cross-check ok)")
    print(f"  copy texts   : {len(texts)} of {len(prompts)} round-trip byte-identical (cross-check ok)")
    print(f"  featured {sum(1 for e in prompts if e.get('featured'))}, "
          f"notes beside Copy {sum(1 for e in prompts if e.get('note_visible'))}, "
          f"use steps {sum(1 for e in prompts if e.get('use'))} of {len(prompts)}")
    print(f"  resources: general {len(resource_groups.get('general', []))}, "
          f"per-category {resources_placed} (cross-check ok)")
    return "\n".join(out)


# --- committee work and polls ---------------------------------------------------

# --- skills -----------------------------------------------------------------


def _render_skills(config) -> str:
    """Render the skills roster as one scannable table, safest first.

    Provenance drives the badge because it is the fact that decides
    whether a skill is safe to use: a skill is instructions plus
    optionally executable code, so who wrote it matters more than what
    it claims to do. data/skills.yaml admits only three provenances by
    policy and this hook fails loudly on any other, so a third-party
    skill cannot reach the page by editing data alone."""
    skills = _load(_data_dir(config) / "skills.yaml")
    order = list(SKILL_PROVENANCE_LABELS)
    for entry in skills:
        if entry["provenance"] not in SKILL_PROVENANCE_LABELS:
            raise ValueError(
                "render_data hook: unknown skill provenance "
                f"{entry['provenance']!r} in {entry['name']!r}; "
                "data/skills.yaml is limited to first-party and "
                "AUA-written skills by site curation"
            )
        for field in ("what", "surfaces", "setup", "url"):
            if not str(entry.get(field, "")).strip():
                raise ValueError(
                    f"render_data hook: skill {entry['name']!r} is "
                    f"missing {field!r}"
                )
    skills = sorted(skills, key=lambda e: order.index(e["provenance"]))

    lines = ["| Skill | Source | What it does | Where it works | To use it |",
             "| --- | --- | --- | --- | --- |"]
    counts: dict[str, int] = {}
    for entry in skills:
        label, css = SKILL_PROVENANCE_LABELS[entry["provenance"]]
        counts[label] = counts.get(label, 0) + 1
        lines.append(
            f"| [{entry['name']}]({entry['url']}) "
            f"| {_badge(label, css)} "
            f"| {entry['what'].strip()} "
            f"| {entry['surfaces'].strip()} "
            f"| {entry['setup'].strip()} |"
        )
    lines.append("")

    print("render_data: skills verification")
    print(f"  entries read : {len(skills)}")
    for label, count in counts.items():
        print(f"  {label:<15}: {count}")
    print(f"  rows rendered: {len(skills)} (cross-check ok)")
    return "\n".join(lines)


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
            # `closes` and `button` are both optional: a standing invitation
            # has no end date (owner decision 2026-07-24), so the closing
            # clause is omitted rather than filled with a placeholder, and
            # the label can describe the form it opens. Length claims live
            # in the per-poll `note` so they stay accurate per form.
            closes = (f" *Closes {poll['closes']}.*"
                      if poll.get("closes") else "")
            button = poll.get("button", "Answer the poll")
            # Per-poll since 2026-09-22: committee polls were restricted to
            # the AUA organization in Forms (owner-confirmed 2026-06-11),
            # but the standing entry is the site feedback form, which the
            # owner opened to anyone, so the sentence was untrue for it.
            access = (" Responses are collected through Microsoft Forms "
                      "and need an AUA account to access."
                      if poll.get("restricted") else "")
            lines.append(
                f'!!! question "The AI Committee is asking"\n'
                f"    **{poll['question']}**{note}{access}\n\n"
                f"    [{button}]({poll['url']})"
                f"{{ .md-button .md-button--primary }}{closes}"
            )
    else:
        lines.append(
            "No poll is open right now. New polls from the AI Committee "
            "are announced here, and results are reported on the "
            "[Committee Work and Updates](../governance/updates.md) page."
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
        f"| {name_cell} | {dates_cell} "
        f"| {_deadline_cell(conf['abstract_deadline'], today)} "
        f"| {conf['location']} | {FORMAT_LABELS[conf['format']]} "
        f"| {conf['organizer']} |"
    )


# Column order (layout redesign L20, 2026-09-25): what a reader decides on
# comes first, so the abstract deadline sits beside the dates instead of
# off the right edge of a phone. On phones scripts/layout_news.py stacks
# each row into a card that reads in this same order.
CONFERENCE_HEADER = (
    "| Conference | Dates | Abstract deadline | Location | Format | Organizer |\n"
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
    open_now, in_progress, past = [], [], []
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
        elif deadline_passed:
            # Still running, but no longer joinable (2026-09-22 audit:
            # three such rows sat at the top of "Open and upcoming").
            in_progress.append(opp)
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

    if in_progress:
        in_progress.sort(key=lambda o: str(o.get("end_date")))
        lines.append('??? note "In progress, closed to new entrants"')
        lines.append("")
        for row in [OPPORTUNITY_HEADER] + [
            _opportunity_row(o, today) for o in in_progress
        ]:
            for inner in row.split("\n"):
                lines.append("    " + inner)
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

    if len(open_now) + len(in_progress) + len(past) != len(opportunities):
        raise AssertionError(
            f"render_data hook: opportunity count mismatch, read "
            f"{len(opportunities)} but split into {len(open_now)} open "
            f"+ {len(in_progress)} in progress + {len(past)} past"
        )

    print("render_data: opportunities verification")
    print(f"  entries read : {len(opportunities)}")
    print(f"  open         : {len(open_now)}")
    print(f"  in progress  : {len(in_progress)}")
    print(f"  past         : {len(past)}")
    print(f"  total        : {len(open_now) + len(in_progress) + len(past)} "
          "(cross-check ok)")

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


def _listen_kind(player: str, kind: str, name: str = "") -> str:
    """Tag a player with what it reads ("module", "page" or "brief") and,
    where several share a page, whose brief it is. docs/javascripts/listen.js
    turns every player into a compact Listen row (layout redesign,
    2026-09-25) and names its button from these, so a screen reader hears
    "Listen to this module" or "Listen to the Medical Education brief"
    rather than several identical buttons. The audio element, its source
    and the AI-voice note are unchanged."""
    attrs = f' data-listen="{kind}"'
    if name:
        attrs += f' data-listen-name="{html.escape(name, quote=True)}"'
    return player.replace('<div class="listen">', f'<div class="listen"{attrs}>', 1)


def _inject_narration(src: str, markdown: str) -> str:
    """Add a native audio player wherever a generated MP3 exists for this
    page (scripts/narrate.py). Absent audio means no player, so local
    builds and pages outside the narrated set are untouched. Raw HTML
    src paths are page-relative because MkDocs does not rewrite them.

    Static pages are checked for staleness, not just existence: their audio
    is generated on the maintainer's machine with a metered voice that CI
    has no key for, so a page edited without a local re-run would otherwise
    serve a recording of superseded words. No player is the safe answer, and
    the daily narration-health workflow raises an issue about it.

    The player goes under the page's head meta line: the first meta-chip
    line above the first section heading. Since 2026-09-25 the modules also
    end with a meta-chip line (the competency domain, moved to the foot),
    so the search stops at the first "## " rather than taking any meta-chip
    line on the page."""
    if src in STATIC_PAGES and static_audio_current(src):
        title = re.search(r"^# (.+)$", markdown, flags=re.M)
        label = (title.group(1).strip() if title else src) + ", read aloud"
        kind = "module" if src.startswith("pathway/") else "page"
        player = _listen_kind(player_html(src, page_slug(src), label), kind)
        lines = markdown.split("\n")
        for i, line in enumerate(lines):
            if line.startswith("## "):
                break
            if line.startswith('<span class="meta-chip"'):
                lines.insert(i + 1, "\n" + player)
                return "\n".join(lines)
        for i, line in enumerate(lines):
            if line.startswith("# "):
                lines.insert(i + 1, "\n" + player)
                break
        return "\n".join(lines)
    if src in NEWS_PAGES:
        h1 = re.search(r"^# (.+)$", markdown, flags=re.M)
        heading = h1.group(1).strip() if h1 else None
        out = []
        for chunk in re.split(r"(?m)^(?=## )", markdown):
            hm = re.match(r"^## (.+)$", chunk, flags=re.M)
            if hm:
                heading = hm.group(1).strip()
            if heading and '<div class="section-brief">' in chunk:
                slug = brief_slug(src, heading)
                if audio_exists(slug):
                    chunk = chunk.replace(
                        '<p class="section-brief-date">',
                        _listen_kind(player_html(src, slug, f"{heading} brief, read aloud"),
                                     "brief", heading)
                        + '\n<p class="section-brief-date">', 1)
            out.append(chunk)
        return "".join(out)
    if re.fullmatch(r"news/archive/\d{4}-w\d{2}\.md", src) and audio_exists(digest_slug(src)):
        return markdown.replace(
            "## The week in brief\n",
            "## The week in brief\n\n"
            + _listen_kind(player_html(src, digest_slug(src), "The week in brief, read aloud"), "brief")
            + "\n", 1)
    return markdown


def on_config(config):
    """Fail the build if the footer link config is missing or malformed.

    overrides/partials/copyright.html renders the footer links from
    config.extra.footer_links. If that key is absent, empty or mistyped the
    template simply renders nothing: the build passes, --strict passes, and
    both links vanish from all 80 pages with no error anywhere. That is the
    same silent-loss shape as the bug this replaced, so it is checked here
    rather than trusted (2026-09-08).

    The trailing-slash rule matters as much as the key's presence. An
    internal target written the way it appears under docs/, as
    "accessibility.md", would pass the url filter and produce a link to a
    file that is not served, recreating the original 404 from inside the fix.
    """
    links = (config.get("extra") or {}).get("footer_links")
    if not links:
        raise ValueError(
            "render_data hook: mkdocs.yml extra.footer_links is missing or "
            "empty. overrides/partials/copyright.html renders the footer "
            "links from it and would silently drop them from every page.")
    for link in links:
        missing = [key for key in ("text", "url") if not link.get(key)]
        if missing:
            raise ValueError(
                f"render_data hook: footer link {link!r} is missing "
                f"{', '.join(missing)}")
        url = link["url"]
        if "://" not in url and not url.endswith("/"):
            raise ValueError(
                f"render_data hook: internal footer link {url!r} must be the "
                f"address-bar path with a trailing slash, such as "
                f"'accessibility/', not a path under docs/. Without the "
                f"slash this rebuilds the 404 the config change removed.")
    print("render_data: footer links verification")
    print(f"  links configured: {len(links)} "
          f"({sum(1 for x in links if '://' in x['url'])} external, "
          f"{sum(1 for x in links if '://' not in x['url'])} internal)")
    return config


_TASK_LINK_RE = re.compile(r"tools/(?:index\.md)?\?task=([\w-]+)")


def _check_task_links(src: str, markdown: str, config) -> None:
    """Pages link straight to a filtered Tool Directory view
    (tools/index.md?task=study). MkDocs checks the page but not the task,
    and the chooser quietly shows no selection for an unknown id, so a
    renamed task would leave working-looking links that do nothing. Fail
    the build instead (2026-09-23)."""
    used = set(_TASK_LINK_RE.findall(markdown))
    if not used:
        return
    known = {t["id"] for t in _load(_data_dir(config) / "tool_tasks.yaml")}
    unknown = sorted(used - known)
    if unknown:
        raise ValueError(f"render_data hook: {src} links to unknown tool "
                         f"chooser task(s) {unknown}; see data/tool_tasks.yaml")


def on_page_markdown(markdown, page, config, files):
    src = page.file.src_uri
    _check_task_links(src, markdown, config)
    markdown += _reviewed_footer(page.meta, src)
    markdown = _inject_narration(src, markdown)
    if src == "tools/index.md":
        for marker in (TOOLS_MARKER, OPEN_MODELS_MARKER):
            if marker not in markdown:
                raise AssertionError(
                    f"render_data hook: tools/index.md is missing the "
                    f"{marker} marker"
                )
        for marker in (TOOL_CHOOSER_MARKER, TOOL_ACCESS_MARKER):
            if marker not in markdown:
                raise AssertionError(
                    "render_data hook: tools/index.md is missing the "
                    f"{marker} marker"
                )
        markdown = markdown.replace(TOOL_CHOOSER_MARKER, _render_tool_chooser(config))
        markdown = markdown.replace(TOOL_ACCESS_MARKER, _render_tool_access(config))
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
    if DIGEST_PAGE_RE.fullmatch(src):
        return _digest_page(src, markdown, config)
    if src == "basics/glossary.md":
        if GLOSSARY_AZ_MARKER not in markdown:
            raise AssertionError(
                "render_data hook: basics/glossary.md is missing the "
                f"{GLOSSARY_AZ_MARKER} marker"
            )
        return markdown.replace(GLOSSARY_AZ_MARKER, _render_glossary_az(markdown))
    if src == "basics/how-llms-work.md":
        if NEXT_TOKEN_MARKER not in markdown:
            raise AssertionError(
                "render_data hook: basics/how-llms-work.md is missing the "
                f"{NEXT_TOKEN_MARKER} marker"
            )
        return markdown.replace(NEXT_TOKEN_MARKER, _render_next_token_demo(config))
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
    if src == "tools/skills.md":
        if SKILLS_MARKER not in markdown:
            raise AssertionError(
                f"render_data hook: tools/skills.md is missing the "
                f"{SKILLS_MARKER} marker"
            )
        return markdown.replace(SKILLS_MARKER, _render_skills(config))
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
    # The homepage's "Last updated" stamp was removed on 2026-09-08 (owner
    # approved, external review). It printed date.today(), so it recorded
    # when the site was BUILT, not when anything changed: 144 of the last
    # 479 commits rebuilt and deployed with no pipeline run behind them, and
    # it advanced on every one. A freshness claim that cannot go stale
    # cannot warn anyone, and it read as a content date to a reader.
    #
    # Nothing replaced it because nothing needs to. The Latest items block
    # above it already prints the five newest item dates, is pipeline
    # generated, and therefore visibly freezes when the pipeline stops,
    # which is the honest signal the stamp was pretending to be.
    return markdown
