import { forwardRef } from "react";
import { ZODIAC, ZODIAC_ORDER, PLANETS, SPARKLE, type PlanetId } from "./glyphs";
import { easeOut, lerp, seg } from "@/lib/motion";

/**
 * Натальное колесо. Все параметры — в одном месте (углы, радиусы, фазы),
 * одна функция renderWheel(svg, progress) рисует любой момент сцены от 0 до 1.
 * Без JS и при «уменьшить движение» — готовое статичное колесо (progress = 1).
 * Положение планет декоративное (подпись «иллюстрация»).
 */

// углы в градусах: 0 — верх, по часовой стрелке
const pt = (deg: number, r: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [r * Math.sin(a), -r * Math.cos(a)];
};
const f = (n: number) => n.toFixed(2);
const circlePath = (r: number) => `M0 ${-r}A${r} ${r} 0 1 1 0 ${r}A${r} ${r} 0 1 1 0 ${-r}`;
const radial = (deg: number, r1: number, r2: number) => {
  const [x1, y1] = pt(deg, r1);
  const [x2, y2] = pt(deg, r2);
  return `M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`;
};

export const W = {
  rims: [300, 290, 250, 170, 62],
  band: [250, 290] as const,
  glyphR: 270,
  houses: [6, 33, 61, 94, 127, 158, 186, 213, 241, 274, 307, 338],
  planetDotR: 170,
  planetGlyphR: 211,
  planets: [
    { id: "sun", lon: 18 },
    { id: "mercury", lon: 37 },
    { id: "moon", lon: 74 },
    { id: "mars", lon: 128 },
    { id: "uranus", lon: 162 },
    { id: "jupiter", lon: 205 },
    { id: "saturn", lon: 248 },
    { id: "neptune", lon: 295 },
    { id: "pluto", lon: 321 },
    { id: "venus", lon: 352 },
  ] as { id: PlanetId; lon: number }[],
  // пары планет (индексы), между которыми рисуются аспекты; tone: 0 — сиреневый, 1 — золотой
  aspects: [
    [0, 3, 0],
    [0, 6, 1],
    [2, 4, 1],
    [1, 5, 0],
    [9, 4, 1],
    [5, 8, 0],
    [6, 9, 0],
    [2, 7, 1],
    [3, 7, 0],
  ] as [number, number, number][],
  labels: [
    { text: "число", deg: 0 },
    { text: "месяц", deg: 72 },
    { text: "год", deg: 144 },
    { text: "город", deg: 216 },
    { text: "время", deg: 288 },
  ],
  labelR: 322,
  rot: [-28, 14] as const,
};

/** Прогресс по этапам сцены */
export const STAGES = [0, 0.2, 0.42, 0.7];
export const stageOf = (p: number) => (p >= STAGES[3] ? 3 : p >= STAGES[2] ? 2 : p >= STAGES[1] ? 1 : 0);

const dash = (el: SVGElement, k: number) => {
  el.style.strokeDashoffset = f(1 - k);
};

interface Cache {
  rims: SVGPathElement[];
  ticks: SVGPathElement;
  signs: SVGPathElement[];
  houses: SVGPathElement[];
  glyphs: SVGGElement[];
  planets: SVGGElement[];
  planetGlyphs: SVGGElement[];
  aspects: SVGPathElement[];
  aspectsG: SVGGElement;
  labels: SVGGElement[];
  center: SVGGElement;
  spin: SVGGElement;
}
const caches = new WeakMap<SVGSVGElement, Cache>();

function cache(svg: SVGSVGElement): Cache {
  let c = caches.get(svg);
  if (c) return c;
  const q = <T extends Element>(s: string) => Array.from(svg.querySelectorAll<T & SVGElement>(s)) as unknown as T[];
  c = {
    rims: q<SVGPathElement>(".w-rim"),
    ticks: svg.querySelector<SVGPathElement>(".w-ticks")!,
    signs: q<SVGPathElement>(".w-sign"),
    houses: q<SVGPathElement>(".w-house"),
    glyphs: q<SVGGElement>(".w-glyph"),
    planets: q<SVGGElement>(".w-planet"),
    planetGlyphs: q<SVGGElement>(".w-pglyph"),
    aspects: q<SVGPathElement>(".w-aspect"),
    aspectsG: svg.querySelector<SVGGElement>(".w-aspects")!,
    labels: q<SVGGElement>(".w-label"),
    center: svg.querySelector<SVGGElement>(".w-center")!,
    spin: svg.querySelector<SVGGElement>(".w-spin")!,
  };
  caches.set(svg, c);
  return c;
}

