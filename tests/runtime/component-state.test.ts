import { describe, expect, it, spyOn } from "bun:test";
import { mount } from "../../src/engine/index";
import "../../src/components/index";

function sleep(ms = 30) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function unique(ns = "component_state") {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

describe("component instance state", () => {
  it("exposes named input values to dynamic expressions", async () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount({
      namespace: unique("input_read"),
      g: {},
      layout: {
        "input:vin": { type: "number", value: 12 },
        "text:echo": { $text: "String(vin.value)" },
      },
    }, document.getElementById("app")!);

    await sleep();

    expect(document.querySelector(".slex-text")?.textContent).toBe("12");
  });

  it("updates derived output when a named input changes", async () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount({
      namespace: unique("input_update"),
      g: {},
      layout: {
        "input:vin": { type: "number", value: 12 },
        "text:echo": { $text: "'vin:' + vin.value" },
      },
    }, document.getElementById("app")!);

    const input = document.querySelector(".slex-input") as HTMLInputElement;
    input.value = "24";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep();

    expect(document.querySelector(".slex-text")?.textContent).toBe("vin:24");
  });

  it("lets expressions read named inputs declared later in the layout", async () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount({
      namespace: unique("input_order"),
      g: {},
      layout: {
        "text:echo": { $text: "'vin:' + vin.value" },
        "input:vin": { type: "number", value: 12 },
      },
    }, document.getElementById("app")!);

    await sleep();
    expect(document.querySelector(".slex-text")?.textContent).toBe("vin:12");

    const input = document.querySelector(".slex-input") as HTMLInputElement;
    input.value = "24";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep();

    expect(document.querySelector(".slex-text")?.textContent).toBe("vin:24");
  });

  it("pre-registers named inputs nested inside later child layouts", async () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount({
      namespace: unique("nested_input_order"),
      g: {},
      layout: {
        "text:echo": { $text: "'vin:' + vin.value" },
        "column:controls": {
          "input:vin": { type: "number", value: 12 },
        },
      },
    }, document.getElementById("app")!);

    await sleep();

    expect(document.querySelector(".slex-text")?.textContent).toBe("vin:12");
  });

  it("lets g methods read and write writable component state through this", async () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount({
      namespace: unique("g_this"),
      g: {
        number(value: unknown) {
          const n = Number(value);
          return Number.isFinite(n) ? n : 0;
        },
        doubled() {
          return this.number(this.vin.value) * 2;
        },
        reset() {
          this.vin.value = 7;
        },
      },
      layout: {
        "input:vin": { type: "number", value: 3 },
        "text:result": { $text: "String(g.doubled())" },
        "button:reset": { label: "Reset", onclick: "g.reset()" },
      },
    }, document.getElementById("app")!);

    const button = document.querySelector(".slex-button") as HTMLButtonElement;
    button.click();
    await sleep();

    expect((document.querySelector(".slex-input") as HTMLInputElement).value).toBe("7");
    expect(document.querySelector(".slex-text")?.textContent).toBe("14");
  });

  it("updates public component proxy permissions when a component name changes type", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("type_change");
    const app = document.getElementById("app")!;
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: ns,
      g: {},
      layout: {
        "stat:x": { label: "X", value: 1 },
        "button:tryWrite": { label: "Try", onclick: "x.value = 2" },
      },
    }, app);

    (document.querySelector(".slex-button") as HTMLButtonElement).click();
    await sleep();

    mount({
      namespace: ns,
      g: {},
      layout: {
        "input:x": { value: 1 },
        "text:echo": { $text: "String(x.value)" },
        "button:set": { label: "Set", onclick: "x.value = 3" },
      },
    }, app);

    await sleep();
    (document.querySelector(".slex-button") as HTMLButtonElement).click();
    await sleep();

    expect((document.querySelector(".slex-input") as HTMLInputElement).value).toBe("3");
    expect(document.querySelector(".slex-text")?.textContent).toBe("3");
    warnSpy.mockRestore();
  });

  it("warns when a layout declares the same component state name with different types", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: unique("duplicate_type"),
      g: {},
      layout: {
        "input:x": { value: 1 },
        "stat:x": { label: "X", value: 2 },
      },
    }, document.getElementById("app")!);

    await sleep();

    expect(document.querySelector(".slex-input")).toBeTruthy();
    expect(document.querySelector(".slex-stat")).toBeTruthy();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("declared more than once"));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("multiple component types"));
    warnSpy.mockRestore();
  });

  it("warns when a named writable value component is rendered with $for", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: unique("for_state"),
      g: { items: [1, 2] },
      layout: {
        "input:item": {
          $for: "g.items",
          $key: "$value",
          value: "seed",
        },
      },
    }, document.getElementById("app")!);

    await sleep();

    expect(document.querySelectorAll(".slex-input").length).toBe(2);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("used with $for"));
    warnSpy.mockRestore();
  });

  it("warns when a named writable checked component is rendered with $for", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: unique("for_checked_state"),
      g: { items: [{ id: "a" }, { id: "b" }] },
      layout: {
        "checkbox:item": {
          $for: "g.items",
          $key: "id",
          checked: false,
          label: "Item",
        },
      },
    }, document.getElementById("app")!);

    await sleep();

    expect(document.querySelectorAll(".slex-checkbox").length).toBe(2);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("used with $for"));
    warnSpy.mockRestore();
  });

  it("does not warn when a named readable text component is rendered with $for", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: unique("for_text_readable"),
      g: { items: ["a", "b"] },
      layout: {
        "text:item": {
          $for: "g.items",
          $key: "$value",
          $text: "$item",
        },
      },
    }, document.getElementById("app")!);

    await sleep();

    expect(Array.from(document.querySelectorAll(".slex-text")).map((el) => el.textContent)).toEqual(["a", "b"]);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("does not warn when a named readable stat component is rendered with $for", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: unique("for_stat_readable"),
      g: {
        sensors: [
          { id: "a", label: "A", value: 1 },
          { id: "b", label: "B", value: 2 },
        ],
      },
      layout: {
        "stat:sensor": {
          $for: "g.sensors",
          $key: "id",
          $label: "sensor.label",
          $value: "sensor.value",
        },
      },
    }, document.getElementById("app")!);

    await sleep();

    expect(document.querySelectorAll(".slex-stat").length).toBe(2);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("keeps duplicate component names backed by the same namespace state", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: unique("duplicate_same_type"),
      g: {},
      layout: {
        "column:left": {
          "input:x": { value: 1 },
        },
        "column:right": {
          "input:x": { value: 2 },
        },
        "text:echo": { $text: "String(x.value)" },
      },
    }, document.getElementById("app")!);

    await sleep();
    expect(document.querySelector(".slex-text")?.textContent).toBe("1");

    const input = document.querySelector(".slex-input") as HTMLInputElement;
    input.value = "9";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep();

    expect(document.querySelector(".slex-text")?.textContent).toBe("9");
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("declared more than once"));
    warnSpy.mockRestore();
  });

  it("does not warn for mirrored input and slider controls bound to the same g field", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: unique("mirrored_controls"),
      g: { value: 4 },
      layout: {
        "column:field": {
          "input:value": { $value: "g.value", onchange: "g.value = Number($event || 0)" },
          "slider:value": { $value: "g.value", min: 0, max: 10, onchange: "g.value = Number($event)" },
        },
        "text:echo": { $text: "String(g.value)" },
      },
    }, document.getElementById("app")!);

    await sleep();

    expect(document.querySelector(".slex-text")?.textContent).toBe("4");
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("keeps legacy $value plus onchange bindings working", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("legacy");

    mount({
      namespace: ns,
      g: { text: "init" },
      layout: {
        "input:name": { $value: "g.text", onchange: "g.text = $event" },
        "text:echo": { $text: "g.text" },
      },
    }, document.getElementById("app")!);

    const input = document.querySelector(".slex-input") as HTMLInputElement;
    expect(input.value).toBe("init");
    input.value = "updated";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep();

    expect(input.value).toBe("updated");
    expect(document.querySelector(".slex-text")?.textContent).toBe("updated");
  });

  it("keeps controlled input state coherent across user edits and dynamic $value updates", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("dynamic_value_competition");
    const app = document.getElementById("app")!;

    mount({
      namespace: ns,
      g: { text: "init" },
      layout: {
        "input:name": { $value: "g.text", onchange: "g.text = $event" },
        "text:echo": { $text: "name.value + '/' + g.text" },
      },
    }, app);

    const input = document.querySelector(".slex-input") as HTMLInputElement;
    input.value = "typed";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep();
    expect(document.querySelector(".slex-text")?.textContent).toBe("typed/typed");

    mount({
      namespace: ns,
      g: { text: "external" },
      layout: {
        "input:name": { $value: "g.text", onchange: "g.text = $event" },
        "text:echo": { $text: "name.value + '/' + g.text" },
      },
    }, app);

    await sleep();
    expect((document.querySelector(".slex-input") as HTMLInputElement).value).toBe("external");
    expect(document.querySelector(".slex-text")?.textContent).toBe("external/external");
  });

  it("refreshes engineering metadata when an existing named input changes type", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("input_type_transition");
    const app = document.getElementById("app")!;

    mount({
      namespace: ns,
      g: {},
      layout: {
        "input:x": { value: "5" },
        "text:state": { $text: "x.value + '/' + String(x.valid)" },
      },
    }, app);

    await sleep();
    expect(document.querySelector(".slex-text")?.textContent).toBe("5/undefined");

    mount({
      namespace: ns,
      g: {},
      layout: {
        "input:x": { type: "engineering", value: "4.7k" },
        "text:state": { $text: "x.value + '/' + String(x.number) + '/' + String(x.valid)" },
      },
    }, app);

    await sleep();
    expect((document.querySelector(".slex-input") as HTMLInputElement).value).toBe("5");
    expect(document.querySelector(".slex-text")?.textContent).toBe("5/5/true");

    mount({
      namespace: ns,
      g: {},
      layout: {
        "input:x": { type: "text", value: "fallback" },
        "text:state": { $text: "x.value + '/' + String(x.valid)" },
      },
    }, app);

    await sleep();
    expect(document.querySelector(".slex-text")?.textContent).toBe("5/undefined");
  });

  it("syncs checkbox checked and value instance state", async () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount({
      namespace: unique("checkbox"),
      g: {},
      layout: {
        "checkbox:agree": { checked: true, label: "Agree" },
        "text:state": { $text: "String(agree.checked) + '/' + String(agree.value)" },
      },
    }, document.getElementById("app")!);

    const checkbox = document.querySelector(".slex-checkbox") as HTMLInputElement;
    expect(document.querySelector(".slex-text")?.textContent).toBe("true/true");
    checkbox.checked = false;
    checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep();

    expect(document.querySelector(".slex-text")?.textContent).toBe("false/false");
  });

  it("syncs switch enabled instance state without checked aliases", async () => {
    document.body.innerHTML = '<div id="app"></div>';

    mount({
      namespace: unique("switch_enabled"),
      g: {},
      layout: {
        "switch:feature": { enabled: true, label: "Feature" },
        "text:state": { $text: "String(feature.enabled) + '/' + String(feature.checked) + '/' + String(feature.value)" },
      },
    }, document.getElementById("app")!);

    const input = document.querySelector(".slex-switch-input") as HTMLInputElement;
    expect(document.querySelector(".slex-text")?.textContent).toBe("true/undefined/undefined");
    input.checked = false;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep();

    expect(document.querySelector(".slex-text")?.textContent).toBe("false/undefined/undefined");
  });

  it("exposes output component resolved props as read-only state", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: unique("output_read"),
      g: {},
      layout: {
        "input:vin": { type: "number", value: 12 },
        "stat:vout": {
          label: "Vout",
          $value: "Number(vin.value) * 2",
          unit: "V",
        },
        "text:mirror": { $text: "String(vout.value) + vout.unit" },
        "button:tryWrite": { label: "Try", onclick: "vout.value = 99" },
      },
    }, document.getElementById("app")!);

    await sleep();
    expect(document.querySelector(".slex-text")?.textContent).toBe("24V");

    (document.querySelector(".slex-button") as HTMLButtonElement).click();
    await sleep();
    expect(document.querySelector(".slex-text")?.textContent).toBe("24V");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
