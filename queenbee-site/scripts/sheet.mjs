// Сводный лист скриншотов: node scripts/sheet.mjs <out.jpg> <высота строки> файлы...
import sharp from "sharp";
const [out, hs, ...files] = process.argv.slice(2);
const H = +hs;
const imgs = [];
for (const f of files) {
  const m = await sharp(f).metadata();
  const w = Math.round((m.width * H) / m.height);
  imgs.push({ input: await sharp(f).resize(w, H).toBuffer(), w });
}
let x = 0;
const comp = imgs.map((i) => {
  const c = { input: i.input, left: x, top: 0 };
  x += i.w + 12;
  return c;
});
await sharp({ create: { width: x, height: H, channels: 3, background: "#222" } }).composite(comp).jpeg({ quality: 82 }).toFile(out);
