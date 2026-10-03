// Пайплайн фото: assets-src/ -> public/img/<имя>-<ширина>.webp (+ одна .jpg для старых браузеров),
// single-img/images.css (для однофайловой сборки: каждое фото встроено ровно один раз),
// src/content/images.json (размеры, точка лица, подпись, средний цвет).
// Единый грейд: тёплый молочный подтон, мягкий контраст (портреты контрастом не усиливаем),
// лёгкая сепия и вигнет. Зерно — поверх страницы в CSS.
// Запуск: npm run images
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { CONFIG } from "../src/config.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = ROOT + "assets-src/";
const OUT = ROOT + "public/img/";
const SINGLE = ROOT + "single-img/";
mkdirSync(OUT, { recursive: true });
mkdirSync(SINGLE, { recursive: true });

// manifest.csv: file,size,status,focusX,focusY,caption
const rows = readFileSync(SRC + "manifest.csv", "utf8")
  .replace(/^﻿/, "")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => {
    const cells = [...line.matchAll(/("([^"]*)"|[^,]*)(,|$)/g)].map((m) => m[2] ?? m[1]).slice(0, 6);
    const [file, , status, fx, fy, caption] = cells;
    return { file, status, fx: fx ? +fx : 0.5, fy: fy ? +fy : 0.45, caption };
  });

// Подписи интерьеров — нейтральные, из ТЗ. Винтовая лестница не используется.
const INTERIOR = {
  lobby_chandelier: "Холл",
  reception_desk: "Ресепшен",
  lounge_burgundy: "Лаунж",
  lounge_green: "Гостиная",
  nail_lounge: "Зал",
  shelves_products: "Витрина",
  ceiling_leaves: "Гостиная",
  fireplace_wood: "Лаунж",
  gift_boxes_monogram: "Холл",
};
// Витрина: размываем этикетки, чтобы не читались бренды.
const BLUR_ZONES = { shelves_products: [{ left: 30, top: 270, width: 645, height: 650, sigma: 2.4 }] };

const sepia = 0.05;
const S = [
  [0.393, 0.769, 0.189],
  [0.349, 0.686, 0.168],
  [0.272, 0.534, 0.131],
];
const recomb = S.map((r, i) => r.map((v, j) => v * sepia + (i === j ? 1 - sepia : 0)));

function vignette(w, h, strength) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="g" cx="50%" cy="46%" r="72%">` +
      `<stop offset="58%" stop-color="#fff"/><stop offset="100%" stop-color="rgb(${Math.round(255 - 70 * strength)},${Math.round(255 - 82 * strength)},${Math.round(255 - 92 * strength)})"/>` +
      `</radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );
}

async function grade(path, { portrait, blur }) {
  let img = sharp(path).rotate();
  const meta = await img.metadata();
  const w = meta.width, h = meta.height;
  if (blur) {
    const base = await img.toBuffer();
    const patches = [];
    for (const z of blur) {
      const p = await sharp(base).extract({ left: z.left, top: z.top, width: z.width, height: z.height }).blur(z.sigma).toBuffer();
      patches.push({ input: p, left: z.left, top: z.top });
    }
    img = sharp(await sharp(base).composite(patches).toBuffer());
  }
  img = img.recomb(recomb).modulate({ brightness: 1.02, saturation: 0.94 });
  // Портреты контрастом не усиливаем (кожа не «плывёт»), интерьерам — +4 %.
  if (!portrait) img = img.linear(1.04, -0.04 * 128);
  // тёплый молочный подтон: чуть приподнимаем тени в тёплую сторону
  img = img.linear([0.985, 0.985, 0.98], [5, 3.5, 1.5]);
  const graded = await img.composite([{ input: vignette(w, h, portrait ? 0.35 : 0.55), blend: "multiply" }]).toBuffer();
  return { buf: graded, w, h };
}

const manifest = {};
const css = [];
let singleBytes = 0;
for (const r of rows) {
  const [dir, fileName] = r.file.split("/");
  const name = fileName.replace(/\.jpg$/, "");
  if (dir === "interiors" && !INTERIOR[name]) continue;
  const kind = dir === "interiors" ? "interior" : dir === "works_check" ? "check" : name.startsWith("hair") ? "hair" : "guest";
  const big = kind === "guest";
  const { buf, w, h } = await grade(SRC + r.file, { portrait: kind !== "interior", blur: BLUR_ZONES[name] });
  const widths = big ? [480, 800, 1200] : [480, 720];
  for (const tw of widths) {
    await sharp(buf).resize({ width: tw }).webp({ quality: 76, effort: 6 }).toFile(`${OUT}${name}-${tw}.webp`);
  }
  const jw = big ? 1200 : 720;
  await sharp(buf).resize({ width: jw }).jpeg({ quality: 78, progressive: true, mozjpeg: true }).toFile(`${OUT}${name}.jpg`);
  // однофайловая версия: гостьи ≤1200 px (берём 1000), интерьеры и кадры из ролика ≤720 px
  const sw = big ? 1000 : 640;
  // кадры works_check встраиваем в однофайловую версию только при CONFIG.showAiReel
  const embed = kind !== "check" || CONFIG.showAiReel;
  const single = await sharp(buf).resize({ width: sw }).webp({ quality: big ? 72 : 70, effort: 6 }).toBuffer();
  if (embed) singleBytes += single.length;
  if (embed) css.push(`.img-${name}{background-image:url("data:image/webp;base64,${single.toString("base64")}")}`);
  const { dominant } = await sharp(buf).stats();
  const hex = "#" + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, "0")).join("");
  manifest[name] = {
    kind,
    w: jw,
    h: Math.round((h * jw) / w),
    widths,
    fx: r.fx,
    fy: r.fy,
    caption: kind === "interior" ? INTERIOR[name] : r.caption,
    color: hex,
    ext: "jpg",
  };
  console.log(name, kind, `${w}x${h}`);
}
// Готовые рендеры сцены (scripts/renders.mjs) — с прозрачностью, без грейда.
for (let k = 0; k < 5; k++) {
  const src = `${SRC}renders/render_${k}.png`;
  try {
    statSync(src);
  } catch {
    continue;
  }
  const name = `render_${k}`;
  const widths = [480, 900];
  for (const tw of widths) await sharp(src).resize({ width: tw }).webp({ quality: 78, alphaQuality: 80, effort: 6 }).toFile(`${OUT}${name}-${tw}.webp`);
  await sharp(src).resize({ width: 700 }).png({ palette: true, quality: 80, compressionLevel: 9 }).toFile(`${OUT}${name}.png`);
  const single = await sharp(src).resize({ width: 640 }).webp({ quality: 70, alphaQuality: 70, effort: 6 }).toBuffer();
  singleBytes += single.length;
  css.push(`.img-${name}{background-image:url("data:image/webp;base64,${single.toString("base64")}")}`);
  manifest[name] = { kind: "render", w: 700, h: 700, widths, fx: 0.5, fy: 0.5, caption: "", color: "transparent", ext: "png" };
  console.log(name, "render");
}
writeFileSync(SINGLE + "images.css", css.join("\n") + "\n");
writeFileSync(ROOT + "src/content/images.json", JSON.stringify(manifest, null, 2) + "\n");
console.log(`OK: ${Object.keys(manifest).length} фото; однофайловая нагрузка ${(singleBytes / 1048576).toFixed(2)} МБ (до base64)`);
console.log("single css", (statSync(SINGLE + "images.css").size / 1048576).toFixed(2), "МБ");
