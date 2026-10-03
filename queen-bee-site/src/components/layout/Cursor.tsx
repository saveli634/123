import { useEffect, useRef, useState } from "react";
import { Bee } from "@/components/shared/Bee";
import { motionAllowed } from "@/lib/scrollFx";
import { finePointer } from "@/lib/utils";

/**
 * Курсор-соты (шестиугольник с точкой) и пчела-спутник, которая летит следом с запаздыванием
 * и поворачивается по направлению полёта. Только мышь, без reduced motion.
 */
export function Cursor() {
  const [on, setOn] = useState(false);
  const hex = useRef<HTMLDivElement>(null);
  const bee = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (finePointer() && motionAllowed()) setOn(true);
  }, []);

  useEffect(() => {
    if (!on) return;
    const root = document.documentElement;
    root.classList.add("has-cursor");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let bx = x;
    let by = y;
    let angle = 0;
    let raf = 0;
    let last = performance.now();
    let seen = false;
    const H = hex.current!;
    const B = bee.current!;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      // пчела догоняет точку чуть позади курсора, с лёгким «зависанием»
      const t = now / 1000;
      const tx = x - 26 + Math.sin(t * 2.3) * 5;
      const ty = y + 22 + Math.cos(t * 1.7) * 4;
      const k = 1 - Math.exp(-dt * 5.5);
      const vx = (tx - bx) * k;
      const vy = (ty - by) * k;
      bx += vx;
      by += vy;
      const speed = Math.hypot(vx, vy);
      if (speed > 0.35) {
        const target = Math.atan2(vy, vx) * (180 / Math.PI) + 90;
        let d = target - angle;
        d = ((d + 540) % 360) - 180;
        angle += d * Math.min(1, dt * 8);
      }
      B.style.transform = `translate3d(${bx.toFixed(1)}px, ${by.toFixed(1)}px, 0) rotate(${angle.toFixed(1)}deg)`;
      raf = requestAnimationFrame(loop);
    };

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      x = e.clientX;
      y = e.clientY;
      H.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!seen) {
        seen = true;
        bx = x - 40;
        by = y + 30;
        H.dataset.hidden = "false";
        B.dataset.hidden = "false";
      }
      const interactive = (e.target as Element | null)?.closest?.("a, button, [role='button'], label, input, textarea");
      H.dataset.hover = interactive ? "true" : "false";
    };
    const leave = () => {
      H.dataset.hidden = "true";
      B.dataset.hidden = "true";
      seen = false;
    };
    const vis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.documentElement.addEventListener("mouseleave", leave);
    document.addEventListener("visibilitychange", vis);
    raf = requestAnimationFrame(loop);
    return () => {
      root.classList.remove("has-cursor");
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.removeEventListener("visibilitychange", vis);
    };
  }, [on]);

  if (!on) return null;
  return (
    <>
      <div ref={hex} className="cursor-hex" data-hidden="true" aria-hidden="true">
        <svg viewBox="-20 -20 40 40">
          <polygon points="0,-17 14.7,-8.5 14.7,8.5 0,17 -14.7,8.5 -14.7,-8.5" />
          <circle r="2.2" />
        </svg>
      </div>
      <div ref={bee} className="cursor-bee" data-hidden="true" aria-hidden="true">
        <Bee fly />
      </div>
    </>
  );
}
