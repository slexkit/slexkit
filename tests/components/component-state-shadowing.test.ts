import { describe, it, expect } from "bun:test";
import { mount } from "../../src/engine/index";
import "../../src/components/index";

function unique(ns: string) {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

describe("component state eval context shadowing", () => {
  it("input: does not shadow g properties when name matches a g key", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("input_no_shadow"),
        g: { color: "blue", name: "hello" },
        layout: {
          "input:name": {
            $value: "g.name",
          },
        },
      },
      document.getElementById("app")!,
    );
    const el = document.querySelector(".slex-input") as HTMLInputElement;
    expect(el.value).toBe("hello");
  });

  it("select: does not shadow g properties when name matches a g key", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("select_no_shadow"),
        g: { color: "blue", env: "prod" },
        layout: {
          "select:env": {
            $value: "g.env",
            options: [
              { label: "Dev", value: "dev" },
              { label: "Prod", value: "prod" },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );
    const trigger = document.querySelector(".slex-select-trigger") as HTMLButtonElement;
    expect(trigger.textContent).toContain("Prod");
  });

  it("tabs: does not shadow g properties when name matches a g key", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("tabs_no_shadow"),
        g: { color: "blue", active: "tab2" },
        layout: {
          "tabs:active": {
            $value: "g.active",
            tabs: [
              { value: "tab1", label: "Tab 1" },
              { value: "tab2", label: "Tab 2" },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );
    const triggers = document.querySelectorAll(".slex-tabs-trigger");
    expect(triggers[0].classList.contains("slex-tabs-trigger--selected")).toBe(false);
    expect(triggers[1].classList.contains("slex-tabs-trigger--selected")).toBe(true);
  });

  it("radio-group: does not shadow g properties when name matches a g key", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("radio_no_shadow"),
        g: { color: "blue", choice: "b" },
        layout: {
          "radio-group:choice": {
            $value: "g.choice",
            options: [
              { label: "Alpha", value: "a" },
              { label: "Beta", value: "b" },
            ],
          },
        },
      },
      document.getElementById("app")!,
    );
    const radios = document.querySelectorAll(".slex-radio");
    expect(radios[0].getAttribute("data-state")).toBe("unchecked");
    expect(radios[1].getAttribute("data-state")).toBe("checked");
  });

  it("checkbox: does not shadow g properties when name matches a g key", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("checkbox_no_shadow"),
        g: { color: "blue", agree: true },
        layout: {
          "checkbox:agree": {
            $checked: "g.agree",
            label: "Agree",
          },
        },
      },
      document.getElementById("app")!,
    );
    const root = document.querySelector(".slex-checkbox") as HTMLInputElement;
    expect(root.checked).toBe(true);
  });

  it("switch: does not shadow g properties when name matches a g key", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("switch_no_shadow"),
        g: { color: "blue", enabled: true },
        layout: {
          "switch:enabled": {
            $enabled: "g.enabled",
          },
        },
      },
      document.getElementById("app")!,
    );
    const input = document.querySelector(".slex-switch-input") as HTMLInputElement;
    expect(input.checked).toBe(true);
  });

  it("component named g does not overwrite the g proxy", () => {
    document.body.innerHTML = '<div id="app"></div>';
    mount(
      {
        namespace: unique("g_name_no_shadow"),
        g: { color: "blue" },
        layout: {
          "input:g": {
            $value: "g.color",
          },
        },
      },
      document.getElementById("app")!,
    );
    const el = document.querySelector(".slex-input") as HTMLInputElement;
    expect(el.value).toBe("blue");
  });

  it("component named api does not overwrite the api object", () => {
    document.body.innerHTML = '<div id="app"></div>';
    let apiValue: unknown;
    mount(
      {
        namespace: unique("api_name_no_shadow"),
        g: { check(x: unknown) { apiValue = x; } },
        layout: {
          "input:api": {
            value: "test",
          },
          "button:btn": {
            label: "Check",
            onclick: "g.check(api.endpoint)",
          },
        },
      },
      document.getElementById("app")!,
      { api: { endpoint: "https://example.com" } },
    );
    const btn = document.querySelector(".slex-button") as HTMLButtonElement;
    btn.click();
    expect(apiValue).toBe("https://example.com");
  });
});
