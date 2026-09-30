import { cn } from "@/lib/utils";

/** Словесный знак: антиква + разреженная гротескная приписка KZ. */
export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <span
      className={cn(
        "flex items-baseline gap-2 leading-none",
        tone === "dark" ? "text-ink" : "text-ivory",
        className,
      )}
    >
      <span className="font-display text-[1.6rem] font-medium tracking-[-0.01em]">
        Beauty <em className="font-normal">Soul</em>
      </span>
      <span className="text-[0.6rem] font-semibold tracking-[0.3em] opacity-60">KZ</span>
    </span>
  );
}
