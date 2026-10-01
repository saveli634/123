import type images from "@/content/images.generated.json";

export type ImageName = keyof typeof images;

export interface Photo {
  name: ImageName;
  alt: string;
  /** Подпись-ярлык на фото, например «Prado 95 · замена цепи раздатки» */
  tag?: string;
  position?: string;
}

export interface DeptPhone {
  /** Например «Силовой обвес — Александр» */
  label: string;
  display: string;
  tel: string;
}
