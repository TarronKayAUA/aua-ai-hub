"""MkDocs hook: each page's sitemap <lastmod> from git history (2026-10-02).

Why: MkDocs dates every page with the build date, and the site builds several times a
day, so sitemap.xml claimed all 114 pages changed today. Search engines learn to ignore
a lastmod that is always "today" (owner request, discoverability). A page's date is now
the newest commit among the files its content comes from:

- its own markdown file (a generated prompt page: data/prompts.yaml);
- the data file behind each `<!-- render:NAME -->` marker in it (RENDER_SOURCES, which
  must name every marker: an unknown one fails the build, so a new marker cannot
  silently date its page by the markdown alone);
- each file it includes with `--8<-- "path"`.

A page with a `<!-- timely: -->` news, events, calls or committee marker (the home
page, News & Events) prints today's date and today's open calls and polls, so its
content does change with every build and it keeps the build date; `timely:minutes`
only totals other pages' reading times, so it dates from those pages. A file with
uncommitted changes counts as changed today.

Needs the full history: the deploy and refresh workflows check out with fetch-depth 0.
(A blob:none partial clone gives identical dates, checked 2026-10-02, but refresh.yml
commits and pulls with rebase, which would then fetch file contents mid-run; full
history keeps that workflow ordinary.) In a shallow clone, or with no git, every page
keeps the build date and the verification block says so.
"""

from __future__ import annotations

import re
import subprocess
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from mkdocs.utils import get_build_date

RENDER_SOURCES = {
    "tools": ["data/tools.yaml"],
    "tool-access": ["data/tools.yaml"],
    "directory-today": ["data/tools.yaml"],
    "tool-chooser": ["data/tools.yaml", "data/tool_tasks.yaml"],
    "skills": ["data/skills.yaml"],
    "prompts": ["data/prompts.yaml"],
    "prompt-resources": ["data/prompt_resources.yaml"],
    "polls": ["data/polls.yaml"],
    "opportunities": ["data/opportunities.yaml"],
    "open-models": ["data/open_models.yaml"],
    "next-token-demo": ["data/next_token_demo.yaml"],
    "hardware-estimator": ["data/local_models.yaml", "data/hardware_tiers.yaml"],
    "conferences": ["data/conferences.yaml"],
    "committee-work": ["data/committee_work.yaml"],
    "committee": ["data/committee.yaml"],
    "learning-resources": ["data/learning_resources.yaml"],
    "guide-videos": ["data/guide_videos.yaml"],
    "glossary-az": [],   # built from the page's own entries
    "maintainer-profiles": ["mkdocs.yml"],   # extra.maintainer_profiles
    "explainer-video": ["data/explainer_videos.yaml"],
    # the company pages: each dates from its own data/vendors/<id>.yaml (see _sources)
    "vendor": [],
}
GENERATED_SOURCES = {re.compile(r"prompts/[\w-]+\.md"): ["data/prompts.yaml"]}

_RENDER = re.compile(r"<!--\s*render:([\w-]+)")
_VENDOR = re.compile(r"<!--\s*render:vendor:([\w-]+):")
_TIMELY = re.compile(r"<!--\s*timely:([\w-]+)((?:[ \t]+[^\s>]+)*)[ \t]*-->")
_SNIPPET = re.compile(r"^\s*--8<--\s+\"([^\"]+)\"", re.M)

_state: dict = {}


def _git(root: Path, *args: str) -> str | None:
    try:
        out = subprocess.run(["git", *args], cwd=root, capture_output=True, text=True,
                             encoding="utf-8", check=True)
    except (OSError, subprocess.CalledProcessError):
        return None
    return out.stdout


