// Рендеры глобуса через headless Chromium — те же шейдеры и данные, что у живой сцены.
//   src/assets/renders/globe-0.webp   — горизонт для первого экрана (широкий экран)
//   src/assets/renders/globe-0m.webp  — то же для телефона
//   src/assets/renders/globe-1…5.webp — этапы карты (глобус по центру, радиус 0.42 стороны)
//   src/generated/renders.css         — классы .r-0…5 (Vite встроит их в site.html, в dist — файлами)
//   public/og.jpg                     — картинка для Open Graph 1200×630
// Запуск: node scripts/render-globe.mjs   (нужен Chromium: PLAYWRIGHT_BROWSERS_PATH или CHROME_PATH)
import { createServer } from "vite";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (existsSync(base)) {
    const dir = readdirSync(base).find((d) => /^chromium-\d+$/.test(d));
    if (dir) return join(base, dir, "chrome-linux", "chrome");
  }
  return undefined; // пусть playwright-core ищет сам
}

const OUT = "src/assets/renders";
mkdirSync(OUT, { recursive: true });
const server = await createServer({ server: { port: 5199, strictPort: false }, logLevel: "error" });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({
  executablePath: chromePath(),
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
page.on("pageerror", (e) => console.error("pageerror:", e.message));
await page.goto(`${url}render.html`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });

const grab = async (t, w, h, shot) =>
  Buffer.from(
    (await page.evaluate(([t, w, h, s]) => window.__still(t, w, h, s), [t, w, h, shot])).split(",")[1],
    "base64",
  );

const sizes = {};
// первый экран: кадр как на сайте, берём нижнюю половину с горизонтом
for (const [name, w, h] of [
  ["globe-0", 1600, 1000],
  ["globe-0m", 780, 1688],
]) {
  const png = await grab(-1, w, h, "actual");
  const file = `${OUT}/${name}.webp`;
  await sharp(png)
    .resize(w, h)
    .extract({ left: 0, top: Math.round(h / 2), width: w, height: Math.round(h / 2) })
    .webp({ quality: 72, alphaQuality: 80, effort: 6 })
    .toFile(file);
  sizes[name] = statSync(file).size;
}
// этапы 1…5: квадрат, глобус по центру
for (let i = 0; i <= 4; i++) {
  const png = await grab(i, 1100, 1100);
  const file = `${OUT}/globe-${i + 1}.webp`;
  await sharp(png).resize(1100, 1100).webp({ quality: 70, alphaQuality: 75, effort: 6 }).toFile(file);
  sizes[`globe-${i + 1}`] = statSync(file).size;
}

writeFileSync(
  "src/generated/renders.css",
  `/* Сгенерировано scripts/render-globe.mjs — рендеры глобуса для запасного режима */
.r-0{background-image:url(../assets/renders/globe-0.webp)}
@media (max-aspect-ratio:9/10){.r-0{background-image:url(../assets/renders/globe-0m.webp)}}
${[1, 2, 3, 4, 5].map((i) => `.r-${i}{background-image:url(../assets/renders/globe-${i}.webp)}`).join("\n")}
`,
);

// Open Graph
await page.evaluate(() => window.__og());
await page.waitForTimeout(300);
const og = await page.locator("#og").screenshot({ type: "png" });
await sharp(og).jpeg({ quality: 86, mozjpeg: true }).toFile("public/og.jpg");

await browser.close();
await server.close();
console.log(
  "renders:",
  Object.entries(sizes)
    .map(([k, v]) => `${k} ${(v / 1024).toFixed(0)}KB`)
    .join(", "),
);
