#!/usr/bin/env node
import { createInterface } from "node:readline";
import { readFile } from "node:fs/promises";

import { parseSlexSource, validateSlexSource } from "slexkit/runtime";

type JsonRpcRequest = {
  jsonrpc?: "2.0";
  id?: string | number | null;
  method: string;
  params?: Record<string, unknown>;
};

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown> | unknown;
};

type Manifest = {
  version: string;
  pages: Array<{
    id: string;
    group: string;
    title: string;
    summary: string;
    href: string;
    rawHref: string;
    sourcePath: string;
    body: string;
  }>;
  expressionContext: unknown;
  stdlib: unknown;
  capabilities: unknown;
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
    props: Record<string, unknown>;
    children: unknown;
    examples: Array<{ id: string; title: string; description?: string; source: unknown }>;
  }>;
};

const dataBase = new URL("./data/", import.meta.url);

async function readDataFile(name: string): Promise<string> {
  return readFile(new URL(name, dataBase), "utf-8");
}

const manifest = JSON.parse(await readDataFile("slexkit-ai-manifest.json")) as Manifest;

function stringArg(args: Record<string, unknown>, key: string): string {
  const value = args[key];
  return typeof value === "string" ? value : "";
}

function optionalStringArg(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  return typeof value === "string" && value ? value : undefined;
}

function booleanArg(args: Record<string, unknown>, key: string): boolean {
  return args[key] === true;
}

