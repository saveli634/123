import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { typographPlugin } from "./scripts/typograph-plugin.ts";
import { htmlPlugin } from "./scripts/html-plugin.ts";

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** В однофайловой версии внешних файлов нет: preload убираем, favicon встраиваем. */
const singleHtml = (): Plugin => ({
  name: "single-html",
  transformIndexHtml: (html) =>
    html
      .replace(/<link\s+rel="preload"[^>]*>\s*/g, "")
      .replace(/<meta\s+property="og:image[^>]*>\s*/g, "")
      .replace(
        'href="./favicon.svg"',
        `href="data:image/svg+xml,${encodeURIComponent(readFileSync(src("./public/favicon.svg"), "utf8"))}"`,
      ),
});

export default defineConfig(({ mode }) => {
  const single = mode === "single";
  const release = process.env.SITE_RELEASE === "1";
  return {
    base: "./",
    publicDir: single ? false : "public",
    define: {
      __RELEASE__: JSON.stringify(release),
      __SINGLE__: JSON.stringify(single),
    },
    plugins: [typographPlugin(), react(), tailwindcss(), htmlPlugin({ single }), ...(single ? [viteSingleFile(), singleHtml()] : [])],
    resolve: {
      alias: {
        "@/content/imgsrc": src(single ? "./src/content/imgsrc/single.ts" : "./src/content/imgsrc/web.ts"),
        "@": src("./src"),
      },
    },
    // Синтаксис скриптов — для не самых свежих браузеров (Safari 12+).
    build: {
      target: ["es2017", "chrome70", "edge79", "firefox68", "safari12"],
      cssTarget: ["chrome70", "edge79", "firefox68", "safari12"],
      ...(single ? { outDir: "dist-single", assetsInlineLimit: Number.MAX_SAFE_INTEGER } : {}),
    },
  };
});
