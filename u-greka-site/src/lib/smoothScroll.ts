import { useEffect } from "react";
import Lenis from "lenis";
import { motionAllowed, requestTick } from "./scrollFx";

/**
 * Плавная инерционная прокрутка (Lenis) — только мышь/тачпад на компьютере.
 * На сенсорных экранах остаётся родная прокрутка. При reduced motion — выключена.
 * Внутри диалогов (меню, карточка модели) прокрутка нативная: data-lenis-prevent.
 */
let instance: Lenis | null = null;

/**
 * Программная прокрутка. При активной Lenis идём через её API —
 * иначе её собственная анимация перебьёт window.scrollTo и вернёт страницу назад.
 */
export function scrollToY(y: number, immediate = false) {
  if (instance) instance.scrollTo(y, { immediate, duration: 1.1 });
  else window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}

export function scrollToEl(el: HTMLElement) {
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  scrollToY(el.getBoundingClientRect().top + window.scrollY - pad);
}

export function useSmoothScroll() {
  useEffect(() => {
    if (!motionAllowed() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      anchors: true, // отступ под шапку Lenis берёт из scroll-padding-top
      lerp: 0.09,
      wheelMultiplier: 0.95,
      prevent: (node) => !!node.closest?.("[data-lenis-prevent], [role='dialog']"),
    });
    document.documentElement.classList.add("lenis");
    lenis.on("scroll", requestTick);
    instance = lenis;
    if (import.meta.env.DEV) (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    // Пока открыт диалог (Radix ставит data-scroll-locked на body) — останавливаем инерцию.
    const mo = new MutationObserver(() => {
      if (document.body.hasAttribute("data-scroll-locked")) lenis.stop();
      else lenis.start();
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });

    return () => {
      mo.disconnect();
      instance = null;
      lenis.destroy();
      document.documentElement.classList.remove("lenis");
    };
  }, []);
}
