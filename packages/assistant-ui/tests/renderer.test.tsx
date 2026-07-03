import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, mock } from "bun:test";
import "../../../src/components/index";
import {
  createSlexKitAssistantStreamdownComponents,
  type SyntaxHighlighterProps,
} from "../src/index";

const renderedScript = (namespace: string, text: string) => `{
  slex: "0.1",
  namespace: "${namespace}",
  g: {},
  layout: {
    "text:message": { text: "${text}" }
  }
}`;

const syntaxProps = (
  code: string,
  language = "slex",
): SyntaxHighlighterProps => ({
  code,
  language,
  components: {
    Pre: (props) => React.createElement("pre", props),
    Code: (props) => React.createElement("code", props),
  },
});

async function flushReact(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function render(element: React.ReactElement): Promise<{
  container: HTMLDivElement;
  root: Root;
  unmount: () => Promise<void>;
}> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(element);
  });
  await flushReact();

  return {
    container,
    root,
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("assistant-ui adapter package", () => {
  it("renders a slex language block through the assistant-ui Streamdown component hook", async () => {
    const components = createSlexKitAssistantStreamdownComponents({
      artifactId: "assistant_ui_trusted",
      runtime: "trusted",
    });
    const SyntaxHighlighter = components.slex?.SyntaxHighlighter;
    expect(SyntaxHighlighter).toBeTruthy();

    const view = await render(
      React.createElement(SyntaxHighlighter!, syntaxProps(renderedScript("assistant_ui_trusted", "Assistant UI"))),
    );

    expect(view.container.querySelector(".slexkit-root")).toBeTruthy();
    expect(view.container.textContent).toContain("Assistant UI");

    await view.unmount();
  });

  it("defaults slex blocks to the secure runtime frame path", async () => {
    const components = createSlexKitAssistantStreamdownComponents({
      artifactId: "assistant_ui_secure",
      secureFrame: {
        runtimeUrl: "/dist/slexkit.runtime.js",
      },
    });
    const SyntaxHighlighter = components.slex?.SyntaxHighlighter;

    const view = await render(
      React.createElement(SyntaxHighlighter!, syntaxProps(renderedScript("assistant_ui_secure", "Secure"))),
    );

    expect(view.container.querySelector("iframe[data-slexkit-secure-frame='true']")).toBeTruthy();
    expect(view.container.querySelector(".slexkit-root")).toBeNull();

    await view.unmount();
  });

  it("keeps non-slex language overrides while slex stays owned by SlexKit", async () => {
    const typescriptRenderer = mock(() => React.createElement("pre", null, "typescript"));
    const replacedSlexRenderer = mock(() => React.createElement("pre", null, "not slexkit"));
    const components = createSlexKitAssistantStreamdownComponents(
      {
        artifactId: "assistant_ui_merge",
        runtime: "trusted",
      },
      {
        slex: { SyntaxHighlighter: replacedSlexRenderer },
        typescript: { SyntaxHighlighter: typescriptRenderer },
      },
    );

    expect(components.typescript?.SyntaxHighlighter).toBe(typescriptRenderer);
    expect(components.slex?.SyntaxHighlighter).not.toBe(replacedSlexRenderer);
    expect(components.slex?.CodeHeader).toBeTruthy();

    const view = await render(
      React.createElement(components.slex!.SyntaxHighlighter!, syntaxProps(renderedScript("assistant_ui_merge", "Merged"))),
    );

    expect(replacedSlexRenderer).not.toHaveBeenCalled();
    expect(view.container.querySelector(".slexkit-root")).toBeTruthy();
    expect(view.container.textContent).toContain("Merged");

    await view.unmount();
  });
});
