import { useEffect, useState } from "react";
import { hasBooking } from "@/data/site.config";

/**
 * Нижняя панель «Записаться» на телефоне: после первого экрана и до блока записи.
 * Пока вводят дату, панель прячется, чтобы не висеть над клавиатурой.
 */
export function MobileBar() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!hasBooking) return;
    let f = 0;
    let typing = false;
    const upd = () => {
      f = 0;
      const book = document.getElementById("zapis");
      const past = window.scrollY > window.innerHeight * 0.85;
      const nearBook = book ? book.getBoundingClientRect().top < window.innerHeight * 0.9 : false;
      setShow(past && !nearBook && !typing);
    };
    const on = () => {
      if (!f) f = requestAnimationFrame(upd);
    };
    const focus = (e: FocusEvent) => {
      typing = e.type === "focusin" && !!(e.target as HTMLElement).matches?.("input, textarea");
      upd();
    };
    upd();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", focus);
    return () => {
      cancelAnimationFrame(f);
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", focus);
    };
  }, []);
  if (!hasBooking) return null;
  return (
    <div className={`mbar${show ? " is-shown" : ""}`} aria-hidden={!show}>
      <a href="#zapis" className="btn btn--primary mbar__btn" tabIndex={show ? 0 : -1}>
        <span className="btn__label">Записаться</span>
      </a>
    </div>
  );
}
