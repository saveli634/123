import { useEffect } from "react";

const SELECTOR = ".reveal, .img-reveal, .line-mask";

/**
 * Один наблюдатель на всю страницу: каждому элементу с классом анимации
 * добавляет `is-in`, когда он входит в зону видимости. Срабатывает один раз.
 * Новые элементы (например, после фильтра портфолио) подхватываются автоматически.
 */
export function useRevealObserver() {
  useEffect(() => {
    const reveal = (el: Element) => el.classList.add("is-in");

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(SELECTOR).forEach(reveal);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );

    const observe = (root: ParentNode) => {
      root.querySelectorAll(SELECTOR).forEach((el) => {
        if (!el.classList.contains("is-in")) io.observe(el);
      });
    };
    observe(document);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR) && !node.classList.contains("is-in")) io.observe(node);
          observe(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
