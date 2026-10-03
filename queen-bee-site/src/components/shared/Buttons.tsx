import type { ReactNode } from "react";
import { buttons, form } from "@/content/text";
import { site, telHref, waHref } from "@/lib/site";
import { cn } from "@/lib/utils";
import { NeedsFill } from "./Fill";
import { useUi } from "./UiContext";

type Variant = "primary" | "ghost" | "milk";

const cls = (variant: Variant, size?: "sm") => cn("btn", `btn-${variant}`, size === "sm" && "btn-sm");

function Label({ children }: { children: ReactNode }) {
  return <span className="btn-label">{children}</span>;
}

/** «Записаться» — открывает форму, форма собирает текст и открывает WhatsApp */
export function BookButton({ variant = "primary", size, className, wish, label = buttons.book }: { variant?: Variant; size?: "sm"; className?: string; wish?: string; label?: string }) {
  const { openBooking } = useUi();
  return (
    <button type="button" data-magnetic="" className={cn(cls(variant, size), className)} onClick={() => openBooking(wish)} aria-haspopup="dialog">
      <Label>{label}</Label>
    </button>
  );
}

const WaIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 2.9 2.9 0 0 0-.9 2.2 5.1 5.1 0 0 0 1.1 2.7 11.6 11.6 0 0 0 4.4 3.9c1.6.7 2.3.8 3.1.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
    <path d="M5 3.5h3l1.6 4.2-2 1.3a11 11 0 0 0 5.4 5.4l1.3-2 4.2 1.6v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3 5.7a2 2 0 0 1 2-2.2Z" strokeLinejoin="round" />
  </svg>
);

/** «Написать в WhatsApp» — прямая ссылка wa.me с приветствием */
export function WhatsAppButton({ variant = "ghost", size, className, text = form.greeting }: { variant?: Variant; size?: "sm"; className?: string; text?: string }) {
  const href = waHref(text);
  const btn = (
    <a
      href={href || undefined}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      aria-disabled={href ? undefined : true}
      data-magnetic=""
      className={cn(cls(variant, size), !href && "pointer-events-none", className)}
    >
      <Label>
        <WaIcon />
        {buttons.whatsapp}
      </Label>
    </a>
  );
  return href ? btn : <NeedsFill field="WhatsApp">{btn}</NeedsFill>;
}

/** «Позвонить» — tel: */
export function CallButton({ variant = "ghost", size, className }: { variant?: Variant; size?: "sm"; className?: string }) {
  const btn = (
    <a
      href={telHref || undefined}
      aria-disabled={telHref ? undefined : true}
      data-magnetic=""
      className={cn(cls(variant, size), !telHref && "pointer-events-none", className)}
    >
      <Label>
        <PhoneIcon />
        {buttons.call}
      </Label>
    </a>
  );
  return telHref ? btn : <NeedsFill field="телефон">{btn}</NeedsFill>;
}

/** «Смотреть работы» — Instagram салона */
export function WorksButton({ variant = "ghost", className }: { variant?: Variant; className?: string }) {
  const href = site.instagram;
  const btn = (
    <a
      href={href || undefined}
      target={href ? "_blank" : undefined}
      rel={href ? "noopener noreferrer" : undefined}
      aria-disabled={href ? undefined : true}
      data-magnetic=""
      className={cn(cls(variant), !href && "pointer-events-none", className)}
    >
      <Label>{buttons.works}</Label>
    </a>
  );
  return href ? btn : <NeedsFill field="Instagram">{btn}</NeedsFill>;
}
