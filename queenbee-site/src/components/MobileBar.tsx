import { callHref } from "@/lib/links";

/** Нижняя панель телефона. Под неё у страницы оставлен отступ — контент не перекрывается. */
export function MobileBar() {
  return (
    <nav className="mbar" aria-label="Быстрые действия">
      <a href={callHref} className="mbar__btn">
        Позвонить
      </a>
      <a href="#booking" className="mbar__btn mbar__btn--wine">
        Записаться
      </a>
    </nav>
  );
}
