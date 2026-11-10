import { describe, expect, it } from "bun:test";
import { mount } from "../../src/html/host";
import { attachFrame } from "./html-frame-harness";

describe("isolated HTML sandbox frame", () => {
  it("uses an opaque-origin script sandbox and never embeds generated source in srcdoc", async () => {
    const container = document.createElement("div"); document.body.replaceChildren(container);
    const source = '<p>Safe</p><script>globalThis.__hostProbe=1</script>';
    const handle = mount(source, container, { runtimeUrl: "/runtime.js", loadTimeoutMs: 100 });
    const frame = container.querySelector("iframe")!; const harness = attachFrame(frame);
    expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
    expect(frame.getAttribute("sandbox")).not.toContain("allow-same-origin");
    expect(frame.srcdoc).not.toContain(source);
    expect((globalThis as { __hostProbe?: number }).__hostProbe).toBeUndefined();
    await harness.ready(); const commit = await harness.respondLatest(); await handle.ready;
    expect(commit.source).toBe(source);
    handle(); await harness.respondLatest("dispose");
  });

  it("passes theme, direction, policy, and exact asset configuration through bootstrap data", () => {
    const container = document.createElement("div"); document.body.replaceChildren(container); document.documentElement.classList.add("dark");
    const handle = mount("<p>Theme</p>", container, {
      runtimeUrl: "/runtime.js", styleUrl: false, dir: "rtl", policy: { timer: { enabled: false, maxTimers: 0, minIntervalMs: 0 } },
    });
    const frame = container.querySelector("iframe")!; const harness = attachFrame(frame);
    const options = harness.bootstrap.options as Record<string, unknown>;
    expect(options.dir).toBe("rtl"); expect(options.styleUrl).toBe(false);
    expect(frame.srcdoc).toContain("Content-Security-Policy");
    handle(); document.documentElement.classList.remove("dark");
    void handle.ready.catch(() => {});
  });

  it("fails closed for invalid runtime URLs and rejects object sources", () => {
    const container = document.createElement("div");
    expect(() => mount("<p>x</p>", container, { runtimeUrl: "http://[" })).toThrow("URL is invalid");
    expect(() => mount({ layout: {} } as unknown as string, container, { runtimeUrl: "/runtime.js" }))
      .toThrow("must be a string");
  });
});
