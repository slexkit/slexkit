import { watch } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { buildSiteAssets } from "./scripts/build";
import { sourceLocale } from "./data/component-docs.js";
import { discoverWikiMarkdown } from "./data/content-discovery.js";
import { createSeoIndex, injectSeoHead, renderRobotsTxt, renderSitemapXml } from "./data/seo.js";

const hostname = Bun.env.HOST ?? "0.0.0.0";
const port = Number(Bun.env.PORT ?? 4000);
const siteRoot = import.meta.dir;
const projectRoot = join(siteRoot, "..");
const outDir = join(siteRoot, ".bun-dist");
const htmlPath = join(siteRoot, "index.html");
const playgroundHtmlPath = join(siteRoot, "playground.html");
const runtimeEntrypoints = [
  join(projectRoot, "dist", "slexkit.js"),
  join(projectRoot, "dist", "tooling.js"),
  join(projectRoot, "dist", "slexkit.css"),
];
const enableLiveReload = Bun.env.SLEXKIT_LIVE_RELOAD !== "0" && Bun.env.NODE_ENV !== "production";
const reloadClients = new Set<ReadableStreamDefaultController>();
const liveReloadScript = `
<script>
(() => {
  if (!("EventSource" in window)) return;
  const source = new EventSource("/__slexkit/reload");
  source.addEventListener("reload", () => window.location.reload());
})();
</script>`;
let rebuildTimer: Timer | undefined;
let rebuilding = false;
let rebuildAgain = false;

await ensureRuntimeEntrypoints();
await buildSiteAssets();
let seoIndex = await createSeoIndex({ siteRoot });

