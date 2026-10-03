// Кадры прелоадера: останавливаем CSS-анимации и выставляем время вручную (скриншоты в headless медленные).
// node scripts/qa/intro.mjs --out qa/intro
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { serve } from "./serve.mjs";

const OUT = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "qa/intro";
mkdirSync(OUT, { recursive: true });
const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
const dir = existsSync(base) && readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
const executablePath = process.env.CHROME_PATH || (dir ? join(base, dir, "chrome-linux", "chrome") : undefined);
const server = await serve("dist", 4177);
const browser = await chromium.launch({ executablePath });
for (const [w, h] of [
  [1440, 900],
  [390, 844],
]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(server.url, { waitUntil: "domcontentloaded" });
  for (const ms of [150, 400, 700, 1000, 1150]) {
    await page.evaluate((t) => {
      document.getAnimations().forEach((a) => {
        if (!(a.effect?.target instanceof Element) || !a.effect.target.closest(".intro")) return;
        a.pause();
        a.currentTime = t;
      });
    }, ms);
    await page.screenshot({ path: `${OUT}/intro_${w}_${ms}.png` });
  }
  await page.close();
}
await browser.close();
server.close();
