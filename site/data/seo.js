import { loadWikiDocs, supportedLocales } from "./component-docs.js";
import { defaultLocale } from "./locales.js";
import { discoverExampleMarkdown, discoverWikiMarkdown } from "./content-discovery.js";
import { loadExampleDocs } from "./examples.js";

const siteName = "SlexKit";
const defaultDescription =
  "\"Docs as tools, tools as docs\" renders explicit Markdown fences as stateful UI blocks.";
const homeDescriptions = {
  "en-US": defaultDescription,
  "zh-CN": "\"文档即工具，工具即文档\"，把显式 Markdown fence 渲染成带状态的交互块。",
};

export function prerenderedHomeHtml(locale = "en-US") {
  if (locale === "zh-CN") {
    return `<main class="slex-home-page slex-prerendered-content">
  <section class="slex-home-hero">
    <div class="slex-home-copy">
      <h1>SlexKit</h1>
      <p><strong>Streaming Live EXpressions Kit</strong></p>
      <p class="slex-home-lede">"文档即工具，工具即文档"，把显式 Markdown fence 渲染成带状态的交互块。</p>
      <p>SlexKit 是面向 Markdown 宿主的交互式 UI 运行时。文档中写显式 <code>slex</code> fence，运行时负责挂载表单、指标、计算器和预览组件；不需要为每段内容增加构建流程。</p>
      <h2>能力范围</h2>
      <ul>
        <li><strong>零构建</strong> — 在 Markdown 中直接写 slex fence；宿主只需加载运行时和样式</li>
        <li><strong>流式渲染</strong> — 适合消息流和文档流：内容到达后按 fence 挂载</li>
        <li><strong>响应式状态</strong> — 同一 artifact 内共享状态，控件和展示组件可以联动</li>
        <li><strong>组件集</strong> — 内置常用文档组件：卡片、表单、表格、代码块、标签页等</li>
        <li><strong>安全沙箱</strong> — 不可信内容可放入 secure runtime，与宿主页隔离</li>
        <li><strong>工具调用渲染</strong> — ToolHost 把确认、选择和表单类工具调用渲染成可提交 UI</li>
      </ul>
      <h2>快速示例</h2>
      <p>在 Markdown 中写一个交互式计算器：</p>
      <pre><code>\`\`\`slex
{
  namespace: "seo_home_calculator",
  g: { price: 99, qty: 3 },
  layout: {
    "row:inputs": {
      "input:price": {
        type: "number",
        label: "单价",
        "$value": "g.price",
        onchange: "g.price = Number($event || 0)"
      },
      "input:qty": {
        type: "number",
        label: "数量",
        "$value": "g.qty",
        onchange: "g.qty = Number($event || 0)"
      },
      "stat:total": {
        label: "总价",
        "$value": "g.price * g.qty"
      }
    }
  }
}
\`\`\`</code></pre>
      <h2>开始使用</h2>
      <ul>
        <li><a href="/docs/guides/intro">简介</a> — 了解 SlexKit 的设计理念</li>
        <li><a href="/docs/guides/quick-start">快速开始</a> — 5 分钟上手 SlexKit</li>
        <li><a href="/docs/components/accordion">组件文档</a> — 浏览所有可用组件</li>
        <li><a href="/examples">示例中心</a> — 查看应用场景示例</li>
        <li><a href="https://www.npmjs.com/package/slexkit">npm</a> — 安装 <code>npm install slexkit</code></li>
        <li><a href="https://github.com/slexkit/slexkit">GitHub</a> — 源码与贡献</li>
      </ul>
      <h2>AI / LLM 文档接入</h2>
      <p>供 agent 读取的索引、全文和 MCP 入口：</p>
      <ul>
        <li><a href="/llms.txt">/llms.txt</a> — 文档索引，包含所有指南、组件、示例和参考文档的结构化目录</li>
        <li><a href="/llms-full.txt">/llms-full.txt</a> — 完整英文文档（单文件），包含所有 Markdown 源文件</li>
        <li><a href="/llms-components.txt">/llms-components.txt</a> — 组件文档与 props/state 参考</li>
        <li><a href="/llms-runtime.txt">/llms-runtime.txt</a> — 运行时、宿主集成与安全渲染文档</li>
        <li><a href="/llms-toolhost.txt">/llms-toolhost.txt</a> — ToolHost 结构化用户输入文档</li>
        <li><a href="/llms-authoring.txt">/llms-authoring.txt</a> — slex fence 编写规则</li>
        <li><a href="/slexkit-ai-manifest.json">/slexkit-ai-manifest.json</a> — 机器可读的页面与组件元数据</li>
      </ul>
      <p>MCP 服务器：<code>npx -y @slexkit/mcp</code>（只读，提供文档查询、示例浏览和 Slex 源码校验）</p>
    </div>
  </section>
</main>`;
  }

  return `<main class="slex-home-page slex-prerendered-content">
  <section class="slex-home-hero">
    <div class="slex-home-copy">
      <h1>SlexKit</h1>
      <p><strong>Streaming Live EXpressions Kit</strong></p>
      <p class="slex-home-lede">"Docs as tools, tools as docs" renders explicit Markdown fences as stateful UI blocks.</p>
      <p>SlexKit is an interactive UI runtime for Markdown hosts. Write explicit <code>slex</code> fences in the document; the runtime mounts forms, metrics, calculators, and previews without adding a build step for each artifact.</p>
      <h2>Runtime scope</h2>
      <ul>
        <li><strong>Zero-build</strong> — Write slex fences directly in Markdown; the host loads the runtime and CSS.</li>
        <li><strong>Streaming</strong> — Works with message and document streams; fences mount as content arrives.</li>
        <li><strong>Reactive state</strong> — Components in one artifact can share state and update together.</li>
        <li><strong>Component set</strong> — Built-in document components: cards, forms, tables, code blocks, tabs, and more.</li>
        <li><strong>Secure sandbox</strong> — Run untrusted content in a secure runtime isolated from the host page.</li>
        <li><strong>Tool-call rendering</strong> — ToolHost renders confirmations, choices, and forms as submit-ready UI.</li>
      </ul>
      <h2>Quick Example</h2>
      <p>Write an interactive calculator in Markdown:</p>
      <pre><code>\`\`\`slex
{
  namespace: "seo_home_calculator",
  g: { price: 99, qty: 3 },
  layout: {
    "row:inputs": {
      "input:price": {
        type: "number",
        label: "Price",
        "$value": "g.price",
        onchange: "g.price = Number($event || 0)"
      },
      "input:qty": {
        type: "number",
        label: "Qty",
        "$value": "g.qty",
        onchange: "g.qty = Number($event || 0)"
      },
      "stat:total": {
        label: "Total",
        "$value": "g.price * g.qty"
      }
    }
  }
}
\`\`\`</code></pre>
      <h2>Get Started</h2>
      <ul>
        <li><a href="/docs/guides/intro">Introduction</a> — Learn about SlexKit's design philosophy</li>
        <li><a href="/docs/guides/quick-start">Quick Start</a> — Get up and running in 5 minutes</li>
        <li><a href="/docs/components/accordion">Component Docs</a> — Browse all available components</li>
        <li><a href="/examples">Examples</a> — Browse use-case examples</li>
        <li><a href="https://www.npmjs.com/package/slexkit">npm</a> — Install with <code>npm install slexkit</code></li>
        <li><a href="https://github.com/slexkit/slexkit">GitHub</a> — Source code and contributions</li>
      </ul>
      <h2>AI / LLM Documentation</h2>
      <p>Index, full context, and MCP entry points for agents:</p>
      <ul>
        <li><a href="/llms.txt">/llms.txt</a> — Documentation index with structured table of contents for all guides, components, examples, and reference docs</li>
        <li><a href="/llms-full.txt">/llms-full.txt</a> — Full English documentation in a single file (all Markdown source)</li>
        <li><a href="/llms-components.txt">/llms-components.txt</a> — Component docs with props/state reference</li>
        <li><a href="/llms-runtime.txt">/llms-runtime.txt</a> — Runtime, host integration, and secure rendering docs</li>
        <li><a href="/llms-toolhost.txt">/llms-toolhost.txt</a> — ToolHost structured user-input docs</li>
        <li><a href="/llms-authoring.txt">/llms-authoring.txt</a> — slex fence authoring rules</li>
        <li><a href="/slexkit-ai-manifest.json">/slexkit-ai-manifest.json</a> — Machine-readable page and component metadata</li>
      </ul>
      <p>MCP server: <code>npx -y @slexkit/mcp</code> (read-only: docs search, examples browsing, Slex source validation)</p>
    </div>
  </section>
</main>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, "&apos;");
}

function normalizePath(path) {
  const value = String(path || "/").split(/[?#]/)[0] || "/";
  if (value === "/") return "/";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function unlocalizedPath(path) {
  const normalized = normalizePath(path);
  const match = normalized.match(/^\/([^/]+)(\/.*)?$/);
  if (match && supportedLocales.includes(match[1])) return match[2] || "/";
  return normalized;
}

function localizedPath(path, locale) {
  const base = unlocalizedPath(path);
  return locale === defaultLocale ? base : `/${locale}${base === "/" ? "/" : base}`;
}

function localeCode(locale) {
  return locale.replace("-", "_");
}

function normalizePublicBaseUrl(publicBaseUrl = "https://slexkit.github.io/slexkit/") {
  const value = String(publicBaseUrl || "").trim() || "https://slexkit.github.io/slexkit/";
  return value.endsWith("/") ? value : `${value}/`;
}

export function absoluteSiteUrl(path, publicBaseUrl) {
  const base = normalizePublicBaseUrl(publicBaseUrl);
  const clean = normalizePath(path).replace(/^\/+/, "");
  return new URL(clean, base).toString();
}

function normalizeDescription(value) {
  const text = String(value || defaultDescription).replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 177).trim()}...` : text;
}

