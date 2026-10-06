// Проверка калькулятора: npm test
import { birthNumber, personalYear, zodiac, parseDate, maskDate, reduceChain } from "../src/lib/numerology.ts";

const YEAR = 2026;
const cases: [string, number, number, string][] = [
  // дата, число даты рождения, персональный год (2026), знак
  ["29.11.1985", 9, 5, "Стрелец"],
  ["19.09.1990", 11, 11, "Дева"], // 38 → 11 (мастер-число), год: 29 → 11
  ["01.01.1991", 22, 3, "Козерог"], // 22 — мастер-число, не сворачивается
  ["04.06.1985", 33, 2, "Близнецы"], // 33 — мастер-число
  ["20.03.2000", 7, 6, "Рыбы"], // последний день Рыб
  ["21.03.2000", 8, 7, "Овен"], // первый день Овна
  ["22.12.1979", 33, 8, "Козерог"], // первый день Козерога; 33 — мастер-число
  ["19.01.1984", 33, 3, "Козерог"], // последний день Козерога
  ["20.01.1984", 7, 4, "Водолей"], // первый день Водолея
  ["29.02.1988", 3, 5, "Рыбы"], // високосный год
];

let fail = 0;
const rows: string[] = [];
for (const [s, num, py, sign] of cases) {
  const p = parseDate(s, new Date(YEAR, 9, 6));
  if (!p.ok) {
    console.log("НЕ РАЗОБРАНО", s, p.reason);
    fail++;
    continue;
  }
  const b = birthNumber(p.date);
  const y = personalYear(p.date, YEAR);
  const z = zodiac(p.date);
  const ok = b.value === num && y.value === py && z.name === sign;
  if (!ok) fail++;
  rows.push(
    `| ${s} | ${b.digits.join("+")} = ${b.chain.join(" → ")} | ${y.digits.join("+")} = ${y.chain.join(" → ")} | ${z.name} | ${ok ? "✓" : "✗ ожидалось " + [num, py, sign].join("/")} |`,
  );
}
console.log("| Дата | Число даты рождения | Персональный год 2026 | Знак | |\n|---|---|---|---|---|\n" + rows.join("\n"));

const bad: [string, string][] = [
  ["31.04.1990", "invalid"],
  ["29.02.1990", "invalid"],
  ["15.08", "incomplete"],
  ["01.01.2030", "future"],
  ["", "empty"],
];
for (const [s, reason] of bad) {
  const p = parseDate(s, new Date(YEAR, 9, 6));
  if (p.ok || p.reason !== reason) {
    console.log("ОШИБКА проверки", s, p);
    fail++;
  }
}
const iso = parseDate("1987-08-15");
if (!iso.ok || iso.date.d !== 15 || iso.date.m !== 8) fail++;
if (maskDate("15081987") !== "15.08.1987" || maskDate("150") !== "15.0") fail++;
if (reduceChain(29).join() !== "29,11") fail++;

console.log(fail ? `\nОШИБОК: ${fail}` : "\nВсе проверки пройдены");
process.exit(fail ? 1 : 0);
