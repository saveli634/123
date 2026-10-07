import { useEffect, useRef } from "react";
import { gsap } from "@/lib/motion";
import { canHover, motionAllowed } from "@/lib/env";

/**
 * Фирменный курсор (только мышь/тачпад): точка и кольцо с запаздыванием.
 * Над ссылками и кнопками кольцо растёт; у элементов с data-cursor показывает подпись («тяни», «листай»).
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!canHover() || !motionAllowed() || !dot.current || !ring.current) return;
    const d = dot.current;
    const r = ring.current;
    const html = document.documentElement;
    html.classList.add("has-cursor");
    const dx = gsap.quickTo(d, "x", { duration: 0.08, ease: "power3.out" });
    const dy = gsap.quickTo(d, "y", { duration: 0.08, ease: "power3.out" });
    const rx = gsap.quickTo(r, "x", { duration: 0.45, ease: "power3.out" });
    const ry = gsap.quickTo(r, "y", { duration: 0.45, ease: "power3.out" });
    let shown = false;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      dx(e.clientX);
      dy(e.clientY);
      rx(e.clientX);
      ry(e.clientY);
      if (!shown) {
        shown = true;
        html.classList.add("cursor-on");
      }
      const t = e.target as Element | null;
      const lab = t?.closest?.("[data-cursor]")?.getAttribute("data-cursor") ?? "";
      const link = !!t?.closest?.("a, button, [role='slider'], [data-cursor]");
      r.classList.toggle("is-link", link && !lab);
      r.classList.toggle("is-label", !!lab);
      if (label.current && label.current.textContent !== lab) label.current.textContent = lab;
    };
    const leave = () => {
      shown = false;
      html.classList.remove("cursor-on");
    };
    const down = () => r.classList.add("is-down");
    const up = () => r.classList.remove("is-down");
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      html.classList.remove("has-cursor", "cursor-on");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <>
      <div className="cursor-ring" ref={ring} aria-hidden="true">
        <span className="cursor-label" ref={label} />
      </div>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
    </>
  );
}
