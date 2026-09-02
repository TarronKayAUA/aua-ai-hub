"""Shared narration helpers, imported by scripts/narrate.py (which generates
the audio) and scripts/render_data.py (which injects the players at build
time). Kept dependency-free so the MkDocs hook never imports the voice
model.

Audio lives in docs/assets/audio/. Static page narration (the pathway
modules) is committed; news narration (section briefs and the weekly
digest narrative) is generated during the CI build and gitignored, so a
site build that has not run scripts/narrate.py simply renders those pages
without a player. Every MP3 has a sidecar .sha256 holding the hash of the
text it was read from, which is how unchanged text is never re-narrated.
"""
from __future__ import annotations

import hashlib
import re
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
AUDIO_DIR = REPO / "docs" / "assets" / "audio"

# Static pages narrated once and committed (relative to docs/).
STATIC_PAGES = [
    "pathway/how-ai-works.md",
    "pathway/prompting.md",
    "pathway/rules.md",
    "pathway/teaching-assessment.md",
    "pathway/research.md",
    "pathway/clinical.md",
    "pathway/working-with-agents.md",
    # Second round, owner approved 2026-09-01.
    "basics/how-llms-work.md",
    "basics/misconceptions.md",
]

# News pages whose section briefs are narrated at build time.
NEWS_PAGES = [
    "news/this-week.md",
    "news/medical-education.md",
    "news/clinical-practice.md",
    "news/general-ai.md",
]

VOICE = "am_michael"
NOTE = ("Read aloud from this page's text by an open-source voice; the text "
        "is authoritative.")


def page_slug(rel: str) -> str:
    """'pathway/how-ai-works.md' -> 'pathway-how-ai-works'."""
    return re.sub(r"[^a-z0-9]+", "-", rel[:-3].lower()).strip("-")


def brief_slug(rel: str, heading: str) -> str:
    """One MP3 per section brief: page slug plus the H2 it sits under."""
    h = re.sub(r"[^a-z0-9]+", "-", heading.lower()).strip("-")
    return f"news-{page_slug(rel)[5:]}-{h}"


def digest_slug(rel: str) -> str:
    """'news/archive/2026-w35.md' -> 'digest-2026-w35'."""
    return "digest-" + Path(rel).stem


def text_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def audio_exists(slug: str) -> bool:
    return (AUDIO_DIR / f"{slug}.mp3").is_file()


def rel_audio_src(page_rel: str, slug: str) -> str:
    """Page-relative src for raw HTML, which MkDocs does not rewrite.
    docs/news/this-week.md serves from /news/this-week/, two levels deep."""
    depth = page_rel.count("/") + 1
    return "../" * depth + f"assets/audio/{slug}.mp3"


def player_html(page_rel: str, slug: str, label: str) -> str:
    src = rel_audio_src(page_rel, slug)
    return (
        '<div class="listen">'
        f'<audio controls preload="none" src="{src}" aria-label="{label}"></audio>'
        f'<span class="listen-note">{NOTE}</span>'
        "</div>"
    )
