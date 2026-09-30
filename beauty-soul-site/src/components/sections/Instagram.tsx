import { brand, instagramPicks } from "@/content/site";
import { Img } from "@/components/Img";
import { ArrowIcon, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Лента-«плёнка» из реальных снимков профиля. Не копия интерфейса Instagram. */
export function Instagram() {
  return (
    <section aria-labelledby="instagram-title" className="section-y overflow-hidden bg-ivory">
      <div className="container-x flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow reveal text-mocha">Мы в Instagram</p>
          <h2 id="instagram-title" className="font-display mt-5 text-[clamp(2.6rem,7.5vw,6.4rem)] leading-[0.95]">
            <span className="line-mask">
              <span>
                <a
                  href={brand.instagramUrl}
                  target="_blank"
                  rel="noopener"
                  className="text-ink transition-colors duration-300 hover:text-mocha"
                >
                  {brand.instagramHandle}
                </a>
              </span>
            </span>
          </h2>
        </div>
        <div className="reveal" style={{ ["--delay" as string]: "150ms" }}>
          <Button asChild variant="outline" size="lg">
            <a href={brand.instagramUrl} target="_blank" rel="noopener">
              Перейти в Instagram
              <ArrowIcon />
            </a>
          </Button>
        </div>
      </div>

      <ul
        className="mt-14 flex snap-x snap-mandatory gap-3 overflow-x-auto px-(--gutter) pb-4 [scrollbar-width:none] sm:gap-4 lg:mt-20 lg:grid lg:grid-cols-6 lg:overflow-visible lg:container-x"
        aria-label="Снимки из профиля @beautysoulkz"
      >
        {instagramPicks.map((p, i) => (
          <li
            key={p.image}
            className={cn(
              "w-[58vw] shrink-0 snap-start sm:w-[36vw] lg:w-auto",
              i % 2 === 1 && "lg:mt-16",
            )}
          >
            <div className="img-reveal" style={{ ["--delay" as string]: `${i * 80}ms` }}>
              <Img name={p.image} alt={p.alt} sizes="(min-width: 1024px) 15vw, 58vw" className="aspect-[4/5]" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
