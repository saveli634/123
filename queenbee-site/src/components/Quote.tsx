import { T } from "@/content/copy";

/** Из видеообращения (подпись 007). Кто говорит — владелец или основатель, имя не указываем. */
export function Quote() {
  return (
    <section className="quote" aria-labelledby="quote-label">
      <div className="wrap quote__wrap">
        <p id="quote-label" className="eyebrow">
          Из видеообращения
        </p>
        <p className="quote__lead" data-reveal>
          {T.quoteLead}
        </p>
        <blockquote className="quote__main" data-reveal>
          <span className="quote__mark" aria-hidden="true">
            «
          </span>
          {T.quoteMain}
        </blockquote>
        <div className="quote__rest">
          {T.quoteRest.map((q, i) => (
            <p key={i} data-reveal style={{ transitionDelay: `${i * 120}ms` }}>
              {q}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
