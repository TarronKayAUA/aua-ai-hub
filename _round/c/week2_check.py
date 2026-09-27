"""Week round, part 2: the five fixes from the owner's review, checked in a browser.

  python _round/c/week2_check.py <site dir>

1. Topic filter (This Week and the three feed pages, 1920 and 390, by
   keyboard): every chip in every panel shows exactly its count, all of
   them visible, as ONE list (no "Show the other N" header visible, no
   leading rule), with "Showing X of Y"; All then restores the first tier
   and a closed "Show the other N items" with its header, as on load.
2. The brief's fold (This Week and the feed pages): Enter opens it, the
   "Hide the rest of this week's brief" button is the last thing in it,
   Enter on it closes the fold, the "Read the rest" label shows again and
   has focus. Without JavaScript the button stays hidden and the opened
   fold keeps its label (which closes it).
3. Jump chips (This Week, 1920, 1440 and 390): each feed chip, by Enter,
   brings its panel into view, focuses that panel's heading and outlines
   that panel; where the panels share a row the chip used is the one
   marked current, and a small scroll does not move the mark to another
   feed chip.
4. and 5. Lists in more than one column (the feed pages, the digests' wide
   feeds, w24 to w39) at 1920 and 1440: items in the same row have tops
   within 1px and bottoms (their rules) within 1px, read left to right
   then down, and no item carries a top rule; the list clips its last row's
   rule.
"""
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from sitebrowser import route  # noqa: E402

SITE = sys.argv[1]
BASE = "http://hub.test/"
FEEDS = ["news/medical-education/", "news/clinical-practice/", "news/general-ai/"]
HIDE = "Hide the rest of this week's brief"
READ = "Read the rest of this week's brief"
fails = []


def check(ok, msg):
    print(("  ok   " if ok else "  FAIL ") + msg)
    if not ok:
        fails.append(msg)


PANEL_STATE = """p => {
  const cards = [...p.querySelectorAll('.news-card')];
  const vis = cards.filter(c => c.style.display !== 'none' && c.offsetParent !== null
                                && c.getBoundingClientRect().height > 0);
  const sums = [...p.querySelectorAll('details.abstract > summary')]
                 .filter(s => s.getBoundingClientRect().height > 0).map(s => s.textContent.trim());
  const lead = vis.length ? parseFloat(getComputedStyle(vis[0]).borderTopWidth) : 0;
  const st = p.querySelector('.topic-status');
  const holders = [...p.querySelectorAll('details.abstract')].filter(d => d.querySelector('.news-list'));
  return {total: cards.length, visible: vis.length, summaries: sums, leadRule: lead,
          status: st ? st.textContent : '', holdersOpen: holders.map(d => d.open)};
}"""


def topic_filter(b):
    print("1. topic filter")
    for w, h in ((1920, 1080), (390, 844)):
        for url in ["news/this-week/"] + FEEDS:
            ctx = b.new_context(viewport={"width": w, "height": h})
            ctx.route("**/*", route(SITE))
            pg = ctx.new_page()
            pg.goto(BASE + url, wait_until="load")
            pg.wait_for_timeout(300)
            panels = pg.locator("section.wk-feed")
            for i in range(panels.count()):
                p = panels.nth(i)
                load = p.evaluate(PANEL_STATE)
                chips = p.locator(".topic-chip")
                bad = []
                for j in range(chips.count()):
                    c = chips.nth(j)
                    topic = c.get_attribute("data-topic")
                    n = int(c.locator(".topic-chip__n").inner_text())
                    c.focus()
                    pg.keyboard.press("Enter")
                    pg.wait_for_timeout(60)
                    s = p.evaluate(PANEL_STATE)
                    if topic:
                        if not (s["visible"] == n and not s["summaries"] and s["leadRule"] == 0
                                and s["status"] == f"Showing {n} of {s['total']}"):
                            bad.append((topic, n, s))
                    else:
                        if not (s["visible"] == load["visible"] and s["summaries"] == load["summaries"]
                                and s["holdersOpen"] == load["holdersOpen"] and not any(s["holdersOpen"])
                                and s["status"] == f"Showing all {s['total']}"):
                            bad.append(("All", n, s))
                # back to All at the end
                p.locator('.topic-chip[data-topic=""]').focus()
                pg.keyboard.press("Enter")
                pg.wait_for_timeout(60)
                end = p.evaluate(PANEL_STATE)
                restored = (end["visible"] == load["visible"] and end["summaries"] == load["summaries"]
                            and end["holdersOpen"] == load["holdersOpen"])
                name = p.evaluate("p => (p.querySelector('h2') || document.querySelector('h1')).textContent.replace('¶','').trim()")
                check(not bad and restored,
                      f"{w} {url} {name}: {chips.count()} chips, each one list of its count; All restores "
                      f"{end['visible']} shown + {end['summaries'] or 'no fold'} closed" + (f"  BAD {bad[:2]}" if bad else ""))
            ctx.close()


