import { useEffect, useRef } from "react";
import { keys } from "@/data/content";
import { motionOk } from "@/lib/motion";
import { ScrollTrigger } from "@/lib/scroll";
import { PLANETS, SPARKLE } from "./glyphs";
import { SphereEyebrow } from "./Spheres";

/** Иконки ключей — тонкие линии, квадрат 24×24 */
const KEY_ICONS: Record<(typeof keys)[number]["id"], string> = {
  day: "M5 6.5h14v13H5zM5 10.5h14M9 4v4M15 4v4M11 13.5h2.6v4",
  month: PLANETS.moon,
  year: "M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0zM19.6 6.4a1.7 1.7 0 1 1-3.4 0 1.7 1.7 0 0 1 3.4 0z",
  city: "M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11zM14.3 10a2.3 2.3 0 1 1-4.6 0 2.3 2.3 0 0 1 4.6 0z",
  time: "M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0zM12 7.5V12l3 2",
};

/**
 * «Что нужно для карты»: пять ключей загораются по очереди по мере прокрутки,
 * рядом — блок про ректификацию с циферблатом, стрелки которого «ищут» время.
 */
export function Keys() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !motionOk()) return;
    const list = el.querySelector<HTMLElement>(".keys__wrap")!;
    const items = Array.from(el.querySelectorAll<HTMLElement>(".key"));
    const clock = el.querySelector<HTMLElement>(".rect__clock");
    const hands = el.querySelector<SVGGElement>(".rect__hands");
    el.classList.add("is-live");
    const set = (p: number) => {
      list.style.setProperty("--k", p.toFixed(4));
      items.forEach((it, i) => it.classList.toggle("is-on", p >= (i + 0.6) / items.length));
    };
    set(0);
    const st1 = ScrollTrigger.create({
      trigger: list,
      start: "top 82%",
      end: "bottom 42%",
      onUpdate: (s) => set(s.progress),
      onRefresh: (s) => set(s.progress),
    });
    const st2 = clock
      ? ScrollTrigger.create({
          trigger: clock,
          start: "top 90%",
          end: "bottom 35%",
          onUpdate: (s) => {
            // стрелки сначала быстро бегут, потом замедляются и останавливаются на «найденном» времени
            const e = 1 - Math.pow(1 - s.progress, 3);
            hands?.style.setProperty("--h", `${(e * 720 + 300).toFixed(1)}deg`);
            hands?.style.setProperty("--m", `${(e * 2160 + 60).toFixed(1)}deg`);
            clock.classList.toggle("is-found", s.progress > 0.97);
          },
        })
      : null;
    return () => {
      st1.kill();
      st2?.kill();
      el.classList.remove("is-live");
    };
  }, []);

  return (
    <section id="klyuchi" ref={root} className="keys section" aria-labelledby="keys-title">
      <div className="wrap">
        <header className="keys__head rv">
          <SphereEyebrow id="karta">пять ключей</SphereEyebrow>
          <h2 id="keys-title" className="h2">
            Что нужно <em>для карты</em>
          </h2>
          <p className="keys__lead">
            Чтобы составить натальную карту, нужно знать число, месяц, год и город вашего рождения, а также — немаловажно — время рождения.
          </p>
        </header>

        <div className="keys__wrap">
          <span className="keys__line" aria-hidden="true">
            <i />
          </span>
          <ol className="keys__list">
          {keys.map((k, i) => (
            <li key={k.id} className="key" style={{ ["--i" as string]: i }}>
              <span className="key__orb">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={KEY_ICONS[k.id]} />
                </svg>
              </span>
              <span className="key__label">{k.label}</span>
              <span className="key__n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
            </li>
          ))}
          </ol>
        </div>

        <div className="rect rv">
          <div className="rect__clock" aria-hidden="true">
            <svg viewBox="-60 -60 120 120">
              <circle r="54" className="rect__face" />
              <circle r="47" className="rect__inner" />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i * Math.PI) / 6;
                const r1 = i % 3 ? 43 : 39;
                return <line key={i} x1={Math.sin(a) * r1} y1={-Math.cos(a) * r1} x2={Math.sin(a) * 47} y2={-Math.cos(a) * 47} className="rect__tick" />;
              })}
              <g className="rect__hands">
                <line y2="-26" className="rect__hour" />
                <line y2="-38" className="rect__min" />
              </g>
              <circle r="2.6" className="rect__pin" />
              <path d={SPARKLE} transform="translate(-9 -63) scale(0.75)" className="rect__star" />
            </svg>
          </div>
          <div className="rect__copy">
            <h3 className="rect__title">Если не знаете время рождения</h3>
            <p className="rect__text">
              Если точное время неизвестно, могу вычислить его при помощи <strong>ректификации</strong> — по вашим ответам на ряд вопросов.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
