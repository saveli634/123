import { Phone } from "lucide-react";
import { services } from "@/data/services";
import type { Photo } from "@/data/types";
import { PhotoFrame } from "@/components/shared/PhotoFrame";
import { useUi } from "@/components/shared/UiContext";
import { Button } from "@/components/ui/button";
import { SectionHead } from "./SectionHead";

const gallery: Photo[] = [
  { name: "obves-lc70-bumper", alt: "Силовой бампер с лебёдкой и светодиодной балкой на Land Cruiser 70", tag: "Land Cruiser 70 · бампер с лебёдкой" },
  { name: "obves-pickup-rollbar-1", alt: "Ролл-бар с запасным колесом в кузове пикапа", tag: "Пикап · ролл-бар и запаска" },
  { name: "obves-rear-spare-1", alt: "Задний силовой бампер с калиткой запасного колеса на зелёном внедорожнике", tag: "Задний бампер · калитка" },
  { name: "obves-prado120-front", alt: "Передняя защита на Toyota Prado 120", tag: "Prado 120 · передняя защита" },
  { name: "obves-rear-carrier", alt: "Калитка запасного колеса и фаркоп на Subaru Forester", tag: "Subaru Forester · калитка" },
  { name: "obves-step", alt: "Боковой порог на внедорожнике", tag: "Пороги" },
];

const made = ["Силовые бамперы, с лебёдкой", "Пороги", "Калитки для запаски", "Фаркопы", "Багажники на крышу", "Дуги и лестницы", "Шноркели", "Кенгурятники и обвес", "Ролл-бары для пикапов", "Прицепы"];

/** Силовой обвес под заказ: редакционная галерея + что делаем + контакт мастера. */
export function Fabrication() {
  const { openLightbox, openLead } = useUi();
  const svc = services.find((s) => s.slug === "silovoy-obves")!;
  const phone = svc.phones![0];
  return (
    <section id="obves" tabIndex={-1} aria-labelledby="obves-title" className="section-y border-t border-line">
      <div className="container-x">
        <SectionHead number="07" id="obves-title" eyebrow="Изготовление под заказ" title="Силовой обвес">
          <p className="text-muted">Изготовим силовой бампер, пороги, калитку, багажник и обвес под ваш внедорожник — под ваш дизайн.</p>
        </SectionHead>

        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
          <PhotoFrame photo={gallery[0]} ratio="4/3" sizes="(min-width: 1024px) 58vw, 100vw" onOpen={() => openLightbox(gallery, 0)} className="reveal sm:col-span-2 lg:col-span-7 lg:row-span-2 lg:[&>.frame-media]:h-full" />
          {gallery.slice(1, 3).map((p, i) => (
            <PhotoFrame key={p.name} photo={p} ratio="4/3" sizes="(min-width: 1024px) 40vw, 50vw" onOpen={() => openLightbox(gallery, i + 1)} className="reveal lg:col-span-5" />
          ))}
          {gallery.slice(3).map((p, i) => (
            <PhotoFrame key={p.name} photo={p} ratio={p.name === "obves-prado120-front" ? "4/3" : "4/5"} sizes="(min-width: 1024px) 32vw, 50vw" onOpen={() => openLightbox(gallery, i + 3)} className="reveal lg:col-span-4" />
          ))}
        </div>

        <div className="mt-14 grid gap-10 border-t border-line pt-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h3 className="display text-[1.6rem]">Что делаем</h3>
            <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {made.map((m) => (
                <li key={m} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.62em] h-0.5 w-3 shrink-0 bg-accent" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[3px] border border-line bg-surface p-6 lg:col-span-4 lg:col-start-9">
            <p className="eyebrow text-accent">{phone.label}</p>
            <a href={`tel:${phone.tel}`} className="mono mt-3 inline-flex min-h-11 items-center gap-3 text-xl hover:text-accent">
              <Phone aria-hidden="true" className="size-5 text-accent" />
              {phone.display}
            </a>
            <Button className="mt-5 w-full" onClick={() => openLead(svc.title)}>Узнать цену</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
