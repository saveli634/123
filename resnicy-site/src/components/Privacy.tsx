import { useEffect, useRef, useState } from "react";
import { stopScroll } from "@/lib/motion";
import { bookingChannels } from "@/site.config";

/**
 * «Конфиденциальность»: честное описание того, что сайт делает с данными посетителя.
 * Сайт ничего не собирает (нет форм, cookie, аналитики, сторонних скриптов и шрифтов) —
 * поэтому не нужен ни баннер cookie, ни согласие на обработку данных.
 */
export function PrivacyLink({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLAnchorElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    stopScroll(true);
    document.documentElement.classList.add("modal-open");
    panel.current?.focus();
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", key);
    return () => {
      stopScroll(false);
      document.documentElement.classList.remove("modal-open");
      window.removeEventListener("keydown", key);
      btn.current?.focus();
    };
  }, [open]);

  return (
    <>
      {/* якорь: без скриптов открывает текст внизу страницы, со скриптами — окно */}
      <a
        href="#konfidencialnost"
        ref={btn}
        className={`text-link ${className}`}
        aria-haspopup="dialog"
        onClick={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
      >
        Конфиденциальность
      </a>
      {open && (
        <div className="modal" role="presentation" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="privacy-title"
            tabIndex={-1}
            ref={panel}
            data-lenis-prevent
          >
            <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Закрыть">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <h2 id="privacy-title" className="modal-title">
              Конфиденциальность
            </h2>
            <PrivacyText />
          </div>
        </div>
      )}
    </>
  );
}

function PrivacyText() {
  const names = bookingChannels()
    .filter((c) => c.id !== "phone")
    .map((c) => (c.id === "post" ? "Instagram" : c.label.replace("Написать в ", "")));
  const where = [...new Set(names)].join(", ") || "мессенджеры";
  const call = bookingChannels().some((c) => c.id === "phone");
  return (
    <div className="modal-body">
      <p>
        Этот сайт — визитка. Он <b>не собирает персональные данные</b>: здесь нет форм, регистрации, файлов cookie, счётчиков аналитики и
        рекламных пикселей. Шрифты, фото и скрипты загружаются с того же адреса, что и сам сайт, — без сторонних сервисов.
      </p>
      <p>
        Чтобы не показывать заставку повторно, сайт ставит в браузере отметку «заставка просмотрена» (sessionStorage). Она хранится только
        на устройстве, никуда не передаётся и стирается, когда закрываешь вкладку.
      </p>
      <p>
        Кнопки записи ведут в {where}
        {call ? " или открывают звонок" : ""}. Переходя по ним, ты попадаешь в эти сервисы, и данные там обрабатываются по их
        правилам.
      </p>
      <p>
        Сервер хостинга, как и любой веб-сервер, может вести технические журналы обращений (IP-адрес, время, адрес страницы) — это делает
        провайдер хостинга для работы и защиты сайта.
      </p>
      <p>Вопросы о данных — напиши мне в любой канал из блока «Запись».</p>
    </div>
  );
}

/** Тот же текст на странице — виден, только когда по ссылке перешли без скриптов (#konfidencialnost). */
export function PrivacyStatic() {
  return (
    <section id="konfidencialnost" className="privacy-static" aria-labelledby="privacy-static-title">
      <div className="container">
        <h2 id="privacy-static-title" className="modal-title">
          Конфиденциальность
        </h2>
        <PrivacyText />
      </div>
    </section>
  );
}
