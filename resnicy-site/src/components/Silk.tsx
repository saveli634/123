import { useEffect, useRef } from "react";
import { Silk as SilkGL } from "@/lib/silk";
import { canHover, motionAllowed } from "@/lib/env";
import { isLowPower, onLowPower, reportFrame } from "@/lib/perf";

/**
 * Живой фон «шёлк» для секции. Под холстом — CSS-градиент: он виден, пока WebGL не запустился,
 * если WebGL нет, без скриптов и в предпросмотре файла.
 * Курсор слегка «тянет» складки; на телефоне точка притяжения медленно плавает сама.
 */
export function Silk({ className = "", mood = 1 }: { className?: string; mood?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const silk = SilkGL.create(el, mood);
    if (!silk) return;
    silk.setScale(isLowPower() ? 0.34 : 0.5);
    el.classList.add("is-live");
    // живой шёлк закрывает CSS-«сияние» под ним — его анимацию можно не считать
    el.parentElement?.classList.add("has-silk");

    // без видеоускорения и при «уменьшить движение» — один статичный кадр
    const animate = motionAllowed() && !silk.software;
    const hover = canHover();
    let frame = 0;
    let running = false;
    let last = 0;
    let skip = false;
    const t0 = performance.now();

    let touchedAt = -1e9;
    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      // на слабых устройствах — каждый второй кадр
      if (isLowPower()) {
        skip = !skip;
        if (skip) return;
      }
      const t = (now - t0) / 1000;
      // на телефоне точка притяжения плавает сама, а после касания — тянется за пальцем
      if (!hover && now - touchedAt > 2500) silk.pointer(0.5 + Math.sin(t * 0.21) * 0.28, 0.45 + Math.cos(t * 0.17) * 0.22);
      silk.draw(t + 12);
      if (last) reportFrame(now - last);
      last = now;
    };
    let ready = false;
    let want = false;
    const start = () => {
      want = true;
      if (running || !animate || !ready) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      want = false;
      running = false;
      cancelAnimationFrame(frame);
    };
    // анимацию запускаем, когда страница догрузилась и браузер свободен — не мешаем первому показу
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const go = () => {
      ready = true;
      if (want) start();
    };
    const idleId = idle ? idle(go, { timeout: 2500 }) : window.setTimeout(go, 1200);

    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: "60px" });
    io.observe(el);
    const ro = "ResizeObserver" in window ? new ResizeObserver(() => (silk.resize(), animate || silk.draw(12))) : null;
    ro?.observe(el);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      silk.pointer((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    };
    const touch = (e: TouchEvent) => {
      const tt = e.touches[0];
      if (!tt) return;
      const r = el.getBoundingClientRect();
      if (tt.clientY < r.top || tt.clientY > r.bottom) return;
      touchedAt = performance.now();
      silk.pointer((tt.clientX - r.left) / r.width, (tt.clientY - r.top) / r.height);
    };
    if (hover) window.addEventListener("pointermove", move, { passive: true });
    else {
      window.addEventListener("touchstart", touch, { passive: true });
      window.addEventListener("touchmove", touch, { passive: true });
    }
    const unLow = onLowPower(() => {
      silk.setScale(0.34);
      if (!animate) silk.draw(12); // смена размера холста стирает кадр
    });
    silk.draw(12); // первый кадр сразу (и единственный при «уменьшить движение»)

    return () => {
      el.parentElement?.classList.remove("has-silk");
      stop();
      if (!idle) window.clearTimeout(idleId);
      io.disconnect();
      ro?.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("touchstart", touch);
      window.removeEventListener("touchmove", touch);
      unLow();
    };
  }, [mood]);

  return <canvas ref={canvas} className={`silk ${className}`} aria-hidden="true" />;
}
