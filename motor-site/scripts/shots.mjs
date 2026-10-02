/**
 * Скриншоты для самокритики (ТЗ §10): размеры × режимы, плюс проверки.
 *   node scripts/shots.mjs <раунд> [viewports] [modes]
 *   viewports: 1440x900,1280x800,390x844,375x667,360x780,844x390
 *   modes: webgl,nowebgl,reduced,nojs,file
 * Хостинг-версия (dist/) раздаётся vite preview, file:// — dist-single/index.html.
 * Результат: shots/<раунд>/<размер>-<режим>/NN.png и shots/<раунд>/report.json
 * (ошибки консоли, горизонтальная прокрутка, высота страницы).
 */
import { preview } from "vite";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, rmSync, existsSync, readdirSync, readFileSync } from "node:fs";
import sharp from "sharp";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = new URL("..", import.meta.url).pathname;
const round = process.argv[2] || "r1";
const VPS = (process.argv[3] || "1440x900,1280x800,390x844,375x667,360x780,844x390").split(",");
const MODES = (process.argv[4] || "webgl,nowebgl,reduced,nojs,file").split(",");
const OUT = join(ROOT, "shots", round);
const RESUME = process.argv.includes("--resume");
if (!RESUME) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const server = await preview({ root: ROOT, logLevel: "error", preview: { port: 4179, strictPort: true } });
const base = "http://localhost:4179/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const reportPath = join(OUT, "report.json");
const report = RESUME && existsSync(reportPath) ? JSON.parse(readFileSync(reportPath, "utf8")) : [];

async function run(vp, mode) {
  const [w, h] = vp.split("x").map(Number);
  const dir = join(OUT, `${vp}-${mode}`);
  if (RESUME && existsSync(dir) && readdirSync(dir).length > 2) return;
  const phone = w < 768 || (w < 900 && h < 500);
  const args = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
  if (mode === "nowebgl") args.push("--disable-3d-apis");
  const browser = await chromium.launch({ args });
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: phone ? 2 : 1,
    isMobile: phone,
    hasTouch: phone,
    reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
    javaScriptEnabled: mode !== "nojs",
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  const url = mode === "file" ? pathToFileURL(join(ROOT, "dist-single", "index.html")).href : `${base}?noadapt&snap`;
  await page.goto(url, { waitUntil: "load" });
  mkdirSync(dir, { recursive: true });
  if (mode === "nojs") {
    // Без скриптов: прокрутка колесом (работает без JS), кадр за кадром, пока страница не кончится
    await sleep(800);
    let prev = null;
    let i = 0;
    for (; i < 40; i++) {
      const shot = await page.screenshot();
      if (prev && Buffer.compare(prev, shot) === 0) break;
      writeFileSync(join(dir, `${String(i).padStart(2, "0")}.png`), shot);
      prev = shot;
      await page.mouse.move(w / 2, h / 2);
      await page.mouse.wheel(0, Math.round(h * 0.85));
      await sleep(450);
    }
    report.push({ vp, mode, frames: i, errors, overflow: { sw: null, vw: w, bad: [] } });
    console.log(`${vp} ${mode}: ${i} кадров (колесо)`);
    await browser.close();
    return;
  }
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await sleep(1700);
  const info = await page.evaluate(() => ({
    sh: document.documentElement.scrollHeight,
    sw: document.documentElement.scrollWidth,
    iw: window.innerWidth,
    cls: document.documentElement.className,
  }));
  // Кадры по высоте страницы: шаг ~0.85 экрана, но не больше 34 кадров
  const step = Math.max(h * 0.85, (info.sh - h) / 33);
  let i = 0;
  const ys = [];
  for (let y = 0; y < info.sh - h - 40; y += step) ys.push(y);
  ys.push(Math.max(0, info.sh - h));
  for (const y of ys) {
    await page.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)), y);
    // дождаться реальных кадров (в headless WebGL рисуется программно и медленно)
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    await sleep(mode === "webgl" ? 1300 : 650);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.screenshot({ path: join(dir, `${String(i).padStart(2, "0")}.png`) });
    i++;
  }
  const overflow = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > vw + 1 || r.left < -1) && getComputedStyle(el).position !== "fixed") {
        const s = el.className && typeof el.className === "string" ? el.className.split(" ")[0] : el.tagName;
        if (!bad.includes(s)) bad.push(s);
      }
    });
    return { sw: document.documentElement.scrollWidth, vw, bad: bad.slice(0, 12) };
  });
  report.push({ vp, mode, frames: i, errors, ...info, overflow });
  console.log(`${vp} ${mode}: ${i} кадров, ошибок ${errors.length}, scrollWidth ${overflow.sw}/${overflow.vw}`);
  await browser.close();
}

try {
  for (const vp of VPS)
    for (const mode of MODES) {
      try {
        await run(vp, mode);
      } catch (e) {
        report.push({ vp, mode, fatal: String(e && e.message) });
        console.log(`${vp} ${mode}: ОШИБКА ${e && e.message}`);
      }
      writeFileSync(reportPath, JSON.stringify(report, null, 1));
    }
} finally {
  writeFileSync(reportPath, JSON.stringify(report, null, 1));
  await new Promise((r) => server.httpServer.close(r));
}
