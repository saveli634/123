import type { CSSProperties } from "react";
import { DICT } from "@/content/i18n";
import { useT } from "@/lib/lang";
import { CONFIG } from "@/config";
import { Kicker } from "@/components/Text";
import { WhatsAppButton } from "@/components/Cta";
import { Lion } from "@/components/Lion";

/**
 * «Гостям из-за границы / For travellers» — двуязычный блок: русский текст и его перевод
 * рядом, независимо от выбранного языка сайта. Английский — перевод того же текста (подпись 005).
 */
export function Travellers() {
  const t = useT();
  const ru = DICT.ru.travellers;
  const en = DICT.en.travellers;
  return (
    <section className="section travellers" aria-labelledby="travellers-title">
      <Lion className="travellers-mark" />
      <div className="wrap relative">
        <Kicker>
          {ru.label} / {en.label}
        </Kicker>
        <h2 id="travellers-title" className="t-title mt-6" data-reveal="">
          <span className="ln">
            <span style={{ "--i": 0 } as CSSProperties}>
              {ru.label.split(" ")[0]} <em>{ru.label.split(" ").slice(1).join(" ")}</em>
            </span>
          </span>
          <span className="ln travellers-en" lang="en">
            <span style={{ "--i": 1 } as CSSProperties}>
              <em>{en.label}</em>
            </span>
          </span>
        </h2>

        <div className="grid-12 mt-[8vh] gap-y-10" data-reveal="">
          <figure className="fade-up col-span-12 md:col-span-6" lang="ru">
            <p className="t-label mb-5 text-gold">RU</p>
            <blockquote className="t-quote text-[1.35rem] md:text-[clamp(1.4rem,2vw,2.1rem)]">«{ru.text}»</blockquote>
          </figure>
          <figure
            className="fade-up col-span-12 md:col-span-5 md:col-start-8"
            lang="en"
            style={{ "--d": 140 } as CSSProperties}
          >
            <p className="t-label mb-5 text-gold">EN</p>
            <blockquote className="t-quote text-[1.35rem] text-cream/80 italic md:text-[clamp(1.4rem,2vw,2.1rem)]">
              “{en.text}”
            </blockquote>
          </figure>
        </div>

        <div
          className="fade-up mt-12 flex flex-col gap-6 border-t border-[var(--line)] pt-8 md:flex-row md:items-center md:justify-between"
          data-reveal=""
        >
          <p className="t-label text-muted">{t.travellers.route}</p>
          <div className="flex flex-wrap items-center gap-4">
            {CONFIG.city.trim() && <span className="t-label text-cream/70">{CONFIG.city.trim()}</span>}
            <WhatsAppButton variant="gold" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Отзыв путешественников из Германии (титры ролика 005) — только при CONFIG.showQuotes. */
export function Quotes() {
  const t = useT();
  if (!CONFIG.showQuotes) return null;
  return (
    <section className="section" aria-label={t.quotes.label}>
      <figure className="wrap text-center" data-reveal="">
        <Lion className="fade-up mx-auto mb-10 h-14 w-14 text-gold" />
        <blockquote className="fade-up t-display mx-auto max-w-5xl text-[clamp(2.2rem,5.4vw,5.6rem)] leading-[1.02]">
          «{t.quotes.text}»
        </blockquote>
        <figcaption className="fade-up t-label mt-10 text-gold" style={{ "--d": 160 } as CSSProperties}>
          — {t.quotes.author}
        </figcaption>
      </figure>
    </section>
  );
}
