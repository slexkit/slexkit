---
title: SlexKit Introduction
category: Guides
status: ready
order: 10
summary: "Markdown-friendly reactive UI runtime for explicit slex fences."
slexkitRenderMode: component
---

# SlexKit Introduction

SlexKit is a Markdown-friendly reactive UI runtime for explicit `slex` fences. Hosts can render small interactive fragments inside AI conversations, documents, agent panels, and dashboards without adding a build step to the generated content.

SlexKit is currently v0/beta. The public surface is usable, but long-term compatibility is not yet guaranteed.

## Use Cases

When Markdown needs a small amount of interaction:

- Status cards, counters, calculators, parameter panels, lightweight dashboards
- AI-generated UI fragments that should degrade to plain Markdown
- React, Svelte, Obsidian, or vanilla HTML hosts rendering the same fenced source

SlexKit is not a full application framework. It does not provide routing, server-side rendering, a data fetching layer, or a cross-platform pure JSON UI standard.

## Source Format

A Slex source is a JavaScript object literal with state in `g` and the component tree in `layout`:

```slex
{
  namespace: "intro_counter",
  g: {
    count: 0
  },
  layout: {
    "card:counter": {
      title: "Counter",
      "text:value": {
        "$text": "'Count: ' + g.count"
      },
      "button:add": {
        label: "+1",
        onclick: "g.count++"
      }
    }
  }
}
```

- `namespace` identifies the state domain
- `g` contains reactive state, functions, and small calculations
- `layout` contains component nodes keyed as `type:name`
- `$`-prefixed props are read expressions, such as `"$text": "'Count: ' + g.count"`
- `on*` props are write expressions, such as `onclick: "g.count++"`

The runtime also accepts a bare component tree as shorthand, but the full envelope is preferred for documentation and shared examples.

## Fence Convention

Hosts must process only fences explicitly marked as `slex`:

````md
```slex
{
  namespace: "status",
  layout: {
    "badge:state": { label: "Ready", tone: "success" }
  }
}
```

**Status:** Ready
````

The Markdown after the fence is the fallback. Plain Markdown readers show the fallback text; SlexKit-capable hosts replace the fence with interactive UI.

Plain JavaScript, JSON, or untagged code blocks must not be scanned or executed.

## Runtime Modes

**Trusted mode** executes Slex source in the host page. Use it for application-generated content, local documents, and repository-maintained examples.

**Secure mode** executes untrusted or agent-generated source in a sandbox iframe. Sensitive capabilities such as network, timers, animation, and canvas are exposed only through host policy and `api.*`.

Use secure mode when rendering third-party or unreviewed content. See [Secure Runtime Setup](security-runtime).

## Boundary Separation

**Display UI** renders via `slex` fences or `mount()`. These fragments show information and local interaction but are not function calls.

**ToolHost** is a separate boundary. It renders confirmations, option pickers, and forms that must return structured input to the host. The `submit` component is the explicit completion boundary for tool templates.

This separation prevents ordinary display UI from being mispackaged as tool invocations.

## Core APIs

| API | Use |
|---|---|
| `mount(input, container, options?)` | Render trusted Slex source into a container |
| `ingest(input)` | Merge state-only source without rendering UI |
| `boot(options?)` | Enhance static page `slex` fences |
| `createSlexKitMarkdownRuntimeHost(options?)` | Recommended API for Markdown hosts |
| `mountSecureArtifact(input, container, options)` | Render source in the secure sandbox runtime |
| `renderToolCall(call, container)` | Render a ToolHost template and collect a result |

For exact types and beta compatibility notes, use the [Slex Specification](../../reference/spec/en-US.md) as the technical reference.

## Next Steps

- [Getting Started](quick-start): developer integration path
- [Integration](integration): Streamdown and Obsidian host plugins
- [Design Guidelines](design): authoring public examples and component usage
- [Secure Runtime Setup](security-runtime): untrusted content boundary
- [Component Reference](../components/card): built-in component catalog
- [AI / Agents](ai-agents): SlexKit context for models and agents
