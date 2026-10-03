// Данные глобуса: равномерная сетка точек суши + контуры пяти стран маршрута.
// Сетка — спираль Фибоначчи из FIB_N точек на сфере; храним только битовую маску «суша / вода»
// (по биту на точку, base64), координаты точек браузер восстанавливает той же формулой.
// Так ~9 000 точек суши занимают ~5 КБ вместо сотен килобайт координат.
// Источник: world-atlas (Natural Earth 1:110m) + topojson-client, проверка точки — d3-geo.
// Запуск: node scripts/globe-data.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { feature } from "topojson-client";
import { geoContains, geoBounds, geoCentroid } from "d3-geo";

const FIB_N = 31100;
const topo = JSON.parse(readFileSync("node_modules/world-atlas/countries-110m.json", "utf8"));
const land = feature(topo, topo.objects.land);
const countries = feature(topo, topo.objects.countries);

/** Точка i спирали Фибоначчи → [lon, lat] в градусах. Та же формула — в src/globe/geo.ts. */
function fib(i) {
  const y = 1 - ((i + 0.5) * 2) / FIB_N;
  const r = Math.sqrt(1 - y * y);
  const t = i * Math.PI * (3 - Math.sqrt(5));
  const x = Math.cos(t) * r;
  const z = Math.sin(t) * r;
  return [(Math.atan2(z, x) * 180) / Math.PI, (Math.asin(y) * 180) / Math.PI];
}

// Суша: разбираем мультиполигон на отдельные полигоны с рамками — быстрая отсечка по bbox
const polys = (land.features[0]?.geometry ?? land.geometry).coordinates.map((coordinates) => {
  const f = { type: "Feature", geometry: { type: "Polygon", coordinates } };
  return { f, b: geoBounds(f) };
});
const inBox = ([lon, lat], [[x0, y0], [x1, y1]]) =>
  lat >= y0 - 0.5 &&
  lat <= y1 + 0.5 &&
  (x0 <= x1 ? lon >= x0 - 0.5 && lon <= x1 + 0.5 : lon >= x0 - 0.5 || lon <= x1 + 0.5);

const bits = new Uint8Array(Math.ceil(FIB_N / 8));
const landIdx = [];
for (let i = 0; i < FIB_N; i++) {
  const p = fib(i);
  if (polys.some(({ f, b }) => inBox(p, b) && geoContains(f, p))) {
    bits[i >> 3] |= 1 << (i & 7);
    landIdx.push(i);
  }
}

// Страны маршрута: ISO 3166-1 numeric
const ISO = { KZ: "398", DE: "276", FR: "250", BE: "056", JP: "392" };
const round = (v) => Math.round(v * 10) / 10;
const countryPoints = {};
const outlines = {};
for (const [code, id] of Object.entries(ISO)) {
  const c = countries.features.find((x) => String(x.id).padStart(3, "0") === id);
  if (!c) throw new Error(`country ${code} not found`);
  countryPoints[code] = landIdx.filter((i) => geoContains(c, fib(i)));
  // контуры: только основные полигоны рядом с центром страны (без заморских территорий)
  const center = geoCentroid(c);
  const geo = c.geometry.type === "Polygon" ? [c.geometry.coordinates] : c.geometry.coordinates;
  outlines[code] = geo
    .filter((poly) => {
      const [lon, lat] = geoCentroid({ type: "Polygon", coordinates: poly });
      return Math.abs(lat - center[1]) < 14 && Math.abs(((lon - center[0] + 540) % 360) - 180) < 22;
    })
    .map((poly) => poly[0].map(([lon, lat]) => [round(lon), round(lat)]));
}

mkdirSync("src/generated", { recursive: true });
writeFileSync(
  "src/generated/globe-data.ts",
  `// Сгенерировано scripts/globe-data.mjs (Natural Earth 1:110m через world-atlas) — не редактировать вручную.
/** Число точек спирали Фибоначчи на сфере. */
export const FIB_N = ${FIB_N};
/** Битовая маска суши по точкам спирали (base64). */
export const LAND_BITS = "${Buffer.from(bits).toString("base64")}";
/** Индексы точек спирали внутри стран маршрута. */
export const COUNTRY_POINTS: Record<"KZ" | "DE" | "FR" | "BE" | "JP", number[]> = ${JSON.stringify(countryPoints)};
/** Контуры стран маршрута: [lon, lat] с шагом 0.1°. */
export const OUTLINES: Record<"KZ" | "DE" | "FR" | "BE" | "JP", [number, number][][]> = ${JSON.stringify(outlines)};
`,
);

console.log(
  `globe: ${landIdx.length} land points of ${FIB_N}; ` +
    Object.entries(countryPoints)
      .map(([k, v]) => `${k}=${v.length}`)
      .join(" ") +
    `; outlines: ` +
    Object.entries(outlines)
      .map(([k, v]) => `${k}=${v.length}×${v.map((r) => r.length).join("+")}`)
      .join(" "),
);
