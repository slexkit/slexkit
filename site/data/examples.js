import { extractMarkdownToc } from "../markdown/headings.js";
import { parseDiscoveryFrontmatter } from "./content-discovery.js";
import { defaultLocale, localePrefix, normalizeLocale } from "./locales.js";

export const exampleSourceLocale = "zh-CN";

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function booleanFrontmatter(value) {
  return value === true || value === "true";
}

function listFrontmatter(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function exampleHref(locale, path) {
  return `${localePrefix(locale)}${path}`;
}

function normalizeSlexKitRenderMode(value, fallback = "component") {
  const mode = String(value ?? "").toLowerCase();
  if (mode === "component" || mode === "render" || mode === "preview") return "component";
  if (mode === "playground" || mode === "editor" || mode === "workbench") return "playground";
  return fallback;
}

export function parseExampleDoc(item, options = {}) {
  const locale = normalizeLocale(options.locale ?? item.locale ?? defaultLocale);
  const contentLocale = normalizeLocale(item.contentLocale ?? exampleSourceLocale);
  const slug = item.slug || String(item.path || "").match(/content\/examples\/([^/]+)\//)?.[1] || "";
  const { data, body } = parseDiscoveryFrontmatter(item.content ?? item.markdown ?? "");
  const order = Number(data.order ?? 999);

  return {
    id: `examples/${slug}`,
    kind: "example",
    slug,
    locale,
    contentLocale,
    isFallback: Boolean(item.isFallback ?? contentLocale !== locale),
    title: data.title || titleFromSlug(slug),
    category: data.category || "综合示例",
    group: "Examples",
    groupKey: "examples",
    status: data.status || "draft",
    summary: data.summary || "",
    order: Number.isFinite(order) ? order : 999,
    tags: listFrontmatter(data.tags),
    components: listFrontmatter(data.components),
    difficulty: data.difficulty || "入门",
    runtime: data.runtime || "trusted",
    featured: booleanFrontmatter(data.featured),
    href: exampleHref(locale, `/examples/${encodeURIComponent(slug)}`),
    markdownHref: exampleHref(contentLocale, `/examples/${encodeURIComponent(slug)}.md`),
    sourcePath: item.path ?? `content/examples/${slug}/${contentLocale}.md`,
    markdown: body,
    toc: extractMarkdownToc(body),
    slexkitRenderMode: normalizeSlexKitRenderMode(data.slexkitRenderMode, "component"),
  };
}

export function sortExampleDocs(docs) {
  return [...docs].sort(
    (a, b) =>
      a.order - b.order ||
      a.category.localeCompare(b.category, "zh-CN") ||
      a.title.localeCompare(b.title, "zh-CN"),
  );
}

export function loadExampleDocs({ markdownItems = [], locale = defaultLocale } = {}) {
  const nextLocale = normalizeLocale(locale);
  return sortExampleDocs(
    markdownItems
      .filter((item) => normalizeLocale(item.locale ?? nextLocale) === nextLocale)
      .map((item) => parseExampleDoc(item, { locale: nextLocale })),
  );
}
