// Векторизация льва из assets-src/logo/lion.png (золото на прозрачном фоне).
// Порог по альфе → potrace → контуры SVG. Результат:
//   src/generated/lion.ts      — путь льва (целиком и по отдельным контурам для «рисования»)
//                                 и контур высечки наклейки (лев + поле вокруг);
//   public/favicon.svg         — значок вкладки;
//   assets-src/logo/lion.traced.svg — для проверки глазами.
// Запуск: node scripts/lion.mjs
import sharp from "sharp";
import potrace from "potrace";
import { mkdirSync, writeFileSync } from "node:fs";

const SRC = "assets-src/logo/lion.png";
const SCALE = 4; // трассируем в 4× — края ровнее, углы острее

const { data, info } = await sharp(SRC).ensureAlpha().extractChannel(3).raw().toBuffer({ resolveWithObject: true });
const W = info.width * SCALE;
const H = info.height * SCALE;

const PAD = 48; // поле вокруг (в 1×), чтобы высечка наклейки не упиралась в край картинки
const PW = (info.width + PAD * 2) * SCALE;
const PH = (info.height + PAD * 2) * SCALE;

/** Альфа → апскейл ×SCALE → порог → бинарная маска (255 = фигура) на холсте с полями. */
async function shapeMask(thr) {
  const { data: px, info: pi } = await sharp(data, { raw: { width: info.width, height: info.height, channels: 1 } })
    .resize(W, H, { kernel: "lanczos3" })
    .extend({ top: PAD * SCALE, bottom: PAD * SCALE, left: PAD * SCALE, right: PAD * SCALE, background: "#000" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  // sharp после resize отдаёт 3 канала даже для одноканального входа — шагаем по info.channels
  const out = Buffer.alloc(PW * PH);
  for (let i = 0; i < out.length; i++) out[i] = px[i * pi.channels] >= thr ? 255 : 0;
  return out;
}

/** Точное евклидово расстояние до ближайшего пикселя-«признака» (Felzenszwalb–Huttenlocher), в квадрате. */
function edt(isFeature) {
  const INF = 1e20;
  const f = new Float64Array(PW * PH);
  for (let i = 0; i < f.length; i++) f[i] = isFeature(i) ? 0 : INF;
  const n = Math.max(PW, PH);
  const line = new Float64Array(n);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  const pass = (len, get, set) => {
    let k = 0;
    v[0] = 0;
    z[0] = -INF;
    z[1] = INF;
    for (let q = 1; q < len; q++) {
      let s = (line[q] + q * q - (line[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) {
        k--;
        s = (line[q] + q * q - (line[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < len; q++) {
      while (z[k + 1] < q) k++;
      d[q] = (q - v[k]) * (q - v[k]) + line[v[k]];
    }
    for (let q = 0; q < len; q++) set(q, d[q]);
    void get;
  };
  for (let x = 0; x < PW; x++) {
    for (let y = 0; y < PH; y++) line[y] = f[y * PW + x];
    pass(PH, null, (y, val) => (f[y * PW + x] = val));
  }
  for (let y = 0; y < PH; y++) {
    for (let x = 0; x < PW; x++) line[x] = f[y * PW + x];
    pass(PW, null, (x, val) => (f[y * PW + x] = val));
  }
  return f;
}

/** Морфологическое закрытие радиусом R и затем расширение на offset (всё в 1×). */
function closeAndOffset(mask, R, offset) {
  const r = R * SCALE;
  const o = offset * SCALE;
  const toShape = edt((i) => mask[i] === 255);
  const dilated = new Uint8Array(PW * PH);
  for (let i = 0; i < dilated.length; i++) dilated[i] = toShape[i] <= r * r ? 1 : 0;
  const toOutside = edt((i) => dilated[i] === 0);
  const out = Buffer.alloc(PW * PH);
  const keep = (r - o) * (r - o);
  for (let i = 0; i < out.length; i++) out[i] = toOutside[i] >= keep ? 255 : 0;
  return out;
}

/** potrace (через Jimp) ждёт обычный RGB PNG, фигура — чёрная. */
function toPng(buf) {
  const rgb = Buffer.alloc(buf.length * 3);
  for (let i = 0; i < buf.length; i++) rgb.fill(buf[i] ? 0 : 255, i * 3, i * 3 + 3);
  return sharp(rgb, { raw: { width: PW, height: PH, channels: 3 } })
    .png()
    .toBuffer();
}

function trace(buf, params) {
  return new Promise((res, rej) => {
    const t = new potrace.Potrace();
    t.setParameters({ blackOnWhite: true, color: "#000", background: "transparent", ...params });
    t.loadImage(buf, (err) => {
      if (err) return rej(err);
      const tag = t.getPathTag();
      const d = /d="([^"]+)"/.exec(tag)?.[1];
      if (!d) return rej(new Error("potrace: empty path"));
      res(d);
    });
  });
}

/** Путь potrace (режим многоугольников: только M/L) → массив замкнутых ломаных в 1×. */
function toPolygons(d) {
  const polys = [];
  for (const sub of d.split(/(?=M)/)) {
    const nums = (sub.match(/-?\d+(\.\d+)?/g) || []).map(Number);
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2) pts.push([nums[i] / SCALE - PAD, nums[i + 1] / SCALE - PAD]);
    if (pts.length > 2) polys.push(pts);
  }
  return polys;
}

/** Рамер — Дуглас — Пекер: убираем точки, отклоняющиеся от прямой меньше чем на eps. */
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0];
  const [bx, by] = pts[pts.length - 1];
  const len = Math.hypot(bx - ax, by - ay) || 1;
  let max = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const dist = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len;
    if (dist > max) {
      max = dist;
      idx = i;
    }
  }
  if (max <= eps) return [pts[0], pts[pts.length - 1]];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}

/** Замкнутая ломаная: режем в самой дальней от начала точке и упрощаем половины. */
function simplifyClosed(pts, eps) {
  let far = 0;
  let best = 0;
  pts.forEach(([x, y], i) => {
    const dd = (x - pts[0][0]) ** 2 + (y - pts[0][1]) ** 2;
    if (dd > best) {
      best = dd;
      far = i;
    }
  });
  const a = rdp(pts.slice(0, far + 1), eps);
  const b = rdp([...pts.slice(far), pts[0]], eps);
  return [...a.slice(0, -1), ...b.slice(0, -1)];
}

const num = (v) => String(Math.round(v * 10) / 10);
const polyToD = (pts) => "M" + pts.map(([x, y]) => `${num(x)} ${num(y)}`).join("L") + "Z";

// 1) Сам лев: строгий порог по альфе, мелкий мусор (крапинки от исходного видео) — прочь.
const solid = await shapeMask(128);
// Лев геометричный — трассируем многоугольниками (alphaMax 0) и упрощаем: углы остаются острыми.
const lionPolys = toPolygons(
  await trace(await toPng(solid), { turdSize: 260, alphaMax: 0, optCurve: false, threshold: 128 }),
).map((p) => simplifyClosed(p, 0.45));
const parts = lionPolys.map(polyToD);
const lion = parts.join("");
// длина каждого контура — для stroke-dasharray в прелоадере (рисование без JS)
const lens = lionPolys.map((pts) =>
  Math.ceil(
    pts.reduce((sum, [x, y], i) => {
      const [nx, ny] = pts[(i + 1) % pts.length];
      return sum + Math.hypot(nx - x, ny - y);
    }, 0),
  ),
);

// 2) Высечка наклейки — морфологическое «закрытие» по точной карте расстояний: расширяем силуэт
//    на 34 px (заливает заливы между прядями гривы), сужаем обратно и оставляем поле 13 px.
//    Берём только внешний контур — самый длинный подпуть.
const closed = closeAndOffset(solid, 34, 13);
const cutPolys = toPolygons(
  await trace(await toPng(closed), { turdSize: 4000, alphaMax: 0, optCurve: false, threshold: 128 }),
);
const cutPoly = simplifyClosed(cutPolys.sort((a, b) => b.length - a.length)[0], 0.6);
const cut = polyToD(cutPoly);
// для наклейки: крайние значения x + y контура высечки (линия сгиба идёт по x + y = const)
const sums = cutPoly.map(([x, y]) => x + y);
const cutMaxSum = Math.round(Math.max(...sums) * 10) / 10;
const cutMinSum = Math.round(Math.min(...sums) * 10) / 10;

const w = info.width;
const h = info.height;
const vb = `${-PAD} ${-PAD} ${w + PAD * 2} ${h + PAD * 2}`;
mkdirSync("src/generated", { recursive: true });
writeFileSync(
  "src/generated/lion.ts",
  `// Сгенерировано scripts/lion.mjs из assets-src/logo/lion.png — не редактировать вручную.
export const LION_W = ${w};
export const LION_H = ${h};
/** Весь лев одним путём (fill-rule: evenodd). */
export const LION_D = ${JSON.stringify(lion)};
/** Отдельные контуры — для прорисовки обводки в прелоадере. */
export const LION_PARTS: string[] = ${JSON.stringify(parts)};
/** Длины контуров (px в системе координат viewBox). */
export const LION_LENS: number[] = ${JSON.stringify(lens)};
/** Внешний контур высечки наклейки (выходит за 0..W/0..H на PAD). */
export const LION_CUT_D = ${JSON.stringify(cut)};
export const LION_PAD = ${PAD};
/** Наибольшая и наименьшая сумма x + y по контуру высечки (для отгиба уголка наклейки). */
export const LION_CUT_SUM: [number, number] = [${cutMinSum}, ${cutMaxSum}];
`,
);

writeFileSync(
  "assets-src/logo/lion.traced.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w + PAD * 2}" height="${h + PAD * 2}"><rect x="${-PAD}" y="${-PAD}" width="100%" height="100%" fill="#0A0809"/><path d="${cut}" fill="#F3ECDD" opacity=".25"/><path d="${lion}" fill="#E3C182" fill-rule="evenodd"/></svg>`,
);

// Значок вкладки: лев на тёмной плашке
const pad = 70;
writeFileSync(
  "public/favicon.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}"><rect x="${-pad}" y="${-pad}" width="${w + pad * 2}" height="${h + pad * 2}" rx="150" fill="#0A0809"/><path d="${lion}" fill="#E3C182" fill-rule="evenodd"/></svg>`,
);

console.log(
  `lion: ${parts.length} contours, ${(lion.length / 1024).toFixed(1)} KB path; cut ${(cut.length / 1024).toFixed(1)} KB`,
);
