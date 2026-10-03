// Вставляет готовую разметку страницы, описание и JSON-LD в собранный index.html.
// Использование: node scripts/prerender.mjs <папка-сборки> <папка-ssr>
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [outDir, ssrDir] = process.argv.slice(2);
const htmlPath = resolve(outDir, "index.html");
const { render, head } = await import(pathToFileURL(resolve(ssrDir, "entry-server.js")).href);

let html = readFileSync(htmlPath, "utf8");
if (!html.includes('<div id="root"></div>')) throw new Error("root not found");
const h = head();
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
html = html
  .replace('<div id="root"></div>', `<div id="root">${render()}</div>`)
  .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(h.description)}" />`)
  .replace("</head>", `<script type="application/ld+json">${h.jsonld.replace(/</g, "\\u003c")}</script>\n</head>`);
writeFileSync(htmlPath, html);
rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerendered -> ${htmlPath}`);
