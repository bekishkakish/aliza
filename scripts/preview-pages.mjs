import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve, relative, isAbsolute, extname } from "node:path";
import { fileURLToPath } from "node:url";

// Deliberately no SPA fallback: this preview catches paths that would 404 on Pages.
const directory = fileURLToPath(new URL("../dist/", import.meta.url));
const base = "/aliza/";
const port = Number(process.env.PAGES_PREVIEW_PORT || 5174);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
};

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname === base.slice(0, -1)) {
      response.writeHead(308, { Location: base + url.search });
      response.end();
      return;
    }
    if (!url.pathname.startsWith(base)) throw new Error("Not found");
    const path = resolve(
      directory,
      decodeURIComponent(url.pathname.slice(base.length)) || "index.html",
    );
    const local = relative(directory, path);
    if (local.startsWith("..") || isAbsolute(local))
      throw new Error("Not found");
    const entry = await stat(path);
    if (!entry.isFile()) throw new Error("Not found");
    response.writeHead(200, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "Content-Length": entry.size,
      "Cache-Control": "no-store",
    });
    if (request.method === "HEAD") response.end();
    else createReadStream(path).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`GitHub Pages preview: http://127.0.0.1:${port}${base}`),
);
