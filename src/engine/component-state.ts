import { getComponentStateMode } from "./registry";
import { EAGER_TRACK_TARGET, SKIP_EAGER_TRACK } from "./eval";
import { isEngineeringNumberResult, parseEngineeringNumber } from "./engineering";
import { createComponentAccessor } from "./component-scope";
import { onCleanup } from "./reactive";
import type { ComponentState, ComponentStateMap, ComponentTypeMap, ForContext, LayoutNode } from "./types";

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;
const componentStateProxies = new WeakMap<ComponentState, ComponentState>();

type ReadableValue = {
  subscribe(run: (value: unknown) => void): () => void;
};

type SeenComponentState = {
  type: string;
  path: string;
};

function isReadableValue(value: unknown): value is ReadableValue {
  return !!value &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as ReadableValue).subscribe === "function";
}

function rawRecord<T extends Record<string, unknown>>(value: T): T {
  return ((value as { __slexkitRaw?: T }).__slexkitRaw ?? value) as T;
}

function componentPropName(key: string): string {
  return key.startsWith("$") ? key.slice(1) : key;
}

function isEventProp(key: string, value: unknown): boolean {
  return key.startsWith("on") && typeof value === "function";
}

function isWritableComponent(type: string): boolean {
  const mode = getComponentStateMode(type);
  return mode === "value" || mode === "checked" || mode === "enabled";
}

function isStatefulComponent(type: string): boolean {
  return getComponentStateMode(type) !== "none";
}

function isInputStateProp(type: string, propName: string): boolean {
  const mode = getComponentStateMode(type);
  if (mode === "value") return propName === "value";
  if (mode === "checked") return propName === "value" || propName === "checked";
  if (mode === "enabled") return propName === "enabled";
  return false;
}

function assignEngineeringState(state: ComponentState, value: unknown): void {
  const result = isEngineeringNumberResult(value) ? value : parseEngineeringNumber(value);
  state.value = result.raw;
  state.number = result.number;
  state.valid = result.valid;
  state.prefix = result.prefix;
  state.unit = result.unit;
  state.normalized = result.normalized;
  if (result.error) state.error = result.error;
  else delete state.error;
}

function clearEngineeringState(state: ComponentState): void {
  delete state.number;
  delete state.valid;
  delete state.prefix;
  delete state.unit;
  delete state.normalized;
  delete state.error;
}

function assignInputType(state: ComponentState, inputType: string): void {
  const previousType = state.type;
  state.type = inputType;
  if (inputType === "engineering" && "value" in state) {
    assignEngineeringState(state, state.value);
  } else if (previousType === "engineering" && inputType !== "engineering") {
    clearEngineeringState(state);
  }
}

function assignComponentProp(
  state: ComponentState,
  type: string,
  propName: string,
  value: unknown,
  force: boolean,
): void {
  if (!force && propName in state) return;
  if (type === "input" && propName === "value" && state.type === "engineering") {
    assignEngineeringState(state, value);
    return;
  }
  if (getComponentStateMode(type) === "checked" && (propName === "checked" || propName === "value")) {
    const checked = !!value;
    state.checked = checked;
    state.value = checked;
    return;
  }
  if (getComponentStateMode(type) === "enabled" && propName === "enabled") {
    state.enabled = !!value;
    return;
  }
  state[propName] = value;
}

export function publicComponentState(
  name: string,
  state: ComponentState,
  componentTypes: ComponentTypeMap,
): ComponentState {
  let cached = componentStateProxies.get(state);
  if (!cached) {
    cached = new Proxy(state, {
      get(target, key, receiver) {
        if (key === SKIP_EAGER_TRACK) return true;
        return Reflect.get(target, key, receiver);
      },
      set(target, key, value, receiver) {
        const currentType = componentTypes[name] ?? "";
        if (isWritableComponent(currentType)) {
          if (typeof key === "string") {
            assignComponentProp(target, currentType, key, value, true);
            return true;
          }
          return Reflect.set(target, key, value, receiver);
        }
        console.warn(`[SlexKit] Component state '${name}' is read-only. Use dynamic $ props to update output components.`);
        return true;
      },
      deleteProperty(target, key) {
        if (isWritableComponent(componentTypes[name] ?? "")) {
          return Reflect.deleteProperty(target, key);
        }
        console.warn(`[SlexKit] Component state '${name}' is read-only. Use dynamic $ props to update output components.`);
        return true;
      },
    });
    componentStateProxies.set(state, cached);
  }
  return cached;
}

export function createGProxy(
  g: Record<string, unknown>,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
): Record<string, unknown> {
  return new Proxy(g, {
    get(target, key, receiver) {
      if (key === EAGER_TRACK_TARGET) return target;
      if (typeof key === "string" && !(key in target) && key in components) {
        return publicComponentState(key, components[key], componentTypes);
      }
      return Reflect.get(target, key, receiver);
    },
    set(target, key, value, receiver) {
      return Reflect.set(target, key, value, receiver);
    },
    has(target, key) {
      return key in target || key in components;
    },
  });
}

export function ensureComponentState(
  name: string,
  type: string,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
): ComponentState {
  if (!components[name]) components[name] = {};
  componentTypes[name] = type;
  return components[name];
}

