"""MkDocs hook: the step-by-step guides (layout redesign L14, 2026-09-25).

The nine guides under docs/playbooks/ open answer-first. Under the meta
line sits one panel with what the reader needs to start: the prompt the
guide uses, what to have ready, and a button that copies the prompt. The
steps follow at once; background comes after them.

Front matter this hook understands (guides only):

  prompts:                  # prompt library card ids, at most two
    - lecture-outline-builder

A card id is the prompt's title in data/prompts.yaml, lowercased, with
every run of other characters turned into one hyphen (the anchor
scripts/render_data.py gives each library card). An id that names no
prompt fails the build, so a retitled prompt cannot leave a guide
pointing at nothing.

Markdown this hook understands (guides only):

  **Have ready:** what to supply, in one sentence.
  { .have-ready }
      Moved into the panel above the Copy button, in order: the first one
      goes with the first prompt, the second with the second. A guide
      without prompts keeps its own panel of just this line (plus the
      page's action button, if its front matter has one).

  One template paragraph, in the syllabus guide.
  { .guide-template }
      Gets a labelled "Copy this template" button under the heading above
      it, and its [bracketed parts] are marked as the parts to fill.

The panel renders from data/prompts.yaml (name, tagline, prompt text),
never from text pasted into a page. Copy puts the stored prompt on the
clipboard exactly as the file holds it: the text rides in a data
attribute, which site search does not index, and every copy text in every
built page is compared with data/prompts.yaml after rendering, so a
mismatch fails the build. Without JavaScript, Copy is a link to the
prompt's card in the library, which has its own copy control.

Also here, for the guides only: the "Before you rely on it" checklists
become real checkboxes you can tick (owner decision 13; pymdownx.tasklist
clickable_checkbox in mkdocs.yml), with the item text inside the label so
the whole row is the target and the checkbox has a name; ticks reset on
reload and are never stored. The first ordered list under "The workflow"
gets numbered step markers.

Raw HTML is not covered by MkDocs anchor validation, so every link this
hook writes is checked here: the library and directory pages must exist,
and every card id a guide uses must be an anchor on the built library
page.
"""
from __future__ import annotations

import html as _html
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

import yaml
from mkdocs.utils import get_relative_url

GUIDES = "playbooks/"
GUIDE_INDEX = "playbooks/index.md"
LIBRARY = "prompts/index.md"
DIRECTORY = "tools/index.md"
MAX_PROMPTS = 2
# "Gather first" was a heading on seven guides until the answer-first
# rewrite folded it into the panel's Have ready line; that line keeps its
# anchor, so an old link or bookmark still lands on what to gather.
OLD_GATHER_ID = "gather-first"

# Material Design "content-copy" icon (the one Material for MkDocs uses on
# code blocks), decorative: the button's words carry its meaning.
ICON = ('<svg class="guide-copy__icon" aria-hidden="true" focusable="false" '
        'viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" '
        'd="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 '
        '2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1Z"/></svg>')

_prompts: dict[str, dict] = {}
_state: dict = {}


def _reset() -> None:
    _state.clear()
    _state.update(guides=[], panels=0, rows=0, embedded=0, verified=0,
                  templates=0, checklists=0, checklist_items=0,
                  used_ids=set(), library_ids=None, expected={})


_reset()


def _prompt_slug(title: str) -> str:
    """The library card anchor for a prompt title. Must match
    render_data._prompt_slug; on_config checks that it does."""
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")


def _is_guide(page) -> bool:
    src = page.file.src_uri
    return src.startswith(GUIDES) and src != GUIDE_INDEX


def on_config(config):
    _reset()
    path = Path(config["docs_dir"]).parent / "data" / "prompts.yaml"
    entries = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(entries, list) or not entries:
        raise ValueError(f"layout_guides: {path} did not parse to a non-empty list")
    _prompts.clear()
    for entry in entries:
        slug = _prompt_slug(entry["title"])
        if slug in _prompts:
            raise ValueError(f"layout_guides: two prompts share the card id {slug!r}")
        if not isinstance(entry.get("prompt"), str) or not entry["prompt"].strip():
            raise ValueError(f"layout_guides: prompt {entry['title']!r} has no prompt text")
        _prompts[slug] = entry
    # The library's own slug function is the source of truth for card ids.
    library_hook = sys.modules.get("scripts/render_data.py")
    theirs = getattr(library_hook, "_prompt_slug", None)
    if theirs is None:
        raise RuntimeError("layout_guides: scripts/render_data.py is not loaded, so the "
                           "prompt card ids cannot be cross-checked; keep it first in hooks")
    for entry in entries:
        if theirs(entry["title"]) != _prompt_slug(entry["title"]):
            raise AssertionError("layout_guides: card id for "
                                 f"{entry['title']!r} differs from render_data's")
    return config


