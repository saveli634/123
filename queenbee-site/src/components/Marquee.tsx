import { T } from "@/content/copy";

/** Бегущая лента. Скорость растёт от скорости прокрутки (fx.ts). Декор — скрыт от экранных дикторов. */
export function Marquee({ tone = "milk" }: { tone?: "milk" | "wine" }) {
  const row = (k: number) => (
    <span className="marquee__row" key={k}>
      {T.marquee.map((w, i) => (
        <span key={i} className={i % 2 ? "marquee__it" : ""}>
          {w}
          <svg className="marquee__hex" viewBox="0 0 10 10" aria-hidden="true">
            <path d="M5 .8 8.7 2.9v4.2L5 9.2 1.3 7.1V2.9Z" />
          </svg>
        </span>
      ))}
    </span>
  );
  return (
    <div className={`marquee marquee--${tone}`} aria-hidden="true">
      <div className="marquee__track" data-marquee>
        {[0, 1, 2, 3].map(row)}
      </div>
    </div>
  );
}
