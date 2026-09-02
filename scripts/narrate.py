"""Generate narration audio for the pathway modules and the news briefs.

Usage:
    python scripts/narrate.py            # generate whatever is missing or stale
    python scripts/narrate.py --dry-run  # report targets and staleness, no model
    python scripts/narrate.py --only static | news
    python scripts/narrate.py --check    # exit 1 if any committed static audio is stale

Voice: Kokoro (hexgrad/Kokoro-82M, Apache 2.0) through kokoro-onnx, the
"am_michael" voice, chosen by the owner 2026-09-01. Model files are
downloaded once into NARRATION_MODEL_DIR (default ~/.cache/aua-narration)
from the kokoro-onnx project's release; CI caches that directory.

Text extraction follows the rules from the 2026-09-01 site audit: skip
icon shortcodes in headings, cue fully quoted headings as misconceptions,
skip front matter, meta-chip rows, snippet includes, SVG bodies (keep figure
captions), link-only list items and Next lines; read headings as section
cues; expand collapsed blocks as title then body; strip markdown links to
their text and drop citation parentheticals. A small owner-tunable lexicon
(data/narration_lexicon.yaml) spells out acronyms the voice would
otherwise read as words.

Every MP3 carries a sidecar .sha256 of the exact text it was read from;
matching hashes are skipped, so unchanged pages cost nothing to rebuild.
Verification counts print at the end and the script exits non-zero if
any target failed (CLAUDE.md working rule 2).
"""
from __future__ import annotations

import argparse
import html
import os
import re
import sys
import time
import urllib.request
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
from narration_common import (AUDIO_DIR, NEWS_PAGES, REPO, STATIC_PAGES, VOICE,  # noqa: E402
                              brief_slug, digest_slug, page_slug, text_hash)

DOCS = REPO / "docs"
LEXICON_PATH = REPO / "data" / "narration_lexicon.yaml"
MODEL_DIR = Path(os.environ.get("NARRATION_MODEL_DIR", Path.home() / ".cache" / "aua-narration"))
MODEL_FILES = {
    "kokoro-v1.0.onnx": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx",
    "voices-v1.0.bin": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
}
PARAGRAPH_PAUSE_S = 0.55
SAMPLE_RATE = 24000


# --- text extraction -------------------------------------------------------

def load_lexicon() -> list[tuple[re.Pattern, str]]:
    if not LEXICON_PATH.exists():
        return []
    data = yaml.safe_load(LEXICON_PATH.read_text(encoding="utf-8")) or {}
    rules = []
    for term, spoken in (data.get("terms") or {}).items():
        # A trailing hyphen is allowed so "AI-generated" reads "A I-generated".
        rules.append((re.compile(rf"(?<![\w-]){re.escape(term)}(?!\w)"), spoken))
    return rules


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


def brief_paragraphs(rendered_html_block: str) -> str:
    """Section brief div -> spoken text: paragraphs minus the date line and
    the numbered source references."""
    paras = re.findall(r"<p(?: class=\"([^\"]*)\")?>(.*?)</p>", rendered_html_block, flags=re.S)
    keep = []
    for cls, body in paras:
        if "section-brief-date" in (cls or ""):
            continue
        body = re.sub(r"<a[^>]*>\s*\[\d+\]\s*</a>", "", body)
        body = re.sub(r"<[^>]+>", "", body)
        body = re.sub(r"\s*\[\d+\]", "", body)
        body = html.unescape(re.sub(r"\s+", " ", body)).strip()
        if body:
            keep.append(body)
    return "\n\n".join(keep)


def news_targets() -> list[tuple[str, str, str]]:
    """(slug, label, text) for every section brief on the news pages, plus
    the newest digest narrative."""
    targets = []
    for rel in NEWS_PAGES:
        p = DOCS / rel
        if not p.exists():
            continue
        md = p.read_text(encoding="utf-8")
        h1 = re.search(r"^# (.+)$", md, flags=re.M)
        heading = h1.group(1).strip() if h1 else None
        for chunk in re.split(r"(?m)^(?=## )", md):
            hm = re.match(r"^## (.+)$", chunk, flags=re.M)
            if hm:
                heading = hm.group(1).strip()
            bm = re.search(r'<div class="section-brief">(.*?)</div>', chunk, flags=re.S)
            if bm and heading:
                text = brief_paragraphs(bm.group(1))
                if text:
                    targets.append((brief_slug(rel, heading), f"{heading} brief, read aloud",
                                    heading + ".\n\n" + text))
    archive = sorted((DOCS / "news" / "archive").glob("2026-w*.md"))
    if archive:
        newest = archive[-1]
        md = newest.read_text(encoding="utf-8")
        sec = re.search(r"^## The week in brief\n(.*?)(?=^## |\Z)", md, flags=re.S | re.M)
        if sec:
            text = markdown_to_speech_text(sec.group(1))
            if text:
                rel = f"news/archive/{newest.name}"
                targets.append((digest_slug(rel), "The week in brief, read aloud",
                                "The week in brief.\n\n" + text))
    return targets


