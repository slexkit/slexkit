import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";

type RpcMessage = {
  jsonrpc: "2.0";
  id?: number;
  result?: unknown;
  error?: unknown;
};

function createLineReader(proc: ReturnType<typeof Bun.spawn>, stderrSink?: string[]) {
  const reader = proc.stdout.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  return async function waitForLine(): Promise<RpcMessage> {
    while (true) {
      const lineEnd = buffer.indexOf("\n");
      if (lineEnd >= 0) {
        const line = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);
        return JSON.parse(line) as RpcMessage;
      }

      const next = await reader.read();
      if (next.done) {
        const err = stderrSink ? ` stderr: ${stderrSink.join("").trim() || "(empty)"}` : "";
        throw new Error(`MCP process closed stdout before responding.${err}`);
      }
      buffer += decoder.decode(next.value, { stream: true });
    }
  };
}

describe("@slexkit/mcp stdio server", () => {
  it("lists tools and validates Slex source from the built package", async () => {
    if (!existsSync("packages/mcp/dist/index.js")) {
      throw new Error("packages/mcp/dist/index.js is missing. Run `bun run --filter @slexkit/mcp build` before this test.");
    }

    const proc = Bun.spawn(["bun", "packages/mcp/dist/index.js"], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "pipe",
    });
    const stderrChunks: string[] = [];
    (async () => {
      const reader = proc.stderr.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        stderrChunks.push(decoder.decode(chunk.value, { stream: true }));
      }
    })();
    const waitForLine = createLineReader(proc, stderrChunks);

    const write = (message: unknown) => {
      proc.stdin.write(`${JSON.stringify(message)}\n`);
      proc.stdin.flush();
    };

    try {
      write({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} });
      const initialized = await waitForLine(proc);
      expect(initialized.result).toMatchObject({
        capabilities: { tools: {} },
        serverInfo: { name: "@slexkit/mcp" },
      });

      write({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
      const listed = await waitForLine(proc);
      const tools = (listed.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name);
      expect(tools).toEqual(["slexkitDocs", "slexkitExamples", "slexkitValidate"]);

      write({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "slexkitValidate",
          arguments: {
            source: `{ slex: "0.1", namespace: "test", layout: { "text:message": { text: "Hello" } } }`,
          },
        },
      });
      const validated = await waitForLine(proc);
      expect(validated.result).toMatchObject({
        structuredContent: {
          ok: true,
          schemaVersion: expect.any(String),
          protocolVersion: "0.1",
          logicProfileVersion: expect.any(String),
          componentUsage: ["text"],
        },
      });

      write({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "slexkitValidate",
          arguments: {
            source: `{ namespace: "broken", layout: { "text:message": { foo:: 1 } } }`,
          },
        },
      });
      const invalid = await waitForLine(proc);
      expect(invalid.result).toMatchObject({
        structuredContent: {
          ok: false,
          diagnostic: {
            message: expect.any(String),
          },
        },
      });

      write({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "slexkitDocs",
          arguments: { query: "runtime", includeCapabilities: true },
        },
      });
      const docs = await waitForLine(proc);
      const pages = (docs.result as { structuredContent: { pages: unknown[] } }).structuredContent.pages;
      expect(pages.length).toBeGreaterThan(0);
      expect((docs.result as { structuredContent: { capabilities: { stdlib: unknown[]; capabilities: unknown[] } } }).structuredContent.capabilities.stdlib.length).toBeGreaterThan(0);
      expect((docs.result as { structuredContent: { standardArtifacts: Record<string, unknown> } }).structuredContent.standardArtifacts["slex-standard-manifest.json"]).toBeTruthy();

      write({
        jsonrpc: "2.0",
        id: 7,
        method: "tools/call",
        params: {
          name: "slexkitDocs",
          arguments: { standardArtifact: "slex-logic-profile.json" },
        },
      });
      const standard = await waitForLine(proc);
      expect(standard.result).toMatchObject({
        structuredContent: {
          standardArtifact: {
            filename: "slex-logic-profile.json",
            content: {
              sourceFormat: { fenceLanguage: "slex" },
              secureMode: {
                policyGatedApi: expect.arrayContaining(["api.fetch"]),
              },
            },
          },
        },
      });

      write({
        jsonrpc: "2.0",
        id: 8,
        method: "tools/call",
        params: {
          name: "slexkitDocs",
          arguments: { conformanceReport: true, conformanceFixture: "valid-full-envelope" },
        },
      });
      const conformance = await waitForLine(proc);
      expect(conformance.result).toMatchObject({
        structuredContent: {
          conformanceReport: {
            ok: true,
            total: 1,
            failed: 0,
            cases: [expect.objectContaining({ id: "valid-full-envelope", ok: true })],
          },
        },
      });

      write({
        jsonrpc: "2.0",
        id: 11,
        method: "tools/call",
        params: {
          name: "slexkitExamples",
          arguments: { template: "calculator" },
        },
      });
      const example = await waitForLine(proc);
      expect(example.result).toMatchObject({
        structuredContent: {
          template: "calculator",
          valid: true,
        },
      });
      expect((example.result as { structuredContent: { source: string } }).structuredContent.source).toContain("std.math.round");

      write({
        jsonrpc: "2.0",
        id: 12,
        method: "tools/call",
        params: {
          name: "slexkitValidate",
          arguments: {
            source: `{ slex: "0.1", namespace: "warn", g: { load() { fetch('/x'); api.socket(); return std.math.nope(1); } }, layout: { "text:message": { madeUp: true, "$text": "std.format.fixed(1, 1)" } } }`,
          },
        },
      });
      const warned = await waitForLine(proc);
      expect(warned.result).toMatchObject({
        structuredContent: {
          ok: true,
          warnings: expect.arrayContaining([
            expect.objectContaining({ code: "unknown_std_member" }),
            expect.objectContaining({ code: "unknown_api_member" }),
            expect.objectContaining({ code: "unknown_prop" }),
            expect.objectContaining({ code: "native_secure_capability" }),
          ]),
          stdlibUsage: expect.arrayContaining(["std.format.fixed", "std.math.nope"]),
          apiUsage: expect.arrayContaining(["api.socket"]),
        },
      });

      write({
        jsonrpc: "2.0",
        id: 13,
        method: "tools/call",
        params: {
          name: "missingTool",
          arguments: {},
        },
      });
      const unknown = await waitForLine(proc);
      expect(unknown.error).toMatchObject({
        code: -32602,
        data: {
          available: ["slexkitDocs", "slexkitExamples", "slexkitValidate"],
        },
      });
    } finally {
      proc.kill();
      await proc.exited;
    }
  });
});
