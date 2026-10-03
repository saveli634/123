import type { CSSProperties } from "react";
import { DICT } from "@/content/i18n";
import { useLang } from "@/lib/lang";
import { CONFIG } from "@/config";
import { Kicker, q, Rich } from "@/components/Text";
import { WhatsAppButton } from "@/components/Cta";
import { Lion } from "@/components/Lion";

/**
 * Схема маршрутов (не карта): Германия, Франция, Бельгия → Казахстан → Япония. Дуги рисуются при
 * появлении. only — одна страна отправления (кейс «Бельгия → Казахстан → Япония»).
 */
export function RouteMap({ only }: { only?: string }) {
  const from = (
    [
      ["FR", 40, 118],
      ["BE", 78, 70],
      ["DE", 112, 96],
    ] as [string, number, number][]
  ).filter(([code]) => !only || code === only);
  const KZ: [number, number] = [372, 104];
  const JP: [number, number] = [612, 84];
  const arc = ([x1, y1]: [number, number], [x2, y2]: [number, number], h: number) =>
    `M${x1} ${y1}Q${(x1 + x2) / 2} ${Math.min(y1, y2) - h} ${x2} ${y2}`;
  return (
    <svg viewBox="0 0 660 160" className="route-map" aria-hidden="true" focusable="false">
      {from.map(([code, x, y], i) => (
        <path
          key={code}
          className="arc"
          pathLength={1}
          d={arc([x, y], KZ, 70 + i * 12)}
          style={{ "--i": i } as CSSProperties}
        />
      ))}
      <path className="arc" pathLength={1} d={arc(KZ, JP, 64)} style={{ "--i": 3 } as CSSProperties} />
      {from.map(([code, x, y]) => (
        <g key={code}>
          <circle className="pt" cx={x} cy={y} r="3" />
          <text x={x} y={y + 22} textAnchor="middle">
            {code}
          </text>
        </g>
      ))}
      <circle cx={KZ[0]} cy={KZ[1]} r="17" fill="#0a0809" stroke="#e3c182" strokeWidth="1.2" />
      <svg x={KZ[0] - 11} y={KZ[1] - 11.5} width="22" height="23" viewBox="0 0 585 606" fill="#e3c182">
        <use href="#lion" xlinkHref="#lion" />
      </svg>
      <text x={KZ[0]} y={KZ[1] + 38} textAnchor="middle">
        KZ
      </text>
      <circle className="pt" cx={JP[0]} cy={JP[1]} r="3" />
      <text x={JP[0]} y={JP[1] + 22} textAnchor="middle">
        JP
      </text>
    </svg>
  );
}

/**
 * «Гостям из-за границы / For travellers» — двуязычный блок: русский текст и его перевод
 * рядом, независимо от выбранного языка сайта (первым — язык сайта). Английский — перевод того же
 * текста (подпись 005), без новых утверждений.
 */
export function Travellers() {
  const { t, lang } = useLang();
  const ru = DICT.ru.travellers;
  const en = DICT.en.travellers;
  const blocks = [
    { code: "ru", text: `«${ru.text}»` },
    { code: "en", text: `“${en.text}”` },
  ];
  if (lang === "en") blocks.reverse();
  return (
    <section className="section travellers" aria-labelledby="travellers-title">
      <Lion className="travellers-mark" />
      <div className="wrap relative">
        <Kicker>{lang === "en" ? `${en.label} / ${ru.label}` : `${ru.label} / ${en.label}`}</Kicker>
        <h2 id="travellers-title" className="t-title mt-6" data-reveal="">
          <span className="ln" lang={lang}>
            <span style={{ "--i": 0 } as CSSProperties}>
              <Rich text={t.travellers.title.join(" ")} />
            </span>
          </span>
          <span className="ln travellers-alt" lang={lang === "en" ? "ru" : "en"}>
            <span style={{ "--i": 1 } as CSSProperties}>{lang === "en" ? ru.label : en.label}</span>
          </span>
        </h2>

        <div className="grid-12 mt-[7vh] items-start gap-y-10" data-reveal="">
          <figure className="fade-up col-span-12 md:col-span-7" lang={blocks[0].code}>
            <p className="t-label mb-5 text-gold">{blocks[0].code.toUpperCase()}</p>
            <blockquote className="t-quote travellers-main">{blocks[0].text}</blockquote>
          </figure>
          <figure
            className="fade-up col-span-12 md:col-span-4 md:col-start-9"
            lang={blocks[1].code}
            style={{ "--d": 140 } as CSSProperties}
          >
            <p className="t-label mb-5 text-muted">{blocks[1].code.toUpperCase()}</p>
            <blockquote className="travellers-second">{blocks[1].text}</blockquote>
          </figure>
        </div>

        <div className="mt-14 border-t border-[var(--line)] pt-8" data-reveal="">
          <div className="fade-up grid-12 items-center gap-y-6">
            <div className="col-span-12 md:col-span-7">
              <RouteMap />
              <p className="t-label mt-3 text-muted">{t.travellers.route}</p>
            </div>
            <div className="col-span-12 flex flex-wrap items-center gap-4 md:col-span-4 md:col-start-9 md:justify-end">
              {CONFIG.city.trim() && <span className="t-label text-cream/70">{CONFIG.city.trim()}</span>}
              <WhatsAppButton variant="gold" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Отзыв путешественников из Германии (титры ролика 005) — только при CONFIG.showQuotes. */
export function Quotes() {
  const { t, lang } = useLang();
  if (!CONFIG.showQuotes) return null;
  return (
    <section className="section" aria-label={t.quotes.label}>
      <figure className="wrap text-center" data-reveal="">
        <Lion className="fade-up mx-auto mb-10 h-14 w-14 text-gold" />
        <blockquote className="fade-up t-display mx-auto max-w-5xl text-[clamp(2.2rem,5.4vw,5.6rem)] leading-[1.02]">
          {q(t.quotes.text, lang)}
        </blockquote>
        <figcaption className="fade-up t-label mt-10 text-gold" style={{ "--d": 160 } as CSSProperties}>
          — {t.quotes.author}
        </figcaption>
      </figure>
    </section>
  );
}
