import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("slider custom element", () => {
  it("clamps live values to range constraints", () => {
    const slider = mountSlexElement("slider", { min: 0, max: 10, step: 2, value: 4 });
    slider.value = 99;
    expect(slider.valueAsNumber).toBe(10);
    expect(slider.shadowRoot!.querySelector("input")!.value).toBe("10");
  });

  it("forwards one user change with numeric state", () => {
    const slider = mountSlexElement("slider", { value: 2 });
    let changes = 0; slider.addEventListener("change", () => changes++);
    const input = slider.shadowRoot!.querySelector("input")!;
    input.value = "7";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(slider.value).toBe(7);
    expect(changes).toBe(1);
  });
});
