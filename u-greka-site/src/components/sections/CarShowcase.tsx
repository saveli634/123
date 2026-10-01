import { useEffect, useRef, useState } from "react";
import { ArrowDown, Phone } from "lucide-react";
import { site } from "@/data/site.config";
import type { StageId } from "@/three/buildCar";
import type { CarScene, FrameInfo } from "@/three/carScene";
import { Img } from "@/components/shared/Img";
import { useUi } from "@/components/shared/UiContext";
import { Button } from "@/components/ui/button";
import { motionAllowed, useScrollFx } from "@/lib/scrollFx";
import { scrollToY } from "@/lib/smoothScroll";
import { cn } from "@/lib/utils";

/**
 * «Каждый узел — наша работа»: 3D-внедорожник разбирается по мере прокрутки.
 * Этапы = направления сервиса; факты — только из services.ts.
 * Без WebGL 2 / при reduced motion / без JS (предпросмотр на телефоне) — готовые рендеры
 * этой же модели: общий вид и по рендеру на каждый узел.
 */
const cards: { id: StageId; slug: string; number: string; title: string; facts: string[]; tag: string; center: number }[] = [
  { id: "obves", slug: "silovoy-obves", number: "07", title: "Силовой обвес", facts: ["Силовые бамперы, в том числе с лебёдкой", "Пороги, калитки, багажники, шноркели"], tag: "Бампер, лебёдка, багажник", center: 0.185 },
  { id: "ac", slug: "kondicionery", number: "01", title: "Кондиционеры", facts: ["Заправка фреоном Frio+ (Бельгия)", "Замена компрессора и радиаторов"], tag: "Конденсатор и компрессор", center: 0.355 },
  { id: "engine", slug: "dvigatel", number: "03", title: "Двигатель", facts: ["Чистка форсунок на стенде", "Капитальный ремонт — бензин и дизель"], tag: "Двигатель", center: 0.525 },
  { id: "heater", slug: "avtopechki", number: "02", title: "Автопечка", facts: ["Промывка без снятия, на аппарате", "Оплата по результату"], tag: "Радиатор печки", center: 0.695 },
  { id: "chassis", slug: "hodovaya-geometriya", number: "05", title: "Ходовая и тормоза", facts: ["Ремонт ходовой и амортизаторов", "Проточка тормозных дисков, геометрия"], tag: "Подвеска и тормоза", center: 0.855 },
];

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    // Three.js требует WebGL 2 — на старых телефонах без него показываем рендеры
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

