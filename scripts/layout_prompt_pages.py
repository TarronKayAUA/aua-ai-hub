"""MkDocs hook: one page per prompt (layout redesign L17, owner decision 5,
2026-09-25).

Every entry in data/prompts.yaml gets its own page at prompts/<slug>/, the
same slug the library row's #anchor has always used, so an address and an
anchor always name the same prompt. Nothing is written to docs/: the pages
are virtual files added in on_files, built from the data file on every
build, and they sit in the Prompt Library section of the navigation (tab,
breadcrumb, "Back to Prompt Library") without being listed in the sidebar.

A page reads, top to bottom: title, meta line, tagline; "How to use it"
(the entry's optional `use:` steps, or its notes when it has none) with
Copy prompt; the notes; the prompt text, wrapped and folded after about
24rem with a second Copy; "Where it is used", computed from every link to
the prompt across the built site; and related prompts, computed from the
notes and the categories.

Checks, because MkDocs anchor validation never sees links a hook writes:
every link in the library and in each prompt page must resolve to a built
page or file, and every #fragment to an id on it (on_post_page); the text
each Copy button copies must be byte-identical to data/prompts.yaml, on the
library and on every page; and every prompt page must be in sitemap.xml
(on_post_build). Any failure stops the build.
"""
from __future__ import annotations

import html as _html
import json
import re
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import render_data as rd
from mkdocs.structure.files import File, InclusionLevel
from mkdocs.utils import get_relative_url

LIBRARY = "prompts/index.md"
TEXT_SLOT = '<div class="pp-text" data-pp-text="{slug}"></div>'
USED_SLOT = '<div class="pp-used" data-pp-used="{slug}"></div>'
SIDE_SLOT = '<div class="pp-side" data-pp-side="{slug}"></div>'
EXAMPLES = "examples"
RELATED_MAX = 3
_HOST = "https://site.invalid/"

_state: dict = {}


# --- page content -------------------------------------------------------------


def _mentions(text: str, title: str):
    return re.search(r"(?<![\w-])" + re.escape(title.lower()) + r"(?![\w-])", text.lower())


# Common words that say nothing about what a prompt is for.
_STOP = frozenset({
    "about", "after", "again", "against", "also", "always", "another", "answer",
    "around", "attach", "attached", "because", "before", "being", "below",
    "between", "both", "build", "builds", "built", "cannot", "check", "could",
    "does", "doing", "each", "every", "first", "from", "have", "into", "item",
    "items", "just", "like", "made", "make", "makes", "more", "most", "much",
    "must", "need", "never", "only", "other", "over", "paste", "prompt",
    "prompts", "same", "says", "should", "since", "some", "such", "than", "that",
    "their", "them", "then", "there", "these", "they", "this", "those",
    "through", "under", "until", "used", "uses", "using", "very", "what", "when",
    "where", "which", "while", "will", "with", "without", "work", "works",
    "would", "write", "your", "yours",
})


def _words(entry: dict) -> set[str]:
    text = (entry["tagline"] + " " + rd._plain(entry.get("notes", ""))).lower()
    return {w for w in re.findall(r"[a-z]{4,}", text) if w not in _STOP}


def _related_one(slug: str, by_slug: dict, words: dict) -> list[str]:
    entry = by_slug[slug]
    ordered: list[str] = []
    notes = rd._plain(entry.get("notes", ""))
    named = sorted((m.start(), other) for other, e in by_slug.items()
                   if other != slug and (m := _mentions(notes, e["title"])))
    ordered += [other for _, other in named]
    ordered += [other for other, e in by_slug.items()
                if _mentions(rd._plain(e.get("notes", "")), entry["title"])]
    for category in [entry["category"], *entry.get("also_for", [])]:
        section = [other for other, e in by_slug.items()
                   if (category == e["category"] or category in e.get("also_for", []))
                   and ("both" in (entry["audience"], e["audience"])
                        or entry["audience"] == e["audience"])]
        section.sort(key=lambda other: -len(words[slug] & words[other]))
        ordered += section
    picked: list[str] = []
    for other in ordered:
        if other != slug and other not in picked and len(picked) < RELATED_MAX:
            picked.append(other)
    return picked


def _related(prompts: list[dict]) -> dict[str, list[str]]:
    """Up to RELATED_MAX related prompts for each prompt, in this order:
    prompts its notes name (in the order named), prompts whose notes name
    it, then prompts in its own sections for a compatible audience, closest
    first by the words their taglines and notes share (ties in file order)."""
    by_slug = {rd._prompt_slug(e["title"]): e for e in prompts}
    words = {slug: _words(e) for slug, e in by_slug.items()}
    return {slug: _related_one(slug, by_slug, words) for slug in by_slug}


def _round_words(n: int) -> int:
    return n if n < 100 else round(n, -1)


def _sentence(text: str) -> str:
    text = " ".join(text.split())
    return text if text.endswith((".", "?", "!")) else text + "."


