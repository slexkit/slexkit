#!/usr/bin/env node
import { createInterface } from "node:readline";
import { readFile } from "node:fs/promises";
import { inspectSlexSource, validateSlexSource } from "slexkit/runtime";

type JsonRpcRequest = { jsonrpc?: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };
type ToolDefinition = { name: string; description: string; inputSchema: Record<string, unknown>; handler: (args: Record<string, unknown>) => Promise<unknown> | unknown };
type Manifest = {
  version: string;
  pages: Array<{ id: string; group: string; title: string; summary: string; href: string; rawHref: string; sourcePath: string; body: string }>;
  authoring: Record<string, unknown>;
  sandboxSdk: string[];
  staticPolicy: string[];
  standardArtifacts?: Record<string, { path: string; hash: string }>;
  components: Array<{ type: string; tagName: string; title: string; docsHref: string; rawHref: string; properties: unknown[]; slots: string[]; events: string[]; examples: Array<{ id: string; title: string; source: string }> }>;
};

const dataBase = new URL("./data/", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("slexkit-ai-manifest.json", dataBase), "utf8")) as Manifest;
const standardArtifactNames = Object.keys(manifest.standardArtifacts ?? {});

function stringArg(args: Record<string, unknown>, key: string) { return typeof args[key] === "string" ? args[key] as string : ""; }
function optionalStringArg(args: Record<string, unknown>, key: string) { const value = stringArg(args, key); return value || undefined; }
function booleanArg(args: Record<string, unknown>, key: string) { return args[key] === true; }
function jsonSchema(properties: Record<string, unknown>, required: string[] = []) { return { type: "object", properties, required, additionalProperties: false }; }

function findPage(args: Record<string, unknown>) {
  const slug = optionalStringArg(args, "slug");
  const url = optionalStringArg(args, "url")?.replace(/^https?:\/\/[^/]+/, "");
  if (url) return manifest.pages.find((page) => page.href === url || page.rawHref === url);
  if (slug) return manifest.pages.find((page) => page.id === slug || page.id.endsWith(`/${slug}`));
  return undefined;
}

function searchPages(args: Record<string, unknown>) {
  const group = optionalStringArg(args, "group")?.toLowerCase();
  const query = optionalStringArg(args, "query")?.toLowerCase();
  return manifest.pages.filter((page) => !group || page.group.toLowerCase() === group).filter((page) => !query || [page.id, page.title, page.summary, page.body].some((value) => value.toLowerCase().includes(query))).map(({ body: _body, ...page }) => page);
}

function sourceFromTemplate(template: string) {
  if (template === "calculator") return `<slex-card title="Calculator">
  <slex-input id="a" label="A" value="10"></slex-input>
  <slex-input id="b" label="B" value="5"></slex-input>
  <slex-stat id="sum" label="Sum"></slex-stat>
</slex-card>
<script type="module">
  const a = slex.root.querySelector("#a");
  const b = slex.root.querySelector("#b");
  const sum = slex.root.querySelector("#sum");
  const update = () => { sum.value = Number(a.value) + Number(b.value); };
  a.addEventListener("input", update); b.addEventListener("input", update); update();
  slex.onDispose(() => { a.removeEventListener("input", update); b.removeEventListener("input", update); });
</script>`;
  if (template === "secure-network-card") return `<slex-card title="Approved request">
  <slex-button id="load" label="Load"></slex-button><slex-text id="status" text="Idle"></slex-text>
</slex-card>
<script type="module">
  const load = slex.root.querySelector("#load"); const status = slex.root.querySelector("#status");
  const run = async () => { status.text = "Loading"; const result = await slex.api.fetch("/status"); status.text = String(result.status); };
  load.addEventListener("click", run); slex.onDispose(() => load.removeEventListener("click", run));
</script>`;
  if (template === "toolhost-form") return `<form id="review"><label><input name="approved" type="checkbox"> Approve</label><label>Reason <input name="reason"></label><button type="submit">Submit</button></form>`;
  return `<slex-card title="Status"><slex-progress label="Complete" value="75"></slex-progress><slex-text text="3/4 complete"></slex-text></slex-card>`;
}

