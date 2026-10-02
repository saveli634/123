/** Свои линейные знаки в стиле техчертежа — без иконок из паков. */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 12" aria-hidden="true" focusable="false">
      <path d="M0 6h26M21 1l5 5-5 5" />
    </svg>
  );
}

export function Cross({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M6 0v12M0 6h12" />
    </svg>
  );
}

export function Play({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 14 16" aria-hidden="true" focusable="false">
      <path d="M1 1l12 7-12 7z" />
    </svg>
  );
}

/** Метка раздела: «02 / 09 — Цех» */
export function SecLabel({ n, total, children }: { n: number; total: number; children: React.ReactNode }) {
  return (
    <p className="sec-label">
      <Cross className="sec-cross" />
      <span className="num">{String(n).padStart(2, "0")}</span>
      <span className="sec-sl">/</span>
      <span className="num">{String(total).padStart(2, "0")}</span>
      <span className="sec-rule" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
