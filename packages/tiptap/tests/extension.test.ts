import { afterEach, describe, expect, it, mock } from "bun:test";
import { Editor, type JSONContent } from "@tiptap/core";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { readFileSync } from "node:fs";
import type {
  SlexKitMarkdownBlock,
  SlexKitMarkdownRuntimeHost,
} from "slexkit";
import { createSlexKitTiptapExtension } from "../src/index";

const editors: Editor[] = [];
const roots: HTMLElement[] = [];

const html = (text: string) => `<p data-key="message">${text}</p>`;
const inputHtml = (value: string, placeholder: string) =>
  `<input data-key="name" value="${value}" placeholder="${placeholder}">`;

function codeBlock(language: string, text: string): JSONContent {
  return { type: "codeBlock", attrs: { language }, content: [{ type: "text", text }] };
}

function doc(...content: JSONContent[]): JSONContent {
  return { type: "doc", content };
}

function createMockHost() {
  const updates: Array<{ artifactId: string; blocks: readonly SlexKitMarkdownBlock[]; phase: string }> = [];
  const disposed: string[] = [];
  const render = (block: SlexKitMarkdownBlock) => {
    const template = block.container.ownerDocument.createElement("template");
    template.innerHTML = block.source;
    const next = template.content.firstElementChild as HTMLElement | null;
    const current = block.container.firstElementChild as HTMLElement | null;
    if (next && current && next.tagName === current.tagName
      && next.getAttribute("data-key") === current.getAttribute("data-key")) {
      for (const attribute of [...next.attributes]) {
        if (current instanceof HTMLInputElement && attribute.name === "value") continue;
        current.setAttribute(attribute.name, attribute.value);
      }
      if (!(current instanceof HTMLInputElement)) current.textContent = next.textContent;
      return;
    }
    block.container.replaceChildren(template.content.cloneNode(true));
  };
  const host: SlexKitMarkdownRuntimeHost = {
    configure() {}, getMode: () => "secure",
    mountBlock(block) { render(block); return () => {}; },
    disposeBlock() {},
    disposeArtifact(id) { disposed.push(id); },
    disposeAll() {},
    async updateArtifact(artifactId, blocks, options) {
      updates.push({ artifactId, blocks: [...blocks], phase: options.phase });
      if (options.phase === "commit") blocks.forEach(render);
    },
    async resetArtifact() {},
  };
  return { host, updates, disposed };
}

function createEditor(
  content: JSONContent | string,
  options: Parameters<typeof createSlexKitTiptapExtension>[0] = {},
  markdown = false,
): Editor {
  const element = document.createElement("div");
  document.body.append(element);
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
  editors.splice(0).forEach((editor) => editor.destroy());
  roots.splice(0).forEach((root) => root.remove());
  document.body.replaceChildren();
  delete (globalThis as Record<string, unknown>).__tiptapProbe;
});

