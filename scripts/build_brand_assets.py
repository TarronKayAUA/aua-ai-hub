"""Generate web brand assets from the official AUA logos in graphics/.

One-off authoring tool, re-run only when the source logos change. Requires
Pillow (`pip install pillow`), which is intentionally not in requirements.txt
because the nightly pipeline never needs it.

Inputs (owner-supplied, official artwork):
    graphics/Plain Logo.png   circular seal, blue on white
    graphics/Text Logo.png    seal plus wordmark, navy on white

Outputs (committed, referenced by mkdocs.yml and the homepage):
    docs/assets/logo-mark-white.png  white knockout of the seal for the header
    docs/assets/wordmark-white.png   white knockout of the wordmark for the hero
    docs/assets/favicon.png          color seal, transparent outside the circle
    docs/assets/social-card.png      1200x630 Open Graph share card
                                     (overrides/main.html points og:image at it)

Run with --social-only to regenerate just the share card (skips the photo
re-encodes, which would otherwise show up as byte-level diffs in git).

The white variants are mechanical single-color recolors (luminance becomes
alpha), standard practice for placing a monochrome mark on a colored
background; the geometry of the artwork is untouched.
"""

import sys
from collections import Counter, deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO = Path(__file__).resolve().parent.parent
GRAPHICS = REPO / "graphics"
ASSETS = REPO / "docs" / "assets"


def dominant_color(img: Image.Image) -> str:
    small = img.convert("RGB").resize((128, 128))
    counts = Counter(
        px for px in small.getdata()
        if sum(px) < 600  # ignore white / near-white
    )
    r, g, b = counts.most_common(1)[0][0]
    return f"#{r:02x}{g:02x}{b:02x}"


def white_knockout(img: Image.Image, max_width: int) -> Image.Image:
    """Map ink to white with alpha from darkness; white background vanishes."""
    rgb = img.convert("RGB")
    if rgb.width > max_width:
        rgb = rgb.resize(
            (max_width, round(rgb.height * max_width / rgb.width)),
            Image.LANCZOS,
        )
    # Solid white wherever there is ink, transparent on the white background,
    # with a smooth ramp across anti-aliased edges. A plain 255-L curve leaves
    # the mark semi-transparent because the brand blue is mid-luminance.
    def curve(v: int) -> int:
        if v <= 160:
            return 255
        if v >= 240:
            return 0
        return round((240 - v) * 255 / 80)

    alpha = rgb.convert("L").point(curve)
    out = Image.new("RGBA", rgb.size, (255, 255, 255, 0))
    white = Image.new("RGBA", rgb.size, (255, 255, 255, 255))
    out.paste(white, mask=alpha)
    return out


def circle_transparent(img: Image.Image, size: int) -> Image.Image:
    """Make the white outside of the seal transparent via edge flood fill,
    keeping white details inside the seal opaque."""
    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()
    seen = bytearray(w * h)
    queue = deque()
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))
    while queue:
        x, y = queue.popleft()
        if not (0 <= x < w and 0 <= y < h) or seen[y * w + x]:
            continue
        seen[y * w + x] = 1
        r, g, b, a = px[x, y]
        if r > 235 and g > 235 and b > 235:
            px[x, y] = (255, 255, 255, 0)
            queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return rgba.resize((size, size), Image.LANCZOS)


