import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { finePointer, isBrowser, reducedMotion } from "./motion";

/**
 * Плавная прокрутка Lenis — только мышь/тачпад (на телефонах родная прокрутка).
 * ScrollTrigger считает прогресс закреплённых сцен.
 */

if (isBrowser) {
  gsap.registerPlugin(ScrollTrigger);
  // на телефонах не пересчитываем сцены, когда прячется адресная строка
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger };

let lenis: Lenis | null = null;
let lastY = 0;
let lastT = 0;
let velocity = 0;

export function initScroll() {
  if (!isBrowser) return () => {};
  const onScroll = () => {
    const now = performance.now();
    const y = window.scrollY;
    const dt = Math.max(1, now - lastT);
    velocity = ((y - lastY) / dt) * 16.67; // px за кадр 60 Гц
    lastY = y;
    lastT = now;
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  let tick: ((t: number) => void) | null = null;
  if (!reducedMotion() && finePointer()) {
    lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.95,
      anchors: { offset: -64 },
      prevent: (node) => !!(node as HTMLElement).closest?.("[data-lenis-prevent]"),
    });
    lenis.on("scroll", ScrollTrigger.update);
    tick = (t: number) => lenis?.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add("lenis");
  }

  return () => {
    window.removeEventListener("scroll", onScroll);
    if (tick) gsap.ticker.remove(tick);
    lenis?.destroy();
    lenis = null;
  };
}

/** Скорость прокрутки (px за кадр), затухает, если прокрутка остановилась */
export function scrollVelocity() {
  if (lenis) return lenis.velocity;
  if (performance.now() - lastT > 120) velocity *= 0.9;
  return velocity;
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: id === "top" ? 0 : -64, duration: 1.4 });
  else el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
}

export function stopScroll(stop: boolean) {
  if (!lenis) return;
  if (stop) lenis.stop();
  else lenis.start();
}
