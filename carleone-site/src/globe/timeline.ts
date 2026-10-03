/**
 * Сценарий «Карты Carleone» без three.js: что видно при данном положении прокрутки t.
 * t = -1 — первый экран, 0…4 — пять этапов (Казахстан, Германия, Франция, Бельгия → Япония, все дуги).
 */
import type { Country, Shot } from "./geo";

const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** Дуги: откуда, куда, на каком отрезке t рисуются, к какому этапу относятся. */
export const ARCS: {
  from: Country;
  to: Country;
  start: number;
  end: number;
  stage: number;
}[] = [
  { from: "DE", to: "KZ", start: 0.5, end: 1.0, stage: 1 },
  { from: "FR", to: "KZ", start: 1.5, end: 2.0, stage: 2 },
  { from: "BE", to: "KZ", start: 2.42, end: 2.78, stage: 3 },
  { from: "KZ", to: "JP", start: 2.78, end: 3.18, stage: 3 },
];

/** Активный этап текста: -1 — ещё первый экран. Переключение — в середине перелёта камеры. */
export const textStage = (t: number) => (t < -0.45 ? -1 : Math.max(0, Math.min(4, Math.round(t - 0.05))));

/** Кадр камеры для t: удержание на этапе, затем перелёт по плавной кривой с лёгким отъездом. */
export function shotAt(t: number, shots: Shot[]): Shot {
  if (t <= -1) return { ...shots[0] };
  if (t >= 4) return { ...shots[5] };
  let a: Shot;
  let b: Shot;
  let f: number;
  if (t < 0) {
    a = shots[0];
    b = shots[1];
    f = smooth(-1, -0.12, t);
  } else {
    const k = Math.floor(t);
    a = shots[k + 1];
    b = shots[k + 2];
    f = smooth(k + 0.3, k + 0.85, t);
  }
  const mix = (x: number, y: number) => x + (y - x) * f;
  // в середине перелёта камера чуть отъезжает — ощущение полёта, а не прокрутки
  const pull = t < 0 ? 0 : 0.1 * Math.sin(f * Math.PI);
  return {
    lat: mix(a.lat, b.lat),
    lon: mix(a.lon, b.lon),
    r: mix(a.r, b.r) * (1 - pull),
    cx: mix(a.cx, b.cx),
    cy: mix(a.cy, b.cy),
  };
}

/** Яркость стран (подсветка точек и контуров) на этапе. */
export function highlights(stage: number): Record<Country, number> {
  const base = { KZ: 0.5, DE: 0, FR: 0, BE: 0, JP: 0 };
  if (stage <= 0) return { ...base, KZ: 1 };
  if (stage === 1) return { ...base, DE: 1, KZ: 0.75 };
  if (stage === 2) return { ...base, FR: 1, DE: 0.35, KZ: 0.75 };
  if (stage === 3) return { ...base, BE: 1, JP: 1, DE: 0.35, FR: 0.35, KZ: 0.75 };
  return { KZ: 1, DE: 0.7, FR: 0.7, BE: 0.7, JP: 0.7 };
}
