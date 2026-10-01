import { SectionHead } from "./SectionHead";

/** Только шаги, которые прямо следуют из публикаций. */
const steps = [
  { t: "Запись заранее или живая очередь", d: "Позвоните или напишите — или приезжайте." },
  { t: "Диагностика", d: "При заправке кондиционера — бесплатно (акция, уточняйте)." },
  { t: "Работа с гарантией", d: "Гарантию даём на выполненную работу." },
  { t: "Оплата по результату", d: "Для промывки печки: платите за тепло, а не за промывку." },
];

export function Process() {
  return (
    <section id="process" tabIndex={-1} aria-labelledby="process-title" className="section-y border-t border-line bg-surface">
      <div className="container-x">
        <SectionHead id="process-title" eyebrow="Порядок" title="Как мы работаем" />
        <ol className="mt-12 grid gap-px overflow-hidden rounded-[3px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t} className="reveal bg-surface p-6 lg:p-8" style={{ ["--delay" as string]: `${i * 60}ms` }}>
              <span className="display text-[3.4rem] leading-none text-accent">{i + 1}</span>
              <h3 className="display mt-5 text-[1.45rem]">{s.t}</h3>
              <p className="mt-2 text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
