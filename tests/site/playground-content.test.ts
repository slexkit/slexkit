import { describe, expect, it } from "bun:test";
import {
  loadComponentDocs,
  loadWikiDocs,
  parseMarkdownComponentDoc,
} from "../../site/data/component-docs.js";
import {
  analyzeSlexSource,
  canParseSlexSource,
  defaultPlaygroundSource,
  normalizePlaygroundMode,
} from "../../site/playground/playground-utils.js";
import { homePlaygroundConfig } from "../../site/playground/home-playground.js";
import { createPage as createDocsPage } from "../../site/pages/docs.slex.js";
import { createDocsPage as createDocsVmPage } from "../../site/routes/docs-page.js";
import { normalizeRoutePath } from "../../site/app/site-routes.js";
import { normalizeSiteBase, stripSiteBase, withSiteBase } from "../../site/app/site-base.js";

describe("site playground markdown renderer", () => {
  it("authors the home playground as markdown with an embedded SlexKit fence", () => {
    const playground = homePlaygroundConfig("zh-CN");

    expect(playground.sourceType).toBe("markdown");
    expect(playground.source).toContain("~~~slex");
    expect(playground.source).toContain("# 一阶 RC 低通滤波器");
    expect(playground.source).toContain("$$");
    expect(playground.source).toContain('namespace: "home_rc_filter"');
    expect(playground.source).toContain('type: "engineering"');
    expect(playground.source).toContain('value: "10kΩ"');
    expect(playground.source).toContain('value: "100nF"');
    expect(playground.source).toContain("value 保留原文，number 参与计算");
    expect(playground.source).toContain("animateInitial: true");
    expect(playground.source).toContain("工程输入可以直接写 `10kΩ`");

    const englishPlayground = homePlaygroundConfig("en-US");
    expect(englishPlayground.source).toContain("# First-order RC Low-pass Filter");
    expect(englishPlayground.source).not.toContain("# 一阶 RC 低通滤波器");
    expect(englishPlayground.source).toContain("Try 4.7kΩ, 220nF, 10kHz, and 500mV");
  });

  it("keeps the home hero brand-first with the expanded name below the title", async () => {
    const index = await Bun.file("site/index.html").text();
    const main = await Bun.file("site/main.js").text();
    const homeRoute = await Bun.file("site/routes/home.js").text();
    const router = await Bun.file("site/app/router.js").text();
    const homePlayground = await Bun.file("site/playground/home-playground.js").text();
    const css = await Bun.file("site/styles/docs-shell.css").text();
    const logoSvg = await Bun.file("site/assets/logo.svg").text();

    const playgroundLinks = Array.from(index.matchAll(/<a[\s\S]*?href="\/playground\.html\?mode=live"[\s\S]*?<\/a>/g), ([match]) => match);
    expect(playgroundLinks).toHaveLength(2);
    expect(playgroundLinks.every((link) => link.includes('target="_blank"'))).toBe(true);
    expect(playgroundLinks.every((link) => link.includes('rel="noreferrer"'))).toBe(true);
    expect(main).toContain("createHomeRoute");
    expect(homeRoute).toContain("function homeBrandLockup()");
    expect(homeRoute).toContain('document.createElement("span")');
    expect(homeRoute).toContain('logo.className = "slex-home-brand-logo slex-site-logo"');
    expect(homeRoute).not.toContain('logo.src = withSiteBase("/logo.svg")');
    expect(homeRoute).toContain('textElement("h1", "slex-home-title", "SlexKit")');
    expect(homeRoute).toContain("function homeExpandedName()");
    expect(homeRoute).toContain('{ accent: "EX", rest: "pressions" }');
    expect(homeRoute).toContain('{ accent: "Kit", rest: "" }');
    expect(homeRoute).toContain('initial.className = "slex-home-expanded-initial"');
    expect(homeRoute).toContain('rest.className = "slex-home-expanded-rest"');
    expect(homeRoute).not.toContain('textElement("div", "slex-home-eyebrow", "Streaming Live Expressions Kit")');
    expect(css).toContain(".slex-home-title");
    expect(css).toContain(".slex-home-brand-lockup");
    expect(css).toContain("align-items: center");
    expect(css).toContain("width: min(100%, 38rem)");
    expect(css).toContain(".slex-home-brand-row");
    expect(css).toContain(".slex-home-brand-logo");
    expect(css).toContain(".slex-site-logo");
    expect(css).toContain("background: var(--primary)");
    expect(css).toContain('mask: url("../assets/logo.svg") center / contain no-repeat');
    expect(css).not.toContain(".dark .slex-site-logo");
    expect(logoSvg).toContain('fill="currentColor"');
    expect(logoSvg).not.toContain('fill="#18181b"');
    expect(css).toContain(".slex-home-brand-text");
    expect(css).toContain(".slex-home-actions");
    expect(css).toContain("justify-content: center");
    expect(css).toContain(".slex-home-expanded-name");
    expect(css).toContain(".slex-home-preview");
    expect(css).toContain(".slex-home-preview::before");
    expect(css).toContain(".slex-home-preview-surface");
    expect(css).toContain("--slex-stat-initial-delay: 820ms");
    expect(css).toContain(".slex-home-preview-surface > .slexkit-root");
    expect(css).toContain(".slex-home-preview-surface > .slexkit-root > .slex-layout");
    expect(css).toContain(".slex-home-preview-surface .slex-home-playground");
    expect(css).toContain(".slex-home-playground .slex-playground-live-pane");
    expect(css).toContain(".slex-home-playground .slex-playground-live-code");
    expect(css).toContain("width: min(100%, 72rem)");
    expect(css.replaceAll("\r\n", "\n")).toContain(".slex-home-playground .slex-playground-preview-pane {\n  overflow: visible;");
    expect(css).not.toContain("height: min(78svh, 48rem)");
    expect(css).not.toContain("height: 80svh");
    expect(homeRoute).toContain("function mountHomePlayground(root)");
    expect(homePlayground).toContain('class: "slex-home-playground"');
    expect(homePlayground).toContain('previewMinHeight: "0px"');
    expect(homeRoute).toContain('surface.dataset.homePlayground = "true"');
    expect(homeRoute).toContain('"playground:demo": homePlaygroundConfig(currentLocale())');
    expect(router).toContain("home:${currentLocale()}");
    expect(homeRoute).toContain('previewLabel: "实时预览"');
    expect(homeRoute).toContain('previewLabel: "Live preview"');
    expect(homeRoute).toContain('primaryAction: "Quick start"');
    expect(homeRoute).not.toContain("function homePlaygroundHref()");
    expect(homeRoute).not.toContain("document.createElement(\"iframe\")");
    expect(homeRoute).not.toContain("slex-home-preview-frame");
    expect(css).toContain(".slex-home-expanded-initial");
    expect(css).toContain(".slex-home-expanded-rest");
    expect(css).toContain(".slex-home-expanded-char");
    expect(css).toContain("@keyframes slex-home-caret");
    expect(homeRoute).toContain("appendTypewriterChars");
    expect(homeRoute).toContain("slex-home-expanded-char");
    expect(css).toContain("width: min(100%, 38rem)");
    expect(css).toContain("flex-direction: column");
    expect(css).not.toContain(".slex-home-title-initial");
    expect(css).not.toContain(".slex-home-title-rest");
  });

  it("defaults standalone playground mode based on source presence", () => {
    expect(normalizePlaygroundMode(null, false)).toBe("render");
    expect(normalizePlaygroundMode(null, true)).toBe("render");
    expect(normalizePlaygroundMode("code", true)).toBe("code");
    expect(normalizePlaygroundMode("preview", false)).toBe("render");
    expect(normalizePlaygroundMode("split", true)).toBe("live");
  });

  it("ships a parseable standalone playground default source", () => {
    const match = defaultPlaygroundSource.match(/(?:```|~~~)slex\n([\s\S]*?)\n(?:```|~~~)/);
    expect(defaultPlaygroundSource).toContain("# First-order RC Low-pass Filter");
    expect(defaultPlaygroundSource).not.toContain("# 一阶 RC 低通滤波器");
    expect(defaultPlaygroundSource).toContain('namespace: "home_rc_filter"');
    expect(defaultPlaygroundSource).toContain('type: "engineering"');
    expect(defaultPlaygroundSource).toContain('value: "1kHz"');
    expect(defaultPlaygroundSource).toContain("animateInitial: true");
    expect(match?.[1]).toContain("this.r.number");
    expect(() => new Function(`"use strict"; return (${match?.[1]});`)()).not.toThrow();
    expect(canParseSlexSource(defaultPlaygroundSource)).toBe(true);
    expect(canParseSlexSource("```slex\n{ namespace: \n```")).toBe(false);
  });

  it("locates standalone playground SlexKit syntax errors", () => {
    const result = analyzeSlexSource(`# Broken

\`\`\`slex
{
  namespace: "broken",
  layout: {
    "card:demo": {
      title: "Missing close"
    }
  }
\`\`\`
`);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("Unexpected");
      expect(result.block).toBe(1);
      expect(result.editorLine).toBeGreaterThan(2);
      expect(result.detail).toContain("Expected closing delimiter");
    }
  });

  it("documents Card with the current component doc structure", async () => {
    const markdown = parseMarkdownComponentDoc(
      "content/components/card/zh-CN.md",
      await Bun.file("site/content/components/card/zh-CN.md").text(),
    ).markdown;

    expect(markdown).toContain("# Card 卡片");
    expect(markdown).toContain("## 使用提示");
    expect(markdown).toContain("### tone 变体");
    expect(markdown).toContain("| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |");
    expect(markdown).toContain("## API 参考");
    expect(markdown).not.toContain("## 标准示例");
    expect(markdown).toContain("slex:spec-example:start");
    expect(markdown).toContain("slex:spec-api:start");
    expect(markdown).toContain("\u0060\u0060\u0060slex");
    expect(markdown).toContain("| `title` | string |");
    expect(markdown).toContain("tone");
    expect(markdown).toContain("doc_card_typical");
    expect(markdown.indexOf("doc_card_typical")).toBeLessThan(markdown.indexOf("## 使用提示"));
    expect(markdown).not.toContain('render="playground"');
    expect(markdown).not.toContain("<iframe");
    expect(markdown).not.toContain("\u0060\u0060\u0060playground");
  });

  it("uses the Svelte markdown renderer for playground display mode", async () => {
    const renderer = await Bun.file("site/markdown/svelte-renderer.js").text();
    const markdownComponent = await Bun.file("site/markdown/MarkdownRenderer.svelte").text();
    const slexkitRenderer = await Bun.file("site/markdown/SlexCode.svelte").text();
    const highlightedCode = await Bun.file("site/markdown/HighlightedMarkdownCode.svelte").text();
    const headings = await Bun.file("site/markdown/headings.js").text();
    const runtimeLoader = await Bun.file("site/markdown/runtime-loader.js").text();
    const siteBuild = await Bun.file("site/scripts/build.ts").text();
    const staticExport = await Bun.file("site/scripts/export-static.ts").text();

    expect(renderer).toContain("mount(MarkdownRenderer");
    expect(renderer).toContain("createSlexKitMarkdownRuntimeHost");
    expect(renderer).toContain("runtimeHost.disposeArtifact(domain)");
    expect(renderer).not.toContain("createRoot");
    expect(markdownComponent).toContain("@humanspeak/svelte-markdown");
    expect(markdownComponent).toContain("normalizeHeadingAnchors(content)");
    expect(headings).toContain("\\{#([A-Za-z0-9_-]+)\\}");
    expect(markdownComponent).toContain("{#snippet code");
    expect(markdownComponent).toContain("slexkitRuntime");
    expect(markdownComponent).toContain("slexkitSecurePolicy");
    expect(slexkitRenderer).toContain('"playground:inline"');
    expect(slexkitRenderer).toContain("slex-doc-slexkit-demo--${effectiveRenderMode}");
    expect(slexkitRenderer).toContain("slex-doc-slexkit-demo--playground");
    expect(slexkitRenderer).toContain('sourceType: "slex"');
    expect(slexkitRenderer).toContain("mountSecureArtifact");
    expect(slexkitRenderer).toContain("activeRuntimeHost.mountBlock");
    expect(slexkitRenderer).toContain("getSlexKitMarkdownRuntimeHost");
    expect(slexkitRenderer).toContain("HighlightedMarkdownCode");
    expect(highlightedCode).toContain("svelte-highlight");
    expect(highlightedCode).toContain("languages/typescript");
    expect(highlightedCode).toContain("highlightMarkdownSlexFences");
    expect(highlightedCode).toContain("hljs-keyword");
    expect(siteBuild).toContain("resolvePackageFile");
    expect(slexkitRenderer).not.toMatch(/^\s*import\s+(?!type)[^;]*from "slexkit";/m);
    expect(runtimeLoader).toContain('"/slexkit.js"');
    expect(runtimeLoader).toContain("import(runtimeUrl)");
    expect(staticExport).toContain('join(outDir, "dist", "slexkit.runtime.js")');
    expect(staticExport).toContain('export * from "../slexkit.js"');
    expect(slexkitRenderer).not.toContain("import Playground");
    expect(renderer).not.toContain("React.createElement");
    expect(renderer).not.toContain("slex-doc-playground-frame");
  });

  it("exposes raw docs markdown through the shared rail Live mode action", async () => {
    const docsShell = await Bun.file("site/components/DocsShell.svelte").text();
    const docRail = await Bun.file("site/components/navigation/DocRail.svelte").text();
    const routeExamples = await Bun.file("site/routes/examples.js").text();
    const siteIcons = await Bun.file("site/app/icons.js").text();
    const docsPage = createDocsPage({ playgroundHrefBase: "/slexkit/playground.html" });
    const examplesPage = await Bun.file("site/pages/examples.slex.js").text();

    expect(docsPage.g.playgroundHrefBase).toBe("/slexkit/playground.html");
    expect(examplesPage).toContain("$playgroundHrefBase");
    expect(docsShell).toContain("function playgroundHref(doc: DocItem)");
    expect(docsShell).toContain('mode: "live"');
    expect(docsShell).toContain('type: "markdown"');
    expect(docsShell).toContain('src: href');
    expect(docRail).toContain("p.playgroundHref ?? p.liveHref");
    expect(docRail).toContain("以 Live 模式打开");
    expect(routeExamples).toContain('runtimeUrl: withSiteBase("/slexkit.js")');
    expect(routeExamples).not.toContain("/dist/slexkit.runtime.js");
    expect(routeExamples).toContain("return examples[0] ?? null");
    expect(routeExamples).not.toContain("data:text/markdown;charset=utf-8");
    expect(siteIcons).toContain('"square-split-horizontal": SquareSplitHorizontalRegular');
  });

  it("keeps component-mode markdown Slex fences unframed", async () => {
    const css = await Bun.file("site/styles/site-components.css").text();

    expect(css).toContain(".slex-doc-prose .slex-doc-slexkit-demo--playground");
    expect(css).toContain(".slex-doc-prose .slex-doc-slexkit-demo--component");
    expect(css).toContain("border: 0 !important;");
    expect(css).toContain("padding: 0 !important;");
  });
});
