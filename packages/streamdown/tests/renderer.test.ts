import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { describe, expect, it, mock } from "bun:test";
import { readFile } from "node:fs/promises";
import { Streamdown } from "streamdown";
import { createSlexKitMarkdownRuntimeHost } from "../../../src/engine/index";
import "../../../src/components/index";
import "../../../src/components/tooling";
import {
  SlexKitRenderer,
  createSlexKitRenderer,
  slexkitRenderer,
} from "../src/index";

const renderedScript = (namespace: string, text: string) => `{
  slex: "0.1",
  namespace: "${namespace}",
  g: {},
  layout: {
    "text:message": { text: "${text}" }
  }
}`;

async function flushReact(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function render(element: React.ReactElement): Promise<{
  container: HTMLDivElement;
  root: Root;
  rerender: (next: React.ReactElement) => Promise<void>;
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
    rerender: async (next) => {
      await act(async () => {
        root.render(next);
      });
      await flushReact();
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("streamdown renderer package", () => {
  it("renders a complete SlexKit code fence through the renderer", async () => {
    const view = await render(
      React.createElement(SlexKitRenderer, {
        code: renderedScript("streamdown_direct", "Rendered"),
        isIncomplete: false,
        language: "slex",
      }),
    );

    expect(view.container.querySelector(".slexkit-root")).toBeTruthy();
    expect(view.container.textContent).toContain("Rendered");

    await view.unmount();
  });

  it("can render a SlexKit fence through the secure runtime frame path", async () => {
    const view = await render(
      React.createElement(SlexKitRenderer, {
        code: renderedScript("streamdown_secure", "Rendered securely"),
        isIncomplete: false,
        language: "slex",
        runtime: "secure",
        secureFrame: {
          runtimeUrl: "/dist/slexkit.runtime.js",
        },
      }),
    );

    const iframe = view.container.querySelector("iframe[data-slexkit-secure-frame='true']");
    expect(iframe).toBeTruthy();
    expect(view.container.querySelector(".slexkit-root")).toBeNull();

    await view.unmount();
  });

  it("can delegate fence lifecycle to an external runtime host", async () => {
    const runtimeHost = createSlexKitMarkdownRuntimeHost();
    const view = await render(
      React.createElement(SlexKitRenderer, {
        code: renderedScript("streamdown_host", "Hosted runtime"),
        isIncomplete: false,
        language: "slex",
        runtimeHost,
      }),
    );

    expect(view.container.querySelector(".slexkit-root")).toBeTruthy();
    expect(view.container.textContent).toContain("Hosted runtime");

    runtimeHost.disposeAll();
    await view.unmount();
  });

  it("does not parse secure runtime-host fences in the host realm", async () => {
    const runtimeHost = createSlexKitMarkdownRuntimeHost({
      mode: "secure",
      secureFrame: {
        runtimeUrl: "/dist/slexkit.runtime.js",
      },
    });
    Reflect.deleteProperty(globalThis, "__slexkitHostParsed");

    const view = await render(
      React.createElement(SlexKitRenderer, {
        code: `({
          namespace: "streamdown_secure_host",
          g: ((globalThis.__slexkitHostParsed = true), {}),
          layout: { "text:message": { text: "secure host" } },
        })`,
        isIncomplete: false,
        language: "slex",
        runtimeHost,
      }),
    );

    expect((globalThis as Record<string, unknown>).__slexkitHostParsed).toBeUndefined();
    expect(view.container.querySelector("iframe[data-slexkit-secure-frame='true']")).toBeTruthy();

    runtimeHost.disposeAll();
    await view.unmount();
  });

  it("does not mount while the code fence is incomplete", async () => {
    const view = await render(
      React.createElement(SlexKitRenderer, {
        code: renderedScript("streamdown_incomplete", "Hidden"),
        isIncomplete: true,
        language: "slex",
      }),
    );

    expect(view.container.querySelector(".slexkit-root")).toBeNull();
    expect(view.container.textContent).toContain("Rendering SlexKit");

    await view.rerender(
      React.createElement(SlexKitRenderer, {
        code: renderedScript("streamdown_incomplete", "Visible"),
        isIncomplete: false,
        language: "slex",
      }),
    );

    expect(view.container.querySelector(".slexkit-root")).toBeTruthy();
    expect(view.container.textContent).toContain("Visible");

    await view.unmount();
  });

  it("cleans up stale roots when code changes and on unmount", async () => {
    const view = await render(
      React.createElement(SlexKitRenderer, {
        code: renderedScript("streamdown_lifecycle", "Before"),
        isIncomplete: false,
        language: "slex",
      }),
    );

    await view.rerender(
      React.createElement(SlexKitRenderer, {
        code: renderedScript("streamdown_lifecycle", "After"),
        isIncomplete: false,
        language: "slex",
      }),
    );

    expect(view.container.querySelectorAll(".slexkit-root")).toHaveLength(1);
    expect(view.container.textContent).not.toContain("Before");
    expect(view.container.textContent).toContain("After");

    await view.unmount();
    expect(document.querySelector(".slexkit-root")).toBeNull();
  });

  it("reports invalid Slex source and keeps source controls available", async () => {
    const onError = mock();
    const view = await render(
      React.createElement(SlexKitRenderer, {
        code: `{
  namespace: "broken",
  layout: {
    "card:demo": {
      foo:: 1
    }
  }
}`,
        isIncomplete: false,
        language: "slex",
        onError,
        showSource: true,
      }),
    );

    expect(onError).toHaveBeenCalledTimes(1);
    expect(view.container.querySelector("[role='alert']")).toBeTruthy();
    expect(view.container.textContent).toContain("Unexpected");
    expect(view.container.textContent).toContain("Line 5, column 11");
    expect(view.container.querySelector(".slex-streamdown-error-excerpt")?.textContent).toContain("foo:: 1");
    expect(view.container.textContent).toContain("Copy source");
    expect(view.container.textContent).toContain("Source");

    await view.unmount();
  });

  it("exposes default and custom renderer registrations", () => {
    expect(slexkitRenderer.language).toEqual(["slex"]);
    const renderer = createSlexKitRenderer({ languages: "slex" });
    expect(renderer.language).toBe("slex");
  });

  it("integrates with Streamdown without taking over ordinary JavaScript blocks", async () => {
    const markdown = `Text before.

\`\`\`slex
${renderedScript("streamdown_markdown", "Rendered via Streamdown")}
\`\`\`

\`\`\`js
const namespace = "not_slexkit";
\`\`\`
`;

    const view = await render(
      React.createElement(
        Streamdown,
        { plugins: { renderers: [slexkitRenderer] } },
        markdown,
      ),
    );

    expect(view.container.querySelectorAll(".slexkit-root")).toHaveLength(1);
    expect(view.container.textContent).toContain("Rendered via Streamdown");
    expect(view.container.textContent).toContain("not_slexkit");

    await view.unmount();
  });

  it("lets state-only fences seed later layout fences in the same markdown domain", async () => {
    const renderer = createSlexKitRenderer({ domain: "doc-domain", showChrome: false });
    const markdown = `# Calculator

\`\`\`slex
{
  namespace: "streamdown_domain",
  g: {
    value: 21,
    double: function () {
      return this.value * 2;
    },
  },
}
\`\`\`

下面是布局

\`\`\`slex
{
  namespace: "streamdown_domain",
  layout: {
    "text:answer": { $text: "'answer:' + g.double()" }
  }
}
\`\`\`
`;

    const view = await render(
      React.createElement(
        Streamdown,
        { plugins: { renderers: [renderer] } },
        markdown,
      ),
    );

    expect(view.container.querySelectorAll(".slexkit-root")).toHaveLength(1);
    expect(view.container.textContent).toContain("下面是布局");
    expect(view.container.textContent).toContain("answer:42");
    expect(view.container.textContent).not.toContain("Copy source");

    await view.unmount();
  });

  it("clears state seeded by removed state-only fences on rerender", async () => {
    const renderer = createSlexKitRenderer({ domain: "doc-domain-remove", showChrome: false });
    const withState = `\`\`\`slex
{
  namespace: "shared_remove",
  g: { value: 21 },
}
\`\`\`

\`\`\`slex
{
  namespace: "shared_remove",
  layout: {
    "text:value": { $text: "'value:' + String(g.value)" }
  }
}
\`\`\`
`;
    const withoutState = `\`\`\`slex
{
  namespace: "shared_remove",
  layout: {
    "text:value": { $text: "'value:' + String(g.value)" }
  }
}
\`\`\`
`;

    const view = await render(
      React.createElement(
        Streamdown,
        { plugins: { renderers: [renderer] } },
        withState,
      ),
    );

    expect(view.container.textContent).toContain("value:21");

    await view.rerender(
      React.createElement(
        Streamdown,
        { plugins: { renderers: [renderer] } },
        withoutState,
      ),
    );

    expect(view.container.textContent).not.toContain("value:21");
    expect(view.container.textContent).toContain("value:");

    await view.unmount();
  });

  it("keeps identical namespaces isolated across different markdown domains", async () => {
    const markdown = (value: number) => `\`\`\`slex
{
  namespace: "shared",
  g: { value: ${value} },
}
\`\`\`

\`\`\`slex
{
  namespace: "shared",
  layout: {
    "text:value": { $text: "'value:' + g.value" }
  }
}
\`\`\`
`;

    const first = await render(
      React.createElement(
        Streamdown,
        { plugins: { renderers: [createSlexKitRenderer({ domain: "doc-a", showChrome: false })] } },
        markdown(1),
      ),
    );
    const second = await render(
      React.createElement(
        Streamdown,
        { plugins: { renderers: [createSlexKitRenderer({ domain: "doc-b", showChrome: false })] } },
        markdown(2),
      ),
    );

    expect(first.container.textContent).toContain("value:1");
    expect(first.container.textContent).not.toContain("value:2");
    expect(second.container.textContent).toContain("value:2");
    expect(second.container.textContent).not.toContain("value:1");

    await first.unmount();
    await second.unmount();
  });

  it("renders slex fences as Slex sources", async () => {
    const markdown = `\`\`\`slex
${renderedScript("streamdown_slex", "Rendered from Slex")}
\`\`\`
`;

    const view = await render(
      React.createElement(
        Streamdown,
        { plugins: { renderers: [slexkitRenderer] } },
        markdown,
      ),
    );

    expect(view.container.querySelectorAll(".slexkit-root")).toHaveLength(1);
    expect(view.container.textContent).toContain("Rendered from Slex");

    await view.unmount();
  });

  it("does not render removed Slex fence aliases by default", async () => {
    const markdown = ["slex-js", "slexkit", "slexkit-js"]
      .map((language) => `\`\`\`${language}
${renderedScript(`streamdown_removed_alias_${language.replace(/-/g, "_")}`, `Should stay source ${language}`)}
\`\`\``)
      .join("\n\n");

    const view = await render(
      React.createElement(
        Streamdown,
        { plugins: { renderers: [slexkitRenderer] } },
        markdown,
      ),
    );

    expect(view.container.querySelectorAll(".slexkit-root")).toHaveLength(0);
    expect(view.container.textContent).toContain("Should stay source slex-js");
    expect(view.container.textContent).toContain("Should stay source slexkit");
    expect(view.container.textContent).toContain("Should stay source slexkit-js");

    await view.unmount();
  });

  it("renders shorthand component-tree sources without a layout wrapper", async () => {
    const markdown = `\`\`\`slex
{
  "text:message": { text: "Rendered shorthand tree" }
}
\`\`\`
`;

    const view = await render(
      React.createElement(
        Streamdown,
        { plugins: { renderers: [slexkitRenderer] } },
        markdown,
      ),
    );

    expect(view.container.querySelectorAll(".slexkit-root")).toHaveLength(1);
    expect(view.container.textContent).toContain("Rendered shorthand tree");

    await view.unmount();
  });

  it("can render SlexKit fences through the embedded playground mode", async () => {
    const markdown = `\`\`\`slex render="playground" title="Inline playground"
${renderedScript("streamdown_playground", "Rendered in playground")}
\`\`\`
`;

    const view = await render(
      React.createElement(
        Streamdown,
        { plugins: { renderers: [slexkitRenderer] } },
        markdown,
      ),
    );

    expect(view.container.querySelector(".slex-playground")).toBeTruthy();
    expect(view.container.querySelector(".slexkit-root")).toBeTruthy();
    expect(view.container.querySelector(".slex-playground-frame")).toBeNull();
    expect(view.container.querySelector(".slex-playground")?.getAttribute("data-mode")).toBe("render");
    expect(view.container.querySelector(".slex-playground-preview-pane")?.textContent).toContain("Rendered in playground");
    for (const mode of ["code", "live", "render"]) {
      const trigger = view.container.querySelector(`.slex-playground-tabs .slex-tabs-trigger[data-value="${mode}"]`);
      expect(trigger).toBeTruthy();
      expect(trigger?.textContent?.trim()).toBeTruthy();
      expect(trigger?.querySelector("svg")).toBeTruthy();
    }
    expect(view.container.querySelector('.slex-playground-actions .slex-button[aria-label="Open in playground"] svg')).toBeTruthy();
    expect(view.container.querySelector('.slex-playground-actions .slex-button[aria-label="Copy source"] svg')).toBeTruthy();

    await view.unmount();
  });

  it("embeds the shared standalone playground with the current source and renderer version", async () => {
    const markdown = `\`\`\`slex render="playground"
${renderedScript("streamdown_open_web", "Open me")}
\`\`\`
`;

    const view = await render(
      React.createElement(
        Streamdown,
        { plugins: { renderers: [slexkitRenderer] } },
        markdown,
      ),
    );

    const open = mock(() => null);
    Object.defineProperty(window, "open", {
      configurable: true,
      value: open,
    });

    const webButton = view.container.querySelector('.slex-playground-actions .slex-button[aria-label="Open in playground"]') as HTMLButtonElement;
    expect(webButton).toBeTruthy();
    webButton.click();

    expect(open).toHaveBeenCalledTimes(1);
    const opened = new URL(String(open.mock.calls[0]?.[0]), window.location.href);
    expect(opened.pathname).toBe("/playground.html");
    expect(opened.searchParams.get("srcs")).toContain("streamdown_open_web");
    const rootPackage = JSON.parse(await readFile("package.json", "utf-8")) as { version: string };
    expect(opened.searchParams.get("pluginVersion")).toBe(rootPackage.version);
    expect(opened.searchParams.get("mode")).toBe("render");

    await view.unmount();
  });

  it("keeps the embedded playground renderer version synced with the package version", async () => {
    const [rootPackageText, streamdownPackageText, source] = await Promise.all([
      readFile("package.json", "utf-8"),
      readFile("packages/streamdown/package.json", "utf-8"),
      readFile("packages/streamdown/src/index.ts", "utf-8"),
    ]);
    const rootPackage = JSON.parse(rootPackageText) as { version: string };
    const streamdownPackage = JSON.parse(streamdownPackageText) as { version: string };

    expect(streamdownPackage.version).toBe(rootPackage.version);
    expect(source).toContain(`const STREAMDOWN_RENDERER_VERSION = "${rootPackage.version}"`);
  });
});
