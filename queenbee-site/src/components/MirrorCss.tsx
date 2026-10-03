import { forwardRef } from "react";
import { Photo } from "./Photo";
import { img, type ImgName } from "@/content/media";
import { cropStyle, mirrorCrop } from "@/lib/crop";

/**
 * Зеркало-«гримёрка» на CSS/SVG: работает без JavaScript и без WebGL.
 * Пропорции совпадают с 3D-моделью (стекло = 1, оправа 1.035, кольцо света 1.08, край 1.16),
 * поэтому живая сцена встаёт ровно на его место.
 */
const LEDS = Array.from({ length: 64 }, (_, i) => {
  const a = Math.PI / 2 - (i / 64) * Math.PI * 2;
  return [Math.cos(a) * 1.08, -Math.sin(a) * 1.08];
});

export const MirrorCss = forwardRef<HTMLDivElement, { name: ImgName; alt: string; eager?: boolean; className?: string; sizes?: string }>(
  function MirrorCss({ name, alt, eager, className = "", sizes = "(max-width: 767px) 95vw, 45vw" }, ref) {
    const i = img(name);
    const crop = mirrorCrop(i.w, i.h, i.fx, i.fy);
    return (
      <div className={`cmirror ${className}`} ref={ref}>
        <span className="cmirror__glow" aria-hidden="true" />
        <svg className="cmirror__ring" viewBox="-1.16 -1.16 2.32 2.32" aria-hidden="true">
          <defs>
            <linearGradient id="cm-gold" x1="0" y1="-1" x2="0.4" y2="1">
              <stop offset="0" stopColor="#f3e2b8" />
              <stop offset="0.45" stopColor="#c9a462" />
              <stop offset="0.7" stopColor="#e9d3a0" />
              <stop offset="1" stopColor="#a8813f" />
            </linearGradient>
            <radialGradient id="cm-led">
              <stop offset="0" stopColor="#fffdf6" />
              <stop offset="0.45" stopColor="#ffe9c7" />
              <stop offset="1" stopColor="#ffe9c7" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle r="1.13" fill="none" stroke="#b48f4e" strokeWidth="0.02" />
          <circle r="1.08" fill="none" stroke="#efe6d6" strokeWidth="0.1" />
          <circle r="1.118" fill="none" stroke="url(#cm-gold)" strokeWidth="0.022" />
          <circle r="1.035" fill="none" stroke="url(#cm-gold)" strokeWidth="0.07" />
          <g className="cmirror__leds">
            {LEDS.map(([x, y], k) => (
              <circle key={k} cx={x.toFixed(4)} cy={y.toFixed(4)} r="0.045" fill="url(#cm-led)" style={{ animationDelay: `${(k / 64) * 0.8}s` }} />
            ))}
          </g>
        </svg>
        <div className="cmirror__glass">
          <span className="cmirror__photo" style={cropStyle(crop)}>
            <Photo name={name} alt={alt} eager={eager} sizes={sizes} />
          </span>
          <span className="cmirror__glint" aria-hidden="true" />
        </div>
      </div>
    );
  },
);