function jsonSchema(properties: Record<string, unknown>, required: string[] = []): Record<string, unknown> {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

function pageMatches(page: Manifest["pages"][number], query: string): boolean {
  const needle = query.toLowerCase();
  return [
    page.id,
    page.group,
    page.title,
    page.summary,
    page.href,
    page.rawHref,
    page.sourcePath,
    page.body,
  ].some((value) => value.toLowerCase().includes(needle));
}

function findPage(args: Record<string, unknown>): Manifest["pages"][number] | undefined {
  const slug = optionalStringArg(args, "slug");
  const url = optionalStringArg(args, "url");
  if (url) {
    const normalized = url.replace(/^https?:\/\/[^/]+/, "");
    return manifest.pages.find((page) => page.rawHref === normalized || page.href === normalized || page.rawHref === url || page.href === url);
  }
  if (slug) {
    return manifest.pages.find((page) => page.id === slug || page.id.endsWith(`/${slug}`) || page.rawHref.endsWith(`/${slug}.md`));
  }
  return undefined;
}

function searchPages(args: Record<string, unknown>) {
  const group = optionalStringArg(args, "group");
  const query = optionalStringArg(args, "query");
  return manifest.pages
    .filter((page) => !group || page.group.toLowerCase() === group.toLowerCase())
    .filter((page) => !query || pageMatches(page, query))
    .map(({ body: _body, ...page }) => page);
}

function sourceFromTemplate(template: string): string {
  if (template === "calculator") {
    return `{
  slex: "0.1",
  namespace: "calculator",
  g: { a: 10, b: 5, samples: [10, 5, 20] },
  layout: {
    "card:calc": {
      title: "Calculator",
      "input:a": { label: "A", "$value": "String(g.a)", onchange: "g.a = Number($event || 0)" },
      "input:b": { label: "B", "$value": "String(g.b)", onchange: "g.b = Number($event || 0)" },
      "stat:sum": { label: "Sum", "$value": "std.math.round(g.a + g.b, 2)" },
      "stat:mean": { label: "Mean", "$value": "std.format.fixed(std.stats.mean(g.samples), 1)" }
    }
  }
}`;
  }

  if (template === "stdlib-calculator") {
    return `{
  slex: "0.1",
  namespace: "stdlib_calculator",
  g: { done: 7, total: 12, payloadBytes: 1536000, latency: [120, 95, 143, 110] },
  layout: {
    "card:std": {
      title: "Stdlib calculator",
      "stat:progress": { label: "Progress", "$value": "std.format.percent(std.math.safeDivide(g.done, g.total), 1)" },
      "stat:average": { label: "Avg latency", "$value": "std.format.fixed(std.stats.mean(g.latency), 1)", unit: "ms" },
      "stat:payload": { label: "Payload", "$value": "std.units.bytes(g.payloadBytes)" }
    }
  }
}`;
  }

  if (template === "secure-network-card") {
    return `{
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
  }

  if (template === "toolhost-form") {
    return `{
  slex: "0.1",
  namespace: "approval_form",
  g: { approved: false, reason: "" },
  layout: {
    "card:approval": {
      title: "Review request",
      "checkbox:approved": { label: "Approve", "$checked": "g.approved", onchange: "g.approved = Boolean($event)" },
      "input:reason": { label: "Reason", "$value": "g.reason", onchange: "g.reason = String($event || '')" },
      "submit:actions": { submitLabel: "Submit", ignoreLabel: "Ignore", returnKeys: ["approved", "reason"] }
    }
  }
}`;
  }

  if (template === "host-integration") {
    return `import { createSlexKitMarkdownRuntimeHost } from "slexkit";
import "slexkit/style.css";

const runtime = createSlexKitMarkdownRuntimeHost({
  mode: "secure",
  secureFrame: { runtimeUrl: "/runtime.js" }
});

runtime.mountBlock({
  artifactId: "message-1",
  blockId: "message-1:block-1",
  source,
  container
});`;
  }

  return `{
  slex: "0.1",
  namespace: "status",
  g: { done: 3, total: 4 },
  layout: {
    "card:summary": {
      title: "Status",
      "text:count": { "$text": "g.done + '/' + g.total + ' complete'" },
      "progress:bar": { "$value": "g.done / g.total * 100" }
    }
  }
}`;
}

const tools: ToolDefinition[] = [
  {
    name: "slexkitDocs",
    description: "Search or fetch SlexKit Markdown docs. Raw docs are .md files with explicit slex fences; no .mdx routes are used.",
    inputSchema: jsonSchema({
      query: { type: "string", description: "Search text. Searches titles, summaries, URLs, source paths, and body text." },
      group: { type: "string", description: "Optional group filter: Guides, Components, Runtime, ToolHost, Security, Packages, Icons." },
      slug: { type: "string", description: "Optional page id or slug to fetch, such as components/card or card." },
      url: { type: "string", description: "Optional href or raw .md URL to fetch." },
      includeCapabilities: { type: "boolean", description: "When true, include expression context, stdlib, and api capability summaries." },
    }),
    handler(args) {
      const capabilities = booleanArg(args, "includeCapabilities")
        ? {
            expressionContext: manifest.expressionContext,
            stdlib: manifest.stdlib,
            capabilities: manifest.capabilities,
          }
        : undefined;
      const page = findPage(args);
      if (page) return { version: manifest.version, page, capabilities };
      return { version: manifest.version, pages: searchPages(args), capabilities };
    },
  },
  {
    name: "slexkitExamples",
    description: "Browse SlexKit component examples, ToolHost examples, and host integration snippets.",
    inputSchema: jsonSchema({
      type: { type: "string", description: "Optional component type, such as card, input, stat, or submit." },
      template: { type: "string", enum: ["status", "calculator", "stdlib-calculator", "secure-network-card", "toolhost-form", "host-integration"], description: "Optional generated example template." },
    }),
    handler(args) {
      const template = optionalStringArg(args, "template");
      if (template) {
        const source = sourceFromTemplate(template);
        const parsed = template === "host-integration" ? { ok: true } : parseSlexSource(source);
        return { template, source, valid: parsed.ok };
      }

      const type = optionalStringArg(args, "type");
      const components = manifest.components.filter((component) => !type || component.type === type);
      if (type && components.length === 0) {
        return { error: "component_not_found", type, available: manifest.components.map((component) => component.type) };
      }
      return {
        components: components.map((component) => ({
          type: component.type,
          title: component.title,
          summary: component.summary,
          rawHref: component.rawHref,
          examples: component.examples.map((example) => ({
            id: example.id,
            title: example.title,
            description: example.description,
            source: JSON.stringify(example.source, null, 2),
          })),
        })),
      };
    },
  },
  {
    name: "slexkitValidate",
    description: "Parse Slex source and return diagnostics plus component usage.",
    inputSchema: jsonSchema({ source: { type: "string", description: "Slex object literal source." } }, ["source"]),
    handler(args) {
      const source = stringArg(args, "source");
      const validation = validateSlexSource(source, { mode: "secure" });
      if (!validation.ok) return validation;
      const { value: _value, ...result } = validation;
      return result;
    },
  },
];

const toolByName = new Map(tools.map((tool) => [tool.name, tool]));

function send(message: unknown): void {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function respond(id: JsonRpcRequest["id"], result: unknown): void {
  send({ jsonrpc: "2.0", id, result });
}

function respondError(id: JsonRpcRequest["id"], code: number, message: string, data?: unknown): void {
  send({ jsonrpc: "2.0", id, error: { code, message, data } });
}

async function handleRequest(request: JsonRpcRequest): Promise<void> {
  if (request.id === undefined && request.method.startsWith("notifications/")) return;

  if (request.method === "initialize") {
    respond(request.id, {
      protocolVersion: "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "@slexkit/mcp", version: manifest.version },
    });
    return;
  }

  if (request.method === "tools/list") {
    respond(request.id, {
      tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
    });
    return;
  }

  if (request.method === "tools/call") {
    const params = request.params ?? {};
    const name = typeof params.name === "string" ? params.name : "";
    const args = params.arguments && typeof params.arguments === "object" ? params.arguments as Record<string, unknown> : {};
    const tool = toolByName.get(name);
    if (!tool) {
      respondError(request.id, -32602, `Unknown tool: ${name}`, { available: [...toolByName.keys()] });
      return;
    }
    const result = await tool.handler(args);
    respond(request.id, {
      content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }],
      structuredContent: result,
    });
    return;
  }

  respondError(request.id, -32601, `Method not found: ${request.method}`);
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  void (async () => {
    try {
      await handleRequest(JSON.parse(trimmed) as JsonRpcRequest);
    } catch (error) {
      respondError(null, -32700, error instanceof Error ? error.message : String(error));
    }
  })();
});
