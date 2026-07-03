import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
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

  it("renders the assistant-ui example through assistant-ui message context", () => {
    const html = readFileSync("examples/assistant-ui/index.html", "utf8");
    const main = readFileSync("examples/assistant-ui/main.js", "utf8");

    expect(html).toContain("@slexkit/assistant-ui");
    expect(html).toContain("@assistant-ui/react");
    expect(html).toContain("@assistant-ui/react-streamdown");
    expect(html).toContain('src="./main.js"');
    expect(html).not.toContain(".jsx");
    expect(existsSync("examples/assistant-ui/main.jsx")).toBe(false);
    expect(html).toContain("document.documentElement.dataset.embed");
    expect(main).toContain("useExternalStoreRuntime");
    expect(main).toContain("convertMessage");
    expect(main).toContain("AssistantRuntimeProvider");
    expect(main).toContain("ThreadPrimitive");
    expect(main).toContain("MessagePrimitive.Parts");
    expect(main).toContain("SlexKitAssistantStreamdownText");
    expect(main).toContain('runtime: "secure"');
    expect(main).toContain('runtimeUrl: "/dist/slexkit.runtime.js"');
    expect(main).toContain("const cutoffHz = 640");
    expect(main).toContain("namespace: \"assistant_ui_static_filter\"");
    expect(main).toContain('"grid:stats"');
    expect(main).toContain('"badge:runtime"');
    expect(main).toContain('"$value": "g.alpha.toFixed(4)"');
    expect(main).not.toContain("children: [");
    expect(main).not.toContain("renderToolCall");
    expect(main).not.toContain("ToolHost");

    const css = readFileSync("examples/assistant-ui/style.css", "utf8");
    expect(css).toContain('html[data-embed="true"]');
    expect(css).toContain('html[data-embed="true"] .adapter-source-panel');
  });

  it("documents adapter examples on the public site with live embeds", () => {
    const assistantUi = readFileSync("site/content/examples/assistant-ui-host/en-US.md", "utf8");
    const assistantUiZh = readFileSync("site/content/examples/assistant-ui-host/zh-CN.md", "utf8");
    const streamdown = readFileSync("site/content/examples/streamdown-host/en-US.md", "utf8");
    const tiptap = readFileSync("site/content/examples/tiptap-host/en-US.md", "utf8");

    expect(assistantUi).toContain("@slexkit/assistant-ui");
    expect(assistantUi).toContain("SlexKitAssistantStreamdownText");
    expect(assistantUi).toContain("ToolHost | Not adapted");
    expect(assistantUi).toContain('src="/adapter-demos/assistant-ui/?embed=1"');
    expect(assistantUi).toContain("examples/assistant-ui");
    expect(assistantUiZh).toContain('category: "宿主集成"');
    expect(assistantUiZh).toContain('src="/adapter-demos/assistant-ui/?embed=1"');
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
    const docsCss = readFileSync("site/styles/docs-shell.css", "utf8");

    expect(server).toContain("adapterDemoResponse");
    expect(server).toContain("adapter-demos");
    expect(server).toContain("assistant-ui");
    expect(server).toContain("official-examples");
    expect(server).toContain("packages");
    expect(server).toContain("Response.redirect(redirectUrl, 308)");
    expect(server).toContain('? "slexkit.js"');
    expect(readFileSync("examples/dev-server.mjs", "utf8")).toContain(
      'rest === "slexkit.runtime.js" ? "slexkit.js" : rest',
    );
    expect(readFileSync("examples/dev-server.mjs", "utf8")).toContain('"access-control-allow-origin"');
    expect(exporter).toContain("copyAdapterDemoFiles");
    expect(exporter).toContain("AdapterDemoName");
    expect(exporter).toContain('"assistant-ui"');
    expect(exporter).toContain('"adapter-demos"');
    expect(exporter).toContain('"official-examples"');
    expect(exporter).toContain('href="${withBase(`${demoBase}/style.css`)}"');
    expect(exporter).toContain('src="${withBase(`${demoBase}/main.js`)}"');
    expect(exporter).toContain('from "../../shared/adapter-demo.js"');
    expect(renderer).toContain("rewriteRootRelativeUrls");
    expect(renderer).toContain("bindLiveExampleFrames");
    expect(renderer).toContain("iframe[src]");
    expect(renderer).toContain("slex-example-live-frame");
    expect(renderer).toContain("withSiteBase(value)");
    expect(docsCss).toContain('.slex-example-live-frame[src*="assistant-ui"]');
  });

  it("keeps the public examples index as a category landing page", () => {
    const route = readFileSync("site/routes/examples.js", "utf8");

    expect(route).toContain("examplesLandingDoc");
    expect(route).toContain("Browse by host, learning path, or use case");
    expect(route).toContain("assistant-ui");
    expect(route).toContain("Streamdown");
    expect(route).toContain("Tiptap");
    expect(route).toContain("Svelte Markdown");
    expect(route).toContain("Obsidian");
    expect(route).toContain("return null");
  });
});
