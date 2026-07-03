import { ingest } from "../../src/engine/index";
import { mount as mountSvelte, unmount } from "svelte";
import { loadExampleDocs } from "../data/examples.js";
import { siteUiLabelsForLocale } from "../data/component-docs.js";
import { renderMarkdown } from "../markdown/svelte-renderer.js";
import { createPage as createExamplesShellPage } from "../pages/examples.slex.js";
import { siteFetch, withSiteBase } from "../app/site-base.js";
import ToolHostResponsesDemo from "../components/examples/ToolHostResponsesDemo.svelte";

function escapeAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function localizedCopy(locale) {
  if (locale === "zh-CN") {
    return {
      title: "示例中心",
      lede: "可直接运行的 SlexKit 示例。",
      landingEyebrow: "示例入口",
      landingTitle: "按宿主、入门路径或应用场景浏览",
      landingDescription: "查看各宿主适配的可运行示例、接入说明和源码。",
      hostIntegration: "宿主集成",
      hostIntegrationDesc: "Streamdown、Tiptap、Svelte Markdown 和 Obsidian 的接入方式。",
      gettingStarted: "入门教程",
      gettingStartedDesc: "从静态卡片、响应式状态到多输入协同，按顺序理解 SlexKit。",
      calculators: "计算器示例",
      calculatorsDesc: "工程、电子和成本估算场景。",
      hostAdapters: "宿主接入",
      assistantUiAdapterDesc: "assistant-ui Streamdown text wrapper。",
      streamdownAdapterDesc: "Streamdown renderer 插件。",
      tiptapAdapterDesc: "Tiptap editor extension。",
      openExample: "打开示例",
      openGuide: "查看指南",
      viewSource: "查看源码",
      svelteHost: "Svelte Markdown",
      svelteHostDesc: "Svelte Markdown renderer 适配。",
      obsidianHost: "Obsidian",
      obsidianHostDesc: "为 Obsidian 文档启用 SlexKit 渲染。",
      featured: "精选示例",
      allExamples: "全部示例",
      empty: "没有匹配的示例。",
      examplesLabel: "示例",
      onThisPage: "本页",
      count: "个示例",
      copyPage: "复制页面",
      viewMarkdown: "查看 Markdown",
      openLive: "以 Live 模式打开",
      copiedPage: "已复制页面",
      copyFailed: "复制失败",
      openDocsNavigation: "打开示例导航",
      noDocsFound: "没有找到示例。",
      onThisPageAria: "本页目录",
    };
  }

  return {
    title: "Examples",
    lede: "Runnable SlexKit examples.",
    landingEyebrow: "Example entry points",
    landingTitle: "Browse by host, learning path, or use case",
    landingDescription: "Runnable examples, setup notes, and source links for each host integration.",
    hostIntegration: "Host Integration",
    hostIntegrationDesc: "Streamdown, Tiptap, Svelte Markdown, and Obsidian integrations.",
    gettingStarted: "Getting Started",
    gettingStartedDesc: "Learn SlexKit in order: static card, reactive state, and coordinated inputs.",
    calculators: "Calculator examples",
    calculatorsDesc: "Engineering, electronics, and cost-estimation scenarios.",
    hostAdapters: "Host integration",
    assistantUiAdapterDesc: "assistant-ui Streamdown text wrapper.",
    streamdownAdapterDesc: "Streamdown renderer plugin.",
    tiptapAdapterDesc: "Tiptap editor extension.",
    openExample: "Open example",
    openGuide: "Open guide",
    viewSource: "View source",
    svelteHost: "Svelte Markdown",
    svelteHostDesc: "Svelte Markdown renderer adapter.",
    obsidianHost: "Obsidian",
    obsidianHostDesc: "Enable SlexKit rendering in Obsidian documents.",
    featured: "Featured examples",
    allExamples: "All examples",
    empty: "No examples found.",
    examplesLabel: "Examples",
    onThisPage: "On this page",
    count: "examples",
    copyPage: "Copy page",
    viewMarkdown: "View Markdown",
    openLive: "Open in Live mode",
    copiedPage: "Copied page",
    copyFailed: "Copy failed",
    openDocsNavigation: "Open examples navigation",
    noDocsFound: "No examples found.",
    onThisPageAria: "On this page",
  };
}

