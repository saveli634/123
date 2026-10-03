import Lenis from "lenis";
import { finePointer, motionAllowed } from "./env";

/**
 * Плавная прокрутка Lenis — только мышь и тачпад (на сенсорных экранах родная прокрутка),
 * при «уменьшить движение» — выключена. Lenis двигает сам window, поэтому все эффекты
 * читают window.scrollY и получают прогресс Lenis.
 * Подписчики onTick получают (y, скорость px/кадр) не чаще раза за кадр.
 */
let lenis: Lenis | null = null;
type Fn = (y: number, v: number) => void;
const subs = new Set<Fn>();
let lastY = 0;
let queued = false;

function flush() {
  queued = false;
  const y = window.scrollY;
  const v = y - lastY;
  lastY = y;
  subs.forEach((f) => f(y, v));
}
export function requestTick() {
  if (!queued) {
    queued = true;
    requestAnimationFrame(flush);
  }
}
export function onTick(f: Fn) {
  subs.add(f);
  requestTick();
  return () => {
    subs.delete(f);
  };
}

export function scrollToHash(hash: string) {
  const el = document.getElementById(hash.replace(/^#/, ""));
  if (!el) return false;
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  const y = el.getBoundingClientRect().top + window.scrollY - pad;
  if (lenis) lenis.scrollTo(y, { duration: 1.4 });
  else window.scrollTo({ top: y, behavior: motionAllowed() ? "smooth" : "auto" });
  return true;
}

export function initScroll() {
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  // якорные ссылки — через тот же механизм (с отступом под шапку)
  const onClick = (e: MouseEvent) => {
    const a = (e.target as HTMLElement).closest?.("a[href^='#']") as HTMLAnchorElement | null;
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const hash = a.getAttribute("href")!;
    if (hash.length < 2) return;
    if (scrollToHash(hash)) {
      e.preventDefault();
      history.replaceState(null, "", hash);
      const target = document.getElementById(hash.slice(1));
      const focusable = target?.querySelector<HTMLElement>("[data-autofocus]");
      if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), lenis ? 1200 : 500);
    }
  };
  document.addEventListener("click", onClick);
  if (motionAllowed() && finePointer()) {
    lenis = new Lenis({ autoRaf: true, lerp: 0.09, wheelMultiplier: 0.95, prevent: (n) => !!n.closest?.("[data-lenis-prevent], [role='dialog']") });
    lenis.on("scroll", requestTick);
    document.documentElement.classList.add("lenis");
  }
  return () => {
    window.removeEventListener("scroll", requestTick);
    document.removeEventListener("click", onClick);
    lenis?.destroy();
    lenis = null;
  };
}

export function lockScroll(lock: boolean) {
  if (lock) lenis?.stop();
  else lenis?.start();
  document.documentElement.classList.toggle("scroll-locked", lock);
}
