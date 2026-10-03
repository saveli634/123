// Release-сборка не пройдёт, пока владелец не заполнил обязательные поля CONFIG
// и не подтвердил согласия на фото. Демо-сборка (npm run build / build:single) не проверяет.
import { CONFIG } from "../src/config.ts";

const miss = [];
if (!CONFIG.city.trim()) miss.push("city — город");
if (!CONFIG.phone.trim() && !CONFIG.whatsapp.trim()) miss.push("phone или whatsapp");
if (!CONFIG.instagram.trim()) miss.push("instagram");
if (!CONFIG.guestsConsentConfirmed) miss.push("guestsConsentConfirmed — письменное согласие гостий на фото");
if (!CONFIG.staffConsentConfirmed) miss.push("staffConsentConfirmed — согласие мастера (кадры guest_a_02, guest_a_03)");
if (miss.length) {
  console.error("\n✗ build:release остановлен. Заполните в src/config.ts:\n  - " + miss.join("\n  - ") + "\n");
  process.exit(1);
}
console.log("✓ CONFIG готов к публикации");
