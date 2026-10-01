/** Иконка WhatsApp (в lucide брендовых иконок нет) — простой контур трубки в пузыре. */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z" />
      <path d="M9 8.5c0 3.5 2.9 6.5 6.5 6.5l1-1.6-2.2-1-1 .9c-1.2-.5-2.1-1.4-2.6-2.6l.9-1-1-2.2z" fill="currentColor" stroke="none" />
    </svg>
  );
}
