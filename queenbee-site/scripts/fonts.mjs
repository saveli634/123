// Собирает src/fonts.css: Cormorant Garamond 500/600 + курсив 500, Manrope 400/600.
// Только кириллица и латиница — меньше вес, особенно в однофайловой сборке.
import { readFileSync, writeFileSync } from "node:fs";

const want = [
  ["cormorant-garamond", ["500", "600", "500-italic"]],
  ["manrope", ["400", "600"]],
];
const keep = ["cyrillic", "latin"];
let out = "/* Сгенерировано scripts/fonts.mjs — не редактировать вручную */\n";
for (const [pkg, variants] of want) {
  for (const v of variants) {
    const css = readFileSync(`node_modules/@fontsource/${pkg}/${v}.css`, "utf8");
    for (const m of css.matchAll(/\/\* ([\w-]+) \*\/\s*(@font-face\s*{[\s\S]*?})/g)) {
      const subset = m[1].replace(`${pkg}-`, "").replace(/-\d+-(normal|italic)$/, "");
      if (!keep.includes(subset)) continue;
      out +=
        `/* ${m[1]} */\n` +
        m[2]
          .replace(/url\(\.\/files\//g, `url(../node_modules/@fontsource/${pkg}/files/`)
          .replace(/,\s*url\([^)]*\.woff\) format\('woff'\)/g, "") +
        "\n";
    }
  }
}
writeFileSync("src/fonts.css", out);
console.log(out.match(/@font-face/g).length, "font faces");
