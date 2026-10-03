// Проверка интерактива: прелоадер, RU/EN, форма записи, подсветка карточек, магнитная кнопка,
// наклейка (отгиб и перенос), шторка «было/стало». node scripts/qa/interact.mjs --out qa/interact
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { serve } from "./serve.mjs";

const OUT = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : "qa/interact";
mkdirSync(OUT, { recursive: true });
const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
const dir = existsSync(base) && readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
const executablePath = process.env.CHROME_PATH || (dir ? join(base, dir, "chrome-linux", "chrome") : undefined);

const server = await serve("dist", 4175);
const browser = await chromium.launch({
  executablePath,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const log = [];
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const scrollTo = async (sel, off = 0) => {
  await page.evaluate(
    ([s, o]) => {
      const el = document.querySelector(s);
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + o);
    },
    [sel, off],
  );
  await page.waitForTimeout(900);
};

// 1) прелоадер: первый заход
await page.goto(server.url, { waitUntil: "commit" });
for (const ms of [250, 600, 1000]) {
  await page.waitForTimeout(ms === 250 ? 250 : ms === 600 ? 350 : 400);
  await shot(`intro_${ms}`);
}
await page.waitForTimeout(1500);
await shot("hero_after_intro");
log.push({ introClasses: await page.evaluate(() => document.documentElement.className) });

// 2) RU → EN без перезагрузки
await page.evaluate(() => (window.__probe = 1));
await page.click(".lang button:nth-of-type(2)");
await page.waitForTimeout(800);
log.push({
  enTitle: await page.title(),
  enLang: await page.evaluate(() => document.documentElement.lang),
  enUrl: page.url(),
  noReload: await page.evaluate(() => window.__probe === 1),
  enH1: await page.evaluate(() => document.querySelector("h1")?.textContent),
});
await shot("hero_en");
await page.click(".lang button:nth-of-type(1)");
await page.waitForTimeout(500);
log.push({ backTitle: await page.title(), backUrl: page.url() });

// 3) форма записи
await page.click("header .btn");
await page.waitForTimeout(700);
await page.click("form button[type='submit'], form .fill").catch(() => {});
await shot("dialog_open");
const dlg = await page.evaluate(() => ({
  open: !!document.querySelector("[role='dialog']"),
  title: document.querySelector("[role='dialog'] h2")?.textContent,
  fields: [...document.querySelectorAll("[role='dialog'] input, [role='dialog'] textarea")].map((i) => i.name),
}));
log.push({ dialog: dlg });
await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// 4) подсветка карточки и магнитная кнопка
await scrollTo("#services", 0);
const card = page.locator(".card").nth(1);
const box = await card.boundingBox();
await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.35, { steps: 6 });
await page.waitForTimeout(600);
await shot("card_glow");
const btn = page.locator(".card .btn").first();
const bb = await btn.boundingBox();
await page.mouse.move(bb.x + bb.width * 0.9, bb.y + bb.height * 0.9, { steps: 5 });
await page.waitForTimeout(400);
log.push({ magnetic: await btn.evaluate((el) => [el.style.getPropertyValue("--tx"), el.style.getPropertyValue("--ty")]) });
await btn.click();
await page.waitForTimeout(500);
await shot("price_answer");

// 5) наклейка: отгиб уголка и перенос
await scrollTo("[aria-labelledby='sticker-title']", 200);
const hit = await page.locator(".sticker-hit").boundingBox();
const sx = hit.x + hit.width * 0.86;
const sy = hit.y + hit.height * 0.86;
await page.mouse.move(sx, sy, { steps: 4 });
await page.waitForTimeout(500);
await shot("sticker_hover");
await page.mouse.down();
for (let i = 1; i <= 8; i++) await page.mouse.move(sx - i * 14, sy - i * 14);
await page.waitForTimeout(150);
await shot("sticker_peel");
for (let i = 9; i <= 30; i++) await page.mouse.move(sx - i * 14, sy - i * 12);
await page.waitForTimeout(400);
await shot("sticker_hold");
await page.mouse.move(sx - 200, sy - 260, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(700);
await shot("sticker_moved");
log.push({ stickerReset: await page.locator(".sticker-zone .btn").count() });

// 6) шторка «было / стало»
await scrollTo("[aria-labelledby='ba-title']", 300);
const ba = await page.locator(".ba").first().boundingBox();
await page.mouse.move(ba.x + ba.width * 0.5, ba.y + ba.height * 0.5);
await page.mouse.down();
await page.mouse.move(ba.x + ba.width * 0.18, ba.y + ba.height * 0.5, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(300);
await shot("ba_drag");
log.push({ baValue: await page.locator(".ba").first().getAttribute("aria-valuenow") });

writeFileSync(`${OUT}/interact.json`, JSON.stringify({ log, errors }, null, 2));
console.log(JSON.stringify({ log, errors }, null, 2));
await browser.close();
server.close();
