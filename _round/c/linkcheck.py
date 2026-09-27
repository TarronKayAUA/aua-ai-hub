"""News round: every internal href and src in the built site resolves to a
built file, and every #fragment to an id on its target page.

Usage: python _round/c/linkcheck.py <site>
"""
import html, re, sys
from pathlib import Path
from urllib.parse import urlsplit, unquote

site = Path(sys.argv[1])
ids = {}
def page_ids(p):
    if p not in ids:
        ids[p] = set(re.findall(r'\bid="([^"]+)"', p.read_text(encoding="utf-8"))) if p.suffix == ".html" else set()
    return ids[p]
links = bad = 0
problems = []
for page in sorted(site.rglob("*.html")):
    text = page.read_text(encoding="utf-8")
    for url in re.findall(r'\b(?:href|src)="([^"]+)"', text):
        url = html.unescape(url)
        parts = urlsplit(url)
        if parts.scheme or url.startswith(("//", "mailto:", "tel:", "javascript:", "data:")):
            continue
        links += 1
        if parts.path.startswith("/"):
            # Root-relative (the 404 page): the site is served under /aua-ai-hub/.
            target = (site / unquote(parts.path).removeprefix("/aua-ai-hub/")).resolve()
        else:
            target = page if not parts.path else (page.parent / unquote(parts.path)).resolve()
        if target.is_dir():
            target = target / "index.html"
        if not target.exists():
            bad += 1; problems.append(f"{page.relative_to(site)}: {url} (no file)")
        elif parts.fragment and target.suffix == ".html" and unquote(parts.fragment) not in page_ids(target):
            bad += 1; problems.append(f"{page.relative_to(site)}: {url} (no id)")
print(f"linkcheck: {links} internal links in {len(list(site.rglob('*.html')))} pages, {bad} unresolved")
for p in problems[:60]:
    print("  " + p)
sys.exit(1 if bad else 0)