def on_pre_build(config):
    _reset()


def _prompt_ids(page) -> list[str]:
    raw = (page.meta or {}).get("prompts") or []
    if isinstance(raw, str):
        raw = [raw]
    if not isinstance(raw, list) or not all(isinstance(i, str) for i in raw):
        raise ValueError(f"layout_guides: {page.file.src_uri}: `prompts:` must be a list "
                         "of prompt card ids")
    if len(raw) > MAX_PROMPTS:
        raise ValueError(f"layout_guides: {page.file.src_uri} names {len(raw)} prompts; "
                         f"the panel holds at most {MAX_PROMPTS}")
    if len(set(raw)) != len(raw):
        raise ValueError(f"layout_guides: {page.file.src_uri} names a prompt twice")
    for pid in raw:
        if pid not in _prompts:
            near = [k for k in _prompts if pid.split("-")[0] in k][:3]
            raise ValueError(
                f"layout_guides: {page.file.src_uri} names the prompt {pid!r}, which is not "
                "a card id in data/prompts.yaml (a card id is the title in lowercase with "
                f"hyphens){'; did you mean ' + ', '.join(near) + '?' if near else ''}")
    return raw


def on_page_markdown(markdown, page, config, files):
    if _is_guide(page):
        _prompt_ids(page)  # fail early, before any rendering
    return markdown


def _url(path: str, page, files, anchor: str = "") -> str:
    target = files.get_file_from_path(path)
    if target is None:
        raise ValueError(f"layout_guides: {page.file.src_uri} needs {path}, which does not exist")
    return get_relative_url(target.url, page.url) + ("#" + anchor if anchor else "")


def _esc(text: str) -> str:
    return _html.escape(text, quote=True)


def _sentence(text: str) -> str:
    text = " ".join(str(text).split())
    return text if text[-1:] in ".?!" else text + "."


def _plain(fragment: str) -> str:
    return " ".join(_html.unescape(re.sub(r"<[^>]+>", "", fragment)).split())


_META_P = re.compile(r'(</h1>\s*)(<p>\s*<span class="meta-chip".*?</p>)', re.S)
_HAVE = re.compile(r'<p class="have-ready">(.*?)</p>\s*', re.S)
_SLOT = re.compile(r'<div class="page-action" data-page-action>.*?</div>', re.S)


def _prompt_row(pid: str, index: int, ready: str | None, page, files) -> str:
    entry = _prompts[pid]
    title = " ".join(entry["title"].split())
    href = _url(LIBRARY, page, files, pid)
    primary = index == 0
    button_cls = "md-button md-button--primary guide-copy" if primary else "md-button guide-copy"
    # The first row's buttons are the page's action slot, so layout.js docks
    # its Copy button (right-hand column on desktop, bottom bar on phones).
    slot = " data-page-action" if primary else ""
    parts = [
        '<div class="guide-prompt">',
        f'<p class="guide-prompt__name">{_esc(title)}</p>',
        f'<p class="guide-prompt__tagline">{_esc(_sentence(entry["tagline"]))}</p>',
    ]
    if ready:
        pin = f' id="{OLD_GATHER_ID}"' if primary else ""
        parts.append(f'<p class="guide-prompt__ready"{pin}>{ready}</p>')
    parts.append(
        f'<div class="guide-prompt__actions"{slot} data-search-exclude>'
        f'<a class="{button_cls}" href="{_esc(href)}" data-copy-prompt="{pid}" '
        f'data-prompt-text="{_esc(entry["prompt"])}" '
        f'aria-label="Copy the prompt: {_esc(title)}">{ICON}'
        '<span class="guide-copy__label">Copy the prompt</span></a>'
        f'<a class="guide-view" href="{_esc(href)}" '
        f'aria-label="View prompt: {_esc(title)}">View prompt</a>'
        '</div>')
    parts.append('</div>')
    _state["used_ids"].add(pid)
    _state["expected"].setdefault(page.file.src_uri, []).append(pid)
    return "".join(parts)


