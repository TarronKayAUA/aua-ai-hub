"""MkDocs hook: a description for every page, taken from the page's own opening (2026-10-02).

Why: until now all 115 pages carried the same <meta name="description">, the site
tagline, so search results, link previews and AI systems could not tell one page from
another (owner request, discoverability). No new wording is written here; each page's
description is `description:` from its front matter, kept as written (for a page
whose opening does not summarize it), or else the first paragraph on the page that is
either

- its lede, the paragraph a page sets apart to introduce itself (a class ending in
  "-lede" or "-intro": the hub, prompt, guide and landing pages have one), or
- its own prose: at least MIN_CHARS long, outside admonitions, figures, tables,
  details and navigation, and not the header line of audience and reading-time chips
  or a callout that opens with a bold label ("See it done:").

The text is trimmed to whole sentences within MAX_CHARS, or, when the first sentence
alone is longer, cut at a clause or a word with an ellipsis. The home page keeps the
site description (config.site_description), which was written for it.

Material's template inserts page.meta.description unescaped (MkDocs' Jinja environment
does not autoescape), so the value is HTML-escaped here; overrides/main.html reuses it
for the og:description and twitter:description tags.

Registered right after render_data.py, so a page's rendered data is in the content but
the layout hooks have not yet rearranged it.
"""

from __future__ import annotations

import html
import re
from html.parser import HTMLParser

MAX_CHARS = 160
MIN_CHARS = 50
MIN_LEDE_CHARS = 20
SHORT_CHARS = 70

# Containers whose paragraphs are asides, captions, notes or navigation, not the
# page's own opening statement.
_SKIP_TAGS = {"figure", "figcaption", "nav", "table", "details", "summary",
              "blockquote", "pre", "code", "aside", "header", "footer", "form"}
_VOID = {"br", "img", "hr", "input", "meta", "link", "source", "wbr", "area", "col", "embed", "track"}
# A lede class: "hub-lede", "pp-lede", "guide-index-intro" and the like, but not
# "pp-text-intro" (which introduces a prompt's text, not the page).
_LEDE_CLASS = re.compile(r"(?:^|-)(?:lede|intro)$")
_NOT_LEDE = {"pp-text-intro"}

# A sentence ends at . ! or ? followed by a space and a capital, digit, quote or
# bracket, except after the abbreviations the site uses ("Dr. Tarron", "e.g. ...").
_SENTENCE_END = re.compile(
    r"(?<!\bDr\.)(?<!\bSt\.)(?<!\bvs\.)(?<!\be\.g\.)(?<!\bi\.e\.)(?<!\betc\.)"
    r"(?<=[.!?])\s+(?=[A-Z0-9\"'(“])")
# Words a cut description should not end on.
_WEAK_END = {"a", "an", "the", "and", "or", "but", "nor", "so", "of", "to", "in", "on", "for",
             "with", "by", "from", "at", "as", "about", "into", "over", "than", "between",
             "through", "without", "is", "are", "was", "be", "its", "their", "your", "our",
             "my", "you", "we", "that", "which", "who", "where", "when", "how", "what",
             "dr.", "st.", "vs.", "e.g.", "i.e."}

_stats = {"lede": 0, "opening": 0, "front_matter": 0, "home": 0, "none": []}


