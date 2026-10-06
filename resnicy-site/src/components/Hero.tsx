import { useEffect, useRef } from "react";
import { Photo } from "./Photo";
import { Arrow, MagLink } from "./Buttons";
import { ScrollTrigger, gsap, motionStarted } from "@/lib/motion";
import { canHover } from "@/lib/env";
import { isLowPower, onLowPower } from "@/lib/perf";
import { site } from "@/site.config";

/** Форма «глаз-капля» для маски фото и тонкого контура вокруг. */
export const DROP_PATH = "M50 2 C 66 26, 98 58, 98 95 C 98 122, 76 138, 50 138 C 24 138, 2 122, 2 95 C 2 58, 34 26, 50 2 Z";

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const figure = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!motionStarted()) return;
    const sec = section.current!;
    const ctx = gsap.context(() => {
      // параллакс макро-фото с лёгким вращением при уходе первого экрана
      gsap.to(figure.current, {
        yPercent: 14,
        rotate: -5,
        ease: "none",
        scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(photo.current, {
        scale: 1.12,
        ease: "none",
        scrollTrigger: { trigger: sec, start: "top top", end: "bottom top", scrub: true },
      });
    }, sec);

    // свечение за курсором (только мышь/тачпад); на телефоне оно плавает само (CSS)
    let off = () => {};
    if (canHover() && glow.current && !isLowPower()) {
      const g = glow.current;
      g.classList.add("is-follow");
      const x = gsap.quickTo(g, "x", { duration: 1.1, ease: "power3.out" });
      const y = gsap.quickTo(g, "y", { duration: 1.1, ease: "power3.out" });
      const move = (e: PointerEvent) => {
        const r = sec.getBoundingClientRect();
        x(e.clientX - r.left);
        y(e.clientY - r.top);
      };
      sec.addEventListener("pointermove", move);
      off = () => sec.removeEventListener("pointermove", move);
    }
    const unLow = onLowPower(() => off());
    ScrollTrigger.refresh();
    return () => {
      ctx.revert();
      off();
      unLow();
    };
  }, []);

  return (
    <section className="hero" id="top" ref={section}>
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-sheen" />
        <div className="hero-glow" ref={glow} />
      </div>

      <div className="hero-inner">
        <div className="hero-copy">
          <p className="eyebrow" data-hero style={{ "--i": 0 } as React.CSSProperties}>
            Ламинирование и наращивание ресниц · {site.city}
          </p>
          <h1 className="hero-title">
            <span className="line">
              <span data-hero style={{ "--i": 1 } as React.CSSProperties}>
                Ресницы,
              </span>
            </span>
            <span className="line">
              <span data-hero style={{ "--i": 2 } as React.CSSProperties}>
                которые <em>поднимают</em>
              </span>
            </span>
            <span className="line">
              <span data-hero style={{ "--i": 3 } as React.CSSProperties}>
                взгляд
              </span>
            </span>
          </h1>
          <p className="hero-lead" data-hero style={{ "--i": 4 } as React.CSSProperties}>
            {site.masterName ? `Я — ${site.masterName}. ` : ""}Ламинирую и наращиваю ресницы в Минске. Час на процедуру — и меньше времени
            на сборы.
          </p>
          <div className="hero-actions" data-hero style={{ "--i": 5 } as React.CSSProperties}>
            <MagLink href="#zapis" variant="light" icon={<Arrow />}>
              Записаться
            </MagLink>
            <MagLink href="#raboty" variant="ghost">
              Смотреть работы
            </MagLink>
          </div>
        </div>

        <div className="hero-figure-wrap" data-hero style={{ "--i": 2 } as React.CSSProperties}>
          <div className="hero-figure" ref={figure}>
            <div className="hero-tilt">
              <svg className="drop-outline" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true">
                <path d={DROP_PATH} pathLength={1} />
              </svg>
              <div className="drop">
                <div className="drop-photo" ref={photo}>
                  <Photo
                    name="hero"
                    eager
                    alt="Ламинированные ресницы крупным планом: реснички подняты и разделены, зелёный глаз"
                    sizes="(min-width: 1024px) 40vw, (orientation: landscape) 40vw, 72vw"
                    position="58% 50%"
                  />
                </div>
                <span className="drop-gloss" aria-hidden="true" />
              </div>
            </div>
            <p className="hero-tag">ламинирование ресниц</p>
          </div>
        </div>
      </div>

      <a className="scroll-cue" href="#podyom" aria-label="Листать дальше">
        <span className="scroll-cue-line" aria-hidden="true" />
        <span>листай</span>
      </a>
    </section>
  );
}
