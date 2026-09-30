import { ArrowUpRight, MessageCircle, Phone } from "lucide-react";
import { brand, whatsapp } from "@/content/catalog";
import { Img } from "@/components/Img";
import { Button } from "@/components/ui/button";
import { typo } from "@/lib/utils";

export function ContactCta() {
  return (
    <section id="contacts" tabIndex={-1} aria-labelledby="contacts-title" className="on-dark relative overflow-hidden bg-ink text-ivory">
      <div className="grid lg:min-h-[52rem] lg:grid-cols-12">
        <div className="container-x section-y flex flex-col justify-center lg:col-span-7 lg:mr-0 lg:max-w-none lg:pr-16">
          <p className="eyebrow reveal text-ivory/55">Контакты</p>
          <h2 id="contacts-title" className="display mt-6 text-[clamp(2.5rem,5.2vw,5.4rem)]">
            <span className="line-mask">
              <span>Найдём диван,</span>
            </span>
            <span className="line-mask">
              <span style={{ ["--delay" as string]: "100ms" }}>который подойдёт</span>
            </span>
            <span className="line-mask">
              <span style={{ ["--delay" as string]: "200ms" }}>
                <span className="serif text-ember">вашему</span> пространству.
              </span>
            </span>
          </h2>

          <div className="reveal mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={{ ["--delay" as string]: "280ms" }}>
            <Button asChild variant="accent" size="lg">
              <a href={whatsapp("Здравствуйте! Хочу узнать цену на диван.")} target="_blank" rel="noopener">
                Узнать цену
                <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={1.5} />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={whatsapp()} target="_blank" rel="noopener">
                <MessageCircle aria-hidden="true" className="size-4" strokeWidth={1.5} />
                Написать в WhatsApp
              </a>
            </Button>
          </div>

          <div className="reveal mt-14 grid gap-8 border-t border-ivory/12 pt-8 sm:grid-cols-2" style={{ ["--delay" as string]: "360ms" }}>
            <div>
              <p className="eyebrow text-ivory/45">Телефоны</p>
              <ul className="mt-3 space-y-1">
                {brand.phones.map((p) => (
                  <li key={p.tel}>
                    <a href={`tel:${p.tel}`} className="group/link inline-flex h-10 items-center gap-3 text-lg tabular-nums">
                      <Phone aria-hidden="true" className="size-4 text-ember" strokeWidth={1.5} />
                      <span className="link-line">{p.display}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-ivory/45">Шоурум и Instagram</p>
              <p className="mt-4 text-ivory/80">
                {typo(`${brand.showroom}, ${brand.showroomDetails}, ${brand.city}`)}
              </p>
              <a href={brand.instagramUrl} target="_blank" rel="noopener" className="link-line mt-2 inline-block text-ivory">
                {brand.instagramHandle}
              </a>
            </div>
          </div>
        </div>

        <div className="img-reveal relative h-[64svh] min-h-[24rem] lg:col-span-5 lg:h-auto">
          <Img
            name="04_minotti_wide"
            alt="Диван Minotti с оранжевыми подушками в шоуруме"
            sizes="(min-width: 1024px) 42vw, 100vw"
            position="38% 60%"
            className="absolute inset-0 h-full"
          />
        </div>
      </div>
    </section>
  );
}
