import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("feedback components through custom elements", () => {
  it("progress exposes value semantics", () => {
    const progress = mountSlexElement("progress", { label: "Upload", value: 42 });
    const native = progress.shadowRoot!.querySelector('[role="progressbar"], progress');
    expect(progress.shadowRoot!.textContent).toContain("Upload");
    expect(native).toBeTruthy();
  });

  it("toast emits close while callout projects children only once", () => {
    const toast = mountSlexElement("toast", { title: "Saved", dismissable: true });
    let closed = 0;
    toast.addEventListener("close", () => closed++);
    toast.shadowRoot!.querySelector<HTMLButtonElement>("button")?.click();
    expect(closed).toBe(1);
    const child = document.createElement("span"); child.textContent = "Details";
    const callout = mountSlexElement("callout", { title: "Heads up" }, [child]);
    expect(callout.querySelectorAll("span")).toHaveLength(1);
  });
});
