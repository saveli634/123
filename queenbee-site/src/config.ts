/**
 * CONFIG — заполняет владелец. Пустые поля на сайте не рисуют заглушек:
 * блоки «Адрес», «Часы», «Instagram» скрываются, кнопки ведут на запасные якоря.
 * Сводка недостающего — только в панели ?dev=1.
 * `npm run build:release` не соберётся, пока не заполнены city, phone или whatsapp,
 * instagram и не подтверждены согласия на фото (guestsConsentConfirmed, staffConsentConfirmed).
 */
export interface Service {
  /** название услуги, как в прайсе салона */
  name: string;
  /** цена текстом, например «от 15 000 ₸»; пусто — на сайте «по запросу» */
  price?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  /** имя файла фото без расширения из public/img (необязательно) */
  photo?: string;
}

export const CONFIG = {
  name: "Queen Bee",
  project: "Queen Bee Boheme Residence",
  /** город, например «Алматы» */
  city: "",
  /** адрес одной строкой */
  address: "",
  /** часы работы одной строкой, например «Ежедневно, 10:00–21:00» */
  workHours: "",
  /** телефон в международном формате: +7 700 000 00 00 */
  phone: "",
  /** номер WhatsApp, только цифры с кодом страны: 77000000000 */
  whatsapp: "",
  /** ссылка на профиль: https://instagram.com/… */
  instagram: "",
  /** ссылка на карту (2ГИС, Яндекс, Google) для кнопки «Построить маршрут» */
  mapLink: "",
  /** услуги и цены; пусто — показываются три подтверждённых направления */
  services: [] as Service[],
  /** гостьи на фото дали согласие на публикацию на сайте */
  guestsConsentConfirmed: false,
  /** мастер на кадрах guest_a_02, guest_a_03 дал согласие */
  staffConsentConfirmed: false,
  /** показывать @-аккаунты гостей (на сайте не используются) */
  showGuestHandles: false,
  /** кадры works_check (ролик похож на генерацию) — только после подтверждения владельца */
  showAiReel: false,
  /** блок «Команда» — только с заполненным списком team */
  showTeam: false,
  team: [] as TeamMember[],
};

export type Config = typeof CONFIG;
