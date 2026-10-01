import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Блок «ярлык / значение» в стиле техпаспорта. На телефоне строки складываются. */
export function SpecTable({ rows, className, tone = "dark" }: { rows: { label: ReactNode; value: ReactNode }[]; className?: string; tone?: "dark" | "paper" }) {
  return (
    <dl className={cn("border-t", tone === "dark" ? "border-line" : "border-paper-ink/15", className)}>
      {rows.map((r, i) => (
        <div
          key={i}
          className={cn(
            "grid gap-1 border-b py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-6",
            tone === "dark" ? "border-line" : "border-paper-ink/15",
          )}
        >
          <dt className={cn("text-[0.95rem]", tone === "dark" ? "text-muted" : "text-paper-muted")}>{r.label}</dt>
          <dd className="mono text-[1rem] sm:text-right">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
