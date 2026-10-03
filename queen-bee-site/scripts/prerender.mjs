// Вставляет готовую HTML-разметку страницы в собранный index.html (текст виден без скриптов).
// Для версии хостинга ещё и встраивает CSS (без лишнего запроса перед первой отрисовкой)
// и ставит preload на шрифты первого экрана.
// Использование: node scripts/prerender.mjs <папка-сборки> <папка-ssr>
import { readFileSync, writeFileSync, rmSync, existsSync, readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const [outDir, ssrDir] = process.argv.slice(2);
const htmlPath = resolve(outDir, "index.html");
const { render } = await import(pathToFileURL(resolve(ssrDir, "entry-server.js")).href);

let html = readFileSync(htmlPath, "utf8");
if (!html.includes('<div id="root"></div>')) throw new Error("root not found");
html = html.replace('<div id="root"></div>', `<div id="root">${render()}</div>`);

const assets = resolve(outDir, "assets");
if (existsSync(assets)) {
  // CSS → <style>: пути к шрифтам и картинкам внутри CSS перестраиваем от корня
  html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+\.css)"[^>]*>/, (_, file) => {
    const css = readFileSync(join(assets, file), "utf8").replace(/url\((?!data:)(["']?)(?:\.\/)?([^"')]+)\1\)/g, "url($1./assets/$2$1)");
    return `<style>${css}</style>`;
  });
  // preload шрифтов первого экрана: заголовок (латиница 500, прямой и курсив) и текст
  const files = readdirSync(assets);
  const pick = (re) => files.find((f) => re.test(f));
  const fonts = [
    pick(/^cormorant-garamond-latin-500-normal-.*\.woff2$/),
    pick(/^cormorant-garamond-latin-500-italic-.*\.woff2$/),
    pick(/^cormorant-garamond-cyrillic-500-normal-.*\.woff2$/),
    pick(/^manrope-cyrillic-wght-normal-.*\.woff2$/),
  ].filter(Boolean);
  const links = fonts.map((f) => `<link rel="preload" as="font" type="font/woff2" href="./assets/${f}" crossorigin>`).join("");
  html = html.replace("</title>", `</title>${links}`);
}
writeFileSync(htmlPath, html);
rmSync(ssrDir, { recursive: true, force: true });
console.log(`prerendered -> ${htmlPath}`);
