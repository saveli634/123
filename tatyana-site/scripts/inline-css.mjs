// Встраивает стили в index.html (сборка для хостинга): на один сетевой запрос меньше
// до первой отрисовки. Пути к шрифтам переписываются относительно корня сайта.
// Использование: node scripts/inline-css.mjs <папка-сборки>
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const dir = process.argv[2];
const htmlPath = resolve(dir, "index.html");
let html = readFileSync(htmlPath, "utf8");
const m = html.match(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/);
if (!m) throw new Error("stylesheet link not found");
const css = readFileSync(resolve(dir, m[1]), "utf8").replace(/url\(\.\//g, "url(./assets/");
html = html.replace(m[0], () => `<style>${css}</style>`);
writeFileSync(htmlPath, html);
rmSync(resolve(dir, m[1]));
console.log(`inlined ${m[1]} (${(css.length / 1024).toFixed(0)} KB)`);