def _markdown(entry: dict, slug: str, related: list[str], by_slug: dict) -> str:
    """The page source. Links in markdown (notes, steps, the statuses link)
    are validated by MkDocs itself; the raw HTML ones are checked by
    on_post_page."""
    title = entry["title"]
    status, _ = rd.PROMPT_STATUS_LABELS[entry["status"]]
    audience = rd.PROMPT_AUDIENCE_META[entry["audience"]]
    notes = (entry.get("notes") or "").strip()
    use = entry.get("use")
    esc_title = _html.escape(title)
    meta = (f'<span class="meta-chip">Prompt</span><span class="meta-chip">{audience}</span>'
            f'<span class="meta-chip">{status}</span> <span class="meta-note">'
            "[Draft and Reviewed prompts are both usable](index.md#prompt-statuses)</span>")
    lines = [
        f"# {title}",
        "",
        meta,
        "",
        _sentence(entry["tagline"]),
        "{: .pp-lede }",
        "",
        '<div class="pp-panel" data-page-action markdown>',
        "",
        "## How to Use It { #how-to-use-it }",
        "",
    ]
    if use:
        lines += [f"{i}. {' '.join(step.split())}" for i, step in enumerate(use, 1)]
    else:
        lines += [notes]
    copy_button = ('<button type="button" class="md-button md-button--primary pp-copy" '
                   f'data-copy-from="prompt-text-source" data-title="{esc_title}" hidden>Copy prompt</button>')
    save_button = (f'<button type="button" class="pl-save pp-save" data-save="{slug}" '
                   f'data-title="{esc_title}" hidden>Save</button>')
    lines += [
        "",
        '<div class="pp-actions" data-search-exclude>',
        copy_button,
        '<a class="md-button pp-read" href="#the-prompt">Read the prompt</a>',
        save_button,
        "</div>",
        "",
    ]
    # The requirement the library shows beside Copy, kept beside it here
    # too, under the buttons so Copy stays on a phone's first screen. When
    # the notes fill the panel (no `use:` steps) it is already in them.
    if use and entry.get("note_visible"):
        lines += [f'<p class="pp-note">{_html.escape(" ".join(entry["note_visible"].split()))}</p>', ""]
    lines += ["</div>", ""]
    if use and notes:
        lines += ["## Notes { #notes }", "", notes, ""]
    lines += [
        f"## {_html.escape(_prompt_heading(entry['title']))} {{ #the-prompt }}",
        "",
        SIDE_SLOT.format(slug=slug),
        "",
        TEXT_SLOT.format(slug=slug),
        "",
        "## Where It Is Used { #where-it-is-used }",
        "",
        USED_SLOT.format(slug=slug),
        "",
    ]
    if related:
        rows = "".join(
            f'<li><a href="../{other}/"><span class="pp-rows__title">'
            f'{_html.escape(by_slug[other]["title"])}</span><span class="pp-rows__sub">'
            f'{_html.escape(_sentence(by_slug[other]["tagline"]))}</span></a></li>'
            for other in related)
        lines += ["## Related Prompts { #related-prompts }", "",
                  f'<ul class="pp-rows">{rows}</ul>', ""]
    return "\n".join(lines)


# --- "The prompt" section: its heading, and the panel beside the text -----------

# The same rules as the title-case proposal (_round/c/TITLE-CASE.md, polish
# round): lowercase words, and prefixes whose second part stays lowercase
# (Chicago 8.161: Pre-submission, Post-exam).
_SMALL = frozenset({"a", "an", "the", "and", "but", "or", "nor", "for", "so", "yet", "to", "as",
                    "vs.", "of", "in", "on", "at", "by", "with", "from", "into", "per", "via",
                    "over", "about", "between", "through", "within", "without", "across"})
_PREFIXES = frozenset({"pre", "post", "multi", "re", "co", "non", "anti", "semi", "sub", "inter", "intra"})


def _title_case(text: str) -> str:
    """Chicago-style title case for the one heading this hook writes from a
    prompt's title: first and last words and every major word capitalized,
    articles, short conjunctions and prepositions lowercase, each part of a
    hyphenated compound treated alike, and any word already carrying a
    capital after its first letter (NBME, ChatGPT) left exactly as it is,
    and the part after a prefix that cannot stand alone kept lowercase."""
    words = text.split()

    def one(word: str, edge: bool) -> str:
        if any(c.isupper() for c in word[1:]):
            return word
        if not edge and word.lower() in _SMALL:
            return word.lower()
        return word[:1].upper() + word[1:]

    out = []
    for i, word in enumerate(words):
        edge = i == 0 or i == len(words) - 1 or out[-1].endswith(":")
        parts = word.split("-")
        done = []
        for k, part in enumerate(parts):
            if k > 0 and parts[k - 1].lower() in _PREFIXES and not any(c.isupper() for c in part):
                done.append(part.lower())
            else:
                done.append(one(part, edge or k > 0) if part else part)
        out.append("-".join(done))
    return " ".join(out)


