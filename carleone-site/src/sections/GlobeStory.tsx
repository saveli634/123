import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLang } from "@/lib/lang";
import { clamp, hasWebGL2, motionOK } from "@/lib/env";
import { scrollToTarget, subscribe } from "@/lib/scroll";
import { cn } from "@/lib/cn";
import { shotsFor } from "@/globe/geo";
import { textStage } from "@/globe/timeline";
import type { Globe } from "@/globe/scene";
import { Lion } from "@/components/Lion";
import { Kicker, Lines, q, Rich } from "@/components/Text";
import { Frame } from "@/components/Frame";
import { Stamp } from "@/components/Stamp";
import { CallButton, WhatsAppButton } from "@/components/Cta";

/** Радиус глобуса в квадратных рендерах этапов (доля стороны картинки) — см. scripts/render-globe.mjs. */
const RENDER_R = 0.42;

/**
 * «Путешественники»: вступление (горизонт глобуса) + «Карта Carleone» (500svh) над одним закреплённым
 * слоем с глобусом. Раздел доверия, ниже технических. t: -1 — вступление, 0…4 — этапы.
 * Глобус (three.js) грузится лениво, когда раздел подходит к экрану; до этого, без WebGL 2 и при
 * reduced motion — готовые рендеры того же глобуса.
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
  const [near, setNear] = useState(false);

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
          // вступление: от верха раздела до начала карты — горизонт поднимается в глобус
          const top = wrap.current!.getBoundingClientRect().top;
          tt = -1 + 0.5 * clamp(-top / Math.max(1, r.top - top));
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

    const load = async () => {
      if (started) return;
      started = true;
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

    // грузим, когда до раздела остаётся около полутора экранов
    const near = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        near.disconnect();
        load();
      },
      { rootMargin: "150% 0px 150% 0px" },
    );
    near.observe(wrap.current!);
    return () => {
      disposed = true;
      near.disconnect();
      cleanups.forEach((c) => c());
      g?.dispose();
      globe.current = null;
    };
  }, []);

  // --- рендер горизонта грузим, только когда раздел близко (без JS — сразу, см. index.css) ---
  useEffect(() => {
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setNear(true);
      },
      { rootMargin: "200% 0px 200% 0px" },
    );
    io.observe(wrap.current!);
    return () => io.disconnect();
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
    <div ref={wrap} className="relative">
      <div className="globe-track" aria-hidden="true">
        <div ref={layer} className="globe-layer" data-near={near ? "" : undefined}>
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

      <section className="map-intro" aria-labelledby="map-intro-title">
        <div className="wrap map-intro-inner">
          <Kicker>{t.map.intro.kicker}</Kicker>
          <Lines id="map-intro-title" lines={t.map.intro.title} className="t-title map-intro-title mt-6" />
        </div>
      </section>

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
