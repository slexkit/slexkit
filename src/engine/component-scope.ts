import { createEffect } from "./reactive";

type Cleanup = () => void;
type Subscriber<T> = (value: T) => void;
type FlushDom = () => void;
export type ReadableAccessor<T> = (() => T) & {
  subscribe(run: Subscriber<T>): Cleanup;
};

const componentDisposers = new WeakMap<HTMLElement, Cleanup>();
let flushDom: FlushDom | undefined;

export function configureComponentScope(options: { flush?: FlushDom }): void {
  flushDom = options.flush;
}

export function createComponentAccessor<T>(read: () => T): ReadableAccessor<T> {
  const subscribers = new Set<Subscriber<T>>();
  let current = read();
  let stopEffect: Cleanup | undefined;

  const start = () => {
    if (stopEffect) return;
    stopEffect = createEffect(() => {
      current = read();
      for (const subscriber of Array.from(subscribers)) subscriber(current);
      flushDom?.();
    });
  };

  const accessor = (() => current) as ReadableAccessor<T>;
  accessor.subscribe = (run) => {
    const wasIdle = subscribers.size === 0;
    subscribers.add(run);
    if (wasIdle) start();
    else run(current);

    return () => {
      subscribers.delete(run);
      if (subscribers.size === 0) {
        stopEffect?.();
        stopEffect = undefined;
      }
    };
  };
  return accessor;
}

export function renderComponent(render: () => HTMLElement | void): HTMLElement | null {
  return render() ?? null;
}

export function attachComponentDisposer(el: HTMLElement, dispose: Cleanup): void {
  componentDisposers.set(el, dispose);
}

export function disposeComponent(el: HTMLElement): void {
  const dispose = componentDisposers.get(el);
  if (!dispose) return;
  componentDisposers.delete(el);
  dispose();
}
