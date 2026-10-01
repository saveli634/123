import { useEffect, useRef, useState } from "react";
import { Phone } from "lucide-react";
import { services } from "@/data/services";
import type { Photo } from "@/data/types";
import { PhotoFrame } from "@/components/shared/PhotoFrame";
import { useUi } from "@/components/shared/UiContext";
import { Button } from "@/components/ui/button";
import { motionAllowed, requestTick, useScrollFx } from "@/lib/scrollFx";
import { scrollToY } from "@/lib/smoothScroll";
import { cn } from "@/lib/utils";
import { SectionHead } from "./SectionHead";

const gallery: Photo[] = [
  { name: "obves-lc70-bumper", alt: "Силовой бампер с лебёдкой и светодиодной балкой на Land Cruiser 70", tag: "Land Cruiser 70 · бампер с лебёдкой" },
  { name: "obves-pickup-rollbar-1", alt: "Ролл-бар с запасным колесом в кузове пикапа", tag: "Пикап · ролл-бар и запаска" },
  { name: "obves-rear-spare-1", alt: "Задний силовой бампер с калиткой запасного колеса на зелёном внедорожнике", tag: "Задний бампер · калитка" },
  { name: "obves-prado120-front", alt: "Передняя защита на Toyota Prado 120", tag: "Prado 120 · передняя защита" },
  { name: "obves-rear-carrier", alt: "Калитка запасного колеса и фаркоп на Subaru Forester", tag: "Subaru Forester · калитка" },
  { name: "obves-step", alt: "Боковой порог на внедорожнике", tag: "Пороги" },
];

const made = ["Силовые бамперы, с лебёдкой", "Пороги", "Калитки для запаски", "Фаркопы", "Багажники на крышу", "Дуги и лестницы", "Шноркели", "Кенгурятники и обвес", "Ролл-бары для пикапов", "Прицепы"];

/**
 * Силовой обвес под заказ: галерея + что делаем + контакт мастера.
 * При разрешённом движении (телефон и компьютер): галерея закрепляется и едет вбок при прокрутке,
 * кадры поворачиваются «каруселью» — центральный смотрит прямо, боковые уходят в глубину.
 * Reduced motion / без JS — обычная сетка.
 */
