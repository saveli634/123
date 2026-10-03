import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { typographSource } from "./scripts/typograph.mjs";
import { CONFIG } from "./src/config.ts";

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/** Неразрывные пробелы и тире — прямо при сборке, во всех текстах из src/content. */
const typograph = (): Plugin => ({
  name: "carleone-typograph",
  enforce: "pre",
  transform(code, id) {
    if (/[\\/]src[\\/]content[\\/][^\\/]+\.ts$/.test(id)) return { code: typographSource(code), map: null };
    return null;
  },
});

/** Однофайловая версия: значок вкладки встраиваем, внешних файлов нет. */
const singleHtml = (): Plugin => ({
  name: "carleone-single-html",
  transformIndexHtml: (html) =>
    html.replace(
      'href="./favicon.svg"',
      `href="data:image/svg+xml,${encodeURIComponent(readFileSync(src("./public/favicon.svg"), "utf8"))}"`,
    ),
});

/** build:release падает, пока не заполнены обязательные поля CONFIG. */
function checkRelease() {
  const missing: string[] = [];
  if (!CONFIG.city.trim()) missing.push("city");
  if (!CONFIG.phone.trim() && !CONFIG.whatsapp.trim()) missing.push("phone или whatsapp");
  if (!CONFIG.instagram.trim()) missing.push("instagram");
  if (missing.length) {
    throw new Error(
      `\n\nbuild:release остановлен: в src/config.ts не заполнены обязательные поля: ${missing.join(", ")}.\n` +
        `Заполните их или соберите демо-версию: npm run build\n`,
    );
  }
}

export default defineConfig(({ mode }) => {
  const single = mode.includes("single");
  const release = mode.includes("release");
  if (release) checkRelease();
  return {
    base: "./",
    publicDir: single ? false : "public",
    define: { __DEMO__: JSON.stringify(!release) },
    plugins: [typograph(), react(), tailwindcss(), ...(single ? [viteSingleFile(), singleHtml()] : [])],
    resolve: {
      alias: {
        "@/imgsrc": src(single ? "./src/imgsrc/single.ts" : "./src/imgsrc/web.ts"),
        "@": src("./src"),
      },
    },
    // Скрипты — в синтаксисе, который понимают и не самые свежие браузеры (Safari 12+).
    build: {
      target: ["es2017", "chrome70", "edge79", "firefox68", "safari12"],
      outDir: single ? "dist-single" : "dist",
      emptyOutDir: true,
      chunkSizeWarningLimit: 900,
      ...(single ? { assetsInlineLimit: Number.MAX_SAFE_INTEGER } : {}),
    },
  };
});
