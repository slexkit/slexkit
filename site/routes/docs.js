import { ingest } from "../../src/engine/index";
import { loadWikiDocs, siteUiLabelsForLocale } from "../data/component-docs.js";
import { renderMarkdown } from "../markdown/svelte-renderer.js";
import { createPage as createDocsShellPage } from "../pages/docs.slex.js";
import { siteFetch, withSiteBase } from "../app/site-base.js";

function escapeAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function docsShellItems(docs) {
  return docs.map((doc) => ({
    ...doc,
    href: withSiteBase(doc.href),
    markdownHref: withSiteBase(doc.markdownHref),
  }));
}

function docsShellDoc(doc) {
  return {
    ...doc,
    href: withSiteBase(doc.href),
    markdownHref: withSiteBase(doc.markdownHref),
    bodyHtml: `<div class="slex-docs-markdown" data-markdown-doc="${escapeAttribute(doc.slug)}"></div>`,
  };
}

function revealActiveDocsSidebarItem(root) {
  const sidebar = root.querySelector(".slex-docs-shell-sidebar");
  const active = root.querySelector(".slex-docs-sidebar-item--active");
  if (!(sidebar instanceof HTMLElement) || !(active instanceof HTMLElement)) return;

  const sidebarRect = sidebar.getBoundingClientRect();
  const activeRect = active.getBoundingClientRect();
  const above = activeRect.top < sidebarRect.top;
  const below = activeRect.bottom > sidebarRect.bottom;
  if (!above && !below) return;

  const offset = activeRect.top - sidebarRect.top - sidebarRect.height * 0.35;
  sidebar.scrollTop += offset;
}

