import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { site } from "./src/site.config.ts";

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Название ({{BRAND}}) в <title> и мета-тегах; фавикон — первая буква её каллиграфии.
 * В однофайловой версии фавикон встраивается в HTML, preload героя убирается (внешних файлов нет).
 */
const brandHtml = (single: boolean): Plugin => ({
  name: "brand-html",
  transformIndexHtml(html) {
    const key = site.brand.trim().toLowerCase();
    const favFile = existsSync(src(`./public/favicon-${key}.svg`)) ? `favicon-${key}.svg` : "favicon-lash.svg";
    const fav = single
      ? `data:image/svg+xml,${encodeURIComponent(readFileSync(src(`./public/${favFile}`), "utf8"))}`
      : `./${favFile}`;
    let out = html.replaceAll("%BRAND%", site.brand).replace("%FAVICON%", fav);
    if (single) out = out.replace(/<link\s+rel="preload"[\s\S]*?\/>/, "");
    return out;
  },
});

/**
 * Обычная сборка: предзагрузка шрифтов первого экрана (кириллица Cormorant прямой и курсив, Manrope),
 * чтобы заголовок сразу был нужным шрифтом и строки не перескакивали.
 */
const preloadFonts = (): Plugin => ({
  name: "preload-fonts",
  transformIndexHtml: {
    order: "post",
    handler(html, ctx) {
      if (!ctx.bundle) return html;
      const want = [/cormorant-garamond-cyrillic-wght-normal/, /cormorant-garamond-cyrillic-wght-italic/, /manrope-cyrillic-wght-normal/];
      const links = Object.keys(ctx.bundle)
        .filter((f) => f.endsWith(".woff2") && want.some((r) => r.test(f)))
        .map((f) => `<link rel="preload" href="./${f}" as="font" type="font/woff2" crossorigin />`)
        .join("\n    ");
      return html.replace("</title>", `</title>\n    ${links}`);
    },
  },
});

export default defineConfig(({ mode }) => {
  const single = mode === "single";
  return {
    base: "./",
    publicDir: single ? false : "public",
    plugins: [react(), tailwindcss(), brandHtml(single), ...(single ? [viteSingleFile()] : [preloadFonts()])],
    resolve: {
      alias: {
        "@/media-src": src(single ? "./src/media-src/single.ts" : "./src/media-src/web.ts"),
        "@": src("./src"),
      },
    },
    // Синтаксис скриптов — для Safari 12+ и не самых свежих Chrome / Android
    build: {
      target: ["es2017", "chrome70", "edge79", "firefox68", "safari12"],
      ...(single ? { outDir: "dist-single", assetsInlineLimit: Number.MAX_SAFE_INTEGER } : {}),
    },
  };
});
