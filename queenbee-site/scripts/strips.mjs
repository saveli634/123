// Длинный скриншот -> полосы рядом (для просмотра целиком): node scripts/strips.mjs in.png out.jpg ширина высота-полосы
import sharp from "sharp";
const [inp, out, ws, hs] = process.argv.slice(2);
const W = +ws, CH = +hs;
const buf = await sharp(inp, { limitInputPixels: false }).resize({ width: W }).toBuffer();
const { height } = await sharp(buf).metadata();
const n = Math.ceil(height / CH);
const comp = [];
for (let i = 0; i < n; i++) {
  const h = Math.min(CH, height - i * CH);
  comp.push({ input: await sharp(buf).extract({ left: 0, top: i * CH, width: W, height: h }).toBuffer(), left: i * (W + 10), top: 0 });
}
await sharp({ create: { width: n * (W + 10), height: CH, channels: 3, background: "#222" } }).composite(comp).jpeg({ quality: 80 }).toFile(out);
console.log(out, n, "полос");
