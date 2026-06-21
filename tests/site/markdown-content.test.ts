import { describe, expect, it } from "bun:test";
import { componentSpecs } from "../../src/components/entries/specs";
import {
  exportComponentSpecManifest,
  loadComponentDocs,
  loadWikiDocs,
  parseMarkdownComponentDoc,
  parseMarkdownGuideDoc,
  publicComponentSlugs,
} from "../../site/data/component-docs.js";
import { sourceLocale, supportedLocales } from "../../site/data/locales.js";
import { discoverGuideMarkdown, discoverReferenceMarkdown, discoverReleaseMarkdown } from "../../site/data/content-discovery.js";
import { discoverExampleMarkdown } from "../../site/data/content-discovery.js";
import { loadExampleDocs } from "../../site/data/examples.js";
import { normalizeHeadingAnchors } from "../../site/markdown/headings.js";
import { localizedComponentSpec, specApiHash, specExampleHash } from "../../site/data/spec-docs.js";
import {
  analyzeSlexSource,
  canParseSlexSource,
  defaultPlaygroundSource,
  normalizePlaygroundMode,
} from "../../site/playground/playground-utils.js";
import { createPage as createDocsPage } from "../../site/pages/docs.slex.js";
import { createDocsPage as createDocsVmPage } from "../../site/routes/docs-page.js";
import { normalizeRoutePath } from "../../site/app/site-routes.js";
import { normalizeSiteBase, stripSiteBase, withSiteBase } from "../../site/app/site-base.js";
import { parseSlexSource } from "../../src/engine/diagnostics";
import { componentTitleForLocale } from "../../site/data/doc-metadata.js";

function parseGeneratedSpecAttrs(markdown: string, kind: "spec-api" | "spec-example", component: string) {
  const pattern = new RegExp(`<!--\\s*slex:${kind}:start\\s+([^>]*)-->`, "g");
  for (const match of markdown.matchAll(pattern)) {
    const attrs = Object.fromEntries(
      [...match[1].matchAll(/([a-zA-Z]+)="([^"]*)"/g)].map((entry) => [entry[1], entry[2]]),
    );
    if (attrs.component === component) return attrs;
  }
  throw new Error(`${component} is missing generated ${kind} block`);
}

