import { useEffect, useRef } from "react";
import { ScrollTrigger, motionStarted } from "@/lib/motion";
import { LiftRenderer } from "@/lib/liftRenderer";
import { IRIS, LASHES_FULL, LOWER, bez, bezTangent, lashOutline, lashPoint, lashPose, lids, makeLashes, sceneState } from "@/lib/lashes";
import { isLowPower, onLowPower, reportFrame } from "@/lib/perf";

const STAGES = ["Реснички как есть", "Выкладываю на валик", "Поднимаю"];

/**
 * Главная сцена «Подъём»: закреплена на ~280svh, ресницы поднимаются при прокрутке.
 * Canvas рисует только пока сцена на экране. Без скриптов и при «уменьшить движение» —
 * статичная SVG-картинка итогового состояния.
 */
export function LiftScene() {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stageList = useRef<HTMLOListElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!motionStarted() || !canvas.current) return;
    const sec = section.current!;
    const r = new LiftRenderer(canvas.current);
    if (isLowPower()) r.setLow();
    r.resize();

    let target = 0;
    let shown = -1;
    let stage = -1;
    let frame = 0;
    let last = 0;
    let running = false;

    const paint = (p: number) => {
      const s = r.draw(p);
      if (s.stage !== stage) {
        stage = s.stage;
        stageList.current?.querySelectorAll("li").forEach((li, i) => {
          li.classList.toggle("is-active", i === Math.min(stage, 2));
          li.classList.toggle("is-done", i < stage);
        });
      }
      if (caption.current) caption.current.style.setProperty("--c", s.caption.toFixed(3));
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
    };

    const loop = (t: number) => {
      frame = requestAnimationFrame(loop);
      const dt = last ? t - last : 16;
      last = t;
      // лёгкое сглаживание поверх прокрутки — движение «шёлковое» и на телефоне
      const next = Math.abs(target - shown) < 0.0004 ? target : shown + (target - shown) * Math.min(1, dt / 70);
      if (next === shown) return;
      shown = next;
      paint(shown);
      reportFrame(dt);
    };
    const start = () => {
      if (running) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => (target = self.progress),
      onRefresh: (self) => {
        target = self.progress;
        r.resize();
        shown = -1;
        paint((shown = target));
      },
    });
    target = st.progress;
    paint((shown = target));

    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { rootMargin: "10% 0px" });
    io.observe(sec);
    const unLow = onLowPower(() => {
      r.setLow();
      paint(shown);
    });
    return () => {
      st.kill();
      io.disconnect();
      stop();
      unLow();
    };
  }, []);

  return (
    <section className="lift" id="podyom" ref={section} aria-labelledby="lift-title">
      <div className="lift-sticky">
        <div className="lift-aura" aria-hidden="true" />
        <canvas className="lift-canvas" ref={canvas} aria-hidden="true" />
        <LiftStatic />
        <div className="lift-copy">
          <p className="eyebrow">Ламинирование</p>
          <h2 id="lift-title" className="lift-title">
            Как поднимается <em>взгляд</em>
          </h2>
          <ol className="lift-stages" ref={stageList}>
            {STAGES.map((s, i) => (
              <li key={s}>
                <span className="lift-stage-num">{String(i + 1).padStart(2, "0")}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
        <div className="lift-caption" ref={caption}>
          <p>
            Поднимаю взгляд <em>за час</em>
          </p>
        </div>
        <span className="lift-bar" aria-hidden="true">
          <span ref={bar} />
        </span>
      </div>
    </section>
  );
}

const f = (n: number) => (Math.round(n * 10) / 10).toString();

/** Статичная SVG-картинка итогового состояния (та же геометрия, что и в canvas). */
function LiftStatic() {
  const s = sceneState(1);
  const { upper, lower } = lids(1);
  const lashes = makeLashes(LASHES_FULL).map((l) => lashPose(l, s, upper));
  const cubic = (b: typeof upper) => `M${f(b[0][0])} ${f(b[0][1])}C${b.slice(1).flatMap((p) => p.map(f)).join(" ")}`;
  const eye = `${cubic(upper)}C${f(lower[2][0])} ${f(lower[2][1])} ${f(lower[1][0])} ${f(lower[1][1])} ${f(lower[0][0])} ${f(lower[0][1])}Z`;
  const lowerLashes = LOWER.map((l) => {
    const [x, y] = bez(lower, l.u);
    const a = bezTangent(lower, l.u) + Math.PI / 2 + l.lean * 0.6;
    const c = [x + Math.cos(a) * l.len * 0.6, y + Math.sin(a) * l.len * 0.6];
    const e = [x + Math.cos(a + l.lean * 0.5) * l.len, y + Math.sin(a + l.lean * 0.5) * l.len];
    return `M${f(x)} ${f(y)}Q${f(c[0])} ${f(c[1])} ${f(e[0])} ${f(e[1])}`;
  }).join("");
  return (
    <svg className="lift-static" viewBox="-665 -650 1330 930" role="img" aria-label="Рисунок: глаз с поднятыми и подкрученными ресницами">
      <defs>
        <radialGradient id="ls-iris">
          <stop offset="0.3" stopColor="#241238" />
          <stop offset="0.55" stopColor="#5B34B8" />
          <stop offset="0.8" stopColor="#9D74FF" />
          <stop offset="1" stopColor="#1A1026" />
        </radialGradient>
        <radialGradient id="ls-glint">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.2" stopColor="#DECEFF" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#8E5BFF" stopOpacity="0.35" />
          <stop offset="1" stopColor="#8E5BFF" stopOpacity="0" />
        </radialGradient>
        <clipPath id="ls-eye">
          <path d={eye} />
        </clipPath>
      </defs>
      <g clipPath="url(#ls-eye)">
        <path d={eye} fill="rgba(247,243,250,0.09)" />
        <circle cx={IRIS.cx} cy={IRIS.cy} r={IRIS.r} fill="url(#ls-iris)" />
        <circle cx={IRIS.cx} cy={IRIS.cy} r={IRIS.pupil} fill="#07040B" />
        <ellipse cx={IRIS.cx - 58} cy={IRIS.cy - 62} rx="24" ry="18" fill="rgba(255,255,255,0.9)" />
      </g>
      <path d={lowerLashes} fill="none" stroke="rgba(217,201,255,0.55)" strokeWidth="2" strokeLinecap="round" />
      <path d={cubic(lower)} fill="none" stroke="rgba(217,201,255,0.6)" strokeWidth="2.4" />
      <path d={cubic(upper)} fill="none" stroke="rgba(142,91,255,0.22)" strokeWidth="16" />
      <path d={cubic(upper)} fill="none" stroke="#F7F3FA" strokeWidth="3.4" />
      {lashes.map((q, i) => {
        const pts = lashOutline(q, 10);
        let d = `M${f(pts[0])} ${f(pts[1])}`;
        for (let j = 2; j < pts.length; j += 2) d += `L${f(pts[j])} ${f(pts[j + 1])}`;
        return <path key={i} d={d + "Z"} fill={i % 3 === 0 ? "#E4D8FD" : "#F7F3FA"} />;
      })}
      {lashes.map((q, i) => {
        const [x, y] = lashPoint(q, 1);
        return <circle key={i} cx={f(x)} cy={f(y)} r={22 + q.glint * 12} fill="url(#ls-glint)" opacity={Math.max(0.35, q.glint)} />;
      })}
    </svg>
  );
}
