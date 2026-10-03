/** Проверки окружения. Все — только в браузере (на сервере возвращают «безопасное» значение). */
export const isBrowser = typeof window !== "undefined";

const mq = (q: string) => isBrowser && typeof window.matchMedia === "function" && window.matchMedia(q).matches;

/** Пользователь просит меньше движения — без анимаций перемещения, глобус заменён рендерами. */
export const reducedMotion = () => mq("(prefers-reduced-motion: reduce)");

/** Мышь или тачпад: кастомный курсор, магнитные кнопки, подсветка карточек, Lenis. */
export const finePointer = () => mq("(hover: hover) and (pointer: fine)");

/** Узкий экран (телефон в портрете / небольшой планшет). */
export const narrow = () => mq("(max-width: 767px)");

/** Движение разрешено и браузер умеет всё нужное. */
export const motionOK = () => isBrowser && "IntersectionObserver" in window && !reducedMotion();

let webgl2: boolean | null = null;
/** Three.js требует WebGL 2. Без него — готовые рендеры того же глобуса. */
export function hasWebGL2() {
  if (webgl2 !== null) return webgl2;
  try {
    if (/[?&]nowebgl\b/.test(location.search)) return (webgl2 = false);
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2");
    webgl2 = !!gl;
    // контекст больше не нужен — освобождаем сразу
    (
      gl?.getExtension("WEBGL_lose_context") as {
        loseContext?: () => void;
      } | null
    )?.loseContext?.();
  } catch {
    webgl2 = false;
  }
  return webgl2;
}

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Плавная ступенька 0→1 между a и b. */
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
