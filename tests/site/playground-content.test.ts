import { describe, expect, it } from "bun:test";
import { inspectSlexSource } from "../../src/html/inspect";
import { analyzeSlexSource, canParseSlexSource, defaultPlaygroundSource, normalizePlaygroundMode } from "../../site/playground/playground-utils.js";
import { homePlaygroundConfig } from "../../site/playground/home-playground.js";
import { createDocsShellProps } from "../../site/pages/docs.js";
import { getPlaygroundSource, setPlaygroundSource } from "../../site/playground/source-url.js";

describe("HTML-first site playground", () => {
  it("keeps large shared source out of HTTP request URLs and supports existing links", () => {
    const source = '<slex-text value="你好 & world"></slex-text>\n'.repeat(400);
    const url = setPlaygroundSource(new URL("https://example.com/playground.html?mode=live&source=old"), source);
    expect(url.search).toBe("?mode=live");
    expect(getPlaygroundSource(url)).toBe(source);
    expect(getPlaygroundSource(new URL("https://example.com/playground.html?source=legacy%20source"))).toBe("legacy source");
    expect(getPlaygroundSource(setPlaygroundSource(url, ""))).toBe("");
  });
  it("preserves the first HTML line in multiline fences with optional inline metadata", () => {
    const html = '<div onclick="unexpected()">\n<p>Inside</p>\n</div>';
    for (const header of ['~~~slex', '```slex render=component']) {
      const fence = header.startsWith('~') ? '~~~' : '```';
      const result = analyzeSlexSource(`${header}\n${html}\n${fence}`);
      expect(result.ok).toBe(false);
      expect(result.message).toContain("event");
    }
  });
  it("authors the home fixture as Markdown with HTML and a module algorithm", () => {
    const zh = homePlaygroundConfig("zh-CN");
    const en = homePlaygroundConfig("en-US");
    expect(zh.sourceType).toBe("markdown");
    expect(zh.source).toContain("<slex-input");
    expect(zh.source).toContain('<script type="module">');
    expect(zh.source).toContain("slex.onDispose");
    expect(en.source).toContain("# First-order RC Low-pass Filter");
    expect(en.source.match(/<slex-slider/g)?.length).toBe(4);
    expect(en.source).toContain('id="tau"');
    expect(en.source).toContain('id="formula"');
    expect(en.source).toContain('id="reset"');
    expect(en.source).not.toContain("layout:");
  });

  it("keeps the standalone default statically parseable", () => {
    const match = defaultPlaygroundSource.match(/(?:```|~~~)slex\n([\s\S]*?)\n(?:```|~~~)/);
    expect(match?.[1]).toBeTruthy();
    expect(inspectSlexSource(match![1]).ok).toBe(true);
    expect(canParseSlexSource(defaultPlaygroundSource)).toBe(true);
    expect(canParseSlexSource("```slex\n{ g: {}, layout: {} }\n```")).toBe(false);
  });

  it("normalizes code/render/live modes", () => {
    expect(normalizePlaygroundMode(null)).toBe("render");
    expect(normalizePlaygroundMode("editor")).toBe("code");
    expect(normalizePlaygroundMode("split")).toBe("live");
  });

  it("reports static HTML diagnostics without executing source", () => {
    const result = analyzeSlexSource('```slex\n<button onclick="run()">Run</button>\n```');
    expect(result.ok).toBe(false);
  });

  it("uses CodeMirror HTML mode with the stable Markdown artifact host", async () => {
    const source = await Bun.file("site/playground.js").text();
    const markdownPreview = await Bun.file("site/markdown/PlaygroundMarkdown.svelte").text();
    expect(source).toContain('from "@codemirror/lang-html"');
    expect(source).toContain("inspectSlexSource");
    expect(source).toContain("markdownApp?.updateSource");
    expect(source).toContain("Preview retained · fix HTML");
    expect(markdownPreview).toContain("MarkdownRenderer");
    expect(markdownPreview).toContain("splitMarkdownSource");
    expect(markdownPreview).toContain("escapeRawHtml");
    expect(source).not.toContain("registerAll");
    expect(source).not.toContain("layout:");
  });

  it("uses the Markdown host directly and fails closed through an explicit runtime URL", async () => {
    const renderer = await Bun.file("site/markdown/svelte-renderer.js").text();
    const slexCode = await Bun.file("site/markdown/SlexCode.svelte").text();
    expect(renderer).toContain("createSlexKitMarkdownRuntimeHost");
    expect(renderer).toContain('runtimeUrl: withSiteBase("/slexkit.runtime.js")');
    expect(slexCode).toContain("inspectSlexSource");
    expect(slexCode).toContain("updateSlexArtifactRegistration");
    expect(slexCode).not.toContain("splitSlexSourceBlocks");
    expect(slexCode).not.toContain("stateOnly");
  });

  it("keeps direct shell props and Live links on raw Markdown", async () => {
    const props = createDocsShellProps({ playgroundHrefBase: "/slexkit/playground.html" });
    const shell = await Bun.file("site/components/DocsShell.svelte").text();
    expect(props.playgroundHrefBase).toBe("/slexkit/playground.html");
    expect(shell).toContain('mode: "live"');
    expect(shell).toContain('type: "markdown"');
    expect(shell).toContain("src: href");
  });

  it("mounts the homepage playground as an isolated iframe instead of a root DSL component", async () => {
    const route = await Bun.file("site/routes/home.js").text();
    expect(route).toContain('document.createElement("iframe")');
    expect(route).toContain("homePlaygroundSource(currentLocale())");
    expect(route).not.toContain('"playground:demo"');
  });
});
