import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("content components through custom elements", () => {
  it("renders content properties and native slots", () => {
    const child = document.createElement("strong");
    child.textContent = "slotted";
    const card = mountSlexElement("card", { title: "Summary", tone: "info" }, [child]);
    expect(card.shadowRoot!.textContent).toContain("Summary");
    expect(card.querySelector("strong")).toBe(child);
  });

  it("renders table arrays as text rather than HTML", () => {
    const table = mountSlexElement("table", {
      columns: [{ key: "name", label: "Name" }],
      rows: [{ name: '<img src=x onerror="bad()">' }],
    });
    expect(table.shadowRoot!.querySelector("td")?.textContent).toContain("<img");
    expect(table.shadowRoot!.querySelector("img")).toBeNull();
  });

  it("updates code, formula, badge, section, and callout scalar properties", () => {
    for (const [type, props, expected] of [
      ["code-block", { code: "const x = 1", language: "js" }, "const x = 1"],
      ["formula", { tex: "x^2" }, "x"],
      ["badge", { label: "Ready", tone: "success" }, "Ready"],
      ["section", { title: "Details" }, "Details"],
      ["callout", { title: "Notice", description: "Safe" }, "Notice"],
    ] as const) {
      const node = mountSlexElement(type, props);
      expect(node.shadowRoot!.textContent).toContain(expected);
    }
  });
});
