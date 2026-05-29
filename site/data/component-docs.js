import { findSpecBlocks, assertComponentSpecBlocks } from "../markdown/directives.js";
import { extractMarkdownToc } from "../markdown/headings.js";
import { defaultLocale, docsHref, normalizeLocale, sourceLocale, supportedLocales } from "./locales.js";
import { siteUiLabelsForLocale } from "./ui-labels.js";
import {
  componentCategoryLabels,
  componentCategoryRank,
  componentStatusLabels,
  componentTitleForLocale,
  publicComponentSlugs,
} from "./doc-metadata.js";
import { exportComponentSpecManifest, localizedComponentSpec } from "./spec-docs.js";

export {
  componentCategoryRank,
  defaultLocale,
  exportComponentSpecManifest,
  publicComponentSlugs,
  siteUiLabelsForLocale,
  sourceLocale,
  supportedLocales,
};

function basename(path, ext) {
  return path.split("/").pop().replace(new RegExp(`${ext}$`), "");
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeWikiPath(path) {
  return String(path ?? "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function inferPathInfo(path) {
  const normalized = normalizeWikiPath(path);
  let match = normalized.match(/(?:^|\/)content\/components\/([^/]+)\/([^/]+)\.md$/);
  if (match) return { kind: "component", slug: match[1], contentLocale: normalizeLocale(match[2]) };

  match = normalized.match(/(?:^|\/)content\/guides\/([^/]+)\/([^/]+)\.md$/);
  if (match) return { kind: "guide", slug: match[1], contentLocale: normalizeLocale(match[2]) };

  match = normalized.match(/(?:^|\/)content\/reference\/([^/]+)\/([^/]+)\.md$/);
  if (match) return { kind: "reference", slug: match[1], contentLocale: normalizeLocale(match[2]) };

  match = normalized.match(/(?:^|\/)content\/releases\/([^/]+)\/([^/]+)\.md$/);
  if (match) return { kind: "release", slug: match[1], contentLocale: normalizeLocale(match[2]) };

  match = normalized.match(/(?:^|\/)content\/([^/]+)\/components\/([^/]+)\.md$/);
  if (match) return { kind: "component", slug: match[2], contentLocale: normalizeLocale(match[1]) };

  match = normalized.match(/(?:^|\/)content\/([^/]+)\/guides\/([^/]+)\.md$/);
  if (match) return { kind: "guide", slug: match[2], contentLocale: normalizeLocale(match[1]) };

  match = normalized.match(/(?:^|\/)content\/([^/]+)\/reference\/([^/]+)\.md$/);
  if (match) return { kind: "reference", slug: match[2], contentLocale: normalizeLocale(match[1]) };

  match = normalized.match(/(?:^|\/)content\/([^/]+)\/releases\/([^/]+)\.md$/);
  if (match) return { kind: "release", slug: match[2], contentLocale: normalizeLocale(match[1]) };

  match = normalized.match(/(?:^|\/)content\/components\/([^/]+)\.md$/);
  if (match) return { kind: "component", slug: match[1], contentLocale: sourceLocale };

  match = normalized.match(/(?:^|\/)content\/guides\/([^/]+)\.md$/);
  if (match) return { kind: "guide", slug: match[1], contentLocale: sourceLocale };

  match = normalized.match(/(?:^|\/)content\/reference\/([^/]+)\.md$/);
  if (match) return { kind: "reference", slug: match[1], contentLocale: sourceLocale };

  match = normalized.match(/(?:^|\/)content\/releases\/([^/]+)\.md$/);
  if (match) return { kind: "release", slug: match[1], contentLocale: sourceLocale };

  return { kind: "", slug: basename(normalized, "\\.md"), contentLocale: defaultLocale };
}

function parseFrontmatter(rawInput) {
  const raw = String(rawInput).replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!raw.startsWith("---")) return { data: {}, body: raw.trim() };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: raw.trim() };

  const data = {};
  const block = raw.slice(3, end).trim();
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    data[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }

  const closeEnd = raw.indexOf("\n", end + 1);
  return { data, body: raw.slice(closeEnd === -1 ? raw.length : closeEnd + 1).trim() };
}

function escapeAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function blockHashSignature(markdown) {
  return Object.fromEntries(
    findSpecBlocks(markdown).map((block) => [
      `${block.kind}:${block.attrs.id ?? "default"}`,
      block.attrs.sourceHash ?? "",
    ]),
  );
}

