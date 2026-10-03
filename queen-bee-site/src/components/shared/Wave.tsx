/**
 * Мягкая волна на стыке с бордовой секцией — как волна потолка в зале.
 * Заливка цветом соседней секции и тонкая золотая нить по кривой.
 */
export function Wave({ edge, color }: { edge: "top" | "bottom"; color: string }) {
  const top = edge === "top";
  const fill = top ? "M0,0 H1440 V34 C1060,118 380,118 0,34 Z" : "M0,120 H1440 V86 C1060,2 380,2 0,86 Z";
  const line = top ? "M0,34 C380,118 1060,118 1440,34" : "M0,86 C380,2 1060,2 1440,86";
  return (
    <svg
      aria-hidden="true"
      className="wave"
      data-edge={edge}
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      style={{ color }}
    >
      <path d={fill} fill="currentColor" />
      <path d={line} fill="none" stroke="#B9944F" strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
