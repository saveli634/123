/**
 * Данные, которых пока нет. Всё, что равно null, на сайте не показывается:
 * блок «Записаться», кнопки в шапке и нижняя панель на телефоне появятся сами,
 * как только будет заполнен хотя бы один канал записи.
 *
 * Заполнить можно здесь или переменными окружения при сборке (VITE_INSTAGRAM=... npm run build).
 * Портрет: положите файл в src/assets/portrait.jpg (или .webp/.png) — он подхватится сам.
 */

const env = (key: string): string | null => {
  const v = (import.meta.env as Record<string, string | undefined>)[key];
  return v && v.trim() ? v.trim() : null;
};

export interface Price {
  name: string;
  price: string;
}

export const site = {
  name: "Татьяна",
  /** {{SURNAME}} */
  surname: env("VITE_SURNAME"),
  /** {{CITY}} — например «Алматы» или «Алматы и онлайн» */
  city: env("VITE_CITY"),
  /** {{BOOKING_URL}} — любые из каналов; кнопки собираются из заполненных */
  booking: {
    /** https://instagram.com/имя или https://ig.me/m/имя */
    instagram: env("VITE_INSTAGRAM"),
    /** https://t.me/имя */
    telegram: env("VITE_TELEGRAM"),
    /** https://wa.me/77001234567 */
    whatsapp: env("VITE_WHATSAPP"),
    /** +77001234567 */
    phone: env("VITE_PHONE"),
  },
  /** {{PRICES}} — например [{ name: "Натальная карта", price: "…" }] */
  prices: null as Price[] | null,
};

export interface Channel {
  id: "instagram" | "telegram" | "whatsapp" | "phone";
  label: string;
  href: string;
}

export const channels: Channel[] = (
  [
    site.booking.instagram && { id: "instagram", label: "Написать в Instagram", href: site.booking.instagram },
    site.booking.telegram && { id: "telegram", label: "Написать в Telegram", href: site.booking.telegram },
    site.booking.whatsapp && { id: "whatsapp", label: "Написать в WhatsApp", href: site.booking.whatsapp },
    site.booking.phone && { id: "phone", label: "Позвонить", href: `tel:${site.booking.phone.replace(/[^\d+]/g, "")}` },
  ] as (Channel | null)[]
).filter((c): c is Channel => !!c);

export const hasBooking = channels.length > 0;

export const fullName = site.surname ? `${site.name} ${site.surname}` : site.name;

const portraits = import.meta.glob("../assets/portrait.{jpg,jpeg,png,webp,avif}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

/** {{PORTRAIT}} */
export const portrait: string | null = Object.values(portraits)[0] ?? null;
