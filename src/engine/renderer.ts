import { getRenderer } from "./registry";
import { evalRead, execWrite } from "./eval";
import { createComponentAccessor, disposeComponent, renderComponent } from "./component-scope";
import { applyComponentEventState, bindInputStateProps, buildComponentEvalContext, prepareComponentStates, syncComponentProps } from "./component-state";
import { asReactiveValue, createEffect, createMemo, createRoot, createSignal, onCleanup } from "./reactive";
import { slexkitStd } from "./stdlib";
import type { LayoutNode, ForContext, RenderContext, ForSlot, ComponentRenderer, MountOptions, ComponentStateMap, ComponentTypeMap } from "./types";

const FALLBACK_CSS = "background:var(--muted);border:1px solid var(--border);border-radius:calc(var(--radius) - 2px);padding:0.5rem;text-align:center;font-size:0.75rem;color:var(--muted-foreground)";
type RenderOptions = Required<Pick<MountOptions, "labels">> & {
  dir: RenderContext["dir"];
  executionMode: NonNullable<MountOptions["executionMode"]>;
};

const defaultRenderOptions: RenderOptions = {
  dir: "ltr",
  executionMode: "live",
  labels: {},
};

function hasComponentKey(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).some((k) => k.includes(":"));
}

function separatePropsAndChildren(
  obj: Record<string, unknown>,
  props: Record<string, unknown>,
  children: Record<string, unknown>,
): void {
  for (const [k, v] of Object.entries(obj)) {
    if (k === "$if" || k === "$for" || k === "$key") continue;
    if (
      k.includes(":") ||
      (typeof v === "object" &&
        v !== null &&
        Object.keys(v).length > 0 &&
        hasComponentKey(v as Record<string, unknown>))
    ) {
      children[k] = v;
    } else {
      props[k] = v;
    }
  }
}

function callHook(
  g: Record<string, unknown>,
  name: string,
  type: "onMount" | "onUnmount" | "onUpdate",
  options: RenderOptions,
): void {
  if (options.executionMode === "preview") return;
  const key = name ? `${type}_${name}` : `${type}_`;
  const fn = g[key];
  if (typeof fn === "function") {
    fn.call(g);
  }
}

function previewApi(api: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!api) return undefined;
  return new Proxy({}, {
    get(_target, key) {
      if (typeof key === "symbol") return undefined;
      return () => {
        throw new Error(`api.${key} is disabled during SlexKit preview rendering.`);
      };
    },
  });
}

function applyEnterAnimation(
  el: HTMLElement,
  props: Record<string, unknown>,
): void {
  const enterFn = props.$enter;
  if (typeof enterFn !== "function") return;
  const animClass = (enterFn as () => unknown)();
  if (animClass && typeof animClass === "string") {
    el.classList.add(animClass);
    el.addEventListener("animationend", () => el.classList.remove(animClass), { once: true });
  }
}

function applyLeaveAnimation(
  el: HTMLElement,
  props: Record<string, unknown>,
  callback: () => void,
): void {
  const leaveFn = props.$leave;
  if (typeof leaveFn !== "function") {
    callback();
    return;
  }
  const animClass = (leaveFn as () => unknown)();
  if (animClass && typeof animClass === "string") {
    el.classList.add(animClass);
    el.addEventListener("animationend", () => {
      callback();
    }, { once: true });
  } else {
    callback();
  }
}

function renderWithFallback(
  renderer: (
    props: Record<string, unknown>,
    name: string,
    ctx: RenderContext,
  ) => HTMLElement | void,
  props: Record<string, unknown>,
  name: string,
  ctx: RenderContext,
  fullKey: string,
  ns: string,
): HTMLElement | null {
  try {
    return renderComponent(() => renderer(props, name, ctx) as HTMLElement | void);
  } catch (e) {
    console.warn(
      `[SlexKit][${ns}] Render error at ${fullKey}:`,
      (e as Error).message,
    );
    const fb = (ctx.document || document).createElement("div");
    fb.className = "slex-render-error";
    fb.title = fullKey;
    fb.setAttribute("style", FALLBACK_CSS);
    return fb;
  }
}

