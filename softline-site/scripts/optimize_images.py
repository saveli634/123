"""
assets-src/*.jpg -> public/images/<name>-<width>.webp + .jpg и src/content/images.generated.json
(размеры после обрезки и средний цвет для плейсхолдера). Плюс public/og-image.jpg.
Запуск: python3 scripts/optimize_images.py  (нужен Pillow)
"""
import json
from pathlib import Path
from PIL import Image, ImageOps
from crops import apply

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "assets-src", ROOT / "public" / "images"
MANIFEST = ROOT / "src" / "content" / "images.generated.json"
WIDTHS = [480, 800, 1200, 1600]
OUT.mkdir(parents=True, exist_ok=True)
manifest = {}

for path in sorted(SRC.glob("*.jpg")):
    name = path.stem
    im = apply(name, ImageOps.exif_transpose(Image.open(path)).convert("RGB"))
    w, h = im.size
    widths = sorted(set([x for x in WIDTHS if x < w] + [min(w, WIDTHS[-1])]))
    for tw in widths:
        r = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
        r.save(OUT / f"{name}-{tw}.webp", "WEBP", quality=80, method=6)
        r.save(OUT / f"{name}-{tw}.jpg", "JPEG", quality=82, optimize=True, progressive=True)
    avg = im.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    manifest[name] = {"w": w, "h": h, "widths": widths, "color": "#%02x%02x%02x" % avg}

# Open Graph 1200x630 — из кадра Minotti (горизонтальный кроп по дивану)
og = ImageOps.exif_transpose(Image.open(SRC / "03_minotti_hero.jpg")).convert("RGB")
w, h = og.size
ch = round(w * 630 / 1200)
top = round(h * 0.42)
og.crop((0, top, w, top + ch)).resize((1200, 630), Image.LANCZOS).save(
    ROOT / "public" / "og-image.jpg", "JPEG", quality=84, optimize=True, progressive=True)

MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print(f"OK: {len(manifest)} images")