def _prompt_heading(title: str) -> str:
    """The prompt text's heading: the prompt's own name, then "Prompt",
    never doubled for a title that already ends in the word."""
    name = _title_case(" ".join(title.split()))
    return name if name.lower().endswith("prompt") else f"{name} Prompt"


# A fill-in blank is a bracketed placeholder in the prompt's INPUTS block
# that a label introduces ("My idea: [2 TO 5 SENTENCES]"). Everything else
# in brackets is the model's to write ([VERIFY], [MISSING]) or part of an
# output template ("Case [N] ([SETTING], ...)"), and is left alone. A blank
# may wrap onto the next line, a label may too ("with any written / case
# it used: [PASTE OR ATTACH]"), one line may hold several labeled fields
# ("Duration: [MINUTES]   Audience: [YEAR/COURSE]"), and a blank offered
# as a choice or continued after a comma ("[A] or [B]", "[A], [B]") is one
# field. A blank that opens a line straight under the INPUTS heading takes
# its label from the heading ("INPUTS (my misses: ...)").
_BRACKET = re.compile(r"\[([^\[\]]+)\]")
_INPUTS = re.compile(r"^INPUTS\b(?:\s*\(([^:)]*))?")
_BLOCK_HEAD = re.compile(r"^[A-Z][A-Z0-9 ,/'&()-]{2,}:?\s*(?:\(.*\))?\s*$")
_JOIN = re.compile(r"(\s+or\s+|,\s+)\[([^\[\]]+)\]")
# A hint asking for more than a phrase gets a larger field.
_LONG_HINT = re.compile(r"SENTENCE|\bLIST\b|PASTE|ATTACH|NOTES|FULL TEXT|FOR EACH|ONE LINE PER|"
                        r"MATERIALS|DESCRIPTIONS", re.IGNORECASE)


def _blanks(text: str) -> tuple[list[dict], list[str]]:
    """The prompt's fill-in fields, in order, each with its label, its hint
    (the bracket text) and every span of the stored text it fills; and a
    note for each bracket that looked like a blank but was not taken."""
    lines = text.split("\n")
    starts = [0]
    for line in lines:
        starts.append(starts[-1] + len(line) + 1)
    first = next((i for i, line in enumerate(lines) if _INPUTS.match(line.strip())), None)
    doubtful: list[str] = []
    if first is None:
        for m in _BRACKET.finditer(text):
            if not re.fullmatch(r"VERIFY|MISSING|SOURCE NEEDED", m.group(1)):
                doubtful.append(f"outside any INPUTS block: [{' '.join(m.group(1).split())}]")
        return [], doubtful
    last = next((i for i in range(first + 1, len(lines))
                 if lines[i].strip() and not lines[i][:1].isspace() and _BLOCK_HEAD.match(lines[i].strip())),
                len(lines))
    head_label = (_INPUTS.match(lines[first].strip()).group(1) or "").strip()
    lo, hi = starts[first + 1], starts[last]
    fields: dict[tuple, dict] = {}
    pos = lo
    while True:
        m = _BRACKET.search(text, pos, hi)
        if not m:
            break
        a, b = m.start(), m.end()
        pos = b
        line_start = text.rfind("\n", 0, a) + 1
        seg = text[line_start:a]
        seg = re.split(r"\s{3,}|;\s*|\]", seg)[-1].strip()
        if seg.endswith(":") and seg[:-1].strip():
            label = seg[:-1].strip()
            # A label wrapped from the line above: this line is indented and
            # the line above holds no blank of its own.
            if text[line_start:line_start + 1].isspace() and label == text[line_start:a].strip()[:-1].strip():
                prev_start = text.rfind("\n", 0, line_start - 1) + 1
                prev = text[prev_start:line_start - 1]
                if (prev_start >= lo and "[" not in prev and "]" not in prev
                        and not prev.rstrip().endswith(":")):
                    label = " ".join((prev.strip() + " " + label).split())
        elif not text[line_start:a].strip() and line_start == lo and head_label:
            label = head_label
        else:
            if not re.fullmatch(r"VERIFY|MISSING|SOURCE NEEDED", m.group(1)):
                doubtful.append(f"in INPUTS, no label: [{' '.join(m.group(1).split())[:60]}]")
            continue
        hints = [" ".join(m.group(1).split())]
        seps = []
        while True:
            j = _JOIN.match(text, b)
            if not j or b >= hi:
                break
            seps.append(" or " if "or" in j.group(1) else ", ")
            hints.append(" ".join(j.group(2).split()))
            b = j.end()
            pos = b
        hint = hints[0] + "".join(sep + h for sep, h in zip(seps, hints[1:]))
        label = label[:1].upper() + label[1:]
        key = (label.lower(), hint)
        field = fields.setdefault(key, {"label": label, "hint": hint, "spans": []})
        field["spans"].append((a, b))
    out = list(fields.values())
    for k, f in enumerate(out, 1):
        f["id"] = k
        f["long"] = bool(_LONG_HINT.search(f["hint"]))
    return out, doubtful


