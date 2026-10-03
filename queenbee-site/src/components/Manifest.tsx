import { T } from "@/content/copy";

/** Манифест (подпись 001): слова проявляются по мере прокрутки. */
export function Manifest() {
  const words = T.manifest.split(" ");
  return (
    <section className="manifest" aria-labelledby="manifest-label">
      <div className="manifest__sticky wrap">
        <p id="manifest-label" className="eyebrow manifest__label">
          <span className="hex-dot" aria-hidden="true" />
          Queen Bee
        </p>
        <p className="manifest__text" data-manifest>
          {words.map((w, i) => (
            <span key={i} className={`mw${/взгляда|движения|настроения/.test(w) ? " mw--it" : ""}`}>
              {w}{" "}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
