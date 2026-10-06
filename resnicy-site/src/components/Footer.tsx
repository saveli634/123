import { useEffect, useState } from "react";
import { BrandMark } from "./Brand";
import { MagLink, Arrow } from "./Buttons";
import { site } from "@/site.config";

export function Footer() {
  // год — текущий, из браузера (в разметке — год сборки, пока скрипты не запустились)
  const [year, setYear] = useState(() => new Date().getFullYear());
  useEffect(() => setYear(new Date().getFullYear()), []);
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <BrandMark className="footer-brand" />
        <p className="footer-line">Ламинирование и наращивание ресниц · {site.city}</p>
        <div className="footer-row">
          <p className="footer-copy">
            © {year} {site.brand}
          </p>
          <MagLink href="#top" variant="ghost" className="btn--sm" icon={<Arrow dir="up-right" />}>
            Наверх
          </MagLink>
        </div>
      </div>
    </footer>
  );
}