def _examples(files) -> dict[str, tuple]:
    """Worked examples by the prompt they demonstrate: an example page
    (docs/examples/) whose primary action opens a prompt in the library
    (`link: prompts/index.md#<slug>`) is that prompt's worked example. Its
    title is its H1, its one-line description the page's `sub:` in
    data/section_map.yaml."""
    import yaml
    out: dict[str, tuple] = {}
    for f in files.documentation_pages():
        if not f.src_uri.startswith(EXAMPLES + "/"):
            continue
        text = Path(f.abs_src_path).read_text(encoding="utf-8")
        meta = yaml.safe_load(text.split("---")[1]) if text.startswith("---") else {}
        actions = (meta or {}).get("action") or []
        primary = next((a for a in actions if a.get("style") != "secondary"), None)
        m = re.fullmatch(r"prompts/index\.md#([a-z0-9-]+)", (primary or {}).get("link", ""))
        h1 = re.search(r"^# (.+?)\s*$", text, re.MULTILINE)
        if m and h1:
            out.setdefault(m.group(1), []).append((f, h1.group(1)))
    return out


def _side(entry: dict, slug: str, fields: list[dict], example) -> str:
    """The track beside the prompt text: its length, the fill-in panel (a
    "Have ready" list without JavaScript; fields that fill the prompt in
    place with it), and the prompt's worked example."""
    esc = _html.escape
    words = len(entry["prompt"].split())
    parts = [f'<p class="pp-text-intro">About {_round_words(words):,} words. '
             "Copy prompt copies all of it, word for word.</p>"]
    if fields:
        ready = "".join(f'<li><span class="pp-fill__label">{esc(f["label"])}</span>: {esc(f["hint"])}</li>'
                        for f in fields)
        rows = []
        for f in fields:
            fid = f"fill-{f['id']}"
            control = (f'<textarea id="{fid}" rows="3" autocomplete="off" aria-describedby="{fid}-hint" '
                       f'data-fill="{f["id"]}"></textarea>' if f["long"] else
                       f'<input type="text" id="{fid}" autocomplete="off" aria-describedby="{fid}-hint" '
                       f'data-fill="{f["id"]}">')
            rows.append(f'<div class="pp-fill__field"><label for="{fid}">{esc(f["label"])}</label>'
                        f'{control}<span class="pp-fill__hint" id="{fid}-hint">{esc(f["hint"])}</span></div>')
        spans = [{"id": f["id"], "spans": f["spans"]} for f in fields]
        parts.append(
            '<section class="pp-fill" aria-labelledby="fill-in-your-details" data-search-exclude>'
            '<h3 id="fill-in-your-details">Fill In Your Details</h3>'
            '<p class="pp-fill__privacy">Your answers stay in this browser. They are not sent or saved.</p>'
            f'<div class="pp-fill__ready"><p class="pp-fill__lead">Have Ready:</p><ul>{ready}</ul></div>'
            f'<div class="pp-fill__form" data-pp-fill hidden>{"".join(rows)}'
            '<div class="pp-fill__bar">'
            '<button type="button" class="md-button md-button--primary pp-fill-copy">Copy with my answers</button>'
            '<button type="button" class="md-button pp-fill-clear">Clear</button></div>'
            '<p class="pp-fill__status" role="status" aria-live="polite"></p></div>'
            "</section>"
            f'<script type="application/json" id="prompt-fill-source">{json.dumps(spans)}</script>')
    if example:
        href, title, sub = example
        parts.append('<div class="pp-example"><p class="pp-example__lead">See It in Action</p>'
                     f'<ul class="pp-rows"><li><a href="{esc(href)}"><span class="pp-rows__title">{esc(title)}</span>'
                     + (f'<span class="pp-rows__sub">{esc(sub)}</span>' if sub else "")
                     + "</a></li></ul></div>")
    return f'<div class="pp-side"><div class="pp-side__inner">{"".join(parts)}</div></div>'


# The stored prompts are hard-wrapped at about 72 characters. Shown as
# they are, every line breaks twice on a phone and reads raggedly, so the
# page shows them reflowed: a line break the author's wrap width made is
# joined back into its sentence, and every intentional one (a heading, a
# list item, a field such as "Key: E", a short line, a blank line) stays.
# Only whitespace changes, which on_page_content proves for every prompt;
# Copy never uses this text (see _text_block).
_REFLOW_WIDTH = 50
_REFLOW_MARKER = re.compile(r"^(?:[-*•] |\d+[.)] |\([A-Za-z0-9]{1,3}\) |[A-Z]{1,2}\d{1,2} [A-Z]|\[)")
_REFLOW_LABEL = re.compile(r"^[A-Z][A-Za-z0-9 ,/()'&.-]{0,60}:(?:\s|$)")
_REFLOW_HEADING = re.compile(r"^[A-Z][A-Z0-9 ,/'&-]{2,}(?:\s*\(.*\))?:?$")