def _history(root: Path) -> tuple[dict[str, str] | None, str]:
    """{repo path: date of its newest commit}, or None with the reason."""
    shallow = _git(root, "rev-parse", "--is-shallow-repository")
    if shallow is None:
        return None, "not a git checkout"
    if shallow.strip() == "true":
        return None, "shallow clone (the workflow checkout needs fetch-depth: 0)"
    # mkdocs.yml too: the About page renders the maintainer's profile links
    # from it (RENDER_SOURCES); only pages that name it as a source use its date.
    log = _git(root, "log", "--format=%x00%ct", "--name-only", "--no-renames",
               "--", "docs", "data", "includes", "mkdocs.yml")
    if log is None:
        return None, "git log failed"
    dates: dict[str, str] = {}
    current = None
    for line in log.splitlines():
        if line.startswith("\x00"):
            current = datetime.fromtimestamp(int(line[1:]), timezone.utc).strftime("%Y-%m-%d")
        elif line and current and line not in dates:
            dates[line] = current
    status = _git(root, "status", "--porcelain", "--no-renames", "--untracked-files=all",
                  "--", "docs", "data", "includes", "mkdocs.yml") or ""
    today = get_build_date()
    for line in status.splitlines():
        dates[line[3:].strip('"')] = today
    return dates, ""


def on_config(config):
    root = Path(config["docs_dir"]).parent
    dates, why = _history(root)
    _state.clear()
    _state.update(root=root, dates=dates, why=why, docs=Path(config["docs_dir"]).name,
                  dated=Counter(), timely=[], undated=[])
    for paths in [*RENDER_SOURCES.values(), *GENERATED_SOURCES.values()]:
        for p in paths:
            if not (root / p).is_file():
                raise ValueError(f"page_dates: {p} (named in RENDER_SOURCES or "
                                 f"GENERATED_SOURCES) does not exist")
    return config


def _sources(page) -> list[str] | None:
    """The repository files a page's content comes from; None for a timely page."""
    f = page.file
    if f.generated_by:
        for pattern, paths in GENERATED_SOURCES.items():
            if pattern.fullmatch(f.src_uri):
                return list(paths)
        raise ValueError(f"page_dates: generated page {f.src_uri} has no entry in "
                         f"GENERATED_SOURCES, so its date cannot be derived")
    text = Path(f.abs_src_path).read_text(encoding="utf-8")
    sources = [f"{_state['docs']}/{f.src_uri}"]
    for name, args in _TIMELY.findall(text):
        if name != "minutes":
            return None
        # (the total of other pages' reading times, which changes only with them)
        sources += [f"{_state['docs']}/{p}" for p in args.split()]
    for name in _RENDER.findall(text):
        if name not in RENDER_SOURCES:
            raise ValueError(f"page_dates: docs/{f.src_uri} has a render:{name} marker "
                             f"with no entry in RENDER_SOURCES")
        sources += RENDER_SOURCES[name]
    sources += sorted({f"data/vendors/{v}.yaml" for v in _VENDOR.findall(text)})
    sources += _SNIPPET.findall(text)
    return sources


def on_page_markdown(markdown, page, config, files):
    if _state["dates"] is None:
        return markdown
    sources = _sources(page)
    if sources is None:
        _state["timely"].append(page.file.src_uri)
        return markdown
    known = [_state["dates"][s] for s in sources if s in _state["dates"]]
    if not known:
        _state["undated"].append(page.file.src_uri)
        return markdown
    page.update_date = max(known)
    _state["dated"][page.update_date[:7]] += 1
    return markdown


def on_post_build(config):
    print("page_dates: sitemap lastmod from git history")
    if _state["dates"] is None:
        print(f"  NOT DERIVED: {_state['why']}; every page keeps the build date")
        return
    dated = sum(_state["dated"].values())
    timely, undated = _state["timely"], _state["undated"]
    print(f"  dated from git        : {dated} ("
          + ", ".join(f"{m}: {n}" for m, n in sorted(_state["dated"].items())) + ")")
    print(f"  timely (build date)   : {len(timely)} {timely}")
    print(f"  no history (build date): {len(undated)}" + (f" {undated}" if undated else ""))
    print(f"  total pages           : {dated + len(timely) + len(undated)}")
