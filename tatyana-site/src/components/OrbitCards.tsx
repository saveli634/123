import { useEffect, useRef } from "react";
import { natalPoints } from "@/data/content";
import { finePointer, motionOk } from "@/lib/motion";
import { scrollVelocity } from "@/lib/scroll";
import { PLANETS, type PlanetId } from "./glyphs";
import { Eyebrow } from "./ui";

const ICONS: PlanetId[] = ["sun", "moon", "mars", "venus", "jupiter", "neptune", "saturn", "pluto"];
const TAU = Math.PI * 2;

/**
 * «Что покажет карта»: на широком экране карточки медленно вращаются по орбите вокруг центра
 * (наведение — пауза, 3D-наклон за курсором); на телефоне и планшете — вертикальный список с параллаксом.
 * Без JS и при «уменьшить движение» — обычная сетка.
 */
export function OrbitCards() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !motionOk()) return;
    const stage = el.querySelector<HTMLElement>(".orbit__stage")!;
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".ocard"));
    const wide = window.matchMedia("(min-width: 1024px) and (min-height: 620px)");
    const fine = finePointer();
    let raf = 0;
    let visible = false;
    let angle = -Math.PI / 2;
    let last = performance.now();
    let paused = false;
    let userPaused = false;
    let mode: "orbit" | "list" | "" = "";

    const setMode = () => {
      const m = wide.matches ? "orbit" : "list";
      if (m === mode) return;
      mode = m;
      el.classList.toggle("is-orbit", m === "orbit");
      el.classList.toggle("is-list", m === "list");
      cards.forEach((c) => {
        c.style.transform = "";
        c.style.zIndex = "";
        c.style.opacity = "";
      });
    };

    const orbit = (dt: number) => {
      const v = scrollVelocity();
      if (!paused && !userPaused) angle += dt * (TAU / 150) + v * 0.0009;
      const r = stage.getBoundingClientRect();
      const rx = Math.min(560, r.width * 0.4);
      const ry = Math.min(290, r.height * 0.36);
      cards.forEach((c, i) => {
        const th = angle + (i / cards.length) * TAU;
        const d = (Math.sin(th) + 1) / 2; // 0 — дальняя (сверху), 1 — ближняя (снизу)
        const x = Math.cos(th) * rx;
        const y = Math.sin(th) * ry;
        const s = 0.8 + 0.2 * d;
        c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
        c.style.zIndex = String(Math.round(d * 100));
        c.style.opacity = (0.64 + 0.36 * d).toFixed(3);
      });
    };

    const list = () => {
      const vh = window.innerHeight;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const k = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 вокруг центра экрана
        const depth = i % 2 ? 26 : 14;
        c.style.transform = `translate3d(0, ${(k * depth).toFixed(1)}px, 0)`;
      });
    };

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(48, t - last) / 1000;
      last = t;
      if (mode === "orbit") orbit(dt);
      else list();
    };
    const run = () => {
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const cleanupsTop: (() => void)[] = [];
    setMode();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      run();
    });
    io.observe(el);
    const onMq = () => setMode();
    wide.addEventListener?.("change", onMq);
    document.addEventListener("visibilitychange", run);

    // кнопка «остановить вращение» (для клавиатуры и тех, кому мешает движение)
    const toggle = el.querySelector<HTMLButtonElement>(".orbit__pause");
    const onToggle = () => {
      userPaused = !userPaused;
      toggle?.setAttribute("aria-pressed", String(userPaused));
      if (toggle) toggle.querySelector("span")!.textContent = userPaused ? "Продолжить вращение" : "Остановить вращение";
    };
    toggle?.addEventListener("click", onToggle);
    cleanupsTop.push(() => toggle?.removeEventListener("click", onToggle));

    // пауза при наведении/фокусе; 3D-наклон за курсором
    const enter = () => (paused = true);
    const leave = () => (paused = false);
    const cleanups: (() => void)[] = [];
    cards.forEach((c) => {
      const inner = c.querySelector<HTMLElement>(".ocard__inner")!;
      const move = (e: PointerEvent) => {
        if (!fine || e.pointerType !== "mouse") return;
        const r = inner.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        inner.style.transform = `rotateX(${(-y * 12).toFixed(2)}deg) rotateY(${(x * 14).toFixed(2)}deg)`;
        inner.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
        inner.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
      };
      const out = () => {
        inner.style.transform = "";
        leave();
      };
      c.addEventListener("pointerenter", enter);
      c.addEventListener("pointermove", move);
      c.addEventListener("pointerleave", out);
      c.addEventListener("focusin", enter);
      c.addEventListener("focusout", leave);
      cleanups.push(() => {
        c.removeEventListener("pointerenter", enter);
        c.removeEventListener("pointermove", move);
        c.removeEventListener("pointerleave", out);
        c.removeEventListener("focusin", enter);
        c.removeEventListener("focusout", leave);
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      wide.removeEventListener?.("change", onMq);
      document.removeEventListener("visibilitychange", run);
      cleanups.forEach((f) => f());
      cleanupsTop.forEach((f) => f());
      el.classList.remove("is-orbit", "is-list");
    };
  }, []);

  return (
    <section id="karta" ref={root} className="orbit section" aria-labelledby="orbit-title">
      <div className="wrap">
        <div className="orbit__stage">
          <div className="orbit__ring" aria-hidden="true">
            <i />
            <i />
          </div>
          <div className="orbit__center">
            <div className="rv">
              <Eyebrow>Натальная карта</Eyebrow>
              <h2 id="orbit-title" className="h2">
                Что покажет <em>карта</em>
              </h2>
              <p className="orbit__lead">В ней можно увидеть:</p>
            </div>
          </div>
          <ul className="orbit__cards">
            {natalPoints.map((t, i) => (
              <li key={i} className="ocard">
                <div className="ocard__inner">
                  <div className="ocard__top">
                    <svg viewBox="0 0 24 24" className="ocard__icon" aria-hidden="true">
                      <path d={PLANETS[ICONS[i]]} />
                    </svg>
                    <span className="ocard__n">{String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <p className="ocard__text">{t}</p>
                </div>
              </li>
            ))}
          </ul>
          <button type="button" className="orbit__pause" aria-pressed="false">
            <i aria-hidden="true" />
            <span>Остановить вращение</span>
          </button>
        </div>
      </div>
    </section>
  );
}
