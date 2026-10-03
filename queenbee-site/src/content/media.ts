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

/** Подпись из manifest.csv -> фильтр и alt (без имён гостей). */
const BY_CAPTION: Record<string, { filter: Exclude<Filter, "all">; alt: string; label: string }> = {
  Макияж: { filter: "makeup", alt: "Макияж в салоне Queen Bee", label: "Макияж" },
  Укладка: { filter: "hair", alt: "Укладка в салоне Queen Bee", label: "Укладка" },
  Волосы: { filter: "hair", alt: "Локоны и волны, салон Queen Bee", label: "Волосы" },
  Образ: { filter: "look", alt: "Готовый образ, салон Queen Bee", label: "Образ" },
};

/** Один кадр для просмотра на весь экран. */
export interface Work {
  name: ImgName;
  alt: string;
  label: string;
}
const work = (name: ImgName): Work => ({ name, alt: BY_CAPTION[IMAGES[name].caption].alt, label: BY_CAPTION[IMAGES[name].caption].label });

/**
 * «Стена работ» — по образам, а не россыпью: у салона в материалах три гостьи и кадры волн,
 * поэтому каждый образ — одна карточка: главный кадр и рядом остальные кадры того же образа.
 * Повтор лица читается как процесс работы, а не как одна и та же модель по всей странице.
 */
export interface Look {
  id: string;
  /** подпись — только из подписей manifest.csv */
  label: string;
  tags: Exclude<Filter, "all">[];
  frames: Work[];
}

const staff = CONFIG.staffConsentConfirmed;
export const LOOKS: Look[] = [
  {
    id: "a",
    label: "Макияж · укладка",
    tags: ["makeup", "hair", "look"],
    frames: (staff
      ? (["guest_a_02", "guest_a_03", "guest_a_04", "guest_a_01"] as ImgName[])
      : (["guest_a_04", "guest_a_02", "guest_a_03", "guest_a_01"] as ImgName[])
    ).map(work),
  },
  { id: "b", label: "Укладка · локоны", tags: ["hair", "look"], frames: (["guest_b_02", "guest_b_03", "guest_b_04", "guest_b_01"] as ImgName[]).map(work) },
  { id: "c", label: "Образ", tags: ["look"], frames: (["guest_c_03", "guest_c_01", "guest_c_02"] as ImgName[]).map(work) },
  { id: "w", label: "Волосы · волны", tags: ["hair"], frames: (["hair_waves_2", "hair_waves_1", "hair_waves_3"] as ImgName[]).map(work) },
  ...(CONFIG.showAiReel
    ? [{ id: "m", label: "Макияж крупно", tags: ["makeup"] as Exclude<Filter, "all">[], frames: (["makeup_eyeliner", "makeup_lips", "makeup_prep"] as ImgName[]).map(work) }]
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