def static_targets() -> list[tuple[str, str, str]]:
    targets = []
    for rel in STATIC_PAGES:
        p = DOCS / rel
        md = p.read_text(encoding="utf-8")
        title = re.search(r"^# (.+)$", md, flags=re.M).group(1).strip()
        targets.append((page_slug(rel), f"{title}, read aloud", markdown_to_speech_text(md)))
    return targets


# --- synthesis -------------------------------------------------------------

def ensure_model() -> tuple[Path, Path]:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    for name, url in MODEL_FILES.items():
        dest = MODEL_DIR / name
        if dest.exists() and dest.stat().st_size > 1_000_000:
            continue
        print(f"narrate: downloading {name} from {url}")
        urllib.request.urlretrieve(url, dest)
    return MODEL_DIR / "kokoro-v1.0.onnx", MODEL_DIR / "voices-v1.0.bin"


def synthesize(engine, text: str, out: Path) -> float:
    import numpy as np
    import soundfile as sf
    chunks = []
    sr = SAMPLE_RATE
    for para in [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]:
        if not re.search(r"[A-Za-z0-9]", para):
            continue
        audio, sr = engine.create(para, voice=VOICE, speed=1.0, lang="en-us")
        chunks.append(audio)
        chunks.append(np.zeros(int(sr * PARAGRAPH_PAUSE_S), dtype=np.float32))
    wave = np.concatenate(chunks)
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(out), wave, sr, format="MP3")
    return len(wave) / sr


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", choices=["static", "news"])
    ap.add_argument("--force", action="store_true", help="regenerate even when the hash matches")
    ap.add_argument("--check", action="store_true",
                    help="list static pages whose committed audio is missing or stale and exit 1 if any; no generation")
    args = ap.parse_args()

    rules = load_lexicon()
    targets = []
    if args.only in (None, "static"):
        targets += static_targets()
    if args.only in (None, "news"):
        targets += news_targets()

    todo, skipped = [], 0
    for slug, label, text in targets:
        spoken = apply_lexicon(text, rules)
        h = text_hash(spoken)
        side = AUDIO_DIR / f"{slug}.sha256"
        mp3 = AUDIO_DIR / f"{slug}.mp3"
        if not args.force and mp3.exists() and side.exists() and side.read_text().strip() == h:
            skipped += 1
            continue
        todo.append((slug, label, spoken, h, "missing" if not mp3.exists() else "text changed"))

    print("narrate: plan")
    print(f"  targets read : {len(targets)}")
    print(f"  up to date   : {skipped}")
    print(f"  to generate  : {len(todo)}")
    for slug, _, spoken, _, why in todo:
        words = len(spoken.split())
        print(f"    {slug:44} {words:5d} words  ~{words/150:.1f} min  ({why})")
    if args.check:
        stale = [(slug, why) for slug, _, _, _, why in todo if not slug.startswith(("news-", "digest-"))]
        if not stale:
            print("narrate: check ok, committed static narration matches every page")
            return 0
        for slug, why in stale:
            msg = f"static narration {why}: {slug} (the build will re-read it; run scripts/narrate.py and commit the MP3 to make it durable)"
            print(("::warning::" if os.environ.get("GITHUB_ACTIONS") else "narrate: STALE ") + msg)
        return 1
    if args.dry_run or not todo:
        return 0

    from kokoro_onnx import Kokoro
    model, voices = ensure_model()
    engine = Kokoro(str(model), str(voices))
    generated, failed, total_audio, t0 = 0, 0, 0.0, time.time()
    for slug, _, spoken, h, _ in todo:
        try:
            secs = synthesize(engine, spoken, AUDIO_DIR / f"{slug}.mp3")
            (AUDIO_DIR / f"{slug}.sha256").write_text(h + "\n")
            generated += 1
            total_audio += secs
            print(f"  wrote {slug}.mp3 ({secs/60:.1f} min)")
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"  FAILED {slug}: {type(exc).__name__}: {exc}")
    elapsed = time.time() - t0
    print("narrate: verification")
    print(f"  targets read : {len(targets)}")
    print(f"  generated    : {generated}")
    print(f"  up to date   : {skipped}")
    print(f"  failed       : {failed}")
    print(f"  audio minutes: {total_audio/60:.1f} in {elapsed:.0f}s "
          f"(cross-check {'ok' if generated + skipped + failed == len(targets) else 'MISMATCH'})")
    return 1 if failed or generated + skipped + failed != len(targets) else 0


if __name__ == "__main__":
    sys.exit(main())