class _Paragraphs(HTMLParser):
    """Collects every <p> outside a skipped container, with its class, whether it
    opens with a bold label, and whether it is a line of meta chips."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, bool]] = []
        self.current: dict | None = None
        self.paragraphs: list[dict] = []

    def handle_starttag(self, tag, attrs):
        if tag in _VOID:
            return
        cls = dict(attrs).get("class") or ""
        cur = self.current
        if cur is not None:
            if tag in ("strong", "b") and not "".join(cur["text"]).strip():
                cur["bold_led"] = True
            if "meta-chip" in cls or "meta-note" in cls:
                cur["meta"] = True
        inside = any(skip for _, skip in self.stack)
        skip = inside or tag in _SKIP_TAGS or (tag == "div" and "admonition" in cls)
        self.stack.append((tag, skip))
        if tag == "p" and not skip:
            self.current = {"cls": cls.split(), "text": [], "bold_led": False, "meta": False}

    def handle_endtag(self, tag):
        if tag in _VOID:
            return
        while self.stack:
            name, _ = self.stack.pop()
            if name == tag:
                break
        if tag == "p" and self.current is not None:
            cur = self.current
            cur["text"] = " ".join("".join(cur["text"]).split())
            self.paragraphs.append(cur)
            self.current = None

    def handle_data(self, data):
        if self.current is not None:
            self.current["text"].append(data)


def _cut(text: str) -> str:
    """The first MAX_CHARS of a long sentence, ended at a clause or a word, never
    inside an open parenthesis or on a word that leaves the reader hanging."""
    head = text[:MAX_CHARS - 1]
    clause = max(head.rfind(", "), head.rfind("; "), head.rfind(": "))
    head = head[:clause] if clause >= MAX_CHARS * 0.66 else head.rsplit(" ", 1)[0]
    if head.count("(") > head.count(")"):
        head = head[:head.rfind("(")]
    words = head.split()
    while len(words) > 1 and words[-1].lower().rstrip(",;:") in _WEAK_END:
        words.pop()
    return " ".join(words).rstrip(",;:") + "…"


def summarize(text: str) -> str:
    """Whole sentences within MAX_CHARS; else the first sentence, cut. A first
    sentence too short to describe the page on its own ("Each guide walks one job
    end to end.") runs on into the next one, cut at a clause."""
    text = " ".join(text.split())
    if len(text) <= MAX_CHARS:
        return text
    kept = ""
    for sentence in _SENTENCE_END.split(text):
        candidate = f"{kept} {sentence}".strip()
        if len(candidate) > MAX_CHARS:
            break
        kept = candidate
    return kept if len(kept) >= SHORT_CHARS else _cut(text)


def _choose(paragraphs: list[dict]) -> tuple[str, str] | None:
    """The first paragraph, in page order, that is the page's lede or its prose."""
    for p in paragraphs:
        if any(_LEDE_CLASS.search(c) and c not in _NOT_LEDE for c in p["cls"]):
            if len(p["text"]) >= MIN_LEDE_CHARS:
                return "lede", p["text"]
        elif not p["cls"] and not p["meta"] and not p["bold_led"] and len(p["text"]) >= MIN_CHARS:
            return "opening", p["text"]
    return None


def on_page_content(html_text, page, config, files):
    meta = page.meta
    written = meta.get("description")
    if written:
        meta["description"] = html.escape(" ".join(str(written).split()), quote=True)
        _stats["front_matter"] += 1
        return html_text
    if page.is_homepage:
        _stats["home"] += 1
        return html_text
    parser = _Paragraphs()
    parser.feed(html_text)
    chosen = _choose(parser.paragraphs)
    if chosen is None:
        _stats["none"].append(page.file.src_uri)
        return html_text
    source, text = chosen
    meta["description"] = html.escape(summarize(text), quote=True)
    _stats[source] += 1
    return html_text


def on_post_build(config):
    found = _stats["lede"] + _stats["opening"]
    total = found + _stats["front_matter"] + _stats["home"] + len(_stats["none"])
    print("page_descriptions: a description for every page from its own opening")
    print(f"  from the page's lede       : {_stats['lede']}")
    print(f"  from its first paragraph   : {_stats['opening']}")
    print(f"  from front matter          : {_stats['front_matter']}")
    print(f"  home (site description)    : {_stats['home']}")
    print(f"  none found (site description kept): {len(_stats['none'])}"
          + (f" {_stats['none']}" if _stats["none"] else ""))
    print(f"  total pages                : {total}")
    for key in ("lede", "opening", "front_matter", "home"):
        _stats[key] = 0
    _stats["none"] = []
