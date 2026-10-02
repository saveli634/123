/**
 * Склейка «до/после»: node scripts/compare.mjs <выход.png> <ширина-кадра> до1.png,до2.png,… после1.png,после2.png,…
 */
import sharp from "sharp";
const [out, cellW, before, after] = process.argv.slice(2);
const W = Number(cellW);
const load = async (list) => Promise.all(list.split(",").map((f) => sharp(f).resize({ width: W }).png().toBuffer()));
const A = await load(before);
const B = await load(after);
const hOf = async (b) => (await sharp(b).metadata()).height;
const rowH = Math.max(...(await Promise.all([...A, ...B].map(hOf))));
const pad = 16;
const label = 54;
const cols = Math.max(A.length, B.length);
const width = pad + cols * (W + pad);
const height = label + rowH + label + rowH + pad;
const text = (t, color) =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${label}"><text x="${pad}" y="36" font-family="Oswald, Arial Narrow, sans-serif" font-weight="700" font-size="30" fill="${color}">${t}</text></svg>`);
const comps = [
  { input: text("ДО — круг 1", "#868d98"), left: 0, top: 0 },
  { input: text("ПОСЛЕ — круг 2", "#ede9e1"), left: 0, top: label + rowH },
];
A.forEach((b, i) => comps.push({ input: b, left: pad + i * (W + pad), top: label }));
B.forEach((b, i) => comps.push({ input: b, left: pad + i * (W + pad), top: label + rowH + label }));
await sharp({ create: { width, height, channels: 3, background: "#0a0b0d" } }).composite(comps).png({ compressionLevel: 9 }).toFile(out);
console.log(out, width, height);
