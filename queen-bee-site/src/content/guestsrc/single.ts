/** Однофайловая версия: показываемые кадры гостий встроены в CSS (пусто, пока showGuestPhotos=false). */
import "virtual:qb-guests.css";
import meta from "virtual:qb-guests";

export const guestMeta: Record<string, { w: number; h: number; widths: number[]; color: string }> = meta;
