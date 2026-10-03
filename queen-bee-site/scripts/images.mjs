// Пайплайн изображений (sharp).
//   source-media/interiors/*.jpg -> public/images/<имя>-<ширина>.webp + <имя>.jpg
//   source-media/guests/*.jpg    -> media-guests/ (в сборку попадают ТОЛЬКО при showGuestPhotos)
//   renders/*.png (рендеры спирали) -> public/images/spiral-*.webp, public/og-image.jpg
//   + single-img/*.css — по одной встроенной копии каждого кадра для однофайловой версии
//   + src/content/images.generated.json — размеры и средний цвет (плейсхолдер без CLS)
//
// Единый грейд = CSS `contrast(1.05) saturate(.92) brightness(1.02) sepia(.06)`,
// плюс тёплый молочный подтон и мягкий вигнет. Портреты гостий — без усиления контраста.
// Запуск: npm run images
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, basename } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "source-media");
const OUT = join(ROOT, "public", "images");
const GUESTS_OUT = join(ROOT, "media-guests");
const SINGLE = join(ROOT, "single-img");
const RENDERS = join(ROOT, "renders");
for (const d of [OUT, GUESTS_OUT, SINGLE]) mkdirSync(d, { recursive: true });

/**
 * Зоны мягкого размытия (координаты исходника 720×1280):
 * читаемая надпись на коробке и отражения людей в зеркальной задней стенке витрины.
 * На сайте не должно быть ни брендов, ни людей в интерьерных кадрах.
 */
const BLURS = {
  shelves_products: [
    { left: 590, top: 470, width: 100, height: 64, sigma: 7 }, // надпись на коробке
    { left: 306, top: 708, width: 96, height: 112, sigma: 9 }, // отражение человека
    { left: 424, top: 612, width: 70, height: 110, sigma: 8 }, // отражение второго человека
  ],
};

/** Подписи нейтральные, без утверждений об услугах (ТЗ, раздел 3) */
export const INTERIORS = [
  "lobby_chandelier",
  "lounge_burgundy",
  "lounge_green",
  "staircase_spiral",
  "fireplace_wood",
  "reception_desk",
  "shelves_products",
  "gift_boxes_monogram",
  "ceiling_leaves",
  "nail_lounge",
];

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Матрица CSS saturate(s) */
function satMatrix(s) {
  return [
    [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
    [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
  ];
}
/** Матрица CSS sepia(a) */
function sepiaMatrix(a) {
  const k = 1 - a;
  return [
    [0.393 + 0.607 * k, 0.769 - 0.769 * k, 0.189 - 0.189 * k],
    [0.349 - 0.349 * k, 0.686 + 0.314 * k, 0.168 - 0.168 * k],
    [0.272 - 0.272 * k, 0.534 - 0.534 * k, 0.131 + 0.869 * k],
  ];
}
const mul = (m, r, g, b) => [m[0][0] * r + m[0][1] * g + m[0][2] * b, m[1][0] * r + m[1][1] * g + m[1][2] * b, m[2][0] * r + m[2][1] * g + m[2][2] * b];

/**
 * Грейд по пикселям, в том же порядке, что и CSS-фильтр.
 * portrait: без контраста, мягче насыщенность и вигнет — кожа не «плывёт».
 */
function grade(data, w, h, ch, { portrait = false } = {}) {
  const contrast = portrait ? 1.0 : 1.05;
  const S = satMatrix(portrait ? 0.96 : 0.92);
  const bright = 1.02;
  const P = sepiaMatrix(portrait ? 0.04 : 0.06);
  const milk = [244, 239, 230];
  const lift = portrait ? 0.025 : 0.045; // молочный подъём теней
  const vig = portrait ? 0.1 : 0.16;
  const cx = w / 2;
  const cy = h / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * ch;
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      // contrast
      r = (r - 128) * contrast + 128;
      g = (g - 128) * contrast + 128;
      b = (b - 128) * contrast + 128;
      // saturate
      [r, g, b] = mul(S, clamp(r), clamp(g), clamp(b));
      // brightness
      r *= bright;
      g *= bright;
      b *= bright;
      // sepia
      [r, g, b] = mul(P, clamp(r), clamp(g), clamp(b));
      // тёплый молочный подтон: тени чуть приподняты к #F4EFE6
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const k = lift * (1 - lum);
      r += (milk[0] - r) * k;
      g += (milk[1] - g) * k;
      b += (milk[2] - b) * k;
      // мягкий вигнет (эллипс по пропорциям кадра), уходит в тёплый тон, а не в серый
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const d = Math.sqrt(dx * dx * 0.9 + dy * dy * 0.75);
      const v = vig * smooth(0.55, 1.25, d);
      r *= 1 - v * 0.92;
      g *= 1 - v;
      b *= 1 - v * 1.08;
      data[i] = clamp(Math.round(r));
      data[i + 1] = clamp(Math.round(g));
      data[i + 2] = clamp(Math.round(b));
    }
  }
}

