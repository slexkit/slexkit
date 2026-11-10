import { describe, expect, it } from "bun:test";
import { reconcileHtml } from "../../src/html/reconcile";

function list(items: readonly string[]): string {
  return items.map(item => `<label data-key="${item}"><input value="${item}">${item}</label>`).join("");
}

describe("native keyed list reconciliation", () => {
  it("adds, removes, reorders, and updates keyed items without wrappers", () => {
    const root = document.createElement("div"); reconcileHtml(root, list(["a", "b", "c"]));
    const a = root.querySelector('[data-key="a"]'); const c = root.querySelector('[data-key="c"]');
    reconcileHtml(root, list(["c", "a", "d"]));
    expect(root.children).toHaveLength(3);
    expect(root.children[0]).toBe(c); expect(root.children[1]).toBe(a);
    expect(root.querySelector('[data-key="b"]')).toBeNull();
  });

  it("retains focused dirty controls across sibling changes", () => {
    const root = document.createElement("div"); document.body.replaceChildren(root);
    reconcileHtml(root, list(["a", "b"]));
    const input = root.querySelector<HTMLInputElement>('[data-key="b"] input')!;
    input.value = "dirty"; input.focus();
    reconcileHtml(root, list(["x", "a", "b"]));
    expect(root.querySelector('[data-key="b"] input')).toBe(input);
    expect(input.value).toBe("dirty"); expect(document.activeElement).toBe(input);
  });
});