_REFLOW_COLUMNS = re.compile(r"\S {3,}\S")


def _reflow(text: str) -> str:
    out: list[str] = []
    last_indent = 0
    last_len = 0
    for line in text.split("\n"):
        cur = line.strip()
        indent = len(line) - len(line.lstrip(" "))
        prev = out[-1].rstrip() if out else ""
        join = (cur and prev and last_len >= _REFLOW_WIDTH
                and indent >= last_indent  # a dedent starts a new line
                and not prev.endswith("]")
                and not (prev.endswith(":") and not cur[0].islower())
                and not _REFLOW_COLUMNS.search(prev) and not _REFLOW_COLUMNS.search(line)
                and not _REFLOW_HEADING.match(prev.strip())
                and not _REFLOW_HEADING.match(cur)
                and not _REFLOW_MARKER.match(cur)
                and not _REFLOW_LABEL.match(cur))
        if join:
            # A word hyphenated across the break ("single-best-" then
            # "answer") joins without a space.
            glue = "" if re.search(r"[A-Za-z]-$", prev) else " "
            out[-1] = prev + glue + cur
        else:
            out.append(line)
        last_indent = indent if cur else 0
        last_len = len(line.rstrip())
    return "\n".join(out)


def _marked(entry: dict, fields: list[dict]) -> str:
    """The reflowed prompt as HTML, each fill-in blank wrapped in a <mark>
    the panel fills in place. The reflow changes only whitespace, so each
    blank is found again by its words, in order."""
    shown = _reflow(entry["prompt"])
    spans = sorted((a, b, f["id"]) for f in fields for a, b in f["spans"])
    out, cur = [], 0
    for a, b, fid in spans:
        words = entry["prompt"][a:b].split()
        m = re.compile(r"\s+".join(re.escape(w) for w in words)).search(shown, cur)
        if not m:
            raise AssertionError(f"layout_prompt_pages: blank {entry['prompt'][a:b]!r} of "
                                 f"{entry['title']!r} is not in the text as shown")
        out.append(_html.escape(shown[cur:m.start()], quote=False))
        out.append(f'<mark class="pp-blank" data-fill="{fid}">{_html.escape(m.group(0), quote=False)}</mark>')
        cur = m.end()
    out.append(_html.escape(shown[cur:], quote=False))
    return "".join(out)


def _text_block(entry: dict, fields: list[dict] | None = None) -> str:
    """The prompt as readers see it, and, separately, as Copy gives it.

    The visible block is the reflowed text, excluded from search so a hit
    shows the page's title, tagline and notes rather than a wall of
    instructions. The copy source is the stored text itself, in a JSON
    island, so both Copy buttons give data/prompts.yaml byte for byte."""
    title = _html.escape(entry["title"])
    body = _marked(entry, fields or [])
    # A <section> holding no other <section>: Material's search parser
    # matches elements by tag name alone, so an excluded <div> would stop
    # being excluded at the first nested </div>.
    return (
        '<section class="pp-text" id="prompt-text" aria-label="Prompt text" data-search-exclude>'
        f'<div class="pp-text__body" id="prompt-text-body">{body}</div>'
        '<div class="pp-text__bar">'
        f'<button type="button" class="md-button pp-copy" data-copy-from="prompt-text-source" '
        f'data-title="{title}" hidden>Copy prompt</button>'
        '<button type="button" class="md-button pp-expand" aria-expanded="true" '
        'aria-controls="prompt-text-body" hidden>Show the whole prompt</button>'
        "</div></section>"
        f'<script type="application/json" id="prompt-text-source">{rd.prompt_json(entry["prompt"])}</script>'
    )


# --- hook events ----------------------------------------------------------------


def on_files(files, config):
    prompts = rd.load_prompts(config)
    by_slug = {rd._prompt_slug(e["title"]): e for e in prompts}
    related = _related(prompts)
    _state.clear()
    _state["pages"] = {}
    for slug, entry in by_slug.items():
        src = f"prompts/{slug}.md"
        if files.get_file_from_path(src) is not None:
            raise ValueError(f"layout_prompt_pages: docs/{src} exists, so the page for "
                             f"{entry['title']!r} cannot be generated there")
        files.append(File.generated(config, src, content=_markdown(entry, slug, related[slug], by_slug),
                                    inclusion=InclusionLevel.NOT_IN_NAV))
        _state["pages"][src] = (slug, entry)
    _state["related_rows"] = sum(len(v) for v in related.values())
    # The fill-in panel and the worked example for each prompt.
    import yaml
    subs = (yaml.safe_load((Path(config["docs_dir"]).parent / "data" / "section_map.yaml")
                           .read_text(encoding="utf-8")).get("pages") or {})
    examples = _examples(files)
    _state["side"] = {}
    _state["doubtful"] = {}
    for slug, entry in by_slug.items():
        fields, doubtful = _blanks(entry["prompt"])
        for f in fields:
            for a, b in f["spans"]:
                if not (entry["prompt"][a] == "[" and entry["prompt"][b - 1] == "]"):
                    raise AssertionError(f"layout_prompt_pages: a blank of {entry['title']!r} "
                                         "does not start and end on its brackets")
        example = None
        found = examples.get(slug) or []
        if len(found) > 1:
            raise ValueError(f"layout_prompt_pages: several worked examples open {slug!r}: "
                             f"{[f.src_uri for f, _ in found]}")
        if found:
            f, title = found[0]
            example = (get_relative_url(f.url, f"prompts/{slug}/"), title,
                       ((subs.get(f.src_uri) or {}).get("sub") or ""))
        _state["side"][slug] = (fields, example)
        if doubtful:
            _state["doubtful"][entry["title"]] = doubtful
    stray = sorted(set(examples) - set(by_slug))
    if stray:
        raise ValueError(f"layout_prompt_pages: worked examples open prompts that do not exist: {stray}")
    return files


