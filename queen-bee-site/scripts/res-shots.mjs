// Скриншоты главной сцены на заданных прогрессах: node scripts/res-shots.mjs <url> <out> <WxH> p1,p2,...
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const [url, out, size = "1440x900", ps = "0,0.115,0.235,0.355,0.485,0.625,0.765,0.97"] = process.argv.slice(2);
const [w, h] = size.split("x").map(Number);
mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const mobile = w < 768;
const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile });
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.addInitScript(() => { window.__qbSnap = true; });
await p.goto(url);
await p.waitForTimeout(1500);
await p.evaluate(() => { const s = document.getElementById("rezidenciya"); window.scrollTo(0, s.getBoundingClientRect().top + window.scrollY); });
await p.waitForFunction(() => document.querySelector(".res-loaded"), null, { timeout: 60000 }).catch(() => console.log("scene not loaded"));
for (const pr of ps.split(",").map(Number)) {
  await p.evaluate((pr) => {
    const s = document.getElementById("rezidenciya");
    const top = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + pr * (s.offsetHeight - window.innerHeight));
  }, pr);
  await p.waitForTimeout(2600);
  await p.screenshot({ path: `${out}/res-${size}-${pr}.png` });
}
await b.close();
