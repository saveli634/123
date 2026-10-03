import { CONFIG } from "@/config";
import { Photo } from "./Photo";
import { Lines } from "./Lines";
import { T } from "@/content/copy";
import { hasPhone, hasWhatsapp, callHref, waHref, extProps, PRICE_TEXT } from "@/lib/links";
import type { ImgName } from "@/content/media";

/**
 * «Что делаем». Пока CONFIG.services пуст — только три подтверждённых кадрами направления.
 * С заполненным списком — строки «название — цена» (без цены — «по запросу»).
 */
export function Services() {
  const priceHref = hasWhatsapp ? waHref(PRICE_TEXT) : hasPhone ? callHref : "#booking";
  // Кадры, которые не стоят на первом экране; для макияжа — крупный план лица (деталь, а не тот же портрет).
  const cards: { title: string; line: string; photo: ImgName; alt: string; zoom: number; origin: string }[] = [
    { title: "Макияж", line: "От первого штриха", photo: "guest_a_01", alt: "Макияж крупным планом, салон Queen Bee", zoom: 2.1, origin: "49% 24%" },
    { title: "Причёски и укладка", line: T.hairLine, photo: "guest_b_04", alt: "Локоны крупным планом, салон Queen Bee", zoom: 2, origin: "70% 80%" },
    { title: "Полный beauty‑образ", line: "До финального акцента", photo: "guest_c_02", alt: "Полный образ гостьи салона Queen Bee", zoom: 1.45, origin: "55% 26%" },
  ];

  return (
    <section id="services" className="services" aria-labelledby="services-title">
      <div className="wrap">
        <div className="services__head">
          <p className="eyebrow">Что делаем</p>
          <Lines as="h2" id="services-title" className="h2" text="Макияж, причёски и полный образ" />
        </div>
        {CONFIG.services.length === 0 ? (
          <ol className="svc">
            {cards.map((c, i) => (
              <li key={c.title} className="svc__item" data-reveal style={{ transitionDelay: `${i * 110}ms` }}>
                <div className="svc__arch" data-tilt>
                  <Photo
                    name={c.photo}
                    alt={c.alt}
                    sizes="(max-width: 767px) 100vw, 50vw"
                    style={{ transform: `scale(${c.zoom})`, transformOrigin: c.origin }}
                  />
                  <span className="glint" aria-hidden="true" />
                </div>
                <p className="svc__num">0{i + 1}</p>
                <h3 className="svc__title">{c.title}</h3>
                <p className="svc__line">{c.line}</p>
              </li>
            ))}
          </ol>
        ) : (
          <ul className="price">
            {CONFIG.services.map((s) => (
              <li key={s.name} className="price__row" data-reveal>
                <span className="price__name">{s.name}</span>
                <span className="price__dots" aria-hidden="true" />
                <span className="price__val">{s.price?.trim() || "по запросу"}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="services__foot" data-reveal>
          <p>{T.pricesLine}</p>
          <a href={priceHref} className="btn btn--wine" data-magnetic {...extProps(priceHref)}>
            Узнать цену
          </a>
        </div>
      </div>
    </section>
  );
}
