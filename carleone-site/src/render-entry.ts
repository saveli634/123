/**
 * Служебная страница render.html: рендеры глобуса для запасного режима (без WebGL 2,
 * reduced motion, без JS) и картинка для Open Graph. Используется scripts/render-globe.mjs.
 */
import "./fonts.css";
import { createGlobe } from "./globe/scene";
import type { Shot } from "./globe/geo";
import { LION_D, LION_H, LION_W } from "./generated/lion";

const canvas = document.getElementById("c") as HTMLCanvasElement;
const globe = createGlobe(canvas, { still: true });

declare global {
  interface Window {
    __still?: (t: number, w: number, h: number, shot?: Partial<Shot> | "actual") => string;
    __og?: () => Promise<void>;
    __ready?: boolean;
  }
}

window.__still = (t, w, h, shot) => {
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  globe.still(t, w, h, shot);
  return canvas.toDataURL("image/png");
};

/** Open Graph 1200×630: глобус со всеми дугами справа, лев и название слева. */
window.__og = async () => {
  document.body.style.background = "#0A0809";
  const box = document.createElement("div");
  box.id = "og";
  box.style.cssText =
    "position:relative;width:1200px;height:630px;overflow:hidden;background:radial-gradient(70% 90% at 72% 50%,#16100f 0%,#0A0809 70%)";
  canvas.style.cssText = "position:absolute;inset:0;width:1200px;height:630px";
  box.appendChild(canvas);
  globe.still(4, 1200, 630, { cx: 0.22, cy: 0.04, r: 0.78, lat: 38, lon: 58 });
  const text = document.createElement("div");
  text.style.cssText =
    "position:absolute;left:72px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;color:#F3ECDD";
  text.innerHTML = `
    <svg viewBox="0 0 ${LION_W} ${LION_H}" width="118" height="${Math.round((118 * LION_H) / LION_W)}" style="margin-bottom:26px"><path d="${LION_D}" fill="#E3C182" fill-rule="evenodd"/></svg>
    <div style="font:600 92px/0.92 'Playfair Display';letter-spacing:-0.02em">Carleone<br/><em style="color:#E3C182">Service</em></div>
    <div style="margin-top:30px;font:600 15px/1.3 Manrope;letter-spacing:.14em;text-transform:uppercase;color:#E3C182">Ещё одна страна на карте</div>
    <div style="margin-top:10px;font:600 13px/1.3 Manrope;letter-spacing:.14em;text-transform:uppercase;color:#8F8374">Казахстан</div>`;
  box.appendChild(text);
  const shade = document.createElement("div");
  shade.style.cssText =
    "position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(10,8,9,.92) 0%,rgba(10,8,9,.6) 34%,transparent 60%)";
  box.insertBefore(shade, text);
  document.body.appendChild(box);
  await document.fonts.ready;
};

window.__ready = true;
