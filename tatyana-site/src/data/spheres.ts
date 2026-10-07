import { hasSongs } from "./songs";

/**
 * «Музыка небесных сфер» (ТЗ, «Как соединить три сферы»): карта — небо, число — его ритм,
 * слово и песня — голос. Четыре «планеты» на общей орбите: меню на первом экране,
 * навигация сверху, значки разделов и орбиты на фоне.
 */
export type SphereId = "karta" | "chislo" | "slovo" | "pesnya";

export interface Sphere {
  id: SphereId;
  label: string;
  href: string;
  /** цвет планеты */
  color: string;
}

export const SPHERES: Sphere[] = [
  { id: "karta", label: "Карта", href: "#nebo", color: "#E6CF9A" },
  { id: "chislo", label: "Число", href: "#chislo", color: "#A78BFA" },
  { id: "slovo", label: "Слово", href: "#stihi", color: "#EDE4FF" },
  // пока песен нет — «Песня» ведёт к подарку, где песня упоминается
  { id: "pesnya", label: "Песня", href: hasSongs ? "#pesni" : "#podarok", color: "#9B6BFF" },
];

export const sphere = (id: SphereId) => SPHERES.find((s) => s.id === id)!;
