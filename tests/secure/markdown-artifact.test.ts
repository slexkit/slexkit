import { describe, expect, it } from "bun:test";
import {
  createSlexKitMarkdownRuntimeHost,
  getSlexKitMarkdownRuntimeHost,
  installSlexKitMarkdownRuntimeHost,
} from "../../src/index";
import { attachFrame, nextFrame } from "./html-frame-harness";

describe("HTML Markdown artifact host", () => {
  it("owns block lifecycle and isolates each committed block in a frame", async () => {
    const first = document.createElement("div"); const second = document.createElement("div");
    document.body.replaceChildren(first, second);
    const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js", loadTimeoutMs: 100 });
    const update = host.updateArtifact("doc", [
      { blockId: "first", container: first, source: "<p>First</p>" },
      { blockId: "second", container: second, source: "<p>Second</p>" },
    ], { phase: "commit" });
    const firstHarness = attachFrame(await nextFrame(first));
    await firstHarness.ready(); await firstHarness.respondLatest();
    await Promise.resolve();
    const secondHarness = attachFrame(await nextFrame(second));
    await secondHarness.ready(); await secondHarness.respondLatest(); await update;
    expect(document.querySelectorAll("iframe")).toHaveLength(2);
    expect(firstHarness.posted.find(message => message.kind === "commit")?.source).toBe("<p>First</p>");
    expect(secondHarness.posted.find(message => message.kind === "commit")?.source).toBe("<p>Second</p>");
    host.disposeArtifact("doc");
    await firstHarness.respondLatest("dispose"); await secondHarness.respondLatest("dispose");
    expect(document.querySelectorAll("iframe")).toHaveLength(0);
  });

  it("preview is static, respects block override metadata, and never creates a frame", async () => {
    const container = document.createElement("div");
    const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js", theme: "dark", dir: "ltr" });
    await host.updateArtifact("doc", [{
      artifactId: "doc", blockId: "preview", container,
      theme: "light", dir: "rtl", executionMode: "preview",
      source: '<slex-card title="Preview"></slex-card><script>while(true){}</script>',
    }], { phase: "preview" });
    expect(container.querySelector("iframe")).toBeNull(); host.disposeAll();
  });

  it("rejects state-only/object blocks instead of maintaining a hidden namespace store", async () => {
    const container = document.createElement("div");
    const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js" });
    await expect(host.updateArtifact("doc", [{
      blockId: "legacy", container, source: { g: { value: 1 } } as unknown as string,
    }], { phase: "preview" })).rejects.toThrow();
    expect(() => host.mountBlock({
      blockId: "legacy", container, source: { layout: {} } as unknown as string,
    })).toThrow("must be a string");
    host.disposeAll();
  });

  it("installs a global HTML runtime host for Markdown renderers", () => {
    const host = installSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js" });
    expect(getSlexKitMarkdownRuntimeHost()).toBe(host);
    expect(host.getMode()).toBe("secure");
    host.disposeAll();
  });
});
