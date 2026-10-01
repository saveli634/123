import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { brand, whatsapp } from "@/content/catalog";
import { Img } from "@/components/Img";
import { Button, nudge } from "@/components/ui/button";
import { motionAllowed, useScrollVar } from "@/lib/scrollFx";
import { typo } from "@/lib/utils";

/**
 * Первый экран — тёмный, кинематографичный.
 * Прокрутка (--p): строки заголовка разъезжаются в разные стороны, фото уходит вниз
 * и приближается, сверху ложится тёмная вуаль. Курсор (--mx/--my): слои смещаются
 * с разной глубиной — фото и текст двигаются навстречу друг другу.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  useScrollVar(section, "exit");

  // Параллакс за курсором: фото и текст — разные «глубины».
  useEffect(() => {
    const el = section.current;
    if (!el || !motionAllowed() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let f = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.setProperty("--mx", cx.toFixed(4));
      el.style.setProperty("--my", cy.toFixed(4));
      f = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0005 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!f) f = requestAnimationFrame(loop);
    };
    el.addEventListener("pointermove", move);
    return () => {
      el.removeEventListener("pointermove", move);
      if (f) cancelAnimationFrame(f);
    };
  }, []);

  return (
    <section
      ref={section}
      id="top"
      tabIndex={-1}
      aria-labelledby="hero-title"
      className="hero on-dark relative isolate overflow-hidden bg-graphite text-ivory lg:min-h-[max(46rem,100svh)]"
    >
      {/* Фото */}
      <div className="img-reveal relative h-[68svh] min-h-[26rem] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[46vw]">
        <div className="h-full w-full overflow-hidden">
          <div className="hero-media h-full w-full will-change-transform">
            <Img
              name="01_hero_prado"
              alt="Светлый диван Prado у панорамного окна в шоуруме"
              sizes="(min-width: 1024px) 46vw, 100vw"
              priority
              position="28% 62%"
              className="h-full"
            />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-graphite)_2%,rgb(29_27_25/0.55)_30%,transparent_60%)] lg:bg-[linear-gradient(to_right,var(--color-graphite)_0%,rgb(29_27_25/0.35)_28%,transparent_55%)]"
        />
        <div aria-hidden="true" className="hero-veil pointer-events-none absolute inset-0 bg-graphite" />
        <p className="eyebrow reveal absolute right-(--gutter) bottom-6 hidden text-ivory/70 lg:block" style={{ ["--delay" as string]: "1100ms" }}>
          На фото — Prado
        </p>
      </div>

      {/* Текст */}
      <div className="hero-copy container-x relative z-10 -mt-40 pb-14 lg:mt-0 lg:flex lg:min-h-[max(46rem,100svh)] lg:flex-col lg:justify-between lg:pt-[calc(var(--header-h)+9vh)] lg:pb-12">
        <div>
          <p className="eyebrow reveal mb-6 text-ivory/65 lg:mb-10" style={{ ["--delay" as string]: "150ms" }}>
            Шоурум диванов · {brand.city}
          </p>
          <h1 id="hero-title" className="hero-title display text-[clamp(3rem,8.2vw,9.2rem)] lg:max-w-[74vw]">
            <span className="line-mask hero-line" style={{ ["--dir" as string]: "-1.4" }}>
              <span style={{ ["--delay" as string]: "220ms" }}>Диван,</span>
            </span>
            <span className="line-mask hero-line" style={{ ["--dir" as string]: "1" }}>
              <span style={{ ["--delay" as string]: "320ms" }}>вокруг которого</span>
            </span>
            <span className="line-mask hero-line" style={{ ["--dir" as string]: "-0.6" }}>
              <span style={{ ["--delay" as string]: "420ms" }}>
                собирается <span className="serif">дом</span>
                <span className="text-ember">.</span>
              </span>
            </span>
          </h1>
        </div>

        <div className="hero-fade mt-10 lg:mt-12">
          <div className="reveal" style={{ ["--delay" as string]: "650ms" }}>
            <p className="max-w-[26rem] text-[1.02rem] leading-relaxed text-ivory/75">
              {typo("Современные диваны для гостиной: Prado, Minotti, Mondi и другие модели. Смотрите вживую в ТЦ ADEM 1.")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild variant="light" size="lg">
                <a href="#catalog">
                  Смотреть коллекцию
                  <ArrowRight aria-hidden="true" className={nudge} strokeWidth={1.5} />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href={whatsapp("Здравствуйте! Помогите, пожалуйста, подобрать диван.")} target="_blank" rel="noopener">
                  Подобрать диван
                </a>
              </Button>
            </div>
          </div>

          <a
            href="#intro"
            className="reveal absolute right-[calc(46vw+2.5rem)] bottom-12 hidden items-center gap-4 text-ivory/60 transition-colors hover:text-ivory lg:flex"
            style={{ ["--delay" as string]: "900ms" }}
          >
            <span className="scroll-cue relative block h-14 w-px overflow-hidden bg-ivory/20" />
            <span className="eyebrow">Листайте</span>
          </a>
        </div>
      </div>
    </section>
  );
}
