import { describe, expect, it } from "bun:test";
import { mountSlexElement } from "../helpers";

describe("Svelte implementation through the Web Components facade", () => {
  it("updates an existing instance and stops reacting after permanent removal", async () => {
    const input = mountSlexElement("input", { value: "seed", label: "Original" });
    const native = input.shadowRoot!.querySelector("input")!;
    input.label = "Updated";
    expect(input.shadowRoot!.querySelector("input")).toBe(native);
    input.remove();
    await Promise.resolve();
    input.label = "Detached";
    expect(input.isConnected).toBe(false);
  });

  it("uses the owning foreign document for events and rendering", () => {
    const frame = document.createElement("iframe"); document.body.replaceChildren(frame);
    const foreign = frame.contentDocument!;
    const host = foreign.createElement("div"); foreign.body.append(host);
    const input = mountSlexElement("input", { value: "local" });
    host.append(foreign.adoptNode(input));
    expect(input.ownerDocument).toBe(foreign);
  });
});