def _panel(page, files, ids: list[str], ready: list[str], slot: str) -> str:
    src = page.file.src_uri
    if ids:
        if len(ready) > len(ids):
            raise ValueError(f"layout_guides: {src} has {len(ready)} Have ready lines "
                             f"for {len(ids)} prompts")
        if slot:
            raise ValueError(f"layout_guides: {src} has both prompts and an `action:` "
                             "button; the panel's Copy button is the page's action")
        label = "The prompt this guide uses" if len(ids) == 1 else "The prompts this guide uses"
        rows = [_prompt_row(pid, i, ready[i] if i < len(ready) else None, page, files)
                for i, pid in enumerate(ids)]
        directory = _url(DIRECTORY, page, files)
        _state["rows"] += len(rows)
        return ('<section class="guide-panel" aria-labelledby="guide-panel-label">'
                f'<p class="guide-panel__label" id="guide-panel-label">{label}</p>'
                + "".join(rows)
                + '<p class="guide-panel__status" role="status" data-search-exclude></p>'
                '<p class="guide-panel__foot">Works with any capable assistant in the '
                f'<a href="{_esc(directory)}">Tool Directory</a>.</p>'
                '</section>')
    if not ready and not slot:
        return ""
    body = ""
    for i, r in enumerate(ready):
        pin = "" if i else f' id="{OLD_GATHER_ID}"'
        body += f'<p class="guide-panel__ready"{pin}>{r}</p>'
    return f'<div class="guide-panel guide-panel--plain">{body}{slot}</div>'


# --- the "Before you rely on it" checklists --------------------------------

_TASK_ITEM = re.compile(
    r'<li class="task-list-item"><label class="task-list-control">'
    r'<input type="checkbox"(?: disabled)?( checked)?\s*/?>'
    r'<span class="task-list-indicator"></span></label>\s*(.*?)</li>', re.S)
_TASK_LIST_END = re.compile(r'(<ul class="task-list">.*?</ul>)', re.S)


def _checklists(html: str, src: str) -> str:
    def item(m):
        text = m.group(2)
        if "<a " in text:
            raise ValueError(f"layout_guides: a checklist item in {src} holds a link; the "
                             "whole row is the checkbox's label, so a link inside it would "
                             "also tick the box. Move the link out of the checklist.")
        _state["checklist_items"] += 1
        checked = " checked" if m.group(1) else ""
        return ('<li class="task-list-item"><label class="task-list-control">'
                f'<input type="checkbox" autocomplete="off"{checked}>'
                '<span class="task-list-indicator"></span>'
                f'<span class="task-list-text">{text}</span></label></li>')

    def block(m):
        _state["checklists"] += 1
        return (m.group(1) + '<p class="task-list-note" data-search-exclude>For your own '
                "checking: ticks are not saved or sent anywhere.</p>")

    before = len(_TASK_ITEM.findall(html))
    html = _TASK_ITEM.sub(item, html)
    if before and "task-list-control\"><input type=\"checkbox\" autocomplete" not in html:
        raise AssertionError(f"layout_guides: checklist rewrite failed in {src}")
    return _TASK_LIST_END.sub(block, html)


# --- syllabus templates ------------------------------------------------------

_TEMPLATE_BLOCK = re.compile(
    r'(<h3 id="(?P<id>[^"]+)"[^>]*>(?P<head>(?:(?!</h3>).)*)</h3>)'
    r'(?P<gap>\s*)'
    r'(?P<body><details\b(?:(?!</details>).)*?<p class="guide-template">(?:(?!</details>).)*</details>'
    r'|<p class="guide-template">.*?</p>)', re.S)
_TEMPLATE_P = re.compile(r'<p class="guide-template">(.*?)</p>', re.S)
_SLOT_TEXT = re.compile(r"\[([^\[\]<>]+)\]")


def _templates(html: str, src: str) -> str:
    total = len(_TEMPLATE_P.findall(html))

    def mark(m):
        inner = _SLOT_TEXT.sub(r'<span class="guide-template__slot">[\1]</span>', m.group(1))
        return f'<p class="guide-template">{inner}</p>'

    def block(m):
        para = _TEMPLATE_P.search(m.group("body"))
        text = _plain(para.group(1))
        name = _plain(re.sub(r'<a class="headerlink".*?</a>', "", m.group("head")))
        _state["templates"] += 1
        button = (
            '<div class="guide-template__actions" data-search-exclude>'
            '<button type="button" class="md-button guide-copy guide-copy--template" hidden '
            f'data-copy-text="{_esc(text)}" aria-label="Copy this template: {_esc(name)}">'
            f'{ICON}<span class="guide-copy__label">Copy this template</span></button></div>')
        body = _TEMPLATE_P.sub(mark, m.group("body"))
        return m.group(1) + button + m.group("gap") + body

    html, found = _TEMPLATE_BLOCK.subn(block, html)
    if found != total:
        raise AssertionError(f"layout_guides: {src} has {total} templates but {found} sit "
                             "directly under an h3 (the Copy button goes under the heading)")
    return html


