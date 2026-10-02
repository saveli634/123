import { useRef } from "react";
import { WORKSHOP } from "@/content/copy";
import { Frame } from "@/components/shared/Frame";
import { Lines } from "@/components/shared/Lines";
import { SecLabel } from "@/components/shared/Glyphs";
import { useScrollFx } from "@/lib/scroll";

/** Цех: три вертикальных кадра с разным параллаксом и цитата крупно. */
const SPEED = [-70, 50, -130];

export function Workshop() {
  const ref = useRef<HTMLDivElement>(null);
  useScrollFx(ref, (p, el) => {
    el.querySelectorAll<HTMLElement>("[data-par]").forEach((f) => {
      const k = Number(f.dataset.par);
      f.style.transform = `translate3d(0, ${((0.5 - p) * SPEED[k]).toFixed(1)}px, 0)`;
    });
  });

  return (
    <section id="ceh" className="sec ws" aria-labelledby="ws-title">
      <div className="wrap">
        <SecLabel n={2} total={9}>
          {WORKSHOP.label}
        </SecLabel>
        <h2 id="ws-title" className="sr-only">
          {WORKSHOP.label}
        </h2>
        <div ref={ref} className="ws-grid">
          <blockquote className="ws-quote">
            <Lines as="p" className="display ws-q" lines={WORKSHOP.quoteLines} />
          </blockquote>
          {WORKSHOP.frames.map((f, i) => (
            <div key={f.img} className={`ws-f ws-f${i + 1}`} data-par={i}>
              <Frame img={f.img} alt={f.caption} caption={f.caption} index={`02.${i + 1}`} sizes="(min-width: 1024px) 26vw, 46vw" parallax={10} delay={i * 120} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