function createPage({ path, locale, title, description, kind = "website", canonicalPath = path }) {
  const nextPath = normalizePath(path);
  const basePath = unlocalizedPath(canonicalPath);
  return {
    path: nextPath,
    key: normalizePath(nextPath),
    locale,
    title,
    description: normalizeDescription(description),
    kind,
    canonicalPath: localizedPath(basePath, locale),
    unlocalizedPath: basePath,
  };
}

function homePage(locale) {
  return createPage({
    path: localizedPath("/", locale),
    locale,
    title: locale === "zh-CN" ? "SlexKit - 交互式 Markdown UI 运行时" : "SlexKit - Streaming Live EXpressions Kit",
    description: homeDescriptions[locale] ?? defaultDescription,
    kind: "website",
    canonicalPath: "/",
  });
}

function docsIndexPage(locale) {
  return createPage({
    path: localizedPath("/docs", locale),
    locale,
    title: locale === "zh-CN" ? "文档 - SlexKit" : "Docs - SlexKit",
    description: locale === "zh-CN" ? "浏览 SlexKit 指南、组件和参考文档。" : "Browse SlexKit guides, components, and reference documentation.",
    canonicalPath: "/docs/guides/intro",
  });
}

function examplesIndexPage(locale) {
  return createPage({
    path: localizedPath("/examples", locale),
    locale,
    title: locale === "zh-CN" ? "示例中心 - SlexKit" : "Examples - SlexKit",
    description: locale === "zh-CN"
      ? "浏览可直接运行的 SlexKit 示例：宿主接入、入门路径和计算器场景。"
      : "Browse runnable SlexKit examples: host integration, learning paths, and calculator scenarios.",
    canonicalPath: "/examples",
  });
}

