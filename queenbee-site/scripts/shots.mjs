// Скриншоты для проверки (круг самокритики): node scripts/shots.mjs <url> <папка> [набор]
// Набор: all | hero | quick. Режимы: webgl, nowebgl, reduced, nojs.
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
const require = createRequire(import.meta.url);
let pw;
try {
  pw = require("playwright");
} catch {
  pw = require("/opt/node22/lib/node_modules/playwright");
}
const [url = "http://localhost:5173/", out = "shots", set = "quick"] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const SIZES = {
  d1440: [1440, 900, false],
  d1280: [1280, 800, false],
  m390: [390, 844, true],
  m375: [375, 667, true],
  m360: [360, 780, true],
  l844: [844, 390, true],
};
const browser = await pw.chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const errors = [];
async function shot(...args) {
  try {
    await shotInner(...args);
  } catch (e) {
    errors.push(`${args[0]}/${args[2]}: сбой съёмки — ${e.message.split("\n")[0]}`);
  }
}
async function shotInner(name, [w, h, mobile], mode, { scrolls = [], full = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    isMobile: mobile,
    hasTouch: mobile,
    javaScriptEnabled: mode !== "nojs",
    reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
  });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(`${name}/${mode}: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${name}/${mode}: ${e.message}`));
  page.on("framenavigated", (f) => f === page.mainFrame() && navs++ > 0 && errors.push(`${name}/${mode}: повторная навигация ${f.url()}`));
  let navs = 0;
  const q = (url.includes("?") ? "&" : "?") + "nopl" + (mode === "nowebgl" ? "&nowebgl" : "");
  await page.goto(url + (url.startsWith("file:") ? "" : q), { waitUntil: "load" });
  await page.waitForTimeout(mode === "webgl" ? 6000 : 1200);
  const tag = `${name}-${mode}`;
  await page.screenshot({ path: `${out}/${tag}-0.png` });
  const hasHScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (hasHScroll) errors.push(`${tag}: горизонтальная прокрутка ${await page.evaluate(() => document.documentElement.scrollWidth)}`);
  for (const [i, y] of scrolls.entries()) {
    await page.evaluate((y) => window.scrollTo(0, typeof y === "string" ? document.querySelector(y).getBoundingClientRect().top + window.scrollY : y), y);
    await page.waitForTimeout(mode === "webgl" ? 1600 : 700);
    await page.screenshot({ path: `${out}/${tag}-${i + 1}.png` });
  }
  if (full && mode !== "nojs") {
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 500) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 60));
      }
    });
    await page.waitForTimeout(800);
  }
  if (full) await page.screenshot({ path: `${out}/${tag}-full.png`, fullPage: true });
  await ctx.close();
}
const pinStops = (h) => ["#mirror", h * 0.9 + "", "", ""];
if (set === "hero") {
  for (const [n, s] of Object.entries(SIZES)) await shot(n, s, "webgl");
} else if (set === "quick") {
  await shot("d1440", SIZES.d1440, "webgl", { scrolls: [] });
  await shot("m390", SIZES.m390, "webgl", { scrolls: [] });
} else if (set === "stages") {
  for (const n of ["d1440", "m390"]) {
    const [w, h] = SIZES[n];
    const ctx = null;
    await shot(n, SIZES[n], "webgl", {
      scrolls: [0.5, 0.95, 1.6, 2.1, 2.9, 3.4, 4.3, 4.85].map((k) => Math.round(h * (1 + k))),
    });
  }
} else if (set === "all") {
  for (const [n, s] of Object.entries(SIZES)) {
    for (const mode of ["webgl", "nowebgl", "reduced", "nojs"]) {
      await shot(n, s, mode, { full: mode !== "webgl" && (n === "d1440" || n === "m390") });
    }
  }
}
await browser.close();
console.log(errors.length ? "ОШИБКИ:\n" + errors.join("\n") : "без ошибок в консоли");
