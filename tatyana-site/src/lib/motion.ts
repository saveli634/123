/**
 * Общие настройки движения: «уменьшить движение», тип указателя и уровень качества.
 * Уровень качества падает сам, если устройство не тянет (fps < ~45 несколько секунд подряд):
 * 2 — всё; 1 — меньше звёзд, без следа курсора; 0 — минимум звёзд, упрощённые аспекты.
 */

export const isBrowser = typeof window !== "undefined";

const mq = (q: string) => isBrowser && !!window.matchMedia && window.matchMedia(q).matches;

export const reducedMotion = () => mq("(prefers-reduced-motion: reduce)");
export const finePointer = () => mq("(hover: hover) and (pointer: fine)");
export const motionOk = () => isBrowser && "IntersectionObserver" in window && !reducedMotion();

export type Quality = 0 | 1 | 2;

let quality: Quality = 2;
let qualityInit = false;
const listeners = new Set<(q: Quality) => void>();

function initQuality() {
  if (qualityInit || !isBrowser) return;
  qualityInit = true;
  const forced = new URLSearchParams(location.search).get("q");
  if (forced === "0" || forced === "1" || forced === "2") {
    quality = Number(forced) as Quality;
    fixed = true;
  } else {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const cores = nav.hardwareConcurrency || 4;
    const mem = nav.deviceMemory || 4;
    if (cores <= 2 || mem <= 1) quality = 0;
    else if (cores <= 4 && mem <= 2) quality = 1;
  }
  document.documentElement.dataset.quality = String(quality);
}

let fixed = false;

export function getQuality(): Quality {
  initQuality();
  return quality;
}

export function onQuality(fn: (q: Quality) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function lowerQuality() {
  if (quality === 0 || fixed) return;
  quality = (quality - 1) as Quality;
  document.documentElement.dataset.quality = String(quality);
  listeners.forEach((l) => l(quality));
}

/** Следит за частотой кадров и понижает качество, если долго ниже ~45 fps. */
export function startFpsMonitor() {
  initQuality();
  if (!isBrowser || fixed || reducedMotion()) return () => {};
  let raf = 0;
  let last = 0;
  let frames = 0;
  let acc = 0;
  let slowWindows = 0;
  const loop = (t: number) => {
    raf = requestAnimationFrame(loop);
    if (document.hidden) {
      last = 0;
      return;
    }
    if (last) {
      const dt = t - last;
      // большие паузы — это переключение вкладок, а не тормоза
      if (dt < 250) {
        acc += dt;
        frames++;
      }
    }
    last = t;
    if (acc >= 1000) {
      const fps = (frames * 1000) / acc;
      slowWindows = fps < 45 ? slowWindows + 1 : 0;
      if (slowWindows >= 2) {
        lowerQuality();
        slowWindows = 0;
        if (quality === 0) cancelAnimationFrame(raf);
      }
      acc = 0;
      frames = 0;
    }
  };
  // первые секунды после загрузки не меряем: идёт разбор страницы и шрифтов
  const start = window.setTimeout(() => (raf = requestAnimationFrame(loop)), 2500);
  return () => {
    clearTimeout(start);
    cancelAnimationFrame(raf);
  };
}

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Доля прохождения отрезка [a, b] */
export const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
/** cubic-bezier(0.22, 1, 0.36, 1) — приблизительно */
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
