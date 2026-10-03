import type { PointerEvent as RPointerEvent } from "react";
import { finePointer } from "@/lib/env";

/** Подсветка за курсором: координаты в CSS-переменные --x/--y (только мышь). */
export function glowFollow(e: RPointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse" || !finePointer()) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--x", `${(e.clientX - r.left).toFixed(0)}px`);
  el.style.setProperty("--y", `${(e.clientY - r.top).toFixed(0)}px`);
}
