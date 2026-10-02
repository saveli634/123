import type { HL } from "./engineModel";

/**
 * Позы сцены. Шкала времени T: 0 — первый экран, 1…7 — шесть этапов
 * (этап k ∈ 0…5 занимает [1 + k, 2 + k], его поза — в середине: 1.5 + k).
 */
type V3 = [number, number, number];

export interface Pose {
  cam: V3;
  look: V3;
  /** мотор снят с рамы */
  lift: number;
  /** навесное разлетелось */
  attach: number;
  /** головки приподняты */
  heads: number;
  /** поршневая группа раскрыта */
  pistons: number;
  /** поддон опущен */
  pan: number;
  /** видимость рамы */
  frame: number;
  /** видимость пола-чертежа */
  floor: number;
  /** вращение коленвала (0 — стоит, 1 — обкатка) */
  run: number;
  /** «рентген» блока и головок */
  xray: number;
  hl: Partial<Record<HL, number>>;
}

export const POSES: Pose[] = [
  // первый экран: мотор целиком, три четверти спереди
  { cam: [9.8, 5.6, 10.8], look: [0, 0.9, 0], lift: 0, attach: 0, heads: 0, pistons: 0, pan: 0, frame: 1, floor: 1, run: 0.05, xray: 0, hl: {} },
  // 01 цельный мотор
  { cam: [11.6, 6.4, 7.8], look: [0.1, 0.9, 0], lift: 0, attach: 0, heads: 0, pistons: 0, pan: 0, frame: 1, floor: 1, run: 0, xray: 0, hl: { block: 1 } },
  // 02 демонтаж: мотор уходит с рамы, навесное разлетается
  { cam: [17.6, 10.2, 7.4], look: [1.2, 3.6, 0], lift: 1, attach: 1, heads: 0, pistons: 0, pan: 0.55, frame: 1, floor: 1, run: 0, xray: 0, hl: { attach: 1 } },
  // 03 замеры: головки вверх, поршневая группа раскрыта
  { cam: [13.6, 14.2, 12.4], look: [0, 4.6, 0], lift: 1, attach: 1, heads: 1, pistons: 1, pan: 1, frame: 0, floor: 1, run: 0, xray: 0.25, hl: { heads: 0.7, pistons: 1 } },
  // 04 сборка: детали возвращаются, в «рентгене» виден коленвал
  { cam: [11.4, 4.2, 13.2], look: [0, 2.9, 0], lift: 1, attach: 0.3, heads: 0.14, pistons: 0, pan: 0.85, frame: 0, floor: 1, run: 0.16, xray: 0.82, hl: { crank: 1 } },
  // 05 обкатка: мотор собран и работает
  { cam: [12.8, 4.8, -6.8], look: [0.6, 1.0, 0], lift: 0, attach: 0, heads: 0, pistons: 0, pan: 0, frame: 1, floor: 1, run: 1, xray: 0, hl: { indicator: 1 } },
  // 06 первый выезд: камера отъезжает
  { cam: [19, 7.2, 15], look: [0, 0.6, 0], lift: 0, attach: 0, heads: 0, pistons: 0, pan: 0, frame: 1, floor: 0.25, run: 1, xray: 0, hl: {} },
];

export const KEY_T = [0, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5];

/** Индекс этапа (0…5) по шкале T */
export function stageAt(T: number) {
  return Math.max(0, Math.min(5, Math.floor(T - 1)));
}
