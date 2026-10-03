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

  for (const lang of single ? ["ru"] : ["ru", "en"]) {
    const page = html
      .replace('<html lang="ru">', `<html lang="${lang}">`)
      .replace("<!--head-->", `${head(lang)}\n    ${fonts(lang)}`)
      .replace("<!--app-->", render(lang));
    const file = lang === "ru" ? htmlPath : resolve(outDir, "en.html");
    writeFileSync(file, page);
    console.log(`prerendered ${lang} -> ${file}`);
  }
  rmSync(ssrDir, { recursive: true, force: true });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [outDir, ssrDir] = process.argv.slice(2);
  await prerender(outDir, ssrDir, process.argv.includes("--single"));
}
