"""Serve a built site to Playwright at http://hub.test/ (no network): shared
by this round's browser checks. `route(site)` returns a context route
handler for that site directory."""
import mimetypes
from pathlib import Path
from urllib.parse import urlparse, unquote


def route(site):
    site = Path(site)

    def serve(r, request=None):
        u = urlparse(r.request.url)
        if u.netloc != "hub.test":
            return r.abort()
        rel = unquote(u.path).lstrip("/")
        f = site / rel
        if f.is_dir() or rel == "" or rel.endswith("/"):
            f = f / "index.html"
        if not f.exists():
            return r.fulfill(status=404, body="nf")
        r.fulfill(status=200, body=f.read_bytes(),
                  headers={"content-type": mimetypes.guess_type(str(f))[0] or "application/octet-stream"})
    return serve
