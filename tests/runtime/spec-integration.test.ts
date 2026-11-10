import { describe, expect, it } from "bun:test";
import { defineSlexElements, type SlexElement } from "../../src/web-components";

describe("HTML industrial monitor integration", () => {
  it("composes native HTML, custom elements, arrays, and native events", () => {
    defineSlexElements({ window: window as Window & typeof globalThis, cssText: "" });
    const root = document.createElement("main");
    root.innerHTML = '<slex-card title="Monitor"><slex-slider id="level"></slex-slider><slex-switch id="enabled"></slex-switch><slex-table id="sensors"></slex-table><output id="value"></output></slex-card>';
    document.body.replaceChildren(root);
    const slider = root.querySelector<SlexElement>("#level")!; slider.value = 25;
    const toggle = root.querySelector<SlexElement>("#enabled")!; toggle.enabled = true;
    const table = root.querySelector<SlexElement>("#sensors")!;
    table.columns = [{ key: "name", label: "Sensor" }]; table.rows = [{ name: "A" }, { name: "B" }];
    const output = root.querySelector("output")!;
    slider.addEventListener("input", () => { output.value = String(slider.value); });
    slider.dispatchEvent(new Event("input"));
    expect(output.value).toBe("25"); expect(toggle.enabled).toBe(true);
    expect(table.shadowRoot!.querySelectorAll("tbody tr")).toHaveLength(2);
  });
});
