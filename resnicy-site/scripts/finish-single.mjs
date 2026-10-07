// Копирует однофайловую сборку в sait.html (в корне проекта) и проверяет размер.
import { copyFileSync, mkdirSync, statSync } from "node:fs";

copyFileSync("dist-single/index.html", "sait.html");
// Для Timeweb (по их гайду): один файл index.html в папку public_html
mkdirSync("timeweb", { recursive: true });
copyFileSync("dist-single/index.html", "timeweb/index.html");
const mb = statSync("sait.html").size / 1024 / 1024;
console.log(`sait.html: ${mb.toFixed(2)} MB`);
if (mb > 5) throw new Error("sait.html больше 5 МБ");
