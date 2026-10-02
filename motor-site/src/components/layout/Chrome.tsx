import { useEffect, useRef } from "react";
import { FILL, SITE, UI } from "@/content/copy";
import { Cta } from "@/components/shared/Cta";
import { Fill } from "@/components/shared/Fill";
import { field, finePointer, motionAllowed } from "@/lib/env";
import { siteName } from "@/lib/links";

/** Красная нить-прогресс страницы. */
export function Progress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const on = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        el.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0})`;
      });
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div className="thread" aria-hidden="true">
      <div ref={ref} className="thread-bar" />
    </div>
  );
}

/** Нижняя панель телефона «Позвонить / WhatsApp» — контент получает отступ снизу. */
export function MobileBar() {
  return (
    <div className="mbar" role="region" aria-label={UI.quick}>
      <Cta kind="call" magnetic={false} className="mbar-btn" />
      <Cta kind="whatsapp" variant="outline" magnetic={false} className="mbar-btn" label="WhatsApp" />
    </div>
  );
}

export function Footer() {
  const insta = field("instagram");
  const year = 2026;
  return (
    <footer className="ftr">
      <div className="wrap">
        <p className="ftr-name display" aria-hidden="true">
          {siteName()}
        </p>
        <div className="ftr-row">
          <p className="label">
            {SITE.city}, {SITE.country}
          </p>
          <p className="ftr-note">{SITE.footerNote}</p>
          {insta ? (
            <a href={insta} target="_blank" rel="noopener noreferrer" className="uline ftr-link" data-cursor="link">
              Instagram
            </a>
          ) : (
            <Fill what={FILL.instagram} />
          )}
          <p className="label ftr-c">
            © <span className="num">{year}</span> {siteName()}
          </p>
        </div>
      </div>
    </footer>
  );
}

/** Кастомный курсор: точка без задержки и кольцо на пружине (только мышь/тачпад). */
export function Cursor() {
  useEffect(() => {
    if (!motionAllowed() || !finePointer()) return;
    const root = document.documentElement;
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    const label = document.createElement("span");
    dot.className = "cursor cursor-dot";
    ring.className = "cursor cursor-ring";
    label.className = "cursor-label";
    ring.appendChild(label);
    document.body.append(ring, dot);
    root.classList.add("has-cursor");
    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let vx = 0;
    let vy = 0;
    let s = 0.5;
    let ts = 0.5;
    let raf = 0;
    let shown = false;
    const loop = () => {
      vx = (vx + (x - rx) * 0.2) * 0.62;
      vy = (vy + (y - ry) * 0.2) * 0.62;
      rx += vx;
      ry += vy;
      s += (ts - s) * 0.18;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0) scale(${s.toFixed(3)})`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) + Math.abs(ts - s) > 0.05 ? requestAnimationFrame(loop) : 0;
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (!shown) {
        shown = true;
        rx = x;
        ry = y;
        root.classList.add("cursor-on");
      }
      kick();
    };
    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement)?.closest?.("[data-cursor], a, button, input, textarea, [role='button']") as HTMLElement | null;
      const kind = t?.dataset.cursor ?? (t ? (t.matches("input, textarea") ? "text" : "link") : "");
      ring.dataset.kind = kind;
      ts = kind === "link" ? 1 : kind === "drag" ? 1.25 : kind === "text" ? 0.3 : 0.5;
      label.textContent = kind === "drag" ? UI.drag : "";
      kick();
    };
    const leave = () => {
      shown = false;
      root.classList.remove("cursor-on");
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
      dot.remove();
      ring.remove();
      root.classList.remove("has-cursor", "cursor-on");
    };
  }, []);
  return null;
}
