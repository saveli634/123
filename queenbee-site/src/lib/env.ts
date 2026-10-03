/** Окружение браузера. На сервере (пререндер) всё «выключено». */
export const isBrowser = typeof window !== "undefined";

export const motionAllowed = () => isBrowser && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = () => isBrowser && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
export const isPhone = () => isBrowser && window.innerWidth < 768;

export function param(name: string): string | null {
  if (!isBrowser) return null;
  try {
    return new URLSearchParams(window.location.search).get(name);
  } catch {
    return null;
  }
}
