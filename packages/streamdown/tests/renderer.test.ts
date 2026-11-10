import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, mock } from "bun:test";
import { Streamdown } from "streamdown";
import type {
  SlexKitArtifactUpdateOptions,
  SlexKitMarkdownBlock,
  SlexKitMarkdownRuntimeHost,
} from "slexkit";
import {
  SlexKitRenderer,
  createSlexKitRenderer,
  slexkitRenderer,
} from "../src/index";

const html = (text: string) => `<slex-card data-key="card" title="Status"><p data-key="value">${text}</p></slex-card>`;

type HostLog = {
  artifactId: string;
  blocks: readonly SlexKitMarkdownBlock[];
  options: SlexKitArtifactUpdateOptions;
};

function mockHost() {
  const updates: HostLog[] = [];
  const disposedArtifacts: string[] = [];
  const frames = new WeakMap<HTMLElement, HTMLIFrameElement>();
  const host: SlexKitMarkdownRuntimeHost = {
    configure() {},
    getMode: () => "secure",
    mountBlock(block) {
      let frame = frames.get(block.container);
      if (!frame) {
        frame = block.container.ownerDocument.createElement("iframe");
        frame.className = "mock-slex-frame";
        block.container.append(frame);
        frames.set(block.container, frame);
      }
      frame.dataset.source = block.source;
      return () => frame?.remove();
    },
    disposeBlock() {},
    disposeArtifact(artifactId) { disposedArtifacts.push(artifactId); },
    disposeAll() {},
    async updateArtifact(artifactId, blocks, options) {
      updates.push({ artifactId, blocks: [...blocks], options });
      if (options.phase === "preview") return;
      for (const block of blocks) host.mountBlock(block);
    },
    async resetArtifact() {},
  };
  return { host, updates, disposedArtifacts };
}

async function flushReact(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function render(element: React.ReactElement): Promise<{
  container: HTMLDivElement;
  root: Root;
  rerender(next: React.ReactElement): Promise<void>;
  unmount(): Promise<void>;
}> {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(element));
  await flushReact();
  return {
    container,
    root,
    async rerender(next) { await act(async () => root.render(next)); await flushReact(); },
    async unmount() { await act(async () => root.unmount()); container.remove(); },
  };
}

function rendererProps(host: SlexKitMarkdownRuntimeHost, code: string, isIncomplete = false) {
  return { code, isIncomplete, language: "slex", runtimeHost: host, showChrome: false };
}

