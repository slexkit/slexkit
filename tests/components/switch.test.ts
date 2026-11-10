import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("switch custom element", () => {
  it("uses enabled as canonical state while mirroring checked", () => {
    const toggle = mountSlexElement("switch", { enabled: false });
    toggle.enabled = true;
    expect(toggle.enabled).toBe(true);
    expect(toggle.checked).toBe(true);
    expect(toggle.shadowRoot!.querySelector("input")!.checked).toBe(true);
  });

  it("does not toggle when disabled and forwards a user change once", () => {
    const toggle = mountSlexElement("switch", { disabled: true, enabled: false });
    const input = toggle.shadowRoot!.querySelector("input")!;
    input.click(); expect(toggle.enabled).toBe(false);
    toggle.disabled = false;
    let changes = 0; toggle.addEventListener("change", () => changes++);
    input.click();
    expect(toggle.enabled).toBe(true);
    expect(changes).toBe(1);
  });
});
