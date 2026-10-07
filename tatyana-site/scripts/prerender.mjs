// Вставляет готовую HTML-разметку страниц в собранные HTML-файлы.
// Хостинг: каждая страница (index.html, karta.html…) — своё содержимое по data-page.
// Однофайловая сборка (index.html с классом spa) — все страницы сразу.
// Использование: node scripts/prerender.mjs <папка-сборки> <папка-ssr>
import { readFileSync, writeFileSync, rmSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [outDir, ssrDir] = process.argv.slice(2);
const { render } = await import(pathToFileURL(resolve(ssrDir, "entry-server.js")).href);

for (const f of readdirSync(outDir).filter((x) => x.endsWith(".html"))) {
  const path = resolve(outDir, f);
  const html = readFileSync(path, "utf8");
  const m = html.match(/<div id="root"(?: data-page="([a-z]+)")?><\/div>/);
  if (!m) throw new Error(`root not found in ${f}`);
  const page = /<html[^>]*class="[^"]*spa/.test(html) ? "spa" : m[1] || "home";
  // SSR пишет пути к файлам от корня (/assets/…) — делаем относительными, чтобы сайт работал в любой папке
  const markup = render(page).replace(/(=")\/(assets|audio)\//g, "$1./$2/");
  let out = html.replace(m[0], () => m[0].replace("></div>", `>${markup}</div>`));
  // портрет на первом экране — самая крупная картинка: грузим сразу
  const lcp = markup.match(/<image href="(\.\/assets\/anna-portrait-[^"]+)"/);
  if (lcp) out = out.replace("</head>", `<link rel="preload" as="image" href="${lcp[1]}" fetchpriority="high" />\n</head>`);
  writeFileSync(path, out);
  console.log(`prerendered ${page} -> ${f}`);
}
rmSync(ssrDir, { recursive: true, force: true });
