// Вставляет готовую HTML-разметку страницы в собранный index.html.
// Использование: node scripts/prerender.mjs <папка-сборки> <папка-ssr>
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [outDir, ssrDir] = process.argv.slice(2);
const htmlPath = resolve(outDir, "index.html");
const { render } = await import(pathToFileURL(resolve(ssrDir, "entry-server.js")).href);

const html = readFileSync(htmlPath, "utf8");
if (!html.includes('<div id="root"></div>')) throw new Error("root not found");
writeFileSync(htmlPath, html.replace('<div id="root"></div>', `<div id="root">${render()}</div>`));
rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerendered -> ${htmlPath}`);