function resolveDynamicProps(
  props: Record<string, unknown>,
  g: Record<string, unknown>,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
  api: Record<string, unknown> | undefined,
  forCtx: ForContext | undefined,
  ns: string,
  fullKey: string,
  options: RenderOptions,
): void {
  const evalCtx = buildComponentEvalContext(g, components, componentTypes, api, forCtx);
  for (const [k, v] of Object.entries(props)) {
    if (
      k.startsWith("$") &&
      !k.startsWith("$if") &&
      !k.startsWith("$for") &&
      !k.startsWith("$key") &&
      typeof v === "string"
    ) {
      const path = `${fullKey}:${k}`;
      const memo = createMemo(() => evalRead(v, evalCtx, ns, path));
      props[k] = createComponentAccessor(memo);
    } else if (k.startsWith("on") && typeof v === "string") {
      if (options.executionMode === "preview") {
        props[k] = () => {};
        continue;
      }
      const stmt = v;
      const path = `${fullKey}:${k}`;
      props[k] = ($event?: unknown) => execWrite(stmt, { ...evalCtx, $event: $event ?? null }, ns, path);
    }
  }
}

function resolveKeyValue(item: unknown, itemIndex: number, $keyProp: string | undefined): unknown {
  if ($keyProp) {
    if ($keyProp === "$value") {
      return item;
    }
    if ($keyProp === "id" || ($keyProp !== "id" && item && typeof item === "object")) {
      return (item as Record<string, unknown>)?.[$keyProp];
    }
  }

  if (item && typeof item === "object" && "id" in item) {
    return (item as Record<string, unknown>).id;
  }

  const primitiveTypes = ["string", "number", "boolean"];
  if (primitiveTypes.includes(typeof item)) {
    console.warn(
      "[SlexKit] $for with primitive array items but no $key specified. Use '$key: $value' for primitive arrays. Falling back to index.",
    );
    return itemIndex;
  }

  console.warn(
    "[SlexKit] $for array item has no 'id' property and no $key specified. Falling back to index.",
  );
  return itemIndex;
}


function trackForCollection(value: unknown): unknown {
  if (!Array.isArray(value)) return value;
  Reflect.get(value, "length");
  for (const item of value) {
    if (item && typeof item === "object") {
      for (const key of Object.keys(item as Record<string, unknown>)) {
        Reflect.get(item as Record<string, unknown>, key);
      }
    }
  }
  return value;
}

