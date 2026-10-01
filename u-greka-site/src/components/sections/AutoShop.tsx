import type { Photo } from "@/data/types";
import { whatsapp } from "@/data/site.config";
import { PhotoFrame } from "@/components/shared/PhotoFrame";
import { useUi } from "@/components/shared/UiContext";
import { WhatsAppIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

const photos: Photo[] = [
  { name: "shop-belts", alt: "Стена с приводными ремнями и стеллажи с запчастями", tag: "Ремни" },
  { name: "shop-shelves-2", alt: "Стеллажи с запчастями в коробках", tag: "Запчасти" },
  { name: "shop-oils-drums", alt: "Бочки с маслом и стойки с аксессуарами", tag: "Масла" },
  { name: "shop-accessories", alt: "Полки с автохимией и аксессуарами", tag: "Аксессуары" },
  { name: "shop-boxes", alt: "Коробки с запчастями на стеллажах", tag: "Склад" },
];

const categories = [
  "Радиаторы: основные, кондиционера, печки",
  "Моторчики печек",
  "Колодки",
  "Ремни",
  "Масла и антифриз",
  "Лампочки",
  "Аксессуары",
  "Форсуночные кольца, резинки, сетки",
  "Фильтры",
];

/** Автомагазин при сервисе: фото полок и только упомянутые в постах категории. Без цен и корзины. */
export function AutoShop() {
  const { openLightbox } = useUi();
  return (
    <section id="avtomagazin" tabIndex={-1} aria-labelledby="shop-title" className="paper section-y">
      <div className="container-x grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow reveal"><span>08 — </span><span className="text-paper-muted">При автосервисе</span></p>
          <h2 id="shop-title" className="display mt-4 text-[clamp(2.3rem,5.4vw,4.6rem)]">
            <span className="line-mask"><span>Автомагазин</span></span>
          </h2>
          <p className="reveal mt-5 text-[1.08rem]">«1000 мелочей для вашего автомобиля»: радиаторы, ремни, колодки, масла и мелочи для авто — здесь же, при сервисе.</p>
          <ul className="reveal mt-7 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {categories.map((c) => (
              <li key={c} className="flex gap-3">
                <span aria-hidden="true" className="mt-[0.62em] h-0.5 w-3 shrink-0 bg-paper-ink" />
                {c}
              </li>
            ))}
          </ul>
          <div className="reveal mt-8">
            <Button asChild variant="dark" size="lg">
              <a href={whatsapp("Здравствуйте! Хочу уточнить наличие запчасти: ")} target="_blank" rel="noopener">
                <WhatsAppIcon className="size-5" />
                Уточнить наличие
              </a>
            </Button>
          </div>
        </div>
        <ul className="no-scrollbar -mx-(--gutter) flex snap-x snap-mandatory gap-3 overflow-x-auto px-(--gutter) lg:col-span-7 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0" aria-label="Фото автомагазина">
          {photos.map((p, i) => (
            <li key={p.name} className={i === 0 ? "w-[72%] shrink-0 snap-start lg:col-span-2 lg:row-span-2 lg:w-auto" : "w-[72%] shrink-0 snap-start lg:w-auto"}>
              <PhotoFrame photo={p} ratio="4/5" sizes="(min-width: 1024px) 26vw, 72vw" onOpen={() => openLightbox(photos, i)} className="reveal border-paper-ink/15 lg:h-full lg:[&>.frame-media]:h-full" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
