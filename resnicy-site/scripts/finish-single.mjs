// Копирует однофайловую сборку в sait.html (в корне проекта) и проверяет размер.
import { copyFileSync, statSync } from "node:fs";

copyFileSync("dist-single/index.html", "sait.html");
const mb = statSync("sait.html").size / 1024 / 1024;
console.log(`sait.html: ${mb.toFixed(2)} MB`);
if (mb > 5) throw new Error("sait.html больше 5 МБ");
