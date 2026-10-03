/**
 * Геометрия глобуса без three.js: точки суши, центры стран, кадры камеры.
 * Этот модуль лёгкий — его используют и живая сцена, и запасные рендеры (без загрузки three.js).
 */
import { FIB_N, LAND_BITS, COUNTRY_POINTS } from "@/generated/globe-data";

export type Country = "KZ" | "DE" | "FR" | "BE" | "JP";
export const COUNTRIES: Country[] = ["KZ", "DE", "FR", "BE", "JP"];

/**
 * Центры стран (широта, долгота) — схематично, маркеры ставятся на страну, не на город
 * (города путешественников не известны).
 */
export const CENTER: Record<Country, [number, number]> = {
  KZ: [48.2, 67.4],
  DE: [51.1, 10.4],
  FR: [46.6, 2.5],
  BE: [50.6, 4.6],
  JP: [36.4, 138.4],
};

/** Точка i спирали Фибоначчи → [долгота, широта]. Та же формула, что в scripts/globe-data.mjs. */
export function fib(i: number): [number, number] {
  const y = 1 - ((i + 0.5) * 2) / FIB_N;
  const r = Math.sqrt(1 - y * y);
  const t = i * Math.PI * (3 - Math.sqrt(5));
  return [(Math.atan2(Math.sin(t) * r, Math.cos(t) * r) * 180) / Math.PI, (Math.asin(y) * 180) / Math.PI];
}

/** Широта/долгота → точка на сфере (y — север, восток — вправо при взгляде снаружи). */
export function toXYZ(lat: number, lon: number, r = 1): [number, number, number] {
  const la = (lat * Math.PI) / 180;
  const lo = (lon * Math.PI) / 180;
  return [r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo)];
}

/** Индексы точек суши и для каждой — номер страны маршрута (0 — не из маршрута). */
export function landPoints() {
  const bin = atob(LAND_BITS);
  const idx: number[] = [];
  for (let i = 0; i < FIB_N; i++) if (bin.charCodeAt(i >> 3) & (1 << (i & 7))) idx.push(i);
  const country = new Map<number, number>();
  COUNTRIES.forEach((c, k) => COUNTRY_POINTS[c].forEach((i) => country.set(i, k + 1)));
  return idx.map((i) => ({ i, c: country.get(i) ?? 0 }));
}

/**
 * Кадры камеры: t = -1 — первый экран, 0…4 — этапы карты.
 * r — радиус глобуса на экране в долях меньшей стороны окна; cx, cy — сдвиг центра глобуса
 * от центра экрана в долях ширины и высоты (+ вправо / вниз).
 */
export type Shot = {
  lat: number;
  lon: number;
  r: number;
  cx: number;
  cy: number;
};
export const SHOTS_WIDE: Shot[] = [
  { lat: 0, lon: 64, r: 1.25, cx: 0, cy: 1.45 }, // первый экран: горизонт планеты, над ним — лев над Казахстаном
  { lat: 45, lon: 67, r: 0.62, cx: 0.17, cy: 0.02 }, // 1 Казахстан
  { lat: 50, lon: 40, r: 0.5, cx: 0.16, cy: 0.0 }, // 2 Германия → Казахстан
  { lat: 48, lon: 36, r: 0.5, cx: 0.16, cy: 0.0 }, // 3 Франция → Казахстан
  { lat: 42, lon: 72, r: 0.42, cx: 0.13, cy: 0.0 }, // 4 Бельгия → Казахстан → Япония
  { lat: 33, lon: 64, r: 0.36, cx: 0.12, cy: 0.0 }, // 5 все дуги
];
export const SHOTS_TALL: Shot[] = [
  { lat: 0, lon: 64, r: 1.3, cx: 0, cy: 0.8 },
  { lat: 45, lon: 67, r: 0.66, cx: 0, cy: -0.17 },
  { lat: 51, lon: 40, r: 0.6, cx: 0, cy: -0.17 },
  { lat: 49, lon: 35, r: 0.6, cx: 0, cy: -0.17 },
  { lat: 43, lon: 72, r: 0.52, cx: 0, cy: -0.17 },
  { lat: 33, lon: 62, r: 0.46, cx: 0, cy: -0.17 },
];
/** Портретная раскладка: телефон или узкое окно. */
export const isTall = (w: number, h: number) => w / h < 0.9;

export const FOV = 30;
/** Расстояние камеры, при котором глобус радиусом 1 занимает r·min(w,h) пикселей. */
export function cameraDistance(r: number, w: number, h: number) {
  const tanHalf = Math.tan(((FOV / 2) * Math.PI) / 180);
  const alpha = Math.atan(((r * Math.min(w, h)) / (h / 2)) * tanHalf);
  return 1 / Math.sin(alpha);
}

/**
 * Кадры для окна w×h. Первый экран — «горизонт»: широту подбираем так, чтобы Казахстан
 * с медальоном льва стоял у верхнего края планеты при любой пропорции окна.
 */
export function shotsFor(w: number, h: number): Shot[] {
  const shots = (isTall(w, h) ? SHOTS_TALL : SHOTS_WIDE).map((s) => ({ ...s }));
  const d = cameraDistance(shots[0].r, w, h);
  const limb = (Math.acos(1 / d) * 180) / Math.PI;
  shots[0].lat = CENTER.KZ[0] - limb + 13;
  return shots;
}
