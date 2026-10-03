import type { ReactNode } from "react";
import { contact as t, buttons } from "@/content/text";
import { site, telHref, waHref, fieldNames, DEMO } from "@/lib/site";
import { Bee } from "@/components/shared/Bee";
import { FillPlate } from "@/components/shared/Fill";
import { BookButton, CallButton, WhatsAppButton } from "@/components/shared/Buttons";

/** Строка контакта: пусто → не выводится (в демо — плашка «ЗАПОЛНИТЬ»). */
function Row({ label, value, field, children }: { label: string; value: string; field: keyof typeof fieldNames; children?: ReactNode }) {
  if (!value && !DEMO) return null;
  return (
    <div className="glow reveal grid gap-2 border-b border-gold/50 px-1 py-6 md:grid-cols-[11rem_1fr] md:items-baseline md:gap-8">
      <dt className="label text-ink-soft">{label}</dt>
      <dd className="m-0">{value ? children : <FillPlate field={fieldNames[field]} />}</dd>
    </div>
  );
}

const big = "display text-[clamp(1.45rem,2.3vw,1.95rem)] leading-tight text-espresso";

export function Contact() {
  const place = [site.city, site.address].filter(Boolean).join(", ");
  return (
    <section id="zapis" className="tone-milk section-y relative overflow-hidden" data-tone="milk" aria-labelledby="contact-title">
      <div aria-hidden="true" className="honeycomb" style={{ opacity: 0.04 }} />
      <span aria-hidden="true" className="flare" style={{ width: "40vmax", height: "40vmax", left: "-16%", bottom: "-20%" }} />
      <div className="container-x grid-12 relative gap-y-14">
        <div className="col-span-12 lg:col-span-5">
          <p className="label eyebrow eyebrow-gold reveal text-espresso">06 — {t.label}</p>
          <h2 id="contact-title" className="display mt-8 text-[clamp(3.2rem,8vw,7.2rem)] leading-[0.92] text-espresso">
            <span className="line-mask">
              <span>{t.title}</span>
            </span>
          </h2>
          <Bee fly className="reveal mt-6 size-12" />
          <div className="reveal mt-10 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-start" style={{ ["--delay" as string]: "120ms" }}>
            <BookButton />
            <WhatsAppButton />
            <CallButton />
          </div>
        </div>
        <dl className="col-span-12 m-0 border-t border-gold/50 lg:col-span-6 lg:col-start-7">
          <Row label={t.phone} value={site.phone} field="phone">
            <a href={telHref} className={`${big} link-thread`}>
              {site.phone}
            </a>
          </Row>
          <Row label={t.whatsapp} value={site.whatsapp} field="whatsapp">
            <a href={waHref()} target="_blank" rel="noopener noreferrer" className={`${big} link-thread`}>
              {site.whatsapp}
            </a>
          </Row>
          {(place || DEMO) && (
          <div className="glow reveal grid gap-2 border-b border-gold/50 px-1 py-6 md:grid-cols-[11rem_1fr] md:items-baseline md:gap-8">
            <dt className="label text-ink-soft">{t.address}</dt>
            <dd className="m-0">
              {place && <p className={big}>{place}</p>}
              <span className="flex flex-wrap gap-2">
                {!site.city && <FillPlate field={fieldNames.city} className={place ? "mt-3" : ""} />}
                {!site.address && <FillPlate field={fieldNames.address} className={place ? "mt-3" : ""} />}
              </span>
              {site.mapLink ? (
                <a href={site.mapLink} target="_blank" rel="noopener noreferrer" className="label link-thread mt-4 inline-block text-bordo">
                  {buttons.route}
                </a>
              ) : (
                <FillPlate field={fieldNames.mapLink} className="mt-3" />
              )}
            </dd>
          </div>
          )}
          <Row label={t.hours} value={site.workHours} field="workHours">
            <p className={big}>{site.workHours}</p>
          </Row>
          <Row label={t.instagram} value={site.instagram} field="instagram">
            <a href={site.instagram} target="_blank" rel="noopener noreferrer" className={`${big} link-thread`}>
              {site.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@").replace(/\/$/, "")}
            </a>
          </Row>
        </dl>
      </div>
    </section>
  );
}
