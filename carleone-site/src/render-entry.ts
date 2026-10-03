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

/**
 * Open Graph 1200×630: слева лев, название, техническое заявление и направления; справа — три
 * реальных кадра (АКПП, радиатор ATF, бокс) в тонких золотых рамках. Глобус — только на сайте.
 */
window.__og = async () => {
  document.body.style.background = "#0A0809";
  canvas.style.display = "none";
  const box = document.createElement("div");
  box.id = "og";
  box.style.cssText =
    "position:relative;width:1200px;height:630px;overflow:hidden;background:radial-gradient(70% 90% at 30% 50%,#16100f 0%,#0A0809 70%)";
  const shots = ["valve_body_hand", "radiator_installed", "rav4_on_lift"];
  const strip = document.createElement("div");
  strip.style.cssText = "position:absolute;right:60px;top:60px;bottom:60px;display:flex;gap:16px";
  strip.innerHTML = shots
    .map(
      (n, i) =>
        `<div style="width:${i === 0 ? 176 : 118}px;height:100%;outline:1px solid rgba(227,193,130,.32);outline-offset:6px;background:#141012 url(/frames/${n}.jpg) center/cover no-repeat;${i ? "margin-top:" + i * 34 + "px;height:calc(100% - " + i * 34 + "px)" : ""}"></div>`,
    )
    .join("");
  box.appendChild(strip);
  const text = document.createElement("div");
  text.style.cssText =
    "position:absolute;left:72px;top:0;bottom:0;width:600px;display:flex;flex-direction:column;justify-content:center;color:#F3ECDD";
  text.innerHTML = `
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:34px">
      <svg viewBox="0 0 ${LION_W} ${LION_H}" width="64" height="${Math.round((64 * LION_H) / LION_W)}"><path d="${LION_D}" fill="#E3C182" fill-rule="evenodd"/></svg>
      <div>
        <div style="font:600 19px/1 Manrope;letter-spacing:.3em;text-transform:uppercase">Carleone Service</div>
        <div style="margin-top:9px;font:600 13px/1 Manrope;letter-spacing:.24em;text-transform:uppercase;color:#E3C182">Алматы · Казахстан</div>
      </div>
    </div>
    <div style="font:600 50px/1.08 'Playfair Display';letter-spacing:-0.01em;white-space:nowrap">Сложные задачи.<br/><em style="color:#E3C182">Технические решения.</em></div>
    <div style="margin-top:34px;font:600 15px/1.3 Manrope;letter-spacing:.18em;text-transform:uppercase">Двигатели <span style="color:#E3C182">·</span> АКПП <span style="color:#E3C182">·</span> Тюнинг <span style="color:#E3C182">·</span> Performance</div>`;
  box.appendChild(text);
  document.body.appendChild(box);
  await Promise.all(
    shots.map(
      (n) =>
        new Promise((r) => {
          const img = new Image();
          img.onload = img.onerror = r;
          img.src = `/frames/${n}.jpg`;
        }),
    ),
  );
  await document.fonts.ready;
};

window.__ready = true;