# --- the workflow's numbered steps -------------------------------------------

def _steps(html: str) -> str:
    at = html.find('<h2 id="the-workflow"')
    if at == -1:
        return html
    end = html.find("<h2", at + 5)
    end = len(html) if end == -1 else end
    ol = html.find("<ol>", at, end)
    if ol == -1:
        return html
    return html[:ol] + '<ol class="guide-steps">' + html[ol + 4:]


def on_page_content(html, page, config, files):
    if not _is_guide(page):
        return html
    src = page.file.src_uri
    _state["guides"].append(src)
    ids = _prompt_ids(page)

    ready = [m.group(1) for m in _HAVE.finditer(html)]
    html = _HAVE.sub("", html)
    slot = ""
    slot_m = _SLOT.search(html)
    if slot_m:
        slot = slot_m.group(0)
        html = html[:slot_m.start()] + html[slot_m.end():]
        # layout_frame checks that an action's page exists; an anchor on this
        # same page (the syllabus guide's "Copy a template") is checked here.
        for anchor in re.findall(r'href="(?:\./)?#([^"]+)"', slot):
            if f'id="{anchor}"' not in html:
                raise ValueError(f"layout_guides: {src}'s action links to #{anchor}, "
                                 "which is not an anchor on the page")

    panel = _panel(page, files, ids, ready, slot)
    if panel:
        _state["panels"] += 1
        m = _META_P.search(html)
        if m:
            html = html[:m.end()] + panel + html[m.end():]
        else:
            i = html.find("</h1>")
            if i == -1:
                raise ValueError(f"layout_guides: {src} has no h1 to put the panel under")
            html = html[:i + 5] + panel + html[i + 5:]

    html = _checklists(html, src)
    html = _templates(html, src)
    html = _steps(html)
    page.meta["guide_script"] = bool(ids) or 'class="md-button guide-copy' in html
    return html


# --- after rendering: verify what shipped, add the script ---------------------

