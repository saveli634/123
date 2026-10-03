// Lighthouse (мобильный профиль по умолчанию) для собранной версии dist/ на локальном сервере с gzip.
// Lighthouse 13.0.1 — версия под Chromium 141 из этого окружения (13.5 с ним падает на навигации).
// node scripts/qa/lighthouse.mjs [--out qa/lighthouse] [--page en.html] [--desktop]
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { serve } from "./serve.mjs";

const arg = (k, d) => (process.argv.includes(`--${k}`) ? process.argv[process.argv.indexOf(`--${k}`) + 1] : d);
const OUT = arg("out", "qa/lighthouse");
const PAGE = arg("page", "");
const desktop = process.argv.includes("--desktop");
mkdirSync(OUT, { recursive: true });
const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
const dir = existsSync(base) && readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
const executablePath = process.env.CHROME_PATH || (dir ? join(base, dir, "chrome-linux", "chrome") : undefined);

const server = await serve("dist", 4181);
const name = arg("name", `${desktop ? "desktop" : "mobile"}${PAGE ? "-" + PAGE.replace(/\W+/g, "") : ""}`);
// spawn, а не spawnSync: сервер живёт в этом же процессе и должен отвечать, пока идёт аудит
const r = await new Promise((done) => {
  const child = spawn(
    "npx",
    [
      "-y",
      "lighthouse@13.0.1",
      server.url + PAGE,
      "--quiet",
      // без GPU: в этом окружении GPU-процесс headless-Chromium падает при записи трассы
      "--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage --disable-gpu",
      "--output=json",
      "--output=html",
      `--output-path=${OUT}/${name}`,
      `--only-categories=${arg("cats", "performance,accessibility,best-practices,seo")}`,
      ...(desktop ? ["--preset=desktop"] : []),
    ],
    { stdio: "inherit", env: { ...process.env, CHROME_PATH: executablePath ?? "" } },
  );
  child.on("exit", (status) => done({ status }));
});
server.close();
if (r.status !== 0) process.exit(r.status ?? 1);
const j = JSON.parse(readFileSync(`${OUT}/${name}.report.json`, "utf8"));
const c = j.categories;
const a = j.audits;
console.log(
  JSON.stringify(
    {
      performance: c.performance?.score,
      accessibility: c.accessibility?.score,
      bestPractices: c["best-practices"]?.score,
      seo: c.seo?.score,
      FCP: a["first-contentful-paint"]?.displayValue,
      LCP: a["largest-contentful-paint"]?.displayValue,
      TBT: a["total-blocking-time"]?.displayValue,
      CLS: a["cumulative-layout-shift"]?.numericValue,
      SpeedIndex: a["speed-index"]?.displayValue,
    },
    null,
    1,
  ),
);
for (const [k, x] of Object.entries(a))
  if (x.score !== null && x.score < 0.9 && !["informative", "notApplicable", "manual"].includes(x.scoreDisplayMode))
    console.log("-", k, x.score, x.displayValue ?? "");
