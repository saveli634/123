import { team as t } from "@/content/text";
import { site } from "@/lib/site";

/** «Команда»: только при showStaffFaces=true и заполненном CONFIG.team. Иначе раздела нет. */
export function Team() {
  if (!site.showStaffFaces || !site.team.length) return null;
  return (
    <section className="tone-milk section-y" data-tone="milk" aria-labelledby="team-title">
      <div className="container-x grid-12 gap-y-10">
        <h2 id="team-title" className="label eyebrow eyebrow-gold col-span-12 text-espresso lg:col-span-3">
          {t.label}
        </h2>
        <ul className="col-span-12 m-0 grid list-none grid-cols-1 gap-8 p-0 sm:grid-cols-2 lg:col-span-9 lg:grid-cols-3">
          {site.team.map((m) => (
            <li key={m.name} className="reveal border-t border-gold/60 pt-5">
              <p className="display text-[1.8rem] leading-tight">{m.name}</p>
              <p className="mt-1 text-ink-soft">{m.role}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
