// Песни Татьяны: берёт файлы из brief/content/pesni (mp3, m4a, wav, ogg, aac, flac),
// сжимает в mp3 ~128 кбит/с (нужен ffmpeg) в src/assets/audio/song-N.mp3 (имена без кириллицы)
// и пишет src/data/songs.generated.ts: название и текст из .txt с тем же именем
// (первая строка — название, дальше — строки песни; пустая строка — новый куплет).
// Использование: npm run songs  (или node scripts/songs.mjs <папка-с-песнями>)
import { readdirSync, readFileSync, writeFileSync, existsSync, rmSync, statSync, mkdirSync } from "node:fs";
import { join, extname, basename } from "node:path";
import { execFileSync } from "node:child_process";

const SRC = process.argv[2] || "brief/content/pesni";
const OUT = "src/assets/audio";
const AUDIO = new Set([".mp3", ".m4a", ".wav", ".ogg", ".aac", ".flac"]);

mkdirSync(OUT, { recursive: true });
const files = existsSync(SRC)
  ? readdirSync(SRC)
      .filter((f) => AUDIO.has(extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "ru", { numeric: true }))
  : [];

// старые сжатые файлы убираем, чтобы в сборку не попало лишнее
for (const f of readdirSync(OUT)) if (/^song-\d+\.mp3$/.test(f)) rmSync(join(OUT, f));

const songs = files.map((f, i) => {
  const id = `song-${i + 1}`;
  const file = `${id}.mp3`;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-i", join(SRC, f), "-vn", "-map_metadata", "-1", "-codec:a", "libmp3lame", "-b:a", "128k", "-ar", "44100", join(OUT, file)]);
  const duration = Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nk=1:nw=1", join(OUT, file)]).toString().trim(),
  );
  const txt = join(SRC, basename(f, extname(f)) + ".txt");
  let title = basename(f, extname(f));
  let lyrics = null;
  if (existsSync(txt)) {
    const lines = readFileSync(txt, "utf8").replace(/\r/g, "").split("\n");
    title = (lines.shift() || title).trim();
    const stanzas = [[]];
    for (const raw of lines) {
      const l = raw.trim();
      if (!l) {
        if (stanzas[stanzas.length - 1].length) stanzas.push([]);
      } else stanzas[stanzas.length - 1].push(l);
    }
    lyrics = stanzas.filter((s) => s.length);
    if (!lyrics.length) lyrics = null;
  }
  const kb = statSync(join(OUT, file)).size / 1024;
  console.log(`${f} → ${file} (${kb.toFixed(0)} КБ, ${duration.toFixed(1)} с) «${title}»${lyrics ? `, текст: ${lyrics.flat().length} строк` : ""}`);
  return { id, file, title, duration: Math.round(duration * 10) / 10, lyrics, source: f };
});

writeFileSync(
  "src/data/songs.generated.ts",
  "// Сгенерировано scripts/songs.mjs из brief/content/pesni — не редактировать вручную.\n" +
    "export interface Song { id: string; file: string; title: string; duration: number; lyrics: string[][] | null; source: string }\n" +
    `export const songs: Song[] = ${JSON.stringify(songs, null, 2)};\n`,
);
const total = songs.reduce((s, x) => s + statSync(join(OUT, x.file)).size, 0);
console.log(songs.length ? `песен: ${songs.length}, всего ${(total / 1024 / 1024).toFixed(2)} МБ` : "песен нет — раздел «Песни» на сайте скрыт");
