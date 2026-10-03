import type { SiteConfig } from "@/config";

/**
 * Итоговые настройки: src/config.ts (+ подмены для проверок, см. vite.config.ts).
 * DEMO — демо-сборка: на месте пустых полей выводится плашка «ЗАПОЛНИТЬ: …».
 */
export const site: SiteConfig = __QB_CONFIG__;
export const DEMO: boolean = __QB_DEMO__;
export const SHOW_GUESTS: boolean = __QB_GUESTS__;

const digits = (s: string) => s.replace(/\D/g, "");

export const telHref = site.phone ? `tel:+${digits(site.phone)}` : "";
export const waNumber = digits(site.whatsapp);

/** Ссылка WhatsApp: номер из CONFIG, текст — готовое сообщение */
export function waHref(text?: string) {
  if (!waNumber) return "";
  return `https://wa.me/${waNumber}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Человекочитаемые названия полей для плашек «ЗАПОЛНИТЬ» */
export const fieldNames: Record<keyof SiteConfig, string> = {
  name: "название",
  city: "город",
  address: "адрес",
  workHours: "часы работы",
  phone: "телефон",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  mapLink: "ссылка на карту",
  services: "услуги и цены",
  team: "команда",
  showGuestPhotos: "согласие гостий",
  showGuestHandles: "аккаунты гостий",
  showStaffFaces: "согласие мастеров",
  showAiReel: "ролик 004",
};
