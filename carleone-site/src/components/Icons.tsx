/** Тонкие линейные значки в одном стиле (1.5 px, скруглённые концы). Декоративные. */
type P = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  focusable: false,
};

export const IconPhone = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M6.6 3.5h2.6l1.4 4-2 1.3a12 12 0 0 0 6.6 6.6l1.3-2 4 1.4v2.6a2 2 0 0 1-2.1 2A16.5 16.5 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1Z" />
  </svg>
);

export const IconChat = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M4.5 19.5l1.2-3.6A7.8 7.8 0 1 1 8.6 18.8Z" />
    <path d="M9 10.2h6M9 13.2h3.8" />
  </svg>
);

export const IconArrow = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconArrowUp = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M12 19V5M6 11l6-6 6 6" />
  </svg>
);

export const IconRoute = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <circle cx="6" cy="18" r="2" />
    <circle cx="18" cy="6" r="2" />
    <path d="M8 18h6.5a3.5 3.5 0 0 0 0-7h-5a3.5 3.5 0 0 1 0-7H16" />
  </svg>
);

export const IconClose = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconDrag = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base}>
    <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
  </svg>
);

/** Четырёхлучевая звезда-«компас» — разделитель в ленте. */
export const Star = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill="currentColor">
    <path d="M12 1.5c.6 5.4 3.6 9.6 10.5 10.5-6.9.9-9.9 5.1-10.5 10.5C11.4 17.1 8.4 12.9 1.5 12 8.4 11.1 11.4 6.9 12 1.5Z" />
  </svg>
);
