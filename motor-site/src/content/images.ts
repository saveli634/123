import manifest from "./images.generated.json";

export type ImageName = keyof typeof manifest;

export interface ImageMeta {
  w: number;
  h: number;
  widths: number[];
  color: string;
}

export const IMAGES = manifest as unknown as Record<ImageName, ImageMeta>;
