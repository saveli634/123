/**
 * Однофайловая версия (sait.html): песни лежат в конце файла в <script type="application/octet-stream" id="a-song-N">
 * (их кладёт scripts/embed-audio.mjs), а адрес «inline:song-N» превращается в звук по нажатию — см. src/lib/audio-url.ts.
 */
export const media: Record<string, string> = Object.fromEntries(__INLINE_SONGS__.map((f) => [f, `inline:${f.replace(/\.mp3$/, "")}`]));
