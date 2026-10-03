// Собирает src/fonts.css: только кириллица и латиница, только woff2.
// Cormorant Garamond 500/600 + курсив (заголовки), Manrope Variable (текст, метки).
// Без greek/vietnamese/ext-подмножеств и без woff-дублей: меньше вес однофайловой сборки.
import { readFileSync, writeFileSync } from "node:fs";

const keep = new Set(["cyrillic", "latin"]);
let out = "/* Сгенерировано scripts/fonts.mjs — не редактировать вручную */\n";
let faces = 0;

function take(file, pkgDir, display) {
  const css = readFileSync(file, "utf8");
  for (const m of css.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face\s*{[\s\S]*?})/g)) {
    const subset = m[1].match(/-(cyrillic|latin|cyrillic-ext|latin-ext|greek|greek-ext|vietnamese|math|symbols)-(?:wght|\d{3})/)?.[1];
    if (!keep.has(subset)) continue;
    const face = m[2]
      .replace(/src:\s*url\(\.\/files\/([^)]+\.woff2)\)[^;]*;/, (_, f) => `src: url(../node_modules/${pkgDir}/files/${f}) format('woff2');`)
      .replace(/font-display: swap/, `font-display: ${display}`);
    out += `/* ${m[1]} */\n${face}\n`;
    faces++;
  }
}

for (const f of ["500", "500-italic", "600", "600-italic"])
  take(`node_modules/@fontsource/cormorant-garamond/${f}.css`, "@fontsource/cormorant-garamond", "block");
take("node_modules/@fontsource-variable/manrope/index.css", "@fontsource-variable/manrope", "swap");

writeFileSync("src/fonts.css", out);
console.log(faces, "font faces");
