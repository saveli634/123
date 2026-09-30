import { useRef, useState, type MouseEvent } from "react";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { brand, nav } from "@/content/site";
import { ArrowIcon, Button } from "@/components/ui/button";
import { Logo } from "./Logo";

/**
 * Мобильное меню на базе Radix Dialog: фокус-ловушка, Esc, блокировка скролла,
 * возврат фокуса на кнопку. Панель раскрывается шторкой сверху, пункты — лесенкой.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pendingTarget = useRef<string | null>(null);

  // Переход по якорю делаем после закрытия: иначе блокировка скролла диалога «съест» прокрутку.
  const go = (href: string) => (e: MouseEvent) => {
    e.preventDefault();
    pendingTarget.current = href;
    setOpen(false);
  };

  const onCloseAutoFocus = (e: Event) => {
    const href = pendingTarget.current;
    pendingTarget.current = null;
    if (!href) return;
    const el = document.querySelector<HTMLElement>(href);
    if (!el) return;
    e.preventDefault();
    history.pushState(null, "", href);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.focus({ preventScroll: true });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="-mr-2 inline-flex size-11 items-center justify-center rounded-full text-ink lg:hidden"
          aria-label="Открыть меню"
        >
          <span aria-hidden="true" className="flex w-6 flex-col gap-[7px]">
            <span className="h-px w-full bg-current" />
            <span className="h-px w-2/3 self-end bg-current" />
          </span>
        </button>
      </DialogTrigger>

      <DialogPortal>
        <DialogPrimitive.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className="on-dark fixed inset-0 z-50 flex flex-col overflow-y-auto bg-espresso text-ivory outline-none data-[state=closed]:animate-[menu-out_380ms_var(--ease-in-out-soft)] data-[state=open]:animate-[menu-in_560ms_var(--ease-in-out-soft)]"
        >
          <DialogTitle className="sr-only">Меню</DialogTitle>
          <DialogDescription className="sr-only">
            Разделы сайта, онлайн-запись и контакты салона
          </DialogDescription>

          <div className="container-x flex h-(--header-h) shrink-0 items-center justify-between">
            <Logo tone="light" />
            <DialogClose asChild>
              <button
                type="button"
                className="-mr-2 inline-flex size-11 items-center justify-center rounded-full"
                aria-label="Закрыть меню"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" stroke="currentColor" strokeWidth="1.2">
                  <path d="M5 5l14 14M19 5L5 19" />
                </svg>
              </button>
            </DialogClose>
          </div>

          <nav aria-label="Мобильная навигация" className="container-x flex-1 pt-8">
            <ul className="flex flex-col">
              {nav.map((item, i) => (
                <li
                  key={item.href}
                  className="animate-fade-up border-b border-ivory/10"
                  style={{ ["--delay" as string]: `${140 + i * 55}ms` }}
                >
                  <a
                      href={item.href}
                      onClick={go(item.href)}
                      className="flex items-baseline justify-between py-4 font-display text-[2.4rem] leading-none"
                    >
                      {item.label}
                      <span className="font-sans text-xs tracking-[0.2em] text-ivory/40 tabular-nums">
                        0{i + 1}
                      </span>
                    </a>
                </li>
              ))}
            </ul>
          </nav>

          <div
            className="container-x animate-fade-up space-y-6 pt-10 pb-[max(2rem,env(safe-area-inset-bottom))]"
            style={{ ["--delay" as string]: "520ms" }}
          >
            <Button asChild variant="light" size="lg" className="w-full">
              <a href={brand.bookingUrl} target="_blank" rel="noopener">
                Записаться онлайн
                <ArrowIcon />
              </a>
            </Button>
            <div className="flex items-center justify-between text-sm text-ivory/60">
              <span>
                {brand.city}, {brand.address}
              </span>
              <a href={brand.instagramUrl} target="_blank" rel="noopener" className="text-ivory">
                {brand.instagramHandle}
              </a>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
