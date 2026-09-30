import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** В однофайловой версии внешних файлов нет: убираем preload героя, favicon встраиваем. */
const dropPreload = (): Plugin => ({
  name: "drop-hero-preload",
  transformIndexHtml: (html) =>
    html
      .replace(/<link\s+rel="preload"[\s\S]*?\/>/, "")
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
    plugins: [react(), tailwindcss(), ...(single ? [viteSingleFile(), dropPreload()] : [])],
    resolve: {
      alias: {
        "@/content/imgsrc": src(single ? "./src/content/imgsrc/single.ts" : "./src/content/imgsrc/web.ts"),
        "@": src("./src"),
      },
    },
    // Скрипты — в синтаксисе, который понимают и не самые свежие браузеры.
    build: {
      target: ["es2017", "chrome70", "edge79", "firefox68", "safari12"],
      ...(single ? { outDir: "dist-single", assetsInlineLimit: Number.MAX_SAFE_INTEGER } : {}),
    },
  };
});
