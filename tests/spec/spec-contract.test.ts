import { describe, expect, it } from "bun:test";
import {
  boot,
  disposeNamespace,
  ingest,
  mount,
  register,
} from "../../src/engine/index";
import { SLEX_PROTOCOL_VERSION } from "../../src/version";
import "../../src/components/index";

function uniqueNamespace(prefix = "spec_contract"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function sleep(ms = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("SPEC contract: Slex envelope", () => {
  it("mounts full envelopes with namespace, g, and layout", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const namespace = uniqueNamespace("full_envelope");

    mount({
      slex: SLEX_PROTOCOL_VERSION,
      namespace,
      g: { message: "Envelope" },
      layout: {
        "text:message": { $text: "g.message" },
      },
    }, document.getElementById("app")!);

    expect(document.querySelector(".slexkit-root")?.getAttribute("data-namespace")).toBe(namespace);
    expect(document.querySelector(".slex-text")?.textContent).toBe("Envelope");
    disposeNamespace(namespace);
  });

  it("accepts the optional slex protocol marker without changing namespace behavior", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const namespace = uniqueNamespace("protocol_marker");

    mount({
      slex: SLEX_PROTOCOL_VERSION,
      namespace,
      layout: {
        "text:message": { text: "Protocol marked" },
      },
    }, document.getElementById("app")!);

    expect(document.querySelector(".slexkit-root")?.getAttribute("data-namespace")).toBe(namespace);
    expect(document.querySelector(".slex-text")?.textContent).toBe("Protocol marked");
    disposeNamespace(namespace);
  });

  it("normalizes protocol-marked bare component trees to the default namespace", () => {
    document.body.innerHTML = '<div id="app"></div>';
    disposeNamespace("default");

    mount({
      slex: SLEX_PROTOCOL_VERSION,
      "text:bare": { text: "Marked bare tree" },
    }, document.getElementById("app")!);

    expect(document.querySelector(".slexkit-root")?.getAttribute("data-namespace")).toBe("default");
    expect(document.querySelector(".slex-text")?.textContent).toBe("Marked bare tree");
    disposeNamespace("default");
  });

  it("normalizes bare component trees to the default namespace", () => {
    document.body.innerHTML = '<div id="app"></div>';
    disposeNamespace("default");

    mount({
      "text:bare": { text: "Bare tree" },
    }, document.getElementById("app")!);

    expect(document.querySelector(".slexkit-root")?.getAttribute("data-namespace")).toBe("default");
    expect(document.querySelector(".slex-text")?.textContent).toBe("Bare tree");
    disposeNamespace("default");
  });
});

describe("SPEC contract: props classification", () => {
  it("keeps static props literal and evaluates $ read-pipes", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const namespace = uniqueNamespace("props_read");

    mount({
      namespace,
      g: { message: "Dynamic text" },
      layout: {
        "text:literal": { text: "g.message" },
        "text:dynamic": { $text: "g.message" },
      },
    }, document.getElementById("app")!);

    const texts = Array.from(document.querySelectorAll(".slex-text")).map((node) => node.textContent);
    expect(texts).toEqual(["g.message", "Dynamic text"]);
    disposeNamespace(namespace);
  });

  it("executes on* write-pipes with $event data", async () => {
    document.body.innerHTML = '<div id="app"></div>';
    const namespace = uniqueNamespace("props_write");

    mount({
      namespace,
      g: { name: "Ada" },
      layout: {
        "input:name": {
          $value: "g.name",
          onchange: "g.name = String($event || '')",
        },
        "text:echo": { $text: "g.name" },
      },
    }, document.getElementById("app")!);

    const input = document.querySelector(".slex-input") as HTMLInputElement;
    input.value = "Grace";
    input.dispatchEvent(new InputEvent("input", { bubbles: true }));
    await sleep();

    expect(document.querySelector(".slex-text")?.textContent).toBe("Grace");
    disposeNamespace(namespace);
  });
});

