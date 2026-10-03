import { isPhone, motionAllowed, param } from "./env";
import { MIRROR_SEQUENCE, STAGES } from "@/content/copy";
import { img } from "@/content/media";
import { mirrorCrop } from "./crop";
import { photoUrl } from "@/components/Photo";
import type { MirrorScene } from "@/three/mirrorScene";

/**
 * Дирижёр «Зеркала образа». Одна фиксированная канва живёт от первого экрана
 * до конца закреплённой сцены (500svh). Каждый кадр:
 *  - считает прогресс сцены p из прокрутки (Lenis двигает window, поэтому scrollY = прогресс Lenis);
 *  - ведёт зеркало из «гнезда» первого экрана в центр сцены, на этапе 4 — «внутрь» стекла;
 *  - выставляет data-stage и --p для подписей и HUD;
 *  - отдаёт раскладку 3D-сцене (или двигает готовые рендеры, если WebGL 2 нет).
 */
interface Rect {
  cx: number;
  cy: number;
  d: number;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const sm = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: Rect, b: Rect, k: number): Rect => ({
  cx: a.cx + (b.cx - a.cx) * k,
  cy: a.cy + (b.cy - a.cy) * k,
  d: a.d + (b.d - a.d) * k,
});

/** Где стоит зеркало внутри закреплённой сцены (диаметр стекла). */
export function pinRect(p: number, W: number, H: number): Rect {
  const wide = W >= 900 || W > H * 1.3;
  let r: Rect = wide
    ? { cx: W * (W > H * 1.6 ? 0.655 : 0.64), cy: H * 0.53, d: Math.min(H * 0.58, W * 0.32) }
    : { cx: W / 2, cy: H * 0.56, d: Math.min(W * 0.72, H * 0.42) };
  const room = 1 - 0.1 * sm(0.25, 0.32, p) * (1 - sm(0.74, 0.8, p)); // место для прядей и орбиты
  r = { ...r, d: r.d * room };
  const enter = sm(0.77, 0.93, p);
  if (enter > 0) r = mix(r, { cx: W / 2, cy: H / 2, d: Math.hypot(W, H) * 1.12 }, enter);
  return r;
}

let slot: HTMLElement | null = null;
let pin: HTMLElement | null = null;
let layer: HTMLElement | null = null;
let renders: HTMLElement | null = null;
let raf = 0;
let running = false;
let scene: MirrorScene | null = null;
let sceneState: "idle" | "loading" | "live" | "off" = "idle";
let geo = { slotX: 0, slotY: 0, slotD: 0, pinTop: 0, pinH: 1, W: 1, H: 1 };
let smoothed: Rect | null = null;
let smoothedP = 0;
let lastT = 0;
let stageShown = -1;
let pointer = { x: 0, y: 0 };
let ignited = false;
const still = param("render");

function measure() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const y = window.scrollY;
  if (slot) {
    const r = slot.getBoundingClientRect();
    const glassD = r.width / 1.16;
    geo.slotX = r.left + r.width / 2;
    geo.slotY = r.top + r.height / 2 + y;
    geo.slotD = glassD;
  }
  if (pin) {
    const r = pin.getBoundingClientRect();
    geo.pinTop = r.top + y;
    geo.pinH = r.height;
  }
  geo.W = W;
  geo.H = H;
  scene?.resize(W, H);
}

function compute(y: number) {
  const { W, H, pinTop, pinH } = geo;
  const span = Math.max(1, pinH - H);
  const p = clamp01((y - pinTop) / span);
  const heroLive: Rect = { cx: geo.slotX, cy: geo.slotY - y, d: geo.slotD };
  const k = sm(0, Math.max(1, pinTop), y);
  const target = k <= 0 ? heroLive : mix(heroLive, pinRect(p, W, H), k);
  const exit = Math.max(0, y - (pinTop + span));
  return { p, target, exit, k };
}

