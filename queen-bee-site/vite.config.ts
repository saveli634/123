import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { fileURLToPath } from "node:url";
import { cpSync, existsSync, readFileSync, readdirSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { CONFIG, type SiteConfig } from "./src/config.ts";
import { typo } from "./src/lib/typo.ts";
import { guestImages } from "./src/content/guests.ts";

const src = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * Режимы сборки:
 *  - обычный (dist/)            — демо: на месте пустых полей CONFIG видны плашки «ЗАПОЛНИТЬ: …»;
 *  - single (dist-single/)      — один HTML-файл, всё встроено;
 *  - QB_RELEASE=1               — релиз: без плашек (проверку полей делает scripts/check-release.mjs).
 * Для проверок (скриншоты, ссылки) можно подменить поля: QB_CONFIG='{"phone":"+7…"}', QB_SHOW_GUESTS=1.
 * В git эти подмены не попадают — источник правды только src/config.ts.
 */
function resolveConfig(): SiteConfig {
  const over = process.env.QB_CONFIG ? (JSON.parse(process.env.QB_CONFIG) as Partial<SiteConfig>) : {};
  const cfg = { ...CONFIG, ...over };
  if (process.env.QB_SHOW_GUESTS === "1") cfg.showGuestPhotos = true;
  return cfg;
}

const digits = (s: string) => s.replace(/\D/g, "");

/** <title>, description, Open Graph и JSON-LD BeautySalon — только из заполненных полей */
const seo = (cfg: SiteConfig): Plugin => ({
  name: "qb-seo",
  transformIndexHtml(html) {
    const title = `Queen Bee Boheme Residence${cfg.city ? ` — ${cfg.city}` : ""}`;
    const desc = typo(
      `Queen Bee Boheme Residence${cfg.city ? `, ${cfg.city}` : ""}. Место встречи — Queen Bee: полный beauty-образ в эстетике Queen Bee.`,
    );
    const ld: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "BeautySalon",
      name: "Queen Bee Boheme Residence",
      image: "og-image.jpg",
    };
    if (cfg.phone) ld.telephone = `+${digits(cfg.phone)}`;
    if (cfg.address || cfg.city) {
      ld.address = {
        "@type": "PostalAddress",
        ...(cfg.address ? { streetAddress: cfg.address } : {}),
        ...(cfg.city ? { addressLocality: cfg.city } : {}),
      };
    }
    if (cfg.instagram) ld.sameAs = [cfg.instagram];
    if (cfg.mapLink) ld.hasMap = cfg.mapLink;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    return html
      .replace("%QB_TITLE%", esc(title))
      .replace(/%QB_DESC%/g, esc(desc))
      .replace("%QB_LD%", JSON.stringify(ld).replace(/</g, "\\u003c"));
  },
});

/**
 * Типографика при сборке: неразрывные пробелы после предлогов и союзов, перед тире,
 * внутри «Queen Bee». Обрабатываются строки в src/content/*.ts.
 */
const typograf = (): Plugin => ({
  name: "qb-typograf",
  enforce: "pre",
  transform(code, id) {
    if (!/[\\/]src[\\/]content[\\/][^\\/]+\.ts$/.test(id)) return null;
    return code.replace(/"((?:[^"\\\n]|\\.)*)"/g, (_, s: string) => `"${typo(s)}"`);
  },
});

/**
 * Фото гостий попадают в сборку только при showGuestPhotos=true и только те, что показаны
 * (кадры с мастером — только при showStaffFaces). Виртуальные модули:
 *   virtual:qb-guests      — размеры кадров;  virtual:qb-guests.css — встроенные кадры (один файл).
 */
const guestFiles = (on: boolean, names: string[]): Plugin => ({
  name: "qb-guest-files",
  resolveId: (id) => (id === "virtual:qb-guests" || id === "virtual:qb-guests.css" ? "\0" + id : null),
  load(id) {
    if (id === "\0virtual:qb-guests") {
      const all = on ? JSON.parse(readFileSync(src("./media-guests/guests.generated.json"), "utf8")) : {};
      return `export default ${JSON.stringify(Object.fromEntries(names.filter((n) => all[n]).map((n) => [n, all[n]])))};`;
    }
    if (id === "\0virtual:qb-guests.css") {
      if (!on) return "";
      const css = readFileSync(src("./single-img/guests.css"), "utf8").split("\n");
      return css.filter((l) => names.some((n) => l.startsWith(`.img-${n}{`))).join("\n");
    }
    return null;
  },
  writeBundle(opts) {
    if (!on || !opts.dir || !existsSync(src("./media-guests"))) return;
    const out = join(opts.dir, "images");
    mkdirSync(out, { recursive: true });
    for (const f of readdirSync(src("./media-guests")))
      if (/\.(webp|jpg)$/.test(f) && names.some((n) => f.startsWith(`${n}-`) || f === `${n}.jpg`)) cpSync(join(src("./media-guests"), f), join(out, f));
  },
  configureServer(server) {
    if (!on) return;
    server.middlewares.use("/images", (req, res, next) => {
      const f = join(src("./media-guests"), (req.url || "").split("?")[0]);
      if (/guest_.*\.(webp|jpg)$/.test(f) && existsSync(f) && names.some((n) => f.includes(n))) {
        res.setHeader("Content-Type", f.endsWith(".webp") ? "image/webp" : "image/jpeg");
        res.end(readFileSync(f));
      } else next();
    });
  },
});

/** В однофайловой версии внешних файлов нет: preload убираем, favicon встраиваем. */
const singleTweaks = (): Plugin => ({
  name: "qb-single",
  transformIndexHtml: (html) =>
    html
      .replace(/<link\s+rel="preload"[^>]*>\s*/g, "")
      .replace(/<meta property="og:image"[^>]*>\s*/g, "")
      .replace('href="./favicon.svg"', `href="data:image/svg+xml,${encodeURIComponent(readFileSync(src("./public/favicon.svg"), "utf8"))}"`),
});

export default defineConfig(({ mode }) => {
  const single = mode === "single";
  const release = process.env.QB_RELEASE === "1";
  const cfg = resolveConfig();
  const guests = cfg.showGuestPhotos && existsSync(src("./media-guests/guests.generated.json"));
  return {
    base: "./",
    publicDir: single ? false : "public",
    define: {
      __QB_CONFIG__: JSON.stringify(cfg),
      __QB_DEMO__: JSON.stringify(!release),
      __QB_GUESTS__: JSON.stringify(guests),
    },
    plugins: [typograf(), react(), tailwindcss(), seo(cfg), guestFiles(guests, guestImages(cfg.showStaffFaces)), ...(single ? [viteSingleFile(), singleTweaks()] : [])],
    resolve: {
      alias: {
        "@/content/imgsrc": src(single ? "./src/content/imgsrc/single.ts" : "./src/content/imgsrc/web.ts"),
        "@/content/guestsrc": src(single ? "./src/content/guestsrc/single.ts" : "./src/content/guestsrc/web.ts"),
        "@": src("./src"),
      },
    },
    build: {
      target: ["es2017", "chrome70", "edge79", "firefox68", "safari12"],
      ...(single ? { outDir: "dist-single", assetsInlineLimit: Number.MAX_SAFE_INTEGER } : {}),
    },
  };
});
