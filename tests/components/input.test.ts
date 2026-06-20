import { describe, it, expect } from "bun:test";
import { mount } from "../../src/engine/index";
import "../../src/components/index";
import { chooseBalancedColumns, createBalancedTileLayout } from "../../src/components/svelte/layout/balancedTiles";

function sleep(ms = 30) {
  return new Promise((r) => setTimeout(r, ms));
}

function mockVibrate() {
  const calls: Array<number | number[]> = [];
  Object.defineProperty(navigator, "vibrate", {
    value: (pattern: number | number[]) => {
      calls.push(pattern);
      return true;
    },
    configurable: true,
  });
  return calls;
}

function unique(ns = "v014") {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

describe("input component", () => {
  it("emits @change on input event", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("input_change");
    let emitted: unknown = undefined;
    mount(
      {
        namespace: ns,
        g: {
          onChange(x: unknown) { emitted = x; },
        },
        layout: { "input:inp": { onchange: "g.onChange($event)" } },
      },
      document.getElementById("app")!,
    );
    const el = document.querySelector(".slex-input") as HTMLInputElement;
    expect(el).toBeTruthy();
    el.value = "hello";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    expect(emitted).toBe("hello");
  });

  it("$value binding displays initial value and updates reactively", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("input_value");
    const container = document.getElementById("app")!;
    mount({
      namespace: ns,
      g: { text: "init" },
      layout: { "input:inp": { $value: "g.text" } },
    }, container);
    const el = document.querySelector(".slex-input") as HTMLInputElement;
    expect(el.value).toBe("init");
    mount({
      namespace: ns,
      g: { text: "updated" },
      layout: { "input:inp": { $value: "g.text" } },
    }, container);
    await sleep();
    const newEl = document.querySelector(".slex-input") as HTMLInputElement;
    expect(newEl.value).toBe("updated");
  });

  it("renders label, unit, and description around the native input", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("input_decorated");
    mount({
      namespace: ns,
      layout: {
        "input:voltage": {
          label: "Voltage",
          value: "3.3",
          unit: "V",
          description: "Supply rail",
        },
      },
    }, document.getElementById("app")!);

    const field = document.querySelector(".slex-input-field") as HTMLElement;
    const label = document.querySelector(".slex-input-label") as HTMLLabelElement;
    const input = document.querySelector(".slex-input") as HTMLInputElement;
    const unit = document.querySelector(".slex-input-unit") as HTMLElement;
    const description = document.querySelector(".slex-input-description") as HTMLElement;

    expect(field).toBeTruthy();
    expect(label.textContent).toBe("Voltage");
    expect(label.htmlFor).toBe(input.id);
    expect(input.value).toBe("3.3");
    expect(input.getAttribute("aria-label")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBe(description.id);
    expect(unit.textContent).toBe("V");
    expect(description.textContent).toBe("Supply rail");
  });

  it("does not render custom step controls for text, number, or engineering inputs", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount({
      namespace: unique("input_controls_default"),
      layout: {
        "input:name": {
          label: "Name",
          value: "Ada",
        },
        "input:age": {
          label: "Age",
          type: "number",
          value: "42",
          min: 0,
          max: 120,
          step: 1,
        },
        "input:legacy": {
          label: "Legacy controls prop",
          type: "engineering",
          value: "10kΩ",
          controls: true,
        },
      },
    }, document.getElementById("app")!);

    expect(document.querySelector(".slex-input-controls")).toBeNull();
    expect(document.querySelectorAll(".slex-input-step")).toHaveLength(0);
  });

  it("uses placeholder as the accessible-label fallback when no label is present", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount({
      namespace: unique("input_placeholder_label"),
      layout: {
        "input:search": {
          placeholder: "Search docs",
        },
      },
    }, document.getElementById("app")!);

    const input = document.querySelector(".slex-input") as HTMLInputElement;
    expect(document.querySelector(".slex-input-label")).toBeNull();
    expect(input.getAttribute("aria-label")).toBe("Search docs");
  });

  it("links invalid and error text through aria-describedby", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount({
      namespace: unique("input_invalid"),
      layout: {
        "input:voltage": {
          label: "Voltage",
          value: "",
          unit: "V",
          description: "Supply rail",
          error: "Voltage is required",
        },
      },
    }, document.getElementById("app")!);

    const field = document.querySelector(".slex-input-field") as HTMLElement;
    const input = document.querySelector(".slex-input") as HTMLInputElement;
    const description = document.querySelector(".slex-input-description") as HTMLElement;
    const error = document.querySelector(".slex-input-error") as HTMLElement;
    const describedBy = input.getAttribute("aria-describedby") ?? "";
    expect(field.dataset.invalid).toBe("true");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(error.textContent).toBe("Voltage is required");
    expect(error.getAttribute("role")).toBe("alert");
    expect(describedBy.split(/\s+/)).toContain(description.id);
    expect(describedBy.split(/\s+/)).toContain(error.id);
  });

  it("does not emit change from disabled and readonly fields", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const events: unknown[] = [];
    mount({
      namespace: unique("input_non_editable"),
      g: {
        record(value: unknown) { events.push(value); },
      },
      layout: {
        "input:disabled": {
          value: "locked",
          disabled: true,
          onchange: "g.record($event)",
        },
        "input:readonly": {
          value: "fixed",
          readOnly: true,
          onchange: "g.record($event)",
        },
      },
    }, document.getElementById("app")!);

    const [disabledInput, readonlyInput] = Array.from(document.querySelectorAll(".slex-input")) as HTMLInputElement[];
    disabledInput.value = "changed";
    readonlyInput.value = "changed";
    disabledInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    readonlyInput.dispatchEvent(new InputEvent("input", { bubbles: true }));
    expect(events).toEqual([]);
  });

  it("supports engineering input metadata while preserving raw value", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("input_engineering");
    let emitted: unknown = undefined;
    mount({
      namespace: ns,
      g: {
        onChange(value: unknown) { emitted = value; },
      },
      layout: {
        "input:resistance": {
          type: "engineering",
          value: "1kΩ",
          onchange: "g.onChange($event)",
        },
        "text:raw": { $text: "resistance.value" },
        "text:number": { $text: "String(resistance.number)" },
        "text:unit": { $text: "resistance.unit" },
      },
    }, document.getElementById("app")!);

    await sleep();
    const input = document.querySelector(".slex-input") as HTMLInputElement;
    expect(input.type).toBe("text");
    expect(input.inputMode).toBe("decimal");
    expect(input.value).toBe("1kΩ");
    expect(Array.from(document.querySelectorAll(".slex-text")).map((el) => el.textContent)).toEqual(["1kΩ", "1000", "Ω"]);

    input.value = "4.7k";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await sleep();

    expect(emitted).toMatchObject({
      raw: "4.7k",
      number: 4700,
      valid: true,
      prefix: "k",
      unit: "",
    });
    expect(Array.from(document.querySelectorAll(".slex-text")).map((el) => el.textContent)).toEqual(["4.7k", "4700", ""]);
  });

  it("emits invalid engineering metadata", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    let emitted: unknown = undefined;
    mount({
      namespace: unique("input_engineering_invalid"),
      g: {
        onChange(value: unknown) { emitted = value; },
      },
      layout: {
        "input:resistance": {
          type: "engineering",
          value: "1k",
          error: "Use a numeric engineering value",
          onchange: "g.onChange($event)",
        },
        "text:valid": { $text: "String(resistance.valid)" },
        "text:error": { $text: "resistance.error" },
      },
    }, document.getElementById("app")!);

    const input = document.querySelector(".slex-input") as HTMLInputElement;
    input.value = "nope";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await sleep();

    expect(emitted).toMatchObject({
      raw: "nope",
      number: null,
      valid: false,
      error: "invalid_number",
    });
    expect(Array.from(document.querySelectorAll(".slex-text")).map((el) => el.textContent)).toEqual(["false", "invalid_number"]);
  });

  it("ignores legacy engineering controls props", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount({
      namespace: unique("input_engineering_controls"),
      layout: {
        "input:resistance": {
          type: "engineering",
          value: "1kΩ",
          unit: "Ω",
          step: 100,
          controls: true,
        },
        "text:number": { $text: "String(resistance.number)" },
        "text:unit": { $text: "resistance.unit" },
      },
    }, document.getElementById("app")!);

    const input = document.querySelector(".slex-input") as HTMLInputElement;
    const [increment] = Array.from(document.querySelectorAll(".slex-input-step")) as HTMLButtonElement[];
    expect(input.value).toBe("1kΩ");
    expect(increment).toBeUndefined();
    expect(Array.from(document.querySelectorAll(".slex-text")).map((el) => el.textContent)).toEqual(["1000", "Ω"]);
  });

  it("keeps native input chrome off while preserving a visible input focus ring", async () => {
    const css = await Bun.file("src/styles/components/text-input.css").text();

    expect(css).toContain("-webkit-appearance: none;");
    expect(css).toContain("appearance: none;");
    expect(css).toContain(".slexkit-root .slex-input-control input.slex-input");
    expect(css).toContain('min-height: 2.5625rem;');
    expect(css).toContain("background-clip: padding-box;");
    expect(css).toContain(".slex-input:focus");
    expect(css).toContain("box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 18%, transparent);");
    expect(css).toContain('.slex-input-control[data-has-unit="true"] .slex-input:focus');
    expect(css).toContain(".slex-input-control:not([data-has-unit]):focus-within");
    expect(css).toContain("box-shadow: none;");
  });

});
