import { useRef } from "react";
import { Img } from "@/components/Img";
import { useScrollFx } from "@/lib/scrollFx";
import { typo } from "@/lib/utils";

/** Детали крупным планом: тёмный разворот, фактура и строчка. Материалы не называем — только то, что видно. */
/** Слой с собственной «глубиной»: чем больше speed, тем сильнее смещается при прокрутке. */
function useDepth(speed: number) {
  const ref = useRef<HTMLElement>(null);
  useScrollFx(ref, (p, el) => {
    el.style.transform = `translate3d(0, ${((0.5 - p) * speed * window.innerHeight).toFixed(1)}px, 0)`;
  });
  return ref;
}

export function Details() {
  // Тёмная панель «поднимается»: входит слегка уменьшенной со скруглением и раскрывается на всю ширину.
  const panel = useRef<HTMLDivElement>(null);
  useScrollFx(panel, (p, el) => {
    const t = Math.min(1, p / 0.32);
    el.style.setProperty("--rise", t.toFixed(4));
  });
  const d1 = useDepth(0.18);
  const d2 = useDepth(-0.06);
  const d3 = useDepth(0.32);
  return (
    <section aria-labelledby="details-title" className="bg-ivory">
     <div ref={panel} className="rise-panel on-dark section-y overflow-hidden bg-graphite text-ivory">
      <div className="container-x">
        <div className="grid gap-8 lg:grid-cols-12">
          <h2 id="details-title" className="display text-[clamp(2.6rem,5.8vw,5.8rem)] lg:col-span-8">
            <span className="line-mask">
              <span>Детали, которые</span>
            </span>
            <span className="line-mask">
              <span style={{ ["--delay" as string]: "110ms" }}>
                хочется <span className="serif text-ember">потрогать</span>
              </span>
            </span>
          </h2>
          <p className="reveal max-w-sm text-ivory/65 lg:col-span-4 lg:self-end" style={{ ["--delay" as string]: "200ms" }}>
            {typo("Строчка, кант, фактура ткани, тёплые деревянные детали. На фото этого не почувствовать — поэтому приглашаем в шоурум.")}
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:mt-24 lg:grid-cols-12 lg:gap-8">
          <figure ref={d1} className="lg:col-span-4 lg:self-end">
            <div className="img-hover img-reveal">
              <Img name="08_oscar_detail" alt="Oscar крупным планом: стёжка сиденья и подушка с тёмным кантом" sizes="(min-width: 1024px) 28vw, 100vw" className="aspect-square" />
            </div>
            <figcaption className="mt-4 flex justify-between text-sm text-ivory/60">
              <span className="text-ivory">Oscar</span> стёжка и кант
            </figcaption>
          </figure>

          <figure ref={d2} className="lg:col-span-5">
            <div className="img-hover img-reveal" style={{ ["--delay" as string]: "140ms" }}>
              <Img name="12_etno_detail" alt="Etno крупным планом: деревянный подлокотник и светлое сиденье" sizes="(min-width: 1024px) 36vw, 100vw" position="50% 55%" className="aspect-[4/5]" />
            </div>
            <figcaption className="mt-4 flex justify-between text-sm text-ivory/60">
              <span className="text-ivory">Etno</span> дерево и мягкое сиденье
            </figcaption>
          </figure>

          <figure ref={d3} className="lg:col-span-3 lg:mt-40">
            <div className="img-hover img-reveal" style={{ ["--delay" as string]: "260ms" }}>
              <Img name="10_polo_detail" alt="Polo крупным планом: фактурная обивка и деревянное основание" sizes="(min-width: 1024px) 22vw, 100vw" position="50% 60%" className="aspect-[3/4]" />
            </div>
            <figcaption className="mt-4 flex justify-between text-sm text-ivory/60">
              <span className="text-ivory">Polo</span> фактура обивки
            </figcaption>
          </figure>
        </div>
      </div>
     </div>
    </section>
  );
}
