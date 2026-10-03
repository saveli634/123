import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLang } from "@/lib/lang";
import { clamp, finePointer, hasWebGL2, motionOK } from "@/lib/env";
import { getVelocity, scrollToTarget, subscribe } from "@/lib/scroll";
import { cn } from "@/lib/cn";
import { shotsFor } from "@/globe/geo";
import { textStage } from "@/globe/timeline";
import type { Globe } from "@/globe/scene";
import { Lion } from "@/components/Lion";
import { q, Rich } from "@/components/Text";
import { Frame } from "@/components/Frame";
import { Stamp } from "@/components/Stamp";
import { CallButton, WhatsAppButton } from "@/components/Cta";
import { Star } from "@/components/Icons";

/** Радиус глобуса в квадратных рендерах этапов (доля стороны картинки) — см. scripts/render-globe.mjs. */
const RENDER_R = 0.42;

/**
 * Первый экран + бегущая лента + «Карта Carleone» (500svh) над одним закреплённым слоем с глобусом.
 * t: -1 — первый экран, 0…4 — этапы. Глобус (three.js) грузится лениво, по первому действию
 * пользователя; до этого и без WebGL 2 / при reduced motion — готовые рендеры того же глобуса.
 */
export function GlobeStory() {
  const { t, lang } = useLang();
  const wrap = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const map = useRef<HTMLElement>(null);
  const globe = useRef<Globe | null>(null);
  const tRef = useRef(-1);
  const stageRef = useRef(-1);
  const scale = useRef<(HTMLButtonElement | null)[]>([]);
  const renders = useRef<(HTMLDivElement | null)[]>([]);
  const [stage, setStage] = useState(-1);
  const [live, setLive] = useState(false);

  // --- прокрутка → t, активный этап, шкала HUD --------------------------------------------
  useEffect(
    () =>
      subscribe(null, "page", () => {
        const m = map.current;
        if (!m) return;
        const vh = window.innerHeight;
        const r = m.getBoundingClientRect();
        let tt: number;
        if (r.top > 0) {
          const start = r.top + window.scrollY;
          tt = -1 + 0.5 * clamp(window.scrollY / Math.max(1, start));
        } else {
          tt = -0.5 + 5 * clamp(-r.top / Math.max(1, r.height - vh));
        }
        tRef.current = tt;
        globe.current?.setT(tt);
        const s = textStage(tt);
        if (s !== stageRef.current) {
          stageRef.current = s;
          setStage(s);
        }
        scale.current.forEach((b, k) => b?.style.setProperty("--f", clamp(tt - (k - 0.45)).toFixed(3)));
        if (tt > -0.55 && r.bottom > vh * 0.3) m.setAttribute("data-on", "");
        else m.removeAttribute("data-on");
      }),
    [],
  );

  // --- живой глобус: лениво, по первому действию пользователя --------------------------------
  useEffect(() => {
    if (!motionOK() || !hasWebGL2()) return;
    let disposed = false;
    let started = false;
    let g: Globe | null = null;
    const cleanups: (() => void)[] = [];
    const events = ["pointermove", "pointerdown", "touchstart", "wheel", "keydown", "scroll"] as const;

    const load = async () => {
      if (started) return;
      started = true;
      events.forEach((e) => window.removeEventListener(e, load));
      const { createGlobe } = await import("@/globe/scene");
      const el = layer.current;
      if (disposed || !canvas.current || !el) return;
      try {
        g = createGlobe(canvas.current, {
          onLost: () => {
            el.removeAttribute("data-live");
            setLive(false);
          },
        });
      } catch {
        return; // WebGL не завёлся — остаются рендеры
      }
      globe.current = g;
      const size = () => g?.resize(el.clientWidth, el.clientHeight);
      size();
      g.setT(tRef.current);
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(size);
        ro.observe(el);
        cleanups.push(() => ro.disconnect());
      } else {
        window.addEventListener("resize", size);
        cleanups.push(() => window.removeEventListener("resize", size));
      }
      // рисуем только когда сцену видно и вкладка активна
      let inView = true;
      const sync = () => (inView && !document.hidden ? g?.start() : g?.stop());
      const io = new IntersectionObserver(([e]) => {
        inView = e.isIntersecting;
        sync();
      });
      io.observe(wrap.current!);
      document.addEventListener("visibilitychange", sync);
      cleanups.push(() => {
        io.disconnect();
        document.removeEventListener("visibilitychange", sync);
      });
      sync();
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          el.setAttribute("data-live", "");
          setLive(true);
        }),
      );
    };

    events.forEach((e) => window.addEventListener(e, load, { passive: true }));
    // файл с диска — Lighthouse тут не при чём, грузим сразу после первой отрисовки
    const idle = location.protocol === "file:" ? window.setTimeout(load, 1200) : 0;
    return () => {
      disposed = true;
      window.clearTimeout(idle);
      events.forEach((e) => window.removeEventListener(e, load));
      cleanups.forEach((c) => c());
      g?.dispose();
      globe.current = null;
    };
  }, []);

  // --- запасные рендеры: позиция как у живого глобуса --------------------------------------
  const renderIdx = stage + 1;
  useEffect(() => {
    const place = () => {
      const el = layer.current;
      if (!el) return;
      const W = el.clientWidth;
      const H = el.clientHeight;
      const shots = shotsFor(W, H);
      renders.current.forEach((r, i) => {
        if (!r || i === 0) return;
        const s = shots[i];
        const size = (s.r * Math.min(W, H)) / RENDER_R;
        r.style.width = r.style.height = `${size.toFixed(0)}px`;
        r.style.left = `${(W / 2 + s.cx * W).toFixed(0)}px`;
        r.style.top = `${(H / 2 + s.cy * H).toFixed(0)}px`;
      });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, []);

  // грузим только нужный рендер (и соседний — уже внутри карты), на первом экране — только горизонт
  const renderNeeded = (i: number) => !live && (i === renderIdx || (renderIdx >= 1 && Math.abs(i - renderIdx) <= 1));

  return (
    <div ref={wrap} className="relative" id="top">
      <div className="globe-track" aria-hidden="true">
        <div ref={layer} className="globe-layer">
          <div className="globe-fallback">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                ref={(el) => {
                  renders.current[i] = el;
                }}
                className={cn(i === 0 ? "globe-hero" : "globe-render", (i === 0 || renderNeeded(i)) && `r-${i}`)}
                data-on={i === renderIdx || (i === 0 && renderIdx <= 0) ? "" : undefined}
              />
            ))}
          </div>
          <canvas ref={canvas} />
          <div className="globe-shade" />
        </div>
      </div>

      <Hero />
      <Marquee items={t.marquee} />

      <section ref={map} id="map" className="map" aria-labelledby="map-title">
        <h2 id="map-title" className="sr-only">
          {t.map.label}
        </h2>
        <p className="sr-only">{t.a11y.globe}</p>
        <div className="map-pin">
          <Hud
            stage={stage}
            onJump={(k) => {
              const m = map.current;
              if (!m) return;
              const top = m.getBoundingClientRect().top + window.scrollY;
              scrollToTarget(top + ((k + 0.55) / 5) * (m.offsetHeight - window.innerHeight));
            }}
            refs={scale.current}
          />
          <Passport stage={stage} />
          {t.map.stages.map((s, i) => (
            <article key={s.code} className="stage" data-active={stage === i ? "" : undefined}>
              <div className={`stage-render r-${i + 1}`} />
              <p className="st-fade t-label mb-5 flex items-center gap-3 text-gold md:mb-7">
                <span className="t-num">0{i + 1}</span>
                <span className="h-px w-8 bg-gold/60" />
                <span>{s.kicker}</span>
              </p>
              {s.title && (
                <h3 className="stage-title t-display">
                  {s.title.map((l, k) => (
                    <span className="ln" key={k}>
                      <span style={{ "--i": k } as CSSProperties}>
                        <Rich text={l} />
                      </span>
                    </span>
                  ))}
                </h3>
              )}
              {s.text && (
                <p
                  className={cn("st-fade mt-5 max-w-xl md:mt-7", i === 0 ? "t-label text-gold" : "t-body text-lg")}
                  style={{ "--d": 200 } as CSSProperties}
                >
                  {s.text}
                </p>
              )}
              {s.quote && (
                <div className="flex items-start gap-5">
                  {s.inset && (
                    <Frame
                      name="bike_in_garage"
                      ratio={3 / 4}
                      sizes="160px"
                      className="st-fade stage-inset mt-1 hidden md:block"
                      position="40% 40%"
                      alt={s.inset}
                    />
                  )}
                  <div>
                    {s.lead && <p className="st-fade t-label mb-3 text-muted">{s.lead}</p>}
                    <blockquote className="st-fade t-quote stage-quote" style={{ "--d": 80 } as CSSProperties}>
                      {q(s.quote, lang)}
                    </blockquote>
                    {s.after && (
                      <p className="st-fade t-body mt-4 max-w-lg md:mt-6" style={{ "--d": 220 } as CSSProperties}>
                        {s.after}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {s.code === "ALL" && (
                <div className="st-fade mt-7 flex flex-wrap gap-3" style={{ "--d": 320 } as CSSProperties}>
                  <CallButton />
                  <WhatsAppButton />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ----------------------------------- Первый экран ----------------------------------- */
function Hero() {
  const { t } = useLang();
  const root = useRef<HTMLElement>(null);
  const lion = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const sub = useRef<HTMLDivElement>(null);

  // параллакс: лев уходит медленнее заголовка, строки слегка разъезжаются; лев тянется за мышью
  useEffect(() => {
    if (!motionOK()) return;
    let mx = 0;
    let my = 0;
    let p = 0;
    let raf = 0;
    const paint = () => {
      raf = 0;
      if (lion.current)
        lion.current.style.transform = `translate3d(${(mx * 14).toFixed(1)}px, ${(p * -120 + my * 10).toFixed(1)}px, 0) scale(${(1 - p * 0.18).toFixed(3)})`;
      if (title.current) {
        const [a, b] = Array.from(title.current.querySelectorAll<HTMLElement>(".hero-word"));
        if (a) a.style.transform = `translate3d(${(p * -6).toFixed(2)}vw, ${(p * -40).toFixed(1)}px, 0)`;
        if (b) b.style.transform = `translate3d(${(p * 6).toFixed(2)}vw, ${(p * -40).toFixed(1)}px, 0)`;
      }
      if (sub.current) {
        sub.current.style.opacity = String(1 - p * 1.6);
        sub.current.style.transform = `translate3d(0, ${(p * -30).toFixed(1)}px, 0)`;
      }
    };
    const req = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const un = subscribe(root.current, "exit", (v) => {
      p = v;
      req();
    });
    const move = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      req();
    };
    if (finePointer()) window.addEventListener("pointermove", move, { passive: true });
    return () => {
      un();
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={root} className="hero" aria-labelledby="hero-title">
      <div className="wrap hero-inner" data-reveal="">
        <div ref={lion} className="hero-lion fade-up" style={{ "--d": 100 } as CSSProperties}>
          <div className="hero-glow" aria-hidden="true" />
          <Lion className="relative h-full w-full text-gold" />
        </div>
        <h1 ref={title} id="hero-title" className="t-display hero-title" translate="no">
          <span className="ln hero-word">
            <span style={{ "--i": 1 } as CSSProperties}>{t.hero.title[0]}</span>
          </span>{" "}
          <span className="ln hero-word">
            <span style={{ "--i": 2 } as CSSProperties}>
              <Rich text={t.hero.title[1]} />
            </span>
          </span>
        </h1>
        <div ref={sub} className="hero-sub">
          <p className="fade-up t-body hero-lead" style={{ "--d": 450 } as CSSProperties}>
            {t.hero.sub}
          </p>
          <div
            className="fade-up mt-7 flex flex-wrap items-center justify-center gap-3"
            style={{ "--d": 560 } as CSSProperties}
          >
            <CallButton />
            <WhatsAppButton adaptive />
          </div>
        </div>
      </div>
      <div className="wrap hero-foot" aria-hidden="true">
        <span className="t-label text-muted">{t.hero.country}</span>
        <span className="t-label hero-scroll text-muted">
          {t.hero.scroll}
          <i />
        </span>
      </div>
    </section>
  );
}

/* ----------------------------------- Бегущая лента ----------------------------------- */
function Marquee({ items }: { items: string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr || !motionOK()) return;
    let x = 0;
    let dir = -1;
    let raf = 0;
    let last = 0;
    let on = false;
    let paused = false; // наведение мыши — лента стоит (можно прочитать)
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = paused ? 0 : Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const v = getVelocity();
      if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1;
      const speed = 38 + Math.min(900, Math.abs(v) * 42); // px/с: база + разгон от прокрутки
      const w = tr.scrollWidth / 2;
      x += dir * speed * dt;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      tr.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !on) {
        on = true;
        last = 0;
        raf = requestAnimationFrame(loop);
      } else if (!e.isIntersecting && on) {
        on = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
    };
  }, []);
  const row = (k: number) =>
    items.map((s, i) => (
      <span className="marquee-item" key={`${k}-${i}`}>
        {s}
        <Star className="marquee-star" />
      </span>
    ));
  return (
    <div ref={root} className="marquee" aria-hidden="true">
      <div ref={track} className="marquee-track">
        {row(0)}
        {row(1)}
        {row(2)}
        {row(3)}
      </div>
    </div>
  );
}

/* ----------------------------------- HUD карты ----------------------------------- */
function Hud({
  stage,
  onJump,
  refs,
}: {
  stage: number;
  onJump: (k: number) => void;
  refs: (HTMLButtonElement | null)[];
}) {
  const { t } = useLang();
  return (
    <div className="hud">
      <span className="hud-frame" />
      <span className="hud-corner" />
      <span className="hud-corner" />
      <span className="hud-corner" />
      <span className="hud-corner" />
      <div className="hud-top">
        <p className="t-label text-muted">
          <span className="hud-name text-gold">{t.map.label}</span>
          <span className="hud-name mx-2 opacity-50">/</span>
          {t.map.scheme}
        </p>
      </div>
      <nav className="hud-scale stage-scale" aria-label={t.a11y.progress}>
        {t.map.stages.map((s, k) => (
          <button
            key={s.code}
            type="button"
            ref={(el) => {
              refs[k] = el;
            }}
            aria-current={stage === k ? "step" : undefined}
            aria-label={`0${k + 1} — ${s.kicker}`}
            onClick={() => onJump(k)}
            className="t-num"
          >
            0{k + 1}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* ----------------------------------- Паспорт со штампами ----------------------------------- */
const SLOTS = [
  { top: "17%", left: "3%", r: -12 },
  { top: "40%", left: "50%", r: 8 },
  { top: "63%", left: "8%", r: -5 },
];

function Passport({ stage }: { stage: number }) {
  const { t } = useLang();
  const stamps = t.map.stages.filter((s) => s.stamp);
  return (
    <div
      className="passport"
      data-show={stage >= 1 ? "" : undefined}
      role="img"
      aria-label={`${t.a11y.stamps}: ${stamps.map((s) => s.stamp).join(", ")}`}
    >
      <div className="passport-head">
        <span>Carleone Service</span>
        <span>KZ</span>
      </div>
      <Lion className="passport-mark" />
      {stamps.map((s, k) => (
        <div key={s.code} className="passport-slot" style={{ top: SLOTS[k].top, left: SLOTS[k].left }}>
          <Stamp id={s.code} country={s.stamp} ring={t.map.stampRing} rotate={SLOTS[k].r} on={stage >= k + 1} />
        </div>
      ))}
    </div>
  );
}
