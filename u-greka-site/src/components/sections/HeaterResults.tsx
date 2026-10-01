import { useEffect, useRef, useState } from "react";
import { heaterReadings } from "@/data/heater";
import { services } from "@/data/services";
import { PhotoFrame } from "@/components/shared/PhotoFrame";
import { useUi } from "@/components/shared/UiContext";
import { Button } from "@/components/ui/button";

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
