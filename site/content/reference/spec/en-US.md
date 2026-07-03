---
title: Slex Specification v0.1
category: Reference
status: ready
order: 10
summary: "Public Slex expression envelope, component keys, props, directives, lifecycle, and runtime API contract."
slexkitRenderMode: component
---

# Slex Specification v0.1

Slex expression envelope, component keys, props, directives, lifecycle, and runtime API contract — SlexKit v0's entire public protocol in one place. Source of truth for implementors, test authors, and host adapter authors.

**v0/beta.** The current implementation may evolve, but the protocol version (v0.1) is independent of the SlexKit package version. The same protocol may remain stable across multiple package releases.

## 1. Slex expression envelope

The canonical Slex expression is an object. Slex source is the JavaScript object literal string form of that expression:

```ts
type SlexExpression = {
  slex?: "0.1";
  namespace: string;
  g: Record<string, unknown>;
  layout: Record<string, unknown>;
};
```

`slex`, `namespace`, `g`, and `layout` are the standard envelope fields. `slex: "0.1"` is an optional protocol marker for humans, agents, and validators; it does not affect namespace identity or state merging. The runtime also accepts a bare component tree as shorthand: if the input has component keys at the top level and does not define `namespace`, `g`, or `layout`, it is normalized to:

```js
{ namespace: "default", g: {}, layout: <input> }
```

## 2. Layout key

Component keys use the format:

```
ComponentKey = ComponentType ":" Identifier
```

- `ComponentType` maps to a type in the component registry.
- `Identifier` may be empty (e.g. `"box:"`).
- Named components use `Identifier` for instance state and lifecycle hooks.
- Keys without `:` are not rendered as component nodes.

Reserved context names: `g`, `std`, `api`, `$event`, `$item`, `$index`, `$key`.

## 3. Props classification

### Static props

Passed to the component unchanged:

```js
"text:title": { text: "Hello" }
```

### `$` read-pipes

A string value on a `$`-prefixed key (excluding `$if`, `$for`, `$key`) is evaluated as a JavaScript expression. The result is passed under the key with the `$` prefix removed:

```js
"text:value": { "$content": "'Count: ' + g.count" }
// Resolves to: content = "Count: <value of g.count>"
```

### `on*` write-pipes

A string value on an `on*`-prefixed key is executed as a JavaScript statement:

```js
"button:add": { onclick: "g.count++" }
"input:name": { onchange: "g.name = String($event || '')" }
```

The handler receives `$event` as the event data.

### Structural directives

`$if`, `$for`, `$key` are structural directives and are never passed to the component as props. Children of `$if` and `$for` components are treated as the conditional/iterated subtree.

## 4. `g` merge

When the same namespace is mounted or ingested again, the new `g` is merged into the existing store:

| Value type          | Merge behavior           |
| ------------------- | ------------------------ |
| Function            | Overwrites the old value |
| Array               | Replaces entirely        |
| Plain object        | Recursively deep-merges  |
| Other scalar        | Overwrites the old value |
| Keys not in new `g` | Preserved from old `g`   |

The new `layout` always replaces the current layout. Layout is never deep-merged.

## 5. Expression context

Expressions can access these variables:

| Variable           | Type                          | Scope                    |
| ------------------ | ----------------------------- | ------------------------ |
| `g`                | Reactive state proxy          | Always                   |
| `std`              | Pure SlexKit standard library | Always                   |
| Component state    | e.g. `slider.value`           | Named components         |
| `api`              | Host-injected object          | If `api` option provided |
| `$event`           | Event data                    | `on*` handlers only      |
| `$item`            | Current array item            | `$for` context only      |
| `$index`           | Current array index           | `$for` context only      |
| `$key`             | Current item key              | `$for` context only      |
| Named `$for` alias | e.g. `user` for `"card:user"` | `$for` context only      |

`std` contains deterministic helpers for math, formatting, units, and small statistics. Sensitive capabilities stay under host-injected `api.*` and may require secure runtime policy.

Expression evaluation errors are caught and produce a warning with namespace and path information. The last known value is returned as a fallback.

## 6. Component instance state

Component registration declares a state mode:

```ts
register(type, renderer, { state: "value" | "checked" | "enabled" | "readable" | "none" });
```

| Mode       | Writable           | Behavior                                                      |
| ---------- | ------------------ | ------------------------------------------------------------- |
| `value`    | `value`            | Input component; `value` writable from expressions and events |
| `checked`  | `checked`, `value` | Checkbox-like boolean component; both synced and writable     |
| `enabled`  | `enabled`          | Switch-like boolean component; enabled state is writable      |
| `readable` | (none)             | Readable from expressions; write emits console warning        |
| `none`     | (none)             | No instance state exposed                                     |

