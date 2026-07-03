---
title: Design Rationale
category: Reference
status: ready
order: 80
summary: "Why SlexKit uses object literals, expressions, explicit fences, and a trusted/secure runtime split."
slexkitRenderMode: component
---

# Design Rationale

Why JavaScript object literals? Why expressions? Why explicit fences? Why a trusted and secure dual runtime?

## Problem space

SlexKit targets small interactive UI inside chat messages, documents, agent output panels, and tool dashboards. It does not attempt to provide routing, data layers, build systems, or a full application framework.

An input format for AI-generated UI must be:
- Short enough to stream token-by-token.
- Embeddable in Markdown.
- Runnable without a build step.
- Host-agnostic (works in React, Svelte, Obsidian, vanilla HTML).

## Why JavaScript object literals

A Slex source is a single object literal:

```js
{
  namespace: "demo",
  g: { count: 0 },
  layout: {
    "button:add": { text: "Add", onclick: "g.count++" },
    "text:value": { "$content": "'Count: ' + g.count" }
  }
}
```

A model can emit this in one shot. No project structure, no module imports, no build config, no framework boilerplate. The same content works inside a Markdown fence, a Streamdown renderer, an Obsidian adapter, or a custom runtime host.

## Why `g` and `layout` are separate

`g` holds state and logic. `layout` holds the component tree. Expressions read from `g`, component states, and `$for` context. Event handlers write back to `g`.

This separation makes model output easier to audit: state and algorithms are centralized in one object; UI structure is centralized in a tree. It also lets the host manage state lifecycle by namespace; same-namespace mounts share and merge state.

## Why expressions (not pure JSON)

SlexKit v0 is not a pure JSON protocol. `$` read-pipes and `on*` write-pipes allow JavaScript expressions and statements:

```js
"$content": "'Count: ' + g.count"
onclick: "g.count++"
```

This makes simple interactions shorter and more natural for AI generation. A pure-JSON format would require a separate expression language or declarative wiring syntax that adds complexity to both the emitter and the runtime.

The cost is an explicit trust boundary. Trusted content can execute in the host realm with low integration overhead. Untrusted content must go through the secure runtime (sandbox iframe, opaque origin, policy-gated capabilities).

SlexKit's security choice is not about disabling expressions; it is about requiring the host to choose which trust boundary expressions run in.

## Why only explicit fences

SlexKit hosts must only process explicitly-marked fences (`slex`). Plain JavaScript, JSON, or untagged code blocks could be examples, logs, or user content; they must not be automatically executed or rendered.

A generation should include a plain Markdown fallback so the output degrades gracefully:

~~~~md
```slex
{ namespace: "status", layout: { "badge:state": { label: "3/4 complete", tone: "info" } } }
```

**Status:** 3/4 complete
~~~~

On SlexKit-capable hosts, the fence renders as interactive UI. On plain Markdown hosts, the fallback text still reads correctly.

## Display UI vs ToolHost

Most AI output is display-oriented: status cards, progress indicators, metrics, dashboards. These go through `slex` fences or `mount().`

ToolHost exists only for UI that must return structured user input to the host: confirmations, selections, forms. It compiles templates to standard Slex source and returns results through the `submit` component.

This boundary prevents every display UI from being inadvertently wrapped as a function call.

## Trusted + secure dual runtime

### Trusted runtime

For application-generated content, repository-maintained Slex source, or already-reviewed snippets. Lowest integration cost -Slex source executes directly in the host page.

### Secure runtime

For untrusted or agent-generated Slex source. Uses a sandbox iframe with opaque origin, CSP, and locked-down globals. Sensitive capabilities (network, timers, canvas) are gated behind a host policy.

The host chooses the trust boundary for each mount. The same Slex source syntax works in both modes.

## Why a custom reactivity system

SlexKit ships a minimal reactive engine (~280 lines) rather than depending on a framework:

- **Zero framework dependency for the runtime core**: the `@slexkit/runtime` entry has no external dependencies.
- **Deep tracking**: arbitrary `g` shapes require Proxy-based property access tracking that maps well to the tree-shaped Slex source model.
- **Sufficient scope**: signal, effect, batch, memo, root/scope are the only primitives needed for this scale of UI.

The component layer (Svelte) adds `svelte` as a dependency only when using `@slexkit/components-svelte`.

## How it differs from alternatives

### vs A2UI

A2UI is a cross-platform declarative UI protocol. SlexKit is a Markdown runtime format: component tree, local state, expressions, and trust boundary are part of one artifact.

The standard bundle therefore includes more than schema and component catalog. It also publishes the logic profile, capability catalog, and conformance fixtures. Hosts can bridge a declarative subset to A2UI, but Slex itself remains executable.

### vs application frameworks

SlexKit is not a React/Vue/Svelte alternative. It renders small interactive fragments, not full applications. No router, no data fetching layer, no SSR.

### vs pure JSON UI protocols

SlexKit trades JSON purity for expressive short-form interactivity. The cost is the explicit trust boundary, which is addressed by the sandbox runtime rather than by restricting the expression language.
