/**
 * Русская типографика (применяется при сборке к строкам src/content, см. vite.config.ts):
 * неразрывный пробел после коротких предлогов и союзов, перед длинным тире и частицами,
 * внутри названий «Queen Bee» и «Boheme Residence» — чтобы они не разрывались на две строки.
 */
const NBSP = " ";
const SHORT =
  /(^|[\s(« ])(в|во|и|с|со|к|ко|о|об|обо|у|а|но|на|не|ни|по|за|до|от|из|для|без|при|под|над|что|как|это|мы|я|же)\s/giu;

export function typo(text: string) {
  return text
    .replace(SHORT, `$1$2${NBSP}`)
    .replace(SHORT, `$1$2${NBSP}`)
    .replace(/ (—|–)/g, `${NBSP}$1`)
    .replace(/ (же|ли|бы|б)(?=[\s.,:;!?»]|$)/giu, `${NBSP}$1`)
    .replace(/Queen Bee/g, `Queen${NBSP}Bee`)
    .replace(/Boheme Residence/g, `Boheme${NBSP}Residence`)
    .replace(/beauty-образ/g, "beauty‑образ");
}
