import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(import.meta.dir, "../../scripts/registry-smoke.mjs"), "utf8");
const releaseSource = readFileSync(resolve(import.meta.dir, "../../scripts/release-smoke.mjs"), "utf8");

describe("registry smoke lifecycle", () => {
  test("lets published packages resolve compatible peers", () => {
    for (const [adapter, peers] of [
      ["streamdown", ["react", "react-dom", "streamdown"]],
      ["assistant-ui", ["react", "@assistant-ui/react", "@assistant-ui/react-streamdown"]],
      ["tiptap", ["@tiptap/core", "@tiptap/pm", "@tiptap/extension-code-block"]],
    ] as const) {
      const pkg = JSON.parse(readFileSync(resolve(import.meta.dir, `../../packages/${adapter}/package.json`), "utf8"));
      for (const peer of peers) {
        expect(typeof pkg.peerDependencies[peer]).toBe("string");
        expect(pkg.dependencies?.[peer]).toBeUndefined();
      }
    }
  });

  test("terminates the generated MCP probe and cleans its temp app", () => {
    expect(releaseSource).toContain('"process.exit(0);"');
    expect(source).toContain("finally");
    expect(source).toContain("rmSync(appDir, { recursive: true, force: true })");
  });
});
