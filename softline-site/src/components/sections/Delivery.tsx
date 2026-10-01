import { useRef } from "react";
import { useScrollFx } from "@/lib/scrollFx";
import { typo } from "@/lib/utils";

const steps = [
  {
    title: "Выбираете модель",
    text: "На сайте, в Instagram или вживую в шоуруме в ТЦ ADEM 1.",
  },
  {
    title: "Уточняем детали и стоимость",
    text: "Размеры, обивку, цену и рассрочку Kaspi обсудим по телефону или в WhatsApp.",
  },
  {
    title: "Организуем доставку",
    text: "По Алматы и в другие города Казахстана. Для моделей, где это указано, доставка по Алматы бесплатная.",
  },
];

export function Delivery() {
  // Линия прогресса «прорисовывается» при прокрутке, шаги загораются по очереди.
  const list = useRef<HTMLOListElement>(null);
  useScrollFx(list, (p, el) => {
    const t = Math.min(1, Math.max(0, (p - 0.2) / 0.38));
    el.style.setProperty("--line", t.toFixed(4));
    el.querySelectorAll<HTMLElement>("[data-step]").forEach((step, i) => {
      if (t >= i / 3 + 0.02) step.dataset.on = "";
      else delete step.dataset.on;
    });
  });
  return (
    <section id="delivery" tabIndex={-1} aria-labelledby="delivery-title" className="section-y bg-ivory">
      <div className="container-x">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow reveal text-muted">Доставка и заказ</p>
            <h2 id="delivery-title" className="display mt-6 text-[clamp(2.6rem,5vw,5rem)] text-graphite">
              <span className="line-mask">
                <span>Три шага</span>
              </span>
              <span className="line-mask">
                <span style={{ ["--delay" as string]: "110ms" }}>
                  до <span className="serif text-terracotta">нового</span> дивана
                </span>
              </span>
            </h2>
          </div>
        </div>

        <ol ref={list} className="steps relative mt-16 grid border-t border-graphite/12 lg:mt-24 lg:grid-cols-3">
          <span aria-hidden="true" className="steps-line" />
          {steps.map((s, i) => (
            <li
              key={s.title}
              data-step
              className="reveal border-b border-graphite/12 py-10 lg:border-b-0 lg:border-l lg:px-10 lg:py-4 lg:first:border-l-0 lg:first:pl-0"
              style={{ ["--delay" as string]: `${i * 110}ms` }}
            >
              <span className="step-num serif block text-[4.5rem] leading-none text-terracotta">{i + 1}</span>
              <h3 className="mt-8 text-xl font-medium text-graphite">{s.title}</h3>
              <p className="mt-3 max-w-xs text-muted">{typo(s.text)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
