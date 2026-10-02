import { useEffect, useRef } from "react";
import { HERO, SITE } from "@/content/copy";
import { Cta } from "@/components/shared/Cta";
import { Img } from "@/components/shared/Img";
import { Cross } from "@/components/shared/Glyphs";
import { useScrollFx } from "@/lib/scroll";
import { motionAllowed } from "@/lib/env";

/**
 * Первый экран: заголовок в две строки смысла («Капитальный ремонт 1VD‑FTV» / «Алматы»),
 * модели, две кнопки, 3D-мотор справа (на телефоне — ниже текста).
 * Строки выезжают из-под маски после прелоадера; при прокрутке слои расходятся (параллакс).
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Построчное появление: текст уже нарисован под прелоадером (LCP не ждёт анимации),
  // строки уезжают вниз и выезжают обратно через WAAPI.
  useEffect(() => {
    const root = document.documentElement;
    const title = titleRef.current;
    if (!title) return;
    const spans = Array.from(title.querySelectorAll<HTMLElement>(".ln > span"));
    const extra = Array.from(ref.current?.querySelectorAll<HTMLElement>("[data-hero-fade]") ?? []);
    const run = () => {
      root.classList.remove("hero-pending");
      if (!motionAllowed() || typeof spans[0]?.animate !== "function") return;
      const ease = "cubic-bezier(.2,.8,.2,1)";
      spans.forEach((s, i) =>
        s.animate([{ transform: "translate3d(0,112%,0)" }, { transform: "translate3d(0,0,0)" }], { duration: 1150, delay: 60 + i * 95, easing: ease, fill: "backwards" }),
      );
      extra.forEach((el, i) =>
        el.animate([{ opacity: 0, transform: "translate3d(0,18px,0)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: 420 + i * 70, easing: ease, fill: "backwards" }),
      );
    };
    if (root.classList.contains("is-preloading")) window.addEventListener("preload:done", run, { once: true });
    else run();
  }, []);

  // Параллакс: строки расходятся, мотор-постер уходит медленнее
  useScrollFx(
    ref,
    (p, el) => {
      el.style.setProperty("--hx", p.toFixed(4));
    },
    "exit",
  );

  return (
    <section id="top" ref={ref} className="hero" aria-labelledby="hero-title">
      <div className="hero-art" aria-hidden="true">
        <Img name="render-0" alt="" sizes="(min-width: 1024px) 62vw, 100vw" priority contain className="hero-art-img" />
      </div>
      <div className="hero-marks" aria-hidden="true">
        <span className="hm-ring" />
        <span className="hm-axis hm-axis-x" />
        <span className="hm-axis hm-axis-y" />
        <span className="hm-dim">
          <span className="hm-dim-line" />
        </span>
        <span className="hm-note">{SITE.schemeNote}</span>
      </div>
      <div className="wrap hero-in">
        <p className="hero-eyebrow" data-hero-fade>
          <Cross className="sec-cross" />
          <span>{HERO.eyebrow}</span>
        </p>
        <h1 id="hero-title" ref={titleRef} className="display hero-title lines">
          {HERO.lines.map((l, i) => (
            <span key={l} className="ln" style={{ ["--i" as string]: i }}>
              <span>{l}</span>{" "}
            </span>
          ))}
          <span className="ln ln-city" style={{ ["--i" as string]: 2 }}>
            <span>
              <span className="ln-dash" aria-hidden="true" />
              {HERO.city}
            </span>
          </span>
        </h1>
        <p className="hero-models" data-hero-fade translate="no">
          {HERO.models.map((m, i) => (
            <span key={m} className="nw">
              {i > 0 && <span className="hero-dot" aria-hidden="true">·</span>}
              {m}
            </span>
          ))}
        </p>
        <div className="hero-cta" data-hero-fade>
          <Cta kind="call" size="lg" />
          <Cta kind="whatsapp" variant="outline" size="lg" />
        </div>
      </div>
      <a href="#etapy" className="hero-scroll" data-hero-fade data-cursor="link">
        <span>{HERO.scroll}</span>
        <span className="hero-scroll-line" aria-hidden="true" />
      </a>
    </section>
  );
}
