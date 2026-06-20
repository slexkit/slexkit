import { afterEach, describe, expect, it, mock } from "bun:test";
import { Editor, type JSONContent } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { readFileSync } from "node:fs";
import { createSlexKitTiptapExtension } from "../src/index";

const editors: Editor[] = [];
const roots: HTMLElement[] = [];

function slexSource(namespace: string, text: string): string {
  return `{
  slex: "0.1",
  namespace: "${namespace}",
  layout: {
    "text:message": { text: "${text}" }
  }
}`;
}

function codeBlock(language: string, text: string): JSONContent {
  return {
    type: "codeBlock",
    attrs: { language },
    content: [{ type: "text", text }],
  };
}

function doc(...content: JSONContent[]): JSONContent {
  return { type: "doc", content };
}

function createEditor(content: JSONContent | string, options: Parameters<typeof createSlexKitTiptapExtension>[0] = {}, markdown = false): Editor {
  const element = document.createElement("div");
  document.body.appendChild(element);
  roots.push(element);

  const editor = new Editor({
    element,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      ...(markdown ? [Markdown] : []),
      createSlexKitTiptapExtension(options),
    ],
    content,
    ...(markdown ? { contentType: "markdown" as const } : {}),
  });

  editors.push(editor);
  return editor;
}

async function flush(): Promise<void> {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  for (const editor of editors.splice(0)) {
    editor.destroy();
  }
  for (const root of roots.splice(0)) {
    root.remove();
  }
  document.body.innerHTML = "";
});

