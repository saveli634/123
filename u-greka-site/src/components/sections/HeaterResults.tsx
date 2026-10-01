import { useEffect, useRef, useState } from "react";
import { heaterReadings } from "@/data/heater";
import { services } from "@/data/services";
import { PhotoFrame } from "@/components/shared/PhotoFrame";
import { useUi } from "@/components/shared/UiContext";
import { Button } from "@/components/ui/button";
import { useScrollFx } from "@/lib/scrollFx";

/** Одно число, которое «тикает» от значения «было» к «стало» один раз при появлении. */
function Tick({ from, to }: { from: number; to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(to); // в разметке сразу итог — для пререндера и reduced motion
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
    setV(from);
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const dur = 1400;
      const loop = (t: number) => {
        const k = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        setV(Math.round(from + (to - from) * eased));
        if (k < 1) raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [from, to]);
  return (
    <span ref={ref} aria-hidden="true">
      {v}°
    </span>
  );
}

/* ---------- Стрелочный указатель температуры (как на приборной панели) ---------- */
const CX = 160;
const CY = 160;
const MAX = 80;
const RB = 140; // радиус цветной шкалы
const ang = (v: number) => Math.PI * (1 - v / MAX);
const pt = (v: number, r: number) => `${(CX + r * Math.cos(ang(v))).toFixed(2)} ${(CY - r * Math.sin(ang(v))).toFixed(2)}`;
const arcPath = (a: number, b: number, r: number) => (b - a < 0.05 ? "" : `M ${pt(a, r)} A ${r} ${r} 0 0 1 ${pt(b, r)}`);
const needleTurn = (v: number) => `rotate(${((v / MAX) * 180).toFixed(2)} ${CX} ${CY})`;
const ticks = Array.from({ length: MAX / 5 + 1 }, (_, i) => i * 5);
const ease = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Первый замер из публикаций: стрелка проходит от «было» к «стало» по мере прокрутки.
 * Без движения и в пререндере — сразу итоговое значение. Дублирует первую строку таблицы,
 * поэтому скрыт от экранных дикторов.
 */
function HeaterGauge() {
  const r = heaterReadings[0];
  const from = r.before[0];
  const to = r.after[0];
  const card = useRef<HTMLDivElement>(null);
  const needle = useRef<SVGGElement>(null);
  const arc = useRef<SVGPathElement>(null);
  const out = useRef<HTMLSpanElement>(null);
  const shown = useRef(to);

  useScrollFx(card, (p) => {
    const v = from + (to - from) * ease(0.14, 0.52, p);
    if (Math.abs(v - shown.current) < 0.01) return;
    shown.current = v;
    needle.current?.setAttribute("transform", needleTurn(v));
    arc.current?.setAttribute("d", arcPath(from, v, RB));
    if (out.current) out.current.textContent = String(Math.round(v));
  });

  return (
    <div ref={card} aria-hidden="true" className="gauge corner-marks relative rounded-[3px] bg-bg p-5 text-text sm:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow text-muted">Температура на панели</p>
        <p className="mono text-[0.75rem] text-muted">°C</p>
      </div>
      <svg viewBox="0 0 320 178" className="mt-3 block w-full">
        <path d={arcPath(0, MAX, RB)} fill="none" stroke="#2b2e32" strokeWidth="7" strokeLinecap="round" />
        <path ref={arc} d={arcPath(from, to, RB)} fill="none" stroke="#f6b400" strokeWidth="7" strokeLinecap="round" />
        {ticks.map((v) => {
          const major = v % 20 === 0;
          return <path key={v} d={`M ${pt(v, 126)} L ${pt(v, major ? 108 : 117)}`} stroke={major ? "#f2f1ed" : "#5b5e63"} strokeWidth={major ? 2.5 : 1.5} />;
        })}
        {ticks
          .filter((v) => v % 20 === 0)
          .map((v) => {
            const [x, y] = pt(v, 90).split(" ");
            return (
              <text key={v} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="#a5a7ab" fontSize="13" className="mono">
                {v}
              </text>
            );
          })}
        <path d={`M ${pt(from, RB + 13)} L ${pt(from, RB + 4)}`} stroke="#2f6bff" strokeWidth="3" strokeLinecap="round" />
        <g ref={needle} transform={needleTurn(to)}>
          <path d={`M ${CX + 16} ${CY} L ${CX - 122} ${CY}`} stroke="#f2f1ed" strokeWidth="3" strokeLinecap="round" />
        </g>
        <circle cx={CX} cy={CY} r="10" fill="#f6b400" />
        <circle cx={CX} cy={CY} r="3.5" fill="#0f0f10" />
      </svg>
      <div className="mt-2 flex items-end justify-between gap-4 border-t border-line pt-4">
        <p className="mono text-[0.85rem] text-muted">
          <span className="mr-1.5 inline-block size-2 bg-steel align-middle" />
          было {from}°
        </p>
        <p className="display text-[clamp(2.6rem,6vw,3.6rem)] leading-none text-accent">
          <span ref={out}>{to}</span>°
        </p>
      </div>
      <p className="mt-3 text-sm text-muted">Замер из публикации: до промывки {from}°, после — {to}°.</p>
    </div>
  );
}

/** Автопечка: результат на термометре — только числа из подписей постов. */
export function HeaterResults() {
  const { openLead } = useUi();
  return (
    <section id="pechki" tabIndex={-1} aria-labelledby="heater-title" className="paper section-y">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow reveal">
            <span className="text-paper-ink">02 — </span>
            <span className="text-paper-muted">Автопечка</span>
          </p>
          <h2 id="heater-title" className="display mt-4 text-[clamp(2.3rem,5.4vw,4.6rem)]">
            <span className="line-mask"><span>Результат</span></span>
            <span className="line-mask"><span style={{ ["--delay" as string]: "90ms" }}>на термометре</span></span>
          </h2>
          <p className="reveal mt-6 text-[1.15rem] font-medium">«Вы платите за тепло, а не за промывку».</p>
          <p className="reveal mt-3 text-paper-muted">Замеряем температуру на панели до и после промывки. Работаем с гарантией, оплата — по результату.</p>
          <div className="reveal mt-8">
            <Button variant="dark" onClick={() => openLead(services[1].title)}>Записаться на промывку</Button>
          </div>
          <div className="reveal mt-10 max-w-md">
            <HeaterGauge />
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <table className="reveal w-full border-collapse text-left">
            <caption className="mb-4 text-left text-sm text-paper-muted">Температура на панели, по данным наших публикаций</caption>
            <thead>
              <tr className="mono border-b-2 border-paper-ink text-[0.75rem] tracking-[0.06em] uppercase">
                <th scope="col" className="py-3 pr-4 font-medium">Замер</th>
                <th scope="col" className="py-3 pr-4 text-right font-medium">Было</th>
                <th scope="col" className="py-3 text-right font-medium">Стало</th>
              </tr>
            </thead>
            <tbody>
              {heaterReadings.map((r) => (
                <tr key={r.label} className="border-b border-paper-ink/15 align-baseline">
                  <th scope="row" className="py-5 pr-4 text-[0.98rem] font-normal">{r.label}</th>
                  <td className="mono py-5 pr-4 text-right text-[1.3rem] text-paper-muted">{r.before.map((b) => `${b}°`).join(" / ")}</td>
                  <td className="mono py-5 text-right text-[clamp(1.6rem,3vw,2.3rem)] font-semibold">
                    <span className="sr-only">{r.after.map((a) => `${a}°`).join(" / ")}</span>
                    {r.after.map((a, i) => (
                      <span key={i}>
                        {i > 0 && <span aria-hidden="true"> / </span>}
                        <Tick from={r.before[i]} to={a} />
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <PhotoFrame photo={services[1].photos[0]} ratio="4/5" sizes="(min-width: 1024px) 22vw, 46vw" className="reveal border-paper-ink/15" />
            <PhotoFrame photo={{ name: "heater-flush-blue-3", alt: "Промывка печки на аппарате, шланги подключены к автомобилю", tag: "Промывка без снятия" }} ratio="4/5" sizes="(min-width: 1024px) 22vw, 46vw" className="reveal border-paper-ink/15" />
          </div>
        </div>
      </div>
    </section>
  );
}
