import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useLang, useT } from "@/lib/lang";
import { CONFIG } from "@/config";
import { digits, instagramHref, mapHref, telHref, waHref } from "@/lib/links";
import { cn } from "@/lib/cn";
import { Frame } from "@/components/Frame";
import { Kicker, Lines } from "@/components/Text";
import { Btn, Fill } from "@/components/Cta";
import { Lion } from "@/components/Lion";
import { IconArrow, IconArrowUp, IconChat, IconClose, IconPhone, IconRoute } from "@/components/Icons";

function Row({ label, children, action }: { label: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="contact-row fade-up">
      <p className="t-label text-muted">{label}</p>
      <div className="contact-value">{children}</div>
      {action && <div className="contact-action">{action}</div>}
    </div>
  );
}

/** Контакты и запись: всё из CONFIG; пустое поле → плашка «ЗАПОЛНИТЬ» (демо) или ничего (релиз). */
export function Contacts({ onBook }: { onBook: () => void }) {
  const t = useT();
  const tel = telHref();
  const wa = waHref();
  const insta = instagramHref();
  const route = mapHref();
  const city = CONFIG.city.trim();
  const address = CONFIG.address.trim();
  const hours = CONFIG.workHours.trim();

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
            <p className="fade-up t-body max-w-sm">{t.contacts.bookText}</p>
            <div className="fade-up mt-7" style={{ "--d": 120 } as CSSProperties}>
              <Btn onClick={onBook} variant="gold" iconEnd={<IconArrow />}>
                {t.cta.book}
              </Btn>
            </div>
            <p className="fade-up t-label mt-8 text-muted" style={{ "--d": 200 } as CSSProperties}>
              {t.contacts.note}
            </p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 lg:col-start-6" data-reveal="">
          {(tel || __DEMO__) && (
            <Row
              label={t.contacts.phone}
              action={
                tel && (
                  <Btn href={tel} variant="line" size="sm" icon={<IconPhone />}>
                    {t.cta.call}
                  </Btn>
                )
              }
            >
              {tel ? <a href={tel}>{CONFIG.phone}</a> : <Fill field="phone" inline />}
            </Row>
          )}
          {(wa || __DEMO__) && (
            <Row
              label={t.contacts.whatsapp}
              action={
                wa && (
                  <Btn href={wa} external variant="line" size="sm" icon={<IconChat />}>
                    {t.cta.whatsappShort}
                  </Btn>
                )
              }
            >
              {wa ? (
                <a href={wa} target="_blank" rel="noopener noreferrer">
                  +{digits(CONFIG.whatsapp)}
                </a>
              ) : (
                <Fill field="whatsapp" inline />
              )}
            </Row>
          )}
          <Row
            label={t.contacts.address}
            action={
              route ? (
                <Btn href={route} external variant="line" size="sm" icon={<IconRoute />}>
                  {t.cta.route}
                </Btn>
              ) : (
                <Fill field="mapLink" label={t.cta.route} size="sm" />
              )
            }
          >
            <span>
              {[address, city].filter(Boolean).join(", ") || (__DEMO__ ? "" : t.contacts.country)}
              {(address || city) && <span className="text-muted">, {t.contacts.country}</span>}
            </span>
            {!address && <Fill field="address" inline className="mr-2 mt-2" />}
            {!city && <Fill field="city" inline className="mt-2" />}
          </Row>
          {(hours || __DEMO__) && (
            <Row label={t.contacts.hours}>{hours ? <span>{hours}</span> : <Fill field="workHours" inline />}</Row>
          )}
          {(insta || __DEMO__) && (
            <Row label={t.contacts.instagram}>
              {insta ? (
                <a href={insta} target="_blank" rel="noopener noreferrer">
                  {insta.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              ) : (
                <Fill field="instagram" inline />
              )}
            </Row>
          )}
        </div>
      </div>
    </section>
  );
}

