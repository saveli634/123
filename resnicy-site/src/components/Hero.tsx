import { useEffect, useRef } from "react";
import { Photo } from "./Photo";
import { Arrow, MagLink } from "./Buttons";
import { Silk } from "./Silk";
import { Aurora } from "./Aurora";
import { ScrollTrigger, motionStarted } from "@/lib/motion";
import { clamp, easeInOut, mix, smooth } from "@/lib/env";
import { site } from "@/site.config";

/**
 * Глаз-«миндаль»: пересечение двух кругов. Ширина w, высота 1,6·w:
 * радиус R = 0,89·w, центры кругов сдвинуты от центра фигуры на d = 0,39·w.
 */
const R_K = 0.89;
const D_K = 0.39;

/** Ширина «миндаля», при которой он закрывает весь экран (оба круга накрывают углы). */
function coverWidth(W: number, H: number) {
  const a = R_K * R_K - D_K * D_K;
  const b = D_K * W;
  const c = (W * W + H * H) / 4;
  return ((b + Math.sqrt(b * b + 4 * a * c)) / (2 * a)) * 1.03;
}

function almondPath(cx: number, cy: number, w: number) {
  const R = R_K * w;
  const h = 0.8 * w * 2;
  const top = cy - h / 2;
  const bottom = cy + h / 2;
  return `M${cx.toFixed(1)} ${top.toFixed(1)}A${R.toFixed(1)} ${R.toFixed(1)} 0 0 1 ${cx.toFixed(1)} ${bottom.toFixed(1)}A${R.toFixed(1)} ${R.toFixed(1)} 0 0 1 ${cx.toFixed(1)} ${top.toFixed(1)}Z`;
}

const RING = "ламинирование ресниц · наращивание ресниц · Минск · ";

