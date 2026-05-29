import type { PropStore, PropValues } from "./types";

export function bindPropStore(
  store: PropStore,
  set: (value: PropValues) => void,
): () => void {
  return store.subscribe((next) => set(next));
}