function syncReadableComponentProp(
  type: string,
  state: ComponentState,
  propName: string,
  value: ReadableValue,
): void {
  if (isWritableComponent(type)) {
    const unsubscribe = value.subscribe((next) => {
      assignComponentProp(state, type, propName, next, true);
    });
    onCleanup(unsubscribe);
    return;
  }

  let unsubscribe: (() => void) | undefined;
  let cancelled = false;
  queueMicrotask(() => {
    if (cancelled) return;
    unsubscribe = value.subscribe((next) => {
      assignComponentProp(state, type, propName, next, true);
    });
  });
  onCleanup(() => {
    cancelled = true;
    unsubscribe?.();
  });
}

export function syncComponentProps(
  type: string,
  name: string,
  props: Record<string, unknown>,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
): ComponentState | undefined {
  if (!name || !isStatefulComponent(type)) return undefined;
  const state = ensureComponentState(name, type, components, componentTypes);
  if (type === "input" && typeof props.type === "string") {
    assignInputType(state, props.type);
  }

  for (const [key, value] of Object.entries(props)) {
    if (isEventProp(key, value)) continue;
    const propName = componentPropName(key);
    const inputStateProp = isInputStateProp(type, propName);
    if (isReadableValue(value)) {
      syncReadableComponentProp(type, state, propName, value);
    } else {
      assignComponentProp(state, type, propName, value, !inputStateProp);
    }
  }

  return state;
}

export function bindInputStateProps(
  type: string,
  state: ComponentState | undefined,
  props: Record<string, unknown>,
): void {
  if (!state) return;
  const mode = getComponentStateMode(type);
  if (mode === "value") {
    props.value = createComponentAccessor(() => state.value);
  } else if (mode === "checked") {
    const checked = createComponentAccessor(() => !!(state.checked ?? state.value));
    props.checked = checked;
    props.value = checked;
  } else if (mode === "enabled") {
    props.enabled = createComponentAccessor(() => !!state.enabled);
  }
}

export function applyComponentEventState(
  type: string,
  name: string,
  data: unknown,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
): void {
  if (!name || !isWritableComponent(type)) return;
  const state = ensureComponentState(name, type, components, componentTypes);
  const mode = getComponentStateMode(type);
  if (mode === "checked") {
    const checked = !!data;
    state.checked = checked;
    state.value = checked;
  } else if (mode === "enabled") {
    state.enabled = !!data;
  } else if (type === "input" && state.type === "engineering") {
    assignEngineeringState(state, data);
  } else {
    state.value = data;
  }
}

function seedStaticComponentState(
  type: string,
  state: ComponentState,
  props: Record<string, unknown>,
): void {
  if (type === "input" && typeof props.type === "string") {
    assignInputType(state, props.type);
  }
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith("$") || isEventProp(key, value)) continue;
    const propName = componentPropName(key);
    if (isInputStateProp(type, propName)) {
      assignComponentProp(state, type, propName, value, false);
    }
  }
}

function warnDuplicateState(
  ns: string,
  name: string,
  currentType: string,
  currentPath: string,
  previous: SeenComponentState,
): void {
  console.warn(
    `[SlexKit][${ns}] Component state '${name}' is declared more than once at ${previous.path} and ${currentPath}; state is shared by namespace and component name.`,
  );
  if (previous.type !== currentType) {
    console.warn(
      `[SlexKit][${ns}] Component state '${name}' is used by multiple component types (${previous.type}, ${currentType}); the latest rendered type controls write behavior.`,
    );
  }
}

function warnForState(ns: string, name: string, path: string): void {
  console.warn(
    `[SlexKit][${ns}] Component state '${name}' is used with $for at ${path}; repeated items share one namespace-level instance state.`,
  );
}

function prepareComponentStatesInner(
  layout: LayoutNode,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
  ns: string,
  seen: Map<string, SeenComponentState>,
  parentPath = "",
): void {
  if (!layout || typeof layout !== "object") return;

  for (const [key, val] of Object.entries(layout)) {
    if (!key.includes(":") || typeof val !== "object" || val === null) continue;

    const [type, name] = key.split(":");
    const props = val as Record<string, unknown>;
    const path = parentPath ? `${parentPath}.${key}` : key;
    if (name && isStatefulComponent(type)) {
      const previous = seen.get(name);
      if (previous) warnDuplicateState(ns, name, type, path, previous);
      else seen.set(name, { type, path });
      if (props.$for && isWritableComponent(type)) warnForState(ns, name, path);

      const state = ensureComponentState(name, type, components, componentTypes);
      seedStaticComponentState(type, state, props);
    }

    prepareComponentStatesInner(props, components, componentTypes, ns, seen, path);
  }
}

export function prepareComponentStates(
  layout: LayoutNode,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
  ns: string,
): void {
  prepareComponentStatesInner(layout, components, componentTypes, ns, new Map());
}

export function buildComponentEvalContext(
  g: Record<string, unknown>,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
  api?: Record<string, unknown>,
  forCtx?: ForContext,
): Record<string, unknown> {
  const ctx: Record<string, unknown> = { g: createGProxy(g, components, componentTypes) };
  for (const name of Object.keys(rawRecord(components))) {
    if (IDENTIFIER.test(name)) {
      ctx[name] = publicComponentState(name, components[name], componentTypes);
    }
  }
  if (api) ctx.api = api;
  if (forCtx) {
    for (const k of Object.keys(forCtx)) {
      Object.defineProperty(ctx, k, {
        get: () => {
          const current = forCtx[k];
          return k === "$index" && typeof current === "function"
            ? (current as () => unknown)()
            : current;
        },
        enumerable: true,
      });
    }
  }
  return ctx;
}
