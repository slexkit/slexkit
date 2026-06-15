import { loadWikiDocs, supportedLocales } from "./component-docs.js";
import { defaultLocale } from "./locales.js";
import { discoverExampleMarkdown, discoverWikiMarkdown } from "./content-discovery.js";
import { loadExampleDocs } from "./examples.js";

const siteName = "SlexKit";
const defaultDescription =
  "\"Docs as tools, tools as docs\" gives Markdown interactive power, making AI output come alive.";
const homeDescriptions = {
  "en-US": defaultDescription,
  "zh-CN": "\"文档即工具，工具即文档\"，赋予 Markdown 可交互的能力，让 AI 的输出变得生动。",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function normalizePath(path) {
  const value = String(path || "/").split(/[?#]/)[0] || "/";
  if (value === "/") return "/";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function unlocalizedPath(path) {
  const normalized = normalizePath(path);
  const match = normalized.match(/^\/([^/]+)(\/.*)?$/);
  if (match && supportedLocales.includes(match[1])) return match[2] || "/";
  return normalized;
}

function localizedPath(path, locale) {
  const base = unlocalizedPath(path);
  return locale === defaultLocale ? base : `/${locale}${base === "/" ? "/" : base}`;
}

function localeCode(locale) {
  return locale.replace("-", "_");
}

function normalizePublicBaseUrl(publicBaseUrl = "https://slexkit.github.io/slexkit/") {
  const value = String(publicBaseUrl || "").trim() || "https://slexkit.github.io/slexkit/";
  return value.endsWith("/") ? value : `${value}/`;
}

export function absoluteSiteUrl(path, publicBaseUrl) {
  const base = normalizePublicBaseUrl(publicBaseUrl);
  const clean = normalizePath(path).replace(/^\/+/, "");
  return new URL(clean, base).toString();
}

function normalizeDescription(value) {
  const text = String(value || defaultDescription).replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text;
}

function createPage({ path, locale, title, description, kind = "website", canonicalPath = path }) {
  const nextPath = normalizePath(path);
  const basePath = unlocalizedPath(canonicalPath);
  return {
    path: nextPath,
    key: normalizePath(nextPath),
    locale,
    title,
    description: normalizeDescription(description),
    kind,
    canonicalPath: localizedPath(basePath, locale),
    unlocalizedPath: basePath,
  };
}

function homePage(locale) {
  return createPage({
    path: localizedPath("/", locale),
    locale,
    title: locale === "zh-CN" ? "SlexKit - 交互式 Markdown UI 运行时" : "SlexKit - Streaming Live EXpressions Kit",
    description: homeDescriptions[locale] ?? defaultDescription,
    kind: "website",
    canonicalPath: "/",
  });
}

function docsIndexPage(locale) {
  return createPage({
    path: localizedPath("/docs", locale),
    locale,
    title: locale === "zh-CN" ? "文档 - SlexKit" : "Docs - SlexKit",
    description: locale === "zh-CN" ? "浏览 SlexKit 指南、组件和参考文档。" : "Browse SlexKit guides, components, and reference documentation.",
    canonicalPath: "/docs/guides/intro",
  });
}

function examplesIndexPage(locale) {
  return createPage({
    path: localizedPath("/examples", locale),
    locale,
    title: locale === "zh-CN" ? "示例中心 - SlexKit" : "Examples - SlexKit",
    description: locale === "zh-CN"
      ? "浏览 SlexKit 面向 AI 输出、工程文档和交互式知识表达的高质量示例。"
      : "Browse high-quality SlexKit examples for AI output, engineering docs, and interactive knowledge surfaces.",
    canonicalPath: "/examples",
  });
}

function legacyPage(path, canonicalPath, locale = defaultLocale) {
  return createPage({
    path: localizedPath(path, locale),
    locale,
    title: `${siteName} - ${unlocalizedPath(canonicalPath).split("/").filter(Boolean).pop() ?? "Docs"}`,
    description: defaultDescription,
    canonicalPath,
  });
}

function docPage(doc) {
  return createPage({
    path: doc.href,
    locale: doc.locale,
    title: `${doc.title} - ${siteName}`,
    description: doc.summary || defaultDescription,
    kind: "article",
    canonicalPath: doc.href,
  });
}

export async function createSeoIndex({ siteRoot }) {
  const markdown = await discoverWikiMarkdown({ siteRoot });
  const exampleMarkdown = (await Promise.all(supportedLocales.map((locale) => discoverExampleMarkdown({ siteRoot, locale })))).flat();
  const pages = [];

  for (const locale of supportedLocales) {
    pages.push(homePage(locale), docsIndexPage(locale), examplesIndexPage(locale));
    const docs = await loadWikiDocs({ markdownItems: markdown, locale });
    pages.push(...docs.map(docPage));
    const examples = loadExampleDocs({ markdownItems: exampleMarkdown, locale });
    pages.push(...examples.map(docPage));
  }

  for (const locale of supportedLocales) {
    pages.push(legacyPage("/components", "/docs/components/accordion", locale));
    pages.push(legacyPage("/design", "/docs/guides/design", locale));
  }

  const byPath = new Map();
  for (const page of pages) {
    byPath.set(normalizePath(page.path), page);
  }

  return {
    pages,
    byPath,
    pageForPath(path) {
      const normalized = normalizePath(path);
      return byPath.get(normalized) ?? byPath.get(unlocalizedPath(normalized)) ?? homePage(defaultLocale);
    },
  };
}

export function seoAlternates(page) {
  return supportedLocales.map((locale) => ({
    locale,
    path: localizedPath(page.unlocalizedPath, locale),
  }));
}

export function seoHead(page, { publicBaseUrl, imagePath = "/og.svg" } = {}) {
  const canonicalUrl = absoluteSiteUrl(page.canonicalPath, publicBaseUrl);
  const imageUrl = absoluteSiteUrl(imagePath, publicBaseUrl);
  const alternates = seoAlternates(page);
  const alternateTags = alternates
    .map((entry) => `  <link rel="alternate" hreflang="${entry.locale}" href="${escapeHtml(absoluteSiteUrl(entry.path, publicBaseUrl))}" />`)
    .join("\n");
  const defaultAlternate = alternates.find((entry) => entry.locale === defaultLocale) ?? alternates[0];

  return [
    "<!-- slexkit:seo:start -->",
    `  <meta name="description" content="${escapeHtml(page.description)}" />`,
    '  <meta name="robots" content="index,follow" />',
    `  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    alternateTags,
    defaultAlternate
      ? `  <link rel="alternate" hreflang="x-default" href="${escapeHtml(absoluteSiteUrl(defaultAlternate.path, publicBaseUrl))}" />`
      : "",
    `  <meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `  <meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `  <meta property="og:type" content="${page.kind === "article" ? "article" : "website"}" />`,
    `  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `  <meta property="og:site_name" content="${siteName}" />`,
    `  <meta property="og:locale" content="${localeCode(page.locale)}" />`,
    ...supportedLocales
      .filter((locale) => locale !== page.locale)
      .map((locale) => `  <meta property="og:locale:alternate" content="${localeCode(locale)}" />`),
    `  <meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
    '  <meta property="og:image:type" content="image/svg+xml" />',
    '  <meta name="twitter:card" content="summary_large_image" />',
    `  <meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `  <meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`,
    "<!-- slexkit:seo:end -->",
  ].filter(Boolean).join("\n");
}

export function injectSeoHead(html, page, options = {}) {
  const title = `<title>${escapeHtml(page.title)}</title>`;
  const tags = seoHead(page, options);
  const withoutSeo = String(html).replace(/\n?\s*<!-- slexkit:seo:start -->[\s\S]*?<!-- slexkit:seo:end -->/g, "");
  const withTitle = withoutSeo.match(/<title>[\s\S]*?<\/title>/i)
    ? withoutSeo.replace(/<title>[\s\S]*?<\/title>/i, title)
    : withoutSeo.replace(/<\/head>/i, `  ${title}\n</head>`);
  return withTitle.replace(/(<title>[\s\S]*?<\/title>)/i, `$1\n${tags}`);
}

export function renderRobotsTxt({ publicBaseUrl }) {
  return [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${absoluteSiteUrl("/sitemap.xml", publicBaseUrl)}`,
    "",
  ].join("\n");
}

export function renderSitemapXml(pages, { publicBaseUrl }) {
  const canonicalPages = pages.filter((page) => page.path === localizedPath(page.unlocalizedPath, page.locale));
  const urls = canonicalPages.map((page) => {
    const alternates = seoAlternates(page)
      .map((entry) => `    <xhtml:link rel="alternate" hreflang="${entry.locale}" href="${escapeXml(absoluteSiteUrl(entry.path, publicBaseUrl))}" />`)
      .join("\n");
    const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteSiteUrl(localizedPath(page.unlocalizedPath, defaultLocale), publicBaseUrl))}" />`;
    return [
      "  <url>",
      `    <loc>${escapeXml(absoluteSiteUrl(page.path, publicBaseUrl))}</loc>`,
      alternates,
      xDefault,
      "  </url>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
