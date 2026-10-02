import { Button } from "@/components/ui/button";
import { Magnetic } from "./Magnetic";
import { Arrow } from "./Glyphs";
import { BUTTONS, FILL } from "@/content/copy";
import { DEMO, field } from "@/lib/env";
import { telHref, waHref } from "@/lib/links";
import { cn } from "@/lib/utils";

export type CtaKind = "call" | "whatsapp" | "route" | "instagram";

const LABEL: Record<CtaKind, string> = {
  call: BUTTONS.call,
  whatsapp: BUTTONS.whatsapp,
  route: BUTTONS.route,
  instagram: BUTTONS.works,
};

const FILL_WHAT: Record<CtaKind, string> = {
  call: FILL.phone,
  whatsapp: FILL.whatsapp,
  route: FILL.mapLink,
  instagram: FILL.instagram,
};

export function ctaHref(kind: CtaKind) {
  if (kind === "call") return telHref();
  if (kind === "whatsapp") return waHref();
  if (kind === "route") return field("mapLink");
  return field("instagram");
}

/**
 * Кнопка действия из CONFIG. Нет данных → в релизе кнопки нет, в демо — плашка той же формы
 * с подписью «ЗАПОЛНИТЬ: …» (видно, что осталось заполнить, и как будет выглядеть кнопка).
 */
export function Cta({
  kind,
  variant = "default",
  size = "default",
  magnetic = true,
  label,
  className,
}: {
  kind: CtaKind;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  magnetic?: boolean;
  label?: string;
  className?: string;
}) {
  const href = ctaHref(kind);
  const text = label ?? LABEL[kind];
  if (!href) {
    if (!DEMO) return null;
    return (
      <span role="note" className={cn("btn btn-plate", `btn-${size === "default" ? "md" : size}`, className)}>
        <span className="btn-t">{text}</span>
        <span className="btn-tag">
          {FILL.prefix}: {FILL_WHAT[kind]}
        </span>
      </span>
    );
  }
  const external = kind !== "call";
  const btn = (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} data-cursor="link">
        <span className="btn-t">{text}</span>
        <Arrow className="btn-arrow" />
      </a>
    </Button>
  );
  return magnetic ? <Magnetic>{btn}</Magnetic> : btn;
}

/** Кнопка «Записаться» — открывает форму (событие ловит BookingDialog). */
export function BookButton({ variant = "default", size = "default", className }: { variant?: "default" | "outline"; size?: "default" | "sm" | "lg"; className?: string }) {
  return (
    <Magnetic>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        data-cursor="link"
        onClick={() => window.dispatchEvent(new CustomEvent("booking:open"))}
      >
        <span className="btn-t">{BUTTONS.book}</span>
        <Arrow className="btn-arrow" />
      </Button>
    </Magnetic>
  );
}
