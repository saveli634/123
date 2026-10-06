import logos from "@/content/logos.generated.json";
import { site } from "@/site.config";

type Logo = { w: number; h: number; d: string };
const traced = (logos as Record<string, Logo>)[site.brand.trim().toLowerCase()];

/**
 * Контур надписи кладётся в страницу один раз, логотипы ссылаются на него через <use>.
 * pathLength=1 — для «написания» штрихом в интро (stroke-dashoffset от 1 до 0).
 */
export function BrandDefs() {
  if (!traced) return null;
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true" focusable="false">
      <defs>
        <path id="brand-path" d={traced.d} pathLength={1} fillRule="evenodd" />
      </defs>
    </svg>
  );
}

/** Название: её каллиграфия в векторе, иначе — набор шрифтом Pinyon Script. */
export function BrandMark({ className = "", decorative = false }: { className?: string; decorative?: boolean }) {
  const a11y = decorative ? { "aria-hidden": true as const } : { role: "img", "aria-label": site.brand };
  if (traced)
    return (
      <svg className={`brand ${className}`} viewBox={`0 0 ${traced.w} ${traced.h}`} {...a11y} focusable="false">
        <use href="#brand-path" />
      </svg>
    );
  return (
    <span className={`brand brand--text ${className}`} {...a11y}>
      {site.brand}
    </span>
  );
}
