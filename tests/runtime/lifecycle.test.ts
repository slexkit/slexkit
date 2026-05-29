import { describe, it, expect } from "bun:test";
import { disposeNamespace, mount, register } from "../../src/engine/index";
import { attachComponentDisposer } from "../../src/engine/component-scope";
import "../../src/components/index";

function uniqueType(prefix: string): string {
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

function readProp(value: unknown): unknown {
  return typeof value === "function" ? (value as () => unknown)() : value;
}

function registerDisposableProbe(type: string, calls: string[]): void {
  register(type, (props, name, ctx) => {
    const el = ctx.document.createElement("div");
    el.className = `slex-${type}`;
    el.textContent = String(readProp(props.$content ?? props.text ?? name));
    attachComponentDisposer(el, () => {
      calls.push(name || type);
    });
    return el;
  });
}

function registerActionButton(type: string): void {
  register(type, (props, _name, ctx) => {
    const el = ctx.document.createElement("button");
    el.className = `slex-${type}`;
    const handler = props.onclick ?? props.onClick;
    if (typeof handler === "function") {
      el.addEventListener("click", () => {
        handler();
      });
    }
    return el;
  });
}

describe("onMount lifecycle hooks", () => {
  it("calls onMount_<name> when a named component mounts", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls: string[] = [];
    const dsl = {
      namespace: "lifecycle_mount_" + Date.now(),
      g: {
        label: "test",
        onMount_hello() {
          calls.push("mounted");
        },
      },
      layout: {
        "text:hello": { $content: "g.label" },
      },
    };
    mount(dsl, document.getElementById("app")!);
    expect(calls).toEqual(["mounted"]);
  });

  it("calls onMount_ when an anonymous component mounts", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls: string[] = [];
    const dsl = {
      namespace: "lifecycle_anon_" + Date.now(),
      g: {
        label: "test",
        onMount_() {
          calls.push("anon_mounted");
        },
      },
      layout: {
        "text:": { $content: "g.label" },
      },
    };
    mount(dsl, document.getElementById("app")!);
    expect(calls).toEqual(["anon_mounted"]);
  });

  it("mounts when $if is true and unmounts when it becomes false", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls: string[] = [];
    const ns = "lifecycle_if_" + Date.now();
    const dsl = {
      namespace: ns,
      g: {
        visible: true,
        label: "x",
        onMount_toggle() {
          calls.push("mounted");
        },
        onUnmount_toggle() {
          calls.push("unmounted");
        },
      },
      layout: {
        "text:toggle": {
          $if: "g.visible",
          $content: "g.label",
        },
      },
    };
    mount(dsl, document.getElementById("app")!);
    expect(calls).toEqual(["mounted"]);

    calls.length = 0;
    dsl.g.visible = false;
    mount(dsl, document.getElementById("app")!);
    expect(calls).toEqual(["unmounted"]);
  });
});

describe("onUnmount lifecycle hooks", () => {
  it("calls onUnmount_<name> when a normal component is cleaned up", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls: string[] = [];
    const ns = "lifecycle_unmount_" + Date.now();
    const dsl = {
      namespace: ns,
      g: {
        show: true,
        onMount_outer() { calls.push("mount"); },
        onUnmount_outer() { calls.push("unmount"); },
      },
      layout: {
        "column:outer": {
          $if: "g.show",
          "text:inner": { $content: "'hello'" },
        },
      },
    };
    mount(dsl, document.getElementById("app")!);
    expect(calls).toEqual(["mount"]);

    calls.length = 0;
    dsl.g.show = false;
    mount(dsl, document.getElementById("app")!);
    expect(calls).toEqual(["unmount"]);
  });
});

describe("lifecycle hook g context", () => {
  it("lets onMount read and write g through this", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const ns = "lifecycle_this_" + Date.now();
    const dsl = {
      namespace: ns,
      g: {
        counter: 1,
        multiplier: 10,
        onMount_comp() {
          this.counter = (this.counter as number) * (this.multiplier as number);
        },
      },
      layout: {
        "text:comp": { $content: "'val:' + g.counter" },
      },
    };
    mount(dsl, document.getElementById("app")!);
    const el = document.querySelector(".slex-text");
    expect(el?.textContent).toBe("val:10");
  });
});