def on_nav(nav, config, files):
    """Give each prompt page the Prompt Library as its parent, without
    listing it: the Tools & Prompts tab is active, the breadcrumb reads
    Home > Tools & Prompts > Prompt Library, and the page ending's Back row
    returns to the library."""
    library = files.get_file_from_path(LIBRARY)
    section = library.page.parent if library is not None and library.page is not None else None
    if section is None:
        raise ValueError("layout_prompt_pages: prompts/index.md is not in a nav section")
    for src in _state["pages"]:
        files.get_file_from_path(src).page.parent = section
    _state["nav_rank"] = {p.file.src_uri: i for i, p in enumerate(nav.pages)}
    return nav


def on_page_markdown(markdown, page, config, files):
    found = _state.get("pages", {}).get(page.file.src_uri)
    if not found:
        return markdown
    # A prompt page is a Task page (layout plan section 4): one action,
    # Copy prompt, in the reading frame. Set here, after layout_frame.py has
    # typed the page by its address, rather than with front matter
    # `template: task`, because MkDocs itself reads `template` as the name of
    # the Jinja template to render and fails the build on "task".
    page.meta["page_type"] = "task"
    # Also set after render_data.py has run, so the page ending
    # (layout_frame.py) prints the prompt's own review date from
    # data/prompts.yaml, and render_data's note about the machine review of
    # prose pages, which does not cover prompts, is not added.
    if found[1].get("last_reviewed"):
        page.meta["last_reviewed"] = found[1]["last_reviewed"]
    return markdown


def on_page_content(html, page, config, files):
    found = _state.get("pages", {}).get(page.file.src_uri)
    if not found:
        return html
    slug, entry = found
    slot = TEXT_SLOT.format(slug=slug)
    if html.count(slot) != 1:
        raise AssertionError(f"layout_prompt_pages: prompt text slot missing on {page.file.src_uri}")
    if re.sub(r"\s", "", _reflow(entry["prompt"])) != re.sub(r"\s", "", entry["prompt"]):
        raise AssertionError(f"layout_prompt_pages: the reflowed display of {entry['title']!r} "
                             "changed more than whitespace")
    fields, example = _state["side"][slug]
    side = SIDE_SLOT.format(slug=slug)
    if html.count(side) != 1:
        raise AssertionError(f"layout_prompt_pages: prompt side slot missing on {page.file.src_uri}")
    html = html.replace(side, _side(entry, slug, fields, example))
    return html.replace(slot, _text_block(entry, fields))


def _text(fragment: str) -> str:
    fragment = re.sub(r'<a class="headerlink".*?</a>', "", fragment, flags=re.DOTALL)
    return " ".join(_html.unescape(re.sub(r"<[^>]+>", "", fragment)).split())


_HEAD_RE = re.compile(r'<h([1-6])[^>]*\bid="([^"]+)"[^>]*>(.*?)</h\1>', re.DOTALL)
_LINK_RE = re.compile(r'<a\s[^>]*?\bhref="([^"]*)"[^>]*>(.*?)</a>', re.DOTALL)


def _nav_hook():
    """The loaded layout_nav hook, for its kinds. MkDocs registers a hook
    under its path from mkdocs.yml, so `import layout_nav` would load a
    second, empty copy; this finds the one the build is running."""
    import sys
    for module in list(sys.modules.values()):
        if (getattr(module, "__file__", "") or "").endswith("layout_nav.py") and getattr(module, "_S", {}).get("kind"):
            return module
    raise AssertionError("layout_prompt_pages: the layout_nav hook has not built its kinds yet")


