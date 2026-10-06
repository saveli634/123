// Собирает src/fonts.css: только кириллица и латиница (меньше вес однофайловой сборки).
// Cormorant Garamond (заголовки, прямой и курсив), Manrope (текст), Pinyon Script (запасной
// каллиграфический шрифт для названия, если оно не из готовых векторных надписей; только латиница).
import { readFileSync, writeFileSync } from "node:fs";

const keep = new Set(["cyrillic", "latin"]);
const sources = [
  ["@fontsource-variable/cormorant-garamond", "index.css"],
  ["@fontsource-variable/cormorant-garamond", "wght-italic.css"],
  ["@fontsource-variable/manrope", "index.css"],
  ["@fontsource/pinyon-script", "400.css"],
];
let out = "/* Сгенерировано scripts/fonts.mjs — не редактировать вручную */\n";
let n = 0;
for (const [pkg, file] of sources) {
  const css = readFileSync(`node_modules/${pkg}/${file}`, "utf8");
  for (const m of css.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face\s*{[\s\S]*?})/g)) {
    const subset = m[1].match(/-(cyrillic|latin|latin-ext|cyrillic-ext|greek|greek-ext|vietnamese|math|symbols)(?:-wght|-400)/)?.[1];
    if (!keep.has(subset)) continue;
    // только woff2 (запасной woff не нужен и лишний в однофайловой сборке)
    const face = m[2].replace(/,\s*url\([^)]+\.woff\) format\('woff'\)/g, "");
    out += `/* ${m[1]} */\n` + face.replace(/url\(\.\/files\//g, `url(../node_modules/${pkg}/files/`) + "\n";
    n++;
  }
}
writeFileSync("src/fonts.css", out);
console.log(n, "font faces");
