import { useEffect, useRef } from "react";
import { giftSteps } from "@/data/content";
import { channels, hasBooking } from "@/data/site.config";
import { motionOk } from "@/lib/motion";
import { ScrollTrigger } from "@/lib/scroll";
import { AllSpheresEyebrow, SphereIcon } from "./Spheres";
import { Btn } from "./ui";

/** Значки шагов, квадрат 24×24 */
const STEP_ICONS = [
  // расчёт или карта — маленькое колесо
  "M12 3.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4zM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8zM12 3.8v4.8M12 15.4v4.8M3.8 12h4.8M15.4 12h4.8M6.2 6.2l3.4 3.4M14.4 14.4l3.4 3.4",
  // книжка, альбом
  "M12 6.5c-2-1.3-4.7-1.8-8-1.5v12.5c3.3-.3 6 .2 8 1.5 2-1.3 4.7-1.8 8-1.5V5c-3.3-.3-6 .2-8 1.5zM12 6.5V19",
  // подарок
  "M4.5 9.5h15v3.2h-15zM5.6 12.7h12.8V20H5.6zM12 9.5V20M12 9.5C10.8 6.3 6.6 5.5 6.6 8c0 1.4 2.7 1.5 5.4 1.5zM12 9.5c1.2-3.2 5.4-4 5.4-1.5 0 1.4-2.7 1.5-5.4 1.5z",
];
/** Что можно сделать в подарок — значки к третьему шагу */
const EXTRAS: { icon: string; label: string; sphere?: "pesnya" | "slovo" }[] = [
  { icon: "M4 6.5h12v11H4zM16 10l4-2.5v9L16 14M7 10.5l3.5 2.5L7 15.5z", label: "видеоролик с фотографиями под песню" },
  { icon: "", label: "песня", sphere: "pesnya" },
  { icon: "", label: "стихи", sphere: "slovo" },
];

// дуга-орбита: квадратичная кривая в координатах 1200×200, станции на t = 1/6, 1/2, 5/6
const P0 = [0, 170];
const P1 = [600, -10];
const P2 = [1200, 170];
const at = (t: number) => [
  (1 - t) ** 2 * P0[0] + 2 * (1 - t) * t * P1[0] + t ** 2 * P2[0],
  (1 - t) ** 2 * P0[1] + 2 * (1 - t) * t * P1[1] + t ** 2 * P2[1],
];
const ARC = `M${P0.join(" ")}Q${P1.join(" ")} ${P2.join(" ")}`;
const STOPS = [1 / 6, 1 / 2, 5 / 6];

/**
 * «Подарок на день рождения» — здесь встречаются все сферы:
 * расчёт или карта → книжка, альбом → в подарок песня, стихи или видеоролик.
 * Шаги загораются, пока по дуге-орбите бежит комета (прогресс — от прокрутки).
 */
export function Gift() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !motionOk()) return;
    const track = el.querySelector<HTMLElement>(".gift__track")!;
    const steps = Array.from(el.querySelectorAll<HTMLElement>(".gstep"));
    const stations = Array.from(el.querySelectorAll<SVGGElement>(".gstation"));
    const comet = el.querySelector<SVGGElement>(".gift__comet");
    const fill = el.querySelector<SVGPathElement>(".gift__fill");
    el.classList.add("is-live");
    const set = (p: number) => {
      track.style.setProperty("--g", p.toFixed(4));
      if (fill) fill.style.strokeDashoffset = (1 - p).toFixed(4);
      if (comet) {
        const [x, y] = at(p);
        comet.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        comet.style.opacity = p > 0.003 && p < 0.997 ? "1" : "0";
      }
      steps.forEach((s, i) => s.classList.toggle("is-on", p >= STOPS[i] - 0.04));
      stations.forEach((s, i) => s.classList.toggle("is-on", p >= STOPS[i] - 0.04));
    };
    set(0);
    const st = ScrollTrigger.create({
      trigger: track,
      start: "top 80%",
      end: "bottom 45%",
      onUpdate: (s) => set(s.progress),
      onRefresh: (s) => set(s.progress),
    });
    return () => {
      st.kill();
      el.classList.remove("is-live");
    };
  }, []);

  return (
    <section id="podarok" ref={root} className="gift section" aria-labelledby="gift-title">
      <div className="wrap">
        <header className="gift__head rv">
          <AllSpheresEyebrow />
          <h2 id="gift-title" className="h2">
            Подарок <em>на день рождения</em>
          </h2>
        </header>

        <div className="gift__track">
          <svg className="gift__arc" viewBox="0 -40 1200 240" aria-hidden="true" focusable="false">
            <path d={ARC} className="gift__base" />
            <path d={ARC} className="gift__fill" pathLength={1} />
            <g className="gift__comet">
              <circle r="22" className="gift__comet-glow" />
              <circle r="4.5" className="gift__comet-core" />
            </g>
            {STOPS.map((t, i) => {
              const [x, y] = at(t);
              return (
                <g key={t} className="gstation" transform={`translate(${x} ${y})`}>
                  <circle r="44" className="gstation__bg" />
                  <g transform="translate(-20.4 -20.4) scale(1.7)">
                    <path d={STEP_ICONS[i]} className="gstation__icon" />
                  </g>
                </g>
              );
            })}
          </svg>
          <ol className="gift__steps">
            {giftSteps.map((s, i) => (
              <li key={i} className={`gstep gstep--${i + 1}`}>
                <span className="gstep__orb" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path d={STEP_ICONS[i]} />
                  </svg>
                </span>
                <span className="gstep__n" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="gstep__title">{s.title}</h3>
                <p className="gstep__text">{s.text}</p>
                {i === 2 && (
                  <ul className="gift__extras">
                    {EXTRAS.map((x) => (
                      <li key={x.label}>
                        {x.sphere ? (
                          <SphereIcon id={x.sphere} size={18} />
                        ) : (
                          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                            <path d={x.icon} />
                          </svg>
                        )}
                        {x.label}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>

        {hasBooking && (
          <div className="gift__cta rv">
            <Btn href={channels[0].href} external={channels[0].id !== "phone"}>
              Заказать подарок
            </Btn>
          </div>
        )}
      </div>
    </section>
  );
}
