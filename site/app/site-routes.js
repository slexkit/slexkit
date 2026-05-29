import { stripSiteBase } from "./site-base.js";

const legacyGuideSlugs = "intro|quick-start|integration|design|security-runtime|ai-agents";

function splitLocalePath(pathname) {
  const path = pathname || "/";
  const match = path.match(/^\/(zh-CN|en-US)(\/.*)?$/);
  if (!match) return { localePrefix: "", path };
  return {
    localePrefix: `/${match[1]}`,
    path: match[2] || "/",
  };
}

function normalizeIndexPath(pathname) {
  const { localePrefix, path } = splitLocalePath(pathname);
  const cleanPath = path.replace(/\/$/, "") || "/";
  if (cleanPath === "/index.html") return `${localePrefix}/`;
  return pathname || "/";
}

export function legacyDocsPath(pathname, base) {
  const internalPath = stripSiteBase(pathname, base);
  const { localePrefix, path } = splitLocalePath(internalPath);
  const cleanPath = path.replace(/\/$/, "");
  if (cleanPath === "/design") return `${localePrefix}/docs/guides/design`;
  if (cleanPath === "/components") return `${localePrefix}/docs/components/accordion`;
  if (cleanPath.startsWith("/components/")) {
    return `${localePrefix}/docs/components/${encodeURIComponent(decodeURIComponent(cleanPath.slice("/components/".length)))}`;
  }
  const legacyDoc = cleanPath.match(new RegExp(`^/docs/(${legacyGuideSlugs})$`));
  if (legacyDoc) return `${localePrefix}/docs/guides/${legacyDoc[1]}`;
  const legacyReference = cleanPath.match(/^\/docs\/(guide|runtime|security|spec|packages|toolhost|icons|rationale)$/);
  if (legacyReference) {
    const slug = legacyReference[1] === "guide" ? "usage" : legacyReference[1];
    return `${localePrefix}/docs/reference/${slug}`;
  }
  if (cleanPath === "/docs/changelog" || cleanPath === "/changelog") return `${localePrefix}/docs/releases/changelog`;
  return "";
}

export function normalizeRoutePath(pathname, base) {
  const internalPath = stripSiteBase(pathname, base);
  return legacyDocsPath(internalPath) || normalizeIndexPath(internalPath);
}
