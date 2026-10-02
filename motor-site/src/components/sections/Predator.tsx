import { useState } from "react";
import { PREDATOR, UI } from "@/content/copy";
import { CONFIG } from "@/config";
import { Img } from "@/components/shared/Img";
import { SecLabel } from "@/components/shared/Glyphs";
import { useCardFx } from "./Services";
import { cn } from "@/lib/utils";

/**
 * Гусак «Хищник» — малая плашка, не основной продукт. Фото наклоняется за курсором,
 * по нажатию листаются ракурсы. Цена «34 000» — как в подписи (без валюты).
 */
export function Predator() {
  const ref = useCardFx<HTMLDivElement>(9);
  const [k, setK] = useState(0);
  const photos = PREDATOR.photos;
  return (
    <section id="hishnik" className="sec pred" aria-labelledby="pred-title">
      <div className="wrap">
        <SecLabel n={8} total={9}>
          {PREDATOR.label}
        </SecLabel>
        <div className="pred-plate rv up">
          <div ref={ref} className="pred-stage card">
            <span className="card-glow" aria-hidden="true" />
            <button
              type="button"
              className="pred-photos"
              onClick={() => setK((v) => (v + 1) % photos.length)}
              aria-label={`${photos[k].caption}. ${UI.next}`}
              data-cursor="link"
            >
              {photos.map((p, i) => (
                <span key={p.img} className={cn("pred-ph", i === k && "is-on")}>
                  <Img name={p.img} alt={i === k ? p.caption : ""} sizes="(min-width: 1024px) 26vw, 80vw" />
                </span>
              ))}
              <span className="ph-fx" aria-hidden="true" />
            </button>
            <span className="pred-dots" aria-hidden="true">
              {photos.map((p, i) => (
                <span key={p.img} className={cn("pred-dot num", i === k && "is-on")}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              ))}
            </span>
          </div>
          <div className="pred-info">
            <h2 id="pred-title" className="display pred-title">
              {PREDATOR.title}
            </h2>
            <p className="pred-sub label">{PREDATOR.sub}</p>
            <ul className="pred-facts">
              {PREDATOR.facts.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <p className="pred-price">
              <span className="num pred-num">{PREDATOR.price}</span>
              <span className="pred-tag">{PREDATOR.noDiscount}</span>
            </p>
            {CONFIG.showCommunities && (
              <p className="pred-mention">
                {PREDATOR.mentionLabel} <span translate="no">{PREDATOR.mention}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
