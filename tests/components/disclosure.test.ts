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

describe("disclosure components", () => {

    it("accordion opens items and emits the active value", async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const emitted: unknown[] = [];
      mount(
        {
          namespace: unique("accordion"),
          g: {
            active: "one",
            onChange(x: unknown) { emitted.push(x); },
          },
          layout: {
            "accordion:faq": {
              $value: "g.active",
              onchange: "g.active = $event; g.onChange($event)",
              items: [
                { value: "one", label: "One", content: "First" },
                { value: "two", label: "Two", content: "Second" },
              ],
            },
          },
        },
        document.getElementById("app")!,
      );

      const root = document.querySelector(".slex-accordion")!;
      expect(root.getAttribute("data-scope")).toBe("accordion");
      const triggers = root.querySelectorAll(".slex-accordion-trigger");
      expect(triggers[0].getAttribute("data-state")).toBe("open");
      expect(triggers[0].querySelectorAll(".slex-accordion-indicator")).toHaveLength(1);
      expect(triggers[0].querySelector("svg")).toBeNull();
      expect(document.querySelectorAll('.slex-accordion-content[data-state="open"]')).toHaveLength(1);
      expect((document.querySelectorAll(".slex-accordion-content")[1] as HTMLElement).getAttribute("aria-hidden")).toBe("true");
      (triggers[1] as HTMLElement).click();
      await sleep();
      expect(emitted).toEqual(["two"]);
      expect(triggers[1].getAttribute("data-state")).toBe("open");
      expect(document.querySelectorAll('.slex-accordion-content[data-state="open"]')).toHaveLength(1);
    });

    it("accordion supports multiple open items", async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const emitted: unknown[] = [];
      mount(
        {
          namespace: unique("accordion_multiple"),
          g: {
            active: ["one"],
            onChange(x: unknown) { emitted.push(x); },
          },
          layout: {
            "accordion:faq": {
              multiple: true,
              $value: "g.active",
              onchange: "g.active = $event; g.onChange($event)",
              items: [
                { value: "one", label: "One", content: "First" },
                { value: "two", label: "Two", content: "Second" },
                { value: "three", label: "Three", content: "Third" },
              ],
            },
          },
        },
        document.getElementById("app")!,
      );

      const triggers = document.querySelectorAll(".slex-accordion-trigger");
      expect(document.querySelectorAll('.slex-accordion-content[data-state="open"]')).toHaveLength(1);
      (triggers[1] as HTMLElement).click();
      await sleep();
      expect(document.querySelectorAll('.slex-accordion-content[data-state="open"]')).toHaveLength(2);
      expect(emitted).toEqual([["one", "two"]]);
      (triggers[0] as HTMLElement).click();
      await sleep();
      expect(document.querySelectorAll('.slex-accordion-content[data-state="open"]')).toHaveLength(1);
      expect(emitted.at(-1)).toEqual(["two"]);
    });


    it("collapsible toggles open state and emits events", async () => {
      document.body.innerHTML = '<div id="app"></div>';
      const changes: unknown[] = [];
      const opens: unknown[] = [];
      mount(
        {
          namespace: unique("collapsible"),
          g: {
            open: false,
            onChange(x: unknown) { changes.push(x); },
            onOpen(x: unknown) { opens.push(x); },
          },
          layout: {
            "collapsible:panel": {
              $open: "g.open",
              trigger: "Details",
              content: "Hidden content",
              onchange: "g.open = $event; g.onChange($event)",
              onopen: "g.onOpen($event)",
            },
          },
        },
        document.getElementById("app")!,
      );

      const trigger = document.querySelector(".slex-collapsible-trigger") as HTMLElement;
      const content = document.querySelector(".slex-collapsible-content") as HTMLElement;
      expect(trigger.getAttribute("aria-expanded")).toBe("false");
      expect(trigger.getAttribute("aria-controls")).toBe(content.id);
      expect(content.getAttribute("data-state")).toBe("closed");
      expect(content.getAttribute("aria-hidden")).toBe("true");
      expect(document.querySelector(".slex-collapsible-content-inner")?.textContent).toBe("Hidden content");
      trigger.click();
      await sleep();
      expect(changes).toEqual([true]);
      expect(opens).toHaveLength(1);
      expect(trigger.getAttribute("aria-expanded")).toBe("true");
      expect(content.getAttribute("data-state")).toBe("open");
      expect(content.getAttribute("aria-hidden")).toBe("false");
    });

  it("collapsible renders children without duplicating content prop text", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("collapsible_no_dup"),
        g: {},
        layout: {
          "collapsible:panel": {
            trigger: "Toggle",
            content: "Should not appear when children exist",
            "text:child": { text: "Child content" },
          },
        },
      },
      document.getElementById("app")!,
    );
    const inner = document.querySelector(".slex-collapsible-content-inner");
    expect(inner?.textContent).toBe("Child content");
    expect(inner?.textContent).not.toContain("Should not appear");
  });
});
