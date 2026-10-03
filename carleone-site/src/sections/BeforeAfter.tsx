import { useEffect, useRef, type CSSProperties, type KeyboardEvent, type PointerEvent as RPointerEvent } from "react";
import { useT } from "@/lib/lang";
import { CONFIG } from "@/config";
import { motionOK } from "@/lib/env";
import type { FrameName } from "@/content/frames";
import { Frame } from "@/components/Frame";
import { Kicker, Lines } from "@/components/Text";
import { IconDrag } from "@/components/Icons";

const PAIRS: [FrameName, FrameName][] = [
  ["underbody_before_1", "underbody_after_1"],
  ["underbody_before_2", "underbody_after_2"],
];

/** Шторка «было / стало»: перетаскивание (мышь, палец), стрелки с клавиатуры. */
function Compare({ before, after, index }: { before: FrameName; after: FrameName; index: number }) {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const pos = useRef(50);
  const drag = useRef(false);

  const set = (v: number) => {
    pos.current = Math.max(0, Math.min(100, v));
    const el = root.current;
    if (!el) return;
    el.style.setProperty("--pos", `${pos.current.toFixed(2)}%`);
    el.setAttribute("aria-valuenow", String(Math.round(pos.current)));
  };

  const fromEvent = (e: RPointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100);
  };

  // подсказка движением: шторка один раз «дышит», когда блок появился
  useEffect(() => {
    const el = root.current;
    if (!el || !motionOK()) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const start = performance.now() + index * 260;
        const tick = (now: number) => {
          if (drag.current) return;
          const k = Math.max(0, (now - start) / 1600);
          if (k >= 1) return set(50);
          set(50 - Math.sin(k * Math.PI * 2) * 16 * (1 - k));
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 4;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") set(pos.current - step);
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") set(pos.current + step);
    else if (e.key === "Home") set(0);
    else if (e.key === "End") set(100);
    else return;
    e.preventDefault();
  };

  return (
    <figure className="fade-up" style={{ "--d": index * 120 } as CSSProperties}>
      <div
        ref={root}
        className="ba frame-shell"
        role="slider"
        tabIndex={0}
        aria-label={`${t.a11y.slider} — ${t.beforeAfter.pair} ${index + 1}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={50}
        aria-valuetext={`${t.beforeAfter.before} / ${t.beforeAfter.after}`}
        data-cursor="compare"
        onKeyDown={onKey}
        onPointerDown={(e) => {
          drag.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          fromEvent(e);
        }}
        onPointerMove={(e) => drag.current && fromEvent(e)}
        onPointerUp={() => (drag.current = false)}
        onPointerCancel={() => (drag.current = false)}
      >
        <Frame
          name={before}
          ratio={4 / 5}
          sizes="(max-width: 767px) 92vw, 44vw"
          position="50% 55%"
          className="no-grad"
        />
        <div className="ba-after">
          <Frame name={after} fill sizes="(max-width: 767px) 92vw, 44vw" position="50% 55%" className="no-grad" />
        </div>
        <span className="ba-tag t-label left-4 text-cream">{t.beforeAfter.before}</span>
        <span className="ba-tag t-label right-4 text-gold">{t.beforeAfter.after}</span>
        <div className="ba-handle" aria-hidden="true">
          <span className="ba-knob">
            <IconDrag className="h-5 w-5" />
          </span>
        </div>
      </div>
      <figcaption className="mt-4 flex items-baseline justify-between gap-4">
        <span className="t-label text-muted">
          {t.beforeAfter.pair} 0{index + 1}
        </span>
        <span className="t-label text-cream/70">{t.beforeAfter.caption}</span>
      </figcaption>
    </figure>
  );
}

/** «Было / стало» — только при CONFIG.showBeforeAfter. Подпись нейтральная, без названия услуги. */
export function BeforeAfter() {
  const t = useT();
  if (!CONFIG.showBeforeAfter) return null;
  return (
    <section className="section" aria-labelledby="ba-title">
      <div className="wrap">
        <div className="grid-12 items-end gap-y-6">
          <div className="col-span-12 md:col-span-7">
            <Kicker>{t.beforeAfter.label}</Kicker>
            <Lines id="ba-title" lines={t.beforeAfter.title} className="t-title mt-6" />
          </div>
          <div className="fade-up col-span-12 md:col-span-4 md:col-start-9" data-reveal="">
            <p className="t-quote text-[1.5rem] md:text-[1.9rem]">
              {CONFIG.underbodyServiceName.trim() || t.beforeAfter.caption}
            </p>
            <p className="t-label mt-4 text-muted">{t.beforeAfter.hint}</p>
          </div>
        </div>
        <div className="mt-[8vh] grid gap-10 md:grid-cols-2 md:gap-6 lg:gap-10" data-reveal="">
          {PAIRS.map(([b, a], i) => (
            <Compare key={b} before={b} after={a} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
