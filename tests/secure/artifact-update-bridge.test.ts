import { describe, expect, it } from "bun:test";
import { createSlexKitMarkdownRuntimeHost } from "../../src/html/host";
import { attachFrame, nextFrame } from "./html-frame-harness";

describe("revisioned HTML artifact bridge", () => {
  it("moves an initial readiness waiter to the current browsing context after reload", async () => {
    const container = document.createElement("div"); document.body.replaceChildren(container);
    const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js", loadTimeoutMs: 100 });
    const pending = host.updateArtifact("initial-reload", [{ blockId: "view", container, source: "<p>Ready</p>" }], { phase: "commit" });
    const harness = attachFrame(await nextFrame(container));
    harness.reload();
    await harness.ready();
    const request = await harness.respondLatest();
    await pending;
    expect(request.epoch).toBe(2);
    host.disposeAll(); await harness.respondLatest("dispose");
  });
  it("releases a newly created controller when its first commit fails", async () => {
    const container = document.createElement("div"); document.body.replaceChildren(container);
    const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js", loadTimeoutMs: 100 });
    const pending = host.updateArtifact("failure", [{ blockId: "view", container, source: '<script>throw Error("expected")</script>' }], { phase: "commit" });
    const rejection = pending.then(() => { throw new Error("Commit unexpectedly succeeded"); }, error => error);
    const harness = attachFrame(await nextFrame(container));
    await harness.ready();
    for (let index = 0; index < 20 && !harness.posted.some(message => message.kind === "commit"); index++) await Promise.resolve();
    const request = harness.posted.findLast(message => message.kind === "commit")!;
    harness.send({ channel: "slexkit-html-v1", token: harness.token, kind: "result", requestId: request.requestId, revision: request.revision, ok: false, error: { name: "Error", message: "expected" } });
    expect((await rejection).message).toContain("expected");
    await harness.respondLatest("dispose");
    for (let index = 0; index < 10 && container.querySelector("iframe"); index++) await Promise.resolve();
    expect(container.querySelector("iframe")).toBeNull();
    host.disposeAll();
  });
  it("sends raw HTML only to the isolated frame and reuses it for a stable block", async () => {
    const container = document.createElement("div"); document.body.replaceChildren(container);
    const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js", loadTimeoutMs: 100 });
    const firstSource = '<slex-input id="value" value="one"></slex-input>';
    const first = host.updateArtifact("artifact", [{ blockId: "view", container, source: firstSource }], { phase: "commit" });
    const frame = await nextFrame(container); const harness = attachFrame(frame);
    await harness.ready(); const firstCommit = await harness.respondLatest(); await first;
    expect(firstCommit.source).toBe(firstSource);
    expect(container.textContent).not.toContain("one");

    const secondSource = '<slex-input id="value" value="two"></slex-input>';
    const second = host.updateArtifact("artifact", [{ blockId: "view", container, source: secondSource }], { phase: "commit" });
    const secondCommit = await harness.respondLatest(); await second;
    expect(container.querySelector("iframe")).toBe(frame);
    expect(secondCommit.revision).toBe(2); expect(secondCommit.source).toBe(secondSource);
    host.disposeAll(); await harness.respondLatest("dispose");
  });

  it("ignores wrong-token and stale acknowledgements", async () => {
    const container = document.createElement("div"); document.body.replaceChildren(container);
    const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js", loadTimeoutMs: 100 });
    const pending = host.updateArtifact("artifact", [{ blockId: "view", container, source: "<p>One</p>" }], { phase: "commit" });
    const frame = await nextFrame(container); const harness = attachFrame(frame); await harness.ready();
    const request = harness.posted.findLast(message => message.kind === "commit")!;
    harness.send({ channel: "slexkit-html-v1", token: "wrong", kind: "result", requestId: request.requestId, revision: request.revision, ok: true });
    let settled = false; void pending.then(() => { settled = true; }); await Promise.resolve(); expect(settled).toBe(false);
    await harness.respondLatest(); await pending; host.disposeAll(); await harness.respondLatest("dispose");
  });

  it("preview validates without posting or replacing a committed frame", async () => {
    const container = document.createElement("div");
    const host = createSlexKitMarkdownRuntimeHost({ runtimeUrl: "/runtime.js" });
    await host.updateArtifact("artifact", [{ blockId: "view", container, source: "<p>Preview</p>" }], { phase: "preview" });
    expect(container.querySelector("iframe")).toBeNull();
    await expect(host.updateArtifact("artifact", [{ blockId: "view", container, source: "<script>if (</script>" }], { phase: "preview" })).rejects.toThrow();
    expect(container.querySelector("iframe")).toBeNull(); host.disposeAll();
  });
});
