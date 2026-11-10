import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("text custom element", () => {
  it("updates visible text and presentation scalars", () => {
    const text = mountSlexElement("text", { content: "Hello", color: "red", size: 18 });
    expect(text.shadowRoot!.textContent).toContain("Hello");
    text.content = "Updated";
    expect(text.shadowRoot!.textContent).toContain("Updated");
    expect(text.color).toBe("red");
  });
});