function node(tag, className, content = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) element.textContent = content;
  return element;
}

function shellItems(examples) {
  return examples.map((example) => ({
    ...example,
    group: example.category,
    groupKey: `examples:${example.category}`,
    href: withSiteBase(example.href),
    markdownHref: withSiteBase(example.markdownHref),
  }));
}

function shellDoc(example) {
  return {
    ...example,
    href: withSiteBase(example.href),
    markdownHref: withSiteBase(example.markdownHref),
    bodyHtml: `<div class="slex-docs-markdown" data-markdown-doc="${escapeAttribute(example.slug)}"></div>`,
  };
}

function groupExamples(examples, category) {
  return examples.filter((example) => example.category === category).slice(0, 4);
}

function exampleBySlug(examples, slug) {
  return examples.find((example) => example.slug === slug);
}

function hrefForExample(examples, slug, fallback = "/examples") {
  return withSiteBase(exampleBySlug(examples, slug)?.href ?? fallback);
}

function landingCard({ title, description, href, action }) {
  return `
    <a class="slex-examples-entry-card" href="${escapeAttribute(href)}">
      <span class="slex-examples-entry-title">${escapeAttribute(title)}</span>
      <span class="slex-examples-entry-desc">${escapeAttribute(description)}</span>
      <span class="slex-examples-entry-action">${escapeAttribute(action)}</span>
    </a>
  `;
}

function landingLinkList(items) {
  return items.map((item) => `
    <a class="slex-examples-link-row" href="${escapeAttribute(withSiteBase(item.href))}">
      <span>${escapeAttribute(item.title)}</span>
      <small>${escapeAttribute(item.summary || item.difficulty || "")}</small>
    </a>
  `).join("");
}

function examplesLandingHtml(examples, copy, locale) {
  const intro = groupExamples(examples, locale === "zh-CN" ? "入门教程" : "Getting Started");
  const calculators = groupExamples(examples, locale === "zh-CN" ? "计算器" : "Calculator");
  const integrationHref = withSiteBase(locale === "zh-CN" ? "/zh-CN/docs/guides/integration" : "/docs/guides/integration");
  const obsidianHref = `${integrationHref}#obsidian`;
  const assistantUiHref = hrefForExample(examples, "assistant-ui-host");
  const streamdownHref = hrefForExample(examples, "streamdown-host");
  const tiptapHref = hrefForExample(examples, "tiptap-host");

  return `
    <section class="slex-examples-landing">
      <div class="slex-examples-hero">
        <p class="slex-examples-eyebrow">${escapeAttribute(copy.landingEyebrow)}</p>
        <h1>${escapeAttribute(copy.title)}</h1>
        <p class="slex-examples-subtitle">${escapeAttribute(copy.landingTitle)}</p>
        <p>${escapeAttribute(copy.landingDescription)}</p>
      </div>

      <div class="slex-examples-entry-grid" aria-label="${escapeAttribute(copy.title)}">
        ${landingCard({
          title: copy.hostIntegration,
          description: copy.hostIntegrationDesc,
          href: streamdownHref,
          action: copy.openExample,
        })}
        ${landingCard({
          title: copy.gettingStarted,
          description: copy.gettingStartedDesc,
          href: hrefForExample(examples, "hello-slexkit"),
          action: copy.openExample,
        })}
        ${landingCard({
          title: copy.calculators,
          description: copy.calculatorsDesc,
          href: hrefForExample(examples, "rc-low-pass-filter"),
          action: copy.openExample,
        })}
      </div>

      <section class="slex-examples-section">
        <div class="slex-examples-section-header">
          <h2>${escapeAttribute(copy.hostAdapters)}</h2>
          <a href="${escapeAttribute(integrationHref)}">${escapeAttribute(copy.openGuide)}</a>
        </div>
        <div class="slex-examples-adapter-grid">
          <a class="slex-examples-adapter-card" href="${escapeAttribute(assistantUiHref)}">
            <strong>assistant-ui</strong>
            <span>${escapeAttribute(copy.assistantUiAdapterDesc)}</span>
          </a>
          <a class="slex-examples-adapter-card" href="${escapeAttribute(streamdownHref)}">
            <strong>Streamdown</strong>
            <span>${escapeAttribute(copy.streamdownAdapterDesc)}</span>
          </a>
          <a class="slex-examples-adapter-card" href="${escapeAttribute(tiptapHref)}">
            <strong>Tiptap</strong>
            <span>${escapeAttribute(copy.tiptapAdapterDesc)}</span>
          </a>
          <a class="slex-examples-adapter-card" href="${escapeAttribute(integrationHref)}">
            <strong>${escapeAttribute(copy.svelteHost)}</strong>
            <span>${escapeAttribute(copy.svelteHostDesc)}</span>
          </a>
          <a class="slex-examples-adapter-card" href="${escapeAttribute(obsidianHref)}">
            <strong>${escapeAttribute(copy.obsidianHost)}</strong>
            <span>${escapeAttribute(copy.obsidianHostDesc)}</span>
          </a>
        </div>
      </section>

      <div class="slex-examples-list-grid">
        <section class="slex-examples-section">
          <h2>${escapeAttribute(copy.gettingStarted)}</h2>
          <div class="slex-examples-link-list">${landingLinkList(intro)}</div>
        </section>
        <section class="slex-examples-section">
          <h2>${escapeAttribute(copy.calculators)}</h2>
          <div class="slex-examples-link-list">${landingLinkList(calculators)}</div>
        </section>
      </div>
    </section>
  `;
}

