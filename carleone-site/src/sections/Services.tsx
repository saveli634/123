import { useState, type CSSProperties, type PointerEvent as RPointerEvent } from "react";
import { useT } from "@/lib/lang";
import { CONFIG } from "@/config";
import { telHref } from "@/lib/links";
import { finePointer } from "@/lib/env";
import { Kicker, Lines } from "@/components/Text";
import { Btn, Fill } from "@/components/Cta";
import { IconPhone } from "@/components/Icons";

/** Подсветка карточки за курсором: координаты в CSS-переменные (только мышь). */
export function glowFollow(e: RPointerEvent<HTMLElement>) {
  if (e.pointerType !== "mouse" || !finePointer()) return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--x", `${(e.clientX - r.left).toFixed(0)}px`);
  el.style.setProperty("--y", `${(e.clientY - r.top).toFixed(0)}px`);
}

/** «Что делаем»: только подтверждённые услуги. «Узнать цену» → «Цену уточняйте по телефону». */
export function Services() {
  const t = useT();
  const [open, setOpen] = useState<string | null>(null);
  const items = [
    ...t.services.items,
    ...(CONFIG.underbodyServiceName.trim()
      ? [
          {
            id: "underbody",
            title: CONFIG.underbodyServiceName.trim(),
            text: t.services.underbodyText,
          },
        ]
      : []),
    ...(CONFIG.showCarSales ? [{ id: "sales", ...t.services.carSales }] : []),
  ];
  const tel = telHref();

  return (
    <section id="services" className="section" aria-labelledby="services-title">
      <div className="wrap">
        <div className="grid-12 items-end gap-y-8">
          <div className="col-span-12 md:col-span-8">
            <Kicker>{t.services.label}</Kicker>
            <Lines id="services-title" lines={t.services.title} className="t-title mt-6" />
          </div>
          <p className="fade-up t-body col-span-12 max-w-sm md:col-span-4 md:justify-self-end" data-reveal="">
            {t.contacts.note}
          </p>
        </div>
      </div>

      <div className="swipe four mt-[9vh]" data-reveal="">
        {items.map((it, i) => (
          <article
            key={it.id}
            className="card fade-up flex min-h-[23rem] flex-col p-6 md:min-h-[27rem] md:p-8"
            style={{ "--d": 80 * i } as CSSProperties}
            onPointerMove={glowFollow}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="card-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="mt-3 h-px w-10 bg-gold/40" aria-hidden="true" />
            </div>
            <h3 className="mt-auto pt-10 font-display text-[1.65rem] leading-[1.12] font-semibold text-balance md:text-[1.85rem]">
              {it.title}
            </h3>
            <p className="t-body mt-3 text-[0.95rem]">{it.text}</p>
            <div className="price-swap mt-7" data-open={open === it.id ? "" : undefined}>
              <span className="justify-self-start">
                <Btn variant="ghost" size="sm" onClick={() => setOpen(it.id)} ariaExpanded={open === it.id} ariaControls={`price-${it.id}`}>
                  {t.cta.price}
                </Btn>
              </span>
              <div id={`price-${it.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-live="polite">
                <p className="t-label text-gold">{t.priceAnswer}</p>
                {tel ? (
                  <a
                    href={tel}
                    className="t-label inline-flex items-center gap-2 text-cream underline decoration-gold/50 underline-offset-4"
                  >
                    <IconPhone className="h-4 w-4" />
                    {t.cta.call}
                  </a>
                ) : (
                  open === it.id && <Fill field="phone" inline size="sm" />
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
