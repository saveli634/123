import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Заголовок, который проявляется построчно из-под маски.
 * Строки задаются явно — так перенос одинаков на всех экранах и в пререндере.
 */
export function Lines({
  as: Tag = "h2",
  lines,
  className,
  lineClass,
  reveal = true,
  id,
}: {
  as?: ElementType;
  lines: ReactNode[];
  className?: string;
  lineClass?: (i: number) => string | undefined;
  reveal?: boolean;
  id?: string;
}) {
  return (
    <Tag id={id} className={cn("lines", reveal && "rv", className)}>
      {lines.map((l, i) => (
        <span key={i} className={cn("ln", lineClass?.(i))} style={{ ["--i" as string]: i }}>
          <span>{l}</span>
          {i < lines.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
