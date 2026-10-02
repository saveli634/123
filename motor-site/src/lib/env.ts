import { CONFIG } from "@/config";

/** Демо-режим: обычная сборка. В релизной (npm run build:release) плашек «ЗАПОЛНИТЬ» нет. */
export const DEMO = !__RELEASE__;

export const isBrowser = typeof window !== "undefined";

function mq(q: string) {
  return isBrowser && typeof window.matchMedia === "function" && window.matchMedia(q).matches;
}

/** Движение разрешено: есть IntersectionObserver и нет «уменьшить движение». */
export function motionAllowed() {
  return isBrowser && "IntersectionObserver" in window && !mq("(prefers-reduced-motion: reduce)");
}

/** Мышь или тачпад: кастомный курсор, магниты, наклон карточек, Lenis. */
export function finePointer() {
  return mq("(hover: hover) and (pointer: fine)");
}

export function webgl2Available() {
  if (!isBrowser) return false;
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

/** Значение поля CONFIG как строка (пусто — ""). */
export function field(key: "name" | "address" | "workHours" | "phone" | "whatsapp" | "instagram" | "mapLink"): string {
  return String(CONFIG[key] ?? "").trim();
}
