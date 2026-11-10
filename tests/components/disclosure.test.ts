import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("disclosure components through custom elements", () => {
  it("collapsible reflects open state and preserves slotted children", () => {
    const child = document.createElement("p");
    child.textContent = "Body";
    const element = mountSlexElement("collapsible", { trigger: "More", open: false }, [child]);
    element.open = true;
    expect(element.open).toBe(true);
    expect(element.querySelector("p")).toBe(child);
  });

  it("accordion accepts live item arrays and emits state changes", () => {
    const element = mountSlexElement("accordion", {
      items: [{ value: "one", label: "One", content: "First" }],
      value: "one",
    });
    expect(element.value).toBe("one");
    expect(element.shadowRoot!.textContent).toContain("One");
  });
});
