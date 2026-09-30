import { Img } from "@/components/Img";
import { typo } from "@/lib/utils";

const values = ["Красота", "Забота", "Комфорт", "Внимание к деталям", "Индивидуальность"];

/** Короткое редакционное вступление: одна мысль крупно, одна деталь-фото. */
export function Intro() {

  return (
    <section
      id="salon"
      tabIndex={-1}
      aria-labelledby="salon-title"
      className="section-y bg-cream"
    >
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-3">
          <h2 id="salon-title" className="eyebrow reveal text-mocha">
            О салоне
          </h2>
          <div
            className="img-reveal mt-10 hidden w-full max-w-[15rem] lg:block"
            style={{ ["--delay" as string]: "200ms" }}
          >
            <Img
              name="14_interior_nails"
              alt="Маникюрная зона салона: полки с оттенками покрытий и мягкий свет"
              sizes="15rem"
              className="aspect-[3/4]"
            />
          </div>
        </div>

        <div className="lg:col-span-8 lg:col-start-5">
          <p className="font-display reveal text-[clamp(1.9rem,4.2vw,3.6rem)] leading-[1.12] text-ink">
            {typo("Мы верим, что красота начинается с ощущения заботы: когда вас ")}
            <em className="text-mocha">{typo("слышат, не торопят")}</em>
            {typo(" и доводят каждую деталь до конца.")}
          </p>

          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:mt-16">
            <p className="reveal text-ink/75" style={{ ["--delay" as string]: "120ms" }}>
              {typo(
                "Beauty Soul — салон в Алматы, на Аксае. Здесь делают маникюр и педикюр, укладки и макияж, брови и ресницы — всё, чтобы после визита чувствовать себя собой, только увереннее.",
              )}
            </p>
            <ul
              className="reveal flex flex-wrap content-start gap-x-3 gap-y-2 text-sm text-mocha"
              style={{ ["--delay" as string]: "220ms" }}
              aria-label="Наши ценности"
            >
              {values.map((v, i) => (
                <li key={v} className="flex items-center gap-3">
                  {i > 0 && <span aria-hidden="true" className="size-1 rounded-full bg-taupe" />}
                  {v}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
