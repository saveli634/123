"""
Готовит адаптивные изображения для сайта.

assets-src/*.jpg  ->  public/img/<name>-<width>.webp  +  public/img/<name>-<width>.jpg (fallback)
и src/content/images.generated.json с размерами и средним цветом (фон-плейсхолдер).

Запуск: python3 scripts/optimize_images.py   (нужен Pillow)
"""
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
OUT = ROOT / "public" / "img"
MANIFEST = ROOT / "src" / "content" / "images.generated.json"
WIDTHS = [480, 800, 1200, 1800]

OUT.mkdir(parents=True, exist_ok=True)
manifest = {}

for path in sorted(SRC.glob("*.jpg")):
    name = path.stem
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    w, h = im.size
    widths = [x for x in WIDTHS if x < w] + [min(w, WIDTHS[-1])]
    widths = sorted(set(widths))
    for tw in widths:
        th = round(h * tw / w)
        r = im.resize((tw, th), Image.LANCZOS)
        r.save(OUT / f"{name}-{tw}.webp", "WEBP", quality=78, method=6)
        r.save(OUT / f"{name}-{tw}.jpg", "JPEG", quality=80, optimize=True, progressive=True)
    avg = im.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    manifest[name] = {
        "w": w,
        "h": h,
        "widths": widths,
        "color": "#%02x%02x%02x" % avg,
    }

# Open Graph: 1200x630 из hero, кадр по лицу (верхняя часть портрета).
hero = ImageOps.exif_transpose(Image.open(SRC / "01_hero.jpg")).convert("RGB")
hw, hh = hero.size
crop_h = round(hw * 630 / 1200)
top = round(hh * 0.08)
hero.crop((0, top, hw, top + crop_h)).resize((1200, 630), Image.LANCZOS).save(
    ROOT / "public" / "og-image.jpg", "JPEG", quality=82, optimize=True, progressive=True
)

MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print(f"OK: {len(manifest)} images")