function contentType(path: string) {
  switch (extname(path)) {
    case ".css":
      return "text/css; charset=utf-8";
    case ".js":
      return "text/javascript; charset=utf-8";
    case ".map":
      return "application/json; charset=utf-8";
    case ".html":
      return "text/html; charset=utf-8";
    case ".md":
      return "text/markdown; charset=utf-8";
    case ".txt":
      return "text/plain; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".xml":
      return "application/xml; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

async function wikiDocsResponse() {
  return Response.json({ markdown: await discoverWikiMarkdown({ siteRoot }) });
}

async function assetResponse(pathname: string) {
  const relative = pathname.replace(/^\/assets\//, "");
  if (!relative || relative.includes("..")) return new Response("Not found", { status: 404 });

  const path = join(outDir, relative);
  try {
    const headers: Record<string, string> = {
      "cache-control": "no-store",
      "content-type": contentType(path),
    };
    if (path.endsWith(".js")) {
      headers["access-control-allow-origin"] = "*";
    }
    return new Response(await readFile(path), {
      headers,
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

async function runtimeResponse(pathname: string) {
  const filename = pathname.endsWith(".css")
    ? "slexkit.css"
    : pathname.endsWith("tooling.js")
      ? "tooling.js"
      : pathname.endsWith("runtime.js")
        ? "runtime.js"
        : "slexkit.js";
  const path = join(projectRoot, "dist", filename);
  try {
    const headers: Record<string, string> = {
      "cache-control": "no-store",
      "content-type": contentType(path),
    };
    if (filename.endsWith(".js")) {
      headers["access-control-allow-origin"] = "*";
    }
    return new Response(await readFile(path), { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fileExists(path: string) {
  try {
    const info = await stat(path);
    return info.isFile() && info.size > 0;
  } catch {
    return false;
  }
}

async function waitForRuntimeEntrypoints(timeoutMs = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ready = await Promise.all(runtimeEntrypoints.map((path) => fileExists(path)));
    if (ready.every(Boolean)) return;
    await sleep(100);
  }

  throw new Error("Timed out waiting for dist/slexkit.js, dist/tooling.js, and dist/slexkit.css");
}

async function ensureRuntimeEntrypoints() {
  const ready = await Promise.all(runtimeEntrypoints.map((path) => fileExists(path)));
  if (ready.every(Boolean)) return;

  console.log("slexkit-site building missing runtime assets...");
  const proc = Bun.spawn(["bun", "run", "build:core"], {
    cwd: projectRoot,
    stdout: "inherit",
    stderr: "inherit",
  });
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error(`Failed to build SlexKit runtime assets. build:core exited with ${exitCode}.`);
  }

  await waitForRuntimeEntrypoints();
}

function notifyReloadClients() {
  const payload = new TextEncoder().encode("event: reload\ndata: runtime\n\n");
  for (const controller of reloadClients) {
    try {
      controller.enqueue(payload);
    } catch {
      reloadClients.delete(controller);
    }
  }
}

async function rebuildAndReload(reason: string) {
  if (rebuilding) {
    rebuildAgain = true;
    return;
  }

  rebuilding = true;
  try {
    console.log(`slexkit-site rebuilding after ${reason}`);
    await waitForRuntimeEntrypoints();
    await buildSiteAssets({ clean: false });
    seoIndex = await createSeoIndex({ siteRoot });
    notifyReloadClients();
  } catch (error) {
    console.error("slexkit-site rebuild failed:", error);
  } finally {
    rebuilding = false;
    if (rebuildAgain) {
      rebuildAgain = false;
      void rebuildAndReload("queued change");
    }
  }
}

function scheduleRebuild(reason: string) {
  if (rebuildTimer) clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    rebuildTimer = undefined;
    void rebuildAndReload(reason);
  }, 500);
}

function watchRuntimeOutputs() {
  const rebuildPattern = /^(dist[\\/](slexkit\.js|runtime\.js|tooling\.js|slexkit\.css)|site[\\/]main\.css|src[\\/]styles[\\/].+\.css)$/;

  watch(projectRoot, { persistent: false, recursive: true }, (_event, filename) => {
    const changed = filename?.toString();
    if (changed && rebuildPattern.test(changed)) {
      scheduleRebuild(changed);
    }
  });
}

function liveReloadResponse() {
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;
  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;
      reloadClients.add(controller);
      controller.enqueue(new TextEncoder().encode("event: ready\ndata: ok\n\n"));
    },
    cancel() {
      if (streamController) reloadClients.delete(streamController);
    },
  });

  return new Response(stream, {
    headers: {
      "cache-control": "no-store",
      "content-type": "text/event-stream",
    },
  });
}

async function htmlResponse(path: string, options: { page?: any; publicBaseUrl?: string } = {}) {
  const html = await readFile(path, "utf-8");
  const seoHtml = options.page ? injectSeoHead(html, options.page, { publicBaseUrl: options.publicBaseUrl }) : html;
  const body = enableLiveReload ? seoHtml.replace("</body>", `${liveReloadScript}\n</body>`) : seoHtml;
  return new Response(body, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function publicBaseUrl(requestUrl: URL) {
  return `${requestUrl.protocol}//${requestUrl.host}/`;
}

async function readmeResponse() {
  const path = join(siteRoot, "..", "README.md");
  return new Response(await readFile(path, "utf-8"), {
    headers: { "content-type": contentType(path) },
  });
}

async function aiDocsResponse(pathname: string) {
  const filename = pathname.slice(1);
  const path = join(projectRoot, "dist", "ai", filename);
  try {
    return new Response(await readFile(path), {
      headers: { "content-type": contentType(path), "cache-control": "no-store" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

async function markdownAssetResponse(pathname: string) {
  let relative: string;
  try {
    relative = decodeURIComponent(pathname).replace(/^\/+/, "");
  } catch {
    return new Response("Not found", { status: 404 });
  }

  if (!relative.endsWith(".md") || relative.includes("..") || relative.includes("\\")) {
    return new Response("Not found", { status: 404 });
  }

  const localeMatch = relative.match(/^(zh-CN|en-US)\/(.+)$/);
  const locale = localeMatch ? localeMatch[1] : sourceLocale;
  if (localeMatch) relative = localeMatch[2];

  const componentDocMatch = relative.match(/^components\/([^/]+)\.md$/);
  if (componentDocMatch) {
    relative = `content/components/${componentDocMatch[1]}/${locale}.md`;
  }

  const wikiComponentDocMatch = relative.match(/^docs\/components\/([^/]+)\.md$/);
  if (wikiComponentDocMatch) {
    relative = `content/components/${wikiComponentDocMatch[1]}/${locale}.md`;
  }

  const wikiGuideDocMatch = relative.match(
    /^docs\/guides\/(intro|quick-start|integration|design|security-runtime|ai-agents)\.md$/,
  );
  if (wikiGuideDocMatch) {
    relative = `content/guides/${wikiGuideDocMatch[1]}/${locale}.md`;
  }

  const wikiReferenceDocMatch = relative.match(
    /^docs\/reference\/(usage|runtime|security|spec|rationale|packages|integration|toolhost|icons)\.md$/,
  );
  if (wikiReferenceDocMatch) {
    relative = `content/reference/${wikiReferenceDocMatch[1]}/${locale}.md`;
  }

  const wikiReleaseDocMatch = relative.match(/^docs\/releases\/(changelog)\.md$/);
  if (wikiReleaseDocMatch) {
    relative = `content/releases/${wikiReleaseDocMatch[1]}/${locale}.md`;
  }

  if (relative === "design.md") {
    relative = `content/guides/design/${locale}.md`;
  }

  const docsDocMatch = relative.match(/^docs\/(intro|quick-start|security-runtime|ai-agents)\.md$/);
  if (docsDocMatch) {
    relative = `content/guides/${docsDocMatch[1]}/${locale}.md`;
  }

  const legacyReferenceDocMatch = relative.match(/^docs\/(guide|runtime|security|spec|packages|integration|toolhost|icons|rationale|design)\.md$/);
  if (legacyReferenceDocMatch) {
    const slug = legacyReferenceDocMatch[1] === "guide" ? "usage" : legacyReferenceDocMatch[1] === "design" ? "rationale" : legacyReferenceDocMatch[1];
    relative = `content/reference/${slug}/${locale}.md`;
  }

  if (relative === "docs/changelog.md" || relative === "changelog.md") {
    relative = `content/releases/changelog/${locale}.md`;
  }

  const path = join(siteRoot, relative);
  try {
    return new Response(await readFile(path, "utf-8"), {
      headers: { "content-type": contentType(path) },
    });
  } catch {
    if (locale !== sourceLocale) {
      const fallback = relative.replace(`/${locale}.md`, `/${sourceLocale}.md`);
      const fallbackPath = join(siteRoot, fallback);
      try {
        return new Response(await readFile(fallbackPath, "utf-8"), {
          headers: { "content-type": contentType(fallbackPath) },
        });
      } catch {
        return new Response("Not found", { status: 404 });
      }
    }
    return new Response("Not found", { status: 404 });
  }
}

function isAppRoute(pathname: string) {
  const path = pathname.replace(/^\/(zh-CN|en-US)(?=\/|$)/, "") || "/";
  return (
    path === "/" ||
    path === "/index.html" ||
    path === "/docs" ||
    path === "/docs/" ||
    path.startsWith("/docs/") ||
    path === "/design" ||
    path === "/design/" ||
    path === "/components" ||
    path === "/components/" ||
    path.startsWith("/components/")
  );
}

function legacyDocsPath(pathname: string) {
  const localeMatch = pathname.match(/^\/(zh-CN|en-US)(\/.*)?$/);
  const localePrefix = localeMatch ? `/${localeMatch[1]}` : "";
  const cleanPath = (localeMatch ? (localeMatch[2] || "/") : pathname).replace(/\/$/, "");
  if (cleanPath === "/design") return `${localePrefix}/docs/guides/design`;
  if (cleanPath === "/components") return `${localePrefix}/docs/components/accordion`;
  if (cleanPath.startsWith("/components/")) {
    return `${localePrefix}/docs/components/${encodeURIComponent(decodeURIComponent(cleanPath.slice("/components/".length)))}`;
  }
  const legacyDoc = cleanPath.match(/^\/docs\/(intro|quick-start|integration|design|security-runtime|ai-agents)$/);
  if (legacyDoc) return `${localePrefix}/docs/guides/${legacyDoc[1]}`;
  const legacyReference = cleanPath.match(/^\/docs\/(guide|runtime|security|spec|packages|toolhost|icons|rationale)$/);
  if (legacyReference) {
    const slug = legacyReference[1] === "guide" ? "usage" : legacyReference[1];
    return `${localePrefix}/docs/reference/${slug}`;
  }
  if (cleanPath === "/docs/changelog" || cleanPath === "/changelog") return `${localePrefix}/docs/releases/changelog`;
  return "";
}

Bun.serve({
  hostname,
  port,
  idleTimeout: 255,
  async fetch(request) {
    const url = new URL(request.url);

    const legacyPath = legacyDocsPath(url.pathname);
    if (legacyPath) {
      return Response.redirect(`${url.origin}${legacyPath}${url.hash}`, 308);
    }

    if (enableLiveReload && url.pathname === "/__slexkit/reload") return liveReloadResponse();
    if (url.pathname === "/api/wiki-docs") return wikiDocsResponse();
    if (
      url.pathname === "/slexkit.js" ||
      url.pathname === "/dist/slexkit.js" ||
      url.pathname === "/runtime.js" ||
      url.pathname === "/dist/runtime.js" ||
      url.pathname === "/tooling.js" ||
      url.pathname === "/dist/tooling.js" ||
      url.pathname === "/slexkit.runtime.js" ||
      url.pathname === "/dist/slexkit.runtime.js"
    ) {
      return runtimeResponse(url.pathname);
    }
    if (url.pathname === "/slexkit.css" || url.pathname === "/dist/slexkit.css") {
      return runtimeResponse(url.pathname);
    }
    if (url.pathname.startsWith("/assets/")) return assetResponse(url.pathname);
    if (url.pathname === "/playground.html") {
      return htmlResponse(playgroundHtmlPath);
    }
    if (url.pathname === "/logo.svg" || url.pathname === "/og.svg") {
      const assetPath = join(siteRoot, "assets", url.pathname.slice(1));
      return new Response(await readFile(assetPath), {
        headers: { "content-type": contentType(assetPath), "cache-control": "no-store" },
      });
    }
    if (url.pathname === "/robots.txt") {
      return new Response(renderRobotsTxt({ publicBaseUrl: publicBaseUrl(url) }), {
        headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
      });
    }
    if (url.pathname === "/sitemap.xml") {
      return new Response(renderSitemapXml(seoIndex.pages, { publicBaseUrl: publicBaseUrl(url) }), {
        headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "no-store" },
      });
    }
    if (url.pathname === "/README.md") return readmeResponse();
    if (
      url.pathname === "/llms.txt" ||
      url.pathname === "/llms-full.txt" ||
      url.pathname === "/llms-components.txt" ||
      url.pathname === "/llms-runtime.txt" ||
      url.pathname === "/llms-toolhost.txt" ||
      url.pathname === "/llms-authoring.txt" ||
      url.pathname === "/slexkit-ai-manifest.json"
    ) {
      return aiDocsResponse(url.pathname);
    }
    if (url.pathname.endsWith(".md")) return markdownAssetResponse(url.pathname);
    if (request.headers.get("accept")?.includes("text/markdown")) {
      const markdownPath = `${url.pathname.replace(/\/$/, "")}.md`;
      const markdownResponse = await markdownAssetResponse(markdownPath);
      if (markdownResponse.status !== 404) return markdownResponse;
    }
    if (isAppRoute(url.pathname)) {
      return htmlResponse(htmlPath, {
        page: seoIndex.pageForPath(url.pathname),
        publicBaseUrl: publicBaseUrl(url),
      });
    }

    return new Response("Not found", { status: 404 });
  },
});

if (enableLiveReload) watchRuntimeOutputs();
const displayHost = hostname.includes(":") ? `[${hostname}]` : hostname;
console.log(`slexkit-site listening on http://${displayHost}:${port}`);