def on_env(env, config, files):
    """Every page's final content exists now, so "Where it is used" can be
    computed from the links the readers will actually see: a link to a
    prompt's #anchor or page, or a link to the library whose text names
    the prompt (the guides link some prompts through their category)."""
    pages = _state["pages"]
    library = files.get_file_from_path(LIBRARY)
    lib_path = "/" + library.url
    page_path = {"/" + files.get_file_from_path(src).url: slug for src, (slug, _) in pages.items()}
    titles = {slug: " ".join(entry["title"].lower().split()) for slug, entry in pages.values()}
    used: dict[str, dict] = {slug: {} for slug in titles}
    for f in files.documentation_pages():
        page = f.page
        if page is None or not page.content or f.src_uri == LIBRARY or f.src_uri in pages:
            continue
        content = page.content
        heads = [(m.start(), int(m.group(1)), m.group(2), _text(m.group(3)))
                 for m in _HEAD_RE.finditer(content)]
        for m in _LINK_RE.finditer(content):
            parts = urlsplit(urljoin(_HOST + f.url, _html.unescape(m.group(1))))
            if parts.netloc != urlsplit(_HOST).netloc:
                continue
            hits = set()
            if parts.path == lib_path:
                if parts.fragment in titles:
                    hits.add(parts.fragment)
                else:
                    text = _text(m.group(2)).lower()
                    hits |= {slug for slug, t in titles.items() if t in text}
            elif parts.path in page_path:
                hits.add(page_path[parts.path])
            if not hits:
                continue
            before = [h for h in heads if h[0] < m.start() and h[1] in (2, 3)]
            anchor, heading = (before[-1][2], before[-1][3]) if before else (None, None)
            for slug in hits:
                used[slug].setdefault(f.src_uri, (page, anchor, heading))
    rank = _state["nav_rank"]
    # By kind first (data/section_map.yaml `order:`: guides, then lessons,
    # then prompts, then tools), pages without a kind (Home, the hubs) last,
    # then nav order (ordering principle, owner approved 2026-09-27).
    nav = _nav_hook()
    order = nav._S["deco"]["order"]
    kind_rank = lambda src: (order.index(nav.kind_of(src)) if nav.kind_of(src) in order else len(order))
    total = 0
    for src, (slug, _entry) in pages.items():
        ppage = files.get_file_from_path(src).page
        rows = []
        for tsrc, (tpage, anchor, heading) in sorted(used[slug].items(),
                                                     key=lambda kv: (kind_rank(kv[0]), rank.get(kv[0], 10**6), kv[0])):
            href = get_relative_url(tpage.file.url, ppage.file.url) + (f"#{anchor}" if anchor else "")
            sub = f'<span class="pp-rows__sub">{_html.escape(heading)}</span>' if heading else ""
            rows.append(f'<li><a href="{_html.escape(href)}"><span class="pp-rows__title">'
                        f'{_html.escape(tpage.title or tsrc)}</span>{sub}</a></li>')
        total += len(rows)
        block = (f'<ul class="pp-rows">{"".join(rows)}</ul>' if rows else
                 '<p class="pp-used-none">No other page on this site links to this prompt yet.</p>')
        slot = USED_SLOT.format(slug=slug)
        if ppage.content.count(slot) != 1:
            raise AssertionError(f"layout_prompt_pages: where-used slot missing on {src}")
        ppage.content = ppage.content.replace(slot, block)
    _state["used_rows"] = total
    _state["used_none"] = sorted(entry["title"] for slug, entry in pages.values() if not used[slug])
    _state["files"] = files
    # The home page's File.url is "./", a form urljoin never produces, so
    # key every page by the path a resolved link actually has.
    _state["ids"] = {_site_path(f.url): set(re.findall(r'\bid="([^"]+)"', f.page.content or ""))
                     for f in files.documentation_pages() if f.page is not None}
    _state["urls"] = {"/" + _site_path(f.url) for f in files}
    _state["links_checked"] = 0
    _state["copies_checked"] = 0
    return env


_ISLAND_RE = re.compile(r'<script type="application/json" id="prompt-texts">(.*?)</script>', re.DOTALL)
_BODY_RE = re.compile(r'<div class="pp-text__body" id="prompt-text-body">(.*?)</div>', re.DOTALL)
_SOURCE_RE = re.compile(r'<script type="application/json" id="prompt-text-source">(.*?)</script>', re.DOTALL)


def _site_path(url: str) -> str:
    return "" if url in ("./", ".") else url


def _check_links(output: str, page) -> int:
    start, end = output.find("<article"), output.rfind("</article>")
    if start == -1 or end == -1:
        raise AssertionError(f"layout_prompt_pages: no article on {page.file.src_uri}")
    article = output[start:end]
    own_ids = set(re.findall(r'\bid="([^"]+)"', output))
    checked = 0
    for href in re.findall(r'\bhref="([^"]*)"', article):
        href = _html.unescape(href)
        if not href or re.match(r"[a-z][a-z0-9+.-]*:", href, re.IGNORECASE) or href.startswith("//"):
            continue  # external, mailto: and the like are verify_links.py's job
        parts = urlsplit(urljoin(_HOST + page.file.url, href))
        path, fragment = parts.path, parts.fragment
        same = path == "/" + page.file.url
        if not same and path not in _state["urls"]:
            raise AssertionError(f"layout_prompt_pages: {page.file.src_uri} links to {href!r}, "
                                 "which is not a page or file in the built site")
        if fragment:
            ids = own_ids if same else _state["ids"].get(path.lstrip("/"), set())
            if fragment not in ids:
                raise AssertionError(f"layout_prompt_pages: {page.file.src_uri} links to {href!r}, "
                                     f"but that page has no #{fragment}")
        checked += 1
    return checked


