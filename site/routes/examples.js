import { ingest } from "../../src/engine/index";
import { renderToolCall } from "../../src/toolhost/index";
import { loadExampleDocs } from "../data/examples.js";
import { siteUiLabelsForLocale } from "../data/component-docs.js";
import { renderMarkdown } from "../markdown/svelte-renderer.js";
import { createPage as createExamplesShellPage } from "../pages/examples.slex.js";
import { siteFetch, withSiteBase } from "../app/site-base.js";

function renderDialogDemo(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;min-height:70vh;background:var(--background);">
      <div style="flex:1;overflow-y:auto;padding:1.5rem;display:flex;flex-direction:column;gap:0.25rem;max-width:48rem;margin:0 auto;width:100%;" id="dialog-messages"></div>
      <div style="padding:0.75rem 1.5rem 1rem;max-width:48rem;margin:0 auto;width:100%;text-align:center;border-top:1px solid var(--border);" id="dialog-actions"></div>
    </div>
  `;

  const messagesEl = container.querySelector("#dialog-messages");
  const actionsEl = container.querySelector("#dialog-actions");
  let toolHandle = null;

  function addUser(text) {
    const div = document.createElement("div");
    div.style.cssText = "display:flex;justify-content:flex-end;padding:0.375rem 0;";
    div.innerHTML = `<div style="max-width:75%;padding:0.625rem 1.125rem;border-radius:1.25rem 1.25rem 0.25rem 1.25rem;background:var(--primary);color:var(--primary-foreground);line-height:1.5;font-size:0.9rem;">${text}</div>`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addAi(text) {
    const div = document.createElement("div");
    div.style.cssText = "display:flex;gap:0.5rem;padding:0.5rem 0;align-items:flex-start;";
    div.innerHTML = `<div style="width:1.75rem;height:1.75rem;border-radius:50%;background:var(--muted);color:var(--muted-foreground);display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;flex-shrink:0;margin-top:0.125rem;">AI</div><div style="line-height:1.65;color:var(--foreground);font-size:0.9rem;padding-top:0.125rem;">${text}</div>`;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addResultCard(rows) {
    const card = document.createElement("div");
    card.style.cssText = "border:1px solid var(--border);border-radius:var(--radius);background:var(--card);overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,0.04);";
    const rowsHtml = rows.map(([k, v], i) => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0;${i < rows.length - 1 ? "border-bottom:1px solid var(--border);" : ""}font-size:0.875rem;">
        <span style="color:var(--muted-foreground);font-size:0.8rem;">${k}</span>
        <span style="font-weight:500;">${v}</span>
      </div>
    `).join("");
    card.innerHTML = `
      <div style="padding:0.75rem 1.25rem;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:0.5rem;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:1.25rem;height:1.25rem;border-radius:50%;background:var(--primary);color:var(--primary-foreground);font-size:0.6rem;">✓</span>
        <span style="font-weight:600;font-size:0.875rem;">提交成功</span>
      </div>
      <div style="padding:0 1.25rem 0.25rem;">${rowsHtml}</div>
    `;
    messagesEl.appendChild(card);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showToolHost() {
    const host = document.createElement("div");
    host.style.cssText = "padding:0.375rem 0;";
    messagesEl.appendChild(host);

    toolHandle = renderToolCall({
      name: "fill-form",
      arguments: {
        title: "创建新项目",
        description: "请填写项目的基本信息。",
        submitLabel: "提交",
        ignoreLabel: "取消",
        fields: [
          { name: "name", label: "项目名称", type: "text", placeholder: "my-project", required: true },
          { name: "type", label: "项目类型", type: "select", options: [
            { label: "Web 应用", value: "web" },
            { label: "API 服务", value: "api" },
            { label: "CLI 工具", value: "cli" },
          ]},
          { name: "priority", label: "优先级", type: "select", options: [
            { label: "低", value: "low" },
            { label: "中", value: "medium" },
            { label: "高", value: "high" },
          ]},
        ],
      },
    }, host);

    messagesEl.scrollTop = messagesEl.scrollHeight;

    toolHandle.promise.then((result) => {
      toolHandle.dispose();
      host.remove();

      if (result.status === "submitted") {
        const v = result.value || {};
        addResultCard(Object.entries(v).map(([k, val]) => [k, String(val)]));
        addAi(`项目 <strong>${v.name || ""}</strong> 已创建成功，可以开始开发了。`);
      } else {
        addAi("操作已取消，如果你需要帮助随时告诉我。");
      }
      showResetBtn();
    });
  }

  function showResetBtn() {
    actionsEl.innerHTML = `<button id="th-reset" style="padding:0.4rem 1rem;border:1px solid var(--border);border-radius:var(--radius);background:var(--background);color:var(--muted-foreground);cursor:pointer;font-size:0.8rem;transition:all 0.15s;" onmouseover="this.style.borderColor='var(--primary)';this.style.color='var(--primary)'" onmouseout="this.style.borderColor='var(--border)';this.style.color='var(--muted-foreground)'">重新演示</button>`;
    actionsEl.querySelector("#th-reset").addEventListener("click", startConversation);
  }

  function startConversation() {
    if (toolHandle) { toolHandle.dispose(); toolHandle = null; }
    messagesEl.innerHTML = "";
    actionsEl.innerHTML = "";
    addUser("帮我创建一个新项目，用来做公司官网");
    setTimeout(() => {
      addAi("好的，我需要一些基本信息来帮你配置项目。请填写以下表单：");
      setTimeout(showToolHost, 200);
    }, 400);
  }

  startConversation();
}

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
        dialogContainer.style.cssText = "margin-top:2rem;border:1px solid var(--border);border-radius:var(--radius);overflow:hidden;";
        markdownHost.appendChild(dialogContainer);
        renderDialogDemo(dialogContainer);
        addMarkdownCleanup(() => { dialogContainer.remove(); });
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
