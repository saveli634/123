import { DEMO } from "@/lib/env";
import { FILL } from "@/content/copy";
import { cn } from "@/lib/utils";

/**
 * Плашка демо-режима «ЗАПОЛНИТЬ: …» / «ПОДТВЕРДИТЬ: …» на месте пустого поля CONFIG.
 * В релизной сборке не выводится ничего.
 */
export function Fill({ what, kind = "fill", className }: { what: string; kind?: "fill" | "confirm"; className?: string }) {
  if (!DEMO) return null;
  return (
    <span role="note" className={cn("fill", className)}>
      <span className="fill-k">{kind === "fill" ? FILL.prefix : FILL.confirm}:</span> {what}
    </span>
  );
}
