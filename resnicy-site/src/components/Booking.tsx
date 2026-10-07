import { BrandMark } from "./Brand";
import { Silk } from "./Silk";
import { Split } from "./Split";
import { ChannelIcon, MagLink } from "./Buttons";
import { bookingChannels, site } from "@/site.config";

/** Запись: кнопки-ссылки на заполненные каналы. Адрес и цены выводятся, только когда они заполнены. */
export function Booking() {
  const channels = bookingChannels();
  return (
    <section className="booking section" id="zapis" aria-labelledby="booking-title">
      <div className="booking-bg" aria-hidden="true">
        <Silk className="booking-silk" mood={0.85} />
        <BrandMark decorative className="booking-watermark" />
      </div>
      <div className="container booking-inner">
        <p className="eyebrow" data-reveal>
          <span className="eyebrow-num">07</span>Запись
        </p>
        <Split as="h2" id="booking-title" className="booking-title" text="Запишись *на реснички*" />
        <p className="booking-lead" data-reveal>
          Напиши мне — договоримся о дне и времени.
        </p>
        {channels.length > 0 && (
          <div className="booking-actions" data-reveal>
            {channels.map((c, i) => (
              <MagLink key={c.id} href={c.href} external={c.id !== "phone"} variant={i === 0 ? "light" : "ghost"} shine={i === 0} icon={<ChannelIcon id={c.id} />}>
                {c.label}
              </MagLink>
            ))}
          </div>
        )}
        <p className="booking-city" data-reveal>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          {site.city}
        </p>

        {(site.address || site.prices.length > 0) && (
          <div className="booking-extra">
            {site.address && (
              <div className="booking-block" data-reveal>
                <h3 className="booking-block-title">Где принимаю</h3>
                <p>{site.address}</p>
              </div>
            )}
            {site.prices.length > 0 && (
              <div className="booking-block" data-reveal>
                <h3 className="booking-block-title">Цены</h3>
                <ul className="prices">
                  {site.prices.map((p) => (
                    <li key={p.name}>
                      <span className="prices-name">
                        {p.name}
                        {p.note && <small>{p.note}</small>}
                      </span>
                      <span className="prices-dots" aria-hidden="true" />
                      <span className="prices-value">{p.price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
