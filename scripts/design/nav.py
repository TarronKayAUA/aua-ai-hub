"""The page foot and the corner control, with and without JavaScript, and
every page reachable by keyboard (DESIGN.md sections 6.4, 6.5 and 10).

1. On sample pages, with JavaScript: the corner control is built, the
   foot's Browse disclosure is not rendered and is absent from the
   accessibility tree; More in This Section is still there.
2. The same pages without JavaScript: the Browse disclosure is visible, its
   summary is reached by Tab, and Enter opens the map.
3. Reachability at 1920px, JavaScript off and on: starting at the home
   page, follow every link a keyboard user can reach (with JavaScript on,
   also the links inside the corner control's panels). Every page in the
   sitemap must be reached.
"""
from urllib.parse import urlparse

from .common import BASE

SAMPLES = ["about/", "worked-examples/genome/", "playbooks/lecture-prep/", "prompts/flashcard-builder/",
           "tools/gemini-notebook/", "news/this-week/"]

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

STATE_JS = """() => {
  const all = document.querySelector('.secfoot__all');
  const more = document.querySelector('.secfoot__more');
  const foot = document.querySelector('nav.secfoot');
  return { built: document.body.classList.contains('has-secmap'),
           door: !!(foot && foot.classList.contains('secfoot--door')),
           footShown: foot ? foot.checkVisibility() : null,
           browse: all ? all.checkVisibility() : null,
           more: more ? more.checkVisibility() : null };
}"""


def _norm(href):
    u = urlparse(href)
    if u.netloc != "hub.test":
        return None
    p = u.path.lstrip("/")
    return p[: -len("index.html")] if p.endswith("index.html") else p


def run(env, report):
    samples = [p for p in (env.pages or SAMPLES) if (env.site / p / "index.html").exists()]
    for js in (True, False):
        ctx = env.context(1920, 1000, js=js)
        pg = ctx.new_page()
        tag = "JS on " if js else "JS off"
        for path in samples:
            pg.goto(BASE + path, wait_until="load")
            if js:
                pg.wait_for_timeout(300)
            st = pg.evaluate(STATE_JS)
            snap = pg.locator("nav.secfoot").aria_snapshot() if pg.locator("nav.secfoot").count() else ""
            in_tree = "Browse " in snap
            if js:
                report.check(st["built"] and not st["browse"] and not in_tree,
                             f"{tag} {path}: control built, foot's Browse hidden and out of the a11y tree")
            elif st["door"]:
                # A landing page's foot is written hidden (layout_nav._door_foot): the landing already
                # is its section's map, so without JavaScript its own cards are the way round and the
                # reachability sweep below proves every page is linked. Found 2026-09-27 when the check
                # was first pointed at a landing (For Students) with --page.
                report.check(not st["built"] and st["footShown"] is False,
                             f"{tag} {path}: a landing page: its foot stays hidden (the page is its section's map)")
            else:
                reached = opened = False
                pg.evaluate("document.activeElement && document.activeElement.blur()")
                for _ in range(400):
                    pg.keyboard.press("Tab")
                    if pg.evaluate("!!(document.activeElement && document.activeElement.closest('.secfoot__all > summary'))"):
                        reached = True
                        break
                if reached:
                    pg.keyboard.press("Enter")
                    opened = pg.evaluate("document.querySelector('.secfoot__all').open && "
                                         "document.querySelector('.secfoot__all [data-secmap]').checkVisibility()")
                report.check(not st["built"] and st["browse"] and in_tree and reached and opened,
                             f"{tag} {path}: Browse shown, Tab reaches it ({reached}), Enter opens the map ({opened})")
        if env.pages is None:
            want = set(env.sitemap())
            seen, queue = {""}, [""]
            while queue:
                path = queue.pop()
                pg.goto(BASE + path, wait_until="load")
                for href in pg.evaluate(LINKS_JS, js):
                    p = _norm(href)
                    if p is not None and p not in seen and (env.site / p / "index.html").exists():
                        seen.add(p)
                        queue.append(p)
            missing = sorted(want - seen)
            report.check(not missing, f"reachability, {tag}: {len(want & seen)} of {len(want)} sitemap pages"
                         + (f"; missing: {', '.join(missing)}" if missing else ""))
        ctx.close()
