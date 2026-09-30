import { cn } from "@/lib/utils";

/** Словесный знак: разреженный гротеск и терракотовая черта — как балки шоурума. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 text-[0.95rem] leading-none font-medium tracking-[0.3em]", className)}>
      SOFT
      <span aria-hidden="true" className="h-[2px] w-5 bg-terracotta" />
      LINE
    </span>
  );
}
