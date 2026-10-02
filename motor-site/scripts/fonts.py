"""
Шрифты сайта из @fontsource — только кириллица и латиница. Результат лежит в src/fonts/
и src/styles/fonts.css (в git), поэтому для обычной сборки Python не нужен.

  * Oswald 600/700 и Manrope 400/600 — исходные файлы @fontsource, в латинский файл
    добавлен неразрывный дефис U+2011 (копия обычного), чтобы «1VD‑FTV» не разрывался
    и не подставлялся системный шрифт.
  * «Motor Digits» 600/700 — цифры Oswald одинаковой ширины для счётчиков. В Oswald нет
    функции tnum, поэтому одно font-variant-numeric: tabular-nums цифры не выравнивает.

Запуск: python3 scripts/fonts.py   (нужен pip install fonttools brotli)
"""
import re
from pathlib import Path

from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FS = ROOT / "node_modules" / "@fontsource"
OUT = ROOT / "src" / "fonts"
CSS = ROOT / "src" / "styles" / "fonts.css"
OUT.mkdir(parents=True, exist_ok=True)

FACES = [("oswald", "Oswald", 600), ("oswald", "Oswald", 700), ("manrope", "Manrope", 400), ("manrope", "Manrope", 600)]
SUBSETS = ["cyrillic", "latin"]
DIGIT_CHARS = "0123456789  /.,:+-–—·%"


def unicode_ranges(pkg: str, weight: int) -> dict:
    css = (FS / pkg / f"{weight}.css").read_text(encoding="utf-8")
    out = {}
    for m in re.finditer(r"/\* [\w-]+-(\w+)-\d+-normal \*/\s*@font-face\s*{([\s\S]*?)}", css):
        rng = re.search(r"unicode-range:\s*([^;]+);", m.group(2))
        if rng:
            out[m.group(1)] = rng.group(1).strip()
    return out


def add_nb_hyphen(font: TTFont) -> None:
    for table in font["cmap"].tables:
        if table.isUnicode() and 0x2D in table.cmap:
            table.cmap[0x2011] = table.cmap[0x2D]


def rename(font: TTFont, family: str, weight: int) -> None:
    style = "Regular"
    full = f"{family} {weight}"
    for rec in font["name"].names:
        if rec.nameID in (1, 16):
            rec.string = family
        elif rec.nameID in (2, 17):
            rec.string = style
        elif rec.nameID in (3, 4):
            rec.string = full
        elif rec.nameID == 6:
            rec.string = full.replace(" ", "-")


def tabular_digits(src: Path, dst: Path, weight: int) -> None:
    font = TTFont(src)
    opts = Options()
    opts.layout_features = []
    opts.drop_tables += ["GPOS", "GSUB", "GDEF"]
    opts.name_IDs = ["*"]
    sub = Subsetter(options=opts)
    sub.populate(unicodes=[ord(c) for c in DIGIT_CHARS])
    sub.subset(font)
    cmap = font.getBestCmap()
    glyf, hmtx = font["glyf"], font["hmtx"]
    names = [cmap[ord(d)] for d in "0123456789"]
    width = max(hmtx[n][0] for n in names)
    for n in names:
        adv, _ = hmtx[n]
        dx = (width - adv) // 2
        g = glyf[n]
        if g.isComposite():
            for c in g.components:
                c.x += dx
        elif g.numberOfContours > 0:
            g.coordinates.translate((dx, 0))
        g.recalcBounds(glyf)
        hmtx[n] = (width, getattr(g, "xMin", 0))
    rename(font, "Motor Digits", weight)
    font.flavor = "woff2"
    font.save(dst)


css = ["/* Сгенерировано scripts/fonts.py — не редактировать вручную */"]
for pkg, family, weight in FACES:
    ranges = unicode_ranges(pkg, weight)
    for subset in SUBSETS:
        src = FS / pkg / "files" / f"{pkg}-{subset}-{weight}-normal.woff2"
        name = f"{pkg}-{subset}-{weight}.woff2"
        font = TTFont(src)
        if subset == "latin":
            add_nb_hyphen(font)
            ranges[subset] = ranges[subset] + ",U+2011"
        font.flavor = "woff2"
        font.save(OUT / name)
        css.append(
            "@font-face{font-family:'%s';font-style:normal;font-display:swap;font-weight:%d;"
            "src:url(../fonts/%s) format('woff2');unicode-range:%s}" % (family, weight, name, ranges[subset])
        )

for weight in (600, 700):
    name = f"motor-digits-{weight}.woff2"
    tabular_digits(FS / "oswald" / "files" / f"oswald-latin-{weight}-normal.woff2", OUT / name, weight)
    css.append(
        "@font-face{font-family:'Motor Digits';font-style:normal;font-display:swap;font-weight:%d;"
        "src:url(../fonts/%s) format('woff2');unicode-range:U+0030-0039,U+0020,U+00A0,U+002B-002F,U+003A,U+0025,U+2013-2014,U+00B7}"
        % (weight, name)
    )

CSS.parent.mkdir(parents=True, exist_ok=True)
CSS.write_text("\n".join(css) + "\n", encoding="utf-8")
total = sum(p.stat().st_size for p in OUT.glob("*.woff2"))
print(f"fonts: {len(list(OUT.glob('*.woff2')))} files, {total / 1024:.0f} KB -> {CSS.relative_to(ROOT)}")
