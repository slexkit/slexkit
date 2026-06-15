import { describe, it, expect } from "bun:test";
import { mount } from "../../src/engine/index";
import { sleep, uniqueNamespace } from "../helpers";
import "../../src/components/index";

describe("select component", () => {
  it("renders an accessible custom listbox with a hidden native select", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: uniqueNamespace("sel_attrs"),
        g: { val: "" },
        layout: {
          "select:sel": {
            $value: "g.val",
            options: [
              { label: "Option A", value: "a" },
              { label: "Option B", value: "b" },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-select");
    expect(root).toBeTruthy();
    const trigger = root!.querySelector(".slex-select-trigger") as HTMLButtonElement;
    const select = root!.querySelector("select.slex-select-native") as HTMLSelectElement;
    expect(trigger).toBeTruthy();
    expect(trigger.getAttribute("aria-haspopup")).toBe("listbox");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(select).toBeTruthy();
    expect(select.options).toHaveLength(3);

    trigger.click();
    await sleep();
    const listbox = root!.querySelector('[role="listbox"]') as HTMLElement;
    const options = root!.querySelectorAll('[role="option"]');
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-controls")).toBe(listbox.id);
    expect(options).toHaveLength(2);
  });

  it("$value binding and @change event work through option clicks", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = uniqueNamespace("sel_change");
    const emitted: unknown[] = [];
    mount(
      {
        namespace: ns,
        g: {
          val: "a",
          onChange(x: unknown) { emitted.push(x); },
        },
        layout: {
          "select:sel": {
            $value: "g.val",
            onchange: "g.val = $event; g.onChange($event)",
            options: [
              { label: "Option A", value: "a" },
              { label: "Option B", value: "b" },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-select")!;
    const trigger = root.querySelector(".slex-select-trigger") as HTMLButtonElement;
    const select = root.querySelector("select.slex-select-native") as HTMLSelectElement;
    expect(select).toBeTruthy();
    expect(select.value).toBe("a");

    trigger.click();
    await sleep();
    (Array.from(root.querySelectorAll('[role="option"]')).find((node) => node.textContent?.includes("Option B")) as HTMLElement).click();
    await sleep(50);
    expect(emitted.length).toBeGreaterThanOrEqual(1);
    if (emitted.length > 0) {
      expect(emitted[0]).toBe("b");
    }
    expect(select.value).toBe("b");
    expect(trigger.textContent).toContain("Option B");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not require native requestAnimationFrame to close after selection", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const originalRaf = window.requestAnimationFrame;
    window.requestAnimationFrame = (() => {
      throw new Error("Native raf is disabled inside the SlexKit sandbox.");
    }) as typeof requestAnimationFrame;

    try {
      mount(
        {
          namespace: uniqueNamespace("sel_no_native_raf"),
          g: { val: "a" },
          layout: {
            "select:sel": {
              $value: "g.val",
              onchange: "g.val = $event",
              options: [
                { label: "Option A", value: "a" },
                { label: "Option B", value: "b" },
              ],
            },
          },
        },
        document.getElementById("app")!,
      );
      const root = document.querySelector(".slex-select")!;
      const trigger = root.querySelector(".slex-select-trigger") as HTMLButtonElement;
      trigger.click();
      await sleep();
      expect(() => {
        (Array.from(root.querySelectorAll('[role="option"]')).find((node) => node.textContent?.includes("Option B")) as HTMLElement).click();
      }).not.toThrow();
      await sleep();
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(root.querySelector("select")!.value).toBe("b");
    } finally {
      window.requestAnimationFrame = originalRaf;
    }
  });

  it("supports keyboard open, navigation, select, and escape", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const emitted: unknown[] = [];
    mount(
      {
        namespace: uniqueNamespace("sel_keyboard"),
        g: {
          val: "a",
          onChange(x: unknown) { emitted.push(x); },
        },
        layout: {
          "select:sel": {
            label: "Environment",
            $value: "g.val",
            onchange: "g.val = $event; g.onChange($event)",
            options: [
              { label: "Development", value: "a" },
              { label: "Production", value: "b" },
              { label: "Preview", value: "c" },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-select")!;
    const trigger = root.querySelector(".slex-select-trigger") as HTMLButtonElement;
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    await sleep();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await sleep(50);
    expect(emitted[0]).toBe("b");
    expect(root.querySelector("select")!.value).toBe("b");

    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    await sleep();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await sleep();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("sets label and selected option ARIA state", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: uniqueNamespace("sel_aria"),
        g: { val: "prod" },
        layout: {
          "select:sel": {
            label: "Environment",
            $value: "g.val",
            options: [
              { label: "Development", value: "dev" },
              { label: "Production", value: "prod" },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-select")!;
    const label = root.querySelector(".slex-select-label") as HTMLLabelElement;
    const trigger = root.querySelector(".slex-select-trigger") as HTMLButtonElement;
    expect(label.id).toBeTruthy();
    expect(trigger.getAttribute("aria-labelledby")).toContain(label.id);

    trigger.click();
    await sleep();
    const selected = Array.from(root.querySelectorAll('[role="option"]'))
      .find((node) => node.textContent?.includes("Production")) as HTMLElement;
    expect(selected.getAttribute("aria-selected")).toBe("true");
  });

  it("moves the active menu item on hover", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: uniqueNamespace("sel_hover_active"),
        g: { val: "a" },
        layout: {
          "select:sel": {
            $value: "g.val",
            options: [
              { label: "Option A", value: "a" },
              { label: "Option B", value: "b" },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-select")!;
    const trigger = root.querySelector(".slex-select-trigger") as HTMLButtonElement;
    trigger.click();
    await sleep();
    const [optionA, optionB] = Array.from(root.querySelectorAll('[role="option"]')) as HTMLElement[];
    expect(optionA.classList.contains("slex-select-option--active")).toBe(true);
    optionB.dispatchEvent(new MouseEvent("mouseenter"));
    await sleep();
    expect(optionA.classList.contains("slex-select-option--active")).toBe(false);
    expect(optionB.classList.contains("slex-select-option--active")).toBe(true);
  });

  it("skips disabled options", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const emitted: unknown[] = [];
    mount(
      {
        namespace: uniqueNamespace("sel_disabled_option"),
        g: {
          val: "a",
          onChange(x: unknown) { emitted.push(x); },
        },
        layout: {
          "select:sel": {
            $value: "g.val",
            onchange: "g.val = $event; g.onChange($event)",
            options: [
              { label: "Option A", value: "a" },
              { label: "Option B", value: "b", disabled: true },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-select")!;
    const trigger = root.querySelector(".slex-select-trigger") as HTMLButtonElement;
    trigger.click();
    await sleep();
    (Array.from(root.querySelectorAll('[role="option"]')).find((node) => node.textContent?.includes("Option B")) as HTMLElement).click();
    await sleep(50);
    expect(emitted).toEqual([]);
    expect(root.querySelector("select")!.value).toBe("a");
  });

  it("shows placeholder and keeps required placeholder invalid in the native select", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: uniqueNamespace("sel_placeholder"),
        g: { val: "" },
        layout: {
          "select:sel": {
            label: "Environment",
            required: true,
            placeholder: "Choose...",
            $value: "g.val",
            options: [
              { label: "Development", value: "dev" },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-select")!;
    const trigger = root.querySelector(".slex-select-trigger") as HTMLButtonElement;
    const select = root.querySelector("select.slex-select-native") as HTMLSelectElement;
    expect(trigger.textContent).toContain("Choose...");
    expect(select.required).toBe(true);
    expect(select.options[0].disabled).toBe(true);
  });
});
