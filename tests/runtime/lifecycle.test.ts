import { describe, expect, it } from "bun:test";
import { createRoot, onCleanup } from "../../src/engine/reactive";
import { mountSlexElement } from "../helpers";

describe("native lifecycle", () => {
  it("groups JavaScript cleanup with a reactive root", () => {
    const calls: string[] = [];
    const dispose = createRoot((dispose) => { onCleanup(() => calls.push("cleanup")); calls.push("mount"); return dispose; });
    expect(calls).toEqual(["mount"]); dispose(); dispose(); expect(calls).toEqual(["mount", "cleanup"]);
  });

  it("disconnects and reconnects the same custom-element instance", async () => {
    const input = mountSlexElement("input", { value: "edited" }); const native = input.shadowRoot!.querySelector("input");
    input.remove(); await Promise.resolve(); document.body.append(input);
    expect(input.value).toBe("edited"); expect(input.shadowRoot!.querySelector("input")).not.toBe(native);
  });
});
