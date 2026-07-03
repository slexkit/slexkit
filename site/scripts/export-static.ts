import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { defaultLocale, sourceLocale, supportedLocales } from "../data/component-docs.js";
import {
  discoverComponentMarkdown,
  discoverExampleMarkdown,
  discoverGuideMarkdown,
  discoverReferenceMarkdown,
  discoverReleaseMarkdown,
  discoverWikiMarkdown,
} from "../data/content-discovery.js";
import { normalizeSiteBase } from "../app/site-base.js";
import { buildSiteAssets } from "./build";
import { generateAiDocs, writeAiRawMarkdown } from "../../scripts/generate-ai-docs";
import { generateStandardArtifacts } from "../../scripts/generate-standard-artifacts";
import { createSeoIndex, injectSeoHead, prerenderedHomeHtml, renderRobotsTxt, renderSitemapXml } from "../data/seo.js";
import { prerenderMarkdown } from "./prerender-markdown.js";
import { loadExampleDocs } from "../data/examples.js";

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

function rewriteRootUrlsForStatic(html: string) {
  const cleanBase = siteBase === "/" ? "" : siteBase.slice(0, -1);
  return html.replace(/(href|src)=(["'])(\/(?!\/)[^"']*)\2/g, (match, attr, quote, path) => {
    if (cleanBase && path.startsWith(cleanBase)) return match;
    return `${attr}=${quote}${withBase(path)}${quote}`;
  });
}

function rewriteHtmlForStatic(html: string, locale = "en-US") {
  const baseMeta = `    <meta name="slexkit-site-base" content="${escapeHtmlAttribute(siteBase)}" />`;
  return rewriteRootUrlsForStatic(html
    .replace(/lang="[^"]*"/, `lang="${locale}"`)
    .replace(/(<meta name="viewport"[^>]*>\s*)/i, `$1\n${baseMeta}`));
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

async function copyExampleMarkdown(locale: string, baseDir = localeOutDir(locale)) {
  await writeMarkdownItems(
    await discoverExampleMarkdown({ siteRoot, locale }),
    join(baseDir, "examples"),
  );
}

async function copyCanonicalMarkdown() {
  await copyGuideMarkdown(sourceLocale, outDir);
  await copyReferenceMarkdown(sourceLocale, outDir);
  await copyReleaseMarkdown(sourceLocale, outDir);
  await copyComponentMarkdown(sourceLocale, outDir);
  await copyExampleMarkdown("zh-CN", outDir);
}

type AdapterDemoName = "assistant-ui" | "streamdown" | "tiptap";

function rewriteAdapterDemoHtml(html: string) {
  return rewriteHtmlForStatic(html, "en-US")
    .replaceAll('"/dist/', `"${withBase("/dist/")}`)
    .replaceAll('"/packages/', `"${withBase("/packages/")}`)
    .replaceAll('"/shared/', `"${withBase("/shared/")}`)
    .replaceAll('"/vendor/', `"${withBase("/vendor/")}`);
}

async function copyAdapterPackage(name: AdapterDemoName) {
  const source = join(projectRoot, "packages", name);
  const target = join(outDir, "packages", name);
  await mkdir(target, { recursive: true });
  await cp(join(source, "style.css"), join(target, "style.css"));
  await cp(join(source, "dist"), join(target, "dist"), { recursive: true });
}

async function copyAdapterDemo(name: AdapterDemoName) {
  const target = join(outDir, "adapter-demos", name);
  await cp(join(projectRoot, "examples", name), target, { recursive: true });

  const indexPath = join(target, "index.html");
  await writeFile(indexPath, rewriteAdapterDemoHtml(await readFile(indexPath, "utf-8")), "utf-8");

  const mainPath = join(target, name === "assistant-ui" ? "main.jsx" : "main.js");
  const mainSource = await readFile(mainPath, "utf-8");
  await writeFile(mainPath, mainSource.replace('from "/shared/adapter-demo.js"', 'from "../../shared/adapter-demo.js"'), "utf-8");
}

async function copyAdapterDemoFiles() {
  await copyAdapterDemo("assistant-ui");
  await copyAdapterDemo("streamdown");
  await copyAdapterDemo("tiptap");
  await cp(join(projectRoot, "examples", "shared"), join(outDir, "shared"), { recursive: true });
  await mkdir(join(outDir, "vendor", "katex"), { recursive: true });
  await cp(join(projectRoot, "node_modules", "katex", "dist", "katex.min.css"), join(outDir, "vendor", "katex", "katex.min.css"));
  await cp(join(projectRoot, "node_modules", "katex", "dist", "fonts"), join(outDir, "vendor", "katex", "fonts"), { recursive: true });
  await cp(join(siteRoot, "content", "examples"), join(outDir, "official-examples"), { recursive: true });
  await copyAdapterPackage("assistant-ui");
  await copyAdapterPackage("streamdown");
  await copyAdapterPackage("tiptap");

  const sharedAdapterPath = join(outDir, "shared", "adapter-demo.js");
  const sharedAdapterSource = await readFile(sharedAdapterPath, "utf-8");
  await writeFile(
    sharedAdapterPath,
    sharedAdapterSource.replace('"/official-examples/', `"${withBase("/official-examples/")}`),
    "utf-8",
  );
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
  await mkdir(join(outDir, "dist"), { recursive: true });
  await cp(join(projectRoot, "dist", "slexkit.js"), join(outDir, "dist", "slexkit.js"));
  await cp(join(projectRoot, "dist", "runtime.js"), join(outDir, "dist", "runtime.js"));
  await cp(join(projectRoot, "dist", "tooling.js"), join(outDir, "dist", "tooling.js"));
  await cp(join(projectRoot, "dist", "slexkit.css"), join(outDir, "dist", "slexkit.css"));
  await writeFile(join(outDir, "slexkit.runtime.js"), 'export * from "./slexkit.js";\n', "utf-8");
  await writeFile(join(outDir, "dist", "slexkit.runtime.js"), 'export * from "../slexkit.js";\n', "utf-8");
  await copyAdapterDemoFiles();
  for (const locale of supportedLocales) {
    await copyComponentMarkdown(locale);
    await copyGuideMarkdown(locale);
    await copyReferenceMarkdown(locale);
    await copyReleaseMarkdown(locale);
    await copyExampleMarkdown(locale);
  }
  await copyCanonicalMarkdown();
  await cp(join(projectRoot, "README.md"), join(outDir, "README.md"));
  await cp(join(projectRoot, "README.zh-CN.md"), join(outDir, "README.zh-CN.md"));
  await cp(join(projectRoot, "CHANGELOG.md"), join(outDir, "CHANGELOG.md"));
  await mkdir(join(outDir, "site"), { recursive: true });
  await cp(join(siteRoot, "assets"), join(outDir, "site", "assets"), { recursive: true });
  await cp(join(siteRoot, "assets", "logo.svg"), join(outDir, "logo.svg"));
  await cp(join(siteRoot, "assets", "og.svg"), join(outDir, "og.svg"));
  await cp(join(projectRoot, "skills"), join(outDir, "skills"), { recursive: true });

  const seoIndex = await createSeoIndex({ siteRoot });
  const rawTemplate = await readFile(join(siteRoot, "index.html"), "utf-8");

  const allWikiMarkdown = await discoverWikiMarkdown({ siteRoot });
  const allExampleMarkdown = (await Promise.all(
    supportedLocales.map((locale) => discoverExampleMarkdown({ siteRoot, locale })),
  )).flat();

  const contentMap = new Map<string, string>();
  for (const locale of supportedLocales) {
    const docs = await import("../data/component-docs.js").then((m) => m.loadWikiDocs({ markdownItems: allWikiMarkdown, locale }));
    for (const doc of docs) {
      if (doc.markdown) contentMap.set(doc.href, doc.markdown);
    }
    const examples = loadExampleDocs({ markdownItems: allExampleMarkdown, locale });
    for (const ex of examples) {
      if (ex.markdown) contentMap.set(ex.href, ex.markdown);
    }
  }

  for (const page of seoIndex.pages) {
    const template = rewriteHtmlForStatic(rawTemplate, page.locale);
    let html = injectSeoHead(template, page, { publicBaseUrl });

    if (page.unlocalizedPath === "/") {
      html = html.replace(
        '<div id="siteRoot"></div>',
        `<div id="siteRoot">${prerenderedHomeHtml(page.locale)}</div>`,
      );
    } else {
      const rawMd = contentMap.get(page.path);
      if (rawMd) {
        const { html: bodyHtml } = prerenderMarkdown(rawMd);
        html = html.replace(
          '<div id="siteRoot"></div>',
          `<div id="siteRoot"><article class="slex-prerendered-content">${rewriteRootUrlsForStatic(bodyHtml)}</article></div>`,
        );
      }
    }

    await writeRouteHtml(page.path, html);
  }

  const indexTemplate = rewriteHtmlForStatic(rawTemplate, "en-US");
  let indexHtml = injectSeoHead(indexTemplate, seoIndex.pageForPath("/"), { publicBaseUrl });
  indexHtml = indexHtml.replace(
    '<div id="siteRoot"></div>',
    `<div id="siteRoot">${prerenderedHomeHtml("en-US")}</div>`,
  );
  await writeFile(join(outDir, "index.html"), indexHtml, "utf-8");
  await writeFile(join(outDir, "404.html"), indexHtml, "utf-8");
  await writeFile(join(outDir, "robots.txt"), renderRobotsTxt({ publicBaseUrl }), "utf-8");

  const buildDate = new Date().toISOString().split("T")[0];
  await writeFile(join(outDir, "sitemap.xml"), renderSitemapXml(seoIndex.pages, { publicBaseUrl, lastmod: buildDate }), "utf-8");

  const playgroundHtml = rewriteHtmlForStatic(await readFile(join(siteRoot, "playground.html"), "utf-8"));
  await writeFile(join(outDir, "playground.html"), playgroundHtml, "utf-8");
  await writeFile(join(outDir, ".nojekyll"), "", "utf-8");
  const aiDocs = await generateAiDocs({ outputDirs: [outDir, join(projectRoot, "dist", "ai")] });
  await generateStandardArtifacts({ outputDirs: [join(outDir, "standard"), join(projectRoot, "dist", "standard")] });
  await writeAiRawMarkdown(outDir, aiDocs.manifest.pages);

  console.log(`Exported static site to ${outDir} with SITE_BASE=${siteBase}`);
}

if (import.meta.main) {
  await exportStaticSite();
}
