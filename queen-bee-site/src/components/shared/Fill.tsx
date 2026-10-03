import type { ReactNode } from "react";
import { DEMO } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Плашка «ЗАПОЛНИТЬ: …» на месте пустого поля CONFIG. В релизной сборке не выводится. */
export function FillPlate({ field, className }: { field: string; className?: string }) {
  if (!DEMO) return null;
  return <span className={cn("fill-plate", className)}>Заполнить: {field}</span>;
}

/**
 * Обёртка «кнопка без данных»: в демо кнопка видна в своём дизайне, но неактивна
 * и помечена ярлыком «ЗАПОЛНИТЬ: …». В релизе не выводится вовсе.
 */
export function NeedsFill({ field, children, className }: { field: string; children: ReactNode; className?: string }) {
  if (!DEMO) return null;
  return (
    <span className={cn("needs-fill inline-flex", className)} title={`Заполнить в src/config.ts: ${field}`}>
      {children}
      <span className="fill-tag">Заполнить: {field}</span>
    </span>
  );
}