class _CopyAttrs(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.found: list[tuple[str, str]] = []
        self.ids: set[str] = set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "data-copy-prompt" in a:
            self.found.append((a["data-copy-prompt"], a.get("data-prompt-text") or ""))
        if a.get("id"):
            self.ids.add(a["id"])


def on_post_page(output, page, config):
    src = page.file.src_uri
    if src == LIBRARY:
        parser = _CopyAttrs()
        parser.feed(output)
        _state["library_ids"] = parser.ids
        return output
    if not _is_guide(page):
        return output
    parser = _CopyAttrs()
    parser.feed(output)
    expected = _state["expected"].get(src, [])
    if [pid for pid, _ in parser.found] != expected:
        raise AssertionError(f"layout_guides: {src} shipped copy buttons for "
                             f"{[p for p, _ in parser.found]}, expected {expected}")
    for pid, text in parser.found:
        _state["embedded"] += 1
        if text != _prompts[pid]["prompt"]:
            raise AssertionError(f"layout_guides: the copy text for {pid!r} on {src} is not "
                                 "byte-identical to data/prompts.yaml")
        _state["verified"] += 1
    if page.meta.get("guide_script"):
        at = output.rfind("</body>")
        if at == -1:
            raise ValueError(f"layout_guides: no </body> in {src}")
        output = output[:at] + "<script>" + SCRIPT + "</script>\n" + output[at:]
    return output


def on_post_build(config):
    s = _state
    library = s["library_ids"]
    if library is not None:
        missing = sorted(s["used_ids"] - library)
        if missing:
            raise AssertionError("layout_guides: the prompt library has no card anchor for "
                                 + ", ".join(missing))
    print("layout_guides: guides verification")
    print(f"  guides rendered    : {len(s['guides'])}")
    print(f"  panels             : {s['panels']} ({s['rows']} prompt rows)")
    print(f"  copy texts shipped : {s['embedded']}, byte-identical to data/prompts.yaml: "
          f"{s['verified']} ({'cross-check ok' if s['verified'] == s['embedded'] == s['rows'] else 'MISMATCH'})")
    print(f"  library anchors    : {len(s['used_ids'])} used, "
          + ("all present" if library is not None else "library page not built, not checked"))
    print(f"  templates          : {s['templates']} with a Copy button")
    print(f"  checklists         : {s['checklists']} ({s['checklist_items']} tickable items)")
    if not (s["verified"] == s["embedded"] == s["rows"]):
        raise AssertionError("layout_guides: copy text count mismatch")


# The page script. Inline, and only on guides that need it, so no other
# page loads it; added after rendering, so search never indexes it.
SCRIPT = r"""
(function () {
  "use strict";
  var live = document.createElement("div");
  live.className = "guide-sr";
  live.setAttribute("role", "status");
  document.body.appendChild(live);

  function say(el, msg) {
    el.textContent = "";
    window.setTimeout(function () { el.textContent = msg; }, 60);
  }

  function viaSelection(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.className = "guide-offscreen";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () {
        if (!viaSelection(text)) throw new Error("blocked");
      });
    }
    return viaSelection(text) ? Promise.resolve() : Promise.reject(new Error("blocked"));
  }

  // Last resort: show the text selected, for the reader to copy by hand.
  function manual(source, text, what) {
    var holder = source.parentNode;
    var box = holder.nextElementSibling;
    if (!box || !box.classList.contains("guide-manual")) {
      box = document.createElement("div");
      box.className = "guide-manual";
      var note = document.createElement("p");
      note.textContent = "This browser blocked copying, so the " + what +
        " is selected below. Copy it from there.";
      var ta = document.createElement("textarea");
      ta.readOnly = true;
      ta.rows = 8;
      ta.setAttribute("aria-label", "The " + what + ", selected for copying");
      ta.value = text;
      box.appendChild(note);
      box.appendChild(ta);
      holder.parentNode.insertBefore(box, holder.nextSibling);
    }
    var area = box.querySelector("textarea");
    area.focus();
    area.select();
  }

  function flash(btn) {
    var label = btn.querySelector(".guide-copy__label");
    var target = label || btn;
    if (!btn.getAttribute("data-label")) btn.setAttribute("data-label", target.textContent);
    target.textContent = "Copied";
    btn.classList.add("is-copied");
    window.clearTimeout(btn._guideTimer);
    btn._guideTimer = window.setTimeout(function () {
      target.textContent = btn.getAttribute("data-label");
      btn.classList.remove("is-copied");
    }, 2500);
  }

  function wire(btn, source, text, what, status, message) {
    if (btn.tagName === "A") {
      btn.setAttribute("role", "button");
      btn.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); btn.click(); }
      });
    }
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      copy(text).then(function () {
        flash(btn);
        if (btn !== source) flash(source);
        say(status || live, message);
      }, function () {
        manual(source, text, what);
      });
    });
  }

  var status = document.querySelector(".guide-panel__status");
  var sources = {};
  document.querySelectorAll("a.guide-copy[data-copy-prompt]").forEach(function (a) {
    var text = a.getAttribute("data-prompt-text");
    sources[a.getAttribute("href")] = a;
    wire(a, a, text, "prompt", status,
         "Copied. Paste it into your assistant, then add what you have ready.");
  });
  // layout-nav.js docks the page's action (the first row's Copy) in the
  // section navigator's pill as a plain link; make that copy copy too.
  document.querySelectorAll("a.secnav__action").forEach(function (a) {
    var source = sources[a.getAttribute("href")];
    if (!source) return;
    a.setAttribute("aria-label", source.getAttribute("aria-label"));
    // On desktop, name the prompt above the docked button (hidden from
    // screen readers, which hear the name in the button's own label).
    if (a.parentNode.classList.contains("hub-dock")) {
      var row = source.closest(".guide-prompt");
      var name = row && row.querySelector(".guide-prompt__name");
      if (name) {
        var p = document.createElement("p");
        p.className = "guide-dock-name";
        p.setAttribute("aria-hidden", "true");
        p.textContent = name.textContent;
        a.parentNode.insertBefore(p, a);
      }
    }
    wire(a, source, source.getAttribute("data-prompt-text"), "prompt", status,
         "Copied. Paste it into your assistant, then add what you have ready.");
  });
  document.querySelectorAll("button.guide-copy[data-copy-text]").forEach(function (b) {
    b.hidden = false;
    wire(b, b, b.getAttribute("data-copy-text"), "template", null,
         "Copied. Paste it into your syllabus and fill in the bracketed parts.");
  });
})();
"""
