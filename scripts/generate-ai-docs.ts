import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { describeSlexElements } from "../src/web-components/definitions";
import {
  createStandardArtifacts,
  hashStandardText,
  SLEX_STANDARD_ARTIFACTS,
  type SlexStandardArtifactFilename,
} from "../src/standard/artifacts";

export const aiDocFilenames = [
  "llms.txt", "llms-full.txt", "llms-components.txt", "llms-runtime.txt",
  "llms-capabilities.txt", "llms-toolhost.txt", "llms-authoring.txt",
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

type ElementDescriptor = ReturnType<typeof describeSlexElements>[number];
type CatalogElementDescriptor = ElementDescriptor & {
  availability: "default" | "optional";
  entrypoint: "slexkit/web-components" | "slexkit/tooling";
};
export type SlexKitAiManifest = {
  name: "slexkit-ai-docs";
  packageName: "slexkit";
  version: string;
  generatedAt: string;
  authoring: { sourceType: "html"; fenceLanguage: "slex"; legacyObjectSource: false };
  docs: Record<AiDocFilename, { path: string; title: string; summary: string; hash: string }>;
  pages: DocPage[];
  sandboxSdk: string[];
  staticPolicy: string[];
  standardArtifacts: Record<SlexStandardArtifactFilename, { path: string; hash: string }>;
  components: Array<CatalogElementDescriptor & { type: string; title: string; docsHref: string; rawHref: string; examples: Array<{ id: string; title: string; source: string }> }>;
  sourceHashes: Record<string, string>;
};

type AiDocBuild = { files: Record<AiDocFilename, string>; manifest: SlexKitAiManifest };
const root = join(import.meta.dir, "..");

function hashText(source: string) {
  return hashStandardText(source);
}

function parseFrontmatter(source: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const fields: Record<string, string> = {};
  if (match) for (const line of match[1].split(/\r?\n/)) {
    const entry = line.match(/^([\w-]+):\s*["']?(.*?)["']?\s*$/);
    if (entry) fields[entry[1]] = entry[2];
  }
  return { fields, body: match ? source.slice(match[0].length) : source };
}

async function markdownFiles(dir: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await markdownFiles(path));
    else if (entry.name === "en-US.md") result.push(path);
  }
  return result;
}

async function collectPages(): Promise<DocPage[]> {
  const contentRoot = join(root, "site", "content");
  const files = await markdownFiles(contentRoot);
  const pages: DocPage[] = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    const { fields, body } = parseFrontmatter(source);
    const parts = relative(contentRoot, file).split(sep);
    const section = parts[0];
    const slug = parts[1];
    const group = ({ guides: "Guides", examples: "Examples", components: "Components", reference: "Reference", releases: "Releases" } as const)[section];
    if (!group) continue;
    const id = `${section}/${slug}`;
    const href = section === "components" ? `/components/${slug}` : section === "guides" ? `/docs/guides/${slug}` : section === "examples" ? `/examples/${slug}` : `/docs/${section}/${slug}`;
    const rawHref = `/docs/${section}/${slug}.md`;
    pages.push({ id, group, title: fields.title || slug, summary: fields.summary || "", href, rawHref, sourcePath: relative(root, file).replaceAll(sep, "/"), body, hash: hashText(source) });
  }
  return pages.sort((a, b) => a.group.localeCompare(b.group) || a.title.localeCompare(b.title));
}

function componentExample(element: ElementDescriptor) {
  const type = element.tagName.slice(5);
  if (type === "table") return `<slex-table id="items"></slex-table>\n<script type="module">\n  const table = slex.root.querySelector("#items");\n  table.columns = [{ key: "name", label: "Name" }];\n  table.rows = [{ name: "Ada" }];\n</script>`;
  if (type === "button") return '<slex-button id="action" label="Run"></slex-button>';
  if (type === "input") return '<slex-input id="value" label="Project" value="SlexKit" placeholder="Enter name" description="Visible labels keep form fields scannable."></slex-input>';
  if (type === "card") return '<slex-card title="Metrics" icon="chart-bar">\n  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem;">\n    <slex-stat label="Requests" value="1.2k" unit="/min"></slex-stat>\n    <slex-stat label="Latency" value="42" unit="ms"></slex-stat>\n  </div>\n</slex-card>';
  return `<${element.tagName}></${element.tagName}>`;
}

