"""
Однофайловая версия: каждое фото (не шире 1200 px) записывается ОДИН раз в
single-img/images.css как класс .img-<имя> с data-URL. Разметка только ссылается на класс.
"""
import base64
from pathlib import Path
from PIL import Image, ImageOps
from crops import apply

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "assets-src", ROOT / "single-img"
OUT.mkdir(exist_ok=True)
css, total = [], 0
for path in sorted(SRC.glob("*.jpg")):
    im = apply(path.stem, ImageOps.exif_transpose(Image.open(path)).convert("RGB"))
    w, h = im.size
    tw = min(w, 1200)
    im = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
    dst = OUT / f"{path.stem}.webp"
    im.save(dst, "WEBP", quality=76, method=6)
    total += dst.stat().st_size
    b64 = base64.b64encode(dst.read_bytes()).decode()
    css.append(f'.img-{path.stem}{{background-image:url("data:image/webp;base64,{b64}")}}')
(OUT / "images.css").write_text("\n".join(css) + "\n", encoding="utf-8")
print(f"single-img: {total / 1024 / 1024:.1f} MB")
