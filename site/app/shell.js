import { siteUiLabelsForLocale, supportedLocales } from "../data/component-docs.js";
import { getPhosphorIcon } from "./icons.js";
import { initSiteTheme } from "./theme.js";
import { SLEXKIT_SITE_VERSION } from "./version.js";

export function hydratePhosphorIcons(root = document) {
  for (const node of root.querySelectorAll("[data-phosphor-icon]")) {
    const svg = getPhosphorIcon(node.dataset.phosphorIcon, {
      weight: node.dataset.phosphorWeight || null,
      selected: node.dataset.selected ?? node.getAttribute("aria-selected"),
      active: node.dataset.active,
      pressed: node.getAttribute("aria-pressed"),
      current: node.getAttribute("aria-current"),
    });
    if (svg) node.innerHTML = svg;
  }
}

export function createSiteShell({
  defaultLocale,
  docHrefForPath,
  currentLocale,
  isDocsRoute,
  localizedPath,
  navHref,
  renderRoute,
  routePath,
  switchLocalePath,
  withSiteBase,
}) {
  const themeBtn = document.getElementById("themeBtn");
  const languageTrigger = document.getElementById("languageTrigger");
  const languageMenu = document.getElementById("languageMenu");
  const languageOptions = Array.from(document.querySelectorAll("[data-locale]"));
  const homeLinks = Array.from(document.querySelectorAll("[data-home-link]"));
  const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
  const footerLinks = Array.from(document.querySelectorAll("[data-footer-link]"));
  const versionNode = document.querySelector("[data-site-version]");

  if (versionNode) versionNode.textContent = SLEXKIT_SITE_VERSION;

  initSiteTheme(themeBtn);

  function setLanguageMenuOpen(open) {
    if (!languageTrigger || !languageMenu) return;
    languageMenu.hidden = !open;
    languageTrigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function selectLocale(targetLocale) {
    if (!supportedLocales.includes(targetLocale)) return;
    setLanguageMenuOpen(false);
    if (targetLocale === currentLocale()) return;
    window.history.pushState({}, "", `${withSiteBase(switchLocalePath(targetLocale))}${window.location.hash}`);
    void renderRoute();
  }

  function syncLanguageControls() {
    const locale = currentLocale();
    const labels = siteUiLabelsForLocale(locale);
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;

    if (languageTrigger instanceof HTMLButtonElement) {
      languageTrigger.title = locale === "en-US" ? "Language" : "语言";
    }

    for (const option of languageOptions) {
      const selected = option.dataset.locale === locale;
      option.setAttribute("aria-selected", selected ? "true" : "false");
      option.tabIndex = selected ? 0 : -1;
    }

    for (const link of homeLinks) {
      if (link instanceof HTMLAnchorElement) link.href = navHref("/");
    }

    for (const link of navLinks) {
      const section = link.dataset.navSection;
      if (section === "guides") {
        link.href = navHref("/docs/guides/intro");
        link.textContent = labels.navIntro;
      }
      if (section === "components") {
        link.href = navHref("/components");
        link.textContent = labels.navComponents;
      }
    }

    for (const link of footerLinks) {
      if (!(link instanceof HTMLAnchorElement)) continue;
      const target = link.dataset.footerLink;
      if (target === "docs") link.href = navHref("/docs/guides/intro");
      if (target === "components") link.href = navHref("/docs/components/accordion");
      if (target === "changelog") link.href = navHref("/docs/releases/changelog");
    }
  }

  function setActiveRoute() {
    const docsRoute = isDocsRoute();
    const route = docsRoute ? docHrefForPath() : "";
    const routeWithoutLocale = localizedPath(route).path;
    for (const link of navLinks) {
      const section = link.dataset.navSection;
      const active = docsRoute && (
        section === "components"
          ? routeWithoutLocale.startsWith("/docs/components/")
          : section === "guides"
            ? routeWithoutLocale.startsWith("/docs/guides/")
            : routePath(new URL(link.href, window.location.origin).pathname) === route
      );
      link.classList.toggle("text-foreground", active);
      link.classList.toggle("font-medium", active);
      link.classList.toggle("text-muted-foreground", !active);
    }
  }

  languageTrigger?.addEventListener("click", (event) => {
    event.stopPropagation();
    setLanguageMenuOpen(languageTrigger.getAttribute("aria-expanded") !== "true");
  });

  languageTrigger?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setLanguageMenuOpen(true);
    const selected = languageOptions.find((option) => option.getAttribute("aria-selected") === "true");
    (selected ?? languageOptions[0])?.focus();
  });

  languageMenu?.addEventListener("click", (event) => {
    const option = event.target instanceof Element ? event.target.closest("[data-locale]") : null;
    if (!(option instanceof HTMLElement)) return;
    selectLocale(option.dataset.locale || defaultLocale);
  });

  languageMenu?.addEventListener("keydown", (event) => {
    const activeIndex = languageOptions.findIndex((option) => option === document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      setLanguageMenuOpen(false);
      languageTrigger?.focus();
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const active = languageOptions[activeIndex];
      if (active instanceof HTMLElement) selectLocale(active.dataset.locale || defaultLocale);
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const nextIndex =
      event.key === "ArrowDown"
        ? (Math.max(activeIndex, 0) + 1) % languageOptions.length
        : (activeIndex <= 0 ? languageOptions.length : activeIndex) - 1;
    languageOptions[nextIndex]?.focus();
  });

  return {
    setActiveRoute,
    setLanguageMenuOpen,
    syncLanguageControls,
  };
}
