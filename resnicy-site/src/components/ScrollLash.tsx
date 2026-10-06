import { useEffect, useRef } from "react";
import { motionAllowed } from "@/lib/env";

/**
 * Прогресс прокрутки сверху страницы — тонкая изогнутая ресница, которая «отрастает» слева направо.
 * Двойной сдвиг: обёртка уезжает влево, рисунок — обратно, видимая часть растёт (только transform).
 */
export function ScrollLash() {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!motionAllowed()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const off = (1 - p) * 100;
      if (wrap.current) wrap.current.style.transform = `translate3d(-${off}%,0,0)`;
      if (inner.current) inner.current.style.transform = `translate3d(${off}%,0,0)`;
      if (tip.current) {
        tip.current.style.transform = `translate3d(${p * window.innerWidth}px,${(1 - p) * 5}px,0)`;
        tip.current.style.opacity = p > 0.003 && p < 0.997 ? "1" : "0";
      }
    };
    const req = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    return () => {
      window.removeEventListener("scroll", req);
      window.removeEventListener("resize", req);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div className="scroll-lash" aria-hidden="true">
      <div className="scroll-lash-wrap" ref={wrap}>
        <div className="scroll-lash-inner" ref={inner}>
          <svg viewBox="0 0 1000 10" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lash-grad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor="#D9C9FF" />
                <stop offset="0.7" stopColor="#F7F3FA" />
                <stop offset="1" stopColor="#8E5BFF" />
              </linearGradient>
            </defs>
            <path d="M0 6.2 C 300 7.4, 700 6.4, 1000 1.2 C 700 5.2, 300 4.6, 0 3.4 Z" fill="url(#lash-grad)" />
          </svg>
        </div>
      </div>
      <span className="scroll-lash-tip" ref={tip} />
    </div>
  );
}
