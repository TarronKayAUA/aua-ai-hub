"""No page scrolls sideways: every built page (or the pages chosen) at
360, 390, 768, 1024, 1280, 1440 and 1920px."""
from .common import BASE

WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920]


def run(env, report):
    pages = env.pages if env.pages is not None else env.built_pages()
    loads = 0
    for w in WIDTHS:
        ctx = env.context(w, 900)
        pg = ctx.new_page()
        for path in pages:
            pg.goto(BASE + path, wait_until="load")
            sw, cw = pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
            loads += 1
            if sw > cw:
                report.check(False, f"{w}px {path or '(home)'}: scrollWidth {sw} > {cw}")
        ctx.close()
    report.note(f"{len(pages)} pages x {len(WIDTHS)} widths = {loads} loads, "
                f"{len(report.failures)} with sideways scroll")
