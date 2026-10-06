/**
 * Геометрия сцены «Подъём»: глаз и ресницы как функция прогресса прокрутки p ∈ [0, 1].
 * Один массив параметров ресниц, одна функция состояния — её используют и canvas (живая сцена),
 * и статичная SVG-картинка (без скриптов и при «уменьшить движение»).
 *
 * Пространство глаза: ширина 1000, уголки глаза в x = ±500, ось y вниз.
 *   этап 0  (p 0…0,1)    глаз закрыт, реснички лежат вниз;
 *   этап 1  (p 0,1…0,42) появляется валик, реснички выкладываются на него;
 *   этап 2  (p 0,42…0,76) реснички поднимаются и подкручиваются, глаз открывается, на кончиках блики;
 *   этап 3  (p 0,76…1)   надпись «Поднимаю взгляд за час».
 */
import { clamp, easeInOut, easeOut, mix, smooth } from "./env";

export type Pt = [number, number];

export interface Lash {
  u: number; // место на веке: 0 — внутренний уголок, 1 — внешний
  len: number;
  w: number; // толщина у корня
  phase: number; // задержка «волны» от внутреннего уголка к внешнему
  tone: number; // 0..1 — оттенок (жемчуг → сирень)
}

/** Детерминированный генератор: одинаковая картинка на сервере и в браузере. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeLashes(n: number): Lash[] {
  const r = rng(7 + n);
  const list: Lash[] = [];
  for (let i = 0; i < n; i++) {
    const u = 0.05 + (0.92 * (i + 0.15 + r() * 0.7)) / n;
    const peak = Math.sin(Math.PI * Math.pow(u, 1.5));
    list.push({
      u,
      len: (110 + 200 * peak) * (0.88 + r() * 0.24),
      w: 7.5 + r() * 3.6,
      phase: u * 0.22 + r() * 0.08,
      tone: r(),
    });
  }
  return list;
}

export const LASHES_FULL = 40;
export const LASHES_LOW = 24;

const IN: Pt = [-500, 18];
const OUT: Pt = [500, -22];

export type Bezier = [Pt, Pt, Pt, Pt];

/** Верхнее и нижнее веко при раскрытии open ∈ [0, 1]. При open = 0 веки совпадают. */
export function lids(open: number): { upper: Bezier; lower: Bezier } {
  return {
    upper: [IN, [-270, mix(105, -300, open)], [250, mix(105, -315, open)], OUT],
    lower: [IN, [-270, mix(105, 205, open)], [250, mix(105, 185, open)], OUT],
  };
}

export function bez(b: Bezier, t: number): Pt {
  const m = 1 - t;
  const a = m * m * m;
  const c = 3 * m * m * t;
  const d = 3 * m * t * t;
  const e = t * t * t;
  return [a * b[0][0] + c * b[1][0] + d * b[2][0] + e * b[3][0], a * b[0][1] + c * b[1][1] + d * b[2][1] + e * b[3][1]];
}

export function bezTangent(b: Bezier, t: number): number {
  const m = 1 - t;
  const dx = 3 * m * m * (b[1][0] - b[0][0]) + 6 * m * t * (b[2][0] - b[1][0]) + 3 * t * t * (b[3][0] - b[2][0]);
  const dy = 3 * m * m * (b[1][1] - b[0][1]) + 6 * m * t * (b[2][1] - b[1][1]) + 3 * t * t * (b[3][1] - b[2][1]);
  return Math.atan2(dy, dx);
}

/** Состояние сцены по прогрессу. */
export function sceneState(p: number) {
  return {
    p,
    toRoller: smooth(0.08, 0.4, p), // реснички ложатся на валик
    toLift: smooth(0.42, 0.74, p), // реснички поднимаются
    open: easeInOut(smooth(0.46, 0.76, p)),
    roller: smooth(0.04, 0.16, p) * (1 - smooth(0.44, 0.6, p)),
    caption: smooth(0.76, 0.9, p),
    stage: p < 0.1 ? 0 : p < 0.42 ? 1 : p < 0.76 ? 2 : 3,
  };
}

export type SceneState = ReturnType<typeof sceneState>;

/** Своя (с задержкой) доля перехода для ресницы. */
const local = (v: number, phase: number) => easeOut(clamp((v - phase) / (1 - 0.32)));

