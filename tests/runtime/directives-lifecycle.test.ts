import { describe, expect, it } from "bun:test";

describe("native structural lifecycle", () => {
  it("uses DOM identity for retained list indices and reorder", () => {
    const root = document.createElement("div");
    const nodes = ["a", "b", "c"].map(value => {
      const node = document.createElement("span"); node.dataset.value = value; return node;
    });
    root.append(...nodes); root.insertBefore(nodes[2], nodes[0]);
    expect(Array.from(root.children)).toEqual([nodes[2], nodes[0], nodes[1]]);
  });

  it("uses AbortController for mount/unmount listener cleanup", () => {
    const button = document.createElement("button"); const controller = new window.AbortController(); let calls = 0;
    button.addEventListener("click", () => calls++, { signal: controller.signal });
    button.click(); controller.abort(); button.click();
    expect(calls).toBe(1);
  });
});
