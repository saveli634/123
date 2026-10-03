import { useEffect } from "react";

const SELECTOR = ".reveal, .curtain, .line-mask";

/**
 * Один наблюдатель на всю страницу: элементу с классом анимации добавляется `is-in`,
 * когда он входит в зону видимости (один раз).
 * Шторка (.curtain) сама обрезана clip-path, и наблюдатель считал бы её невидимой —
 * поэтому за неё наблюдаем через родителя.
 */
export function useRevealObserver() {
  useEffect(() => {
    const reveal = (el: Element) => el.classList.add("is-in");
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(SELECTOR).forEach(reveal);
      return;
    }
    const targets = new Map<Element, Element[]>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (targets.get(entry.target) ?? []).forEach(reveal);
          targets.delete(entry.target);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );
    const add = (el: Element) => {
      if (el.classList.contains("is-in")) return;
      const watch = el.classList.contains("curtain") && el.parentElement ? el.parentElement : el;
      const list = targets.get(watch);
      if (list) list.push(el);
      else {
        targets.set(watch, [el]);
        io.observe(watch);
      }
    };
    document.querySelectorAll(SELECTOR).forEach(add);

    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches(SELECTOR)) add(node);
          node.querySelectorAll(SELECTOR).forEach(add);
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
