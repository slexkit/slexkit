import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { componentSpecs, publicComponentTypes } from "../src/components/spec-registry";
import { parseSlexSource } from "../src/engine/diagnostics";
import {
  slexkitExpressionContext,
  slexkitRuntimeCapabilities,
  slexkitStdlibDocs,
} from "../src/engine/capabilities";
import { discoverExampleMarkdown } from "../site/data/content-discovery.js";
import { loadExampleDocs } from "../site/data/examples.js";
import {
  createStandardArtifacts,
  hashStandardText,
  SLEX_STANDARD_ARTIFACTS,
  type SlexStandardArtifactFilename,
} from "../src/standard/artifacts";

export const aiDocFilenames = [
  "llms.txt",
  "llms-full.txt",
  "llms-components.txt",
  "llms-runtime.txt",
  "llms-capabilities.txt",
  "llms-toolhost.txt",
  "llms-authoring.txt",
] as const;

export type AiDocFilename = (typeof aiDocFilenames)[number];

export type DocPage = {
  id: string;
  group: "Guides" | "Examples" | "Components" | "Reference" | "Releases";
  title: string;
  summary: string;
  href: string;
  rawHref: string;
  sourcePath: string;
  body: string;
  hash: string;
};

export type AiDocPage = DocPage;

export type SlexKitAiManifest = {
  name: "slexkit-ai-docs";
  packageName: "slexkit";
  version: string;
  generatedAt: string;
  docs: Record<AiDocFilename, { path: string; title: string; summary: string; hash: string }>;
  pages: DocPage[];
  expressionContext: typeof slexkitExpressionContext;
  stdlib: typeof slexkitStdlibDocs;
  capabilities: typeof slexkitRuntimeCapabilities;
  standardArtifacts: Record<SlexStandardArtifactFilename, { path: string; hash: string }>;
  components: Array<{
    type: string;
    title: string;
    category: string;
    status: string;
    state: string;
    since: string;
    summary: string;
    docsHref: string;
    rawHref: string;
    propCount: number;
    exampleCount: number;
    props: Record<string, unknown>;
    children: unknown;
    examples: Array<{ id: string; title: string; description?: string; source: unknown }>;
    hash: string;
  }>;
  sourceHashes: Record<string, string>;
};

type AiDocBuild = {
  files: Record<AiDocFilename, string>;
  manifest: SlexKitAiManifest;
};

type SourcePage = Omit<DocPage, "hash"> & { body: string; order: number };

const root = join(import.meta.dir, "..");

const guidePages = [
  ["intro", "SlexKit Introduction", "What SlexKit is and where it fits."],
  ["quick-start", "Quick Start", "Install SlexKit and render a first Markdown-friendly Slex source."],
  ["integration", "Integration", "Streamdown, Tiptap, Obsidian, and custom Markdown hosts for explicit Slex fences."],
  ["design", "Design Guidelines", "Design and authoring guidelines for SlexKit components and docs."],
  ["security-runtime", "Secure Runtime Setup", "Decision and setup guide for rendering untrusted or agent-generated Slex source."],
  ["ai-agents", "AI / Agents", "LLM docs, MCP server, skills, and authoring rules for SlexKit agents."],
] as const;

const rootPages = [
  ["README.md", "Guides", "README", "Root package overview and installation matrix.", "/", "/README.md"],
] as const;

const referencePages = [
  ["spec", "Slex Specification", "Public Slex expression envelope, component keys, props, directives, and lifecycle."],
  ["usage", "Slex Usage Reference", "Slex source structure, props, directives, events, theming, custom components, and ToolHost boundaries."],
  ["runtime", "Runtime Model", "Mounting, ingestion, boot, namespace store, lifecycle, and runtime APIs."],
  ["integration", "Host Integration", "Markdown renderers, Svelte custom hosts, Streamdown, Tiptap, Obsidian, and artifact lifecycle."],
  ["security", "Security Runtime", "Threat model, sandbox iframe, postMessage bridge, policy, and fail-closed behavior."],
  ["packages", "Package Boundaries", "Package relationships, installation matrix, and packaging strategy."],
  ["standard", "Slex Standard Artifacts", "JSON Schema, component catalog, logic profile, capabilities catalog, conformance fixtures, and manifest."],
  ["toolhost", "ToolHost", "Tool call rendering, built-in templates, custom templates, and submit boundaries."],
  ["icons", "Icon System", "Phosphor icons, custom icon registration, Iconify fallback, and API reference."],
  ["rationale", "Design Rationale", "Why SlexKit uses object literals, expressions, explicit fences, and secure/trusted modes."],
] as const;

