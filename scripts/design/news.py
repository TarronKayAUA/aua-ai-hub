"""The news pages (DESIGN.md sections 4.2 and 6.6): This Week, the weekly
digests and the three feed pages, in a browser.

1. This Week basics, at 1920 and 390 by keyboard: the jump chips land on
   their sections; three feed panels side by side from 1200px and stacked
   on phones; every "Show the other N" opens with Enter; each brief's fold
   holds only paragraphs and its Hide button, with the player and date line
   outside it; no audio is fetched before Listen and Listen fetches it
   (only when the build has the news audio, which CI makes; a local build
   usually has none). Without JavaScript every card is in the page, the
   chip rows stay hidden, and every player is preload="none".
2. Topic filter: every chip in every panel (This Week and the feed pages,
   1920 and 390) shows exactly its count as ONE list (no "Show the other N"
   header, no leading rule) with "Showing X of Y"; All restores the load
   state.
3. The brief's fold: Enter opens it and focus moves into the continuation;
   Tab reaches "Hide the rest of this week's brief" inside the fold; Enter
   closes it and focus returns to the label. Without JavaScript the label
   stays and closes the fold, and there is no dead button.
4. Jump chips for the feeds (1920, 1440, 390): each focuses its panel's
   heading, outlines that panel, and brings the whole panel clear of the
   sticky chip row; where the panels share a row the chip used stays
   current after a small scroll.
5. Lists in more than one column (feed pages, digests' wide feeds) at 1920
   and 1440: row tops and rules within 1px, left to right, no top rules,
   the last row's rule clipped.
"""
from .common import BASE

FEEDS = ["news/medical-education/", "news/clinical-practice/", "news/general-ai/"]
HIDE = "Hide the rest of this week's brief"
READ = "Read the rest of this week's brief"


def _digests(env):
    root = env.site / "news" / "archive"
    return sorted(f"news/archive/{p.name}/" for p in root.glob("*-w*") if (p / "index.html").exists())


def this_week_basics(env, report):
    print("1. This Week basics")
    week = env.site / "news" / "this-week" / "index.html"
    html = week.read_text(encoding="utf-8")
    for w, h in ((1920, 1080), (390, 844)):
        ctx = env.context(w, h)
        pg = ctx.new_page()
        audio = []
        pg.on("request", lambda r: audio.append(r.url) if r.url.endswith(".mp3") else None)
        pg.goto(BASE + "news/this-week/", wait_until="load")
        pg.wait_for_timeout(400)
        for chip in pg.locator(".section-chip").all():
            target = chip.get_attribute("href")
            chip.focus()
            pg.keyboard.press("Enter")
            pg.wait_for_timeout(300)
            top = pg.evaluate(f"document.querySelector('{target}').getBoundingClientRect().top")
            report.check(0 <= top < h * 0.6, f"{w} jump chip {target} brings its heading into view (top {top:.0f})")
        feeds = pg.locator("section.wk-feed")
        lefts = feeds.evaluate_all("fs => fs.map(f => Math.round(f.getBoundingClientRect().left))")
        want = len(lefts) if w >= 1200 else 1
        report.check(len(lefts) >= 1 and len(set(lefts)) == want,
                     f"{w} {len(lefts)} feed panels, {'side by side' if w >= 1200 else 'stacked'} (left edges {lefts})")
        pg.goto(BASE + "news/this-week/", wait_until="load")
        pg.wait_for_timeout(300)
        for d in pg.locator("details.abstract").all():
            s = d.locator("summary")
            label = s.inner_text()
            s.focus()
            pg.keyboard.press("Enter")
            pg.wait_for_timeout(100)
            report.check(d.evaluate("d => d.open"), f"{w} '{label}' opens with Enter")
        for i in range(feeds.count()):
            f = feeds.nth(i)
            kinds = f.evaluate("f => { const d = f.querySelector('.section-brief > details.section-brief-more');"
                               " return d ? [...d.children].filter(c => c.tagName !== 'SUMMARY').map(c => c.tagName) : []; }")
            outside = f.evaluate("f => !f.querySelector('.section-brief details .listen, .section-brief details .section-brief-date')")
            report.check(bool(kinds) and set(kinds[:-1]) == {"P"} and kinds[-1] == "BUTTON" and outside,
                         f"{w} panel {i + 1}: the fold holds only paragraphs and its Hide button; player and date line outside")
        report.check(not audio, f"{w} no audio requested before Listen ({len(audio)})")
        play = pg.locator(".listen-play")
        if play.count():
            play.first.focus()
            pg.keyboard.press("Enter")
            pg.wait_for_timeout(800)
            report.check(bool(audio), f"{w} Listen (keyboard) requests the brief's audio")
        elif w == 1920:
            report.note("no news audio in this build (CI makes it), so the Listen checks were skipped")
        ctx.close()
    ctx = env.context(1920, 1080, js=False)
    pg = ctx.new_page()
    pg.goto(BASE + "news/this-week/", wait_until="load")
    n = pg.locator(".news-card").count()
    report.check(n == html.count('class="news-card"'), f"no JS: all {n} news cards are in the page")
    report.check(pg.evaluate("[...document.querySelectorAll('.topic-chips')].every(r => r.hidden)"), "no JS: chip rows stay hidden")
    report.check(pg.locator("audio").count() == pg.locator("audio[preload='none']").count(),
                 "no JS: every native player is preload=none")
    ctx.close()


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