Input components (`value`/`checked`/`enabled` modes) sync `change` events to instance state automatically. Duplicate-named components share one namespace-level state instance.

`input` with `type: "engineering"` is a value-mode component with additional parsed fields. `value` remains the raw input string, while `number`, `valid`, `prefix`, `unit`, `normalized`, and optional `error` expose the parsed engineering number. Supported v1 notation includes scientific notation plus SI prefixes (`p`, `n`, `u`, `µ`, `m`, `k`, `K`, `M`, `meg`, `G`, `T`) with an optional unit suffix. Units are captured but not dimension-converted.

## 7. `$if`

`$if` controls component existence:

```js
"card:panel": {
  "$if": "g.visible",
  "text:body": { text: "Visible" }
}
```

- **Truthy** -mounts the component and its subtree with enter animation if `$enter` is defined.
- **Falsy** -unmounts the component and subtree with leave animation if `$leave` is defined, then fires lifecycle hooks, disposers, and subtree cleanup.

## 8. `$for`

`$for` renders a component for each array element:

```js
"text:item": {
  "$for": "g.items",
  "$key": "id",
  "$content": "$item.label"
}
```

Context variables: `$item`, `$index`, `$key`. Named components inject the current item as a same-name variable.

### `$key` strategy

| `$key` value             | Behavior                                                                        |
| ------------------------ | ------------------------------------------------------------------------------- |
| `"$value"`               | Use the primitive item itself                                                   |
| `"id"` or other property | Read that property from object items                                            |
| Omitted                  | Use `item.id` if available; otherwise fall back to index with a console warning |

Primitive arrays should always specify `$key: "$value"`.

### $for phases

1. **Delete** -Remove items whose keys are absent from the new array (with leave animation).
2. **Add/update/reorder** -Create new items for new keys; update retained items' `forCtx` (item reference, index); reorder DOM nodes to match array order. Updated items fire `onUpdate_<name>`.
3. **Trim** -Defensively remove excess children.

## 9. Lifecycle and cleanup

Convention hooks on `g`:

```
g.onMount_<name>()      -after component is appended to DOM
g.onUnmount_<name>()    -before component is removed from DOM
g.onUpdate_<name>()     -after $for item changes (index or item reference)
```

Component implementations can register resource cleanup:

```ts
attachComponentDisposer(el, dispose);
```

Component disposal is triggered by normal unmount, `$if` toggle-off, `$for` item removal, root cleanup, and `disposeNamespace()`.

## 10. Public runtime API

| Function                            | Signature                                   | Description                                                          |
| ----------------------------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `mount`                             | `(input, container, options?) => Cleanup`   | Parse, merge state, render component tree                            |
| `ingest`                            | `(input) => boolean`                        | Ingest state-only Slex, no rendering                                 |
| `boot`                              | `(options?) => void`                        | Enhance static page code blocks                                      |
| `disposeNamespace`                  | `(namespace) => void`                       | Release namespace roots, store, and cache                            |
| `register`                          | `(type, renderer, options?) => void`        | Register component type                                              |
| `getRenderer`                       | `(type) => ComponentRenderer \| undefined`  | Look up a registered renderer                                        |
| `getIcon`                           | `(name, state?) => string`                  | Resolve a registered or bundled icon synchronously                   |
| `loadIcon`                          | `(name, state?) => Promise<string>`         | Resolve an icon, using Iconify fallback when not bundled             |
| `registerIcon`                      | `(name, svg, options?) => void`             | Register one global SVG icon for all components with an `icon` field |
| `registerIcons`                     | `(icons, options?) => void`                 | Register multiple global SVG icons                                   |
| `clearRegisteredIcons`              | `() => void`                                | Clear all custom registered icons                                    |
| `getRegisteredIcon`                 | `(name, state?) => string`                  | Look up only registered icons (no Phosphor fallback)                 |
| `normalizeIconName`                 | `(name) => string`                          | Normalize icon name to kebab-case with set prefix                    |
| `resolveIconWeight`                 | `(state?) => IconWeight`                    | Resolve icon weight from component state                             |
| `resolveIconifyIcon`                | `(name, state?) => {prefix, name}`          | Resolve to Iconify-compatible name pair                              |
| `iconifySvgUrl`                     | `(name, state?) => string`                  | Build full Iconify API SVG URL                                       |
| `configureComponentScope`           | `(options) => void`                         | Configure framework adapter flush                                    |
| `attachComponentDisposer`           | `(el, dispose) => void`                     | Bind cleanup to element lifecycle                                    |
| `createSecureRuntime`               | `(policy, adapter?) => SecureRuntimeHandle` | Create gated runtime instance                                        |
| `mountSecureArtifact`               | `(input, container, options) => Cleanup`    | Mount in secure sandbox                                              |
| `createSlexKitMarkdownRuntimeHost`  | `(options?) => MarkdownRuntimeHost`         | Create Markdown host instance                                        |
| `getSlexKitMarkdownRuntimeHost`     | `() => MarkdownRuntimeHost`                 | Get or create global Markdown host                                   |
| `installSlexKitMarkdownRuntimeHost` | `(options?) => MarkdownRuntimeHost`         | Install and return global Markdown host                              |
| `getSlexKitRuntimeUrl`              | `() => string \| undefined`                 | Get default sandbox runtime URL                                      |
| `setSlexKitRuntimeUrl`              | `(url) => void`                             | Set default sandbox runtime URL                                      |
| `diagnoseSlexKitSource`             | `(source, error) => Diagnostic`             | Locate syntax error in source                                        |
| `parseSlexSource`                   | `(source) => ParseResult`                   | Parse Slex source to object                                          |
| `validateSlexSource`                | `(source, options?) => ValidationResult`    | Parse-first validation with versions, usage, and stable warning codes |
| `runSlexConformance`                | `(options?) => ConformanceReport`           | Run bundled standard conformance fixtures                            |
| `formatSlexKitDiagnostic`           | `(diagnostic) => string`                    | Format diagnostic to readable string                                 |