def brief_fold(b):
    print("2. the brief's fold")
    for url in ["news/this-week/"] + FEEDS:
        ctx = b.new_context(viewport={"width": 1440, "height": 900})
        ctx.route("**/*", route(SITE))
        pg = ctx.new_page()
        pg.goto(BASE + url, wait_until="load")
        pg.wait_for_timeout(300)
        folds = pg.locator(".section-brief > details.section-brief-more")
        for i in range(folds.count()):
            f = folds.nth(i)
            s = f.locator("summary")
            s.focus()
            pg.keyboard.press("Enter")
            pg.wait_for_timeout(80)
            last = f.evaluate("d => { const k = [...d.children]; const b = k[k.length - 1];"
                              " return b.tagName + '|' + b.textContent.trim() + '|' + (b.getBoundingClientRect().height > 0); }")
            label_hidden = s.evaluate("s => s.getBoundingClientRect().height === 0")
            opened = f.evaluate("d => d.open")
            start = f.evaluate("d => document.activeElement === d.querySelector('summary + p')")
            on_hide, tabs = False, 0
            while tabs < 40 and not on_hide:
                pg.keyboard.press("Tab")
                tabs += 1
                inside = f.evaluate("d => d.contains(document.activeElement)")
                on_hide = pg.evaluate("document.activeElement.classList.contains('section-brief-hide')")
                if not inside:
                    break
            pg.keyboard.press("Enter")
            pg.wait_for_timeout(80)
            closed = not f.evaluate("d => d.open")
            back = pg.evaluate("document.activeElement.tagName === 'SUMMARY' && document.activeElement.textContent.trim()")
            check(opened and label_hidden and start and last == f"BUTTON|{HIDE}|true" and on_hide and closed and back == READ,
                  f"{url} fold {i + 1}: opens by Enter (label gives way, focus to the continuation {start}), "
                  f"ends in {last!r}, label hidden {label_hidden}, closed {closed}, Tab reaches it in {tabs} steps inside the fold, "
                  f"Enter closes, focus back on '{back}'")
        ctx.close()
    ctx = b.new_context(viewport={"width": 1440, "height": 900}, java_script_enabled=False)
    ctx.route("**/*", route(SITE))
    pg = ctx.new_page()
    for url in ["news/this-week/"] + FEEDS:
        pg.goto(BASE + url, wait_until="load")
        f = pg.locator(".section-brief > details.section-brief-more").first
        f.locator("summary").click()
        vis = f.evaluate("d => ({open: d.open, label: d.querySelector('summary').getBoundingClientRect().height > 0,"
                         " hide: d.querySelector('.section-brief-hide').getBoundingClientRect().height > 0})")
        f.locator("summary").click()
        check(vis == {"open": True, "label": True, "hide": False} and not f.evaluate("d => d.open"),
              f"no JS {url}: opened fold keeps its label, no dead button, the label closes it")
    ctx.close()


