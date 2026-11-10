import { describe, expect, it } from "bun:test";
import { marked, type Token } from "marked";
import { inspectSlexSource } from "../../src/html/inspect";

function codeTokens(markdown: string) {
  return marked.lexer(markdown).filter((token): token is Extract<Token, { type: "code" }> => token.type === "code");
}

function slexSources(markdown: string) {
  return codeTokens(markdown)
    .filter((token) => String(token.lang ?? "").trim().split(/\s+/, 1)[0].toLowerCase() === "slex")
    .map((token) => token.text);
}

describe("Markdown HTML fence extraction", () => {
  it("extracts only explicit slex fences and leaves ordinary Markdown/code intact", () => {
    const markdown = [
      "# Status",
      "",
      "Ordinary **Markdown** remains readable.",
      "",
      "```slex render=component",
      '<slex-card title="Build"><p>Ready</p></slex-card>',
      "```",
      "",
      "```js",
      "const untouched = true;",
      "```",
      "",
      "```slexkit",
      "not a SlexKit document fence",
      "```",
      "",
      "    indented code remains ordinary code",
    ].join("\n");

    const tokens = marked.lexer(markdown);
    expect(tokens.some((token) => token.type === "heading" && token.text === "Status")).toBe(true);
    expect(tokens.some((token) => token.type === "paragraph" && token.text.includes("Ordinary"))).toBe(true);
    expect(codeTokens(markdown).map((token) => token.lang ?? "")).toEqual([
      "slex render=component", "js", "slexkit", "",
    ]);
    expect(slexSources(markdown)).toEqual(['<slex-card title="Build"><p>Ready</p></slex-card>']);
    expect(inspectSlexSource(slexSources(markdown)[0]).ok).toBe(true);
  });

  it("preserves complete static HTML fixtures and never executes their scripts while extracting", () => {
    const marker = "__slexkit_markdown_nonexecution__";
    delete (globalThis as Record<string, unknown>)[marker];
    const source = [
      '<section id="fixture">',
      "  <style>.ready { color: green; }</style>",
      '  <slex-stat label="Count" value="3"></slex-stat>',
      '  <svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"></circle></svg>',
      `  <script type="module">globalThis.${marker} = true;</script>`,
      "</section>",
    ].join("\n");
    const extracted = slexSources(`~~~slex\n${source}\n~~~`);
    expect(extracted).toEqual([source]);
    expect(inspectSlexSource(extracted[0])).toMatchObject({ ok: true, value: source });
    expect((globalThis as Record<string, unknown>)[marker]).toBeUndefined();
  });

  it("rejects old object authoring instead of treating it as HTML", () => {
    const [source] = slexSources("```slex\n{ g: {}, layout: {} }\n```");
    expect(inspectSlexSource(source)).toMatchObject({
      ok: false,
      diagnostic: { code: "legacy-object-source" },
    });
  });
});
