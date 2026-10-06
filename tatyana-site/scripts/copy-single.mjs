// Кладёт однофайловую сборку рядом с проектом под именем sait.html (для отправки).
import { copyFileSync, statSync } from "node:fs";
copyFileSync("dist-single/index.html", "sait.html");
console.log(`sait.html: ${(statSync("sait.html").size / 1024).toFixed(0)} KB`);
