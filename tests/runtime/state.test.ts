import { describe, it, expect } from "bun:test";
import { disposeNamespace, mount } from "../../src/engine/index";
import "../../src/components/index";

function sleep(ms = 30) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("layout replacement semantics", () => {
  it("replaces the old DOM when a new layout is mounted", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = "layout_replace_" + Date.now();

    mount({
      namespace: ns,
      g: { label: "v1" },
      layout: { "text:x": { $content: "g.label" } },
    }, container);
    const first = container.querySelectorAll(".slex-text");
    expect(first).toHaveLength(1);
    expect(first[0].textContent).toBe("v1");

    mount({
      namespace: ns,
      g: { label: "v2" },
      layout: { "text:y": { $content: "g.label" } },
    }, container);
    const second = container.querySelectorAll(".slex-text");
    expect(second).toHaveLength(1);
    expect(second[0].textContent).toBe("v2");
  });

  it("merges g across layouts while replacing the view", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = "layout_accum_" + Date.now();

    mount({
      namespace: ns,
      g: { count: 1 },
      layout: { "text:a": { $content: "'a:' + g.count" } },
    }, container);
    expect(container.querySelector(".slex-text")?.textContent).toBe("a:1");

    mount({
      namespace: ns,
      g: { extra: 100 },
      layout: { "text:b": { $content: "'b:' + g.count + '+' + g.extra" } },
    }, container);
    const texts = container.querySelectorAll(".slex-text");
    expect(texts).toHaveLength(1);
    expect(texts[0].textContent).toBe("b:1+100");
  });
});

describe("namespace disposal", () => {
  it("keeps namespace state after ordinary mount cleanup", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = `cleanup_keeps_state_${Date.now()}`;

    const cleanup = mount({
      namespace: ns,
      g: { label: "first" },
      layout: {
        "input:name": { value: "seed" },
        "text:echo": { $text: "g.label + ':' + name.value" },
      },
    }, container);

    const input = container.querySelector(".slex-input") as HTMLInputElement;
    input.value = "edited";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep();
    cleanup();

    mount({
      namespace: ns,
      g: {},
      layout: {
        "input:name": { value: "new-seed" },
        "text:echo": { $text: "g.label + ':' + name.value" },
      },
    }, container);

    await sleep();
    expect(container.querySelector(".slex-text")?.textContent).toBe("first:edited");
    disposeNamespace(ns);
  });

  it("disposes mounted roots and resets g plus component instance state", async () => {
    document.body.innerHTML = '<div id="app1"></div><div id="app2"></div>';
    const c1 = document.getElementById("app1")!;
    const c2 = document.getElementById("app2")!;
    const ns = `dispose_namespace_${Date.now()}`;

    mount({
      namespace: ns,
      g: { label: "old" },
      layout: {
        "input:name": { value: "old-input" },
        "text:echo": { $text: "g.label + ':' + name.value" },
      },
    }, c1);
    mount({
      namespace: ns,
      g: {},
      layout: {
        "text:second": { text: "second" },
      },
    }, c2);

    const input = c1.querySelector(".slex-input") as HTMLInputElement;
    input.value = "edited";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await sleep();

    disposeNamespace(ns);

    expect(c1.querySelector(".slexkit-root")).toBeNull();
    expect(c2.querySelector(".slexkit-root")).toBeNull();

    mount({
      namespace: ns,
      g: { label: "new" },
      layout: {
        "input:name": { value: "fresh" },
        "text:echo": { $text: "g.label + ':' + name.value" },
      },
    }, c1);

    await sleep();
    expect(c1.querySelector(".slex-text")?.textContent).toBe("new:fresh");
    expect((c1.querySelector(".slex-input") as HTMLInputElement).value).toBe("fresh");
    disposeNamespace(ns);
  });
});

