"""MkDocs hook: title case stays title case (owner decision, polish round,
2026-09-27; the rule is in CLAUDE.md, "Published content style").

Titles, headings, names and labels are in Chicago-style title case:
page titles, nav labels, section headings (h2 to h4), card titles, prompt
titles, category names and short labels, group names and audience tags.
Buttons, body text, descriptions, taglines and figure titles stay sentence
case and are not checked. Left out entirely: the verbatim policy page,
pipeline-generated pages (docs/news/**, the Prompt Exchange), figures
(.hf-*), and publishers' own names (tool, model and leaderboard names,
course and paper titles), which keep their owners' spelling.

The rules (the same as scripts/layout_prompt_pages.py `_title_case`):
the first word, the last word and the first word after a colon or a
question mark start with a capital; articles, coordinating conjunctions
and prepositions (ALWAYS_LOWER) are lowercase elsewhere; words Chicago
decides by grammar (AMBIGUOUS: "after" as a conjunction, "up" as a
particle) pass either way; every other word starts with a capital. In a
hyphenated compound every part is capitalized, except the part after a
prefix that cannot stand alone (Pre-submission, Post-exam). A word with a
capital after its first letter, or a digit, is taken as written (AI,
ChatGPT, iOS, Qwen3).

Row titles (title gap, 2026-09-27) are checked too: the link that titles
a row in a hub card, door rows, the homepage routes, the Learn shelf, a
route row or the hubs' jump chips, and every card's `card-link`. The
section-map cards, page-foot cards, Tools & Prompts rows and prompt-page
rows are already covered as card titles by their title classes. Left out
by rule: a link to another site (its text is that publisher's own title,
such as a course, a paper or a leaderboard), and a button-style link
(`md-button`, `tp-go`: "Browse all 75 tools" stays sentence case).

It reads each built page once (on_post_page, registered last so it sees
the final HTML) and the data files and label tables once, prints counts per
kind (CLAUDE.md rule 2) and fails the build on any violation, naming the
page, the text and what it expected. It never rewrites anything.
"""
from __future__ import annotations

import html as _html
import re
from pathlib import Path

import yaml

import render_data as rd

ALWAYS_LOWER = frozenset({
    "a", "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "to", "as", "vs.",
    "of", "in", "on", "at", "by", "with", "from", "into", "per", "via", "over", "about",
    "between", "through", "within", "without", "across",
})
AMBIGUOUS = frozenset({"before", "after", "since", "until", "like", "up", "out", "off", "down",
                       "on", "in", "over"})
PREFIXES = frozenset({"pre", "post", "multi", "re", "co", "non", "anti", "semi", "sub", "inter",
                      "intra"})
# Spellings kept exactly as their owners write them, where the rules would
# otherwise ask for a capital.
AS_WRITTEN = frozenset({"e.g.", "i.e.", "vs.", "gpt-oss"})

# Pages left out: verbatim, generated, or not the site's own words.
EXCLUDED_PAGES = ("governance/policy.md", "prompts/exchange.md", "404.html")
EXCLUDED_PREFIXES = ("news/",)
# Elements whose text is not the site's own title: figures, and names
# spelled by their owners (tools, models, leaderboards, videos).
SKIP_INSIDE = re.compile(r'class="[^"]*\b(hf-[\w-]+|tool-card|video-card|lb-[\w-]+|timely-title|'
                         r'news-card[\w-]*)\b')
# Reviewed exceptions: a title that is a name spelled by its owner and that
# the rules above would flag. Empty today: acronyms and brand spellings pass
# by the as-written rule (a capital after the first letter, a digit), and
# publishers' names sit in skipped elements. Add an entry only after review.
EXEMPT: set[str] = set()

_S: dict = {}

_ITEM = {
    "section headings": re.compile(r"<h([2-4])\b[^>]*>(.*?)</h\1>", re.S),
    "page titles": re.compile(r"<h1\b[^>]*>(.*?)</h1>", re.S),
    "card titles": re.compile(
        r'<(\w+)\b[^>]*class="(?:[^"]*\s)?(?:card-title|secmap__title|secmap__gname|tp-head__title|'
        r'tp-row__title|pl-row__title|pp-rows__title|secfoot__title|tp-short__t)(?:\s[^"]*)?"[^>]*>(.*?)</\1>', re.S),
}


def expected(text: str) -> str:
    """The title-case form of `text` by the rules above (as written where
    the rules take a word as it is)."""
    words = text.split(" ")
    # Numbering ("3.", "Step 1:") is not the first word; the word after it is.
    alpha = [i for i, w in enumerate(words) if re.search(r"[A-Za-z]", w) and not re.fullmatch(r"\d+[.:)]?", w)]
    out = []
    for i, word in enumerate(words):
        edge = (not alpha or i == alpha[0] or i == alpha[-1]
                or (out and re.search(r"[:?]\W*$", out[-1])))
        out.append(_word(word, bool(edge)))
    return " ".join(out)


