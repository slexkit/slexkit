import { describe, expect, it } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, posix as pathPosix, relative, resolve } from "node:path";
import { componentSpecs } from "../../src/components/entries/specs";
import { SLEX_STANDARD_ARTIFACTS } from "../../src/standard/artifacts";
import {
  exportComponentSpecManifest,
  loadComponentDocs,
  loadWikiDocs,
  parseMarkdownComponentDoc,
  parseMarkdownGuideDoc,
  publicComponentSlugs,
} from "../../site/data/component-docs.js";
import { sourceLocale, supportedLocales } from "../../site/data/locales.js";
import { discoverGuideMarkdown, discoverReferenceMarkdown, discoverReleaseMarkdown, discoverWikiMarkdown } from "../../site/data/content-discovery.js";
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

type MarkdownQualityDoc = {
  href: string;
  markdownHref?: string;
  markdown: string;
  slug: string;
  groupKey: string;
};

async function loadAllSiteMarkdownDocs(): Promise<MarkdownQualityDoc[]> {
  const wikiMarkdown = await discoverWikiMarkdown({ siteRoot: "site" });
  const exampleMarkdown = (
    await Promise.all(supportedLocales.map((locale) => discoverExampleMarkdown({ siteRoot: "site", locale })))
  ).flat();
  const docs: MarkdownQualityDoc[] = [];

  for (const locale of supportedLocales) {
    docs.push(...(await loadWikiDocs({ markdownItems: wikiMarkdown, locale })));
    docs.push(...loadExampleDocs({ markdownItems: exampleMarkdown, locale }));
  }

  return docs;
}

function normalizeInternalHref(href: string, sourceHref: string) {
  if (
    !href ||
    href.startsWith("//") ||
    /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)
  ) {
    return null;
  }

  const clean = href.split("#")[0]?.split("?")[0] ?? "";
  if (!clean && href.startsWith("#")) return sourceHref.replace(/\/$/, "") || "/";
  if (!clean) return null;
  if (clean.startsWith("/")) return clean.replace(/\/$/, "") || "/";

  const base = sourceHref.replace(/\/$/, "");
  return pathPosix.normalize(pathPosix.join(pathPosix.dirname(base), clean)).replace(/\/$/, "") || "/";
}

function internalHrefFragment(href: string) {
  if (!href.includes("#")) return "";
  return href.split("#")[1]?.split("?")[0] ?? "";
}

function collectMarkdownLinks(markdown: string) {
  const links: Array<{ href: string; line: number }> = [];
  const pattern = /!?\[[^\]\n]*(?:\][^\[\]\n]*)*\]\(([^)\s]+)(?:\s+"[^"]*")?\)|<a\s+[^>]*href=["']([^"']+)["']/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(markdown))) {
    const href = match[1] || match[2];
    links.push({
      href,
      line: markdown.slice(0, match.index).split(/\r?\n/).length,
    });
  }

  return links;
}

function packageReadmePaths() {
  return readdirSync("packages", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join("packages", entry.name, "README.md"))
    .filter((path) => existsSync(path));
}

function siteContentMarkdownPaths(root = "site/content"): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(root, entry.name);
    if (entry.isDirectory()) return siteContentMarkdownPaths(entryPath);
    return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
  });
}

