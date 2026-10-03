import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DICT, type Dict, type Lang } from "@/content/i18n";
import { CONFIG } from "@/config";

type Ctx = { lang: Lang; t: Dict; setLang: (l: Lang) => void };
const LangCtx = createContext<Ctx>({
  lang: "ru",
  t: DICT.ru,
  setLang: () => {},
});

export function pageTitle(lang: Lang) {
  const t = DICT[lang].meta;
  return CONFIG.city.trim() ? t.titleCity.replace("{city}", CONFIG.city.trim()) : t.title;
}

/**
 * Язык страницы. Сервер рендерит RU (index.html) и EN (en.html); в браузере стартуем с языка,
 * который уже стоит в <html lang>, — разметка совпадает с пререндером.
 * Переключение — без перезагрузки: меняем тексты, <html lang>, <title> и адрес (на хостинге).
 */
export function LangProvider({ initial, children }: { initial: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    const html = document.documentElement;
    html.lang = l;
    document.title = pageTitle(l);
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", DICT[l].meta.description);
    // Адрес меняем только на хостинге: на file:// replaceState на другой файл запрещён
    if (/^https?:$/.test(location.protocol)) {
      try {
        const page = l === "en" ? "en.html" : "./";
        history.replaceState(null, "", page + location.search.replace(/[?&]lang=\w+/, "") + location.hash);
      } catch {
        /* старые браузеры — просто не меняем адрес */
      }
    }
  }, []);

  // ?lang=en или #en — открыть английскую версию (удобно для однофайловой версии и ссылок)
  useEffect(() => {
    const want = /[?&]lang=en\b/.test(location.search) || location.hash === "#en" ? "en" : null;
    if (want && want !== lang) setLang(want);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ lang, t: DICT[lang], setLang }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
export const useT = () => useContext(LangCtx).t;
