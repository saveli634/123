import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { PAGES, SPA, isPage, type PageId } from "@/data/pages";
import { ScrollTrigger, scrollTop } from "./scroll";

/**
 * Какая страница открыта. На хостинге — своя у каждого HTML-файла.
 * В sait.html все страницы лежат в одном файле: адрес #/karta выбирает нужную,
 * а видимость задаёт CSS по атрибуту data-route на <html> (ставится ещё до отрисовки).
 */
const RouteCtx = createContext<PageId>("home");
export const useRoute = () => useContext(RouteCtx);

/** null — это не адрес страницы, а якорь внутри неё (#zapis и т. п.) */
function parseHash(): PageId | null {
  const h = location.hash;
  if (!h || h === "#" || h === "#/") return "home";
  const m = h.match(/^#\/([a-z]+)/);
  if (!m) return null;
  return isPage(m[1]) ? m[1] : "home";
}

export function RouteProvider({ initial, children }: { initial: PageId; children: ReactNode }) {
  const [route, setRoute] = useState<PageId>(initial);

  useEffect(() => {
    if (!SPA) return;
    let current: PageId = "home";
    const apply = (first = false) => {
      const r = parseHash();
      if (!r || (r === current && !first)) return;
      current = r;
      setRoute(r);
      document.documentElement.setAttribute("data-route", r);
      document.title = PAGES[r].title;
      if (!first) {
        scrollTop();
        // фокус на заголовок новой страницы — для чтения с экрана и клавиатуры
        const h1 = document.querySelector<HTMLElement>(`.page--${r} h1`);
        h1?.focus({ preventScroll: true });
      }
      // пересчёт сцен для новой страницы; ScrollTrigger при этом возвращает прежнюю прокрутку — поэтому наверх ещё раз
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        if (!first) scrollTop();
      });
    };
    apply(true);
    const on = () => apply();
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  return <RouteCtx.Provider value={route}>{children}</RouteCtx.Provider>;
}
