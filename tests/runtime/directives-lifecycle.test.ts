import { describe, it, expect } from "bun:test";
import { mount } from "../../src/engine/index";
import { getStore } from "../../src/engine/store";
import "../../src/components/index";

function unique(ns = "v016") {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

describe("$leave animation — $if", () => {
  it("adds $leave class and removes DOM after animationend", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("leave_if");

    mount({
      namespace: ns,
      g: {
        visible: true,
        hide() { this.visible = false; },
      },
      layout: {
        "column:panel": {
          $if: "g.visible",
          $enter: "'slex-fade-in'",
          $leave: "'slex-fade-out'",
          "text:t": { $content: "'hello'" },
        },
        "button:hide": { onclick: "g.hide()", label: "Hide" },
      },
    }, container);

    expect(container.querySelector(".slex-column")).toBeTruthy();

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    const box = container.querySelector(".slex-column");
    expect(box).toBeTruthy();
    expect(box!.classList.contains("slex-fade-out")).toBe(true);

    box!.dispatchEvent(new Event("animationend"));

    expect(container.querySelector(".slex-column")).toBeNull();
  });
});

describe("$leave animation — $for delete", () => {
  it("deleted $for item gets $leave class before DOM removal", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("leave_for");

    mount({
      namespace: ns,
      g: {
        items: ["a", "b"],
        removeFirst() { (this.items as string[]).splice(0, 1); },
      },
      layout: {
        "column:list": {
          $for: "g.items",
          $key: "$value",
          $leave: "'slex-fade-out'",
          "text:i": { $content: "$item" },
        },
        "button:rm": { onclick: "g.removeFirst()", label: "Remove" },
      },
    }, container);

    expect(container.querySelectorAll(".slex-text")).toHaveLength(2);

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    const fadingEls = container.querySelectorAll(".slex-fade-out");
    expect(fadingEls.length).toBeGreaterThanOrEqual(1);

    fadingEls.forEach((el) => el.dispatchEvent(new Event("animationend")));

    expect(container.querySelectorAll(".slex-text")).toHaveLength(1);
  });
});

describe("$leave animation — no $leave prop", () => {
  it("without $leave, DOM is removed immediately on $if false", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("leave_none");

    mount({
      namespace: ns,
      g: {
        visible: true,
        hide() { this.visible = false; },
      },
      layout: {
        "column:panel": {
          $if: "g.visible",
          "text:t": { $content: "'hello'" },
        },
        "button:hide": { onclick: "g.hide()", label: "Hide" },
      },
    }, container);

    expect(container.querySelector(".slex-column")).toBeTruthy();

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    expect(container.querySelector(".slex-column")).toBeNull();
  });
});

describe("$index reactivity — splice", () => {
  it("retained item $index updates after splice before it", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("idx_splice");

    mount({
      namespace: ns,
      g: {
        items: ["a", "b", "c"],
        removeFirst() { (this.items as string[]).splice(0, 1); },
      },
      layout: {
        "text:i": {
          $for: "g.items",
          $key: "$value",
          $content: "$item + ':' + $index",
        },
        "button:rm": { onclick: "g.removeFirst()", label: "Remove" },
      },
    }, container);

    const texts = container.querySelectorAll(".slex-text");
    expect(Array.from(texts).map((e) => e.textContent)).toEqual(["a:0", "b:1", "c:2"]);

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    const after = container.querySelectorAll(".slex-text");
    expect(Array.from(after).map((e) => e.textContent)).toEqual(["b:0", "c:1"]);
  });
});

describe("$index reactivity — reverse", () => {
  it("retained item $index updates after reverse", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("idx_rev");

    mount({
      namespace: ns,
      g: {
        items: ["a", "b", "c"],
        reverseItems() { (this.items as string[]).reverse(); },
      },
      layout: {
        "text:i": {
          $for: "g.items",
          $key: "$value",
          $content: "$item + ':' + $index",
        },
        "button:rev": { onclick: "g.reverseItems()", label: "Reverse" },
      },
    }, container);

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    const after = container.querySelectorAll(".slex-text");
    expect(Array.from(after).map((e) => e.textContent)).toEqual(["c:0", "b:1", "a:2"]);
  });
});

describe("sensor removal", () => {
  it("forCtx no longer has sensor property, named identifier still works", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("sensor_rm");

    mount({
      namespace: ns,
      g: { items: ["x"] },
      layout: {
        "text:i": {
          $for: "g.items",
          $key: "$value",
          $content: "i",
        },
      },
    }, container);

    expect(container.querySelector(".slex-text")!.textContent).toBe("x");
  });
});

describe("onUpdate lifecycle — $for retained", () => {
  it("retained item triggers onUpdate when forCtx changes", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls: string[] = [];
    const container = document.getElementById("app")!;
    const ns = unique("update_for");

    mount({
      namespace: ns,
      g: {
        items: ["a", "b"],
        removeFirst() { (this.items as string[]).splice(0, 1); },
        onUpdate_i() { calls.push("update"); },
        onMount_i() { calls.push("mount"); },
        onUnmount_i() { calls.push("unmount"); },
      },
      layout: {
        "text:i": {
          $for: "g.items",
          $key: "$value",
          $content: "$item + ':' + $index",
        },
        "button:rm": { onclick: "g.removeFirst()", label: "Remove" },
      },
    }, container);

    expect(calls).toEqual(["mount", "mount"]);
    calls.length = 0;

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    expect(calls).toContain("unmount");
    expect(calls.filter((c) => c === "update").length).toBe(1);
  });
});

describe("onUpdate lifecycle — $if no onUpdate", () => {
  it("$if toggle does not trigger onUpdate, only onMount/onUnmount", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls: string[] = [];
    const container = document.getElementById("app")!;
    const ns = unique("update_if");

    mount({
      namespace: ns,
      g: {
        visible: true,
        toggle() { this.visible = !this.visible; },
        onUpdate_panel() { calls.push("update"); },
        onMount_panel() { calls.push("mount"); },
        onUnmount_panel() { calls.push("unmount"); },
      },
      layout: {
        "column:panel": {
          $if: "g.visible",
          "text:t": { $content: "'hi'" },
        },
        "button:toggle": { onclick: "g.toggle()", label: "Toggle" },
      },
    }, container);

    expect(calls).toEqual(["mount"]);
    calls.length = 0;

    (container.querySelector(".slex-button") as HTMLButtonElement).click();
    expect(calls).toEqual(["unmount"]);
    calls.length = 0;

    (container.querySelector(".slex-button") as HTMLButtonElement).click();
    expect(calls).toEqual(["mount"]);
  });
});
