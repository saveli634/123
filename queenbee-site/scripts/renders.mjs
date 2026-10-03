// Готовые рендеры «Зеркала образа» для устройств без WebGL 2 (по одному на этап 0–4)
// и картинка для соцсетей (og-image). Снимает живую сцену в headless Chromium.
// Использование: запущенный `npm run dev`, затем `npm run renders [-- http://localhost:5173/]`.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
let pw;
try {
  pw = require("playwright");
} catch {
  pw = require("/opt/node22/lib/node_modules/playwright");
}
const sharp = require("sharp");
const base = process.argv[2] || "http://localhost:5173/";
const OUT = new URL("../assets-src/renders/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
mkdirSync(new URL("../public/og/", import.meta.url).pathname, { recursive: true });

const browser = await pw.chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
for (let k = 0; k < 5; k++) {
  const page = await browser.newPage({ viewport: { width: 1100, height: 1100 }, deviceScaleFactor: 1 });
  await page.goto(`${base}?render=${k}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.__renderDone === true, null, { timeout: 60000 });
  await page.waitForTimeout(300);
  const buf = await page.locator("canvas.mirror-canvas").screenshot({ omitBackground: true });
  await sharp(buf).png().toFile(`${OUT}render_${k}.png`);
  console.log("render", k);
  await page.close();
}
// og-image: первый экран с зеркалом и портретом, 1200×630
const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await og.goto(`${base}?og=1&nopl`, { waitUntil: "load" });
await og.waitForFunction(() => window.__mirrorReady === true, null, { timeout: 60000 }).catch(() => {});
await og.waitForTimeout(2500);
const ogBuf = await og.screenshot();
await sharp(ogBuf).jpeg({ quality: 84, mozjpeg: true }).toFile(new URL("../public/og/og-image.jpg", import.meta.url).pathname);
console.log("og-image");
await browser.close();
