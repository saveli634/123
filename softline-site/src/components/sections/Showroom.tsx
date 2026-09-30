import { Navigation, Phone } from "lucide-react";
import { brand } from "@/content/catalog";
import { Img } from "@/components/Img";
import { Button } from "@/components/ui/button";
import { typo } from "@/lib/utils";

export function Showroom() {
  return (
    <section id="showroom" tabIndex={-1} aria-labelledby="showroom-title" className="section-y bg-ivory">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="order-2 lg:order-1 lg:col-span-4">
          <div className="img-hover img-reveal">
            <Img name="15_showroom_wide" alt="Шоурум Soft Line: ряды диванов под оранжевыми балками и вывеской" sizes="(min-width: 1024px) 30vw, 100vw" position="50% 60%" className="aspect-[9/14]" />
          </div>
        </div>

        <div className="order-1 flex flex-col justify-between gap-14 lg:order-2 lg:col-span-7 lg:col-start-6">
          <div>
            <p className="eyebrow reveal text-muted">Шоурум</p>
            <h2 id="showroom-title" className="display mt-6 text-[clamp(3rem,7vw,7rem)] text-graphite">
              <span className="line-mask">
                <span>Посмотрите</span>
              </span>
              <span className="line-mask">
                <span style={{ ["--delay" as string]: "110ms" }}>
                  <span className="serif text-terracotta">вживую</span>
                </span>
              </span>
            </h2>

            <address className="reveal mt-10 not-italic" style={{ ["--delay" as string]: "180ms" }}>
              <p className="flex flex-col gap-1 text-[clamp(1.4rem,2.2vw,1.9rem)] text-graphite sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                <span className="whitespace-nowrap">{brand.showroom}</span>
                <span aria-hidden="true" className="hidden h-px w-8 bg-graphite/30 sm:block" />
                <span className="whitespace-nowrap">3 этаж</span>
                <span aria-hidden="true" className="hidden h-px w-8 bg-graphite/30 sm:block" />
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span aria-hidden="true" className="size-3 bg-ember" />
                  оранжевый сектор
                </span>
              </p>
              <p className="mt-3 text-muted">{brand.city}</p>
            </address>

            <div className="reveal mt-10 flex flex-col gap-3 sm:flex-row" style={{ ["--delay" as string]: "260ms" }}>
              <Button asChild size="lg">
                <a href={brand.maps.twoGis} target="_blank" rel="noopener">
                  <Navigation aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  Построить маршрут
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={`tel:${brand.phones[0].tel}`}>
                  <Phone aria-hidden="true" className="size-4" strokeWidth={1.5} />
                  Позвонить в шоурум
                </a>
              </Button>
            </div>
            <p className="reveal mt-5 text-sm text-muted">
              {typo("Время работы уточняйте по телефону. Маршрут откроется в 2ГИС, также можно найти нас в ")}
              <a href={brand.maps.yandex} target="_blank" rel="noopener" className="text-graphite underline decoration-graphite/30 underline-offset-4 hover:decoration-graphite">
                Яндекс Картах
              </a>
              .
            </p>
          </div>

          <figure className="lg:ml-auto lg:w-[82%]">
            <div className="img-hover img-reveal" style={{ ["--delay" as string]: "180ms" }}>
              <Img name="13_bigboss_showroom" alt="Экспозиция шоурума: светлая мягкая мебель и деревянный столик" sizes="(min-width: 1024px) 40vw, 100vw" position="50% 55%" className="aspect-[16/11]" />
            </div>
            <figcaption className="eyebrow mt-3 text-muted">Big Boss в шоуруме</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
