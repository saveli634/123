import { useEffect, type RefObject } from "react";
import { gsap } from "./motion";
import { canHover, motionAllowed } from "./env";

/** Магнитная кнопка: курсор притягивает её на 6–10 px. Только мышь/тачпад. */
export function useMagnetic<T extends HTMLElement>(ref: RefObject<T | null>, strength = 9) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !canHover() || !motionAllowed()) return;
    const x = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x(((e.clientX - r.left) / r.width - 0.5) * 2 * strength);
      y(((e.clientY - r.top) / r.height - 0.5) * 2 * strength * 0.7);
    };
    const leave = () => {
      x(0);
      y(0);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [ref, strength]);
}

/**
 * 3D-наклон карточки за курсором + позиция голографического блика (--mx, --my, --angle).
 * На сенсорных экранах вместо этого — лёгкое покачивание (CSS).
 */
export function useTilt<T extends HTMLElement>(ref: RefObject<T | null>, max = 9) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed()) return;
    gsap.set(el, { transformPerspective: 900 });
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });
    const tilt = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      const px = Math.min(1, Math.max(0, (x - r.left) / r.width));
      const py = Math.min(1, Math.max(0, (y - r.top) / r.height));
      rx((0.5 - py) * max);
      ry((px - 0.5) * max * 1.2);
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      el.style.setProperty("--angle", `${Math.round(px * 180 + py * 90)}deg`);
    };
    const reset = () => {
      el.classList.remove("is-hover");
      rx(0);
      ry(0);
    };

    // телефон: карточка наклоняется под пальцем, пока его ведут по ней.
    // Касание кнопки или ссылки карточку не трогает, а блик (смена прозрачности) — только когда палец ведут:
    // iPhone принимает появление чего-либо в момент касания за «наведение» и не нажимает кнопку.
    if (!canHover()) {
      const touch = (e: TouchEvent) => {
        const t = e.touches[0];
        if (!t || (e.target as Element | null)?.closest?.("a, button")) return;
        if (e.type === "touchmove") el.classList.add("is-hover");
        tilt(t.clientX, t.clientY);
      };
      el.addEventListener("touchstart", touch, { passive: true });
      el.addEventListener("touchmove", touch, { passive: true });
      el.addEventListener("touchend", reset);
      el.addEventListener("touchcancel", reset);
      return () => {
        el.removeEventListener("touchstart", touch);
        el.removeEventListener("touchmove", touch);
        el.removeEventListener("touchend", reset);
        el.removeEventListener("touchcancel", reset);
      };
    }

    const move = (e: PointerEvent) => tilt(e.clientX, e.clientY);
    const enter = () => el.classList.add("is-hover");
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", reset);
    };
  }, [ref, max]);
}
