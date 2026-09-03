"""Shared narration helpers, imported by scripts/narrate.py (which generates
the audio) and scripts/render_data.py (which injects the players at build
time). No voice model is imported here, so the MkDocs hook stays light.

Audio lives in docs/assets/audio/. Static page narration is generated on
the maintainer's machine with the metered voice configured in feeds.yaml
and committed; news narration (section briefs and the weekly digest
narrative) is generated during the CI build with the local model and
gitignored, so a site build that has not run scripts/narrate.py simply
renders those pages without a player.

Every MP3 has a sidecar .sha256 holding a hash of the text it was read
from AND the engine identity that read it, which is how unchanged text is
never re-narrated and how changing a voice re-reads exactly the pages
that used it.

CI cannot generate static narration: the metered engine's key is
deliberately absent there, so a page edited without a local re-run keeps
stale audio. static_audio_current() is how the hook detects that and
drops the player rather than serving a recording that no longer matches
the words on the page. The daily narration-health workflow raises an
issue when that happens.
"""
from __future__ import annotations

import hashlib
import html
import re
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
DOCS = REPO / "docs"
AUDIO_DIR = DOCS / "assets" / "audio"
FEEDS_PATH = REPO / "feeds.yaml"
LEXICON_PATH = REPO / "data" / "narration_lexicon.yaml"

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

# Speechify's API terms require a "commercially reasonable disclosure
# clearly indicating that the Synthetic Output is AI-generated and not a
# human voice". One wording covers both engines, so the note stays true
# whichever voice read the page.
NOTE = ("Read aloud from this page's text by an AI-generated voice, not a "
        "human narrator; the text is authoritative.")

_CONFIG_CACHE: dict | None = None
_LEXICON_CACHE: dict[str, list] = {}


# --- configuration ---------------------------------------------------------

def narration_config() -> dict:
    """The narration block from feeds.yaml. Read once per process."""
    global _CONFIG_CACHE
    if _CONFIG_CACHE is None:
        data = yaml.safe_load(FEEDS_PATH.read_text(encoding="utf-8")) or {}
        cfg = data.get("narration")
        if not isinstance(cfg, dict):
            raise AssertionError(
                "feeds.yaml is missing the 'narration' block; narration "
                "engines are configuration, never hardcoded")
        for key in ("static", "news"):
            if not isinstance(cfg.get(key), dict) or not cfg[key].get("engine"):
                raise AssertionError(
                    f"feeds.yaml narration.{key} must set an engine")
        _CONFIG_CACHE = cfg
    return _CONFIG_CACHE


def target_class(slug: str) -> str:
    """Which narration config governs a slug. News briefs and the weekly
    digest are built in CI; everything else is a committed static page."""
    return "news" if slug.startswith(("news-", "digest-")) else "static"


def engine_config(cls: str) -> dict:
    return narration_config()[cls]


def engine_id(cls: str) -> str:
    """Identity of the voice that reads this class of target, folded into
    the sidecar hash. Changing any part re-reads the affected pages."""
    c = engine_config(cls)
    return f"{c['engine']}/{c.get('model', '')}/{c.get('voice', '')}"


# --- text extraction -------------------------------------------------------

def load_lexicon(engine: str) -> list[tuple[re.Pattern, str]]:
    """Substitution rules for one engine. A missing section means no rules,
    which is the correct starting point for any newly added voice."""
    if engine not in _LEXICON_CACHE:
        rules = []
        if LEXICON_PATH.exists():
            data = yaml.safe_load(LEXICON_PATH.read_text(encoding="utf-8")) or {}
            section = (data.get("engines") or {}).get(engine) or {}
            for term, spoken in (section.get("terms") or {}).items():
                # A trailing hyphen is allowed so "AI-generated" reads "A I-generated".
                rules.append((re.compile(rf"(?<![\w-]){re.escape(term)}(?!\w)"), spoken))
        _LEXICON_CACHE[engine] = rules
    return _LEXICON_CACHE[engine]


def apply_lexicon(text: str, rules) -> str:
    for pat, spoken in rules:
        text = pat.sub(spoken, text)
    return text