function directorySlugs(root: string) {
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function frontmatterData(markdown: string) {
  const match = markdown.replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => /^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/.exec(line))
      .filter((entry): entry is RegExpExecArray => !!entry)
      .map((entry) => [entry[1], entry[2].replace(/^["']|["']$/g, "")]),
  ) as Record<string, string>;
}

function frontmatterKeys(markdown: string) {
  const match = markdown.replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return new Set<string>();

  return new Set(
    match[1]
      .split(/\r?\n/)
      .map((line) => /^([A-Za-z][A-Za-z0-9_-]*):/.exec(line)?.[1])
      .filter((key): key is string => !!key),
  );
}

function workspaceScopedPackageNames() {
  return readdirSync("packages", { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join("packages", entry.name, "package.json"))
    .filter((path) => existsSync(path))
    .map((path) => JSON.parse(readFileSync(path, "utf-8")) as { name?: string })
    .map((pkg) => pkg.name)
    .filter((name): name is string => !!name && name.startsWith("@slexkit/"))
    .sort();
}

function collectScopedPackageMentions(markdown: string) {
  return [...new Set(Array.from(markdown.matchAll(/@slexkit\/[a-z0-9-]+/g), (match) => match[0]))].sort();
}

function componentCategoryEntries(): Array<[string, string[]]> {
  const categories = new Map<string, string[]>();
  for (const spec of componentSpecs) {
    const types = categories.get(spec.category) ?? [];
    types.push(spec.type);
    categories.set(spec.category, types);
  }

  return [...categories.entries()]
    .map(([category, types]) => [category, [...types].sort()] as [string, string[]])
    .sort(([a], [b]) => a.localeCompare(b));
}

function componentCategorySummary() {
  return componentCategoryEntries()
    .map(([category, types]) => `${category.toLowerCase()} (${types.length})`)
    .join(", ");
}

function componentCategorySummaryZh() {
  return componentCategoryEntries()
    .map(([category, types]) => `${category.toLowerCase()} (${types.length})`)
    .join("、");
}

function stripMarkdownCode(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]*`/g, "code");
}

function visibleMarkdownLines(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  let fenceMarker: string | null = null;

  return lines.map((line) => {
    const marker = /^[ \t]{0,3}(`{3,}|~{3,})/.exec(line)?.[1] ?? null;
    if (fenceMarker) {
      if (marker && marker[0] === fenceMarker[0] && marker.length >= fenceMarker.length) fenceMarker = null;
      return "";
    }
    if (marker) {
      fenceMarker = marker;
      return "";
    }

    return line.replace(/<!--[\s\S]*?-->/g, "").replace(/`[^`\n]*`/g, "code");
  });
}

function markdownHeadingAnchors(markdown: string) {
  return new Set(Array.from(normalizeHeadingAnchors(markdown).matchAll(/<span id="([^"]+)"/g), (match) => match[1]));
}

function loadReadmeMarkdownDocs(): MarkdownQualityDoc[] {
  return ["README.md", "README.zh-CN.md", "CHANGELOG.md", ...packageReadmePaths()].map((file) => ({
    href: relative(".", file).replace(/\\/g, "/"),
    markdown: readFileSync(file, "utf-8"),
    slug: file,
    groupKey: "readme",
  }));
}

const proseTemplateMarkers: Array<{ label: string; pattern: RegExp }> = [
  { label: "This example/page/guide", pattern: /\bThis (?:example|page|guide)\b/i },
  { label: "showing how", pattern: /\bshow(?:s|ing) how\b/i },
  { label: "source of truth", pattern: /\bsource of truth\b/i },
  { label: "quality gate", pattern: /\bquality gate\b/i },
  { label: "thin wrapper", pattern: /\bthin wrapper\b/i },
  { label: "old package reference title", pattern: /\bpackage boundaries\b/i },
  { label: "AI marketing adjective", pattern: /\b(?:powerful|seamless|effortless)\b/i },
  { label: "assistant-ui template lineage", pattern: /\bassistant-ui information architecture\b/i },
  { label: "user asks AI report framing", pattern: /\bThe user asks AI\b/i },
  { label: "Chinese this example", pattern: /\u8fd9\u4e2a\u793a\u4f8b/ },
  { label: "Chinese this page", pattern: /\u8fd9\u4e2a\u9875\u9762/ },
  { label: "Chinese this guide", pattern: /\u672c\u6307\u5357/ },
  { label: "Chinese showing how", pattern: /\u5c55\u793a.*\u5982\u4f55/ },
  { label: "Chinese can help", pattern: /\u53ef\u4ee5\u5e2e\u52a9/ },
  { label: "Chinese let you", pattern: /\u8ba9\u4f60/ },
  { label: "Chinese marketing adjective", pattern: /\u8f7b\u677e|\u65e0\u7f1d|\u5f3a\u5927/ },
  { label: "Chinese user asks AI report framing", pattern: /\u7528\u6237\u8ba9 AI/ },
];

const proseFormatMarkers: Array<{ label: string; pattern: RegExp }> = [
  { label: "dash used as punctuation without spacing", pattern: /[A-Za-z0-9][A-Za-z0-9.)\]] -[a-z]/ },
];

const zhNullishCoalescingPattern = /(?:[\w$)\]"']|\])\s+\?\?\s+(?:["'({[\w$])/;

const zhVisibleEnglishRegressionPhrases = [
  "Rendered by SlexKit in reading mode.",
  "Vault status: Ready.",
  "This cannot be undone.",
  "Please review before proceeding.",
  "Build summary",
  "Operation completed successfully.",
  "Hello World",
  "I am visible",
  "Delete item?",
  "Pick deploy target",
  "Create release",
  "ToolHost templates",
  "host integration",
  "diagnostics and component usage",
  "Raw docs 使用",
  "policy-gated `api.*`",
  "Tool call 失败",
  "Display UI 与 ToolHost",
  "network disabled",
  "canvas disabled",
  "reference contract",
  "Destructive",
  "Neutral",
  "Counter",
  "Count:",
];

const zhSkeletonHeadingMarkers = new Set([
  "Core concepts",
  "Context Files",
  "Entry points",
  "Validation and conformance",
  "Namespace store",
  "Component instance state",
  "Lifecycle hooks",
  "Component disposer",
  "Expression evaluation context",
  "Resolution chain",
  "Registration",
  "Retrieval",
  "Name and weight utilities",
  "Public API",
  "Built-in Phosphor icons",
  "Icon naming convention",
  "Usage in components",
  "Package map",
  "Installation matrix",
  "Packaging notes",
  "Release checks",
  "Concepts",
  "Built-in templates",
  "Writing a custom template",
  "Key patterns",
  "Events",
  "Theming",
  "Problem space",
  "Why JavaScript object literals",
  "Why `g` and `layout` are separate",
  "Why expressions, not pure JSON",
  "Why only explicit fences",
  "Display UI vs ToolHost",
  "Trusted + secure dual runtime",
  "Why a custom reactivity system",
  "How it differs from alternatives",
  "Threat model",
  "Authorization source",
  "Sandbox iframe deployment",
  "postMessage bridge protocol",
  "Artifact slot bridge",
  "Heartbeat watchdog",
  "Fail-closed behavior",
  "Escape hatches",
  "Sandbox hardening",
  "Maintenance principles",
  "Writing a custom host adapter",
  "`runtimeUrl` requirements",
  "Fallback rendering",
  "Diagnostic Codes",
  "Conformance Fixture Contract",
  "Versioning Policy",
  "Added",
  "Changed",
  "Fixed",
  "Removed",
  "Non-goals",
  "Error types",
  "Props classification",
  "Static props",
  "Structural directives",
  "`$key` strategy",
  "`$for` phases",
  "Network policy",
  "Timer, animation, and canvas",
  "Execution monitoring",
  "Host to sandbox messages",
  "Sandbox to host messages",
  "Obsidian plugin",
  "vs A2UI",
  "vs application frameworks",
  "vs pure JSON UI protocols",
]);

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
    expect(publicComponentSlugs.has("submit")).toBe(false);
    expect(publicComponentSlugs.has("step")).toBe(false);
    expect(componentSpecs.some((spec) => spec.type === "submit")).toBe(true);
    expect(componentSpecs.some((spec) => spec.type === "step")).toBe(true);
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
    const toolhostDoc = referenceDocs.find((doc) => doc.slug === "toolhost");
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
    const toolhostMarkdown = toolhostDoc && ("markdown" in toolhostDoc ? toolhostDoc.markdown : toolhostDoc.content);
    expect(integrationMarkdown).toContain("executionMode");
    expect(integrationMarkdown).toContain('streaming="repair"');
    expect(toolhostMarkdown).toContain("submit:actions");
    expect(toolhostMarkdown).toContain("submit:actions");
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
    const exampleSlugs = directorySlugs("site/content/examples");

    expect(zhExamples.map((example) => example.slug).sort()).toEqual(exampleSlugs);
    expect(enExamples.map((example) => example.slug).sort()).toEqual(exampleSlugs);
    expect(featured).toHaveLength(exampleSlugs.length);
    expect(zhExamples.map((example) => example.category)).toContain("配置向导");
    expect(zhExamples.map((example) => example.slug)).toContain("assistant-ui-host");
    expect(zhExamples.map((example) => example.slug)).toContain("streamdown-host");
    expect(zhExamples.map((example) => example.slug)).toContain("tiptap-host");
    expect(enExamples.map((example) => example.slug)).toContain("assistant-ui-host");
    expect(enExamples.map((example) => example.slug)).toContain("streamdown-host");
    expect(enExamples.map((example) => example.slug)).toContain("tiptap-host");
    expect(zhExamples.every((example) => example.slexkitRenderMode === "component" || example.slexkitRenderMode === "dialog")).toBe(true);

    const forbiddenPlaceholderPhrases = ["骨架示例", "示例完整度", "后续可以扩展成完整教程"];
    const forbiddenPublishedExampleStatusPhrases = ['status: "draft"', 'status: "experimental"'];
    for (const example of [...zhExamples, ...enExamples]) {
      for (const phrase of forbiddenPublishedExampleStatusPhrases) {
        expect(example.markdown.includes(phrase), `${example.slug} contains ${phrase}`).toBe(false);
      }
    }

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

  it("keeps all documented Slex fences parseable", async () => {
    for (const doc of await loadAllSiteMarkdownDocs()) {
      expectParseableSlexFences(doc.markdown, `${doc.groupKey}/${doc.slug}`);
    }
  });

  it("keeps localized docs and raw markdown routes uniquely owned", async () => {
    const docs = await loadAllSiteMarkdownDocs();
    const hrefOwners = new Map<string, string[]>();
    const markdownHrefOwners = new Map<string, string[]>();
    const duplicates: string[] = [];

    for (const doc of docs) {
      const owner = `${doc.groupKey}/${doc.slug}/${doc.href}`;
      hrefOwners.set(doc.href, [...(hrefOwners.get(doc.href) ?? []), owner]);
      if (doc.markdownHref) {
        markdownHrefOwners.set(doc.markdownHref, [...(markdownHrefOwners.get(doc.markdownHref) ?? []), owner]);
      }
    }

    for (const [href, owners] of hrefOwners) {
      if (owners.length > 1) duplicates.push(`${href}: ${owners.join(", ")}`);
    }
    for (const [href, owners] of markdownHrefOwners) {
      if (owners.length > 1) duplicates.push(`${href}: ${owners.join(", ")}`);
    }

    expect(duplicates).toEqual([]);
  });

  it("keeps site content pages shaped as complete markdown documents", () => {
    const issues: string[] = [];

    for (const path of siteContentMarkdownPaths()) {
      const markdown = readFileSync(path, "utf-8");
      const body = markdown.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
      const h1Count = Array.from(body.matchAll(/^#\s+.+?\s*$/gm)).length;
      const visibleText = body
        .replace(/```[\s\S]*?```/g, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/[#>*_`|\-\s]/g, "");

      if (h1Count !== 1) issues.push(`${path.replace(/\\/g, "/")}: expected exactly one H1, found ${h1Count}`);
      if (visibleText.length < 20) issues.push(`${path.replace(/\\/g, "/")}: page has too little visible prose`);
    }

    expect(issues).toEqual([]);
  });

  it("keeps documentation prose away from template markers", async () => {
    const docs = [...(await loadAllSiteMarkdownDocs()), ...loadReadmeMarkdownDocs()];
    const matches: string[] = [];

    for (const doc of docs) {
      for (const marker of proseTemplateMarkers) {
        const match = marker.pattern.exec(doc.markdown);
        if (!match) continue;

        const line = doc.markdown.slice(0, match.index).split(/\r?\n/).length;
        matches.push(`${doc.href}:${line} ${marker.label}: ${match[0]}`);
      }

      const prose = stripMarkdownCode(doc.markdown);
      for (const marker of proseFormatMarkers) {
        const match = marker.pattern.exec(prose);
        if (!match) continue;

        const line = prose.slice(0, match.index).split(/\r?\n/).length;
        matches.push(`${doc.href}:${line} ${marker.label}: ${match[0]}`);
      }
    }

    expect(matches).toEqual([]);
  });

  it("keeps Chinese markdown free from replacement corruption markers", () => {
    const issues: string[] = [];

    for (const path of siteContentMarkdownPaths()) {
      if (!path.endsWith("zh-CN.md")) continue;

      const lines = readFileSync(path, "utf-8").split(/\r?\n/);
      lines.forEach((line, index) => {
        if (!/\?{2,}/.test(line)) return;
        if (zhNullishCoalescingPattern.test(line)) return;
        issues.push(`${path.replace(/\\/g, "/")}:${index + 1} unexpected question-mark run: ${line.trim()}`);
      });
    }

    expect(issues).toEqual([]);
  });

  it("keeps Chinese docs from regressing to copied English UI phrases", () => {
    const issues: string[] = [];

    for (const path of siteContentMarkdownPaths()) {
      if (!path.endsWith("zh-CN.md")) continue;

      const markdown = readFileSync(path, "utf-8");
      for (const phrase of zhVisibleEnglishRegressionPhrases) {
        const index = markdown.indexOf(phrase);
        if (index < 0) continue;

        const line = markdown.slice(0, index).split(/\r?\n/).length;
        issues.push(`${path.replace(/\\/g, "/")}:${line} copied English phrase: ${phrase}`);
      }
    }

    expect(issues).toEqual([]);
  });

  it("keeps site content frontmatter explicit for published docs", () => {
    const requiredByCollection: Array<{ segment: string; keys: string[] }> = [
      { segment: "/components/", keys: ["title", "category", "status", "order", "summary"] },
      { segment: "/guides/", keys: ["title", "category", "status", "order", "summary"] },
      { segment: "/reference/", keys: ["title", "category", "status", "order", "summary"] },
      { segment: "/releases/", keys: ["title", "category", "status", "order", "summary"] },
      {
        segment: "/examples/",
        keys: ["title", "category", "status", "order", "summary", "components", "difficulty", "runtime", "featured"],
      },
    ];
    const missing: string[] = [];

    for (const path of siteContentMarkdownPaths()) {
      const normalizedPath = path.replace(/\\/g, "/");
      const rule = requiredByCollection.find((entry) => normalizedPath.includes(entry.segment));
      if (!rule) continue;

      const keys = frontmatterKeys(readFileSync(path, "utf-8"));
      const missingKeys = rule.keys.filter((key) => !keys.has(key));
      if (missingKeys.length) missing.push(`${normalizedPath}: ${missingKeys.join(", ")}`);
    }

    expect(missing).toEqual([]);
  });

  it("keeps published site content complete across locales and status vocabularies", () => {
    const rules: Array<{ root: string; slugs: string[]; status: string; requireFeatured?: boolean }> = [
      { root: "site/content/components", slugs: [...publicComponentSlugs].sort(), status: "ready" },
      { root: "site/content/guides", slugs: directorySlugs("site/content/guides"), status: "ready" },
      { root: "site/content/reference", slugs: directorySlugs("site/content/reference"), status: "ready" },
      { root: "site/content/releases", slugs: directorySlugs("site/content/releases"), status: "ready" },
      { root: "site/content/examples", slugs: directorySlugs("site/content/examples"), status: "published", requireFeatured: true },
    ];
    const issues: string[] = [];

    const internalComponentDocSlugs = new Set(["step", "submit"]);
    const extraComponentSlugs = directorySlugs("site/content/components").filter(
      (slug) => !publicComponentSlugs.has(slug) && !internalComponentDocSlugs.has(slug),
    );
    for (const slug of extraComponentSlugs) {
      issues.push(`site/content/components/${slug}: component docs exist outside publicComponentSlugs`);
    }

    for (const rule of rules) {
      for (const slug of rule.slugs) {
        for (const locale of supportedLocales) {
          const path = join(rule.root, slug, `${locale}.md`);
          if (!existsSync(path)) {
            issues.push(`${path}: missing locale page`);
            continue;
          }

          const data = frontmatterData(readFileSync(path, "utf-8"));
          if (data.status !== rule.status) issues.push(`${path}: status=${data.status || "<missing>"} expected ${rule.status}`);
          if (rule.requireFeatured && data.featured !== "true") {
            issues.push(`${path}: featured=${data.featured || "<missing>"} expected true`);
          }
        }
      }
    }

    expect(issues).toEqual([]);
  });

  it("keeps Chinese docs away from copied English skeleton headings", async () => {
    const docs = (await loadAllSiteMarkdownDocs()).filter(
      (doc) => doc.href.startsWith("/zh-CN/docs/guides/") || doc.href.startsWith("/zh-CN/docs/reference/"),
    );
    const matches: string[] = [];

    for (const doc of docs) {
      const prose = stripMarkdownCode(doc.markdown);
      const headingPattern = /^#{2,3}\s+(.+?)\s*$/gm;
      for (const match of prose.matchAll(headingPattern)) {
        const heading = match[1];
        if (!zhSkeletonHeadingMarkers.has(heading)) continue;

        const line = prose.slice(0, match.index).split(/\r?\n/).length;
        matches.push(`${doc.href}:${line} copied English skeleton heading: ${heading}`);
      }
    }

    expect(matches).toEqual([]);
  });

  it("keeps Chinese guide and reference lists from exposing English skeleton rows", async () => {
    const docs = (await loadAllSiteMarkdownDocs()).filter(
      (doc) => doc.href.startsWith("/zh-CN/docs/guides/") || doc.href.startsWith("/zh-CN/docs/reference/"),
    );
    const matches: string[] = [];

    for (const doc of docs) {
      visibleMarkdownLines(doc.markdown).forEach((line, index) => {
        const visible = line.replace(/\[[^\]\n]+\]\([^)]+\)/g, "link").trim();
        if (!visible || /^\|[-:\s|]+$/.test(visible)) return;
        if (!/^[-*]\s+/.test(visible) && !/^\|/.test(visible)) return;
        if (/[\u4e00-\u9fff]/.test(visible)) return;
        const latinLetters = visible.match(/[A-Za-z]/g)?.length ?? 0;
        if (latinLetters < 8) return;
        matches.push(`${doc.href}:${index + 1} visible English-only list/table row: ${visible}`);
      });
    }

    expect(matches).toEqual([]);
  });

  it("keeps internal markdown links resolvable", async () => {
    const docs = await loadAllSiteMarkdownDocs();
    const routes = new Set([
      "/",
      "/docs",
      "/zh-CN/docs",
      "/examples",
      "/zh-CN/examples",
      "/components",
      "/zh-CN/components",
      "/playground",
      "/zh-CN/playground",
      "/llms.txt",
      "/llms-full.txt",
      "/llms-components.txt",
      "/llms-runtime.txt",
      "/llms-capabilities.txt",
      "/llms-toolhost.txt",
      "/llms-authoring.txt",
      "/slexkit-ai-manifest.json",
      ...SLEX_STANDARD_ARTIFACTS.map((filename) => `/standard/${filename}`),
    ]);
    const anchorsByRoute = new Map<string, Set<string>>();

    for (const doc of docs) {
      routes.add(doc.href);
      if (doc.markdownHref) routes.add(doc.markdownHref);

      const anchors = markdownHeadingAnchors(doc.markdown);
      anchorsByRoute.set(doc.href, anchors);
      if (doc.markdownHref) anchorsByRoute.set(doc.markdownHref, anchors);
    }

    const brokenLinks: string[] = [];
    for (const doc of docs) {
      for (const link of collectMarkdownLinks(doc.markdown)) {
        const route = normalizeInternalHref(link.href, doc.href);
        if (!route) continue;
        if (!routes.has(route)) {
          brokenLinks.push(`${doc.href}:${link.line} -> ${link.href} (${route})`);
          continue;
        }

        const fragment = internalHrefFragment(link.href);
        if (fragment && !anchorsByRoute.get(route)?.has(fragment)) {
          brokenLinks.push(`${doc.href}:${link.line} -> ${link.href} (missing #${fragment})`);
        }
      }
    }

    expect(brokenLinks).toEqual([]);
  });

  it("keeps README local file links resolvable", () => {
    const files = ["README.md", "README.zh-CN.md", ...packageReadmePaths()];
    const brokenLinks: string[] = [];

    for (const file of files) {
      const markdown = readFileSync(file, "utf-8");
      for (const link of collectMarkdownLinks(markdown)) {
        const href = link.href;
        if (
          !href ||
          href.startsWith("#") ||
          href.startsWith("/") ||
          href.startsWith("//") ||
          /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href)
        ) {
          continue;
        }

        const clean = href.split("#")[0]?.split("?")[0] ?? "";
        if (!clean) continue;

        const target = resolve(dirname(file), clean);
        if (!existsSync(target)) {
          brokenLinks.push(`${relative(".", file).replace(/\\/g, "/")}:${link.line} -> ${href}`);
        }
      }
    }

    expect(brokenLinks).toEqual([]);
  });

  it("keeps documented scoped packages aligned with workspace packages", async () => {
    const workspacePackages = workspaceScopedPackageNames();
    const expectedPackages = new Set(workspacePackages);
    const packageOverviewFiles = [
      "README.md",
      "README.zh-CN.md",
      "site/content/reference/packages/en-US.md",
      "site/content/reference/packages/zh-CN.md",
    ];

    for (const file of packageOverviewFiles) {
      const markdown = readFileSync(file, "utf-8");
      expect(collectScopedPackageMentions(markdown), file).toEqual(workspacePackages);
    }

    const unknownMentions: string[] = [];
    for (const doc of [...(await loadAllSiteMarkdownDocs()), ...loadReadmeMarkdownDocs()]) {
      for (const name of collectScopedPackageMentions(doc.markdown)) {
        if (!expectedPackages.has(name)) unknownMentions.push(`${doc.href} -> ${name}`);
      }
    }

    expect(unknownMentions).toEqual([]);
  });

  it("keeps documented component counts aligned with the component registry", () => {
    const rootReadme = readFileSync("README.md", "utf-8");
    const zhReadme = readFileSync("README.zh-CN.md", "utf-8");
    const componentsReadme = readFileSync("packages/components-svelte/README.md", "utf-8");
    const packagesReference = readFileSync("site/content/reference/packages/en-US.md", "utf-8");
    const zhPackagesReference = readFileSync("site/content/reference/packages/zh-CN.md", "utf-8");
    const summary = componentCategorySummary();

    expect(rootReadme).toContain(`Official Svelte components**: ${componentSpecs.length} components`);
    expect(zhReadme).toContain(`官方 Svelte 组件**：${componentSpecs.length} 个组件`);
    expect(componentsReadme).toContain(`registers all ${componentSpecs.length} built-in Svelte components`);
    expect(packagesReference).toContain(`Public component specs: ${summary}.`);
    expect(zhPackagesReference).toContain(`公开组件规格覆盖 ${componentCategorySummaryZh()}。`);

    for (const [category, types] of componentCategoryEntries()) {
      const row = new RegExp(`\\| \\*\\*${category}\\*\\* \\| ([^\\n]+) \\|`).exec(componentsReadme);
      expect(row?.[1], category).toBeDefined();
      expect(Array.from(row?.[1].matchAll(/`([^`]+)`/g) ?? [], (match) => match[1]), category).toEqual(types);
    }
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
