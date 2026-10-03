import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLang } from "@/lib/lang";
import { Kicker, Rich } from "@/components/Text";
import { CarScheme } from "@/components/Schemes";
import { Stamp } from "@/components/Stamp";
import { Lion } from "@/components/Lion";

/**
 * Фирменный проект «Волга» — инженерное досье: Mercedes‑Benz W124 + элементы кузова «Волги» +
 * Lexus 3UZ‑FE. Фото проекта в материалах сайта нет, поэтому — схема (подписана как схема) и
 * подтверждённые заказчиком строки. Наведение на строку досье подсвечивает её часть на схеме.
 */
export function Project() {
  const { t } = useLang();
  const p = t.project;
  const sheet = useRef<HTMLDivElement>(null);
  const [drawn, setDrawn] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [focus, setFocus] = useState<number | null>(null);

  useEffect(() => {
    const el = sheet.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setDrawn(true);
        window.setTimeout(() => setStamped(true), 1900);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section id="project" className="section project" aria-labelledby="project-title">
      <div className="project-bg" aria-hidden="true" />
      <div className="wrap relative">
        <div className="grid-12 items-end gap-y-8">
          <div className="col-span-12 lg:col-span-7">
            <Kicker>{p.label}</Kicker>
            <h2 id="project-title" className="project-title t-display mt-6" data-reveal="">
              <span className="ln">
                <span style={{ "--i": 0 } as CSSProperties}>
                  <Rich text={p.title[0]} />
                </span>
              </span>
              <span className="ln project-sub">
                <span style={{ "--i": 1 } as CSSProperties} translate="no">
                  {p.sub}
                </span>
              </span>
            </h2>
          </div>
          <p className="fade-up t-quote project-lead col-span-12 lg:col-span-5" data-reveal="">
            {p.lead}
          </p>
        </div>

        <div ref={sheet} className="project-sheet mt-[7vh]" data-reveal="">
          <div className="project-sheet-head fade-up">
            <span className="flex items-center gap-3">
              <Lion className="h-5 w-5 text-gold" />
              <span translate="no">Carleone Service</span>
              <span className="opacity-50">/</span>
              <span className="text-cream/80">{p.dossier}</span>
            </span>
            <span className="text-muted">{p.note}</span>
          </div>
          <div className="project-draw">
            <CarScheme callouts={p.callouts} focus={focus} on={drawn} label={`${p.dossier}: ${p.rows.map((r) => r[1]).join(", ")}`} />
          </div>
          <div className="project-foot">
          <dl className="project-rows">
            {p.rows.map(([k, v], i) => (
              <div
                key={k}
                className="project-row fade-up"
                style={{ "--d": 120 + i * 90 } as CSSProperties}
                onPointerEnter={() => setFocus(i)}
                onPointerLeave={() => setFocus(null)}
              >
                <dt className="t-label text-muted">
                  <span className="t-num text-gold">0{i + 1}</span> {k}
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
            <div className="project-stamp" aria-hidden="true">
              <Stamp id="project" country={p.stamp} ring={p.stampRing} rotate={-9} on={stamped} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
