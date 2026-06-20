import { describe, it, expect } from "bun:test";
import { mount, register } from "../../src/engine/index";
import "../../src/components/index";

function unique(ns = "v015") {
  return `${ns}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function getTextArray(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll(".slex-text")).map((e) => e.textContent ?? "");
}

/** Get unique DOM element references for each text item, keyed by content */
function getTextElementMap(container: HTMLElement): Map<string, Element> {
  const map = new Map();
  container.querySelectorAll(".slex-text").forEach((el) => {
    map.set(el.textContent, el);
  });
  return map;
}

describe("$for key-based diff — add", () => {
  it("renders repeated items as direct layout children without a wrapper element", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;

    mount({
      namespace: unique("diff_direct_children"),
      g: { items: ["a", "b", "c"] },
      layout: {
        "grid:list": {
          columns: 3,
          "text:i": {
            $for: "g.items",
            $key: "$value",
            $content: "$item",
          },
        },
      },
    }, container);

    const grid = container.querySelector(".slex-grid")!;
    expect(Array.from(grid.children).map((child) => child.className)).toEqual(["slex-text", "slex-text", "slex-text"]);
    expect(container.querySelector(".slexkit-for-wrapper")).toBeNull();
  });

  it("does not retain slots when a custom renderer returns no element", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const type = unique("void_renderer");
    register(type, () => {});

    const cleanup = mount({
      namespace: unique("diff_void_renderer"),
      g: { items: ["a", "b"] },
      layout: {
        [`${type}:item`]: {
          $for: "g.items",
          $key: "$value",
        },
      },
    }, container);

    expect(container.querySelector(".slexkit-for-wrapper")).toBeNull();
    expect(container.querySelector(".slex-layout")!.children).toHaveLength(0);
    expect(() => cleanup()).not.toThrow();
  });

  it("push adds only new DOM, existing items unchanged", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("diff_add");

    mount({
      namespace: ns,
      g: {
        items: ["a", "b"],
        addItem() { (this.items as string[]).push("c"); },
      },
      layout: {
        "column:list": {
          $for: "g.items",
          $key: "$value",
          "text:i": { $content: "$item" },
        },
        "button:add": { onclick: "g.addItem()", label: "Add" },
      },
    }, container);

    const preMap = getTextElementMap(container);
    expect(preMap.size).toBe(2);
    expect(Array.from(preMap.keys()).sort()).toEqual(["a", "b"]);

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    const texts = container.querySelectorAll(".slex-text");
    expect(texts).toHaveLength(3);
    expect(getTextArray(container)).toEqual(["a", "b", "c"]);

    const postMap = getTextElementMap(container);
    expect(postMap.get("a")).toBe(preMap.get("a"));
    expect(postMap.get("b")).toBe(preMap.get("b"));
  });
});

describe("$for key-based diff — remove", () => {
  it("splice removes only deleted DOM, others unchanged", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("diff_rm");

    mount({
      namespace: ns,
      g: {
        items: ["a", "b", "c"],
        removeFirst() { (this.items as string[]).splice(0, 1); },
      },
      layout: {
        "column:list": {
          $for: "g.items",
          $key: "$value",
          "text:i": { $content: "$item" },
        },
        "button:rm": { onclick: "g.removeFirst()", label: "Remove" },
      },
    }, container);

    const preMap = getTextElementMap(container);
    expect(preMap.size).toBe(3);

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    const texts = container.querySelectorAll(".slex-text");
    expect(texts).toHaveLength(2);
    expect(getTextArray(container)).toEqual(["b", "c"]);

    const postMap = getTextElementMap(container);
    expect(postMap.get("b")).toBe(preMap.get("b"));
    expect(postMap.get("c")).toBe(preMap.get("c"));
  });
});

describe("$for key-based diff — modify content", () => {
  it("replacing item property updates content, same DOM", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("diff_mod");

    mount({
      namespace: ns,
      g: {
        items: [{ id: 1, label: "old" }],
        updateFirst() { (this.items as Record<string, unknown>[])[0].label = "new"; },
      },
      layout: {
        "column:list": {
          $for: "g.items",
          $key: "id",
          "text:i": { $content: "$item.label" },
        },
        "button:update": { onclick: "g.updateFirst()", label: "Update" },
      },
    }, container);

    const el = container.querySelector(".slex-text")!;

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    expect(container.querySelectorAll(".slex-text")).toHaveLength(1);
    expect(container.querySelector(".slex-text")!.textContent).toBe("new");
    expect(container.querySelector(".slex-text")).toBe(el);
  });
});

describe("$for key-based diff — reorder", () => {
  it("reverse array retains DOM elements, order follows", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("diff_sort");

    mount({
      namespace: ns,
      g: {
        items: ["a", "b", "c"],
        reverseItems() { (this.items as string[]).reverse(); },
      },
      layout: {
        "column:list": {
          $for: "g.items",
          $key: "$value",
          "text:i": { $content: "$item" },
        },
        "button:rev": { onclick: "g.reverseItems()", label: "Reverse" },
      },
    }, container);

    const preMap = getTextElementMap(container);
    expect(getTextArray(container)).toEqual(["a", "b", "c"]);

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    const texts = container.querySelectorAll(".slex-text");
    expect(texts).toHaveLength(3);
    expect(getTextArray(container)).toEqual(["c", "b", "a"]);

    const postMap = getTextElementMap(container);
    expect(postMap.get("a")).toBe(preMap.get("a"));
    expect(postMap.get("b")).toBe(preMap.get("b"));
    expect(postMap.get("c")).toBe(preMap.get("c"));
  });
});

describe("$for key-based diff — mixed operations", () => {
  it("simultaneous add, remove, reorder via batch", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("diff_mix");

    mount({
      namespace: ns,
      g: {
        items: [
          { id: 1, val: "a" },
          { id: 2, val: "b" },
          { id: 3, val: "c" },
        ],
        replaceAll() {
          (this.items as Record<string, unknown>[]).splice(0, this.items.length,
            { id: 4, val: "d" },
            { id: 3, val: "c" },
            { id: 1, val: "a" },
            { id: 5, val: "e" },
          );
        },
      },
      layout: {
        "column:list": {
          $for: "g.items",
          $key: "id",
          "text:i": { $content: "$item.val" },
        },
        "button:go": { onclick: "g.replaceAll()", label: "Go" },
      },
    }, container);

    const preMap = getTextElementMap(container);

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    const texts = container.querySelectorAll(".slex-text");
    expect(texts).toHaveLength(4);
    expect(Array.from(texts).map((e) => e.textContent)).toEqual(["d", "c", "a", "e"]);

    const postMap = getTextElementMap(container);
    expect(postMap.get("c")).toBe(preMap.get("c"));
    expect(postMap.get("a")).toBe(preMap.get("a"));
    expect(postMap.get("b")).toBeUndefined();
    expect(postMap.get("d")).toBeTruthy();
    expect(postMap.get("e")).toBeTruthy();
  });
});

describe("$for key-based diff — empty array lifecycle", () => {
  it("add first, clear all, add again", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("diff_empty");

    mount({
      namespace: ns,
      g: {
        items: [] as string[],
        addOne() { (this.items as string[]).push("x"); },
        clearAll() { (this.items as string[]).length = 0; },
      },
      layout: {
        "column:list": {
          $for: "g.items",
          $key: "$value",
          "text:i": { $content: "$item" },
        },
        "button:add": { onclick: "g.addOne()", label: "Add" },
        "button:clear": { onclick: "g.clearAll()", label: "Clear" },
      },
    }, container);

    expect(container.querySelectorAll(".slex-text")).toHaveLength(0);

    (container.querySelectorAll(".slex-button")[0] as HTMLButtonElement).click();
    expect(container.querySelectorAll(".slex-text")).toHaveLength(1);

    (container.querySelectorAll(".slex-button")[1] as HTMLButtonElement).click();
    expect(container.querySelectorAll(".slex-text")).toHaveLength(0);

    (container.querySelectorAll(".slex-button")[0] as HTMLButtonElement).click();
    expect(container.querySelectorAll(".slex-text")).toHaveLength(1);
    expect(container.querySelector(".slex-text")!.textContent).toBe("x");
  });
});

describe("$for key-based diff — focus retention", () => {
  it("input in $for retains focus after sibling changes", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("diff_focus");

    mount({
      namespace: ns,
      g: {
        items: ["a", "b"],
        addItem() { (this.items as string[]).push("c"); },
      },
      layout: {
        "column:list": {
          $for: "g.items",
          $key: "$value",
          "text:i": { $content: "$item" },
        },
        "button:add": { onclick: "g.addItem()", label: "Add" },
      },
    }, container);

    const texts = container.querySelectorAll(".slex-text");
    (texts[1] as HTMLElement).setAttribute("tabindex", "-1");
    (texts[1] as HTMLElement).focus();
    expect(document.activeElement).toBe(texts[1]);

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    const newTexts = container.querySelectorAll(".slex-text");
    expect(newTexts).toHaveLength(3);
    expect(newTexts[1]).toBe(texts[1]);
    expect(document.activeElement).toBe(texts[1]);
  });
});

describe("$for key-based diff — lifecycle hooks", () => {
  it("only removed items trigger onUnmount, only new items trigger onMount", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const calls: string[] = [];
    const container = document.getElementById("app")!;
    const ns = unique("diff_lc");

    mount({
      namespace: ns,
      g: {
        items: ["a", "b", "c"],
        removeFirst() { (this.items as string[]).splice(0, 1); },
        addItem() { (this.items as string[]).push("d"); },
        onMount_i() { calls.push("mount"); },
        onUnmount_i() { calls.push("unmount"); },
      },
      layout: {
        "text:i": {
          $for: "g.items",
          $key: "$value",
          $content: "$item",
        },
        "button:rm": { onclick: "g.removeFirst()", label: "Remove" },
        "button:add": { onclick: "g.addItem()", label: "Add" },
      },
    }, container);

    expect(calls).toEqual(["mount", "mount", "mount"]);
    calls.length = 0;

    (container.querySelectorAll(".slex-button")[0] as HTMLButtonElement).click();
    expect(calls).toEqual(["unmount"]);
    calls.length = 0;

    (container.querySelectorAll(".slex-button")[1] as HTMLButtonElement).click();
    expect(calls).toEqual(["mount"]);
  });
});

describe("$for key-based diff — primitive without $key", () => {
  it("falls back to index, still works", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("diff_nokey");

    mount({
      namespace: ns,
      g: {
        items: ["x", "y"],
        addItem() { (this.items as string[]).push("z"); },
      },
      layout: {
        "column:list": {
          $for: "g.items",
          "text:i": { $content: "$item" },
        },
        "button:add": { onclick: "g.addItem()", label: "Add" },
      },
    }, container);

    expect(container.querySelectorAll(".slex-text")).toHaveLength(2);

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    expect(container.querySelectorAll(".slex-text")).toHaveLength(3);
    expect(getTextArray(container)).toEqual(["x", "y", "z"]);
  });
});

describe("$for key-based diff — nested $for", () => {
  it("outer list changes, inner lists preserve retained items", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = unique("diff_nest");

    mount({
      namespace: ns,
      g: {
        groups: [
          { id: "g1", vals: [1, 2] },
          { id: "g2", vals: [3] },
        ],
        addToFirst() {
          const g = (this.groups as Record<string, unknown>[])[0];
          (g.vals as number[]).push(99);
        },
      },
      layout: {
        "column:outer": {
          $for: "g.groups",
          $key: "id",
          "text:outerLabel": { "$content": "$item.id" },
          "column:inner": {
            $for: "$item.vals",
            $key: "$value",
            "text:val": { "$content": "'v:' + $item" },
          },
        },
        "button:push": { onclick: "g.addToFirst()", label: "AddInner" },
      },
    }, container);

    const innerTexts = container.querySelectorAll(".slex-text");
    expect(Array.from(innerTexts).map((e) => e.textContent)).toEqual(["g1", "v:1", "v:2", "g2", "v:3"]);

    (container.querySelector(".slex-button") as HTMLButtonElement).click();

    const after = container.querySelectorAll(".slex-text");
    expect(Array.from(after).map((e) => e.textContent)).toEqual(["g1", "v:1", "v:2", "v:99", "g2", "v:3"]);
    expect(after).toHaveLength(6);
    expect(after[0]).toBe(innerTexts[0]);
    expect(after[1]).toBe(innerTexts[1]);
    expect(after[2]).toBe(innerTexts[2]);
    expect(after[4]).toBe(innerTexts[3]);
    expect(after[5]).toBe(innerTexts[4]);
  });
});
