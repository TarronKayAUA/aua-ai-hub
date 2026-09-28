"""Every internal href and src in the built site resolves to a built file,
and every #fragment to an id on its target page. No browser needed."""
import html
import re
from urllib.parse import unquote, urlsplit


def run(env, report):
    site = env.site
    ids = {}

    def page_ids(p):
        if p not in ids:
            ids[p] = (set(re.findall(r'\bid="([^"]+)"', p.read_text(encoding="utf-8")))
                      if p.suffix == ".html" else set())
        return ids[p]

    links = 0
    pages = sorted(site.rglob("*.html"))
    for page in pages:
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
            rel = page.relative_to(site).as_posix()
            if not target.exists():
                report.check(False, f"{rel}: {url} (no file)")
            elif parts.fragment and target.suffix == ".html" and unquote(parts.fragment) not in page_ids(target):
                report.check(False, f"{rel}: {url} (no id)")
    report.note(f"{links} internal links in {len(pages)} pages, {len(report.failures)} unresolved")
