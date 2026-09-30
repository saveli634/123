import { useRef, useState, type MouseEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, Phone, X } from "lucide-react";
import { brand, nav, whatsapp } from "@/content/catalog";
import { Button, nudge } from "@/components/ui/button";
import { Logo } from "./Logo";

/**
 * Мобильное меню на Radix Dialog: фокус-ловушка, Esc, блокировка скролла.
 * Панель раскрывается шторкой, пункты появляются лесенкой.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pending = useRef<string | null>(null);

  // Переход по якорю — после закрытия, иначе блокировка скролла «съест» прокрутку.
  const go = (href: string) => (e: MouseEvent) => {
    e.preventDefault();
    pending.current = href;
    setOpen(false);
  };
  const onCloseAutoFocus = (e: Event) => {
    const href = pending.current;
    pending.current = null;
    const el = href ? document.querySelector<HTMLElement>(href) : null;
    if (!el || !href) return;
    e.preventDefault();
    history.pushState(null, "", href);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus({ preventScroll: true });
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Открыть меню"
          className="-mr-2 inline-flex size-11 items-center justify-center lg:hidden"
        >
          <span aria-hidden="true" className="flex w-6 flex-col gap-[7px]">
            <span className="h-px w-full bg-current" />
            <span className="h-px w-3/5 self-end bg-current" />
          </span>
        </button>
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="on-dark fixed inset-0 z-50 flex flex-col overflow-y-auto bg-graphite text-ivory outline-none data-[state=closed]:animate-[menu-out_380ms_var(--ease-in-out-soft)] data-[state=open]:animate-[menu-in_560ms_var(--ease-in-out-soft)]"
        >
          <DialogPrimitive.Title className="sr-only">Меню</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Разделы сайта и контакты шоурума
          </DialogPrimitive.Description>

          <div className="container-x flex h-(--header-h) shrink-0 items-center justify-between">
            <Logo />
            <DialogPrimitive.Close asChild>
              <button type="button" aria-label="Закрыть меню" className="-mr-2 inline-flex size-11 items-center justify-center">
                <X aria-hidden="true" className="size-6" strokeWidth={1.25} />
              </button>
            </DialogPrimitive.Close>
          </div>

          <nav aria-label="Мобильная навигация" className="container-x flex-1 pt-8">
            <ul>
              {nav.map((item, i) => (
                <li
                  key={item.href}
                  className="animate-fade-up border-b border-ivory/10"
                  style={{ ["--delay" as string]: `${140 + i * 55}ms` }}
                >
                  <a
                    href={item.href}
                    onClick={go(item.href)}
                    className="display flex items-baseline justify-between py-4 text-[2.6rem]"
                  >
                    {item.label}
                    <span className="text-xs tracking-[0.2em] text-ivory/35 tabular-nums">0{i + 1}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div
            className="container-x animate-fade-up space-y-5 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))]"
            style={{ ["--delay" as string]: "480ms" }}
          >
            <Button asChild variant="accent" size="lg" className="w-full">
              <a href={whatsapp("Здравствуйте! Помогите, пожалуйста, подобрать диван.")} target="_blank" rel="noopener">
                Подобрать диван
                <ArrowRight aria-hidden="true" className={nudge} strokeWidth={1.5} />
              </a>
            </Button>
            <a href={`tel:${brand.phones[0].tel}`} className="flex h-12 items-center gap-3 text-lg">
              <Phone aria-hidden="true" className="size-4 text-ember" strokeWidth={1.5} />
              {brand.phones[0].display}
            </a>
            <p className="text-sm text-ivory/55">
              {brand.showroom}, {brand.showroomDetails}
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
