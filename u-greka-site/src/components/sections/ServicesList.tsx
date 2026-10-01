import { ArrowRight, Phone } from "lucide-react";
import { services, type Service } from "@/data/services";
import { PhotoFrame } from "@/components/shared/PhotoFrame";
import { useUi } from "@/components/shared/UiContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHead } from "./SectionHead";

/** Каталог услуг: крупные чередующиеся ряды, реальные фото, только подтверждённые факты и цены. */
export function ServicesList() {
  return (
    <section id="uslugi" tabIndex={-1} aria-labelledby="uslugi-title" className="section-y">
      <div className="container-x">
        <SectionHead id="uslugi-title" eyebrow="Услуги" title="Что делаем">
          <p className="text-muted">Восемь направлений в одном месте. Точную стоимость назовём после диагностики.</p>
        </SectionHead>
        <div className="mt-14 lg:mt-20">
          {services.map((s, i) => (
            <ServiceRow key={s.slug} service={s} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceRow({ service: s, flip }: { service: Service; flip: boolean }) {
  const { openLightbox, openLead } = useUi();
  const [main, ...rest] = s.photos;
  return (
    <article id={`usluga-${s.slug}`} tabIndex={-1} aria-labelledby={`t-${s.slug}`} className="grid gap-8 border-t border-line py-12 lg:grid-cols-12 lg:gap-10 lg:py-16">
      {/* Фото: на телефоне — горизонтальная лента со свайпом */}
      <div className={cn("lg:col-span-7", flip && "lg:order-2 lg:col-start-6")}>
        <div className="no-scrollbar -mx-(--gutter) flex snap-x snap-mandatory gap-3 overflow-x-auto px-(--gutter) lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0">
          <div className="w-[82%] shrink-0 snap-start lg:col-span-2 lg:row-span-2 lg:w-auto">
            <PhotoFrame photo={main} ratio="4/5" sizes="(min-width: 1024px) 38vw, 82vw" onOpen={() => openLightbox(s.photos, 0)} parallax className="reveal lg:h-full lg:[&>.frame-media]:h-full" />
          </div>
          {rest.map((p, i) => (
            <div key={p.name} className="w-[82%] shrink-0 snap-start lg:w-auto">
              <PhotoFrame photo={p} ratio="4/5" sizes="(min-width: 1024px) 19vw, 82vw" onOpen={() => openLightbox(s.photos, i + 1)} className="reveal" />
            </div>
          ))}
        </div>
      </div>

      <div className={cn("flex flex-col lg:col-span-5", flip ? "lg:order-1 lg:col-start-1" : "lg:col-start-8")}>
        <p className="display reveal text-[clamp(3.5rem,7vw,6rem)] leading-none text-accent">{s.number}</p>
        <h3 id={`t-${s.slug}`} className="display reveal mt-3 text-[clamp(1.9rem,3.4vw,2.9rem)]">{s.title}</h3>
        <p className="reveal mt-4 text-[1.05rem] text-text/85">{s.summary}</p>
        <ul className="reveal mt-6 space-y-2.5">
          {s.facts.map((f) => (
            <li key={f} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.62em] h-0.5 w-3 shrink-0 bg-accent" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        {s.priceNote && (
          <div className="reveal mt-6 border-l-2 border-accent bg-surface px-4 py-3">
            {s.priceNote.map((p) => (
              <p key={p} className="mono text-[0.95rem]">{p}</p>
            ))}
            <p className="mt-1 text-sm text-muted">Цена ориентировочная — уточняйте актуальную.</p>
          </div>
        )}
        {s.phones && (
          <ul className="reveal mt-6 space-y-1">
            {s.phones.map((p) => (
              <li key={p.label + p.tel}>
                <a href={`tel:${p.tel}`} className="group inline-flex min-h-11 flex-wrap items-center gap-x-3 text-[0.95rem]">
                  <Phone aria-hidden="true" className="size-4 text-accent" />
                  <span className="text-muted">{p.label}:</span>
                  <span className="mono group-hover:text-accent">{p.display}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <div className="reveal mt-8">
          <Button onClick={() => openLead(s.title)}>
            Узнать цену
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}
