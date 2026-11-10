import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, mock } from "bun:test";
import type { SlexKitMarkdownRuntimeHost } from "slexkit";
import type { SyntaxHighlighterProps } from "../src/index";
import { createSlexKitRenderer } from "../../streamdown/src/index";

mock.module("@slexkit/streamdown", () => ({ createSlexKitRenderer }));
const { createSlexKitAssistantStreamdownComponents } = await import("../src/index");

const source = (text: string) => `<slex-card data-key="message" title="Message"><p>${text}</p></slex-card>`;

function mockHost(): SlexKitMarkdownRuntimeHost {
  const host: SlexKitMarkdownRuntimeHost = {
    configure() {}, getMode: () => "secure", disposeBlock() {}, disposeArtifact() {}, disposeAll() {},
    mountBlock(block) {
      const frame = block.container.ownerDocument.createElement("iframe");
      frame.dataset.source = block.source;
      block.container.append(frame);
      return () => frame.remove();
    },
    async updateArtifact(_artifactId, blocks, options) {
      if (options.phase !== "commit") return;
      for (const block of blocks) {
        const frame = block.container.querySelector("iframe") as HTMLIFrameElement | null;
        if (frame) frame.dataset.source = block.source;
        else host.mountBlock(block);
      }
    },
    async resetArtifact() {},
  };
  return host;
}

function syntaxProps(code: string, language = "slex"): SyntaxHighlighterProps {
  return {
    code,
    language,
    components: {
      Pre: (props) => React.createElement("pre", props),
      Code: (props) => React.createElement("code", props),
    },
  };
}

async function render(element: React.ReactElement): Promise<{ container: HTMLDivElement; root: Root; unmount(): Promise<void> }> {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  await act(async () => root.render(element));
  await act(async () => { await Promise.resolve(); await new Promise((resolve) => setTimeout(resolve, 0)); });
  return {
    container,
    root,
    async unmount() { await act(async () => root.unmount()); container.remove(); },
  };
}

describe("@slexkit/assistant-ui HTML adapter", () => {
  it("renders a slex block through the assistant-ui Streamdown hook", async () => {
    const components = createSlexKitAssistantStreamdownComponents({ artifactId: "message-1", runtimeHost: mockHost() });
    const SyntaxHighlighter = components.slex?.SyntaxHighlighter;
    expect(SyntaxHighlighter).toBeTruthy();
    const view = await render(React.createElement(SyntaxHighlighter!, syntaxProps(source("Assistant UI"))));
    const frame = view.container.querySelector("iframe") as HTMLIFrameElement;
    expect(frame.dataset.source).toContain("Assistant UI");
    await view.unmount();
  });

  it("passes HTML source through the isolated runtime host", async () => {
    const components = createSlexKitAssistantStreamdownComponents({ artifactId: "message-2", runtimeHost: mockHost() });
    const view = await render(React.createElement(components.slex!.SyntaxHighlighter!, syntaxProps(source("Isolated"))));
    const frame = view.container.querySelector("iframe") as HTMLIFrameElement;
    expect(frame.dataset.source).toContain("Isolated");
    expect(view.container.querySelector(".slexkit-root")).toBeNull();
    await view.unmount();
  });

  it("keeps non-slex overrides while slex remains owned by SlexKit", async () => {
    const typescriptRenderer = mock(() => React.createElement("pre", null, "typescript"));
    const replacedSlexRenderer = mock(() => React.createElement("pre", null, "not slexkit"));
    const components = createSlexKitAssistantStreamdownComponents(
      { artifactId: "message-3", runtimeHost: mockHost() },
      {
        slex: { SyntaxHighlighter: replacedSlexRenderer },
        typescript: { SyntaxHighlighter: typescriptRenderer },
      },
    );
    expect(components.typescript?.SyntaxHighlighter).toBe(typescriptRenderer);
    expect(components.slex?.SyntaxHighlighter).not.toBe(replacedSlexRenderer);
    const view = await render(React.createElement(components.slex!.SyntaxHighlighter!, syntaxProps(source("Merged"))));
    expect(replacedSlexRenderer).not.toHaveBeenCalled();
    const frame = view.container.querySelector("iframe") as HTMLIFrameElement;
    expect(frame.dataset.source).toContain("Merged");
    await view.unmount();
  });
});
