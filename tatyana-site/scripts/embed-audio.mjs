// Встраивает песни в однофайловую версию: облегчённые копии (mp3 64 кбит/с, моно — иначе файл
// стал бы больше 30 МБ) кладутся в конец страницы как <script type="application/octet-stream" id="a-song-N">.
// Плеер распаковывает песню только по нажатию «Слушать» (src/lib/audio-url.ts).
// Копии кешируются в node_modules/.cache/audio-lite; без ffmpeg встраиваются обычные 128 кбит/с.
// Использование: node scripts/embed-audio.mjs dist-single/index.html
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const page = process.argv[2];
const SRC = "src/assets/audio";
const CACHE = "node_modules/.cache/audio-lite";
const files = existsSync(SRC) ? readdirSync(SRC).filter((f) => /^song-\d+\.mp3$/.test(f)) : [];
if (!files.length) {
  console.log("песен нет — sait.html без звука");
  process.exit(0);
}

let ffmpeg = true;
try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  ffmpeg = false;
  console.warn("ffmpeg не найден — встраиваю песни без облегчения (файл будет тяжелее)");
}
mkdirSync(CACHE, { recursive: true });

const lite = (f) => {
  const src = join(SRC, f);
  if (!ffmpeg) return src;
  const st = statSync(src);
  const out = join(CACHE, `${f.replace(/\.mp3$/, "")}-${st.size}-${Math.round(st.mtimeMs)}.mp3`);
  if (!existsSync(out))
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", src, "-vn", "-map_metadata", "-1", "-ac", "1", "-codec:a", "libmp3lame", "-b:a", "64k", out]);
  return out;
};

let html = readFileSync(page, "utf8");
html = html.replace(/<script type="application\/octet-stream" id="a-song-\d+">[^<]*<\/script>/g, "");
const tags = files
  .map((f) => `<script type="application/octet-stream" id="a-${f.replace(/\.mp3$/, "")}">${readFileSync(lite(f)).toString("base64")}</script>`)
  .join("\n");
const at = html.lastIndexOf("</body>");
html = at < 0 ? html + tags : html.slice(0, at) + tags + "\n" + html.slice(at);
writeFileSync(page, html);
console.log(`встроено песен: ${files.length}, страница ${(statSync(page).size / 1048576).toFixed(1)} МБ`);
