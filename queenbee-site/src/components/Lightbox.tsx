import { useEffect, useRef, useState } from "react";
import { Photo } from "./Photo";
import type { Work } from "@/content/media";
import { lockScroll } from "@/lib/scroll";

/** Просмотр работ на весь экран: стрелки, свайп, Esc, фокус внутри окна. */
export function Lightbox({ items, index, onClose }: { items: Work[]; index: number; onClose: () => void }) {
  const [i, setI] = useState(index);
  const box = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const n = items.length;
  const go = (d: number) => setI((v) => (v + d + n) % n);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    lockScroll(true);
    box.current?.querySelector<HTMLElement>(".lb__close")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab" && box.current) {
        const f = box.current.querySelectorAll<HTMLElement>("button");
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lockScroll(false);
      prev?.focus({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const w = items[i];
  return (
    <div
      className="lb"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр работ"
      ref={box}
      onPointerDown={(e) => (start.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const s = start.current;
        start.current = null;
        if (!s) return;
        const dx = e.clientX - s.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="lb__backdrop" onClick={onClose} />
      <figure className="lb__fig" key={w.name}>
        <Photo name={w.name} alt={w.alt} fit="contain" className="lb__img" sizes="100vw" eager />
        <figcaption className="lb__cap">
          <span>{w.label}</span>
          <span className="lb__count">
            {String(i + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
          </span>
        </figcaption>
      </figure>
      <button type="button" className="lb__btn lb__prev" onClick={() => go(-1)} aria-label="Предыдущая работа">
        <svg viewBox="0 0 40 12" aria-hidden="true"><path d="M40 6H2M7 1 2 6l5 5" /></svg>
      </button>
      <button type="button" className="lb__btn lb__next" onClick={() => go(1)} aria-label="Следующая работа">
        <svg viewBox="0 0 40 12" aria-hidden="true"><path d="M0 6h38M33 1l5 5-5 5" /></svg>
      </button>
      <button type="button" className="lb__close" onClick={onClose}>
        Закрыть
      </button>
    </div>
  );
}
