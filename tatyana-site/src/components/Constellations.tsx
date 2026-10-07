import { useState, type KeyboardEvent } from "react";
import { constellations, questions } from "@/data/content";
import { SphereEyebrow } from "./Spheres";

const textOf = (n: number) => questions.find((q) => q.n === n)!.text;
const plural = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return "расчёт";
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return "расчёта";
  return "расчётов";
};

/**
 * «Созвездие вопросов»: 23 расчёта — звёзды пяти созвездий.
 * Наведение, касание или фокус звезды показывает формулировку в карточке, линии созвездия загораются.
 * Клавиатура: Tab и стрелки ←/→ (↑/↓) по всем звёздам. Ниже — тот же список аккордеоном.
 */
export function Constellations() {
  const [active, setActive] = useState<Record<string, number>>(() =>
    Object.fromEntries(constellations.map((c) => [c.id, c.items[0]])),
  );
  const [lit, setLit] = useState<string | null>(null);

  const pick = (cid: string, n: number) => {
    setActive((a) => (a[cid] === n ? a : { ...a, [cid]: n }));
    setLit(cid);
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(e.key)) return;
    const stars = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>(".cst__star"));
    const i = stars.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    let j = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") j = (i + 1) % stars.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") j = (i - 1 + stars.length) % stars.length;
    else if (e.key === "Home") j = 0;
    else j = stars.length - 1;
    stars[j].focus();
  };

  return (
    <section id="voprosy" className="cons section" aria-labelledby="cons-title">
      <svg className="cons__grid" viewBox="-500 -500 1000 1000" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
        {[120, 240, 360, 480].map((r) => (
          <circle key={r} r={r} />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return <line key={i} x1={Math.cos(a) * 60} y1={Math.sin(a) * 60} x2={Math.cos(a) * 700} y2={Math.sin(a) * 700} />;
        })}
      </svg>
      <div className="wrap">
        <header className="cons__head rv">
          <SphereEyebrow id="chislo">23 расчёта</SphereEyebrow>
          <h2 id="cons-title" className="h2">
            Созвездие <em>вопросов</em>
          </h2>
          <p className="cons__lead">
            Нумерологический расчёт по дате рождения. Каждая звезда — один из расчётов:{" "}
            <span className="only-hover">наведите на неё</span>
            <span className="only-touch">коснитесь её</span>, чтобы прочитать.
          </p>
        </header>

        <div className="cons__map" onKeyDown={onKey}>
          {constellations.map((c) => {
            const cur = active[c.id];
            return (
              <div key={c.id} className={`cst-cell cst-cell--${c.id} rv`}>
              <article
                className={`cst${lit === c.id ? " is-lit" : ""}`}
                aria-labelledby={`cst-${c.id}`}
                onPointerLeave={() => setLit((l) => (l === c.id ? null : l))}
              >
                <header className="cst__head">
                  <h3 id={`cst-${c.id}`} className="cst__name">
                    {c.name}
                  </h3>
                  <span className="cst__count">
                    {c.items.length} {plural(c.items.length)}
                  </span>
                </header>
                <div className="cst__sky" style={{ paddingBottom: `${c.ratio * 100}%` }}>
                  <svg className="cst__lines" viewBox={`0 0 100 ${c.ratio * 100}`} preserveAspectRatio="none" aria-hidden="true">
                    {c.links.map(([a, b], i) => {
                      const d = `M${c.stars[a][0] * 100} ${c.stars[a][1] * c.ratio * 100}L${c.stars[b][0] * 100} ${c.stars[b][1] * c.ratio * 100}`;
                      return (
                        <g key={i} style={{ ["--i" as string]: i }}>
                          <path d={d} pathLength={1} className="cst__line" />
                          <path d={d} pathLength={1} className="cst__spark" />
                        </g>
                      );
                    })}
                  </svg>
                  {c.items.map((n, i) => (
                    <button
                      key={n}
                      type="button"
                      className={`cst__star${cur === n ? " is-active" : ""}`}
                      style={{
                        left: `${c.stars[i][0] * 100}%`,
                        top: `${c.stars[i][1] * 100}%`,
                        ["--s" as string]: 0.8 + ((n * 7) % 5) * 0.12,
                        ["--tw" as string]: `${2.4 + ((n * 13) % 7) * 0.45}s`,
                      }}
                      aria-label={`№ ${n}. ${textOf(n)}`}
                      aria-pressed={cur === n}
                      onPointerEnter={(e) => e.pointerType === "mouse" && pick(c.id, n)}
                      onFocus={() => pick(c.id, n)}
                      onClick={() => pick(c.id, n)}
                    >
                      <span className="cst__dot" aria-hidden="true" />
                      <span className="cst__num" aria-hidden="true">
                        {n}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="cst__card" aria-hidden="true">
                  {c.items.map((n) => (
                    <p key={n} className={`cst__card-in${cur === n ? " is-on" : ""}`}>
                      <span className="cst__card-n">№ {n}</span>
                      <span className="cst__card-t">{textOf(n)}</span>
                    </p>
                  ))}
                </div>
              </article>
              </div>
            );
          })}
        </div>

        <div className="qlist rv">
          <h3 className="qlist__title">Все 23 расчёта списком</h3>
          {constellations.map((c) => (
            <details key={c.id} className="qlist__item">
              <summary>
                <span>{c.name}</span>
                <span className="qlist__count">{c.items.length}</span>
                <i aria-hidden="true" />
              </summary>
              <ol>
                {c.items.map((n) => (
                  <li key={n}>
                    <span className="qlist__n">{n}</span>
                    {textOf(n)}
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