/** Форма «Записаться»: собирает текст и открывает https://wa.me/…?text=… — без сервера. */
export function BookingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, lang } = useLang();
  const f = t.form;
  const [err, setErr] = useState<{ name?: string; phone?: string }>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const wa = waHref();
  const tel = telHref();

  useEffect(() => {
    if (!open) setErr({});
  }, [open]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const car = String(data.get("car") || "").trim();
    const problem = String(data.get("problem") || "").trim();
    const next: typeof err = {};
    if (!name) next.name = f.errName;
    if (digits(phone).length < 10) next.phone = f.errPhone;
    setErr(next);
    if (next.name || next.phone) {
      (e.currentTarget.elements.namedItem(next.name ? "name" : "phone") as HTMLInputElement | null)?.focus();
      return;
    }
    const text = [
      f.msgHello,
      `${f.msgName}: ${name}`,
      `${f.msgPhone}: ${phone}`,
      car && `${f.msgCar}: ${car}`,
      problem && `${f.msgProblem}: ${problem}`,
    ]
      .filter(Boolean)
      .join("\n");
    const href = waHref(text);
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog"
          data-lenis-prevent=""
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            nameRef.current?.focus();
          }}
          lang={lang}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lion className="h-9 w-9 text-gold" />
              <Dialog.Title className="font-display text-3xl font-semibold md:text-4xl">{f.title}</Dialog.Title>
            </div>
            <Dialog.Close
              className="grid size-10 place-items-center rounded-full border border-[var(--line)] text-cream/80 transition-colors hover:border-gold hover:text-gold"
              aria-label={t.a11y.close}
            >
              <IconClose className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="t-body mt-4 text-[0.95rem]">{f.lead}</Dialog.Description>
          <form className="mt-7 flex flex-col gap-5" noValidate onSubmit={submit}>
            <div className="field" data-invalid={err.name ? "" : undefined}>
              <label htmlFor="bk-name">{f.name}</label>
              <input
                ref={nameRef}
                id="bk-name"
                name="name"
                autoComplete="name"
                placeholder={f.namePh}
                aria-invalid={!!err.name}
                aria-describedby={err.name ? "bk-name-err" : undefined}
              />
              {err.name && (
                <p id="bk-name-err" className="field-err">
                  {err.name}
                </p>
              )}
            </div>
            <div className="field" data-invalid={err.phone ? "" : undefined}>
              <label htmlFor="bk-phone">{f.phone}</label>
              <input
                id="bk-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={f.phonePh}
                aria-invalid={!!err.phone}
                aria-describedby={err.phone ? "bk-phone-err" : undefined}
              />
              {err.phone && (
                <p id="bk-phone-err" className="field-err">
                  {err.phone}
                </p>
              )}
            </div>
            <div className="field">
              <label htmlFor="bk-car">{f.car}</label>
              <input id="bk-car" name="car" autoComplete="off" placeholder={f.carPh} />
            </div>
            <div className="field">
              <label htmlFor="bk-problem">{f.problem}</label>
              <textarea id="bk-problem" name="problem" placeholder={f.problemPh} rows={3} />
            </div>
            {wa ? (
              <Btn type="submit" variant="gold" icon={<IconChat />} className="mt-2 w-full" magnetic={false}>
                {f.submit}
              </Btn>
            ) : (
              <div className={cn("mt-2 flex flex-col gap-3")}>
                <p className="t-body text-[0.9rem] text-cream/70">{f.noWhatsapp}</p>
                <Fill field="whatsapp" label={f.submit} className="w-full" />
                {tel && (
                  <Btn href={tel} variant="line" icon={<IconPhone />} className="w-full">
                    {t.cta.call}
                  </Btn>
                )}
              </div>
            )}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
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
            <p className="font-display text-2xl font-semibold">Carleone Service</p>
            <p className="t-label mt-1 text-muted">{t.footer.country}</p>
          </div>
        </div>
        <div className="col-span-12 flex flex-wrap items-center gap-4 md:col-span-7 md:justify-end">
          {insta ? (
            <Btn href={insta} external variant="ghost" size="sm" iconEnd={<IconArrow />}>
              Instagram
            </Btn>
          ) : (
            <Fill field="instagram" label="Instagram" size="sm" />
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
