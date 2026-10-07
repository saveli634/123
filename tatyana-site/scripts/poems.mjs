// Генерирует src/data/poems.generated.ts из brief/content/stihi_istochnik.md и stihi_dop.md.
// Текст стихов не меняется. Убираются только эмодзи и хештег (оформление Instagram);
// «‼️» и «⁉️» — знаки препинания в виде эмодзи — превращаются в «!!» и «?!».
// Для таблицы «фраза → источник» у каждой строки сохраняется номер строки в исходном файле.
import { readFileSync, writeFileSync } from "node:fs";

const SOURCES = ["brief/content/stihi_istochnik.md", "brief/content/stihi_dop.md"];

const strip = (s) =>
  s
    .replace(/‼️?/g, "!!")
    .replace(/⁉️?/g, "?!")
    .replace(/[\u2757\u2755]\uFE0F?/g, "!")
    .replace(/\s*(?:\p{Extended_Pictographic}|\p{Emoji_Modifier}|‍|️|⃣)+/gu, "")
    .replace(/\s+$/, "")
    .replace(/^\s+/, "");

const poems = [];
for (const SRC of SOURCES) {
const lines = readFileSync(SRC, "utf8").split(/\r?\n/);
const file = SRC.split("/").pop();
let cur = null;
lines.forEach((raw, i) => {
  const n = i + 1;
  const h = raw.match(/^## Стих (\d+)\. (.+)$/);
  if (h) {
    cur = { id: `stih-${h[1]}`, heading: h[2], headingLine: n, file, reel: "", reelLine: 0, stanzas: [[]] };
    poems.push(cur);
    return;
  }
  if (!cur) return;
  const reel = raw.match(/^Ролик: (https:\/\/\S+)$/);
  if (reel) {
    cur.reel = reel[1].split("?")[0];
    cur.reelLine = n;
    return;
  }
  if (/^Подпись к ролику:/.test(raw)) return;
  if (raw.trim() === "---") {
    cur = null;
    return;
  }
  if (/^#\S/.test(raw.trim())) return; // хештег
  const text = strip(raw).replace(/\s{2,}/g, " ");
  const stanza = cur.stanzas[cur.stanzas.length - 1];
  if (!text) {
    if (stanza.length) cur.stanzas.push([]);
    return;
  }
  stanza.push({ text, line: n });
});
}
for (const p of poems) p.stanzas = p.stanzas.filter((s) => s.length);

const out =
  "// Сгенерировано scripts/poems.mjs из brief/content/stihi_istochnik.md — не редактировать вручную.\n" +
  "export interface PoemLine { text: string; line: number }\n" +
  "export interface Poem { id: string; heading: string; headingLine: number; file: string; reel: string; reelLine: number; stanzas: PoemLine[][] }\n" +
  `export const poems: Poem[] = ${JSON.stringify(poems, null, 2)};\n`;
writeFileSync("src/data/poems.generated.ts", out);
for (const p of poems) {
  console.log(`\n${p.heading} — ${p.reel}`);
  for (const s of p.stanzas) console.log(s.map((l) => `  ${String(l.line).padStart(3)}| ${l.text}`).join("\n") + "\n");
}
