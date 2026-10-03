import { useEffect, useRef, type RefObject } from "react";

/**
 * Лёгкий движок scroll-эффектов.
 * Один rAF-цикл на всю страницу: для каждого подписанного элемента считаем прогресс
 * прокрутки и отдаём его в колбэк. Колбэки пишут CSS-переменные, а трансформации
 * считает CSS — так меньше работы в JS и всё на GPU (transform / opacity).
 * Неактивные (далеко за экраном) элементы пропускаются через IntersectionObserver.
 */

/**
 * cover  — 0: верх элемента у низа экрана, 1: низ элемента у верха экрана;
 * sticky — 0: верх элемента у верха экрана, 1: низ элемента у низа экрана (для закреплённых сцен);
 * exit   — 0: элемент в начале страницы, 1: элемент полностью ушёл вверх.
 */
export type Range = "cover" | "sticky" | "exit";

type Update = (p: number) => void;
interface Sub {
  el: HTMLElement;
  range: Range;
  update: Update;
  active: boolean;
}

const subs = new Set<Sub>();
let frame = 0;
let io: IntersectionObserver | null = null;
let listening = false;

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function progress(sub: Sub, vh: number) {
  const r = sub.el.getBoundingClientRect();
  if (sub.range === "sticky") return clamp(-r.top / Math.max(1, r.height - vh));
  if (sub.range === "exit") return clamp(-r.top / Math.max(1, r.height));
  return clamp((vh - r.top) / (vh + r.height));
}

function tick() {
  frame = 0;
  const vh = window.innerHeight;
  subs.forEach((s) => {
    if (s.active) s.update(progress(s, vh));
  });
}

export function requestTick() {
  if (!frame) frame = requestAnimationFrame(tick);
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
    { rootMargin: "50% 0px 50% 0px" },
  );
}

export function motionAllowed() {
  return (
    typeof window !== "undefined" &&
    "IntersectionObserver" in window &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Подписывает элемент на прогресс прокрутки. Колбэк вызывается только в браузере с разрешённым движением. */
export function useScrollFx<T extends HTMLElement>(
  ref: RefObject<T | null>,
  update: (p: number, el: T) => void,
  range: Range = "cover",
) {
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

/** Удобный вариант: прогресс сразу пишется в CSS-переменную (по умолчанию --p). */
export function useScrollVar<T extends HTMLElement>(ref: RefObject<T | null>, range: Range = "cover", name = "--p") {
  useScrollFx(ref, (p, el) => el.style.setProperty(name, p.toFixed(4)), range);
}

/**
 * 3D-наклон за курсором (только мышь/тачпад). Пишет --rx / --ry в градусах.
 * Возврат в исходное положение — плавный, через CSS transition.
 */
export function useTilt<T extends HTMLElement>(ref: RefObject<T | null>, max = 6) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let f = 0;
    let x = 0;
    let y = 0;
    const apply = () => {
      f = 0;
      el.style.setProperty("--rx", `${(-y * max).toFixed(2)}deg`);
      el.style.setProperty("--ry", `${(x * max).toFixed(2)}deg`);
    };
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      x = (e.clientX - r.left) / r.width - 0.5;
      y = (e.clientY - r.top) / r.height - 0.5;
      el.dataset.tilting = "";
      if (!f) f = requestAnimationFrame(apply);
    };
    const leave = () => {
      delete el.dataset.tilting;
      x = 0;
      y = 0;
      if (!f) f = requestAnimationFrame(apply);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      if (f) cancelAnimationFrame(f);
    };
  }, [ref, max]);
}
