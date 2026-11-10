import { describe, expect, it } from "bun:test";
import { inspectSlexSource } from "../../src/html/inspect";
import { describeSlexElements } from "../../src/web-components";
import { registerToolTemplate, renderToolCall } from "../../src/toolhost";

describe("playground migration boundary", () => {
  it("does not ship the old DSL playground as a runtime custom element", () => {
    expect(describeSlexElements().map(item => item.tagName)).not.toContain("slex-playground");
    expect(inspectSlexSource('({layout:{"playground:demo":{}}})').diagnostic?.code)
      .toBe("legacy-object-source");
  });

  it("uses a trusted DOM factory for custom interactive previews", () => {
    registerToolTemplate("playground-dom-factory", (_args, runtime, _call, document) => {
      const button = document.createElement("button");
      button.textContent = "Complete";
      button.addEventListener("click", () => runtime.submit({ complete: true }));
      return button;
    });
    const container = document.createElement("div"); document.body.replaceChildren(container);
    const handle = renderToolCall({ name: "playground-dom-factory" }, container);
    container.querySelector("button")!.click();
    return expect(handle.promise).resolves.toMatchObject({ value: { complete: true } });
  });
});