export function createDocsRoute({
  addMarkdownCleanup,
  clearMarkdown,
  clearMobileContext,
  currentLocale,
  docHrefForPath,
  mobileNav,
  mount,
  replaceRoot,
  setSiteMount,
  siteRoot,
}) {
  const wikiDocsPromiseByLocale = new Map();
  let docsShellRoot = null;
  let tocScrollFrame = 0;

  async function loadDocs(locale = currentLocale()) {
    if (!wikiDocsPromiseByLocale.has(locale)) {
      wikiDocsPromiseByLocale.set(locale, siteFetch("/assets/wiki-docs.json")
        .then((response) => {
          if (!response.ok) throw new Error("static wiki docs unavailable");
          return response.json();
        })
        .catch(() => siteFetch("/api/wiki-docs").then((response) => {
          if (!response.ok) throw new Error("Failed to load docs");
          return response.json();
        }))
        .then((payload) => loadWikiDocs({ markdownItems: payload.markdown ?? [], locale })));
    }
    return wikiDocsPromiseByLocale.get(locale);
  }

  function currentDoc(docs) {
    const href = docHrefForPath();
    return docs.find((doc) => doc.href === href || doc.markdownHref === href) ?? null;
  }

  function renderMarkdownInto(markdown, host, options = {}) {
    addMarkdownCleanup(renderMarkdown(markdown, host, options));
  }

  function renderEmptyDocs() {
    const labels = siteUiLabelsForLocale(currentLocale());
    const page = document.createElement("main");
    page.className = "slex-static-page";

    const content = document.createElement("section");
    content.className = "slex-static-prose";
    const title = document.createElement("h1");
    title.textContent = labels.docsLabel;
    const message = document.createElement("p");
    message.textContent = labels.noDocsFound;
    content.append(title, message);
    page.appendChild(content);

    replaceRoot(page);
    document.title = `${labels.docsLabel} - SlexKit`;
    clearMobileContext();
  }

  async function renderDocs() {
    document.body.dataset.siteRoute = "docs";
    const docs = await loadDocs();
    if (!docs.length) {
      renderEmptyDocs();
      return;
    }

    const doc = currentDoc(docs);
    const labels = siteUiLabelsForLocale(currentLocale());
    const activeHref = doc?.href ?? docHrefForPath();
    const shellState = {
      activeHref: withSiteBase(activeHref),
      currentDoc: doc ? docsShellDoc(doc) : null,
      docs: docsShellItems(docs),
      countLabel: `${docs.length} ${labels.pagesSuffix}`,
      locale: currentLocale(),
      playgroundHrefBase: withSiteBase("/playground.html"),
      uiLabels: labels,
      emptyText: labels.docNotFound ?? labels.noDocsFound,
    };
    let page = docsShellRoot;

    if (!page?.isConnected || document.body.dataset.siteRoute !== "docs") {
      page = document.createElement("main");
      replaceRoot(page);
      docsShellRoot = page;
      setSiteMount(mount(createDocsShellPage(shellState), page));
    } else {
      clearMarkdown();
      ingest({
        namespace: "site_docs_wiki",
        g: {
          docs: shellState.docs,
          activeHref: shellState.activeHref,
          doc: shellState.currentDoc,
          countLabel: shellState.countLabel,
          locale: shellState.locale,
          playgroundHrefBase: shellState.playgroundHrefBase,
          uiLabels: shellState.uiLabels,
          emptyText: shellState.emptyText,
        },
      });
    }

    mobileNav.renderDocsContext(docs, doc);
    await Promise.resolve();
    const markdownHost = page.querySelector("[data-markdown-doc]");
    if (doc && markdownHost) {
      renderMarkdownInto(doc.markdown, markdownHost, {
        domain: `doc:${doc.slug}`,
        slexkitRenderMode: doc.slexkitRenderMode ?? "playground",
      });
    }

    document.title = doc ? `${doc.title} - SlexKit` : `${labels.docNotFound ?? labels.docsLabel} - SlexKit`;
    requestAnimationFrame(() => {
      revealActiveDocsSidebarItem(page);
      syncPageTocNavigation(window.location.hash);
      if (window.location.hash) scrollToTarget(window.location.hash);
    });
  }

  function tocLinks() {
    return Array.from(siteRoot?.querySelectorAll(".slex-toc-link, .slex-doc-detail-toc-link") ?? [])
      .filter((link) => link instanceof HTMLAnchorElement && link.hash);
  }

  function targetForHash(hash) {
    if (!hash) return null;
    try {
      return document.getElementById(decodeURIComponent(hash.slice(1)));
    } catch {
      return document.querySelector(hash);
    }
  }

  function setActivePageToc(hash = "") {
    const links = tocLinks();
    if (!links.length) return;
    const activeHash = hash || links[0].hash;
    for (const link of links) {
      const active = link.hash === activeHash;
      link.classList.toggle("active", active);
      link.classList.toggle("slex-toc-link--active", active && link.classList.contains("slex-toc-link"));
      link.classList.toggle("slex-doc-detail-toc-link--active", active && link.classList.contains("slex-doc-detail-toc-link"));
      link.setAttribute("aria-current", active ? "true" : "false");
    }
  }

  function getCurrentPageHash() {
    const links = tocLinks();
    let currentHash = links[0]?.hash ?? "";
    if (!currentHash) return "";

    const scrollRoot = document.scrollingElement ?? document.documentElement;
    const distanceToBottom = scrollRoot.scrollHeight - window.scrollY - window.innerHeight;
    if (distanceToBottom <= 4) return links[links.length - 1]?.hash ?? currentHash;

    const threshold = window.matchMedia("(min-width: 1024px)").matches ? 96 : 144;
    for (const link of links) {
      const section = targetForHash(link.hash);
      if (section && section.getBoundingClientRect().top <= threshold) currentHash = link.hash;
    }
    return currentHash;
  }

  function syncPageTocNavigation(hash = "", attempts = 8) {
    const activeHash = hash || getCurrentPageHash();
    setActivePageToc(activeHash);
    if (!hash || targetForHash(hash) || attempts <= 0) return;
    window.setTimeout(() => syncPageTocNavigation(hash, attempts - 1), 30);
  }

  function scrollToTarget(hash, { behavior = "auto" } = {}) {
    const target = targetForHash(hash);
    if (!target) return;
    const offset = window.matchMedia("(min-width: 1024px)").matches ? 72 : 112;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: Math.max(0, top), behavior });
  }

  function syncPageTocFromScroll() {
    if (tocScrollFrame) return;
    tocScrollFrame = window.requestAnimationFrame(() => {
      tocScrollFrame = 0;
      const hash = getCurrentPageHash();
      if (!hash) return;
      setActivePageToc(hash);
    });
  }

  return {
    renderDocs,
    scrollToTarget,
    syncPageTocFromScroll,
    syncPageTocNavigation,
  };
}
