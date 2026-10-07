import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./Brand";
import { ChannelIcon, MagLink } from "./Buttons";
import { scrollToHash, stopScroll } from "@/lib/motion";
import { bookingChannels, site } from "@/site.config";
import { useMinskTime } from "@/lib/time";
import { HAS_REVIEWS } from "./Reviews";

export const NAV = [
  { href: "#do-posle", label: "До/после" },
  { href: "#uslugi", label: "Услуги" },
  { href: "#process", label: "Процедура" },
  { href: "#pochemu", label: "Почему я" },
  { href: "#raboty", label: "Работы" },
  ...(HAS_REVIEWS ? [{ href: "#otzyvy", label: "Отзывы" }] : []),
];

export function Header() {
  const [open, setOpen] = useState(false);
  const time = useMinskTime();
  const header = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  // Шапка прячется при прокрутке вниз и возвращается при прокрутке вверх
  useEffect(() => {
    let last = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const el = header.current;
      if (!el) return;
      el.classList.toggle("is-scrolled", y > 24);
      if (Math.abs(y - last) > 6) {
        el.classList.toggle("is-hidden", y > last && y > 160);
        last = y;
      }
    };
    const req = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", req, { passive: true });
    return () => window.removeEventListener("scroll", req);
  }, []);

  useEffect(() => {
    const d = document.documentElement;
    d.classList.toggle("menu-open", open);
    stopScroll(open);
    if (!open) return;
    firstLink.current?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [open]);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    // дождаться, пока меню закроется и прокрутка разблокируется
    window.setTimeout(() => scrollToHash(href), open ? 80 : 0);
  };

  return (
    <>
      <header className="header" ref={header}>
        <div className="header-inner">
          <a href="#top" className="header-brand" onClick={go("#top")} aria-label={`${site.brand} — в начало`}>
            <BrandMark decorative className="brand--sm" />
          </a>
          <nav className="header-nav" aria-label="Разделы">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={go(n.href)} className="nav-link">
                {n.label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            {time && (
              <span className="header-time" aria-label={`В Минске ${time}`}>
                <span className="header-time-dot" aria-hidden="true" />
                Минск {time}
              </span>
            )}
            <MagLink href="#zapis" variant="light" className="btn--sm header-cta">
              Записаться
            </MagLink>
            <button
              ref={menuBtn}
              type="button"
              className={`menu-btn ${open ? "is-open" : ""}`}
              aria-expanded={open}
              aria-controls="menu"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setOpen((v) => !v)}
            >
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div id="menu" className={`menu ${open ? "is-open" : ""}`} inert={!open} aria-hidden={!open} data-lenis-prevent>
        <div className="menu-curtain" />
        <div className="menu-inner">
          <nav aria-label="Меню">
            <ol className="menu-list">
              {[...NAV, { href: "#zapis", label: "Записаться" }].map((n, i) => (
                <li key={n.href} style={{ "--i": i } as React.CSSProperties}>
                  <a href={n.href} ref={i === 0 ? firstLink : undefined} onClick={go(n.href)} className="menu-link">
                    <span className="menu-num">{String(i + 1).padStart(2, "0")}</span>
                    {n.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="menu-foot">
            <span>{site.city}</span>
            <div className="menu-channels">
              {bookingChannels().map((c) => (
                <a key={c.id} href={c.href} className="menu-channel" {...(c.id !== "phone" ? { rel: "noopener noreferrer", "data-ext": "" } : {})}>
                  <ChannelIcon id={c.id} />
                  {c.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
