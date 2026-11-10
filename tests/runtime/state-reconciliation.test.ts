import { describe, expect, it } from "bun:test";
import { captureControlSnapshot, reconcileHtml, restoreControlSnapshot } from "../../src/html/reconcile";

describe("visible HTML state reconciliation", () => {
  it("preserves dirty values while applying unrelated defaults", () => {
    const root = document.createElement("div");
    reconcileHtml(root, '<input id="name" value="alpha"><input id="untouched" value="one">');
    const dirty = root.querySelector<HTMLInputElement>("#name")!; dirty.value = "edited";
    reconcileHtml(root, '<input id="name" value="beta"><input id="untouched" value="two">');
    expect(root.querySelector<HTMLInputElement>("#name")).toBe(dirty);
    expect(dirty.value).toBe("edited");
    expect(root.querySelector<HTMLInputElement>("#untouched")!.value).toBe("two");
  });

  it("captures and restores keyed visible state without accessors or functions", () => {
    const root = document.createElement("div");
    root.innerHTML = '<input id="name" value="seed"><input id="check" type="checkbox">';
    root.querySelector<HTMLInputElement>("#name")!.value = "runtime";
    root.querySelector<HTMLInputElement>("#check")!.checked = true;
    const snapshot = captureControlSnapshot(root);
    root.querySelector<HTMLInputElement>("#name")!.value = "changed";
    restoreControlSnapshot(root, snapshot);
    expect(root.querySelector<HTMLInputElement>("#name")!.value).toBe("runtime");
    expect(root.querySelector<HTMLInputElement>("#check")!.checked).toBe(true);
  });
});
