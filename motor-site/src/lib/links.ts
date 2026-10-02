import { field } from "./env";
import { SITE } from "@/content/copy";

/** Только цифры с ведущим +: «+7 700 000 00 00» → «+77000000000». */
export function digits(phone: string) {
  const d = phone.replace(/[^\d+]/g, "");
  return d.startsWith("8") && d.length === 11 ? `+7${d.slice(1)}` : d;
}

export function telHref() {
  const p = field("phone");
  return p ? `tel:${digits(p)}` : "";
}

export function waHref(text = "") {
  const p = digits(field("whatsapp")).replace(/^\+/, "");
  if (!p) return "";
  return `https://wa.me/${p}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function siteName() {
  return field("name") || SITE.demoName;
}

/** Полный адрес для показа: «Алматы, <адрес>». */
export function fullAddress() {
  const a = field("address");
  return a ? `${SITE.city}, ${a}` : "";
}
