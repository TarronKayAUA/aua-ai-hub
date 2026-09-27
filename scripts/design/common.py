"""Shared by the design checks: the built site served to Playwright at
http://hub.test/ straight from disk (no server, no port), and the report
every check writes to.

Google Fonts are fetched when the network allows, so Inter renders as on
the live site (measurements depend on it); with `offline=True` they are
blocked and the fallback font is used. Nothing else leaves the machine.
"""
from __future__ import annotations

import mimetypes
import re
from pathlib import Path
from urllib.parse import unquote, urlparse

BASE = "http://hub.test/"
LIVE = "https://tarronkayaua.github.io/aua-ai-hub/"
FONT_HOSTS = {"fonts.googleapis.com", "fonts.gstatic.com"}


class Env:
    """The site under test and the browser the checks share."""

    def __init__(self, site: Path, browser, pages: list[str] | None = None, offline: bool = False):
        self.site = Path(site)
        self.browser = browser
        self.pages = pages          # addresses chosen with --page, or None for the check's own set
        self.offline = offline

    def route(self, r):
        u = urlparse(r.request.url)
        if u.netloc in FONT_HOSTS and not self.offline:
            return r.continue_()
        if u.netloc != "hub.test":
            return r.abort()
        rel = unquote(u.path).lstrip("/")
        f = self.site / rel
        if f.is_dir() or rel == "" or rel.endswith("/"):
            f = f / "index.html"
        if not f.exists():
            return r.fulfill(status=404, body="not found")
        r.fulfill(status=200, body=f.read_bytes(),
                  headers={"content-type": mimetypes.guess_type(str(f))[0] or "application/octet-stream"})

    def context(self, width: int, height: int = 900, js: bool = True, **kw):
        ctx = self.browser.new_context(viewport={"width": width, "height": height},
                                       java_script_enabled=js, **kw)
        ctx.route("**/*", self.route)
        return ctx

    def sitemap(self) -> list[str]:
        xml = (self.site / "sitemap.xml").read_text(encoding="utf-8")
        return sorted({loc.replace(LIVE, "") for loc in re.findall(r"<loc>([^<]+)</loc>", xml)})

    def built_pages(self) -> list[str]:
        """Every built page's address ("" for the home page)."""
        return sorted(p.relative_to(self.site).as_posix()[: -len("index.html")]
                      for p in self.site.rglob("index.html"))

    def page_type(self, path: str) -> str | None:
        f = self.site / path / "index.html"
        if not f.exists():
            return None
        m = re.search(r'<body[^>]*data-page-type="([a-z]+)"', f.read_text(encoding="utf-8", errors="replace"))
        return m.group(1) if m else None


class Report:
    """Pass/fail lines for one check. `check()` prints as it goes."""

    def __init__(self, name: str, verbose: bool = True):
        self.name = name
        self.verbose = verbose
        self.failures: list[str] = []
        self.passes = 0
        self.notes: list[str] = []

    def check(self, ok: bool, msg: str):
        if ok:
            self.passes += 1
            if self.verbose:
                print("  ok   " + msg)
        else:
            self.failures.append(msg)
            print("  FAIL " + msg)

    def note(self, msg: str):
        self.notes.append(msg)
        print("  " + msg)

    @property
    def ok(self) -> bool:
        return not self.failures