def _word(word: str, edge: bool) -> str:
    m = re.match(r"^(\W*)(.*?)(\W*)$", word)
    lead, core, tail = m.groups() if m else ("", word, "")
    if tail == "." and core.lower() + "." in AS_WRITTEN:
        core, tail = core + ".", ""
    if not core or core.lower() in AS_WRITTEN or core.startswith("{"):
        return word
    parts = core.split("-")
    done = []
    for k, part in enumerate(parts):
        if not part or not part[0].isalpha() or any(c.isupper() for c in part[1:]) or any(c.isdigit() for c in part):
            done.append(part)
        elif k > 0 and parts[k - 1].lower() in PREFIXES:
            done.append(part.lower())
        elif 0 < k < len(parts) - 1 and part.lower() in ALWAYS_LOWER:
            done.append(part.lower())   # Step-by-Step, Mixture-of-Experts
        elif k == 0 and not edge and part.lower() in AMBIGUOUS and len(parts) == 1:
            done.append(part)
        elif k == 0 and not edge and part.lower() in ALWAYS_LOWER and len(parts) == 1:
            done.append(part.lower())
        else:
            done.append(part[0].upper() + part[1:])
    return lead + "-".join(done) + tail


# Row blocks whose items are titled by their leading link (row titles).
ROW_BLOCKS = re.compile(r'class="(?:[^"]*\s)?(?:door-rows|home-routes|learn-shelf|route-stage|hub-jobs|'
                        r'grid cards)(?:[\s"])')
_ROW_ITEM = re.compile(r'<li\b[^>]*>\s*(?:<span class="row-tag">[^<]*</span>\s*)?'
                       r'(?:<span class="route-n[^"]*">[^<]*</span>\s*)?'
                       r'(?:<span class="(?:route-text|row-pair)">)?<a\b([^>]*)>(.*?)</a>', re.S)
_CARD_LINK = re.compile(r'<a\b([^>]*\bclass="(?:[^"]*\s)?card-link(?:\s[^"]*)?"[^>]*)>(.*?)</a>', re.S)
# Not a row title by rule: another site's own title, or a button.
_NOT_A_TITLE = re.compile(r'\bhref="(?:https?:)?//|\bclass="[^"]*\b(?:md-button|tp-go)\b')


_SUBSPANS = re.compile(r'<span class="(?:secmap__here|secmap__sub|tp-row__sub|pp-rows__sub|secfoot__sub|'
                       r'secmap__tag|tp-short__who|secmap__sr|secfoot__dir|tp-tag|row-tag)">[^<]*</span>')


def _text(fragment: str) -> str:
    fragment = re.sub(r'<a class="headerlink".*?</a>', "", fragment, flags=re.S)
    fragment = re.sub(r'<span class="twemoji[^"]*">.*?</span>', "", fragment, flags=re.S)
    return " ".join(_html.unescape(re.sub(r"<[^>]+>", " ", fragment)).split())


def _check(kind: str, where: str, text: str):
    text = " ".join(text.split())
    if not text or text in EXEMPT:
        _S["counts"].setdefault(kind, [0, 0, 0])[1 if text in EXEMPT else 0] += 1
        return
    c = _S["counts"].setdefault(kind, [0, 0, 0])
    c[0] += 1
    want = expected(text)
    if want != text:
        c[2] += 1
        _S["bad"].append(f"{kind}, {where}: {text!r}, expected {want!r}")


