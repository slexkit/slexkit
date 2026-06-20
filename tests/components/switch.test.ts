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

describe("switch component", () => {
  it("renders off initially", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("switch_init"),
        g: { val: false },
        layout: { "switch:s": { $enabled: "g.val" } },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-switch");
    expect(root).toBeTruthy();
    expect((root!.querySelector("input") as HTMLInputElement).checked).toBe(false);
  });

  it("renders native checkbox input inside the switch", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("switch_attrs"),
        g: { val: false },
        layout: { "switch:s": { $enabled: "g.val" } },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-switch");
    const input = root!.querySelector('input[type="checkbox"]');
    const control = root!.querySelector(".slex-switch-control");
    expect(input).toBeTruthy();
    expect(control).toBeTruthy();
  });

  it("does not treat checked as a switch state alias", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("switch_no_checked_alias"),
        layout: { "switch:s": { checked: true } },
      },
      document.getElementById("app")!,
    );
    const input = document.querySelector(".slex-switch-input") as HTMLInputElement;
    expect(input.checked).toBe(false);
  });

  it("disabled switch does not toggle on click", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("switch_disabled"),
        g: { val: false },
        layout: { "switch:s": { $enabled: "g.val", disabled: true } },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-switch")!;
    expect((root as HTMLElement).dataset.disabled).toBe("true");
    root.click();
    await sleep();
    expect((root.querySelector("input") as HTMLInputElement).checked).toBe(false);
  });

  it("click toggles switch state and emits change", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const emitted: unknown[] = [];
    mount(
      {
        namespace: unique("switch_toggle"),
        g: {
          val: false,
          onChange(x: unknown) { emitted.push(x); },
        },
        layout: {
          "switch:s": {
            $enabled: "g.val",
            onchange: "g.val = $event; g.onChange($event)",
          },
        },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-switch")!;
    root.click();
    await sleep();
    expect((root.querySelector("input") as HTMLInputElement).checked).toBe(true);
    expect(emitted).toEqual([true]);
  });

  it("vibrates on switch pointer down unless haptics are disabled", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls = mockVibrate();
    mount(
      {
        namespace: unique("switch_haptic"),
        g: { a: false, b: false },
        layout: {
          "switch:a": { $enabled: "g.a" },
          "switch:b": { $enabled: "g.b", haptics: false },
        },
      },
      document.getElementById("app")!,
    );

    const layers = document.querySelectorAll(".slex-switch-event-layer");
    layers[0].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    layers[1].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    await sleep();
    expect(calls).toEqual([8]);
  });

  it("uses click as a switch haptic fallback without double vibration", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls = mockVibrate();
    mount(
      {
        namespace: unique("switch_haptic_click"),
        g: { a: false },
        layout: { "switch:a": { $enabled: "g.a" } },
      },
      document.getElementById("app")!,
    );

    const layer = document.querySelector(".slex-switch-event-layer")!;
    layer.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    layer.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await sleep();
    expect(calls).toEqual([8]);
  });

  it("$enabled binding syncs external g change into switch", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = unique("switch_sync");
    const container = document.getElementById("app")!;
    mount({
      namespace: ns,
      g: { val: false },
      layout: { "switch:s": { $enabled: "g.val" } },
    }, container);
    let root = document.querySelector(".slex-switch");
    expect((root!.querySelector("input") as HTMLInputElement).checked).toBe(false);
    mount({
      namespace: ns,
      g: { val: true },
      layout: { "switch:s": { $enabled: "g.val" } },
    }, container);
    await sleep();
    root = document.querySelector(".slex-switch");
    expect((root!.querySelector("input") as HTMLInputElement).checked).toBe(true);
  });
});
