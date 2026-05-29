import { flushSync, mount as mountSvelte, unmount } from "svelte";
import type { ComponentRenderer } from "../../engine/types";
import { attachComponentDisposer, configureComponentScope } from "../../engine/component-scope";
import type { PropStore, PropValues, SvelteBuiltinComponent } from "./types";

type Readable<T = unknown> = {
  subscribe(run: (value: T) => void): () => void;
};

configureComponentScope({ flush: () => flushSync() });

function isReadable(value: unknown): value is Readable {
  return !!value &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as Readable).subscribe === "function";
}

function createPropsStore(
  props: Record<string, unknown>,
): PropStore {
  return {
    subscribe(run) {
      const current: PropValues = {};
      const cleanups: Array<() => void> = [];
      let ready = false;

      const emit = () => {
        if (ready) run({ ...current });
      };

      for (const [key, value] of Object.entries(props)) {
        if (key.startsWith("on") && typeof value === "function") continue;
        const propName = key.startsWith("$") ? key.slice(1) : key;
        if (isReadable(value)) {
          cleanups.push(value.subscribe((next) => {
            current[propName] = next;
            emit();
          }));
        } else {
          current[propName] = value;
        }
      }

      ready = true;
      run({ ...current });
      return () => {
        for (const cleanup of cleanups) cleanup();
      };
    }
  };
}

export function createSvelteRenderer(type: string, Component: SvelteBuiltinComponent): ComponentRenderer {
  return (props, name, ctx) => {
    const host = (ctx.document || document).createElement("div");
    const instance = mountSvelte(Component, {
      target: host,
      props: {
        componentName: name,
        ctx,
        props: createPropsStore(props),
      },
    });
    flushSync();
    const root = host.firstElementChild as HTMLElement | null;
    if (!root) {
      void unmount(instance);
      return undefined;
    }
    root.remove();
    attachComponentDisposer(root, () => {
      void unmount(instance);
    });
    return root;
  };
}
