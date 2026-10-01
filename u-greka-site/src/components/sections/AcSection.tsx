import { services } from "@/data/services";
import type { Photo } from "@/data/types";
import { PhotoFrame } from "@/components/shared/PhotoFrame";
import { useUi } from "@/components/shared/UiContext";
import { Button } from "@/components/ui/button";
import { SectionHead } from "./SectionHead";

const steps = [
  { t: "Диагностика", d: "Проверяем систему и находим причину." },
  { t: "Ремонт и замена узлов", d: "Компрессор, радиаторы, трубки, испаритель — по необходимости." },
  { t: "Заправка фреоном Frio+", d: "Заправляем на станции, с проверкой." },
  { t: "Проверка температуры", d: "Контролируем холод на выходе из дефлектора." },
];

const gauges: Photo[] = [
  { name: "ac-gauges-01", alt: "Манометры подключены к кондиционеру, капот открыт", tag: "Заправка с проверкой" },
  { name: "ac-gauges-02", alt: "Шланги станции на двигателе Kia при заправке кондиционера", tag: "Kia · кондиционер" },
  { name: "ac-gauges-03", alt: "Манометры на двигателе при заправке кондиционера", tag: "Заправка кондиционера" },
  { name: "ac-gauges-04", alt: "Шланги станции подключены к Mercedes при заправке кондиционера", tag: "Mercedes · кондиционер" },
  { name: "ac-gauges-05", alt: "Манометры над моторным отсеком красного автомобиля", tag: "Диагностика кондиционера" },
  { name: "ac-gauges-06", alt: "Баллон фреона и манометры на Toyota при заправке кондиционера", tag: "Toyota · заправка" },
];

/** Кондиционеры — главная специализация: процесс, лента «в работе», блок о фреоне. */
export function AcSection() {
  const { openLightbox, openLead } = useUi();
  const ac = services[0];
  return (
    <section id="konditsionery" tabIndex={-1} aria-labelledby="ac-title" className="section-y border-t border-line bg-surface">
      <div className="container-x">
        <SectionHead number="01" id="ac-title" eyebrow="Главная специализация" title="Кондиционеры">
          <p className="inline-flex items-center gap-2 rounded-[2px] border border-accent/60 px-3 py-2 text-sm">
            <span aria-hidden="true" className="size-2 bg-accent" />
            Акция: при заправке — диагностика бесплатно. Уточняйте по телефону.
          </p>
        </SectionHead>

        <ol className="mt-14 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.t} className="reveal border-b border-line py-6 sm:pr-6 lg:border-b-0 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0" style={{ ["--delay" as string]: `${i * 60}ms` }}>
              <span className="mono text-accent">0{i + 1}</span>
              <h3 className="display mt-3 text-[1.5rem]">{s.t}</h3>
              <p className="mt-2 text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-14">
        <div className="container-x flex items-baseline justify-between gap-4">
          <h3 className="display text-[1.6rem]">В работе</h3>
          <p className="mono text-sm text-muted">Листайте →</p>
        </div>
        <ul className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-(--gutter) pb-2 lg:gap-4" aria-label="Фото заправки кондиционеров">
          {gauges.map((g, i) => (
            <li key={g.name} className="w-[70%] shrink-0 snap-start sm:w-[42%] lg:w-[24%]">
              <PhotoFrame photo={g} ratio="4/5" sizes="(min-width: 1024px) 24vw, 70vw" onOpen={() => openLightbox(gauges, i)} />
            </li>
          ))}
        </ul>
      </div>

      <div className="container-x mt-14 grid gap-8 lg:grid-cols-12 lg:items-center">
        <PhotoFrame photo={{ name: "ac-freon-boxes", alt: "Коробки фреона Frio+ 134a", tag: "Frio+ 134a" }} ratio="4/3" sizes="(min-width: 1024px) 40vw, 100vw" parallax className="reveal lg:col-span-5" />
        <div className="reveal lg:col-span-6 lg:col-start-7">
          <p className="eyebrow text-accent">Фреон</p>
          <h3 className="display mt-3 text-[clamp(1.9rem,3.4vw,2.8rem)]">Frio+, Бельгия</h3>
          <p className="mt-4 text-text/85">Заправляем кондиционеры фреоном Frio+. В наших публикациях указано, что сертификат имеется.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button onClick={() => openLead(ac.title)}>Узнать цену</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
