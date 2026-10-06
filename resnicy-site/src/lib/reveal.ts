import { useEffect } from "react";

/**
 * Проявление при прокрутке: элементам с data-reveal добавляется .is-in, когда они на экране.
 * Прячутся они только при классе .js на <html> (см. index.html) — без скриптов всё видно сразу.
 * «Шторка» (data-reveal="curtain") скрыта через clip-path, а такой элемент наблюдатель «не видит» —
 * поэтому для неё следим за родителем.
 */
export function useReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const targets = new Map<Element, HTMLElement[]>();
    els.forEach((el) => {
      const t = el.dataset.reveal === "curtain" && el.parentElement ? el.parentElement : el;
      targets.set(t, [...(targets.get(t) ?? []), el]);
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          targets.get(e.target)?.forEach((el) => el.classList.add("is-in"));
          io.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    targets.forEach((_, t) => io.observe(t));
    return () => io.disconnect();
  }, []);
}
