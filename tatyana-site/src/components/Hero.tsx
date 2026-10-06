import { useEffect, useRef } from "react";
import { hasBooking, fullName } from "@/data/site.config";
import { finePointer, lerp, motionOk } from "@/lib/motion";
import { ScrollTrigger } from "@/lib/scroll";
import { Btn } from "./ui";
import { SPARKLE } from "./glyphs";

/** Орбиты вокруг «затмения»: декоративная астролябия первого экрана */
const TILT = -16;
const ORBITS = [
  { rx: 158, ry: 50 },
  { rx: 222, ry: 72 },
  { rx: 284, ry: 96 },
];
const PLANETS = [
  { o: 0, period: 26, phase: 0.18, kind: "gold", r: 4.6 },
  { o: 1, period: 40, phase: 0.62, kind: "ringed", r: 7.5 },
  { o: 2, period: 64, phase: 0.08, kind: "pale", r: 3 },
  { o: 2, period: 64, phase: 0.56, kind: "lilac", r: 5.2 },
];
const TAU = Math.PI * 2;

const pos = (i: number, phase: number) => {
  const p = PLANETS[i];
  const th = phase * TAU;
  const { rx, ry } = ORBITS[p.o];
  return { x: rx * Math.cos(th), y: ry * Math.sin(th), front: Math.sin(th) > 0 };
};

function Planet({ i, x, y }: { i: number; x: number; y: number }) {
  const p = PLANETS[i];
  return (
    <g className={`orr__planet orr__planet--${p.kind}`} data-i={i} transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}>
      <circle className="orr__halo" r={p.r * 3.2} />
      <circle className="orr__body" r={p.r} />
      {p.kind === "ringed" && <ellipse className="orr__ring" rx={p.r * 2.1} ry={p.r * 0.62} transform="rotate(-8)" />}
    </g>
  );
}

