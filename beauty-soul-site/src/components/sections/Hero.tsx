import { useEffect, useRef } from "react";
import { brand } from "@/content/site";
import { Img } from "@/components/Img";
import { ArrowIcon, Button } from "@/components/ui/button";
import { prefersReducedMotion } from "@/lib/useScrollY";
import { typo } from "@/lib/utils";

/**
 * Первый экран: редакционная раскладка.
 * Десктоп — текст слева, крупный портрет справа и маленький кадр маникюра,
 * который «заходит» на текстовую колонку. Мобильный — заголовок, затем фото на всю ширину.
 */
export function Hero() {
  const parallax = useRef<HTMLDivElement>(null);

  // Лёгкий параллакс главного фото — только на десктопе и без reduced motion.
  useEffect(() => {
    const el = parallax.current;
    if (!el || prefersReducedMotion() || !window.matchMedia("(min-width: 1024px)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = Math.min(window.scrollY, window.innerHeight);
      el.style.transform = `translate3d(0, ${y * 0.06}px, 0)`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
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
      className="relative overflow-hidden pt-(--header-h)"
    >
      <div className="container-x grid gap-y-8 pt-6 pb-16 lg:min-h-[max(44rem,100svh)] lg:grid-cols-12 lg:gap-x-8 lg:pt-10 lg:pb-14">
        {/* Текст */}
        <div className="flex flex-col lg:col-span-6 lg:justify-between lg:pb-4 xl:col-span-6">
          <div className="lg:pt-[8vh]">
            <h1 id="hero-title">
              <span
                className="eyebrow reveal mb-6 block text-mocha lg:mb-10"
                style={{ ["--delay" as string]: "100ms" }}
              >
                Beauty Soul · салон красоты в Алматы
              </span>
              <span className="font-display block text-[clamp(3.4rem,11.5vw,8.6rem)] leading-[0.92] font-normal text-ink">
                <span className="line-mask">
                  <span style={{ ["--delay" as string]: "180ms" }}>Красота</span>
                </span>
                <span className="line-mask">
                  <span style={{ ["--delay" as string]: "300ms" }}>
                    <em className="pl-[0.9em] text-mocha">с&nbsp;душой</em>
                  </span>
                </span>
              </span>
            </h1>
          </div>

          <div className="mt-8 hidden lg:block">
            <HeroCopy />
          </div>
        </div>

        {/* Фото */}
        <div className="relative lg:col-span-6 lg:col-start-7">
          <div ref={parallax} className="will-change-transform">
            <div
              className="img-reveal -mx-(--gutter) aspect-[4/5] sm:mx-0 lg:aspect-auto lg:h-[calc(max(44rem,100svh)-var(--header-h)-6rem)]"
              style={{ ["--delay" as string]: "150ms" }}
            >
              <Img
                name="01_hero"
                alt="Гостья салона: вечерний макияж с красной помадой и длинные гладкие волосы"
                sizes="(min-width: 1024px) 46vw, 100vw"
                priority
                position="50% 22%"
                className="h-full"
              />
            </div>
          </div>

          {/* Маленький кадр-деталь, заходит на текстовую колонку */}
          <div
            className="img-reveal absolute bottom-[8%] -left-[22%] hidden w-[34%] shadow-[0_30px_60px_-30px_rgb(23_19_15/0.45)] xl:block"
            style={{ ["--delay" as string]: "650ms" }}
          >
            <Img
              name="03_nails_white"
              alt="Молочно-перламутровый маникюр"
              sizes="16vw"
              priority
              position="50% 40%"
              className="aspect-[3/4]"
            />
          </div>

          <p
            aria-hidden="true"
            className="eyebrow reveal absolute top-6 -right-9 hidden text-mocha/70 [writing-mode:vertical-rl] xl:block"
            style={{ ["--delay" as string]: "900ms" }}
          >
            {brand.city} · {brand.address}
          </p>
        </div>

        <div className="lg:hidden">
          <HeroCopy />
        </div>
      </div>
    </section>
  );
}

function HeroCopy() {
  return (
    <div className="reveal max-w-md" style={{ ["--delay" as string]: "520ms" }}>
      <p className="text-[1.05rem] leading-relaxed text-ink/75">
        {typo(
          "Маникюр и педикюр, волосы, макияж, брови и ресницы. Светлое пространство на Аксае и мастера, для которых важна каждая деталь.",
        )}
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
        <Button asChild size="lg">
          <a href={brand.bookingUrl} target="_blank" rel="noopener">
            Записаться
            <ArrowIcon />
          </a>
        </Button>
        <a
          href="#works"
          className="group/link inline-flex h-12 items-center gap-3 text-[0.8rem] font-semibold tracking-[0.16em] uppercase"
        >
          <span className="link-line">Смотреть работы</span>
        </a>
      </div>
      <p className="mt-10 hidden text-sm text-mocha lg:block">
        {brand.city}, {brand.address} ·{" "}
        <a href={brand.instagramUrl} target="_blank" rel="noopener" className="link-line text-ink">
          {brand.instagramHandle}
        </a>
      </p>
    </div>
  );
}
