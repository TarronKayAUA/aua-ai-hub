"""Space round: the foot's Browse disclosure, with and without JavaScript,
and every page reachable from the home page by keyboard.

  python _round/c/nav_check.py <site dir>

1. On sample pages, with JavaScript: the corner control is built, the
   foot's Browse disclosure is not rendered (checkVisibility false) and is
   absent from the accessibility tree (the foot's ARIA snapshot does not
   contain it); More in This Section is still there.
2. The same pages without JavaScript: the Browse disclosure is visible, its
   summary is reached by Tab, and opening it with Enter shows the map.
3. Reachability, JavaScript off and on, at 1920px: starting at the home
   page, follow every link a keyboard user can reach (an <a href> that is
   rendered, so Tab stops on it; with JavaScript on, also the links inside
   the corner control's panels, which open from the keyboard). Every page
   in the sitemap must be reached.
"""
import mimetypes
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse

from playwright.sync_api import sync_playwright

SITE = Path(sys.argv[1])
LIVE = "https://tarronkayaua.github.io/aua-ai-hub/"
SAMPLES = ["about/", "worked-examples/genome/", "playbooks/lecture-prep/", "prompts/flashcard-builder/",
           "tools/gemini-notebook/", "news/this-week/"]


def serve(route):
    u = urlparse(route.request.url)
    if u.netloc != "hub.test":
        return route.abort()
    rel = unquote(u.path).lstrip("/")
    f = SITE / rel
    if f.is_dir() or rel == "" or rel.endswith("/"):
        f = f / "index.html"
    if not f.exists():
        return route.fulfill(status=404, body="not found")
    route.fulfill(status=200, body=f.read_bytes(),
                  headers={"content-type": mimetypes.guess_type(str(f))[0] or "application/octet-stream"})


def sitemap():
    xml = (SITE / "sitemap.xml").read_text(encoding="utf-8")
    return sorted({loc.replace(LIVE, "") for loc in re.findall(r"<loc>([^<]+)</loc>", xml)})


LINKS_JS = r"""
(js) => {
  const vis = el => el.checkVisibility({checkOpacity: true, checkVisibilityCSS: true});
  const out = new Set();
  for (const a of document.querySelectorAll('a[href]')) {
    if (vis(a) || (js && a.closest('.secnav__panel'))) out.add(a.href);
  }
  return [...out];
}
"""


def norm(href):
    u = urlparse(href)
    if u.netloc != "hub.test":
        return None
    p = u.path.lstrip("/")
    if p.endswith("index.html"):
        p = p[: -len("index.html")]
    return p


def main():
    fails = []
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        for js in (True, False):
            ctx = b.new_context(viewport={"width": 1920, "height": 1000}, java_script_enabled=js)
            ctx.route("**/*", serve)
            pg = ctx.new_page()
            for path in SAMPLES:
                pg.goto("http://hub.test/" + path, wait_until="load")
                if js:
                    pg.wait_for_timeout(300)
                st = pg.evaluate("""() => {
                  const all = document.querySelector('.secfoot__all');
                  const more = document.querySelector('.secfoot__more');
                  return { built: document.body.classList.contains('has-secmap'),
                           corner: !!document.querySelector('.secnav__btn--map'),
                           browse: all ? all.checkVisibility() : null,
                           more: more ? more.checkVisibility() : null };
                }""")
                snap = pg.locator("nav.secfoot").aria_snapshot() if pg.locator("nav.secfoot").count() else ""
                in_tree = "Browse " in snap
                line = f"  JS {'on ' if js else 'off'} {path:28s} control built {st['built']!s:5s} " \
                       f"Browse shown {st['browse']!s:5s} in a11y tree {in_tree!s:5s} More shown {st['more']}"
                print(line)
                if js and (not st["built"] or st["browse"] or in_tree):
                    fails.append(line)
                if not js:
                    if st["built"] or not st["browse"] or not in_tree:
                        fails.append(line)
                    # Tab until the Browse summary has focus (at most 400 stops).
                    reached = False
                    pg.evaluate("document.activeElement && document.activeElement.blur()")
                    for _ in range(400):
                        pg.keyboard.press("Tab")
                        if pg.evaluate("!!(document.activeElement && document.activeElement.closest('.secfoot__all > summary'))"):
                            reached = True
                            break
                    opened = False
                    if reached:
                        pg.keyboard.press("Enter")
                        opened = pg.evaluate("document.querySelector('.secfoot__all').open && "
                                             "document.querySelector('.secfoot__all [data-secmap]').checkVisibility()")
                    print(f"      Tab reaches Browse: {reached}; Enter opens the map: {opened}")
                    if not (reached and opened):
                        fails.append(f"  {path}: Browse not reachable/openable by keyboard without JS")
            # Reachability from the home page.
            want = set(sitemap())
            seen, queue = {""}, [""]
            while queue:
                path = queue.pop()
                pg.goto("http://hub.test/" + path, wait_until="load")
                for href in pg.evaluate(LINKS_JS, js):
                    p = norm(href)
                    if p is not None and p not in seen and (SITE / p / "index.html").exists():
                        seen.add(p)
                        queue.append(p)
            missing = sorted(want - seen)
            print(f"  reachability, JS {'on' if js else 'off'}: {len(want & seen)} of {len(want)} sitemap pages reached"
                  + (f"; missing: {', '.join(missing)}" if missing else ""))
            if missing:
                fails.append(f"  JS {'on' if js else 'off'}: unreachable {missing}")
            ctx.close()
        b.close()
    print("nav_check: " + ("ok" if not fails else "FAILED\n" + "\n".join(fails)))
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
