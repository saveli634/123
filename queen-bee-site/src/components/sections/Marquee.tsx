import { Fragment, useEffect, useRef } from "react";
import { marquee } from "@/content/text";
import { motionAllowed } from "@/lib/scrollFx";

const Sep = () => (
  <svg viewBox="-10 -10 20 20" className="size-[0.32em] shrink-0" aria-hidden="true">
    <polygon points="0,-9 7.8,-4.5 7.8,4.5 0,9 -7.8,4.5 -7.8,-4.5" fill="none" stroke="#B9944F" strokeWidth="1.4" />
  </svg>
);

/**
 * Бегущая лента «Queen Bee · Boheme Residence · Место встречи».
 * Скорость растёт со скоростью прокрутки, направление следует за прокруткой. Декор: aria-hidden.
 */
export function Marquee() {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    const box = wrap.current;
    if (!el || !box || !motionAllowed()) return;
    let x = 0;
    let dir = -1;
    let boost = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let raf = 0;
    let visible = false;
    let idleFor = 0;
    const half = () => el.scrollWidth / 2;

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (Math.abs(dy) > 0.5) {
        dir = dy > 0 ? -1 : 1;
        idleFor = 0;
      } else idleFor += dt;
      boost += (Math.min(900, Math.abs(dy) / Math.max(dt, 0.001)) - boost) * Math.min(1, dt * 4);
      // лента движется вместе с прокруткой; без прокрутки дольше 5 с — плавно замирает (WCAG 2.2.2)
      const drift = 38 * (1 - Math.min(1, Math.max(0, idleFor - 4)));
      const speed = drift + boost * 0.35;
      x += dir * speed * dt;
      const h = half();
      if (x <= -h) x += h;
      if (x > 0) x -= h;
      el.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) {
        lastT = performance.now();
        lastY = window.scrollY;
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(box);
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && visible) {
        lastT = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  const row = (
    <span className="marquee-item">
      {[...marquee, ...marquee].map((t, i) => (
        <Fragment key={i}>
          <span className={i % 3 === 0 ? "it" : ""}>{t}</span>
          <Sep />
        </Fragment>
      ))}
    </span>
  );
  return (
    <div ref={wrap} className="marquee tone-milk display py-5 text-[clamp(2rem,5.4vw,4.6rem)] leading-none text-espresso md:py-7" aria-hidden="true">
      <div ref={track} className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}
