# Сводный лист скриншотов: python3 scripts/sheet.py <out.jpg> <cols> <width> files...
import sys
from PIL import Image
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
ims = [Image.open(f).convert("RGB") for f in sys.argv[4:]]
ims = [im.resize((w, round(im.height * w / im.width))) for im in ims]
h = max(im.height for im in ims)
rows = (len(ims) + cols - 1) // cols
S = Image.new("RGB", (cols * w + (cols - 1) * 8, rows * h + (rows - 1) * 8), "#888")
for i, im in enumerate(ims):
    S.paste(im, ((i % cols) * (w + 8), (i // cols) * (h + 8)))
S.save(out, quality=82)
