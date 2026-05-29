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
    expect(input.style.getPropertyValue("--slex-slider-progress")).toBe("50%");
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
    expect(input.style.getPropertyValue("--slex-slider-progress")).toBe("51%");
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
    expect(input.style.getPropertyValue("--slex-slider-progress")).toBe("9.09%");
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
    expect(css).toContain(".slex-slider:hover::-webkit-slider-thumb");
    expect(css).toContain(".slex-slider:active::-webkit-slider-thumb");
    expect(css).toContain("border: 2px solid var(--primary)");
    expect(css).toContain("background: var(--background) !important");
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
});
