import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "group/btn relative inline-flex items-center justify-center gap-3 whitespace-nowrap",
    "font-sans text-[0.8rem] font-semibold uppercase tracking-[0.16em]",
    "select-none transition-[background-color,color,border-color,transform] duration-200 ease-(--ease-out-quart)",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: "bg-espresso text-ivory hover:bg-ink",
        light: "bg-ivory text-espresso hover:bg-white",
        outline:
          "border border-current/35 text-current hover:border-current bg-transparent",
        ghost: "text-current hover:opacity-70 px-0!",
      },
      size: {
        md: "h-12 px-7",
        lg: "h-14 px-9",
        sm: "h-10 px-5 text-[0.72rem]",
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
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), "rounded-full", className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

/** Стрелка, которая мягко сдвигается при наведении на кнопку/ссылку-родителя. */
export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn(
        "size-4 shrink-0 transition-transform duration-300 ease-(--ease-out-soft)",
        "group-hover/btn:translate-x-1 group-hover/link:translate-x-1",
        className,
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export { buttonVariants };
