import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

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

export default defineConfig(({ mode }) => {
  const single = mode === "single";
  return {
    base: "./",
    publicDir: single ? false : "public",
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile(), inlineHead()] : [])],
    resolve: { alias: { "@": src("./src") } },
    // Синтаксис скриптов — для Safari 12+ и не самых свежих Android.
    build: {
      target: ["es2017", "chrome70", "edge79", "firefox68", "safari12"],
      ...(single ? { outDir: "dist-single", assetsInlineLimit: Number.MAX_SAFE_INTEGER } : {}),
    },
  };
});
