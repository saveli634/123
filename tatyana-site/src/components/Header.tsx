import { useEffect, useRef, useState } from "react";
import { hasBooking, channels } from "@/data/site.config";
import { stopScroll } from "@/lib/scroll";
import { Sparkle } from "./glyphs";
import { sphereOfPage } from "@/data/spheres";
import { PAGES, pageHref, type PageId } from "@/data/pages";
import { useRoute } from "@/lib/route";
import { fullName } from "@/data/site.config";
import { Planet } from "./Spheres";

/** Навигация — страницы: четыре сферы и подарки */
export const NAV: { id: PageId; label: string }[] = (["karta", "chislo", "stihi", "pesni", "podarki"] as PageId[]).map((id) => ({
  id,
  label: PAGES[id].nav,
}));

function NavMark({ id, size }: { id: PageId; size: "xs" | "sm" }) {
  const s = sphereOfPage(id);
  if (s) return <Planet id={s.id} className={`planet--${size}`} />;
  return <Sparkle size={size === "xs" ? 11 : 16} className={size === "xs" ? "nav__spark" : "sheet__star"} />;
}

/** Тонкая полоса прогресса сверху — «орбита» с планетой на конце */
function ScrollOrbit() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let f = 0;
    const upd = () => {
      f = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      el.style.setProperty("--sp", String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
    };
    const on = () => {
      if (!f) f = requestAnimationFrame(upd);
    };
    upd();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      cancelAnimationFrame(f);
    };
  }, []);
  return (
    <div ref={ref} className="sorbit" aria-hidden="true">
      <div className="sorbit__track" />
      <div className="sorbit__fill" />
      <div className="sorbit__planet">
        <i />
      </div>
    </div>
  );
}

export function Header() {
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    let f = 0;
    const upd = () => {
      f = 0;
      const y = window.scrollY;
      setSolid(y > 12);
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 160);
      last = y;
    };
    const on = () => {
      if (!f) f = requestAnimationFrame(upd);
    };
    upd();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // меню на телефоне: фокус внутрь, Esc закрывает, прокрутка под ним стоит
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add("menu-open");
    stopScroll(true);
    const first = sheet.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && sheet.current) {
        const f = Array.from(sheet.current.querySelectorAll<HTMLElement>("a, button"));
        const a = f[0];
        const b = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          b.focus();
        } else if (!e.shiftKey && document.activeElement === b) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      root.classList.remove("menu-open");
      stopScroll(false);
      document.removeEventListener("keydown", key);
      menuBtn.current?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);
  const route = useRoute();
  const cur = (id: PageId) => (route === id ? { "aria-current": "page" as const } : {});

  return (
    <>
      <ScrollOrbit />
      <header className={`header${hidden && !open ? " is-hidden" : ""}${solid ? " is-solid" : ""}`}>
        <div className="header__inner wrap">
          <a href={pageHref("home")} className="logo" aria-label={`${fullName} — на главную`} {...cur("home")}>
            <Sparkle size={14} className="logo__star" />
            <span>{fullName}</span>
          </a>
          <nav className="nav" aria-label="Страницы">
            {NAV.map((n) => (
              <a key={n.id} href={pageHref(n.id)} className="nav__link" {...cur(n.id)}>
                <NavMark id={n.id} size="xs" />
                {n.label}
              </a>
            ))}
          </nav>
          <div className="header__end">
            {hasBooking && (
              <a href="#zapis" className="btn btn--ghost btn--sm header__cta">
                <span className="btn__label">Записаться</span>
              </a>
            )}
            <button
              ref={menuBtn}
              type="button"
              className="menu-btn"
              aria-expanded={open}
              aria-controls="menu"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              onClick={() => setOpen((v) => !v)}
            >
              <i />
              <i />
            </button>
          </div>
        </div>
      </header>
      <div
        id="menu"
        ref={sheet}
        className={`sheet${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Меню"
        aria-hidden={!open}
        data-lenis-prevent
      >
        <nav className="sheet__nav" aria-label="Страницы">
          <a href={pageHref("home")} onClick={close} style={{ ["--i" as string]: 0 }} {...cur("home")}>
            <Sparkle size={16} className="sheet__star" />
            Главная
          </a>
          {NAV.map((n, i) => (
            <a key={n.id} href={pageHref(n.id)} onClick={close} style={{ ["--i" as string]: i + 1 }} {...cur(n.id)}>
              <NavMark id={n.id} size="sm" />
              {n.label}
            </a>
          ))}
          {hasBooking && (
            <a href="#zapis" onClick={close} style={{ ["--i" as string]: NAV.length + 1 }}>
              <Sparkle size={16} className="sheet__star" />
              Записаться
            </a>
          )}
        </nav>
        {channels.length > 0 && (
          <div className="sheet__channels">
            {channels.map((c) => (
              <a key={c.id} href={c.href} className="btn btn--ghost btn--sm" {...(c.id === "phone" ? {} : { target: "_blank", rel: "noopener noreferrer" })}>
                <span className="btn__label">{c.label}</span>
              </a>
            ))}
          </div>
        )}
        <button type="button" className="sheet__close" onClick={close} aria-label="Закрыть меню">
          <i />
          <i />
        </button>
      </div>
    </>
  );
}