function renderIfNode(
  fullKey: string,
  props: Record<string, unknown>,
  container: HTMLElement,
  g: Record<string, unknown>,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
  api: Record<string, unknown> | undefined,
  forCtx: ForContext | undefined,
  ns: string,
  options: RenderOptions,
): void {
  const [type, name] = fullKey.split(":");
  const renderer = getRenderer(type);
  if (!renderer) return;

  const evalCtx = buildComponentEvalContext(g, components, componentTypes, api, forCtx);
  const show = createMemo(() => evalRead(props.$if as string, evalCtx, ns, `${fullKey}:$if`));
  type IfInstance = {
    el: HTMLElement;
    props: Record<string, unknown>;
    dispose: () => void;
    disposed: boolean;
  };

  let current: IfInstance | null = null;
  const leavingInstances = new Set<IfInstance>();
  let mounting = false;

  let emit: ((event: string, data?: unknown) => void) | undefined;

  const disposeInstance = (instance: IfInstance): void => {
    if (instance.disposed) return;
    instance.disposed = true;
    leavingInstances.delete(instance);
    if (current === instance) current = null;
    disposeComponent(instance.el);
    instance.dispose();
    callHook(g, name, "onUnmount", options);
    instance.el.remove();
  };

  createEffect(() => {
    if (show()) {
      if (!current && !mounting) {
        mounting = true;
        let innerProps!: Record<string, unknown>;
        let innerChildren!: Record<string, unknown>;
        let currentEl!: HTMLElement | null;
        const dispose = createRoot((_dispose) => {
          innerProps = {};
          innerChildren = {};
          separatePropsAndChildren(props, innerProps, innerChildren);
          resolveDynamicProps(innerProps, g, components, componentTypes, api, forCtx, ns, fullKey, options);
          const componentState = syncComponentProps(type, name, innerProps, components, componentTypes);
          bindInputStateProps(type, componentState, innerProps);
          emit = (event: string, data?: unknown) => {
            if (options.executionMode === "preview") return;
            if (event === "change") applyComponentEventState(type, name, data, components, componentTypes);
            const h = innerProps[`on${event}`];
            if (typeof h === "function") h(data);
          };
          currentEl = renderWithFallback(renderer, innerProps, name, {
            g,
            std: slexkitStd,
            api,
            dir: options.dir,
            labels: options.labels,
            document: container.ownerDocument || document,
            forCtx,
            children: innerChildren,
            id: name || null,
            emit: emit!,
            renderTree: (layout, _container, childForCtx) =>
              renderTree(layout, _container, g, components, componentTypes, childForCtx ?? forCtx, ns, api, options, false),
          }, fullKey, ns);

          return _dispose;
        });
        mounting = false;
        if (currentEl) {
          container.appendChild(currentEl);
          applyEnterAnimation(currentEl, innerProps);
          callHook(g, name, "onMount", options);
          current = {
            el: currentEl,
            props: innerProps,
            dispose,
            disposed: false,
          };
        } else {
          dispose();
        }
      }
    } else {
      if (current) {
        const instance = current;
        current = null;
        leavingInstances.add(instance);
        applyLeaveAnimation(instance.el, instance.props, () => {
          disposeInstance(instance);
        });
      }
    }
  });

  onCleanup(() => {
    if (current) disposeInstance(current);
    for (const instance of Array.from(leavingInstances)) disposeInstance(instance);
  });
}

function renderAndMountSlot(
  item: unknown,
  index: number,
  keyVal: unknown,
  indexSignal: [() => number, (v: number) => void],
  revisionSignal: [() => number, (v: number) => void],
  renderer: ComponentRenderer,
  type: string,
  name: string,
  props: Record<string, unknown>,
  container: HTMLElement,
  g: Record<string, unknown>,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
  api: Record<string, unknown> | undefined,
  forCtx: ForContext | undefined,
  ns: string,
  fullKey: string,
  options: RenderOptions,
): ForSlot {
  indexSignal[1](index);
  const reactiveItem = asReactiveValue(item, g);

  const innerForCtx: ForContext = {
    ...forCtx,
    $item: reactiveItem,
    $index: indexSignal[0],
    $key: keyVal,
    $revision: revisionSignal[0],
  };

  if (name) {
    innerForCtx[name] = reactiveItem;
  }

  let innerProps!: Record<string, unknown>;
  let innerChildren!: Record<string, unknown>;
  let el!: HTMLElement | null;
  let fEmit!: RenderContext["emit"];

  const dispose = createRoot((_dispose) => {
    innerProps = {};
    innerChildren = {};
    separatePropsAndChildren(props, innerProps, innerChildren);
    resolveDynamicProps(innerProps, g, components, componentTypes, api, innerForCtx, ns, fullKey, options);
    const componentState = syncComponentProps(type, name, innerProps, components, componentTypes);
    bindInputStateProps(type, componentState, innerProps);

    fEmit = (event, data) => {
      if (options.executionMode === "preview") return;
      if (event === "change") applyComponentEventState(type, name, data, components, componentTypes);
      const h = innerProps[`on${event}`];
      if (typeof h === "function") h(data);
    };

    el = renderWithFallback(renderer, innerProps, name, {
      g,
      std: slexkitStd,
      api,
      dir: options.dir,
      labels: options.labels,
      document: container.ownerDocument || document,
      forCtx: innerForCtx,
      children: innerChildren,
      id: name || null,
      emit: fEmit,
      renderTree: (layout, _container, childForCtx) =>
        renderTree(layout, _container, g, components, componentTypes, childForCtx ?? innerForCtx, ns, api, options, false),
    }, `${fullKey}[${index}]`, ns);

    return _dispose;
  });

  return {
    key: keyVal,
    el: el!,
    forCtx: innerForCtx,
    index,
    item: reactiveItem,
    props: innerProps,
    children: innerChildren,
    indexSignal,
    revision: 0,
    revisionSignal,
    dispose,
  };
}

