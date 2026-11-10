import { defaultLocale } from "./data/component-docs.js";
import { createMobileNav } from "./app/mobile-nav.js";
import {
  createSiteRouter,
  currentLocale,
  docHrefForPath,
  exampleHrefForPath,
  isDocsRoute,
  isExamplesRoute,
  localizedPath,
  navHref,
  routePath,
  switchLocalePath,
} from "./app/router.js";
import { createSiteShell, hydratePhosphorIcons } from "./app/shell.js";
import { withSiteBase } from "./app/site-base.js";
import { createDocsRoute } from "./routes/docs.js";
import { createExamplesRoute } from "./routes/examples.js";
import { createHomeRoute } from "./routes/home.js";

const siteRoot = document.getElementById("siteRoot");
let cleanupMarkdown = [];
let cleanupSiteMount = null;
let router = null;

function clearMarkdown() {
  for (const cleanup of cleanupMarkdown) cleanup();
  cleanupMarkdown = [];
}

function addMarkdownCleanup(cleanup) {
  cleanupMarkdown.push(cleanup);
}

function clearSiteMount() {
  if (cleanupSiteMount) cleanupSiteMount();
  cleanupSiteMount = null;
}

function setSiteMount(cleanup) {
  cleanupSiteMount = cleanup;
}

function replaceRoot(node) {
  clearMarkdown();
  clearSiteMount();
  siteRoot?.replaceChildren(node);
  hydratePhosphorIcons(siteRoot ?? document);
}

function renderRoute(options) {
  return router?.renderRoute(options);
}

const shell = createSiteShell({
  currentLocale,
  defaultLocale,
  docHrefForPath,
  isDocsRoute,
  isExamplesRoute,
  localizedPath,
  navHref,
  renderRoute,
  routePath,
  switchLocalePath,
  withSiteBase,
});

const mobileNav = createMobileNav({
  currentLocale,
  hydratePhosphorIcons,
});

const homeRoute = createHomeRoute({
  clearMobileContext: mobileNav.clearContext,
  currentLocale,
  navHref,
  replaceRoot,
  setSiteMount,
});

const docsRoute = createDocsRoute({
  addMarkdownCleanup,
  clearMarkdown,
  clearMobileContext: mobileNav.clearContext,
  currentLocale,
  docHrefForPath,
  mobileNav,
  replaceRoot,
  setSiteMount,
  siteRoot,
});

const examplesRoute = createExamplesRoute({
  addMarkdownCleanup,
  clearMarkdown,
  clearMobileContext: mobileNav.clearContext,
  currentLocale,
  exampleHrefForPath,
  replaceRoot,
  setSiteMount,
});

router = createSiteRouter({
  closeLanguageMenu: () => shell.setLanguageMenuOpen(false),
  closeMobileNav: mobileNav.closeMobileNav,
  renderDocs: docsRoute.renderDocs,
  renderExamples: examplesRoute.renderExamples,
  renderHome: homeRoute.renderHome,
  scrollToTarget: docsRoute.scrollToTarget,
  setActiveRoute: shell.setActiveRoute,
  syncLanguageControls: shell.syncLanguageControls,
  syncPageTocNavigation: docsRoute.syncPageTocNavigation,
});

window.addEventListener("scroll", docsRoute.syncPageTocFromScroll, { passive: true });

hydratePhosphorIcons();
void renderRoute({ scroll: Boolean(window.location.hash) });
