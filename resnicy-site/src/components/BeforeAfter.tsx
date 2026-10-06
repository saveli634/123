import { useEffect, useRef } from "react";
import { Photo } from "./Photo";
import { ScrollTrigger, motionStarted } from "@/lib/motion";
import { clamp } from "@/lib/env";

/**
 * До/после из её фото 003 (две половины одного кадра, выровнены по зрачку).
 * Ползунок тянется мышью/пальцем, управляется стрелками; при входе в секцию сам «проявляет» «после».
 * Сдвиг сделан двумя transform (обёртка влево, фото обратно) — без перерисовки.
 */
export function BeforeAfter() {
  const frame = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  const pos = useRef(50);
  const touched = useRef(false);

  const set = (v: number) => {
    const p = clamp(v, 0, 100);
    pos.current = p;
    const el = frame.current;
    if (!el) return;
    el.style.setProperty("--pos", `${p.toFixed(2)}%`);
    el.style.setProperty("--pos-n", (p / 100).toFixed(4));
    handle.current?.setAttribute("aria-valuenow", String(Math.round(p)));
    handle.current?.setAttribute("aria-valuetext", `до — ${Math.round(p)}%, после — ${100 - Math.round(p)}%`);
  };

  useEffect(() => {
    const el = frame.current!;
    let dragging = false;
    const fromEvent = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      touched.current = true;
      el.classList.add("is-dragging");
      el.setPointerCapture(e.pointerId);
      fromEvent(e);
    };
    const move = (e: PointerEvent) => dragging && fromEvent(e);
    const up = () => {
      dragging = false;
      el.classList.remove("is-dragging");
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    // привязка к прокрутке: при входе в секцию «после» проявляется само (пока человек не взялся за ползунок)
    let st: ScrollTrigger | null = null;
    if (motionStarted()) {
      set(96);
      st = ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        end: "center 50%",
        scrub: 0.6,
        onUpdate: (self) => {
          if (!touched.current) set(96 - self.progress * 58);
        },
      });
    }
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      st?.kill();
    };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 20 : 5;
    const map: Record<string, number> = {
      ArrowLeft: pos.current - step,
      ArrowDown: pos.current - step,
      ArrowRight: pos.current + step,
      ArrowUp: pos.current + step,
      Home: 0,
      End: 100,
      PageDown: pos.current - 20,
      PageUp: pos.current + 20,
    };
    if (!(e.key in map)) return;
    e.preventDefault();
    touched.current = true;
    set(map[e.key]);
  };

  return (
    <section className="ba section" id="do-posle" aria-labelledby="ba-title">
      <div className="container ba-grid">
        <header className="ba-head">
          <p className="eyebrow" data-reveal>
            Ламинирование ресниц
          </p>
          <h2 id="ba-title" className="h2" data-reveal>
            <span className="nowrap">До/после</span> <em>за 60 минут</em>
          </h2>
          <p className="ba-note" data-reveal>
            <svg viewBox="0 0 120 40" aria-hidden="true">
              <path d="M2 30 C 30 36, 70 30, 112 8 M100 6 l13 2 -4 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            Потяни ползунок: тот же глаз до и после ламинирования.
          </p>
        </header>

        <div className="ba-frame" ref={frame} style={{ "--pos": "50%", "--pos-n": 0.5 } as React.CSSProperties} data-reveal="curtain">
          <div className="ba-layer ba-after">
            <Photo name="after" alt="После ламинирования: реснички подняты, разделены и окрашены" sizes="(min-width: 1100px) 1000px, 94vw" position="48% 58%" />
          </div>
          <div className="ba-layer ba-before" aria-hidden="false">
            <div className="ba-before-inner">
              <Photo name="before" alt="До ламинирования: тот же глаз, реснички светлые и опущены" sizes="(min-width: 1100px) 1000px, 94vw" position="48% 58%" />
            </div>
          </div>
          <span className="ba-label ba-label--before" aria-hidden="true">
            до
          </span>
          <span className="ba-label ba-label--after" aria-hidden="true">
            после
          </span>
          <div
            className="ba-handle"
            ref={handle}
            role="slider"
            tabIndex={0}
            aria-label="Сравнение: до и после"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={50}
            aria-valuetext="до — 50%, после — 50%"
            aria-orientation="horizontal"
            onKeyDown={onKey}
          >
            <span className="ba-knob" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="m9 6-6 6 6 6m6-12 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
