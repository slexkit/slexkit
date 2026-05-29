import { createReactiveState } from "./reactive";
import type { ComponentStateMap, ComponentTypeMap, LayoutNode } from "./types";

export type Store = {
  g: Record<string, unknown>;
  components: ComponentStateMap;
  componentTypes: ComponentTypeMap;
  layouts: LayoutNode[];
  roots: Map<HTMLElement, HTMLElement>;
  cleanups: Map<HTMLElement, () => void>;
};

const _stores = new Map<string, Store>();

export function getStore(ns: string): Store {
  if (!_stores.has(ns)) {
    _stores.set(ns, {
      g: createReactiveState({}),
      components: createReactiveState({}) as ComponentStateMap,
      componentTypes: createReactiveState({}) as ComponentTypeMap,
      layouts: [],
      roots: new Map(),
      cleanups: new Map(),
    });
  }
  return _stores.get(ns)!;
}

export function peekStore(ns: string): Store | undefined {
  return _stores.get(ns);
}

export function deleteStore(ns: string): boolean {
  return _stores.delete(ns);
}
