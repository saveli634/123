import { useEffect, useRef } from "react";
import { Split } from "./Split";
import { ScrollTrigger, motionStarted } from "@/lib/motion";
import { clamp } from "@/lib/env";
import { Arrow, MagLink } from "./Buttons";

/** Шаги — строго по её посту «Как проходит процесс ламинирования ресниц?». */
const STEPS = [
  { title: "Валик", text: "Подбираю валик и выкладываю на него реснички." },
  { title: "Первый состав", text: "Наношу первый состав и выдерживаю необходимое время — для всех ресниц оно разное." },
  { title: "Второй состав", text: "Закрепляю вторым составом." },
  { title: "Окрашивание", text: "Окрашиваю реснички краской для насыщенности." },
  { title: "Ботокс", text: "Завершаю ботоксом (маской) для питания и увлажнения ресниц." },
];

const LINE = "M0 74 C 180 82, 420 80, 620 62 C 800 46, 920 26, 1000 8";

/**
 * Горизонтальный закреплённый таймлайн: прокрутка вниз двигает шаги влево,
 * линия-ресница «отрастает» (её кончик держится у середины экрана) и зажигает шаги по очереди.
 */
export function Process() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const line = useRef<SVGPathElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const hud = useRef<HTMLDivElement>(null);
  const hudNum = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!motionStarted()) return;
    const sec = section.current!;
    const tr = track.current!;
    const wr = wrap.current!;
    const path = line.current!;
    const steps = Array.from(wr.querySelectorAll<HTMLElement>(".step"));
    const dots = Array.from(wr.querySelectorAll<HTMLElement>(".process-dot"));
    let dist = 0;
    let len = 0;
    let wrLeft = 0;
    let wrW = 1;
    let svgW = 1;
    let svgH = 1;
    let marks: number[] = [];

    /** Точка линии над заданной долей ширины (поиск по длине пути). */
    const pointAtX = (fx: number) => {
      let lo = 0;
      let hi = len;
      for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        if (path.getPointAtLength(mid).x < fx * 1000) lo = mid;
        else hi = mid;
      }
      return path.getPointAtLength(lo);
    };

    const measure = () => {
      dist = Math.max(0, tr.scrollWidth - document.documentElement.clientWidth);
      sec.style.setProperty("--dist", `${dist}px`);
      len = path.getTotalLength();
      wrLeft = wr.offsetLeft;
      wrW = Math.max(1, wr.offsetWidth);
      svgW = svg.current!.clientWidth;
      svgH = svg.current!.clientHeight;
      // точки шагов — на линии, над левым краем каждой карточки
      marks = steps.map((s, i) => {
        const fx = (s.offsetLeft + 30) / wrW;
        const pt = pointAtX(fx);
        dots[i].style.transform = `translate3d(${((pt.x / 1000) * svgW).toFixed(1)}px,${((pt.y / 100) * svgH).toFixed(1)}px,0)`;
        return fx;
      });
    };
    ScrollTrigger.addEventListener("refreshInit", measure);
    measure();

    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const p = self.progress;
        const shift = p * dist;
        tr.style.transform = `translate3d(${(-shift).toFixed(1)}px,0,0)`;
        const vw = document.documentElement.clientWidth;
        // кончик линии — чуть правее середины экрана
        const drawn = p > 0.995 ? 1 : clamp((shift + vw * 0.56 - wrLeft) / wrW);
        path.style.strokeDashoffset = String(1 - drawn);
        if (tip.current && len) {
          const pt = pointAtX(drawn);
          tip.current.style.transform = `translate3d(${((pt.x / 1000) * svgW).toFixed(1)}px,${((pt.y / 100) * svgH).toFixed(1)}px,0)`;
          tip.current.style.opacity = drawn > 0.005 && drawn < 0.995 ? "1" : "0";
        }
        let lit = 0;
        steps.forEach((s, i) => {
          const on = drawn >= marks[i];
          s.classList.toggle("is-lit", on);
          dots[i].classList.toggle("is-lit", on);
          if (on) lit = i + 1;
        });
        hud.current?.classList.toggle("is-on", drawn > 0.01 && p < 0.97);
        if (hudNum.current) hudNum.current.textContent = String(Math.max(1, lit)).padStart(2, "0");
      },
    });
    ScrollTrigger.refresh();
    return () => {
      ScrollTrigger.removeEventListener("refreshInit", measure);
      st.kill();
    };
  }, []);

  return (
    <section className="process" id="process" ref={section} aria-labelledby="process-title">
      <div className="process-sticky">
        <div className="process-hud" ref={hud} aria-hidden="true">
          <span className="process-hud-label">Ламинирование</span>
          <span className="process-hud-count">
            <span ref={hudNum}>01</span> / {String(STEPS.length).padStart(2, "0")}
          </span>
        </div>

        <div className="process-track" ref={track}>
          <header className="process-intro">
            <p className="eyebrow">
              <span className="eyebrow-num">04</span>Около часа
            </p>
            <Split id="process-title" className="h2" text="Как проходит *ламинирование*" />
            <p className="process-lead">Пять шагов — рассказываю так, как делаю сама.</p>
          </header>

          <div className="process-steps-wrap" ref={wrap}>
            <svg className="process-line" ref={svg} viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true">
              <path className="process-line-base" d={LINE} />
              <path className="process-line-draw" ref={line} pathLength={1} d={LINE} />
            </svg>
            {STEPS.map((s) => (
              <span className="process-dot" key={s.title} aria-hidden="true" />
            ))}
            <span className="process-tip" ref={tip} aria-hidden="true" />
            <ol className="process-steps">
              {STEPS.map((s, i) => (
                <li className="step" key={s.title}>
                  <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="step-title">{s.title}</h3>
                    <p className="step-text">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="process-final">
            <p className="process-final-text">
              И отпускаю тебя с <em>шикарным эффектом!</em>
            </p>
            <MagLink href="#zapis" variant="dark" icon={<Arrow />}>
              Записаться
            </MagLink>
          </div>
        </div>
      </div>
    </section>
  );
}
