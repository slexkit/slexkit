import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("component state through native properties", () => {
  it("reads and writes named controls directly without generated proxies", () => {
    const input = mountSlexElement("input", { value: "12", type: "engineering" });
    const slider = document.createElement("slex-slider") as typeof input;
    Object.assign(slider, { value: 4, min: 0, max: 10 }); document.body.append(slider);
    expect(input.valueAsNumber).toBe(12); expect(slider.value).toBe(4);
    input.value = "2k"; slider.value = 7;
    expect(input.valueAsNumber).toBe(2000); expect(slider.value).toBe(7);
  });

  it("keeps checkbox and switch state contracts distinct", () => {
    const checkbox = mountSlexElement("checkbox", { checked: true });
    const toggle = document.createElement("slex-switch") as typeof checkbox;
    toggle.enabled = false; document.body.append(toggle);
    expect(checkbox.checked).toBe(true); expect(toggle.enabled).toBe(false);
    toggle.enabled = true; expect(toggle.checked).toBe(true);
  });

  it("does not publish duplicate-name or $for component-state semantics", () => {
    const input = mountSlexElement("input", { value: "a" });
    const other = document.createElement("slex-input") as typeof input; other.value = "b"; document.body.append(other);
    expect(input.value).toBe("a"); expect(other.value).toBe("b");
  });
});
