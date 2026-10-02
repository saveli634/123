import type { Plugin } from "vite";
import { readFileSync } from "node:fs";
import { CONFIG } from "../src/config.ts";
import { SITE } from "../src/content/copy.ts";

/**
 * SEO в <head>: title и description с «Алматы» и «капитальный ремонт 1VD‑FTV», Open Graph
 * (картинка — рендер сцены), JSON-LD AutoRepair ТОЛЬКО из заполненных полей CONFIG.
 * Для хостинга — preload героического рендера и основных шрифтов.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const val = (k: keyof typeof CONFIG) => String(CONFIG[k] ?? "").trim();
const digits = (p: string) => {
  const d = p.replace(/[^\d+]/g, "");
  return d.startsWith("8") && d.length === 11 ? `+7${d.slice(1)}` : d;
};

function jsonLd() {
  const ld: Record<string, unknown> = { "@context": "https://schema.org", "@type": "AutoRepair" };
  if (val("name")) ld.name = val("name");
  if (val("phone")) ld.telephone = digits(val("phone"));
  if (val("address")) ld.address = { "@type": "PostalAddress", streetAddress: val("address"), addressLocality: SITE.city, addressCountry: "KZ" };
  if (val("workHours")) ld.openingHours = val("workHours");
  if (val("instagram")) ld.sameAs = [val("instagram")];
  if (val("mapLink")) ld.hasMap = val("mapLink");
  // Без названия и телефона разметка бесполезна — не выводим (демо-режим)
  if (!ld.name && !ld.telephone) return "";
  ld.image = "og/og.jpg";
  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

export function htmlPlugin(opts: { single: boolean }): Plugin {
  const name = val("name") || SITE.demoName;
  const title = `${SITE.title} — ${name}`.replace(/ /g, " ");
  const description = SITE.description.replace(/ /g, " ");
  const seo = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="ru_RU" />`,
    `<meta property="og:site_name" content="${esc(name)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    // После подключения домена указать абсолютный адрес картинки и <link rel="canonical">
    `<meta property="og:image" content="./og/og.jpg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    jsonLd(),
  ]
    .filter(Boolean)
    .join("\n    ");

  return {
    name: "site-html",
    transformIndexHtml: {
      order: "post",
      handler(html, ctx) {
        let out = html.replace("<!--seo-->", seo);
        if (opts.single || !ctx.bundle) return out.replace("<!--preload-->", "");
        // preload: рендер мотора первого экрана и главные шрифты (заголовки, текст)
        const manifest = JSON.parse(readFileSync(new URL("../src/content/images.generated.json", import.meta.url), "utf8"));
        const hero = manifest["render-0"];
        const links: string[] = [];
        if (hero) {
          const set = hero.widths.map((w: number) => `./img/render-0-${w}.webp ${w}w`).join(", ");
          links.push(`<link rel="preload" as="image" type="image/webp" imagesrcset="${set}" imagesizes="(min-width: 1024px) 62vw, 100vw" fetchpriority="high" />`);
        }
        // Шрифты первого экрана: заголовок (Oswald 700), кнопки (Oswald 600), подписи и модели (Manrope 400/600)
        const want = ["oswald-cyrillic-700", "oswald-latin-700", "oswald-cyrillic-600", "oswald-latin-600", "manrope-cyrillic-400", "manrope-cyrillic-600", "manrope-latin-600"];
        for (const f of Object.values(ctx.bundle)) {
          if (f.type !== "asset") continue;
          const orig = (f.originalFileNames ?? []).join(" ") + " " + f.fileName;
          if (want.some((w) => orig.includes(w)) && f.fileName.endsWith(".woff2")) {
            links.push(`<link rel="preload" as="font" type="font/woff2" href="./${f.fileName}" crossorigin />`);
          }
        }
        return out.replace("<!--preload-->", links.join("\n    "));
      },
    },
  };
}
