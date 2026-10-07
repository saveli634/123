/**
 * Адреса сжатых песен (src/assets/audio/song-N.mp3). В сборке для хостинга файлы лежат в папке audio/
 * рядом с index.html; в однофайловой — встраиваются, только если вместе весят не больше 2 МБ
 * (иначе подключается songs-media.none.ts и раздел «Песни» в sait.html скрыт).
 */
const files = import.meta.glob("../assets/audio/song-*.mp3", { eager: true, query: "?url", import: "default" }) as Record<
  string,
  string
>;

export const media: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").pop()!, url]),
);
