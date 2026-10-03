import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent as RPointerEvent,
} from "react";
import { useLang, useT } from "@/lib/lang";
import { finePointer, motionOK, smooth } from "@/lib/env";
import { subscribe } from "@/lib/scroll";
import { LION_CUT_SUM, LION_D, LION_H, LION_PAD, LION_W } from "@/generated/lion";
import { Frame } from "@/components/Frame";
import { Kicker, Lines, q } from "@/components/Text";

// координаты рисунка наклейки (viewBox) — лев + поле высечки
const VBX = -LION_PAD;
const VBY = -LION_PAD;
const VBW = LION_W + LION_PAD * 2;
const VBH = LION_H + LION_PAD * 2;
const VIEWBOX = `${VBX} ${VBY} ${VBW} ${VBH}`;

/** Кривая движения сайта cubic-bezier(.2,.8,.2,1) для JS-анимаций. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sy = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) {
      const d = (3 * ax * t + 2 * bx) * t + cx;
      if (Math.abs(d) < 1e-6) break;
      t -= (sx(t) - x) / d;
    }
    return sy(Math.max(0, Math.min(1, t)));
  };
}
const ease = bezier(0.2, 0.8, 0.2, 1);

type State = { f: number; x: number; y: number; rot: number; lift: number };

/**
 * Фирменная наклейка: уголок можно отогнуть, наклейку — снять и переклеить (мышь);
 * на телефоне она отклеивается сама по мере прокрутки. Отгиб — честное отражение части наклейки
 * относительно линии сгиба (x + y = k): лицевая часть обрезается, «изнанка» зеркалится поверх.
 */
