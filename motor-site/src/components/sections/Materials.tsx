import { MATERIALS, FILL } from "@/content/copy";
import { CONFIG } from "@/config";
import { Lines } from "@/components/shared/Lines";
import { SecLabel } from "@/components/shared/Glyphs";
import { Fill } from "@/components/shared/Fill";
import { DEMO } from "@/lib/env";

/** Чем работаем: текстом, без логотипов. Свет HARDKORR — после подтверждения владельцем. */
export function Materials() {
  const items = MATERIALS.items.filter((m) => !m.flag || CONFIG[m.flag] || DEMO);
  return (
    <section id="materialy" className="sec mats" aria-labelledby="mats-title">
      <div className="wrap">
        <SecLabel n={7} total={9}>
          {MATERIALS.label}
        </SecLabel>
        <h2 id="mats-title" className="sr-only">
          {MATERIALS.label}
        </h2>
        <ul className="mats-list">
          {items.map((m) => {
            const pending = m.flag && !CONFIG[m.flag];
            return (
              <li key={m.k} className={`mats-row rv up${pending ? " is-pending" : ""}`}>
                <span className="mats-k label">{m.k}</span>
                <span className="mats-rule" aria-hidden="true" />
                <span className="mats-v display" translate="no">
                  {m.v}
                </span>
                {m.note && <span className="mats-note">«{m.note}»</span>}
                {m.mention && CONFIG.showCommunities && (
                  <span className="mats-mention">
                    {m.mentionLabel} <span translate="no">{m.mention}</span>
                  </span>
                )}
                {pending && m.fill && <Fill kind="confirm" what={FILL[m.fill]} className="mats-fill" />}
              </li>
            );
          })}
        </ul>
        <blockquote className="mats-quote">
          <Lines as="p" className="display mats-q" lines={MATERIALS.quoteLines} />
        </blockquote>
      </div>
    </section>
  );
}
