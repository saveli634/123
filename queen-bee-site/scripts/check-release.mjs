// Релизная сборка не собирается, пока не заполнены обязательные поля src/config.ts
import { CONFIG } from "../src/config.ts";
const missing = [];
if (!CONFIG.city.trim()) missing.push("city (город)");
if (!CONFIG.phone.trim() && !CONFIG.whatsapp.trim()) missing.push("phone или whatsapp (хотя бы один способ связи)");
if (!CONFIG.instagram.trim()) missing.push("instagram");
if (missing.length) {
  console.error("\nРелиз невозможен — заполните в src/config.ts:\n  • " + missing.join("\n  • ") + "\n");
  process.exit(1);
}
console.log("config OK");
