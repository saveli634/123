/**
 * Фото Анны (src/assets/photos/anna-*.jpg). В публичный git они не попадают (личные) —
 * если файлов нет, сайт собирается без фото: портрет и картинки просто не показываются.
 */
const files = import.meta.glob("../assets/photos/anna-*.jpg", { eager: true, query: "?url", import: "default" }) as Record<string, string>;
const pick = (name: string): string | null => files[`../assets/photos/anna-${name}.jpg`] ?? null;

export const photos = { portrait: pick("portrait"), kuvshin: pick("kuvshin"), sad: pick("sad") };