describe("$for lifecycle hooks", () => {
  it("calls onMount for each $for item in order", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls: string[] = [];
    const ns = "lifecycle_for_" + Date.now();
    const dsl = {
      namespace: ns,
      g: {
        items: ["a", "b"],
        onMount_item() {
          calls.push("mount");
        },
        onUnmount_item() {
          calls.push("unmount");
        },
      },
      layout: {
        "text:item": {
          $for: "g.items",
          $key: "$value",
          $content: "$item",
        },
      },
    };
    mount(dsl, document.getElementById("app")!);
    expect(calls).toEqual(["mount", "mount"]);

    calls.length = 0;
    dsl.g.items = ["a"];
    mount(dsl, document.getElementById("app")!);
    expect(calls).toContain("mount");
    expect(calls.filter(c => c === "unmount").length).toBeGreaterThanOrEqual(1);
  });
});

describe("structural directive cleanup", () => {
  it("runs component disposers for $if and $for when mount cleanup runs", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls: string[] = [];
    const type = uniqueType("probeCleanup");
    registerDisposableProbe(type, calls);

    const cleanup = mount({
      namespace: "structural_cleanup_" + Date.now(),
      g: {
        visible: true,
        items: ["a", "b"],
      },
      layout: {
        [`${type}:panel`]: {
          $if: "g.visible",
          text: "panel",
        },
        [`${type}:row`]: {
          $for: "g.items",
          $key: "$value",
          $content: "$item",
        },
      },
    }, document.getElementById("app")!);

    expect(calls).toEqual([]);
    cleanup();
    expect(calls.toSorted()).toEqual(["panel", "row", "row"]);
  });

  it("runs structural directive disposers through disposeNamespace", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls: string[] = [];
    const type = uniqueType("probeNamespace");
    const ns = "structural_namespace_" + Date.now();
    registerDisposableProbe(type, calls);

    mount({
      namespace: ns,
      g: {
        visible: true,
        items: ["a", "b"],
      },
      layout: {
        [`${type}:panel`]: {
          $if: "g.visible",
          text: "panel",
        },
        [`${type}:row`]: {
          $for: "g.items",
          $key: "$value",
          $content: "$item",
        },
      },
    }, document.getElementById("app")!);

    disposeNamespace(ns);
    expect(calls.toSorted()).toEqual(["panel", "row", "row"]);
  });

  it("disposes a leaving $if component when root cleanup interrupts animation", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const calls: string[] = [];
    const probeType = uniqueType("probeLeaveIf");
    const actionType = uniqueType("actionLeaveIf");
    registerDisposableProbe(probeType, calls);
    registerActionButton(actionType);

    const cleanup = mount({
      namespace: "structural_leave_if_" + Date.now(),
      g: {
        visible: true,
      },
      layout: {
        [`${probeType}:panel`]: {
          $if: "g.visible",
          $leave: "'slex-fade-out'",
          text: "panel",
        },
        [`${actionType}:hide`]: {
          onclick: "g.visible = false",
        },
      },
    }, container);

    (container.querySelector(`.slex-${actionType}`) as HTMLButtonElement).click();
    const panel = container.querySelector(`.slex-${probeType}`)!;
    expect(panel.classList.contains("slex-fade-out")).toBe(true);
    expect(calls).toEqual([]);

    cleanup();
    expect(calls).toEqual(["panel"]);
    expect(panel.isConnected).toBe(false);

    panel.dispatchEvent(new Event("animationend"));
    expect(calls).toEqual(["panel"]);
  });

  it("disposes active and leaving $for slots when root cleanup interrupts animation", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const calls: string[] = [];
    const probeType = uniqueType("probeLeaveFor");
    const actionType = uniqueType("actionLeaveFor");
    registerDisposableProbe(probeType, calls);
    registerActionButton(actionType);

    const cleanup = mount({
      namespace: "structural_leave_for_" + Date.now(),
      g: {
        items: ["a", "b"],
      },
      layout: {
        [`${probeType}:row`]: {
          $for: "g.items",
          $key: "$value",
          $leave: "'slex-fade-out'",
          $content: "$item",
        },
        [`${actionType}:remove`]: {
          onclick: "g.items.splice(0, 1)",
        },
      },
    }, container);

    (container.querySelector(`.slex-${actionType}`) as HTMLButtonElement).click();
    const leaving = container.querySelector(".slex-fade-out")!;
    expect(calls).toEqual([]);

    cleanup();
    expect(calls).toEqual(["row", "row"]);
    expect(leaving.isConnected).toBe(false);

    leaving.dispatchEvent(new Event("animationend"));
    expect(calls).toEqual(["row", "row"]);
  });
});
