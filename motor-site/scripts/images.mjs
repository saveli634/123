/**
 * Фото сайта: размытие зон из image-map.mjs → единый грейд → WebP.
 *
 * Грейд (как CSS contrast(1.12) saturate(.78) brightness(.92)):
 *   контраст +12 %, насыщенность −22 % (кроме кадров с keepColor), яркость −8 %,
 *   тени уходят в красно-чёрное (осветление до #1c0507, лёгкий тёплый multiply). Красный градиент multiply
 *   и зерно 3–4 % накладываются поверх в CSS (.ph), одинаково для всех фото.
 *
 * Выход:
 *   public/img/<имя>-<ширина>.webp   — для хостинга, две ширины;
 *   .single-img/images.css            — для однофайловой версии: каждое фото ОДИН раз,
 *                                       data-URL в классе .im-<имя> (≤1200 px по длинной стороне);
 *   src/content/images.generated.json — размеры, ширины, средний цвет (плейсхолдер).
 * Рендеры мотора (renders/*.webp, см. render-engine.mjs) — без грейда, с прозрачностью.
 *
 * Запуск: npm run images   (--check — превью размытых зон в .scratch/check)
 */
import sharp from "sharp";
import { mkdirSync, readdirSync, writeFileSync, existsSync, rmSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import { IMAGES } from "./image-map.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "assets-src");
const WEB = join(ROOT, "public", "img");
const SINGLE = join(ROOT, ".single-img");
const RENDERS = join(ROOT, "renders");
const CHECK = process.argv.includes("--check");
const LONG = 1200;
const Q_WEB = 76;
const Q_SINGLE = 74;

rmSync(WEB, { recursive: true, force: true });
mkdirSync(WEB, { recursive: true });
mkdirSync(SINGLE, { recursive: true });
if (CHECK) mkdirSync(join(ROOT, ".scratch", "check"), { recursive: true });

/** Мягко размывает прямоугольные зоны (растушёванные края, без «квадратов»). */
async function blurZones(buf, zones, meta) {
  const layers = [];
  for (const z of zones) {
    const pad = Math.round(Math.max(10, Math.min(z.w, z.h) * 0.35));
    const left = Math.max(0, z.x - pad);
    const top = Math.max(0, z.y - pad);
    const width = Math.min(meta.width - left, z.w + pad * 2);
    const height = Math.min(meta.height - top, z.h + pad * 2);
    // Сначала пикселизация (не восстановить), потом размытие — чтобы не было «мозаики».
    const cell = Math.max(4, Math.round(z.s * 1.4));
    const region = await sharp(buf).extract({ left, top, width, height }).toBuffer();
    const pixel = await sharp(region)
      .resize(Math.max(1, Math.round(width / cell)), Math.max(1, Math.round(height / cell)), { kernel: "cubic" })
      .resize(width, height, { kernel: "cubic" })
      .blur(z.s)
      .removeAlpha()
      .raw()
      .toBuffer();
    const rx = Math.round(pad * 0.9);
    const mask = await sharp(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect x="${pad * 0.55}" y="${pad * 0.55}" width="${width - pad * 1.1}" height="${height - pad * 1.1}" rx="${rx}" fill="#fff"/></svg>`,
      ),
    )
      .blur(Math.max(1, pad * 0.35))
      .extractChannel(0)
      .raw()
      .toBuffer();
    const rgba = await sharp(pixel, { raw: { width, height, channels: 3 } })
      .joinChannel(mask, { raw: { width, height, channels: 1 } })
      .png()
      .toBuffer();
    layers.push({ input: rgba, left, top });
  }
  return sharp(buf).composite(layers).toBuffer();
}

async function grade(buf, keepColor) {
  let img = sharp(buf).linear(1.0304, -14.13); // contrast 1.12 + brightness .92
  if (!keepColor) img = img.modulate({ saturation: 0.78 });
  const graded = await img.toBuffer();
  const { width, height } = await sharp(graded).metadata();
  return sharp(graded)
    .composite([
      // Чёрные уходят в красно-чёрное, средние тона чуть теплеют
      { input: { create: { width, height, channels: 3, background: "#1c0507" } }, blend: "lighten" },
      { input: { create: { width, height, channels: 3, background: "#f6ebe8" } }, blend: "multiply" },
    ])
    .toBuffer();
}

function fit(w, h, long = LONG) {
  const k = Math.min(1, long / Math.max(w, h));
  return { w: Math.round(w * k), h: Math.round(h * k) };
}

const manifest = {};
const singleCss = [];
let webBytes = 0;
let singleBytes = 0;

async function emit(name, buf, { alpha = false, bgVariant = false } = {}) {
  const meta = await sharp(buf).metadata();
  const full = fit(meta.width, meta.height);
  // Хостинг: 480 / 800 / полный размер — телефон берёт меньший файл
  const widths = [480, 800].filter((w) => w < full.w - 60).concat(full.w);
  for (const w of widths) {
    const out = join(WEB, `${name}-${w}.webp`);
    await sharp(buf).resize({ width: w }).webp({ quality: Q_WEB, alphaQuality: 80, effort: 6 }).toFile(out);
    webBytes += statSync(out).size;
  }
  const single = await sharp(buf).resize({ width: full.w }).webp({ quality: Q_SINGLE, alphaQuality: 75, effort: 6 }).toBuffer();
  singleBytes += single.length;
  singleCss.push(`.im-${name}{background-image:url("data:image/webp;base64,${single.toString("base64")}")}`);
  const stats = await sharp(buf).resize(32).stats();
  const hex = stats.channels
    .slice(0, 3)
    .map((c) => Math.round(c.mean).toString(16).padStart(2, "0"))
    .join("");
  manifest[name] = { w: full.w, h: full.h, widths, color: alpha ? "transparent" : `#${hex}` };

  if (bgVariant) {
    // Фон: маленький, размытый — растягивается на весь экран только под затемнением.
    const bg = await sharp(buf).resize({ width: 480 }).blur(3).modulate({ brightness: 0.8 }).toBuffer();
    const bgName = `${name}-bg`;
    const out = join(WEB, `${bgName}.webp`);
    await sharp(bg).webp({ quality: 70 }).toFile(out);
    const bgSingle = await sharp(bg).webp({ quality: 68 }).toBuffer();
    singleBytes += bgSingle.length;
    singleCss.push(`.im-${bgName}{background-image:url("data:image/webp;base64,${bgSingle.toString("base64")}")}`);
    const m = await sharp(bg).metadata();
    manifest[bgName] = { w: m.width, h: m.height, widths: [m.width], color: manifest[name].color, single: true };
  }
}

for (const [name, spec] of Object.entries(IMAGES)) {
  let buf = await sharp(join(SRC, spec.src)).rotate().toBuffer();
  const meta = await sharp(buf).metadata();
  if (spec.blur?.length) {
    buf = await blurZones(buf, spec.blur, meta);
    if (CHECK) {
      for (const [i, z] of spec.blur.entries()) {
        const pad = 40;
        const left = Math.max(0, z.x - pad);
        const top = Math.max(0, z.y - pad);
        await sharp(buf)
          .extract({ left, top, width: Math.min(meta.width - left, z.w + pad * 2), height: Math.min(meta.height - top, z.h + pad * 2) })
          .resize({ width: 360 })
          .png()
          .toFile(join(ROOT, ".scratch", "check", `${name}-${i}.png`));
      }
    }
  }
  buf = await grade(buf, spec.keepColor);
  await emit(name, buf, { bgVariant: spec.bg });
}

if (existsSync(RENDERS)) {
  for (const f of readdirSync(RENDERS).filter((f) => /\.(png|webp)$/.test(f)).sort()) {
    const buf = await sharp(join(RENDERS, f)).toBuffer();
    await emit(`render-${basename(f).replace(/\.(png|webp)$/, "")}`, buf, { alpha: true });
  }
}

writeFileSync(join(ROOT, "src", "content", "images.generated.json"), JSON.stringify(manifest, null, 1) + "\n");
writeFileSync(join(SINGLE, "images.css"), singleCss.join("\n") + "\n");
console.log(
  `images: ${Object.keys(manifest).length} → web ${(webBytes / 1048576).toFixed(2)} MB, single ${(singleBytes / 1048576).toFixed(2)} MB (base64 ≈ ${((singleBytes * 4) / 3 / 1048576).toFixed(2)} MB)`,
);