const GLYPH_POS = ZODIAC_ORDER.map((_, i) => pt(15 + i * 30, W.glyphR));

/** Рисует колесо в момент p ∈ [0, 1] */
export function renderWheel(svg: SVGSVGElement, p: number) {
  const c = cache(svg);
  const rot = lerp(W.rot[0], W.rot[1], p);
  c.spin.setAttribute("transform", `rotate(${f(rot)})`);

  c.rims.forEach((el, i) => dash(el, easeOut(seg(p, 0.01 + i * 0.03, 0.13 + i * 0.03))));
  c.ticks.style.opacity = f(seg(p, 0.1, 0.2));
  c.signs.forEach((el, i) => dash(el, seg(p, 0.16 + i * 0.008, 0.22 + i * 0.008)));
  c.houses.forEach((el, i) => dash(el, easeOut(seg(p, 0.2 + i * 0.01, 0.3 + i * 0.01))));

  c.glyphs.forEach((el, i) => {
    const k = easeOut(seg(p, 0.2 + i * 0.016, 0.3 + i * 0.016));
    const [x, y] = GLYPH_POS[i];
    el.style.opacity = f(k);
    el.setAttribute("transform", `translate(${f(x)} ${f(y)}) rotate(${f(-rot)}) scale(${f(1.4 * (0.55 + 0.45 * k))}) translate(-12 -12)`);
  });

  c.planets.forEach((el, j) => {
    const k = easeOut(seg(p, 0.4 + j * 0.022, 0.54 + j * 0.022));
    const a = W.planets[j].lon - (1 - k) * 110;
    el.style.opacity = f(k);
    el.setAttribute("transform", `rotate(${f(a)}) translate(0 ${f(-(1 - k) * 150)})`);
    c.planetGlyphs[j].setAttribute(
      "transform",
      `translate(0 ${-W.planetGlyphR}) rotate(${f(-(a + rot))}) scale(1.12) translate(-12 -12)`,
    );
  });

  c.aspects.forEach((el, i) => dash(el, easeOut(seg(p, 0.56 + i * 0.014, 0.68 + i * 0.014))));
  const ck = easeOut(seg(p, 0.9, 0.985));
  c.aspectsG.style.opacity = f(1 - ck * 0.55);

  c.labels.forEach((el, i) => {
    const k = seg(p, 0.72 + i * 0.04, 0.77 + i * 0.04);
    el.style.opacity = f(0.16 + 0.84 * k);
    el.classList.toggle("is-lit", k >= 1);
  });

  c.center.style.opacity = f(ck);
  c.center.setAttribute("transform", `translate(0 ${f((1 - ck) * 10)})`);
}

const ticksPath = (() => {
  let d = "";
  for (let i = 0; i < 72; i++) if (i % 6) d += radial(i * 5, 290, 297);
  return d;
})();

// дуги для подписей: верхние читаются по часовой, нижние — против, чтобы текст не был вверх ногами
const R = W.labelR;
const topArc = `M0 ${R}A${R} ${R} 0 1 1 0 ${-R}A${R} ${R} 0 1 1 0 ${R}`; // старт снизу, по часовой
const R2 = R + 21;
const botArc = `M0 ${-R2}A${R2} ${R2} 0 1 0 0 ${R2}A${R2} ${R2} 0 1 0 0 ${-R2}`; // старт сверху, против часовой
const labelOffset = (deg: number) => {
  const lower = deg > 90 && deg < 270;
  const off = lower ? ((360 - deg) % 360) / 360 : (((deg - 180) % 360) + 360) % 360 / 360;
  return { lower, off: `${(off * 100).toFixed(2)}%` };
};

interface WheelProps {
  idPrefix?: string;
  className?: string;
}

