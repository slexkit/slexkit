import { describe, expect, it } from "bun:test";
import { createSlexKitMarkdownRuntimeHost } from "../../src/html/host";

describe("HTML artifact update preflight", () => {
  it("previews valid HTML without creating a frame or executing source", async () => {
    const container = document.createElement("div"); document.body.replaceChildren(container);
    const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js" });
    (globalThis as { __previewProbe?: number }).__previewProbe = 0;
    await host.updateArtifact("artifact", [{
      artifactId: "artifact", blockId: "view", container,
      source: '<p>Preview</p><script>globalThis.__previewProbe++</script>',
    }], { phase: "preview" });
    expect(container.querySelector("iframe")).toBeNull();
    expect((globalThis as { __previewProbe?: number }).__previewProbe).toBe(0);
    host.disposeAll(); delete (globalThis as { __previewProbe?: number }).__previewProbe;
  });

  it("rejects invalid HTML and duplicate block identities before committing", async () => {
    const first = document.createElement("div"); const second = document.createElement("div");
    const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js" });
    await expect(host.updateArtifact("artifact", [{ blockId: "bad", container: first, source: "<script>if (</script>" }], { phase: "preview" })).rejects.toThrow();
    await expect(host.updateArtifact("artifact", [
      { blockId: "same", container: first, source: "<p>A</p>" },
      { blockId: "same", container: second, source: "<p>B</p>" },
    ], { phase: "preview" })).rejects.toThrow("unique");
    expect(first.querySelector("iframe")).toBeNull(); host.disposeAll();
  });

  it("rejects object sources at the typed runtime boundary", async () => {
    const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js" });
    const container = document.createElement("div");
    await expect(host.updateArtifact("artifact", [{
      blockId: "legacy", container, source: { layout: {} } as unknown as string,
    }], { phase: "preview" })).rejects.toThrow();
    host.disposeAll();
  });
});
