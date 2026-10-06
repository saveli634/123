// Векторизует каллиграфию из её постов (004 «Lash», 008 «Angel») в SVG-контуры.
// Сначала: python3 scripts/build_media.py (готовит scripts/.trace/*.png).
// Запуск: node scripts/trace_logos.mjs
//   -> src/content/logos.generated.json  (контуры надписей для логотипа и интро)
//   -> public/favicon-<имя>.svg           (первая буква на чернильном фоне)
import { writeFileSync } from "node:fs";
import potrace from "potrace";

const load = (file) =>
  new Promise((resolve, reject) => {
    const t = new potrace.Potrace();
    t.setParameters({ turdSize: 40, optTolerance: 1.2, alphaMax: 1.2, threshold: 128 });
    t.loadImage(file, (err) => (err ? reject(err) : resolve(t)));
  });

/** Координаты в 3-кратном масштабе трассировки -> делим на 3 и округляем до 0,1. */
const shrink = (d) => d.replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round((parseFloat(n) / 3) * 10) / 10));

async function trace(name) {
  const t = await load(`scripts/.trace/${name}.png`);
  const d = shrink(t.getPathTag().match(/ d="([^"]+)"/)[1]).replace(/\s+/g, " ").trim();
  return { w: Math.round(t._luminanceData.width / 3), h: Math.round(t._luminanceData.height / 3), d };
}

const out = {};
for (const name of ["lash", "angel"]) {
  out[name] = await trace(name);
  const letter = await trace(`${name}-letter`);
  // Фавикон: буква жемчужного цвета на чернильном фоне, волоски утолщены обводкой
  const s = Math.max(letter.w, letter.h);
  const pad = s * 0.16;
  const vb = s + pad * 2;
  const x = pad + (s - letter.w) / 2;
  const y = pad + (s - letter.h) / 2;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb.toFixed(0)} ${vb.toFixed(0)}">` +
    `<rect width="100%" height="100%" rx="${(vb * 0.22).toFixed(0)}" fill="#0C0812"/>` +
    `<path transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" d="${letter.d}" fill="#F7F3FA" fill-rule="evenodd" ` +
    `stroke="#F7F3FA" stroke-width="${(s * 0.022).toFixed(1)}" stroke-linejoin="round"/></svg>`;
  writeFileSync(`public/favicon-${name}.svg`, svg);
  console.log(`${name}: ${out[name].w}x${out[name].h}, path ${(out[name].d.length / 1024).toFixed(1)}K; favicon ${(svg.length / 1024).toFixed(1)}K`);
}
writeFileSync("src/content/logos.generated.json", JSON.stringify(out));
