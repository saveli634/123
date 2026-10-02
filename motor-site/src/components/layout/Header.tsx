import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { NAV, UI } from "@/content/copy";
import { BookButton } from "@/components/shared/Cta";
import { siteName } from "@/lib/links";

// Меню (диалог Radix) грузится отдельным файлом при первом нажатии — меньше скриптов на старте
const MobileMenu = lazy(() => import("./MobileMenu"));

/** Шапка: прячется при прокрутке вниз, возвращается при прокрутке вверх. */
export function Header() {
  const ref = useRef<HTMLElement>(null);
  const [menu, setMenu] = useState(false);
  const [menuLoaded, setMenuLoaded] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let last = window.scrollY;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        el.dataset.solid = y > 24 ? "1" : "0";
        if (Math.abs(y - last) > 6) {
          el.dataset.hidden = y > last && y > 240 ? "1" : "0";
          last = y;
        }
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const name = siteName();
  return (
    <header ref={ref} className="hdr" data-solid="0" data-hidden="0">
      <div className="wrap hdr-in">
        <a href="#top" className="hdr-logo" data-cursor="link" aria-label={name}>
          <span className="hdr-mark" aria-hidden="true">
            <span />
          </span>
          <span className="hdr-name">{name}</span>
        </a>
        <nav className="hdr-nav" aria-label={UI.nav}>
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="uline" data-cursor="link">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hdr-cta">
          <BookButton size="sm" variant="outline" />
        </div>
        <button type="button" className="hdr-burger" onClick={() => {
            setMenuLoaded(true);
            setMenu(true);
          }} aria-label={UI.menu} aria-expanded={menu}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>
      {menuLoaded && (
        <Suspense fallback={null}>
          <MobileMenu open={menu} onOpenChange={setMenu} />
        </Suspense>
      )}
    </header>
  );
}
