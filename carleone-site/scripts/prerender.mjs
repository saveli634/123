// Пререндер: вставляет готовую разметку страницы в собранный index.html — текст виден без скриптов.
// Для хостинга — две страницы: index.html (RU) и en.html (EN) с hreflang; для однофайловой — только RU.
// Использование: node scripts/prerender.mjs <папка-сборки> <папка-ssr> [--single]
import { readFileSync, writeFileSync, rmSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

export async function prerender(outDir, ssrDir, single) {
  const htmlPath = resolve(outDir, "index.html");
  const { render, head } = await import(pathToFileURL(resolve(ssrDir, "entry-server.js")).href + `?t=${Date.now()}`);
  const html = readFileSync(htmlPath, "utf8");
  if (!html.includes("<!--app-->") || !html.includes("<!--head-->"))
    throw new Error("prerender: placeholders not found");

  // предзагрузка шрифтов первого экрана (только версия для хостинга)
  const fonts = (lang) => {
    if (single) return "";
    const dir = join(outDir, "assets");
    if (!existsSync(dir)) return "";
    const files = readdirSync(dir);
    // заголовок первого экрана — Playfair (кириллица для RU), подписи — Manrope; «CARLEONE SERVICE»
    // в шапке и на первом экране — латиница Manrope 600
    const want =
      lang === "ru"
        ? [
            "playfair-display-cyrillic-600-normal",
            "playfair-display-cyrillic-600-italic",
            "manrope-cyrillic-400-normal",
            "manrope-cyrillic-600-normal",
            "manrope-latin-600-normal",
          ]
        : [
            "playfair-display-latin-600-normal",
            "playfair-display-latin-600-italic",
            "manrope-latin-400-normal",
            "manrope-latin-600-normal",
          ];
    return want
      .map((w) => files.find((f) => f.startsWith(w) && f.endsWith(".woff2")))
      .filter(Boolean)
      .map((f) => `<link rel="preload" href="./assets/${f}" as="font" type="font/woff2" crossorigin />`)
      .join("\n    ");
  };

  // версия для хостинга: стили встраиваем прямо в <head> (минус блокирующий запрос — быстрее первый
  // экран на мобильном), а кадр первого экрана просим грузить сразу
  let page0 = html;
  let lcpPreload = "";
  let inlined = null;
  if (!single) {
    const dir = join(outDir, "assets");
    page0 = page0.replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+\.css)"[^>]*>/, (m, file) => {
      inlined = join(dir, file);
      const css = readFileSync(inlined, "utf8").replace(/url\(\.\//g, "url(./assets/");
      return `<style>${css}</style>`;
    });
    // кадр первого экрана (гидроблок АКПП) — тот же srcset, что у <img> в Hero
    const meta = JSON.parse(readFileSync(resolve("src/generated/frames.json"), "utf8")).valve_body_hand;
    const set = meta.widths.map((w) => `./frames/valve_body_hand-${w}.webp ${w}w`).join(", ");
    lcpPreload = [
      `<link rel="preload" as="image" type="image/webp" imagesrcset="${set}" imagesizes="(max-width: 1023px) 100vw, 36vw" fetchpriority="high" />`,
    ]
      .filter(Boolean)
      .join("\n    ");
  }

  for (const lang of single ? ["ru"] : ["ru", "en"]) {
    const page = page0
      .replace('<html lang="ru">', `<html lang="${lang}">`)
      .replace("<!--head-->", `${head(lang)}\n    ${lcpPreload}\n    ${fonts(lang)}`)
      .replace("<!--app-->", render(lang));
    const file = lang === "ru" ? htmlPath : resolve(outDir, "en.html");
    writeFileSync(file, page);
    console.log(`prerendered ${lang} -> ${file}`);
  }
  if (inlined) rmSync(inlined); // стили уже внутри HTML
  rmSync(ssrDir, { recursive: true, force: true });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [outDir, ssrDir] = process.argv.slice(2);
  await prerender(outDir, ssrDir, process.argv.includes("--single"));
}
