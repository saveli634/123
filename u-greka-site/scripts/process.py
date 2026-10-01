"""Общая обработка: размытие номеров (до обрезки) и обрезка."""
from PIL import Image, ImageFilter, ImageOps, ImageDraw


def blur_zone(im, box):
    w, h = im.size
    l, t, r, b = (round(box[0] * w), round(box[1] * h), round(box[2] * w), round(box[3] * h))
    region = im.crop((l, t, r, b))
    rw, rh = region.size
    # Пикселизация + размытие: номер не читается ни при каком увеличении
    small = region.resize((max(1, rw // 18), max(1, rh // 18)), Image.BILINEAR)
    region = small.resize((rw, rh), Image.NEAREST).filter(ImageFilter.GaussianBlur(max(4, rw // 40)))
    mask = Image.new("L", (rw, rh), 0)
    pad = max(2, min(rw, rh) // 10)
    ImageDraw.Draw(mask).rounded_rectangle((pad // 2, pad // 2, rw - pad // 2, rh - pad // 2), radius=pad, fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(pad // 2))
    im.paste(region, (l, t), mask)
    return im


def prepare(path, crop, blurs):
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    for zone in blurs:
        im = blur_zone(im, zone)
    if crop:
        w, h = im.size
        im = im.crop((round(crop[0] * w), round(crop[1] * h), round(crop[2] * w), round(crop[3] * h)))
    # Лёгкий подъём контраста — единая обработка телефонных фото
    from PIL import ImageEnhance
    im = ImageEnhance.Contrast(im).enhance(1.06)
    return im