def jump_chips(b):
    print("3. jump chips")
    for w, h in ((1920, 1080), (1440, 900), (390, 844)):
        ctx = b.new_context(viewport={"width": w, "height": h})
        ctx.route("**/*", route(SITE))
        pg = ctx.new_page()
        pg.goto(BASE + "news/this-week/", wait_until="load")
        pg.wait_for_timeout(300)
        share = pg.evaluate("""() => { const t = [...document.querySelectorAll('section.wk-feed > h2')]
            .map(h => Math.round(h.getBoundingClientRect().top)); return Math.max(...t) - Math.min(...t) < 2; }""")
        for fid in ("medical-education", "clinical-practice", "general-ai"):
            chip = pg.locator(f'.section-chip[href="#{fid}"]')
            chip.focus()
            pg.keyboard.press("Enter")
            pg.wait_for_timeout(250)
            st = pg.evaluate(f"""() => {{
              const h = document.getElementById('{fid}'); const p = h.closest('.wk-feed');
              const r = h.getBoundingClientRect();
              const cur = [...document.querySelectorAll('.section-chip[aria-current]')].map(a => a.getAttribute('href'));
              const picked = [...document.querySelectorAll('.wk-feed.is-picked')].map(x => x.getAttribute('aria-labelledby'));
              const row = document.querySelector('.section-chips').getBoundingClientRect().bottom;
              const clear = p.getBoundingClientRect().top - row;
              return {{focus: document.activeElement === h, top: r.top, picked, cur, clear}};
            }}""")
            in_view = 0 <= st["top"] < h * 0.6
            sticky = w >= 960
            want_cur = [f"#{fid}"] if sticky else []
            ok = st["focus"] and in_view and st["picked"] == [fid] and st["cur"] == want_cur
            if sticky:
                ok = ok and st["clear"] >= 6  # the panel and its outline clear the sticky row
            # a small scroll keeps the reader's pick while the panels share a row
            pg.mouse.wheel(0, 120)
            pg.wait_for_timeout(250)
            after = pg.evaluate("[...document.querySelectorAll('.section-chip[aria-current]')].map(a => a.getAttribute('href'))")
            if sticky and share:
                ok = ok and after == [f"#{fid}"]
            check(ok, f"{w} chip #{fid}: heading focused {st['focus']}, top {st['top']:.0f}, panel {st['clear']:.0f}px below the chips row, outlined {st['picked']}, "
                      f"current {st['cur']}, after a small scroll {after}" + (" (panels share a row)" if share else " (panels stack)"))
        ctx.close()


ROWS = """l => {
  const cs = getComputedStyle(l);
  const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length;
  const cards = [...l.children].filter(c => c.classList.contains('news-card'));
  const boxes = cards.map(c => c.getBoundingClientRect());
  const rows = [];
  boxes.forEach((b, i) => { const r = Math.floor(i / cols); (rows[r] = rows[r] || []).push(b); });
  let worstTop = 0, worstBottom = 0, order = true;
  rows.forEach(r => {
    const t = r.map(b => b.top), bt = r.map(b => b.bottom);
    worstTop = Math.max(worstTop, Math.max(...t) - Math.min(...t));
    worstBottom = Math.max(worstBottom, Math.max(...bt) - Math.min(...bt));
    for (let k = 1; k < r.length; k++) if (r[k].left <= r[k - 1].left) order = false;
  });
  for (let r = 1; r < rows.length; r++) if (rows[r][0].top < rows[r - 1][0].bottom - 1) order = false;
  const topRules = cards.filter(c => parseFloat(getComputedStyle(c).borderTopWidth) > 0).length;
  const clip = cs.clipPath;
  return {cols, n: cards.length, rows: rows.length, worstTop, worstBottom, order, topRules, clip};
}"""


def rows_check(b):
    print("4/5. lists in more than one column")
    pages = FEEDS + [f"news/archive/2026-w{n}/" for n in range(24, 40)]
    for w in (1920, 1440):
        ctx = b.new_context(viewport={"width": w, "height": 1000})
        ctx.route("**/*", route(SITE))
        pg = ctx.new_page()
        seen = 0
        for url in pages:
            pg.goto(BASE + url, wait_until="load")
            pg.wait_for_timeout(150)
            lists = pg.locator(".wk-feed--wide .news-list, .wk-feed--page .news-list")
            for i in range(lists.count()):
                r = lists.nth(i).evaluate(ROWS)
                seen += 1
                ok = (r["cols"] >= 2 and r["worstTop"] <= 1 and r["worstBottom"] <= 1 and r["order"]
                      and r["topRules"] == 0 and "inset" in r["clip"])
                check(ok, f"{w} {url}: {r['n']} items in {r['cols']} columns x {r['rows']} rows, "
                          f"row tops within {r['worstTop']:.2f}px, rules within {r['worstBottom']:.2f}px, "
                          f"left-to-right {r['order']}, top rules {r['topRules']}")
        check(seen >= 3 + 13, f"{w}: {seen} multi-column lists checked (3 feed pages + 13 wide digest feeds)")
        ctx.close()


with sync_playwright() as pw:
    browser = pw.chromium.launch()
    topic_filter(browser)
    brief_fold(browser)
    jump_chips(browser)
    rows_check(browser)
    browser.close()

print("week2_check: " + ("ok" if not fails else f"{len(fails)} FAILED"))
sys.exit(1 if fails else 0)