function StickerToy() {
  const t = useT();
  const zone = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const front = useRef<HTMLDivElement>(null);
  const flap = useRef<HTMLDivElement>(null);
  const shadow = useRef<HTMLDivElement>(null);
  const grad = useRef<SVGLinearGradientElement>(null);
  const st = useRef<State>({ f: 0.06, x: 0, y: 0, rot: -4, lift: 0 });
  const geo = useRef({
    S: 300,
    scale: 1,
    offX: 0,
    offY: 0,
    kMax: 600,
    kMin: 0,
    zw: 600,
    zh: 600,
  });
  const anim = useRef(0);
  const hoverWant = useRef(0.06);
  const [moved, setMoved] = useState(false);

  const IDLE = 0.06;

  /** Всё рисование — здесь: трансформы и обрезки, без перерисовок React. */
  const paint = () => {
    const s = st.current;
    const g = geo.current;
    const b = body.current;
    if (!b || !front.current || !flap.current) return;
    const S = g.S;
    const k = g.kMax - s.f * (g.kMax - g.kMin);
    b.style.transform = `translate3d(${s.x.toFixed(1)}px, ${(s.y - s.lift * 10).toFixed(1)}px, 0) rotate(${s.rot.toFixed(2)}deg) scale(${(1 + s.lift * 0.05).toFixed(4)})`;
    // лицевая часть: x + y ≤ k
    let stuck: string;
    let peeled: string;
    if (k >= S) {
      const a = k - S;
      stuck = `polygon(0 0, ${S}px 0, ${S}px ${a}px, ${a}px ${S}px, 0 ${S}px)`;
      peeled = `polygon(${S}px ${a}px, ${S}px ${S}px, ${a}px ${S}px)`;
    } else {
      const a = Math.max(0, k);
      stuck = `polygon(0 0, ${a}px 0, 0 ${a}px)`;
      peeled = `polygon(${a}px 0, ${S}px 0, ${S}px ${S}px, 0 ${S}px, 0 ${a}px)`;
    }
    front.current.style.clipPath = stuck;
    front.current.style.setProperty("-webkit-clip-path", stuck);
    flap.current.style.clipPath = peeled;
    flap.current.style.setProperty("-webkit-clip-path", peeled);
    // отражение относительно линии x + y = k
    flap.current.style.transform = `matrix(0, -1, -1, 0, ${k.toFixed(2)}, ${k.toFixed(2)})`;
    flap.current.style.visibility = s.f > 0.002 ? "visible" : "hidden";
    // тень изнанки у сгиба и «блик» вдоль сгиба
    if (grad.current) {
      const toV = (px: number) => (px - g.offX) / g.scale + VBX;
      const toVy = (px: number) => (px - g.offY) / g.scale + VBY;
      grad.current.setAttribute("x1", toV(k / 2).toFixed(1));
      grad.current.setAttribute("y1", toVy(k / 2).toFixed(1));
      grad.current.setAttribute("x2", toV(k / 2 + S * 0.45).toFixed(1));
      grad.current.setAttribute("y2", toVy(k / 2 + S * 0.45).toFixed(1));
    }
    if (shadow.current) {
      const l = s.lift;
      shadow.current.style.transform = `translate3d(${(4 + l * 18).toFixed(1)}px, ${(6 + l * 26).toFixed(1)}px, 0)`;
      shadow.current.style.setProperty("--blur", `${(3 + l * 14).toFixed(1)}px`);
      shadow.current.style.setProperty("--so", (0.55 - l * 0.2).toFixed(2));
    }
  };

  const measure = () => {
    const z = zone.current;
    if (!z) return;
    const zw = z.clientWidth;
    const zh = z.clientHeight;
    const S = Math.round(Math.min(zw, zh) * 0.62);
    const scale = S / Math.max(VBW, VBH);
    const offX = (S - VBW * scale) / 2;
    const offY = (S - VBH * scale) / 2;
    const toSum = (v: number) => scale * (v - VBX - VBY) + offX + offY;
    geo.current = {
      S,
      scale,
      offX,
      offY,
      kMax: toSum(LION_CUT_SUM[1]),
      kMin: toSum(LION_CUT_SUM[0]),
      zw,
      zh,
    };
    body.current?.style.setProperty("--sw", `${S}px`);
    body.current?.style.setProperty("--sh", `${S}px`);
    if (body.current) {
      body.current.style.left = `${((zw - S) / 2).toFixed(0)}px`;
      body.current.style.top = `${((zh - S) / 2).toFixed(0)}px`;
    }
    paint();
  };

  const tween = (to: Partial<State>, dur = 520) => {
    cancelAnimationFrame(anim.current);
    const from = { ...st.current };
    const start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const e = ease(k);
      (Object.keys(to) as (keyof State)[]).forEach((key) => {
        st.current[key] = from[key] + ((to[key] as number) - from[key]) * e;
      });
      paint();
      if (k < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    const fine = finePointer();
    let un = () => {};
    if (!fine && motionOK()) {
      // телефон: отклеивается по прокрутке
      un = subscribe(zone.current, "cover", (p) => {
        const s = st.current;
        s.f = IDLE + smooth(0.28, 0.66, p) * 0.5;
        s.lift = smooth(0.62, 0.82, p);
        s.rot = -4 - s.lift * 7;
        s.y = -s.lift * 14;
        paint();
      });
    } else if (!motionOK()) {
      st.current.f = 0.16;
      paint();
    }
    return () => {
      window.removeEventListener("resize", onResize);
      un();
      cancelAnimationFrame(anim.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- мышь: отгиб уголка, снятие, переклейка ------------------------------------------------
  const drag = useRef<{
    mode: "peel" | "hold";
    sum0: number;
    px: number;
    py: number;
    x0: number;
    y0: number;
    vx: number;
  } | null>(null);

  const local = (e: RPointerEvent) => {
    const r = body.current!.getBoundingClientRect();
    // поворот наклейки небольшой — для сумм x + y им можно пренебречь
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onDown = (e: RPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType !== "mouse" || !finePointer()) return;
    e.preventDefault();
    cancelAnimationFrame(anim.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = local(e);
    const g = geo.current;
    const nearCorner = p.x + p.y > g.kMax - g.S * 0.55;
    drag.current = {
      mode: nearCorner ? "peel" : "hold",
      sum0: p.x + p.y,
      px: e.clientX,
      py: e.clientY,
      x0: st.current.x,
      y0: st.current.y,
      vx: 0,
    };
    if (!nearCorner) tween({ lift: 1, f: IDLE }, 260);
  };

  const onMove = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) {
      // наведение: уголок приподнимается
      if (e.pointerType === "mouse" && st.current.lift === 0) {
        const p = local(e);
        const g = geo.current;
        const near = p.x + p.y > g.kMax - g.S * 0.55;
        const want = near ? 0.14 : IDLE;
        if (want !== hoverWant.current) {
          hoverWant.current = want;
          tween({ f: want }, 380);
        }
      }
      return;
    }
    const s = st.current;
    if (d.mode === "peel") {
      const p = local(e);
      const g = geo.current;
      const pulled = Math.max(0, d.sum0 - (p.x + p.y));
      s.f = Math.min(0.75, 0.14 + pulled / 2 / (g.kMax - g.kMin));
      paint();
      if (s.f > 0.55) {
        // сорвали: дальше наклейка «в руке»
        d.mode = "hold";
        d.px = e.clientX;
        d.py = e.clientY;
        d.x0 = s.x;
        d.y0 = s.y;
        tween({ f: IDLE, lift: 1 }, 340);
      }
      return;
    }
    const g = geo.current;
    const nx = d.x0 + (e.clientX - d.px);
    const ny = d.y0 + (e.clientY - d.py);
    const lim = (v: number, m: number) => Math.max(-m, Math.min(m, v));
    d.vx = d.vx * 0.7 + (nx - s.x) * 0.3;
    s.x = lim(nx, (g.zw - g.S) / 2 + g.S * 0.15);
    s.y = lim(ny, (g.zh - g.S) / 2 + g.S * 0.15);
    s.rot = -4 + lim(d.vx * 0.9, 10);
    paint();
  };

  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.mode === "peel") return tween({ f: IDLE }, 420);
    // приклеили на новое место: лёгкий «прижим»
    setMoved(Math.abs(st.current.x) + Math.abs(st.current.y) > 12);
    tween({ lift: 0, rot: -4 + (Math.random() - 0.5) * 6, f: IDLE }, 420);
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    if (st.current.f > 0.2 || moved) {
      setMoved(false);
      tween({ f: IDLE, x: 0, y: 0, lift: 0, rot: -4 }, 600);
    } else tween({ f: 0.42 }, 600);
  };

  const reset = () => {
    setMoved(false);
    tween({ f: IDLE, x: 0, y: 0, lift: 0, rot: -4 }, 700);
  };

  return (
    <div ref={zone} className="sticker-zone frame-shell">
      <Frame
        name="underbody_after_3"
        fill
        decorative
        className="sticker-surface no-border"
        sizes="(max-width: 767px) 92vw, 48vw"
      />
      <div ref={body} className="sticker">
        <div ref={shadow} className="absolute inset-0">
          <svg viewBox={VIEWBOX} className="sticker-shadow" aria-hidden="true">
            <use href="#lion-cut" xlinkHref="#lion-cut" fill="#000" />
          </svg>
        </div>
        <div ref={front} className="absolute inset-0">
          <svg viewBox={VIEWBOX} aria-hidden="true">
            <defs>
              <linearGradient id="st-vinyl" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#1f1819" />
                <stop offset="1" stopColor="#0c090a" />
              </linearGradient>
              <linearGradient id="st-foil" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f6dea4" />
                <stop offset="0.45" stopColor="#e3c182" />
                <stop offset="0.7" stopColor="#c69d58" />
                <stop offset="1" stopColor="#efd59a" />
              </linearGradient>
              <linearGradient id="st-gloss" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.42" stopColor="#fff" stopOpacity="0.09" />
                <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <use
              href="#lion-cut"
              xlinkHref="#lion-cut"
              fill="url(#st-vinyl)"
              stroke="#f3ecdd"
              strokeWidth="12"
              strokeLinejoin="round"
            />
            <path d={LION_D} fillRule="evenodd" fill="url(#st-foil)" />
            <use href="#lion-cut" xlinkHref="#lion-cut" fill="url(#st-gloss)" />
          </svg>
        </div>
        <div className="sticker-flap-wrap absolute inset-0">
          <div ref={flap} className="absolute inset-0" style={{ transformOrigin: "0 0", visibility: "hidden" }}>
            <svg viewBox={VIEWBOX} aria-hidden="true">
              <defs>
                <linearGradient ref={grad} id="st-back" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#8f8677" />
                  <stop offset="0.16" stopColor="#d9d0be" />
                  <stop offset="0.6" stopColor="#efe8d9" />
                  <stop offset="1" stopColor="#e2d9c6" />
                </linearGradient>
              </defs>
              <use
                href="#lion-cut"
                xlinkHref="#lion-cut"
                fill="url(#st-back)"
                stroke="#e4dccb"
                strokeWidth="12"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <button
          type="button"
          className="sticker-hit"
          data-cursor="drag"
          aria-label={t.a11y.sticker}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerLeave={() => {
            if (drag.current || st.current.lift !== 0) return;
            hoverWant.current = IDLE;
            tween({ f: IDLE }, 380);
          }}
          onKeyDown={onKey}
        />
      </div>
      {moved && (
        <button type="button" className="btn btn-ghost btn-sm absolute right-4 bottom-4 z-10 bg-ink/70" onClick={reset}>
          {t.sticker.reset}
        </button>
      )}
    </div>
  );
}

export function Sticker() {
  const { t, lang } = useLang();
  return (
    <section className="section" aria-labelledby="sticker-title">
      <div className="wrap">
        <Kicker>{t.sticker.label}</Kicker>
        <Lines id="sticker-title" lines={t.sticker.title} className="t-title mt-6" />
        <div className="grid-12 mt-[7vh] items-center gap-y-10">
          <div className="col-span-12 md:col-span-5" data-reveal="">
            <p className="fade-up t-quote text-[1.45rem] md:text-[1.9rem]" style={{ "--d": 120 } as CSSProperties}>
              {q(t.sticker.text, lang)}
            </p>
            <p className="fade-up t-body mt-6 max-w-md" style={{ "--d": 220 } as CSSProperties}>
              {q(t.sticker.wish, lang)}
            </p>
            <p className="fade-up t-label mt-8 text-muted" style={{ "--d": 320 } as CSSProperties}>
              <span className="hint-fine">{t.sticker.hintDesktop}</span>
              <span className="hint-touch">{t.sticker.hintTouch}</span>
            </p>
          </div>
          <div className="col-span-12 md:col-span-7 md:col-start-6 lg:col-span-6 lg:col-start-7">
            <StickerToy />
          </div>
        </div>
      </div>
    </section>
  );
}