function renderForNode(
  fullKey: string,
  props: Record<string, unknown>,
  container: HTMLElement,
  g: Record<string, unknown>,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
  api: Record<string, unknown> | undefined,
  forCtx: ForContext | undefined,
  ns: string,
  options: RenderOptions,
): void {
  const [type, name] = fullKey.split(":");
  const renderer = getRenderer(type);
  if (!renderer) return;

  const doc = container.ownerDocument || document;
  const startAnchor = doc.createComment(`slexkit-for:${fullKey}:start`);
  const endAnchor = doc.createComment(`slexkit-for:${fullKey}:end`);
  container.append(startAnchor, endAnchor);

  const evalCtx = buildComponentEvalContext(g, components, componentTypes, api, forCtx);
  const items = createMemo(() => trackForCollection(evalRead(props.$for as string, evalCtx, ns, `${fullKey}:$for`)));
  const $keyProp = props.$key as string | undefined;

  const slotMap = new Map<unknown, ForSlot>();
  const leavingSlots = new Set<ForSlot>();
  const disposedSlots = new WeakSet<ForSlot>();

  const disposeSlot = (slot: ForSlot): void => {
    if (disposedSlots.has(slot)) return;
    disposedSlots.add(slot);
    leavingSlots.delete(slot);
    callHook(g, name, "onUnmount", options);
    if (slot.el) {
      disposeComponent(slot.el);
      slot.el.remove();
    }
    if (slot.dispose) slot.dispose();
  };

  createEffect(() => {
    const arr = items();
    if (!Array.isArray(arr)) {
      if (slotMap.size > 0) {
        for (const [, slot] of slotMap) {
          disposeSlot(slot);
        }
        slotMap.clear();
      }
      return;
    }

    const newKeys = arr.map((item, i) => resolveKeyValue(item, i, $keyProp));
    const newKeySet = new Set(newKeys);

    // Phase 1: delete keys in old slotMap but not in new array.
    const deletedSlots: ForSlot[] = [];
    for (const [oldKey, slot] of slotMap) {
      if (!newKeySet.has(oldKey)) {
        deletedSlots.push(slot);
        slotMap.delete(oldKey);
      }
    }
    for (const slot of deletedSlots) {
      leavingSlots.add(slot);
      if (!slot.el) {
        disposeSlot(slot);
        continue;
      }
      applyLeaveAnimation(slot.el, slot.props, () => {
        disposeSlot(slot);
      });
    }

    // Phase 2: add new items, update retained items' forCtx, adjust DOM order.
    let cursor: ChildNode = startAnchor;
    arr.forEach((item: unknown, index: number) => {
      item = asReactiveValue(item, g);
      const keyVal = newKeys[index];
      let slot = slotMap.get(keyVal);

      if (slot) {
        const indexChanged = slot.index !== index;
        const itemChanged = slot.item !== item;

        slot.forCtx.$item = item;
        slot.forCtx.$key = keyVal;
        if (name) slot.forCtx[name] = item;
        slot.index = index;
        slot.item = item;
        if (slot.revisionSignal) {
          slot.revision = (slot.revision ?? 0) + 1;
          slot.revisionSignal[1](slot.revision);
        }

        if (indexChanged || itemChanged) {
          if (indexChanged && slot.indexSignal) {
            slot.indexSignal[1](index);
          }
          callHook(g, name, "onUpdate", options);
        }
      } else {
        const indexSignal = createSignal(index);
        const revisionSignal = createSignal(0);
        slot = renderAndMountSlot(item, index, keyVal, indexSignal, revisionSignal, renderer, type, name, props, container, g, components, componentTypes, api, forCtx, ns, fullKey, options);
        if (!slot.el) {
          disposeSlot(slot);
          return;
        }
        applyEnterAnimation(slot.el, slot.props);
        callHook(g, name, "onMount", options);
        slotMap.set(keyVal, slot);
      }

      const nextChild = cursor.nextSibling;
      if (slot.el && nextChild !== slot.el) {
        container.insertBefore(slot.el, nextChild ?? endAnchor);
      }
      if (slot.el) {
        cursor = slot.el;
      }
    });
  });

  onCleanup(() => {
    for (const slot of Array.from(slotMap.values())) disposeSlot(slot);
    slotMap.clear();
    for (const slot of Array.from(leavingSlots)) disposeSlot(slot);
    startAnchor.remove();
    endAnchor.remove();
  });
}

