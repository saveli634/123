import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Заголовок раздела: огромный номер-маркер, H2, подзаголовок. */
export function SectionHead({ number, eyebrow, title, id, children, className }: { number?: string; eyebrow: string; title: ReactNode; id: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid gap-6 lg:grid-cols-12 lg:items-end", className)}>
      <div className="lg:col-span-8">
        <p className="eyebrow reveal">
          {number && <span className="text-accent">{number} — </span>}
          <span className="opacity-70">{eyebrow}</span>
        </p>
        <h2 id={id} className="display mt-4 text-[clamp(2.3rem,6vw,5.2rem)]">
          <span className="line-mask">
            <span>{title}</span>
          </span>
        </h2>
      </div>
      {children && <div className="reveal lg:col-span-4 lg:pb-2">{children}</div>}
    </div>
  );
}