const tools: ToolDefinition[] = [
  {
    name: "slexkitDocs",
    description: "Search or fetch HTML-first SlexKit documentation and standard metadata.",
    inputSchema: jsonSchema({
      query: { type: "string" }, group: { type: "string" }, slug: { type: "string" }, url: { type: "string" },
      includeCapabilities: { type: "boolean" }, standardArtifact: { type: "string", enum: standardArtifactNames },
    }),
    async handler(args) {
      const standardArtifact = optionalStringArg(args, "standardArtifact");
      if (standardArtifact) {
        if (!standardArtifactNames.includes(standardArtifact)) return { error: "standard_artifact_not_found", available: standardArtifactNames };
        return { filename: standardArtifact, metadata: manifest.standardArtifacts?.[standardArtifact], content: JSON.parse(await readFile(new URL(`standard/${standardArtifact}`, dataBase), "utf8")) };
      }
      const capabilities = booleanArg(args, "includeCapabilities") ? { authoring: manifest.authoring, sandboxSdk: manifest.sandboxSdk, staticPolicy: manifest.staticPolicy } : undefined;
      const page = findPage(args);
      return page ? { version: manifest.version, page, capabilities } : { version: manifest.version, pages: searchPages(args), capabilities };
    },
  },
  {
    name: "slexkitExamples",
    description: "Return HTML-first examples or actual custom-element metadata.",
    inputSchema: jsonSchema({ type: { type: "string", description: "Custom-element type without the slex- prefix." }, template: { type: "string", enum: ["status", "calculator", "secure-network-card", "toolhost-form"] } }),
    handler(args) {
      const template = optionalStringArg(args, "template");
      if (template) {
        const source = sourceFromTemplate(template);
        const inspection = inspectSlexSource(source);
        return { template, source, valid: inspection.ok };
      }
      const type = optionalStringArg(args, "type");
      const components = manifest.components.filter((component) => !type || component.type === type);
      if (type && !components.length) return { error: "component_not_found", type, available: manifest.components.map((component) => component.type) };
      return { components };
    },
  },
  {
    name: "slexkitValidate",
    description: "Statically inspect SlexKit HTML and inline JavaScript without executing payload scripts.",
    inputSchema: jsonSchema({ source: { type: "string", description: "HTML fragment from a slex fence." } }, ["source"]),
    handler(args) { return validateSlexSource(stringArg(args, "source")); },
  },
];

const toolByName = new Map(tools.map((tool) => [tool.name, tool]));
function send(message: unknown) { process.stdout.write(`${JSON.stringify(message)}\n`); }
function respond(id: JsonRpcRequest["id"], result: unknown) { if (id !== undefined) send({ jsonrpc: "2.0", id, result }); }
function respondError(id: JsonRpcRequest["id"], code: number, message: string, data?: unknown) { if (id !== undefined) send({ jsonrpc: "2.0", id, error: { code, message, data } }); }

async function handleRequest(request: JsonRpcRequest) {
  if (request.id === undefined && request.method.startsWith("notifications/")) return;
  if (request.method === "initialize") return respond(request.id, { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "@slexkit/mcp", version: manifest.version } });
  if (request.method === "tools/list") return respond(request.id, { tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
  if (request.method === "tools/call") {
    const name = typeof request.params?.name === "string" ? request.params.name : "";
    const args = request.params?.arguments && typeof request.params.arguments === "object" ? request.params.arguments as Record<string, unknown> : {};
    const tool = toolByName.get(name);
    if (!tool) return respondError(request.id, -32602, `Unknown tool: ${name}`, { available: [...toolByName.keys()] });
    const result = await tool.handler(args);
    return respond(request.id, { content: [{ type: "text", text: typeof result === "string" ? result : JSON.stringify(result, null, 2) }], structuredContent: result });
  }
  respondError(request.id, -32601, `Method not found: ${request.method}`);
}

const rl = createInterface({ input: process.stdin, crlfDelay: Infinity });
rl.on("line", (line) => { if (line.trim()) void handleRequest(JSON.parse(line)).catch((error) => respondError(null, -32700, error instanceof Error ? error.message : String(error))); });
