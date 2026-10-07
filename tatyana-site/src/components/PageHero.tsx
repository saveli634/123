import { useEffect, useRef, type ReactNode } from "react";
import { pageHref, PAGES, type PageId } from "@/data/pages";
import { sphere, type SphereId } from "@/data/spheres";
import { motionOk } from "@/lib/motion";
import { SPHERE_ICONS, SPARKLE } from "./glyphs";
import { SphereEyebrow } from "./Spheres";

/** Подарок — общий для всех сфер, золотой, со значком-искрой */
const GIFT_ICON =
  "M4.5 9.5h15v3.2h-15zM5.6 12.7h12.8V20H5.6zM12 9.5V20M12 9.5C10.8 6.3 6.6 5.5 6.6 8c0 1.4 2.7 1.5 5.4 1.5zM12 9.5c1.2-3.2 5.4-4 5.4-1.5 0 1.4-2.7 1.5-5.4 1.5z";

/**
 * Большая «планета» страницы: шар цвета сферы с кольцом, значок сферы, по орбите бежит луна.
 * Всё нарисовано SVG; при «уменьшить движение» луна стоит.
 */
export function BigPlanet({ id, color, icon }: { id: string; color: string; icon: string }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!motionOk()) svg.current?.pauseAnimations?.();
  }, []);
  const ring = "M-190 0A190 52 0 1 1 190 0A190 52 0 1 1 -190 0";
  return (
    <svg ref={svg} className="bigp" viewBox="-240 -240 480 480" aria-hidden="true" focusable="false" style={{ ["--pc" as string]: color }}>
      <defs>
        <radialGradient id={`bp-${id}-body`} cx="0.36" cy="0.32" r="0.78">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="0.18" stopColor={color} stopOpacity="0.85" />
          <stop offset="0.55" stopColor="#3a1d7a" />
          <stop offset="1" stopColor="#070312" />
        </radialGradient>
        <radialGradient id={`bp-${id}-glow`} r="0.5">
          <stop offset="0.45" stopColor={color} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <clipPath id={`bp-${id}-back`}>
          <rect x="-240" y="-240" width="480" height="240" />
        </clipPath>
        <clipPath id={`bp-${id}-front`}>
          <rect x="-240" y="0" width="480" height="240" />
        </clipPath>
      </defs>
      <circle r="230" fill={`url(#bp-${id}-glow)`} className="bigp__glow" />
      <g className="bigp__orbits">
        <ellipse rx="226" ry="226" className="bigp__orbit" />
        <ellipse rx="200" ry="200" className="bigp__orbit bigp__orbit--dash" />
      </g>
      <g transform="rotate(-18)">
        <path d={ring} className="bigp__ring" clipPath={`url(#bp-${id}-back)`} />
      </g>
      <circle r="118" fill={`url(#bp-${id}-body)`} className="bigp__body" />
      <circle r="118" className="bigp__rim" />
      <g transform="translate(-48 -48) scale(4)" className="bigp__icon">
        <path d={icon} />
      </g>
      <g transform="rotate(-18)">
        <path d={ring} className="bigp__ring" clipPath={`url(#bp-${id}-front)`} />
        <circle r="7" className="bigp__moon">
          <animateMotion dur="14s" repeatCount="indefinite" path={ring} />
        </circle>
      </g>
      <path d={SPARKLE} transform="translate(70 -150) scale(1.1)" className="bigp__spark" />
    </svg>
  );
}

interface Props {
  page: PageId;
  sphereId?: SphereId;
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  children?: ReactNode;
}

/** Первый экран внутренней страницы: «хлебные крошки», заголовок, вводный абзац и планета сферы */
export function PageHero({ page, sphereId, eyebrow, title, lead, children }: Props) {
  const color = sphereId ? sphere(sphereId).color : "#E6CF9A";
  const icon = sphereId ? SPHERE_ICONS[sphereId] : GIFT_ICON;
  return (
    <section className={`phero phero--${page}`} aria-labelledby={`ph-${page}`}>
      <div className="wrap phero__grid">
        <div className="phero__copy">
          <nav className="crumbs hero-in" aria-label="Вы здесь" style={{ ["--d" as string]: 0 }}>
            <a href={pageHref("home")}>Главная</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{PAGES[page].nav}</span>
          </nav>
          <div className="hero-in" style={{ ["--d" as string]: 1 }}>
            {sphereId ? (
              <SphereEyebrow id={sphereId}>{eyebrow}</SphereEyebrow>
            ) : (
              <p className="eyebrow">
                <svg width="12" height="12" viewBox="0 0 24 24" className="eyebrow__star" aria-hidden="true">
                  <path d={SPARKLE} fill="currentColor" />
                </svg>
                {eyebrow}
              </p>
            )}
          </div>
          <h1 id={`ph-${page}`} className="phero__title hero-in" tabIndex={-1} style={{ ["--d" as string]: 2 }}>
            {title}
          </h1>
          <p className="phero__lead hero-in" style={{ ["--d" as string]: 3 }}>
            {lead}
          </p>
          {children && (
            <div className="phero__actions hero-in" style={{ ["--d" as string]: 4 }}>
              {children}
            </div>
          )}
        </div>
        <div className="phero__planet hero-in" style={{ ["--d" as string]: 2 }}>
          <BigPlanet id={page} color={color} icon={icon} />
        </div>
      </div>
    </section>
  );
}
