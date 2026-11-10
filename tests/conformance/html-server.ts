import { readFile } from "node:fs/promises";
import { join, resolve, extname } from "node:path";

const root = resolve(import.meta.dir, "../..");
const port = Number(process.env.PORT ?? 4197);
const types: Record<string, string> = { ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf" };
Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const headers = { "access-control-allow-origin": "*", "cache-control": "no-store" };
    if (url.pathname === "/") return new Response('<!doctype html><html><head><meta charset="utf-8"><title>SlexKit HTML host</title><style>body{margin:24px;font-family:system-ui}#root{max-width:840px}iframe{min-height:0}</style></head><body><h1>Interactive Markdown</h1><div id="root"></div><div id="other"></div></body></html>', { headers: { ...headers, "content-type": "text/html; charset=utf-8" } });
    if (!url.pathname.startsWith("/dist/")) return new Response("Not found", { status: 404, headers });
    const path = resolve(root, "." + url.pathname);
    if (!path.startsWith(join(root, "dist") + "\\") && !path.startsWith(join(root, "dist") + "/")) return new Response("Forbidden", { status: 403, headers });
    try { return new Response(await readFile(path), { headers: { ...headers, "content-type": types[extname(path)] ?? "application/octet-stream" } }); }
    catch { return new Response("Not found", { status: 404, headers }); }
  },
});
console.log(`HTML conformance server: http://localhost:${port}`);
