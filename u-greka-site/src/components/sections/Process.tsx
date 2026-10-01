import { useRef } from "react";
import { useScrollFx } from "@/lib/scrollFx";
import { SectionHead } from "./SectionHead";

/** Только шаги, которые прямо следуют из публикаций. */
const steps = [
  { t: "Запись заранее или живая очередь", d: "Позвоните или напишите — или приезжайте." },
  { t: "Диагностика", d: "При заправке кондиционера — бесплатно (акция, уточняйте)." },
  { t: "Работа с гарантией", d: "Гарантию даём на выполненную работу." },
  { t: "Оплата по результату", d: "Для промывки печки: платите за тепло, а не за промывку." },
];

/** Шаги «загораются» по очереди: полоса над каждым шагом заполняется при прокрутке. */
export function Process() {
  const list = useRef<HTMLOListElement>(null);
  useScrollFx(list, (p, el) => {
    const t = Math.min(1, Math.max(0, (p - 0.18) / 0.4)) * steps.length;
    el.querySelectorAll<HTMLElement>(".step").forEach((li, i) => {
      const v = Math.min(1, Math.max(0, t - i));
      li.style.setProperty("--fill", v.toFixed(3));
      li.dataset.on = v > 0.98 ? "true" : "false";
    });
  });
  return (
    <section id="process" tabIndex={-1} aria-labelledby="process-title" className="section-y border-t border-line bg-surface">
      <div className="container-x">
        <SectionHead id="process-title" eyebrow="Порядок" title="Как мы работаем" />
        <ol ref={list} className="mt-12 grid gap-px overflow-hidden rounded-[3px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t} className="step reveal relative bg-surface p-6 lg:p-8" style={{ ["--delay" as string]: `${i * 60}ms` }}>
              <span aria-hidden="true" className="step-bar" />
              <span className="step-num display text-[3.4rem] leading-none text-accent">{i + 1}</span>
              <h3 className="display mt-5 text-[1.45rem]">{s.t}</h3>
              <p className="mt-2 text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
