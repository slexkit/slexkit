import { describe, expect, it } from "bun:test";
import { reconcileHtml } from "../../src/html/reconcile";

describe("HTML document state", () => {
  it("replaces unkeyed layout while retaining keyed visible state", () => {
    const root = document.createElement("div"); reconcileHtml(root, '<input id="name" value="seed"><p>old</p>');
    const input = root.querySelector("input")!; input.value = "dirty";
    reconcileHtml(root, '<input id="name" value="next"><section>new</section>');
    expect(root.querySelector("input")).toBe(input); expect(input.value).toBe("dirty"); expect(root.textContent).toContain("new");
  });

  it("reset reapplies current authored defaults", () => {
    const root = document.createElement("div"); reconcileHtml(root, '<input id="name" value="seed">');
    root.querySelector("input")!.value = "dirty";
    reconcileHtml(root, '<input id="name" value="next">', { reset: true });
    expect(root.querySelector("input")!.value).toBe("next");
  });
});
