import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Кнопка в соглашениях shadcn/ui (cva-варианты, data-slot, asChild через Radix Slot).
 * Внешний вид — в src/styles/components.css (.btn*): красная заливка «поршнем» снизу,
 * линия-обводка, нажатие scale(.97). Анимируются только transform/opacity/clip-path.
 */
const buttonVariants = cva("btn", {
  variants: {
    variant: {
      default: "btn-red",
      outline: "btn-line",
      ghost: "btn-ghost",
      plate: "btn-plate",
    },
    size: {
      default: "btn-md",
      sm: "btn-sm",
      lg: "btn-lg",
      icon: "btn-icon",
    },
  },
  defaultVariants: { variant: "default", size: "default" },
});

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
