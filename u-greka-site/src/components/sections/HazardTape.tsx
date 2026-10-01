import { useEffect, useRef } from "react";
import { services } from "@/data/services";
import { motionAllowed } from "@/lib/scrollFx";

/**
 * «Аварийная лента» с направлениями сервиса: две ленты крест-накрест.
 * Скорость и направление зависят от скорости прокрутки: листаете вниз — ленты
 * разгоняются, вверх — разворачиваются. Декоративная (aria-hidden): те же услуги
 * ниже, в разделе «Что делаем».
 */
const rowsText = [services.map((s) => s.title), [...services, ...services].map((s) => s.chip)];

export function HazardTape() {
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
      const speed = 42 + Math.min(1000, Math.abs(velocity)) * 0.6;

      rows.current.forEach((row, i) => {
        if (!row) return;
        const half = row.scrollWidth / 2;
        const sign = i === 0 ? -dir : dir;
        offsets[i] = (offsets[i] + sign * speed * dt) % half;
        if (offsets[i] > 0) offsets[i] -= half;
        const skew = Math.max(-10, Math.min(10, velocity * 0.007 * (i === 0 ? 1 : -1)));
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

  return (
    <div ref={root} aria-hidden="true" className="tape-wrap select-none">
      {(["tape-b", "tape-a"] as const).map((kind) => {
        const i = kind === "tape-a" ? 0 : 1;
        return (
          <div key={kind} className={`tape ${kind}`}>
            <div ref={(r) => { rows.current[i] = r; }} className="tape-row display">
              {[0, 1].map((copy) => (
                <span key={copy} className="flex shrink-0 items-center">
                  {rowsText[i].map((t, j) => (
                    <span key={`${copy}-${j}`} className="flex items-center">
                      {t}
                      <span className="tape-sep" />
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
