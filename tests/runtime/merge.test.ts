import { describe, expect, it } from "bun:test";
import { reconcileHtml } from "../../src/html/reconcile";

describe("HTML reconciliation replaces object-tree deep merge", () => {
  it("updates attributes and nested text without interpreting prototype keys", () => {
    const root = document.createElement("div");
    reconcileHtml(root, '<section id="card" data-value="__proto__"><span>old</span></section>');
    const section = root.firstElementChild;
    reconcileHtml(root, '<section id="card" data-value="constructor"><span>new</span></section>');
    expect(root.firstElementChild).toBe(section);
    expect(section?.textContent).toBe("new");
    expect(Reflect.get({}, "polluted")).toBeUndefined();
  });

  it("replaces incompatible keyed element types and removes stale nodes", () => {
    const root = document.createElement("div");
    reconcileHtml(root, '<input id="field"><p id="removed">x</p>');
    const input = root.querySelector("input");
    reconcileHtml(root, '<textarea id="field"></textarea>');
    expect(root.querySelector("textarea")).not.toBe(input);
    expect(root.querySelector("#removed")).toBeNull();
  });
});