describe("@slexkit/tiptap HTML adapter", () => {
  it("passes raw HTML strings to the artifact host", async () => {
    const { host, updates } = createMockHost();
    createEditor(doc(codeBlock("slex", html("Ready"))), { runtimeHost: host });
    await flush();
    expect(updates.at(-1)?.phase).toBe("commit");
    expect(updates.at(-1)?.blocks[0]?.source).toBe(html("Ready"));
    expect(document.querySelector(".slex-tiptap-preview")?.textContent).toBe("Ready");
  });

  it("does not claim ordinary code blocks", async () => {
    const { host, updates } = createMockHost();
    createEditor(doc(codeBlock("javascript", "const value = 1")), { runtimeHost: host });
    await flush();
    expect(document.querySelector("[data-slexkit-tiptap='true']")).toBeNull();
    expect(document.querySelector("code")?.textContent).toContain("const value = 1");
    expect(updates).toHaveLength(0);
  });

  it("coordinates multiple HTML fences with stable distinct block IDs", async () => {
    const { host, updates } = createMockHost();
    createEditor(doc(codeBlock("slex", html("A")), codeBlock("slex", html("B"))), {
      artifactId: "document-1", runtimeHost: host,
    });
    await flush();
    const commit = updates.filter((entry) => entry.phase === "commit").at(-1)!;
    expect(commit.artifactId).toBe("document-1");
    expect(commit.blocks.map((block) => block.source)).toEqual([html("A"), html("B")]);
    expect(new Set(commit.blocks.map((block) => block.blockId)).size).toBe(2);
  });

  it("keeps editor artifacts isolated", async () => {
    const first = createMockHost();
    const second = createMockHost();
    createEditor(doc(codeBlock("slex", html("A"))), { artifactId: "a", runtimeHost: first.host });
    createEditor(doc(codeBlock("slex", html("B"))), { artifactId: "b", runtimeHost: second.host });
    await flush();
    expect(first.updates.at(-1)?.artifactId).toBe("a");
    expect(second.updates.at(-1)?.artifactId).toBe("b");
  });

  it("preserves keyed control identity, dirty value, and focus across source updates", async () => {
    const { host, updates } = createMockHost();
    const editor = createEditor(doc(codeBlock("slex", inputHtml("seed", "old"))), { runtimeHost: host });
    await flush();
    const input = document.querySelector(".slex-tiptap-preview input") as HTMLInputElement;
    input.value = "dirty";
    input.focus();
    editor.commands.setContent(doc(codeBlock("slex", inputHtml("new default", "new"))));
    await flush();
    const retained = document.querySelector(".slex-tiptap-preview input") as HTMLInputElement;
    expect(retained).toBe(input);
    expect(retained.value).toBe("dirty");
    expect(retained.placeholder).toBe("new");
    expect(document.activeElement).toBe(input);
    expect(updates.at(-1)?.phase).toBe("commit");
  });

  it("keeps the last commit visible when static inspection rejects source", async () => {
    const { host, updates } = createMockHost();
    const onError = mock(() => {});
    const editor = createEditor(doc(codeBlock("slex", html("Good"))), { runtimeHost: host, onError });
    await flush();
    const retained = document.querySelector(".slex-tiptap-preview")?.firstElementChild;
    editor.commands.setContent(doc(codeBlock("slex", `<button onclick="bad()">Bad</button>`)));
    await flush();
    expect(updates.at(-1)?.phase).toBe("preview");
    expect(document.querySelector(".slex-tiptap-preview")?.firstElementChild).toBe(retained);
    expect(document.querySelector(".slex-tiptap-diagnostic")?.textContent).toContain("Failed to render SlexKit");
    expect(onError).toHaveBeenCalled();
  });

  it("never evaluates inline modules in the editor realm", async () => {
    const { host } = createMockHost();
    createEditor(doc(codeBlock("slex", `<p>Safe</p><script type="module">globalThis.__tiptapProbe=1</script>`)), { runtimeHost: host });
    await flush();
    expect((globalThis as Record<string, unknown>).__tiptapProbe).toBeUndefined();
  });

  it("releases the artifact when the editor is destroyed", async () => {
    const { host, disposed } = createMockHost();
    const editor = createEditor(doc(codeBlock("slex", html("Temporary"))), { artifactId: "destroy-me", runtimeHost: host });
    await flush();
    editor.destroy();
    await flush();
    expect(disposed).toContain("destroy-me");
  });

  it("can hide source chrome while keeping the preview", async () => {
    const { host } = createMockHost();
    createEditor(doc(codeBlock("slex", html("Preview"))), { runtimeHost: host, showSource: false });
    await flush();
    expect(document.querySelector(".slex-tiptap-source-hidden")).not.toBeNull();
    expect(document.querySelector(".slex-tiptap-source-toggle")).toBeNull();
    expect(document.querySelector(".slex-tiptap-preview")?.textContent).toBe("Preview");
  });

  it("preserves plain slex fences through Tiptap Markdown roundtrip", async () => {
    const { host } = createMockHost();
    const source = `~~~slex\n${html("Roundtrip")}\n~~~`;
    const editor = createEditor(source, { runtimeHost: host }, true);
    await flush();
    const output = editor.getMarkdown();
    expect(output).toContain("slex");
    expect(output).toContain(html("Roundtrip"));
  });

  it("keeps focus inside editable preview controls", async () => {
    const { host } = createMockHost();
    createEditor(doc(codeBlock("slex", inputHtml("editable", "name"))), { runtimeHost: host });
    await flush();
    const input = document.querySelector(".slex-tiptap-preview input") as HTMLInputElement;
    input.focus();
    input.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    await flush();
    expect(document.activeElement).toBe(input);
  });

  it("clears transient pointer focus from preview buttons", async () => {
    const { host } = createMockHost();
    createEditor(doc(codeBlock("slex", `<button data-key="go">Go</button>`)), { runtimeHost: host });
    await flush();
    const button = document.querySelector(".slex-tiptap-preview button") as HTMLButtonElement;
    button.focus();
    button.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(document.activeElement).not.toBe(button);
  });

  it("keeps hidden adapter chrome hidden in the shipped stylesheet", () => {
    const css = readFileSync(new URL("../style.css", import.meta.url), "utf8");
    expect(css).toContain(".slex-tiptap-source[hidden]");
    expect(css).toContain("display: none");
  });
});