export function Fabrication() {
  const { openLightbox, openLead } = useUi();
  const svc = services.find((s) => s.slug === "silovoy-obves")!;
  const phone = svc.phones![0];
  const pin = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const geo = useRef({ over: 0, vw: 1, centers: [] as number[] });
  const [live, setLive] = useState(false);

  // Карусель — на любом экране, если движение разрешено (телефон, планшет, компьютер)
  useEffect(() => {
    if (motionAllowed()) setLive(true);
  }, []);

  useEffect(() => {
    if (!live) return;
    const pinEl = pin.current!;
    const st = stage.current!;
    const t = track.current!;
    const items = () => Array.from(t.children) as HTMLElement[];
    let lastW = -1;
    const measure = () => {
      const vw = st.clientWidth;
      // На телефоне адресная строка меняет высоту окна при прокрутке — пересчитываем только при смене ширины
      if (vw === lastW && geo.current.over) return;
      lastW = vw;
      const over = Math.max(0, t.offsetWidth - vw);
      geo.current = { vw, over, centers: items().map((el) => el.offsetLeft + el.offsetWidth / 2) };
      pinEl.style.height = `${Math.round(window.innerHeight + over * 0.75)}px`;
      pinEl.style.height = `calc(100svh + ${Math.round(over * 0.75)}px)`;
      requestTick();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(t);
    window.addEventListener("resize", measure);
    // Фокус с клавиатуры не должен прокручивать обрезанную сцену
    const keep = () => {
      st.scrollLeft = 0;
      st.scrollTop = 0;
    };
    st.addEventListener("scroll", keep);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      st.removeEventListener("scroll", keep);
      pinEl.style.height = "";
      t.style.transform = "";
      items().forEach((el) => {
        el.style.transform = "";
        el.style.opacity = "";
      });
    };
  }, [live]);

  useScrollFx(
    pin,
    (p) => {
      if (!live) return;
      const { over, vw, centers } = geo.current;
      const t = track.current!;
      const tx = -p * over;
      t.style.transform = `translate3d(${tx.toFixed(1)}px,0,0)`;
      let best = 0;
      let bestD = Infinity;
      (Array.from(t.children) as HTMLElement[]).forEach((el, i) => {
        const d = (centers[i] + tx - vw / 2) / vw;
        const a = Math.max(-1, Math.min(1, d));
        el.style.transform = `translate3d(0,0,${(-Math.abs(a) * 260).toFixed(1)}px) rotateY(${(-a * 34).toFixed(2)}deg)`;
        el.style.opacity = (1 - Math.min(0.6, Math.abs(a) * 0.7)).toFixed(3);
        if (Math.abs(d) < bestD) {
          bestD = Math.abs(d);
          best = i;
        }
      });
      if (count.current) count.current.textContent = String(best + 1).padStart(2, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
    },
    "sticky",
  );

  /** Фокус с клавиатуры: докручиваем страницу, чтобы кадр встал по центру сцены */
  const focusItem = (i: number) => {
    if (!live) return;
    const { over, vw, centers } = geo.current;
    const pinEl = pin.current!;
    const p = over ? Math.min(1, Math.max(0, (centers[i] - vw / 2) / over)) : 0;
    const top = pinEl.getBoundingClientRect().top + window.scrollY;
    scrollToY(top + p * (pinEl.offsetHeight - window.innerHeight));
  };

  return (
    <section id="obves" tabIndex={-1} aria-labelledby="obves-title" className="section-y border-t border-line">
      <div className="container-x">
        <SectionHead number="07" id="obves-title" eyebrow="Изготовление под заказ" title="Силовой обвес">
          <p className="text-muted">Изготовим силовой бампер, пороги, калитку, багажник и обвес под ваш внедорожник — под ваш дизайн.</p>
        </SectionHead>
      </div>

      <div ref={pin} className={cn("fab-pin mt-14", live && "fab-live")}>
        <div ref={stage} className="fab-stage">
          <div ref={track} className="fab-track container-x grid gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-4">
            <PhotoFrame photo={gallery[0]} ratio="4/3" sizes="(min-width: 1024px) 58vw, 100vw" onOpen={() => openLightbox(gallery, 0)} onFocus={() => focusItem(0)} className="fab-item reveal sm:col-span-2 lg:col-span-7 lg:row-span-2 lg:[&>.frame-media]:h-full" />
            {gallery.slice(1, 3).map((p, i) => (
              <PhotoFrame key={p.name} photo={p} ratio="4/3" sizes="(min-width: 1024px) 40vw, 50vw" onOpen={() => openLightbox(gallery, i + 1)} onFocus={() => focusItem(i + 1)} className="fab-item reveal lg:col-span-5" />
            ))}
            {gallery.slice(3).map((p, i) => (
              <PhotoFrame key={p.name} photo={p} ratio={p.name === "obves-prado120-front" ? "4/3" : "4/5"} sizes="(min-width: 1024px) 32vw, 50vw" onOpen={() => openLightbox(gallery, i + 3)} onFocus={() => focusItem(i + 3)} className="fab-item reveal lg:col-span-4" />
            ))}
          </div>
          <p aria-hidden="true" className="fab-title eyebrow container-x text-muted">
            <span className="text-accent">07 — </span>Силовой обвес · наши работы
          </p>
          <div aria-hidden="true" className="fab-hud container-x">
            <span className="mono text-sm">
              <span ref={count} className="text-accent">01</span> / {String(gallery.length).padStart(2, "0")}
            </span>
            <span className="fab-bar">
              <span ref={bar} />
            </span>
            <span className="mono text-sm text-muted">Листайте вниз</span>
          </div>
        </div>
      </div>

      <div className="container-x">
        <div className="mt-14 grid gap-10 border-t border-line pt-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h3 className="display text-[1.6rem]">Что делаем</h3>
            <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {made.map((m) => (
                <li key={m} className="flex gap-3">
                  <span aria-hidden="true" className="mt-[0.62em] h-0.5 w-3 shrink-0 bg-accent" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[3px] border border-line bg-surface p-6 lg:col-span-4 lg:col-start-9">
            <p className="eyebrow text-accent">{phone.label}</p>
            <a href={`tel:${phone.tel}`} className="mono mt-3 inline-flex min-h-11 items-center gap-3 text-xl hover:text-accent">
              <Phone aria-hidden="true" className="size-5 text-accent" />
              {phone.display}
            </a>
            <Button className="mt-5 w-full" onClick={() => openLead(svc.title)}>Узнать цену</Button>
          </div>
        </div>
      </div>
    </section>
  );
}
