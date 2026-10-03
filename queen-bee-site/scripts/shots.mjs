// Скриншоты для проверки: node scripts/shots.mjs <url> <папка> [режимы через запятую] [ширины]
// Режимы: webgl (по умолчанию), nowebgl, rm (reduced motion), nojs.
// Снимает «первый экран» и прокрутку по странице с паузами (чтобы сработали проявления и сцена).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const [url, outDir = "qa/shots", modesArg = "webgl", sizesArg] = process.argv.slice(2);
const modes = modesArg.split(",");
const sizes = (sizesArg || "1440x900,390x844").split(",").map((s) => s.split("x").map(Number));
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const errors = [];
for (const mode of modes) {
  for (const [w, h] of sizes) {
    const mobile = w < 768;
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: mobile ? 2 : 1,
      isMobile: mobile,
      hasTouch: mobile,
      javaScriptEnabled: mode !== "nojs",
      reducedMotion: mode === "rm" ? "reduce" : "no-preference",
    });
    if (mode === "nowebgl") {
      await ctx.addInitScript(() => {
        const orig = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...a) {
          if (type === "webgl2" || type === "webgl") return null;
          return orig.call(this, type, ...a);
        };
      });
    }
    const page = await ctx.newPage();
    page.on("console", (m) => m.type() === "error" && errors.push(`[${mode} ${w}x${h}] ${m.text()}`));
    page.on("pageerror", (e) => errors.push(`[${mode} ${w}x${h}] ${e.message}`));
    await page.addInitScript(() => { window.__qbSnap = true; });
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(2600);
    const tag = `${mode}-${w}x${h}`;
    await page.screenshot({ path: join(outDir, `${tag}-00-hero.png`) });
    const step = Math.round(h * 0.9);
    let i = 1;
    // высота страницы может вырасти (живая 3D-сцена включается при подходе) — пересчитываем
    for (let y = step; y < (await page.evaluate(() => document.documentElement.scrollHeight)) - h + step; y += step) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(mode === "webgl" ? 1100 : 700);
      await page.screenshot({ path: join(outDir, `${tag}-${String(i).padStart(2, "0")}.png`) });
      i++;
      if (i > 60) break;
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (overflow > 0) errors.push(`[${mode} ${w}x${h}] horizontal overflow ${overflow}px`);
    await ctx.close();
  }
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no console errors, no horizontal overflow");
