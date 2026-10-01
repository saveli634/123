import { useMemo, useState } from "react";
import { workFilters, works, type WorkCategory } from "@/data/works";
import { PhotoFrame } from "@/components/shared/PhotoFrame";
import { useUi } from "@/components/shared/UiContext";
import { cn } from "@/lib/utils";
import { SectionHead } from "./SectionHead";

/** Работы: фильтр-чипы по категориям и «кладка» из реальных фото; кадры «встают» в 3D при прокрутке. */
export function Works() {
  const [filter, setFilter] = useState<"all" | WorkCategory>("all");
  const { openLightbox } = useUi();
  const items = useMemo(() => (filter === "all" ? works : works.filter((w) => w.category === filter)), [filter]);
  return (
    <section id="raboty" tabIndex={-1} aria-labelledby="raboty-title" className="section-y border-t border-line bg-surface">
      <div className="container-x">
        <SectionHead id="raboty-title" eyebrow="Фото из нашего Instagram" title="Работы" />
        <div role="group" aria-label="Фильтр работ" className="no-scrollbar -mx-(--gutter) mt-10 flex gap-2 overflow-x-auto px-(--gutter) pb-1">
          {workFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "h-11 shrink-0 rounded-[3px] border px-4 text-[0.95rem] transition-colors duration-200",
                filter === f.value ? "border-accent bg-accent text-accent-ink" : "border-line text-muted hover:border-text hover:text-text",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">{`Показано фото: ${items.length}`}</p>
        <ul key={filter} className="mt-8 columns-2 gap-3 lg:columns-3 lg:gap-4">
          {items.map((w, i) => (
            <li key={w.name} className="animate-fade-up mb-3 break-inside-avoid lg:mb-4" style={{ ["--delay" as string]: `${Math.min(i, 8) * 40}ms` }}>
              <div className="reveal-3d" style={{ ["--delay" as string]: `${(i % 3) * 80}ms` }}>
                <PhotoFrame photo={w} ratio={w.ratio} sizes="(min-width: 1024px) 30vw, 48vw" onOpen={() => openLightbox(items, i)} tilt />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
