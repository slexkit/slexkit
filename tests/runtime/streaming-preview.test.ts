import { describe, expect, it, mock, spyOn } from "bun:test";
import { disposeNamespace, mount } from "../../src/runtime";
import "../../src/components/index";

async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("Slex streaming preview execution", () => {
  it("renders preview UI without executing write handlers, then restores live execution", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const namespace = `streaming_preview_${Date.now()}`;
    const source = {
      namespace,
      g: { count: 0 },
      layout: {
        "button:add": { label: "Add", onclick: "g.count++" },
        "text:value": { $text: "'count:' + String(g.count)" },
      },
    };

    let cleanup = mount(source, container, { executionMode: "preview" });
    await flush();
    expect(container.textContent).toContain("count:0");
    (container.querySelector(".slex-button") as HTMLButtonElement).click();
    await flush();
    expect(container.textContent).toContain("count:0");
    cleanup();
    disposeNamespace(namespace);

    cleanup = mount(source, container, { executionMode: "live" });
    await flush();
    (container.querySelector(".slex-button") as HTMLButtonElement).click();
    await flush();
    expect(container.textContent).toContain("count:1");
    cleanup();
    disposeNamespace(namespace);
  });

  it("does not call lifecycle hooks or api capabilities in preview mode", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const namespace = `streaming_preview_hooks_${Date.now()}`;
    const calls: string[] = [];
    const apiFetch = mock(() => "loaded");
    const source = {
      namespace,
      g: {
        onMount_message() { calls.push("mount"); },
        onUnmount_message() { calls.push("unmount"); },
      },
      layout: {
        "text:message": { $text: "api.fetch('/status') || 'fallback'" },
      },
    };

    const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});
    const cleanup = mount(source, container, {
      api: { fetch: apiFetch },
      executionMode: "preview",
    });
    await flush();
    expect(calls).toEqual([]);
    expect(apiFetch).not.toHaveBeenCalled();
    expect(container.querySelector(".slexkit-root")?.getAttribute("data-execution-mode")).toBe("preview");
    cleanup();
    disposeNamespace(namespace);
    expect(calls).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
