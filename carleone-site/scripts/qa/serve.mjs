// Мини-сервер для проверки собранной версии (без зависимостей).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".json": "application/json",
};

export function serve(dir, port = 4173) {
  const root = resolve(dir);
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
      if (path.endsWith("/")) path += "index.html";
      const file = normalize(join(root, path));
      if (!file.startsWith(root)) throw new Error("forbidden");
      await stat(file);
      const body = await readFile(file);
      res.writeHead(200, {
        "content-type": TYPES[extname(file)] ?? "application/octet-stream",
        "cache-control": "no-cache",
      });
      res.end(body);
    } catch {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("not found");
    }
  });
  return new Promise((ok) =>
    server.listen(port, () => ok({ url: `http://localhost:${port}/`, close: () => server.close() })),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const s = await serve(process.argv[2] ?? "dist", Number(process.argv[3] ?? 4173));
  console.log(`serving ${process.argv[2] ?? "dist"} at ${s.url}`);
}