function componentsForManifest() {
  const elements: CatalogElementDescriptor[] = [
    ...describeSlexElements().map((element) => ({
      ...element,
      availability: "default" as const,
      entrypoint: "slexkit/web-components" as const,
    })),
    {
      tagName: "slex-playground",
      properties: [
        { name: "source", attribute: "source", type: "string | number" },
        { name: "autorun", attribute: "autorun", type: "boolean" },
      ],
      slots: [],
      events: [],
      availability: "optional",
      entrypoint: "slexkit/tooling",
    },
  ];
  return elements.map((element) => {
    const type = element.tagName.slice(5);
    return { ...element, type, title: element.tagName, docsHref: `/components/${type}`, rawHref: `/docs/components/${type}.md`, examples: [{ id: "basic", title: "HTML example", source: componentExample(element) }] };
  });
}

function authoringText() {
  return `# SlexKit HTML authoring\n\nUse the \`html-1\` profile. A \`slex\` fence contains standard HTML/SVG, optional CSS, documented \`slex-*\` elements, and optional inline module scripts. Do not emit object g/layout source, expression attributes, runtime imports, or component registration. Use native events and \`slex.root\`; \`slex.signal\` is an \`AbortSignal\`; release side effects with \`slex.onDispose\`. The host owns runtime/style URLs, component registration, and approved capabilities. Each fence is a separate isolated document; \`slex.shared\` transfers artifact-local JSON only.`;
}

function docsMetadata(files: Record<AiDocFilename, string>) {
  return Object.fromEntries(aiDocFilenames.map((name) => [name, { path: `/${name}`, title: name, summary: files[name].split("\n").find((line) => line && !line.startsWith("#")) || "", hash: hashText(files[name]) }])) as SlexKitAiManifest["docs"];
}

