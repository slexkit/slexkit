import { describe, it, expect, spyOn } from "bun:test";
import { mount } from "../../src/engine/index";
import "../../src/components/index";

const specTestExpression = {
  namespace: "spec_v0.1_test",
  g: {
    items: [1, 2, 3],
    nested: [
      { id: "a", vals: [10, 20] },
      { id: "b", vals: [30] },
    ],
    showList: true,
    counter: 0,
    threshold: 5,
  },
  layout: {
    "column:main": {
      "column:": {
        $for: "g.items",
        $key: "$value",
        "text:": {
          $content: "'Item: ' + $item",
        },
      },
      "column:outer": {
        $for: "g.nested",
        $key: "id",
        "text:outerLabel": { $label: "outer.id" },
        "column:inner": {
          $for: "outer.vals",
          $key: "$value",
          "text:val": {
            $content: "outer.id + ' -> ' + $item",
          },
        },
      },
      "column:conditionalList": {
        $if: "g.showList",
        "text:header": { $content: "'Visible'" },
        "column:list": {
          $for: "g.items",
          $key: "$value",
          "text:num": { $content: "$item" },
        },
      },
      "button:inc": {
        onclick: "g.counter++",
      },
      "text:counter": {
        $content: "'Count: ' + g.counter",
      },
      "text:error": {
        $content: "g.undefinedProp.nested",
      },
    },
  },
};

describe("anonymous $for with $item", () => {
  it("renders 3 text elements via anonymous $for", () => {
    document.body.innerHTML = '<div id="spec-app"></div>';
    const container = document.getElementById("spec-app")!;
    mount({ ...specTestExpression, namespace: specTestExpression.namespace + "_" + Date.now() }, container);

    const texts = container.querySelectorAll(".slex-text");
    const itemTexts = Array.from(texts)
      .map((el) => el.textContent)
      .filter((t) => t && t.startsWith("Item:"));
    expect(itemTexts).toEqual(["Item: 1", "Item: 2", "Item: 3"]);
  });
});

describe("nested $for with outer named identifier", () => {
  it("outer label shows outer id", () => {
    document.body.innerHTML = '<div id="spec-app"></div>';
    const container = document.getElementById("spec-app")!;
    mount({ ...specTestExpression, namespace: specTestExpression.namespace + "_" + Date.now() }, container);

    const allTexts = container.querySelectorAll(".slex-text");
    const labels = Array.from(allTexts).filter(
      (el) => el.textContent === "a" || el.textContent === "b",
    );
    expect(labels.length).toBe(2);
    expect(labels.map((e) => e.textContent)).toEqual(["a", "b"]);
  });

  it("inner val text combines outer.id and inner $item", () => {
    document.body.innerHTML = '<div id="spec-app"></div>';
    const container = document.getElementById("spec-app")!;
    mount({ ...specTestExpression, namespace: specTestExpression.namespace + "_" + Date.now() }, container);

    const allTexts = container.querySelectorAll(".slex-text");
    const valTexts = Array.from(allTexts)
      .map((el) => el.textContent)
      .filter((t) => t && t.includes("->"));
    expect(valTexts).toEqual(["a -> 10", "a -> 20", "b -> 30"]);
  });
});

describe("$if with $for combination", () => {
  it("renders conditional list when showList is true", () => {
    document.body.innerHTML = '<div id="spec-app"></div>';
    const container = document.getElementById("spec-app")!;
    mount({ ...specTestExpression, namespace: specTestExpression.namespace + "_" + Date.now() }, container);

    const headerEls = Array.from(container.querySelectorAll(".slex-text")).filter(
      (el) => el.textContent === "Visible",
    );
    expect(headerEls.length).toBe(1);

    const numEls = Array.from(container.querySelectorAll(".slex-text")).filter(
      (el) => /^[123]$/.test(el.textContent || ""),
    );
    expect(numEls.length).toBe(3);
    expect(numEls.map((e) => e.textContent)).toEqual(["1", "2", "3"]);
  });

  it("does not render conditional content when showList is false", () => {
    document.body.innerHTML = '<div id="spec-app"></div>';
    const container = document.getElementById("spec-app")!;
    const dsl = {
      ...specTestExpression,
      namespace: specTestExpression.namespace + "_" + Date.now(),
      g: { ...specTestExpression.g, showList: false },
    };
    mount(dsl, container);

    const visibleTexts = Array.from(container.querySelectorAll(".slex-text"))
      .map((el) => el.textContent)
      .filter((t) => t === "Visible");
    expect(visibleTexts.length).toBe(0);
  });
});

describe("events and $event model", () => {
  it("button click increments counter and updates text", async () => {
    document.body.innerHTML = '<div id="spec-app"></div>';
    const container = document.getElementById("spec-app")!;
    const ns = specTestExpression.namespace + "_" + Date.now();

    const dsl = {
      ...specTestExpression,
      namespace: ns,
      g: { ...specTestExpression.g, counter: 0 },
    };
    mount(dsl, container);

    const counterText = Array.from(container.querySelectorAll(".slex-text")).find(
      (el) => el.textContent && el.textContent.startsWith("Count:"),
    );
    expect(counterText).toBeTruthy();
    expect(counterText!.textContent).toBe("Count: 0");

    const btn = container.querySelector(".slex-button") as HTMLButtonElement;
    expect(btn).toBeTruthy();

    // The button has text "inc" (from the component name)
    expect(btn.textContent?.trim()).toBe("inc");
    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(counterText!.textContent).toBe("Count: 1");
  });
});

describe("expression error handling", () => {
  it("undefined property access returns undefined and does not crash", () => {
    document.body.innerHTML = '<div id="spec-app"></div>';
    const container = document.getElementById("spec-app")!;

    const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});
    mount({ ...specTestExpression, namespace: specTestExpression.namespace + "_" + Date.now() }, container);

    const errorText = Array.from(container.querySelectorAll(".slex-text")).find(
      (el) => el.textContent === "" || el.textContent === "undefined",
    );
    expect(errorText).toBeTruthy();

    const root = container.querySelector(".slexkit-root");
    expect(root).toBeTruthy();

    consoleSpy.mockRestore();
  });
});
