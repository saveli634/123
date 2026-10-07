import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap } from "gsap";
import reviews from "@/content/reviews.generated.json";
import { Photo, ratio, type PhotoName } from "./Photo";
import { Split } from "./Split";
import { stopScroll } from "@/lib/motion";
import { canHover, motionAllowed } from "@/lib/env";

const LIST = reviews as PhotoName[];
export const HAS_REVIEWS = LIST.length > 0;

/**
 * Отзывы — её настоящие скриншоты (assets-src/reviews/). Пока скриншотов нет, блока на сайте нет.
 * Скриншоты — в рамках телефона (рамка повторяет пропорции скриншота, длинные обрезаются снизу);
 * нажатие открывает крупно (листается стрелками, свайпом, клавишами).
 */
export function Reviews() {
  const [open, setOpen] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  // телефон: при первом появлении лента чуть сдвигается и возвращается — подсказка, что её листают
  useEffect(() => {
    const el = scroller.current;
    if (!el || canHover() || !motionAllowed() || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || el.scrollWidth <= el.clientWidth) return;
        io.disconnect();
        el.classList.add("is-gliding");
        const from = el.scrollLeft;
        gsap
          .timeline({ delay: 0.5, onComplete: () => el.classList.remove("is-gliding") })
          .to(el, { scrollLeft: from + Math.min(120, el.clientWidth * 0.28), duration: 0.7, ease: "power2.inOut" })
          .to(el, { scrollLeft: from, duration: 0.8, ease: "power3.inOut" });
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!HAS_REVIEWS) return null;
  return (
    <section className="reviews section" id="otzyvy" aria-labelledby="reviews-title">
      <div className="container">
        <header className="section-head reviews-head">
          <p className="eyebrow" data-reveal>
            <span className="eyebrow-num">07</span>Отзывы
          </p>
          <Split id="reviews-title" className="h2" text="Что *пишут*" />
          <p className="reviews-lead" data-reveal>
            Нажми на скриншот, чтобы открыть крупно.
          </p>
        </header>
      </div>
      <div className="rv-scroller" ref={scroller}>
        <ul className="rv-track">
          {LIST.map((name, i) => {
            // высота экрана в ширинах: как у скриншота, но не длиннее телефона и не шире квадрата
            const h = Math.min(Math.max(1 / ratio(name), 1), 2.1);
            return (
              <li className="rv" key={name} style={{ "--d": `${(i % 4) * 90}ms`, "--h": h.toFixed(3) } as CSSProperties} data-reveal>
                <button
                  type="button"
                  className="rv-phone"
                  onClick={() => setOpen(i)}
                  aria-label={`Отзыв ${i + 1} из ${LIST.length} — открыть крупно`}
                  data-cursor="открыть"
                >
                  <span className="rv-notch" aria-hidden="true" />
                  <span className="rv-screen">
                    <Photo
                      name={name}
                      alt={`Скриншот отзыва ${i + 1}`}
                      sizes="(min-width: 900px) 260px, 58vw"
                      className={1 / ratio(name) < 1 ? "photo--contain" : "rv-top"}
                    />
                  </span>
                  <span className="rv-glass" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {open !== null && <Lightbox index={open} onClose={() => setOpen(null)} onIndex={setOpen} />}
    </section>
  );
}

function Lightbox({ index, onClose, onIndex }: { index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const startX = useRef<number | null>(null);
  const go = (d: number) => onIndex((index + d + LIST.length) % LIST.length);

  useEffect(() => {
    stopScroll(true);
    document.documentElement.classList.add("modal-open");
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", key);
    return () => {
      stopScroll(false);
      document.documentElement.classList.remove("modal-open");
      window.removeEventListener("keydown", key);
      prev?.focus();
    };
  }, [index]);

  return (
    <div className="lb" role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="lb-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Отзыв ${index + 1} из ${LIST.length}`}
        tabIndex={-1}
        ref={panel}
        onTouchStart={(e) => (startX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const x = e.changedTouches[0]?.clientX;
          if (startX.current !== null && x !== undefined && Math.abs(x - startX.current) > 50) go(x < startX.current ? 1 : -1);
          startX.current = null;
        }}
      >
        <div className="lb-shot" key={index}>
          <Photo name={LIST[index]} alt={`Скриншот отзыва ${index + 1}`} sizes="100vw" className="photo--contain" />
        </div>
        <p className="lb-count" aria-hidden="true">
          {String(index + 1).padStart(2, "0")} / {String(LIST.length).padStart(2, "0")}
        </p>
        {LIST.length > 1 && (
          <>
            <button type="button" className="round-btn lb-prev" onClick={() => go(-1)} aria-label="Предыдущий отзыв">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M20 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button type="button" className="round-btn lb-next" onClick={() => go(1)} aria-label="Следующий отзыв">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
        <button type="button" className="modal-close lb-close" onClick={onClose} aria-label="Закрыть">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
