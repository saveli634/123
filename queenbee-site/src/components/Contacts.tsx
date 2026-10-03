import { useState, type FormEvent } from "react";
import { CONFIG } from "@/config";
import { T } from "@/content/copy";
import { Lines } from "./Lines";
import { Photo } from "./Photo";
import { hasPhone, hasWhatsapp, hasInstagram, callHref, waHref, waSend, extProps, GREETING } from "@/lib/links";

const WANTS = ["Макияж", "Причёски и укладка", "Полный beauty‑образ"];

/**
 * Запись и контакты. Форма без сервера: собирает сообщение и открывает WhatsApp.
 * Контакты — только заполненные в CONFIG; пустые строки не рисуются.
 */
export function Contacts() {
  const [want, setWant] = useState<string[]>([]);
  const [err, setErr] = useState<Record<string, string>>({});

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") || "").trim();
    const phone = String(f.get("phone") || "").trim();
    const note = String(f.get("note") || "").trim();
    const next: Record<string, string> = {};
    if (!name) next.name = "Как к вам обращаться?";
    if (phone.replace(/\D/g, "").length < 7) next.phone = "Оставьте номер, чтобы мастер мог ответить";
    if (!want.length && !note) next.want = "Выберите услугу или напишите пару слов";
    setErr(next);
    if (Object.keys(next).length) {
      e.currentTarget.querySelector<HTMLElement>(`[name="${Object.keys(next)[0] === "want" ? "note" : Object.keys(next)[0]}"]`)?.focus();
      return;
    }
    const text = [GREETING, `Имя: ${name}`, `Телефон: ${phone}`, `Хочу: ${[...want, note].filter(Boolean).join(", ")}`].join("\n");
    window.open(waSend(text), "_blank", "noopener");
  };

  const rows: { label: string; value: string; href?: string }[] = [];
  if (hasPhone) rows.push({ label: "Телефон", value: CONFIG.phone, href: callHref });
  if (hasWhatsapp) rows.push({ label: "WhatsApp", value: "Написать в WhatsApp", href: waHref(GREETING) });
  if (CONFIG.address.trim()) rows.push({ label: "Адрес", value: [CONFIG.city, CONFIG.address].filter(Boolean).join(", ") });
  if (CONFIG.workHours.trim()) rows.push({ label: "Часы", value: CONFIG.workHours });
  if (CONFIG.mapLink.trim()) rows.push({ label: "Маршрут", value: "Построить маршрут", href: CONFIG.mapLink });
  if (hasInstagram) rows.push({ label: "Instagram", value: "Смотреть работы", href: CONFIG.instagram });

  return (
    <section id="contacts" className="contacts" aria-labelledby="contacts-title">
      <div className="contacts__glass" aria-hidden="true" />
      <div className="wrap contacts__grid">
        <div className="contacts__intro">
          <p className="eyebrow">Запись</p>
          <Lines as="h2" id="contacts-title" className="h2" text={T.meet} />
          {rows.length < 3 && (
            <figure className="contacts__room">
              <div className="room__frame">
                <Photo name="lobby_chandelier" alt="Холл салона Queen Bee" sizes="280px" />
              </div>
              <figcaption>Холл</figcaption>
            </figure>
          )}
          {rows.length > 0 && (
            <dl className="contacts__list">
              {rows.map((r) => (
                <div key={r.label} className="contacts__row">
                  <dt>{r.label}</dt>
                  <dd>
                    {r.href ? (
                      <a href={r.href} className="ulink" {...extProps(r.href)}>
                        {r.value}
                      </a>
                    ) : (
                      r.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <form id="booking" className="form" onSubmit={onSubmit} noValidate aria-labelledby="form-title">
          <p id="form-title" className="form__title">
            Записаться
          </p>
          <label className="field">
            <span className="field__label">Имя</span>
            <input name="name" autoComplete="name" data-autofocus aria-invalid={!!err.name} aria-describedby={err.name ? "e-name" : undefined} />
            {err.name && (
              <span className="field__err" id="e-name">
                {err.name}
              </span>
            )}
          </label>
          <label className="field">
            <span className="field__label">Телефон</span>
            <input name="phone" type="tel" inputMode="tel" autoComplete="tel" aria-invalid={!!err.phone} aria-describedby={err.phone ? "e-phone" : undefined} />
            {err.phone && (
              <span className="field__err" id="e-phone">
                {err.phone}
              </span>
            )}
          </label>
          <fieldset className="field field--chips">
            <legend className="field__label">Что хотите сделать</legend>
            <div className="chips">
              {WANTS.map((w) => (
                <button
                  key={w}
                  type="button"
                  className="chip"
                  aria-pressed={want.includes(w)}
                  onClick={() => setWant((v) => (v.includes(w) ? v.filter((x) => x !== w) : [...v, w]))}
                >
                  {w}
                </button>
              ))}
            </div>
            <input name="note" className="field__note" placeholder="или своими словами" aria-label="Что хотите сделать — своими словами" aria-describedby={err.want ? "e-want" : undefined} />
            {err.want && (
              <span className="field__err" id="e-want">
                {err.want}
              </span>
            )}
          </fieldset>
          <button type="submit" className="btn btn--wine form__send" data-magnetic>
            Записаться
          </button>
          <p className="form__note">Сообщение откроется в WhatsApp — останется только отправить.</p>
        </form>
      </div>
    </section>
  );
}