function legacyPage(path, canonicalPath, locale = defaultLocale) {
  return createPage({
    path: localizedPath(path, locale),
    locale,
    title: `${siteName} - ${unlocalizedPath(canonicalPath).split("/").filter(Boolean).pop() ?? "Docs"}`,
    description: defaultDescription,
    canonicalPath,
  });
}

function docPage(doc) {
  return createPage({
    path: doc.href,
    locale: doc.locale,
    title: `${doc.title} - ${siteName}`,
    description: doc.summary || defaultDescription,
    kind: "article",
    canonicalPath: doc.href,
  });
}

export async function createSeoIndex({ siteRoot }) {
  const markdown = await discoverWikiMarkdown({ siteRoot });
  const exampleMarkdown = (await Promise.all(supportedLocales.map((locale) => discoverExampleMarkdown({ siteRoot, locale })))).flat();
  const pages = [];

  for (const locale of supportedLocales) {
    pages.push(homePage(locale), docsIndexPage(locale), examplesIndexPage(locale));
    const docs = await loadWikiDocs({ markdownItems: markdown, locale });
    pages.push(...docs.map(docPage));
    const examples = loadExampleDocs({ markdownItems: exampleMarkdown, locale });
    pages.push(...examples.map(docPage));
  }

  for (const locale of supportedLocales) {
    pages.push(legacyPage("/components", "/docs/components/accordion", locale));
    pages.push(legacyPage("/design", "/docs/guides/design", locale));
  }

  const byPath = new Map();
  for (const page of pages) {
    byPath.set(normalizePath(page.path), page);
  }

  return {
    pages,
    byPath,
    pageForPath(path) {
      const normalized = normalizePath(path);
      return byPath.get(normalized) ?? byPath.get(unlocalizedPath(normalized)) ?? homePage(defaultLocale);
    },
  };
}

export function seoAlternates(page) {
  return supportedLocales.map((locale) => ({
    locale,
    path: localizedPath(page.unlocalizedPath, locale),
  }));
}

