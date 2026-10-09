"""Company pages (Tools & Prompts > By Company), rendered from data/vendors.yaml.

Called by the render_data hook: `verify(config)` from its on_config (prints the counts and
fails the build on a malformed entry), and `render(src, markdown, config)` from its
on_page_markdown for a page listed in the data. Each page carries one marker per section,

    <!-- render:vendor:<id>:<section> -->

for every section in SECTIONS, each exactly once, so every company's page has the same
sections in the same order (owner's request, 2026-10-09: one template for all, so none is
favoured). The commands' worked examples are drawn as HTML figures of a terminal (words in
HTML, the site's figure method), labelled as illustrations from the company's own
documentation, never as screenshots.
"""
import html
import re
from datetime import date
from pathlib import Path

import yaml

SECTIONS = ("plans", "models", "surfaces", "features", "harnesses", "commands", "shortcuts",
            "privacy", "changes")
MARKER_RE = re.compile(r"<!-- render:vendor:([\w-]+):([\w-]+) -->")
REQUIRED = ("id", "page", "name", "company", "checked", "pricing_url", "plans", "models",
            "surfaces", "features", "harnesses", "commands", "command_groups", "shortcuts",
            "symbols", "full_lists", "privacy", "changes")
_CACHE: dict = {}

esc = html.escape


def _long(value) -> str:
    d = value if isinstance(value, date) else date.fromisoformat(str(value))
    return f"{d.strftime('%B')} {d.day}, {d.year}"


def _link(text: str, url: str) -> str:
    return f"[{text}]({url})"


def _need(entry: dict, keys: tuple, where: str) -> None:
    missing = [k for k in keys if entry.get(k) in (None, "", [])]
    if missing:
        raise ValueError(f"render_vendors: {where} lacks {', '.join(missing)}")


def load(config) -> list:
    path = Path(config["docs_dir"]).parent / "data" / "vendors.yaml"
    key = (str(path), path.stat().st_mtime)
    if _CACHE.get("key") != key:
        _CACHE.update(key=key, vendors=yaml.safe_load(path.read_text(encoding="utf-8"))["vendors"])
    return _CACHE["vendors"]


def verify(config) -> None:
    vendors = load(config)
    seen, totals = set(), dict.fromkeys(("plans", "models", "surfaces", "features", "harnesses",
                                         "commands", "examples", "shortcuts", "privacy", "changes"), 0)
    for v in vendors:
        _need(v, REQUIRED, f"vendor {v.get('id', '?')}")
        if v["id"] in seen:
            raise ValueError(f"render_vendors: duplicate vendor id {v['id']}")
        seen.add(v["id"])
        src = Path(config["docs_dir"]) / v["page"]
        if not src.is_file():
            raise ValueError(f"render_vendors: {v['id']} names docs/{v['page']}, which does not exist")
        text = src.read_text(encoding="utf-8")
        found = MARKER_RE.findall(text)
        want = [(v["id"], s) for s in SECTIONS]
        if found != want:
            raise ValueError(f"render_vendors: docs/{v['page']} must carry the markers "
                             f"{[f'{a}:{b}' for a, b in want]} once each, in order; found "
                             f"{[f'{a}:{b}' for a, b in found]}")
        harness_ids = {h["id"] for h in v["harnesses"]}
        group_ids = [g["id"] for g in v["command_groups"]]
        for kind, keys in (("plans", ("name", "for", "adds", "source")),
                           ("models", ("name", "released", "best_for", "where", "source")),
                           ("surfaces", ("name", "what", "source")),
                           ("features", ("name", "what", "plans", "status", "source")),
                           ("harnesses", ("id", "name", "what", "runs", "plans", "acts", "modes", "source")),
                           ("commands", ("harness", "group", "command", "what", "source")),
                           ("shortcuts", ("harness", "keys", "what", "source")),
                           ("symbols", ("harness", "syntax", "what", "source")),
                           ("privacy", ("title", "url", "covers")),
                           ("changes", ("date", "change", "source"))):
            for i, item in enumerate(v[kind]):
                _need(item, keys, f"{v['id']} {kind}[{i}]")
                for k in ("source", "url"):
                    if k in item and not str(item[k]).startswith("https://"):
                        raise ValueError(f"render_vendors: {v['id']} {kind}[{i}] {k} is not https: {item[k]}")
                if "harness" in item and item["harness"] not in harness_ids:
                    raise ValueError(f"render_vendors: {v['id']} {kind}[{i}] names unknown harness {item['harness']}")
            if kind in totals:
                totals[kind] += len(v[kind])
        for g in group_ids:   # the grid runs three across, so a group of 4 would leave one alone
            n = sum(1 for c in v["commands"] if c["group"] == g and c.get("example"))
            if n % 3:
                raise ValueError(f"render_vendors: {v['id']} command group {g} has {n} worked examples; "
                                 "keep each group a multiple of three so no row holds a single figure")
        for i, c in enumerate(v["commands"]):
            if c["group"] not in group_ids:
                raise ValueError(f"render_vendors: {v['id']} command {c['command']} names unknown group {c['group']}")
            if c.get("example"):
                _need(c["example"], ("situation", "typed", "shown", "why"), f"{v['id']} {c['command']} example")
                totals["examples"] += 1
        dates = [str(c["date"]) for c in v["changes"]]
        if dates != sorted(dates, reverse=True):
            raise ValueError(f"render_vendors: {v['id']} changes must run newest first")
    print(f"render_vendors: {len(vendors)} company page(s) verified")
    for k, n in totals.items():
        print(f"  {k:<10}: {n}")