def markdown_to_speech_text(src: str) -> str:
    src = re.sub(r"^---\n.*?\n---\n", "", src, flags=re.S)
    src = re.sub(r"<figure.*?</figure>",
                 lambda m: "\n" + (re.search(r"<figcaption>(.*?)</figcaption>", m.group(0), re.S).group(1).strip()
                                   if "<figcaption>" in m.group(0) else "") + "\n",
                 src, flags=re.S)
    src = re.sub(r"<svg.*?</svg>", "", src, flags=re.S)
    src = re.sub(r'^<span class="meta-chip".*$', "", src, flags=re.M)
    src = re.sub(r"^--8<--.*$", "", src, flags=re.M)
    src = re.sub(r"^\*\*Next:\*\*.*$", "", src, flags=re.M)
    src = re.sub(r"^\*\*Done with the core pathway\?\*\*.*$", "", src, flags=re.M)
    src = re.sub(r"<[^>]+>", "", src)
    out = []
    for line in src.split("\n"):
        s = line.rstrip()
        if not s.strip():
            out.append("")
            continue
        # Horizontal rules and other punctuation-only lines have nothing to
        # say; the voice model raises on a paragraph with no phonemes.
        if re.fullmatch(r"\s*[-*_=]{3,}\s*", s):
            out.append("")
            continue
        m = re.match(r"^(#{1,6})\s+(.*)$", s)
        if m:
            heading = re.sub(r":[a-z0-9_-]+:\s*", "", m.group(2)).strip().rstrip(".")
            # A heading that is entirely a quotation names a misconception
            # (basics/misconceptions.md); cue it so it is not heard as an
            # assertion.
            if re.fullmatch(r'"[^"]+"', heading):
                heading = "Misconception: " + heading
            out.append("\n" + heading + ".")
            continue
        m = re.match(r'^(\?\?\?|!!!)\+?\s+\w+\s+"(.*)"$', s)
        if m:
            out.append("\n" + m.group(2).strip().rstrip(".") + ".")
            continue
        s = re.sub(r"^\s{4}", "", s)
        s = re.sub(r"\(\[(?:DOI|PubMed Central|arXiv|PubMed|PMC)\]\([^)]*\)\)", "", s)
        s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)
        s = re.sub(r"\*\*([^*]+)\*\*", r"\1", s)
        s = re.sub(r"(?<!\w)\*([^*]+)\*(?!\w)", r"\1", s)
        s = re.sub(r"`([^`]+)`", r"\1", s)
        s = re.sub(r"^\s*- \[ \] ", "", s)
        if re.match(r"^\s*[-*]\s+\S+\s*$", s):
            continue
        is_item = bool(re.match(r"^\s*(?:[-*]|\d+\.)\s+", s))
        s = re.sub(r"^\s*[-*]\s+", "", s)
        s = re.sub(r"^\s*\d+\.\s+", "", s)
        out.append(s.strip())
        if is_item:
            # Each list item becomes its own spoken paragraph, so the voice
            # pauses between items instead of running a list together.
            out.append("")
    text = "\n".join(out)
    text = html.unescape(text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def spoken_static(rel: str) -> str:
    """The exact text the static engine is handed for one page, read from
    disk so the build hook and the generator always agree."""
    md = (DOCS / rel).read_text(encoding="utf-8")
    engine = engine_config("static")["engine"]
    return apply_lexicon(markdown_to_speech_text(md), load_lexicon(engine))


# --- slugs and hashes ------------------------------------------------------

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


def content_hash(cls: str, spoken: str) -> str:
    """Sidecar hash: the spoken text plus the voice that read it. Text alone
    would let an engine or voice change slip through silently, because the
    words on the page did not move."""
    return text_hash(engine_id(cls) + "\n" + spoken)


def audio_exists(slug: str) -> bool:
    return (AUDIO_DIR / f"{slug}.mp3").is_file()


def sidecar_matches(slug: str, expected: str) -> bool:
    side = AUDIO_DIR / f"{slug}.sha256"
    return side.is_file() and side.read_text().strip() == expected


def static_audio_current(rel: str) -> bool:
    """True when a static page's committed MP3 was read from the page's
    current text by the currently configured voice. False means the page
    was edited (or the voice changed) without a local re-run, so the build
    serves no player rather than a recording of superseded words."""
    slug = page_slug(rel)
    if not audio_exists(slug):
        return False
    # Only file-level errors mean "no audio yet". A malformed narration block
    # raises AssertionError, and swallowing that would silently ship a site
    # with no players anywhere rather than failing the strict build.
    try:
        return sidecar_matches(slug, content_hash("static", spoken_static(rel)))
    except OSError:
        return False


# --- player ----------------------------------------------------------------

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
