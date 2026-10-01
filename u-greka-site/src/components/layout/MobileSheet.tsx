import { useRef, useState, type MouseEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, Phone, X } from "lucide-react";
import { nav, site, whatsapp } from "@/data/site.config";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/shared/Wordmark";
import { WhatsAppIcon } from "@/components/shared/icons";
import { scrollToEl } from "@/lib/smoothScroll";

/** Мобильное меню на всю высоту: крупный шрифт, две кнопки закреплены внизу. */
export function MobileSheet() {
  const [open, setOpen] = useState(false);
  const pending = useRef<string | null>(null);
  const go = (href: string) => (e: MouseEvent) => {
    e.preventDefault();
    pending.current = href;
    setOpen(false);
  };
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" aria-label="Открыть меню" className="-mr-1 inline-flex size-12 items-center justify-center rounded-[3px] xl:hidden">
          <Menu aria-hidden="true" className="size-6" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Content
          onCloseAutoFocus={(e) => {
            const href = pending.current;
            pending.current = null;
            const el = href ? document.querySelector<HTMLElement>(href) : null;
            if (!el || !href) return;
            e.preventDefault();
            history.pushState(null, "", href);
            scrollToEl(el);
            el.focus({ preventScroll: true });
          }}
          className="fixed inset-0 z-50 flex flex-col bg-bg outline-none data-[state=closed]:animate-[fade-out_180ms] data-[state=open]:animate-[fade-in_220ms_var(--ease-out)]"
        >
          <Dialog.Title className="sr-only">Меню</Dialog.Title>
          <Dialog.Description className="sr-only">Разделы сайта и контакты автосервиса</Dialog.Description>
          <div className="container-x flex h-(--header-h) shrink-0 items-center justify-between border-b border-line">
            <Wordmark />
            <Dialog.Close asChild>
              <button type="button" aria-label="Закрыть меню" className="-mr-1 inline-flex size-12 items-center justify-center rounded-[3px]">
                <X aria-hidden="true" className="size-6" />
              </button>
            </Dialog.Close>
          </div>
          <nav aria-label="Мобильная навигация" className="container-x flex-1 overflow-y-auto py-6">
            <ul>
              {nav.map((n, i) => (
                <li key={n.href} className="animate-fade-up border-b border-line" style={{ ["--delay" as string]: `${60 + i * 45}ms` }}>
                  <a href={n.href} onClick={go(n.href)} className="flex min-h-16 items-center justify-between gap-4">
                    <span className="display text-[2.1rem]">{n.label}</span>
                    <span className="mono text-sm text-accent">0{i + 1}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-muted">
              {site.city}, {site.street}
            </p>
          </nav>
          <div className="container-x grid shrink-0 grid-cols-2 gap-2 border-t border-line py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <Button asChild size="lg">
              <a href={`tel:${site.phone.tel}`}>
                <Phone aria-hidden="true" className="size-5" />
                Позвонить
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={whatsapp()} target="_blank" rel="noopener">
                <WhatsAppIcon className="size-5" />
                WhatsApp
              </a>
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
