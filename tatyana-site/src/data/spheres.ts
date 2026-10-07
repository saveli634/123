import { pageHref, type PageId } from "./pages";

/**
 * «Музыка небесных сфер» (ТЗ, «Как соединить три сферы»): карта — небо, число — его ритм,
 * слово и песня — голос. Четыре «планеты» на общей орбите: меню на первом экране,
 * значки страниц и разделов, орбиты на фоне. У каждой сферы своя страница.
 */
export type SphereId = "karta" | "chislo" | "slovo" | "pesnya";

export interface Sphere {
  id: SphereId;
  label: string;
  page: PageId;
  href: string;
  /** цвет планеты */
  color: string;
}

const make = (id: SphereId, label: string, page: PageId, color: string): Sphere => ({ id, label, page, href: pageHref(page), color });

export const SPHERES: Sphere[] = [
  make("karta", "Карта", "karta", "#E6CF9A"),
  make("chislo", "Число", "chislo", "#A78BFA"),
  make("slovo", "Слово", "stihi", "#EDE4FF"),
  make("pesnya", "Песня", "pesni", "#9B6BFF"),
];

export const sphere = (id: SphereId) => SPHERES.find((s) => s.id === id)!;
export const sphereOfPage = (p: PageId) => SPHERES.find((s) => s.page === p);
