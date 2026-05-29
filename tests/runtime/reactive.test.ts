import { describe, expect, it } from "bun:test";
import {
  batch,
  createEffect,
  createMemo,
  createReactiveState,
  createRoot,
  createSignal,
  trackReactiveValue,
} from "../../src/engine/reactive";

describe("reactive runtime", () => {
  it("tracks deep object mutations through reactive proxies", () => {
    const g = createReactiveState({ item: { label: "old" } });
    const values: string[] = [];

    createEffect(() => {
      values.push(g.item.label);
    });

    g.item.label = "new";

    expect(values).toEqual(["old", "new"]);
  });

  it("tracks array push through namespace revision dependencies", () => {
    const g = createReactiveState({ items: ["a"] });
    const lengths: number[] = [];

    createEffect(() => {
      trackReactiveValue(g);
      lengths.push(g.items.length);
    });

    g.items.push("b");

    expect(lengths).toEqual([1, 2]);
  });

  it("batches multiple writes into one effect flush", () => {
    const g = createReactiveState({ a: 1, b: 2 });
    const sums: number[] = [];

    createEffect(() => {
      sums.push(g.a + g.b);
    });

    batch(() => {
      g.a = 10;
      g.b = 20;
    });

    expect(sums).toEqual([3, 30]);
  });

  it("disposes scoped effects without inheriting parent effect cleanup", () => {
    const [value, setValue] = createSignal("old");
    const seen: string[] = [];
    let disposeChild: (() => void) | null = null;

    createEffect(() => {
      value();
      if (!disposeChild) {
        disposeChild = createRoot((dispose) => {
          createEffect(() => {
            seen.push(value());
          });
          return dispose;
        });
      }
    });

    setValue("new");
    expect(seen).toEqual(["old", "new"]);

    disposeChild?.();
    setValue("final");
    expect(seen).toEqual(["old", "new"]);
  });

  it("updates memo subscribers even when the memo returns the same array reference", () => {
    const g = createReactiveState({ items: ["a"] });
    const items = createMemo(() => {
      trackReactiveValue(g);
      return g.items;
    });
    const lengths: number[] = [];

    createEffect(() => {
      lengths.push(items().length);
    });

    g.items.push("b");

    expect(lengths).toEqual([1, 2]);
  });
});
