import { useMemo, useRef } from "react";
import { useScrollFx } from "@/lib/scrollFx";

/** Тонкая жёлтая полоса прогресса прокрутки вверху экрана. Декоративная; без движения не видна. */
export function ScrollProgress() {
  const bar = useRef<HTMLSpanElement>(null);
  const page = useMemo(() => ({ current: typeof document === "undefined" ? null : document.body }), []);
  useScrollFx(
    page,
    (p) => {
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
    },
    "sticky",
  );
  return (
    <div aria-hidden="true" className="scroll-progress">
      <span ref={bar} />
    </div>
  );
}
