import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { canHover, motionAllowed } from "./env";

/**
 * GSAP + ScrollTrigger для эффектов прокрутки; Lenis (плавная инерция) — только мышь/тачпад.
 * На телефонах прокрутка родная: она и так инерционная, а закреплённые сцены сделаны на
 * position: sticky — без скачков, когда прячется адресная строка.
 */
let started = false;
let lenis: Lenis | null = null;

export { gsap, ScrollTrigger };

export function startMotion() {
  if (started || !motionAllowed()) return false;
  started = true;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  document.documentElement.classList.add("motion");

  if (canHover() && "ResizeObserver" in window) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis?.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add("lenis");
  }
  // Шрифты и фото меняют высоты — пересчитать точки закрепления
  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh);
  window.addEventListener("load", refresh);
  return true;
}

export const motionStarted = () => started;

/** Прокрутка к элементу (через Lenis, если он включён, иначе родная плавная). */
export function scrollToHash(hash: string) {
  const el = hash === "#top" ? document.body : document.querySelector<HTMLElement>(hash);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: hash === "#top" ? 0 : -8 });
  else el.scrollIntoView({ behavior: motionAllowed() ? "smooth" : "auto", block: "start" });
}

export function stopScroll(stop: boolean) {
  if (!lenis) return;
  if (stop) lenis.stop();
  else lenis.start();
}
