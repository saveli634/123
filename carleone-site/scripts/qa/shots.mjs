// Скриншоты для самопроверки (Playwright + Chromium).
// node scripts/qa/shots.mjs --out qa/round1 [--sizes 1440x900,390x844] [--modes webgl,nowebgl,reduced,nojs,file,en] [--points hero,s1,...]
// Режимы: webgl — живой глобус; nowebgl — без WebGL (рендеры); reduced — prefers-reduced-motion;
// nojs — без JavaScript; file — site.html с диска (file://); en — английская версия (en.html).
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { serve } from "./serve.mjs";

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : d;
};
const OUT = arg("out", "qa/shots");
const SIZES = arg("sizes", "1440x900,1280x800,390x844,375x667,360x780,844x390")
  .split(",")
  .map((s) => s.split("x").map(Number));
const MODES = arg("modes", "webgl,nowebgl,reduced,nojs,file,en").split(",");
const POINTS = arg(
  "points",
  "hero,marquee,s1,s2,s3,s4,s5,services,radiator,ba,sticker,travellers,works,contacts,footer",
).split(",");
const WAIT = Number(arg("wait", "1300"));

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  const dir = existsSync(base) && readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
  return dir ? join(base, dir, "chrome-linux", "chrome") : undefined;
}

const GL = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const server = await serve("dist", 4173);
const report = [];
mkdirSync(OUT, { recursive: true });

for (const mode of MODES) {
  const browser = await chromium.launch({
    executablePath: chromePath(),
    args: mode === "nowebgl" ? ["--disable-3d-apis", "--disable-webgl"] : GL,
  });
  for (const [w, h] of SIZES) {
    const mobile = w < 768 || (w > h && h < 500);
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      isMobile: mobile,
      hasTouch: mobile,
      javaScriptEnabled: mode !== "nojs",
      reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
    });
    // повторный заход — без прелоадера (кроме первого снимка webgl, где он нужен для проверки)
    await ctx.addInitScript(() => {
      try {
        if (!location.search.includes("intro")) localStorage.setItem("cl-intro", "1");
      } catch {}
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    const url =
      mode === "file" ? `file://${resolve("site.html")}` : mode === "en" ? `${server.url}en.html` : server.url;
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(mode === "nojs" ? 300 : 1600);
    // «действие пользователя» — для ленивой загрузки глобуса
    await page.mouse.move(w / 2, h / 2).catch(() => {});
    await page.evaluate(() => window.scrollTo(0, 1));
    await page.waitForTimeout(mode === "webgl" || mode === "file" || mode === "en" ? 2500 : 500);

    const pos = await page.evaluate(() => {
      const top = (el) => (el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null);
      const q = (s) => document.querySelector(s);
      const vh = window.innerHeight;
      const map = q("#map");
      const mt = top(map);
      const mh = map ? map.offsetHeight - vh : 0;
      const pin = (el, f) => (el ? top(el) + f * Math.max(0, el.offsetHeight - vh) : null);
      return {
        hero: 0,
        marquee: Math.round(vh * 0.55),
        s1: mt + 0.1 * mh,
        s2: mt + 0.3 * mh,
        s3: mt + 0.5 * mh,
        s4: mt + 0.7 * mh,
        s5: mt + 0.93 * mh,
        services: top(q("#services")),
        radiator: pin(q(".pin-250"), 0.62),
        ba: top(q("[aria-labelledby='ba-title']")),
        sticker: top(q("[aria-labelledby='sticker-title']")) + vh * 0.25,
        travellers: top(q(".travellers")),
        works: pin(q("#works"), 0.4),
        contacts: top(q("#contacts")),
        footer: document.documentElement.scrollHeight - vh,
      };
    });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    for (const p of POINTS) {
      if (pos[p] == null) continue;
      await page.evaluate((y) => window.scrollTo(0, y), Math.round(pos[p]));
      await page.waitForTimeout(p.startsWith("s") && mode !== "nojs" ? WAIT + 600 : WAIT);
      await page.screenshot({ path: `${OUT}/${mode}_${w}x${h}_${p}.png` });
    }
    report.push({ mode, size: `${w}x${h}`, overflow, errors });
    console.log(`${mode} ${w}x${h}: overflow ${overflow}px, errors ${errors.length}`);
    await ctx.close();
  }
  await browser.close();
}
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
server.close();
