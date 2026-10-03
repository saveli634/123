/// <reference types="vite/client" />
declare module "@/content/imgsrc" {
  export const singleFile: boolean;
}
declare module "@/content/guestsrc" {
  export const guestMeta: Record<string, { w: number; h: number; widths: number[]; color: string }>;
}
declare const __QB_CONFIG__: import("./config").SiteConfig;
declare const __QB_DEMO__: boolean;
declare const __QB_GUESTS__: boolean;
declare module "virtual:qb-guests" {
  const meta: Record<string, { w: number; h: number; widths: number[]; color: string }>;
  export default meta;
}
declare module "virtual:qb-guests.css";
