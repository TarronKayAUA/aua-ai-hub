"""Art review: render the Island Night pictures the way the owner reviews them
(authoring tool, added 2026-09-28; DESIGN.md section 19).

Why: a drawing that looks right in code can put a building over the water,
hide the Moon, or light its lamps in the wrong order, and the owner judges
by eye at 1920 in both schemes. This renders each picture in those
conditions, beside its reference photographs when a real place is drawn,
and can capture the one pass of lights frame by frame, so the author looks
first and the owner sees a finished piece.

What it does:
  1. builds the site into a temporary folder (or uses --site DIR), with the
     same strict build and integrity lines as scripts/design_check.py;
  2. serves it to headless Chromium from disk (scripts/design/common.py);
  3. for every place in data/art_slots.yaml (or those chosen with --piece),
     and for the homepage hero, renders the picture at 1920 and 1440 in the
     light scheme (dusk) and the dark scheme (night), waiting for the late
     fainter stars;
  4. writes, per piece, a review sheet (the page at 1920 in context, then the
     picture at dusk and at night), a comparison sheet when --ref names
     reference photographs, and with --sequence a strip of the one pass;
  5. prints where everything went, and each page's script errors (a page
     with an error exits 1).

    python scripts/art_review.py                             every piece
    python scripts/art_review.py --piece lamp-steps --sequence
    python scripts/art_review.py --piece shirley-heights --ref shirley-heights-2.webp --ref shirley-heights-6-owner-dusk.webp
    python scripts/art_review.py --site site/ --out C:/temp/art
    python scripts/art_review.py --piece shirley-heights --times --ref shirley-heights-7-owner-day.webp

--times renders the four versions every piece has (owner, 2026-09-28; DESIGN.md 19.6): Dawn, Day and
Dusk in the light scheme (forced with ?isl-sky=) and Night in the dark scheme, and writes a sheet of
the four; with --ref it compares the photographs with the Day version.

References are read from --refs DIR (default: the art's source folder,
Claude Projects/Hub art for the media tracker (2026-09-26)/island-hub-version/
references/, whose README says whose each photograph is). Web photographs
there are for study only and are never published.

Requirements, as for design_check.py and figure_sheet.py (authoring only,
not in requirements.txt): the playwright and Pillow packages and Chromium.
On the maintainer's laptop the system Python has them. Nothing in CI runs it.
"""
from __future__ import annotations

import argparse
import shutil
import sys
import tempfile
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO / "scripts"))
REFS = Path.home() / "Downloads" / "Claude Projects" / "Hub art for the media tracker (2026-09-26)" / "island-hub-version" / "references"
WAIT_MS = 8000          # the one pass is over by about 4.5 s; the fainter stars arrive at about 5 s
BOX_JS = "(sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }"


def slots() -> list[dict]:
    data = yaml.safe_load((REPO / "data" / "art_slots.yaml").read_text(encoding="utf-8")) or {}
    out = [{"piece": "campus (homepage hero)", "address": "", "sel": ".isl-host"}]
    for s in data.get("slots") or []:
        address = s["page"][:-3]
        address = "" if address == "index" else address[:-len("index")] if address.endswith("/index") else address + "/"
        out.append({"piece": s["piece"], "address": address, "sel": "figure.isl-vignette",
                    "section": s["section"]})
    return out


def shoot(env, slot, width, height, scheme, path, context_path=None, sky=None):
    from design.common import BASE
    ctx = env.context(width, height, color_scheme=scheme)
    page = ctx.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE + slot["address"] + (f"?isl-sky={sky}" if sky else ""), wait_until="load")
    if slot.get("section") and slot["section"] != "_head":
        page.evaluate("(id) => { const h = document.getElementById(id); if (h) { h.scrollIntoView({block: 'start'}); window.scrollBy(0, -110); } }", slot["section"])
    page.wait_for_timeout(WAIT_MS)
    box = page.evaluate(BOX_JS, slot["sel"])
    if box and box[2] > 0 and box[3] > 0:
        page.screenshot(path=str(path), clip={"x": box[0], "y": box[1], "width": box[2], "height": box[3]})
    if context_path:
        page.screenshot(path=str(context_path))
    ctx.close()
    return box, errors


