import { services as t } from "@/content/text";
import { site, DEMO } from "@/lib/site";
import { FillPlate } from "@/components/shared/Fill";
import { useUi } from "@/components/shared/UiContext";

/** «Услуги»: только из CONFIG.services. Пока список пуст — раздела нет (в демо — плашка). */
export function Services() {
  const { openBooking } = useUi();
  if (!site.services.length) {
    if (!DEMO) return null;
    return (
      <section className="tone-milk relative" data-tone="milk" aria-label="Услуги — не заполнено">
        <div className="container-x grid-12 gap-y-4 py-20">
          <p className="label eyebrow eyebrow-gold col-span-12 text-espresso lg:col-span-3">{t.label}</p>
          <div className="col-span-12 lg:col-span-9">
            <FillPlate field="услуги и цены (CONFIG.services) — раздел появится автоматически" />
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="uslugi" className="tone-milk section-y relative" data-tone="milk" aria-labelledby="services-title">
      <div className="container-x grid-12 gap-y-10">
        <div className="col-span-12 lg:col-span-3">
          <h2 id="services-title" className="label eyebrow eyebrow-gold reveal text-espresso">
            {t.label}
          </h2>
        </div>
        <ul className="col-span-12 m-0 list-none p-0 lg:col-span-9">
          {site.services.map((s, i) => (
            <li key={s.name} className="glow reveal border-b border-gold/50 first:border-t" style={{ ["--delay" as string]: `${i * 50}ms` }}>
              <div className="flex flex-col gap-3 py-6 md:flex-row md:items-center md:justify-between md:gap-8">
                <p className="display text-[clamp(1.5rem,2.4vw,2.1rem)] leading-tight text-espresso">{s.name}</p>
                <div className="flex items-center gap-6">
                  <p className="text-[0.95rem] text-ink-soft">{s.price || t.noPrice}</p>
                  <button type="button" className="btn btn-ghost btn-sm" data-magnetic="" onClick={() => openBooking(s.name)}>
                    <span className="btn-label">{t.cta}</span>
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