function Orrery() {
  const svg = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = svg.current;
    if (!el || !motionOk()) return;
    const back = el.querySelector<SVGGElement>(".orr__back-planets")!;
    const front = el.querySelector<SVGGElement>(".orr__front-planets")!;
    const nodes = Array.from(el.querySelectorAll<SVGGElement>(".orr__planet")).sort(
      (a, b) => Number(a.dataset.i) - Number(b.dataset.i),
    );
    const layers = Array.from(el.querySelectorAll<SVGGElement>("[data-depth]"));
    const fine = finePointer();
    let tx = 0;
    let ty = 0;
    let px = 0;
    let py = 0;
    let raf = 0;
    let visible = true;
    let t0 = performance.now();
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const t = (now - t0) / 1000;
      nodes.forEach((n, i) => {
        const p = PLANETS[i];
        const q = pos(i, p.phase + t / p.period);
        n.setAttribute("transform", `translate(${q.x.toFixed(2)} ${q.y.toFixed(2)})`);
        const parent = q.front ? front : back;
        if (n.parentNode !== parent) parent.appendChild(n);
      });
      if (!fine) {
        // на телефоне — лёгкое «дыхание» вместо следования за курсором
        tx = Math.sin(t * 0.25) * 0.5;
        ty = Math.cos(t * 0.19) * 0.4;
      }
      px = lerp(px, tx, 0.06);
      py = lerp(py, ty, 0.06);
      layers.forEach((l) => {
        const d = Number(l.dataset.depth);
        l.setAttribute("transform", `translate(${(px * d).toFixed(2)} ${(py * d).toFixed(2)})`);
      });
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    });
    io.observe(el);
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && visible) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", vis);
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("pointermove", onMove);
      t0 = 0;
    };
  }, []);

  const initial = PLANETS.map((p, i) => ({ i, ...pos(i, p.phase) }));
  const half = (rx: number, ry: number, top: boolean) => `M${-rx} 0A${rx} ${ry} 0 0 ${top ? 1 : 0} ${rx} 0`;

  return (
    <svg ref={svg} className="orr" viewBox="-320 -320 640 640" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="orr-corona" r="0.5">
          <stop offset="0.5" stopColor="#A78BFA" stopOpacity="0" />
          <stop offset="0.56" stopColor="#EDE4FF" stopOpacity="0.55" />
          <stop offset="0.62" stopColor="#A78BFA" stopOpacity="0.32" />
          <stop offset="0.78" stopColor="#5B2BE0" stopOpacity="0.12" />
          <stop offset="1" stopColor="#5B2BE0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="orr-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#E6CF9A" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#A78BFA" stopOpacity="0.35" />
          <stop offset="1" stopColor="#A78BFA" stopOpacity="0.05" />
        </linearGradient>
        <radialGradient id="orr-gold" cx="0.35" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#FFF4DA" />
          <stop offset="0.6" stopColor="#E6CF9A" />
          <stop offset="1" stopColor="#8F7442" />
        </radialGradient>
        <radialGradient id="orr-lilac" cx="0.35" cy="0.35" r="0.75">
          <stop offset="0" stopColor="#F3EDFF" />
          <stop offset="0.55" stopColor="#A78BFA" />
          <stop offset="1" stopColor="#4A2A9E" />
        </radialGradient>
        <radialGradient id="orr-halo" r="0.5">
          <stop offset="0" stopColor="#EDE4FF" stopOpacity="0.4" />
          <stop offset="1" stopColor="#A78BFA" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g data-depth="16">
        <g className="orr__dial">
          <circle r="304" className="orr__ticks" />
          <circle r="296" className="orr__ticks orr__ticks--major" />
          <circle r="312" className="orr__thin" />
        </g>
      </g>

      <g data-depth="9">
        <g transform={`rotate(${TILT})`}>
          {ORBITS.map((o, i) => (
            <path key={i} d={half(o.rx, o.ry, true)} className={`orr__orbit orr__orbit--back${i === 1 ? " orr__orbit--dash" : ""}`} />
          ))}
          <g className="orr__back-planets">
            {initial.filter((p) => !p.front).map((p) => (
              <Planet key={p.i} i={p.i} x={p.x} y={p.y} />
            ))}
          </g>
        </g>
      </g>

      <g data-depth="3">
        <circle r="190" fill="url(#orr-corona)" className="orr__corona" />
      </g>
      <circle r="98" className="orr__disk" />
      <circle r="98" className="orr__rim" stroke="url(#orr-rim)" />

      <g data-depth="9">
        <g transform={`rotate(${TILT})`}>
          {ORBITS.map((o, i) => (
            <path key={i} d={half(o.rx, o.ry, false)} className={`orr__orbit${i === 1 ? " orr__orbit--dash" : ""}`} />
          ))}
          <g className="orr__front-planets">
            {initial.filter((p) => p.front).map((p) => (
              <Planet key={p.i} i={p.i} x={p.x} y={p.y} />
            ))}
          </g>
        </g>
      </g>

      <g className="orr__flare" transform="translate(66 -72)">
        <circle r="16" fill="url(#orr-halo)" />
        <path d={SPARKLE} transform="translate(-13 -13) scale(1.08)" fill="#FFF8EA" />
      </g>
    </svg>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const glow = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionOk()) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom top",
      onUpdate: (s) => el.style.setProperty("--hx", s.progress.toFixed(4)),
    });
    // свечение за курсором (только transform — без перерисовки градиента)
    const g = glow.current;
    let raf = 0;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let started = false;
    const loop = () => {
      x = lerp(x, tx, 0.07);
      y = lerp(y, ty, 0.07);
      if (g) g.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      raf = Math.abs(x - tx) + Math.abs(y - ty) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !g) return;
      const r = el.getBoundingClientRect();
      if (e.clientY > r.bottom) return;
      // смещение от исходной точки свечения (его центр задан в CSS)
      const base = g.offsetParent ? g.getBoundingClientRect() : null;
      if (!base) return;
      const cx = base.left - x + base.width / 2;
      const cy = base.top - y + base.height / 2;
      tx = e.clientX - cx;
      ty = e.clientY - cy;
      if (!started) {
        started = true;
        g.classList.add("is-follow");
      }
      if (!raf) raf = requestAnimationFrame(loop);
    };
    if (finePointer()) window.addEventListener("pointermove", move, { passive: true });
    return () => {
      st.kill();
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return (
    <section id="top" ref={ref} className="hero" aria-labelledby="hero-title">
      <div ref={glow} className="hero__glow" aria-hidden="true" />
      <div className="hero__orr">
        <Orrery />
      </div>
      <div className="hero__horizon" aria-hidden="true" />
      <div className="wrap hero__inner">
        <p className="eyebrow hero-in" style={{ ["--d" as string]: 0 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" className="eyebrow__star" aria-hidden="true">
            <path d={SPARKLE} fill="currentColor" />
          </svg>
          <span>
            {fullName}
            <span className="hide-sm"> · нумерология и натальная карта</span>
          </span>
        </p>
        <h1 id="hero-title" className="hero__title">
          <span className="hero__line">
            <span className="hero-in" style={{ ["--d" as string]: 1 }}>
              Карта,
            </span>
          </span>{" "}
          <span className="hero__line">
            <span className="hero-in" style={{ ["--d" as string]: 2 }}>
              которая объясняет,
            </span>
          </span>{" "}
          <span className="hero__line">
            <em className="hero-in" style={{ ["--d" as string]: 3 }}>
              зачем вы здесь
            </em>
          </span>
        </h1>
        <p className="hero__sub hero-in" style={{ ["--d" as string]: 4 }}>
          Нумерологический расчёт по дате рождения и натальная карта
        </p>
        <div className="hero__actions hero-in" style={{ ["--d" as string]: 5 }}>
          {hasBooking && <Btn href="#zapis">Записаться на расчёт</Btn>}
          <Btn href="#chislo" variant={hasBooking ? "ghost" : "primary"}>
            Узнать своё число
          </Btn>
        </div>
      </div>
      <a href="#nebo" className="hero__cue hero-in" style={{ ["--d" as string]: 7 }}>
        <span>Как это работает</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
