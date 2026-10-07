import pagesJson from "./pages.json";

/**
 * Страницы сайта. На хостинге это отдельные файлы (karta.html…), в однофайловой версии sait.html —
 * разделы одного файла, которые переключаются по адресу #/karta (см. src/lib/route.tsx).
 */
export type PageId = keyof typeof pagesJson;
export const PAGES = pagesJson as Record<PageId, { nav: string; title: string; description: string }>;
export const PAGE_ORDER: PageId[] = ["home", "karta", "chislo", "stihi", "pesni", "podarki"];
export const isPage = (s: string): s is PageId => s in PAGES;

/** Однофайловая сборка: все страницы в одном HTML */
export const SPA = import.meta.env.MODE === "single";

export const pageHref = (id: PageId) => (SPA ? (id === "home" ? "#/" : `#/${id}`) : id === "home" ? "index.html" : `${id}.html`);

/** Следующая страница — для перехода «дальше» внизу каждой страницы */
export const nextPage = (id: PageId): PageId => {
  const i = PAGE_ORDER.indexOf(id);
  return PAGE_ORDER[i + 1 >= PAGE_ORDER.length ? 1 : i + 1];
};
