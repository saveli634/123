import { equipment } from "@/data/equipment";
import { PhotoFrame } from "@/components/shared/PhotoFrame";
import { useUi } from "@/components/shared/UiContext";
import { SectionHead } from "./SectionHead";

export function Equipment() {
  const { openLightbox } = useUi();
  return (
    <section id="oborudovanie" tabIndex={-1} aria-labelledby="equip-title" className="section-y">
      <div className="container-x">
        <SectionHead id="equip-title" eyebrow="Чем работаем" title="Оборудование" />
        <ul className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {equipment.map((e, i) => (
            <li key={e.name} className="reveal" style={{ ["--delay" as string]: `${(i % 3) * 60}ms` }}>
              <PhotoFrame photo={e} ratio="4/3" sizes="(min-width: 1024px) 30vw, 48vw" onOpen={() => openLightbox(equipment, i)} />
              <p className="mt-3 flex gap-2 text-[0.95rem]">
                <span className="mono text-accent">{String(i + 1).padStart(2, "0")}</span>
                {e.title}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
