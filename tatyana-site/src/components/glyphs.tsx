import type { SignId } from "@/lib/numerology";

/**
 * Знаки зодиака и планеты — SVG-пути (не эмодзи и не символы шрифта),
 * рисуются линией в квадрате 24×24.
 */

export const ZODIAC: Record<SignId, string> = {
  aries:
    "M12 20.5V10M12 10C12 6 10 3.5 7.2 3.5 4.9 3.5 3.5 5.2 3.5 7.3c0 1.9 1.3 3.2 2.9 3.4M12 10c0-4 2-6.5 4.8-6.5 2.3 0 3.7 1.7 3.7 3.8 0 1.9-1.3 3.2-2.9 3.4",
  taurus: "M3.5 3.5c1 3.6 4 6 8.5 6s7.5-2.4 8.5-6M17.5 14.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z",
  gemini: "M4 4c5 1.6 11 1.6 16 0M4 20c5-1.6 11-1.6 16 0M8.5 5.1v13.8M15.5 5.1v13.8",
  cancer:
    "M20 8.3C18.4 5.6 15.4 4 12 4 7.6 4 4.2 6.3 4 9.2M9.2 9.4a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0zM4 15.7C5.6 18.4 8.6 20 12 20c4.4 0 7.8-2.3 8-5.2M20 14.6a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0z",
  leo: "M9.5 15.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM9.5 15.5C9.5 12 8 10.5 8 8c0-2.8 2.2-4.5 4.7-4.5S17.5 5.3 17.5 8c0 3.3-3 5.4-3 9 0 2.2 1.4 3.5 3.2 3.5 1.2 0 2.1-.6 2.8-1.6",
  virgo:
    "M3.5 6.5c1 0 1.8.7 1.8 2V19M5.3 9c0-1.8 1.1-2.6 2.4-2.6S10 7.3 10 9v10M10 9c0-1.8 1.1-2.6 2.4-2.6s2.3.9 2.3 2.6v6.5c0 2.6 1.6 4 3.6 4M14.7 13.4c1.3-1.6 3-2 4.3-1.2 1.6 1 1.3 3.6-.8 5.2-1.2.9-2.6 1.6-3.5 2.1",
  libra: "M3.5 20h17M3.5 16.2h5c-1.5-1.1-2.4-2.7-2.4-4.6a5.9 5.9 0 0 1 11.8 0c0 1.9-.9 3.5-2.4 4.6h5",
  scorpio:
    "M3.5 6.5c1 0 1.8.7 1.8 2V19M5.3 9c0-1.8 1.1-2.6 2.4-2.6S10 7.3 10 9v10M10 9c0-1.8 1.1-2.6 2.4-2.6s2.3.9 2.3 2.6v8.3c0 1.3.9 2.2 2.2 2.2h3.6M18.4 17.6l2.1 1.9-2.1 1.9",
  sagittarius: "M4 20L20 4M12.5 4H20v7.5M6.5 10.5l7 7",
  capricorn:
    "M3.5 5.5c1.7 0 2.8.9 3.3 2.6l2.8 10 3-10.6c.5-1.7 1.6-2.6 3-2.6 1.6 0 2.6 1.2 2.6 3.2v9.4c0 1.6 1 2.6 2.4 2.6 1.4 0 2.3-1 2.3-2.4s-1-2.4-2.4-2.4c-1.6 0-3 1.2-4.3 2.9",
  aquarius: "M3 10l3-2.6 3 2.6 3-2.6 3 2.6 3-2.6 3 2.6M3 16.6l3-2.6 3 2.6 3-2.6 3 2.6 3-2.6 3 2.6",
  pisces: "M6 3.5c3.6 3.6 3.6 13.4 0 17M18 3.5c-3.6 3.6-3.6 13.4 0 17M4.5 12h15",
};

/** Порядок по кругу, от Овна */
export const ZODIAC_ORDER: SignId[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

export const PLANETS = {
  sun: "M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0zM12.9 12a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0z",
  moon: "M15.5 3.8A8.5 8.5 0 1 0 15.5 20.2 7 7 0 0 1 15.5 3.8z",
  mercury: "M8 3.2a4 4 0 0 0 8 0M16.5 10.8a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0zM12 15.3v6.2M9 18.6h6",
  venus: "M17.5 9a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0zM12 14.5v7M8.7 18.2h6.6",
  mars: "M15 14.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0zM13.4 10.6L20 4M14.8 4H20v5.2",
  jupiter: "M4.5 7.6c0-2.4 1.8-4.1 4-4.1 2.5 0 4.3 2.2 3.4 5.2L7 16.4h13.5M16.3 5.5V21",
  saturn:
    "M7.2 3v13.5M4.5 6h5.4M7.2 11.3c1.2-1.6 2.7-2.4 4.5-2.4 2.4 0 4 1.6 4 3.9 0 2.3-1.7 3.6-1.7 5.6 0 1.4.9 2.3 2.3 2.3.9 0 1.6-.4 2.2-1.1",
  uranus: "M15.6 16.4a3.6 3.6 0 1 1-7.2 0 3.6 3.6 0 0 1 7.2 0zM12.7 16.4a.7.7 0 1 1-1.4 0 .7.7 0 0 1 1.4 0zM12 12.8V3M8.6 6.4L12 3l3.4 3.4",
  neptune: "M5 4.5c0 5.3 3 8.5 7 8.5s7-3.2 7-8.5M12 3v18.5M8.7 17.7h6.6M3.6 6L5 4.4 6.4 6M17.6 6l1.4-1.6L20.4 6M10.6 4.4L12 3l1.4 1.4",
  pluto: "M6.5 4.5c0 4 2.4 6.8 5.5 6.8s5.5-2.8 5.5-6.8M14.3 5.4a2.3 2.3 0 1 1-4.6 0 2.3 2.3 0 0 1 4.6 0zM12 11.3v10.2M8.7 17.8h6.6",
} as const;

export type PlanetId = keyof typeof PLANETS;

/** Четырёхлучевая звезда-искра, квадрат 24×24 */
export const SPARKLE = "M12 1.5c.6 5 2.7 7.6 10.5 10.5C14.7 14.9 12.6 17.5 12 22.5c-.6-5-2.7-7.6-10.5-10.5C9.3 9.1 11.4 6.5 12 1.5z";

interface GlyphProps {
  d: string;
  size?: number;
  className?: string;
  label?: string;
  strokeWidth?: number;
}

/** Самостоятельная иконка (HTML) */
export function Glyph({ d, size = 24, className, label, strokeWidth = 1.4 }: GlyphProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}

export function Sparkle({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={SPARKLE} fill="currentColor" />
    </svg>
  );
}