const sm = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function CarShowcase() {
  const { openLead } = useUi();
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const final = useRef<HTMLDivElement>(null);
  const hotspot = useRef<HTMLDivElement>(null);
  const hotspotTag = useRef<HTMLSpanElement>(null);
  const railFill = useRef<HTMLSpanElement>(null);
  const cardEls = useRef<(HTMLLIElement | null)[]>([]);
  const ticks = useRef<(HTMLButtonElement | null)[]>([]);
  const sceneRef = useRef<CarScene | null>(null);
  const progress = useRef(0);
  const [live, setLive] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Решаем сразу при загрузке: «живая» сцена нужна только при WebGL и разрешённом движении
  useEffect(() => {
    if (motionAllowed() && hasWebGL()) setLive(true);
  }, []);

  useScrollFx(
    section,
    (p) => {
      progress.current = p;
      sceneRef.current?.setProgress(p);
    },
    "sticky",
  );

  // Обновление интерфейса поверх 3D — напрямую в DOM, без перерисовок React
  const onFrame = (f: FrameInfo) => {
    const p = f.p;
    if (intro.current) {
      const t = sm(0.02, 0.085, p);
      intro.current.style.opacity = String(1 - t);
      intro.current.style.transform = `translate3d(0, ${(-t * 40).toFixed(1)}px, 0)`;
      intro.current.style.visibility = t > 0.99 ? "hidden" : "visible";
    }
    cards.forEach((c, i) => {
      const el = cardEls.current[i];
      if (!el) return;
      const w = f.weights[c.id];
      el.style.opacity = w.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - w) * 26).toFixed(1)}px, 0)`;
      el.style.visibility = w < 0.01 ? "hidden" : "visible";
      el.dataset.active = w > 0.5 ? "true" : "false";
      ticks.current[i]?.setAttribute("data-on", w > 0.5 ? "true" : "false");
    });
    if (final.current) {
      const t = sm(0.93, 0.985, p);
      final.current.style.opacity = String(t);
      final.current.style.transform = `translate3d(0, ${((1 - t) * 30).toFixed(1)}px, 0)`;
      final.current.style.visibility = t < 0.01 ? "hidden" : "visible";
    }
    if (hotspot.current) {
      const h = f.hotspot;
      const w = f.active ? f.weights[f.active] : 0;
      hotspot.current.style.opacity = h ? String(sm(0.5, 0.9, w)) : "0";
      if (h) hotspot.current.style.transform = `translate3d(${h.x.toFixed(1)}px, ${h.y.toFixed(1)}px, 0)`;
      if (hotspotTag.current && f.active) hotspotTag.current.textContent = cards.find((c) => c.id === f.active)!.tag;
    }
    if (railFill.current) railFill.current.style.transform = `scaleY(${p.toFixed(4)})`;
  };

  // Ленивая загрузка Three.js при подходе к разделу; рисуем, только пока раздел на экране
  useEffect(() => {
    if (!live) return;
    const sec = section.current!;
    let disposed = false;
    let loading = false;
    let visible = false;
    const mobile = window.matchMedia("(max-width: 767px)").matches;

    const ensure = async () => {
      if (sceneRef.current || loading) return;
      loading = true;
      const mod = await import("@/three/carScene");
      if (disposed || !canvas.current) return;
      const s = mod.createCarScene(canvas.current, onFrame, { mobile });
      if (!s) {
        setLive(false);
        return;
      }
      sceneRef.current = s;
      if (import.meta.env.DEV) (window as unknown as { __car?: CarScene }).__car = s;
      const r = stage.current!.getBoundingClientRect();
      s.resize(r.width, r.height);
      s.setProgress(progress.current, true);
      setLoaded(true);
      if (visible) s.start();
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible) {
          void ensure();
          sceneRef.current?.start();
        } else sceneRef.current?.stop();
      },
      { rootMargin: "60% 0px 60% 0px" },
    );
    io.observe(sec);

    const ro = new ResizeObserver(([e]) => sceneRef.current?.resize(e.contentRect.width, e.contentRect.height));
    ro.observe(stage.current!);

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const move = (e: PointerEvent) => sceneRef.current?.setPointer(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
    if (fine) sec.addEventListener("pointermove", move);

    return () => {
      disposed = true;
      io.disconnect();
      ro.disconnect();
      sec.removeEventListener("pointermove", move);
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
    // onFrame читает только refs — пересоздавать сцену не нужно
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  /** Прокрутка к этапу: по клику на шкалу и при фокусе с клавиатуры */
  const goTo = (center: number) => {
    const sec = section.current;
    if (!sec || !live) return;
    const top = sec.getBoundingClientRect().top + window.scrollY;
    const y = top + center * (sec.offsetHeight - window.innerHeight);
    scrollToY(y);
  };

  return (
    <section
      ref={section}
      id="v-detalyah"
      tabIndex={-1}
      aria-labelledby="car-title"
      className={cn("car relative border-t border-line", live && "car-live", loaded && "car-loaded")}
    >
      <div ref={stage} className="car-stage">
        <canvas ref={canvas} className="car-canvas" aria-hidden="true" />
        <div aria-hidden="true" className="car-vignette" />

        <div ref={intro} className="car-intro container-x">
          <p className="eyebrow reveal text-accent">Разбор по узлам · 3D</p>
          <h2 id="car-title" className="display mt-4 max-w-[14ch] text-[clamp(2.4rem,6vw,5.4rem)]">
            <span className="line-mask"><span>Каждый узел —</span></span>
            <span className="line-mask">
              <span style={{ ["--delay" as string]: "90ms" }} className="text-accent">наша работа</span>
            </span>
          </h2>
          <p className="car-hint reveal mt-5 max-w-sm text-muted">Листайте — разберём внедорожник и покажем, чем занимаемся в боксе на Рыскулова.</p>
          <p className="car-scroll mono mt-8 hidden items-center gap-3 text-sm text-muted">
            <ArrowDown aria-hidden="true" className="size-4 animate-bounce text-accent" />
            Прокрутите вниз
          </p>
        </div>

        <div className="car-still">
          <div className="car-still-media">
            <Img name="car-render" alt="3D-модель белого внедорожника с силовым бампером, шноркелем и багажником" sizes="(min-width: 1024px) 90vw, 100vw" />
          </div>
        </div>

        <ol className="car-cards">
          {cards.map((c, i) => (
            <li key={c.id} ref={(el) => { cardEls.current[i] = el; }} className="car-card">
              <div className="car-card-photo">
                <Img name={`car-render-${c.id}`} alt={`3D-модель внедорожника: ${c.tag.toLowerCase()}`} sizes="(min-width: 1024px) 30vw, 90vw" />
              </div>
              <div className="car-card-body">
                <p className="mono text-sm text-accent">{c.number} — услуга</p>
                <h3 className="display mt-2 text-[clamp(1.7rem,2.6vw,2.4rem)]">{c.title}</h3>
                <ul className="mt-3 space-y-1.5 text-[0.98rem] text-text/85">
                  {c.facts.map((f) => (
                    <li key={f} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-[0.62em] h-0.5 w-3 shrink-0 bg-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a href={`#usluga-${c.slug}`} onFocus={() => goTo(c.center)} className="mt-4 inline-flex min-h-11 items-center gap-2 text-[0.95rem] text-accent underline-offset-4 hover:underline">
                  Подробнее об услуге
                  <ArrowDown aria-hidden="true" className="size-4" />
                </a>
              </div>
            </li>
          ))}
        </ol>

        <div ref={hotspot} aria-hidden="true" className="car-hotspot">
          <span className="car-hotspot-dot" />
          <span ref={hotspotTag} className="car-hotspot-tag mono" />
        </div>

        <div aria-hidden="true" className="car-rail">
          <span className="car-rail-track"><span ref={railFill} /></span>
          {cards.map((c, i) => (
            <button key={c.id} ref={(el) => { ticks.current[i] = el; }} type="button" tabIndex={-1} onClick={() => goTo(c.center)} className="car-rail-tick mono" style={{ top: `${c.center * 100}%` }}>
              {c.number}
            </button>
          ))}
        </div>

        <div ref={final} className="car-final container-x">
          <p className="display max-w-[15ch] text-[clamp(1.9rem,3.6vw,3.2rem)]">
            Приезжайте — <span className="text-accent">посмотрим вашу машину</span>
          </p>
          <p className="mt-3 text-muted">{site.city}, {site.street}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={`tel:${site.phone.tel}`}>
                <Phone aria-hidden="true" className="size-5" />
                Позвонить
              </a>
            </Button>
            <Button size="lg" variant="outline" onClick={() => openLead()}>
              Записаться
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