function examplesLandingDoc(examples, locale, copy) {
  const href = locale === "zh-CN" ? "/zh-CN/examples" : "/examples";
  return {
    id: "examples/index",
    kind: "examples-index",
    slug: "examples",
    title: copy.title,
    summary: copy.lede,
    href: withSiteBase(href),
    markdownHref: false,
    bodyHtml: examplesLandingHtml(examples, copy, locale),
    toc: [
      { id: "host-adapters", title: copy.hostAdapters, depth: 2 },
      { id: "getting-started", title: copy.gettingStarted, depth: 2 },
      { id: "calculators", title: copy.calculators, depth: 2 },
    ],
  };
}

function securePolicyForExample(example) {
  if (example?.slug !== "network-policy-fetch-card") return {};
  return {
    network: {
      enabled: true,
      methods: ["GET", "POST"],
      allowOrigins: ["https://jsonplaceholder.typicode.com"],
      allowHeaders: ["content-type"],
      allowContentTypes: ["application/json"],
      credentials: "omit",
      timeoutMs: 8000,
      maxBodyBytes: 4096,
      maxResponseBytes: 65536,
    },
  };
}

function emptyPage({ clearMobileContext, currentLocale, replaceRoot }) {
  const labels = siteUiLabelsForLocale(currentLocale());
  const copy = localizedCopy(currentLocale());
  const page = node("main", "slex-static-page");
  const content = node("section", "slex-static-prose");
  content.append(node("h1", "", copy.title), node("p", "", labels.noDocsFound || copy.empty));
  page.appendChild(content);
  replaceRoot(page);
  document.title = `${copy.title} - SlexKit`;
  clearMobileContext();
}