const releasePages = [
  ["changelog", "Changelog", "Release notes and notable changes for SlexKit."],
] as const;

const groupOrder: DocPage["group"][] = ["Guides", "Examples", "Components", "Reference", "Releases"];
const groupRank = new Map(groupOrder.map((group, index) => [group, index]));

function hashText(source: string): string {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

async function readProjectFile(path: string): Promise<string> {
  return readFile(join(root, path), "utf-8");
}

function fencedBlock(language: string, source: string): string {
  return `\`\`\`${language}\n${source.trim()}\n\`\`\``;
}

function normalizeMarkdownBody(source: string): string {
  return source.replace(/^\uFEFF/, "").trim();
}

function pageWithHash(page: SourcePage): AiDocPage {
  return {
    id: page.id,
    group: page.group,
    title: page.title,
    summary: page.summary,
    href: page.href,
    rawHref: page.rawHref,
    sourcePath: page.sourcePath,
    body: page.body,
    hash: hashText(page.body),
  };
}

function sortDocPages<T extends SourcePage>(pages: T[]): T[] {
  return [...pages].sort((a, b) => (groupRank.get(a.group) ?? 99) - (groupRank.get(b.group) ?? 99) || a.order - b.order);
}

function componentApiMarkdown(spec: (typeof componentSpecs)[number]): string {
  const props = Object.entries(spec.props)
    .map(([name, prop]) => {
      const flags = [
        prop.required ? "required" : "optional",
        prop.dynamic ? "dynamic" : "static",
        prop.default !== undefined ? `default: ${JSON.stringify(prop.default)}` : "",
        prop.values?.length ? `values: ${prop.values.join(", ")}` : "",
      ].filter(Boolean).join("; ");
      return `- \`${name}\` (${prop.type}; ${flags}): ${prop.description}`;
    })
    .join("\n");

  const children = spec.children.allowed
    ? spec.children.description ?? "Nested component fields are rendered as child content in field order."
    : "No child components.";

  return [
    `## ${spec.title} API (\`${spec.type}\`)`,
    "",
    `Category: ${spec.category}`,
    `Status: ${spec.status}`,
    `State mode: ${spec.state}`,
    `Since: ${spec.since}`,
    "",
    "### Props",
    props || "- No props.",
    "",
    "### Children",
    children,
  ].join("\n");
}

function componentExamplesMarkdown(spec: (typeof componentSpecs)[number]): string {
  return spec.examples
    .map((example) => {
      const source = JSON.stringify(example.source, null, 2);
      const parsed = parseSlexSource(source);
      return [
        `## ${spec.title}: ${example.title}`,
        "",
        example.description ? `${example.description}\n` : "",
        `Component: \`${spec.type}\``,
        `Validation: ${parsed.ok ? "valid" : `invalid: ${parsed.diagnostic.message}`}`,
        "",
        fencedBlock("slex", source),
      ].filter(Boolean).join("\n");
    })
    .join("\n\n---\n\n");
}

function componentsText(): string {
  const byCategory = new Map<string, string[]>();
  for (const spec of componentSpecs) {
    const entries = byCategory.get(spec.category) ?? [];
    entries.push(`- [${spec.title}](/docs/components/${spec.type}.md): \`${spec.type}\` - ${spec.summary}`);
    byCategory.set(spec.category, entries);
  }

  const index = [...byCategory.entries()]
    .map(([category, entries]) => [`## ${category}`, "", entries.join("\n")].join("\n"))
    .join("\n\n");

  return [
    "# SlexKit Components for LLMs",
    "",
    "Use these components inside Markdown `slex` fences. Raw component docs are ordinary `.md` pages that preserve `slex` examples.",
    "",
    `Public component count: ${publicComponentTypes.length}`,
    "",
    index,
    "",
    "---",
    "",
    "# Generated Component API Reference",
    "",
    componentSpecs.map(componentApiMarkdown).join("\n\n---\n\n"),
  ].join("\n");
}

function capabilitiesText(): string {
  const stdCalculator = `{
  slex: "0.1",
  namespace: "std_calculator",
  g: { done: 7, total: 12, samples: [120, 95, 143, 110], bytes: 1536000 },
  layout: {
    "card:summary": {
      title: "Stdlib calculator",
      "stat:progress": { label: "Progress", "$value": "std.format.percent(std.math.safeDivide(g.done, g.total), 1)" },
      "stat:average": { label: "Average", "$value": "std.format.fixed(std.stats.mean(g.samples), 1)", unit: "ms" },
      "stat:payload": { label: "Payload", "$value": "std.units.bytes(g.bytes)" }
    }
  }
}`;

  const networkCard = `{
  slex: "0.1",
  namespace: "secure_network_card",
  g: {
    status: "idle",
    async load() {
      this.status = "loading";
      try {
        var result = await api.get("https://api.example.com/status", { credentials: "omit" });
        this.status = "HTTP " + result.status;
      } catch (error) {
        this.status = api.isPolicyError(error) ? "blocked by policy" : api.errorMessage(error);
      }
    }
  },
  layout: {
    "card:network": {
      title: "Secure network card",
      "button:load": { label: "Load", onclick: "g.load()" },
      "text:status": { "$text": "g.status" }
    }
  }
}`;

  const context = slexkitExpressionContext
    .map((item) => `- \`${item.name}\` (${item.scope}): ${item.summary}`)
    .join("\n");
  const stdlib = slexkitStdlibDocs
    .map((namespace) => [
      `## std.${namespace.name}`,
      "",
      namespace.summary,
      "",
      ...namespace.functions.map((fn) => `- \`${fn.name}${fn.signature.slice(fn.signature.indexOf("("))}\`: ${fn.summary} Example: \`${fn.example}\``),
    ].join("\n"))
    .join("\n\n");
  const capabilities = slexkitRuntimeCapabilities
    .map((capability) => `- \`${capability.name}${capability.signature.slice(capability.signature.indexOf("("))}\` (${capability.policy}, secure default: ${capability.secureDefault}): ${capability.summary}`)
    .join("\n");

  return [
    "# SlexKit Capabilities for LLMs",
    "",
    "Use `std.*` for pure deterministic calculations and formatting. Use `api.*` only for host-injected or secure-runtime capabilities that may require policy.",
    "",
    "## Expression Context",
    "",
    context,
    "",
    stdlib,
    "",
    "## Policy-Gated Runtime API",
    "",
    capabilities,
    "",
    "Secure mode blocks native `fetch`, `XMLHttpRequest`, `WebSocket`, `setTimeout`, `setInterval`, and `requestAnimationFrame`. Use `api.get`, `api.post`, `api.fetch`, `api.setTimeout`, `api.setInterval`, and `api.raf` when host policy enables them.",
    "",
    "## Recipe: Std Calculator",
    "",
    fencedBlock("slex", stdCalculator),
    "",
    "## Recipe: Secure Network Card",
    "",
    fencedBlock("slex", networkCard),
    "",
    "## Recipe: Timer and Animation Policy",
    "",
    "- Timers are disabled in secure mode unless `policy.timer.enabled` is true.",
    "- Use `api.setTimeout` and `api.setInterval`; do not use native scheduling globals.",
    "- Animation is disabled unless `policy.animation.enabled` is true; use `api.raf`.",
  ].join("\n");
}

function authoringText(): string {
  const statusExample = `{
  slex: "0.1",
  namespace: "release_status",
  g: { done: 3, total: 4 },
  layout: {
    "card:summary": {
      title: "Release status",
      "text:count": { "$text": "g.done + '/' + g.total + ' complete'" },
      "progress:bar": { "$value": "g.done / g.total * 100" }
    }
  }
}`;

  return [
    "# SlexKit Authoring Rules for LLMs",
    "",
    "SlexKit's agent-readable source is Markdown with explicit `slex` fences. Do not use `.mdx`; `slex` fences are the interactive layer.",
    "",
    "## Always Do",
    "",
    "- Emit explicit `slex` fenced code blocks for display-oriented interactive UI.",
    "- Use a Slex expression envelope: `slex`, `namespace`, `g`, and `layout`.",
    "- Put mutable state and helper functions in `g`; put component structure in `layout`.",
    "- Use `std.*` for common calculations, formatting, units, and small statistics.",
    "- Use component keys in `type:identifier` form, such as `card:summary`.",
    "- Use `$` read-pipes for dynamic props and `on*` write-pipes for event handlers.",
    "- Include readable Markdown fallback text after the fence.",
    "- Use secure runtime integration for untrusted or agent-generated source.",
    "",
    "## Do Not",
    "",
    "- Do not emit imports, JSX, Svelte, Vue, or project scaffolding inside `slex` fences.",
    "- Do not ask hosts to scan plain JavaScript, JSON, or untagged code blocks.",
    "- Do not wrap ordinary status cards or summaries in ToolHost.",
    "- Do not bypass the sandbox for untrusted source.",
    "- Do not use native `fetch`, `XMLHttpRequest`, `WebSocket`, `setTimeout`, or `requestAnimationFrame` in secure mode; use policy-gated `api.*` instead.",
    "- Do not invent `.mdx` routes for SlexKit docs.",
    "",
    "## Display UI Example",
    "",
    fencedBlock("slex", statusExample),
    "",
    "**Fallback:** Release status: 3/4 complete.",
    "",
    "## ToolHost Boundary",
    "",
    "Use ToolHost only when the UI must return structured user input to the host, such as confirmations, option lists, or forms. Display-only dashboards, metrics, and status blocks should stay as `slex` fences.",
  ].join("\n");
}

async function collectPages(): Promise<{ pages: DocPage[]; sourcePages: SourcePage[]; sourceHashes: Record<string, string> }> {
  const sourcePages: SourcePage[] = [];
  const sourceHashes: Record<string, string> = {};
  let order = 0;

  for (const [path, group, title, summary, href, rawHref] of rootPages) {
    const body = normalizeMarkdownBody(await readProjectFile(path));
    sourcePages.push({ id: rawHref.replace(/^\//, "").replace(/\.md$/, ""), group, title, summary, href, rawHref, sourcePath: path, body, order: order++ });
    sourceHashes[path] = hashText(body);
  }

  for (const [slug, title, summary] of guidePages) {
    const sourcePath = `site/content/guides/${slug}/en-US.md`;
    const body = normalizeMarkdownBody(await readProjectFile(sourcePath));
    sourcePages.push({
      id: `guides/${slug}`,
      group: "Guides",
      title,
      summary,
      href: `/docs/guides/${slug}`,
      rawHref: `/docs/guides/${slug}.md`,
      sourcePath,
      body,
      order: order++,
    });
    sourceHashes[sourcePath] = hashText(body);
  }

  const exampleMarkdown = await discoverExampleMarkdown({ siteRoot: join(root, "site"), locale: "zh-CN" });
  for (const example of loadExampleDocs({ markdownItems: exampleMarkdown, locale: "zh-CN" })) {
    sourcePages.push({
      id: `examples/${example.slug}`,
      group: "Examples",
      title: example.title,
      summary: example.summary,
      href: example.href,
      rawHref: example.markdownHref,
      sourcePath: example.sourcePath,
      body: example.markdown,
      order: order++,
    });
    sourceHashes[example.sourcePath] = hashText(example.markdown);
  }

  for (const [slug, title, summary] of referencePages) {
    const sourcePath = `site/content/reference/${slug}/en-US.md`;
    const body = normalizeMarkdownBody(await readProjectFile(sourcePath));
    sourcePages.push({
      id: `reference/${slug}`,
      group: "Reference",
      title,
      summary,
      href: `/docs/reference/${slug}`,
      rawHref: `/docs/reference/${slug}.md`,
      sourcePath,
      body,
      order: order++,
    });
    sourceHashes[sourcePath] = hashText(body);
  }

  for (const [slug, title, summary] of releasePages) {
    const sourcePath = `site/content/releases/${slug}/en-US.md`;
    const body = normalizeMarkdownBody(await readProjectFile(sourcePath));
    sourcePages.push({
      id: `releases/${slug}`,
      group: "Releases",
      title,
      summary,
      href: `/docs/releases/${slug}`,
      rawHref: `/docs/releases/${slug}.md`,
      sourcePath,
      body,
      order: order++,
    });
    sourceHashes[sourcePath] = hashText(body);
  }

  for (const spec of componentSpecs) {
    const sourcePath = `site/content/components/${spec.type}/en-US.md`;
    const body = normalizeMarkdownBody(await readProjectFile(sourcePath));
    sourcePages.push({
      id: `components/${spec.type}`,
      group: "Components",
      title: spec.title,
      summary: spec.summary,
      href: spec.docs.href,
      rawHref: `/docs/components/${spec.type}.md`,
      sourcePath,
      body,
      order: order++,
    });
    sourceHashes[sourcePath] = hashText(body);
  }

  const sortedSourcePages = sortDocPages(sourcePages);
  const pages = sortedSourcePages.map(pageWithHash);
  return { pages, sourcePages: sortedSourcePages, sourceHashes };
}

function indexText(version: string, pages: AiDocPage[]): string {
  const grouped = groupOrder
    .map((group) => {
      const entries = pages.filter((page) => page.group === group);
      if (entries.length === 0) return "";
      return [
        `### ${group}`,
        ...entries.map((page) => `- [${page.title}](${page.rawHref}): ${page.summary}`),
      ].join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  return [
    "# SlexKit > Markdown-friendly reactive UI runtime for AI output",
    "",
    "## LLM Documentation Files",
    "",
    "- [Full documentation](/llms-full.txt): all canonical English docs pages in one text file.",
    "- [Component reference](/llms-components.txt): component docs index plus generated props/state reference.",
    "- [Runtime docs](/llms-runtime.txt): runtime, host integration, and secure rendering docs.",
    "- [Capabilities](/llms-capabilities.txt): expression context, `std.*` standard library, and policy-gated `api.*`.",
    "- [ToolHost docs](/llms-toolhost.txt): structured user-input UI docs.",
    "- [Authoring rules](/llms-authoring.txt): concise rules for Markdown `slex` fences.",
    "- [AI manifest](/slexkit-ai-manifest.json): structured page, component, and hash metadata.",
    "- [Standard manifest](/standard/slex-standard-manifest.json): schema, component catalog, logic profile, capabilities, and conformance metadata.",
    "- [Logic profile](/standard/slex-logic-profile.json): `$` read-pipes, `on*` write-pipes, directives, context, and secure-mode guidance.",
    "- [Component catalog](/standard/slex-component-catalog.json): public component props, state modes, children, examples, docs, and hashes.",
    "",
    "SlexKit raw docs are Markdown (`.md`) with explicit `slex` fences. The interactive layer is the fenced `slex` source inside each Markdown page.",
    "",
    `Version: ${version}`,
    "",
    "## Table of Contents",
    "",
    grouped,
  ].join("\n");
}

function fullText(version: string, sourcePages: SourcePage[]): string {
  const pages = sourcePages.map((page) => [
    `# ${page.title}`,
    "",
    `URL: ${page.href}`,
    `Raw Markdown: ${page.rawHref}`,
    `Source: ${page.sourcePath}`,
    "",
    page.body,
  ].join("\n"));

  return [
    "# SlexKit Full LLM Documentation",
    "",
    `Version: ${version}`,
    "",
    "This file concatenates SlexKit's canonical English Markdown docs. `slex` fences are preserved exactly.",
    "",
    pages.join("\n\n---\n\n"),
    "",
    "---",
    "",
    "# Generated Component API Supplement",
    "",
    componentSpecs.map(componentApiMarkdown).join("\n\n---\n\n"),
  ].join("\n");
}

function docsFileMetadata(files: Record<AiDocFilename, string>): SlexKitAiManifest["docs"] {
  return Object.fromEntries(
    aiDocFilenames.map((filename) => [
      filename,
      {
        path: `/${filename}`,
        title: filename,
        summary: files[filename].split("\n").find((line) => line && !line.startsWith("#")) ?? "",
        hash: hashText(files[filename]),
      },
    ]),
  ) as SlexKitAiManifest["docs"];
}

export async function createAiDocs(generatedAt = new Date().toISOString()): Promise<AiDocBuild> {
  const packageJson = JSON.parse(await readProjectFile("package.json")) as { version?: string };
  const version = packageJson.version ?? "0.0.0";
  const { pages, sourcePages, sourceHashes } = await collectPages();
  const standard = createStandardArtifacts(version, generatedAt);
  const runtimePages = sourcePages.filter(
    (page) => page.group === "Reference" && ["spec", "usage", "runtime", "integration", "security", "packages", "standard"].some((slug) => page.id === `reference/${slug}`),
  );
  const toolhostPages = sourcePages.filter((page) => page.id === "reference/toolhost");

  const files: Record<AiDocFilename, string> = {
    "llms.txt": indexText(version, pages),
    "llms-full.txt": fullText(version, sourcePages),
    "llms-components.txt": componentsText(),
    "llms-runtime.txt": [
      "# SlexKit Runtime for LLMs",
      "",
      ...runtimePages.flatMap((page) => [`## ${page.title}`, "", `Raw Markdown: ${page.rawHref}`, "", page.body, "", "---", ""]),
    ].join("\n").trim(),
    "llms-capabilities.txt": capabilitiesText(),
    "llms-toolhost.txt": [
      "# SlexKit ToolHost for LLMs",
      "",
      "ToolHost is the structured-input path for confirmations, choices, and forms. Do not use it for ordinary display-only UI.",
      "",
      ...toolhostPages.flatMap((page) => [`## ${page.title}`, "", `Raw Markdown: ${page.rawHref}`, "", page.body, "", "---", ""]),
    ].join("\n").trim(),
    "llms-authoring.txt": authoringText(),
  };

  const components = componentSpecs.map((spec) => ({
    type: spec.type,
    title: spec.title,
    category: spec.category,
    status: spec.status,
    state: spec.state,
    since: spec.since,
    summary: spec.summary,
    docsHref: spec.docs.href,
    rawHref: `/docs/components/${spec.type}.md`,
    propCount: Object.keys(spec.props).length,
    exampleCount: spec.examples.length,
    props: spec.props,
    children: spec.children,
    examples: spec.examples.map((example) => ({
      id: example.id,
      title: example.title,
      description: example.description,
      source: example.source,
    })),
    hash: hashText(JSON.stringify(spec)),
  }));

  return {
    files,
    manifest: {
      name: "slexkit-ai-docs",
      packageName: "slexkit",
      version,
      generatedAt,
      docs: docsFileMetadata(files),
      pages,
      expressionContext: slexkitExpressionContext,
      stdlib: slexkitStdlibDocs,
      capabilities: slexkitRuntimeCapabilities,
      standardArtifacts: Object.fromEntries(
        SLEX_STANDARD_ARTIFACTS.map((filename) => [
          filename,
          {
            path: `/standard/${filename}`,
            hash: hashStandardText(standard.files[filename]),
          },
        ]),
      ) as SlexKitAiManifest["standardArtifacts"],
      components,
      sourceHashes: {
        ...sourceHashes,
        ...Object.fromEntries(componentSpecs.map((spec) => [`component:${spec.type}`, hashText(JSON.stringify(spec))])),
      },
    },
  };
}

export async function generateAiDocs(options: { outputDirs?: string[]; generatedAt?: string } = {}): Promise<AiDocBuild> {
  const build = await createAiDocs(options.generatedAt);
  const outputDirs = options.outputDirs ?? [join(root, "dist", "ai"), join(root, "site-static")];

  for (const dir of outputDirs) {
    await mkdir(dir, { recursive: true });
    await Promise.all([
      ...aiDocFilenames.map((filename) => writeFile(join(dir, filename), `${build.files[filename].trim()}\n`, "utf-8")),
      writeFile(join(dir, "slexkit-ai-manifest.json"), `${JSON.stringify(build.manifest, null, 2)}\n`, "utf-8"),
    ]);
  }

  return build;
}

export async function writeAiRawMarkdown(outputDir: string, pages: readonly DocPage[]): Promise<void> {
  for (const page of pages) {
    if (!page.rawHref.endsWith(".md") || page.rawHref.includes("..") || page.rawHref.includes("\\")) {
      throw new Error(`Invalid raw Markdown href: ${page.rawHref}`);
    }

    const target = join(outputDir, page.rawHref.replace(/^\/+/, ""));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${page.body.trim()}\n`, "utf-8");
  }
}

export function getComponentExamplesMarkdown(type?: string): string {
  const specs = type ? componentSpecs.filter((spec) => spec.type === type) : componentSpecs;
  return specs.map(componentExamplesMarkdown).filter(Boolean).join("\n\n---\n\n");
}

if (import.meta.main) {
  await generateAiDocs();
}
