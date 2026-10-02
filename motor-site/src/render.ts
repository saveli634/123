// Страница для готовых рендеров (scripts/render-engine.mjs) и отладки сцены в npm run dev:
// /render.html?t=2.5&w=1600&h=1000 — t: 0 первый экран, 1.5…6.5 этапы.
import { createEngineScene } from "./three/engineScene";

const q = new URLSearchParams(location.search);
const canvas = document.getElementById("c") as HTMLCanvasElement;
const w = Number(q.get("w")) || innerWidth;
const h = Number(q.get("h")) || innerHeight;
canvas.style.width = w + "px";
canvas.style.height = h + "px";
const scene = createEngineScene(canvas, { mobile: false, still: true });
if (!scene) {
  document.body.dataset.state = "nowebgl";
} else {
  const center = { x: Number(q.get("x") || 0.5), y: Number(q.get("y") || 0.5), zoom: Number(q.get("z") || 1) };
  scene.setLayout(center, center);
  scene.resize(w, h);
  scene.still(Number(q.get("t") || 0));
  document.body.dataset.state = "ready";
  window.__still = (t: number) => scene.still(t);
}
