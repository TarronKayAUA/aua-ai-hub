"""Figure sheet: render every figure on the site in four conditions and flag
text too small to read (authoring tool, added 2026-09-23).

Why: a figure drawn as one SVG scales its whole canvas, text included, to
the column. On a 390px phone that put figure labels at 4 to 6px against
16px body text, and in the dark scheme the brand-blue lines fell below
3:1. Neither shows up on the desktop screen a figure is usually drawn on,
so this tool looks at every figure in the conditions readers actually use
(desktop and phone, light and dark) and measures the smallest text in each.

What it does:
  1. builds the site into a temporary folder (or uses --site DIR);
  2. finds every page with a <figure class="figure ...">;
  3. renders each figure at 1440px and 390px in both color schemes;
  4. measures the smallest rendered text: an HTML element's computed font
     size, or an SVG <text>'s font size times the SVG's on-screen scale;
  5. writes one contact sheet per condition and a report to --out
     (default: figure-sheet/ in the system temp folder), and exits 1 if any
     figure's smallest text is under --min-px (default 11).

Figures rebuilt with words in HTML (class "figure--html") pass at every
width. Single-SVG figures keep a 600px minimum width on phones and scroll
sideways (see extra.css), which lifts their text to about 9 to 10px: better
than 4 to 6, still under the bar, so they are listed as the ones to rebuild
next. A failing exit here is a to-do list, not a broken build; nothing in
CI runs this.

Requirements (authoring only, deliberately not in requirements.txt, like
Pillow for build_brand_assets.py): the playwright and Pillow packages, and
Chromium (`python -m playwright install chromium`). On the maintainer's
machine the system Python has both:

    python scripts/figure_sheet.py
    python scripts/figure_sheet.py --only pathway/ --min-px 12

The site build itself uses the project venv's MkDocs when it exists.
"""
import argparse
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
CONDITIONS = [("desktop", 1440, "light"), ("desktop", 1440, "dark"),
              ("phone", 390, "light"), ("phone", 390, "dark")]

# Smallest rendered text inside one figure, in CSS pixels. HTML text uses
# its computed size; SVG text scales with the drawing, so its computed size
# (in user units) is multiplied by the SVG's rendered width over its viewBox
# width. Hidden elements and empty text are skipped.
MEASURE_JS = """(fig) => {
  const sizes = [];
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
  };
  for (const t of fig.querySelectorAll('svg text')) {
    if (!t.textContent.trim() || !visible(t)) continue;
    const svg = t.ownerSVGElement;
    const vb = svg.viewBox && svg.viewBox.baseVal;
    const scale = vb && vb.width ? svg.getBoundingClientRect().width / vb.width : 1;
    sizes.push(parseFloat(getComputedStyle(t).fontSize) * scale);
  }
  const walker = document.createTreeWalker(fig, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const el = node.parentElement;
    if (!node.textContent.trim() || !el || el.closest('svg') || !visible(el)) continue;
    sizes.push(parseFloat(getComputedStyle(el).fontSize));
  }
  return sizes.length ? Math.min(...sizes) : null;
}"""


def venv_python() -> str:
    for rel in (".venv/Scripts/python.exe", ".venv/bin/python"):
        candidate = REPO / rel
        if candidate.exists():
            return str(candidate)
    return sys.executable


def build_site(dest: Path) -> None:
    print(f"building the site into {dest} ...")
    subprocess.run([venv_python(), "-m", "mkdocs", "build", "--strict", "-d", str(dest)],
                   cwd=REPO, check=True, capture_output=True)


def figure_pages(site: Path, only: str | None) -> list[Path]:
    pages = []
    for html in sorted(site.rglob("index.html")):
        rel = html.relative_to(site).as_posix()
        if only and not rel.startswith(only):
            continue
        if re.search(r'<figure class="figure', html.read_text(encoding="utf-8")):
            pages.append(html)
    return pages


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--site", type=Path, help="an existing build to use instead of building")
    parser.add_argument("--out", type=Path,
                        default=Path(tempfile.gettempdir()) / "figure-sheet")
    parser.add_argument("--min-px", type=float, default=11.0)
    parser.add_argument("--only", help="limit to pages whose path starts with this, e.g. pathway/")
    args = parser.parse_args()

    try:
        from PIL import Image
        from playwright.sync_api import sync_playwright
    except ImportError as exc:
        print(f"figure_sheet needs playwright and Pillow ({exc}); see the docstring.")
        return 2

    tmp = None
    site = args.site
    if site is None:
        tmp = Path(tempfile.mkdtemp(prefix="figure-sheet-site-"))
        build_site(tmp)
        site = tmp
    args.out.mkdir(parents=True, exist_ok=True)
    pages = figure_pages(site, args.only)

    results = []  # (page, index, condition, min_px)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for width_name, width, scheme in CONDITIONS:
            ctx = browser.new_context(viewport={"width": width, "height": 900},
                                      color_scheme=scheme)
            page = ctx.new_page()
            shots = []
            for html in pages:
                rel = html.parent.relative_to(site).as_posix() + "/"
                page.goto(html.as_uri(), wait_until="load")
                page.wait_for_timeout(150)
                figs = page.locator("figure.figure")
                for i in range(figs.count()):
                    fig = figs.nth(i)
                    fig.scroll_into_view_if_needed()
                    min_px = fig.evaluate(MEASURE_JS)
                    results.append((rel, i + 1, f"{width_name}-{scheme}", min_px))
                    shot = args.out / f"_{len(shots):03d}.png"
                    fig.screenshot(path=str(shot))
                    shots.append((rel, i + 1, min_px, shot))
            ctx.close()
            sheet_path = args.out / f"sheet-{width_name}-{scheme}.png"
            images = [Image.open(s[3]) for s in shots]
            if images:
                gap = 24
                sheet = Image.new("RGB", (max(im.width for im in images),
                                          sum(im.height + gap for im in images)),
                                  "white" if scheme == "light" else (30, 33, 41))
                y = 0
                for im in images:
                    sheet.paste(im, (0, y))
                    y += im.height + gap
                sheet.save(sheet_path)
                for im in images:
                    im.close()
            for s in shots:
                s[3].unlink()
            print(f"  {width_name} {scheme}: {len(shots)} figures -> {sheet_path.name}")
        browser.close()

    failing = sorted({(r[0], r[1]) for r in results
                      if r[3] is not None and r[3] < args.min_px})
    n_figs = len({(r[0], r[1]) for r in results})
    lines = [f"figure sheet: {len(pages)} pages, {n_figs} figures, "
             f"4 conditions, threshold {args.min_px:g}px", ""]
    for rel, idx in sorted({(r[0], r[1]) for r in results}):
        row = {r[2]: r[3] for r in results if (r[0], r[1]) == (rel, idx)}
        worst = min(v for v in row.values() if v is not None) if any(
            v is not None for v in row.values()) else None
        flag = "BELOW" if worst is not None and worst < args.min_px else "ok   "
        detail = "  ".join(f"{k} {v:.1f}" for k, v in row.items() if v is not None)
        lines.append(f"{flag} {rel} figure {idx}: {detail}")
    lines += ["", f"figures below {args.min_px:g}px in some condition: {len(failing)}"]
    report = "\n".join(lines)
    (args.out / "report.txt").write_text(report + "\n", encoding="utf-8")
    print(report)
    print(f"\ncontact sheets and report: {args.out}")
    if tmp:
        shutil.rmtree(tmp, ignore_errors=True)
    return 1 if failing else 0


if __name__ == "__main__":
    sys.exit(main())
