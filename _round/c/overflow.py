"""News round: no sideways scroll. Loads every built page at each width
and reports any page whose document is wider than the viewport.

Usage: python _round/c/overflow.py <site> [width ...]
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(Path(__file__).parent))
from sitebrowser import route

site = Path(sys.argv[1])
widths = [int(w) for w in sys.argv[2:]] or [360, 390, 768, 1024, 1280, 1440, 1920]
pages = sorted(p.relative_to(site).as_posix() for p in site.rglob("index.html"))
bad, checks = [], 0
with sync_playwright() as pw:
    b = pw.chromium.launch()
    for w in widths:
        ctx = b.new_context(viewport={"width": w, "height": 900})
        ctx.route("**/*", route(site))
        pg = ctx.new_page()
        for rel in pages:
            pg.goto("http://hub.test/" + rel[: -len("index.html")], wait_until="load")
            sw, cw = pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]")
            checks += 1
            if sw > cw:
                bad.append(f"{w}px {rel}: scrollWidth {sw} > {cw}")
        ctx.close()
    b.close()
print(f"overflow: {len(pages)} pages x {len(widths)} widths = {checks} loads, {len(bad)} with sideways scroll")
for line in bad:
    print("  " + line)
sys.exit(1 if bad else 0)
