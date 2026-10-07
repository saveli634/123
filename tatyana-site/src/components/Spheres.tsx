import { useEffect, useRef, type ReactNode } from "react";
import { SPHERES, sphere, type SphereId } from "@/data/spheres";
import { motionOk } from "@/lib/motion";
import { SPHERE_ICONS } from "./glyphs";

/** Значок сферы: тонкий рисунок в квадрате 24×24 */
export function SphereIcon({ id, size = 24, className = "" }: { id: SphereId; size?: number; className?: string }) {
  return (
    <svg
      className={`sicon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={SPHERE_ICONS[id]} />
    </svg>
  );
}

/** Маленькая «планета» сферы: светящийся круг со значком */
export function Planet({ id, className = "" }: { id: SphereId; className?: string }) {
  return (
    <span className={`planet planet--${id} ${className}`} style={{ ["--pc" as string]: sphere(id).color }} aria-hidden="true">
      <SphereIcon id={id} />
    </span>
  );
}

// орбита меню: эллипс в координатах 460×130, планеты — на ближней (нижней) дуге
const OW = 460;
const OH = 130;
const CX = OW / 2;
const CY = 46;
const RX = 214;
const RY = 46;
const ANGLES = [164, 118, 62, 16];
const pos = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: CX + RX * Math.cos(a), y: CY + RY * Math.sin(a) };
};
const ORBIT = `M${CX - RX} ${CY}A${RX} ${RY} 0 1 1 ${CX + RX} ${CY}A${RX} ${RY} 0 1 1 ${CX - RX} ${CY}`;

/**
 * Орбитальное меню первого экрана: Карта · Число · Слово · Песня.
 * По орбите бежит маленькая луна; при «уменьшить движение» она стоит.
 */
export function SphereNav({ className = "" }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!motionOk()) svg.current?.pauseAnimations?.();
  }, []);
  return (
    <nav className={`snav ${className}`} aria-label="Четыре сферы: карта, число, слово, песня">
      <div className="snav__box">
      <svg ref={svg} className="snav__orbit" viewBox={`0 0 ${OW} ${OH}`} aria-hidden="true" focusable="false">
        <path d={ORBIT} className="snav__path" />
        <circle r="2.6" className="snav__moon">
          <animateMotion dur="18s" repeatCount="indefinite" path={ORBIT} />
        </circle>
      </svg>
      {SPHERES.map((s, i) => {
        const p = pos(ANGLES[i]);
        return (
          <a
            key={s.id}
            href={s.href}
            className={`snav__item snav__item--${s.id}`}
            style={{ left: `${((p.x / OW) * 100).toFixed(2)}%`, top: `${((p.y / OH) * 100).toFixed(2)}%`, ["--i" as string]: i }}
          >
            <Planet id={s.id} />
            <span className="snav__label">{s.label}</span>
          </a>
        );
      })}
      </div>
    </nav>
  );
}

/** Подпись раздела со значком его сферы: «Карта · как это работает» */
export function SphereEyebrow({ id, children }: { id: SphereId; children?: ReactNode }) {
  return (
    <p className="eyebrow eyebrow--sphere" style={{ ["--pc" as string]: sphere(id).color }}>
      <SphereIcon id={id} size={16} className="eyebrow__icon" />
      <span>
        {sphere(id).label}
        {children && <span className="eyebrow__rest"> · {children}</span>}
      </span>
    </p>
  );
}

/** Все четыре сферы в одной подписи — для блока, где они встречаются */
export function AllSpheresEyebrow() {
  return (
    <p className="eyebrow eyebrow--all">
      {SPHERES.map((s, i) => (
        <span key={s.id} className="eyebrow__sp" style={{ ["--pc" as string]: s.color }}>
          {i > 0 && <span className="eyebrow__dot" aria-hidden="true">·</span>}
          <SphereIcon id={s.id} size={14} className="eyebrow__icon" />
          {s.label}
        </span>
      ))}
    </p>
  );
}
