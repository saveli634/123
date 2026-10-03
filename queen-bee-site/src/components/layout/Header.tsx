import { useEffect, useState } from "react";
import { nav } from "@/content/text";
import { HexMark } from "@/components/shared/Bee";
import { BookButton } from "@/components/shared/Buttons";

/** Шапка: знак и название, разделы (с планшета), «Записаться». Прячется при прокрутке вниз. */
export function Header() {
  const [state, setState] = useState({ hidden: false, scrolled: false });
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    let hidden = false;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const scrolled = y > 12;
      if (Math.abs(y - last) > 6) {
        hidden = y > last && y > 160;
        last = y;
      }
      setState((s) => (s.hidden === hidden && s.scrolled === scrolled ? s : { hidden, scrolled }));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-header" data-hidden={state.hidden} data-scrolled={state.scrolled}>
      <div className="container-x flex h-[68px] items-center justify-between gap-6 md:h-[76px]">
        <a href="#top" className="group flex items-center gap-3 text-espresso no-underline" aria-label="Queen Bee — в начало страницы">
          <HexMark className="size-9 transition-transform duration-700 ease-(--ease-lux) group-hover:rotate-[30deg]" />
          <span className="font-display text-[1.45rem] leading-none tracking-[-0.01em]" translate="no">
            Queen <em className="font-medium">Bee</em>
          </span>
        </a>
        <nav aria-label="Разделы" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="label nav-link text-espresso">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <BookButton size="sm" />
      </div>
    </header>
  );
}
