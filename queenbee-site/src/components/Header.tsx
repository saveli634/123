import { useEffect, useRef, useState } from "react";
import { Wordmark } from "./Logo";
import { lockScroll } from "@/lib/scroll";

const NAV = [
  { href: "#works", label: "Работы" },
  { href: "#services", label: "Услуги" },
  { href: "#space", label: "Пространство" },
  { href: "#contacts", label: "Контакты" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    lockScroll(true);
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a, button");
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      lockScroll(false);
      btn.current?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <header className="hdr">
      <a href="#top" className="hdr__logo" aria-label="Queen Bee — в начало">
        <Wordmark />
      </a>
      <nav className="hdr__nav" aria-label="Разделы">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} className="hdr__link">
            {n.label}
          </a>
        ))}
      </nav>
      <a href="#booking" className="btn btn--wine btn--sm hdr__cta" data-magnetic>
        Записаться
      </a>
      <button ref={btn} type="button" className="hdr__menu" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(true)}>
        Меню
      </button>
      <div id="menu" className={`menu ${open ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-label="Меню" ref={panel} hidden={!open}>
        <button type="button" className="menu__close" onClick={() => setOpen(false)}>
          Закрыть
        </button>
        <nav className="menu__nav" aria-label="Разделы">
          {[...NAV, { href: "#booking", label: "Записаться" }].map((n, i) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} style={{ transitionDelay: `${60 + i * 50}ms` }}>
              {n.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