describe("SPEC contract: merge semantics", () => {
  it("deep-merges g, replaces arrays, and replaces layout", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const namespace = uniqueNamespace("merge");

    mount({
      namespace,
      g: {
        nested: { a: 1 },
        list: [1, 2],
      },
      layout: {
        "text:first": { text: "First layout" },
      },
    }, container);

    mount({
      namespace,
      g: {
        nested: { b: 2 },
        list: [3],
      },
      layout: {
        "text:second": { $text: "g.nested.a + '/' + g.nested.b + '/' + g.list.join(',')" },
      },
    }, container);

    expect(container.textContent).not.toContain("First layout");
    expect(document.querySelector(".slex-text")?.textContent).toBe("1/2/3");
    disposeNamespace(namespace);
  });

  it("ingests state-only Slex without rendering", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const container = document.getElementById("app")!;
    const namespace = uniqueNamespace("ingest");

    expect(ingest({ namespace, g: { seeded: "ready" }, layout: {} })).toBe(true);
    expect(container.querySelector(".slexkit-root")).toBeNull();

    mount({
      namespace,
      g: {},
      layout: {
        "text:seeded": { $text: "g.seeded" },
      },
    }, container);

    expect(document.querySelector(".slex-text")?.textContent).toBe("ready");
    disposeNamespace(namespace);
  });
});

describe("SPEC contract: structural directives", () => {
  it("does not pass $if as a component prop", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const namespace = uniqueNamespace("if_props");
    const type = `specProbe${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
    let propKeys: string[] = [];

    register(type, (props, _name, ctx) => {
      propKeys = Object.keys(props).toSorted();
      const el = ctx.document.createElement("div");
      el.className = "slex-spec-probe";
      el.textContent = String(props.label);
      return el;
    });

    mount({
      namespace,
      g: { visible: true },
      layout: {
        [`${type}:visible`]: {
          $if: "g.visible",
          label: "Visible probe",
        },
      },
    }, document.getElementById("app")!);

    expect(document.querySelector(".slex-spec-probe")?.textContent).toBe("Visible probe");
    expect(propKeys).toEqual(["label"]);
    disposeNamespace(namespace);
  });

  it("exposes $item, $index, $key, and named $for aliases", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const namespace = uniqueNamespace("for_context");

    mount({
      namespace,
      g: {
        rows: [
          { id: "a", label: "Alpha" },
          { id: "b", label: "Beta" },
        ],
      },
      layout: {
        "text:row": {
          $for: "g.rows",
          $key: "id",
          $text: "$key + ':' + $index + ':' + $item.label + ':' + row.label",
        },
      },
    }, document.getElementById("app")!);

    expect(Array.from(document.querySelectorAll(".slex-text")).map((node) => node.textContent)).toEqual([
      "a:0:Alpha:Alpha",
      "b:1:Beta:Beta",
    ]);
    disposeNamespace(namespace);
  });
});

describe("SPEC contract: Markdown language handling", () => {
  it("boots only explicit slex fences", () => {
    document.body.innerHTML = `
      <pre><code class="language-slex">{
        namespace: "spec_markdown_slex",
        layout: { "text:message": { text: "Rendered" } }
      }</code></pre>
      <pre><code class="language-js">{ namespace: "not_slex" }</code></pre>
      <pre><code class="language-json">{ "namespace": "not_slex" }</code></pre>
      <pre><code>{ namespace: "untagged" }</code></pre>
      <pre><code class="language-slexkit">not mounted</code></pre>
    `;

    boot({ sourceControls: false });

    expect(document.querySelectorAll(".slexkit-card")).toHaveLength(1);
    expect(document.querySelector(".slexkit-root")?.textContent).toContain("Rendered");
    disposeNamespace("spec_markdown_slex");
  });
});

describe("SPEC contract: ToolHost boundary", () => {
  it("renders submit as a component without implicitly creating a tool call", () => {
    document.body.innerHTML = '<div id="app"></div>';
    const namespace = uniqueNamespace("submit_display");

    mount({
      namespace,
      g: { value: "display" },
      layout: {
        "card:panel": {
          title: "Display fence",
          "text:value": { $text: "g.value" },
          "submit:actions": {
            returnKeys: ["value"],
            submitLabel: "Send",
            ignoreLabel: "Skip",
          },
        },
      },
    }, document.getElementById("app")!);

    const buttons = Array.from(document.querySelectorAll(".slex-submit-bar .slex-button")) as HTMLButtonElement[];
    expect(document.querySelector(".slex-text")?.textContent).toBe("display");
    expect(buttons.map((button) => button.textContent)).toEqual(["Skip", "Send"]);

    for (const button of buttons) button.click();
    expect(document.querySelector(".slex-text")?.textContent).toBe("display");
    disposeNamespace(namespace);
  });
});
