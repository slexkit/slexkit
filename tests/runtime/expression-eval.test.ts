import { describe, it, expect, spyOn } from "bun:test";
import { evalRead, execWrite } from "../../src/engine/eval";
import { disposeNamespace } from "../../src/engine/index";

describe("expression reads", () => {
  it("evaluates a simple expression reading g", () => {
    const g = { count: 42 };
    const result = evalRead("g.count", { g });
    expect(result).toBe(42);
  });

  it("evaluates an expression with $item variable", () => {
    const g = {};
    const result = evalRead("$item.val", { g, $item: { name: "test", val: 85 } });
    expect(result).toBe(85);
  });

  it("evaluates combined g and for variables expression", () => {
    const g = { offset: 5 };
    const result = evalRead("$item.threshold + g.offset", { g, $item: { threshold: 80 } });
    expect(result).toBe(85);
  });

  it("evaluates ternary expression", () => {
    const g = { x: 10 };
    const result = evalRead("g.x > 5 ? 'big' : 'small'", { g });
    expect(result).toBe("big");
  });

  it("evaluates basic type $item", () => {
    const g = {};
    const result = evalRead("'Item: ' + $item", { g, $item: 42 });
    expect(result).toBe("Item: 42");
  });

  it("evaluates with named identifier", () => {
    const g = {};
    const result = evalRead("sensor.val", {
      g,
      sensor: { val: 85 },
      $item: { val: 99 },
    });
    expect(result).toBe(85);
  });

  it("inner for shadows outer variables", () => {
    const g = {};
    const result = evalRead("$item", {
      g,
      outer: { id: "a" },
      $item: { val: 10 },
      $index: 1,
      $key: "x",
    });
    expect(result).toEqual({ val: 10 });
  });

  it("returns undefined and warns on error", () => {
    const g = {};
    const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});
    const result = evalRead("g.nonexistent.foo", { g });
    expect(result).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("returns the last good value for the same namespace path after an error", () => {
    const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});
    const ns = `eval_cache_${Date.now()}`;
    const path = "text:x:$text";

    expect(evalRead("g.value.toFixed(0)", { g: { value: 7 } }, ns, path)).toBe("7");
    expect(evalRead("g.value.toFixed(0)", { g: { value: null } }, ns, path)).toBe("7");

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
    disposeNamespace(ns);
  });

  it("clears namespace-scoped last good values when the namespace is disposed", () => {
    const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});
    const ns = `eval_dispose_${Date.now()}`;
    const path = "text:x:$text";

    expect(evalRead("g.value.toFixed(0)", { g: { value: 9 } }, ns, path)).toBe("9");
    disposeNamespace(ns);
    expect(evalRead("g.value.toFixed(0)", { g: { value: null } }, ns, path)).toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("keeps last good values isolated by namespace", () => {
    const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});
    const base = `eval_isolate_${Date.now()}`;
    const path = "text:x:$text";

    expect(evalRead("g.value.label", { g: { value: { label: "A" } } }, `${base}_a`, path)).toBe("A");
    expect(evalRead("g.value.label", { g: { value: { label: "B" } } }, `${base}_b`, path)).toBe("B");
    expect(evalRead("g.value.label", { g: { value: null } }, `${base}_a`, path)).toBe("A");
    expect(evalRead("g.value.label", { g: { value: null } }, `${base}_b`, path)).toBe("B");

    consoleSpy.mockRestore();
    disposeNamespace(`${base}_a`);
    disposeNamespace(`${base}_b`);
  });
});

describe("expression writes", () => {
  it("mutates g via assignment", () => {
    const g: Record<string, unknown> = { value: 0 };
    execWrite("g.value = 42", { g });
    expect(g.value).toBe(42);
  });

  it("mutates g via compound expression", () => {
    const g: Record<string, unknown> = { count: 10 };
    execWrite("g.count = g.count + 1", { g });
    expect(g.count).toBe(11);
  });

  it("uses $event parameter", () => {
    const g: Record<string, unknown> = { value: 0 };
    execWrite("g.value = $event", { g, $event: 99 });
    expect(g.value).toBe(99);
  });

  it("executes multiple statements", () => {
    const g: Record<string, unknown> = { a: 1, b: 2 };
    execWrite("g.a = 10; g.b = 20", { g });
    expect(g.a).toBe(10);
    expect(g.b).toBe(20);
  });

  it("does not throw on error, only warns", () => {
    const g: Record<string, unknown> = {};
    const consoleSpy = spyOn(console, "warn").mockImplementation(() => {});
    expect(() => execWrite("invalid syntax {{{", { g })).not.toThrow();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