function jsonLd(page, publicBaseUrl) {
  const canonicalUrl = absoluteSiteUrl(page.canonicalPath, publicBaseUrl);

  if (page.unlocalizedPath === "/") {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: canonicalUrl,
      description: page.description,
      inLanguage: page.locale,
    });
  }

  if (page.kind === "article") {
    const pageTitle = page.title.replace(/ - SlexKit$/, "");
    const breadcrumbs = [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteSiteUrl("/", publicBaseUrl) },
      { "@type": "ListItem", position: 2, name: "Docs", item: absoluteSiteUrl("/docs/guides/intro", publicBaseUrl) },
      { "@type": "ListItem", position: 3, name: pageTitle, item: canonicalUrl },
    ];

    return JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: pageTitle,
        description: page.description,
        url: canonicalUrl,
        author: { "@type": "Organization", name: siteName },
        publisher: { "@type": "Organization", name: siteName },
        inLanguage: page.locale,
        isPartOf: { "@type": "WebSite", name: siteName, url: absoluteSiteUrl("/", publicBaseUrl) },
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs,
      },
    ]);
  }

  return "";
}

export function seoHead(page, { publicBaseUrl, imagePath = "/og.svg" } = {}) {
  const canonicalUrl = absoluteSiteUrl(page.canonicalPath, publicBaseUrl);
  const imageUrl = absoluteSiteUrl(imagePath, publicBaseUrl);
  const alternates = seoAlternates(page);
  const alternateTags = alternates
    .map((entry) => `  <link rel="alternate" hreflang="${entry.locale}" href="${escapeHtml(absoluteSiteUrl(entry.path, publicBaseUrl))}" />`)
    .join("\n");
  const defaultAlternate = alternates.find((entry) => entry.locale === defaultLocale) ?? alternates[0];
  const ldJson = jsonLd(page, publicBaseUrl);

  return [
    "<!-- slexkit:seo:start -->",
    `  <meta name="description" content="${escapeHtml(page.description)}" />`,
    '  <meta name="robots" content="index,follow" />',
    `  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    alternateTags,
    defaultAlternate
      ? `  <link rel="alternate" hreflang="x-default" href="${escapeHtml(absoluteSiteUrl(defaultAlternate.path, publicBaseUrl))}" />`
      : "",
    `  <meta property="og:title" content="${escapeHtml(page.title)}" />`,
    `  <meta property="og:description" content="${escapeHtml(page.description)}" />`,
    `  <meta property="og:type" content="${page.kind === "article" ? "article" : "website"}" />`,
    `  <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `  <meta property="og:site_name" content="${siteName}" />`,
    `  <meta property="og:locale" content="${localeCode(page.locale)}" />`,
    ...supportedLocales
      .filter((locale) => locale !== page.locale)
      .map((locale) => `  <meta property="og:locale:alternate" content="${localeCode(locale)}" />`),
    `  <meta property="og:image" content="${escapeHtml(imageUrl)}" />`,
    '  <meta property="og:image:type" content="image/svg+xml" />',
    '  <meta name="twitter:card" content="summary_large_image" />',
    `  <meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
    `  <meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
    `  <meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`,
    ...(ldJson ? [`  <script type="application/ld+json">${ldJson}</script>`] : []),
    "<!-- slexkit:seo:end -->",
  ].filter(Boolean).join("\n");
}

export function injectSeoHead(html, page, options = {}) {
  const title = `<title>${escapeHtml(page.title)}</title>`;
  const tags = seoHead(page, options);
  const withoutSeo = String(html).replace(/\n?\s*<!-- slexkit:seo:start -->[\s\S]*?<!-- slexkit:seo:end -->/g, "");
  const withTitle = withoutSeo.match(/<title>[\s\S]*?<\/title>/i)
    ? withoutSeo.replace(/<title>[\s\S]*?<\/title>/i, title)
    : withoutSeo.replace(/<\/head>/i, `  ${title}\n</head>`);
  return withTitle.replace(/(<title>[\s\S]*?<\/title>)/i, `$1\n${tags}`);
}

export function renderRobotsTxt({ publicBaseUrl }) {
  return [
    "User-agent: *",
    "Allow: /",
    `Sitemap: ${absoluteSiteUrl("/sitemap.xml", publicBaseUrl)}`,
    "",
  ].join("\n");
}

export function renderSitemapXml(pages, { publicBaseUrl, lastmod }) {
  const canonicalPages = pages.filter((page) => page.path === localizedPath(page.unlocalizedPath, page.locale));
  const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : "";
  const urls = canonicalPages.map((page) => {
    const alternates = seoAlternates(page)
      .map((entry) => `    <xhtml:link rel="alternate" hreflang="${entry.locale}" href="${escapeXml(absoluteSiteUrl(entry.path, publicBaseUrl))}" />`)
      .join("\n");
    const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(absoluteSiteUrl(localizedPath(page.unlocalizedPath, defaultLocale), publicBaseUrl))}" />`;
    return [
      "  <url>",
      `    <loc>${escapeXml(absoluteSiteUrl(page.path, publicBaseUrl))}</loc>`,
      ...(lastmodTag ? [lastmodTag] : []),
      alternates,
      xDefault,
      "  </url>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