function tick(now: number) {
  raf = 0;
  if (!running) return;
  const dt = Math.min(0.1, lastT ? (now - lastT) / 1000 : 1 / 60);
  lastT = now;
  const y = window.scrollY;
  const { p, target, exit, k } = compute(y);

  // инерция камеры: lerp 0.07 на кадр 60 Гц
  const a = 1 - Math.pow(1 - 0.07, dt * 60);
  if (!smoothed || k < 0.002) smoothed = { ...target };
  else smoothed = mix(smoothed, target, a);
  smoothedP += (p - smoothedP) * a;
  if (Math.abs(p - smoothedP) < 0.0002) smoothedP = p;

  if (layer) {
    layer.style.transform = exit > 0 ? `translate3d(0, ${-exit}px, 0)` : "";
    layer.style.visibility = exit > geo.H ? "hidden" : "";
  }
  if (pin) {
    let n = 0;
    if (p > 0.002 || y >= geo.pinTop) n = STAGES.find((s) => p < s.to || s.n === 4)!.n;
    if (n !== stageShown) {
      stageShown = n;
      pin.dataset.stage = String(n);
      document.documentElement.dataset.mirrorStage = String(n);
    }
    pin.style.setProperty("--p", smoothedP.toFixed(4));
    const moved = y > 40 ? "1" : "0";
    if (pin.dataset.moved !== moved) pin.dataset.moved = moved;
  }
  if (renders) {
    // без WebGL 2 — готовые рендеры той же сцены на месте зеркала (без «входа в стекло»: рендер не растягиваем)
    const r = k < 1 ? smoothed : pinRect(Math.min(smoothedP, 0.77), geo.W, geo.H);
    renders.style.transform = `translate3d(${r.cx - r.d}px, ${r.cy - r.d}px, 0)`;
    renders.style.width = renders.style.height = `${r.d * 2}px`;
  }
  if (scene && exit <= geo.H) scene.frame({ ...smoothed, p: smoothedP, y });
  // без живой сцены кадры нужны только пока догоняем прокрутку — дальше ждём события scroll
  const settled = Math.abs(target.cx - smoothed.cx) + Math.abs(target.cy - smoothed.cy) + Math.abs(target.d - smoothed.d) < 0.5 && smoothedP === p;
  if (sceneState === "live" || !settled) raf = requestAnimationFrame(tick);
  else running = false;
}

