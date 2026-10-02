import { CARE } from "@/content/copy";
import { Frame } from "@/components/shared/Frame";
import { Lines } from "@/components/shared/Lines";
import { SecLabel } from "@/components/shared/Glyphs";

/** Аккуратность: салон в защитной плёнке. Фото высокого разрешения — можно крупно. */
export function Care() {
  return (
    <section id="akkuratnost" className="sec care" aria-labelledby="care-title">
      <div className="wrap">
        <SecLabel n={4} total={9}>
          {CARE.label}
        </SecLabel>
        <Lines id="care-title" className="display h-sec care-h" lines={CARE.titleLines} />
        <div className="care-grid">
          <p className="care-text lead rv up">{CARE.text}</p>
          {CARE.photos.map((f, i) => (
            <div key={f.img} className={`care-f care-f${i + 1}`}>
              <Frame img={f.img} alt={f.caption} caption={f.caption} index={`04.${i + 1}`} sizes={i === 0 ? "(min-width: 1024px) 44vw, 92vw" : "(min-width: 1024px) 24vw, 46vw"} parallax={i === 0 ? 8 : 12} delay={i * 110} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
