// Проверка кнопок и ссылок в релизной сборке: временно заполняет src/config.ts тестовыми значениями,
// собирает build:release, проверяет tel:, wa.me (кнопки и форма записи), Instagram, «Построить маршрут»
// и отсутствие плашек «ЗАПОЛНИТЬ». Затем возвращает config.ts как был и пересобирает демо.
// node scripts/qa/links.mjs
import { chromium } from "playwright-core";
import { execSync, spawn } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { serve } from "./serve.mjs";

const CFG = "src/config.ts";
const original = readFileSync(CFG, "utf8");
const TEST = {
  city: "Тестоград",
  address: "ул. Тестовая, 1",
  workHours: "Тест: 9:00–18:00",
  phone: "+7 700 000 00 00",
  whatsapp: "77000000000",
  instagram: "https://www.instagram.com/test_profile/",
  mapLink: "https://2gis.kz/test",
  siteUrl: "https://example.kz/",
};
const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
const dir = existsSync(base) && readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
const executablePath = process.env.CHROME_PATH || (dir ? join(base, dir, "chrome-linux", "chrome") : undefined);

const results = {};
try {
  let cfg = original;
  for (const [k, v] of Object.entries(TEST)) cfg = cfg.replace(new RegExp(`(\\n  ${k}: )"[^"]*"`), `$1"${v}"`);
  writeFileSync(CFG, cfg);
  execSync("node scripts/build.mjs web --release", { stdio: "inherit" });

  const server = await serve("dist", 4190);
  const browser = await chromium.launch({ executablePath });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(() => {
    window.__opened = [];
    window.open = (u) => {
      window.__opened.push(String(u));
      return null;
    };
  });
  await page.goto(server.url, { waitUntil: "load" });
  await page.waitForTimeout(800);
  results.hrefs = await page.evaluate(() => {
    const all = [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href"));
    return {
      tel: [...new Set(all.filter((h) => h.startsWith("tel:")))],
      wa: [...new Set(all.filter((h) => h.includes("wa.me")))],
      instagram: [...new Set(all.filter((h) => h.includes("instagram.com")))],
      map: [...new Set(all.filter((h) => h.includes("2gis")))],
      fills: document.querySelectorAll(".fill").length,
      title: document.title,
    };
  });
  // форма записи → wa.me с текстом
  await page.click("header .btn");
  await page.waitForSelector("#bk-name");
  await page.fill("#bk-name", "Тест");
  await page.fill("#bk-phone", "+7 701 111 22 33");
  await page.fill("#bk-car", "Toyota Rav4");
  await page.fill("#bk-problem", "Проверка формы");
  await page.click("form button[type='submit']");
  await page.waitForTimeout(300);
  results.formOpened = await page.evaluate(() => window.__opened);
  // невалидная форма
  await page.click("header .btn");
  await page.waitForSelector("#bk-name");
  await page.click("form button[type='submit']");
  await page.waitForTimeout(200);
  results.formErrors = await page.evaluate(() => [...document.querySelectorAll(".field-err")].map((e) => e.textContent));
  results.jsonLd = await page.evaluate(() => JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent));
  results.head = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel="alternate"], link[rel="canonical"], meta[property="og:image"]')].map((e) => e.outerHTML),
  );
  await browser.close();
  server.close();
  // SEO релизной сборки с доменом (абсолютные hreflang/canonical)
  if (process.argv.includes("--seo"))
    await new Promise((done) =>
      spawn("node", ["scripts/qa/lighthouse.mjs", "--out", "qa/lighthouse", "--cats", "seo", "--name", "mobile-release-seo"], {
        stdio: "inherit",
      }).on("exit", done),
    );
} finally {
  writeFileSync(CFG, original);
  execSync("node scripts/build.mjs web", { stdio: "inherit" });
}
console.log(JSON.stringify(results, null, 2));
