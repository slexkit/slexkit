import { ingest } from "../../src/engine/index";
import { loadExampleDocs } from "../data/examples.js";
import { siteUiLabelsForLocale } from "../data/component-docs.js";
import { renderMarkdown } from "../markdown/svelte-renderer.js";
import { createPage as createExamplesShellPage } from "../pages/examples.slex.js";
import { siteFetch, withSiteBase } from "../app/site-base.js";
import DialogShell from "../components/DialogShell.svelte";

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
      lede: "面向 AI 输出、工程文档和交互式知识表达的 SlexKit 高质量示例。",
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
    lede: "High-quality SlexKit examples for AI output, engineering docs, and interactive knowledge surfaces.",
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
    if (href.replace(/\/$/, "") === (currentLocale() === "zh-CN" ? "/zh-CN/examples" : "/examples")) return examples[0] ?? null;
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
    const doc = shellDoc(example);
    const shellState = {
      activeHref: withSiteBase(example.href),
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
        // Render dialog shell instead of markdown
        const instance = mount(DialogShell, { target: markdownHost });
        addMarkdownCleanup(() => unmount(instance));
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
