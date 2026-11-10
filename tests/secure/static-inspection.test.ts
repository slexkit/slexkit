import { describe, expect, it } from "bun:test";
import { inspectSlexSource, validateSlexSource } from "../../src/html/inspect";

describe("non-executing HTML source inspection", () => {
  for (const script of [
    "globalThis.__inspectionProbe = 42",
    "while (true) {}",
    "Object.defineProperty({}, 'x', {get(){globalThis.__inspectionProbe=42}})",
  ]) {
    it(`parses without executing ${script.slice(0, 45)}`, () => {
      const result = validateSlexSource(`<slex-text text="ok"></slex-text><script>${script}</script>`);
      expect(result.ok).toBe(true);
      expect(globalThis).not.toHaveProperty("__inspectionProbe");
    });
  }

  it("rejects the removed object language and active parent-page content", () => {
    expect(inspectSlexSource('{g:{value:1},layout:{"text:x":{text:"ok"}}}').diagnostic?.code)
      .toBe("legacy-object-source");
    const result = validateSlexSource('<button onclick="bad()">Bad</button><iframe></iframe>');
    expect(result.valid).toBe(false);
    expect(result.errors.map(item => item.code)).toEqual(
      expect.arrayContaining(["inline-event-handler", "active-embedded-content"]),
    );
  });

  it("handles prototype-like attributes as inert strings", () => {
    const result = inspectSlexSource('<div data-key="__proto__">safe</div>');
    expect(result.ok).toBe(true);
    expect(Reflect.get({}, "polluted")).toBeUndefined();
  });
});
