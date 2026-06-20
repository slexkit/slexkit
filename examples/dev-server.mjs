#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(import.meta.dir, "..");
const examplesRoot = join(root, "examples");
const officialExamplesRoot = join(root, "site", "content", "examples");
const distRoot = join(root, "dist");
const sharedRoot = join(examplesRoot, "shared");
const streamdownPackageRoot = join(root, "packages", "streamdown");
const tiptapPackageRoot = join(root, "packages", "tiptap");
const exampleName = process.argv[2];
const port = Number(process.env.PORT || 4174);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".md", "text/markdown; charset=utf-8"],
  [".svg", "image/svg+xml"],
]);

function within(parent, child) {
  const relative = normalize(child).slice(normalize(parent).length);
  return relative === "" || relative.startsWith(sep);
}

async function listExamples() {
  const entries = await readdir(examplesRoot, { withFileTypes: true });
  const names = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "shared") continue;
    if (existsSync(join(examplesRoot, entry.name, "index.html"))) names.push(entry.name);
  }
  return names.sort();
}

function response(text, status = 200, type = "text/plain; charset=utf-8") {
  return new Response(text, { status, headers: { "content-type": type } });
}

async function serveFile(base, urlPath) {
  const decoded = decodeURIComponent(urlPath.replace(/^\/+/, ""));
  const file = resolve(base, decoded || "index.html");
  if (!within(base, file) || !existsSync(file)) return undefined;
  const type = contentTypes.get(extname(file)) || "application/octet-stream";
  return new Response(await readFile(file), { headers: { "content-type": type } });
}

if (!exampleName || exampleName === "--help" || exampleName === "-h") {
  const examples = await listExamples();
  console.log("Usage: bun examples/dev-server.mjs <example-name>");
  console.log("");
  console.log("Examples:");
  for (const name of examples) console.log(`  ${name}`);
  process.exit(exampleName ? 0 : 1);
}

const exampleRoot = resolve(examplesRoot, exampleName);
if (!within(examplesRoot, exampleRoot) || !existsSync(join(exampleRoot, "index.html"))) {
  console.error(`Unknown example: ${exampleName}`);
  console.error(`Available examples: ${(await listExamples()).join(", ")}`);
  process.exit(1);
}

for (const required of ["slexkit.js", "slexkit.css", "runtime.js"]) {
  if (!existsSync(join(distRoot, required))) {
    console.error(`Missing dist/${required}. Run: bun run build:core`);
    process.exit(1);
  }
}

const server = Bun.serve({
  port,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/" || url.pathname === `/${exampleName}`) {
      return Response.redirect(`${url.origin}/examples/${exampleName}/`, 302);
    }
    if (url.pathname.startsWith(`/examples/${exampleName}/`)) {
      const rest = url.pathname.slice(`/examples/${exampleName}/`.length);
      return (await serveFile(exampleRoot, rest)) || response("Not found", 404);
    }
    if (url.pathname.startsWith("/shared/")) {
      return (await serveFile(sharedRoot, url.pathname.slice("/shared/".length))) || response("Not found", 404);
    }
    if (url.pathname.startsWith("/official-examples/")) {
      return (await serveFile(officialExamplesRoot, url.pathname.slice("/official-examples/".length))) || response("Not found", 404);
    }
    if (url.pathname.startsWith("/dist/")) {
      const rest = url.pathname.slice("/dist/".length);
      const runtimeAlias = rest === "slexkit.runtime.js" ? "runtime.js" : rest;
      return (await serveFile(distRoot, runtimeAlias)) || response("Not found", 404);
    }
    if (url.pathname.startsWith("/packages/streamdown/")) {
      const rest = url.pathname.slice("/packages/streamdown/".length);
      return (await serveFile(streamdownPackageRoot, rest)) || response("Not found", 404);
    }
    if (url.pathname.startsWith("/packages/tiptap/")) {
      const rest = url.pathname.slice("/packages/tiptap/".length);
      return (await serveFile(tiptapPackageRoot, rest)) || response("Not found", 404);
    }
    return response("Not found", 404);
  },
});

console.log(`SlexKit example '${exampleName}'`);
console.log(`http://localhost:${server.port}/examples/${exampleName}/`);