def on_post_page(output, page, config):
    src = page.file.src_uri
    pages = _state.get("pages", {})
    if src == LIBRARY:
        _state["links_checked"] += _check_links(output, page)
        found = _ISLAND_RE.findall(output)
        if len(found) != 1:
            raise AssertionError("layout_prompt_pages: the library has no single prompt text island")
        texts = json.loads(found[0])
        expected = {slug: entry["prompt"] for slug, entry in pages.values()}
        if texts != expected:
            bad = sorted(s for s in expected if texts.get(s) != expected[s])
            raise AssertionError(f"layout_prompt_pages: library Copy text differs from "
                                 f"data/prompts.yaml for {bad or 'the set of prompts'}")
        _state["copies_checked"] += len(texts)
    elif src in pages:
        _slug, entry = pages[src]
        _state["links_checked"] += _check_links(output, page)
        source = _SOURCE_RE.findall(output)
        if len(source) != 1 or json.loads(source[0]) != entry["prompt"]:
            raise AssertionError(f"layout_prompt_pages: the Copy text on {src} is not "
                                 "byte-identical to data/prompts.yaml")
        shown = _BODY_RE.findall(output)
        if len(shown) != 1 or (re.sub(r"\s", "", _html.unescape(re.sub(r"<[^>]+>", "", shown[0])))
                               != re.sub(r"\s", "", entry["prompt"])):
            raise AssertionError(f"layout_prompt_pages: the prompt shown on {src} differs "
                                 "from data/prompts.yaml by more than line breaks")
        _state["copies_checked"] += 1
        # Every blank the panel fills is marked in the text once per use,
        # and the fields, their labels and the spans agree.
        fields, _example = _state["side"][_slug]
        marks = re.findall(r'<mark class="pp-blank" data-fill="(\d+)">', shown[0])
        want = sorted(str(f["id"]) for f in fields for _ in f["spans"])
        labels = re.findall(r'<label for="fill-(\d+)">', output)
        if sorted(marks) != want or labels != [str(f["id"]) for f in fields]:
            raise AssertionError(f"layout_prompt_pages: the fill-in fields on {src} do not match "
                                 "the blanks marked in its text")
        _state["blanks_marked"] = _state.get("blanks_marked", 0) + len(marks)
    return output


def on_post_build(config):
    pages = _state["pages"]
    sitemap = Path(config.site_dir) / "sitemap.xml"
    locs = set(re.findall(r"<loc>([^<]+)</loc>", sitemap.read_text(encoding="utf-8")))
    base = (config.site_url or "").rstrip("/") + "/"
    files = _state["files"]
    missing = [src for src in pages
               if base + files.get_file_from_path(src).url not in locs]
    if missing:
        raise AssertionError(f"layout_prompt_pages: prompt pages missing from sitemap.xml: {missing}")
    expected_copies = 2 * len(pages)  # the library's 24, plus one per page
    if _state["copies_checked"] != expected_copies:
        raise AssertionError(f"layout_prompt_pages: checked {_state['copies_checked']} copy "
                             f"texts, expected {expected_copies}")
    print("layout_prompt_pages: prompt pages verification")
    print(f"  prompts read      : {len(pages)}")
    print(f"  pages generated   : {len(pages)} (in sitemap.xml: {len(pages) - len(missing)}, cross-check ok)")
    print(f"  copy texts        : {_state['copies_checked']} byte-identical to data/prompts.yaml "
          f"({len(pages)} in the library, {len(pages)} on the pages)")
    print(f"  links asserted    : {_state['links_checked']} (library and prompt pages, all resolve)")
    print(f"  where-used rows   : {_state['used_rows']}; not linked yet: "
          f"{', '.join(_state['used_none']) or 'none'}")
    print(f"  related rows      : {_state['related_rows']}")
    side = _state["side"]
    with_fields = sorted(s for s, (f, _) in side.items() if f)
    print(f"  fill-in panels    : {len(with_fields)} of {len(side)} prompts, "
          f"{sum(len(side[s][0]) for s in with_fields)} fields, "
          f"{_state.get('blanks_marked', 0)} blanks marked in the text")
    print(f"  no blanks         : {', '.join(sorted(s for s in side if s not in with_fields)) or 'none'}")
    print(f"  worked examples   : {', '.join(f'{s} ({e[1]})' for s, (_, e) in sorted(side.items()) if e) or 'none'}")
    for title, notes in sorted(_state["doubtful"].items()):
        print(f"  doubtful, {title}: " + "; ".join(notes[:4]) + (f" (+{len(notes) - 4} more)" if len(notes) > 4 else ""))
