// Проверка веса однофайловой версии (лимит ТЗ — 5 МБ)
import { statSync } from "node:fs";
const f = process.argv[2];
const mb = statSync(f).size / 1024 / 1024;
console.log(`${f}: ${mb.toFixed(2)} MB`);
if (mb > 5) {
  console.error("Файл больше 5 МБ");
  process.exit(1);
}
