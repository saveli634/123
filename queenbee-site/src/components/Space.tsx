import { useEffect, useRef } from "react";
import { Photo } from "./Photo";
import { Lines } from "./Lines";
import { INTERIORS, img } from "@/content/media";
import { T } from "@/content/copy";
import { onTick } from "@/lib/scroll";
import { motionAllowed } from "@/lib/env";

/** «Пространство»: закреплённая горизонтальная лента интерьеров на бордо. */
export function Space() {
  const sec = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!motionAllowed() || !sec.current || !track.current) return;
    const s = sec.current;
    const t = track.current;
    let dist = 0;
    const measure = () => {
      dist = Math.max(0, t.scrollWidth - window.innerWidth);
      s.style.setProperty("--space-h", `${dist + window.innerHeight}px`);
    };
    measure();
    s.classList.add("is-pinned");
    window.addEventListener("resize", measure);
    const off = onTick(() => {
      const r = s.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      t.style.transform = `translate3d(${-k * dist}px, 0, 0)`;
      s.style.setProperty("--k", k.toFixed(3));
    });
    return () => {
      off();
      window.removeEventListener("resize", measure);
      s.classList.remove("is-pinned");
    };
  }, []);

  return (
    <section id="space" className="space" ref={sec} aria-labelledby="space-title">
      <div className="space__sticky">
        <div className="space__head wrap">
          <p className="eyebrow">Пространство</p>
          <Lines as="h2" id="space-title" className="h2 space__title" text={T.atmosphere} />
          <p className="space__line">{T.interiorLine}</p>
        </div>
        <div className="space__viewport" data-lenis-prevent-touch="">
          <div className="space__track" ref={track}>
            {INTERIORS.map((name, i) => (
              <figure key={name} className={`room room--${i % 3}`}>
                <div className="room__frame">
                  <Photo name={name} alt={`${img(name).caption} салона Queen Bee`} sizes="(max-width: 767px) 62vw, 22vw" />
                  <span className="glint" aria-hidden="true" />
                </div>
                <figcaption>
                  <span className="room__n">{String(i + 1).padStart(2, "0")}</span>
                  {img(name).caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
        <div className="space__bar" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  );
}
