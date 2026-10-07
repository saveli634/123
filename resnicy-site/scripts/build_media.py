"""Готовит фото, ролик и заготовки логотипа из assets-src/.

Запуск из папки resnicy-site:  python3 scripts/build_media.py   (нужны Pillow и ffmpeg)

Что делает:
  * фото  -> public/media/*.webp (длинная сторона не больше родной и не больше 1600 px, q=78)
             + single-img/images.css: те же фото одним экземпляром для однофайловой сборки;
  * 003   -> режется пополам (белая полоса на y=795..801) и выравнивается по зрачку: до/после;
  * 005   -> поворот на 180°, кадр только с глазами (без водяного знака и надписи на футболке);
  * 006   -> кадр только глаза и брови;
  * 009   -> ролик без звука, H.264 <= 600 КБ + постер;
  * 004 / 008 -> чёрно-белые PNG надписей для трассировки (scripts/trace_logos.mjs).
"""

import base64
import io
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets-src"
OUT = ROOT / "public" / "media"
SINGLE = ROOT / "single-img"
TRACE = ROOT / "scripts" / ".trace"
GEN = ROOT / "src" / "content" / "media.generated.json"

Q = 78


def save_webp(im: Image.Image, name: str, widths):
    """Сохраняет картинку в нескольких ширинах (без увеличения выше родного размера)."""
    files = []
    for w in sorted(set(min(w, im.width) for w in widths)):
        h = round(im.height * w / im.width)
        path = OUT / f"{name}-{w}.webp"
        im.resize((w, h), Image.LANCZOS).save(path, "WEBP", quality=Q, method=6)
        files.append((w, path.name, path.stat().st_size))
    return files


