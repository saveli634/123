import type { CSSProperties, ReactNode } from "react";
import { cityFor, useLang, useT } from "@/lib/lang";
import { CONFIG } from "@/config";
import { digits, instagramHref, mapHref, telHref, waHref } from "@/lib/links";
import { Frame } from "@/components/Frame";
import { Kicker, Lines } from "@/components/Text";
import { Btn } from "@/components/Cta";
import { Lion } from "@/components/Lion";
import { IconArrow, IconArrowUp, IconChat, IconPhone, IconRoute } from "@/components/Icons";

function Row({ label, children, action }: { label: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="contact-row fade-up">
      <p className="t-label text-muted">{label}</p>
      <div className="contact-value">{children}</div>
      {action && <div className="contact-action">{action}</div>}
    </div>
  );
}

/**
 * Контакты и запись: всё из CONFIG; пустое поле → строки нет. Пока не указаны ни телефон, ни WhatsApp,
 * ни Instagram — одна спокойная строка «Контакты появятся в финальной версии после согласования».
 */
export function Contacts({ onBook }: { onBook: () => void }) {
  const { t, lang } = useLang();
  const tel = telHref();
  const wa = waHref();
  const insta = instagramHref();
  const route = mapHref();
  const city = cityFor(lang);
  const address = CONFIG.address.trim();
  const hours = CONFIG.workHours.trim();
  const pending = !tel && !wa && !insta;

  return (
    <section id="contacts" className="section contacts" aria-labelledby="contacts-title">
      <div className="contacts-bg" aria-hidden="true">
        <Frame name="garage_lift_wide" fill decorative className="no-border" sizes="100vw" />
      </div>
      <div className="wrap relative">
        <Kicker>{t.contacts.label}</Kicker>
        <Lines id="contacts-title" lines={t.contacts.title} className="t-title mt-6" />
      </div>
      <div className="wrap relative grid-12 mt-[7vh] gap-y-12">
        <div className="col-span-12 lg:col-span-4">
          <div data-reveal="">
            {wa && <p className="fade-up t-body mb-7 max-w-sm">{t.contacts.bookText}</p>}
            <div className="fade-up" style={{ "--d": 120 } as CSSProperties}>
              <Btn onClick={onBook} variant="gold" iconEnd={<IconArrow />}>
                {t.cta.book}
              </Btn>
            </div>
            {tel && (
              <p className="fade-up t-label mt-8 text-muted" style={{ "--d": 200 } as CSSProperties}>
                {t.contacts.note}
              </p>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 lg:col-start-6" data-reveal="">
          <Row
            label={address ? t.contacts.address : t.contacts.city}
            action={
              route && (
                <Btn href={route} external variant="line" size="sm" icon={<IconRoute />}>
                  {t.cta.route}
                </Btn>
              )
            }
          >
            <span>
              {[address, city].filter(Boolean).join(", ") || t.contacts.country}
              {(address || city) && <span className="text-muted">, {t.contacts.country}</span>}
            </span>
          </Row>
          {tel && (
            <Row
              label={t.contacts.phone}
              action={
                <Btn href={tel} variant="line" size="sm" icon={<IconPhone />}>
                  {t.cta.call}
                </Btn>
              }
            >
              <a href={tel}>{CONFIG.phone}</a>
            </Row>
          )}
          {wa && (
            <Row
              label={t.contacts.whatsapp}
              action={
                <Btn href={wa} external variant="line" size="sm" icon={<IconChat />}>
                  {t.cta.whatsappShort}
                </Btn>
              }
            >
              <a href={wa} target="_blank" rel="noopener noreferrer">
                +{digits(CONFIG.whatsapp)}
              </a>
            </Row>
          )}
          {hours && (
            <Row label={t.contacts.hours}>
              <span>{hours}</span>
            </Row>
          )}
          {insta && (
            <Row label={t.contacts.instagram}>
              <a href={insta} target="_blank" rel="noopener noreferrer">
                {insta.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
              </a>
            </Row>
          )}
          {pending && (
            <div className="contact-pending fade-up" style={{ "--d": 120 } as CSSProperties}>
              <Lion className="h-7 w-7 flex-none text-gold" />
              <p>{t.contacts.demo}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const t = useT();
  const insta = instagramHref();
  return (
    <footer className="footer">
      <div className="wrap grid-12 gap-y-10 py-16 md:py-20">
        <div className="col-span-12 flex items-center gap-4 md:col-span-5">
          <Lion className="h-14 w-14 text-gold" />
          <div>
            <p className="font-display text-2xl font-semibold" translate="no">
              Carleone Service
            </p>
            <p className="t-label mt-1 text-muted">{t.footer.country}</p>
          </div>
        </div>
        <div className="col-span-12 flex flex-wrap items-center gap-4 md:col-span-7 md:justify-end">
          {insta && (
            <Btn href={insta} external variant="ghost" size="sm" iconEnd={<IconArrow />}>
              Instagram
            </Btn>
          )}
          <Btn href="#top" variant="ghost" size="sm" iconEnd={<IconArrowUp />}>
            {t.footer.top}
          </Btn>
        </div>
        <div className="hairline col-span-12" />
        <p className="col-span-12 max-w-2xl text-[0.8125rem] leading-relaxed text-muted md:col-span-8">
          {t.footer.scheme}
        </p>
        <p className="t-label col-span-12 text-muted md:col-span-4 md:text-right">© {CONFIG.name}</p>
      </div>
    </footer>
  );
}
