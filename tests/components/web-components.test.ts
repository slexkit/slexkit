import { afterEach, describe, expect, it } from "bun:test";
import {
  defineSlexElements,
  describeSlexElements,
  type SlexElement,
} from "../../src/web-components";

const owner = window as Window & typeof globalThis;
defineSlexElements({ window: owner, cssText: "" });
afterEach(async () => {
  document.body.replaceChildren();
  await Promise.resolve();
});

describe("HTML/JavaScript component entry", () => {
  it("renders explicit text and label properties when no child text is present", () => {
    document.body.innerHTML = '<slex-card><slex-text text="Hello"></slex-text><slex-badge text="Ready"></slex-badge><slex-button label="Go"></slex-button></slex-card>';
    for (const [tag, expected] of [["slex-text", "Hello"], ["slex-badge", "Ready"], ["slex-button", "Go"]]) {
      expect(document.querySelector(tag)!.shadowRoot!.textContent).toContain(expected);
    }
    document.body.innerHTML = '<slex-text>Child content</slex-text>';
    expect(document.querySelector("slex-text")!.shadowRoot!.textContent).toContain("Child content");
  });
  it("uses the built-in Uno theme when the host has no complete palette", () => {
    document.body.innerHTML = '<slex-card title="Card"></slex-card>';
    const root = document.querySelector("slex-card")!.shadowRoot!.querySelector(".slexkit-root")!;
    expect(root.classList.contains("slexkit-theme-uno")).toBe(true);
    expect(root.classList.contains("slexkit-theme-host-shadcn")).toBe(false);
  });

  it("uses native options and emits a single selected value", async () => {
    document.body.innerHTML = '<slex-select label="Mode"><option value="a">Alpha</option><option value="b">Beta</option></slex-select>';
    const element = document.querySelector("slex-select") as SlexElement;
    expect(element.value).toBe("a");
    let changes = 0;
    element.addEventListener("change", () => changes++);
    element.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();
    await Promise.resolve();
    const options = element.shadowRoot!.querySelectorAll<HTMLElement>('[role="option"]');
    expect(options).toHaveLength(2);
    options[1].click();
    await Promise.resolve();
    expect(element.value).toBe("b");
    expect(changes).toBe(1);
  });

  it("projects named tab panels and keeps their light-DOM input instances", async () => {
    document.body.innerHTML = '<slex-tabs><section slot="one" aria-label="One"><input value="first"></section><section slot="two" aria-label="Two"><p>Second</p></section></slex-tabs>';
    const element = document.querySelector("slex-tabs") as SlexElement;
    const input = element.querySelector("input")!;
    input.value = "edited";
    expect(element.value).toBe("one");
    expect(element.shadowRoot!.querySelector("slot")!.name).toBe("one");
    element.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]')[1].click();
    await Promise.resolve();
    expect(element.value).toBe("two");
    element.shadowRoot!.querySelectorAll<HTMLButtonElement>('[role="tab"]')[0].click();
    await Promise.resolve();
    expect(element.querySelector("input")).toBe(input);
    expect(input.value).toBe("edited");
  });
  it("retains a typed engineering input across unrelated updates and reconnection", async () => {
    document.body.innerHTML =
      '<slex-input type="engineering" value="12" label="Voltage"></slex-input>';
    const element = document.querySelector("slex-input") as SlexElement;
    const input = element.shadowRoot!.querySelector("input")!;
    input.value = "2.2k";
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    expect(element.value).toBe("2.2k");
    expect(element.valueAsNumber).toBe(2200);
    element.label = "Updated";
    expect(element.shadowRoot!.querySelector("input")).toBe(input);
    expect(input.value).toBe("2.2k");
    element.remove();
    await Promise.resolve();
    document.body.append(element);
    expect(element.value).toBe("2.2k");
    expect(element.shadowRoot!.querySelector("input")!.value).toBe("2.2k");
  });

  it("delivers a single change event and uses boolean attribute presence", () => {
    document.body.innerHTML = '<slex-checkbox disabled="false" checked></slex-checkbox>';
    const element = document.querySelector("slex-checkbox") as SlexElement;
    expect(element.disabled).toBe(true);
    element.removeAttribute("disabled");
    let changes = 0;
    element.addEventListener("change", () => changes++);
    const input = element.shadowRoot!.querySelector("input")!;
    input.checked = false;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(element.checked).toBe(false);
    expect(changes).toBe(1);
  });

  it("keeps HTML children in the light DOM and accepts data without parsing strings", () => {
    document.body.innerHTML =
      '<slex-card title="Card"><p>Plain HTML</p><slex-table></slex-table></slex-card>';
    const card = document.querySelector("slex-card")!;
    expect(card.querySelector("p")?.textContent).toBe("Plain HTML");
    expect(card.shadowRoot!.querySelector("slot")?.assignedElements().length).toBe(2);
    const table = card.querySelector("slex-table") as SlexElement;
    table.columns = [{ key: "name", label: "Name" }];
    table.rows = [{ name: '<script>throw new Error("never run")</script>' }];
    expect(table.shadowRoot!.querySelector("td")?.textContent).toContain("<script>");
    expect(table.shadowRoot!.querySelector("script")).toBeNull();
  });

  it("publishes only implemented properties and no expression language", () => {
    expect(describeSlexElements()).toHaveLength(28);
    const input = describeSlexElements().find((item) => item.tagName === "slex-input")!;
    expect(input.properties.find((item) => item.name === "readOnly")?.attribute).toBe("readonly");
    const table = describeSlexElements().find((item) => item.tagName === "slex-table")!;
    expect(table.properties.every((item) => item.attribute === undefined)).toBe(true);
  });

  it("resets removed defaults consistently and synchronizes switch aliases", () => {
    document.body.innerHTML =
      '<slex-input value="initial"></slex-input><slex-switch checked></slex-switch>';
    const input = document.querySelector("slex-input") as SlexElement;
    input.removeAttribute("value");
    expect(input.value).toBe("");
    expect(input.shadowRoot!.querySelector("input")!.value).toBe("");
    const toggle = document.querySelector("slex-switch") as SlexElement;
    toggle.enabled = false;
    expect(toggle.checked).toBe(false);
    expect(toggle.shadowRoot!.querySelector("input")!.checked).toBe(false);
  });

  it("registers per window and rejects unsupported names before partial registration", () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const other = frame.contentWindow as Window & typeof globalThis;
    expect(() =>
      defineSlexElements({ window: other, components: ["input", "unsupported" as "card"] }),
    ).toThrow("Unknown Slex element");
    expect(other.customElements.get("slex-input")).toBeUndefined();
    other.customElements.define("slex-input", class extends other.HTMLElement {});
    expect(() => defineSlexElements({ window: other, components: ["input"] })).toThrow(
      "already registered",
    );
  });

  it("uses browser range constraints for property writes", () => {
    document.body.innerHTML = '<slex-slider min="0" max="10" step="2" value="4"></slex-slider>';
    const slider = document.querySelector("slex-slider") as SlexElement;
    slider.value = 99;
    expect(slider.valueAsNumber).toBe(10);
    expect(slider.shadowRoot!.querySelector("input")!.value).toBe("10");
  });
});
