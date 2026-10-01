import { services } from "@/data/services";

/** «Чем занимаемся»: статичный список групп услуг-якорей с номерами 01–08. */
export function ServiceStrip() {
  return (
    <nav aria-label="Чем занимаемся" className="border-b border-line">
      <div className="container-x">
        <ul className="no-scrollbar -mx-(--gutter) flex overflow-x-auto px-(--gutter) lg:mx-0 lg:grid lg:grid-cols-8 lg:px-0">
          {services.map((s) => (
            <li key={s.slug} className="shrink-0 border-r border-line last:border-r-0 lg:border-r">
              <a href={`#usluga-${s.slug}`} className="group flex min-h-16 flex-col justify-center gap-0.5 px-4 py-3 hover:bg-surface lg:px-4">
                <span className="mono text-[0.72rem] text-accent">{s.number}</span>
                <span className="text-[0.92rem] whitespace-nowrap text-muted transition-colors group-hover:text-text">{s.chip}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
