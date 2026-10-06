/**
 * ВСЕ ДАННЫЕ ДЛЯ ПРАВКИ — ЗДЕСЬ.
 * После правки: npm run build:all (обновит dist/ и sait.html).
 *
 * Пустая строка = данных нет: связанная кнопка или блок на сайте просто не показываются.
 */
export const site = {
  /**
   * {{BRAND}} — название латиницей. Пишется каллиграфией в интро, шапке, ленте и подвале.
   * «Lash» и «Angel» — её собственные надписи из постов, переведённые в вектор (выглядят как на фото).
   * Любое другое слово тоже сработает: оно будет набрано каллиграфическим шрифтом Pinyon Script
   * (только латиница).
   */
  brand: "Lash",

  /** {{MASTER_NAME}} — имя мастера. Пока пусто, строка с именем не выводится. */
  masterName: "",

  city: "Минск",

  /**
   * {{BOOKING_URL}} — каналы записи. Работает любая комбинация: кнопка появляется только у заполненного.
   *   instagram — ссылка на профиль: "https://instagram.com/ник" (или "https://ig.me/m/ник" — сразу в директ)
   *   telegram  — "https://t.me/ник"
   *   whatsapp  — номер в международном формате, только цифры: "375291234567"
   *   phone     — номер для кнопки «Позвонить»: "+375 29 123-45-67"
   */
  booking: {
    instagram: "",
    telegram: "",
    whatsapp: "",
    phone: "",
  },

  /**
   * Пока ни одного канала нет, кнопка записи ведёт на её же пост в Instagram
   * «Почему тебе нужно записаться ко мне на реснички» — ссылка рабочая, из профиля в один тап.
   * Как только заполнен любой канал выше, эта ссылка не используется.
   */
  instagramPost: "https://www.instagram.com/p/DJFIaIeNZX7/",

  /** {{ADDRESS}} — адрес или район. Пока пусто, блок «Где принимаю» скрыт. */
  address: "",

  /**
   * Цены. Пока список пуст, блок «Цены» скрыт. Пример строки:
   *   { name: "Ламинирование ресниц", price: "00 BYN", note: "около 1 часа" },
   */
  prices: [] as { name: string; price: string; note?: string }[],
};

export type Channel = { id: "instagram" | "telegram" | "whatsapp" | "phone" | "post"; label: string; href: string };

const digits = (s: string) => s.replace(/[^\d+]/g, "");

/** Кнопки записи по заполненным каналам (порядок — как в объекте booking). */
export function bookingChannels(): Channel[] {
  const b = site.booking;
  const list: Channel[] = [];
  if (b.instagram) list.push({ id: "instagram", label: "Написать в Instagram", href: b.instagram });
  if (b.telegram) list.push({ id: "telegram", label: "Написать в Telegram", href: b.telegram });
  if (b.whatsapp) list.push({ id: "whatsapp", label: "Написать в WhatsApp", href: `https://wa.me/${digits(b.whatsapp).replace("+", "")}` });
  if (b.phone) list.push({ id: "phone", label: "Позвонить", href: `tel:${digits(b.phone)}` });
  if (!list.length && site.instagramPost) list.push({ id: "post", label: "Мой Instagram", href: site.instagramPost });
  return list;
}

/** Главная кнопка «Записаться»: первый канал, кроме телефона (звонок — отдельной кнопкой). */
export function primaryBooking(): Channel | null {
  return bookingChannels().find((c) => c.id !== "phone") ?? bookingChannels()[0] ?? null;
}

export const phoneChannel = (): Channel | null => bookingChannels().find((c) => c.id === "phone") ?? null;
