import { useEffect, useMemo, useState } from "react";
import { portfolio, portfolioCategories, type PortfolioItem } from "@/content/site";
import { Img } from "@/components/Img";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { Lightbox } from "./Lightbox";

type Filter = (typeof portfolioCategories)[number]["value"];

const aspect: Record<PortfolioItem["layout"], string> = {
  tall: "aspect-[2/3]",
  portrait: "aspect-[3/4]",
  square: "aspect-square",
  wide: "aspect-[4/3]",
};

export const categoryLabel = Object.fromEntries(
  portfolioCategories.map((c) => [c.value, c.label]),
) as Record<Filter, string>;

function useColumns() {
  const get = () => (window.matchMedia("(min-width: 1024px)").matches ? 3 : 2);
  const [cols, setCols] = useState(3);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setCols(get());
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return cols;
}

export function Portfolio() {
  const [filter, setFilter] = useState<Filter>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const cols = useColumns();

  const items = useMemo(
    () => (filter === "all" ? portfolio : portfolio.filter((p) => p.category === filter)),
    [filter],
  );

  // Раскладываем по колонкам «змейкой», средняя колонка смещена вниз — редакционный ритм.
  const columns = useMemo(() => {
    const out: { item: PortfolioItem; index: number }[][] = Array.from({ length: cols }, () => []);
    items.forEach((item, index) => out[index % cols].push({ item, index }));
    return out;
  }, [items, cols]);

  return (
    <section id="works" tabIndex={-1} aria-labelledby="works-title" className="section-y bg-cream">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-8">
          <div className="lg:col-span-6">
            <p className="eyebrow reveal text-mocha">Портфолио</p>
            <h2
              id="works-title"
              className="font-display mt-5 text-[clamp(2.8rem,7vw,6rem)] leading-[0.95] text-ink"
            >
              <span className="line-mask">
                <span>Наши работы</span>
              </span>
            </h2>
          </div>
          <div className="reveal lg:col-span-6 lg:justify-self-end" style={{ ["--delay" as string]: "120ms" }}>
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(v) => v && setFilter(v as Filter)}
              aria-label="Фильтр работ по услуге"
              className="-mx-1 gap-x-5 gap-y-1"
            >
              {portfolioCategories.map((c) => (
                <ToggleGroupItem key={c.value} value={c.value}>
                  {c.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {`Показано работ: ${items.length}`}
        </p>

        {/* key пересоздаёт сетку при смене фильтра — плитки появляются лесенкой */}
        <div key={`${filter}-${cols}`} className="mt-14 flex gap-4 sm:gap-6 lg:mt-20 lg:gap-8">
          {columns.map((col, c) => (
            <ul
              key={c}
              className={cn(
                "flex min-w-0 flex-1 flex-col gap-4 sm:gap-6 lg:gap-8",
                c === 1 && "mt-16 lg:mt-28",
                c === 2 && "lg:mt-10",
              )}
            >
              {col.map(({ item, index }) => (
                <li
                  key={item.image}
                  className="animate-fade-up"
                  style={{ ["--delay" as string]: `${index * 70}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    className="group img-hover relative block w-full text-left"
                    aria-label={`Открыть фото: ${item.alt}`}
                  >
                    <Img
                      name={item.image}
                      alt={item.alt}
                      sizes="(min-width: 1024px) 30vw, 48vw"
                      className={aspect[item.layout]}
                      position="50% 35%"
                    />
                    <span className="mt-3 flex min-w-0 items-center justify-between gap-2 text-[0.7rem] font-semibold tracking-[0.18em] text-mocha uppercase">
                      {categoryLabel[item.category]}
                      <span
                        aria-hidden="true"
                        className="hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 lg:inline"
                      >
                        Смотреть
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <Lightbox
        items={items}
        index={openIndex}
        onIndexChange={setOpenIndex}
        labelFor={(item) => categoryLabel[item.category]}
      />
    </section>
  );
}
