import { Img } from "@/components/Img";
import { typo } from "@/lib/utils";

/** Реальный интерьер покупателя — без придуманных цитат и оценок. */
export function ClientInterior() {
  return (
    <section aria-labelledby="home-title" className="section-y bg-cream">
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4 lg:self-center">
          <p className="eyebrow reveal text-muted">Интерьер покупателя</p>
          <h2 id="home-title" className="display mt-6 text-[clamp(2.6rem,5vw,5rem)] text-graphite">
            <span className="line-mask">
              <span>Как диван</span>
            </span>
            <span className="line-mask">
              <span style={{ ["--delay" as string]: "110ms" }}>
                выглядит <span className="serif text-terracotta">дома</span>
              </span>
            </span>
          </h2>
          <p className="reveal mt-8 max-w-sm text-muted" style={{ ["--delay" as string]: "200ms" }}>
            {typo("В шоуруме диван стоит среди других моделей. Дома он становится центром комнаты — вот как это выглядит в светлой гостиной одного из покупателей.")}
          </p>
        </div>
        <div className="img-reveal lg:col-span-7 lg:col-start-6">
          <Img
            name="14_client_interior"
            alt="Светлая гостиная покупателя: два дивана и круглый столик в центре"
            sizes="(min-width: 1024px) 55vw, 100vw"
            position="50% 58%"
            className="aspect-[4/5] lg:aspect-[5/5]"
          />
        </div>
      </div>
    </section>
  );
}
