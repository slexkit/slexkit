import { expect, it } from "bun:test";
import { createEffect, createReactiveState, createRoot, onCleanup } from "../../src/engine/reactive";

it("releases subscriptions over repeated artifact-like lifetimes", () => {
  let live = 0; let cleanups = 0;
  for (let cycle = 0; cycle < 100; cycle++) {
    const state = createReactiveState({ value: cycle });
    const dispose = createRoot((dispose) => {
      live++; onCleanup(() => { live--; cleanups++; });
      createEffect(() => state.value);
      return dispose;
    });
    state.value++; dispose();
    expect(live).toBe(0);
  }
  expect(cleanups).toBe(100);
});
