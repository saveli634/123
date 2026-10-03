import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LION_H, LION_LENS, LION_PARTS, LION_W } from "@/generated/lion";
import { useLang, useT } from "@/lib/lang";
import { finePointer, motionOK } from "@/lib/env";
import { subscribe } from "@/lib/scroll";
import type { Lang } from "@/content/i18n";
import { Lion } from "./Lion";
import { Btn, CallButton, WhatsAppButton } from "./Cta";
import { telHref, waHref } from "@/lib/links";

/**
 * Прелоадер ≤1,2 с: контур льва прорисовывается, затем заливка. Чистый CSS (работает до загрузки
 * скриптов), показывается только при .js и без .no-intro (повторный заход, reduced motion —
 * решает встроенный скрипт в <head>).
 */
export function Preloader() {
  return (
    <div className="intro" aria-hidden="true">
      <div className="glow" />
      <svg viewBox={`0 0 ${LION_W} ${LION_H}`}>
        <g className="stroke">
          {LION_PARTS.map((d, i) => (
            <path key={i} d={d} style={{ "--len": LION_LENS[i], "--i": i } as CSSProperties} />
          ))}
        </g>
        <g className="fill-lion" fill="#E3C182">
          <use href="#lion" xlinkHref="#lion" />
        </g>
      </svg>
    </div>
  );
}

/** Красно-золотая нить прогресса страницы. */
export function ProgressThread() {
  const bar = useRef<HTMLElement>(null);
  const dot = useRef<HTMLElement>(null);
  useEffect(
    () =>
      subscribe(null, "page", (p) => {
        if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
        if (dot.current) {
          dot.current.style.transform = `translateX(${(p * window.innerWidth).toFixed(1)}px)`;
          dot.current.style.opacity = p > 0.002 && p < 0.998 ? "1" : "0";
        }
      }),
    [],
  );
  return (
    <div className="thread" aria-hidden="true">
      <i ref={bar} />
      <b ref={dot} />
    </div>
  );
}

function LangSwitch() {
  const { lang, setLang, t } = useLang();
  const pick = (l: Lang) => () => setLang(l);
  return (
    <div className="lang" role="group" aria-label={t.a11y.lang} data-lang={lang}>
      <i aria-hidden="true" />
      <button type="button" aria-pressed={lang === "ru"} onClick={pick("ru")} lang="ru">
        RU
      </button>
      <button type="button" aria-pressed={lang === "en"} onClick={pick("en")} lang="en">
        EN
      </button>
    </div>
  );
}

/** Шапка: прозрачная над первым экраном, дальше — тёмная со стеклом; прячется при прокрутке вниз. */
export function Header({ onBook }: { onBook: () => void }) {
  const t = useT();
  const el = useRef<HTMLElement>(null);
  useEffect(() => {
    let lastY = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const h = el.current;
      if (!h) return;
      if (y > 40) h.setAttribute("data-solid", "");
      else h.removeAttribute("data-solid");
      const down = y > lastY + 4;
      const up = y < lastY - 4;
      if (down && y > 400) h.setAttribute("data-hidden", "");
      else if (up || y < 400) h.removeAttribute("data-hidden");
      if (down || up) lastY = y;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    // фокус внутри шапки — показать её
    const header = el.current;
    const show = () => header?.removeAttribute("data-hidden");
    header?.addEventListener("focusin", show);
    return () => {
      window.removeEventListener("scroll", on);
      header?.removeEventListener("focusin", show);
    };
  }, []);

  return (
    <header ref={el} className="header">
      <div className="wrap header-grid h-full">
        <a href="#top" className="flex items-center gap-3 justify-self-start" aria-label={t.a11y.home}>
          <Lion className="h-8 w-8 text-gold md:h-9 md:w-9" />
          <span className="t-label hidden text-cream xs:inline" translate="no">
            Carleone Service
          </span>
        </a>
        <nav aria-label={t.a11y.nav} className="hidden items-center gap-2 xl:flex">
          {(
            [
              ["#services", t.nav.services],
              ["#cases", t.nav.cases],
              ["#project", t.nav.project],
              ["#team", t.nav.team],
              ["#contacts", t.nav.contacts],
            ] as const
          ).map(([href, label]) => (
            <a key={href} className="navlink t-label" href={href}>
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-2 md:gap-3">
          <LangSwitch />
          <Btn variant="ghost" size="sm" onClick={onBook} className="header-book hidden sm:inline-flex">
            {t.cta.bookShort}
          </Btn>
        </div>
      </div>
    </header>
  );
}

/**
 * Нижняя панель телефона — всегда под рукой: «Позвонить / WhatsApp», а пока номера не указаны —
 * «Записаться / Работы».
 */
export function MobileBar({ onBook }: { onBook: () => void }) {
  const t = useT();
  const direct = telHref() || waHref();
  return (
    <nav className="mobilebar" aria-label={t.a11y.menuMobile}>
      {direct ? (
        <>
          <CallButton size="sm" />
          <WhatsAppButton short size="sm" variant="line" />
        </>
      ) : (
        <>
          <Btn size="sm" onClick={onBook}>
            {t.cta.bookShort}
          </Btn>
          <Btn size="sm" variant="line" href="#cases">
            {t.cta.casesShort}
          </Btn>
        </>
      )}
    </nav>
  );
}

/** Кастомный курсор (только мышь): точка + кольцо с инерцией, подписи над «тянуть / листать». */
export function Cursor() {
  const t = useT();
  const root = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (!finePointer() || !motionOK()) return;
    const html = document.documentElement;
    html.classList.add("has-cursor");
    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    let raf = 0;
    let shown = false;
    const loop = () => {
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      raf = Math.abs(x - rx) + Math.abs(y - ry) > 0.2 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        rx = x;
        ry = y;
        root.current?.removeAttribute("data-hidden");
      }
      if (!raf) raf = requestAnimationFrame(loop);
      const target = (e.target as Element | null)?.closest?.(
        "[data-cursor], a, button, [role='slider'], input, textarea, label",
      );
      const state = target?.getAttribute("data-cursor");
      const r = root.current;
      if (!r) return;
      if (state) {
        r.dataset.state = "label";
        setLabel(state);
      } else if (target && !/^(INPUT|TEXTAREA)$/.test(target.tagName)) r.dataset.state = "link";
      else r.dataset.state = "";
    };
    const leave = () => {
      shown = false;
      root.current?.setAttribute("data-hidden", "");
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  const text =
    label === "drag"
      ? t.cursor.drag
      : label === "scroll"
        ? t.cursor.scroll
        : label === "compare"
          ? t.cursor.compare
          : "";
  return (
    <div ref={root} className="cursor" aria-hidden="true" data-hidden="">
      <div ref={ring} className="cursor-ring">
        <span>{text}</span>
      </div>
      <div ref={dot} className="cursor-dot" />
    </div>
  );
}
