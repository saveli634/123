// Сборка: node scripts/build.mjs web|single [--release]
//   web    → dist/ (версия для хостинга: index.html RU + en.html EN, кадры и шрифты файлами)
//   single → site.html (один файл, открывается двойным щелчком без интернета, ≤ 5 МБ)
//   --release — без плашек «ЗАПОЛНИТЬ»; падает, пока в src/config.ts пусты обязательные поля.
import { build } from "vite";
import { copyFileSync, statSync, existsSync } from "node:fs";
import { prerender } from "./prerender.mjs";
import { compat } from "./compat.mjs";

const target = process.argv[2] === "single" ? "single" : "web";
const release = process.argv.includes("--release");
const mode = `${release ? "release-" : ""}${target}`;
const outDir = target === "single" ? "dist-single" : "dist";
const ssrDir = `${outDir}-ssr`;

await build({ mode, logLevel: "warn" });
await build({ mode, logLevel: "warn", build: { ssr: "src/entry-server.tsx", outDir: ssrDir, emptyOutDir: true } });
await prerender(outDir, ssrDir, target === "single");
await compat([outDir]);

if (target === "single") {
  copyFileSync(`${outDir}/index.html`, "site.html");
  const mb = statSync("site.html").size / 1024 / 1024;
  console.log(`site.html: ${mb.toFixed(2)} MB`);
  if (mb > 5) throw new Error(`site.html больше 5 МБ (${mb.toFixed(2)} МБ)`);
} else if (existsSync("public/og.jpg")) {
  console.log(`dist: ready (${release ? "release" : "demo"})`);
}
