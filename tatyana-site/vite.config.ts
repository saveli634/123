import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** В однофайловой версии внешних файлов нет: favicon встраиваем, og-картинку убираем. */
const inlineHead = (): Plugin => ({
  name: "inline-head",
  transformIndexHtml: (html) =>
    html
      .replace(
        'href="./favicon.svg"',
        `href="data:image/svg+xml,${encodeURIComponent(readFileSync(src("./public/favicon.svg"), "utf8"))}"`,
      )
      .replace(/\s*<meta property="og:image[^>]*>/g, ""),
});

/** Сколько весят сжатые песни (для решения, встраивать ли их в sait.html) */
function audioBytes() {
  const dir = src("./src/assets/audio");
  if (!existsSync(dir)) return 0;
  return readdirSync(dir)
    .filter((f) => /^song-\d+\.mp3$/.test(f))
    .reduce((s, f) => s + statSync(`${dir}/${f}`).size, 0);
}
const EMBED_LIMIT = 2 * 1024 * 1024;

export default defineConfig(({ mode }) => {
  const single = mode === "single";
  const embedAudio = !single || audioBytes() <= EMBED_LIMIT;
  return {
    base: "./",
    publicDir: single ? false : "public",
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile(), inlineHead()] : [])],
    resolve: {
      alias: {
        "@/data/songs-media": src(embedAudio ? "./src/data/songs-media.ts" : "./src/data/songs-media.none.ts"),
        "@": src("./src"),
      },
    },
    // Синтаксис скриптов — для Safari 12+ и не самых свежих Android.
    build: {
      target: ["es2017", "chrome70", "edge79", "firefox68", "safari12"],
      rollupOptions: {
        output: {
          // песни — в папку audio/ рядом с index.html, имена латиницей
          assetFileNames: (info: { name?: string; names?: string[] }) =>
            (info.names?.[0] ?? info.name ?? "").endsWith(".mp3") ? "audio/[name]-[hash][extname]" : "assets/[name]-[hash][extname]",
        },
      },
      ...(single ? { outDir: "dist-single", assetsInlineLimit: Number.MAX_SAFE_INTEGER } : {}),
    },
  };
});
