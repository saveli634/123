// Кадры из видео → единый грейд → WebP (+ JPG-запаска) для сайта и для однофайловой версии.
//
// Грейд — та же математика, что у CSS-фильтра
//   sepia(.18) contrast(1.1) saturate(.8) brightness(.9)
// (спецификация Filter Effects), только «запечённая» в пиксели: кадры выглядят одинаково везде,
// включая превью в мессенджерах и браузеры без CSS-фильтров. Градиент снизу, зерно и виньетка —
// поверх, в CSS. Чужие логотипы в кадре (подъёмник, шлем, канистра) размываются по маске.
//
// Выход:
//   public/frames/<имя>-<ширина>.webp, public/frames/<имя>.jpg — версия для хостинга;
//   src/generated/frames.json  — размеры, средний цвет, ширины;
//   src/generated/frames-single.css — по одному WebP на кадр (data URI) для site.html.
// Запуск: node scripts/images.mjs
import sharp from "sharp";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const SRC = "assets-src/frames";
const OUT = "public/frames";
mkdirSync(OUT, { recursive: true });
mkdirSync("src/generated", { recursive: true });

/** Области с чужими логотипами (координаты исходника): x, y, w, h. */
const BLUR = {
  garage_lift_wide: [[498, 280, 46, 200]], // надпись производителя на стойке подъёмника
  radiator_close: [[228, 0, 40, 140]], // та же надпись, край кадра
  bike_in_garage: [[436, 385, 48, 135]], // надпись на шлеме
  underbody_before_2: [[612, 812, 108, 135]], // этикетка канистры
};

const MAX_SIDE = 1200; // ТЗ: кадры ≤1200 px
const WEB_WIDTHS = [360, 540];
const Q_WEB = 76;
const Q_SINGLE = 74;

// --- CSS filter math -------------------------------------------------------------------------
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function grade(r, g, b) {
  // sepia(.18)
  const a = 0.18;
  const ia = 1 - a;
  let R = (0.393 + 0.607 * ia) * r + (0.769 - 0.769 * ia) * g + (0.189 - 0.189 * ia) * b;
  let G = (0.349 - 0.349 * ia) * r + (0.686 + 0.314 * ia) * g + (0.168 - 0.168 * ia) * b;
  let B = (0.272 - 0.272 * ia) * r + (0.534 - 0.534 * ia) * g + (0.131 + 0.869 * ia) * b;
  R = clamp01(R);
  G = clamp01(G);
  B = clamp01(B);
  // contrast(1.1)
  const c = 1.1;
  R = clamp01((R - 0.5) * c + 0.5);
  G = clamp01((G - 0.5) * c + 0.5);
  B = clamp01((B - 0.5) * c + 0.5);
  // saturate(.8)
  const s = 0.8;
  const R2 = (0.213 + 0.787 * s) * R + (0.715 - 0.715 * s) * G + (0.072 - 0.072 * s) * B;
  const G2 = (0.213 - 0.213 * s) * R + (0.715 + 0.285 * s) * G + (0.072 - 0.072 * s) * B;
  const B2 = (0.213 - 0.213 * s) * R + (0.715 - 0.715 * s) * G + (0.072 + 0.928 * s) * B;
  // brightness(.9)
  return [clamp01(R2) * 0.9, clamp01(G2) * 0.9, clamp01(B2) * 0.9];
}

/** Мягкое размытие областей: сильно размытая копия кадра поверх оригинала через растушёванную маску. */
async function blurRegions(file, w, h, regions) {
  const svgMask = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${regions
    .map(([x, y, rw, rh]) => `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="10" fill="#fff"/>`)
    .join("")}</svg>`;
  const mask = await sharp(Buffer.from(svgMask)).blur(5).extractChannel(0).raw().toBuffer();
  const blurred = await sharp(file).removeAlpha().blur(11).raw().toBuffer();
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = blurred[i * 3];
    rgba[i * 4 + 1] = blurred[i * 3 + 1];
    rgba[i * 4 + 2] = blurred[i * 3 + 2];
    rgba[i * 4 + 3] = mask[i];
  }
  return sharp(file)
    .removeAlpha()
    .composite([{ input: rgba, raw: { width: w, height: h, channels: 4 } }])
    .raw()
    .toBuffer();
}

const manifest = {};
const css = [];
let singleBytes = 0;

for (const f of readdirSync(SRC)
  .filter((x) => x.endsWith(".jpg"))
  .sort()) {
  const name = basename(f, ".jpg");
  const file = `${SRC}/${f}`;
  const meta = await sharp(file).metadata();
  const { width: w, height: h } = meta;

  const raw = BLUR[name] ? await blurRegions(file, w, h, BLUR[name]) : await sharp(file).removeAlpha().raw().toBuffer();

  // грейд по пикселям
  const out = Buffer.alloc(raw.length);
  let sr = 0;
  let sg = 0;
  let sb = 0;
  for (let i = 0; i < raw.length; i += 3) {
    const [R, G, B] = grade(raw[i] / 255, raw[i + 1] / 255, raw[i + 2] / 255);
    out[i] = Math.round(R * 255);
    out[i + 1] = Math.round(G * 255);
    out[i + 2] = Math.round(B * 255);
    sr += out[i];
    sg += out[i + 1];
    sb += out[i + 2];
  }
  const n = raw.length / 3;
  const hex = (v) =>
    Math.round(v / n)
      .toString(16)
      .padStart(2, "0");
  const color = `#${hex(sr)}${hex(sg)}${hex(sb)}`;
  const img = () => sharp(out, { raw: { width: w, height: h, channels: 3 } });

  // самый крупный размер: длинная сторона ≤ 1200
  const k = Math.min(1, MAX_SIDE / Math.max(w, h));
  const fullW = Math.round(w * k);
  const widths = [...WEB_WIDTHS.filter((x) => x < fullW - 40), fullW];
  for (const tw of widths) {
    await img()
      .resize(tw, null, { kernel: "lanczos3" })
      .webp({ quality: Q_WEB, effort: 6, smartSubsample: true })
      .toFile(`${OUT}/${name}-${tw}.webp`);
  }
  await img()
    .resize(fullW, null, { kernel: "lanczos3" })
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toFile(`${OUT}/${name}.jpg`);

  // однофайловая версия: одна копия, WebP q74, ≤1200 по длинной стороне
  const single = await img()
    .resize(fullW, null, { kernel: "lanczos3" })
    .webp({ quality: Q_SINGLE, effort: 6, smartSubsample: true })
    .toBuffer();
  singleBytes += single.length;
  css.push(`.f-${name}{background-image:url("data:image/webp;base64,${single.toString("base64")}")}`);

  manifest[name] = { w: fullW, h: Math.round(h * k), widths, color };
  console.log(`${name}: ${w}×${h} → ${widths.join("/")} webp, single ${(single.length / 1024).toFixed(0)} KB`);
}

writeFileSync("src/generated/frames.json", JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(
  "src/generated/frames-single.css",
  "/* Сгенерировано scripts/images.mjs — кадры для однофайловой версии, каждый встроен один раз */\n" +
    css.join("\n") +
    "\n",
);
console.log(`OK: ${Object.keys(manifest).length} frames, single-file payload ${(singleBytes / 1024).toFixed(0)} KB`);
