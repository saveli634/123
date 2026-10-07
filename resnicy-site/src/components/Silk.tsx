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

    // без видеоускорения и при «уменьшить движение» — один статичный кадр
    const animate = motionAllowed() && !silk.software;
    const hover = canHover();
    let frame = 0;
    let running = false;
    let last = 0;
    let skip = false;
    const t0 = performance.now();

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop);
      // на слабых устройствах — каждый второй кадр
      if (isLowPower()) {
        skip = !skip;
        if (skip) return;
      }
      const t = (now - t0) / 1000;
      if (!hover) silk.pointer(0.5 + Math.sin(t * 0.21) * 0.28, 0.45 + Math.cos(t * 0.17) * 0.22);
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
    if (hover) window.addEventListener("pointermove", move, { passive: true });
    const unLow = onLowPower(() => {
      silk.setScale(0.34);
      if (!animate) silk.draw(12); // смена размера холста стирает кадр
    });
    silk.draw(12); // первый кадр сразу (и единственный при «уменьшить движение»)

    return () => {
      stop();
      if (!idle) window.clearTimeout(idleId);
      io.disconnect();
      ro?.disconnect();
      window.removeEventListener("pointermove", move);
      unLow();
    };
  }, [mood]);

  return <canvas ref={canvas} className={`silk ${className}`} aria-hidden="true" />;
}
