import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import pages from "./src/data/pages.json";

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
      .replace(/\s*<meta property="og:image[^>]*>/g, "")
      // все страницы в одном файле: переключение по #/karta (см. src/lib/route.tsx)
      .replace('<html lang="ru">', '<html lang="ru" class="spa">'),
});

/** Какие сжатые песни есть (src/assets/audio/song-N.mp3) */
function audioFiles() {
  const dir = src("./src/assets/audio");
  return existsSync(dir) ? readdirSync(dir).filter((f) => /^song-\d+\.mp3$/.test(f)) : [];
}

export default defineConfig(({ mode }) => {
  const single = mode === "single";
  // sait.html: песни встраиваются в конец файла облегчёнными копиями (scripts/embed-audio.mjs),
  // а плеер достаёт их по нажатию «Слушать» (src/lib/audio-url.ts)
  const inlineSongs = single ? audioFiles() : [];
  return {
    base: "./",
    publicDir: single ? false : "public",
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile(), inlineHead()] : [])],
    define: { __INLINE_SONGS__: JSON.stringify(inlineSongs) },
    resolve: {
      alias: {
        "@/data/songs-media": src(
          !single ? "./src/data/songs-media.ts" : inlineSongs.length ? "./src/data/songs-media.inline.ts" : "./src/data/songs-media.none.ts",
        ),
        "@": src("./src"),
      },
    },
    // Синтаксис скриптов — для Safari 12+ и не самых свежих Android.
    build: {
      target: ["es2017", "chrome70", "edge79", "firefox68", "safari12"],
      rollupOptions: {
        // хостинг: отдельный HTML на каждую страницу (их создаёт scripts/pages.mjs)
        ...(single
          ? {}
          : { input: Object.fromEntries(Object.keys(pages).map((id) => [id, src(id === "home" ? "./index.html" : `./${id}.html`)])) }),
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
