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

The white variants are mechanical single-color recolors (luminance becomes
alpha), standard practice for placing a monochrome mark on a colored
background; the geometry of the artwork is untouched.
"""

from collections import Counter, deque
from pathlib import Path

from PIL import Image

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


def main():
    ASSETS.mkdir(parents=True, exist_ok=True)
    seal = Image.open(GRAPHICS / "Plain Logo.png")
    wordmark = Image.open(GRAPHICS / "Text Logo.png")

    print("seal blue     :", dominant_color(seal))
    print("wordmark navy :", dominant_color(wordmark))

    outputs = {
        "logo-mark-white.png": white_knockout(seal, 512),
        "wordmark-white.png": white_knockout(wordmark, 800),
        "favicon.png": circle_transparent(seal, 180),
    }
    profile_path = GRAPHICS / "Profile Photo.jpg"
    if profile_path.exists():
        profile = Image.open(profile_path).convert("RGB")
        side = min(profile.size)
        left = (profile.width - side) // 2
        top = (profile.height - side) // 2
        profile = profile.crop((left, top, left + side, top + side))
        outputs["profile.jpg"] = profile.resize((480, 480), Image.LANCZOS)
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
