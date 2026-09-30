import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { brand, whatsapp } from "@/content/catalog";
import { Img } from "@/components/Img";
import { Button, nudge } from "@/components/ui/button";
import { prefersReducedMotion } from "@/lib/useScrollY";
import { typo } from "@/lib/utils";

/**
 * Первый экран — тёмный, кинематографичный. Фото Prado высокой колонкой уходит
 * в правый край и под шапку, огромный заголовок наезжает на снимок.
 * На телефоне — фото во всю ширину, заголовок поверх нижней части кадра.
 */
export function Hero() {
  const parallax = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = parallax.current;
    if (!el || prefersReducedMotion()) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.min(window.scrollY, window.innerHeight);
      el.style.transform = `translate3d(0, ${y * 0.12}px, 0) scale(1.04)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      id="top"
      tabIndex={-1}
      aria-labelledby="hero-title"
      className="on-dark relative isolate overflow-hidden bg-graphite text-ivory lg:min-h-[max(46rem,100svh)]"
    >
      {/* Фото */}
      <div className="img-reveal relative h-[68svh] min-h-[26rem] lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[46vw]">
        <div className="h-full w-full overflow-hidden">
          <div ref={parallax} className="h-full w-full will-change-transform">
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
        {/* Затемнения, чтобы заголовок читался поверх фото */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-graphite)_2%,rgb(29_27_25/0.55)_30%,transparent_60%)] lg:bg-[linear-gradient(to_right,var(--color-graphite)_0%,rgb(29_27_25/0.35)_28%,transparent_55%)]"
        />
        <p className="eyebrow reveal absolute right-(--gutter) bottom-6 hidden text-ivory/70 lg:block" style={{ ["--delay" as string]: "1100ms" }}>
          На фото — Prado
        </p>
      </div>

      {/* Текст */}
      <div className="container-x relative z-10 -mt-40 pb-14 lg:mt-0 lg:flex lg:min-h-[max(46rem,100svh)] lg:flex-col lg:justify-between lg:pt-[calc(var(--header-h)+9vh)] lg:pb-12">
        <div>
          <p className="eyebrow reveal mb-6 text-ivory/65 lg:mb-10" style={{ ["--delay" as string]: "150ms" }}>
            Шоурум диванов · {brand.city}
          </p>
          <h1 id="hero-title" className="display text-[clamp(3rem,8.2vw,9.2rem)] lg:max-w-[74vw]">
            <span className="line-mask">
              <span style={{ ["--delay" as string]: "220ms" }}>Диван,</span>
            </span>
            <span className="line-mask">
              <span style={{ ["--delay" as string]: "320ms" }}>вокруг которого</span>
            </span>
            <span className="line-mask">
              <span style={{ ["--delay" as string]: "420ms" }}>
                собирается <span className="serif">дом</span>
                <span className="text-ember">.</span>
              </span>
            </span>
          </h1>
        </div>

        <div className="mt-10 lg:mt-12">
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
