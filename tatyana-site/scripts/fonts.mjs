// Собирает src/fonts.css только с кириллицей и латиницей (без greek/vietnamese/…):
// меньше вес, особенно в однофайловой сборке, где шрифты встраиваются в HTML.
import { readFileSync, writeFileSync } from "node:fs";

const keep = new Set(["cyrillic", "latin"]);
const sources = [
  // Cormorant Garamond: заголовки и числа, прямой и курсив
  ...["300", "400", "500"].flatMap((w) => [
    { pkg: "@fontsource/cormorant-garamond", file: `${w}.css`, name: "cormorant-garamond" },
    { pkg: "@fontsource/cormorant-garamond", file: `${w}-italic.css`, name: "cormorant-garamond" },
  ]),
  // Manrope: основной текст (вариативный)
  { pkg: "@fontsource-variable/manrope", file: "index.css", name: "manrope" },
];

let out = "/* Сгенерировано scripts/fonts.mjs — не редактировать вручную */\n";
let n = 0;
for (const { pkg, file, name } of sources) {
  const css = readFileSync(`node_modules/${pkg}/${file}`, "utf8");
  for (const m of css.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face\s*{[\s\S]*?})/g)) {
    const rest = m[1].replace(`${name}-`, "");
    const subset = rest.match(/^(cyrillic-ext|latin-ext|[a-z]+)/)[1];
    if (!keep.has(subset)) continue;
    out += `/* ${m[1]} */\n` + m[2].replace(/url\(\.\/files\//g, `url(../node_modules/${pkg}/files/`).replace(/,\s*url\([^)]*\.woff\)\s*format\('woff'\)/g, "") + "\n";
    n++;
  }
}
writeFileSync("src/fonts.css", out);
console.log(n, "font faces");
