import { useEffect, useRef, useState } from "react";
import { Split } from "./Split";
import { Photo, ratio, type PhotoName } from "./Photo";
import { videoUrl, single } from "@/media-src";
import { canHover, motionAllowed } from "@/lib/env";
import { gsap } from "@/lib/motion";

type Item = { kind: "photo"; name: PhotoName; alt: string; caption: string; position?: string } | { kind: "video"; caption: string };

const ITEMS: Item[] = [
  { kind: "photo", name: "hero", alt: "Ламинированные ресницы крупным планом, зелёный глаз", caption: "ламинирование ресниц" },
  { kind: "photo", name: "after", alt: "Ресницы после ламинирования: подняты и разделены, голубой глаз", caption: "ламинирование · после" },
  { kind: "video", caption: "expressive eyes! — выразительные глаза" },
  { kind: "photo", name: "violet", alt: "Наращенные ресницы в фиолетовом свете, карие глаза", caption: "наращивание ресниц" },
  { kind: "photo", name: "selfie", alt: "Наращенные ресницы, голубые глаза и брови крупным планом", caption: "наращивание ресниц" },
];

const VIDEO_RATIO = 480 / 854;

/**
 * Горизонтальная галерея: родная прокрутка с привязкой к кадрам (на телефоне — свайп с инерцией системы),
 * мышью — перетаскивание с инерцией. Текущий кадр подсвечен, ролик играет, только когда он на экране.
 */
