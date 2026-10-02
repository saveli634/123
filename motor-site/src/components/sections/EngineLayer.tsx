import { useEffect, useRef } from "react";
import type { EngineScene, Layout } from "@/three/engineScene";
import { finePointer, motionAllowed, webgl2Available } from "@/lib/env";
import { Img } from "@/components/shared/Img";

/**
 * Живой 3D-мотор: один холст на весь экран под первым экраном и сценой этапов.
 * Мотор с первого экрана плавно переезжает в сцену «Капиталка за один прокрут».
 *
 *  — Three.js грузится лениво: на компьютере после загрузки страницы,
 *    на телефоне — при первом касании/прокрутке или на подходе к сцене;
 *  — рисует, только пока первый экран или сцена на экране, и стоит при скрытой вкладке;
 *  — нет WebGL 2 или «уменьшить движение» → остаются готовые рендеры той же модели.
 */
function layouts(w: number, h: number): { hero: Layout; stage: Layout } {
  const asp = w / Math.max(1, h);
  if (w >= 1024 && asp >= 1.2) return { hero: { x: 0.755, y: 0.6, zoom: 1.66 }, stage: { x: 0.52, y: 0.5, zoom: 1.38 } };
  if (asp >= 1.2) return { hero: { x: 0.72, y: 0.6, zoom: 1.55 }, stage: { x: 0.52, y: 0.52, zoom: 1.4 } };
  return { hero: { x: 0.5, y: 0.82, zoom: 1.42 }, stage: { x: 0.5, y: 0.53, zoom: 1.5 } };
}

export function EngineLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const canvas = canvasRef.current;
    if (!canvas || !motionAllowed() || !webgl2Available()) {
      root.classList.add("engine-static");
      return;
    }
    const hero = document.getElementById("top");
    const stages = document.getElementById("etapy");
    if (!hero || !stages) return;

    const fine = finePointer();
    const mobile = !fine || window.innerWidth < 768;
    let scene: EngineScene | null = null;
    let disposed = false;
    let loading = false;
    let stageTop = 0;
    let stageH = 1;
    let vh = window.innerHeight;
    let inView = true;
    let frame = 0;

    const measure = () => {
      const r = stages.getBoundingClientRect();
      stageTop = r.top + window.scrollY;
      stageH = r.height;
      vh = window.innerHeight;
    };

    const timeline = () => {
      const y = window.scrollY;
      if (y < stageTop) return stageTop > 0 ? y / stageTop : 0;
      return 1 + 6 * Math.min(1, (y - stageTop) / Math.max(1, stageH - vh));
    };

    // Видим, пока закреплённая сцена не ушла целиком (дальше разделы с фоном перекрывают слой)
    const visible = () => window.scrollY < stageTop + stageH;

    const update = () => {
      frame = 0;
      if (!scene) return;
      scene.setTimeline(timeline());
      const v = visible() && !document.hidden;
      root.classList.toggle("engine-off", !visible());
      if (v && inView) scene.start();
      else scene.stop();
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const resize = () => {
      measure();
      if (!scene) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const l = layouts(w, h);
      scene.setLayout(l.hero, l.stage);
      scene.resize(w, h);
      request();
    };

    const hudX = document.querySelector<HTMLElement>("[data-hud='x']");
    const hudY = document.querySelector<HTMLElement>("[data-hud='y']");
    const hudZ = document.querySelector<HTMLElement>("[data-hud='z']");
    let hudTimer = 0;

    const load = () => {
      if (loading || disposed) return;
      loading = true;
      import("@/three/engineScene").then(({ createEngineScene }) => {
        if (disposed) return;
        scene = createEngineScene(canvas, {
          mobile,
          onQuality: (q) => root.setAttribute("data-quality", String(q)),
        });
        if (!scene) {
          root.classList.add("engine-static");
          return;
        }
        resize();
        scene.setTimeline(timeline());
        update();
        // Холст проявляется после первого кадра — без чёрной вспышки
        requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add("engine-live")));
        hudTimer = window.setInterval(() => {
          if (!scene || !hudX || !hudY || !hudZ) return;
          const h = scene.hud();
          hudX.textContent = h.x.toFixed(2);
          hudY.textContent = h.y.toFixed(2);
          hudZ.textContent = h.z.toFixed(2);
        }, 120);
      });
    };

    measure();
    // Высота страницы меняется после загрузки шрифтов и раскладки галереи — пересчитываем границы сцены
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => (measure(), request())) : null;
    ro?.observe(document.body);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", resize);
    const onVis = () => request();
    document.addEventListener("visibilitychange", onVis);

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries.some((e) => e.isIntersecting) || visible();
        request();
      },
      { rootMargin: "0px" },
    );
    io.observe(hero);
    io.observe(stages);

    const onPointer = (e: PointerEvent) => {
      if (!scene || e.pointerType !== "mouse") return;
      scene.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
    };
    if (fine) window.addEventListener("pointermove", onPointer, { passive: true });

    // Когда грузить Three.js
    const intents = ["pointerdown", "touchstart", "keydown", "wheel"] as const;
    const onIntent = () => {
      intents.forEach((ev) => window.removeEventListener(ev, onIntent));
      window.removeEventListener("scroll", onScrollIntent);
      load();
    };
    const onScrollIntent = () => {
      if (window.scrollY > 40) onIntent();
    };
    let idle = 0;
    let near: IntersectionObserver | null = null;
    if (!mobile) {
      const go = () => (idle = window.setTimeout(load, 120));
      if (document.readyState === "complete") go();
      else window.addEventListener("load", go, { once: true });
    } else {
      intents.forEach((ev) => window.addEventListener(ev, onIntent, { passive: true, once: true }));
      window.addEventListener("scroll", onScrollIntent, { passive: true });
      near = new IntersectionObserver(
        (en) => {
          if (en.some((e) => e.isIntersecting)) {
            near?.disconnect();
            load();
          }
        },
        { rootMargin: "0px 0px 15% 0px" },
      );
      near.observe(stages);
    }

    return () => {
      disposed = true;
      clearTimeout(idle);
      clearInterval(hudTimer);
      io.disconnect();
      near?.disconnect();
      ro?.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVis);
      intents.forEach((ev) => window.removeEventListener(ev, onIntent));
      window.removeEventListener("scroll", onScrollIntent);
      cancelAnimationFrame(frame);
      scene?.dispose();
      root.classList.remove("engine-live");
    };
  }, []);

  return (
    <div className="engine-layer" aria-hidden="true">
      {/* Фон финального этапа — под мотором: красный цех, только под затемнением и размытием */}
      <div className="engine-bg">
        <Img name="red_garage_atmosphere-bg" alt="" sizes="100vw" className="engine-bg-img" />
      </div>
      <canvas ref={canvasRef} className="engine-canvas" />
    </div>
  );
}
