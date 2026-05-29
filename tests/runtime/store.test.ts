import { describe, it, expect } from "bun:test";
import { getStore } from "../../src/engine/store";

describe("getStore", () => {

  it("returns a store with expected shape", () => {
    const store = getStore("test");
    expect(store).toHaveProperty("g");
    expect(store).toHaveProperty("layouts");
    expect(store).toHaveProperty("roots");
    expect(Array.isArray(store.layouts)).toBe(true);
    expect(store.roots instanceof Map).toBe(true);
  });

  it("returns the same store for the same namespace", () => {
    const a = getStore("shared");
    const b = getStore("shared");
    expect(a).toBe(b);
  });

  it("returns different stores for different namespaces", () => {
    const a = getStore("ns1");
    const b = getStore("ns2");
    expect(a).not.toBe(b);
  });

  it("uses 'default' namespace when none specified", () => {
    const store = getStore("default");
    expect(store).toBeDefined();
  });

  it("creates a mutable g that can be mutated", () => {
    const store = getStore("mutable_test");
    store.g.value = 42;
    expect(store.g.value).toBe(42);
  });
});
