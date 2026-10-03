import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useLang } from "@/lib/lang";
import { finePointer, motionOK } from "@/lib/env";
import { getVelocity, subscribe } from "@/lib/scroll";
import type { FrameName } from "@/content/frames";
import { Lion } from "@/components/Lion";
import { Rich } from "@/components/Text";
import { Frame } from "@/components/Frame";
import { Btn } from "@/components/Cta";
import { IconArrow, Star } from "@/components/Icons";

/** Кадры первого экрана — реальные, из роликов: АКПП, охлаждение ATF, бокс. */
const MEDIA: { name: FrameName; position: string }[] = [
  { name: "valve_body_hand", position: "50% 58%" },
  { name: "radiator_installed", position: "50% 40%" },
  { name: "garage_lift_wide", position: "50% 50%" },
];
const SLIDE_MS = 4600;

/**
 * Первый экран: Carleone Service · Алматы, техническое заявление, направления, две кнопки.
 * Справа (на телефоне — фоном) — кадры из роликов сменяются шторкой; лев — водяной знак с параллаксом.
 */
export function Hero({ onBook }: { onBook: () => void }) {
  const { t } = useLang();
  const root = useRef<HTMLElement>(null);
  const lion = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const [slide, setSlide] = useState({ idx: 0, prev: -1 });
  // остальные кадры подгружаем незадолго до первой смены — первый экран грузится быстрее
  const [extra, setExtra] = useState(false);
  const idx = slide.idx;

  // смена кадров: только когда первый экран виден и вкладка активна
  useEffect(() => {
    const el = root.current;
    if (!el || !motionOK()) return;
    let timer = 0;
    let visible = true;
    const warm = window.setTimeout(() => setExtra(true), SLIDE_MS - 1800);
    const tick = () => {
      window.clearTimeout(timer);
      if (!visible || document.hidden) return;
      timer = window.setTimeout(() => {
        setSlide((s) => ({ idx: (s.idx + 1) % MEDIA.length, prev: s.idx }));
        tick();
      }, SLIDE_MS);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      tick();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(warm);
      io.disconnect();
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  // параллакс: лев и кадр идут за мышью; при уходе с экрана текст поднимается и гаснет
  useEffect(() => {
    if (!motionOK()) return;
    let mx = 0;
    let my = 0;
    let p = 0;
    let raf = 0;
    const paint = () => {
      raf = 0;
      if (lion.current)
        lion.current.style.transform = `translate3d(${(mx * -22).toFixed(1)}px, ${(p * 90 + my * -16).toFixed(1)}px, 0)`;
      if (media.current)
        media.current.style.transform = `translate3d(${(mx * 10).toFixed(1)}px, ${(p * -70 + my * 8).toFixed(1)}px, 0)`;
      if (copy.current) {
        copy.current.style.opacity = String(Math.max(0, 1 - p * 1.4));
        copy.current.style.transform = `translate3d(0, ${(p * -50).toFixed(1)}px, 0)`;
      }
    };
    const req = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const un = subscribe(root.current, "exit", (v) => {
      p = v;
      req();
    });
    const move = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
      req();
    };
    if (finePointer()) window.addEventListener("pointermove", move, { passive: true });
    return () => {
      un();
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={root} id="top" className="hero" aria-labelledby="hero-title">
      <div ref={lion} className="hero-mark" aria-hidden="true">
        <div className="hero-glow" />
        <Lion className="relative h-full w-full" />
      </div>

      <div className="hero-media-wrap">
        <div ref={media} className="hero-media" data-cycled={slide.prev >= 0 ? "" : undefined}>
          {MEDIA.map((m, k) => (
            <div
              key={m.name}
              className="hero-slide"
              data-on={k === idx ? "" : undefined}
              data-prev={k === slide.prev ? "" : undefined}
            >
              {(k === 0 || extra) && (
                <Frame
                  name={m.name}
                  fill
                  eager={k === 0}
                  sizes="(max-width: 1023px) 100vw, 36vw"
                  position={m.position}
                  className="no-border"
                />
              )}
            </div>
          ))}
          <div className="hero-hud" aria-hidden="true">
            <span className="hud-corner" />
            <span className="hud-corner" />
            <span className="hud-corner" />
            <span className="hud-corner" />
            <div className="hero-hud-bar">
              <span className="t-num text-gold">
                0{idx + 1} <span className="text-muted">/ 0{MEDIA.length}</span>
              </span>
              <span className="t-label hero-hud-label">{t.hero.media[idx]}</span>
            </div>
            <span className="hero-hud-line">
              <i key={idx} />
            </span>
          </div>
        </div>
      </div>

      <div className="wrap hero-inner" data-reveal="">
        <div ref={copy} className="hero-copy">
          <p className="hero-brand fade-up" style={{ "--d": 60 } as CSSProperties}>
            <Lion className="hero-brand-lion" />
            <span className="flex flex-col gap-1.5">
              <b translate="no">{t.hero.brand}</b>
              <span>{t.hero.city}</span>
            </span>
          </p>
          <h1 id="hero-title" className="t-display hero-title">
            {t.hero.title.map((l, k) => (
              <span className="ln" key={k}>
                <span style={{ "--i": k + 1 } as CSSProperties}>
                  <Rich text={l} />
                </span>
              </span>
            ))}
          </h1>
          <p className="hero-spec fade-up" style={{ "--d": 380 } as CSSProperties}>
            {t.hero.spec.map((s, k) => (
              <span key={s}>
                {s}
                {k < t.hero.spec.length - 1 && <i aria-hidden="true">·</i>}
              </span>
            ))}
          </p>
          <p className="fade-up t-body hero-lead" style={{ "--d": 460 } as CSSProperties}>
            {t.hero.sub}
          </p>
          <div className="fade-up hero-ctas" style={{ "--d": 540 } as CSSProperties}>
            <Btn onClick={onBook} iconEnd={<IconArrow />}>
              {t.cta.book}
            </Btn>
            <Btn href="#cases" variant="line">
              {t.cta.cases}
            </Btn>
          </div>
        </div>
      </div>

      <div className="wrap hero-foot" aria-hidden="true">
        <span />
        <span className="t-label hero-scroll text-muted">
          {t.hero.scroll}
          <i />
        </span>
      </div>
    </section>
  );
}

/* ----------------------------------- Бегущая лента ----------------------------------- */
export function Marquee({ items }: { items: string[] }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = root.current;
    const tr = track.current;
    if (!el || !tr || !motionOK()) return;
    let x = 0;
    let dir = -1;
    let raf = 0;
    let last = 0;
    let on = false;
    let paused = false; // наведение мыши — лента стоит (можно прочитать)
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    el.addEventListener("pointerenter", pause);
    el.addEventListener("pointerleave", resume);
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = paused ? 0 : Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const v = getVelocity();
      if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1;
      const speed = 38 + Math.min(900, Math.abs(v) * 42); // px/с: база + разгон от прокрутки
      const w = tr.scrollWidth / 2;
      x += dir * speed * dt;
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      tr.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !on) {
        on = true;
        last = 0;
        raf = requestAnimationFrame(loop);
      } else if (!e.isIntersecting && on) {
        on = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", pause);
      el.removeEventListener("pointerleave", resume);
    };
  }, []);
  const row = (k: number) =>
    items.map((s, i) => (
      <span className="marquee-item" key={`${k}-${i}`}>
        {s}
        <Star className="marquee-star" />
      </span>
    ));
  return (
    <div ref={root} className="marquee" aria-hidden="true">
      <div ref={track} className="marquee-track">
        {row(0)}
        {row(1)}
        {row(2)}
        {row(3)}
      </div>
    </div>
  );
}
