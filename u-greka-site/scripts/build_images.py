"""
Пайплайн изображений: source-media -> public/images/<имя>-<ширина>.webp/.jpg,
src/content/images.generated.json (размеры, средний цвет), public/og/og-image.jpg,
а также single-img/images.css для однофайловой сборки.
Запуск: python3 scripts/build_images.py   (нужен Pillow)
"""
import base64, json, sys
from pathlib import Path
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from image_map import IMAGES
from process import prepare

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source-media"
OUT = ROOT / "public" / "images"
SINGLE = ROOT / "single-img"
WIDTHS = [480, 800, 1200, 1800]
OUT.mkdir(parents=True, exist_ok=True); SINGLE.mkdir(exist_ok=True); (ROOT / "public" / "og").mkdir(parents=True, exist_ok=True)

manifest, css = {}, []
for name, (rel, crop, blurs) in IMAGES.items():
    im = prepare(SRC / rel, crop, blurs)
    w, h = im.size
    widths = sorted(set([x for x in WIDTHS if x < w] + [min(w, WIDTHS[-1])]))
    for tw in widths:
        r = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
        r.save(OUT / f"{name}-{tw}.webp", "WEBP", quality=76, method=6)
    # JPG — одна запасная копия для старых браузеров без WebP
    fw = min(w, 1200)
    im.resize((fw, round(h * fw / w)), Image.LANCZOS).save(
        OUT / f"{name}.jpg", "JPEG", quality=78, optimize=True, progressive=True)
    avg = im.resize((1, 1), Image.LANCZOS).getpixel((0, 0))
    manifest[name] = {"w": w, "h": h, "widths": widths, "color": "#%02x%02x%02x" % avg}
    # однофайловая версия: одна копия не шире 1100 px
    tw = min(w, 960 if name == "hero-main" else 720 if name.startswith("obves") else 600)
    s = im.resize((tw, round(h * tw / w)), Image.LANCZOS)
    p = SINGLE / f"{name}.webp"; s.save(p, "WEBP", quality=60 if name == "hero-main" else 56, method=6)
    css.append(f'.img-{name}{{background-image:url("data:image/webp;base64,{base64.b64encode(p.read_bytes()).decode()}")}}')

(SINGLE / "images.css").write_text("\n".join(css) + "\n", encoding="utf-8")
(ROOT / "src" / "content" / "images.generated.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")

# OG 1200x630 из hero (номер уже размыт)
name, (rel, crop, blurs) = "hero-main", IMAGES["hero-main"]
im = prepare(SRC / rel, crop, blurs); w, h = im.size
ch = round(w * 630 / 1200); top = round(h * 0.18)
im.crop((0, top, w, top + ch)).resize((1200, 630), Image.LANCZOS).save(ROOT / "public" / "og" / "og-image.jpg", "JPEG", quality=84)
total = sum(f.stat().st_size for f in SINGLE.glob("*.webp")) / 1024 / 1024
print(f"OK: {len(manifest)} images, single-file payload {total:.1f} MB")
