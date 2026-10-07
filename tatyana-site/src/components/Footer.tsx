import { useEffect, useState } from "react";
import { fullName, hasBooking } from "@/data/site.config";
import { NAV } from "./Header";
import { pageHref } from "@/data/pages";
import { SPARKLE } from "./glyphs";

const BUILD_YEAR = 2026;

export function Footer() {
  const [year, setYear] = useState(BUILD_YEAR);
  useEffect(() => setYear(new Date().getFullYear()), []);
  return (
    <footer className={`footer${hasBooking ? " footer--bar" : ""}`}>
      <div className="wrap">
        <div className="footer__top">
          <a href={pageHref("home")} className="footer__mark" aria-label={`${fullName} — на главную`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d={SPARKLE} />
            </svg>
            <span>{fullName}</span>
          </a>
          <p className="footer__tag">Нумерология, натальная карта, стихи и авторские песни</p>
        </div>
        <nav className="footer__nav" aria-label="Разделы">
          <a href={pageHref("home")}>Главная</a>
          {NAV.map((n) => (
            <a key={n.id} href={pageHref(n.id)}>
              {n.label}
            </a>
          ))}
          {hasBooking && <a href="#zapis">Записаться</a>}
        </nav>
        <p className="footer__disclaimer">
          Консультации носят информационный характер и не заменяют советов врача, юриста или финансового консультанта.
        </p>
        <p className="footer__copy">
          © {year} {fullName}
        </p>
      </div>
    </footer>
  );
}
