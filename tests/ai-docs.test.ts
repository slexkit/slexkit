import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { aiDocFilenames, createAiDocs, writeAiRawMarkdown } from "../scripts/generate-ai-docs";
import { publicComponentTypes } from "../src/components/spec-registry";
import { parseSlexSource } from "../src/engine/diagnostics";

describe("AI documentation generation", () => {
  function slexFences(source: string): string[] {
    return Array.from(source.matchAll(/```slex\s*\n([\s\S]*?)\n```/g), (match) => match[1]);
  }

  it("builds non-empty llms files and a manifest from source docs", async () => {
    const build = await createAiDocs("2026-01-01T00:00:00.000Z");

    for (const filename of aiDocFilenames) {
      expect(build.files[filename].length).toBeGreaterThan(200);
      expect(build.manifest.docs[filename].path).toBe(`/${filename}`);
      expect(build.manifest.docs[filename].hash).toMatch(/^[0-9a-f]{8}$/);
    }

    expect(build.files["llms.txt"]).toContain("# SlexKit > Markdown-friendly reactive UI runtime for AI output");
    expect(build.files["llms.txt"]).toContain("Version:");
    expect(build.files["llms.txt"]).toContain("/llms-full.txt");
    expect(build.files["llms.txt"]).toContain("/llms-components.txt");
    expect(build.files["llms.txt"]).toContain("/llms-capabilities.txt");
    expect(build.files["llms.txt"]).toContain("/slexkit-ai-manifest.json");
    expect(build.files["llms.txt"]).toContain("### Guides");
    expect(build.files["llms.txt"]).toContain("### Examples");
    expect(build.files["llms.txt"]).toContain("### Components");
    expect(build.files["llms.txt"]).toContain("### Reference");
    expect(build.files["llms.txt"]).toContain("### Releases");
    expect(build.files["llms.txt"]).not.toContain(".mdx");
    expect(build.files["llms.txt"]).toContain("/docs/guides/integration.md");
    expect(build.files["llms.txt"]).toContain("/docs/reference/spec.md");
    expect(build.files["llms.txt"]).toContain("/docs/releases/changelog.md");
    expect(build.manifest.pages.some((page) => page.rawHref === "/docs/guides/integration.md")).toBe(true);
    expect(build.manifest.pages.some((page) => page.rawHref === "/docs/reference/spec.md")).toBe(true);
    expect(build.manifest.pages.some((page) => page.rawHref === "/docs/releases/changelog.md")).toBe(true);
    expect(build.files["llms-components.txt"]).toContain(`Public component count: ${publicComponentTypes.length}`);
    expect(build.files["llms-capabilities.txt"]).toContain("std.math.clamp");
    expect(build.files["llms-capabilities.txt"]).toContain("api.fetch");
    expect(build.manifest.expressionContext.some((item) => item.name === "std")).toBe(true);
    expect(build.manifest.stdlib.some((namespace) => namespace.name === "math")).toBe(true);
    expect(build.manifest.capabilities.some((capability) => capability.name === "api.fetch")).toBe(true);
    expect(build.manifest.components).toHaveLength(publicComponentTypes.length);
    expect(build.manifest.pages.every((page) => page.rawHref.endsWith(".md"))).toBe(true);
  });

  it("keeps generated component examples parseable as Slex source", async () => {
    const build = await createAiDocs("2026-01-01T00:00:00.000Z");

    for (const component of build.manifest.components) {
      for (const example of component.examples) {
        const source = JSON.stringify(example.source, null, 2);
        const parsed = parseSlexSource(source);
        expect(parsed.ok, `${component.type}:${example.id}`).toBe(true);
      }
    }
  });

  it("writes every indexed rawHref as Markdown for static export", async () => {
    const build = await createAiDocs("2026-01-01T00:00:00.000Z");
    const outDir = await mkdtemp(join(tmpdir(), "slexkit-ai-docs-"));

    try {
      await writeAiRawMarkdown(outDir, build.manifest.pages);
      for (const page of build.manifest.pages) {
        const target = join(outDir, page.rawHref.replace(/^\/+/, ""));
        const source = await readFile(target, "utf-8");
        expect(source.trim().length, page.rawHref).toBeGreaterThan(0);
        expect(source).toContain(page.body.split("\n").find((line) => line.trim()) ?? "");
      }
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("renders the AI agents guide with SlexKit-native component examples", async () => {
    for (const path of ["site/content/guides/ai-agents/en-US.md", "site/content/guides/ai-agents/zh-CN.md"]) {
      const source = await readFile(path, "utf-8");
      expect(source).toContain('"link:index"');
      expect(source).toContain('href: "/llms.txt"');
      expect(source).toContain("slexkitDocs");
      expect(source).not.toContain('"table:skillTable"');
      expect(source).not.toContain('"table:issues"');
      expect(source).not.toContain("append `.mdx`");

      const fences = slexFences(source);
      expect(fences.length, path).toBeGreaterThanOrEqual(3);
      expect(fences[0]).toContain('"column:links"');
      expect(fences[0]).not.toContain('"card:docs"');
      for (const fence of fences) {
        const parsed = parseSlexSource(fence);
        expect(parsed.ok, `${path}\n${fence}`).toBe(true);
      }
    }
  });
});
