import { useRef } from "react";
import { Img } from "@/components/Img";
import { useScrollFx } from "@/lib/scrollFx";
import { typo } from "@/lib/utils";

/**
 * Реальный интерьер покупателя. Сцена закрепляется: снимок раскрывается
 * из небольшого «окна» в центре на весь экран, заголовок уходит, появляется подпись.
 * Без движения — обычный разворот: заголовок и фото.
 */
export function ClientInterior() {
  const wrap = useRef<HTMLElement>(null);
  useScrollFx(
    wrap,
    (p, el) => {
      const e = Math.min(1, Math.max(0, (p - 0.08) / 0.62));
      const eased = 1 - Math.pow(1 - e, 3);
      el.style.setProperty("--e", eased.toFixed(4));
      el.style.setProperty("--cap", Math.min(1, Math.max(0, (p - 0.72) / 0.18)).toFixed(4));
    },
    "sticky",
  );

  return (
    <section ref={wrap} aria-labelledby="home-title" className="expand bg-cream">
      <div className="expand-stage">
        <div className="expand-head container-x">
          <p className="eyebrow reveal text-muted">Интерьер покупателя</p>
          <h2 id="home-title" className="display mt-6 text-[clamp(2.6rem,6vw,6rem)] text-graphite">
            <span className="line-mask">
              <span>Как диван</span>
            </span>
            <span className="line-mask">
              <span style={{ ["--delay" as string]: "110ms" }}>
                выглядит <span className="serif text-terracotta">дома</span>
              </span>
            </span>
          </h2>
        </div>

        <div className="expand-media">
          <Img
            name="14_client_interior"
            alt="Светлая гостиная покупателя: два дивана и круглый столик в центре"
            sizes="100vw"
            position="50% 60%"
            className="h-full"
          />
          <div className="expand-caption on-dark">
            <p className="max-w-md text-ivory">
              {typo("В шоуруме диван стоит среди других моделей. Дома он становится центром комнаты — вот как это выглядит в светлой гостиной одного из покупателей.")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