export function Works() {
  const scroller = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [current, setCurrent] = useState(0);

  // текущий кадр — ближайший к центру
  useEffect(() => {
    const el = scroller.current!;
    const items = Array.from(el.querySelectorAll<HTMLElement>(".work"));
    let frame = 0;
    const pars = items.map((it) => it.querySelector<HTMLElement>(".work-par"));
    const update = () => {
      frame = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0;
      let bestD = Infinity;
      items.forEach((it, i) => {
        const off = it.offsetLeft + it.offsetWidth / 2 - mid;
        // фото внутри кадра чуть отстаёт от рамки — глубина при перелистывании
        const par = pars[i];
        if (par) par.style.transform = `translate3d(${Math.max(-9, Math.min(9, (-off / el.clientWidth) * 9)).toFixed(2)}%,0,0) scale(1.18)`;
        const d = Math.abs(off);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setCurrent(best);
    };
    const req = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // поля слева и справа — чтобы первый и последний кадр тоже вставали по центру
    const pad = () => {
      const track = el.firstElementChild as HTMLElement;
      track.style.paddingLeft = `${Math.max(16, (el.clientWidth - items[0].offsetWidth) / 2)}px`;
      track.style.paddingRight = `${Math.max(16, (el.clientWidth - items[items.length - 1].offsetWidth) / 2)}px`;
    };
    const onResize = () => {
      pad();
      req();
    };
    pad();
    update();
    el.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", req);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // перетаскивание мышью с инерцией и доводкой до ближайшего кадра
  useEffect(() => {
    const el = scroller.current!;
    if (!canHover()) return;
    let down = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;
    let lastX = 0;
    let lastT = 0;
    let v = 0;
    let tween: gsap.core.Tween | null = null;
    const pd = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true;
      moved = false;
      startX = lastX = e.clientX;
      startLeft = el.scrollLeft;
      lastT = performance.now();
      v = 0;
      tween?.kill();
      el.classList.add("is-grabbing");
    };
    const pm = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      el.scrollLeft = startLeft - dx;
      const now = performance.now();
      v = (e.clientX - lastX) / Math.max(1, now - lastT);
      lastX = e.clientX;
      lastT = now;
    };
    const pu = () => {
      if (!down) return;
      down = false;
      el.classList.remove("is-grabbing");
      // инерция: докатываемся по скорости и встаём на ближайший кадр
      const items = Array.from(el.querySelectorAll<HTMLElement>(".work"));
      const goal = el.scrollLeft - v * (motionAllowed() ? 380 : 0);
      const mid = goal + el.clientWidth / 2;
      const target = items.reduce((a, it) => {
        const c = it.offsetLeft + it.offsetWidth / 2;
        return Math.abs(c - mid) < Math.abs(a - mid) ? c : a;
      }, Infinity);
      el.classList.add("is-gliding");
      tween = gsap.to(el, {
        scrollLeft: target - el.clientWidth / 2,
        duration: motionAllowed() ? 0.9 : 0,
        ease: "power3.out",
        onComplete: () => el.classList.remove("is-gliding"),
      });
    };
    const click = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    el.addEventListener("pointerdown", pd);
    window.addEventListener("pointermove", pm);
    window.addEventListener("pointerup", pu);
    el.addEventListener("click", click, true);
    return () => {
      el.removeEventListener("pointerdown", pd);
      window.removeEventListener("pointermove", pm);
      window.removeEventListener("pointerup", pu);
      el.removeEventListener("click", click, true);
      tween?.kill();
    };
  }, []);

  // ролик: источник подключается только в браузере; играет, пока виден
  useEffect(() => {
    const v = video.current;
    if (!v) return;
    let url = videoUrl;
    let revoke = "";
    // встроенный в однофайловую версию ролик — в Blob URL (так его надёжнее играет Safari)
    if (single && url.startsWith("data:")) {
      try {
        const [head, b64] = url.split(",");
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        revoke = url = URL.createObjectURL(new Blob([bytes], { type: head.slice(5).split(";")[0] }));
      } catch {
        /* остаётся data: URL */
      }
    }
    let loaded = false;
    const reduce = !motionAllowed();
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!loaded) {
            v.src = url;
            loaded = true;
          }
          if (!reduce) v.play().catch(() => {});
        } else v.pause();
      },
      { threshold: 0.35 },
    );
    io.observe(v);
    return () => {
      io.disconnect();
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, []);

  const go = (dir: number) => {
    const el = scroller.current!;
    const items = el.querySelectorAll<HTMLElement>(".work");
    const next = items[Math.max(0, Math.min(items.length - 1, current + dir))];
    const left = next.offsetLeft + next.offsetWidth / 2 - el.clientWidth / 2;
    el.classList.add("is-gliding");
    gsap.to(el, {
      scrollLeft: left,
      duration: motionAllowed() ? 0.8 : 0,
      ease: "power3.inOut",
      onComplete: () => el.classList.remove("is-gliding"),
    });
  };

  return (
    <section className="works section" id="raboty" aria-labelledby="works-title">
      <div className="container works-head">
        <header className="section-head">
          <p className="eyebrow" data-reveal>
            <span className="eyebrow-num">06</span>Из моих постов
          </p>
          <Split id="works-title" className="h2" text="*Работы*" />
        </header>
        <div className="works-nav" data-reveal>
          <span className="works-count" aria-hidden="true">
            <b>{String(current + 1).padStart(2, "0")}</b> / {String(ITEMS.length).padStart(2, "0")}
          </span>
          <button type="button" className="round-btn" onClick={() => go(-1)} aria-label="Предыдущая работа" disabled={current === 0}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M20 12H5m6-6-6 6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="round-btn"
            onClick={() => go(1)}
            aria-label="Следующая работа"
            disabled={current === ITEMS.length - 1}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                d="M4 12h15m-6-6 6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="works-scroller"
        data-cursor="листай"
        ref={scroller}
        tabIndex={0}
        role="region"
        aria-label="Галерея работ, листается вбок"
      >
        <ul className="works-track">
          {ITEMS.map((it, i) => {
            const ar = it.kind === "video" ? VIDEO_RATIO : ratio(it.name);
            return (
              <li
                key={i}
                className={`work ${i === current ? "is-current" : ""} ${it.kind === "video" ? "work--video" : ""}`}
                style={{ "--ar": ar } as React.CSSProperties}
                aria-current={i === current ? "true" : undefined}
              >
                <figure className="work-figure" data-reveal="curtain">
                  <div className="work-media">
                    <div className="work-par">
                      {it.kind === "photo" ? (
                        <Photo name={it.name} alt={it.alt} sizes="(min-width: 1024px) 50vw, 86vw" position={it.position} />
                      ) : (
                        <>
                          <Photo name="poster" alt="" sizes="280px" className="work-poster" />
                          <video
                            ref={video}
                            className="work-video"
                            muted
                            loop
                            playsInline
                            preload="none"
                            aria-label="Ролик: глаза с ламинированными ресницами крупным планом"
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <figcaption className="work-caption">
                    <span className="work-index">{String(i + 1).padStart(2, "0")}</span>
                    {it.caption}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