def _card_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Best available system face; the site itself uses Inter, and Segoe UI
    is the closest metric match present on this authoring machine."""
    candidates = (["seguisb.ttf", "arialbd.ttf"] if bold
                  else ["segoeui.ttf", "arial.ttf"])
    for name in candidates:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def social_card(wordmark: Image.Image) -> Image.Image:
    """1200x630 Open Graph card: brand gradient, white wordmark, title,
    tagline, and the sparkle accent from the section-banner family. Colors
    are the sampled seal blue #07618c and wordmark navy #1b4165."""
    width, height = 1200, 630
    c1, c2 = (0x07, 0x61, 0x8C), (0x1B, 0x41, 0x65)
    small = Image.new("RGB", (60, 32))
    for y in range(32):
        for x in range(60):
            t = (x / 59 + y / 31) / 2
            small.putpixel(
                (x, y),
                tuple(round(a + (b - a) * t) for a, b in zip(c1, c2)))
    card = small.resize((width, height), Image.BICUBIC).convert("RGB")
    draw = ImageDraw.Draw(card, "RGBA")

    cx, cy, r, d = 1080, 110, 30, 20  # sparkle accent, top right
    for x1, y1, x2, y2 in ((cx, cy - r, cx, cy + r),
                           (cx - r, cy, cx + r, cy),
                           (cx - d, cy - d, cx + d, cy + d),
                           (cx + d, cy - d, cx - d, cy + d)):
        draw.line((x1, y1, x2, y2), fill=(255, 255, 255, 190), width=6)

    mark = white_knockout(wordmark, 640)
    mark_y = 100
    card.paste(mark, ((width - mark.width) // 2, mark_y), mark)

    def centered(text: str, font: ImageFont.FreeTypeFont, y: int,
                 fill: tuple) -> None:
        w = draw.textlength(text, font=font)
        draw.text(((width - w) / 2, y), text, font=font, fill=fill)

    title_y = mark_y + mark.height + 56
    centered("AUA AI Hub", _card_font(92, bold=True), title_y,
             (255, 255, 255, 255))
    centered("Artificial intelligence, curated for medical education.",
             _card_font(36), title_y + 136, (255, 255, 255, 235))
    return card


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    seal = Image.open(GRAPHICS / "Plain Logo.png")
    wordmark = Image.open(GRAPHICS / "Text Logo.png")

    if "--social-only" in sys.argv:
        path = ASSETS / "social-card.png"
        social_card(wordmark).save(path, optimize=True)
        print(f"wrote {path.relative_to(REPO)} "
              f"(1200x630, {path.stat().st_size // 1024} KB)")
        return

    print("seal blue     :", dominant_color(seal))
    print("wordmark navy :", dominant_color(wordmark))

    outputs = {
        "logo-mark-white.png": white_knockout(seal, 512),
        "wordmark-white.png": white_knockout(wordmark, 800),
        "favicon.png": circle_transparent(seal, 180),
    }
    def square(path: Path, size: int) -> Image.Image:
        img = Image.open(path).convert("RGB")
        side = min(img.size)
        left = (img.width - side) // 2
        top = (img.height - side) // 2
        return img.crop((left, top, left + side, top + side)).resize(
            (size, size), Image.LANCZOS)

    profile_path = GRAPHICS / "Profile Photo.jpg"
    if profile_path.exists():
        outputs["profile.jpg"] = square(profile_path, 480)

    # Committee photos: source file in graphics/ -> web asset slug.
    committee = {
        "Profile Photo.jpg": "tarron-kayalackakom.jpg",
        "Ricardo Hood.jpg": "ricardo-hood.jpg",
        "Prasanna Honnavar.jpg": "prasanna-honnavar.jpg",
        "Juan Acuna.jpg": "juan-acuna.jpg",
        "Courtney Lewis.jpg": "courtney-lewis.jpg",
        "Ujjal Bose.jpg": "ujjal-bose.jpg",
        "Ramos Amith.png": "amith-ramos.jpg",
        "Warren Barrymore.jpg": "warren-barrymore.jpg",
        "Leona Dickenson.jpg": "leona-dickenson.jpg",
        "Elvis Anunwa.png": "elvis-anunwa.jpg",
    }
    (ASSETS / "committee").mkdir(parents=True, exist_ok=True)
    for source, slug in committee.items():
        src_path = GRAPHICS / source
        if src_path.exists():
            outputs[f"committee/{slug}"] = square(src_path, 320)
        else:
            print(f"WARNING: missing committee photo {source}")
    for name, img in outputs.items():
        path = ASSETS / name
        if name.endswith(".jpg"):
            img.save(path, quality=85, optimize=True)
        else:
            img.save(path, optimize=True)
        print(f"wrote {path.relative_to(REPO)} "
              f"({img.size[0]}x{img.size[1]}, {path.stat().st_size // 1024} KB)")
    print(f"\n=== verification ===\nassets written : {len(outputs)}")


if __name__ == "__main__":
    main()
