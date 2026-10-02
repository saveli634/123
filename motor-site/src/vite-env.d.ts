/// <reference types="vite/client" />
declare const __RELEASE__: boolean;
declare const __SINGLE__: boolean;
declare module "@/content/imgsrc" {
  export const singleFile: boolean;
}
interface Window {
  __siteReady?: boolean;
  __still?: (t: number) => void;
}
