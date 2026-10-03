import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./App";
import { DICT, type Lang } from "./content/i18n";
import { pageTitle } from "./lib/lang";
import { CONFIG } from "./config";
import { digits } from "./lib/links";

/** HTML страницы для пререндера: текст виден без скриптов. */
export function render(lang: Lang) {
  return renderToString(
    <StrictMode>
      <App lang={lang} />
    </StrictMode>,
  );
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** <title>, описание, Open Graph, hreflang и JSON-LD AutoRepair — только из заполненных полей CONFIG. */
export function head(lang: Lang) {
  const t = DICT[lang].meta;
  const title = pageTitle(lang);
  const city = CONFIG.city.trim();
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: CONFIG.name,
    description: DICT.ru.meta.description,
    image: "og.jpg",
    areaServed: city || "KZ",
    address: {
      "@type": "PostalAddress",
      addressCountry: "KZ",
      ...(city ? { addressLocality: city } : {}),
      ...(CONFIG.address.trim() ? { streetAddress: CONFIG.address.trim() } : {}),
    },
    makesOffer: DICT.ru.services.items.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.title },
    })),
  };
  if (CONFIG.phone.trim()) ld.telephone = `+${digits(CONFIG.phone)}`;
  if (CONFIG.instagram.trim()) ld.sameAs = [CONFIG.instagram.trim()];
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(t.description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(CONFIG.name)}" />`,
    `<meta property="og:locale" content="${t.locale}" />`,
    `<meta property="og:title" content="${esc(t.ogTitle)}" />`,
    `<meta property="og:description" content="${esc(t.description)}" />`,
    `<meta property="og:image" content="og.jpg" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<!-- После подключения домена: абсолютные адреса в canonical, hreflang и og:image -->`,
    `<link rel="alternate" hreflang="ru" href="./" />`,
    `<link rel="alternate" hreflang="en" href="./en.html" />`,
    `<link rel="alternate" hreflang="x-default" href="./" />`,
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
  ].join("\n    ");
}
