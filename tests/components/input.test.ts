import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("input custom element", () => {
  it("forwards native input state and change semantics", () => {
    const element = mountSlexElement("input", { label: "Voltage", unit: "V", value: "12" });
    let inputs = 0;
    element.addEventListener("input", () => inputs++);
    const native = element.shadowRoot!.querySelector("input")!;
    native.value = "13";
    native.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    expect(element.value).toBe("13");
    expect(inputs).toBe(1);
    expect(element.shadowRoot!.textContent).toContain("Voltage");
  });

  it("preserves raw engineering text and exposes parsed numeric value", () => {
    const element = mountSlexElement("input", { type: "engineering", value: "4.7k" });
    expect(element.value).toBe("4.7k");
    expect(element.valueAsNumber).toBe(4700);
    element.value = "bad";
    expect(Number.isNaN(element.valueAsNumber)).toBe(true);
  });

  it("honors disabled, readonly, required, placeholder, and error properties", () => {
    const element = mountSlexElement("input", {
      disabled: true, readOnly: true, required: true, placeholder: "Name", invalid: true, error: "Required",
    });
    const native = element.shadowRoot!.querySelector("input")!;
    expect(native.disabled).toBe(true);
    expect(native.readOnly).toBe(true);
    expect(native.required).toBe(true);
    expect(native.getAttribute("aria-describedby")).toBeTruthy();
  });
});
