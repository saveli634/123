import { useEffect, useRef, type CSSProperties } from "react";
import { useLang } from "@/lib/lang";
import { WORKS } from "@/content/frames";
import { instagramHref, reelHref } from "@/lib/links";
import { motionOK } from "@/lib/env";
import { subscribe } from "@/lib/scroll";
import { cn } from "@/lib/cn";
import { Frame } from "@/components/Frame";
import { Kicker, Lines } from "@/components/Text";
import { Btn, Fill } from "@/components/Cta";
import { IconArrow } from "@/components/Icons";

/**
 * «Работы»: горизонтальная закреплённая галерея (компьютер) — вертикальная прокрутка двигает ленту
 * кадров вбок; на телефоне — лента со свайпом. Шкала прогресса снизу.
 */
export function Works() {
  const { t, lang } = useLang();
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const count = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const sec = root.current;
    const tr = track.current;
    if (!sec || !tr) return;
    const wide = window.matchMedia("(min-width: 1024px)");
    let un = () => {};
    const total = WORKS.length;

    const setup = () => {
      un();
      sec.style.height = "";
      tr.style.transform = "";
      sec.classList.remove("is-pinned");
      if (wide.matches && motionOK()) {
        sec.classList.add("is-pinned");
        // высота секции = длина ленты + экран: прокрутка по вертикали тратится на сдвиг вбок
        const dist = () => Math.max(0, tr.scrollWidth - window.innerWidth);
        const fit = () => {
          sec.style.height = `${dist() + window.innerHeight}px`;
        };
        fit();
        window.addEventListener("resize", fit);
        const off = subscribe(sec, "sticky", (p) => {
          tr.style.transform = `translate3d(${(-dist() * p).toFixed(1)}px, 0, 0)`;
          if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
          if (count.current)
            count.current.textContent = String(Math.min(total, 1 + Math.floor(p * total))).padStart(2, "0");
        });
        un = () => {
          off();
          window.removeEventListener("resize", fit);
        };
      } else {
        const onScroll = () => {
          const max = tr.scrollWidth - tr.clientWidth;
          const p = max > 0 ? tr.scrollLeft / max : 0;
          if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
          if (count.current)
            count.current.textContent = String(Math.min(total, 1 + Math.round(p * (total - 1)))).padStart(2, "0");
        };
        tr.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        un = () => tr.removeEventListener("scroll", onScroll);
      }
    };
    setup();
    wide.addEventListener?.("change", setup);
    return () => {
      un();
      wide.removeEventListener?.("change", setup);
    };
  }, []);

  const insta = instagramHref();
  return (
    <section ref={root} id="works" className="hscroll" aria-labelledby="works-title">
      <div className="hscroll-pin">
        <div className="wrap mb-8 flex flex-col gap-6 md:mb-12 md:flex-row md:items-end md:justify-between">
          <div>
            <Kicker>{t.works.label}</Kicker>
            <Lines id="works-title" lines={t.works.title} className="t-title mt-6" />
          </div>
          <div className="flex items-center gap-5" data-reveal="">
            <span className="fade-up t-label hidden text-muted lg:inline">{t.works.hint} →</span>
            <span className="fade-up">
              {insta ? (
                <Btn href={insta} external variant="line" iconEnd={<IconArrow />}>
                  {t.cta.works}
                </Btn>
              ) : (
                <Fill field="instagram" label={t.cta.works} />
              )}
            </span>
          </div>
        </div>

        <div ref={track} className="hscroll-track" data-cursor="scroll" data-reveal="">
          {WORKS.map((w, i) => {
            const reel = reelHref(w.reel);
            const tall = i % 3 === 1;
            return (
              <figure
                key={w.frame}
                className={cn("work fade-up", tall && "work-tall")}
                style={{ "--d": Math.min(i, 4) * 90 } as CSSProperties}
              >
                <Frame
                  name={w.frame}
                  ratio={tall ? 4 / 5 : 3 / 4}
                  sizes="(max-width: 1023px) 72vw, 26vw"
                  position={w.frame === "lion_plaque_bumper" ? "30% 60%" : "50% 50%"}
                  className="work-frame"
                >
                  <span className="t-num absolute top-4 left-4 z-10 text-xs text-gold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </Frame>
                <figcaption className="mt-4">
                  <p className="font-display text-xl leading-snug font-semibold">{w.title[lang]}</p>
                  {w.quote && <p className="t-body mt-1 text-[0.9rem] text-cream/65">{w.quote[lang]}</p>}
                  {reel && (
                    <a
                      href={reel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="t-label mt-3 inline-flex items-center gap-2 text-gold"
                    >
                      {t.cta.reel} <IconArrow className="h-3.5 w-3.5" />
                    </a>
                  )}
                </figcaption>
              </figure>
            );
          })}
        </div>

        <div className="wrap mt-8 flex items-center gap-5 md:mt-12">
          <span className="t-num text-xs text-gold">
            <span ref={count}>01</span>
            <span className="text-muted"> / {String(WORKS.length).padStart(2, "0")}</span>
          </span>
          <div className="progress flex-1" aria-hidden="true">
            <i ref={bar} />
          </div>
        </div>
      </div>
    </section>
  );
}
