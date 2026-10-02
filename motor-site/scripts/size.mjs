// Проверка однофайловой версии: не больше 5 МБ.
import { statSync } from "node:fs";
const file = process.argv[2];
const mb = statSync(file).size / 1048576;
console.log(`single file: ${file} — ${mb.toFixed(2)} MB`);
if (mb > 5) {
  console.error("Файл больше 5 МБ");
  process.exit(1);
}