def single_css(im: Image.Image, cls: str, width: int, quality=74):
    w = min(width, im.width)
    h = round(im.height * w / im.width)
    buf = io.BytesIO()
    im.resize((w, h), Image.LANCZOS).save(buf, "WEBP", quality=quality, method=6)
    data = base64.b64encode(buf.getvalue()).decode()
    return f".img-{cls}{{background-image:url(data:image/webp;base64,{data})}}\n", len(buf.getvalue())


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    SINGLE.mkdir(exist_ok=True)
    TRACE.mkdir(exist_ok=True)

    photos = {}

    # 001 — главное макро-фото (квадрат 1440)
    hero = Image.open(SRC / "001_macro.jpg").convert("RGB")
    photos["hero"] = hero

    # 003 — до/после: верх «до», низ «после». Зрачок: (600, 473) сверху и (604, 1276) снизу.
    ba = Image.open(SRC / "003_before_after.jpg").convert("RGB")
    left, right, up, down = 596, 642, 473, 321
    photos["before"] = ba.crop((600 - left, 473 - up, 600 + right, 473 + down))
    photos["after"] = ba.crop((604 - left, 1276 - up, 604 + right, 1276 + down))

    # 005 — кадр перевёрнут: поворот на 180°, оставить только глаза
    violet = Image.open(SRC / "005_violet.jpg").convert("RGB").rotate(180)
    photos["violet"] = violet.crop((420, 470, 1300, 1030))

    # 006 — селфи: только глаза и брови
    selfie = Image.open(SRC / "006_selfie.jpg").convert("RGB")
    photos["selfie"] = selfie.crop((470, 740, 1680, 1290))

    # 009 — ролик: без звука, сжатый; постер — кадр на 1,2 с
    reel = OUT / "reel.mp4"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(SRC / "009_reel.mp4"), "-an", "-c:v", "libx264",
         "-preset", "slow", "-crf", "30", "-profile:v", "main", "-pix_fmt", "yuv420p",
         "-movflags", "+faststart", str(reel)],
        check=True,
    )
    poster_jpg = TRACE / "poster.jpg"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", "1.2", "-i", str(SRC / "009_reel.mp4"),
         "-frames:v", "1", "-q:v", "2", str(poster_jpg)],
        check=True,
    )
    photos["poster"] = Image.open(poster_jpg).convert("RGB")

    widths = {
        "hero": [720, 1440],
        "before": [800, 1238],
        "after": [800, 1238],
        "violet": [640, 880],
        "selfie": [800, 1210],
        "poster": [480],
    }
    # в однофайловой версии — родное разрешение (на телефонах с плотным экраном фото должны быть чёткими)
    single_w = {"hero": 1440, "before": 1238, "after": 1238, "violet": 880, "selfie": 1210, "poster": 480}

    meta = {}
    css = "/* Сгенерировано scripts/build_media.py — фото для однофайловой сборки */\n"
    single_total = 0
    for name, im in photos.items():
        files = save_webp(im, name, widths[name])
        rule, size = single_css(im, name, single_w[name], quality=78)
        css += rule
        single_total += size
        meta[name] = {
            "w": im.width,
            "h": im.height,
            "files": [{"w": w, "file": f} for w, f, _ in files],
        }
        print(f"{name:7s} {im.width}x{im.height}  " + ", ".join(f"{f} {s // 1024}K" for _, f, s in files))

    # Отзывы: скриншоты из assets-src/reviews/ (по алфавиту). В blur.json можно указать, что замазать
    # (имена, аватарки): {"файл.png": [[x0, y0, x1, y1], ...]} — координаты в пикселях исходного скриншота.
    for old in OUT.glob("review*.webp"):
        old.unlink()
    rdir = SRC / "reviews"
    blur = json.loads((rdir / "blur.json").read_text()) if (rdir / "blur.json").exists() else {}
    reviews = []
    if rdir.exists():
        shots = sorted(p for p in rdir.iterdir() if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp"))
        for i, path in enumerate(shots, 1):
            im = Image.open(path).convert("RGB")
            for box in blur.get(path.name, []):
                region = im.crop(tuple(box)).filter(ImageFilter.GaussianBlur(22))
                im.paste(region, tuple(box[:2]))
            name = f"review{i}"
            files = save_webp(im, name, [480, 960])
            rule, size = single_css(im, name, 720, quality=74)
            css += rule
            single_total += size
            meta[name] = {"w": im.width, "h": im.height, "files": [{"w": w, "file": f} for w, f, _ in files]}
            reviews.append(name)
            print(f"{name:7s} {path.name} {im.width}x{im.height}  " + ", ".join(f"{f} {s // 1024}K" for _, f, s in files))
    (ROOT / "src" / "content" / "reviews.generated.json").write_text(json.dumps(reviews))

    (SINGLE / "images.css").write_text(css)
    print(f"single-img/images.css: {single_total // 1024}K до base64")
    print(f"reel.mp4: {reel.stat().st_size // 1024}K")

    # Open Graph: 1200x630, глаз в центре
    og = hero.crop((0, 340, 1440, 340 + 756)).resize((1200, 630), Image.LANCZOS)
    og.save(ROOT / "public" / "og-image.jpg", "JPEG", quality=84, optimize=True, progressive=True)

    GEN.write_text(json.dumps(meta, ensure_ascii=False, indent=1))

    # Надписи для трассировки: обрезка по содержимому, x2, порог
    for src, name in (("004_script_lash.jpg", "lash"), ("008_script_angel.jpg", "angel")):
        g = Image.open(SRC / src).convert("L")
        bw = g.point(lambda v: 255 if v > 160 else 0)
        box = ImageOps.invert(bw).getbbox()
        pad = 6
        box = (box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad)
        crop = g.crop(box)
        big = crop.resize((crop.width * 3, crop.height * 3), Image.BICUBIC).filter(ImageFilter.GaussianBlur(3.2))
        big.point(lambda v: 255 if v > 165 else 0).convert("L").save(TRACE / f"{name}.png")
        print(f"trace {name}: {big.width}x{big.height}")


def isolate_letters():
    """Первая буква надписи (для фавикона): связная область вокруг точки на её жирном штрихе."""
    from PIL import ImageDraw

    for name, seed in (("lash", (1050, 1224)), ("angel", (800, 570))):
        im = Image.open(TRACE / f"{name}.png").convert("L")
        ImageDraw.floodfill(im, seed, 128)
        letter = im.point(lambda v: 0 if v == 128 else 255)
        box = ImageOps.invert(letter).getbbox()
        letter.crop((box[0] - 8, box[1] - 8, box[2] + 8, box[3] + 8)).save(TRACE / f"{name}-letter.png")


if __name__ == "__main__":
    main()
    isolate_letters()