export function Hero() {
  const section = useRef<HTMLElement>(null);
  const eyeA = useRef<HTMLDivElement>(null);
  const eyeB = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const fade = useRef<HTMLDivElement>(null);
  const eyebrow = useRef<HTMLParagraphElement>(null);
  const outline = useRef<SVGPathElement>(null);
  const lines = useRef<HTMLHeadingElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  const reveal = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const sec = section.current!;
    const A = eyeA.current!;
    const B = eyeB.current!;
    let W = 0;
    let H = 0;
    let w0 = 0;
    let cx0 = 0;
    let cy0 = 0;
    let wMax = 0;
    let s0 = 0.5;

    // стартовые размеры берём из CSS-переменных (они же работают без скриптов)
    const measure = () => {
      // размеры без учёта трансформаций (во время появления «глаз» слегка уменьшен)
      W = A.offsetWidth;
      H = A.offsetHeight;
      const probe = document.createElement("div");
      probe.style.cssText = `position:absolute;visibility:hidden;width:var(--w);left:var(--cx);top:var(--cy)`;
      A.appendChild(probe);
      w0 = probe.offsetWidth;
      cx0 = probe.offsetLeft;
      cy0 = probe.offsetTop;
      A.removeChild(probe);
      wMax = coverWidth(W, H);
      // в начале фото уменьшено, чтобы весь глаз с ресницами помещался в «миндаль» (уменьшение — без потери резкости)
      s0 = Math.min(1, (w0 * 1.3) / (0.55 * Math.max(W, H)));
    };

    const apply = (p: number) => {
      const e = easeInOut(smooth(0, 0.6, p));
      const w = mix(w0, wMax, e);
      const cx = mix(cx0, W / 2, e);
      const cy = mix(cy0, H / 2, e);
      const R = R_K * w;
      const d = D_K * w;
      const clip = (el: HTMLElement, x: number) => {
        const v = `circle(${R.toFixed(1)}px at ${x.toFixed(1)}px ${cy.toFixed(1)}px)`;
        el.style.setProperty("clip-path", v);
        el.style.setProperty("-webkit-clip-path", v);
      };
      clip(A, cx + d);
      clip(B, cx - d);
      if (photo.current)
        // фото увеличивается чуть быстрее, чем растёт вырез, — края экрана всегда закрыты
        photo.current.style.transform = `translate3d(${(cx - W / 2).toFixed(1)}px,${(cy - H / 2).toFixed(1)}px,0) scale(${mix(s0, 1.02, easeInOut(smooth(0, 0.46, p))).toFixed(4)})`;
      if (outline.current) {
        outline.current.setAttribute("d", almondPath(cx, cy, w * 1.07));
        outline.current.style.opacity = String(clamp(1 - e * 4));
      }
      if (ring.current) {
        ring.current.style.opacity = String(clamp(1 - e * 5));
        ring.current.style.transform = `translate3d(${(cx - cx0).toFixed(1)}px,${(cy - cy0).toFixed(1)}px,0)`;
      }
      // строки заголовка разъезжаются и гаснут
      const out = smooth(0.04, 0.42, p);
      if (lines.current) {
        const ls = lines.current.querySelectorAll<HTMLElement>(".ht");
        const vw = W / 100;
        const vh = H / 100;
        const moves = [
          [-14 * vw, -8 * vh],
          [10 * vw, 0],
          [18 * vw, 9 * vh],
        ];
        ls.forEach((l, i) => {
          l.style.transform = `translate3d(${(moves[i][0] * out).toFixed(1)}px,${(moves[i][1] * out).toFixed(1)}px,0)`;
          l.style.opacity = String(1 - out);
        });
      }
      if (foot.current) {
        const f = smooth(0, 0.16, p);
        foot.current.style.opacity = String(1 - f);
        foot.current.style.transform = `translate3d(0,${(f * 30).toFixed(1)}px,0)`;
        foot.current.style.visibility = f > 0.99 ? "hidden" : "";
      }
      if (cue.current) cue.current.style.opacity = String(1 - smooth(0, 0.08, p));
      if (eyebrow.current) eyebrow.current.style.opacity = String(1 - smooth(0.02, 0.2, p));
      if (reveal.current) {
        const r = smooth(0.56, 0.7, p) * (1 - smooth(0.86, 0.97, p));
        reveal.current.style.opacity = r.toFixed(3);
        reveal.current.style.transform = `translate3d(0,${((1 - smooth(0.56, 0.72, p)) * 40).toFixed(1)}px,0)`;
        reveal.current.style.visibility = r < 0.01 ? "hidden" : "visible";
      }
      // снизу — затемнение под надпись, в конце — уход в чернила (там начинается сцена «Подъём»)
      if (shade.current) shade.current.style.opacity = smooth(0.48, 0.66, p).toFixed(3);
      if (fade.current) fade.current.style.opacity = smooth(0.84, 1, p).toFixed(3);
    };

    if (!motionStarted()) return;
    measure();
    const st = ScrollTrigger.create({
      trigger: sec,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => {
        measure();
        apply(self.progress);
      },
    });
    apply(st.progress);
    return () => st.kill();
  }, []);

  return (
    <section className="hero" id="top" ref={section}>
      <div className="hero-sticky">
        <div className="hero-bg" aria-hidden="true">
          <Aurora />
          <Silk className="hero-silk" />
        </div>

        <div className="eye" ref={eyeA}>
          <div className="eye-b" ref={eyeB}>
            <div className="eye-photo" ref={photo}>
              <Photo
                name="hero"
                eager
                alt="Ламинированные ресницы крупным планом: реснички подняты и разделены, зелёный глаз"
                sizes="100vw"
                position="48% 52%"
              />
            </div>
            <div className="eye-shade" ref={shade} />
            <div className="eye-fade" ref={fade} />
          </div>
        </div>
        <svg className="eye-outline" aria-hidden="true">
          <path ref={outline} />
        </svg>

        <div className="hero-ring" ref={ring} aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <defs>
              <path id="ring-path" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" />
            </defs>
            <text>
              <textPath href="#ring-path" textLength="486" lengthAdjust="spacing">
                {RING}
              </textPath>
            </text>
          </svg>
          <span className="hero-ring-dot" />
        </div>

        <div className="hero-content">
          <p className="eyebrow hero-eyebrow" ref={eyebrow} data-hero style={{ "--i": 0 } as React.CSSProperties}>
            Ламинирование и наращивание ресниц · {site.city}
          </p>
          <h1 className="hero-title" ref={lines}>
            <span className="ht ht-1">
              <span className="ht-mask">
                <span data-hero style={{ "--i": 1 } as React.CSSProperties}>
                  Ресницы,
                </span>
              </span>
            </span>
            <span className="ht ht-2">
              <span className="ht-mask">
                <span data-hero style={{ "--i": 2 } as React.CSSProperties}>
                  которые <em>поднимают</em>
                </span>
              </span>
            </span>
            <span className="ht ht-3">
              <span className="ht-mask">
                <span data-hero style={{ "--i": 3 } as React.CSSProperties}>
                  взгляд
                </span>
              </span>
            </span>
          </h1>
          <div className="hero-foot" ref={foot}>
            <p className="hero-lead" data-hero style={{ "--i": 4 } as React.CSSProperties}>
              {site.masterName ? `Я — ${site.masterName}. ` : ""}Ламинирую и наращиваю ресницы в Минске. Час на процедуру — и меньше
              времени на сборы.
            </p>
            <div className="hero-actions" data-hero style={{ "--i": 5 } as React.CSSProperties}>
              <MagLink href="#zapis" variant="light" icon={<Arrow />} shine>
                Записаться
              </MagLink>
              <MagLink href="#raboty" variant="ghost">
                Смотреть работы
              </MagLink>
            </div>
          </div>
        </div>

        <div className="hero-reveal" ref={reveal} aria-hidden="true">
          <p className="hero-reveal-kicker">ламинирование ресниц</p>
          <p className="hero-reveal-big">
            Процедура — <em>всего 1 час</em>
          </p>
        </div>

        <a className="scroll-cue" href="#podyom" aria-label="Листать дальше" ref={cue}>
          <span className="scroll-cue-line" aria-hidden="true" />
          <span>листай</span>
        </a>
      </div>
    </section>
  );
}
