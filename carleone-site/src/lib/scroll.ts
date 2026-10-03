import { useEffect, useRef, type RefObject } from "react";
import Lenis from "lenis";
import { clamp, finePointer, motionOK } from "./env";

/**
 * Прокрутка и scroll-эффекты: один rAF на всю страницу.
 * Lenis — только мышь и тачпад (на сенсорных экранах родная прокрутка), выключен при reduced motion.
 * Подписчик получает прогресс своего элемента; элементы далеко за экраном «спят» (IntersectionObserver).
 *
 * Диапазоны:
 *  cover  — 0: верх элемента у низа экрана, 1: низ элемента у верха экрана;
 *  sticky — 0: верх элемента у верха экрана, 1: низ элемента у низа экрана (закреплённые сцены);
 *  exit   — 0: элемент в начале, 1: ушёл вверх целиком;
 *  page   — прогресс всей страницы.
 */
export type Range = "cover" | "sticky" | "exit" | "page";
type Cb = (p: number) => void;
interface Sub {
  el: HTMLElement | null;
  range: Range;
  cb: Cb;
  active: boolean;
}

let lenis: Lenis | null = null;
const subs = new Set<Sub>();
let raf = 0;
let io: IntersectionObserver | null = null;
let listening = false;

// скорость прокрутки (px за кадр 60 Гц), плавно затухает — для бегущей ленты
let lastY = 0;
let lastT = 0;
let velocity = 0;

export function getVelocity() {
  // затухание с момента последнего события прокрутки
  const dt = performance.now() - lastT;
  return velocity * Math.exp(-dt / 220);
}

function measure(sub: Sub, vh: number) {
  if (sub.range === "page") {
    const max = document.documentElement.scrollHeight - vh;
    return clamp(window.scrollY / Math.max(1, max));
  }
  const r = sub.el!.getBoundingClientRect();
  if (sub.range === "sticky") return clamp(-r.top / Math.max(1, r.height - vh));
  if (sub.range === "exit") return clamp(-r.top / Math.max(1, r.height));
  return clamp((vh - r.top) / (vh + r.height));
}

function tick() {
  raf = 0;
  const vh = window.innerHeight;
  // сначала все чтения геометрии, потом все записи — без принудительных пересчётов раскладки
  const jobs: [Sub, number][] = [];
  subs.forEach((s) => {
    if (s.active) jobs.push([s, measure(s, vh)]);
  });
  jobs.forEach(([s, p]) => s.cb(p));
}

export function requestTick() {
  if (!raf) raf = requestAnimationFrame(tick);
}

function onScroll() {
  const now = performance.now();
  const y = window.scrollY;
  const dt = Math.max(1, now - lastT);
  const v = lenis ? lenis.velocity : ((y - lastY) / dt) * 16.7;
  velocity = velocity * 0.6 + v * 0.4;
  lastY = y;
  lastT = now;
  requestTick();
}

function ensureListening() {
  if (listening) return;
  listening = true;
  lastY = window.scrollY;
  lastT = performance.now();
  window.addEventListener("scroll", onScroll, { passive: true });
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
    { rootMargin: "60% 0px 60% 0px" },
  );
}

/** Подписка на прогресс элемента. Работает и при reduced motion — решает сам подписчик. */
export function subscribe(el: HTMLElement | null, range: Range, cb: Cb) {
  ensureListening();
  const sub: Sub = { el, range, cb, active: range === "page" };
  subs.add(sub);
  if (el && io) io.observe(el);
  requestTick();
  return () => {
    subs.delete(sub);
    if (el && io) io.unobserve(el);
  };
}

/** React-обёртка: колбэк пишет в DOM напрямую, без перерисовок. */
export function useScrollProgress<T extends HTMLElement>(
  ref: RefObject<T | null>,
  range: Range,
  cb: (p: number, el: T) => void,
  enabled = true,
) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    return subscribe(el, range, (p) => cbRef.current(p, el));
  }, [ref, range, enabled]);
}

/** Плавная прокрутка (Lenis) — только мышь/тачпад и без reduced motion. */
export function initSmoothScroll() {
  if (lenis || !motionOK() || !finePointer()) return () => {};
  lenis = new Lenis({
    autoRaf: true,
    lerp: 0.085,
    wheelMultiplier: 0.9,
    anchors: { offset: -64 },
    prevent: (node: HTMLElement) => !!node.closest?.("[data-lenis-prevent], [role='dialog']"),
  });
  document.documentElement.classList.add("lenis");
  lenis.on("scroll", onScroll);
  // Пока открыт диалог (Radix ставит data-scroll-locked на body) — инерцию останавливаем
  const mo = new MutationObserver(() => {
    if (document.body.hasAttribute("data-scroll-locked")) lenis?.stop();
    else lenis?.start();
  });
  mo.observe(document.body, {
    attributes: true,
    attributeFilter: ["data-scroll-locked"],
  });
  return () => {
    mo.disconnect();
    lenis?.destroy();
    lenis = null;
    document.documentElement.classList.remove("lenis");
  };
}

/** Программная прокрутка к элементу/позиции — через Lenis, если он активен. */
export function scrollToTarget(target: HTMLElement | number, offset = -64) {
  if (lenis) {
    lenis.scrollTo(target, {
      offset: typeof target === "number" ? 0 : offset,
      duration: 1.4,
    });
    return;
  }
  const y = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top: y, behavior: motionOK() ? "smooth" : "auto" });
}
