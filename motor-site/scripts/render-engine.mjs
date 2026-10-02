/**
 * Готовые рендеры той же 3D-модели — для устройств без WebGL 2, режима «уменьшить движение»,
 * просмотра без скриптов и картинки Open Graph.
 *
 *   renders/0.webp      — общий вид (первый экран)
 *   renders/1…6.webp    — шесть этапов
 *   public/og/og.jpg    — картинка для соцсетей (1200×630)
 *
 * Рендер идёт в headless Chromium (SwiftShader) со страницы render.html, вдвое крупнее,
 * затем уменьшается и получает мягкую прозрачную виньетку по краям.
 * Запуск: npm run renders (затем npm run images).
 */
import { createServer } from "vite";
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "renders");
mkdirSync(OUT, { recursive: true });
mkdirSync(join(ROOT, "public", "og"), { recursive: true });

const POSES = [0, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];
const W = 1400;
const H = 1000;
const SS = 2;

const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 5179, strictPort: true } });
await server.listen();
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

try {
  const page = await browser.newPage({ viewport: { width: W * SS, height: H * SS }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error("pageerror:", e.message));
  await page.goto(`http://localhost:5179/render.html?t=0&w=${W * SS}&h=${H * SS}`, { waitUntil: "load" });
  await page.waitForFunction(() => document.body.dataset.state, null, { timeout: 120000 });
  if ((await page.evaluate(() => document.body.dataset.state)) !== "ready") throw new Error("WebGL недоступен в headless Chromium");

  // Мягкая прозрачная виньетка по краям, чтобы рендер не читался прямоугольником
  const mask = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="52%" r="62%"><stop offset="62%" stop-color="#fff"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
    ),
  )
    .png()
    .toBuffer();

  for (const [i, t] of POSES.entries()) {
    await page.evaluate((t) => window.__still(t), t);
    const shot = await page.screenshot({ omitBackground: true, type: "png" });
    const small = await sharp(shot).resize(W, H, { kernel: "lanczos3" }).png().toBuffer();
    await sharp(small).composite([{ input: mask, blend: "dest-in" }]).webp({ quality: 92, alphaQuality: 95, effort: 6 }).toFile(join(OUT, `${i}.webp`));
    console.log(`render ${i} (t=${t})`);
  }

  // Open Graph: рендер + типографика сайта
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await og.goto("http://localhost:5179/og.html", { waitUntil: "networkidle" });
  await og.evaluate(() => document.fonts.ready);
  await og.screenshot({ path: join(ROOT, "public", "og", "og.png") });
  await sharp(join(ROOT, "public", "og", "og.png")).jpeg({ quality: 84, mozjpeg: true }).toFile(join(ROOT, "public", "og", "og.jpg"));
  rmSync(join(ROOT, "public", "og", "og.png"));
  // старые PNG-рендеры больше не нужны
  for (const f of readdirSync(OUT)) if (f.endsWith(".png")) rmSync(join(OUT, f));
  console.log("og.jpg");
} finally {
  await browser.close();
  await server.close();
}