describe("SlexKit Tiptap extension", () => {
  it("renders slex code blocks as SlexKit previews", async () => {
    const editor = createEditor(doc(codeBlock("slex", slexSource("tiptap_render", "Rendered"))));
    await flush();

    expect(editor.view.dom.querySelector(".slex-tiptap-block")).toBeTruthy();
    expect(editor.view.dom.querySelector(".slex-tiptap-preview")?.getAttribute("contenteditable")).toBe("false");
    expect(editor.view.dom.querySelector(".slexkit-root")).toBeTruthy();
    expect(editor.view.dom.textContent).toContain("Rendered");
    expect(editor.view.dom.querySelector(".slex-tiptap-source")).toBeTruthy();
  });

  it("keeps ordinary code blocks out of SlexKit rendering", async () => {
    const editor = createEditor(doc(codeBlock("js", "const value = 1;")));
    await flush();

    expect(editor.view.dom.querySelector(".slexkit-root")).toBeNull();
    expect(editor.view.dom.querySelector("pre.slex-tiptap-code-block code.language-js")).toBeTruthy();
    expect(editor.view.dom.textContent).toContain("const value = 1;");
  });

  it("lets state-only fences seed later layout fences in the same editor artifact", async () => {
    const editor = createEditor(doc(
      codeBlock("slex", `{
  namespace: "shared",
  g: { value: 21 }
}`),
      codeBlock("slex", `{
  namespace: "shared",
  layout: {
    "text:answer": { "$text": "'answer:' + (g.value * 2)" }
  }
}`),
    ));
    await flush();

    expect(editor.view.dom.querySelector(".slex-tiptap-state")?.textContent).toBe("State block");
    expect(editor.view.dom.querySelectorAll(".slexkit-root")).toHaveLength(1);
    expect(editor.view.dom.textContent).toContain("answer:42");
  });

  it("clears state seeded by removed state-only fences", async () => {
    const layout = codeBlock("slex", `{
  namespace: "shared_remove",
  layout: {
    "text:answer": { "$text": "'answer:' + String(g.value)" }
  }
}`);
    const editor = createEditor(doc(
      codeBlock("slex", `{
  namespace: "shared_remove",
  g: { value: 21 }
}`),
      layout,
    ));
    await flush();

    expect(editor.view.dom.textContent).toContain("answer:21");

    editor.commands.setContent(doc(layout));
    await flush();

    expect(editor.view.dom.textContent).not.toContain("answer:21");
    expect(editor.view.dom.textContent).toContain("answer:undefined");
  });

  it("keeps matching namespaces isolated across editor artifacts", async () => {
    const content = (value: number) => doc(
      codeBlock("slex", `{
  namespace: "shared",
  g: { value: ${value} }
}`),
      codeBlock("slex", `{
  namespace: "shared",
  layout: { "text:value": { "$text": "'value:' + g.value" } }
}`),
    );

    const first = createEditor(content(1));
    const second = createEditor(content(2));
    await flush();

    expect(first.view.dom.textContent).toContain("value:1");
    expect(first.view.dom.textContent).not.toContain("value:2");
    expect(second.view.dom.textContent).toContain("value:2");
    expect(second.view.dom.textContent).not.toContain("value:1");
  });

  it("cleans up and remounts when source changes", async () => {
    const editor = createEditor(doc(codeBlock("slex", slexSource("tiptap_update", "Before"))));
    await flush();

    editor.commands.setContent(doc(codeBlock("slex", slexSource("tiptap_update", "After"))));
    await flush();

    expect(editor.view.dom.querySelectorAll(".slexkit-root")).toHaveLength(1);
    expect(editor.view.dom.textContent).not.toContain("Before");
    expect(editor.view.dom.textContent).toContain("After");
  });

  it("cleans up mounted SlexKit roots on editor destroy", async () => {
    const editor = createEditor(doc(codeBlock("slex", slexSource("tiptap_destroy", "Temporary"))));
    await flush();

    expect(document.querySelector(".slexkit-root")).toBeTruthy();
    editor.destroy();
    await flush();

    expect(document.querySelector(".slexkit-root")).toBeNull();
  });

  it("reports invalid source and keeps source visible", async () => {
    const onError = mock();
    const editor = createEditor(doc(codeBlock("slex", `{
  namespace: "broken",
  layout: { "text:bad": { text:: "Broken" } }
}`)), { onError });
    await flush();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(editor.view.dom.querySelector(".slex-tiptap-error[role='alert']")).toBeTruthy();
    expect(editor.view.dom.textContent).toContain("Failed to render SlexKit");
    expect(editor.view.dom.querySelector(".slex-tiptap-source")).toBeTruthy();
  });

  it("can hide the source details", async () => {
    const editor = createEditor(
      doc(codeBlock("slex", slexSource("tiptap_hidden_source", "Rendered"))),
      { showSource: false },
    );
    await flush();

    expect(editor.view.dom.querySelector(".slexkit-root")).toBeTruthy();
    expect(editor.view.dom.querySelector(".slex-tiptap-source:not(.slex-tiptap-source-hidden)")).toBeNull();
    expect(editor.view.dom.querySelector(".slex-tiptap-source-hidden")).toBeTruthy();
  });

  it("hides state-only fences when the source is hidden", async () => {
    const editor = createEditor(doc(
      codeBlock("slex", `{
  namespace: "hidden_state",
  g: { value: 21 }
}`),
      codeBlock("slex", `{
  namespace: "hidden_state",
  layout: { "text:value": { "$text": "'value:' + g.value" } }
}`),
    ), { showSource: false });
    await flush();

    const blocks = [...editor.view.dom.querySelectorAll<HTMLElement>(".slex-tiptap-block")];
    expect(blocks).toHaveLength(2);
    expect(blocks[0].hidden).toBe(true);
    expect(blocks[0].querySelector(".slex-tiptap-state")).toBeNull();
    expect(blocks[1].hidden).toBe(false);
    expect(editor.view.dom.textContent).toContain("value:21");
  });

  it("keeps hidden adapter chrome hidden in the shipped stylesheet", () => {
    const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");

    expect(css).toContain(".slex-tiptap-block[hidden]");
    expect(css).toContain(".slex-tiptap-source[hidden]");
    expect(css).toContain("display: none;");
  });

  it("preserves slex fences through Tiptap markdown roundtrip", async () => {
    const markdown = `Text before.

\`\`\`slex
${slexSource("roundtrip", "Markdown")}
\`\`\`

Fallback text.

\`\`\`js
const ordinary = true;
\`\`\`
`;
    const editor = createEditor(markdown, { artifactId: "roundtrip-doc" }, true);
    await flush();

    expect(editor.view.dom.querySelector(".slexkit-root")).toBeTruthy();
    const getMarkdown = (editor as unknown as { getMarkdown?: () => string }).getMarkdown;
    expect(typeof getMarkdown).toBe("function");
    const output = getMarkdown.call(editor);

    expect(output).toContain("```slex");
    expect(output).toContain('namespace: "roundtrip"');
    expect(output).toContain("Fallback text.");
    expect(output).toContain("```js");
    expect(output.indexOf("```slex")).toBeLessThan(output.indexOf("```js"));
  });
});
