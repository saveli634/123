# Листы «до / после второго круга»: python3 scripts/compare.py <out.jpg> <ширина колонки> <до1> <после1> [<до2> <после2> ...]
import sys
from PIL import Image, ImageDraw, ImageFont
out, w = sys.argv[1], int(sys.argv[2])
files = sys.argv[3:]
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 22)
pairs = [(files[i], files[i + 1]) for i in range(0, len(files), 2)]
rows = []
for a, b in pairs:
    ims = [Image.open(f).convert("RGB") for f in (a, b)]
    ims = [im.resize((w, round(im.height * w / im.width))) for im in ims]
    h = max(im.height for im in ims)
    row = Image.new("RGB", (w * 2 + 24, h + 44), "#efe9df")
    d = ImageDraw.Draw(row)
    for i, (im, label) in enumerate(zip(ims, ["ДО — круг 1", "ПОСЛЕ — круг 2"])):
        x = i * (w + 24)
        row.paste(im, (x, 44))
        d.text((x + 4, 10), label, fill="#5A1F2B", font=font)
    rows.append(row)
H = sum(r.height for r in rows) + 16 * (len(rows) - 1)
sheet = Image.new("RGB", (rows[0].width, H), "#d9cdb8")
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height + 16
sheet.save(out, quality=84)
print(out, sheet.size)
