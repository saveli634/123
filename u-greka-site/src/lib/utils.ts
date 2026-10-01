import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NBSP = " ";
const SHORT_WORDS =
  /(^|[\s(«])(в|во|и|с|со|к|ко|о|об|у|а|но|на|не|ни|по|за|до|от|из|для|без|при|под|над)\s/giu;

/** Русская типографика: неразрывный пробел после коротких слов и перед тире. */
export function typo(text: string) {
  return text
    .replace(SHORT_WORDS, `$1$2${NBSP}`)
    .replace(SHORT_WORDS, `$1$2${NBSP}`)
    .replace(/ —/g, `${NBSP}—`)
}
