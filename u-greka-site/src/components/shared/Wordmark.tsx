import { cn } from "@/lib/utils";

/** Типографский знак (логотипа нет — заменить на настоящий, см. TODO_CONFIRM). */
export function Wordmark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg aria-hidden="true" viewBox="0 0 28 28" className="size-7 shrink-0">
        <rect width="28" height="28" rx="2" fill="var(--color-accent)" />
        <path d="M7 7h4l3 7 3-7h4l-6 13h-4l1.6-3.4z" fill="var(--color-accent-ink)" />
        <path d="M20 21l4-4v4z" fill="var(--color-accent-ink)" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="display text-[1.3rem] tracking-[0.02em]">У Грека</span>
        {!compact && <span className="mono mt-1 text-[0.58rem] tracking-[0.14em] text-muted uppercase">Автосервис · Алматы</span>}
      </span>
    </span>
  );
}
