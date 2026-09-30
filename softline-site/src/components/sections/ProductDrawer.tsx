import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPin, Phone, X } from "lucide-react";
import { brand, priceMessage, whatsapp, type Product } from "@/content/catalog";
import { Img } from "@/components/Img";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const typeLabel = { straight: "Прямой диван", corner: "Угловой диван" } as const;

/**
 * Карточка модели. Десктоп — панель справа, телефон — лист снизу.
 * Галерея листается свайпом (scroll-snap) или стрелками / клавишами ← →.
 */
export function ProductDrawer({ product, onClose }: { product: Product | null; onClose: () => void }) {
  // Держим последнюю модель, чтобы контент не исчезал во время анимации закрытия.
  const [shown, setShown] = useState<Product | null>(product);
  useEffect(() => {
    if (product) setShown(product);
  }, [product]);

  // Диалог управляется снаружи (без Trigger) — возвращаем фокус на карточку сами.
  const returnFocus = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  if (product && !wasOpen.current && typeof document !== "undefined") {
    returnFocus.current = document.activeElement as HTMLElement | null;
  }
  wasOpen.current = !!product;

  return (
    <DialogPrimitive.Root open={!!product} onOpenChange={(o) => !o && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/55 backdrop-blur-[2px] data-[state=closed]:animate-[fade-out_260ms_var(--ease-out-quart)] data-[state=open]:animate-[fade-in_360ms_var(--ease-out-soft)]" />
        <DialogPrimitive.Content
          onCloseAutoFocus={(e) => {
            if (returnFocus.current?.isConnected) {
              e.preventDefault();
              returnFocus.current.focus();
            }
          }}
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden bg-ivory text-graphite shadow-[0_-20px_60px_-20px_rgb(18_17_16/0.4)] outline-none",
            "inset-x-0 bottom-0 max-h-[92svh] rounded-t-[1.25rem]",
            "data-[state=open]:animate-[drawer-in-up_520ms_var(--ease-drawer)] data-[state=closed]:animate-[drawer-out-down_320ms_var(--ease-in-out-soft)]",
            "lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[min(48rem,94vw)] lg:rounded-none",
            "lg:data-[state=open]:animate-[drawer-in-right_560ms_var(--ease-drawer)] lg:data-[state=closed]:animate-[drawer-out-right_340ms_var(--ease-in-out-soft)]",
          )}
        >
          {shown && <DrawerBody product={shown} />}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function DrawerBody({ product }: { product: Product }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = product.images.length;

  useEffect(() => {
    setIndex(0);
    track.current?.scrollTo({ left: 0 });
  }, [product.id]);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const next = (i + count) % count;
    el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (count < 2) return;
    if (e.key === "ArrowRight") goTo(index + 1);
    if (e.key === "ArrowLeft") goTo(index - 1);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain" onKeyDown={onKeyDown}>
      {/* Ручка листа на телефоне */}
      <div aria-hidden="true" className="flex justify-center pt-3 pb-1 lg:hidden">
        <span className="h-1 w-10 rounded-full bg-graphite/20" />
      </div>

      <div className="flex items-center justify-between px-5 py-3 lg:px-10 lg:py-6">
        <p className="eyebrow text-muted">{product.type ? typeLabel[product.type] : "Из шоурума"}</p>
        <DialogPrimitive.Close asChild>
          <button type="button" aria-label="Закрыть" className="-mr-2 inline-flex size-11 items-center justify-center transition-transform duration-200 hover:rotate-90">
            <X aria-hidden="true" className="size-5" strokeWidth={1.25} />
          </button>
        </DialogPrimitive.Close>
      </div>

      {/* Галерея */}
      <div className="relative">
        <div
          ref={track}
          onScroll={onScroll}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-roledescription="галерея"
          aria-label={`Фотографии ${product.name}`}
        >
          {product.images.map((img, i) => (
            <div
              key={img.name}
              className="w-full shrink-0 snap-center px-5 lg:px-10"
              aria-roledescription="слайд"
              aria-label={`${i + 1} из ${count}`}
            >
              <Img
                name={img.name}
                alt={img.alt}
                sizes="(min-width: 1024px) 44rem, 100vw"
                position={img.position}
                className="aspect-[4/3] lg:aspect-[5/4]"
                imgClassName={img.name === "07_oscar_product" ? "object-contain" : undefined}
              />
            </div>
          ))}
        </div>

        {count > 1 && (
          <div className="mt-4 flex items-center justify-between px-5 lg:px-10">
            <div className="flex gap-2" aria-hidden="true">
              {product.images.map((img, i) => (
                <span
                  key={img.name}
                  className={cn(
                    "h-[2px] w-8 transition-colors duration-300",
                    i === index ? "bg-terracotta" : "bg-graphite/15",
                  )}
                />
              ))}
            </div>
            <p className="sr-only" aria-live="polite">{`Фото ${index + 1} из ${count}`}</p>
            <div className="flex gap-1">
              <button type="button" onClick={() => goTo(index - 1)} aria-label="Предыдущее фото" className="inline-flex size-11 items-center justify-center border border-graphite/15 transition-colors hover:border-graphite active:scale-95">
                <ChevronLeft aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </button>
              <button type="button" onClick={() => goTo(index + 1)} aria-label="Следующее фото" className="inline-flex size-11 items-center justify-center border border-graphite/15 transition-colors hover:border-graphite active:scale-95">
                <ChevronRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Описание */}
      <div className="px-5 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] lg:px-10 lg:pt-10 lg:pb-12">
        <DialogPrimitive.Title className="display text-[clamp(2.6rem,6vw,4.4rem)]">{product.name}</DialogPrimitive.Title>
        <DialogPrimitive.Description className="mt-4 max-w-lg text-muted">{product.descriptor}</DialogPrimitive.Description>

        <dl className="mt-8 grid gap-6 border-t border-graphite/12 pt-6 sm:grid-cols-2">
          <div>
            <dt className="eyebrow text-muted">На фото</dt>
            <dd className="mt-3">
              <ul className="space-y-1.5 text-[0.95rem]">
                {product.details.map((d) => (
                  <li key={d} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[0.7em] h-px w-3 shrink-0 bg-terracotta" />
                    {d}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-muted">Стоимость</dt>
            <dd className="mt-3">
              <p className="text-xl">Цена по запросу</p>
              <p className="mt-2 text-sm text-muted">
                Размеры, варианты обивки и наличие уточнит менеджер. Рассрочка Kaspi — по условиям для модели.
              </p>
            </dd>
          </div>
        </dl>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="accent" size="lg" className="sm:flex-1">
            <a href={whatsapp(priceMessage(product.name))} target="_blank" rel="noopener">
              Узнать цену в WhatsApp
              <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={`tel:${brand.phones[0].tel}`}>
              <Phone aria-hidden="true" className="size-4" strokeWidth={1.5} />
              Позвонить
            </a>
          </Button>
        </div>

        <p className="mt-8 flex items-start gap-3 text-sm text-muted">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-terracotta" strokeWidth={1.5} />
          Посмотреть вживую: {brand.showroom}, {brand.showroomDetails}
        </p>
      </div>
    </div>
  );
}
