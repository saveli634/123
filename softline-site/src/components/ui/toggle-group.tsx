import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

export const ToggleGroup = React.forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Root ref={ref} className={cn("inline-flex flex-wrap items-center", className)} {...props} />
));
ToggleGroup.displayName = "ToggleGroup";

/** Сегмент фильтра: активный — графитовая плашка, переход цвета быстрый и мягкий. */
export const ToggleGroupItem = React.forwardRef<
  React.ComponentRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <ToggleGroupPrimitive.Item
    ref={ref}
    className={cn(
      "inline-flex h-11 items-center px-5 text-[0.85rem] text-muted",
      "transition-[background-color,color] duration-250 ease-(--ease-out-quart)",
      "hover:text-graphite data-[state=on]:bg-graphite data-[state=on]:text-ivory",
      className,
    )}
    {...props}
  />
));
ToggleGroupItem.displayName = "ToggleGroupItem";
