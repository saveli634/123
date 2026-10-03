import { useEffect } from "react";
import { motionAllowed } from "./scrollFx";
import { finePointer } from "./utils";

/**
 * Магнитные кнопки и подсветка карточек за курсором — один делегированный обработчик на страницу.
 * Только мышь/тачпад (pointer: fine) и без reduced motion.
 */
export function useInteractions() {
  useEffect(() => {
    if (!finePointer() || !motionAllowed()) return;
    let frame = 0;
    let px = -1e4;
    let py = -1e4;
    let target: EventTarget | null = null;
    const active = new Set<HTMLElement>();

    const apply = () => {
      frame = 0;
      // Подсветка: координаты курсора внутри ближайшей .glow
      const glow = (target as Element | null)?.closest?.(".glow") as HTMLElement | null;
      if (glow) {
        const r = glow.getBoundingClientRect();
        glow.style.setProperty("--mx", `${(px - r.left).toFixed(0)}px`);
        glow.style.setProperty("--my", `${(py - r.top).toFixed(0)}px`);
      }
      // Магнит: кнопка тянется к курсору в радиусе 28 px вокруг себя
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const pad = 28;
        const inside = px > r.left - pad && px < r.right + pad && py > r.top - pad && py < r.bottom + pad;
        const label = el.querySelector<HTMLElement>(".btn-label");
        if (inside) {
          const dx = px - (r.left + r.width / 2);
          const dy = py - (r.top + r.height / 2);
          el.style.transform = `translate3d(${(dx * 0.22).toFixed(2)}px, ${(dy * 0.3).toFixed(2)}px, 0)`;
          if (label) label.style.transform = `translate3d(${(dx * 0.08).toFixed(2)}px, ${(dy * 0.1).toFixed(2)}px, 0)`;
          el.style.transition = "transform 280ms cubic-bezier(.22,.8,.2,1), background-color 360ms, color 360ms, box-shadow 360ms";
          active.add(el);
        } else if (active.has(el)) {
          el.style.transition = "transform 700ms cubic-bezier(.22,.8,.2,1), background-color 360ms, color 360ms, box-shadow 360ms";
          el.style.transform = "";
          if (label) label.style.transform = "";
          active.delete(el);
        }
      });
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      px = e.clientX;
      py = e.clientY;
      target = e.target;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);
}

const TONES: Record<string, string> = { milk: "#F4EFE6", sand: "#EBE3D5", bordo: "#5A1F2B" };

/**
 * Перелив фона между секциями: молочный ↔ песок плавно меняется на общем слое.
 * Бордовые секции держат свой фон сами (и волну на стыке), а их data-tone — цвет соседей,
 * чтобы вокруг волны всегда был правильный тон.
 */
export function useBgTones() {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const root = document.documentElement;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-tone]"));
    if (!sections.length) return;
    root.classList.add("bgfx");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const tone = (e.target as HTMLElement).dataset.tone!;
          root.style.setProperty("--page-bg", TONES[tone] ?? TONES.milk);
          const meta = document.querySelector('meta[name="theme-color"]');
          meta?.setAttribute("content", TONES[tone] ?? TONES.milk);
        }
      },
      // Тон меняется, когда секция пересекает линию чуть ниже середины экрана
      { rootMargin: "-56% 0px -44% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => {
      io.disconnect();
      root.classList.remove("bgfx");
    };
  }, []);
}
