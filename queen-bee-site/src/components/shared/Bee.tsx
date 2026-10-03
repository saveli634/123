import { cn } from "@/lib/utils";

/**
 * Фирменная пчела — вид сверху, голова вверх. Линии золотые, тело — золото с полосами эспрессо.
 * fly — крылья трепещут (CSS). Используется в прелоадере, герое, курсоре, нити-прогрессе.
 */
export function Bee({ className, fly = false, title }: { className?: string; fly?: boolean; title?: string }) {
  return (
    <svg
      viewBox="-32 -32 64 64"
      className={cn(fly && "bee-fly", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      aria-label={title}
    >
      <g fill="rgba(255,253,248,.82)" stroke="#B9944F" strokeWidth="1.1">
        <ellipse className="bee-wing bee-wing-l" cx="-11" cy="-4" rx="11" ry="6.2" transform="rotate(-28 -11 -4)" />
        <ellipse className="bee-wing bee-wing-r" cx="11" cy="-4" rx="11" ry="6.2" transform="rotate(28 11 -4)" />
      </g>
      <ellipse cx="0" cy="7" rx="6.6" ry="13" fill="#B9944F" />
      <path d="M-6.2 2.2h12.4v3.3H-6.2zM-5.6 9.6h11.2v3.3H-5.6z" fill="#23181A" />
      <path d="M0 20.5 1.6 18h-3.2z" fill="#23181A" />
      <circle cx="0" cy="-8.6" r="5.2" fill="#23181A" />
      <path d="M-2 -13Q-4.5-19-8.5-20.5M2-13Q4.5-19 8.5-20.5" fill="none" stroke="#23181A" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

/** Знак: шестиугольник с пчелой (логотипа в материалах нет — временный знак) */
export function HexMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-32 -32 64 64" className={className} aria-hidden="true">
      <polygon points="0,-29 25.1,-14.5 25.1,14.5 0,29 -25.1,14.5 -25.1,-14.5" fill="none" stroke="#B9944F" strokeWidth="1.6" />
      <g transform="scale(.62)">
        <g fill="rgba(255,253,248,.9)" stroke="#B9944F" strokeWidth="1.6">
          <ellipse cx="-11" cy="-4" rx="11" ry="6.2" transform="rotate(-28 -11 -4)" />
          <ellipse cx="11" cy="-4" rx="11" ry="6.2" transform="rotate(28 11 -4)" />
        </g>
        <ellipse cx="0" cy="7" rx="6.6" ry="13" fill="#B9944F" />
        <path d="M-6.2 2.2h12.4v3.3H-6.2zM-5.6 9.6h11.2v3.3H-5.6z" fill="#23181A" />
        <circle cx="0" cy="-8.6" r="5.2" fill="#23181A" />
      </g>
    </svg>
  );
}
