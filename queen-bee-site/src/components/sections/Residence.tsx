import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { residence, stages, buttons } from "@/content/text";
import { Img, hasImage, imageUrl } from "@/components/shared/Img";
import { Bee } from "@/components/shared/Bee";
import { BookButton, CallButton, WhatsAppButton } from "@/components/shared/Buttons";
import { motionAllowed, useScrollFx } from "@/lib/scrollFx";
import { scrollToY } from "@/lib/smoothScroll";
import { cn, smooth } from "@/lib/utils";
import type { FrameInfo, SpiralScene } from "@/three/scene";

/**
 * Главная сцена «Пчела ведёт по резиденции»: закреплённая (sticky) секция высотой 500svh,
 * Three.js грузится лениво, рисует только пока секция на экране и вкладка видима.
 * Без WebGL 2, при reduced motion и без JS — статичная лента: готовые рендеры той же спирали.
 */
const CARD_IMAGES = ["lobby_chandelier", "lounge_burgundy", "lounge_green", "staircase_spiral", "fireplace_wood", "reception_desk", "shelves_products", "gift_boxes_monogram"];
const CENTERS = [0.115, 0.235, 0.355, 0.485, 0.625, 0.765, 0.97];

function hasWebGL2() {
  try {
    return !!document.createElement("canvas").getContext("webgl2");
  } catch {
    return false;
  }
}