function isStaleAgainstSource(markdown, sourceMarkdown) {
  if (!sourceMarkdown) return false;
  const current = blockHashSignature(markdown);
  const source = blockHashSignature(sourceMarkdown);
  return Object.entries(source).some(([key, sourceHash]) => current[key] && current[key] !== sourceHash);
}

function normalizeSlexKitRenderMode(value, fallback = "playground") {
  const mode = String(value ?? "").toLowerCase();
  if (mode === "component" || mode === "render" || mode === "preview") return "component";
  if (mode === "playground" || mode === "editor" || mode === "workbench") return "playground";
  return fallback;
}

export function parseMarkdownComponentDoc(path, raw, options = {}) {
  const info = inferPathInfo(path);
  const locale = normalizeLocale(options.locale ?? info.contentLocale);
  const contentLocale = normalizeLocale(options.contentLocale ?? info.contentLocale ?? locale);
  const labels = siteUiLabelsForLocale(locale);
  const slug = options.slug ?? info.slug;
  const { data, body } = parseFrontmatter(raw);
  const spec = localizedComponentSpec(slug, contentLocale);

  if (contentLocale === sourceLocale) {
    assertComponentSpecBlocks(body, slug);
  } else if (findSpecBlocks(body).length) {
    assertComponentSpecBlocks(body, slug);
  }

  const order = Number(data.order ?? 999);
  const title = componentTitleForLocale(slug, spec?.title || data.title || titleFromSlug(slug), locale, contentLocale);
  const isFallback = Boolean(options.isFallback ?? contentLocale !== locale);
  const sourceMarkdown = options.sourceMarkdown ?? "";

  return {
    id: `components/${slug}`,
    slug,
    locale,
    contentLocale,
    isFallback,
    isStale: Boolean(options.isStale ?? isStaleAgainstSource(body, sourceMarkdown)),
    title,
    category: spec?.category || data.category || "Component",
    categoryLabel: locale === "zh-CN" ? componentCategoryLabels[spec?.category || data.category || "Component"] : spec?.category || data.category || "Component",
    group: labels.componentsGroup,
    groupKey: "components",
    status: spec?.status || data.status || "draft",
    statusLabel: locale === "zh-CN" ? componentStatusLabels[spec?.status || data.status || "draft"] : spec?.status || data.status || "draft",
    summary: spec?.summary || data.summary || "",
    spec,
    order: Number.isFinite(order) ? order : 999,
    href: docsHref(locale, `/docs/components/${encodeURIComponent(slug)}`),
    markdownHref: docsHref(contentLocale, `/docs/components/${encodeURIComponent(slug)}.md`),
    bodyHtml: `<div data-markdown-doc="${escapeAttribute(slug)}"></div>`,
    sourceType: "markdown",
    markdown: body,
    toc: extractMarkdownToc(body),
    slexkitRenderMode: normalizeSlexKitRenderMode(data.slexkitRenderMode, "playground"),
  };
}

export function parseMarkdownGuideDoc(path, raw, metadata = {}) {
  const info = inferPathInfo(path);
  const locale = normalizeLocale(metadata.locale ?? info.contentLocale);
  const contentLocale = normalizeLocale(metadata.contentLocale ?? info.contentLocale ?? locale);
  const labels = siteUiLabelsForLocale(locale);
  const { data, body } = parseFrontmatter(raw);
  const slug = metadata.slug || data.slug || info.slug;
  const id = metadata.id || `guides/${slug}`;
  const title = data.title || metadata.title || titleFromSlug(slug);
  const order = Number(data.order ?? metadata.order ?? 999);
  const isFallback = Boolean(metadata.isFallback ?? contentLocale !== locale);

  return {
    id,
    slug,
    locale,
    contentLocale,
    isFallback,
    isStale: Boolean(metadata.isStale),
    title,
    category: metadata.category || data.category || "Guides",
    group: metadata.group || data.group || labels.guidesGroup,
    groupKey: metadata.groupKey || data.groupKey || "guides",
    status: data.status || metadata.status || "ready",
    statusLabel: locale === "zh-CN" ? componentStatusLabels[data.status || metadata.status || "ready"] : data.status || metadata.status || "ready",
    summary: data.summary || metadata.summary || "",
    order: Number.isFinite(order) ? order : 999,
    href: metadata.href || docsHref(locale, `/docs/guides/${encodeURIComponent(slug)}`),
    markdownHref: metadata.markdownHref || docsHref(contentLocale, `/docs/guides/${encodeURIComponent(slug)}.md`),
    bodyHtml: `<div data-markdown-doc="${escapeAttribute(slug)}"></div>`,
    sourceType: "markdown",
    markdown: body,
    toc: extractMarkdownToc(body),
    includeTitleInToc: Boolean(metadata.includeTitleInToc),
    slexkitRenderMode: normalizeSlexKitRenderMode(data.slexkitRenderMode ?? metadata.slexkitRenderMode, "playground"),
  };
}

