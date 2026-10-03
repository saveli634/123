// Однофайловая версия: проверка размера (до 5 МБ) и копия в site.html.
import { statSync, copyFileSync } from "node:fs";
const f = "dist-single/index.html";
const mb = statSync(f).size / 1048576;
copyFileSync(f, "site.html");
console.log(`site.html: ${mb.toFixed(2)} МБ`);
if (mb > 5) {
  console.error("✗ больше 5 МБ");
  process.exit(1);
}