function renderNormalNode(
  fullKey: string,
  props: Record<string, unknown>,
  container: HTMLElement,
  g: Record<string, unknown>,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
  api: Record<string, unknown> | undefined,
  forCtx: ForContext | undefined,
  ns: string,
  options: RenderOptions,
): void {
  const [type, name] = fullKey.split(":");
  const renderer = getRenderer(type);
  if (!renderer) return;

  const nodeProps: Record<string, unknown> = {};
  const nodeChildren: Record<string, unknown> = {};
  separatePropsAndChildren(props, nodeProps, nodeChildren);
  resolveDynamicProps(nodeProps, g, components, componentTypes, api, forCtx, ns, fullKey, options);
  const componentState = syncComponentProps(type, name, nodeProps, components, componentTypes);
  bindInputStateProps(type, componentState, nodeProps);

  const nEmit: RenderContext["emit"] = (event, data) => {
    if (options.executionMode === "preview") return;
    if (event === "change") applyComponentEventState(type, name, data, components, componentTypes);
    const h = nodeProps[`on${event}`];
    if (typeof h === "function") h(data);
  };

  const el = renderWithFallback(renderer, nodeProps, name, {
    g,
    std: slexkitStd,
    api,
    dir: options.dir,
    labels: options.labels,
    document: container.ownerDocument || document,
    forCtx,
    children: nodeChildren,
    id: name || null,
    emit: nEmit,
    renderTree: (layout, _container, childForCtx) =>
      renderTree(layout, _container, g, components, componentTypes, childForCtx ?? forCtx, ns, api, options, false),
  }, fullKey, ns);
  if (el) {
    container.appendChild(el);
    applyEnterAnimation(el, nodeProps);
    callHook(g, name, "onMount", options);
    onCleanup(() => callHook(g, name, "onUnmount", options));
    onCleanup(() => disposeComponent(el));
  }
}

function renderNode(
  fullKey: string,
  props: Record<string, unknown>,
  container: HTMLElement,
  g: Record<string, unknown>,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
  api: Record<string, unknown> | undefined,
  forCtx: ForContext | undefined,
  ns: string,
  options: RenderOptions,
): void {
  if (!fullKey || !fullKey.includes(":")) return;

  if (props.$if) {
    renderIfNode(fullKey, props, container, g, components, componentTypes, api, forCtx, ns, options);
  } else if (props.$for) {
    renderForNode(fullKey, props, container, g, components, componentTypes, api, forCtx, ns, options);
  } else {
    renderNormalNode(fullKey, props, container, g, components, componentTypes, api, forCtx, ns, options);
  }
}

export function renderTree(
  layout: LayoutNode,
  container: HTMLElement,
  g: Record<string, unknown>,
  components: ComponentStateMap,
  componentTypes: ComponentTypeMap,
  forCtx?: ForContext,
  ns = "?",
  api?: Record<string, unknown>,
  options: RenderOptions = defaultRenderOptions,
  prepare = true,
): void {
  if (!layout || typeof layout !== "object") return;

  const runtimeApi = options.executionMode === "preview" ? previewApi(api) : api;

  if (prepare) prepareComponentStates(layout, components, componentTypes, ns);

  for (const [key, val] of Object.entries(layout)) {
    if (!key.includes(":")) continue;
    if (typeof val === "object" && val !== null) {
      renderNode(key, val as Record<string, unknown>, container, g, components, componentTypes, runtimeApi, forCtx, ns, options);
    }
  }
}