def _plans(v) -> str:
    rows = ["| Plan | Who It Is For | What It Adds |", "| --- | --- | --- |"]
    rows += [f"| {_link(p['name'], p['source'])} | {p['for']} | {p['adds']} |" for p in v["plans"]]
    return "\n".join(rows) + (f"\n\nPrices change often, so they are not copied here: see "
                              f"{_link(v['company'] + ' pricing', v['pricing_url'])}.")


def _models(v) -> str:
    rows = ["| Model | Released | Best For | Where You Get It |", "| --- | --- | --- | --- |"]
    rows += [f"| {_link(m['name'], m['source'])} | {_long(m['released'])} | {m['best_for']} | {m['where']} |"
             for m in v["models"]]
    return "\n".join(rows) + ("\n\nFor how these models compare with others on independent tests, see "
                              "[Compare Models](../../benchmarks.md).")


def _surfaces(v) -> str:
    return "\n".join(f"- **{_link(s['name'], s['source'])}**: {s['what']}" for s in v["surfaces"])


def _features(v) -> str:
    rows = ["| Feature | What It Does | Plans | Status |", "| --- | --- | --- | --- |"]
    rows += [f"| {_link(f['name'], f['source'])} | {f['what']} | {f['plans']} | {f['status']} |"
             for f in v["features"]]
    return "\n".join(rows)


def _harnesses(v) -> str:
    out = []
    labels = (("runs", "Where it runs"), ("plans", "Plans"), ("acts", "How it works"),
              ("instructions", "Standing instructions"), ("skills", "Skills"), ("hooks", "Hooks"),
              ("subagents", "Helpers (subagents)"), ("connectors", "Connections"),
              ("sandbox", "Sandbox"))
    for h in v["harnesses"]:
        out += [f"### {h['name']}", "", h["what"], ""]
        out += [f"- **{label}:** {h[key]}" for key, label in labels if h.get(key)]
        out += ["", "| Permission Mode | What It Does |", "| --- | --- |"]
        out += [f"| {m['name']} | {m['what']} |" for m in h["modes"]]
        out += ["", f"Source: {_link(v['company'] + ' documentation', h['source'])}.", ""]
    return "\n".join(out).rstrip()