def on_config(config):
    _S.clear()
    _S.update(counts={}, bad=[], seen=set())
    root = Path(config["docs_dir"]).parent

    def nav_labels(items, where="mkdocs.yml nav"):
        for item in items or []:
            if isinstance(item, dict):
                for label, value in item.items():
                    _check("nav labels", where, label)
                    if isinstance(value, list):
                        nav_labels(value, where)
    nav_labels(config.get("nav"))
    for entry in rd.load_prompts(config):
        _check("prompt titles", "data/prompts.yaml", entry["title"])
    for name, table in (("PROMPT_CATEGORY_LABELS", rd.PROMPT_CATEGORY_LABELS),
                        ("PROMPT_CATEGORY_CHIPS", rd.PROMPT_CATEGORY_CHIPS),
                        ("PROMPT_CATEGORY_LANDING_LABELS", rd.PROMPT_CATEGORY_LANDING_LABELS),
                        ("CATEGORY_LABELS", rd.CATEGORY_LABELS)):
        for value in table.values():
            _check("category labels", f"scripts/render_data.py {name}", value)
    for name, table in (("PROMPT_AUDIENCE_META", rd.PROMPT_AUDIENCE_META),
                        ("PROMPT_AUDIENCE_LABELS", rd.PROMPT_AUDIENCE_LABELS)):
        for value in table.values():
            _check("audience tags", f"scripts/render_data.py {name}", value)
    tasks = yaml.safe_load((root / "data" / "tool_tasks.yaml").read_text(encoding="utf-8")) or []
    for t in tasks:
        for key in ("label", "heading"):
            if t.get(key):
                _check("category labels", "data/tool_tasks.yaml " + key, t[key])
    deco = yaml.safe_load((root / "data" / "section_map.yaml").read_text(encoding="utf-8")) or {}
    for kid, k in (deco.get("kinds") or {}).items():
        _check("category labels", "data/section_map.yaml kinds", k["label"])
    for name in deco.get("groups") or {}:
        _check("card titles", "data/section_map.yaml groups", name)
    for tab in (deco.get("tabs") or {}).values():
        for name in (tab or {}).get("loose") or []:
            _check("card titles", "data/section_map.yaml loose", name)
    # An explainer video's label is the site's own title (its `title` is
    # YouTube's, spelled as the channel wrote it, and is left out).
    for video in yaml.safe_load((root / "data" / "explainer_videos.yaml").read_text(encoding="utf-8")) or []:
        _check("card titles", "data/explainer_videos.yaml label", video["label"])
    return config


def _excluded(src: str) -> bool:
    return src in EXCLUDED_PAGES or src.startswith(EXCLUDED_PREFIXES)


def on_post_page(output, page, config):
    src = page.file.src_uri
    if _excluded(src):
        return output
    start, end = output.find("<article"), output.rfind("</article>")
    if start == -1 or end == -1:
        return output
    # Subtitles, tags and screen-reader words inside a title are not the
    # title (a group's "Optional, after the basics" tag is sentence case).
    art = _SUBSPANS.sub("", output[start:end])
    # Skip the text of figures and of names spelled by their owners.
    spans = _elements(art, SKIP_INSIDE)
    inside = lambda pos: any(a <= pos < b for a, b in spans)
    for kind, rx in _ITEM.items():
        for m in rx.finditer(art):
            if inside(m.start()):
                continue
            text = _text(m.group(m.lastindex))
            key = (kind, src, text)
            if key in _S["seen"]:
                continue
            _S["seen"].add(key)
            _check(kind, src, text)
    rows = _elements(art, ROW_BLOCKS)
    in_rows = lambda pos: any(a <= pos < b for a, b in rows)
    for rx, where in ((_ROW_ITEM, in_rows), (_CARD_LINK, lambda pos: True)):
        for m in rx.finditer(art):
            if inside(m.start()) or not where(m.start()) or _NOT_A_TITLE.search(m.group(1)):
                continue
            text = _text(m.group(2))
            key = ("row titles", src, text)
            if key in _S["seen"]:
                continue
            _S["seen"].add(key)
            _check("row titles", src, text)
    return output


def _elements(art: str, rx) -> list[tuple[int, int]]:
    """The (start, end) of every element whose opening tag matches `rx`."""
    spans = []
    for m in rx.finditer(art):
        tag_start = art.rfind("<", 0, m.start())
        tag = re.match(r"<(\w+)", art[tag_start:])
        if not tag:
            continue
        depth, name = 0, tag.group(1)
        opener = re.compile(rf"<{name}\b|</{name}>")
        for t in opener.finditer(art, tag_start):
            depth += -1 if t.group(0).startswith("</") else 1
            if depth == 0:
                spans.append((tag_start, t.end()))
                break
    return spans


def on_post_build(config):
    print("title_case: titles, headings, names and labels in title case")
    total = [0, 0, 0]
    for kind in sorted(_S["counts"]):
        checked, exempt, bad = _S["counts"][kind]
        total = [total[0] + checked, total[1] + exempt, total[2] + bad]
        print(f"  {kind:<17}: {checked} checked, {checked - bad} pass, {exempt} exempt, {bad} violations")
    print(f"  total            : {total[0]} checked, {total[0] - total[2]} pass, {total[1]} exempt, "
          f"{total[2]} violations (cross-check {'ok' if total[2] == len(_S['bad']) else 'MISMATCH'})")
    if _S["bad"] or total[2] != len(_S["bad"]):
        raise AssertionError("title_case: text that is not in title case (CLAUDE.md, published "
                             "content style; add a reviewed exception to EXEMPT only for a name "
                             "spelled by its owner):\n  " + "\n  ".join(_S["bad"][:40])
                             + (f"\n  ... and {len(_S['bad']) - 40} more" if len(_S["bad"]) > 40 else ""))
