import { describe, it, expect } from "bun:test";
import { deepMerge } from "../../src/engine/merge";

describe("deepMerge", () => {
  it("merges flat objects", () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    deepMerge(target, source);
    expect(target).toEqual({ a: 1, b: 3, c: 4 });
  });

  it("merges nested objects recursively", () => {
    const target = { outer: { inner: 1, keep: 2 } };
    const source = { outer: { inner: 10, added: 3 } };
    deepMerge(target, source);
    expect(target.outer).toEqual({ inner: 10, keep: 2, added: 3 });
  });

  it("overrides functions", () => {
    const fn1 = () => 1;
    const fn2 = () => 2;
    const target = { fn: fn1, a: 1 };
    const source = { fn: fn2 };
    deepMerge(target, source);
    expect(target.fn).toBe(fn2);
    expect(target.a).toBe(1);
  });

  it("overrides arrays, does not merge", () => {
    const target = { items: [1, 2, 3] };
    const source = { items: [4, 5] };
    deepMerge(target, source);
    expect(target.items).toEqual([4, 5]);
  });

  it("overrides null/primitive values", () => {
    const target = { x: 1, y: null };
    const source = { x: null, y: 42 };
    deepMerge(target, source);
    expect(target).toEqual({ x: null, y: 42 });
  });

  it("does not mutate source object", () => {
    const target = { a: 1 };
    const source = { a: 2, b: { c: 3 } };
    const frozen = { ...source };
    deepMerge(target, source);
    expect(source).toEqual(frozen);
  });

  it("handles empty source", () => {
    const target = { a: 1 };
    deepMerge(target, {});
    expect(target).toEqual({ a: 1 });
  });

  it("handles empty target with source data", () => {
    const target: Record<string, unknown> = {};
    deepMerge(target, { a: 1, b: { c: 2 } });
    expect(target).toEqual({ a: 1, b: { c: 2 } });
  });
});
