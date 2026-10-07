// Встраивает стили во все HTML-страницы сборки для хостинга: на один сетевой запрос меньше
// до первой отрисовки. Пути к шрифтам переписываются относительно корня сайта.
// Использование: node scripts/inline-css.mjs <папка-сборки>
import { readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const dir = process.argv[2];
const used = new Set();
for (const f of readdirSync(dir).filter((x) => x.endsWith(".html"))) {
  const htmlPath = resolve(dir, f);
  let html = readFileSync(htmlPath, "utf8");
  const m = html.match(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/);
  if (!m) continue;
  const css = readFileSync(resolve(dir, m[1]), "utf8").replace(/url\(\.\//g, "url(./assets/");
  html = html.replace(m[0], () => `<style>${css}</style>`);
  writeFileSync(htmlPath, html);
  used.add(m[1]);
  console.log(`inlined ${m[1]} -> ${f} (${(css.length / 1024).toFixed(0)} KB)`);
}
for (const f of used) rmSync(resolve(dir, f));
