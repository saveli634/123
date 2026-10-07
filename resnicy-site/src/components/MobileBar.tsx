import { useEffect, useRef } from "react";
import { ChannelIcon } from "./Buttons";
import { phoneChannel, primaryBooking } from "@/site.config";

/**
 * Нижняя панель на телефоне: «Записаться» (+ «Позвонить», если есть номер).
 * Под неё у страницы оставлен отступ снизу. Пока на экране первый экран (там свои кнопки),
 * сцена «Подъём» (не мешать картинке) или блок записи — панель спрятана.
 */
export function MobileBar() {
  const bar = useRef<HTMLDivElement>(null);
  const main = primaryBooking();
  const phone = phoneChannel();

  useEffect(() => {
    const el = bar.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const hide = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? hide.add(e.target) : hide.delete(e.target)));
        el.classList.toggle("is-hidden", hide.size > 0);
      },
      { threshold: 0, rootMargin: "-20% 0px -20% 0px" },
    );
    ["#top", "#podyom", "#zapis"].forEach((s) => {
      const t = document.querySelector(s);
      if (t) io.observe(t);
    });
    return () => io.disconnect();
  }, []);

  if (!main && !phone) return null;
  return (
    // до запуска скриптов панель спрятана: на первом экране свои кнопки
    <div className="mobile-bar is-hidden" ref={bar}>
      {main && main.id !== "phone" && (
        <a className="mobile-bar-main" href={main.href} rel="noopener noreferrer" data-ext="">
          Записаться
        </a>
      )}
      {phone && (
        <a className="mobile-bar-call" href={phone.href} aria-label="Позвонить">
          <ChannelIcon id="phone" />
          <span>Позвонить</span>
        </a>
      )}
    </div>
  );
}
