import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("tabs custom element", () => {
  it("switches named slotted panels without replacing their DOM", async () => {
    const one = document.createElement("section"); one.slot = "one"; one.dataset.label = "One";
    const input = document.createElement("input"); input.value = "edited"; one.append(input);
    const two = document.createElement("section"); two.slot = "two"; two.dataset.label = "Two";
    const tabs = mountSlexElement("tabs", { value: "one" }, [one, two]);
    tabs.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
    await Promise.resolve();
    tabs.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]')[0].click();
    expect(tabs.querySelector("input")).toBe(input);
    expect(input.value).toBe("edited");
  });
});
