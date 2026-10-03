// Проход по странице с кадрами экрана в ключевых точках и сводный лист.
// node scripts/walk.mjs <url> <out-prefix> <w> <h> <mobile 0|1> <mode webgl|nowebgl|reduced|nojs>
import { createRequire } from "node:module";
import sharp from "sharp";
const require = createRequire(import.meta.url);
let pw;
try { pw = require("playwright"); } catch { pw = require("/opt/node22/lib/node_modules/playwright"); }
const [url, out, ws, hs, mob, mode] = process.argv.slice(2);
const W = +ws, H = +hs, mobile = mob === "1";
const b = await pw.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: mobile, hasTouch: mobile, javaScriptEnabled: mode !== "nojs", reducedMotion: mode === "reduced" ? "reduce" : "no-preference" });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
const q = url.startsWith("file:") ? "" : (url.includes("?") ? "&" : "?") + "nopl&nodegrade" + (mode === "nowebgl" ? "&nowebgl" : "");
await page.goto(url + q, { waitUntil: "load" });
await page.waitForTimeout(mode === "webgl" ? 5000 : 1500);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
const stops = [];
for (let y = 0; y < total - H * 0.3; y += H * (mode === "nojs" || mode === "reduced" ? 0.95 : 0.9)) stops.push(Math.round(y));
const shots = [];
for (const y of stops) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await page.waitForTimeout(mode === "webgl" ? 1400 : 650);
  shots.push(await page.screenshot());
}
await b.close();
const sw = Math.round(W * (mobile ? 0.55 : 0.32)), sh = Math.round((H * sw) / W);
const cols = mobile ? 8 : 5;
const comp = await Promise.all(shots.map(async (s, i) => ({ input: await sharp(s).resize(sw, sh).toBuffer(), left: (i % cols) * (sw + 6), top: Math.floor(i / cols) * (sh + 6) })));
await sharp({ create: { width: cols * (sw + 6), height: Math.ceil(shots.length / cols) * (sh + 6), channels: 3, background: "#222" } }).composite(comp).jpeg({ quality: 78 }).toFile(`${out}.jpg`);
console.log(out, shots.length, "кадров", errs.length ? "ОШИБКИ: " + errs.join(" | ") : "без ошибок");