describe("multi-stream namespace merges", () => {
  it("keeps state across repeated mounts in the same namespace", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const ns = "stream_stable_" + Date.now();

    mount({ namespace: ns, g: { a: 1 }, layout: { "text:x": { $content: "g.a" } } }, container);
    mount({ namespace: ns, g: { b: 2 }, layout: { "text:x": { $content: "g.a + '+' + g.b" } } }, container);
    mount({ namespace: ns, g: { c: 3 }, layout: { "text:x": { $content: "g.a + '+' + g.b + '+' + g.c" } } }, container);

    expect(container.querySelector(".slex-text")?.textContent).toBe("1+2+3");
  });

  it("keeps different namespaces isolated", () => {
    document.body.innerHTML = '<div id="app1"></div><div id="app2"></div>';
    const ns = "ns_isolate_" + Date.now();

    mount({ namespace: ns + "_a", g: { val: "A" }, layout: { "text:x": { $content: "g.val" } } }, document.getElementById("app1")!);
    mount({ namespace: ns + "_b", g: { val: "B" }, layout: { "text:x": { $content: "g.val" } } }, document.getElementById("app2")!);

    expect(document.getElementById("app1")!.querySelector(".slex-text")?.textContent).toBe("A");
    expect(document.getElementById("app2")!.querySelector(".slex-text")?.textContent).toBe("B");
  });
});

describe("g method this binding", () => {
  it("lets normal functions read and write state through this", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const dsl = {
      namespace: "g_this_" + Date.now(),
      g: {
        count: 5,
        multiplier: 3,
        computed() { return (this.count as number) * (this.multiplier as number); },
        doubleCount() { this.count = (this.count as number) * 2; },
      },
      layout: {
        "text:val": { $content: "g.computed()" },
        "button:double": {
          onclick: "g.doubleCount()",
          label: "x2",
        },
      },
    };
    mount(dsl, document.getElementById("app")!);

    const textEl = document.querySelector(".slex-text");
    expect(textEl?.textContent).toBe("15");

    const btn = document.querySelector(".slex-button") as HTMLButtonElement;
    btn.click();
    expect(textEl?.textContent).toBe("30");
  });

  it("does not bind this for arrow functions", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const dsl = {
      namespace: "g_arrow_" + Date.now(),
      g: {
        count: 10,
        arrowComputed: () => "static",
      },
      layout: {
        "text:x": { $content: "g.arrowComputed()" },
      },
    };
    mount(dsl, document.getElementById("app")!);
    expect(document.querySelector(".slex-text")?.textContent).toBe("static");
  });
});

describe("array reactivity", () => {
  it("updates $for output after push inside a g method", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const dsl = {
      namespace: "arr_push_" + Date.now(),
      g: {
        items: ["a"],
        addItem() { (this.items as string[]).push("b"); },
      },
      layout: {
        "column:": {
          $for: "g.items",
          $key: "$value",
          "text:": { $content: "$item" },
        },
        "button:add": {
          onclick: "g.addItem()",
          label: "Add",
        },
      },
    };
    mount(dsl, container);

    let texts = container.querySelectorAll(".slex-text");
    expect(texts).toHaveLength(1);
    expect(texts[0].textContent).toBe("a");

    const btn = container.querySelector(".slex-button") as HTMLButtonElement;
    btn.click();

    texts = container.querySelectorAll(".slex-text");
    expect(texts).toHaveLength(2);
    expect(Array.from(texts).map((e) => e.textContent)).toEqual(["a", "b"]);
  });

  it("updates $for output after splice removes an item", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const dsl = {
      namespace: "arr_splice_" + Date.now(),
      g: {
        items: ["x", "y", "z"],
        removeFirst() { (this.items as string[]).splice(0, 1); },
      },
      layout: {
        "column:": {
          $for: "g.items",
          $key: "$value",
          "text:": { $content: "$item" },
        },
        "button:rm": {
          onclick: "g.removeFirst()",
          label: "Remove",
        },
      },
    };
    mount(dsl, container);

    let texts = container.querySelectorAll(".slex-text");
    expect(texts).toHaveLength(3);
    expect(Array.from(texts).map((e) => e.textContent)).toEqual(["x", "y", "z"]);

    const btn = container.querySelector(".slex-button") as HTMLButtonElement;
    btn.click();

    texts = container.querySelectorAll(".slex-text");
    expect(texts).toHaveLength(2);
    expect(Array.from(texts).map((e) => e.textContent)).toEqual(["y", "z"]);
  });
});
