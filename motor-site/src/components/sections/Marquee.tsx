import { useEffect, useRef } from "react";
import { MARQUEE } from "@/content/copy";
import { addTicker, scrollState } from "@/lib/scroll";
import { motionAllowed } from "@/lib/env";

/**
 * Бегущая лента моделей. Скорость — от скорости прокрутки, направление — по направлению
 * прокрутки. Работает, только пока лента на экране (декор, aria-hidden).
 */
export function Marquee() {
  const ref = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const tr = track.current;
    if (!el || !tr || !motionAllowed()) return;
    let x = 0;
    let half = tr.scrollWidth / 2;
    let stop: (() => void) | null = null;
    let dir = 1;
    let idle = 0;
    let drift = 1;
    const tick = (dt: number) => {
      const v = scrollState.velocity;
      if (Math.abs(v) > 0.3) {
        dir = v > 0 ? 1 : -1;
        idle = 0;
      } else idle += dt;
      // Без прокрутки лента плавно останавливается через 5 с (не отвлекает от чтения)
      drift += ((idle > 5000 ? 0 : 1) - drift) * 0.04;
      const speed = (0.55 * drift + Math.min(14, Math.abs(v) * 0.42)) * (dt / 16.7);
      x -= speed * dir;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      tr.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !stop) stop = addTicker(tick);
      else if (!e.isIntersecting && stop) {
        stop();
        stop = null;
      }
    });
    io.observe(el);
    const onResize = () => (half = tr.scrollWidth / 2);
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      stop?.();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const row = (key: string) =>
    MARQUEE.map((m, i) => (
      <span key={`${key}${i}`} className="mq-item">
        <span className={i % 2 ? "mq-solid" : "mq-outline"}>{m}</span>
        <span className="mq-sep">+</span>
      </span>
    ));

  return (
    <div ref={ref} className="mq" aria-hidden="true">
      <div ref={track} className="mq-track display">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}
