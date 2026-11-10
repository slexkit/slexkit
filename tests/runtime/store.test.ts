import { describe, expect, it } from "bun:test";
import { cloneJsonValue, isJsonValue } from "../../src/html/protocol";

describe("artifact shared-state data boundary", () => {
  it("copies JSON state without a process-global namespace store", () => {
    const seed = { count: 1, nested: { value: "a" } };
    const left = cloneJsonValue(seed); const right = cloneJsonValue(seed);
    left.nested.value = "changed";
    expect(right.nested.value).toBe("a");
  });

  it("rejects functions, accessors, cycles and prototype keys", () => {
    const cyclic: Record<string, unknown> = {}; cyclic.self = cyclic;
    expect(isJsonValue({ fn() {} })).toBe(false);
    expect(isJsonValue(Object.defineProperty({}, "x", { enumerable: true, get: () => 1 }))).toBe(false);
    expect(isJsonValue(cyclic)).toBe(false);
    expect(isJsonValue(JSON.parse('{"__proto__":1}'))).toBe(false);
  });
});
