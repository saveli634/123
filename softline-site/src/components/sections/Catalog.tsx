import { useMemo, useRef, useState } from "react";
import { ArrowUpRight, Plus } from "lucide-react";
import { priceMessage, products, productTypes, whatsapp, type Product, type ProductType } from "@/content/catalog";
import { Img } from "@/components/Img";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useScrollVar, useTilt } from "@/lib/scrollFx";
import { ProductDrawer } from "./ProductDrawer";

type Filter = "all" | ProductType;

export const typeLabel: Record<ProductType, string> = {
  straight: "Прямой диван",
  corner: "Угловой диван",
};

/**
 * Раскладка «журнальных разворотов»: у каждой позиции своя ширина,
 * пропорция кадра и сдвиг по вертикали. Повторяется по кругу.
 */
const layout = [
  { col: "lg:col-span-7", aspect: "aspect-[4/5]", shift: "" },
  { col: "lg:col-span-4 lg:col-start-9", aspect: "aspect-[3/4]", shift: "lg:mt-44" },
  { col: "lg:col-span-5 lg:col-start-2", aspect: "aspect-[3/4]", shift: "lg:-mt-10" },
  { col: "lg:col-span-6 lg:col-start-7", aspect: "aspect-[5/4]", shift: "lg:mt-28" },
  { col: "lg:col-span-8", aspect: "aspect-[16/11]", shift: "" },
  { col: "lg:col-span-4", aspect: "aspect-[4/5]", shift: "lg:mt-36" },
  { col: "lg:col-span-6 lg:col-start-4", aspect: "aspect-[4/3]", shift: "" },
];

export function Catalog() {
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<Product | null>(null);

  const items = useMemo(
    () => (filter === "all" ? products : products.filter((p) => p.type === filter)),
    [filter],
  );

  // Фильтр показываем только для типов, которые реально есть в каталоге.
  const available = productTypes.filter(
    (t) => t.value === "all" || products.some((p) => p.type === t.value),
  );

  return (
    <section id="catalog" tabIndex={-1} aria-labelledby="catalog-title" className="section-y bg-cream">
      <div className="container-x">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow reveal text-muted">Каталог</p>
            <h2 id="catalog-title" className="display mt-5 text-[clamp(3rem,7.5vw,7.4rem)] text-graphite">
              <span className="line-mask">
                <span>Коллекция</span>
              </span>
            </h2>
          </div>
          <div className="reveal flex flex-col gap-3 lg:items-end" style={{ ["--delay" as string]: "120ms" }}>
            <ToggleGroup
              type="single"
              value={filter}
              onValueChange={(v) => v && setFilter(v as Filter)}
              aria-label="Тип дивана"
              className="gap-1 border border-graphite/15 p-1"
            >
              {available.map((t) => (
                <ToggleGroupItem key={t.value} value={t.value}>
                  {t.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-sm text-muted" aria-live="polite">
              {`Моделей: ${items.length}`}
            </p>
          </div>
        </div>

        <ul key={filter} className="mt-16 grid gap-x-8 gap-y-20 lg:mt-24 lg:grid-cols-12 lg:gap-y-28">
          {items.map((p, i) => {
            const l = layout[i % layout.length];
            return (
              <li
                key={p.id}
                className={cn("animate-fade-up", l.col, l.shift, i % 2 === 1 && "pl-10 sm:pl-24 lg:pl-0")}
                style={{ ["--delay" as string]: `${Math.min(i, 3) * 90}ms` }}
              >
                <ProductCard
                  product={p}
                  index={products.indexOf(p)}
                  aspect={l.aspect}
                  onOpen={() => setActive(p)}
                />
              </li>
            );
          })}
        </ul>
      </div>

      <ProductDrawer product={active} onClose={() => setActive(null)} />
    </section>
  );
}

function ProductCard({
  product,
  index,
  aspect,
  onOpen,
}: {
  product: Product;
  index: number;
  aspect: string;
  onOpen: () => void;
}) {
  const cover = product.images[0];
  const tilt = useRef<HTMLButtonElement>(null);
  const media = useRef<HTMLDivElement>(null);
  useTilt(tilt, 5);
  useScrollVar(media);
  return (
    <article aria-labelledby={`p-${product.id}`} className="group">
      <button
        ref={tilt}
        type="button"
        onClick={onOpen}
        className="tilt img-hover relative block w-full text-left"
        aria-label={`Открыть модель ${product.name}`}
      >
        <div ref={media} className={cn("card-media overflow-hidden", aspect)}>
          <Img
            name={cover.name}
            alt={cover.alt}
            sizes="(min-width: 1024px) 50vw, 92vw"
            position={cover.position}
            className="h-full"
          />
        </div>
        <span aria-hidden="true" className="tilt-glare" />
        <span
          aria-hidden="true"
          className="absolute right-4 bottom-4 inline-flex h-10 items-center gap-2 bg-ivory px-4 text-[0.7rem] font-medium tracking-[0.16em] text-graphite uppercase opacity-100 transition-[opacity,transform] duration-400 ease-(--ease-out-soft) lg:translate-y-2 lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100"
        >
          <Plus className="size-3.5" strokeWidth={1.5} />
          Подробнее
        </span>
      </button>

      <div className="mt-6 grid grid-cols-[auto_1fr] gap-x-5">
        <span className="pt-2 text-xs tracking-[0.18em] text-taupe tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div>
          <p className="eyebrow text-muted">{product.type ? typeLabel[product.type] : "Из шоурума"}</p>
          <h3 id={`p-${product.id}`} className="display mt-2 text-[clamp(2.2rem,3.6vw,3.4rem)] text-graphite">
            <button type="button" onClick={onOpen} className="text-left transition-colors duration-300 hover:text-terracotta">
              {product.name}
            </button>
          </h3>
          <p className="mt-3 max-w-md text-[0.95rem] text-muted">{product.descriptor}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-graphite/12 pt-4">
            <span className="text-sm text-graphite">Цена по запросу</span>
            <a
              href={whatsapp(priceMessage(product.name))}
              target="_blank"
              rel="noopener"
              className="group/link inline-flex h-11 items-center gap-2 text-[0.72rem] font-medium tracking-[0.16em] text-terracotta uppercase"
            >
              <span className="link-line">Узнать цену</span>
              <ArrowUpRight aria-hidden="true" className="size-4 transition-transform duration-300 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" strokeWidth={1.5} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
