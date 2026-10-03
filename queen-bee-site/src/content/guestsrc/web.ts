/** Версия для хостинга: размеры показываемых кадров гостий (пусто, пока showGuestPhotos=false). */
import meta from "virtual:qb-guests";

export const guestMeta: Record<string, { w: number; h: number; widths: number[]; color: string }> = meta;
