import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { serve } from "./serve.mjs";
const s = await serve("dist", 4180);
const out = process.argv[2] ?? ".scratch/lh-mobile";
const page = process.argv[3] ?? "";
const r = spawnSync("npx", ["-y", "lighthouse@13.5.0", s.url + page, "--quiet", "--output=json", "--output=html", `--output-path=${out}`,
  "--only-categories=performance,accessibility,best-practices,seo",
  "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage"], {
  env: { ...process.env, CHROME_PATH: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" }, stdio: "inherit", timeout: 300000 });
s.close();
const j = JSON.parse(readFileSync(`${out}.report.json`, "utf8"));
const c = j.categories, a = j.audits;
console.log(JSON.stringify({
  perf: c.performance.score, a11y: c.accessibility.score, bp: c["best-practices"].score, seo: c.seo.score,
  FCP: a["first-contentful-paint"].displayValue, LCP: a["largest-contentful-paint"].displayValue, TBT: a["total-blocking-time"].displayValue,
  CLS: a["cumulative-layout-shift"].numericValue, SI: a["speed-index"].displayValue,
}, null, 1));
for (const k of Object.keys(a)) { const x = a[k]; if (x.score !== null && x.score < 0.9 && x.scoreDisplayMode !== "informative" && x.scoreDisplayMode !== "notApplicable") console.log("-", k, x.score, x.displayValue ?? ""); }
