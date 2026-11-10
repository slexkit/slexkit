import { describe, expect, it } from "bun:test";
import type { SlexElement } from "../../src/web-components";
import { mountSlexElement } from "../helpers";

describe("choice controls through custom elements", () => {
  it("checkbox exposes native state and one facade change", () => {
    const element = mountSlexElement("checkbox", { label: "Approve", checked: false });
    let changes = 0;
    element.addEventListener("change", () => changes++);
    const input = element.shadowRoot!.querySelector("input")!;
    input.checked = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(element.checked).toBe(true);
    expect(changes).toBe(1);
  });

  it("radio-group uses array properties and skips disabled options", async () => {
    const element = mountSlexElement("radio-group", {
      value: "a",
      options: [
        { value: "a", label: "Alpha" },
        { value: "b", label: "Beta", disabled: true },
        { value: "c", label: "Gamma" },
      ],
    });
    const radios = element.shadowRoot!.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    radios[1].click();
    expect(element.value).toBe("a");
    radios[2].click();
    await Promise.resolve();
    expect(element.value).toBe("c");
  });
});
