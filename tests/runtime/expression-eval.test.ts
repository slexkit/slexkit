import { describe, expect, it } from "bun:test";
import { inspectSlexSource } from "../../src/html/inspect";
import { createEffect, createReactiveState } from "../../src/engine/reactive";

describe("native JavaScript replaces expression evaluation", () => {
  it("rejects read and write expression object sources", () => {
    for (const source of [
      '({layout:{"text:x":{$text:"g.value"}}})',
      '({layout:{"button:x":{onclick:"g.value++"}}})',
    ]) expect(inspectSlexSource(source).diagnostic?.code).toBe("legacy-object-source");
  });

  it("uses ordinary closures with optional reactive utilities", () => {
    const state = createReactiveState({ count: 1 }); const seen: number[] = [];
    const dispose = createEffect(() => { seen.push(state.count * 2); });
    state.count = 3;
    expect(seen).toEqual([2, 6]);
    dispose();
  });
});