export const Wheel = forwardRef<SVGSVGElement, WheelProps>(function Wheel({ idPrefix = "w", className = "" }, ref) {
  const rot = W.rot[1];
  return (
    <svg
      ref={ref}
      className={`wheel ${className}`}
      viewBox="-372 -372 744 744"
      role="img"
      aria-label="Натальное колесо: двенадцать знаков зодиака, планеты и аспекты между ними. Пять ключей к карте: число, месяц, год, город и время рождения. Иллюстрация."
    >
      <defs>
        <radialGradient id={`${idPrefix}-core`} r="0.5">
          <stop offset="0" stopColor="#1B0B3A" stopOpacity="0.95" />
          <stop offset="0.7" stopColor="#0E0624" stopOpacity="0.92" />
          <stop offset="1" stopColor="#070312" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${idPrefix}-glow`} r="0.5">
          <stop offset="0.6" stopColor="#5B2BE0" stopOpacity="0" />
          <stop offset="0.84" stopColor="#5B2BE0" stopOpacity="0.16" />
          <stop offset="1" stopColor="#5B2BE0" stopOpacity="0" />
        </radialGradient>
        <path id={`${idPrefix}-top`} d={topArc} />
        <path id={`${idPrefix}-bot`} d={botArc} />
      </defs>

      <circle r="350" fill={`url(#${idPrefix}-glow)`} className="w-aura" />

      <g className="w-spin" transform={`rotate(${rot})`}>
        <circle r={W.band[1]} className="w-bandfill" />
        {W.rims.map((r, i) => (
          <path key={r} d={circlePath(r)} pathLength={1} className={`w-rim${i === 0 ? " w-rim--outer" : ""}`} />
        ))}
        <path d={ticksPath} className="w-ticks" />
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={radial(i * 30, W.band[0], 300)} pathLength={1} className="w-sign" />
        ))}
        {W.houses.map((deg, i) => (
          <path key={deg} d={radial(deg, W.rims[4], W.band[0])} pathLength={1} className={`w-house${i % 3 === 0 ? " w-house--axis" : ""}`} />
        ))}
        {ZODIAC_ORDER.map((id, i) => {
          const [x, y] = GLYPH_POS[i];
          return (
            <g key={id} className="w-glyph" transform={`translate(${f(x)} ${f(y)}) rotate(${-rot}) scale(1.4) translate(-12 -12)`}>
              <path d={ZODIAC[id]} />
            </g>
          );
        })}
        <g className="w-aspects">
          {W.aspects.map(([a, b, tone], i) => {
            const [x1, y1] = pt(W.planets[a].lon, W.planetDotR - 6);
            const [x2, y2] = pt(W.planets[b].lon, W.planetDotR - 6);
            return <path key={i} d={`M${f(x1)} ${f(y1)}L${f(x2)} ${f(y2)}`} pathLength={1} className={`w-aspect w-aspect--${tone}`} />;
          })}
        </g>
        {W.planets.map((pl) => (
          <g key={pl.id} className="w-planet" transform={`rotate(${pl.lon})`}>
            <path d={`M0 ${-W.planetDotR}V${-W.planetDotR - 14}`} className="w-ptick" />
            <circle cy={-W.planetDotR} r="4.2" className="w-pdot" />
            <g className="w-pglyph" transform={`translate(0 ${-W.planetGlyphR}) rotate(${-(pl.lon + rot)}) scale(1.12) translate(-12 -12)`}>
              <path d={PLANETS[pl.id]} />
            </g>
          </g>
        ))}
      </g>

      {W.labels.map((l) => {
        const { lower, off } = labelOffset(l.deg);
        const [mx, my] = pt(l.deg, 304);
        return (
          <g key={l.text} className="w-label is-lit">
            <path d={SPARKLE} transform={`translate(${f(mx - 7)} ${f(my - 7)}) scale(0.58)`} className="w-label__star" />
            <text className="w-label__text" dy={lower ? 0 : -2}>
              <textPath href={`#${idPrefix}-${lower ? "bot" : "top"}`} startOffset={off} textAnchor="middle">
                {l.text}
              </textPath>
            </text>
          </g>
        );
      })}

      <g className="w-center">
        <circle r="122" fill={`url(#${idPrefix}-core)`} />
        <text className="w-center__t1" y="-6" textAnchor="middle">
          Ваша карта
        </text>
        <text className="w-center__t2" y="34" textAnchor="middle">
          неба
        </text>
        <path d={SPARKLE} transform="translate(-8 52) scale(0.66)" className="w-center__star" />
      </g>
    </svg>
  );
});