async function prepare(file, name, opts) {
  let img = sharp(file).rotate().removeAlpha();
  const blurs = BLURS[name];
  if (blurs) {
    // Размытие с растушёванной эллиптической маской — без «квадратов цензуры»
    const base = await img.toBuffer();
    const { width: W, height: H } = await sharp(base).metadata();
    const sigma = Math.max(...blurs.map((z) => z.sigma));
    const blurred = await sharp(base).blur(sigma).toBuffer();
    const ellipses = blurs
      .map((z, i) => {
        const cx = z.left + z.width / 2;
        const cy = z.top + z.height / 2;
        return `<radialGradient id="g${i}" cx="${cx}" cy="${cy}" r="${Math.max(z.width, z.height) * 0.6}" gradientUnits="userSpaceOnUse" gradientTransform="translate(${cx} ${cy}) scale(${z.width / Math.max(z.width, z.height)} ${z.height / Math.max(z.width, z.height)}) translate(${-cx} ${-cy})"><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><rect width="${W}" height="${H}" fill="url(#g${i})"/>`;
      })
      .join("");
    const mask = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs></defs>${ellipses}</svg>`))
      .extractChannel("alpha")
      .toBuffer();
    const layer = await sharp(blurred).joinChannel(mask).png().toBuffer();
    img = sharp(await sharp(base).composite([{ input: layer }]).removeAlpha().toBuffer());
  }
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  grade(data, info.width, info.height, info.channels, opts);
  return sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
}

const manifest = {};
const singleCss = { interiors: [], guests: [], renders: [] };

async function emit(img, name, { widths, outDir, singleWidth, singleQ, group, jpg = true }) {
  const meta = await img.clone().metadata();
  const w = meta.width;
  const h = meta.height;
  const ws = [...new Set(widths.filter((x) => x <= w))];
  if (!ws.length || (Math.max(...ws) < w && w <= Math.max(...widths))) ws.push(w);
  for (const tw of ws) {
    await img.clone().resize(tw).webp({ quality: 76, effort: 6, smartSubsample: true }).toFile(join(outDir, `${name}-${tw}.webp`));
  }
  if (jpg) await img.clone().resize(Math.min(w, 1000)).jpeg({ quality: 78, mozjpeg: true, progressive: true }).toFile(join(outDir, `${name}.jpg`));
  const { data } = await img.clone().resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  manifest[name] = { w, h, widths: ws, color: "#" + [...data.subarray(0, 3)].map((c) => c.toString(16).padStart(2, "0")).join("") };
  // однофайловая версия: одна копия, встраивается ровно один раз (CSS-класс)
  const buf = await img.clone().resize(Math.min(w, singleWidth)).webp({ quality: singleQ, effort: 6, smartSubsample: true }).toBuffer();
  singleCss[group].push(`.img-${name}{background-image:url("data:image/webp;base64,${buf.toString("base64")}")}`);
  return buf.length;
}

let singleBytes = 0;

// 1. Интерьеры: 720 px по ширине — не растягиваем, только 360 и 720
for (const name of INTERIORS) {
  const img = await prepare(join(SRC, "interiors", `${name}.jpg`), name, {});
  singleBytes += await emit(img, name, { widths: [360, 720], outDir: OUT, singleWidth: 720, singleQ: 72, group: "interiors" });
}

// 2. Гостьи: отдельная папка, в сборку — только при showGuestPhotos (см. vite.config.ts)
let guestBytes = 0;
const guestDir = join(SRC, "guests");
if (existsSync(guestDir)) {
  for (const f of readdirSync(guestDir).filter((f) => f.endsWith(".jpg")).sort()) {
    const name = basename(f, ".jpg");
    const img = await prepare(join(guestDir, f), name, { portrait: true });
    guestBytes += await emit(img, name, { widths: [480, 800, 1200], outDir: GUESTS_OUT, singleWidth: 820, singleQ: 72, group: "guests" });
  }
}

// 3. Рендеры спирали (npm run renders) — для телефонов без WebGL 2, reduced motion и предпросмотра
if (existsSync(RENDERS)) {
  for (const f of readdirSync(RENDERS).filter((f) => /^spiral-\d\.png$/.test(f)).sort()) {
    const name = basename(f, ".png");
    const img = sharp(join(RENDERS, f)).removeAlpha();
    singleBytes += await emit(img, name, { widths: [480, 800, 1100], outDir: OUT, singleWidth: 760, singleQ: 70, group: "renders", jpg: false });
  }
  const og = join(RENDERS, "og.png");
  if (existsSync(og)) await sharp(og).resize(1200, 630).jpeg({ quality: 84, mozjpeg: true }).toFile(join(ROOT, "public", "og-image.jpg"));
}

// Плитка зерна для CSS (2–3 %): серый шум 180×180, встраивается в CSS
{
  const n = 128;
  const px = Buffer.alloc(n * n);
  let seed = 7;
  for (let i = 0; i < px.length; i++) {
    seed = (seed * 16807) % 2147483647;
    px[i] = 128 + Math.round(((seed / 2147483647) - 0.5) * 160);
  }
  await sharp(px, { raw: { width: n, height: n, channels: 1 } }).png({ compressionLevel: 9, palette: true, colours: 16 }).toFile(join(ROOT, "src", "content", "grain.png"));
}

writeFileSync(join(SINGLE, "interiors.css"), singleCss.interiors.join("\n") + "\n");
writeFileSync(join(SINGLE, "renders.css"), (singleCss.renders.join("\n") || "/* рендеров нет */") + "\n");
writeFileSync(join(SINGLE, "guests.css"), (singleCss.guests.join("\n") || "/* фото гостий нет */") + "\n");
// guests.json — метаданные гостей отдельно: без флага в сборку не попадают даже размеры
const guestMeta = Object.fromEntries(Object.entries(manifest).filter(([k]) => k.startsWith("guest_")));
for (const k of Object.keys(guestMeta)) delete manifest[k];
writeFileSync(join(ROOT, "src", "content", "images.generated.json"), JSON.stringify(manifest, null, 1));
writeFileSync(join(GUESTS_OUT, "guests.generated.json"), JSON.stringify(guestMeta, null, 1));

const mb = (b) => (b / 1024 / 1024).toFixed(2);
console.log(`OK: ${Object.keys(manifest).length} images (+${Object.keys(guestMeta).length} guests)`);
console.log(`single-file payload: ${mb(singleBytes)} MB base + ${mb(guestBytes)} MB guests (before base64)`);
