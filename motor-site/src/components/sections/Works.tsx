import { useEffect, useRef } from "react";
import { WORKS } from "@/content/copy";
import { CONFIG } from "@/config";
import { Frame } from "@/components/shared/Frame";
import { Lines } from "@/components/shared/Lines";
import { SecLabel } from "@/components/shared/Glyphs";
import { Cta } from "@/components/shared/Cta";
import { useScrollFx } from "@/lib/scroll";
import { finePointer, motionAllowed } from "@/lib/env";

/**
 * Работы: горизонтальная закреплённая галерея (компьютер — вертикальная прокрутка ведёт ленту),
 * на телефоне — лента со свайпом. Шкала прогресса «03 / 10» и линия.
 */
const pad = (n: number) => String(n).padStart(2, "0");

export function Works() {
  const ref = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const items = WORKS.items;

  const setProgress = (p: number) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--wp", p.toFixed(4));
    const n = el.querySelector<HTMLElement>("[data-works-n]");
    if (n) n.textContent = pad(Math.min(items.length, 1 + Math.round(p * (items.length - 1))));
  };

  // Компьютер: закреплённая сцена, лента едет по горизонтали
  useScrollFx(
    ref,
    (p) => {
      const tr = track.current;
      if (!tr || !document.documentElement.classList.contains("pin-works")) return;
      const max = tr.scrollWidth - window.innerWidth;
      tr.style.transform = `translate3d(${(-p * Math.max(0, max)).toFixed(1)}px,0,0)`;
      setProgress(p);
    },
    "sticky",
  );

  useEffect(() => {
    const root = document.documentElement;
    const el = ref.current;
    const tr = track.current;
    if (!el || !tr) return;
    const pin = motionAllowed() && finePointer() && window.innerWidth >= 1024;
    if (pin) {
      // Высота секции = длина ленты: прокрутка «тратится» на горизонтальный проезд
      const size = () => {
        el.style.height = `${Math.max(window.innerHeight * 1.6, tr.scrollWidth - window.innerWidth + window.innerHeight)}px`;
      };
      root.classList.add("pin-works");
      size();
      window.addEventListener("resize", size);
      return () => {
        window.removeEventListener("resize", size);
        root.classList.remove("pin-works");
        el.style.height = "";
      };
    }
    // Телефон / без движения: лента со свайпом, прогресс по scrollLeft
    const st = strip.current;
    if (!st) return;
    const onScroll = () => setProgress(st.scrollLeft / Math.max(1, st.scrollWidth - st.clientWidth));
    st.addEventListener("scroll", onScroll, { passive: true });
    return () => st.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section id="raboty" ref={ref} className="works" aria-labelledby="works-title">
      <div className="works-pin">
        <div className="wrap works-head">
          <SecLabel n={5} total={9}>
            {WORKS.label}
          </SecLabel>
          <Lines id="works-title" className="display h-sec works-h" lines={[WORKS.label]} />
          <div className="works-meter" aria-hidden="true">
            <span className="num" data-works-n>
              01
            </span>
            <span className="works-bar">
              <span />
            </span>
            <span className="num">{pad(items.length)}</span>
          </div>
        </div>
        <div ref={strip} className="works-strip" data-cursor="drag" tabIndex={0} aria-label={WORKS.label}>
          <div ref={track} className="works-track">
            {items.map((w, i) => (
              <div key={w.img} className="works-item">
                <Frame
                  img={w.img}
                  alt={w.flag && CONFIG[w.flag] && w.captionConfirmed ? w.captionConfirmed : w.caption}
                  caption={w.flag && CONFIG[w.flag] && w.captionConfirmed ? w.captionConfirmed : w.caption}
                  index={`05.${pad(i + 1)}`}
                  sizes="(min-width: 1024px) 24vw, 62vw"
                  wipe={false}
                  ratio={1.42}
                />
              </div>
            ))}
            <div className="works-end">
              <Cta kind="instagram" size="lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
