"""Generate narration audio for the pathway modules and the news briefs.

Usage:
    python scripts/narrate.py --only static   # the usual local run
    python scripts/narrate.py --dry-run       # report targets and staleness, no model
    python scripts/narrate.py --check         # exit 1 if committed static audio is stale
    python scripts/narrate.py --voices        # list metered voices, generates nothing
    python scripts/narrate.py --page SLUG     # one page, to trial a voice cheaply
    python scripts/narrate.py --promote-each  # keep finished pages when a sibling fails

A bare run covers both classes and so needs the Kokoro extras installed as
well as a metered key. Locally you almost always want --only static; CI runs
--only news.

Two engines, configured in the feeds.yaml narration block, never here:

  static  a metered cloud voice (Speechify simba-3.2), run on the
          maintainer's machine only. The MP3s are committed. CI has no key
          by design, so a page edited without a local re-run keeps stale
          audio and the build hook drops its player rather than reading
          superseded words aloud.
  news    Kokoro (hexgrad/Kokoro-82M, Apache 2.0) through kokoro-onnx, free
          and offline, because the briefs regenerate six times a day. Model
          files download once into NARRATION_MODEL_DIR (default
          ~/.cache/aua-narration); CI caches that directory.

Choose a metered voice with `--voices`, which lists the catalogue without
generating anything.

Text extraction follows the rules from the 2026-09-01 site audit: skip
icon shortcodes in headings, cue fully quoted headings as misconceptions,
skip front matter, meta-chip rows, snippet includes, SVG bodies (keep figure
captions), link-only list items and Next lines; read headings as section
cues; expand collapsed blocks as title then body; strip markdown links to
their text and drop citation parentheticals. A small owner-tunable lexicon
(data/narration_lexicon.yaml) spells out acronyms the voice would
otherwise read as words.

Every MP3 carries a sidecar .sha256 of the exact text it was read from
AND the engine that read it; matching hashes are skipped, so unchanged
pages cost nothing to rebuild and a voice change re-reads exactly the
pages that used it. Metered spend is budgeted against the provider's free
allowance before a run starts, and a run that would exceed it stops
before spending anything. Static pages are promoted together: if any one
of them fails, none are replaced, so a page set can never end up split
across two voices. --promote-each overrides that for a voice migration,
where the set is already mixed and holding pages back would only mean
paying twice for work an interrupted run threw away.
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
import base64
import io
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from narration_common import (AUDIO_DIR, DOCS, NEWS_PAGES, REPO,  # noqa: E402
                              STATIC_PAGES, apply_lexicon, brief_slug,
                              content_hash, digest_slug, engine_config,
                              load_lexicon, markdown_to_speech_text,
                              narration_config, page_slug, target_class)

# Local only, and deliberately outside the repository so it cannot be
# committed. CI never holds this key.
KEY_FILE = Path.home() / ".aua-narration" / "speechify.key"
SPEND_PATH = REPO / "data" / "narration_spend.json"
MODEL_DIR = Path(os.environ.get("NARRATION_MODEL_DIR", Path.home() / ".cache" / "aua-narration"))
MODEL_FILES = {
    "kokoro-v1.0.onnx": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx",
    "voices-v1.0.bin": "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin",
}
PARAGRAPH_PAUSE_S = 0.55
SAMPLE_RATE = 24000


# --- text extraction -------------------------------------------------------
# markdown_to_speech_text and the lexicon helpers live in narration_common
# so the MkDocs hook can compute the same hash without importing a voice.

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


def api_base(cfg: dict) -> str:
    return cfg.get("api_base", "https://api.speechify.ai").rstrip("/")


def speechify_key() -> str:
    """Environment first, then the local key file. Never a GitHub secret:
    CI must not be able to spend against a metered allowance."""
    key = os.environ.get("SPEECHIFY_API_KEY", "").strip()
    if not key and KEY_FILE.is_file():
        key = KEY_FILE.read_text(encoding="utf-8").strip()
    if not key:
        raise RuntimeError(
            "no Speechify API key. Set SPEECHIFY_API_KEY, or write the key "
            f"to {KEY_FILE}")
    return key


class KokoroEngine:
    """Local Apache 2.0 voice: free, offline, unmetered, so CI can run it
    six times a day without a key or a quota."""
    metered = False

    def __init__(self, cfg: dict):
        from kokoro_onnx import Kokoro
        model, voices = ensure_model()
        self._kokoro = Kokoro(str(model), str(voices))
        self._voice = cfg["voice"]

    def create(self, text: str):
        audio, sr = self._kokoro.create(text, voice=self._voice,
                                        speed=1.0, lang="en-us")
        return audio, sr, 0


class SpeechifyEngine:
    """Metered cloud voice for the committed static pages. Reports the
    provider's own billable character count, so the ledger records what was
    actually charged rather than what we guessed from the text length."""
    metered = True

    def __init__(self, cfg: dict):
        import requests
        if not cfg.get("voice"):
            raise RuntimeError(
                "feeds.yaml narration.static.voice is empty. List the "
                "catalogue with `python scripts/narrate.py --voices`, then "
                "set the voice_id you want.")
        self._requests = requests
        self._cfg = cfg
        self._key = speechify_key()
        self._url = api_base(cfg) + "/v1/audio/speech"
        self._check_voice_supports_model()

    def _check_voice_supports_model(self) -> None:
        """Most of the catalogue is simba-3.0 only. Pairing a voice with a
        model it does not offer is the kind of mistake that produces audio
        rather than an error, so it is checked once before generating."""
        want, vid = self._cfg.get("model", "simba-3.2"), self._cfg["voice"]
        entry = next((v for v in fetch_voices() if v.get("id") == vid), None)
        if entry is None:
            raise RuntimeError(
                f"voice {vid!r} is not in the Speechify catalogue; run "
                "`python scripts/narrate.py --voices`")
        have = [m.get("name") for m in entry.get("models") or []]
        if want not in have:
            raise RuntimeError(
                f"voice {vid!r} supports {have} but feeds.yaml asks for "
                f"{want!r}. Pick a voice that offers {want}, or set "
                f"narration.static.model to one this voice has.")

    def _post(self, body: dict, attempts: int = 4):
        """Retry transient failures. A page is dozens of calls and a whole
        run is hundreds, so at this length a blip is expected rather than
        exceptional, and a failure here discards a page that was already
        billed for. 4xx other than 429 will not improve on a retry, so they
        raise immediately."""
        delay, last = 2.0, None
        for attempt in range(attempts):
            try:
                resp = self._requests.post(
                    self._url,
                    headers={"Authorization": f"Bearer {self._key}",
                             "Content-Type": "application/json"},
                    json=body, timeout=180)
            except Exception as exc:  # noqa: BLE001  (connection, timeout, DNS)
                last = f"{type(exc).__name__}: {exc}"
            else:
                if resp.status_code == 200:
                    return resp
                detail = f"HTTP {resp.status_code}: {resp.text[:300]}"
                if resp.status_code < 500 and resp.status_code != 429:
                    raise RuntimeError(f"speechify {detail}")
                last = detail
            if attempt < attempts - 1:
                print(f"    retrying after {last} (attempt {attempt + 2}/{attempts})")
                time.sleep(delay)
                delay *= 2
        raise RuntimeError(f"speechify failed after {attempts} attempts: {last}")

    def create(self, text: str):
        import numpy as np
        import soundfile as sf
        resp = self._post({"input": text,
                           "voice_id": self._cfg["voice"],
                           # simba-3.0 is the API default; 3.2 must be asked for.
                           "model": self._cfg.get("model", "simba-3.2"),
                           "audio_format": "wav",
                           "language": self._cfg.get("language", "en-US")})
        payload = resp.json()
        samples, sr = sf.read(
            io.BytesIO(base64.b64decode(payload["audio_data"])), dtype="float32")
        if getattr(samples, "ndim", 1) > 1:
            samples = np.mean(samples, axis=1)
        billed = int(payload.get("billable_characters_count") or len(text))
        return samples, sr, billed


ENGINES = {"kokoro": KokoroEngine, "speechify": SpeechifyEngine}


def build_engine(cls: str):
    cfg = engine_config(cls)
    name = cfg["engine"]
    if name not in ENGINES:
        raise RuntimeError(
            f"feeds.yaml narration.{cls}.engine is {name!r}; known engines "
            f"are {', '.join(sorted(ENGINES))}")
    return ENGINES[name](cfg)


_VOICE_CACHE: list | None = None


def fetch_voices() -> list[dict]:
    """The whole catalogue, fetched once per process. It is cursor-paginated
    at 50 a page and runs to around a thousand entries, so a single unpaged
    request silently returns the first fifty alphabetically and hides the
    voice you wanted."""
    global _VOICE_CACHE
    if _VOICE_CACHE is not None:
        return _VOICE_CACHE
    import requests
    cfg = engine_config("static")
    hdr = {"Authorization": f"Bearer {speechify_key()}"}
    out, cursor, pages = [], None, 0
    while True:
        resp = requests.get(api_base(cfg) + "/v1/voices", headers=hdr,
                            params={"cursor": cursor} if cursor else {},
                            timeout=60)
        if resp.status_code != 200:
            raise RuntimeError(
                f"speechify voices HTTP {resp.status_code}: {resp.text[:300]}")
        body = resp.json()
        out += body.get("voices") or body.get("data") or []
        cursor = body.get("next_cursor")
        pages += 1
        if not body.get("has_more") or not cursor or pages > 50:
            break
    _VOICE_CACHE = out
    return out


def list_voices() -> int:
    """Print the voices the configured model can actually use. Costs nothing,
    so a voice is chosen by ear from the preview clips rather than by
    spending characters on trial generations.

    Model support is not universal: most of the catalogue is simba-3.0 only,
    and asking for a voice its model does not offer is a silent downgrade
    waiting to happen."""
    cfg = engine_config("static")
    model = cfg.get("model", "simba-3.2")
    voices = fetch_voices()
    rows, wrong_model, wrong_locale = [], 0, 0
    for v in voices:
        if not isinstance(v, dict):
            continue
        locale = str(v.get("locale") or "")
        if not locale.lower().startswith("en"):
            wrong_locale += 1
            continue
        if not any(m.get("name") == model for m in v.get("models") or []):
            wrong_model += 1
            continue
        traits = sorted({t.split(":", 1)[1] for t in v.get("tags") or []
                         if t.split(":", 1)[0] in ("style", "pitch", "timbre", "age")})
        rows.append((str(v.get("display_name") or "").lower(),
                     f"  {v.get('id', ''):16} {v.get('display_name', ''):14} "
                     f"{v.get('gender', ''):7} {locale:6} {','.join(traits)}\n"
                     f"    preview: {v.get('preview_audio', '')}"))
    print(f"narrate: {len(rows)} English voices support {model} "
          f"({wrong_model} English voices are other models, "
          f"{wrong_locale} are other locales, {len(voices)} in the catalogue)")
    if not rows:
        print("narrate: nothing matched. Check narration.static.model in feeds.yaml.")
        return 1
    print(f"  {'voice_id':16} {'name':14} {'gender':7} {'locale':6} traits")
    for _, line in sorted(rows):
        print(line)
    print("\nSet the chosen voice_id as narration.static.voice in feeds.yaml.")
    return 0


# --- metered spend ---------------------------------------------------------

def _month() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def load_spend() -> dict | None:
    """The ledger, or None if it could not be read.

    None is not {}. An unreadable ledger means this month's spend is
    UNKNOWN, and treating unknown as zero would let the guard wave through a
    run that walks straight into the provider's hard cap. The caller must
    refuse rather than guess."""
    if not SPEND_PATH.is_file():
        return {}
    try:
        data = json.loads(SPEND_PATH.read_text(encoding="utf-8"))
    except (ValueError, OSError):
        return None
    return data if isinstance(data, dict) else None


def record_spend(engine: str, chars: int) -> None:
    """Written atomically. A run interrupted mid-write (a closed laptop
    during a long generation is the expected case) would otherwise leave
    truncated JSON, which is exactly the state load_spend refuses to
    interpret."""
    if not chars:
        return
    spend = load_spend()
    if spend is None:
        # Unreadable: do not silently start a new ledger over the top of one
        # whose contents we could not read.
        print(f"narrate: {SPEND_PATH.name} unreadable, not recording "
              f"{chars:,} characters; reconcile against the provider dashboard")
        return
    spend.setdefault(engine, {})
    spend[engine][_month()] = spend[engine].get(_month(), 0) + chars
    tmp = SPEND_PATH.with_name(SPEND_PATH.name + ".part")
    tmp.write_text(json.dumps(spend, indent=2, sort_keys=True) + "\n",
                   encoding="utf-8")
    tmp.replace(SPEND_PATH)


def budget_report(engine: str, planned: int) -> tuple[bool, str]:
    """Advisory guard against a hard-capped free allowance. The provider
    resets on its own billing date rather than the calendar month, so this
    is deliberately conservative: better to refuse a run than to fail part
    way through one and split a page set across two voices."""
    budget = (narration_config().get("monthly_char_budget") or {}).get(engine)
    if not budget:
        return True, f"{engine}: no monthly budget configured"
    spend = load_spend()
    if spend is None:
        return False, (f"{engine}: {SPEND_PATH.name} is unreadable, so this "
                       f"month's spend is unknown. Refusing rather than "
                       f"assuming zero. Check the provider dashboard, then "
                       f"restore or reset the ledger by hand.")
    spent = spend.get(engine, {}).get(_month(), 0)
    left = budget - spent
    ok = planned <= left
    return ok, (f"{engine}: {planned:,} to send, {spent:,} spent this month, "
                f"{left:,} of {budget:,} left"
                + ("" if ok else "   OVER BUDGET"))


def synthesize(engine, text: str, out: Path, on_billed=None) -> tuple[float, int]:
    """on_billed is called with each API call's billable characters as they
    are incurred, so an interrupted page still leaves an accurate ledger."""
    import numpy as np
    import soundfile as sf
    chunks, billed, sr = [], 0, SAMPLE_RATE
    for para in [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]:
        if not re.search(r"[A-Za-z0-9]", para):
            continue
        audio, sr, chars = engine.create(para)
        if chars and on_billed:
            on_billed(chars)
        chunks.append(audio)
        chunks.append(np.zeros(int(sr * PARAGRAPH_PAUSE_S), dtype=np.float32))
        billed += chars
    wave = np.concatenate(chunks)
    out.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(out), wave, sr, format="MP3")
    return len(wave) / sr, billed


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--only", choices=["static", "news"])
    ap.add_argument("--force", action="store_true", help="regenerate even when the hash matches")
    ap.add_argument("--check", action="store_true",
                    help="list static pages whose committed audio is missing or stale and exit 1 if any; no generation")
    ap.add_argument("--voices", action="store_true",
                    help="list the metered engine's voice catalogue and exit; generates nothing")
    ap.add_argument("--page", action="append",
                    help="restrict to these slugs (repeatable), so a metered voice "
                         "can be trialled on one page before spending the month")
    ap.add_argument("--promote-each", action="store_true",
                    help="keep each static page as it finishes instead of holding "
                         "the set back when a sibling fails. For migrating a set to "
                         "a new voice, where the pages are already mixed and an "
                         "interrupted run would otherwise be paid for twice")
    args = ap.parse_args()

    if args.voices:
        return list_voices()

    targets = []
    if args.only in (None, "static"):
        targets += static_targets()
    if args.only in (None, "news"):
        targets += news_targets()
    if args.page:
        # Filter targets, not todo, so the verification cross-check stays honest.
        targets = [t for t in targets if t[0] in args.page]
        if not targets:
            print(f"narrate: no target matches {args.page}")
            return 1

    todo, skipped = [], 0
    for slug, label, text in targets:
        cls = target_class(slug)
        spoken = apply_lexicon(text, load_lexicon(engine_config(cls)["engine"]))
        h = content_hash(cls, spoken)
        side = AUDIO_DIR / f"{slug}.sha256"
        mp3 = AUDIO_DIR / f"{slug}.mp3"
        if not args.force and mp3.exists() and side.exists() and side.read_text().strip() == h:
            skipped += 1
            continue
        why = "missing" if not mp3.exists() else "text or voice changed"
        todo.append((slug, cls, spoken, h, why))

    print("narrate: plan")
    print(f"  targets read : {len(targets)}")
    print(f"  up to date   : {skipped}")
    print(f"  to generate  : {len(todo)}")
    for slug, cls, spoken, _, why in todo:
        words = len(spoken.split())
        print(f"    {slug:44} {words:5d} words  ~{words/150:.1f} min  ({cls}, {why})")

    planned: dict[str, int] = {}
    for slug, cls, spoken, _, _ in todo:
        name = engine_config(cls)["engine"]
        if getattr(ENGINES.get(name), "metered", False):
            planned[name] = planned.get(name, 0) + len(spoken)
    over = False
    for name, chars in sorted(planned.items()):
        ok, msg = budget_report(name, chars)
        print(f"  budget       : {msg}")
        over = over or not ok

    if args.check:
        stale = [(slug, why) for slug, cls, _, _, why in todo if cls == "static"]
        if not stale:
            print("narrate: check ok, committed static narration matches every page")
            return 0
        for slug, why in stale:
            msg = (f"static narration {why}: {slug} (CI cannot re-read it, so the "
                   f"build serves that page without a player; run "
                   f"scripts/narrate.py locally and commit the MP3)")
            print(("::warning::" if os.environ.get("GITHUB_ACTIONS") else "narrate: STALE ") + msg)
        return 1
    if args.dry_run or not todo:
        return 0
    if over:
        print("narrate: refusing to start. The run would exceed a configured "
              "monthly allowance, and a part-spent run would leave a page set "
              "split across two voices. Wait for the provider's reset or raise "
              "narration.monthly_char_budget in feeds.yaml.")
        return 1

    engines: dict[str, object] = {}
    made: list[tuple] = []
    failed = {"static": 0, "news": 0}
    t0 = time.time()
    for slug, cls, spoken, h, _ in todo:
        tmp = AUDIO_DIR / f"{slug}.mp3.part"
        try:
            if cls not in engines:
                engines[cls] = build_engine(cls)
            ename = engine_config(cls)["engine"]
            secs, billed = synthesize(engines[cls], spoken, tmp,
                                      on_billed=lambda c, e=ename: record_spend(e, c))
            made.append((slug, cls, tmp, h, secs, billed))
        except Exception as exc:  # noqa: BLE001
            failed[cls] += 1
            tmp.unlink(missing_ok=True)
            print(f"  FAILED {slug}: {type(exc).__name__}: {exc}")

    # Spend was recorded per call above, as it was incurred. This is only
    # the run summary.
    billed_by_engine: dict[str, int] = {}
    for _, cls, _, _, _, billed in made:
        if billed:
            name = engine_config(cls)["engine"]
            billed_by_engine[name] = billed_by_engine.get(name, 0) + billed

    # Static pages are promoted together. A half-applied voice change would
    # leave one page set narrated by two voices, which is worse for a reader
    # than leaving every page on its previous recording.
    generated, held, total_audio = 0, 0, 0.0
    for slug, cls, tmp, h, secs, _ in made:
        if cls == "static" and failed["static"] and not args.promote_each:
            tmp.unlink(missing_ok=True)
            held += 1
            continue
        tmp.replace(AUDIO_DIR / f"{slug}.mp3")
        (AUDIO_DIR / f"{slug}.sha256").write_text(h + "\n")
        generated += 1
        total_audio += secs
        print(f"  wrote {slug}.mp3 ({secs/60:.1f} min)")
    if held:
        print(f"  held back {held} static file(s): a sibling failed, so none were "
              f"replaced and every page keeps its previous recording")

    elapsed = time.time() - t0
    fail_total = failed["static"] + failed["news"]
    accounted = generated + held + skipped + fail_total
    print("narrate: verification")
    print(f"  targets read : {len(targets)}")
    print(f"  generated    : {generated}")
    print(f"  up to date   : {skipped}")
    print(f"  held back    : {held}")
    print(f"  failed       : {fail_total}")
    for name, chars in sorted(billed_by_engine.items()):
        print(f"  billed chars : {chars:,} ({name})")
    print(f"  audio minutes: {total_audio/60:.1f} in {elapsed:.0f}s "
          f"(cross-check {'ok' if accounted == len(targets) else 'MISMATCH'})")
    return 1 if fail_total or accounted != len(targets) else 0


if __name__ == "__main__":
    sys.exit(main())
