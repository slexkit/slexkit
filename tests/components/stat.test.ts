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

describe("stat component", () => {
  it("renders value and unit as separate elements", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("metric_unit"),
        g: { value: 10.909 },
        layout: {
          "stat:vout": {
            label: "输出电压",
            $value: "g.value.toFixed(3)",
            unit: "V",
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-stat-number")?.textContent).toBe("10.909");
    expect(document.querySelector(".slex-stat-unit")?.textContent).toBe("V");
  });

  it("renders static value props", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("metric_static_value"),
        layout: {
          "stat:count": {
            label: "数量",
            value: 12,
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-stat")?.hasAttribute("data-tone")).toBe(false);
    expect(document.querySelector(".slex-stat-number")?.textContent).toBe("12");
    expect(document.querySelector(".slex-stat-unit")).toBeFalsy();
  });

  it("formats numeric label and value floating point tails", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("metric_float_display"),
        layout: {
          "stat:ratio": {
            $label: "0.1 + 0.2",
            $value: "100.00000000000001",
            unit: "nF",
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-stat-label span")?.textContent).toBe("0.3");
    expect(document.querySelector(".slex-stat-number")?.textContent).toBe("100");
    expect(document.querySelector(".slex-stat-unit")?.textContent).toBe("nF");
  });

  it("renders semantic tone as a data attribute", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("metric_tone"),
        layout: {
          "stat:success": {
            label: "Success",
            value: "98%",
            tone: "success",
          },
        },
      },
      document.getElementById("app")!,
    );

    const stat = document.querySelector(".slex-stat") as HTMLElement;
    expect(stat.getAttribute("data-tone")).toBe("success");
    expect(stat.classList.contains("slex-success")).toBe(false);
  });

  it("updates dynamic unit props", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("metric_dynamic_unit"),
        g: { unit: "uA" },
        layout: {
          "stat:current": {
            label: "电流",
            value: "600.00",
            $unit: "g.unit",
          },
          "button:changeUnit": {
            label: "Change",
            onclick: "g.unit = 'mA'",
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-stat-unit")?.textContent).toBe("uA");
    (document.querySelector(".slex-button") as HTMLButtonElement).click();
    await sleep();
    expect(document.querySelector(".slex-stat-unit")?.textContent).toBe("mA");
  });

  it("animates number changes by direction without animating the initial render", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("metric_tick_animation"),
        g: { value: 10 },
        layout: {
          "stat:count": {
            label: "Count",
            $value: "g.value",
          },
          "button:up": {
            label: "Up",
            onclick: "g.value += 5",
          },
          "button:down": {
            label: "Down",
            onclick: "g.value -= 8",
          },
        },
      },
      document.getElementById("app")!,
    );

    expect(document.querySelector(".slex-stat-number")?.textContent).toBe("10");
    expect(document.querySelector(".slex-stat-character[data-stat-change]")).toBeFalsy();

    (document.querySelector(".slex-button") as HTMLButtonElement).click();
    await sleep();
    expect(document.querySelector(".slex-stat-number")?.textContent).toBe("15");
    const upDigits = Array.from(document.querySelectorAll(".slex-stat-character[data-stat-change='up']"));
    expect(upDigits.length).toBe(1);
    expect(upDigits[0].textContent).toBe("5");
    expect(upDigits[0].getAttribute("data-stat-previous")).toBe("0");

    (document.querySelectorAll(".slex-button")[1] as HTMLButtonElement).click();
    await sleep();
    expect(document.querySelector(".slex-stat-number")?.textContent).toBe("7");
    const downDigits = Array.from(document.querySelectorAll(".slex-stat-character[data-stat-change='down']"));
    expect(downDigits.length).toBe(1);
    expect(downDigits[0].textContent).toBe("7");
    expect(downDigits[0].getAttribute("data-stat-previous")).toBe("5");
  });

  it("can animate the initial value when explicitly enabled", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("metric_initial_animation"),
        layout: {
          "stat:count": {
            label: "Count",
            value: "12.30",
            animateInitial: true,
          },
        },
      },
      document.getElementById("app")!,
    );

    await sleep();
    expect(document.querySelector(".slex-stat-number")?.textContent).toBe("12.30");
    const initialDigits = Array.from(document.querySelectorAll(".slex-stat-character[data-stat-change='up']"));
    expect(initialDigits.map((node) => node.textContent)).toEqual(["1", "2", "3"]);
    expect(initialDigits.map((node) => node.getAttribute("data-stat-previous"))).toEqual(["0", "0", "0"]);
    expect(initialDigits.every((node) => node.getAttribute("data-stat-initial") === "true")).toBe(true);
  });

  it("keeps stat number motion scoped and reduced-motion aware", async () => {
    const css = await Bun.file("src/styles/display.css").text();

    expect(css).toContain('.slex-stat-character[data-stat-kind="digit"][data-stat-change]');
    expect(css).not.toContain(".slex-stat-character[data-stat-change] {\n  overflow: hidden;");
    expect(css).toContain(".slex-stat-character[data-stat-initial=\"true\"]");
    expect(css).toContain("--slex-stat-initial-delay");
    expect(css).toContain("@keyframes slex-stat-digit-new-up");
    expect(css).toContain("@keyframes slex-stat-digit-new-down");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