export async function createAiDocs(generatedAt = new Date().toISOString()): Promise<AiDocBuild> {
  const { version = "0.0.0" } = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const pages = await collectPages();
  const components = componentsForManifest();
  const standard = createStandardArtifacts(version, generatedAt);
  const groups = ["Guides", "Examples", "Components", "Reference", "Releases"] as const;
  const index = [
    "# SlexKit > Markdown-friendly reactive UI runtime for AI output",
    "",
    `Version: ${version}`,
    "",
    "## Machine-readable documentation",
    "",
    "- [Complete documentation](/llms-full.txt)",
    "- [Custom-element catalog and examples](/llms-components.txt)",
    "- [Runtime reference](/llms-runtime.txt)",
    "- [Sandbox SDK and capabilities](/llms-capabilities.txt)",
    "- [ToolHost reference](/llms-toolhost.txt)",
    "- [HTML authoring rules](/llms-authoring.txt)",
    "- [AI documentation manifest](/slexkit-ai-manifest.json)",
    "- [Standard manifest](/standard/slex-standard-manifest.json)",
    "- [HTML profile](/standard/slex-html-profile.json)",
    "- [Custom-element catalog](/standard/slex-custom-elements.catalog.json)",
    "- [Sandbox SDK](/standard/slex-sandbox-sdk.json)",
    "- [Static policy](/standard/slex-static-policy.json)",
    "- [HTML conformance fixtures](/standard/slex-html-conformance.json)",
    "",
    ...groups.flatMap((group) => [
      `### ${group}`,
      "",
      ...pages.filter((page) => page.group === group).map((page) => `- [${page.title}](${page.rawHref}): ${page.summary}`),
      "",
    ]),
  ].join("\n").trimEnd();
  const full = pages.map((page) => `# ${page.title}\n\nSource: ${page.sourcePath}\n\n${page.body.trim()}`).join("\n\n---\n\n");
  const componentText = ["# SlexKit custom elements", "", ...components.map((item) => `## \`${item.tagName}\`\n\nProperties: ${item.properties.map((prop) => `\`${prop.name}\``).join(", ") || "none"}\n\n\`\`\`slex\n${item.examples[0].source}\n\`\`\``)].join("\n\n");
  const runtimePages = pages.filter((page) => page.group === "Reference").map((page) => page.body).join("\n\n---\n\n");
  const files: Record<AiDocFilename, string> = {
    "llms.txt": index,
    "llms-full.txt": full,
    "llms-components.txt": `${componentText}\n\nDefault component count: ${components.filter((item) => item.availability === "default").length}\n\nCatalog component count: ${components.length}`,
    "llms-runtime.txt": `# SlexKit HTML runtime\n\n${runtimePages}`,
    "llms-capabilities.txt": "# Sandbox SDK\n\n`slex.root`, the scope `AbortSignal` at `slex.signal`, `slex.onDispose`, `slex.onSnapshot`, `slex.onRestore`, policy-gated `slex.api`, and artifact-local JSON `slex.shared.get/set/subscribe`. Each fence is a separate isolated document. The frame policy denies direct payload resource loads in supported browsers, while approved operations use the host bridge. This is not a universal egress firewall: iframe self-navigation can issue a request. SlexKit does not provide CPU preemption.",
    "llms-toolhost.txt": pages.find((page) => page.id === "reference/toolhost")?.body ?? "# ToolHost\n",
    "llms-authoring.txt": authoringText(),
  };
  return { files, manifest: {
    name: "slexkit-ai-docs", packageName: "slexkit", version, generatedAt,
    authoring: { sourceType: "html", fenceLanguage: "slex", legacyObjectSource: false },
    docs: docsMetadata(files), pages,
    sandboxSdk: ["root", "signal", "onDispose", "onSnapshot", "onRestore", "api", "shared.get", "shared.set", "shared.subscribe"],
    staticPolicy: ["no external scripts/imports", "no event-handler attributes", "no embedded frames/plugins", "no executable URL schemes"],
    standardArtifacts: Object.fromEntries(SLEX_STANDARD_ARTIFACTS.map((name) => [name, { path: `/standard/${name}`, hash: hashStandardText(standard.files[name]) }])) as SlexKitAiManifest["standardArtifacts"],
    components,
    sourceHashes: Object.fromEntries(pages.map((page) => [page.sourcePath, page.hash])),
  } };
}

export async function generateAiDocs(options: { outputDirs?: string[]; generatedAt?: string } = {}) {
  const build = await createAiDocs(options.generatedAt);
  for (const dir of options.outputDirs ?? [join(root, "dist", "ai"), join(root, "site-static")]) {
    await mkdir(dir, { recursive: true });
    await Promise.all([...aiDocFilenames.map((name) => writeFile(join(dir, name), `${build.files[name].trim()}\n`, "utf8")), writeFile(join(dir, "slexkit-ai-manifest.json"), `${JSON.stringify(build.manifest, null, 2)}\n`, "utf8")]);
  }
  return build;
}

export async function writeAiRawMarkdown(outputDir: string, pages: readonly DocPage[]) {
  for (const page of pages) {
    const target = join(outputDir, page.rawHref.replace(/^\/+/, ""));
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${page.body.trim()}\n`, "utf8");
  }
}

export function getComponentExamplesMarkdown(type?: string) {
  return componentsForManifest().filter((item) => !type || item.type === type).map((item) => `## ${item.tagName}\n\n\`\`\`slex\n${item.examples[0].source}\n\`\`\``).join("\n\n");
}

if (import.meta.main) await generateAiDocs();