describe("@slexkit/streamdown HTML adapter", () => {
  it("commits a complete HTML source string through the runtime host", async () => {
    const { host, updates } = mockHost();
    const view = await render(React.createElement(SlexKitRenderer, rendererProps(host, html("Ready"))));
    expect(updates.at(-1)?.options.phase).toBe("commit");
    expect(updates.at(-1)?.blocks[0]?.source).toBe(html("Ready"));
    expect(view.container.querySelector("iframe")?.dataset.source).toBe(html("Ready"));
    await view.unmount();
  });

  it("keeps a stable artifact and block identity across commits", async () => {
    const { host, updates } = mockHost();
    const view = await render(React.createElement(SlexKitRenderer, rendererProps(host, html("A"))));
    const first = updates.at(-1)!;
    const frame = view.container.querySelector("iframe");
    await view.rerender(React.createElement(SlexKitRenderer, rendererProps(host, html("B"))));
    const second = updates.at(-1)!;
    expect(second.artifactId).toBe(first.artifactId);
    expect(second.blocks[0]?.blockId).toBe(first.blocks[0]?.blockId);
    expect(view.container.querySelector("iframe")).toBe(frame);
    await view.unmount();
  });

  it("sends incomplete streaming candidates as preview without replacing the commit", async () => {
    const { host, updates } = mockHost();
    const view = await render(React.createElement(SlexKitRenderer, rendererProps(host, html("Committed"))));
    const frame = view.container.querySelector("iframe");
    await view.rerender(React.createElement(SlexKitRenderer, rendererProps(host, "<slex-card", true)));
    expect(updates.at(-1)?.options.phase).toBe("preview");
    expect(view.container.querySelector("iframe")).toBe(frame);
    expect(frame?.dataset.source).toBe(html("Committed"));
    await view.unmount();
  });

  it("reports rejected HTML and keeps the last committed frame live", async () => {
    const { host, updates } = mockHost();
    const onError = mock(() => {});
    const view = await render(React.createElement(SlexKitRenderer, { ...rendererProps(host, html("Good")), onError }));
    const frame = view.container.querySelector("iframe");
    const rejected = `<button onclick="globalThis.bad=true">Bad</button>`;
    await view.rerender(React.createElement(SlexKitRenderer, { ...rendererProps(host, rejected), onError }));
    expect(updates.at(-1)?.options.phase).toBe("preview");
    expect(view.container.querySelector("[role='alert']")).not.toBeNull();
    expect(view.container.querySelector("iframe")).toBe(frame);
    expect(onError).toHaveBeenCalled();
    await view.unmount();
  });

  it("does not execute inline modules in the adapter realm", async () => {
    const { host } = mockHost();
    delete (globalThis as Record<string, unknown>).__adapterProbe;
    const source = `<p>Safe</p><script type="module">globalThis.__adapterProbe = 1</script>`;
    const view = await render(React.createElement(SlexKitRenderer, rendererProps(host, source)));
    expect((globalThis as Record<string, unknown>).__adapterProbe).toBeUndefined();
    await view.unmount();
  });

  it("disposes an empty factory artifact after its final block unmounts", async () => {
    const { host, disposedArtifacts } = mockHost();
    const renderer = createSlexKitRenderer({ domain: "message-1", runtimeHost: host });
    const view = await render(React.createElement(renderer.component, {
      code: html("Bye"), isIncomplete: false, language: "slex",
    }));
    await view.unmount();
    await flushReact();
    expect(disposedArtifacts).toContain("message-1");
  });

  it("coordinates multiple fences in document order", async () => {
    const { host, updates } = mockHost();
    const renderer = createSlexKitRenderer({ domain: "doc", runtimeHost: host });
    const markdown = `~~~slex\n${html("A")}\n~~~\n\n\`\`\`slex\n${html("B")}\n\`\`\``;
    const view = await render(React.createElement(Streamdown, { plugins: { renderers: [renderer] } }, markdown));
    const commit = updates.filter((entry) => entry.options.phase === "commit").at(-1);
    expect(commit?.blocks.map((block) => block.source.trim())).toEqual([html("A"), html("B")]);
    await view.unmount();
  });

  it("leaves ordinary Markdown and JavaScript fences to Streamdown", async () => {
    const { host, updates } = mockHost();
    const renderer = createSlexKitRenderer({ runtimeHost: host });
    const view = await render(React.createElement(Streamdown, { plugins: { renderers: [renderer] } }, "Text\n\n```js\nconst x = 1\n```"));
    expect(view.container.textContent).toContain("Text");
    expect(view.container.textContent).toContain("const x = 1");
    expect(updates).toHaveLength(0);
    await view.unmount();
  });

  it("exposes default and custom language registrations", () => {
    expect(slexkitRenderer.language).toEqual(["slex"]);
    expect(createSlexKitRenderer({ languages: ["slex", "slex-html"] }).language)
      .toEqual(["slex", "slex-html"]);
  });

  it("keeps copy/source chrome available after diagnostics", async () => {
    const { host } = mockHost();
    const view = await render(React.createElement(SlexKitRenderer, {
      ...rendererProps(host, `<iframe src="https://example.com"></iframe>`),
      showChrome: true,
      showSource: true,
    }));
    expect(view.container.querySelector("button.slex-streamdown-copy")).not.toBeNull();
    expect(view.container.querySelector("details.slex-streamdown-source")).not.toBeNull();
    expect(view.container.querySelector("[role='alert']")).not.toBeNull();
    await view.unmount();
  });
});
