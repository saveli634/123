import { useEffect, useRef, type ReactNode } from "react";
import { finePointer, motionOk } from "@/lib/motion";
import { Sparkle } from "./glyphs";

/** Магнитное притяжение к курсору (до ~8 px), только мышь/тачпад */
function useMagnet<T extends HTMLElement>(strength = 8) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOk() || !finePointer()) return;
    const inner = el.querySelector<HTMLElement>(".btn__label");
    let f = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      f = 0;
      el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
      if (inner) inner.style.transform = `translate3d(${x * strength * 0.35}px, ${y * strength * 0.35}px, 0)`;
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      el.classList.add("is-magnet");
      if (!f) f = requestAnimationFrame(apply);
    };
    const leave = () => {
      x = 0;
      y = 0;
      el.classList.remove("is-magnet");
      if (!f) f = requestAnimationFrame(apply);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(f);
    };
  }, [strength]);
  return ref;
}

interface BtnProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "gold";
  external?: boolean;
  icon?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function Btn({ href, children, variant = "primary", external, icon, className = "", ariaLabel }: BtnProps) {
  const ref = useMagnet<HTMLAnchorElement>(8);
  return (
    <a
      ref={ref}
      href={href}
      className={`btn btn--${variant} ${className}`}
      aria-label={ariaLabel}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      <span className="btn__label">
        {icon}
        {children}
      </span>
    </a>
  );
}

export function SubmitBtn({ children }: { children: ReactNode }) {
  const ref = useMagnet<HTMLButtonElement>(8);
  return (
    <button ref={ref} type="submit" className="btn btn--primary">
      <span className="btn__label">{children}</span>
    </button>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`eyebrow ${className}`}>
      <Sparkle size={10} className="eyebrow__star" />
      {children}
    </p>
  );
}

/**
 * Один наблюдатель на всю страницу: элементам с классом .rv добавляет .is-in при появлении.
 * Скрыты они только при классе .js на <html> (и без «уменьшить движение»).
 */
export function useRevealObserver() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".rv");
    const show = (el: Element) => el.classList.add("is-in");
    if (!("IntersectionObserver" in window)) {
      els.forEach(show);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          show(e.target);
          io.unobserve(e.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
