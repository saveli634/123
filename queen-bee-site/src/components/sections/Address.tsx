import { address } from "@/content/text";
import { Bee } from "@/components/shared/Bee";

/**
 * «Из видеообращения» (подпись 007): цитата дословно, в исходном порядке, разной крупности —
 * чтобы не было «стены текста». Говорящий не назван: имя и пол неизвестны.
 */
export function Address() {
  return (
    <section className="tone-sand section-y relative overflow-hidden" data-tone="sand" aria-labelledby="address-label">
      <div className="container-x grid-12 relative gap-y-10">
        <div className="col-span-12 lg:col-span-3">
          <p id="address-label" className="label eyebrow eyebrow-gold reveal text-espresso">
            05 — {address.label}
          </p>
        </div>
        <div className="col-span-12 lg:col-span-9">
        <figure className="m-0">
          <blockquote className="relative m-0">
            {/* висячая кавычка: на компьютере — на поле слева от текста */}
            <span aria-hidden="true" className="display reveal -mb-4 block text-[5rem] leading-[0.8] text-gold lg:absolute lg:right-full lg:top-[-0.06em] lg:mr-5 lg:mb-0 lg:text-[7rem]">
              «
            </span>
            <p className="display reveal max-w-[30ch] text-[clamp(1.45rem,2.3vw,2rem)] leading-[1.25] text-espresso">{address.open}</p>
            <p className="prose-qb reveal mt-7 max-w-[56ch] text-[1.06rem] leading-[1.75] text-ink-soft md:columns-2 md:gap-10 md:max-w-none lg:max-w-[64rem]" style={{ ["--delay" as string]: "80ms" }}>
              {address.why}
            </p>
            <p className="display mt-12 max-w-[19ch] text-[clamp(2.4rem,5.4vw,5rem)] leading-[1.02] text-espresso md:mt-16">
              <span className="line-mask">
                <span>{address.heartA}</span>
              </span>
              <span className="line-mask" style={{ ["--delay" as string]: "120ms" }}>
                <span className="it text-bordo">{address.heartB}</span>
              </span>
            </p>
          </blockquote>
          <figcaption className="label reveal mt-10 flex items-center gap-4 text-espresso">
            <span aria-hidden="true" className="h-px w-12 bg-gold" />
            {address.label}
          </figcaption>
        </figure>
          <p className="display it reveal mt-16 flex max-w-[34ch] items-start gap-4 border-t border-gold/60 pt-8 text-[clamp(1.3rem,2vw,1.7rem)] leading-[1.3] text-ink-soft">
            <Bee className="mt-1 size-7 shrink-0" />
            {address.soft}
          </p>
        </div>
      </div>
    </section>
  );
}