export function sortComponentDocs(docs) {
  return [...docs].sort(
    (a, b) =>
      componentCategoryRank(a.category) - componentCategoryRank(b.category) ||
      a.order - b.order ||
      a.title.localeCompare(b.title),
  );
}

export async function loadComponentDocs({ markdownModules = {}, locale = defaultLocale } = {}) {
  const nextLocale = normalizeLocale(locale);
  const markdownDocs = await Promise.all(
    Object.entries(markdownModules)
      .filter(([path]) => publicComponentSlugs.has(inferPathInfo(path).slug))
      .map(async ([path, loader]) => parseMarkdownComponentDoc(path, await loader(), { locale: nextLocale })),
  );
  return sortComponentDocs(markdownDocs);
}

export function sortWikiDocs(docs) {
  const groupRank = new Map([
    ["guides", 0],
    ["components", 1],
    ["reference", 2],
    ["releases", 3],
    ["api", 4],
    ["Guides", 0],
    ["指南", 0],
    ["Components", 1],
    ["组件", 1],
    ["Reference", 2],
    ["参考", 2],
    ["Releases", 3],
    ["发布", 3],
    ["API Reference", 4],
    ["API 参考", 4],
  ]);

  return [...docs].sort((a, b) => {
    const groupA = groupRank.has(a.groupKey) ? groupRank.get(a.groupKey) : groupRank.has(a.group) ? groupRank.get(a.group) : 99;
    const groupB = groupRank.has(b.groupKey) ? groupRank.get(b.groupKey) : groupRank.has(b.group) ? groupRank.get(b.group) : 99;
    return (
      groupA - groupB ||
      componentCategoryRank(a.category) - componentCategoryRank(b.category) ||
      a.order - b.order ||
      a.title.localeCompare(b.title)
    );
  });
}

export function parseWikiDoc(item, options = {}) {
  const path = normalizeWikiPath(item.path ?? item.sourcePath);
  const locale = normalizeLocale(item.locale ?? options.locale ?? inferPathInfo(path).contentLocale);
  const contentLocale = normalizeLocale(item.contentLocale ?? inferPathInfo(path).contentLocale);

  if (item.kind === "component" || inferPathInfo(path).kind === "component") {
    return parseMarkdownComponentDoc(path, item.content ?? item.markdown ?? "", {
      locale,
      contentLocale,
      slug: item.slug,
      isFallback: item.isFallback,
      isStale: item.isStale,
      sourceMarkdown: item.sourceMarkdown,
    });
  }

  const metadata = { ...item, locale, contentLocale };
  return parseMarkdownGuideDoc(path, item.content ?? item.markdown ?? "", {
    ...metadata,
    locale,
    contentLocale,
    isFallback: item.isFallback,
    isStale: item.isStale,
  });
}

export function parseWikiItems(items = [], options = {}) {
  const locale = normalizeLocale(options.locale ?? defaultLocale);
  return items
    .filter((item) => normalizeLocale(item.locale ?? locale) === locale)
    .map((item) => parseWikiDoc(item, { locale }))
    .filter((doc) => doc.groupKey !== "components" || publicComponentSlugs.has(doc.slug));
}

export async function loadWikiDocs({
  guideMarkdownModules = {},
  componentMarkdownModules = {},
  markdownItems = null,
  locale = defaultLocale,
} = {}) {
  const nextLocale = normalizeLocale(locale);
  if (Array.isArray(markdownItems)) {
    return sortWikiDocs(parseWikiItems(markdownItems, { locale: nextLocale }));
  }

  const guides = await Promise.all(
    Object.entries(guideMarkdownModules).map(async ([path, loader]) =>
      parseWikiDoc({ kind: "guide", path, content: await loader(), locale: nextLocale }, { locale: nextLocale }),
    ),
  );
  const components = await Promise.all(
    Object.entries(componentMarkdownModules)
      .filter(([path]) => publicComponentSlugs.has(inferPathInfo(path).slug))
      .map(async ([path, loader]) =>
        parseWikiDoc({ kind: "component", path, content: await loader(), locale: nextLocale }, { locale: nextLocale }),
      ),
  );

  return sortWikiDocs([...guides, ...components].filter((doc) => doc.groupKey !== "components" || publicComponentSlugs.has(doc.slug)));
}
