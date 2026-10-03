// Собирает src/fonts.css из пакетов @fontsource: только нужные начертания и только кириллица + латиница,
// только woff2 (Safari 12+, все живые браузеры). В однофайловой сборке шрифты встраиваются в HTML,
// поэтому каждый лишний файл — это вес site.html.
// Запуск: node scripts/fonts.mjs
import { readFileSync, writeFileSync } from "node:fs";

const FACES = [
  ["playfair-display", "600"],
  ["playfair-display", "700"],
  ["playfair-display", "600-italic"],
  ["manrope", "400"],
  ["manrope", "600"],
];
const KEEP = ["cyrillic", "latin"];

let out = "/* Сгенерировано scripts/fonts.mjs — не редактировать вручную */\n";
let count = 0;
for (const [pkg, face] of FACES) {
  const css = readFileSync(`node_modules/@fontsource/${pkg}/${face}.css`, "utf8");
  for (const m of css.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face\s*{[\s\S]*?})/g)) {
    const subset = m[1].replace(`${pkg}-`, "").replace(/-\d{3}(-italic|-normal)?$/, "");
    if (!KEEP.includes(subset)) continue;
    const block = m[2]
      .replace(/src:[^;]+;/, (src) => {
        const woff2 = /url\(\.\/files\/([^)]+\.woff2)\)/.exec(src)[1];
        return `src: url(../node_modules/@fontsource/${pkg}/files/${woff2}) format('woff2');`;
      })
      .replace(/font-display:\s*\w+;/, "font-display: swap;");
    out += `/* ${m[1]} */\n${block}\n`;
    count++;
  }
}
writeFileSync("src/fonts.css", out);
console.log(`${count} font faces -> src/fonts.css`);
