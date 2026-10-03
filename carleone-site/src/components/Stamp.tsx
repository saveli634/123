import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** Фильтр «чернила»: неровный край и пропуски краски. Определяется один раз в документе. */
export function InkFilter() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <filter id="ink" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n"
          scale="2.4"
          xChannelSelector="R"
          yChannelSelector="G"
          result="d"
        />
        <feTurbulence type="fractalNoise" baseFrequency="0.35" numOctaves="3" seed="9" result="m" />
        <feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.2 1.75" result="mask" />
        <feComposite in="d" in2="mask" operator="in" />
      </filter>
    </svg>
  );
}

/**
 * Круглый штамп «в паспорте»: название страны в центре, по кругу — Carleone Service · Казахстан.
 * Без дат и номеров. Цвет — бордо (currentColor).
 */
export function Stamp({
  id,
  country,
  ring,
  rotate,
  on,
  still,
  className,
  style,
}: {
  id: string;
  country: string;
  ring: string;
  rotate: number;
  on: boolean;
  still?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const ringText = ring.toUpperCase();
  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("stamp", still && "static", className)}
      data-on={on ? "" : undefined}
      style={{ "--r": `${rotate}deg`, ...style } as CSSProperties}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path id={`ring-${id}`} d="M60 60m-45.5 0a45.5 45.5 0 1 1 91 0a45.5 45.5 0 1 1-91 0" />
      </defs>
      <g filter="url(#ink)" fill="currentColor" stroke="currentColor" fontFamily="Manrope, Arial, sans-serif">
        <circle cx="60" cy="60" r="56.5" fill="none" strokeWidth="3.2" />
        <circle cx="60" cy="60" r="51.5" fill="none" strokeWidth="1" />
        <circle cx="60" cy="60" r="37" fill="none" strokeWidth="1.2" />
        <text fontSize="8" fontWeight="600" stroke="none">
          <textPath href={`#ring-${id}`} xlinkHref={`#ring-${id}`} textLength="282" lengthAdjust="spacing">
            {ringText}
          </textPath>
        </text>
        <path d="M60 30.5l1.6 3.6 3.9.4-2.9 2.6.8 3.8-3.4-2-3.4 2 .8-3.8-2.9-2.6 3.9-.4z" stroke="none" />
        <path d="M60 79.5l1.6 3.6 3.9.4-2.9 2.6.8 3.8-3.4-2-3.4 2 .8-3.8-2.9-2.6 3.9-.4z" stroke="none" />
        <line x1="29" y1="51" x2="91" y2="51" strokeWidth="0.9" />
        <line x1="29" y1="69" x2="91" y2="69" strokeWidth="0.9" />
        <text
          x="60"
          y="63.6"
          textAnchor="middle"
          fontSize="11"
          fontWeight="600"
          letterSpacing="0.6"
          stroke="none"
          textLength={country.length > 7 ? 60 : undefined}
          lengthAdjust="spacingAndGlyphs"
        >
          {country.toUpperCase()}
        </text>
      </g>
    </svg>
  );
}
