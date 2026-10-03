import { renderToString } from "react-dom/server";
import App from "./App";
import { CONFIG } from "./config";

export function render() {
  return renderToString(<App />);
}

/** Заголовок, описание и JSON-LD BeautySalon — только из заполненных полей CONFIG. */
export function head() {
  const city = CONFIG.city.trim();
  const description = `Queen Bee Boheme Residence — салон красоты${city ? ` в городе ${city}` : ""}: макияж, причёски и укладка, полный beauty-образ.`;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: CONFIG.project,
    alternateName: CONFIG.name,
    description: "Салон красоты: макияж, причёски и укладка, полный beauty-образ.",
    image: "og/og-image.jpg",
  };
  if (CONFIG.phone.trim()) ld.telephone = CONFIG.phone.trim();
  if (CONFIG.city.trim() || CONFIG.address.trim())
    ld.address = { "@type": "PostalAddress", ...(CONFIG.address.trim() && { streetAddress: CONFIG.address.trim() }), ...(city && { addressLocality: city }) };
  if (CONFIG.workHours.trim()) ld.openingHours = CONFIG.workHours.trim();
  if (CONFIG.instagram.trim()) ld.sameAs = [CONFIG.instagram.trim()];
  if (CONFIG.mapLink.trim()) ld.hasMap = CONFIG.mapLink.trim();
  return { description, jsonld: JSON.stringify(ld) };
}
