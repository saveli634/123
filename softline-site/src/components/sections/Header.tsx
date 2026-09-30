import { ArrowRight } from "lucide-react";
import { nav, whatsapp } from "@/content/catalog";
import { useScrolledPast } from "@/lib/useScrollY";
import { cn } from "@/lib/utils";
import { Button, nudge } from "@/components/ui/button";
import { MobileMenu } from "./MobileMenu";
import { Logo } from "./Logo";

/**
 * Над тёмным первым экраном шапка прозрачная и светлая;
 * после прокрутки становится плотной, светлой, с тёмным текстом.
 */
export function Header() {
  const solid = useScrolledPast(40);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-[background-color,color,box-shadow] duration-500 ease-(--ease-out-soft)",
        solid
          ? "bg-ivory/92 text-graphite shadow-[0_1px_0_0_rgb(18_17_16/0.08)] backdrop-blur-md"
          : "on-dark bg-transparent text-ivory",
      )}
    >
      <div className="container-x flex h-(--header-h) items-center justify-between gap-6">
        <a href="#top" aria-label="Soft Line — на главную" className="-ml-1 rounded-sm px-1 py-2">
          <Logo />
        </a>

        <nav aria-label="Основная навигация" className="hidden lg:block">
          <ul className="flex items-center gap-10">
            {nav.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="link-line py-2 text-[0.82rem] tracking-[0.02em] opacity-80 transition-opacity duration-200 hover:opacity-100"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant={solid ? "primary" : "light"}
            className="hidden sm:inline-flex lg:h-11 lg:px-6"
          >
            <a href={whatsapp("Здравствуйте! Помогите, пожалуйста, подобрать диван.")} target="_blank" rel="noopener">
              Подобрать диван
              <ArrowRight aria-hidden="true" className={nudge} strokeWidth={1.5} />
            </a>
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
