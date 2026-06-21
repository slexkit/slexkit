---
title: Runtime Model
category: Reference
status: ready
order: 30
summary: "Mounting, ingestion, boot, namespace store, lifecycle hooks, component state, and runtime APIs."
slexkitRenderMode: component
---

# Runtime Model

The core SlexKit runtime: entry points, namespace store, component state, lifecycle hooks, and expression evaluation.

Slex source syntax is covered in the [protocol specification](/docs/reference/spec). Secure mode isolation is covered in the [security runtime contract](/docs/reference/security).

## Entry points

### `mount(input, container, options)`

Parses Slex source object or source string, merges state into the namespace store, renders the component tree into `container`, returns a root cleanup function.

```ts
function mount(
  input: SlexExpression | string,
  container: HTMLElement,
  options?: MountOptions
): () => void;

type MountOptions = {
  theme?: "auto" | "host-shadcn" | "uno" | "flowbite";
  dir?: "ltr" | "rtl" | "auto";
  labels?: Partial<Record<string, string>>;
  api?: Record<string, unknown>;
};
```

Calling `mount()` again on the same `container` clears the old root first, then appends a new root. The returned cleanup only unmounts the current root; it does not delete the namespace store.

Every expression receives `std`, SlexKit's pure deterministic standard library. Hosts can still inject capability objects through `api`, but network, timers, animation, and canvas should remain policy-gated in secure mode.

### `ingest(input)`

Ingests state-only Slex: updates `g` without rendering UI. Used by the Markdown runtime host for state-only fences. Returns `true` if parsing succeeded.

```ts
function ingest(input: SlexExpression | string): boolean;
```

### `disposeNamespace(namespace)`

Permanently releases all roots, cleanups, store entries, and expression caches for a namespace. Call this when a document, message domain, or page section is permanently removed. Root cleanup is not equivalent to namespace disposal.

```ts
function disposeNamespace(namespace: string): void;
```

### `boot(options)`

Enhances static pages by auto-discovering explicitly marked Slex blocks (`<pre><code class="language-slex">`) and mounting live previews.

```ts
function boot(options?: BootOptions): void;

type BootOptions = {
  selector?: string;
  sourceControls?: boolean;
  theme?: ThemeMode;
  dir?: MountOptions["dir"];
  labels?: MountOptions["labels"];
};
```

Default selector covers: `language-slex`.

Hosts like React/Streamdown or Obsidian should typically use the Markdown runtime host directly rather than `boot()`.

### `register(type, renderer, options)`

Registers a component type with a render function and state mode.

```ts
function register(
  type: string,
  renderer: ComponentRenderer,
  options?: ComponentRegistrationOptions
): void;

type ComponentRenderer = (
  props: Record<string, unknown>,
  name: string,
  ctx: RenderContext
) => HTMLElement | void;

type ComponentRegistrationOptions = {
  state?: "value" | "checked" | "enabled" | "readable" | "none";
};
```

### `configureComponentScope(options)`

Configures a flush function for component scope -used by framework adapters to synchronize DOM after reactive updates.

```ts
function configureComponentScope(options: { flush?: () => void }): void;
```

## Validation and conformance

### `validateSlexSource(source, options)`

Validates Slex source after parsing. The result includes `schemaVersion`, `protocolVersion`, `logicProfileVersion`, usage lists, and warning codes. Syntax failures return a diagnostic.

```ts
function validateSlexSource(
  source: string,
  options?: { mode?: "trusted" | "secure" }
): ValidationResult;
```

### `runSlexConformance(options)`

Runs the bundled standard fixtures against the current validator. Pass `fixtureId` to run one fixture.

```ts
function runSlexConformance(options?: { fixtureId?: string }): ConformanceReport;
```

## Namespace store

`namespace` is the state domain. Multiple mounts with the same namespace share one store:

- New `g` is deep-merged into the old `g` (functions overwrite, objects recursively merge, arrays replace, scalars overwrite).
- New `layout` replaces the current layout (no deep merge for layout).
- Component instance state is persisted within the namespace.
- Expression caches are managed per namespace.

This allows a document, message domain, or tool panel to update its UI incrementally while preserving state.

## Component instance state

Named components can expose instance state. Which prop is writable depends on the component's registered state mode:

| Mode | Writable prop | Behavior |
|------|---------------|----------|
| `value` | `value` | Writable from expressions and events |
| `checked` | `checked`, `value` | Both synced, writable |
| `enabled` | `enabled` | Switch enabled state, writable |
| `readable` | (none) | Readable from expressions, write emits a console warning |
| `none` | (none) | No state exposed |

```js
{
  layout: {
    "slider:threshold": { value: 42 },
    "text:preview": { "$content": "'Threshold: ' + threshold.value" }
  }
}
```

Repeatedly named components share namespace-level state. `$for` items with the same component name also share one state instance.

## Lifecycle hooks

The runtime calls convention-based hooks on the `g` object:

```
g.onMount_<name>()      -after component is appended to DOM
g.onUnmount_<name>()    -before component is removed from DOM
g.onUpdate_<name>()     -after $for item index or item reference changes
```

These hooks fire for normal components, `$if` branches, and `$for` slots. Root cleanup and `disposeNamespace()` trigger `onUnmount`.

## Component disposer

Framework components, event listeners, subscriptions, and external resources should bind their cleanup to the component DOM element:

```ts
import { register, attachComponentDisposer } from "slexkit/runtime";

register("custom", (props, name, ctx) => {
  const el = ctx.document.createElement("div");
  const stop = subscribeSomething();
  attachComponentDisposer(el, stop);
  return el;
});
```

The runtime calls the disposer when the element is unmounted. The official Svelte adapter uses this mechanism to destroy Svelte component instances.

## Expression evaluation context

Expressions in `$` read-pipes and statements in `on*` write-pipes can access these variables:

| Variable | Type | Availability |
|----------|------|--------------|
| `g` | reactive state proxy | always |
| `api` | host-injected capabilities | if `api` option passed to `mount()` |
| `$event` | event data | `on*` handlers only |
| `$item` | current array item | `$for` context only |
| `$index` | current array index | `$for` context only |
| `$key` | current item key | `$for` context only |
| named component state | e.g. `threshold.value` | named components |

Expression evaluation uses `new Function()` in trusted mode. Evaluation errors are caught and produce a console warning with namespace and path information; the last known value is used as a fallback.
