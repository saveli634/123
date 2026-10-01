import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { brand, type ImageName } from "@/content/catalog";
import { Img } from "@/components/Img";
import { motionAllowed, useScrollFx } from "@/lib/scrollFx";
import { Button, nudge } from "@/components/ui/button";

/**
 * «Прогулка по шоуруму» — главная 3D-сцена.
 * Экран закрепляется, прокрутка двигает «камеру» вглубь: снимки шоурума летят навстречу,
 * проходят мимо и растворяются. Без движения (reduced motion / нет JS) — обычная лента фото.
 */
const frames: { image: ImageName; label: string; alt: string; x: number; y: number; position?: string }[] = [
  { image: "04_minotti_wide", label: "Minotti", alt: "Диван Minotti с оранжевыми подушками в шоуруме", x: -27, y: -5, position: "40% 60%" },
  { image: "15_showroom_wide", label: "Шоурум · ТЦ ADEM 1", alt: "Зал шоурума под оранжевыми балками", x: 26, y: 7, position: "50% 60%" },
  { image: "09_polo_hero", label: "Polo", alt: "Угловой диван Polo в шоуруме", x: -24, y: 9, position: "45% 62%" },
  { image: "13_bigboss_showroom", label: "Big Boss", alt: "Экспозиция Big Boss: мягкая мебель и деревянный столик", x: 27, y: -8, position: "50% 55%" },
  { image: "05_mondi_hero", label: "Mondi", alt: "Серый диван Mondi с изогнутой спинкой", x: -26, y: 4, position: "50% 62%" },
  { image: "11_etno_hero", label: "Etno", alt: "Диван Etno с креслом и столиком", x: 22, y: -3, position: "40% 60%" },
];

const SPACING = 1150; // расстояние между снимками по глубине, px
const START = 2000; // первый снимок в начале сцены — далеко, чтобы заголовок читался чисто
const PERSPECTIVE = 1000;

export function ShowroomWalk() {
  const wrap = useRef<HTMLElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const intro = useRef<HTMLDivElement>(null);
  const outro = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const mobile = useRef(false);

  useEffect(() => {
    if (!motionAllowed()) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const set = () => (mobile.current = mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  useScrollFx(
    wrap,
    (p) => {
      const n = frames.length;
      // Камера проходит все кадры плюс небольшой запас в конце
      const camera = p * ((n - 1) * SPACING + START + 500);
      const spread = mobile.current ? 0.45 : 1;
      cards.current.forEach((card, i) => {
        if (!card) return;
        const f = frames[i];
        const z = -i * SPACING - START + camera;
        // Появление из глубины и быстрое растворение, когда кадр подлетает к камере
        const far = Math.min(1, Math.max(0, (z + 3.4 * SPACING) / (1.2 * SPACING)));
        const near = Math.min(1, Math.max(0, 1 - (z + 60) / 300));
        const opacity = far * near;
        card.style.opacity = opacity.toFixed(3);
        card.style.visibility = opacity < 0.01 ? "hidden" : "visible";
        card.style.transform = `translate(-50%,-50%) translate3d(${(f.x * spread).toFixed(2)}vw, ${f.y}vh, ${z.toFixed(1)}px)`;
      });
      if (intro.current) {
        const t = Math.min(1, p / 0.12);
        intro.current.style.opacity = (1 - t).toFixed(3);
        intro.current.style.transform = `translate3d(0, ${(-t * 40).toFixed(1)}px, 0) scale(${(1 - t * 0.08).toFixed(3)})`;
      }
      if (outro.current) {
        const t = Math.min(1, Math.max(0, (p - 0.9) / 0.08));
        outro.current.style.opacity = t.toFixed(3);
        outro.current.style.transform = `translate3d(0, ${((1 - t) * 30).toFixed(1)}px, 0)`;
        outro.current.style.visibility = t < 0.01 ? "hidden" : "visible";
      }
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
    },
    "sticky",
  );

  return (
    <section ref={wrap} aria-labelledby="walk-title" className="walk on-dark relative bg-graphite text-ivory">
      <div className="walk-stage">
        <div ref={intro} className="walk-intro container-x">
          <p className="eyebrow text-ivory/55">Шоурум изнутри</p>
          <h2 id="walk-title" className="display mt-5 text-[clamp(3rem,8vw,8.4rem)]">
            Пройдитесь <span className="serif text-ember">по шоуруму</span>
          </h2>
          <p className="walk-hint mt-6 text-ivory/55">Листайте — и идите вглубь</p>
        </div>

        <ul className="walk-track" style={{ ["--persp" as string]: `${PERSPECTIVE}px` }}>
          {frames.map((f, i) => (
            <li key={f.image} ref={(r) => { cards.current[i] = r; }} className="walk-card">
              <Img name={f.image} alt={f.alt} sizes="(min-width: 768px) 32vw, 72vw" position={f.position} className="aspect-[4/5]" />
              <p className="mt-3 flex items-center gap-3 text-sm text-ivory/80">
                <span className="h-px w-6 bg-ember" aria-hidden="true" />
                {f.label}
              </p>
            </li>
          ))}
        </ul>

        <div ref={outro} className="walk-outro container-x">
          <p className="display text-[clamp(2.2rem,5vw,4.6rem)]">
            Вживую — <span className="serif text-ember">ещё лучше</span>
          </p>
          <p className="mt-4 text-ivory/65">
            {brand.showroom}, {brand.showroomDetails}
          </p>
          <Button asChild variant="light" size="lg" className="mt-8">
            <a href="#showroom">
              Как нас найти
              <ArrowRight aria-hidden="true" className={nudge} strokeWidth={1.5} />
            </a>
          </Button>
        </div>

        <span aria-hidden="true" className="walk-progress">
          <span ref={bar} />
        </span>
      </div>
    </section>
  );
}
