import { describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { aiDocFilenames, createAiDocs, writeAiRawMarkdown } from "../scripts/generate-ai-docs";
import { inspectSlexSource } from "../src/html/inspect";
import { hashStandardText, SLEX_STANDARD_ARTIFACTS } from "../src/standard/artifacts";
import { describeSlexElements } from "../src/web-components/definitions";

describe("AI documentation generation", () => {
  function slexFences(source: string): string[] {
    return Array.from(source.matchAll(/```slex(?:[ \t]+[^\n]*)?\r?\n([\s\S]*?)\r?\n```/g), (match) => match[1]);
  }

  it("builds deterministic versioned indexes, hashes, and HTML-first metadata", async () => {
    const generatedAt = "2026-01-01T00:00:00.000Z";
    const build = await createAiDocs(generatedAt);
    const repeated = await createAiDocs(generatedAt);
    expect(build).toEqual(repeated);

    for (const filename of aiDocFilenames) {
      expect(build.files[filename].length, filename).toBeGreaterThan(200);
      expect(build.manifest.docs[filename].path).toBe(`/${filename}`);
      expect(build.manifest.docs[filename].hash).toBe(hashStandardText(build.files[filename]));
    }

    const index = build.files["llms.txt"];
    expect(index).toContain("# SlexKit > Markdown-friendly reactive UI runtime for AI output");
    expect(index).toContain("Version: 0.5.0");
    for (const path of [
      "/llms-full.txt",
      "/llms-components.txt",
      "/llms-capabilities.txt",
      "/slexkit-ai-manifest.json",
      ...SLEX_STANDARD_ARTIFACTS.map((name) => `/standard/${name}`),
    ]) expect(index).toContain(path);
    for (const group of ["Guides", "Examples", "Components", "Reference", "Releases"])
      expect(index).toContain(`### ${group}`);
    expect(index).not.toContain(".mdx");

    expect(build.manifest).toMatchObject({
      name: "slexkit-ai-docs",
      generatedAt,
      authoring: { sourceType: "html", fenceLanguage: "slex", legacyObjectSource: false },
    });
    expect(build.manifest.pages.every((page) => page.rawHref.endsWith(".md"))).toBe(true);
    expect(build.manifest.pages.map((page) => page.rawHref)).toEqual(expect.arrayContaining([
      "/docs/guides/integration.md",
      "/docs/reference/spec.md",
      "/docs/reference/standard.md",
      "/docs/releases/changelog.md",
    ]));
    for (const name of SLEX_STANDARD_ARTIFACTS) {
      expect(build.manifest.standardArtifacts[name].path).toBe(`/standard/${name}`);
      expect(build.manifest.standardArtifacts[name].hash).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  it("catalogs 28 default elements plus the optional playground with complete contracts", async () => {
    const build = await createAiDocs("2026-01-01T00:00:00.000Z");
    const defaults = build.manifest.components.filter((item) => item.availability === "default");
    const optional = build.manifest.components.filter((item) => item.availability === "optional");
    expect(defaults).toHaveLength(28);
    expect(defaults.map((item) => item.tagName)).toEqual(describeSlexElements().map((item) => item.tagName));
    expect(optional).toHaveLength(1);
    expect(optional[0]).toMatchObject({ tagName: "slex-playground", entrypoint: "slexkit/tooling" });
    expect(build.manifest.components).toHaveLength(29);

    for (const component of build.manifest.components) {
      expect(component.type).toBe(component.tagName.slice(5));
      expect(component.docsHref).toBe(`/components/${component.type}`);
      expect(component.rawHref).toBe(`/docs/components/${component.type}.md`);
      expect(component.examples.length).toBeGreaterThan(0);
      expect(Array.isArray(component.properties)).toBe(true);
      expect(Array.isArray(component.slots)).toBe(true);
      expect(Array.isArray(component.events)).toBe(true);
      for (const example of component.examples) {
        expect(inspectSlexSource(example.source).ok, `${component.type}:${example.id}`).toBe(true);
      }
    }
  });

  it("documents the sandbox SDK without inventing a reactive signal API", async () => {
    const build = await createAiDocs("2026-01-01T00:00:00.000Z");
    expect(build.manifest.sandboxSdk).toEqual([
      "root", "signal", "onDispose", "onSnapshot", "onRestore", "api",
      "shared.get", "shared.set", "shared.subscribe",
    ]);
    expect(build.files["llms-capabilities.txt"]).toContain("AbortSignal");
    expect(build.files["llms-capabilities.txt"]).toContain("slex.signal");
    expect(build.files["llms-capabilities.txt"]).not.toMatch(/slex\.signal\s*\(/);
    expect(build.files["llms-authoring.txt"]).toContain("standard HTML/SVG");
    expect(build.files["llms-authoring.txt"]).toContain("Do not emit object g/layout source");
  });

  it("keeps static inspection of generated examples non-executing", async () => {
    const marker = "__slexkit_ai_docs_malicious_marker__";
    delete (globalThis as Record<string, unknown>)[marker];
    const source = `<p>Safe preview</p><script>globalThis.${marker} = true;</script>`;
    expect(inspectSlexSource(source).ok).toBe(true);
    expect((globalThis as Record<string, unknown>)[marker]).toBeUndefined();

    const build = await createAiDocs("2026-01-01T00:00:00.000Z");
    for (const fence of slexFences(build.files["llms-full.txt"]))
      expect(inspectSlexSource(fence).ok, fence).toBe(true);
  });

  it("writes every indexed rawHref as ordinary Markdown for static export", async () => {
    const build = await createAiDocs("2026-01-01T00:00:00.000Z");
    const outDir = await mkdtemp(join(tmpdir(), "slexkit-ai-docs-"));
    try {
      await writeAiRawMarkdown(outDir, build.manifest.pages);
      for (const page of build.manifest.pages) {
        const source = await readFile(join(outDir, page.rawHref.replace(/^\/+/, "")), "utf8");
        expect(source.trim().length, page.rawHref).toBeGreaterThan(0);
        expect(source).toContain(page.body.split("\n").find((line) => line.trim()) ?? "");
      }
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });

  it("keeps the bilingual agent guide on valid HTML and native component contracts", async () => {
    for (const path of ["site/content/guides/ai-agents/en-US.md", "site/content/guides/ai-agents/zh-CN.md"]) {
      const source = await readFile(path, "utf8");
      const fences = slexFences(source);
      expect(fences.length, path).toBeGreaterThanOrEqual(2);
      expect(source).toContain("slex.signal");
      expect(source).toContain("AbortSignal");
      expect(source).not.toMatch(/slex\.signal\s*\(/);
      for (const fence of fences) {
        expect(fence).not.toMatch(/\b(?:g|layout)\s*:/);
        expect(fence).not.toMatch(/\s\$[\w-]+\s*=/);
        expect(inspectSlexSource(fence).ok, `${path}\n${fence}`).toBe(true);
      }
    }
  });
});
