import { useRef } from "react";
import { Img } from "@/components/Img";
import { useScrollFx } from "@/lib/scrollFx";
import { typo } from "@/lib/utils";

/** «О компании»: асимметричный разворот вокруг Minotti, Mondi и Prado. */
export function Editorial() {
  // Крупный кадр Minotti «отъезжает»: входит с приближением и плавно встаёт на место.
  const zoom = useRef<HTMLDivElement>(null);
  useScrollFx(zoom, (p, el) => {
    const t = Math.min(1, p / 0.55);
    el.style.setProperty("--s", (1.28 - t * 0.28).toFixed(4));
  });
  return (
    <section id="about" tabIndex={-1} aria-labelledby="about-title" className="section-y overflow-hidden bg-ivory">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-8">
        <figure className="lg:col-span-6">
          <div ref={zoom} className="zoom-media img-reveal overflow-hidden">
            <Img
              name="03_minotti_hero"
              alt="Диван Minotti в шоуруме на фоне оранжевой стены"
              sizes="(min-width: 1024px) 46vw, 100vw"
              position="42% 60%"
              className="aspect-[4/5]"
            />
          </div>
          <figcaption className="eyebrow mt-4 text-muted">Minotti</figcaption>
        </figure>

        <div className="flex flex-col justify-between gap-16 lg:col-span-5 lg:col-start-8">
          <div className="lg:pt-16">
            <p className="eyebrow reveal text-muted">О компании</p>
            <h2 id="about-title" className="display mt-6 text-[clamp(2.8rem,5.6vw,5.6rem)] text-graphite">
              <span className="line-mask">
                <span>Не просто место.</span>
              </span>
              <span className="line-mask">
                <span style={{ ["--delay" as string]: "110ms" }}>
                  <span className="serif text-terracotta">Центр</span> пространства.
                </span>
              </span>
            </h2>
            <div className="reveal mt-8 max-w-md space-y-4 text-muted" style={{ ["--delay" as string]: "200ms" }}>
              <p>
                {typo(
                  "Soft Line — шоурум современных диванов в Алматы. Здесь собраны модели для гостиных и современных интерьеров: спокойные оттенки, мягкие формы и силуэты, вокруг которых складывается вся комната.",
                )}
              </p>
              <p>{typo("Каждую модель можно рассмотреть, потрогать и примерить к своему пространству вживую.")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <figure className="mt-16">
              <div className="img-hover img-reveal" style={{ ["--delay" as string]: "150ms" }}>
                <Img name="05_mondi_hero" alt="Серый диван Mondi с изогнутой спинкой" sizes="(min-width: 1024px) 18vw, 46vw" position="50% 62%" className="aspect-[3/4]" />
              </div>
              <figcaption className="eyebrow mt-3 text-muted">Mondi</figcaption>
            </figure>
            <figure>
              <div className="img-hover img-reveal" style={{ ["--delay" as string]: "260ms" }}>
                <Img name="02_prado_alt" alt="Диван Prado со столиком" sizes="(min-width: 1024px) 18vw, 46vw" position="35% 62%" className="aspect-[3/4]" />
              </div>
              <figcaption className="eyebrow mt-3 text-muted">Prado</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
