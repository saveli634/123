import { useEffect, useRef } from "react";
import { products } from "@/content/catalog";
import { motionAllowed } from "@/lib/scrollFx";

/**
 * Бегущая лента названий моделей. Скорость и направление зависят от скорости прокрутки:
 * листаете вниз — лента ускоряется влево, вверх — разворачивается. Декоративная (aria-hidden):
 * сами модели доступны в каталоге.
 */
export function Marquee() {
  const root = useRef<HTMLDivElement>(null);
  const rows = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = root.current;
    if (!el || !motionAllowed()) return;
    let raf = 0;
    let visible = false;
    let last = performance.now();
    let lastY = window.scrollY;
    let velocity = 0;
    let dir = 1;
    const offsets = [0, 0];

    const loop = (now: number) => {
      const dt = Math.min(64, now - last) / 1000;
      last = now;
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      velocity += (dy / Math.max(dt, 0.001) - velocity) * 0.12;
      if (Math.abs(dy) > 0.5) dir = dy > 0 ? 1 : -1;
      const speed = 38 + Math.min(900, Math.abs(velocity)) * 0.55;

      rows.current.forEach((row, i) => {
        if (!row) return;
        const half = row.scrollWidth / 2;
        const sign = i === 0 ? -dir : dir;
        offsets[i] = (offsets[i] + sign * speed * dt) % half;
        if (offsets[i] > 0) offsets[i] -= half;
        // Лёгкий наклон букв от скорости — ощущение инерции
        const skew = Math.max(-8, Math.min(8, velocity * 0.006 * (i === 0 ? 1 : -1)));
        row.style.transform = `translate3d(${offsets[i].toFixed(2)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
      });
      raf = visible ? requestAnimationFrame(loop) : 0;
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) {
        last = performance.now();
        lastY = window.scrollY;
        raf = requestAnimationFrame(loop);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const names = products.map((p) => p.name);
  const Row = ({ outline }: { outline?: boolean }) => (
    <>
      {[0, 1].map((copy) => (
        <span key={copy} className="flex shrink-0 items-center">
          {names.map((n) => (
            <span key={n + copy} className="flex items-center">
              <span className={outline ? "marquee-outline" : ""}>{n}</span>
              <span className="serif mx-[0.35em] text-terracotta">·</span>
            </span>
          ))}
        </span>
      ))}
    </>
  );

  return (
    <div ref={root} aria-hidden="true" className="overflow-hidden bg-ivory py-10 select-none lg:py-16">
      <div ref={(r) => { rows.current[0] = r; }} className="display flex w-max text-[clamp(3.4rem,10vw,10rem)] leading-[1.05] whitespace-nowrap text-graphite will-change-transform">
        <Row />
      </div>
      <div ref={(r) => { rows.current[1] = r; }} className="display flex w-max text-[clamp(3.4rem,10vw,10rem)] leading-[1.05] whitespace-nowrap text-graphite will-change-transform">
        <Row outline />
      </div>
    </div>
  );
}
