import { describe, expect, it } from "bun:test";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { inspectSlexSource } from "../../src/html/inspect";
import { describeSlexElements } from "../../src/web-components/definitions";
import { loadWikiDocs, parseMarkdownComponentDoc, publicComponentSlugs } from "../../site/data/component-docs.js";
import { discoverWikiMarkdown } from "../../site/data/content-discovery.js";
import { exportComponentSpecManifest } from "../../site/data/spec-docs.js";

async function markdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(path));
    else if (entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

function fences(source: string) {
  return Array.from(source.matchAll(/(```|~~~)slex(?:[ \t]+[^\n]*)?\n([\s\S]*?)\n\1/g), (match) => match[2]);
}

describe("HTML-first site Markdown content", () => {
  it("loads component docs as ordinary Markdown without generated DSL spec markers", async () => {
    const raw = await readFile("site/content/components/card/en-US.md", "utf8");
    const doc = parseMarkdownComponentDoc("content/components/card/en-US.md", raw);
    expect(doc.slug).toBe("card");
    expect(doc.slexkitRenderMode).toBe("component");
    expect(doc.markdown).toContain("<slex-card");
    expect(doc.markdown).not.toContain("slex:spec-api");
  });

  it("derives public component docs and metadata from the actual Web Components definitions", () => {
    const types = describeSlexElements().map((item) => item.tagName.slice(5));
    expect([...publicComponentSlugs].sort()).toEqual([...types].sort());
    const manifest = exportComponentSpecManifest("zh-CN");
    expect(manifest.generatedFrom).toBe("src/web-components/definitions.ts");
    expect(manifest.components.map((item) => item?.type).sort()).toEqual([...types].sort());
  });

  it("keeps every published slex fence statically valid HTML", async () => {
    const files = await markdownFiles("site/content");
    for (const file of files.filter((path) => !path.includes(`${join("releases", "changelog")}`))) {
      const source = await readFile(file, "utf8");
      for (const fence of fences(source)) {
        const result = inspectSlexSource(fence);
        expect(result.ok, `${file}\n${fence}`).toBe(true);
      }
    }
  });

  it("keeps current public docs free of the removed authoring schema", async () => {
    const files = await markdownFiles("site/content");
    for (const file of files.filter((path) => !path.includes(`${join("releases", "changelog")}`))) {
      const source = await readFile(file, "utf8");
      expect(source, file).not.toMatch(/\bnamespace\s*:\s*["']/);
      expect(source, file).not.toMatch(/\blayout\s*:\s*\{/);
      expect(source, file).not.toMatch(/["']\$[A-Za-z]+["']\s*:/);
    }
  });

  it("discovers bilingual guides, references, and actual component pages", async () => {
    const markdown = await discoverWikiMarkdown({ siteRoot: join(process.cwd(), "site") });
    const en = await loadWikiDocs({ markdownItems: markdown, locale: "en-US" });
    const zh = await loadWikiDocs({ markdownItems: markdown, locale: "zh-CN" });
    expect(en.some((doc) => doc.id === "guides/quick-start")).toBe(true);
    expect(en.some((doc) => doc.id === "reference/spec")).toBe(true);
    expect(zh.some((doc) => doc.id === "components/submit")).toBe(true);
    expect(new Set(en.map((doc) => doc.href)).size).toBe(en.length);
    expect(new Set(zh.map((doc) => doc.href)).size).toBe(zh.length);
  });

  it("documents the isolated frame, host-owned assets, and sandbox SDK", async () => {
    const spec = await readFile("site/content/reference/spec/en-US.md", "utf8");
    const security = await readFile("site/content/reference/security/en-US.md", "utf8");
    const integration = await readFile("site/content/guides/integration/en-US.md", "utf8");
    expect(spec).toContain("slex.onSnapshot");
    expect(spec).toContain("data-key");
    expect(security).toContain("stale response");
    expect(integration).toContain("runtimeUrl");
    expect(integration).toContain("fail closed");
  });

  it("uses shared JSON state and cleanup in cross-block examples", async () => {
    const markdown = await readFile("site/content/examples/cross-doc-state-lab/en-US.md", "utf8");
    expect(markdown).toContain("slex.shared.set");
    expect(markdown).toContain("slex.shared.subscribe");
    expect(markdown).toContain("slex.onDispose");
  });
});
