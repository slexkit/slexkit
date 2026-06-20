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

describe("slider component", () => {
  it("renders data-orientation and value", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("slider_render"),
        g: { v: 50 },
        layout: { "slider:sl": { $value: "g.v" } },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-slider-field");
    expect(root).toBeTruthy();
    expect(root!.getAttribute("data-orientation")).toBe("horizontal");
    const input = root!.querySelector(".slex-slider") as HTMLInputElement;
    expect(input.value).toBe("50");
    const control = root!.querySelector(".slex-slider-control") as HTMLElement;
    expect(control.style.getPropertyValue("--slex-slider-progress")).toBe("50%");
  });

  it("native input changes value and emits @change", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("slider_key");
    const emitted: unknown[] = [];
    mount(
      {
        namespace: ns,
        g: {
          v: 50,
          onChange(x: unknown) { emitted.push(x); },
        },
        layout: {
          "slider:sl": {
            $value: "g.v",
            onchange: "g.v = $event; g.onChange($event)",
          },
        },
      },
      document.getElementById("app")!,
    );
    const input = document.querySelector(".slex-slider") as HTMLInputElement;
    expect(input).toBeTruthy();
    input.value = "51";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await sleep();
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toBe(51);
    expect(document.querySelector(".slex-slider-value")!.textContent).toBe("51");
    const control = document.querySelector(".slex-slider-control") as HTMLElement;
    expect(control.style.getPropertyValue("--slex-slider-progress")).toBe("51%");
  });

  it("renders native range constraints", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("slider_drag"),
        g: { v: 30 },
        layout: { "slider:sl": { $value: "g.v" } },
      },
      document.getElementById("app")!,
    );
    const input = document.querySelector(".slex-slider") as HTMLInputElement;
    expect(input.type).toBe("range");
    expect(input.min).toBe("0");
    expect(input.max).toBe("100");
    expect(input.step).toBe("1");
  });

  it("applies custom range constraints before the initial value", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("slider_custom_range"),
        g: { v: 10000 },
        layout: {
          "slider:sl": {
            $value: "g.v",
            min: 1000,
            max: 100000,
            step: 1000,
          },
        },
      },
      document.getElementById("app")!,
    );

    const input = document.querySelector(".slex-slider") as HTMLInputElement;
    expect(input.min).toBe("1000");
    expect(input.max).toBe("100000");
    expect(input.step).toBe("1000");
    expect(input.value).toBe("10000");
    const control = document.querySelector(".slex-slider-control") as HTMLElement;
    expect(control.style.getPropertyValue("--slex-slider-progress")).toBe("9.09%");
  });

  it("formats floating point tails in the displayed value", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("slider_float_display"),
        g: { v: 100.00000000000001 },
        layout: {
          "slider:sl": {
            $value: "g.v",
            min: 10,
            max: 1000,
            step: 10,
            unit: "nF",
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-slider-value")?.textContent).toBe("100nF");
  });

  it("keeps slider and switch styling on theme tokens", async () => {
    const css = [
      await Bun.file("src/styles/components/slider.css").text(),
      await Bun.file("src/styles/components/switch.css").text(),
    ].join("\n");
    expect(css).toContain(".slex-slider::-webkit-slider-thumb");
    expect(css).toContain(".slex-slider::-webkit-slider-runnable-track");
    expect(css).toContain(".slex-slider:hover::-webkit-slider-thumb");
    expect(css).toContain(".slex-slider:active::-webkit-slider-thumb");
    expect(css).toContain(".slex-slider-control");
    expect(css).toContain(".slex-slider-track");
    expect(css).toContain(".slexkit-root .slex-slider-control input.slex-slider");
    expect(css).toContain("margin-top: 0");
    expect(css).toContain("background-clip: padding-box");
    expect(css).toContain("height: 1rem");
    expect(css).toContain("overflow: visible");
    expect(css).toContain(".slex-slider {\n  position: relative;");
    expect(css).toContain("background: transparent");
    expect(css).toContain(".slex-slider::-webkit-slider-runnable-track");
    expect(css).toContain("var(--primary) var(--slex-slider-progress, 0%)");
    expect(css).toContain(".slex-slider::-webkit-slider-runnable-track {\n  box-sizing: border-box;");
    expect(css).toContain("background: transparent;");
    expect(css).toContain("border: 2px solid var(--primary)");
    expect(css).toContain("background-color: var(--background)");
    expect(css).toContain(".slex-switch:hover .slex-switch-control");
    expect(css).toContain(".slex-switch:active .slex-switch-control::after");
    expect(css).toContain(".slex-switch-input:checked + .slex-switch-control");
    expect(css).toContain(".slex-switch-control::after");
    expect(css).toContain("border-radius: 9999px");
    expect(css).toContain('content: ""');
    expect(css).toContain("width: 2.75rem");
    expect(css).toContain("height: 1.5rem");
    expect(css).toContain("width: 1.25rem");
    expect(css).toContain("transform: translateX(1.25rem)");
    expect(css).toContain("border-color: var(--primary)");
  });

  it("vibrates on pointer down and on each tick when the slider has 20 or fewer steps", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const vibrateCalls = mockVibrate();
    mount(
      {
        namespace: unique("slider_haptic_ticks"),
        g: { v: 50 },
        layout: { "slider:sl": { $value: "g.v", min: 0, max: 100, step: 10, onchange: "g.v = $event" } },
      },
      document.getElementById("app")!,
    );

    const input = document.querySelector(".slex-slider") as HTMLInputElement;
    input.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    input.value = "60";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    input.value = "70";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await sleep();

    expect(vibrateCalls).toEqual([8, 5, 5]);
  });

  it("does not vibrate every tick when the slider has more than 20 steps", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const vibrateCalls = mockVibrate();
    mount(
      {
        namespace: unique("slider_haptic_dense"),
        g: { v: 50 },
        layout: { "slider:sl": { $value: "g.v", min: 0, max: 100, step: 1, onchange: "g.v = $event" } },
      },
      document.getElementById("app")!,
    );

    const input = document.querySelector(".slex-slider") as HTMLInputElement;
    input.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    input.value = "51";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await sleep();

    expect(vibrateCalls).toEqual([8]);
  });

  it("does not shadow g properties when component name matches a g key", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("slider_no_shadow"),
        g: { color: "blue", size: 16 },
        layout: {
          "slider:size": {
            $value: "g.size",
            min: 8,
            max: 48,
            unit: "px",
            onchange: "g.size = Number($event)",
          },
        },
      },
      document.getElementById("app")!,
    );

    const sliderValue = document.querySelector(".slex-slider-value")!;
    expect(sliderValue.textContent).toBe("16px");

    const input = document.querySelector(".slex-slider") as HTMLInputElement;
    expect(input.value).toBe("16");
    const control = document.querySelector(".slex-slider-control") as HTMLElement;
    expect(control.style.getPropertyValue("--slex-slider-progress")).toBe("20%");
  });

  it("does not reuse a preceding select value for a slider bound to another g key", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("slider_no_cross_component_shadow"),
        g: { color: "blue", size: 16 },
        layout: {
          "select:color": {
            label: "Color",
            $value: "g.color",
            options: [
              { label: "Blue", value: "blue" },
              { label: "Green", value: "green" },
            ],
            onchange: "g.color = String($event)",
          },
          "slider:size": {
            label: "Size",
            $value: "g.size",
            min: 8,
            max: 48,
            unit: "px",
            onchange: "g.size = Number($event)",
          },
          "badge:note": { "$label": "'style ' + g.color + ' ' + g.size + 'px'" },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-slider-value")?.textContent).toBe("16px");
    expect((document.querySelector(".slex-slider") as HTMLInputElement)?.value).toBe("16");
    expect(document.querySelector(".slex-badge")?.textContent).toContain("style blue 16px");

    const trigger = document.querySelector(".slex-select-trigger") as HTMLButtonElement;
    trigger.click();
    await sleep();
    (Array.from(document.querySelectorAll('[role="option"]')).find((node) => node.textContent?.includes("Green")) as HTMLElement).click();
    await sleep();

    expect(document.querySelector(".slex-slider-value")?.textContent).toBe("16px");
    expect(document.querySelector(".slex-badge")?.textContent).toContain("style green 16px");
  });
});
