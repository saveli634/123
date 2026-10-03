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
    const want = [
      "playfair-display-latin-600-normal",
      "playfair-display-latin-600-italic",
      lang === "ru" ? "manrope-cyrillic-400-normal" : "manrope-latin-400-normal",
      lang === "ru" ? "manrope-cyrillic-600-normal" : "manrope-latin-600-normal",
    ];
    return want
      .map((w) => files.find((f) => f.startsWith(w) && f.endsWith(".woff2")))
      .filter(Boolean)
      .map((f) => `<link rel="preload" href="./assets/${f}" as="font" type="font/woff2" crossorigin />`)
      .join("\n    ");
  };

  // версия для хостинга: стили встраиваем прямо в <head> (минус блокирующий запрос — быстрее первый
  // экран на мобильном), а картинку первого экрана (горизонт глобуса) просим грузить сразу
  let page0 = html;
  let lcpPreload = "";
  let inlined = null;
  if (!single) {
    const dir = join(outDir, "assets");
    const files = existsSync(dir) ? readdirSync(dir) : [];
    page0 = page0.replace(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+\.css)"[^>]*>/, (m, file) => {
      inlined = join(dir, file);
      const css = readFileSync(inlined, "utf8").replace(/url\(\.\//g, "url(./assets/");
      return `<style>${css}</style>`;
    });
    const wide = files.find((f) => /^globe-0-[\w-]+\.webp$/.test(f));
    const tall = files.find((f) => /^globe-0m-[\w-]+\.webp$/.test(f));
    lcpPreload = [
      wide && `<link rel="preload" as="image" href="./assets/${wide}" media="(min-aspect-ratio: 9/10)" fetchpriority="high" />`,
      tall && `<link rel="preload" as="image" href="./assets/${tall}" media="(max-aspect-ratio: 9/10)" fetchpriority="high" />`,
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