const stateModes: Record<string, "value" | "checked" | "enabled" | "readable"> = {
  input: "value",
  slider: "value",
  select: "value",
  tabs: "value",
  "radio-group": "value",
  checkbox: "checked",
  switch: "enabled",
  stat: "readable",
  text: "readable",
  progress: "readable",
  badge: "readable",
  callout: "readable",
  "code-block": "readable",
  divider: "readable",
  formula: "readable",
  link: "readable",
  table: "readable",
  section: "readable",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function collectStatefulComponentUses(
  layout: Record<string, unknown>,
  namespace: string,
  uses: Array<{ namespace: string; type: string; name: string; mode: string }>,
) {
  for (const [key, value] of Object.entries(layout)) {
    if (!isRecord(value)) continue;
    const separatorIndex = key.indexOf(":");
    if (separatorIndex > 0) {
      const type = key.slice(0, separatorIndex);
      const name = key.slice(separatorIndex + 1);
      const mode = stateModes[type];
      if (mode && name) uses.push({ namespace, type, name, mode });
    }
    collectStatefulComponentUses(value, namespace, uses);
  }
}

function slexLayoutFromParsedSource(source: unknown): Record<string, unknown> | undefined {
  if (!isRecord(source)) return undefined;
  if (isRecord(source.layout)) return source.layout;
  const { slex: _slex, namespace: _namespace, g: _g, layout: _layout, ...bareLayout } = source;
  return Object.keys(bareLayout).some((key) => key.includes(":")) ? bareLayout : undefined;
}

function findWritableReadableStateCollisions(markdown: string): string[] {
  const uses: Array<{ namespace: string; type: string; name: string; mode: string }> = [];
  const fences = Array.from(markdown.matchAll(/```slex\s*\n([\s\S]*?)\n```/g), (match) => match[1]);
  for (const fence of fences) {
    const parsed = parseSlexSource(fence);
    if (!parsed.ok) continue;
    const namespace = isRecord(parsed.value) ? String(parsed.value.namespace || "default") : "default";
    const layout = slexLayoutFromParsedSource(parsed.value);
    if (layout) collectStatefulComponentUses(layout, namespace, uses);
  }

  const byNamespaceAndName = new Map<string, typeof uses>();
  for (const use of uses) {
    const key = `${use.namespace}:${use.name}`;
    const group = byNamespaceAndName.get(key) ?? [];
    group.push(use);
    byNamespaceAndName.set(key, group);
  }

  const writableModes = new Set(["value", "checked", "enabled"]);
  const collisions: string[] = [];
  for (const [key, group] of byNamespaceAndName) {
    if (group.some((use) => writableModes.has(use.mode)) && group.some((use) => use.mode === "readable")) {
      collisions.push(`${key} (${group.map((use) => use.type).join(", ")})`);
    }
  }
  return collisions;
}

function findWritableCrossTypeStateCollisions(markdown: string): string[] {
  const uses: Array<{ namespace: string; type: string; name: string; mode: string }> = [];
  const fences = Array.from(markdown.matchAll(/```slex\s*\n([\s\S]*?)\n```/g), (match) => match[1]);
  for (const fence of fences) {
    const parsed = parseSlexSource(fence);
    if (!parsed.ok) continue;
    const namespace = isRecord(parsed.value) ? String(parsed.value.namespace || "default") : "default";
    const layout = slexLayoutFromParsedSource(parsed.value);
    if (layout) collectStatefulComponentUses(layout, namespace, uses);
  }

  const writableModes = new Set(["value", "checked", "enabled"]);
  const writableUses = uses.filter((use) => writableModes.has(use.mode));
  const byNamespaceAndName = new Map<string, typeof writableUses>();
  for (const use of writableUses) {
    const key = `${use.namespace}:${use.name}`;
    const group = byNamespaceAndName.get(key) ?? [];
    group.push(use);
    byNamespaceAndName.set(key, group);
  }

  const collisions: string[] = [];
  for (const [key, group] of byNamespaceAndName) {
    const types = [...new Set(group.map((use) => use.type))];
    if (types.length > 1) collisions.push(`${key} (${types.join(", ")})`);
  }
  return collisions;
}

function expectParseableSlexFences(markdown: string, context: string) {
  const fences = Array.from(markdown.matchAll(/```slex\s*\n([\s\S]*?)\n```/g), (match) => match[1]);
  for (const fence of fences) {
    const parsed = parseSlexSource(fence);
    expect(parsed.ok, `${context}\n${fence}`).toBe(true);
  }
}

describe("site markdown content", () => {
  it("parses frontmatter and keeps markdown as the render source", () => {
    const doc = parseMarkdownComponentDoc(
      "./content/components/button/zh-CN.md",
      `\uFEFF---
title: Button
titleZh: Button button
category: Action
status: ready
order: 10
summary: Trigger action.
slexkitRenderMode: component
---

# Button

Intro text.

<!-- slex:spec-example:start component="button" id="basic" sourceHash="example" -->
\`\`\`slex
{ "namespace": "spec_button_basic", "layout": { "button:demo": { "label": "Refresh" } } }
\`\`\`
<!-- slex:spec-example:end -->

## Usage

Body text.

\`\`\`slex
{ "namespace": "doc_button", "layout": {} }
\`\`\`

## Design

More body text.

## API 参考 {#api}

<!-- slex:spec-api:start component="button" sourceHash="api" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| \`label\` | string | 否 | 是 |  | 按钮文本。 |
<!-- slex:spec-api:end -->`,
    );

    expect(doc.slug).toBe("button");
    expect(doc.title).toBe("Button 按钮");
    expect(doc.category).toBe("Action");
    expect(doc.status).toBe("ready");
    expect(doc.order).toBe(10);
    expect(doc.bodyHtml).toBe('<div data-markdown-doc="button"></div>');
    expect(doc.markdown).toContain("## Usage");
    expect(doc.markdown).toContain("```slex");
    expect(doc.markdown).toContain("## Design");
    expect(doc.markdown).toContain("slex:spec-example:start");
    expect(doc.toc.map((item) => item.title)).toEqual(["Button", "Usage", "Design", "API 参考"]);
    expect(doc.toc[0]).toMatchObject({ id: "button", depth: 1 });
    expect(doc.toc[1]).toMatchObject({ id: "usage", depth: 2 });
    expect(doc.slexkitRenderMode).toBe("component");
  });

  it("uses docs playground rendering by default and accepts page-level render mode frontmatter", () => {
    const defaultGuide = parseMarkdownGuideDoc("content/guides/intro/en-US.md", "# Intro");
    const componentGuide = parseMarkdownGuideDoc(
      "content/guides/design/en-US.md",
      `---
title: Design
slexkitRenderMode: component
---

# Design`,
    );
    const playgroundComponent = parseMarkdownComponentDoc(
      "content/components/button/en-US.md",
      `---
title: Button
slexkitRenderMode: playground
---

# Button

<!-- slex:spec-example:start component="button" id="basic" sourceHash="example" -->
\`\`\`slex
{ "namespace": "spec_button_basic", "layout": { "button:demo": { "label": "Refresh" } } }
\`\`\`
<!-- slex:spec-example:end -->

## API Reference {#api}

<!-- slex:spec-api:start component="button" sourceHash="api" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| \`label\` | string | No | Yes |  | Visible button text. |
<!-- slex:spec-api:end -->`,
    );

    expect(defaultGuide.slexkitRenderMode).toBe("playground");
    expect(componentGuide.slexkitRenderMode).toBe("component");
    expect(playgroundComponent.slexkitRenderMode).toBe("playground");
  });

  it("keeps component navigation titles localized", () => {
    expect(componentTitleForLocale("formula", "Formula", "zh-CN")).toBe("Formula 公式");
    expect(componentTitleForLocale("formula", "Formula 公式", "en-US")).toBe("Formula");
  });

  it("keeps the page toc aligned with rendered markdown heading anchors", () => {
    const markdown = `# AI Docs

## Context Files

\`\`\`\`md
## SlexKit
\`\`\`\`

## Context Files

### Manual Installation {#manual-install}
`;
    const doc = parseMarkdownGuideDoc("content/guides/ai-docs/en-US.md", markdown);
    const normalized = normalizeHeadingAnchors(doc.markdown);

    expect(doc.toc).toEqual([
      { id: "ai-docs", title: "AI Docs", depth: 1 },
      { id: "context-files", title: "Context Files", depth: 2 },
      { id: "context-files-2", title: "Context Files", depth: 2 },
    ]);
    expect(doc.toc.some((item) => item.id === "manual-install")).toBe(false);
    expect(normalized).toContain('<span id="ai-docs" class="slex-doc-heading-anchor"></span>\n# AI Docs');
    expect(normalized).toContain('<span id="context-files" class="slex-doc-heading-anchor"></span>\n## Context Files');
    expect(normalized).toContain('<span id="context-files-2" class="slex-doc-heading-anchor"></span>\n## Context Files');
    expect(normalized).toContain('<span id="manual-install" class="slex-doc-heading-anchor"></span>\n### Manual Installation');
    expect(normalized).toContain("````md\n## SlexKit\n````");
    expect(normalized).not.toContain('id="slexkit"');
  });

  it("loads component docs only from markdown modules", async () => {
    const docs = await loadComponentDocs({
      locale: "en-US",
      markdownModules: {
        "./content/components/button/en-US.md": async () => `---
title: Button
category: Action
status: ready
order: 1
summary: Markdown summary.
---

# Button

<!-- slex:spec-example:start component="button" id="basic" sourceHash="example" -->
\`\`\`slex
{ "namespace": "spec_button_basic", "layout": { "button:demo": { "label": "Refresh" } } }
\`\`\`
<!-- slex:spec-example:end -->

## Markdown

\`\`\`slex
{ "namespace": "doc_button", "layout": {} }
\`\`\`

## API Reference {#api}

<!-- slex:spec-api:start component="button" sourceHash="api" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| \`label\` | string | No | Yes |  | Visible button text. |
<!-- slex:spec-api:end -->`,
        "./content/components/hero/en-US.md": async () => `---
title: Hero
category: Content
status: ready
order: 2
summary: Site-only component.
---

## Hidden

Site-only.`,
        "./content/components/playground/en-US.md": async () => `---
title: Playground
category: Tooling
status: ready
order: 3
summary: Home-only workbench.
---

# Playground

<!-- slex:spec-example:start component="playground" id="basic" sourceHash="example" -->
\`\`\`slex
{ "namespace": "spec_playground_basic", "layout": { "playground:demo": { "source": "{}" } } }
\`\`\`
<!-- slex:spec-example:end -->

## Hidden

The workbench is embedded on the home page.

## API Reference {#api}

<!-- slex:spec-api:start component="playground" sourceHash="api" -->
| Field | Type | Required | Dynamic | Default | Description |
|---|---|---|---|---|---|
| \`source\` | string | No | No |  | Source. |
<!-- slex:spec-api:end -->`,
      },
    });

    expect(docs.map((doc) => doc.slug)).toEqual(["button", "playground"]);
    expect(docs[0].sourceType).toBe("markdown");
    expect(docs[0].summary).toBe("Action trigger.");
  });

  it("derives public component docs and generated API from the SPEC registry", async () => {
    const doc = parseMarkdownComponentDoc(
      "content/components/slider/zh-CN.md",
      await Bun.file("site/content/components/slider/zh-CN.md").text(),
    );

    expect(publicComponentSlugs.has("slider")).toBe(true);
    expect(doc.summary).toBe("数值范围输入。");
    expect(doc.markdown).toContain("| `value` | number |");
    expect(doc.markdown).toContain("当前数值。");
    expect(doc.markdown).toContain("doc_slider_typical");
  });

  it("exports localized component spec manifests with Chinese overlay", () => {
    const manifest = exportComponentSpecManifest("zh-CN");
    const slider = manifest.components.find((component) => component.type === "slider");

    expect(slider?.locale).toBe("zh-CN");
    expect(slider?.title).toBe("Slider 滑块");
    expect(slider?.summary).toBe("数值范围输入。");
    expect(slider?.summaryMeta.missing).toBe(false);
    expect(slider?.props.value.description).toBe("当前数值。");
  });

  it("loads docs and components into one wiki tree", async () => {
    const docs = await loadWikiDocs({
      guideMarkdownModules: {
        "content/guides/intro/en-US.md": async () => "---\ntitle: Intro\norder: 10\n---\n\n# Intro\n\n## Start",
        "content/guides/quick-start/en-US.md": async () =>
          "---\ntitle: Getting Started\norder: 20\n---\n\n# Getting Started\n\n## Install",
        "content/guides/integration/en-US.md": async () =>
          "---\ntitle: Integration\norder: 25\n---\n\n# Integration\n\n## Streamdown",
      },
      componentMarkdownModules: {
        "content/components/column/en-US.md": async () => `---
title: Column
category: Layout
status: ready
order: 1
---

# Column

<!-- slex:spec-example:start component="column" id="basic" sourceHash="example" -->
\`\`\`slex
{ "namespace": "spec_column_basic", "layout": { "column:demo": {} } }
\`\`\`
<!-- slex:spec-example:end -->

## 使用提示

## API 参考 {#api}

<!-- slex:spec-api:start component="column" sourceHash="api" -->
| 字段 | 类型 | 必填 | 动态 | 默认值 | 说明 |
|---|---|---|---|---|---|
| 子组件 | object | 否 | 否 |  | 嵌套组件。 |
<!-- slex:spec-api:end -->`,
      },
    });

    expect(docs.map((doc) => doc.href)).toEqual([
      "/docs/guides/intro",
      "/docs/guides/quick-start",
      "/docs/guides/integration",
      "/docs/components/column",
    ]);
    expect(docs.map((doc) => doc.group)).toEqual(["Guides", "Guides", "Guides", "Components"]);
    expect(docs.map((doc) => doc.groupKey)).toEqual(["guides", "guides", "guides", "components"]);
    expect(docs.find((doc) => doc.slug === "column")?.markdownHref).toBe("/docs/components/column.md");
  });

  it("discovers guide docs from filesystem frontmatter instead of a hardcoded registry", async () => {
    const guides = await discoverGuideMarkdown({ siteRoot: "site", locale: "zh-CN" });
    const intro = guides.find((doc) => doc.slug === "intro");
    const design = guides.find((doc) => doc.slug === "design");

    expect(guides.map((doc) => doc.slug).sort()).toContain("quick-start");
    expect(guides.map((doc) => doc.slug).sort()).toContain("integration");
    expect(intro).toMatchObject({
      kind: "guide",
      title: "SlexKit 简介",
      order: 10,
      href: "/zh-CN/docs/guides/intro",
      markdownHref: "/zh-CN/docs/guides/intro.md",
      sourcePath: "content/guides/intro/zh-CN.md",
    });
    expect(design).toMatchObject({
      includeTitleInToc: true,
      slexkitRenderMode: "component",
    });
  });

  it("discovers reference and release docs from site content", async () => {
    const referenceDocs = await discoverReferenceMarkdown({ siteRoot: "site", locale: "zh-CN" });
    const releaseDocs = await discoverReleaseMarkdown({ siteRoot: "site", locale: "zh-CN" });
    const specDoc = referenceDocs.find((doc) => doc.slug === "spec");
    const integrationDoc = referenceDocs.find((doc) => doc.slug === "integration");
    const changelogDoc = releaseDocs[0];

    expect(referenceDocs.map((doc) => doc.href)).toContain("/zh-CN/docs/reference/spec");
    expect(specDoc).toMatchObject({
      groupKey: "reference",
      href: "/zh-CN/docs/reference/spec",
    });
    expect(specDoc?.markdownHref).toBe(
      specDoc?.contentLocale === "zh-CN" ? "/zh-CN/docs/reference/spec.md" : "/docs/reference/spec.md",
    );
    const integrationMarkdown = integrationDoc && ("markdown" in integrationDoc ? integrationDoc.markdown : integrationDoc.content);
    expect(integrationMarkdown).toContain("executionMode");
    expect(integrationMarkdown).toContain('streaming="repair"');
    expect(releaseDocs).toHaveLength(1);
    expect(changelogDoc).toMatchObject({
      slug: "changelog",
      groupKey: "releases",
      href: "/zh-CN/docs/releases/changelog",
    });
    expect(changelogDoc?.markdownHref).toBe(
      changelogDoc?.contentLocale === "zh-CN" ? "/zh-CN/docs/releases/changelog.md" : "/docs/releases/changelog.md",
    );
    for (const doc of [...referenceDocs, ...releaseDocs]) {
      const markdown = "markdown" in doc ? doc.markdown : doc.content;
      expectParseableSlexFences(markdown, doc.slug);
    }
  });

  it("discovers examples with Chinese source fallback and parseable Slex fences", async () => {
    const items = [
      ...(await discoverExampleMarkdown({ siteRoot: "site", locale: "zh-CN" })),
      ...(await discoverExampleMarkdown({ siteRoot: "site", locale: "en-US" })),
    ];
    const zhExamples = loadExampleDocs({ markdownItems: items, locale: "zh-CN" });
    const enExamples = loadExampleDocs({ markdownItems: items, locale: "en-US" });
    const featured = zhExamples.filter((example) => example.featured);

    expect(zhExamples).toHaveLength(19);
    expect(enExamples).toHaveLength(19);
    expect(featured).toHaveLength(19);
    expect(zhExamples.map((example) => example.category)).toContain("配置向导");
    expect(zhExamples.map((example) => example.slug)).toContain("streamdown-host");
    expect(zhExamples.map((example) => example.slug)).toContain("tiptap-host");
    expect(enExamples.map((example) => example.slug)).toContain("streamdown-host");
    expect(enExamples.map((example) => example.slug)).toContain("tiptap-host");
    expect(zhExamples.every((example) => example.slexkitRenderMode === "component" || example.slexkitRenderMode === "dialog")).toBe(true);

    const forbiddenPlaceholderPhrases = ["骨架示例", "示例完整度", "后续可以扩展成完整教程"];
    for (const example of zhExamples) {
      for (const phrase of forbiddenPlaceholderPhrases) {
        expect(example.markdown.includes(phrase), `${example.slug} contains ${phrase}`).toBe(false);
      }

      const fences = Array.from(example.markdown.matchAll(/```slex\s*\n([\s\S]*?)\n```/g), (match) => match[1]);
      const usesLiveAdapterDemo = example.markdown.includes('class="slex-example-live-frame"');
      if (example.slexkitRenderMode === "dialog" || usesLiveAdapterDemo) continue;
      expect(fences.length, example.slug).toBeGreaterThan(0);
      for (const fence of fences) {
        const parsed = parseSlexSource(fence);
        expect(parsed.ok, `${example.slug}\n${fence}`).toBe(true);
        }
        expect(findWritableReadableStateCollisions(example.markdown), example.slug).toEqual([]);
        expect(findWritableCrossTypeStateCollisions(example.markdown), example.slug).toEqual([]);
      }
    });

  it("uses the text component for the cross-document style preview", async () => {
    const markdown = await Bun.file("site/content/examples/cross-doc-state-lab/zh-CN.md").text();

    expect(markdown).toContain('"text:styledValue"');
    expect(markdown).toContain('"$color": "g.color"');
    expect(markdown).toContain('"$size": "g.size"');
    expect(markdown).not.toContain('"stat:sizePreview"');
  });

  it("marks locale fallback and stale translated spec blocks", async () => {
    const sourceMarkdown = await Bun.file("site/content/components/button/en-US.md").text();
    const zhMarkdown = sourceMarkdown.replace(/(slex:spec-api:start[^>]*sourceHash=")[^"]+/, "$1outdated");
    const fallbackDocs = await loadWikiDocs({
      locale: "zh-CN",
      markdownItems: [{
        kind: "component",
        slug: "button",
        locale: "zh-CN",
        contentLocale: "en-US",
        isFallback: true,
        path: "content/components/button/en-US.md",
        content: sourceMarkdown,
      }],
    });
    const staleDocs = await loadWikiDocs({
      locale: "zh-CN",
      markdownItems: [{
        kind: "component",
        slug: "button",
        locale: "zh-CN",
        contentLocale: "zh-CN",
        path: "content/components/button/zh-CN.md",
        content: zhMarkdown,
        sourceMarkdown,
      }],
    });

    expect(fallbackDocs[0]).toMatchObject({ slug: "button", contentLocale: "en-US", isFallback: true });
    expect(fallbackDocs[0].markdownHref).toBe("/docs/components/button.md");
    expect(staleDocs[0]).toMatchObject({ slug: "button", contentLocale: "zh-CN", isStale: true });
  });

  it("keeps component spec block hashes synced with the current SPEC registry", async () => {
    for (const spec of componentSpecs) {
      if (!publicComponentSlugs.has(spec.type)) continue;

      const canonical = localizedComponentSpec(spec.type, sourceLocale);
      expect(canonical).toBeTruthy();

      for (const locale of supportedLocales) {
        const path = `site/content/components/${spec.type}/${locale}.md`;
        const file = Bun.file(path);
        if (!(await file.exists())) continue;

        const markdown = await file.text();
        const exampleAttrs = parseGeneratedSpecAttrs(markdown, "spec-example", spec.type);
        const apiAttrs = parseGeneratedSpecAttrs(markdown, "spec-api", spec.type);
        const exampleId = exampleAttrs.id ?? canonical.examples[0]?.id ?? "basic";

        expect(exampleAttrs.sourceHash, `${path} example sourceHash`).toBe(specExampleHash(canonical, exampleId));
        expect(apiAttrs.sourceHash, `${path} api sourceHash`).toBe(specApiHash(canonical, sourceLocale));
      }
    }
  });
});
