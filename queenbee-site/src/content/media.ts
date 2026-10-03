import data from "./images.json";
import { CONFIG } from "@/config";

export type ImgName = keyof typeof data;
export interface ImgInfo {
  kind: "guest" | "hair" | "interior" | "check" | "render";
  /** запасной формат для браузеров без WebP */
  ext: "jpg" | "png";
  w: number;
  h: number;
  widths: number[];
  fx: number;
  fy: number;
  caption: string;
  color: string;
}
export const IMAGES = data as unknown as Record<ImgName, ImgInfo>;
export const img = (n: ImgName) => IMAGES[n];

/** Кадры, где виден мастер — нужно отдельное согласие. */
export const STAFF_FRAMES: ImgName[] = ["guest_a_02", "guest_a_03"];

export type Filter = "all" | "makeup" | "hair" | "look";
export const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Все" },
  { id: "makeup", label: "Макияж" },
  { id: "hair", label: "Причёски" },
  { id: "look", label: "Образ" },
];

/** Подпись из manifest.csv -> фильтр и alt (без имён гостий). */
const BY_CAPTION: Record<string, { filter: Exclude<Filter, "all">; alt: string; label: string }> = {
  Макияж: { filter: "makeup", alt: "Макияж в салоне Queen Bee", label: "Макияж" },
  Укладка: { filter: "hair", alt: "Укладка в салоне Queen Bee", label: "Укладка" },
  Волосы: { filter: "hair", alt: "Локоны и волны, салон Queen Bee", label: "Волосы" },
  Образ: { filter: "look", alt: "Готовый образ, салон Queen Bee", label: "Образ" },
};

export interface Work {
  name: ImgName;
  filter: Exclude<Filter, "all">;
  alt: string;
  label: string;
  /** форма маски и размер ячейки в мозаике */
  mask: "arch" | "hex" | "oval" | "rect";
  size: "s" | "m" | "l" | "t";
}

// Порядок и формы мозаики подобраны вручную: крупные кадры 2000 px — крупно,
// кадры из ролика (720 px) — только малым и средним размером.
const LAYOUT: [ImgName, Work["mask"], Work["size"]][] = [
  ["guest_b_03", "arch", "l"],
  ["guest_a_02", "hex", "m"],
  ["guest_c_01", "arch", "t"],
  ["hair_waves_1", "rect", "s"],
  ["guest_a_04", "oval", "m"],
  ["guest_c_02", "hex", "m"],
  ["guest_b_01", "arch", "m"],
  ["guest_a_03", "arch", "l"],
  ["hair_waves_2", "arch", "s"],
  ["guest_c_03", "oval", "m"],
  ["guest_b_04", "rect", "t"],
  ["guest_a_01", "arch", "m"],
  ["hair_waves_3", "hex", "s"],
  ["guest_b_02", "arch", "l"],
];

export const WORKS: Work[] = [
  ...LAYOUT.map(([name, mask, size]) => ({ name, mask, size, ...BY_CAPTION[IMAGES[name].caption] })),
  ...(CONFIG.showAiReel
    ? (["makeup_eyeliner", "makeup_lips", "makeup_prep"] as ImgName[]).map((name) => ({
        name,
        mask: "rect" as const,
        size: "s" as const,
        ...BY_CAPTION.Макияж,
      }))
    : []),
];

/** Интерьеры для ленты «Пространство» (720 px — только карточками в рамке). */
export const INTERIORS: ImgName[] = [
  "lobby_chandelier",
  "reception_desk",
  "lounge_burgundy",
  "lounge_green",
  "nail_lounge",
  "ceiling_leaves",
  "shelves_products",
  "fireplace_wood",
  "gift_boxes_monogram",
];
