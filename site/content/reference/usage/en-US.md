---
title: Slex Usage Reference
category: Reference
status: ready
order: 20
summary: "Reference for Slex source structure, props, directives, events, theming, custom components, and ToolHost boundaries."
slexkitRenderMode: component
---

# Slex Usage Reference

Slex source shape and runtime-facing authoring rules: props, directives, events, theming, custom components, and ToolHost boundaries. For first-time setup, start with [Getting Started](/docs/guides/quick-start). For exact protocol compatibility, use the [Slex Specification](/docs/reference/spec).

## Installation

Most hosts install the root package:

```sh
npm install slexkit
```

```js
import { mount } from "slexkit";
import "slexkit/style.css";
```

Component-free bare runtime:

```sh
npm install slexkit @slexkit/runtime
```

```js
import { mount, register } from "@slexkit/runtime";
```

This entry does not auto-register the official Svelte components. Use the root `slexkit` package, or explicitly import `@slexkit/components-svelte`, when bundled components are needed.

For package roles and host-specific install commands, see [Packages](/docs/reference/packages).

## Slex source structure

A Slex source is a JavaScript object literal:

```js
{
  slex: "0.1",
  namespace: "demo",
  g: { count: 0 },
  layout: {
    "button:add": { text: "Add", onclick: "g.count++" },
    "text:value": { "$content": "'Count: ' + g.count" }
  }
}
```

- `slex`: optional Slex protocol marker; use `"0.1"` for the current public protocol.
- `namespace`: state domain identifier (defaults to `"default"`).
- `g`: reactive state and logic (functions, data).
- `layout`: component tree.

As a convenience, a bare component tree (keys containing `:`) is normalized to `{ namespace: "default", g: {}, layout: <tree> }`. If the bare tree includes `slex: "0.1"`, that marker is preserved while component keys move under `layout`.

## Props

### Static props

Passed to the component as-is:

```js
"text:title": { text: "Hello World" }
```

### Dynamic read-pipes (`$`)

A string value on a `$`-prefixed key is evaluated as a JavaScript expression. The result replaces the key stripped of the `$` prefix:

```js
"text:value": { "$content": "'Count: ' + g.count" }
```

The `$` prefix is removed. The prop passed to the component is `content`. Re-evaluation is triggered automatically when any reactive dependency changes.

### Write-pipes (`on*`)

A string value on an `on*`-prefixed key is executed as a JavaScript statement:

```js
"button:add": { onclick: "g.count++" }
"input:name": { onchange: "g.name = String($event || '')" }
```

The handler receives `$event` as the event data.

### Structural directives

`$if`, `$for`, and `$key` are structural directives; they are not passed to the component as props.

## `$if` Conditional Rendering

Controls whether the component and its subtree are mounted:

```js
"card:panel": {
  "$if": "g.visible",
  "text:body": { text: "I am visible" }
}
```

When the expression is truthy, the component mounts (with enter animation if `$enter` is defined). When falsy, it unmounts (with leave animation if `$leave` is defined, then cleanup).

## `$for` Array Iteration

Renders a component for each item in an array:

```js
"text:item": {
  "$for": "g.items",
  "$key": "id",
  "$content": "$item.label"
}
```

Context variables available inside `$for`: `$item` (current item), `$index` (current index), `$key` (item key). Named components also inject the current item as a same-name variable (e.g. `"card:user"` makes `user` available).

### Key strategy

`$key` supports:
- `"$value"`: use the primitive item itself as key.
- `"id"` (or any property name): read that property from object items.
- Omitted: uses `item.id` if available, otherwise falls back to index with a console warning.

Primitive array items should always specify `$key: "$value"`.

### $for update algorithm

1. **Delete phase**: remove items whose keys are no longer in the array (with leave animation).
2. **Add/update/reorder phase**: create new items, update retained items' context (index, item reference), and reorder DOM nodes to match the array.
3. **Trim phase**: defensively remove any excess children.

When an item's index or item reference changes, `onUpdate_<name>` is called.

## Events

Event handlers are defined as `on*` write-pipes. The component's native change/input events are automatically wired to component instance state for writable components:

```js
"input:name": { onchange: "g.name = String($event || '')" }
```

The `$event` variable contains the event data. For change events on writable components (`value`, `checked`, or `enabled` mode), the component state is automatically synced before the handler runs.

## Trusted vs secure mode

### Trusted mode (default)

Slex source executes in the host page realm. Use for application-generated content, repository-maintained Slex source, or already-reviewed snippets.

```js
import { mount } from "slexkit";

mount(script, container, { theme: "host-shadcn" });
```

### Secure mode

Untrusted or agent-generated Slex source runs in a sandbox iframe with opaque origin. Sensitive capabilities are gated behind host policy:

```js
import { mountSecureArtifact } from "slexkit";

mountSecureArtifact(script, container, {
  policy: {},
  frame: { runtimeUrl: "/slexkit.runtime.js" },
});
```

Use [Secure Runtime Setup](/docs/guides/security-runtime) for the deployment checklist. Use the [Security Runtime Contract](/docs/reference/security) for the full policy model, sandbox behavior, bridge protocol, and fail-closed requirements.

## Theming

Theme mode is resolved from the `theme` option:

| Value | Behavior |
|-------|----------|
| `"auto"` | Checks container for known theme classes; falls back to `"uno"` |
| `"host-shadcn"` | shadcn/ui compatible |
| `"uno"` | Uno/Flowbite compatible |
| `"flowbite"` | Flowbite compatible |

Direction (`ltr`, `rtl`, `auto`) is resolved from the inherited `dir` attribute or the document element.

```js
mount(script, container, { theme: "host-shadcn", dir: "auto" });
```

## Custom components

Register a component type with a render function:

```ts
import { register } from "slexkit";

register("custom", (props, name, ctx) => {
  const el = ctx.document.createElement("div");
  el.textContent = String(props.label ?? name);
  return el;
}, { state: "value" });
```

The `RenderContext` provides:

| Property | Type | Description |
|----------|------|-------------|
| `g` | reactive proxy | Global state |
| `std` | `SlexKitStdlib` | Pure deterministic helpers |
| `api` | `Record<string, unknown>` | Host-injected capabilities |
| `dir` | `"ltr"` or `"rtl"` | Resolved direction |
| `labels` | `Partial<Record<string, string>>` | Runtime labels |
| `id` | `string \| null` | Component name |
| `emit` | `(event, data?) => void` | Event emitter |
| `children` | `Record<string, unknown>` | Nested component tree |
| `document` | `Document` | Owner document |
| `renderTree` | function | Recursive render helper |

Use `attachComponentDisposer(el, fn)` to bind cleanup to the component's DOM lifecycle.

## ToolHost

ToolHost handles UI that must return structured user input (confirmations, selections, forms). It is separate from display-oriented `slex` fences.

Built-in templates:
- `confirm-action`: yes/no confirmation
- `choose-options`: single or multi-select
- `option-list`: scrollable option list
- `fill-form`: structured form with submit

Templates compile to standard Slex source. The `submit` component returns the ToolHost result; only tool templates use it, not display fences.
