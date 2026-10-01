import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Кнопка (shadcn: cva + Slot), переделанная под «бокс»: квадратная, прописные Oswald,
 * на ховере сдвиг на 2 px со «смещённой линией» вместо мягкой тени, нажатие — 0.98.
 */
const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-[3px]",
    "font-[family-name:var(--font-display)] text-[0.98rem] font-semibold uppercase tracking-[0.04em]",
    "transition-[transform,box-shadow,background-color,color,border-color] duration-200 ease-(--ease-out)",
    "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-ink hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-text)]",
        outline:
          "border border-current/40 text-current hover:border-current hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-accent)]",
        dark: "bg-paper-ink text-paper hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0_0_var(--color-accent)]",
      },
      size: { md: "h-12 px-6", lg: "h-14 px-7 text-[1.05rem]", sm: "h-11 px-4 text-[0.9rem]" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
});
Button.displayName = "Button";
