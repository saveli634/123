import { CONTACTS, FILL, SITE } from "@/content/copy";
import { Lines } from "@/components/shared/Lines";
import { SecLabel } from "@/components/shared/Glyphs";
import { Cta, BookButton } from "@/components/shared/Cta";
import { Fill } from "@/components/shared/Fill";
import { field } from "@/lib/env";
import { fullAddress, telHref, waHref } from "@/lib/links";

/** Контакты и запись — всё из CONFIG; пустое поле в демо показано плашкой «ЗАПОЛНИТЬ». */
function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="ct-row rv up">
      <dt className="label">{k}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function Contacts() {
  const phone = field("phone");
  const wa = field("whatsapp");
  const addr = fullAddress();
  const hours = field("workHours");
  const insta = field("instagram");
  return (
    <section id="kontakty" className="sec ct" aria-labelledby="ct-title">
      <div className="wrap">
        <SecLabel n={9} total={9}>
          {CONTACTS.label}
        </SecLabel>
        <Lines id="ct-title" className="display h-sec ct-h" lines={CONTACTS.titleLines} />
        <div className="ct-grid">
          <dl className="ct-list">
            <Row k={CONTACTS.phone}>
              {phone ? (
                <a href={telHref()} className="ct-v uline num" data-cursor="link">
                  {phone}
                </a>
              ) : (
                <Fill what={FILL.phone} />
              )}
            </Row>
            <Row k={CONTACTS.whatsapp}>
              {wa ? (
                <a href={waHref()} target="_blank" rel="noopener noreferrer" className="ct-v uline num" data-cursor="link">
                  {wa}
                </a>
              ) : (
                <Fill what={FILL.whatsapp} />
              )}
            </Row>
            <Row k={CONTACTS.address}>
              {addr ? <span className="ct-v">{addr}</span> : <span className="ct-v ct-city">{SITE.city}, {SITE.country}</span>}
              {!addr && <Fill what={FILL.address} className="ct-fill" />}
            </Row>
            <Row k={CONTACTS.hours}>{hours ? <span className="ct-v">{hours}</span> : <Fill what={FILL.workHours} />}</Row>
            {insta && (
              <Row k={CONTACTS.instagram}>
                <a href={insta} target="_blank" rel="noopener noreferrer" className="ct-v uline" data-cursor="link" translate="no">
                  {insta.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              </Row>
            )}
          </dl>
          <div className="ct-actions rv up">
            <BookButton size="lg" />
            <Cta kind="call" size="lg" variant="outline" />
            <Cta kind="whatsapp" size="lg" variant="outline" />
            <Cta kind="route" size="lg" variant="outline" />
          </div>
        </div>
      </div>
    </section>
  );
}
