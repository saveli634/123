import { useEffect, useRef, type MouseEventHandler, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { finePointer, motionOK } from "@/lib/env";
import { telHref, waHref } from "@/lib/links";
import { useT } from "@/lib/lang";
import { IconChat, IconPhone } from "./Icons";

/** Магнитная кнопка: тянется к курсору (только мышь, без reduced motion). */
function useMagnetic<T extends HTMLElement>(enabled: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || !finePointer() || !motionOK()) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      const lim = (v: number, m: number) => Math.max(-m, Math.min(m, v));
      el.style.setProperty("--tx", `${lim(x * 0.22, 12).toFixed(1)}px`);
      el.style.setProperty("--ty", `${lim(y * 0.32, 9).toFixed(1)}px`);
      el.style.setProperty("--mx", `${(e.clientX - r.left).toFixed(0)}px`);
      el.style.setProperty("--my", `${(e.clientY - r.top).toFixed(0)}px`);
    };
    const leave = () => {
      el.style.setProperty("--tx", "0px");
      el.style.setProperty("--ty", "0px");
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [enabled]);
  return ref;
}

type BtnProps = {
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  variant?: "gold" | "line" | "ghost";
  size?: "md" | "sm";
  icon?: ReactNode;
  iconEnd?: ReactNode;
  external?: boolean;
  magnetic?: boolean;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  type?: "button" | "submit";
};

export function Btn({
  href,
  onClick,
  variant = "gold",
  size = "md",
  icon,
  iconEnd,
  external,
  magnetic = true,
  className,
  children,
  ariaLabel,
  ariaExpanded,
  ariaControls,
  type = "button",
}: BtnProps) {
  const ref = useMagnetic<HTMLAnchorElement & HTMLButtonElement>(magnetic);
  const cls = cn("btn", `btn-${variant}`, size === "sm" && "btn-sm", className);
  const inner = (
    <>
      {icon}
      <span>{children}</span>
      {iconEnd}
    </>
  );
  if (href)
    return (
      <a
        ref={ref}
        href={href}
        className={cls}
        onClick={onClick}
        aria-label={ariaLabel}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  return (
    <button
      ref={ref}
      type={type}
      className={cls}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
    >
      {inner}
    </button>
  );
}

/**
 * Плашка «ЗАПОЛНИТЬ: поле» на месте элемента с пустым полем CONFIG. Только в демо-сборке;
 * в build:release пустые элементы просто не выводятся.
 */
export function Fill({
  field,
  label,
  icon,
  size = "md",
  inline,
  className,
}: {
  field: string;
  label?: ReactNode;
  icon?: ReactNode;
  size?: "md" | "sm";
  inline?: boolean;
  className?: string;
}) {
  const t = useT();
  if (!__DEMO__) return null;
  return (
    <span
      className={cn("fill", size === "sm" && "fill-sm", inline && "fill-inline", className)}
      title={`src/config.ts → CONFIG.${field}`}
    >
      {icon}
      {label && <span>{label}</span>}
      <b>
        {t.fill}: {field}
      </b>
    </span>
  );
}

export function CallButton({
  variant = "gold",
  size,
  className,
}: {
  variant?: BtnProps["variant"];
  size?: BtnProps["size"];
  className?: string;
}) {
  const t = useT();
  const href = telHref();
  if (!href) return <Fill field="phone" label={t.cta.call} icon={<IconPhone />} size={size} className={className} />;
  return (
    <Btn href={href} variant={variant} size={size} className={className} icon={<IconPhone />}>
      {t.cta.call}
    </Btn>
  );
}

export function WhatsAppButton({
  variant = "line",
  size,
  short,
  adaptive,
  text,
  className,
}: {
  variant?: BtnProps["variant"];
  size?: BtnProps["size"];
  short?: boolean;
  /** на узком экране — короткая подпись «WhatsApp» */
  adaptive?: boolean;
  text?: string;
  className?: string;
}) {
  const t = useT();
  const href = waHref(text);
  const label: ReactNode = adaptive ? (
    <>
      <span className="lbl-long">{t.cta.whatsapp}</span>
      <span className="lbl-short">{t.cta.whatsappShort}</span>
    </>
  ) : short ? (
    t.cta.whatsappShort
  ) : (
    t.cta.whatsapp
  );
  if (!href) return <Fill field="whatsapp" label={label} icon={<IconChat />} size={size} className={className} />;
  return (
    <Btn href={href} external variant={variant} size={size} className={className} icon={<IconChat />}>
      {label}
    </Btn>
  );
}
