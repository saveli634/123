import { Phone } from "lucide-react";
import { nav, site, whatsapp } from "@/data/site.config";
import { useActiveSection, useHideOnScroll } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/shared/Wordmark";
import { WhatsAppIcon } from "@/components/shared/icons";
import { MobileSheet } from "./MobileSheet";

const ids = nav.map((n) => n.href.slice(1));

export function Header() {
  const { hidden, scrolled } = useHideOnScroll();
  const active = useActiveSection(ids);
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b transition-[transform,background-color,border-color] duration-300 ease-(--ease-out)",
        scrolled ? "border-line bg-bg/95 backdrop-blur" : "border-transparent bg-bg/40",
        hidden && "-translate-y-full",
      )}
    >
      <div className="container-x flex h-(--header-h) items-center justify-between gap-4">
        <a href="#top" aria-label="Автосервис «У Грека» — наверх" className="rounded-[2px] py-1">
          <Wordmark />
        </a>
        <nav aria-label="Основная навигация" className="hidden xl:block">
          <ul className="flex items-center gap-7">
            {nav.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  aria-current={active === n.href.slice(1) ? "true" : undefined}
                  className={cn(
                    "relative py-2 text-[0.92rem] transition-colors hover:text-text",
                    active === n.href.slice(1) ? "text-text" : "text-muted",
                    "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:bg-accent after:transition-transform after:duration-300",
                    active === n.href.slice(1) ? "after:scale-x-100" : "after:scale-x-0",
                  )}
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <a href={`tel:${site.phone.tel}`} className="mono hidden text-[0.95rem] hover:text-accent lg:block">
            {site.phone.display}
          </a>
          <Button asChild size="sm" className="hidden lg:inline-flex">
            <a href={`tel:${site.phone.tel}`}>
              <Phone aria-hidden="true" className="size-4" />
              Позвонить
            </a>
          </Button>
          <a href={`tel:${site.phone.tel}`} aria-label={`Позвонить: ${site.phone.display}`} className="inline-flex size-12 items-center justify-center rounded-[3px] bg-accent text-accent-ink lg:hidden">
            <Phone aria-hidden="true" className="size-5" />
          </a>
          <a href={whatsapp()} target="_blank" rel="noopener" aria-label="Написать в WhatsApp" className="inline-flex size-12 items-center justify-center rounded-[3px] border border-line lg:hidden">
            <WhatsAppIcon className="size-5" />
          </a>
          <MobileSheet />
        </div>
      </div>
    </header>
  );
}
