import { useEffect, useRef, type RefObject } from "react";
import type Lenis from "lenis";
import { finePointer, motionAllowed } from "./env";

/**
 * Один rAF-цикл на всю страницу. Подписчики получают прогресс прокрутки своего элемента
 * и пишут его в CSS-переменные / transform. Элементы далеко за экраном пропускаются
 * (IntersectionObserver). Скорость прокрутки — для бегущей ленты.
 *
 *  cover  — 0: верх элемента у низа экрана, 1: низ элемента у верха экрана;
 *  sticky — 0: верх элемента у верха экрана, 1: низ элемента у низа экрана (закреплённые сцены);
 *  exit   — 0: верх элемента у верха экрана, 1: элемент целиком ушёл вверх.
 */
export type Range = "cover" | "sticky" | "exit";

interface Sub {
  el: HTMLElement;
  range: Range;
  update: (p: number) => void;
  active: boolean;
}

const subs = new Set<Sub>();
const tickers = new Set<(dt: number) => void>();
let frame = 0;
let io: IntersectionObserver | null = null;
let listening = false;
let lenis: Lenis | null = null;

let lastY = 0;
let lastT = 0;
/** Сглаженная скорость прокрутки, px/кадр при 60 fps (знак — направление). */
export const scrollState = { y: 0, velocity: 0, direction: 1 as 1 | -1 };

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function progress(sub: Sub, vh: number) {
  const r = sub.el.getBoundingClientRect();
  if (sub.range === "sticky") return clamp(-r.top / Math.max(1, r.height - vh));
  if (sub.range === "exit") return clamp(-r.top / Math.max(1, r.height));
  return clamp((vh - r.top) / (vh + r.height));
}

function tick(t: number) {
  frame = 0;
  const y = window.scrollY || window.pageYOffset || 0;
  const dt = lastT ? Math.min(64, t - lastT) : 16.7;
  const v = lenis ? lenis.velocity : ((y - lastY) / Math.max(1, dt)) * 16.7;
  scrollState.velocity += (v - scrollState.velocity) * 0.2;
  if (Math.abs(y - lastY) > 0.5) scrollState.direction = y > lastY ? 1 : -1;
  scrollState.y = y;
  lastY = y;
  lastT = t;
  const vh = window.innerHeight;
  subs.forEach((s) => {
    if (s.active) s.update(progress(s, vh));
  });
  tickers.forEach((fn) => fn(dt));
  // Пока есть «тикеры» (лента, курсор) или скорость не погасла — крутим цикл дальше.
  if (tickers.size || Math.abs(scrollState.velocity) > 0.05) frame = requestAnimationFrame(tick);
}

export function requestTick() {
  if (!frame && typeof requestAnimationFrame !== "undefined") frame = requestAnimationFrame(tick);
}

function ensureListening() {
  if (listening) return;
  listening = true;
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);
  io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        subs.forEach((s) => {
          if (s.el === e.target) s.active = e.isIntersecting;
        });
      });
      requestTick();
    },
    { rootMargin: "40% 0px 40% 0px" },
  );
}

/** Подписка элемента на прогресс прокрутки (только когда движение разрешено). */
export function useScrollFx<T extends HTMLElement>(ref: RefObject<T | null>, update: (p: number, el: T) => void, range: Range = "cover") {
  const cb = useRef(update);
  cb.current = update;
  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed()) return;
    ensureListening();
    const sub: Sub = { el, range, update: (p) => cb.current(p, el), active: true };
    subs.add(sub);
    io!.observe(el);
    requestTick();
    return () => {
      subs.delete(sub);
      io?.unobserve(el);
    };
  }, [ref, range]);
}

/** Постоянный покадровый колбэк (лента, курсор). Возвращает функцию отписки. */
export function addTicker(fn: (dt: number) => void) {
  ensureListening();
  tickers.add(fn);
  requestTick();
  return () => {
    tickers.delete(fn);
  };
}

/** Плавная инерционная прокрутка — только мышь/тачпад и без «уменьшить движение». */
export function useSmoothScroll() {
  useEffect(() => {
    if (!motionAllowed() || !finePointer()) return;
    let alive = true;
    let instance: Lenis | null = null;
    let mo: MutationObserver | null = null;
    import("lenis").then(({ default: LenisCtor }) => {
      if (!alive) return;
      instance = new LenisCtor({
        autoRaf: true,
        anchors: true,
        lerp: 0.085,
        wheelMultiplier: 0.95,
        prevent: (node: HTMLElement) => !!node.closest?.("[data-lenis-prevent], [role='dialog']"),
      });
      lenis = instance;
      (window as unknown as { __lenis?: Lenis }).__lenis = instance;
      document.documentElement.classList.add("lenis");
      instance.on("scroll", requestTick);
      // Пока открыт диалог (Radix ставит data-scroll-locked на body) — инерция стоит.
      mo = new MutationObserver(() => {
        if (document.body.hasAttribute("data-scroll-locked")) instance?.stop();
        else instance?.start();
      });
      mo.observe(document.body, { attributes: true, attributeFilter: ["data-scroll-locked"] });
    });
    return () => {
      alive = false;
      mo?.disconnect();
      instance?.destroy();
      lenis = null;
      document.documentElement.classList.remove("lenis");
    };
  }, []);
}

/** Программная прокрутка с учётом Lenis (иначе её анимация перебьёт scrollTo). */
export function scrollToY(y: number) {
  const reduce = !motionAllowed();
  if (lenis) lenis.scrollTo(y, { duration: 1.2 });
  else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  scrollToY(el.getBoundingClientRect().top + window.scrollY - pad);
}