def _shown(line: str) -> str:
    line = str(line)
    if line.startswith("[") and line.endswith("]"):
        return f'<li class="hf-term-desc">{esc(line[1:-1])}</li>'
    if line.startswith("option: "):
        return f'<li class="hf-term-opt">{esc(line[len("option: "):])}</li>'
    return f"<li>{esc(line)}</li>"


def _figure(v, c, harness_name) -> str:
    ex = c["example"]
    anchor = "cmd-" + re.sub(r"[^a-z0-9]+", "-", c["command"].lower()).strip("-")
    return "\n".join([
        f'<figure class="figure figure--html hf hf-cmd" id="{anchor}">',
        f'<p class="hf-title"><code>{esc(c["command"])}</code> {esc(c["what"])}</p>',
        f'<p class="hf-cmd-when">{esc(ex["situation"])}</p>',
        '<div class="hf-term">',
        f'<p class="hf-term-bar">{esc(harness_name)}</p>',
        f'<p class="hf-term-in"><span class="hf-term-caret" aria-hidden="true">&gt;</span> <kbd>{esc(ex["typed"])}</kbd></p>',
        '<ul class="hf-term-out">', *[_shown(s) for s in ex["shown"]], "</ul>",
        "</div>",
        *([f'<p class="hf-cmd-note">{esc(ex["note"])}</p>'] if ex.get("note") else []),
        f'<figcaption>{esc(ex["why"])} <span class="hf-cmd-src">An illustration drawn from '
        f'<a href="{esc(c["source"])}">{esc(v["company"])}\'s documentation</a>, not a screenshot.</span></figcaption>',
        "</figure>",
    ])


def _commands(v) -> str:
    names = {h["id"]: h["name"] for h in v["harnesses"]}
    out = []
    for g in v["command_groups"]:
        cmds = [c for c in v["commands"] if c["group"] == g["id"]]
        if not cmds:
            continue
        out += [f"### {g['title']}", "", '<div class="hf-cmd-grid" markdown>', ""]
        for c in cmds:
            if c.get("example"):
                out += [_figure(v, c, names[c["harness"]]), ""]
        out += ["</div>", ""]
        plain = [c for c in cmds if not c.get("example")]
        if plain:
            out += [f"- `{c['command']}`: {c['what']}" for c in plain] + [""]
    lists = ", ".join(_link(f["title"], f["url"]) for f in v["full_lists"])
    out.append(f"{v['company']}'s own complete references: {lists}.")
    return "\n".join(out)


def _shortcuts(v) -> str:
    rows = ["| Keys | What They Do |", "| --- | --- |"]
    rows += [f"| <kbd>{esc(s['keys'])}</kbd> | {s['what']} |" for s in v["shortcuts"]]
    rows += ["", "| Type | What It Does |", "| --- | --- |"]
    rows += [f"| <kbd>{esc(s['syntax'])}</kbd> | {s['what']} |" for s in v["symbols"]]
    return "\n".join(rows)


def _privacy(v) -> str:
    out = [f"- {_link(p['title'], p['url'])}: {p['covers']}" for p in v["privacy"]]
    return "\n".join(out)


def _changes(v) -> str:
    return "\n".join(f"- **{_long(c['date'])}:** {c['change']} ({_link('source', c['source'])})"
                     for c in v["changes"])


RENDER = {"plans": _plans, "models": _models, "surfaces": _surfaces, "features": _features,
          "harnesses": _harnesses, "commands": _commands, "shortcuts": _shortcuts,
          "privacy": _privacy, "changes": _changes}


def pages(config) -> dict:
    return {v["page"]: v for v in load(config)}


def render(src: str, markdown: str, config) -> str:
    v = pages(config).get(src)
    if v is None:
        if MARKER_RE.search(markdown):
            raise ValueError(f"render_vendors: {src} carries a vendor marker but is not in data/vendors.yaml")
        return markdown
    markdown = markdown.replace("{{ vendor_checked }}", _long(v["checked"]))
    return MARKER_RE.sub(lambda m: RENDER[m.group(2)](v), markdown)