export function createExamplesRoute({
  addMarkdownCleanup,
  clearMarkdown,
  clearMobileContext,
  currentLocale,
  exampleHrefForPath,
  mount,
  replaceRoot,
  setSiteMount,
}) {
  const examplesPromiseByLocale = new Map();
  let examplesShellRoot = null;

  async function loadExamples(locale = currentLocale()) {
    if (!examplesPromiseByLocale.has(locale)) {
      examplesPromiseByLocale.set(locale, siteFetch("/assets/examples-docs.json")
        .then((response) => {
          if (!response.ok) throw new Error("static examples unavailable");
          return response.json();
        })
        .catch(() => siteFetch("/api/examples-docs").then((response) => {
          if (!response.ok) throw new Error("Failed to load examples");
          return response.json();
        }))
        .then((payload) => loadExampleDocs({ markdownItems: payload.markdown ?? [], locale })));
    }
    return examplesPromiseByLocale.get(locale);
  }

  function currentExample(examples) {
    const href = exampleHrefForPath();
    if (href.replace(/\/$/, "") === (currentLocale() === "zh-CN" ? "/zh-CN/examples" : "/examples")) return null;
    return examples.find((item) => item.href === href) ?? examples[0] ?? null;
  }

  async function renderExamples() {
    document.body.dataset.siteRoute = "examples";
    const examples = await loadExamples();
    if (!examples.length) {
      emptyPage({ clearMobileContext, currentLocale, replaceRoot });
      return;
    }

    const locale = currentLocale();
    const copy = localizedCopy(locale);
    const example = currentExample(examples);
    const doc = example ? shellDoc(example) : examplesLandingDoc(examples, locale, copy);

    const shellState = {
      activeHref: example ? withSiteBase(example.href) : withSiteBase(locale === "zh-CN" ? "/zh-CN/examples" : "/examples"),
      currentDoc: doc,
      docs: shellItems(examples),
      locale,
      playgroundHrefBase: withSiteBase("/playground.html"),
      uiLabels: {
        ...siteUiLabelsForLocale(locale),
        ...copy,
        docsLabel: copy.examplesLabel,
      },
    };
    let page = examplesShellRoot;

    if (!page?.isConnected || document.body.dataset.siteRoute !== "examples") {
      page = document.createElement("main");
      replaceRoot(page);
      examplesShellRoot = page;
      setSiteMount(mount(createExamplesShellPage(shellState), page));
    } else {
      clearMarkdown();
      ingest({
        namespace: "site_examples",
        g: {
          docs: shellState.docs,
          activeHref: shellState.activeHref,
          doc: shellState.currentDoc,
          locale: shellState.locale,
          playgroundHrefBase: shellState.playgroundHrefBase,
          uiLabels: shellState.uiLabels,
        },
      });
    }

    await Promise.resolve();
    const markdownHost = page.querySelector("[data-markdown-doc]");
    if (markdownHost) {
      if (doc.slexkitRenderMode === "dialog") {
        const cleanup = renderMarkdown(doc.markdown, markdownHost, {
          domain: `example:${example.slug}`,
          slexkitRenderMode: "component",
          slexkitRuntime: doc.runtime === "secure" ? "secure" : "trusted",
          slexkitSecurePolicy: securePolicyForExample(doc),
          slexkitSecureFrame: {
            runtimeUrl: withSiteBase("/slexkit.js"),
          },
        });
        addMarkdownCleanup(cleanup);
        await Promise.resolve();
        const dialogContainer = document.createElement("div");
        dialogContainer.style.cssText = "margin-top:2rem;";
        markdownHost.appendChild(dialogContainer);
        const dialogApp = mountSvelte(ToolHostResponsesDemo, {
          target: dialogContainer,
          props: { locale },
        });
        addMarkdownCleanup(() => {
          void unmount(dialogApp);
          dialogContainer.remove();
        });
      } else {
        const cleanup = renderMarkdown(doc.markdown, markdownHost, {
          domain: `example:${example.slug}`,
          slexkitRenderMode: doc.slexkitRenderMode ?? "component",
          slexkitRuntime: doc.runtime === "secure" ? "secure" : "trusted",
          slexkitSecurePolicy: securePolicyForExample(doc),
          slexkitSecureFrame: {
            runtimeUrl: withSiteBase("/slexkit.js"),
          },
        });
        addMarkdownCleanup(cleanup);
      }
    }

    document.title = `${doc.title} - SlexKit`;
    clearMobileContext();
  }

  return {
    renderExamples,
  };
}
