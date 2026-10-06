import { useEffect, useRef } from "react";
import { skyStages } from "@/data/content";
import { motionOk } from "@/lib/motion";
import { ScrollTrigger } from "@/lib/scroll";
import { Wheel, renderWheel, stageOf } from "./Wheel";
import { Eyebrow } from "./ui";

const ROMAN = ["I", "II", "III", "IV"];

/**
 * Главная закреплённая сцена «Небо в момент рождения» (300svh).
 * Закрепление — CSS sticky (без скачков на телефонах при скрытии адресной строки),
 * прогресс — ScrollTrigger; requestAnimationFrame крутится, только пока прогресс меняется.
 */
export function BirthSky() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    const wheel = svg.current;
    if (!el || !tr || !wheel || !motionOk()) return;

    const caps = Array.from(el.querySelectorAll<HTMLElement>(".sky__cap"));
    const dots = Array.from(el.querySelectorAll<HTMLElement>(".sky__dot"));
    let target = 0;
    let cur = 0;
    let raf = 0;
    let stage = -1;

    const paint = (p: number) => {
      renderWheel(wheel, p);
      el.style.setProperty("--sky", p.toFixed(4));
      const s = stageOf(p);
      if (s !== stage) {
        stage = s;
        caps.forEach((c, i) => c.classList.toggle("is-active", i === s));
        dots.forEach((d, i) => d.classList.toggle("is-active", i <= s));
      }
    };
    const loop = () => {
      cur += (target - cur) * 0.14;
      if (Math.abs(target - cur) < 0.0004) cur = target;
      paint(cur);
      raf = cur === target ? 0 : requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    el.classList.add("is-live");
    paint(0);
    const st = ScrollTrigger.create({
      trigger: tr,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (s) => {
        target = s.progress;
        kick();
      },
      onRefresh: (s) => {
        target = s.progress;
        kick();
      },
    });
    return () => {
      st.kill();
      cancelAnimationFrame(raf);
      el.classList.remove("is-live");
    };
  }, []);

  return (
    <section id="nebo" ref={root} className="sky" aria-labelledby="sky-title">
      <div ref={track} className="sky__track">
        <div className="sky__sticky">
          <div className="wrap sky__grid">
            <div className="sky__copy">
              <Eyebrow>Как это работает</Eyebrow>
              <h2 id="sky-title" className="h2 sky__title">
                Небо в момент <em>рождения</em>
              </h2>
              <ol className="sky__caps">
                {skyStages.map((s, i) => (
                  <li key={i} className={`sky__cap${i === 0 ? " is-active" : ""}`}>
                    <span className="sky__num" aria-hidden="true">
                      {ROMAN[i]}
                    </span>
                    <span className="sky__cap-title">{s.title}</span>
                    <span className="sky__cap-text">{s.text}</span>
                  </li>
                ))}
              </ol>
              <div className="sky__dots" aria-hidden="true">
                {skyStages.map((_, i) => (
                  <span key={i} className={`sky__dot${i === 0 ? " is-active" : ""}`} />
                ))}
                <span className="sky__bar">
                  <i />
                </span>
              </div>
            </div>
            <figure className="sky__wheel">
              <Wheel ref={svg} idPrefix="sky" />
              <figcaption className="sky__note">иллюстрация</figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