export function Residence() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const final = useRef<HTMLDivElement>(null);
  const finalBtn = useRef<HTMLDivElement>(null);
  const name = useRef<HTMLParagraphElement>(null);
  const hint = useRef<HTMLParagraphElement>(null);
  const phraseEls = useRef<(HTMLParagraphElement | null)[]>([]);
  const ticks = useRef<(HTMLButtonElement | null)[]>([]);
  const sceneRef = useRef<SpiralScene | null>(null);
  const progress = useRef(0);
  const activeName = useRef("");
  const [live, setLive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const heightBefore = useRef<number | null>(null);

  // Живая сцена выше статичной ленты. Если посетитель уже ниже секции (перешёл по якорю,
  // обновил страницу посередине), компенсируем прокрутку — страница не «прыгает».
  useLayoutEffect(() => {
    const sec = section.current;
    if (!live || !sec || heightBefore.current === null) return;
    const delta = sec.offsetHeight - heightBefore.current;
    heightBefore.current = null;
    if (delta && sec.getBoundingClientRect().top < 0) scrollToY(window.scrollY + delta, true);
  }, [live]);

  // Проверку WebGL 2 делаем, только когда сцена близко: создание контекста на слабых
  // устройствах (и в программном рендере) дорого и не должно тормозить первый экран.
  useEffect(() => {
    const sec = section.current;
    if (!sec || !motionAllowed()) return;
    const idle = (fn: () => void) =>
      "requestIdleCallback" in window ? (window as unknown as { requestIdleCallback: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback(fn, { timeout: 600 }) : setTimeout(fn, 60);
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        idle(() => {
          if (!hasWebGL2()) return;
          heightBefore.current = sec.offsetHeight;
          setLive(true);
        });
      },
      { rootMargin: "80% 0px 80% 0px" },
    );
    io.observe(sec);
    return () => io.disconnect();
  }, []);

  useScrollFx(
    section,
    (p) => {
      progress.current = p;
      sceneRef.current?.setProgress(p);
    },
    "sticky",
  );

  // Интерфейс поверх 3D — напрямую в DOM, без перерисовок React
  const onFrame = (f: FrameInfo) => {
    if (intro.current) {
      intro.current.style.opacity = f.intro.toFixed(3);
      intro.current.style.transform = `translate3d(0, ${((1 - f.intro) * -30).toFixed(1)}px, 0)`;
      intro.current.style.visibility = f.intro < 0.01 ? "hidden" : "visible";
    }
    let best = -1;
    let bestW = 0.35;
    stages.forEach((_, i) => {
      const w = f.weights[i];
      if (w > bestW) {
        best = i;
        bestW = w;
      }
      const el = phraseEls.current[i];
      if (el) {
        // только одна фраза за раз: на стыке этапов обе гаснут
        const v = i === 6 ? 0 : smooth(0.6, 0.97, w);
        el.style.opacity = v.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - v) * 18).toFixed(1)}px, 0)`;
        el.style.visibility = v < 0.01 ? "hidden" : "visible";
      }
      ticks.current[i]?.setAttribute("data-on", w > 0.5 ? "true" : "false");
    });
    const nm = best >= 0 ? stages[best].name : "";
    if (name.current && nm !== activeName.current) {
      activeName.current = nm;
      name.current.textContent = nm;
    }
    if (name.current) name.current.style.opacity = best >= 0 && best < 6 ? "1" : "0";
    if (hint.current) hint.current.style.opacity = (1 - f.final).toFixed(3);
    if (final.current) {
      final.current.style.opacity = f.final.toFixed(3);
      final.current.style.transform = `translate3d(0, ${((1 - f.final) * 26).toFixed(1)}px, 0)`;
      final.current.style.visibility = f.final < 0.01 ? "hidden" : "visible";
    }
  };

  useEffect(() => {
    if (!live) return;
    const sec = section.current!;
    let disposed = false;
    let loading = false;
    let visible = false;
    const mobile = window.matchMedia("(max-width: 767px)").matches;

    const landing = () => {
      const b = finalBtn.current?.getBoundingClientRect();
      const s = stage.current?.getBoundingClientRect();
      if (!b || !s) return null;
      // садится на правый верхний край кнопки «Записаться»
      return { x: b.right - s.left - 20, y: b.top - s.top - 8 };
    };

    const ensure = async () => {
      if (sceneRef.current || loading) return;
      loading = true;
      const mod = await import("@/three/scene");
      if (disposed || !canvas.current) return;
      const s = mod.createSpiralScene(canvas.current, onFrame, { mobile, landing, urls: CARD_IMAGES.map((n) => imageUrl(n)) });
      if (!s) {
        setLive(false);
        return;
      }
      sceneRef.current = s;
      if (import.meta.env.DEV) (window as unknown as { __qb?: SpiralScene }).__qb = s;
      const r = stage.current!.getBoundingClientRect();
      s.resize(r.width, r.height);
      s.setProgress(progress.current, true);
      await s.ready;
      if (disposed) return;
      setLoaded(true);
      if (visible && !document.hidden) s.start();
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) {
          void ensure();
          if (!document.hidden) sceneRef.current?.start();
        } else sceneRef.current?.stop();
      },
      { rootMargin: "80% 0px 80% 0px" },
    );
    io.observe(sec);
    const vis = () => {
      if (document.hidden) sceneRef.current?.stop();
      else if (visible) sceneRef.current?.start();
    };
    document.addEventListener("visibilitychange", vis);

    const ro = new ResizeObserver(([e]) => sceneRef.current?.resize(e.contentRect.width, e.contentRect.height));
    ro.observe(stage.current!);

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const move = (e: PointerEvent) => sceneRef.current?.setPointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
    if (fine) sec.addEventListener("pointermove", move);

    return () => {
      disposed = true;
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", vis);
      sec.removeEventListener("pointermove", move);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
    // onFrame читает только refs — пересоздавать сцену не нужно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  /** Переход к этапу по шкале 01–07 */
  const goTo = (i: number) => {
    const sec = section.current;
    if (!sec) return;
    const top = sec.getBoundingClientRect().top + window.scrollY;
    scrollToY(top + CENTERS[i] * (sec.offsetHeight - window.innerHeight));
  };

  const renderOf = (i: number) => (hasImage(`spiral-${i}`) ? `spiral-${i}` : "");

  return (
    <section
      ref={section}
      id="rezidenciya"
      className={cn("res tone-milk", live && "res-live", loaded && "res-loaded")}
      data-tone="milk"
      aria-labelledby="res-title"
    >
      {/* ---------- Живая сцена ---------- */}
      <div ref={stage} className="res-stage" aria-hidden={!live}>
        <div aria-hidden="true" className="honeycomb" style={{ opacity: 0.035 }} />
        <span aria-hidden="true" className="flare" style={{ width: "50vmax", height: "50vmax", left: "25%", top: "10%", opacity: 0.5 }} />
        <canvas ref={canvas} className="res-canvas" aria-hidden="true" />
        <div aria-hidden="true" className="res-veil" />
        <div aria-hidden="true" className="res-frame" />

        <div ref={intro} className="res-intro">
          <p className="label eyebrow eyebrow-gold text-espresso">02 — {residence.label}</p>
          <h2 id={live ? "res-title" : undefined} className="display mt-6 max-w-[12ch] text-[clamp(2.8rem,7vw,6.4rem)] leading-[0.95] text-espresso">
            {residence.titleA} <span className="it text-bordo">{residence.titleB}</span>
          </h2>
        </div>

        <nav className="res-scale hidden md:grid" aria-label="Этапы">
          {stages.map((s, i) => (
            <button
              key={s.id}
              ref={(el) => {
                ticks.current[i] = el;
              }}
              type="button"
              className="res-tick label"
              onClick={() => goTo(i)}
              tabIndex={live ? 0 : -1}
              aria-label={`${s.n} — ${s.name}`}
            >
              {s.n}
            </button>
          ))}
        </nav>
        <p ref={name} className="res-name label text-espresso" aria-live="polite" />

        <div className="res-phrase">
          {stages.map((s, i) =>
            s.phrase && i < 6 ? (
              <p
                key={s.id}
                ref={(el) => {
                  phraseEls.current[i] = el;
                }}
                className="res-phrase-item display it text-[clamp(1.5rem,3.1vw,2.7rem)] leading-[1.12] text-espresso"
              >
                {s.phrase}
              </p>
            ) : null,
          )}
        </div>

        <div ref={final} className="res-final">
          <p className="label eyebrow eyebrow-gold text-espresso">07 — {stages[6].name}</p>
          <p className="display mt-5 max-w-[14ch] text-[clamp(2.4rem,5.6vw,5rem)] leading-[0.98] text-espresso">
            Queen Bee <span className="it text-bordo">Boheme Residence</span>
          </p>
          <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <div ref={finalBtn}>
              <BookButton />
            </div>
            <WhatsAppButton />
            <CallButton className="hidden sm:inline-flex" />
          </div>
        </div>

        <p ref={hint} className="res-scroll label text-espresso">
          <i aria-hidden="true" />
          {residence.hint}
        </p>
      </div>

      {/* ---------- Статичная лента (без WebGL 2 / reduced motion / без JS) ---------- */}
      <div className="res-static section-y">
        <div className="container-x">
          <p className="label eyebrow eyebrow-gold reveal text-espresso">02 — {residence.label}</p>
          <h2 id={live ? undefined : "res-title"} className="display mt-6 max-w-[12ch] text-[clamp(2.8rem,7vw,6.4rem)] leading-[0.95] text-espresso">
            <span className="line-mask">
              <span>{residence.titleA}</span>
            </span>
            <span className="line-mask" style={{ ["--delay" as string]: "100ms" }}>
              <span className="it text-bordo">{residence.titleB}</span>
            </span>
          </h2>
          {renderOf(0) && (
            <div className="curtain photo-wrap res-overview mt-12">
              <Img name={renderOf(0)} alt={residence.overviewAlt} sizes="(min-width: 1024px) 1100px, 100vw" />
            </div>
          )}
        </div>
        <ol className="res-ribbon container-x mt-14 list-none">
          {stages.map((s, i) => {
            const img = renderOf(i + 1) || s.images[0] || "staircase_spiral";
            return (
              <li key={s.id} className="stage-card reveal" style={{ ["--delay" as string]: `${(i % 3) * 80}ms` }}>
                <div className="photo-wrap stage-card-media">
                  <Img
                    name={img}
                    alt={i === 6 ? residence.overviewAlt : renderOf(i + 1) ? `${s.name}: кадр интерьера на золотой спирали` : s.alts[0]}
                    sizes="(min-width: 1024px) 30vw, 78vw"
                  />
                </div>
                <p className="label mt-5 flex items-center gap-3 text-espresso">
                  <span className="text-bordo">{s.n}</span>
                  <span aria-hidden="true" className="h-px w-6 bg-gold" />
                  {s.name}
                </p>
                {s.phrase && <p className="display it mt-3 text-[1.45rem] leading-[1.2] text-espresso">{s.phrase}</p>}
              </li>
            );
          })}
        </ol>
        <div className="container-x mt-16 flex flex-col items-start gap-6 border-t border-gold/60 pt-10 md:flex-row md:items-center md:justify-between">
          <p className="display text-[clamp(2rem,4vw,3.4rem)] leading-none text-espresso">
            <Bee className="mr-3 inline-block size-[0.8em] align-[-0.06em]" />
            Queen Bee <span className="it text-bordo">Boheme Residence</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <BookButton label={buttons.book} />
            <WhatsAppButton />
          </div>
        </div>
      </div>
    </section>
  );
}
