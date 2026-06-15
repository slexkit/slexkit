import { defaultLocale, supportedLocales } from "../data/component-docs.js";
import { normalizeRoutePath } from "./site-routes.js";
import { stripSiteBase, withSiteBase } from "./site-base.js";

export function routePath(pathname = window.location.pathname) {
  return normalizeRoutePath(pathname);
}

export function localizedPath(pathname = window.location.pathname) {
  const path = routePath(pathname);
  const match = path.match(/^\/([^/]+)(\/.*)?$/);
  if (match && supportedLocales.includes(match[1])) {
    return {
      locale: match[1],
      path: match[2] || "/",
    };
  }

  return {
    locale: defaultLocale,
    path,
  };
}

export function withLocalePath(path, locale = currentLocale()) {
  return locale === defaultLocale ? path : `/${locale}${path}`;
}

function hasLocalePrefix(path) {
  const match = path.match(/^\/([^/]+)(?=\/|$)/);
  return Boolean(match && supportedLocales.includes(match[1]));
}

export function currentLocale() {
  return localizedPath().locale;
}

export function pathWithoutLocale(pathname = window.location.pathname) {
  return localizedPath(pathname).path;
}

export function switchLocalePath(targetLocale, pathname = window.location.pathname) {
  const path = pathWithoutLocale(pathname);
  return withLocalePath(path, targetLocale);
}

export function navHref(path) {
  return withSiteBase(withLocalePath(path));
}

export function localizeSiteNavigationPath(pathname, locale = currentLocale()) {
  const normalized = normalizeLegacyRoute(normalizeRoutePath(pathname));
  if (!isSiteRoute(normalized)) return normalized;
  const localized = localizedPath(normalized);
  return withLocalePath(localized.path, hasLocalePrefix(normalized) ? localized.locale : locale);
}

export function isDocsRoute(pathname = window.location.pathname) {
  const path = localizedPath(pathname).path;
  return path === "/docs" || path === "/docs/" || path.startsWith("/docs/");
}

export function isExamplesRoute(pathname = window.location.pathname) {
  const path = localizedPath(pathname).path;
  return path === "/examples" || path === "/examples/" || path.startsWith("/examples/");
}

export function isSiteRoute(pathname) {
  const internalPath = localizedPath(pathname).path;
  if (internalPath.endsWith(".md")) return false;
  return (
    internalPath === "/" ||
    internalPath === "/examples" ||
    internalPath === "/examples/" ||
    internalPath.startsWith("/examples/") ||
    internalPath === "/docs" ||
    internalPath === "/docs/" ||
    internalPath.startsWith("/docs/") ||
    internalPath === "/design" ||
    internalPath === "/components" ||
    internalPath.startsWith("/components/")
  );
}

export function docHrefForPath(pathname = window.location.pathname) {
  const localized = localizedPath(pathname);
  const path = localized.path.replace(/\/$/, "");
  if (path === "/docs" || path === "") return withLocalePath("/docs/guides/intro", localized.locale);
  return withLocalePath(path, localized.locale);
}

export function exampleHrefForPath(pathname = window.location.pathname) {
  const localized = localizedPath(pathname);
  const path = localized.path.replace(/\/$/, "") || "/examples";
  if (path === "/examples") return withLocalePath("/examples", localized.locale);
  return withLocalePath(path, localized.locale);
}

export function normalizeLegacyRoute(pathname) {
  const localized = localizedPath(pathname);
  const path = localized.path.replace(/\/$/, "");
  if (path === "/components") return withLocalePath("/docs/components/accordion", localized.locale);
  if (path.startsWith("/components/")) {
    return withLocalePath(`/docs/components/${encodeURIComponent(decodeURIComponent(path.slice("/components/".length)))}`, localized.locale);
  }
  if (path === "/design") return withLocalePath("/docs/guides/design", localized.locale);
  const legacyDoc = path.match(/^\/docs\/(intro|quick-start|integration|design|security-runtime|ai-agents)$/);
  if (legacyDoc) return withLocalePath(`/docs/guides/${legacyDoc[1]}`, localized.locale);
  const legacyReference = path.match(/^\/docs\/(guide|runtime|security|spec|packages|toolhost|icons|rationale)$/);
  if (legacyReference) {
    const slug = legacyReference[1] === "guide" ? "usage" : legacyReference[1];
    return withLocalePath(`/docs/reference/${slug}`, localized.locale);
  }
  if (path === "/docs/changelog" || path === "/changelog") return withLocalePath("/docs/releases/changelog", localized.locale);
  return pathname;
}

export function createSiteRouter({
  closeLanguageMenu,
  closeMobileNav,
  renderDocs,
  renderExamples,
  renderHome,
  scrollToTarget,
  setActiveRoute,
  syncLanguageControls,
  syncPageTocNavigation,
}) {
  let currentRouteKey = "";

  async function renderRoute({ scroll = true } = {}) {
    closeMobileNav();
    syncLanguageControls();
    const nextRouteKey = isDocsRoute()
      ? `docs:${docHrefForPath()}`
      : isExamplesRoute()
        ? `examples:${exampleHrefForPath()}`
        : `home:${currentLocale()}`;
    setActiveRoute();
    if (nextRouteKey === currentRouteKey) {
      syncPageTocNavigation(window.location.hash);
      if (scroll && window.location.hash) scrollToTarget(window.location.hash, { behavior: "smooth" });
      return;
    }
    currentRouteKey = nextRouteKey;

    if (isDocsRoute()) await renderDocs();
    else if (isExamplesRoute()) await renderExamples();
    else renderHome();

    if (!scroll) return;
    if (window.location.hash) scrollToTarget(window.location.hash);
    else window.scrollTo({ top: 0 });
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented) return;
    const languageControl = event.target instanceof Element ? event.target.closest(".slex-site-language-control") : null;
    if (!languageControl) closeLanguageMenu();

    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!(link instanceof HTMLAnchorElement)) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;

    const url = new URL(link.href, window.location.origin);
    if (url.origin !== window.location.origin) return;
    const internalPath = stripSiteBase(url.pathname);
    const nextPath = localizeSiteNavigationPath(internalPath);
    if (!isSiteRoute(nextPath)) return;

    event.preventDefault();
    window.history.pushState({}, "", `${withSiteBase(nextPath)}${url.search}${url.hash}`);
    void renderRoute();
  });

  window.addEventListener("popstate", () => void renderRoute());

  return {
    renderRoute,
  };
}