def topic_filter(env, report):
    print("2. topic filter")
    for w, h in ((1920, 1080), (390, 844)):
        for url in ["news/this-week/"] + FEEDS:
            ctx = env.context(w, h)
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
                report.check(not bad and restored,
                      f"{w} {url} {name}: {chips.count()} chips, each one list of its count; All restores "
                      f"{end['visible']} shown + {end['summaries'] or 'no fold'} closed" + (f"  BAD {bad[:2]}" if bad else ""))
            ctx.close()


def brief_fold(env, report):
    print("3. the brief's fold")
    for url in ["news/this-week/"] + FEEDS:
        ctx = env.context(1440, 900)
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
            report.check(opened and label_hidden and start and last == f"BUTTON|{HIDE}|true" and on_hide and closed and back == READ,
                  f"{url} fold {i + 1}: opens by Enter (label gives way, focus to the continuation {start}), "
                  f"ends in {last!r}, label hidden {label_hidden}, closed {closed}, Tab reaches it in {tabs} steps inside the fold, "
                  f"Enter closes, focus back on '{back}'")
        ctx.close()
    ctx = env.context(1440, 900, js=False)
    pg = ctx.new_page()
    for url in ["news/this-week/"] + FEEDS:
        pg.goto(BASE + url, wait_until="load")
        f = pg.locator(".section-brief > details.section-brief-more").first
        f.locator("summary").click()
        vis = f.evaluate("d => ({open: d.open, label: d.querySelector('summary').getBoundingClientRect().height > 0,"
                         " hide: d.querySelector('.section-brief-hide').getBoundingClientRect().height > 0})")
        f.locator("summary").click()
        report.check(vis == {"open": True, "label": True, "hide": False} and not f.evaluate("d => d.open"),
              f"no JS {url}: opened fold keeps its label, no dead button, the label closes it")
    ctx.close()


def jump_chips(env, report):
    print("4. jump chips")
    for w, h in ((1920, 1080), (1440, 900), (390, 844)):
        ctx = env.context(w, h)
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
            report.check(ok, f"{w} chip #{fid}: heading focused {st['focus']}, top {st['top']:.0f}, panel {st['clear']:.0f}px below the chips row, outlined {st['picked']}, "
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


def rows_check(env, report):
    print("5. lists in more than one column")
    pages = FEEDS + _digests(env)
    for w in (1920, 1440):
        ctx = env.context(w, 1000)
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
                report.check(ok, f"{w} {url}: {r['n']} items in {r['cols']} columns x {r['rows']} rows, "
                          f"row tops within {r['worstTop']:.2f}px, rules within {r['worstBottom']:.2f}px, "
                          f"left-to-right {r['order']}, top rules {r['topRules']}")
        report.check(seen >= len(FEEDS), f"{w}: {seen} multi-column lists checked (the feed pages and every wide digest feed)")
        ctx.close()


def run(env, report):
    this_week_basics(env, report)
    topic_filter(env, report)
    brief_fold(env, report)
    jump_chips(env, report)
    rows_check(env, report)
