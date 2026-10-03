// Рендеры той же 3D-спирали для телефонов без WebGL 2, reduced motion и предпросмотра без JS,
// плюс картинка Open Graph. Нужен запущенный dev-сервер (npm run dev) на порту 5173.
// Использование: node scripts/renders.mjs [http://localhost:5173]  →  renders/*.png, затем npm run images
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.argv[2] || "http://localhost:5173";
mkdirSync("renders", { recursive: true });
const shots = [
  { name: "spiral-0", p: 0.97, size: [1600, 1000], overview: true }, // общий вид
  { name: "spiral-1", p: 0.115, size: [1000, 1250] },
  { name: "spiral-2", p: 0.235, size: [1000, 1250] },
  { name: "spiral-3", p: 0.355, size: [1000, 1250] },
  { name: "spiral-4", p: 0.485, size: [1000, 1250] },
  { name: "spiral-5", p: 0.625, size: [1000, 1250] },
  { name: "spiral-6", p: 0.765, size: [1000, 1250] },
  { name: "spiral-7", p: 0.97, size: [1000, 1250], overview: true },
  { name: "og", p: 0.97, size: [1200, 630], og: true, overview: true },
];
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.size[0], height: s.size[1] }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log("pageerror", e.message));
  await page.goto(`${base}/?capture=1&p=${s.p}${s.og ? "&og=1" : ""}${s.overview ? "&view=overview" : ""}`);
  await page.waitForFunction(() => window.__qbCaptureReady, null, { timeout: 120000 });
  await page.screenshot({ path: `renders/${s.name}.png` });
  console.log("render", s.name);
  await page.close();
}
await browser.close();