def sequence(env, slot, out, frames=(900, 1500, 2100, 2700, 3300, 5000)):
    """The one pass, frame by frame, at 1920 in the dark scheme."""
    from design.common import BASE
    from PIL import Image
    ctx = env.context(1920, 1080, color_scheme="dark")
    page = ctx.new_page()
    page.goto(BASE + slot["address"], wait_until="domcontentloaded")
    page.wait_for_selector(f"{slot['sel']} svg", timeout=20000)
    t0 = page.evaluate("performance.now()")
    box = page.evaluate(BOX_JS, slot["sel"])
    shots = []
    for ms in frames:
        page.wait_for_function(f"performance.now() - {t0} >= {ms}")
        tmp = out.with_name(out.stem + f"_{ms}.png")
        page.screenshot(path=str(tmp), clip={"x": box[0], "y": box[1], "width": box[2], "height": box[3]})
        shots.append(Image.open(tmp))
    ctx.close()
    w, h = shots[0].width // 2, shots[0].height // 2
    sheet = Image.new("RGB", (w * 3 + 16, h * 2 + 8), "#111")
    for i, im in enumerate(shots):
        sheet.paste(im.resize((w, h)), ((i % 3) * (w + 8), (i // 3) * (h + 8)))
    sheet.save(out)


def review_sheet(label, context, light, dark, out):
    from PIL import Image, ImageDraw, ImageFont
    try:
        font, small = ImageFont.truetype("segoeuib.ttf", 26), ImageFont.truetype("segoeui.ttf", 20)
    except OSError:
        font = small = ImageFont.load_default()
    page = Image.open(context).resize((1440, 810))
    d, l = Image.open(dark), Image.open(light)
    k = 710 / d.width
    d, l = d.resize((710, round(d.height * k))), l.resize((710, round(l.height * k)))
    sheet = Image.new("RGB", (1440, 60 + page.height + 54 + d.height + 20), "#101418")
    draw = ImageDraw.Draw(sheet)
    draw.text((16, 14), label, fill="#f2f2f2", font=font)
    sheet.paste(page, (0, 60))
    y = 60 + page.height + 20
    draw.text((16, y), "Dusk (light theme)", fill="#cfd6de", font=small)
    draw.text((736, y), "Night (dark theme)", fill="#cfd6de", font=small)
    sheet.paste(l, (0, y + 34))
    sheet.paste(d, (730, y + 34))
    sheet.save(out)


def times_sheet(label, shots, out):
    """The four versions at 1920: Dawn and Day above, Dusk and Night below."""
    from PIL import Image, ImageDraw, ImageFont
    try:
        font, small = ImageFont.truetype("segoeuib.ttf", 26), ImageFont.truetype("segoeui.ttf", 20)
    except OSError:
        font = small = ImageFont.load_default()
    ims = [(name, Image.open(shots[name])) for name in ("dawn", "day", "dusk", "night")]
    k = 710 / ims[0][1].width
    ims = [(name, im.resize((710, round(im.height * k)))) for name, im in ims]
    h = ims[0][1].height
    sheet = Image.new("RGB", (1440, 60 + 2 * (h + 54)), "#101418")
    draw = ImageDraw.Draw(sheet)
    draw.text((16, 14), label, fill="#f2f2f2", font=font)
    titles = {"dawn": "Dawn (light theme)", "day": "Day (light theme)", "dusk": "Dusk (light theme)", "night": "Night (dark theme)"}
    for i, (name, im) in enumerate(ims):
        x, y = (i % 2) * 730, 60 + (i // 2) * (h + 54)
        draw.text((x + 16, y), titles[name], fill="#cfd6de", font=small)
        sheet.paste(im, (x, y + 34))
    sheet.save(out)


def compare_sheet(refs, light, dark, out):
    from PIL import Image
    d, l = Image.open(dark), Image.open(light)
    tiles = []
    for ref in refs:
        im = Image.open(ref).convert("RGB")
        tiles.append(im.resize((d.width, round(im.height * d.width / im.width))))
    left = sum(t.height for t in tiles) + 12 * max(0, len(tiles) - 1)
    sheet = Image.new("RGB", (d.width * 2 + 12, max(left, d.height * 2 + 12)), "#111")
    y = 0
    for t in tiles:
        sheet.paste(t, (0, y))
        y += t.height + 12
    sheet.paste(l, (d.width + 12, 0))
    sheet.paste(d, (d.width + 12, d.height + 12))
    sheet.save(out)


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0], formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--piece", action="append", help="only this piece (its key in art_slots.yaml, or 'campus' for the hero)")
    ap.add_argument("--ref", action="append", default=[], help="a reference photograph (a file in --refs, or a path) to compare with")
    ap.add_argument("--refs", type=Path, default=REFS, help="where reference photographs are kept")
    ap.add_argument("--sequence", action="store_true", help="also capture the one pass of lights, frame by frame")
    ap.add_argument("--site", type=Path, help="an existing build to use instead of building")
    ap.add_argument("--out", type=Path, default=Path(tempfile.gettempdir()) / "art-review", help="where the sheets go")
    ap.add_argument("--times", action="store_true", help="render the four versions (Dawn, Day, Dusk, Night) and a sheet of them")
    args = ap.parse_args()
    try:
        from playwright.sync_api import sync_playwright
        import PIL  # noqa: F401
    except ImportError as exc:
        print(f"art_review needs playwright and Pillow ({exc}); see the docstring.")
        return 2
    from design.common import Env
    from design_check import build_site

    chosen = [s for s in slots() if not args.piece or any(p == s["piece"].split(" ")[0] for p in args.piece)]
    if not chosen:
        print("no piece matches", args.piece)
        return 2
    args.out.mkdir(parents=True, exist_ok=True)
    tmp, site = None, args.site
    if site is None:
        tmp = Path(tempfile.mkdtemp(prefix="art-review-site-"))
        ok, problems = build_site(tmp)
        if not ok:
            print("\n".join(problems))
            shutil.rmtree(tmp, ignore_errors=True)
            return 2
        site = tmp
    failed = False
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            env = Env(site, browser)
            for slot in chosen:
                key = slot["piece"].split(" ")[0]
                shots = {}
                for w, h in ((1920, 1080), (1440, 900)):
                    for scheme in ("light", "dark"):
                        path = args.out / f"{key}_{w}_{scheme}.png"
                        ctx_path = args.out / f"{key}_page.png" if (w, scheme) == (1920, "dark") else None
                        box, errors = shoot(env, slot, w, h, scheme, path, ctx_path)
                        shots[(w, scheme)] = path
                        if errors:
                            failed = True
                            print(f"  {key} {w} {scheme}: script errors: {errors}")
                        if not box:
                            failed = True
                            print(f"  {key} {w} {scheme}: the picture was not found on {slot['address'] or '(home)'}")
                label = f"{slot['address'] or '(home)'}: {slot['piece']}"
                review_sheet(label, args.out / f"{key}_page.png", shots[(1920, "light")], shots[(1920, "dark")], args.out / f"review_{key}.png")
                print(f"{key}: review sheet {args.out / f'review_{key}.png'}")
                if args.times:
                    four = {"night": shots[(1920, "dark")]}
                    for w, h in ((1920, 1080), (1440, 900)):
                        for sky in ("dawn", "day", "dusk"):
                            path = args.out / f"{key}_{w}_{sky}.png"
                            box, errors = shoot(env, slot, w, h, "light", path, sky=sky)
                            if w == 1920:
                                four[sky] = path
                            if errors or not box:
                                failed = True
                                print(f"  {key} {w} {sky}: {'script errors: ' + str(errors) if errors else 'the picture was not found'}")
                    times_sheet(label, four, args.out / f"times_{key}.png")
                    print(f"  four times of day {args.out / f'times_{key}.png'}")
                if args.ref:
                    refs = [r if Path(r).is_file() else args.refs / r for r in args.ref]
                    missing = [str(r) for r in refs if not Path(r).is_file()]
                    if missing:
                        print("  reference not found:", ", ".join(missing))
                    else:
                        first = args.out / f"{key}_1920_day.png" if args.times else shots[(1920, "light")]
                        compare_sheet(refs, first, shots[(1920, "dark")], args.out / f"compare_{key}.png")
                        print(f"  comparison {args.out / f'compare_{key}.png'}")
                if args.sequence:
                    sequence(env, slot, args.out / f"sequence_{key}.png")
                    print(f"  the one pass {args.out / f'sequence_{key}.png'}")
            browser.close()
    finally:
        if tmp:
            shutil.rmtree(tmp, ignore_errors=True)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
