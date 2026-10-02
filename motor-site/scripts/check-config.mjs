// npm run build:release: сборка останавливается, если пусто обязательное поле CONFIG.
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../src/config.ts", import.meta.url), "utf8");
const required = (src.match(/REQUIRED_FIELDS\s*=\s*\[([^\]]*)\]/)?.[1] ?? "").match(/"(\w+)"/g)?.map((s) => s.slice(1, -1)) ?? [];
const value = (key) => src.match(new RegExp(`\\n\\s*${key}:\\s*"([^"]*)"`))?.[1]?.trim() ?? "";
const empty = required.filter((k) => !value(k));
if (empty.length) {
  console.error(`\nСборка остановлена: заполните в src/config.ts поля: ${empty.join(", ")}\n`);
  process.exit(1);
}
console.log(`config ok: ${required.map((k) => `${k}=«${value(k)}»`).join(", ")}`);
