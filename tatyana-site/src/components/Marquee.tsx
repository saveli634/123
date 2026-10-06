import { useEffect, useRef } from "react";
import { marqueeWords } from "@/data/content";
import { motionOk } from "@/lib/motion";
import { scrollVelocity } from "@/lib/scroll";
import { SPARKLE } from "./glyphs";

/** Бегущая лента «число · месяц · год · город · время»: скорость — от скорости прокрутки. */
function Row({ big, reverse }: { big?: boolean; reverse?: boolean }) {
  const words = [...marqueeWords, ...marqueeWords];
  return (
    <div className={`marquee__row${big ? " marquee__row--big" : ""}`} data-dir={reverse ? -1 : 1}>
      {[0, 1].map((half) => (
        <div key={half} className="marquee__half">
          {words.map((w, i) => (
            <span key={i} className="marquee__item">
              <span className={i % 2 && big ? "marquee__word marquee__word--em" : "marquee__word"}>{w}</span>
              <svg viewBox="0 0 24 24" className="marquee__star" aria-hidden="true">
                <path d={SPARKLE} />
              </svg>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function Marquee() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOk()) return;
    const rows = Array.from(el.querySelectorAll<HTMLElement>(".marquee__row"));
    const state = rows.map((r) => ({ el: r, x: 0, w: 0, dir: Number(r.dataset.dir) }));
    const measure = () => state.forEach((s) => (s.w = (s.el.firstElementChild as HTMLElement).offsetWidth));
    measure();
    let raf = 0;
    let last = performance.now();
    let boost = 0;
    let sign = 1;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(48, t - last) / 1000;
      last = t;
      const v = scrollVelocity();
      if (Math.abs(v) > 0.2) sign = v > 0 ? 1 : -1;
      boost += (Math.min(60, Math.abs(v)) - boost) * 0.1;
      const speed = 38 + boost * 26;
      state.forEach((s, i) => {
        if (!s.w) return;
        s.x -= speed * dt * s.dir * sign * (i ? 1.25 : 1);
        s.x = ((s.x % s.w) + s.w) % s.w;
        s.el.style.transform = `translate3d(${(-s.x).toFixed(1)}px,0,0)`;
      });
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(el);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={ref} className="marquee" aria-hidden="true">
      <Row big />
      <Row reverse />
    </div>
  );
}
