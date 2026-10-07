import { useEffect, useRef, useState } from "react";
import { BrandMark } from "./Brand";
import { MagLink, Arrow } from "./Buttons";
import { PrivacyLink, PrivacyStatic } from "./Privacy";
import { ScrollTrigger, motionStarted } from "@/lib/motion";
import { useMinskTime } from "@/lib/time";
import { site } from "@/site.config";

/** Подвал: огромное название её каллиграфией «пишется» при прокрутке; реквизиты, конфиденциальность, время в Минске. */
export function Footer() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const time = useMinskTime();
  const brand = useRef<HTMLDivElement>(null);
  useEffect(() => setYear(new Date().getFullYear()), []);

  useEffect(() => {
    const el = brand.current;
    if (!el || !motionStarted()) return;
    el.classList.add("is-drawing");
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 95%",
      end: "bottom 80%",
      scrub: 0.5,
      onUpdate: (self) => el.style.setProperty("--draw", self.progress.toFixed(3)),
    });
    return () => st.kill();
  }, []);

  return (
    <footer className="footer">
      <div className="footer-big" ref={brand}>
        <BrandMark className="footer-brand" />
      </div>
      <div className="container footer-inner">
        <div className="footer-col">
          <p className="footer-line">Ламинирование и наращивание ресниц</p>
          <p className="footer-city">
            {site.city}
            {time && <span className="footer-time"> · {time}</span>}
          </p>
        </div>
        <div className="footer-row">
          <p className="footer-copy">
            © {year} {site.brand}
            {site.requisites && <span className="footer-req">{site.requisites}</span>}
          </p>
          <PrivacyLink />
          <MagLink href="#top" variant="ghost" className="btn--sm" icon={<Arrow dir="up-right" />}>
            Наверх
          </MagLink>
        </div>
      </div>
      <PrivacyStatic />
    </footer>
  );
}
