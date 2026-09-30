/** Однофайловая версия: фото встраиваются в HTML как data-URL. */
const files = import.meta.glob("../../../single-img/*.webp", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export const singleFile = true;
export const inlineImages: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split("/").pop()!.replace(".webp", ""), url]),
);
