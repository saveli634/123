import { CONFIG } from "@/config";

export const digits = (s: string) => s.replace(/\D+/g, "");

/** tel:+7… из CONFIG.phone (пусто → null: кнопки нет, в демо — плашка). */
export function telHref() {
  const d = digits(CONFIG.phone);
  return d ? `tel:+${d}` : null;
}

/** https://wa.me/<номер>?text=… из CONFIG.whatsapp. */
export function waHref(text?: string) {
  const d = digits(CONFIG.whatsapp);
  if (!d) return null;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export const instagramHref = () => CONFIG.instagram.trim() || null;
export const mapHref = () => CONFIG.mapLink.trim() || null;
export const reelHref = (id?: string) => (id && CONFIG.reels[id]?.trim()) || null;
