export const isBrowser = typeof window !== "undefined";

/** Движение разрешено: есть IntersectionObserver и не включено «уменьшить движение». */
export function motionAllowed() {
  return isBrowser && "IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Настоящий курсор (мышь / тачпад), а не палец. */
export function canHover() {
  return isBrowser && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Плавная ступенька: 0 до a, 1 после b. */
export const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** cubic-bezier(0.22, 1, 0.36, 1) — приближение «появления» для расчётов в JS. */
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3.2);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
