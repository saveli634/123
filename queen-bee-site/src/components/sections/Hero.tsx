import { useEffect, useRef } from "react";
import { hero, brand } from "@/content/text";
import { Img } from "@/components/shared/Img";
import { Bee } from "@/components/shared/Bee";
import { BookButton, WhatsAppButton } from "@/components/shared/Buttons";
import { motionAllowed, useScrollFx } from "@/lib/scrollFx";

/**
 * Первый экран. Герой — типографика, пчела и лестница (лиц нет, пока нет согласия гостий).
 * Проявление — CSS-анимациями сразу после прелоадера (не ждёт скрипт → быстрый LCP).
 * Пчела пролетает по заголовку и садится на вершину шестигранного окна.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const queen = useRef<HTMLSpanElement>(null);
  const bee = useRef<HTMLSpanElement>(null);
  const win = useRef<HTMLDivElement>(null);
  const winPhoto = useRef<HTMLDivElement>(null);
  const comb = useRef<HTMLDivElement>(null);
  const flyer = useRef<HTMLSpanElement>(null);

  // Параллакс: слои уходят вверх с разной скоростью
  useScrollFx(
    section,
    (p) => {
      const e = p * p * (3 - 2 * p);
      if (queen.current) queen.current.style.transform = `translate3d(0, ${(-e * 140).toFixed(1)}px, 0)`;
      if (bee.current) bee.current.style.transform = `translate3d(${(e * 60).toFixed(1)}px, ${(-e * 70).toFixed(1)}px, 0)`;
      if (win.current) win.current.style.transform = `translate3d(0, ${(-e * 220).toFixed(1)}px, 0)`;
      if (winPhoto.current) winPhoto.current.style.transform = `translate3d(0, ${(e * 90).toFixed(1)}px, 0) scale(${(1.08 + e * 0.08).toFixed(3)})`;
      if (comb.current) comb.current.style.transform = `translate3d(0, ${(e * 120).toFixed(1)}px, 0)`;
    },
    "exit",
  );

  // Полёт пчелы по кривой Безье через заголовок → посадка на вершину окна
  useEffect(() => {
    const el = flyer.current;
    const sec = section.current;
    if (!el || !sec) return;
    if (!motionAllowed() || typeof el.animate !== "function") {
      el.style.opacity = "1";
      el.classList.add("is-landed");
      return;
    }
    const seen = document.documentElement.classList.contains("seen");
    const land = el.getBoundingClientRect();
    const q = queen.current!.getBoundingClientRect();
    const b = bee.current!.getBoundingClientRect();
    const lx = land.left + land.width / 2;
    const ly = land.top + land.height / 2;
    const P = [
      { x: -80 - lx, y: q.top + q.height * 0.55 - ly },
      { x: q.left + q.width * 0.6 - lx, y: q.top - q.height * 0.35 - ly },
      { x: b.left + b.width * 0.2 - lx, y: b.bottom + b.height * 0.1 - ly },
      { x: 0, y: 0 },
    ];
    const at = (t: number) => {
      const u = 1 - t;
      const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
      return { x: P.reduce((s, p, i) => s + p.x * w[i], 0), y: P.reduce((s, p, i) => s + p.y * w[i], 0) };
    };
    const N = 36;
    const frames: Keyframe[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const pt = at(t);
      const nx = at(Math.min(1, t + 0.02));
      const ang = i === N ? 0 : (Math.atan2(nx.y - pt.y, nx.x - pt.x) * 180) / Math.PI + 90;
      // небольшая «волна» полёта
      const wob = Math.sin(t * Math.PI * 5) * 10 * (1 - t);
      frames.push({ transform: `translate3d(${pt.x.toFixed(1)}px, ${(pt.y + wob).toFixed(1)}px, 0) rotate(${ang.toFixed(1)}deg) scale(${(1.25 - 0.25 * t).toFixed(3)})`, offset: t });
    }
    el.style.opacity = "1";
    const anim = el.animate(frames, {
      duration: 3200,
      delay: seen ? 400 : 1300,
      easing: "cubic-bezier(.22,.8,.2,1)",
      fill: "both",
    });
    anim.onfinish = () => {
      anim.cancel(); // конечный кадр совпадает с местом посадки
      el.classList.add("is-landed");
    };
    return () => anim.cancel();
  }, []);

  return (
    <section ref={section} id="top" className="hero tone-milk hero-in" data-tone="milk" aria-labelledby="hero-title">
      <div ref={comb} aria-hidden="true" className="honeycomb parallax" />
      <span aria-hidden="true" className="flare" style={{ width: "54vmax", height: "54vmax", left: "42%", top: "-22%" }} />
      <span aria-hidden="true" className="flare" style={{ width: "34vmax", height: "34vmax", left: "-12%", top: "48%" }} />
      <span aria-hidden="true" className="flare" style={{ width: "22vmax", height: "22vmax", left: "70%", top: "70%" }} />

      <div className="container-x relative flex min-h-[100svh] flex-col justify-end pt-28 pb-[max(3rem,7vh)] md:justify-center md:pb-20">
        {/* Шестигранное окно с лестницей */}
        <div
          className="hex-in absolute right-[-12vw] top-[max(76px,10svh)] w-[40vw] max-w-[400px] sm:right-[4vw] sm:w-[36vw] md:top-[19vh] md:right-[7vw] md:w-[27vw] lg:right-[9vw] lg:w-[24vw]"
          style={{ ["--delay" as string]: "260ms" }}
        >
        <div ref={win} className="hero-window parallax">
          <svg aria-hidden="true" className="hero-window-outline" viewBox="0 0 100 139" preserveAspectRatio="none">
            <polygon points="50,0 100,25 100,114 50,139 0,114 0,25" />
          </svg>
          <div className="hex-tall photo-wrap absolute inset-0">
            <div ref={winPhoto} className="parallax absolute inset-[-8%]">
              <Img name="staircase_spiral" alt="Винтовая лестница с золотой кромкой, вид сверху" sizes="(min-width: 768px) 27vw, 50vw" priority />
            </div>
          </div>
          <span ref={flyer} aria-hidden="true" className="hero-bee absolute left-1/2 top-0 -ml-[22px] -mt-[30px] block size-11">
            <Bee fly className="h-full w-full drop-shadow-[0_4px_10px_rgba(185,148,79,.45)]" />
          </span>
        </div>
        </div>

        <div className="relative z-10">
          <h1 id="hero-title" className="display hero-title text-espresso" translate="no">
            <span className="line-mask">
              <span>
                <span ref={queen} className="parallax inline-block">
                  Queen
                </span>
              </span>
            </span>
            <span className="line-mask hero-bee-line" style={{ ["--delay" as string]: "120ms" }}>
              <span>
                <span ref={bee} className="parallax it inline-block pr-[0.08em] text-bordo">
                  Bee
                </span>
              </span>
            </span>
          </h1>
          <p className="label fade-up mt-7 flex items-center gap-4 text-espresso md:mt-9" style={{ ["--delay" as string]: "380ms" }}>
            <span aria-hidden="true" className="h-px w-10 bg-gold md:w-16" />
            {brand.project}
            <span aria-hidden="true" className="h-px w-10 bg-gold md:w-16" />
          </p>
          <p className="display it fade-up mt-4 text-[clamp(1.55rem,2.6vw,2.3rem)] text-espresso" style={{ ["--delay" as string]: "460ms" }}>
            {hero.line}
          </p>
          <div className="fade-up mt-8 flex flex-wrap items-start gap-3 md:mt-10" style={{ ["--delay" as string]: "560ms" }}>
            <BookButton />
            <WhatsAppButton />
          </div>
        </div>
      </div>
    </section>
  );
}
