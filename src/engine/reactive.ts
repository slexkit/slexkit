type Cleanup = () => void;
type Dependency = Set<ReactiveEffect>;

const ITERATE_KEY = Symbol("iterate");
const REVISION_KEY = Symbol("revision");

let activeEffect: ReactiveEffect | null = null;
let activeScope: ReactiveScope | null = null;
let batchDepth = 0;
const pendingEffects = new Set<ReactiveEffect>();

const targetDeps = new WeakMap<object, Map<PropertyKey, Dependency>>();
const proxyCache = new WeakMap<object, object>();
const rawTargets = new WeakMap<object, object>();
const rootTargets = new WeakMap<object, object>();

class ReactiveScope {
  cleanups: Cleanup[] = [];
  effects = new Set<ReactiveEffect>();
  disposed = false;

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const effect of Array.from(this.effects)) effect.stop();
    this.effects.clear();
    for (let i = this.cleanups.length - 1; i >= 0; i -= 1) {
      this.cleanups[i]();
    }
    this.cleanups.length = 0;
  }
}

class ReactiveEffect {
  deps: Dependency[] = [];
  cleanups: Cleanup[] = [];
  stopped = false;
  running = false;

  constructor(
    private readonly fn: () => void,
    private readonly scope: ReactiveScope | null,
  ) {
    if (scope) scope.effects.add(this);
  }

  run(): void {
    if (this.stopped || this.running) return;
    this.running = true;
    this.cleanupDeps();
    this.runCleanups();
    const previousEffect = activeEffect;
    const previousScope = activeScope;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    activeEffect = this;
    if (this.scope) activeScope = this.scope;
    try {
      this.fn();
    } finally {
      activeEffect = previousEffect;
      activeScope = previousScope;
      this.running = false;
    }
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.cleanupDeps();
    this.runCleanups();
    this.scope?.effects.delete(this);
  }

  private cleanupDeps(): void {
    for (const dep of this.deps) dep.delete(this);
    this.deps.length = 0;
  }

  private runCleanups(): void {
    for (let i = this.cleanups.length - 1; i >= 0; i -= 1) {
      this.cleanups[i]();
    }
    this.cleanups.length = 0;
  }
}

function getDep(target: object, key: PropertyKey): Dependency {
  let deps = targetDeps.get(target);
  if (!deps) {
    deps = new Map();
    targetDeps.set(target, deps);
  }
  let dep = deps.get(key);
  if (!dep) {
    dep = new Set();
    deps.set(key, dep);
  }
  return dep;
}

function track(target: object, key: PropertyKey): void {
  if (!activeEffect) return;
  const dep = getDep(target, key);
  if (dep.has(activeEffect)) return;
  dep.add(activeEffect);
  activeEffect.deps.push(dep);
}

function trigger(target: object, key: PropertyKey): void {
  const deps = targetDeps.get(target);
  if (!deps) return;
  const effects = new Set<ReactiveEffect>();
  const add = (dep?: Dependency) => {
    if (!dep) return;
    for (const effect of dep) effects.add(effect);
  };
  add(deps.get(key));
  if (key !== REVISION_KEY) add(deps.get(ITERATE_KEY));
  for (const effect of effects) schedule(effect);
}

function schedule(effect: ReactiveEffect): void {
  if (effect.stopped) return;
  if (batchDepth > 0) {
    pendingEffects.add(effect);
    return;
  }
  effect.run();
}

function flush(): void {
  while (pendingEffects.size > 0) {
    const effects = Array.from(pendingEffects);
    pendingEffects.clear();
    for (const effect of effects) effect.run();
  }
}

function notifyRoot(target: object): void {
  const root = rootTargets.get(target) ?? target;
  trigger(root, REVISION_KEY);
}

function toReactive<T extends object>(value: T, root: object): T {
  const cached = proxyCache.get(value);
  if (cached) return cached as T;

  const proxy = new Proxy(value, {
    get(target, key, receiver) {
      if (key === "__slexkitRaw") return target;
      if (key === "__slexkitRoot") return root;
      track(target, key);
      const result = Reflect.get(target, key, receiver);
      if (result && typeof result === "object") {
        return toReactive(result as object, root);
      }
      return result;
    },
    set(target, key, next, receiver) {
      const previous = Reflect.get(target, key, receiver);
      const hadKey = Object.prototype.hasOwnProperty.call(target, key);
      const ok = Reflect.set(target, key, next, receiver);
      if (ok && (!Object.is(previous, next) || !hadKey)) {
        trigger(target, key);
        if (!hadKey) trigger(target, ITERATE_KEY);
        notifyRoot(target);
      }
      return ok;
    },
    deleteProperty(target, key) {
      const hadKey = Object.prototype.hasOwnProperty.call(target, key);
      const ok = Reflect.deleteProperty(target, key);
      if (ok && hadKey) {
        trigger(target, key);
        trigger(target, ITERATE_KEY);
        notifyRoot(target);
      }
      return ok;
    },
    ownKeys(target) {
      track(target, ITERATE_KEY);
      return Reflect.ownKeys(target);
    },
  });

  proxyCache.set(value, proxy);
  rawTargets.set(proxy, value);
  rootTargets.set(value, root);
  rootTargets.set(proxy, root);
  return proxy as T;
}

export function createReactiveState<T extends object>(value: T): T {
  return toReactive(value, value);
}

export function asReactiveValue<T>(value: T, owner: unknown): T {
  if (!value || typeof value !== "object") return value;
  if (rawTargets.has(value as object) || rootTargets.has(value as object)) return value;
  if (!owner || typeof owner !== "object") return value;
  const root = rootTargets.get(owner as object) ?? rawTargets.get(owner as object);
  if (!root) return value;
  return toReactive(value as object, root) as T;
}

export function trackReactiveValue(value: unknown): void {
  if (!value || typeof value !== "object") return;
  const root = rootTargets.get(value as object) ?? rawTargets.get(value as object);
  if (root) track(root, REVISION_KEY);
}

export function createRoot<T>(fn: (dispose: Cleanup) => T): T {
  const scope = new ReactiveScope();
  const previousScope = activeScope;
  const previousEffect = activeEffect;
  activeScope = scope;
  activeEffect = null;
  try {
    return fn(() => scope.dispose());
  } finally {
    activeEffect = previousEffect;
    activeScope = previousScope;
  }
}

export function createEffect(fn: () => void): Cleanup {
  const effect = new ReactiveEffect(fn, activeScope);
  effect.run();
  return () => effect.stop();
}

export function createMemo<T>(fn: () => T): () => T {
  const source = {};
  let value: T;
  createEffect(() => {
    value = fn();
    trigger(source, "value");
  });
  return () => {
    track(source, "value");
    return value;
  };
}

export function createSignal<T>(initial: T): [() => T, (next: T) => void] {
  const source = {};
  let value = initial;
  return [
    () => {
      track(source, "value");
      return value;
    },
    (next) => {
      if (Object.is(value, next)) return;
      value = next;
      trigger(source, "value");
    },
  ];
}

export function onCleanup(cleanup: Cleanup): void {
  if (activeEffect) {
    activeEffect.cleanups.push(cleanup);
    return;
  }
  if (activeScope) {
    activeScope.cleanups.push(cleanup);
  }
}

export function batch<T>(fn: () => T): T {
  batchDepth += 1;
  try {
    return fn();
  } finally {
    batchDepth -= 1;
    if (batchDepth === 0) flush();
  }
}
