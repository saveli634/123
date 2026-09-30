import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Кнопка на базе shadcn (cva + Slot), но со своей пластикой:
 * прямые углы, разреженные прописные, быстрый отклик на нажатие.
 */
const buttonVariants = cva(
  [
    "group/btn relative inline-flex items-center justify-center gap-3 whitespace-nowrap",
    "text-[0.78rem] font-medium uppercase tracking-[0.16em]",
    "select-none transition-[background-color,color,border-color,transform] duration-200 ease-(--ease-out-quart)",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: "bg-graphite text-ivory hover:bg-ink",
        accent: "bg-terracotta text-ivory hover:bg-[#9d4622]",
        light: "bg-ivory text-graphite hover:bg-white",
        outline: "border border-current/30 bg-transparent text-current hover:border-current",
      },
      size: {
        sm: "h-10 px-5 text-[0.7rem]",
        md: "h-12 px-7",
        lg: "h-14 px-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

/** Классы для иконки-стрелки, которая сдвигается при наведении на родителя. */
export const nudge =
  "size-4 shrink-0 transition-transform duration-300 ease-(--ease-out-soft) group-hover/btn:translate-x-1 group-hover/link:translate-x-1";

export { buttonVariants };
