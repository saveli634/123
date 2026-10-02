import { useEffect, useRef, type ReactNode } from "react";
import { finePointer, motionAllowed } from "@/lib/env";
import { cn } from "@/lib/utils";

/**
 * Магнитная обёртка (только мышь/тачпад): элемент тянется к курсору пружиной
 * и мягко возвращается. Пишет transform прямо в элемент — без пересчёта стилей у детей.
 */
export function Magnetic({ children, strength = 0.32, className }: { children: ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed() || !finePointer()) return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let vx = 0;
    let vy = 0;
    let raf = 0;
    let rect: DOMRect | null = null;
    const step = () => {
      // Пружина: жёсткость 0.16, затухание 0.72 — без «желе», но с инерцией
      vx = (vx + (tx - x) * 0.16) * 0.72;
      vy = (vy + (ty - y) * 0.16) * 0.72;
      x += vx;
      y += vy;
      el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > 0.05) raf = requestAnimationFrame(step);
      else raf = 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(step);
    };
    const move = (e: PointerEvent) => {
      rect = rect ?? el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      tx = (e.clientX - cx) * strength;
      ty = (e.clientY - cy) * strength * 1.1;
      kick();
    };
    const leave = () => {
      rect = null;
      tx = 0;
      ty = 0;
      kick();
    };
    const enter = () => {
      rect = el.getBoundingClientRect();
    };
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [strength]);
  return (
    <span ref={ref} className={cn("magnetic", className)}>
      {children}
    </span>
  );
}
