import { channels, hasBooking, portrait, site, fullName } from "@/data/site.config";
import { Btn, Eyebrow } from "./ui";
import { SPARKLE } from "./glyphs";

const ICONS: Record<string, string> = {
  instagram: "M7.5 3.5h9a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4h-9a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4zM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM17.3 6.7v.01",
  telegram: "M21 4.5L3 11.4l6.3 2.2L18 7.2l-6.6 7.6.2 5.2 3.1-3.6 4.1 3.1z",
  whatsapp: "M4 20l1.3-4.2A8 8 0 1 1 8.4 19zM9 8.5c0 3.5 3 6.5 6.5 6.5l1.5-1.6-2.2-1-1 1c-1.2-.5-2.2-1.5-2.7-2.7l1-1-1-2.2z",
  phone: "M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z",
};

/** «Записаться»: показывается, только если заполнен хотя бы один канал записи (site.config.ts). */
export function Booking() {
  if (!hasBooking) return null;
  return (
    <section id="zapis" className="book section" aria-labelledby="book-title">
      <div className="wrap">
        <div className="book__card rv">
          <div className="book__eclipse" aria-hidden="true">
            <i />
          </div>
          {portrait && (
            <figure className="book__portrait">
              <img src={portrait} alt={`${fullName}`} width="320" height="320" loading="lazy" decoding="async" />
            </figure>
          )}
          <Eyebrow>Запись</Eyebrow>
          <h2 id="book-title" className="h2 book__title">
            Записаться <em>на расчёт</em>
          </h2>
          <p className="book__lead">
            Для натальной карты понадобятся число, месяц, год, город и время рождения. Если точное время неизвестно, могу вычислить его при помощи ректификации.
          </p>
          <div className="book__actions">
            {channels.map((c, i) => (
              <Btn
                key={c.id}
                href={c.href}
                external={c.id !== "phone"}
                variant={i === 0 ? "primary" : "ghost"}
                icon={
                  <svg viewBox="0 0 24 24" className="btn__icon" aria-hidden="true">
                    <path d={ICONS[c.id]} />
                  </svg>
                }
              >
                {c.label}
              </Btn>
            ))}
          </div>
          {site.city && (
            <p className="book__city">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={SPARKLE} />
              </svg>
              {site.city}
            </p>
          )}
          {site.prices && site.prices.length > 0 && (
            <div className="prices">
              <h3 className="prices__title">Цены</h3>
              <ul>
                {site.prices.map((p) => (
                  <li key={p.name}>
                    <span>{p.name}</span>
                    <i aria-hidden="true" />
                    <span className="prices__v">{p.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
