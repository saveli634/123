/**
 * Lighthouse (мобильный профиль по умолчанию) на хостинг-версии dist/.
 *   node scripts/lighthouse.mjs [папка-отчёта]
 * Chrome — тот, что ставит Playwright (CHROME_PATH можно задать вручную).
 */
import { preview } from "vite";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, process.argv[2] || "release/lighthouse");
mkdirSync(OUT, { recursive: true });

const server = await preview({ root: ROOT, logLevel: "error", preview: { port: 4190, strictPort: true } });
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROME_PATH || chromium.executablePath(),
  chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
});
try {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const r = await lighthouse("http://localhost:4190/", { port: chrome.port, output: ["html", "json"], logLevel: "error" });
    const c = r.lhr.categories;
    const a = r.lhr.audits;
    const row = {
      performance: Math.round(c.performance.score * 100),
      accessibility: Math.round(c.accessibility.score * 100),
      bestPractices: Math.round(c["best-practices"].score * 100),
      seo: Math.round(c.seo.score * 100),
      fcp: a["first-contentful-paint"].displayValue,
      lcp: a["largest-contentful-paint"].displayValue,
      tbt: a["total-blocking-time"].displayValue,
      cls: a["cumulative-layout-shift"].displayValue,
      si: a["speed-index"].displayValue,
    };
    runs.push(row);
    console.log(`run ${i + 1}:`, JSON.stringify(row));
    if (i === 0) {
      writeFileSync(join(OUT, "lighthouse-mobile.html"), r.report[0]);
      writeFileSync(join(OUT, "lighthouse-mobile.json"), r.report[1]);
    }
  }
  writeFileSync(join(OUT, "summary.json"), JSON.stringify(runs, null, 1));
} finally {
  await chrome.kill();
  await new Promise((r) => server.httpServer.close(r));
}
