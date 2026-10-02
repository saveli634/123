import { useEffect } from "react";

/**
 * Проявление при прокрутке: элементам .rv добавляется .is-in, когда они входят в экран.
 * Скрытое состояние в CSS действует только при .js на <html> (без скриптов всё видно сразу).
 * Пока идёт прелоадер, первый экран ждёт его окончания.
 */
export function useReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const pending = () => Array.from(document.querySelectorAll<HTMLElement>(".rv:not(.is-in)"));
    if (!("IntersectionObserver" in window)) {
      pending().forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 },
    );
    const start = () => pending().forEach((el) => io.observe(el));
    if (root.classList.contains("is-preloading")) window.addEventListener("preload:done", start, { once: true });
    else start();
    return () => io.disconnect();
  }, []);
}
