/**
 * Данные автосервиса. Всё — только из материалов Instagram (см. README и TODO_CONFIRM.md).
 * hours: null — часы работы в источниках противоречат друг другу, на сайте не публикуем.
 * socials: [] — Instagram/Telegram/2GIS в материалах не указаны.
 */
const query = "Рыскулова 174А, Алматы";

export const site = {
  name: "Автосервис «У Грека»",
  short: "У Грека",
  tagline: "Полный спектр услуг в одном месте",
  city: "Алматы",
  street: "проспект Рыскулова, 174А",
  addressShort: "Рыскулова, 174А",
  phone: { display: "+7 707 501 0020", tel: "+77075010020" },
  /** TODO_CONFIRM: WhatsApp собран из основного номера — подтвердить у владельца */
  whatsappNumber: "77075010020",
  hours: null as string | null,
  hoursNote: "Часы работы уточняйте по телефону",
  /** TODO_CONFIRM: ссылки не предоставлены — блок соцсетей не выводится */
  socials: [] as { label: string; href: string }[],
  maps: {
    google: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query),
    twoGis: "https://2gis.kz/almaty/search/" + encodeURIComponent(query),
  },
} as const;

export function whatsapp(text = "Здравствуйте! Хочу записаться в автосервис.") {
  return `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

export const nav = [
  { href: "#uslugi", label: "Услуги" },
  { href: "#raboty", label: "Работы" },
  { href: "#avtomagazin", label: "Автомагазин" },
  { href: "#process", label: "Как мы работаем" },
  { href: "#kontakty", label: "Контакты" },
] as const;
