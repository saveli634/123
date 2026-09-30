import { brand, nav } from "@/content/site";
import { useScrolledPast } from "@/lib/useScrollY";
import { cn } from "@/lib/utils";
import { ArrowIcon, Button } from "@/components/ui/button";
import { MobileMenu } from "./MobileMenu";
import { Logo } from "./Logo";

export function Header() {
  const scrolled = useScrolledPast(24);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-500 ease-(--ease-out-soft)",
        scrolled
          ? "bg-ivory/88 shadow-[0_1px_0_0_rgb(23_19_15/0.08)] backdrop-blur-md"
          : "bg-transparent",
      )}
    >
      <div className="container-x flex h-(--header-h) items-center justify-between gap-6">
        <a href="#top" className="-ml-1 rounded-sm px-1" aria-label="Beauty Soul — на главную">
          <Logo />
        </a>

        <nav aria-label="Основная навигация" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="link-line py-2 text-[0.8rem] font-medium tracking-[0.04em] text-ink/80 transition-colors duration-200 hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="px-4 sm:px-5 lg:h-11 lg:px-6">
            <a href={brand.bookingUrl} target="_blank" rel="noopener">
              Записаться
              <ArrowIcon className="hidden lg:block" />
            </a>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
