import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(import.meta.dir, "../../scripts/registry-smoke.mjs"), "utf8");
const packageBlock = source.match(/const packages = \[([\s\S]*?)\n\];/)?.[1] ?? "";

describe("registry smoke lifecycle", () => {
  test("lets published packages resolve compatible peers", () => {
    for (const peer of [
      "react@19.2.7",
      "react-dom@19.2.7",
      "streamdown@2.5.0",
      "@assistant-ui/react@0.14.24",
      "@assistant-ui/react-streamdown@0.3.5",
      "@tiptap/core@3.27.1",
      "@tiptap/pm@3.27.1",
      "@tiptap/extension-code-block@3.27.1",
    ]) {
      expect(packageBlock).toContain(`"${peer}"`);
    }
    expect(packageBlock).not.toMatch(/^\s*"(?:@[^/]+\/)?[^"@]+",?$/m);
  });

  test("terminates the generated MCP probe and cleans its temp app", () => {
    expect(source).toContain('"process.exit(0);"');
    expect(source).toContain("finally");
    expect(source).toContain("rmSync(appDir, { recursive: true, force: true })");
  });
});
