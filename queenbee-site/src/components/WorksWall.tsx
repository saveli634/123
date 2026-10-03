import { useMemo, useState } from "react";
import { Photo } from "./Photo";
import { Lightbox } from "./Lightbox";
import { Lines } from "./Lines";
import { FILTERS, WORKS, type Filter } from "@/content/media";
import { hasInstagram, worksHref, extProps } from "@/lib/links";

/** «Стена работ»: мозаика в арочных и шестигранных масках, фильтры, просмотр на весь экран. */
export function WorksWall() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<number | null>(null);
  const shown = useMemo(() => WORKS.filter((w) => filter === "all" || w.filter === filter), [filter]);

  return (
    <section id="works" className="works" aria-labelledby="works-title">
      <div className="wrap">
        <div className="works__head">
          <p className="eyebrow">Работы</p>
          <Lines as="h2" id="works-title" className="h2" text="Образы наших гостий" />
          <div className="filters" role="group" aria-label="Фильтр работ">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                className="filter"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <ul className="wall" data-filter={filter}>
          {WORKS.map((w) => {
            const idx = shown.indexOf(w);
            return (
              <li key={w.name} className={`tile tile--${w.size} tile--${w.mask}`} hidden={idx < 0} data-reveal>
                <button type="button" className="tile__btn" data-tilt data-cursor="Смотреть" onClick={() => setOpen(idx)} aria-haspopup="dialog">
                  <span className="tile__mask">
                    <Photo name={w.name} alt={w.alt} sizes={w.size === "l" ? "(max-width: 767px) 92vw, 40vw" : "(max-width: 767px) 46vw, 24vw"} />
                    <span className="glint" aria-hidden="true" />
                  </span>
                  <span className="tile__cap">{w.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
        {hasInstagram && (
          <div className="works__more">
            <a href={worksHref} className="btn btn--line" data-magnetic {...extProps(worksHref)}>
              Смотреть работы
            </a>
          </div>
        )}
      </div>
      {open !== null && shown.length > 0 && <Lightbox items={shown} index={open} onClose={() => setOpen(null)} />}
    </section>
  );
}
