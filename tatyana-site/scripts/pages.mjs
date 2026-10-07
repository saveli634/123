// Создаёт страницы для хостинга (karta.html, chislo.html…) из index.html:
// свой заголовок, описание и data-page у #root. Однофайловой сборке они не нужны.
import { readFileSync, writeFileSync } from "node:fs";

const pages = JSON.parse(readFileSync("src/data/pages.json", "utf8"));
const tpl = readFileSync("index.html", "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

for (const [id, p] of Object.entries(pages)) {
  if (id === "home") continue;
  const html = tpl
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${p.title}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/, `$1${esc(p.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(p.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(p.description)}$2`)
    .replace('<div id="root"></div>', `<div id="root" data-page="${id}"></div>`);
  if (!html.includes(`data-page="${id}"`)) throw new Error("root not found in index.html");
  writeFileSync(`${id}.html`, html);
}
console.log("pages:", Object.keys(pages).filter((k) => k !== "home").map((k) => `${k}.html`).join(", "));
