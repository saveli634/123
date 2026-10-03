/** Знак: шестиугольник-сота и пчела тонкой линией (оригинала логотипа в материалах нет). */
export function HexBee({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <path d="M24 3.5 41.8 13.75v20.5L24 44.5 6.2 34.25v-20.5Z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <g fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round">
        <ellipse cx="24" cy="27.5" rx="5" ry="7.2" />
        <path d="M19.4 25.2h9.2M19.2 29h9.6M20.4 32.6h7.2" />
        <path d="M22.4 20.6c-3.6-5.4-9.6-5-9.9-1.3-.3 3.6 5 4.6 9.4 3.4M25.6 20.6c3.6-5.4 9.6-5 9.9-1.3.3 3.6-5 4.6-9.4 3.4" />
        <path d="M22.6 18.4c-.6-1.7-1.7-2.7-3-3.1M25.4 18.4c.6-1.7 1.7-2.7 3-3.1" />
      </g>
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      <HexBee className="wordmark__icon" />
      <span className="wordmark__text">
        Queen <em>Bee</em>
      </span>
    </span>
  );
}
