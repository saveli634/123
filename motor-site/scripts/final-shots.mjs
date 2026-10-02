/**
 * Итоговые кадры по якорям разделов (для сравнения «до/после»):
 *   node scripts/final-shots.mjs <папка> <ШxВ> [webgl|nowebgl]
 * Снимает: первый экран, этап 03, этап 06, «Цех», «Что делаем», «Аккуратность».
 */
import { preview } from "vite";
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const [outRel, vp = "1440x900", mode = "webgl"] = process.argv.slice(2);
const OUT = join(ROOT, outRel);
mkdirSync(OUT, { recursive: true });
const [w, h] = vp.split("x").map(Number);
const phone = w < 768;
const server = await preview({ root: ROOT, logLevel: "error", preview: { port: 4185, strictPort: true } });
const args = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
if (mode === "nowebgl") args.push("--disable-3d-apis");
const browser = await chromium.launch({ args });
try {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("http://localhost:4185/?noadapt&snap", { waitUntil: "load" });
  await page.waitForTimeout(2200);
  const go = async (y) => {
    await page.evaluate((y) => (window.__lenis ? window.__lenis.scrollTo(y, { immediate: true, force: true }) : window.scrollTo(0, y)), y);
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(1600);
  };
  const top = (sel) => page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, sel);
  const st = await page.evaluate(() => { const s = document.getElementById("etapy"); return { top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight }; });
  const stage = (k) => st.top + (st.h - h) * ((k + 0.5) / 6);
  const shots = [
    ["01-hero", 0],
    ["02-stage3", stage(2)],
    ["03-stage6", stage(5)],
    ["04-ceh", (await top("#ceh")) + h * 0.15],
    ["05-uslugi", (await top("#uslugi")) + h * 0.1],
    ["06-care", (await top("#akkuratnost")) + h * 0.1],
  ];
  for (const [name, y] of shots) {
    await go(y);
    await page.screenshot({ path: join(OUT, `${name}.png`) });
  }
  console.log(`${vp} ${mode}: ${shots.length} кадров, ошибок ${errors.length}`, errors.slice(0, 3));
} finally {
  await browser.close();
  await new Promise((r) => server.httpServer.close(r));
}
