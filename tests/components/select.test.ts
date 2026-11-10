import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("select custom element", () => {
  it("uses a live options array and forwards selection changes", async () => {
    const element = mountSlexElement("select", {
      label: "Priority", value: "a",
      options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }],
    });
    let changes = 0; element.addEventListener("change", () => changes++);
    element.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    await Promise.resolve();
    element.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]')[1].click();
    await Promise.resolve();
    expect(element.value).toBe("b");
    expect(changes).toBe(1);
  });

  it("keeps a required placeholder invalid in the native form control", () => {
    const element = mountSlexElement("select", { required: true, placeholder: "Choose", options: [] });
    expect(element.shadowRoot!.querySelector("select")?.required).toBe(true);
  });
});
