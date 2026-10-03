/// <reference types="vite/client" />

/** Демо-сборка: на месте пустых полей CONFIG видны плашки «ЗАПОЛНИТЬ». В build:release — false. */
declare const __DEMO__: boolean;

declare module "@/imgsrc" {
  /** true — однофайловая сборка: кадры и рендеры встроены в CSS-классы .f-* / .r-*. */
  export const singleFile: boolean;
}