export interface LashPose {
  root: Pt;
  angle: number; // направление у корня
  curl: number; // полный поворот направления к кончику, рад
  len: number;
  w: number;
  glint: number; // яркость блика на кончике
  tone: number;
}

export function lashPose(l: Lash, s: SceneState, upper: Bezier): LashPose {
  const a = local(s.toRoller, l.phase);
  const b = local(s.toLift, l.phase);
  const c = l.u - 0.5;
  // лежат вниз → на валике (вверх, ровным веером) → подняты и подкручены (широкий веер)
  const angDown = Math.PI / 2 - c * 0.85;
  const angRoll = -Math.PI / 2 + c * 1.05;
  // поднятые: веер шире, кончики подкручены наружу; чуть разный изгиб у соседних ресниц
  const angLift = -Math.PI / 2 + c * 1.75 + (l.tone - 0.5) * 0.08;
  const curlDown = -c * 0.55;
  const curlRoll = c * 0.3;
  const curlLift = c * 1.9 + (l.tone - 0.5) * 0.3;
  const angle = mix(mix(angDown, angRoll, a), angLift, b);
  const curl = mix(mix(curlDown, curlRoll, a), curlLift, b);
  const len = l.len * mix(mix(0.9, 1, a), 1.04, b);
  const flash = Math.sin(Math.PI * clamp((b - 0.55) / 0.45));
  return {
    root: bez(upper, l.u),
    angle,
    curl,
    len,
    w: l.w,
    glint: clamp(flash * 1.1 + Math.pow(b, 4) * 0.32),
    tone: l.tone,
  };
}

/** Точка на ресничке: s ∈ [0, 1] от корня к кончику (дуга окружности). */
export function lashPoint(q: LashPose, s: number): Pt {
  const { root, angle, curl, len } = q;
  if (Math.abs(curl) < 1e-4) return [root[0] + Math.cos(angle) * len * s, root[1] + Math.sin(angle) * len * s];
  const R = len / curl;
  const a = angle + curl * s;
  return [root[0] + R * (Math.sin(a) - Math.sin(angle)), root[1] - R * (Math.cos(a) - Math.cos(angle))];
}

/** Контур сужающейся реснички (плоский массив x, y): левый край к кончику, правый — обратно. */
export function lashOutline(q: LashPose, segs = 12): number[] {
  const out: number[] = [];
  const right: Pt[] = [];
  for (let k = 0; k <= segs; k++) {
    const s = k / segs;
    const [x, y] = lashPoint(q, s);
    const a = q.angle + q.curl * s;
    const hw = (q.w * Math.pow(1 - s, 0.85) + 0.45) / 2;
    const nx = -Math.sin(a) * hw;
    const ny = Math.cos(a) * hw;
    out.push(x + nx, y + ny);
    right.push([x - nx, y - ny]);
  }
  for (let i = right.length - 1; i >= 0; i--) out.push(right[i][0], right[i][1]);
  return out;
}

/** Короткие нижние реснички (видны, когда глаз открыт). */
export const LOWER = Array.from({ length: 15 }, (_, i) => {
  const u = 0.28 + (0.66 * i) / 14;
  return { u, len: 34 + 46 * Math.sin(Math.PI * Math.pow(u, 1.3)), lean: (u - 0.5) * 0.9 };
});

/** Валик: полумесяц над закрытым веком. */
export function rollerOutline(samples = 28): { inner: Pt[]; outer: Pt[] } {
  const closed = lids(0).upper;
  const inner: Pt[] = [];
  const outer: Pt[] = [];
  for (let k = 0; k <= samples; k++) {
    const t = 0.02 + (0.96 * k) / samples;
    const [x, y] = bez(closed, t);
    const n = bezTangent(closed, t) - Math.PI / 2;
    const h = 30 + 290 * Math.pow(Math.sin(Math.PI * t), 0.7);
    inner.push([x + Math.cos(n) * 12, y + Math.sin(n) * 12]);
    outer.push([x + Math.cos(n) * h, y + Math.sin(n) * h]);
  }
  return { inner, outer };
}

/** Радужка: центр и радиус в пространстве глаза. */
export const IRIS = { cx: 14, cy: 34, r: 172, pupil: 62 };

/** Габариты сцены во всех этапах (для вписывания в экран): от кончиков поднятых ресниц до опущенных. */
export const BOUNDS = { top: -650, bottom: 430, left: -665, right: 665 };
