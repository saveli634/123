// Собирает src/fonts.css только с кириллицей и латиницей (без greek/vietnamese/…):
// меньше вес, особенно в однофайловой сборке, где шрифты встраиваются в HTML.
import { readFileSync, writeFileSync } from "node:fs";

const pkgs = ["oswald", "inter", "jetbrains-mono"];
const keep = new Set(["cyrillic", "latin"]);
let out = "/* Сгенерировано scripts/fonts.mjs — не редактировать вручную */\n";
for (const p of pkgs) {
  const css = readFileSync(`node_modules/@fontsource-variable/${p}/index.css`, "utf8");
  for (const m of css.matchAll(/\/\* ([\w-]+)-wght-normal \*\/\s*(@font-face\s*{[\s\S]*?})/g)) {
    const subset = m[1].replace(`${p}-`, "");
    if (!keep.has(subset)) continue;
    out += `/* ${m[1]} */\n` + m[2].replace(/url\(\.\/files\//g, `url(../node_modules/@fontsource-variable/${p}/files/`) + "\n";
  }
}
writeFileSync("src/fonts.css", out);
console.log(out.match(/@font-face/g).length, "font faces");
