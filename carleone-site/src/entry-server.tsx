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
  // абсолютные адреса — когда известен домен (CONFIG.siteUrl), иначе относительные
  const site = CONFIG.siteUrl.trim().replace(/\/?$/, "/");
  const abs = (p: string) => (CONFIG.siteUrl.trim() ? new URL(p, site).href : `./${p}`);
  const ruUrl = CONFIG.siteUrl.trim() ? site : "./";
  const enUrl = abs("en.html");
  const title = pageTitle(lang);
  const city = CONFIG.city.trim();
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: CONFIG.name,
    description: DICT.ru.meta.description,
    image: abs("og.jpg"),
    ...(CONFIG.siteUrl.trim() ? { url: site } : {}),
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
    `<meta property="og:image" content="${abs("og.jpg")}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...(CONFIG.siteUrl.trim()
      ? [`<link rel="canonical" href="${lang === "en" ? enUrl : ruUrl}" />`, `<meta property="og:url" content="${lang === "en" ? enUrl : ruUrl}" />`]
      : [`<!-- После подключения домена впишите CONFIG.siteUrl: canonical, hreflang и og:image станут абсолютными -->`]),
    `<link rel="alternate" hreflang="ru" href="${ruUrl}" />`,
    `<link rel="alternate" hreflang="en" href="${enUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${ruUrl}" />`,
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`,
  ].join("\n    ");
}
