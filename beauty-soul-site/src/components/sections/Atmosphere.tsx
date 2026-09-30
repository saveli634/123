import { Img } from "@/components/Img";
import { typo } from "@/lib/utils";

/** Атмосфера салона: тёмный разворот, минимум слов, крупные фото. */
export function Atmosphere() {
  return (
    <section
      aria-labelledby="atmosphere-title"
      className="on-dark section-y overflow-hidden bg-espresso text-ivory"
    >
      <div className="container-x grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <div className="img-hover img-reveal">
            <Img
              name="13_interior"
              alt="Зал салона Beauty Soul: зеркала с мягкой подсветкой и бежевые кресла"
              sizes="(min-width: 1024px) 46vw, 100vw"
              position="50% 55%"
              className="aspect-[4/5] lg:aspect-[5/7]"
            />
          </div>
        </div>

        <div className="flex flex-col justify-between gap-14 lg:col-span-5 lg:col-start-8">
          <div className="lg:pt-24">
            <p className="eyebrow reveal text-sand/70">Атмосфера</p>
            <h2
              id="atmosphere-title"
              className="font-display mt-6 text-[clamp(2.4rem,4.8vw,4.4rem)] leading-[1.02]"
            >
              <span className="line-mask">
                <span>Светлое место,</span>
              </span>
              <span className="line-mask">
                <span style={{ ["--delay" as string]: "100ms" }}>
                  <em className="text-sand">где легко выдохнуть</em>
                </span>
              </span>
            </h2>
            <p className="reveal mt-8 max-w-sm text-ivory/65" style={{ ["--delay" as string]: "200ms" }}>
              {typo("Мягкий свет, спокойные оттенки и удобные кресла — пространство, в котором хочется задержаться.")}
            </p>
          </div>
          <div className="img-hover img-reveal ml-auto w-[72%] max-w-[22rem]" style={{ ["--delay" as string]: "180ms" }}>
            <Img
              name="14_interior_nails"
              alt="Маникюрная зона: подсвеченные полки с оттенками покрытий"
              sizes="(min-width: 1024px) 22rem, 70vw"
              className="aspect-[3/4]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
