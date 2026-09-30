"""
Фото для однофайловой версии (dist-single/index.html): по одному webp на снимок,
не шире 1200 px, и images.css, где каждое фото записано ОДИН раз (data-URL в классе
.bsimg-<имя>). Разметка страницы только ссылается на класс, поэтому фото не дублируются
и видны даже там, где JavaScript не выполняется.
"""
import base64
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
OUT = ROOT / "single-img"
OUT.mkdir(exist_ok=True)
total = 0
css = []
for path in sorted(SRC.glob("*.jpg")):
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    w, h = im.size
    tw = min(w, 1200)
    im = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
    dst = OUT / f"{path.stem}.webp"
    im.save(dst, "WEBP", quality=74, method=6)
    total += dst.stat().st_size
    b64 = base64.b64encode(dst.read_bytes()).decode()
    css.append(f'.bsimg-{path.stem}{{background-image:url("data:image/webp;base64,{b64}")}}')
(OUT / "images.css").write_text("\n".join(css) + "\n", encoding="utf-8")
print(f"single-img: {total / 1024 / 1024:.1f} MB")
