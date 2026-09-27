"""Week round: This Week's features still work, at 1920 and 390, by keyboard.

  python _round/c/week_check.py <site dir>

1. Jump chips: activating each one (Enter) brings its section's heading into
   view.
2. Topic chips: in each feed column, choosing the chip whose topic has
   items only in the collapsed tier opens that tier, shows exactly the
   chip's count of cards in that column, and leaves the other columns as
   they were; All restores every card.
3. "Show the other N": each disclosure opens with Enter.
4. The brief: its fold opens with Enter and holds only paragraphs; the
   player and the date line are outside it; no audio is requested before
   Listen is pressed, and pressing Listen requests it.
5. Without JavaScript: every news card of the page is in the DOM, the
   chips rows stay hidden (no dead buttons), and the text reads in order.
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).parent))
from sitebrowser import route  # noqa: E402

SITE = sys.argv[1]
PAGE = "http://hub.test/news/this-week/"
fails = []


def check(ok, msg):
    print(("  ok   " if ok else "  FAIL ") + msg)
    if not ok:
        fails.append(msg)


with sync_playwright() as pw:
    b = pw.chromium.launch()
    for w, h in ((1920, 1080), (390, 844)):
        print(f"width {w}")
        ctx = b.new_context(viewport={"width": w, "height": h})
        ctx.route("**/*", route(SITE))
        pg = ctx.new_page()
        audio_requests = []
        pg.on("request", lambda r: audio_requests.append(r.url) if r.url.endswith(".mp3") else None)
        pg.goto(PAGE, wait_until="load")
        pg.wait_for_timeout(500)

        # 1. jump chips
        for chip in pg.locator(".section-chip").all():
            target = chip.get_attribute("href")
            chip.focus()
            pg.keyboard.press("Enter")
            pg.wait_for_timeout(300)
            top = pg.evaluate(f"document.querySelector('{target}').getBoundingClientRect().top")
            check(0 <= top < h * 0.6, f"jump chip {target} brings its heading into view (top {top:.0f})")

        # 2. topic chips per feed column
        feeds = pg.locator("section.wk-feed")
        n = feeds.count()
        check(n == 3, f"three feed panels ({n})")
        tops = feeds.evaluate_all("fs => fs.map(f => Math.round(f.getBoundingClientRect().left))")
        if w >= 1200:
            check(len(set(tops)) == n, f"the panels sit side by side (left edges {tops})")
        else:
            check(len(set(tops)) == 1, f"the panels stack in feed order (left edges {tops})")
        for i in range(n):
            feed = feeds.nth(i)
            name = feed.locator("h2").inner_text()
            info = feed.evaluate("""f => {
              const more = f.querySelector('details.abstract');
              const seen = new Set([...f.querySelectorAll(':scope > .news-list .news-card')].map(c => c.dataset.topic));
              const chips = [...f.querySelectorAll('.topic-chip')].map(c => ({t: c.dataset.topic,
                n: +(c.querySelector('.topic-chip__n') || {textContent: 0}).textContent}));
              const only = chips.find(c => c.t && !seen.has(c.t)) || chips.find(c => c.t);
              return {only, total: f.querySelectorAll('.news-card').length, more: !!more};
            }""")
            others_before = pg.evaluate("""() => [...document.querySelectorAll('section.wk-feed')].map(f =>
                [...f.querySelectorAll('.news-card')].filter(c => c.style.display !== 'none').length)""")
            if not info["only"]:
                check(True, f"{name}: no topic chips (nothing to filter)")
                continue
            chip = feed.locator(f'.topic-chip[data-topic="{info["only"]["t"]}"]')
            chip.focus()
            pg.keyboard.press("Enter")
            pg.wait_for_timeout(200)
            shown = feed.evaluate("f => [...f.querySelectorAll('.news-card')].filter(c => c.style.display !== 'none' && c.offsetParent !== null).length")
            opened = feed.evaluate("f => { const d = f.querySelector('details.abstract'); return !d || d.open; }")
            others_after = pg.evaluate("""() => [...document.querySelectorAll('section.wk-feed')].map(f =>
                [...f.querySelectorAll('.news-card')].filter(c => c.style.display !== 'none').length)""")
            check(shown == info["only"]["n"], f"{name}: chip {info['only']['t']!r} shows {shown} of its {info['only']['n']} cards, visible")
            check(opened, f"{name}: the collapsed tier opened for a match")
            same = all(others_after[j] == others_before[j] for j in range(n) if j != i)
            check(same, f"{name}: the other columns unchanged")
            status = feed.locator(".topic-status").inner_text() if feed.locator(".topic-status").count() else ""
            check(bool(status), f"{name}: status line says {status!r}")
            feed.locator('.topic-chip[data-topic=""]').click()
            pg.wait_for_timeout(150)
            back = feed.evaluate("f => [...f.querySelectorAll('.news-card')].filter(c => c.style.display !== 'none').length")
            check(back == info["total"], f"{name}: All restores {back} of {info['total']} cards")

        # 3. Show the other N (collapse again first)
        pg.goto(PAGE, wait_until="load")
        pg.wait_for_timeout(300)
        for d in pg.locator("details.abstract").all():
            s = d.locator("summary")
            label = s.inner_text()
            s.focus()
            pg.keyboard.press("Enter")
            pg.wait_for_timeout(100)
            check(d.evaluate("d => d.open"), f"'{label}' opens with Enter")

        # 4. the brief
        for i in range(n):
            feed = feeds.nth(i)
            name = feed.locator("h2").inner_text()
            fold = feed.locator(".section-brief > details.section-brief-more")
            s = fold.locator("summary")
            check(s.inner_text().strip() == "Read the rest of this week's brief", f"{name}: fold label")
            kinds = fold.evaluate("d => [...d.children].filter(c => c.tagName !== 'SUMMARY').map(c => c.tagName)")
            check(kinds and set(kinds[:-1]) == {"P"} and kinds[-1] == "BUTTON",
                  f"{name}: the fold holds only paragraphs, then its Hide button ({kinds})")
            outside = feed.evaluate("f => !!f.querySelector('.section-brief > .listen') && !!f.querySelector('.section-brief > .section-brief-date')")
            check(outside, f"{name}: player and date line outside the fold")
            s.focus()
            pg.keyboard.press("Enter")
            pg.wait_for_timeout(100)
            check(fold.evaluate("d => d.open") and fold.locator("p").first.is_visible(), f"{name}: the fold opens with Enter")
        check(not audio_requests, f"no audio requested before Listen ({len(audio_requests)})")
        play = feeds.nth(0).locator(".listen-play")
        if play.count():
            play.focus()
            pg.keyboard.press("Enter")
            pg.wait_for_timeout(800)
            check(any("news-this-week-medical-education" in u for u in audio_requests),
                  "pressing Listen (keyboard) requests the brief's audio")
        else:
            check(False, "Listen button present")
        ctx.close()

    # 5. no JavaScript
    print("no JavaScript")
    ctx = b.new_context(viewport={"width": 1920, "height": 1080}, java_script_enabled=False)
    ctx.route("**/*", route(SITE))
    pg = ctx.new_page()
    pg.goto(PAGE, wait_until="load")
    cards = pg.locator(".news-card").count()
    src_cards = Path(SITE, "news/this-week/index.html").read_text(encoding="utf-8").count('class="news-card"')
    check(cards == src_cards, f"all {cards} of {src_cards} news cards are in the page")
    check(pg.evaluate("[...document.querySelectorAll('.topic-chips')].every(r => r.hidden)"), "chips rows stay hidden")
    check(pg.locator(".section-brief-lede").count() == 3 and pg.locator("details.section-brief-more").count() == 3,
          "each brief shows its lede with its fold under it")
    check(pg.locator("audio[preload='none']").count() == 3, "native players are preload=none")
    ctx.close()

    # 6. an archive week: its digest player by keyboard, and its text with JS off
    ARCH = "http://hub.test/news/archive/2026-w39/"
    for w, h in ((1920, 1080), (390, 844)):
        print(f"archive 2026-w39, width {w}")
        ctx = b.new_context(viewport={"width": w, "height": h})
        ctx.route("**/*", route(SITE))
        pg = ctx.new_page()
        reqs = []
        pg.on("request", lambda r: reqs.append(r.url) if r.url.endswith(".mp3") else None)
        pg.goto(ARCH, wait_until="load")
        pg.wait_for_timeout(400)
        feeds = pg.locator("section.wk-feed")
        lefts = feeds.evaluate_all("fs => fs.map(f => Math.round(f.getBoundingClientRect().left))")
        check(len(set(lefts)) == (len(lefts) if w >= 1200 else 1), f"{len(lefts)} feed panels, left edges {lefts}")
        check(not reqs, "no audio requested before Listen")
        play = pg.locator(".listen-play").first
        play.focus()
        pg.keyboard.press("Enter")
        pg.wait_for_timeout(800)
        check(any("digest-2026-w39" in u for u in reqs), "pressing Listen (keyboard) requests the digest's audio")
        ctx.close()
    ctx = b.new_context(viewport={"width": 1920, "height": 1080}, java_script_enabled=False)
    ctx.route("**/*", route(SITE))
    pg = ctx.new_page()
    pg.goto(ARCH, wait_until="load")
    src = Path(SITE, "news/archive/2026-w39/index.html").read_text(encoding="utf-8")
    check(pg.locator(".news-card").count() == src.count('class="news-card"'), "archive, JS off: every news card present")
    check(pg.locator("audio[preload='none']").count() == 1, "archive, JS off: the native player is preload=none")
    ctx.close()
    b.close()

print("week_check: " + ("ok" if not fails else f"{len(fails)} FAILED"))
sys.exit(1 if fails else 0)
