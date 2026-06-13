import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { publicComponentTypes } from "../../src/components/spec-registry";
import { docsHref, normalizeLocale, sourceLocale, supportedLocales } from "./locales.js";
import { siteUiLabelsForLocale } from "./ui-labels.js";

const publicComponentSlugs = new Set(publicComponentTypes);
const exampleSourceLocale = "zh-CN";

const allowedExampleSlugs = new Set([
  "hello-slexkit",
  "first-interaction",
  "tabs-and-branching",
  "multi-input-coordination",
  "form-wizard-steps",
  "ai-chat-message",
  "ai-data-analysis",
  "form-submit-workflow",
  "technical-whitepaper",
  "cross-doc-state-lab",
  "retrieval-evidence-card",
  "baud-rate-calculator",
  "buck-converter-calculator",
  "rc-low-pass-filter",
  "toolhost-confirm",
  "toolhost-choose",
  "toolhost-fill-form",
  "secure-policy",
  "secure-sandbox",
  "network-policy-fetch-card",
  "multi-fence-report",
  "ai-conversation-flow",
  "multi-card-coordination",
  "project-dashboard",
  "search-filter-table",
]);

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseDiscoveryFrontmatter(rawInput) {
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

function booleanFrontmatter(value) {
  return value === true || value === "true";
}

async function readOptional(siteRoot, relative) {
  try {
    return await readFile(join(siteRoot, relative), "utf-8");
  } catch {
    return null;
  }
}

async function directorySlugs(root) {
  const entries = await readdir(root, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

const collectionConfig = {
  guides: {
    kind: "guide",
    groupKey: "guides",
    groupLabelKey: "guidesGroup",
    routeBase: "/docs/guides",
    defaultCategory: "Guides",
  },
  reference: {
    kind: "reference",
    groupKey: "reference",
    groupLabelKey: "referenceGroup",
    routeBase: "/docs/reference",
    defaultCategory: "Reference",
  },
  releases: {
    kind: "release",
    groupKey: "releases",
    groupLabelKey: "releasesGroup",
    routeBase: "/docs/releases",
    defaultCategory: "Releases",
  },
};

function pageMetadata(collection, slug, locale, contentLocale, content) {
  const config = collectionConfig[collection] ?? collectionConfig.guides;
  const labels = siteUiLabelsForLocale(locale);
  const { data } = parseDiscoveryFrontmatter(content);
  const order = Number(data.order ?? 999);
  return {
    id: `${config.groupKey}/${slug}`,
    slug,
    title: data.title || titleFromSlug(slug),
    category: data.category || config.defaultCategory,
    group: data.group || labels[config.groupLabelKey] || config.defaultCategory,
    groupKey: config.groupKey,
    status: data.status || "ready",
    summary: data.summary || "",
    order: Number.isFinite(order) ? order : 999,
    href: docsHref(locale, `${config.routeBase}/${slug}`),
    markdownHref: docsHref(contentLocale, `${config.routeBase}/${slug}.md`),
    sourcePath: `content/${collection}/${slug}/${locale}.md`,
    fallbackSourcePath: `content/${collection}/${slug}/${sourceLocale}.md`,
    includeTitleInToc: booleanFrontmatter(data.includeTitleInToc),
    slexkitRenderMode: data.slexkitRenderMode,
  };
}

async function readLocalizedMarkdown({ siteRoot, kind, slug, locale, sourcePath, fallbackPath }) {
  const collection = kind === "guide" ? "guides" : kind === "reference" ? "reference" : kind === "release" ? "releases" : "";
  const content = await readOptional(siteRoot, sourcePath);
  if (content !== null) {
    const sourceMarkdown = locale === sourceLocale ? "" : await readOptional(siteRoot, fallbackPath);
    return {
      kind,
      slug,
      locale,
      contentLocale: locale,
      isFallback: false,
      path: sourcePath,
      content,
      sourceMarkdown,
      ...(collection ? pageMetadata(collection, slug, locale, locale, content) : {}),
    };
  }

  const fallback = await readOptional(siteRoot, fallbackPath);
  if (fallback !== null) {
    return {
      kind,
      slug,
      locale,
      contentLocale: sourceLocale,
      isFallback: true,
      path: fallbackPath,
      content: fallback,
      ...(collection ? pageMetadata(collection, slug, locale, sourceLocale, fallback) : {}),
    };
  }

  return null;
}

export async function discoverGuideMarkdown({ siteRoot, locale }) {
  const nextLocale = normalizeLocale(locale);
  const root = join(siteRoot, "content", "guides");
  const slugs = await directorySlugs(root);
  const docs = await Promise.all(
    slugs.map((slug) =>
      readLocalizedMarkdown({
        siteRoot,
        kind: "guide",
        slug,
        locale: nextLocale,
        sourcePath: `content/guides/${slug}/${nextLocale}.md`,
        fallbackPath: `content/guides/${slug}/${sourceLocale}.md`,
      }),
    ),
  );
  return docs.filter(Boolean);
}

async function discoverPageMarkdown({ siteRoot, locale, collection }) {
  const config = collectionConfig[collection];
  const nextLocale = normalizeLocale(locale);
  const root = join(siteRoot, "content", collection);
  const slugs = await directorySlugs(root);
  const docs = await Promise.all(
    slugs.map((slug) =>
      readLocalizedMarkdown({
        siteRoot,
        kind: config.kind,
        slug,
        locale: nextLocale,
        sourcePath: `content/${collection}/${slug}/${nextLocale}.md`,
        fallbackPath: `content/${collection}/${slug}/${sourceLocale}.md`,
      }),
    ),
  );
  return docs.filter(Boolean);
}

export function discoverReferenceMarkdown(options) {
  return discoverPageMarkdown({ ...options, collection: "reference" });
}

export function discoverReleaseMarkdown(options) {
  return discoverPageMarkdown({ ...options, collection: "releases" });
}

export async function discoverComponentMarkdown({ siteRoot, locale }) {
  const nextLocale = normalizeLocale(locale);
  const root = join(siteRoot, "content", "components");
  const slugs = (await directorySlugs(root)).filter((slug) => publicComponentSlugs.has(slug));
  const docs = await Promise.all(
    slugs.map((slug) =>
      readLocalizedMarkdown({
        siteRoot,
        kind: "component",
        slug,
        locale: nextLocale,
        sourcePath: `content/components/${slug}/${nextLocale}.md`,
        fallbackPath: `content/components/${slug}/${sourceLocale}.md`,
      }),
    ),
  );
  return docs.filter(Boolean);
}

export async function discoverExampleMarkdown({ siteRoot, locale }) {
  const nextLocale = normalizeLocale(locale);
  const root = join(siteRoot, "content", "examples");
  const slugs = (await directorySlugs(root)).filter((slug) => allowedExampleSlugs.has(slug));
  const docs = await Promise.all(
    slugs.map(async (slug) => {
      const sourcePath = `content/examples/${slug}/${nextLocale}.md`;
      const content = await readOptional(siteRoot, sourcePath);
      if (content !== null) {
        return {
          kind: "example",
          slug,
          locale: nextLocale,
          contentLocale: nextLocale,
          isFallback: false,
          path: sourcePath,
          content,
        };
      }

      const fallbackPath = `content/examples/${slug}/${exampleSourceLocale}.md`;
      const fallback = await readOptional(siteRoot, fallbackPath);
      if (fallback === null) return null;
      return {
        kind: "example",
        slug,
        locale: nextLocale,
        contentLocale: exampleSourceLocale,
        isFallback: true,
        path: fallbackPath,
        content: fallback,
      };
    }),
  );
  return docs.filter(Boolean);
}

export async function discoverWikiMarkdown({ siteRoot, locales = supportedLocales } = {}) {
  const markdown = await Promise.all(
    locales.map(async (locale) => [
      ...(await discoverGuideMarkdown({ siteRoot, locale })),
      ...(await discoverReferenceMarkdown({ siteRoot, locale })),
      ...(await discoverReleaseMarkdown({ siteRoot, locale })),
      ...(await discoverComponentMarkdown({ siteRoot, locale })),
    ]),
  );
  return markdown.flat();
}
