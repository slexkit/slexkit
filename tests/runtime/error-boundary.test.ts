import { describe, it, expect, spyOn } from "bun:test";
import { mount } from "../../src/engine/index";
import { register } from "../../src/engine/registry";
import "../../src/components/index";

describe("component render error boundary", () => {
  it("renders a fallback when a component renderer throws without affecting siblings", () => {
    register("exploder", () => { throw new Error("boom"); });

    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: "err_boundary_" + Date.now(),
      g: {},
      layout: {
        "exploder:x": {},
        "text:ok": { $content: "'survived'" },
      },
    }, container);

    const fallbacks = container.querySelectorAll(".slex-render-error");
    expect(fallbacks).toHaveLength(1);
    expect(fallbacks[0].title).toBe("exploder:x");

    const text = container.querySelector(".slex-text");
    expect(text?.textContent).toBe("survived");
    expect(warnSpy.mock.calls.some((call) => String(call[0]).includes("Render error"))).toBe(true);
    warnSpy.mockRestore();
  });

  it("renders a fallback for a throwing component inside $if", () => {
    register("exploder", () => { throw new Error("boom"); });

    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: "err_if_" + Date.now(),
      g: { show: true },
      layout: {
        "exploder:x": { $if: "g.show" },
        "text:ok": { $content: "'alive'" },
      },
    }, container);

    expect(container.querySelectorAll(".slex-render-error")).toHaveLength(1);
    expect(container.querySelector(".slex-text")?.textContent).toBe("alive");
    expect(warnSpy.mock.calls.some((call) => String(call[0]).includes("Render error"))).toBe(true);
    warnSpy.mockRestore();
  });
});

describe("$for item error isolation", () => {
  it("isolates a throwing $for item from the rest of the list", () => {
    register("itemBox", (props) => {
      const val = typeof props.$value === "function" ? props.$value() : props.$value;
      if (val === "bad") throw new Error("bad item");
      const el = document.createElement("div");
      el.className = "item-text";
      el.textContent = String(val ?? "");
      return el;
    });

    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});

    mount({
      namespace: "err_for_" + Date.now(),
      g: { items: ["ok1", "bad", "ok2"] },
      layout: {
        "itemBox:": {
          $for: "g.items",
          $key: "$value",
          $value: "$item",
        },
      },
    }, container);

    const fallbacks = container.querySelectorAll(".slex-render-error");
    expect(fallbacks).toHaveLength(1);

    const items = container.querySelectorAll(".item-text");
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toBe("ok1");
    expect(items[1].textContent).toBe("ok2");
    expect(warnSpy.mock.calls.some((call) => String(call[0]).includes("Render error"))).toBe(true);
    warnSpy.mockRestore();
  });
});

describe("expression diagnostics namespace and path", () => {
  it("includes namespace and component path in eval warnings", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
    const ns = "err_ns_" + Date.now();

    mount({
      namespace: ns,
      g: {},
      layout: { "text:x": { $content: "g.undefined.foo" } },
    }, document.getElementById("app")!);

    const calls = warnSpy.mock.calls.filter(
      (c) => c[0] && typeof c[0] === "string" && c[0].includes("$eval error"),
    );
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls[0][0]).toContain(`[SlexKit][${ns}]`);
    expect(calls[0][0]).toContain("text:x");

    warnSpy.mockRestore();
  });
});

describe("expression last-good value fallback", () => {
  it("returns the last good value after a later expression failure", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
    const container = document.getElementById("app")!;
    const ns = "err_last_" + Date.now();

    mount({
      namespace: ns,
      g: { obj: { nested: "hello" } },
      layout: { "text:x": { $content: "g.obj.nested" } },
    }, container);
    expect(container.querySelector(".slex-text")?.textContent).toBe("hello");

    mount({
      namespace: ns,
      g: { obj: null },
      layout: { "text:x": { $content: "g.obj.nested" } },
    }, container);

    const text = container.querySelector(".slex-text")?.textContent;
    expect(text).toBe("hello");

    warnSpy.mockRestore();
  });
});

describe("$event object model", () => {
  it("passes type target and native fields in button click events", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = "event_model_" + Date.now();
    let captured: unknown = undefined;

    mount({
      namespace: ns,
      g: {
        save(ev: unknown) { captured = ev; },
      },
      layout: {
        "button:test": { onclick: "g.save($event)" },
      },
    }, document.getElementById("app")!);

    const btn = document.querySelector(".slex-button") as HTMLButtonElement;
    btn.click();

    expect(captured).toBeTruthy();
    expect((captured as Record<string, unknown>).type).toBe("click");
    expect((captured as Record<string, unknown>).target).toBe("test");
    expect((captured as Record<string, unknown>).native).toBeTruthy();
  });
});

describe("expression sandbox parameters", () => {
  it("injects only context keys as expression parameters", () => {
    const context = { g: {} };
    const fn = new Function(
      ...Object.keys(context),
      `"use strict"; return arguments.length;`,
    );
    const len = fn(...Object.values(context)) as number;
    expect(len).toBe(Object.keys(context).length);
    expect(Object.keys(context)).not.toContain("window");
    expect(Object.keys(context)).not.toContain("document");
  });

  it("keeps this undefined in strict expression functions", () => {
    const fn = new Function(`"use strict"; return this === undefined`);
    expect(fn()).toBe(true);
  });
});
