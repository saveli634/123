import { useEffect, useRef } from "react";
import { BrandMark } from "./Brand";
import { ScrollTrigger, gsap, motionStarted } from "@/lib/motion";
import { site } from "@/site.config";

/** Бегущая лента «{{BRAND}} · ресницы · Минск»: скорость и направление — от скорости прокрутки. */
export function Marquee() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!motionStarted()) return;
    const el = track.current!;
    let x = 0;
    let half = el.scrollWidth / 2;
    let boost = 0;
    let dir = 1;
    let visible = false;
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (visible = self.isActive),
      onUpdate: (self) => {
        const v = self.getVelocity();
        if (Math.abs(v) > 30) dir = v > 0 ? 1 : -1;
        boost = Math.min(14, Math.abs(v) / 260);
      },
    });
    const tick = (_t: number, dt: number) => {
      if (!visible) return;
      boost *= 0.94;
      x -= dir * (0.045 + boost * 0.09) * dt;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      el.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
    };
    const measure = () => (half = el.scrollWidth / 2);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    gsap.ticker.add(tick);
    return () => {
      st.kill();
      gsap.ticker.remove(tick);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const group = (k: number) => (
    <div className="marquee-group" key={k}>
      {[0, 1, 2].map((i) => (
        <span className="marquee-item" key={i}>
          <BrandMark decorative className="marquee-brand" />
          <span className="marquee-dot" />
          <span className="marquee-word">ресницы</span>
          <span className="marquee-dot" />
          <span className="marquee-word marquee-word--italic">{site.city}</span>
          <span className="marquee-dot" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee" ref={root} aria-hidden="true">
      <div className="marquee-track" ref={track}>
        {group(0)}
        {group(1)}
      </div>
    </div>
  );
}
