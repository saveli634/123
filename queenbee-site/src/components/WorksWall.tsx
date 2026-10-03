import { useMemo, useState } from "react";
import { Photo } from "./Photo";
import { Lightbox } from "./Lightbox";
import { Lines } from "./Lines";
import { FILTERS, LOOKS, type Filter, type Work } from "@/content/media";
import { hasInstagram, worksHref, extProps } from "@/lib/links";

/**
 * «Стена работ» — по образам: главный кадр в арке и рядом кадры того же образа (процесс и детали).
 * Фильтры «Все · Макияж · Причёски · Образ», просмотр на весь экран по клику на любой кадр.
 */
const MINI = ["circle", "hex", "arch"] as const;

export function WorksWall() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<{ items: Work[]; index: number } | null>(null);
  const shown = useMemo(() => LOOKS.filter((l) => filter === "all" || l.tags.includes(filter)), [filter]);

  return (
    <section id="works" className="works" aria-labelledby="works-title">
      <div className="wrap">
        <div className="works__head">
          <p className="eyebrow">Работы</p>
          <Lines as="h2" id="works-title" className="h2" text="Образы наших гостей" />
          <div className="filters" role="group" aria-label="Фильтр работ">
            {FILTERS.map((f) => (
              <button key={f.id} type="button" className="filter" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <ol className="looks">
          {LOOKS.map((l) => {
            const i = shown.indexOf(l);
            const [main, ...rest] = l.frames;
            return (
              <li key={l.id} className={`look look--${l.id}`} hidden={i < 0} data-reveal>
                <button type="button" className="look__main" data-tilt data-cursor="Смотреть" aria-haspopup="dialog" onClick={() => setOpen({ items: l.frames, index: 0 })}>
                  <span className="look__mask">
                    <Photo name={main.name} alt={main.alt} sizes="(max-width: 767px) 92vw, 28vw" />
                    <span className="glint" aria-hidden="true" />
                  </span>
                </button>
                <div className="look__side">
                  <p className="look__num">0{LOOKS.indexOf(l) + 1}</p>
                  <h3 className="look__title">{l.label}</h3>
                  <ul className="look__minis">
                    {rest.map((f, k) => (
                      <li key={f.name}>
                        <button
                          type="button"
                          className={`mini mini--${MINI[k % MINI.length]}`}
                          data-cursor="Смотреть"
                          aria-haspopup="dialog"
                          onClick={() => setOpen({ items: l.frames, index: k + 1 })}
                        >
                          <Photo name={f.name} alt={f.alt} sizes="(max-width: 767px) 28vw, 10vw" />
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p className="look__count">
                    {l.frames.length} {l.frames.length < 5 ? "кадра" : "кадров"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        {hasInstagram && (
          <div className="works__more">
            <a href={worksHref} className="btn btn--line" data-magnetic {...extProps(worksHref)}>
              Смотреть работы
            </a>
          </div>
        )}
      </div>
      {open && <Lightbox items={open.items} index={open.index} onClose={() => setOpen(null)} />}
    </section>
  );
}
