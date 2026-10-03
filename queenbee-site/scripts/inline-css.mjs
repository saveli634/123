// Встраивает CSS в index.html обычной сборки — без отдельного блокирующего запроса.
// Пути к шрифтам переписываются относительно страницы. Использование: node scripts/inline-css.mjs dist
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
const dir = process.argv[2];
const htmlPath = resolve(dir, "index.html");
let html = readFileSync(htmlPath, "utf8");
const m = html.match(/<link rel="stylesheet"[^>]*href="(\.\/assets\/[^"]+\.css)"[^>]*>/);
if (!m) throw new Error("css link not found");
const cssPath = resolve(dir, m[1]);
const base = dirname(m[1]); // ./assets
const css = readFileSync(cssPath, "utf8").replace(/url\((["']?)(?!data:|https?:|\/)([^)"']+)\1\)/g, (_s, q, u) => `url(${q}${base}/${u.replace(/^\.\//, "")}${q})`);
html = html.replace(m[0], `<style>${css}</style>`);
writeFileSync(htmlPath, html);
rmSync(cssPath);
console.log(`inline css: ${(css.length / 1024).toFixed(0)} KB`);
