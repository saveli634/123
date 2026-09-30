import { useState } from "react";
import { services, type Service } from "@/content/site";
import { Img } from "@/components/Img";
import { ArrowIcon } from "@/components/ui/button";
import { cn, typo } from "@/lib/utils";

/**
 * Услуги как оглавление журнала, а не шесть одинаковых карточек.
 * На десктопе слева «витрина»: фото меняется при наведении/фокусе на строку.
 */
export function Services() {
  const withImages = services.filter((s) => s.image);
  const [active, setActive] = useState<Service["id"]>(withImages[0].id);

  return (
    <section
      id="services"
      tabIndex={-1}
      aria-labelledby="services-title"
      className="section-y bg-ivory"
    >
      <div className="container-x">
        <div className="mb-14 flex flex-col gap-6 lg:mb-20 lg:flex-row lg:items-end lg:justify-between">
          <h2
            id="services-title"
            className="font-display reveal text-[clamp(2.6rem,6vw,5rem)] leading-[1] text-ink"
          >
            Услуги
          </h2>
          <p className="reveal max-w-sm text-ink/70" style={{ ["--delay" as string]: "120ms" }}>
            {typo("Шесть направлений — одно отношение: бережно, внимательно и без спешки.")}
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Витрина */}
          <div className="hidden lg:col-span-5 lg:block">
            <div className="img-reveal sticky top-[calc(var(--header-h)+2rem)] aspect-[4/5]">
              <div className="relative h-full w-full">
                {withImages.map((s) => (
                  <div
                    key={s.id}
                    aria-hidden={s.id !== active}
                    className={cn(
                      "absolute inset-0 transition-[opacity,transform] duration-700 ease-(--ease-out-soft)",
                      s.id === active ? "opacity-100" : "scale-[1.02] opacity-0",
                    )}
                  >
                    <Img
                      name={s.image!}
                      alt={s.id === active ? (s.imageAlt ?? "") : ""}
                      sizes="38vw"
                      className="h-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Оглавление */}
          <ol className="lg:col-span-7">
            {services.map((s, i) => (
              <ServiceCard
                key={s.id}
                service={s}
                index={i}
                onActivate={() => s.image && setActive(s.id)}
                active={s.id === active}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function ServiceCard({
  service,
  index,
  onActivate,
  active,
}: {
  service: Service;
  index: number;
  onActivate: () => void;
  active: boolean;
}) {
  return (
    <li
      className="reveal border-t border-ink/12 last:border-b"
      style={{ ["--delay" as string]: `${index * 60}ms` }}
    >
      <a
        href={service.href}
        onMouseEnter={onActivate}
        onFocus={onActivate}
        className="group/link grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 py-6 sm:grid-cols-[3.5rem_1fr_auto] lg:py-8"
      >
        <span className="self-start pt-3 text-xs font-medium tracking-[0.18em] text-taupe tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0">
          <span
            className={cn(
              "font-display block text-[clamp(2.1rem,4.4vw,3.6rem)] leading-none transition-[color,transform] duration-500 ease-(--ease-out-soft)",
              "lg:group-hover/link:translate-x-2 lg:group-focus-visible/link:translate-x-2",
              active ? "lg:text-ink" : "lg:text-ink/55",
            )}
          >
            {service.title}
          </span>
          <span className="mt-3 block max-w-md text-[0.95rem] text-ink/65">{typo(service.short)}</span>
          <span className="mt-4 inline-flex items-center gap-2 text-[0.72rem] font-semibold tracking-[0.18em] text-ink uppercase">
            {service.image ? "Подробнее" : "Записаться"}
            <ArrowIcon className="size-3.5" />
          </span>
        </span>
        {service.image ? (
          <Img
            name={service.image}
            alt=""
            sizes="6rem"
            className="aspect-[3/4] w-20 sm:w-24 lg:hidden"
          />
        ) : (
          <span aria-hidden="true" className="w-20 sm:w-24 lg:hidden" />
        )}
      </a>
    </li>
  );
}