For full runtime behavior, see [Runtime Model](/docs/reference/runtime).

## 11. Error types

### SlexKitSyntaxError

Thrown when Slex source parsing fails. Includes a `diagnostic` property with `message`, `line`, `column`, `detail`, and `excerpt`.

### SlexKitRuntimeError

Thrown when a runtime operation violates policy or encounters a runtime failure. Has properties: `kind` (`"policy"` | `"network"` | `"timeout"`), `code` (specific error code string), `message`, `elapsedMs`.

## 12. Markdown language handling

SlexKit hosts must only process explicit fence language tags:

- `slex`

Plain JavaScript, JSON, or untagged code blocks must not be scanned or executed.

## 13. Secure runtime types

```ts
type SecureRuntimeHandle = {
  api: SlexKitRuntimeApi;
  dispose: () => void;
};
```

For full secure runtime types (`HostRuntimePolicy`, `HostRuntimeAdapter`, `SlexKitRuntimeApi`, `SecureFrameOptions`, `SecureMountOptions`, sandbox message types), see the [security runtime contract](/docs/reference/security).

## 14. ToolHost

ToolHost bridges AI tool calls to interactive UI that returns structured user input. It is separate from display-oriented `slex` fences.

**Public API:**

| Function | Signature | Description |
|----------|-----------|-------------|
| `renderToolCall` | `(call, container) => ToolRenderHandle` | Compile and mount tool UI, return promise |
| `registerToolTemplate` | `(name, compiler) => void` | Register a custom tool template compiler |

**Result type:**

```ts
type ToolResult =
  | { toolCallId?: string; toolName: string; status: "submitted"; value: Record<string, unknown> }
  | { toolCallId?: string; toolName: string; status: "ignored"; value: null };
```

**Built-in templates:** `confirm-action`, `choose-options`, `option-list`, `fill-form`. Templates compile to standard Slex expressions using `card:tool` and `submit:actions` components. The `submit:actions` component serves as the completion boundary — it is only used by tool templates, not general display fences.

For full template reference, arguments, type definitions, and custom template development, see [ToolHost documentation](/docs/reference/toolhost).

## 15. Icon system

SlexKit includes a built-in icon system with Phosphor Icons, a custom registration API, and Iconify fallback support.

**Public API (10 functions):** `registerIcon`, `registerIcons`, `clearRegisteredIcons`, `getIcon`, `getRegisteredIcon`, `loadIcon`, `normalizeIconName`, `resolveIconWeight`, `resolveIconifyIcon`, `iconifySvgUrl`.

Icons are resolved through a three-tier chain: registered icons → bundled Phosphor (24 icons, 2 weights) → Iconify API fetch (async, `loadIcon` only). Components that accept an `icon` prop automatically display the resolved SVG.

For the full API reference, icon list, naming conventions, and custom icon registration, see [Icon system documentation](/docs/reference/icons).

## 16. Non-goals

- No public stable compatibility commitment (v0/beta).
- Not a pure JSON cross-platform protocol.
- No automatic security hardening of arbitrary browser APIs.
- No heuristic scanning of code blocks to guess whether to render.
- No implicit wrapping of display UI as function calls.
