import { describe, it, expect } from "bun:test";
import { mount } from "../../src/engine/index";
import "../../src/components/index";

function sleep(ms = 40) {
  return new Promise((r) => setTimeout(r, ms));
}

function unique(ns = "v019") {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
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

describe("choice controls", () => {
    it("mount options provide direction and localized fallback labels", () => {
      document.body.innerHTML = '<div id="app"></div>';
      mount(
        {
          namespace: unique("mount_options"),
          g: {},
          layout: {
            "button:action": {},
          },
        },
        document.getElementById("app")!,
        { dir: "rtl", labels: { "button.label": "Localized action" } },
      );

      const root = document.querySelector(".slexkit-root") as HTMLElement;
      expect(root.dir).toBe("rtl");
      expect(root.dataset.dir).toBe("rtl");
      expect(document.querySelector(".slex-button")?.textContent).toContain("Localized action");
    });


    it("checkbox renders a native input and emits checked changes", async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const emitted: unknown[] = [];
      mount(
        {
          namespace: unique("checkbox"),
          g: {
            checked: false,
            onChange(x: unknown) { emitted.push(x); },
          },
          layout: {
            "checkbox:agree": {
              $checked: "g.checked",
              label: "Agree",
              onchange: "g.checked = $event; g.onChange($event)",
            },
          },
        },
        document.getElementById("app")!,
      );

      const root = document.querySelector(".slex-checkbox") as HTMLElement;
      expect((root as HTMLInputElement).checked).toBe(false);
      root.click();
      await sleep();
      expect((root as HTMLInputElement).checked).toBe(true);
      expect(emitted).toEqual([true]);
    });


    it("radio-group supports value binding and option selection", async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const emitted: unknown[] = [];
      mount(
        {
          namespace: unique("radio"),
          g: {
            value: "a",
            onChange(x: unknown) { emitted.push(x); },
          },
          layout: {
            "radio-group:choice": {
              $value: "g.value",
              onchange: "g.value = $event; g.onChange($event)",
              options: [
                { label: "Alpha", value: "a" },
                { label: "Beta", value: "b" },
              ],
            },
          },
        },
        document.getElementById("app")!,
      );

      const root = document.querySelector(".slex-radio-group")!;
      expect(root.getAttribute("data-scope")).toBe("radio-group");
      const radios = root.querySelectorAll(".slex-radio");
      expect(radios[0].getAttribute("data-state")).toBe("checked");
      (radios[1] as HTMLElement).click();
      await sleep();
      expect(emitted).toEqual(["b"]);
    });


    it("choice controls vibrate on pointer down unless haptics are disabled", async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const calls = mockVibrate();
      mount(
        {
          namespace: unique("choice_haptics"),
          g: { checked: false, value: "a" },
          layout: {
            "checkbox:a": { $checked: "g.checked", label: "A" },
            "checkbox:b": { $checked: "g.checked", label: "B", haptic: false },
            "radio-group:r": {
              $value: "g.value",
              options: [
                { label: "Alpha", value: "a" },
                { label: "Beta", value: "b" },
              ],
            },
          },
        },
        document.getElementById("app")!,
      );

      const choiceLayers = document.querySelectorAll(".slex-choice-event-layer");
      choiceLayers[0].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      choiceLayers[1].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      choiceLayers[3].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      await sleep();
      expect(calls).toEqual([8, 8]);
    });


    it("choice controls use click haptic fallback without double vibration", async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const calls = mockVibrate();
      mount(
        {
          namespace: unique("choice_haptic_click"),
          g: { checked: false, value: "a" },
          layout: {
            "checkbox:a": { $checked: "g.checked", label: "A" },
            "radio-group:r": {
              $value: "g.value",
              options: [
                { label: "Alpha", value: "a" },
                { label: "Beta", value: "b" },
              ],
            },
          },
        },
        document.getElementById("app")!,
      );

      const choiceLayers = document.querySelectorAll(".slex-choice-event-layer");
      choiceLayers[0].dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      choiceLayers[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      choiceLayers[2].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await sleep();
      expect(calls).toEqual([8, 8]);
    });
});
