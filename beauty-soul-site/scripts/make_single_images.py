"""
Фото для однофайловой версии (dist-single/index.html): по одному webp на снимок,
не шире 1200 px. Они встраиваются прямо в HTML, поэтому держим вес умеренным.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
OUT = ROOT / "single-img"
OUT.mkdir(exist_ok=True)
total = 0
for path in sorted(SRC.glob("*.jpg")):
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    w, h = im.size
    tw = min(w, 1200)
    im = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
    dst = OUT / f"{path.stem}.webp"
    im.save(dst, "WEBP", quality=74, method=6)
    total += dst.stat().st_size
print(f"single-img: {total / 1024 / 1024:.1f} MB")
