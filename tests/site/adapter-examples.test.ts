import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { adapterDemoSourceUrl, stripFrontmatter } from "../../examples/shared/adapter-demo.js";

describe("adapter examples", () => {
  it("loads the official RC low-pass example as the shared adapter fixture", () => {
    expect(adapterDemoSourceUrl).toBe("/official-examples/rc-low-pass-filter/en-US.md");

    const source = readFileSync("site/content/examples/rc-low-pass-filter/en-US.md", "utf8");
    const markdown = stripFrontmatter(source);

    expect(markdown).toContain("# RC Low-Pass Filter");
    expect(markdown).toContain("```slex");
    expect(markdown).toContain('namespace: "example_rc_low_pass_filter"');
    expect(markdown.startsWith("---")).toBe(false);
  });

  it("keeps Streamdown and Tiptap examples on the shared adapter fixture", () => {
    const streamdown = readFileSync("examples/streamdown/main.js", "utf8");
    const tiptap = readFileSync("examples/tiptap/main.js", "utf8");

    expect(streamdown).toContain('from "/shared/adapter-demo.js"');
    expect(tiptap).toContain('from "/shared/adapter-demo.js"');
    expect(streamdown).toContain("loadAdapterDemoMarkdown");
    expect(tiptap).toContain("loadAdapterDemoMarkdown");
    expect(tiptap).toContain("@tiptap/extension-mathematics");
  });

  it("documents adapter examples on the public site with live embeds", () => {
    const streamdown = readFileSync("site/content/examples/streamdown-host/en-US.md", "utf8");
    const tiptap = readFileSync("site/content/examples/tiptap-host/en-US.md", "utf8");

    expect(streamdown).toContain('src="/adapter-demos/streamdown/?embed=1"');
    expect(streamdown).not.toContain("/assets/examples/streamdown-preview.png");
    expect(streamdown).toContain("examples/streamdown");
    expect(tiptap).toContain('src="/adapter-demos/tiptap/?embed=1"');
    expect(tiptap).not.toContain("/assets/examples/tiptap-preview.png");
    expect(tiptap).toContain("examples/tiptap");
  });

  it("serves and exports adapter demo assets for embedded examples", () => {
    const server = readFileSync("site/server.ts", "utf8");
    const exporter = readFileSync("site/scripts/export-static.ts", "utf8");
    const renderer = readFileSync("site/markdown/svelte-renderer.js", "utf8");

    expect(server).toContain("adapterDemoResponse");
    expect(server).toContain("adapter-demos");
    expect(server).toContain("official-examples");
    expect(server).toContain("packages");
    expect(exporter).toContain("copyAdapterDemoFiles");
    expect(exporter).toContain('"adapter-demos"');
    expect(exporter).toContain('"official-examples"');
    expect(exporter).toContain('from "../../shared/adapter-demo.js"');
    expect(renderer).toContain("rewriteRootRelativeUrls");
    expect(renderer).toContain("bindLiveExampleFrames");
    expect(renderer).toContain("iframe[src]");
    expect(renderer).toContain("slex-example-live-frame");
    expect(renderer).toContain("withSiteBase(value)");
  });

  it("keeps the public examples index as a category landing page", () => {
    const route = readFileSync("site/routes/examples.js", "utf8");

    expect(route).toContain("examplesLandingDoc");
    expect(route).toContain("Browse by host, learning path, or use case");
    expect(route).toContain("Streamdown");
    expect(route).toContain("Tiptap");
    expect(route).toContain("Svelte Markdown");
    expect(route).toContain("Obsidian");
    expect(route).toContain("return null");
  });
});
