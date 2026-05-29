import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { defaultLocale, sourceLocale, supportedLocales } from "../data/component-docs.js";
import {
  discoverComponentMarkdown,
  discoverGuideMarkdown,
  discoverReferenceMarkdown,
  discoverReleaseMarkdown,
} from "../data/content-discovery.js";
import { normalizeSiteBase } from "../app/site-base.js";
import { buildSiteAssets } from "./build";
import { generateAiDocs, writeAiRawMarkdown } from "../../scripts/generate-ai-docs";
import { createSeoIndex, injectSeoHead, renderRobotsTxt, renderSitemapXml } from "../data/seo.js";

const siteRoot = join(import.meta.dir, "..");
const projectRoot = join(siteRoot, "..");
const assetDir = join(siteRoot, ".bun-dist");
const outDir = join(projectRoot, "site-static");
const siteBase = normalizeSiteBase(Bun.env.SITE_BASE ?? "/slexkit/");
const publicBaseUrl = normalizePublicBaseUrl(Bun.env.SITE_URL ?? `https://slexkit.github.io${siteBase}`);

function normalizePublicBaseUrl(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

function escapeHtmlAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function withBase(path: string) {
  const cleanBase = siteBase === "/" ? "" : siteBase.slice(0, -1);
  if (path === "/") return siteBase;
  return `${cleanBase}${path}`;
}

function rewriteHtmlForStatic(html: string) {
  const baseMeta = `    <meta name="slexkit-site-base" content="${escapeHtmlAttribute(siteBase)}" />`;
  const cleanBase = siteBase === "/" ? "" : siteBase.slice(0, -1);
  return html
    .replace(/(<meta name="viewport"[^>]*>\s*)/i, `$1\n${baseMeta}`)
    .replace(/(href|src)=(["'])(\/(?!\/)[^"']*)\2/g, (match, attr, quote, path) => {
      if (cleanBase && path.startsWith(cleanBase)) return match;
      return `${attr}=${quote}${withBase(path)}${quote}`;
    });
}

function localeOutDir(locale: string) {
  return locale === defaultLocale ? outDir : join(outDir, locale);
}

async function writeMarkdownItems(items: Array<{ slug: string; content: string }>, targetDir: string) {
  await mkdir(targetDir, { recursive: true });
  for (const item of items) {
    await writeFile(join(targetDir, `${item.slug}.md`), item.content, "utf-8");
  }
}

async function copyGuideMarkdown(locale: string, baseDir = localeOutDir(locale)) {
  await writeMarkdownItems(
    await discoverGuideMarkdown({ siteRoot, locale }),
    join(baseDir, "docs", "guides"),
  );
}

async function copyComponentMarkdown(locale: string, baseDir = localeOutDir(locale)) {
  await writeMarkdownItems(
    await discoverComponentMarkdown({ siteRoot, locale }),
    join(baseDir, "docs", "components"),
  );
}

async function copyReferenceMarkdown(locale: string, baseDir = localeOutDir(locale)) {
  await writeMarkdownItems(
    await discoverReferenceMarkdown({ siteRoot, locale }),
    join(baseDir, "docs", "reference"),
  );
}

async function copyReleaseMarkdown(locale: string, baseDir = localeOutDir(locale)) {
  await writeMarkdownItems(
    await discoverReleaseMarkdown({ siteRoot, locale }),
    join(baseDir, "docs", "releases"),
  );
}

async function copyCanonicalMarkdown() {
  await copyGuideMarkdown(sourceLocale, outDir);
  await copyReferenceMarkdown(sourceLocale, outDir);
  await copyReleaseMarkdown(sourceLocale, outDir);
  await copyComponentMarkdown(sourceLocale, outDir);
}

function routeOutputPath(routePath: string) {
  const clean = routePath.replace(/^\/+|\/+$/g, "");
  return clean ? join(outDir, clean, "index.html") : join(outDir, "index.html");
}

async function writeRouteHtml(routePath: string, html: string) {
  const target = routeOutputPath(routePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, html, "utf-8");
}

export async function exportStaticSite() {
  await buildSiteAssets();
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  await cp(assetDir, join(outDir, "assets"), { recursive: true });
  await cp(join(projectRoot, "dist", "slexkit.js"), join(outDir, "slexkit.js"));
  await cp(join(projectRoot, "dist", "runtime.js"), join(outDir, "runtime.js"));
  await cp(join(projectRoot, "dist", "tooling.js"), join(outDir, "tooling.js"));
  await cp(join(projectRoot, "dist", "slexkit.css"), join(outDir, "slexkit.css"));
  for (const locale of supportedLocales) {
    await copyComponentMarkdown(locale);
    await copyGuideMarkdown(locale);
    await copyReferenceMarkdown(locale);
    await copyReleaseMarkdown(locale);
  }
  await copyCanonicalMarkdown();
  await cp(join(projectRoot, "README.md"), join(outDir, "README.md"));
  await cp(join(projectRoot, "README.zh-CN.md"), join(outDir, "README.zh-CN.md"));
  await cp(join(projectRoot, "CHANGELOG.md"), join(outDir, "CHANGELOG.md"));
  await cp(join(siteRoot, "assets", "logo.svg"), join(outDir, "logo.svg"));
  await cp(join(siteRoot, "assets", "og.svg"), join(outDir, "og.svg"));
  await cp(join(projectRoot, "skills"), join(outDir, "skills"), { recursive: true });

  const seoIndex = await createSeoIndex({ siteRoot });
  const indexTemplate = rewriteHtmlForStatic(await readFile(join(siteRoot, "index.html"), "utf-8"));
  for (const page of seoIndex.pages) {
    await writeRouteHtml(page.path, injectSeoHead(indexTemplate, page, { publicBaseUrl }));
  }
  const indexHtml = injectSeoHead(indexTemplate, seoIndex.pageForPath("/"), { publicBaseUrl });
  await writeFile(join(outDir, "index.html"), indexHtml, "utf-8");
  await writeFile(join(outDir, "404.html"), indexHtml, "utf-8");
  await writeFile(join(outDir, "robots.txt"), renderRobotsTxt({ publicBaseUrl }), "utf-8");
  await writeFile(join(outDir, "sitemap.xml"), renderSitemapXml(seoIndex.pages, { publicBaseUrl }), "utf-8");

  const playgroundHtml = rewriteHtmlForStatic(await readFile(join(siteRoot, "playground.html"), "utf-8"));
  await writeFile(join(outDir, "playground.html"), playgroundHtml, "utf-8");
  await writeFile(join(outDir, ".nojekyll"), "", "utf-8");
  const aiDocs = await generateAiDocs({ outputDirs: [outDir, join(projectRoot, "dist", "ai")] });
  await writeAiRawMarkdown(outDir, aiDocs.manifest.pages);

  console.log(`Exported static site to ${outDir} with SITE_BASE=${siteBase}`);
}

if (import.meta.main) {
  await exportStaticSite();
}
