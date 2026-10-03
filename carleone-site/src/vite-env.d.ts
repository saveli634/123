/// <reference types="vite/client" />

/** Демо-сборка (npm run build). В build:release — false: там обязательные поля CONFIG проверяются. */
declare const __DEMO__: boolean;

declare module "@/imgsrc" {
  /** true — однофайловая сборка: кадры и рендеры встроены в CSS-классы .f-* / .r-*. */
  export const singleFile: boolean;
}
