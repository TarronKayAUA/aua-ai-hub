"""Design check: build the site and check it against the design language
(authoring tool, added 2026-09-27; DESIGN.md section 16).

Why: the site's layout is written at render time by hooks and styled by
one stylesheet per package, so a change in one place can open a blank
area, run a line too long or break a control somewhere else. The build
itself proves the HTML is whole (layout_width's blocks read = written,
layout_week's text checks, title_case); this proves the pages still look
and behave as DESIGN.md says, in a real browser, and compares the space
each page uses with a recorded baseline.

What it does:
  1. builds the site with `mkdocs build --strict` into a temporary folder
     (or uses --site DIR), and reads the build's own integrity lines;
  2. serves the build to headless Chromium from disk (no server, no port;
     Google Fonts load from the network so text sets in Inter);
  3. runs the checks in scripts/design/, one module each:
       overflow  no page scrolls sideways, 360 to 1920px
       links     every internal link and #fragment resolves
       nav       the page foot and corner control, with and without
                 JavaScript; every page reachable by keyboard
       news      This Week, the digests and the feed pages: chips, folds,
                 the brief, jump chips, lists in rows, no-JavaScript
       measure   blank share and line length per page at 1920 and 1440,
                 against scripts/design/baselines.json
       gaps      (report only, run with --only gaps) every blank region,
                 largest first
  4. prints one summary and exits 1 if any check failed (2 if the build
     failed or a requirement is missing).

Requirements (authoring only, deliberately not in requirements.txt, like
scripts/figure_sheet.py): Python 3.11+, the playwright package and its
Chromium (`python -m playwright install chromium`, once). On the
maintainer's Windows laptop the system Python 3.13 has them:

    python scripts/design_check.py                     everything (about 20 to 30 minutes)
    python scripts/design_check.py --only news         one check (repeatable)
    python scripts/design_check.py --page tools/agents/ --page about/
                                                       overflow, links, nav and
                                                       measure for those pages
    python scripts/design_check.py --site site/        use an existing build
    python scripts/design_check.py --only measure --update-baselines
                                                       record the current
                                                       measures as the baseline
                                                       after an approved change
    python scripts/design_check.py --only gaps --page students/
                                                       where the blank space is

The site build uses the project venv's MkDocs when it exists (.venv), and
the current interpreter otherwise. Nothing here runs in CI.
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "scripts"))

ALL = ["overflow", "links", "nav", "news", "measure", "gaps"]
DEFAULT = ["overflow", "links", "nav", "news", "measure"]
PAGE_DEFAULT = ["overflow", "links", "nav", "measure"]


def venv_python() -> str:
    for rel in (".venv/Scripts/python.exe", ".venv/bin/python"):
        candidate = REPO / rel
        if candidate.exists():
            return str(candidate)
    return sys.executable


def build_site(dest: Path) -> tuple[bool, list[str]]:
    """Build strictly and read the hooks' own integrity lines."""
    print(f"building the site into {dest} ...", flush=True)
    proc = subprocess.run([venv_python(), "-m", "mkdocs", "build", "--strict", "-d", str(dest)],
                          cwd=REPO, capture_output=True, text=True, encoding="utf-8", errors="replace")
    log = proc.stdout + proc.stderr
    problems = []
    if proc.returncode != 0:
        tail = "\n".join(log.strip().splitlines()[-25:])
        problems.append(f"mkdocs build --strict failed (exit {proc.returncode}):\n{tail}")
        return False, problems
    rw = re.search(r"blocks read/written: (\d+) / (\d+)", log)
    left = re.search(r"left as they were\s*:\s*(\d+)", log)
    tc = re.search(r"total\s*:\s*(\d+) checked, \d+ pass, \d+ exempt, (\d+) violations", log)
    lines = []
    if rw:
        lines.append(f"layout_width blocks read/written {rw.group(1)} / {rw.group(2)}")
        if rw.group(1) != rw.group(2):
            problems.append("layout_width: blocks read differ from blocks written")
    else:
        problems.append("layout_width: no 'blocks read/written' line in the build output")
    if left:
        lines.append(f"layout_width pages left as they were: {left.group(1)}")
        if left.group(1) != "0":
            problems.append(f"layout_width left {left.group(1)} page(s) as they were (see the build output)")
    if tc:
        lines.append(f"title_case {tc.group(1)} checked, {tc.group(2)} violations")
    for line in lines:
        print("  " + line)
    return not problems, problems


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0],
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--only", action="append", choices=ALL, metavar="CHECK",
                        help=f"run only this check (repeatable): {', '.join(ALL)}")
    parser.add_argument("--page", action="append", metavar="ADDRESS",
                        help="limit to this page, as its address ('tools/agents/', '' for home; repeatable)")
    parser.add_argument("--site", type=Path, help="an existing build to use instead of building")
    parser.add_argument("--keep", action="store_true", help="keep the temporary build and print its folder")
    parser.add_argument("--update-baselines", action="store_true",
                        help="write the measured pages into scripts/design/baselines.json")
    parser.add_argument("--focus", action="store_true",
                        help="measure: also Tab through each page and count focus stops hidden by fixed elements")
    parser.add_argument("--offline", action="store_true", help="do not fetch Google Fonts (measures will differ)")
    parser.add_argument("--quiet", action="store_true", help="print failures only, not every passing line")
    args = parser.parse_args()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        print(f"design_check needs playwright and Chromium ({exc}); see the docstring.")
        return 2
    from design import gaps, links, measure, nav, news, overflow  # noqa: E402
    from design.common import Env, Report  # noqa: E402
    modules = {"overflow": overflow, "links": links, "nav": nav, "news": news, "measure": measure, "gaps": gaps}

    pages = [p.lstrip("/") for p in args.page] if args.page else None
    if pages is not None:
        pages = [p if (p == "" or p.endswith("/")) else p + "/" for p in pages]
    checks = args.only or (PAGE_DEFAULT if pages is not None else DEFAULT)
    if args.update_baselines and "measure" not in checks:
        checks = checks + ["measure"]

    start = time.time()
    tmp = None
    summary: list[tuple[str, bool, str]] = []
    site = args.site
    if site is None:
        tmp = Path(tempfile.mkdtemp(prefix="design-check-site-"))
        ok, problems = build_site(tmp)
        summary.append(("build", ok, "; ".join(problems) if problems else "strict build clean"))
        if not ok:
            for p in problems:
                print(p)
            if tmp and not args.keep:
                shutil.rmtree(tmp, ignore_errors=True)
            return 2
        site = tmp
    site = site.resolve()
    if pages is not None:
        missing = [p for p in pages if not (site / p / "index.html").exists()]
        if missing:
            print(f"no such page in the build: {', '.join(missing)}")
            return 2

    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            env = Env(site, browser, pages=pages, offline=args.offline)
            for name in checks:
                print(f"\n== {name}", flush=True)
                report = Report(name, verbose=not args.quiet)
                t0 = time.time()
                try:
                    if name == "measure":
                        modules[name].run(env, report, update=args.update_baselines, focus=args.focus)
                    else:
                        modules[name].run(env, report)
                except Exception as exc:  # a crashed check is a failure, never a silent pass
                    report.check(False, f"the check crashed: {type(exc).__name__}: {exc}")
                took = time.time() - t0
                detail = (f"{report.passes} passed, {len(report.failures)} failed" if (report.passes or report.failures)
                          else (report.notes[0] if report.notes else "nothing to check"))
                summary.append((name, report.ok, f"{detail} ({took:.0f}s)"))
            browser.close()
    finally:
        if tmp and not args.keep:
            shutil.rmtree(tmp, ignore_errors=True)
        elif tmp:
            print(f"\nbuild kept in {tmp}")

    print("\n== design check summary")
    for name, ok, detail in summary:
        print(f"  {'ok  ' if ok else 'FAIL'}  {name:9s} {detail}")
    failed = [n for n, ok, _ in summary if not ok]
    print(f"design_check: {'ok' if not failed else 'FAILED: ' + ', '.join(failed)} "
          f"in {(time.time() - start) / 60:.1f} minutes")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
