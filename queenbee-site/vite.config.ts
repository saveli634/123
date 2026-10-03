import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** В однофайловой версии внешних файлов нет: убираем preload портрета, favicon и og встраиваем/убираем. */
const singleHtml = (): Plugin => ({
  name: "single-html",
  transformIndexHtml: (html) =>
    html
      .replace(/<link\s+rel="preload"[\s\S]*?\/>/, "")
      .replace(/\s*<meta property="og:image[^>]*>/g, "")
      .replace(
        'href="./favicon.svg"',
        `href="data:image/svg+xml,${encodeURIComponent(readFileSync(src("./public/favicon.svg"), "utf8"))}"`,
      ),
});

export default defineConfig(({ mode }) => {
  const single = mode === "single";
  return {
    base: "./",
    publicDir: single ? false : "public",
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile(), singleHtml()] : [])],
    resolve: {
      alias: {
        "@/content/imgsrc": src(single ? "./src/content/imgsrc/single.ts" : "./src/content/imgsrc/web.ts"),
        "@": src("./src"),
      },
    },
    // Скрипты — в синтаксисе, который понимают и не самые свежие браузеры (Safari 12+).
    build: {
      target: ["es2017", "chrome70", "edge79", "firefox68", "safari12"],
      chunkSizeWarningLimit: 900,
      ...(single ? { outDir: "dist-single", assetsInlineLimit: Number.MAX_SAFE_INTEGER } : {}),
    },
  };
});
