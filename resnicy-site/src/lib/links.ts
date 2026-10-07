import { useEffect } from "react";
import { canHover } from "./env";

/**
 * Внешние ссылки (data-ext): на компьютере открываются в новой вкладке, на телефоне — в этой же.
 * Во встроенных браузерах Telegram, Instagram, VK ссылка «в новую вкладку» часто просто не срабатывает,
 * а в предпросмотре файла без скриптов в разметке нет target — ссылка ведёт себя как обычная.
 */
export function useExternalLinks() {
  useEffect(() => {
    if (!canHover()) return;
    const click = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[data-ext]");
      if (a) a.setAttribute("target", "_blank");
    };
    document.addEventListener("click", click, true);
    return () => document.removeEventListener("click", click, true);
  }, []);
}
