import { useEffect, useRef, useState } from "react";
import { BUTTONS, FILL, SERVICES, SERVICES_HEAD, type Service } from "@/content/copy";
import { CONFIG } from "@/config";
import { Lines } from "@/components/shared/Lines";
import { SecLabel } from "@/components/shared/Glyphs";
import { Cta } from "@/components/shared/Cta";
import { Fill } from "@/components/shared/Fill";
import { DEMO, finePointer, motionAllowed } from "@/lib/env";
import { cn } from "@/lib/utils";

/**
 * Карточка: подсветка за курсором (--mx/--my), 3D-наклон (десктоп), кнопка «Узнать цену»
 * превращается в ответ «Цену уточняйте по телефону» с кнопкой звонка.
 */
export function useCardFx<T extends HTMLElement>(tilt = 5) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !finePointer()) return;
    const motion = motionAllowed();
    let raf = 0;
    let px = 0;
    let py = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      if (motion && tilt) {
        el.style.setProperty("--rx", `${((0.5 - py) * tilt).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${((px - 0.5) * tilt).toFixed(2)}deg`);
      }
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      px = (e.clientX - r.left) / r.width;
      py = (e.clientY - r.top) / r.height;
      el.dataset.hot = "";
      if (!raf) raf = requestAnimationFrame(apply);
    };
    const leave = () => {
      delete el.dataset.hot;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, [tilt]);
  return ref;
}

function ServiceCard({ s, i }: { s: Service; i: number }) {
  const ref = useCardFx<HTMLElement>(4);
  const [open, setOpen] = useState(false);
  const pending = s.flag && !CONFIG[s.flag];
  return (
    <article ref={ref} className={cn("card svc rv up", pending && "is-pending")} style={{ ["--d" as string]: `${i * 70}ms` }}>
      <span className="card-glow" aria-hidden="true" />
      <div className="svc-top">
        <span className="svc-n num">{s.n}</span>
        {pending && s.fill && <Fill kind="confirm" what={FILL[s.fill]} />}
      </div>
      <h3 className="svc-title">{s.title}</h3>
      <p className="svc-text">{s.text}</p>
      <div className={cn("svc-price", open && "is-open")}>
        <button type="button" className="svc-ask uline" aria-expanded={open} onClick={() => setOpen(true)} data-cursor="link" disabled={open}>
          {BUTTONS.price}
        </button>
        <div className="svc-answer" aria-live="polite">
          {open && (
            <>
              <span>{SERVICES_HEAD.priceAnswer}</span>
              <Cta kind="call" size="sm" variant="outline" magnetic={false} />
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function Services() {
  const list = SERVICES.filter((s) => !s.flag || CONFIG[s.flag] || DEMO);
  return (
    <section id="uslugi" className="sec svcs" aria-labelledby="svc-title">
      <div className="wrap">
        <SecLabel n={3} total={9}>
          {SERVICES_HEAD.label}
        </SecLabel>
        <div className="svc-head">
          <Lines id="svc-title" className="display h-sec svc-h" lines={SERVICES_HEAD.titleLines} />
          <div className="svc-lead rv up">
            <p>{SERVICES_HEAD.priceAnswer}</p>
            <Cta kind="call" variant="outline" />
          </div>
        </div>
        <div className="svc-grid" data-lenis-prevent-touch>
          {list.map((s, i) => (
            <ServiceCard key={s.n} s={s} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