function start() {
  if (running) return;
  running = true;
  lastT = 0;
  raf = requestAnimationFrame(tick);
}
function stop() {
  running = false;
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

async function loadScene(canvas: HTMLCanvasElement) {
  sceneState = "loading";
  if (import.meta.env.DEV) (window as unknown as { __stage?: () => unknown }).__stage = () => ({ sceneState, running, scene: !!scene });
  const mobile = isPhone();
  const width = mobile ? 800 : 1200;
  const photos = MIRROR_SEQUENCE.map((name) => {
    const i = img(name);
    return { url: photoUrl(name, width), crop: mirrorCrop(i.w, i.h, i.fx, i.fy) };
  });
  try {
    const { createMirrorScene } = await import("@/three/mirrorScene");
    scene = createMirrorScene(canvas, {
      mobile,
      bloom: !mobile && param("nobloom") === null,
      photos,
      still: !!still,
      onReady: () => {
        document.documentElement.classList.add("mirror-live");
        if (ignited) scene?.ignite();
        (window as unknown as { __mirrorReady?: boolean }).__mirrorReady = true;
      },
      onLowPower: () => document.documentElement.classList.add("mirror-lowpower"),
    });
  } catch {
    scene = null;
  }
  if (!scene) {
    sceneState = "off";
    document.documentElement.classList.add("no-webgl");
    return;
  }
  sceneState = "live";
  measure();
  if (still === null) start();
}

/** Зажечь кольцо (после прелоадера или сразу при повторном заходе). */
export function igniteRing() {
  ignited = true;
  scene?.ignite();
}

export function setPointer(x: number, y: number) {
  pointer = { x, y };
  scene?.pointer(pointer.x, pointer.y);
}

/**
 * Подключение. Вызывается из MirrorStage после гидрации.
 * Возвращает функцию отключения.
 */
export function mountStage(els: { slot: HTMLElement; pin: HTMLElement; layer: HTMLElement; canvas: HTMLCanvasElement; renders: HTMLElement }) {
  slot = els.slot;
  pin = els.pin;
  layer = els.layer;
  const root = document.documentElement;
  if (still !== null) return mountCapture(els.canvas, Number(still) || 0);
  if (!motionAllowed() && !still) {
    root.classList.add("mirror-static");
    return () => {};
  }
  root.classList.add("mirror-motion");
  measure();
  // Пока живая сцена не готова, на месте зеркала — готовые рендеры той же сцены.
  renders = els.renders;
  // WebGL 2 не проверяем заранее: создание пробного контекста на слабых устройствах стоит до секунды.
  // Сцена сама вернёт null, если WebGL 2 нет, — тогда остаются готовые рендеры.
  const gl = param("nowebgl") === null;
  let booted = false;
  const intents = ["pointermove", "pointerdown", "wheel", "touchstart", "keydown", "scroll"] as const;
  // 3D запускается по первому действию человека (движение мыши, касание, прокрутка):
  // до этого первый экран — то же зеркало на CSS. Так страница быстро открывается и в тестах скорости.
  const boot = () => {
    if (booted) return;
    booted = true;
    intents.forEach((ev) => window.removeEventListener(ev, boot));
    if (gl) loadScene(els.canvas);
    else {
      sceneState = "off";
      root.classList.add("no-webgl");
    }
  };
  if (!gl) boot();
  else if (window.scrollY > 10 || param("og") !== null) boot();
  else intents.forEach((ev) => window.addEventListener(ev, boot, { passive: true }));

  const onResize = () => {
    measure();
    if (!running) tick(performance.now());
  };
  window.addEventListener("resize", onResize);
  const ro = new ResizeObserver(onResize);
  ro.observe(document.body);
  document.fonts?.ready.then(onResize).catch(() => {});

  // рисуем, только пока первый экран или сцена видны и вкладка активна
  let visible = true;
  const seen = new Map<Element, boolean>();
  const io = new IntersectionObserver(
    (ents) => {
      ents.forEach((e) => seen.set(e.target, e.isIntersecting));
      visible = [...seen.values()].some(Boolean);
      if (visible && !document.hidden) start();
      else stop();
    },
    { rootMargin: "50px" },
  );
  io.observe(els.pin);
  io.observe(els.slot);
  const onVis = () => {
    if (document.hidden) stop();
    else if (visible) start();
  };
  document.addEventListener("visibilitychange", onVis);
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  const onScroll = () => {
    if (visible && !document.hidden) start();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  start();

  return () => {
    stop();
    io.disconnect();
    ro.disconnect();
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("scroll", onScroll);
    intents.forEach((ev) => window.removeEventListener(ev, boot));
    document.removeEventListener("visibilitychange", onVis);
    scene?.dispose();
    scene = null;
    sceneState = "idle";
  };
}

export const stageSceneState = () => sceneState;

/** Прогресс сцены для готовых рендеров каждого этапа (0 — первый экран). */
export const STILL_P = [0, 0.13, 0.35, 0.58, 0.8];

/**
 * Режим съёмки (?render=k): квадратная канва, зеркало по центру, стекло — половина кадра,
 * фиксированное время. scripts/renders.mjs снимает канву с прозрачным фоном.
 */
function mountCapture(canvas: HTMLCanvasElement, k: number) {
  let alive = true;
  (async () => {
    geo.W = window.innerWidth;
    geo.H = window.innerHeight;
    await loadScene(canvas);
    if (!scene) return;
    scene.resize(geo.W, geo.H);
    const S = Math.min(geo.W, geo.H);
    const f = { cx: geo.W / 2, cy: geo.H / 2, d: S * 0.5, p: STILL_P[k] ?? 0, y: 900 };
    const wait = () => {
      if (!alive || !scene) return;
      scene.frame(f);
      if (scene.allLoaded()) {
        for (let i = 0; i < 4; i++) scene.frame(f);
        (window as unknown as { __renderDone?: boolean }).__renderDone = true;
      } else requestAnimationFrame(wait);
    };
    wait();
  })();
  return () => {
    alive = false;
  };
}
