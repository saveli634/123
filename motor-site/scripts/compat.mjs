// Совместимость со старыми браузерами (Chrome/Edge 70+, Firefox 68+, Safari 12+).
// 1) lightningcss понижает современный синтаксис CSS (вложенность и т. п.);
// 2) @csstools/postcss-cascade-layers «расплющивает» @layer, сохраняя приоритеты:
//    браузер без поддержки слоёв иначе выбрасывает всё оформление целиком.
// Использование: node scripts/compat.mjs <файл.html | папка-сборки> ...
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { transform } from "lightningcss";
import postcss from "postcss";
import cascadeLayers from "@csstools/postcss-cascade-layers";

const v = (major) => major << 16;
const targets = { chrome: v(70), edge: v(79), firefox: v(68), safari: v(12), ios_saf: v(12) };

async function fixCss(css) {
  const lowered = transform({
    filename: "style.css",
    code: Buffer.from(css),
    targets,
    minify: true,
    errorRecovery: true,
  }).code.toString();
  const flat = await postcss([cascadeLayers()]).process(lowered, { from: undefined });
  return flat.css;
}

async function fixFile(path) {
  const ext = extname(path);
  const src = readFileSync(path, "utf8");
  let out;
  if (ext === ".css") {
    out = await fixCss(src);
  } else if (ext === ".html") {
    const parts = [];
    let last = 0;
    for (const m of src.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)) {
      parts.push(src.slice(last, m.index), `<style${m[1]}>${await fixCss(m[2])}</style>`);
      last = m.index + m[0].length;
    }
    parts.push(src.slice(last));
    out = parts.join("");
  } else return;
  writeFileSync(path, out);
  const layersLeft = (out.match(/@layer/g) || []).length;
  console.log(`compat: ${path} (${(out.length / 1024).toFixed(0)} KB, @layer left: ${layersLeft})`);
}

async function walk(p) {
  if (statSync(p).isDirectory()) for (const f of readdirSync(p)) await walk(join(p, f));
  else await fixFile(p);
}

for (const p of process.argv.slice(2)) await walk(p);
