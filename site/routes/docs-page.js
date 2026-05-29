import { defaultLocale, loadWikiDocs, siteUiLabelsForLocale, sortWikiDocs, supportedLocales } from "../data/component-docs.js";
import { stripSiteBase, siteFetch, withSiteBase } from "../app/site-base.js";
import { normalizeRoutePath } from "../app/site-routes.js";
import { createPage } from "../pages/docs.slex.js";

let wikiDocs = [];
const wikiDocsByLocale = new Map();
const wikiDocsPromiseByLocale = new Map();

export function getDocsHref(pathname = window.location.pathname) {
  const cleanPath = normalizeRoutePath(stripSiteBase(pathname)).replace(/\/$/, "");
  const localeMatch = cleanPath.match(/^\/([^/]+)(\/.*)?$/);
  const locale = localeMatch && supportedLocales.includes(localeMatch[1]) ? localeMatch[1] : defaultLocale;
  const localizedPath = locale === defaultLocale ? cleanPath : (localeMatch?.[2] || "/");
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  if (localizedPath === "/docs" || localizedPath === "") return `${prefix}/docs/guides/intro`;
  if (localizedPath.startsWith("/docs/")) return `${prefix}${localizedPath}`;
  return "/docs/guides/intro";
}

function localeFromHref(href) {
  const match = href.match(/^\/([^/]+)(\/.*)?$/);
  return match && supportedLocales.includes(match[1]) ? match[1] : defaultLocale;
}

function loadDocs(locale = defaultLocale) {
  if (!wikiDocsPromiseByLocale.has(locale)) {
    wikiDocsPromiseByLocale.set(locale, fetchWikiDocs()
      .then(({ markdown = [] }) => loadWikiDocs({ markdownItems: markdown, locale }))
      .then((docs) => {
        const sorted = sortWikiDocs(docs);
        wikiDocsByLocale.set(locale, sorted);
        if (locale === defaultLocale) wikiDocs = sorted;
        return sorted;
      }));
  }
  return wikiDocsPromiseByLocale.get(locale);
}

async function fetchJson(path) {
  const response = await siteFetch(path);
  if (!response.ok) throw new Error(`Failed to load wiki docs from ${path}`);
  return response.json();
}

async function fetchWikiDocs() {
  try {
    return await fetchJson("/assets/wiki-docs.json");
  } catch (error) {
    return fetchJson("/api/wiki-docs");
  }
}

function findDoc(href) {
  const locale = localeFromHref(href);
  const docs = wikiDocsByLocale.get(locale) ?? wikiDocs;
  if (!docs.length) return null;
  return docs.find((doc) => doc.href === href) ?? docs[0] ?? null;
}

function toNavItem(doc) {
  return {
    id: doc.id,
    slug: doc.slug,
    title: doc.title,
    group: doc.group,
    groupKey: doc.groupKey,
    category: doc.category,
    categoryLabel: doc.categoryLabel,
    href: withSiteBase(doc.href),
    markdownHref: withSiteBase(doc.markdownHref),
    summary: doc.summary,
  };
}

function toViewDoc(doc) {
  if (!doc) return null;
  return {
    ...doc,
    href: withSiteBase(doc.href),
    markdownHref: withSiteBase(doc.markdownHref),
    bodyHtml: `<div data-markdown-doc="${doc.slug}"></div>`,
  };
}

export async function createDocsPage({ href = getDocsHref() } = {}) {
  const locale = localeFromHref(href);
  const docs = await loadDocs(locale);
  const labels = siteUiLabelsForLocale(locale);

  const doc = findDoc(href);
  const activeHref = withSiteBase(doc?.href ?? href);
  const dsl = createPage({
    activeHref,
    currentDoc: toViewDoc(doc),
    docs: docs.map(toNavItem),
    countLabel: `${docs.length} ${labels.pagesSuffix}`,
    locale,
    uiLabels: labels,
  });

  return {
    dsl,
    doc,
    title: doc ? `${doc.title} - SlexKit` : "Docs - SlexKit",
  };
}
