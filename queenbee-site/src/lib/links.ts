import { CONFIG } from "@/config";

/**
 * Куда ведут кнопки. Пустые поля CONFIG не дают «мёртвых» ссылок:
 * «Позвонить» без телефона — к контактам, WhatsApp без номера — к форме записи,
 * «Смотреть работы» без Instagram — к «Стене работ».
 */
const digits = (s: string) => s.replace(/\D/g, "");

export const hasPhone = !!CONFIG.phone.trim();
export const hasWhatsapp = !!digits(CONFIG.whatsapp);
export const hasInstagram = !!CONFIG.instagram.trim();

export const callHref = hasPhone ? `tel:+${digits(CONFIG.phone)}` : "#contacts";

export function waHref(text: string) {
  return hasWhatsapp ? `https://wa.me/${digits(CONFIG.whatsapp)}?text=${encodeURIComponent(text)}` : "#booking";
}

/** Для формы: без номера WhatsApp откроет выбор чата с готовым текстом. */
export function waSend(text: string) {
  return `https://wa.me/${hasWhatsapp ? digits(CONFIG.whatsapp) : ""}?text=${encodeURIComponent(text)}`;
}

export const worksHref = hasInstagram ? CONFIG.instagram : "#works";

export const GREETING = "Здравствуйте! Хочу записаться в Queen Bee.";
export const PRICE_TEXT = "Здравствуйте! Подскажите, пожалуйста, цену на услугу в Queen Bee.";

export const isExternal = (href: string) => /^https?:/.test(href);
export const extProps = (href: string) => (isExternal(href) ? { target: "_blank", rel: "noopener" } : {});
