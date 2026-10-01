import { MapPin, Navigation, Phone } from "lucide-react";
import { site, whatsapp } from "@/data/site.config";
import { LeadForm } from "@/components/shared/LeadForm";
import { SpecTable } from "@/components/shared/SpecTable";
import { WhatsAppIcon } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";

export function Contact() {
  return (
    <section id="kontakty" tabIndex={-1} aria-labelledby="contact-title" className="paper section-y">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-5">
          <p className="eyebrow reveal text-paper-muted">Контакты</p>
          <h2 id="contact-title" className="display mt-4 text-[clamp(2.3rem,5.4vw,4.6rem)]">
            <span className="line-mask"><span>Как нас найти</span></span>
          </h2>
          <SpecTable
            tone="paper"
            className="reveal mt-8"
            rows={[
              { label: "Адрес", value: <span className="font-sans">{site.city}, {site.street}</span> },
              { label: "Телефон", value: <a href={`tel:${site.phone.tel}`} className="underline decoration-paper-ink/30 underline-offset-4 hover:decoration-paper-ink">{site.phone.display}</a> },
              { label: "Часы работы", value: <span className="font-sans">{site.hoursNote}</span> },
            ]}
          />
          <div className="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild variant="dark" size="lg" className="h-auto min-h-14 w-full px-4 py-3 text-center whitespace-normal sm:w-auto sm:px-7 sm:whitespace-nowrap">
              <a href={site.maps.google} target="_blank" rel="noopener">
                <Navigation aria-hidden="true" className="size-5" />
                Построить маршрут
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto min-h-14 w-full px-4 py-3 text-center whitespace-normal sm:w-auto sm:px-7 sm:whitespace-nowrap">
              <a href={whatsapp()} target="_blank" rel="noopener">
                <WhatsAppIcon className="size-5" />
                Написать в WhatsApp
              </a>
            </Button>
          </div>
          <p className="reveal mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-paper-muted">
            <MapPin aria-hidden="true" className="size-4" />
            <a href={site.maps.twoGis} target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-paper-ink">Открыть в 2ГИС</a>
            <a href={`tel:${site.phone.tel}`} className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-paper-ink">
              <Phone aria-hidden="true" className="size-4" />Позвонить
            </a>
          </p>
        </div>
        <div className="reveal min-w-0 rounded-[3px] border border-paper-ink/15 bg-white/50 p-5 sm:p-8 lg:col-span-6 lg:col-start-7">
          <h3 className="display text-[1.8rem]">Заявка</h3>
          <p className="mt-2 mb-6 text-paper-muted">Имя, телефон и услуга — этого достаточно.</p>
          <LeadForm tone="paper" />
        </div>
      </div>
    </section>
  );
}
