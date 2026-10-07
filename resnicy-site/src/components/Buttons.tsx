import { useRef, type ReactNode } from "react";
import { useMagnetic } from "@/lib/pointer";
import { scrollToHash } from "@/lib/motion";
import type { Channel } from "@/site.config";

interface LinkProps {
  href: string;
  children: ReactNode;
  variant?: "solid" | "ghost" | "light" | "dark";
  className?: string;
  external?: boolean;
  icon?: ReactNode;
  /** Пробегающий блик по кнопке (главные призывы). */
  shine?: boolean;
}

/** Кнопка-ссылка с магнитом. Якоря (#...) прокручиваются плавно, внешние ссылки — в новой вкладке. */
export function MagLink({ href, children, variant = "solid", className = "", external, icon, shine }: LinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  useMagnetic(ref);
  const isHash = href.startsWith("#");
  return (
    <a
      ref={ref}
      href={href}
      className={`btn btn--${variant} ${shine ? "btn--shine" : ""} ${className}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onClick={
        isHash
          ? (e) => {
              e.preventDefault();
              scrollToHash(href);
              try {
                history.replaceState(null, "", href === "#top" ? location.pathname + location.search : href);
              } catch {
                /* предпросмотр файла может запрещать смену адреса — не страшно */
              }
            }
          : undefined
      }
    >
      <span className="btn-label">{children}</span>
      {icon}
    </a>
  );
}

export function Arrow({ dir = "right" }: { dir?: "right" | "down" | "up-right" }) {
  const rot = dir === "down" ? 90 : dir === "up-right" ? -45 : 0;
  return (
    <svg className="btn-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" style={{ transform: `rotate(${rot}deg)` }}>
      <path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChannelIcon({ id }: { id: Channel["id"] }) {
  const common = { viewBox: "0 0 24 24", width: 20, height: 20, "aria-hidden": true as const, className: "btn-icon" };
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (id) {
    case "instagram":
    case "post":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" {...stroke} />
          <circle cx="12" cy="12" r="4" {...stroke} />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...common}>
          <path d="M20.5 4.5 3.8 11.2c-.9.4-.8 1.6.1 1.9l4.2 1.3 1.6 5c.3.8 1.3 1 1.9.4l2.3-2.2 4.3 3.1c.7.5 1.7.1 1.9-.8l2.6-13.1c.2-1-.8-1.8-1.7-1.3Z" {...stroke} />
          <path d="m8.1 14.4 9-6.4" {...stroke} />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M4 20l1.2-4A8 8 0 1 1 8 18.8Z" {...stroke} />
          <path d="M9.2 8.6c.2-.5.6-.5.9-.5h.5c.2 0 .4.1.5.4l.6 1.5c.1.2 0 .5-.1.6l-.5.6c.6 1.1 1.5 2 2.6 2.6l.6-.5c.2-.2.4-.2.6-.1l1.5.6c.3.1.4.3.4.5v.5c0 .3 0 .7-.5.9-.6.3-1.6.4-3-.3a8.6 8.6 0 0 1-3.3-3.3c-.7-1.4-.6-2.4-.3-3Z" fill="currentColor" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M6.6 3.5h2.6l1.4 4.1-2 1.4a11.5 11.5 0 0 0 6.4 6.4l1.4-2 4.1 1.4v2.6c0 1-.8 1.8-1.8 1.8A16.1 16.1 0 0 1 4.8 5.3c0-1 .8-1.8 1.8-1.8Z" {...stroke} />
        </svg>
      );
  }
}
